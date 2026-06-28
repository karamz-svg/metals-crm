# Metals Trading CRM — EU Non-Ferrous Sales Desk

A lightweight, **zero-dependency** sales CRM for a non-ferrous metals trader selling into the
European Union. It runs entirely in your browser — no install, no build step, no server required.

> Built to track the **top buyers in each of the 27 EU member states**, the **products** they buy
> from you, their **contacts**, today's **LME prices + EU premium**, and the **email status** of
> every buyer with a one-click "Send email" button.

---

## ✨ What it does

| Feature | Status |
|---|---|
| Catalog of all **25 products** grouped by base metal | ✅ |
| All **27 EU countries** with per-country buyer lists and coverage tiles | ✅ |
| **Buyer CRM** — name, country, city, website, contact, email, phone, materials, notes | ✅ |
| **LME price bar** pinned to the top (Copper, Aluminium, Zinc, Lead, Nickel) | ✅ |
| **EU aluminium duty-paid premium** shown next to the aluminium price | ✅ |
| **"Send email"** → opens Gmail with a **pre-written** message (products + today's prices) | ✅ |
| **Traffic-light status** 🔴 not contacted · 🟡 awaiting reply · 🟢 replied | ✅ |
| Click 🟢 / **View thread** → jumps to that buyer's Gmail conversation | ✅ |
| **Import** buyers from CSV (incl. Apollo.io exports) · **Export** JSON backup | ✅ |
| Search & filter, dashboard stats, reply notifications | ✅ |
| **Apollo.io buyer finder** — pulls procurement/buyer/trader contacts per company via a secure local proxy | ✅ |
| **EU starter list** — one click loads ~50 real EU non-ferrous producers/recyclers as research leads | ✅ |
| **Gmail auto-status** — connect Gmail (read-only) to auto-set 🟡/🟢 from your inbox | ✅ |
| **Auto-deploy** to GitHub Pages on every push (included workflow) | ✅ |

Your data is saved locally in your browser (`localStorage`). Use **Export** to back it up or move
it between devices.

---

## ▶️ How to run it

**Option A — open locally (quickest)**

Because the app loads its scripts as plain files, the most reliable way is a tiny local server:

```bash
cd metals-crm
python3 -m http.server 8000
# then open http://localhost:8000 in Chrome
```

**Option B — host free on GitHub Pages (recommended, gives you a shareable URL)**

This repo ships with a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that
**auto-deploys on every push to `main`**. To turn it on (one time):

1. Repo **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
2. Push anything to `main` (or run the workflow manually from the **Actions** tab).
3. Your site goes live at `https://<your-user>.github.io/metals-crm/` and updates on every push.

> The "Send email" and "View thread" buttons open **Gmail in a new tab**, so make sure you're
> logged into your Google work account in the same browser.

---

## 🚦 How the traffic lights work

- 🔴 **Red** — you haven't emailed this buyer yet.
- 🟡 **Yellow** — email sent, awaiting reply. *(Clicking "Send email" auto-moves a red buyer to yellow.)*
- 🟢 **Green** — they replied. A pulsing **"📬 Read reply"** badge appears; click it (or **View thread**)
  to jump straight to the Gmail conversation with that buyer.

You set the status with one click on any light. Fully **automatic** reply-detection (inbox →
auto-green) requires the Gmail API — see *Upgrade paths* below.

---

## 📥 Importing buyers (incl. Apollo.io)

Click **Import CSV** and paste a CSV with a header row. Recognised columns:

```
name, country, city, contact, email, phone, website, materials, notes
```

- `country` is a 2-letter code (`DE`, `FR`, `IT`, …).
- `materials` is a `;`-separated list of **product names or ids**, e.g.
  `copper-cathode;Aluminium ingots;cu-scrap-millberry`. The importer matches by id *or* name.

Example:

```csv
name,country,city,contact,email,phone,website,materials
Aurubis AG,DE,Hamburg,Procurement,buyer@example.com,+49...,aurubis.com,copper-cathode;cu-scrap-millberry
```

**To use Apollo.io:** see the dedicated section below — it's built in.

### Quick start: the EU starter list
Don't want to type companies in? Click **Import → "Load EU starter list"** to drop in ~50 real EU
non-ferrous producers, smelters and recyclers (Aurubis, Boliden, KGHM, AMAG, Atlantic Copper,
ElvalHalcor, …) with their public domains. These are **research leads** — contact emails are left
blank on purpose; run **👥 Find buyers** to pull verified procurement contacts, and verify the
indicative material tags before pitching.

---

## 👥 Finding buyer contacts with Apollo.io

The app can pull **procurement managers, buyers, traders, and sourcing/supply-chain people**
for each company straight from Apollo — the roles responsible for buying metals.

### Why a proxy?
Apollo's API **requires your key in a request header and blocks direct browser calls (CORS)**.
Putting the key in front-end JavaScript would expose it to anyone. So a tiny **local proxy**
(`server/apollo-proxy.js`) holds your key server-side and the app calls the proxy. The proxy has
**zero dependencies** — just Node 18+ (for built-in `fetch`).

### Setup (one time)
1. In Apollo: **Settings → Integrations → API** and create a **master API key**
   (People Search requires a *master* key).
2. Copy the key into a local env file — **this file is git-ignored and never committed**:
   ```bash
   cp .env.example .env
   # edit .env and set:  APOLLO_API_KEY=your_master_key
   ```
3. Start the proxy:
   ```bash
   # loads .env automatically on Node 20.6+:
   node --env-file=.env server/apollo-proxy.js
   # (older Node:  export APOLLO_API_KEY=your_master_key && node server/apollo-proxy.js)
   ```
   You should see `Apollo proxy listening on http://localhost:8787 … mode: LIVE | key: set`.
4. In the app: **Settings → Apollo.io contact finder**, confirm the proxy URL
   (`http://localhost:8787`) and click **Test proxy connection**.

### Using it
- On any company card, make sure the **website/domain is filled in**, then click **👥 Find buyers**.
- A picker lists matching contacts (name, title, seniority, LinkedIn). Tick the ones you want and
  **Add selected** — they attach to the company, and the first one becomes the primary contact.
- Each saved person with an email gets a **✉️** to open a pre-written Gmail draft *to that person*.
- **Bulk mode:** on any country (or "All buyers"), click **👥 Find buyers (all)** to enrich every
  company in one go. It runs sequentially with a polite delay to respect Apollo rate limits and
  auto-adds the contacts it finds.

### Emails locked? (`🔒`)
Apollo's **People Search returns people but not emails/phones** by design. To unlock them, tick
**“Reveal emails/phones”** in Settings — the proxy will then call Apollo's **enrichment** endpoint
(`reveal_personal_emails`), which **spends Apollo credits**. Leave it off to browse names/titles for free.

### Phone numbers (asynchronous)
Apollo delivers phone numbers **asynchronously to a webhook**, so the proxy must be reachable from
the public internet. Set `WEBHOOK_BASE_URL` to your proxy's public URL (deploy it, or run a tunnel
such as `ngrok http 8787`), then tick **“Also reveal phone numbers”** in Settings. Phones arrive a
little after the search — click **↻ phones** on a company card to pull in any that have landed.

