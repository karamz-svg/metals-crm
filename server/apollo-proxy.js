#!/usr/bin/env node
/* ============================================================
   apollo-proxy.js  —  tiny zero-dependency proxy for Apollo.io
   ------------------------------------------------------------
   WHY THIS EXISTS
   - Apollo's API blocks browser (CORS) calls and requires your
     key in a header. Putting the key in front-end JS would leak
     it. This proxy keeps the key server-side and exposes a
     small, CORS-enabled API the app can call.
   - No npm install needed: uses only Node's built-ins (Node 18+
     for global fetch).

   RUN IT
     export APOLLO_API_KEY=your_master_key        # do NOT commit this
     node server/apollo-proxy.js                   # listens on :8787
   Optional:
     PORT=9000 ALLOW_ORIGIN=https://you.github.io node server/apollo-proxy.js
     MOCK=1 node server/apollo-proxy.js            # no key / no network: fake data

   ENDPOINTS (POST, JSON)
     GET  /health
     POST /api/find-buyers
          { name, domain, locations?:[], titles?:[], page?:1,
            perPage?:10, reveal?:false }
          -> { people: [{ name, title, seniority, email, phone,
                          linkedin, locked }], raw_count }
   ============================================================ */
"use strict";

const http = require("http");

const API_KEY = process.env.APOLLO_API_KEY || "";
const PORT = Number(process.env.PORT || 8787);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const MOCK = process.env.MOCK === "1" || (!API_KEY && process.env.MOCK !== "0");
// Phone numbers are delivered by Apollo ASYNCHRONOUSLY to a webhook, so the
// proxy must be reachable from the public internet for phone reveal to work
// (deploy it, or use a tunnel like `ngrok http 8787`). Set the public base URL:
const WEBHOOK_BASE_URL = (process.env.WEBHOOK_BASE_URL || "").replace(/\/+$/, "");

const APOLLO = "https://api.apollo.io/api/v1";

// In-memory store of phone numbers that arrive via the async webhook.
// Keyed by lowercased "name"; also stored under "domain|name" when known.
const phoneStore = new Map(); // key -> { phone, ts }
function rememberPhone(name, domain, phone) {
  if (!name || !phone) return;
  const ts = Date.now();
  phoneStore.set(name.toLowerCase(), { phone, ts });
  if (domain) phoneStore.set(cleanDomain(domain) + "|" + name.toLowerCase(), { phone, ts });
}
function phonesForDomain(domain) {
  const d = cleanDomain(domain);
  const out = {};
  for (const [key, val] of phoneStore.entries()) {
    if (key.indexOf("|") !== -1) {
      const parts = key.split("|");
      if (parts[0] === d) out[parts[1]] = val.phone;
    }
  }
  return out;
}
function extractPhone(p) {
  return (p.phone_numbers && p.phone_numbers[0] && (p.phone_numbers[0].sanitized_number || p.phone_numbers[0].raw_number)) ||
         p.sanitized_phone || p.phone || "";
}
function personDomain(p) {
  return (p.organization && (p.organization.primary_domain || p.organization.website_url)) ||
         (p.email && p.email.indexOf("@") !== -1 ? p.email.split("@")[1] : "") || "";
}

/* Job titles that indicate someone responsible for BUYING metals.
   Apollo does partial matching, so these broad terms cast a wide net. */
const DEFAULT_TITLES = [
  "procurement", "purchasing", "buyer", "sourcing", "supply chain",
  "trader", "trading", "commodity", "raw materials", "category manager",
  "commercial", "head of metals"
];

/* ---------------- helpers ---------------- */
function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

async function apollo(path, body) {
  const r = await fetch(APOLLO + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": API_KEY
    },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
  if (!r.ok) {
    const msg = (json && (json.error || json.message)) || ("Apollo responded " + r.status);
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  return json;
}

/* ---------------- core: find buyers at a company ---------------- */
function cleanDomain(d) {
  if (!d) return "";
  return String(d).trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "");
}

function mapPerson(p, emailMap) {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.name || "";
  const enriched = emailMap && emailMap[name.toLowerCase()];
  let email = (enriched && enriched.email) || p.email || "";
  const locked = /email_not_unlocked|not_unlocked/i.test(email);
  if (locked) email = "";
  return {
    name,
    title: p.title || "",
    seniority: p.seniority || "",
    email,
    phone: (enriched && enriched.phone) || (p.phone_numbers && p.phone_numbers[0] && p.phone_numbers[0].sanitized_number) || "",
    linkedin: p.linkedin_url || "",
    locked
  };
}

