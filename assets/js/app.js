/* ============================================================
   app.js  —  views, routing, interactivity (vanilla, no deps)
   ============================================================ */
window.App = window.App || {};

(function (App) {
  "use strict";

  var Store = App.Store, Prices = App.Prices, Email = App.Email;

  /* in-memory view state */
  var route = { view: "dashboard", country: null };
  var query = "";

  /* ---------- tiny helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function $(id) { return document.getElementById(id); }
  function metal(id) { return App.METALS[id] || { label: id, color: "#888" }; }
  function opt(value, label, current) {
    return '<option value="' + esc(value) + '"' + (current === value ? " selected" : "") + ">" + esc(label) + "</option>";
  }

  function toast(msg) {
    var root = $("toast-root");
    root.innerHTML = '<div class="toast">' + esc(msg) + "</div>";
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { root.innerHTML = ""; }, 2600);
  }
  App.toast = toast;

  /* =========================================================
     PRICE BAR
     ========================================================= */
  function renderPriceBar() {
    var p = Store.prices();
    function chip(label, val, extra) {
      return '<div class="chip ' + (extra || "") + '">' +
        '<span class="k">' + esc(label) + "</span>" +
        '<span class="v">' + (val == null ? "—" : val) + "</span></div>";
    }
    var chips = "";
    App.PRICE_ROWS.forEach(function (row) {
      var r = p.rows[row.key] || {};
      var m = metal(row.metal);
      var v = Prices.fmt(r.value);
      chips += '<div class="chip">' +
        '<span class="k"><span class="dot" style="background:' + m.color + '"></span>' + esc(row.label) + "</span>" +
        '<span class="v">' + (r.value == null ? "—" : v + ' <small>' + esc(p.currency) + "/MT</small>") + "</span></div>";
      if (row.hasPremium) {
        chips += '<div class="chip premium">' +
          '<span class="k">↳ EU duty-paid premium</span>' +
          '<span class="v">' + (r.premium == null ? "—" : "+" + Prices.fmt(r.premium) + ' <small>' + esc(p.currency) + "/MT</small>") + "</span></div>";
      }
    });

    // Extra premiums for other metals (from a premium feed), shown after the metals.
    var prem = p.premiums || {};
    Object.keys(prem).forEach(function (k) {
      if (k === "aluminium") return; // already shown next to aluminium
      if (prem[k] == null || isNaN(prem[k])) return;
      var label = (App.METALS[k] && App.METALS[k].label) || k;
      chips += '<div class="chip premium">' +
        '<span class="k">↳ ' + esc(label) + " premium</span>" +
        '<span class="v">+' + Prices.fmt(prem[k]) + ' <small>' + esc(p.currency) + "/MT</small></span></div>";
    });

    var liveLabel = (Store.settings().autoScanPrices !== false) ? " · auto-scan daily" : "";
    var delayed = p.delayed ? " · delayed/indicative" : "";
    var warn = App.priceMsg
      ? ' <span class="price-warn" data-nav="settings" title="Open price settings">⚠️ ' + esc(App.priceMsg) + " — Set up</span>"
      : (!p.updatedAt ? ' <span class="price-warn" data-nav="settings">⚠️ Live prices not set up — Set up</span>' : "");

    $("pricebar").innerHTML =
      '<span class="pb-title">LME&nbsp;Board</span>' +
      '<div class="ticker">' + chips + "</div>" +
      '<div class="pb-meta">' +
        "<span>" + esc(p.source) + delayed + " · " + esc(Prices.ageText(p.updatedAt)) + liveLabel + "</span>" + warn +
        '<button class="btn sm" data-action="refresh-prices">↻ Live now</button>' +
        '<button class="btn sm primary" data-action="edit-prices">Update prices</button>' +
      "</div>";
  }

  /* =========================================================
     SIDEBAR NAV
     ========================================================= */
  function renderNav() {
    var companies = Store.companies();
    function item(view, country, icon, label, count) {
      var active = (route.view === view && route.country === country) ? " active" : "";
      var attr = country ? 'data-nav="country:' + country + '"' : 'data-nav="' + view + '"';
      var c = count != null ? '<span class="count">' + count + "</span>" : "";
      return '<div class="nav-item' + active + '" ' + attr + '>' +
        "<span>" + icon + "</span><span>" + esc(label) + "</span>" + c + "</div>";
    }

    var top =
      item("dashboard", null, "📊", "Dashboard") +
      item("companies", null, "🏢", "All buyers", companies.length) +
      item("sheet", null, "📝", "Custom sheet", Store.sheetRows().length || null) +
      item("products", null, "🪙", "Products", App.PRODUCTS.length) +
      item("settings", null, "⚙️", "Settings");

    function countWith(code) { return companies.filter(function (x) { return x.country === code; }).length; }

    // EU countries: only show those that actually have buyers (hide empty ones).
    var euActive = App.COUNTRIES.filter(function (c) { return countWith(c.code) > 0; });
    var euItems = euActive.map(function (c) { return item("country", c.code, c.flag, c.name, countWith(c.code)); }).join("");
    var euSection = euActive.length
      ? '<div class="nav-section"><div class="label">EU Countries (' + euActive.length + ")</div>" + euItems + "</div>"
      : "";

    // My countries: always show every custom country the user added.
    var custom = Store.customCountries();
    var customItems = custom.map(function (c) { return item("country", c.code, c.flag, c.name, countWith(c.code)); }).join("");
    var mySection = '<div class="nav-section"><div class="label">My countries</div>' + customItems +
      '<div class="nav-item" data-action="add-country"><span>＋</span><span>Add country</span></div></div>';

    $("nav").innerHTML =
      '<div class="nav-section">' + top + "</div>" +
      euSection + mySection;
  }

  /* =========================================================
     VIEWS
     ========================================================= */
  function render() {
    renderPriceBar();
    renderNav();
    var c = $("content");
    if (route.view === "dashboard") c.innerHTML = viewDashboard();
    else if (route.view === "products") c.innerHTML = viewProducts();
    else if (route.view === "sheet") c.innerHTML = viewSheet();
    else if (route.view === "settings") c.innerHTML = viewSettings();
    else if (route.view === "companies") c.innerHTML = viewCompanies(null);
    else if (route.view === "country") c.innerHTML = viewCompanies(route.country);
    if (route.view === "settings") refreshGmailStatus();
    var s = c.querySelector(".search");
    if (s) s.focus();
  }
  App.render = render;

  /* ---- Dashboard ---- */
  function viewDashboard() {
    var all = Store.companies();
    var red = all.filter(function (c) { return c.status === "red"; }).length;
    var yellow = all.filter(function (c) { return c.status === "yellow"; }).length;
    var green = all.filter(function (c) { return c.status === "green"; }).length;
    var withReply = all.filter(function (c) { return c.status === "green"; });

    var replyBanner = withReply.length
      ? '<div class="notice">📬 <strong>' + withReply.length + " buyer(s) replied</strong> — go read and follow up: " +
        withReply.map(function (c) { return esc(c.name); }).join(", ") + "</div>"
      : "";

    // Only countries that have buyers (active EU) plus all custom countries.
    var euActive = App.COUNTRIES.filter(function (c) { return Store.companiesByCountry(c.code).length > 0; });
    var tileCountries = euActive.concat(Store.customCountries());
    var tiles = tileCountries.map(function (c) {
      var list = Store.companiesByCountry(c.code);
      var dots = ["red", "yellow", "green"].map(function (st) {
        var n = list.filter(function (x) { return x.status === st; }).length;
        return n ? '<span class="mini-dot" style="background:var(--' + st + ')" title="' + n + " " + st + '"></span>' : "";
      }).join("");
      return '<div class="tile" data-nav="country:' + c.code + '">' +
        '<span class="flag">' + c.flag + "</span>" +
        "<div><div class=\"tname\">" + esc(c.name) + "</div>" +
        '<div class="tsub">' + list.length + " buyer" + (list.length === 1 ? "" : "s") + "</div></div>" +
        '<span class="mini-lights">' + dots + "</span></div>";
    }).join("");

    return '<div class="page-head"><div><h2>Sales Dashboard</h2>' +
      '<div class="sub">Track non-ferrous buyers across all 27 EU member states.</div></div>' +
      '<div class="spacer"></div>' +
      '<button class="btn" data-action="sync-gmail">📥 Sync Gmail</button>' +
      '<button class="btn primary" data-action="add-company">+ Add buyer</button></div>' +
      replyBanner +
      '<div class="stat-row">' +
        stat(all.length, "Total buyers") +
        statDot(red, "Not contacted", "red") +
        statDot(yellow, "Awaiting reply", "yellow") +
        statDot(green, "Replied", "green") +
      "</div>" +
      '<h3 style="margin:6px 0 12px;">Coverage by country</h3>' +
      '<div class="tiles">' + tiles + "</div>";
  }
  function stat(n, l) { return '<div class="stat"><div class="n">' + n + '</div><div class="l">' + esc(l) + "</div></div>"; }
  function statDot(n, l, color) {
    return '<div class="stat"><div class="n" style="color:var(--' + color + ')">' + n + "</div>" +
      '<div class="l"><span class="dot" style="background:var(--' + color + ')"></span> ' + esc(l) + "</div></div>";
  }

  /* ---- Products ---- */
  function viewProducts() {
    var groups = {};
    App.PRODUCTS.forEach(function (p) { (groups[p.metal] = groups[p.metal] || []).push(p); });
    var html = Object.keys(groups).map(function (mk) {
      var m = metal(mk);
      var items = groups[mk].map(function (p) {
        return '<div class="tag"><span class="swatch" style="background:' + m.color + '"></span>' +
          esc(p.name) + ' <small style="color:var(--muted)">· ' + esc(p.type) + "</small></div>";
      }).join("");
      return '<div class="card"><h3><span class="dot" style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' +
        m.color + ';margin-right:7px;"></span>' + esc(m.label) + "</h3>" +
        '<div class="meta">' + groups[mk].length + " product(s) · priced off " +
        (m.lmeKey ? "LME " + esc(m.lmeKey) : "derived / index") + "</div>" +
        '<div class="tags">' + items + "</div></div>";
    }).join("");

    return '<div class="page-head"><div><h2>Your Products</h2>' +
      '<div class="sub">25 non-ferrous products, grouped by base metal &amp; pricing source.</div></div></div>' +
      '<div class="grid cards">' + html + "</div>";
  }

  /* ---- Custom sheet (free-form, Excel-style) ---- */
  function viewSheet() {
    var rows = Store.sheetRows();
    var prodOpts = App.PRODUCTS.map(function (p) { return '<option value="' + esc(p.name) + '">'; }).join("");

    function row(r) {
      var csel = '<select onchange="App.onSheetEdit(\'' + r.id + '\',\'country\',this.value)">' +
        '<option value=""' + (!r.country ? " selected" : "") + ">—</option>" +
        App.allCountries().map(function (x) {
          return '<option value="' + x.code + '"' + (r.country === x.code ? " selected" : "") + ">" + x.flag + " " + esc(x.name) + "</option>";
        }).join("") + "</select>";
      return "<tr>" +
        '<td><input list="sheet-prod" value="' + esc(r.product) + '" placeholder="product" onchange="App.onSheetEdit(\'' + r.id + '\',\'product\',this.value)"/></td>' +
        "<td>" + csel + "</td>" +
        '<td><input value="' + esc(r.material) + '" placeholder="material" onchange="App.onSheetEdit(\'' + r.id + '\',\'material\',this.value)"/></td>' +
        '<td><input value="' + esc(r.qty) + '" placeholder="qty / MT" onchange="App.onSheetEdit(\'' + r.id + '\',\'qty\',this.value)"/></td>' +
        '<td><input value="' + esc(r.notes) + '" placeholder="notes" onchange="App.onSheetEdit(\'' + r.id + '\',\'notes\',this.value)"/></td>' +
        '<td><button class="btn sm danger" data-action="sheet-del" data-id="' + r.id + '">🗑</button></td>' +
        "</tr>";
    }

    var body = rows.length
      ? '<table class="sheet"><thead><tr><th>Product</th><th>Country</th><th>Material</th><th>Qty</th><th>Notes</th><th></th></tr></thead><tbody>' +
        rows.map(row).join("") + "</tbody></table>"
      : '<div class="empty"><div class="big">📝</div><p>Empty sheet — add your first row.</p></div>';

    return '<datalist id="sheet-prod">' + prodOpts + "</datalist>" +
      '<div class="page-head"><div><h2>Custom Sheet</h2>' +
      '<div class="sub">A free-form tab — log any product, country and material combination, like an extra Excel sheet. Saved automatically.</div></div>' +
      '<div class="spacer"></div>' +
      '<button class="btn primary" data-action="sheet-add">+ Add row</button></div>' +
      body;
  }

  /* ---- Companies (all or by country) ---- */
  function viewCompanies(countryCode) {
    var list = countryCode ? Store.companiesByCountry(countryCode) : Store.companies();
    var title, sub;
    if (countryCode) {
      var c = App.countryByCode(countryCode);
      title = c.flag + " " + c.name; sub = "Buyers in " + c.name + " · target top 50";
    } else {
      title = "All Buyers"; sub = "Every buyer across the EU";
    }

    if (query) {
      var q = query.toLowerCase();
      list = list.filter(function (x) {
        return (x.name || "").toLowerCase().indexOf(q) !== -1 ||
               (x.email || "").toLowerCase().indexOf(q) !== -1 ||
               (x.city || "").toLowerCase().indexOf(q) !== -1;
      });
    }

    var head = '<div class="page-head"><div><h2>' + esc(title) + "</h2>" +
      '<div class="sub">' + esc(sub) + "</div></div>" +
      '<div class="spacer"></div>' +
      '<input class="search" placeholder="Search name, email, city…" value="' + esc(query) + '" oninput="App.onSearch(this.value)"/>' +
      '<button class="btn" data-action="bulk-find"' + (countryCode ? ' data-country="' + countryCode + '"' : "") + '>👥 Find buyers (all)</button>' +
      (countryCode ? '<button class="btn" data-action="discover-companies" data-country="' + countryCode + '">🔎 Discover companies</button>' : "") +
      '<button class="btn" data-action="sync-gmail">📥 Sync Gmail</button>' +
      '<button class="btn" data-action="import">⇪ Import CSV</button>' +
      '<button class="btn" data-action="export">⇩ Export</button>' +
      ((countryCode && App.countryByCode(countryCode) && App.countryByCode(countryCode).custom)
        ? '<button class="btn danger" data-action="remove-country" data-country="' + countryCode + '">🗑 Remove country</button>' : "") +
      '<button class="btn primary" data-action="add-company"' + (countryCode ? ' data-country="' + countryCode + '"' : "") + '>+ Add buyer</button></div>';

    var legend = '<div class="legend" style="margin-bottom:14px;">' +
      '<span><span class="dot" style="background:var(--red)"></span>Not contacted</span>' +
      '<span><span class="dot" style="background:var(--yellow)"></span>Awaiting reply</span>' +
      '<span><span class="dot" style="background:var(--green)"></span>Replied</span>' +
      '<span>· Click a light to set status. Click 🟢 / “Send email” to open Gmail.</span></div>';

    if (!list.length) {
      return head + legend + '<div class="empty"><div class="big">🗂️</div>' +
        "<p>No buyers here yet.</p>" +
        '<button class="btn primary" data-action="add-company"' + (countryCode ? ' data-country="' + countryCode + '"' : "") + '>+ Add the first buyer</button>' +
        ' <button class="btn" data-action="import">⇪ Import from CSV</button></div>';
    }

    var cards = list.map(companyCard).join("");
    return head + legend + '<div class="grid cards">' + cards + "</div>";
  }

  function companyCard(c) {
    var country = App.countryByCode(c.country);
    var tags = (c.materials || []).map(function (id) {
      var p = App.productById(id); if (!p) return "";
      var m = metal(p.metal);
      return '<span class="tag"><span class="swatch" style="background:' + m.color + '"></span>' + esc(p.name) + "</span>";
    }).join("") || '<span class="status-text">No products assigned yet</span>';

    var light = function (st, label) {
      return '<button class="light ' + st + (c.status === st ? " on" : "") + '" title="' + label +
        '" data-action="status" data-status="' + st + '" data-id="' + c.id + '"></button>';
    };

    var statusText = {
      red: "Not contacted yet",
      yellow: c.lastEmailAt ? "Emailed " + new Date(c.lastEmailAt).toLocaleDateString() + " · awaiting reply" : "Awaiting reply",
      green: "Replied" + (c.lastReplyAt ? " " + new Date(c.lastReplyAt).toLocaleDateString() : "")
    }[c.status] || "";

    var replyBadge = c.status === "green"
      ? '<span class="reply-badge" data-action="open-thread" data-id="' + c.id + '">📬 Read reply</span>' : "";

    var people = (c.people || []).map(function (p, idx) {
      var mail = p.email
        ? '<span class="person-mail" data-action="person-email" data-id="' + c.id + '" data-idx="' + idx + '" title="Email ' + esc(p.name) + '">✉️</span>'
        : (p.locked ? '<span class="person-locked" title="Email locked in Apollo — enable Reveal in Settings">🔒</span>' : "");
      var li = p.linkedin ? ' <a href="' + esc(p.linkedin) + '" target="_blank" rel="noopener" title="LinkedIn">in</a>' : "";
      var thread = p.email
        ? '<span class="person-thread" data-action="person-thread" data-id="' + c.id + '" data-idx="' + idx + '" title="Open this contact\'s Gmail thread">🔎</span>' : "";
      var pst = p.status || "red";
      var lights = ["red", "yellow", "green"].map(function (st) {
        return '<button class="plight ' + st + (pst === st ? " on" : "") +
          '" data-action="person-status" data-id="' + c.id + '" data-idx="' + idx + '" data-status="' + st + '" title="' +
          ({ red: "Not contacted", yellow: "Awaiting reply", green: "Replied" }[st]) + '"></button>';
      }).join("");
      return '<div class="person">' +
        '<span class="p-name">' + esc(p.name || "—") + "</span>" +
        '<span class="p-title">' + esc(p.title || "") + "</span>" +
        (p.email ? '<span class="p-email">' + esc(p.email) + "</span>" : "") +
        (p.phone ? '<span class="p-email">📞 ' + esc(p.phone) + "</span>" : "") +
        '<span class="p-actions">' +
          '<span class="plights">' + lights + "</span>" +
          mail + thread + li +
          '<span class="person-del" data-action="del-person" data-id="' + c.id + '" data-idx="' + idx + '" title="Remove">✕</span>' +
        "</span></div>";
    }).join("");
    var peopleBlock = (c.people && c.people.length)
      ? '<div class="people"><div class="people-h">👥 Buyers / procurement (' + c.people.length + ")" +
        '<span class="people-refresh" data-action="refresh-phones" data-id="' + c.id + '" title="Pull phone numbers that arrived via Apollo webhook">↻ phones</span>' +
        "</div>" + people + "</div>"
      : "";

    return '<div class="card">' +
      '<div style="display:flex;align-items:flex-start;gap:8px;">' +
        "<div style=\"flex:1;min-width:0;\"><h3>" + esc(c.name || "(unnamed buyer)") + "</h3>" +
        '<div class="meta">' + (country ? country.flag + " " + esc(country.name) : "") +
          (c.city ? " · " + esc(c.city) : "") +
          (c.website ? ' · <a href="' + normUrl(c.website) + '" target="_blank" rel="noopener">' + esc(c.website) + "</a>" : "") +
        "</div></div>" +
      "</div>" +
      '<div class="tags">' + tags + "</div>" +
      (c.contactName ? '<div class="contact-line">👤 ' + esc(c.contactName) + "</div>" : "") +
      (c.email ? '<div class="contact-line">✉️ ' + esc(c.email) + "</div>" : '<div class="contact-line" style="color:var(--yellow)">✉️ no email — add one to send</div>') +
      (c.phone ? '<div class="contact-line">📞 ' + esc(c.phone) + "</div>" : "") +
      peopleBlock +
      '<div class="status-line">' +
        '<div class="lights">' + light("red", "Not contacted") + light("yellow", "Awaiting reply") + light("green", "Replied") + "</div>" +
        '<span class="status-text">' + esc(statusText) + "</span>" + replyBadge +
      "</div>" +
      '<div class="card-actions">' +
        '<button class="btn primary sm" data-action="send-email" data-id="' + c.id + '">✉️ Send email</button>' +
        '<button class="btn sm" data-action="find-buyers" data-id="' + c.id + '">👥 Find buyers</button>' +
        '<button class="btn sm" data-action="open-thread" data-id="' + c.id + '">🔎 View thread</button>' +
        '<button class="btn sm" data-action="edit-company" data-id="' + c.id + '">✎ Edit</button>' +
        '<button class="btn sm danger" data-action="del-company" data-id="' + c.id + '">🗑</button>' +
      "</div></div>";
  }

  function normUrl(u) {
    if (!u) return "#";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }

  /* ---- Settings ---- */
  function viewSettings() {
    var s = Store.settings();
    function f(key, label, ph) {
      return '<div class="field"><label>' + esc(label) + "</label>" +
        '<input data-set="' + key + '" value="' + esc(s[key] || "") + '" placeholder="' + esc(ph || "") + '"/></div>';
    }
    return '<div class="page-head"><div><h2>Settings</h2>' +
      '<div class="sub">Your sender identity — used in every pre-written email.</div></div></div>' +
      '<div class="card" style="max-width:640px;">' +
        '<div class="field-2">' + f("senderName", "Your name", "Jane Trader") + f("senderTitle", "Title", "Sales Manager") + "</div>" +
        '<div class="field-2">' + f("companyName", "Company name", "Acme Metals Ltd.") + f("senderEmail", "Your Gmail work address", "you@company.com") + "</div>" +
        '<div class="field-2">' + f("phone", "Phone", "+1 …") + f("website", "Website", "company.com") + "</div>" +
        '<div class="field"><label>Extra signature lines (optional)</label><textarea data-set="signature" placeholder="Address, registration no., etc.">' + esc(s.signature || "") + "</textarea></div>" +
        '<div class="btn-row"><button class="btn primary" data-action="save-settings">Save settings</button></div>' +
      "</div>" +
      '<div class="notice warn" style="max-width:640px;margin-top:16px;">💡 Statuses can be set manually (click a light) or synced automatically from Gmail (below). Sending always goes through the review-first Gmail compose button.</div>' +
      '<div class="card" style="max-width:640px;margin-top:16px;"><h3>👥 Apollo.io contact finder</h3>' +
        '<div class="meta">Your Apollo key lives only in the proxy\'s <span class="kbd">.env</span> file — never in the browser or GitHub. Start it with <span class="kbd">node server/apollo-proxy.js</span> (see README).</div>' +
        '<div class="field" style="margin-top:10px;"><label>Apollo proxy URL</label><input data-set="apolloProxyUrl" value="' + esc(s.apolloProxyUrl || "") + '" placeholder="http://localhost:8787"/></div>' +
        '<label class="check" style="margin:4px 0 12px;"><input type="checkbox" data-set-bool="revealContacts"' + (s.revealContacts ? " checked" : "") + '> Reveal emails/phones (uses Apollo credits)</label>' +
        '<label class="check" style="margin:-6px 0 12px;"><input type="checkbox" data-set-bool="revealPhone"' + (s.revealPhone ? " checked" : "") + '> Also reveal phone numbers — async; needs a public proxy (set WEBHOOK_BASE_URL)</label>' +
        '<div class="btn-row"><button class="btn primary" data-action="save-settings">Save settings</button>' +
          '<button class="btn" data-action="test-proxy">Test proxy connection</button></div>' +
      "</div>" +
      '<div class="card" style="max-width:640px;margin-top:16px;"><h3>📥 Gmail auto-status</h3>' +
        '<div class="meta">Connect your Gmail (read-only) so the app can set 🟡 when you\'ve emailed a buyer and 🟢 when they reply. Requires Google OAuth credentials in the proxy\'s <span class="kbd">.env</span> (see README).</div>' +
        '<div id="gmail-status" class="meta" style="margin-top:10px;">Checking connection…</div>' +
        '<div class="btn-row" style="margin-top:10px;">' +
          '<button class="btn primary" data-action="connect-gmail">Connect Gmail</button>' +
          '<button class="btn" data-action="sync-gmail">📥 Sync now</button>' +
        "</div></div>" +
      '<div class="card" style="max-width:640px;margin-top:16px;"><h3>💱 Live prices</h3>' +
        '<div class="meta">Prices show on the bar at the top of every page and feed into each email. ' +
        'Pick where they come from — for the hosted site use <strong>Metals-API (direct)</strong> with a free key, ' +
        'since the local proxy isn\'t reachable from https.</div>' +
        '<div class="meta" style="margin-top:8px;">Current: <strong>' + esc(Store.prices().source) + "</strong> · " + esc(Prices.ageText(Store.prices().updatedAt)) + (App.priceMsg ? ' · <span style="color:var(--yellow)">' + esc(App.priceMsg) + "</span>" : "") + "</div>" +
        '<div class="field" style="margin-top:10px;"><label>Price source</label><select data-set="priceSource">' +
          opt("metalsapi", "Metals-API (direct, needs key) — works on hosted site", s.priceSource) +
          opt("custom", "Custom URL (any CORS JSON feed)", s.priceSource) +
          opt("proxy", "Local proxy /api/prices (needs the Node proxy running)", s.priceSource) +
          opt("manual", "Manual only (no auto-fetch)", s.priceSource) +
        "</select></div>" +
        '<div class="field"><label>Metals-API key (for the direct source — free at metals-api.com)</label><input data-set="priceApiKey" value="' + esc(s.priceApiKey || "") + '" placeholder="your access_key"/></div>' +
        '<div class="field"><label>Custom price URL (for the Custom source)</label><input data-set="priceCustomUrl" value="' + esc(s.priceCustomUrl || "") + '" placeholder="https://…/prices (returns normalized JSON)"/></div>' +
        '<div class="field-2">' +
          '<div class="field"><label>Calibrate: unit</label><select data-set="priceUnit">' +
            opt("tonne", "per tonne", s.priceUnit) + opt("lb", "per lb (×2204.62)", s.priceUnit) + opt("oz", "per oz", s.priceUnit) +
          "</select></div>" +
          '<div class="field"><label>Calibrate: multiplier (if numbers look off)</label><input data-set="priceMult" value="' + esc(s.priceMult != null ? s.priceMult : 1) + '" placeholder="1"/></div>' +
        "</div>" +
        '<label class="check" style="margin:4px 0 12px;"><input type="checkbox" data-set-bool="priceInvert"' + (s.priceInvert !== false ? " checked" : "") + '> Invert rate (1/rate) — keep on for Metals-API</label>' +
        '<label class="check" style="margin:0 0 12px;"><input type="checkbox" data-set-bool="autoScanPrices"' + (s.autoScanPrices !== false ? " checked" : "") + '> Auto-scan prices daily on load</label>' +
        '<div class="btn-row"><button class="btn primary" data-action="save-settings">Save settings</button>' +
          '<button class="btn" data-action="refresh-prices">↻ Fetch prices now</button></div>' +
      "</div>" +
      '<div class="card" style="max-width:640px;margin-top:16px;"><h3>Data</h3>' +
        '<div class="meta">Back up or move your buyer list between devices.</div>' +
        '<div class="btn-row" style="margin-top:10px;">' +
          '<button class="btn" data-action="import">⇪ Import CSV / JSON</button>' +
          '<button class="btn" data-action="export">⇩ Export backup (JSON)</button>' +
          '<button class="btn danger" data-action="reset">Reset all data</button>' +
        "</div></div>" +
      '<div class="card" style="max-width:640px;margin-top:16px;"><h3>👥 Team sync (shared data)</h3>' +
        '<div class="meta">Share buyers, statuses and prices with teammates via the proxy. Everyone points at the same proxy URL and turns this on. Last-write-wins — click <strong>Pull</strong> to grab the latest before a big edit. Protect it with a token (proxy <span class="kbd">DATA_AUTH_TOKEN</span>).</div>' +
        '<label class="check" style="margin:12px 0;"><input type="checkbox" data-set-bool="teamSync"' + (s.teamSync ? " checked" : "") + '> Enable team sync</label>' +
        '<div class="field"><label>Sync server URL (blank = use the Apollo proxy URL above)</label><input data-set="syncServerUrl" value="' + esc(s.syncServerUrl || "") + '" placeholder="http://localhost:8787"/></div>' +
        '<div class="field"><label>Shared token (optional)</label><input data-set="syncToken" value="' + esc(s.syncToken || "") + '" placeholder="matches proxy DATA_AUTH_TOKEN"/></div>' +
        '<div class="btn-row"><button class="btn primary" data-action="save-settings">Save settings</button>' +
          '<button class="btn" data-action="team-pull">⬇ Pull from team</button>' +
          '<button class="btn" data-action="team-push">⬆ Push to team</button></div>' +
      "</div>";
  }

  /* =========================================================
     MODALS
     ========================================================= */
  function openModal(title, bodyHtml, footerHtml) {
    $("modal-root").innerHTML =
      '<div class="modal-bg" data-action="modal-bg"><div class="modal">' +
        "<header><h3>" + esc(title) + '</h3><button class="x" data-action="close-modal">×</button></header>' +
        '<div class="body">' + bodyHtml + "</div>" +
        (footerHtml ? "<footer>" + footerHtml + "</footer>" : "") +
      "</div></div>";
  }
  function closeModal() { $("modal-root").innerHTML = ""; }
  App.closeModal = closeModal;

  function companyForm(c) {
    c = c || {};
    var isEdit = !!c.id;
    var countryOpts = App.allCountries().map(function (x) {
      return '<option value="' + x.code + '"' + (c.country === x.code ? " selected" : "") + ">" + x.flag + " " + esc(x.name) + "</option>";
    }).join("");
    var checks = App.PRODUCTS.map(function (p) {
      var on = (c.materials || []).indexOf(p.id) !== -1;
      var m = metal(p.metal);
      return '<label class="check"><input type="checkbox" data-mat="' + p.id + '"' + (on ? " checked" : "") + ">" +
        '<span class="swatch" style="width:8px;height:8px;border-radius:50%;background:' + m.color + ';display:inline-block"></span>' +
        esc(p.name) + "</label>";
    }).join("");

    function fld(key, label, ph) {
      return '<div class="field"><label>' + esc(label) + "</label>" +
        '<input data-f="' + key + '" value="' + esc(c[key] || "") + '" placeholder="' + esc(ph || "") + '"/></div>';
    }

    var body =
      fld("name", "Company name", "e.g. Aurubis AG") +
      '<div class="field-2">' +
        '<div class="field"><label>Country</label><select data-f="country">' + countryOpts + "</select></div>" +
        fld("city", "City", "Hamburg") +
      "</div>" +
      '<div class="field-2">' + fld("contactName", "Contact person", "Procurement") + fld("email", "Email", "buyer@company.com") + "</div>" +
      '<div class="field-2">' + fld("phone", "Phone", "+49 …") + fld("website", "Website", "company.com") + "</div>" +
      '<div class="field"><label>Materials they buy from you</label><div class="checks">' + checks + "</div></div>" +
      '<div class="field"><label>Notes</label><textarea data-f="notes" placeholder="Volumes, terms, history…">' + esc(c.notes || "") + "</textarea></div>";

    var footer =
      '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn primary" data-action="save-company" data-id="' + (c.id || "") + '">' + (isEdit ? "Save changes" : "Add buyer") + "</button>";

    openModal(isEdit ? "Edit buyer" : "Add buyer", body, footer);
  }

  function countryForm() {
    var body =
      '<div class="meta" style="margin-bottom:12px;">Add a market that isn\'t in the EU list (e.g. UK, Turkey, USA, UAE). It appears under <strong>My countries</strong> and in the buyer form.</div>' +
      '<div class="field-2">' +
        '<div class="field"><label>Country name</label><input data-cf="name" placeholder="e.g. Türkiye"/></div>' +
        '<div class="field"><label>Flag emoji (optional)</label><input data-cf="flag" placeholder="🇹🇷" maxlength="4"/></div>' +
      "</div>";
    var footer = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn primary" data-action="save-country">Add country</button>';
    openModal("Add a country", body, footer);
  }

  function pricesForm() {
    var p = Store.prices();
    function row(label, key, hasPrem) {
      var r = p.rows[key] || {};
      var prem = hasPrem
        ? '<div class="field"><label>EU duty-paid premium (USD/MT)</label><input type="number" data-price-prem="' + key + '" value="' + (r.premium == null ? "" : r.premium) + '" placeholder="e.g. 290"/></div>'
        : "";
      return '<div class="field-2"><div class="field"><label>' + esc(label) + ' (USD/MT)</label>' +
        '<input type="number" data-price="' + key + '" value="' + (r.value == null ? "" : r.value) + '" placeholder="e.g. 9000"/></div>' + prem + "</div>";
    }
    var body =
      '<div class="notice">Enter today\'s LME settlement prices. They appear on the price bar and in every email draft. ' +
      'For the aluminium EU premium see <a href="' + App.PREMIUM_SOURCE_URL + '" target="_blank" rel="noopener">the LME premium page</a>.</div>' +
      App.PRICE_ROWS.map(function (r) { return row(r.label, r.key, r.hasPremium); }).join("") +
      '<div class="field"><label>Source label</label><input data-price-src value="' + esc(p.source) + '" placeholder="Manual / LME / SMM"/></div>';
    var footer =
      '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn primary" data-action="save-prices">Save prices</button>';
    openModal("Update LME prices", body, footer);
  }

  function importForm() {
    var body =
      '<div class="notice">📋 New here? <strong>Load the EU starter list</strong> — ' + (App.EU_SEED ? App.EU_SEED.length : 0) +
      ' real EU non-ferrous producers & recyclers as research leads, then use <strong>👥 Find buyers</strong> to pull their contacts.' +
      '<div style="margin-top:8px;"><button class="btn primary sm" data-action="load-eu-seed">Load EU starter list</button></div></div>' +
      '<div class="notice">Or paste <strong>CSV</strong> (with a header row) or a previously exported <strong>JSON</strong> backup.</div>' +
      '<div class="meta" style="margin-bottom:8px;">CSV columns recognised: <span class="kbd">name</span> <span class="kbd">country</span> <span class="kbd">city</span> ' +
      '<span class="kbd">contact</span> <span class="kbd">email</span> <span class="kbd">phone</span> <span class="kbd">website</span> ' +
      '<span class="kbd">materials</span> <span class="kbd">notes</span>. ' +
      'For materials use product names or ids separated by <span class="kbd">;</span>. This is exactly how an Apollo.io export can be mapped.</div>' +
      '<div class="field"><textarea id="import-text" style="min-height:200px;font-family:monospace;font-size:12px;" placeholder="name,country,city,contact,email,phone,website,materials\nAurubis AG,DE,Hamburg,Procurement,buyer@example.com,+49...,aurubis.com,copper-cathode;cu-scrap-millberry"></textarea></div>';
    var footer =
      '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn primary" data-action="do-import">Import</button>';
    openModal("Import buyers", body, footer);
  }

  function openPeoplePicker(company, res) {
    var people = res.people || [];
    var mockNote = res.mock
      ? '<div class="notice warn">Proxy is in <strong>MOCK mode</strong> (no API key set) — these are sample contacts. Set APOLLO_API_KEY in the proxy\'s .env for real data.</div>'
      : "";
    var revealNote = (!App.Store.settings().revealContacts && people.some(function (p) { return p.locked; }))
      ? '<div class="notice">Some emails are 🔒 locked. Enable “Reveal emails/phones” in Settings to unlock them (uses Apollo credits).</div>'
      : "";

    var rows = people.length ? people.map(function (p) {
      var enc = encodeURIComponent(JSON.stringify(p));
      var contact = p.email ? ('✉️ ' + esc(p.email)) : (p.locked ? "🔒 email locked" : "no email");
      return '<label class="pick"><input type="checkbox" data-person="' + enc + '" ' + (p.email ? "checked" : "") + ">" +
        '<div><div class="pick-name">' + esc(p.name || "—") + ' <small>' + esc(p.seniority || "") + "</small></div>" +
        '<div class="pick-title">' + esc(p.title || "") + "</div>" +
        '<div class="pick-contact">' + contact + (p.linkedin ? ' · <a href="' + esc(p.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>' : "") + "</div></div></label>";
    }).join("") : '<div class="empty"><div class="big">🔍</div><p>No matching procurement/buyer contacts found for this domain.</p></div>';

    var body = mockNote + revealNote +
      '<div class="meta" style="margin-bottom:10px;">Found ' + people.length + " contact(s) at <strong>" + esc(company.name) + "</strong> matching buyer / procurement / trader roles.</div>" +
      '<div class="pick-list">' + rows + "</div>";
    var footer = '<button class="btn" data-action="close-modal">Cancel</button>' +
      (people.length ? '<button class="btn primary" data-action="save-selected-people" data-id="' + company.id + '">Add selected</button>' : "");
    openModal("👥 Buyers at " + company.name, body, footer);
  }

  function openCompanyPicker(countryCode, res) {
    var country = App.countryByCode(countryCode);
    var companies = res.companies || [];
    var mockNote = res.mock
      ? '<div class="notice warn">Proxy is in <strong>MOCK mode</strong> — these are samples. Set APOLLO_API_KEY for real company discovery.</div>'
      : "";
    var rows = companies.length ? companies.map(function (c) {
      var enc = encodeURIComponent(JSON.stringify(c));
      return '<label class="pick"><input type="checkbox" data-company="' + enc + '" ' + (c.domain ? "checked" : "") + ">" +
        '<div><div class="pick-name">' + esc(c.name || "—") + "</div>" +
        '<div class="pick-contact">' + (c.domain ? "🌐 " + esc(c.domain) : "no website") + (c.city ? " · " + esc(c.city) : "") + "</div></div></label>";
    }).join("") : '<div class="empty"><div class="big">🔍</div><p>No companies returned. Try again or adjust Apollo filters.</p></div>';

    var body = mockNote +
      '<div class="meta" style="margin-bottom:10px;">Found ' + companies.length + " real companies in <strong>" + esc(country ? country.name : countryCode) +
      "</strong>. Add the ones you want, then run <strong>Find buyers (all)</strong> to pull verified emails.</div>" +
      '<div class="pick-list">' + rows + "</div>";
    var footer = '<button class="btn" data-action="close-modal">Cancel</button>' +
      (companies.length ? '<button class="btn primary" data-action="save-discovered" data-country="' + countryCode + '">Add selected</button>' : "");
    openModal("🔎 Discover companies — " + (country ? country.name : countryCode), body, footer);
  }

  /* Bulk: find buyers for every company (optionally in one country) with a
     polite delay between Apollo calls so we don't hammer rate limits. */
  function bulkFindBuyers(countryCode) {
    var list = (countryCode ? Store.companiesByCountry(countryCode) : Store.companies())
      .filter(function (c) { return (c.website || "").trim(); });
    if (!list.length) {
      toast("No companies with a website here. Add websites first so Apollo can match them.");
      return;
    }
    var settings = Store.settings();
    var warn = settings.revealContacts
      ? "\n\nHeads up: 'Reveal emails/phones' is ON, so this spends Apollo credits for each company."
      : "";
    if (!confirm("Find buyer/procurement contacts for " + list.length + " company(ies) via Apollo?" + warn)) return;

    var i = 0, totalPeople = 0, failed = 0;
    var DELAY = 1300; // ms between calls — rate-limit friendly

    function step() {
      if (i >= list.length) {
        render();
        toast("Done — added " + totalPeople + " contact(s) across " + list.length +
          " company(ies)" + (failed ? " · " + failed + " failed (no match / error)." : "."));
        return;
      }
      var c = list[i];
      toast("Apollo " + (i + 1) + "/" + list.length + ": " + (c.name || "company") + "…");
      App.Apollo.findBuyers(c).then(function (res) {
        totalPeople += Store.addPeople(c.id, res.people || []);
      }).catch(function () {
        failed++;
      }).then(function () {
        i++;
        setTimeout(step, DELAY);
      });
    }
    step();
  }

  /* Collect every email address tied to a company (primary + discovered people). */
  function companyEmails(c) {
    var set = {};
    if (c.email) set[c.email.toLowerCase()] = 1;
    (c.people || []).forEach(function (p) { if (p.email) set[p.email.toLowerCase()] = 1; });
    return Object.keys(set);
  }

  /* Sync traffic-light status from Gmail: reply -> green, contacted -> yellow. */
  function syncGmail() {
    var companies = Store.companies();
    var emails = [];
    companies.forEach(function (c) { emails = emails.concat(companyEmails(c)); });
    emails = emails.filter(function (e, i) { return emails.indexOf(e) === i; });
    if (!emails.length) { toast("No buyer emails yet — add or find contacts first."); return; }

    toast("Syncing with Gmail…");
    App.Gmail.check(emails).then(function (results) {
      // detect "not connected" responses
      var notConnected = emails.every(function (e) {
        var r = results[e]; return r && r.error && /not connected|not configured/i.test(r.error);
      });
      if (notConnected) {
        toast("Gmail isn't connected yet — open Settings → Connect Gmail.");
        return;
      }
      var greens = 0, yellows = 0;
      companies.forEach(function (c) {
        // Update each discovered contact individually first.
        (c.people || []).forEach(function (p, idx) {
          if (!p.email) return;
          var r = results[p.email.toLowerCase()];
          if (!r) return;
          if (r.replied && p.status !== "green") { Store.setPersonStatus(c.id, idx, "green", { lastReplyAt: Date.now() }); }
          else if (r.contacted && (p.status || "red") === "red") { Store.setPersonStatus(c.id, idx, "yellow", { lastEmailAt: p.lastEmailAt || Date.now() }); }
        });
        // Then the company headline (its own primary email, or rolled up from people).
        var mine = companyEmails(c);
        var replied = mine.some(function (e) { return results[e] && results[e].replied; });
        var contacted = mine.some(function (e) { return results[e] && results[e].contacted; });
        if (replied) {
          if (c.status !== "green") { Store.setStatus(c.id, "green", { lastReplyAt: Date.now() }); greens++; }
        } else if (contacted && c.status === "red") {
          Store.setStatus(c.id, "yellow", { lastEmailAt: c.lastEmailAt || Date.now() }); yellows++;
        }
      });
      render();
      toast("Gmail synced — " + greens + " new reply(ies) 🟢, " + yellows + " marked awaiting 🟡.");
    }).catch(function (err) { toast(err.message); });
  }

  /* Settings: show the current Gmail connection state. */
  function refreshGmailStatus() {
    var el = document.getElementById("gmail-status");
    if (!el) return;
    App.Gmail.status().then(function (s) {
      if (s.unreachable) el.innerHTML = "⚪ Proxy not reachable — start it to use Gmail sync.";
      else if (!s.configured) el.innerHTML = "⚪ Not configured — add Google OAuth credentials to the proxy's .env (see README).";
      else if (s.connected) el.innerHTML = "🟢 Connected" + (s.email ? " as <strong>" + esc(s.email) + "</strong>" : "") + (s.mock ? " (mock)" : "");
      else el.innerHTML = "🟡 Configured but not connected — click “Connect Gmail”.";
    });
  }

  /* =========================================================
     CSV PARSER (simple, quote-aware)
     ========================================================= */
  function parseCSV(text) {
    var rows = [], row = [], cur = "", q = false, i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { q = false; }
        else cur += ch;
      } else {
        if (ch === '"') q = true;
        else if (ch === ",") { row.push(cur); cur = ""; }
        else if (ch === "\n" || ch === "\r") {
          if (ch === "\r" && text[i + 1] === "\n") i++;
          row.push(cur); rows.push(row); row = []; cur = "";
        } else cur += ch;
      }
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ""; }); });
    if (!rows.length) return [];
    var headers = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
    return rows.map(function (r) {
      var o = {};
      headers.forEach(function (h, idx) { o[h] = (r[idx] || "").trim(); });
      return o;
    });
  }

  /* =========================================================
     EVENT HANDLING (delegated)
     ========================================================= */
  function readForm(scope) {
    var data = {};
    scope.querySelectorAll("[data-f]").forEach(function (el) { data[el.getAttribute("data-f")] = el.value.trim(); });
    var mats = [];
    scope.querySelectorAll("[data-mat]:checked").forEach(function (el) { mats.push(el.getAttribute("data-mat")); });
    data.materials = mats;
    return data;
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-nav]");
    if (t) {
      var nav = t.getAttribute("data-nav");
      if (nav.indexOf("country:") === 0) { route = { view: "country", country: nav.split(":")[1] }; }
      else { route = { view: nav, country: null }; }
      query = "";
      render();
      return;
    }

    var a = e.target.closest("[data-action]");
    if (!a) return;
    var action = a.getAttribute("data-action");
    var id = a.getAttribute("data-id");
    var company = id ? Store.companyById(id) : null;

    switch (action) {
      case "modal-bg":
        if (e.target === a) closeModal();
        break;
      case "close-modal": closeModal(); break;

      case "add-company":
        companyForm({ country: a.getAttribute("data-country") || (route.country || "DE") });
        break;

      case "add-country": countryForm(); break;
      case "save-country": {
        var cm = a.closest(".modal");
        var nm = cm.querySelector("[data-cf=name]").value.trim();
        var fl = cm.querySelector("[data-cf=flag]").value.trim();
        if (!nm) { toast("Enter a country name."); break; }
        var nc = Store.addCustomCountry(nm, fl);
        closeModal();
        route = { view: "country", country: nc.code };
        render(); toast("Added " + nc.name + " — add buyers to it now.");
        break;
      }
      case "remove-country": {
        var rc = App.countryByCode(a.getAttribute("data-country"));
        if (rc && confirm("Remove " + rc.name + " and its buyers from the app?")) {
          Store.removeCustomCountry(rc.code);
          route = { view: "dashboard", country: null };
          render(); toast(rc.name + " removed.");
        }
        break;
      }

      case "sheet-add": Store.addSheetRow(); render(); break;
      case "sheet-del": Store.deleteSheetRow(id); render(); break;
      case "edit-company": companyForm(company); break;

      case "save-company": {
        var modal = a.closest(".modal");
        var data = readForm(modal);
        if (!data.name && !data.email) { toast("Add at least a name or email."); return; }
        if (id) Store.updateCompany(id, data);
        else Store.addCompany(data);
        closeModal(); render(); toast(id ? "Buyer updated." : "Buyer added.");
        break;
      }

      case "del-company":
        if (confirm("Delete " + (company ? company.name : "this buyer") + "?")) {
          Store.deleteCompany(id); render(); toast("Buyer deleted.");
        }
        break;

      case "status": {
        var st = a.getAttribute("data-status");
        var extra = {};
        if (st === "yellow") extra.lastEmailAt = company.lastEmailAt || Date.now();
        if (st === "green") extra.lastReplyAt = Date.now();
        Store.setStatus(id, st, extra);
        render();
        break;
      }

      case "send-email": {
        if (!company.email) { toast("Add an email address first (Edit)."); break; }
        window.open(Email.composeUrl(company), "_blank");
        // opening the composer = you're contacting them → move to "awaiting reply"
        if (company.status === "red") Store.setStatus(id, "yellow", { lastEmailAt: Date.now(), lastEmailSubject: Email.buildDraft(company).subject });
        render();
        toast("Opened Gmail with a pre-written email. Review & send.");
        break;
      }

      case "open-thread":
        window.open(Email.threadUrl(company), "_blank");
        break;

      case "edit-prices": pricesForm(); break;
      case "save-prices": {
        var m2 = a.closest(".modal");
        App.PRICE_ROWS.forEach(function (r) {
          var v = m2.querySelector('[data-price="' + r.key + '"]');
          var patch = { value: v && v.value !== "" ? Number(v.value) : null };
          if (r.hasPremium) {
            var pr = m2.querySelector('[data-price-prem="' + r.key + '"]');
            patch.premium = pr && pr.value !== "" ? Number(pr.value) : null;
          }
          Store.setPriceRow(r.key, patch);
        });
        var src = m2.querySelector("[data-price-src]");
        Store.updatePrices({ source: src && src.value ? src.value : "Manual entry" });
        closeModal(); render(); toast("Prices updated.");
        break;
      }
      case "refresh-prices":
        toast("Scanning live prices…");
        Prices.fetchLive(true).then(function (d) {
          App.priceMsg = "";
          Store.applyPriceFeed(d);
          render();
          toast("Live prices loaded (" + (d.source || "feed") + ").");
        }).catch(function (err) {
          App.priceMsg = err.message; renderPriceBar();
          toast(err.message);
        });
        break;

      case "save-settings": {
        var sc = a.closest(".content") || document;
        var patch = {};
        sc.querySelectorAll("[data-set]").forEach(function (el) { patch[el.getAttribute("data-set")] = el.value.trim(); });
        sc.querySelectorAll("[data-set-bool]").forEach(function (el) { patch[el.getAttribute("data-set-bool")] = el.checked; });
        Store.updateSettings(patch); toast("Settings saved.");
        break;
      }

      case "test-proxy":
        toast("Pinging proxy…");
        App.Apollo.health().then(function (h) {
          toast(h.mock ? "Proxy reachable — running in MOCK mode (no key)." : (h.hasKey ? "Proxy reachable — LIVE, key set ✓" : "Proxy reachable but no API key set."));
        }).catch(function () { toast("Proxy not reachable at " + App.Apollo.proxyUrl() + ". Start it first."); });
        break;

      case "find-buyers": {
        if (!company.website) { toast("Add this company's website first (Edit) so Apollo can match it."); break; }
        a.textContent = "⏳ Searching…"; a.setAttribute("disabled", "1");
        App.Apollo.findBuyers(company).then(function (res) {
          openPeoplePicker(company, res);
        }).catch(function (err) {
          toast(err.message);
        }).then(function () { render(); });
        break;
      }

      case "save-selected-people": {
        var mp = a.closest(".modal");
        var chosen = [];
        mp.querySelectorAll("[data-person]:checked").forEach(function (el) {
          chosen.push(JSON.parse(decodeURIComponent(el.getAttribute("data-person"))));
        });
        if (!chosen.length) { toast("Select at least one person."); break; }
        var n = Store.addPeople(id, chosen);
        closeModal(); render(); toast(n + " contact(s) added.");
        break;
      }

      case "person-email": {
        var pidx = Number(a.getAttribute("data-idx"));
        var person = (company.people || [])[pidx];
        if (!person || !person.email) { toast("No email for this person."); break; }
        window.open(Email.composeUrl(company, person), "_blank");
        if ((person.status || "red") === "red") Store.setPersonStatus(id, pidx, "yellow", { lastEmailAt: Date.now() });
        render(); toast("Opened Gmail to " + person.name + ".");
        break;
      }

      case "person-status":
        Store.setPersonStatus(id, Number(a.getAttribute("data-idx")), a.getAttribute("data-status"),
          a.getAttribute("data-status") === "yellow" ? { lastEmailAt: Date.now() } :
          a.getAttribute("data-status") === "green" ? { lastReplyAt: Date.now() } : {});
        render();
        break;

      case "person-thread": {
        var tp = (company.people || [])[Number(a.getAttribute("data-idx"))];
        if (tp && tp.email) window.open(Email.threadUrl({ email: tp.email, name: tp.name }), "_blank");
        break;
      }

      case "del-person":
        Store.removePerson(id, Number(a.getAttribute("data-idx")));
        render();
        break;

      case "refresh-phones": {
        toast("Checking for phone numbers…");
        App.Apollo.getPhones(company).then(function (map) {
          var n = Store.mergePhones(id, map);
          render();
          toast(n ? (n + " phone number(s) added.") : "No new phone numbers yet (they arrive a bit after reveal).");
        });
        break;
      }

      case "bulk-find": {
        bulkFindBuyers(a.getAttribute("data-country") || null);
        break;
      }

      case "discover-companies": {
        var cc = a.getAttribute("data-country");
        var country = App.countryByCode(cc);
        a.textContent = "⏳ Searching…"; a.setAttribute("disabled", "1");
        App.Apollo.findCompanies(country ? country.name : cc).then(function (res) {
          openCompanyPicker(cc, res);
        }).catch(function (err) { toast(err.message); }).then(function () { render(); });
        break;
      }

      case "save-discovered": {
        var dm = a.closest(".modal");
        var dcc = a.getAttribute("data-country");
        var chosen = [];
        dm.querySelectorAll("[data-company]:checked").forEach(function (el) {
          chosen.push(JSON.parse(decodeURIComponent(el.getAttribute("data-company"))));
        });
        if (!chosen.length) { toast("Select at least one company."); break; }
        var seed = chosen.map(function (x) {
          return { name: x.name, country: dcc, city: x.city || "", website: x.domain || "", materials: [], notes: "Discovered via Apollo — run Find buyers for contacts." };
        });
        var n = Store.importSeed(seed);
        closeModal(); render();
        toast(n + " companies added — now run “Find buyers (all)” to get emails.");
        break;
      }

      case "connect-gmail":
        window.open(App.Gmail.connectUrl(), "_blank");
        toast("Connect Gmail in the new tab, then click “Sync now”.");
        break;

      case "sync-gmail":
        syncGmail();
        break;

      case "team-pull":
        if (!App.Sync.enabled()) { toast("Enable team sync first (and Save)."); break; }
        toast("Pulling team data…");
        App.Sync.pull().then(function (j) {
          if (j && j.state && Store.applyRemote(j)) { render(); toast("Pulled latest team data."); }
          else toast("No shared data on the server yet — push first.");
        }).catch(function (e) { toast(e.message); });
        break;

      case "team-push":
        if (!App.Sync.enabled()) { toast("Enable team sync first (and Save)."); break; }
        toast("Pushing to team…");
        App.Sync.push().then(function (j) { toast("Pushed (rev " + (j.rev || "?") + ")."); })
          .catch(function (e) { toast(e.message); });
        break;

      case "import": importForm(); break;
      case "load-eu-seed": {
        var added = Store.importSeed(App.EU_SEED || []);
        closeModal(); render();
        toast(added ? (added + " starter companies loaded — now run “Find buyers”.") : "Starter list already loaded.");
        break;
      }
      case "do-import": {
        var txt = $("import-text").value.trim();
        if (!txt) { toast("Paste some data first."); break; }
        try {
          if (txt[0] === "{") { Store.importJSON(txt); toast("Backup restored."); }
          else {
            var rows = parseCSV(txt);
            var n = Store.importCompanyRows(rows);
            toast(n + " buyer(s) imported.");
          }
          closeModal(); render();
        } catch (err) { toast("Import failed: " + err.message); }
        break;
      }
      case "export": {
        var blob = new Blob([Store.exportJSON()], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var aEl = document.createElement("a");
        aEl.href = url; aEl.download = "metals-crm-backup.json"; aEl.click();
        URL.revokeObjectURL(url);
        toast("Backup downloaded.");
        break;
      }
      case "reset":
        if (confirm("This erases ALL buyers, prices and settings. Continue?")) {
          Store.resetAll(); render(); toast("Everything reset.");
        }
        break;
    }
  });

  App.onSheetEdit = function (id, field, value) {
    var patch = {}; patch[field] = value;
    App.Store.updateSheetRow(id, patch);
  };

  App.onSearch = function (v) { query = v; var c = $("content");
    // re-render only the cards area to keep input focus
    if (route.view === "companies" || route.view === "country") {
      c.innerHTML = viewCompanies(route.country);
      var s = c.querySelector(".search");
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }
  };

  /* Auto-scan live prices ~once/day on load (if a source is configured).
     Surfaces the reason in the price bar if it can't (instead of silent). */
  function autoScanPrices() {
    if (Store.settings().autoScanPrices === false) return;
    if (Store.settings().priceSource === "manual") return;
    var p = Store.prices();
    var age = Date.now() - (p.updatedAt || 0);
    if (p.updatedAt && age < 12 * 3600 * 1000) return; // already fresh today
    App.priceMsg = "scanning…"; renderPriceBar();
    Prices.fetchLive().then(function (d) {
      if (d && (d.copper != null || d.aluminium != null || d.zinc != null)) {
        App.priceMsg = ""; Store.applyPriceFeed(d); renderPriceBar();
      } else {
        App.priceMsg = "Live feed returned no prices."; renderPriceBar();
      }
    }).catch(function (err) {
      App.priceMsg = err.message; renderPriceBar();
    });
  }

  /* boot */
  function boot() {
    render();
    setTimeout(autoScanPrices, 700);
    if (App.Sync) App.Sync.init(function () { render(); toast("Pulled latest team data."); });
  }
  document.addEventListener("DOMContentLoaded", boot);
  if (document.readyState !== "loading") boot();

})(window.App);