### No key yet? Try MOCK mode
```bash
MOCK=1 node server/apollo-proxy.js
```
Returns realistic sample contacts so you can see the whole flow without a key or credits.

---

## 📥 Gmail auto-status (optional)

Connect your Gmail **read-only** so the app updates each buyer's traffic light automatically:
a reply from them → 🟢 green, you've emailed them → 🟡 yellow. The same local proxy handles it;
your Google tokens stay server-side in a git-ignored file (`.gmail-token.json`).

### Setup (one time) — Google Cloud Console
1. Create a project, then **APIs & Services → Enable APIs → enable the *Gmail API***.
2. **Credentials → Create credentials → OAuth client ID → type: Web application.**
3. Add an **Authorized redirect URI**: `http://localhost:8787/api/gmail/callback`
   (or your deployed proxy's `/api/gmail/callback`).
4. On the OAuth consent screen, add yourself as a **test user**.
5. Put the client id/secret in `.env`:
   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   # GOOGLE_REDIRECT_URI=http://localhost:8787/api/gmail/callback   # only if non-default
   ```
6. Restart the proxy, then in the app: **Settings → Gmail auto-status → Connect Gmail**, approve,
   and click **Sync now** (or the **📥 Sync Gmail** button on any list).

The read-only scope means the app can *detect* replies but never send or modify mail — sending
still happens through the Gmail compose button you review yourself. Try it without credentials by
running the proxy in `MOCK=1` to see the sync flow.

---

## 💱 Prices

Click **Update prices** to enter today's LME settlement values and the **EU duty-paid aluminium
premium** (reference: the [LME aluminium premium page](https://www.lme.com/metals/non-ferrous/lme-aluminium-premiums/lme-aluminium-premium-duty-paid-european-fastmarkets-mb)).
They show on the price bar and are embedded into every email draft.

### Optional: automatic live prices
LME/SMM data is **licensed** and their sites **block direct browser requests (CORS)**, so live
auto-pricing needs a tiny endpoint you control. Once you have one returning JSON like:

```json
{ "copper": 9250, "aluminium": 2350, "premium": 295, "zinc": 2700, "lead": 2100, "nickel": 16500, "source": "LME", "asOf": 1730000000000 }
```

set it in the browser console or in `assets/js/data.js`:

```js
window.App.PRICE_FEED_URL = "https://your-endpoint.example.com/prices";
```

…then the **↻ Live** button on the price bar will pull from it. (A Cloudflare Worker or small
serverless function that scrapes/forwards a data source you're licensed for works well here.)

---

## ⏫ Upgrade paths (the bits that need credentials / a backend)

| You want… | What it needs |
|---|---|
| **Real top-50 buyer lists + verified contacts** | An Apollo.io paid plan/API, or your own sourced list, imported via CSV. The app ships with a few clearly-labelled `[SAMPLE]` rows — delete them and import your real data. |
| **Procurement/buyer contacts per company** | ✅ Built in via the Apollo proxy (see above). Emails/phones need the *Reveal* toggle (uses credits). |
| **Auto "replied → green"** + status sync | ✅ Built in via Gmail read-only OAuth (see "Gmail auto-status"). |
| **Live LME / SMM prices** | A licensed data feed exposed through a proxy endpoint (`PRICE_FEED_URL` above). |
| **Multi-user / shared team data** | Swap `localStorage` for a hosted database (the `Store` module is the single integration point). |

---

## 🗂️ Project structure

```
metals-crm/
├── index.html              # app shell
├── README.md
├── .env.example            # copy to .env, add Apollo/Google keys (git-ignored)
├── .github/workflows/
│   └── deploy-pages.yml    # auto-deploy to GitHub Pages on push to main
├── server/
│   └── apollo-proxy.js     # zero-dep backend: Apollo key + Gmail OAuth
└── assets/
    ├── css/styles.css      # all styling (no framework)
    └── js/
        ├── data.js         # 25 products, 27 countries, price rows, buyer titles
        ├── seed-eu.js      # ~50 EU non-ferrous firms (research leads)
        ├── store.js        # localStorage state + CSV/JSON import-export + people
        ├── prices.js       # price formatting, all-in/derived values, live-feed hook
        ├── email.js        # Gmail compose + thread links, pre-written drafts
        ├── apollo.js       # front-end client for the Apollo proxy
        ├── gmail.js        # front-end client for Gmail auto-status
        └── app.js          # views, routing, all interactivity
```

No frameworks, no `npm install`, no build. Edit a file, refresh the page.

---

## ⚠️ Notes & good practice

- The seeded buyers are marked **`[SAMPLE]`** with `example.com` addresses — replace them with your
  real, verified data before sending anything.
- Always **review** each email in Gmail before hitting send (the app only pre-fills the draft).
- Keep your outreach compliant with GDPR / anti-spam rules for B2B contact in the EU.