async function findBuyers(opts) {
  const domain = cleanDomain(opts.domain);
  const titles = (Array.isArray(opts.titles) && opts.titles.length) ? opts.titles : DEFAULT_TITLES;
  const perPage = Math.min(Number(opts.perPage || 10), 25);

  if (MOCK) return mockBuyers(opts, titles);

  if (!API_KEY) throw new Error("APOLLO_API_KEY is not set on the proxy.");
  if (!domain) throw new Error("This company has no website/domain. Add one (e.g. aurubis.com) so Apollo can find its people.");

  // 1) People search (no emails returned here)
  const searchBody = {
    person_titles: titles,
    q_organization_domains_list: [domain],
    page: Number(opts.page || 1),
    per_page: perPage
  };
  if (Array.isArray(opts.locations) && opts.locations.length) {
    searchBody.person_locations = opts.locations;
  }
  const search = await apollo("/mixed_people/search", searchBody);
  const people = (search.people || search.contacts || []).slice(0, perPage);

  // 2) Optional enrichment to reveal emails/phones (costs credits)
  let emailMap = null;
  if (opts.reveal && people.length) {
    const details = people.slice(0, 10).map((p) => ({
      first_name: p.first_name, last_name: p.last_name, domain: domain
    }));
    // Phone reveal is async: Apollo posts results to our webhook later.
    const wantPhone = !!opts.revealPhone && !!WEBHOOK_BASE_URL;
    const enrichBody = {
      details,
      reveal_personal_emails: true,
      reveal_phone_number: wantPhone
    };
    if (wantPhone) enrichBody.webhook_url = WEBHOOK_BASE_URL + "/api/apollo-webhook";
    try {
      const enr = await apollo("/people/bulk_match", enrichBody);
      emailMap = {};
      (enr.matches || []).forEach((m) => {
        if (!m) return;
        const nm = [m.first_name, m.last_name].filter(Boolean).join(" ").toLowerCase();
        const phone = extractPhone(m);
        if (phone) rememberPhone(nm, domain, phone);
        emailMap[nm] = {
          email: m.email && !/not_unlocked/i.test(m.email) ? m.email : "",
          phone: phone
        };
      });
    } catch (e) {
      // enrichment is best-effort; return search results even if it fails
      console.warn("[apollo] enrichment failed:", e.message);
    }
  }

  // Merge any phones already received via webhook for this domain.
  const knownPhones = phonesForDomain(domain);
  const mapped = people.map((p) => mapPerson(p, emailMap));
  mapped.forEach((mp) => {
    if (!mp.phone && knownPhones[mp.name.toLowerCase()]) mp.phone = knownPhones[mp.name.toLowerCase()];
  });
  return {
    people: mapped,
    raw_count: (search.pagination && search.pagination.total_entries) || people.length,
    phone_pending: !!opts.revealPhone && !!WEBHOOK_BASE_URL
  };
}

/* ---------------- mock data (no key / no network) ---------------- */
function mockBuyers(opts, titles) {
  const dom = cleanDomain(opts.domain) || "example.com";
  const ph = (opts.reveal && opts.revealPhone) ? [{ sanitized_number: "+49 151 0000000" }] : [];
  const sample = [
    { first_name: "Markus", last_name: "Bauer", title: "Head of Procurement", seniority: "head", email: opts.reveal ? "m.bauer@" + dom : "email_not_unlocked@" + dom, linkedin_url: "https://linkedin.com/in/sample1", phone_numbers: ph },
    { first_name: "Sofia", last_name: "Rossi", title: "Senior Metals Buyer", seniority: "senior", email: opts.reveal ? "s.rossi@" + dom : "email_not_unlocked@" + dom, linkedin_url: "https://linkedin.com/in/sample2", phone_numbers: ph },
    { first_name: "Pieter", last_name: "De Vries", title: "Commodity Trader (Non-Ferrous)", seniority: "manager", email: opts.reveal ? "p.devries@" + dom : "email_not_unlocked@" + dom, linkedin_url: "https://linkedin.com/in/sample3", phone_numbers: ph }
  ];
  return { people: sample.map((p) => mapPerson(p, null)), raw_count: sample.length, mock: true };
}

/* ---------------- server ---------------- */
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const path = req.url.split("?")[0];

  if (req.method === "GET" && path === "/health") {
    return send(res, 200, { ok: true, mock: MOCK, hasKey: !!API_KEY, webhookConfigured: !!WEBHOOK_BASE_URL });
  }

  if (req.method === "POST" && path === "/api/find-buyers") {
    try {
      const body = await readBody(req);
      const result = await findBuyers(body);
      return send(res, 200, result);
    } catch (e) {
      return send(res, e.status || 400, { error: e.message });
    }
  }

  // Apollo posts async phone-reveal results here.
  if (req.method === "POST" && path === "/api/apollo-webhook") {
    try {
      const body = await readBody(req);
      const list = body.people || body.matches || body.contacts || (body.person ? [body.person] : (Array.isArray(body) ? body : []));
      let n = 0;
      list.forEach((p) => {
        if (!p) return;
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.name || "";
        const phone = extractPhone(p);
        if (name && phone) { rememberPhone(name, personDomain(p), phone); n++; }
      });
      console.log("[apollo] webhook received", n, "phone(s)");
      return send(res, 200, { ok: true, stored: n });
    } catch (e) {
      return send(res, 400, { error: e.message });
    }
  }

  // Frontend polls this to pick up phones that arrived via the webhook.
  if (req.method === "GET" && path === "/api/phones") {
    const q = req.url.indexOf("?") !== -1 ? req.url.split("?")[1] : "";
    const params = new URLSearchParams(q);
    return send(res, 200, { phones: phonesForDomain(params.get("domain") || "") });
  }

  return send(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log("Apollo proxy listening on http://localhost:" + PORT);
  console.log("  mode:", MOCK ? "MOCK (no real Apollo calls)" : "LIVE", "| key:", API_KEY ? "set" : "MISSING");
  console.log("  phone webhook:", WEBHOOK_BASE_URL ? (WEBHOOK_BASE_URL + "/api/apollo-webhook") : "disabled (set WEBHOOK_BASE_URL)");
  console.log("  endpoints: GET /health, POST /api/find-buyers, POST /api/apollo-webhook, GET /api/phones");
});
