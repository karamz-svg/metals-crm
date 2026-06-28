/* ============================================================
   data.js  —  Static reference data (no dependencies)
   Attaches everything to the global window.App namespace.
   ============================================================ */
window.App = window.App || {};

(function (App) {
  "use strict";

  /* ---- Metal groups: drive colour coding + LME price linkage ---- */
  // lmeKey maps a metal to a row in the price panel. null = no direct LME contract.
  App.METALS = {
    copper:    { label: "Copper",          color: "#c2703d", lmeKey: "copper" },
    aluminium: { label: "Aluminium",       color: "#7f93a8", lmeKey: "aluminium" },
    zinc:      { label: "Zinc",            color: "#5b8a9a", lmeKey: "zinc" },
    lead:      { label: "Lead",            color: "#5d6470", lmeKey: "lead" },
    brass:     { label: "Brass / Alloy",   color: "#b89630", lmeKey: null },     // derived from Cu + Zn
    stainless: { label: "Stainless / Ni",  color: "#8a8f98", lmeKey: "nickel" },
    iron:      { label: "Iron / Steel",    color: "#6b7280", lmeKey: null }
  };

  /* ---- The 25 products you sell ---- */
  // type: primary | scrap | compound | product
  App.PRODUCTS = [
    { id: "copper-ingots-97",   name: "Copper ingots 97%",                 metal: "copper",    type: "primary",  unit: "MT" },
    { id: "copper-cathode",     name: "Copper cathode 99.99%",             metal: "copper",    type: "primary",  unit: "MT" },
    { id: "aluminium-ingots",   name: "Aluminium ingots 95%",              metal: "aluminium", type: "primary",  unit: "MT" },
    { id: "copper-rod",         name: "Copper rod 8mm–16mm",               metal: "copper",    type: "product",  unit: "MT" },
    { id: "copper-billet",      name: "Copper billet",                     metal: "copper",    type: "product",  unit: "MT" },
    { id: "zinc-ingot-hg",      name: "High grade zinc ingot",             metal: "zinc",      type: "primary",  unit: "MT" },
    { id: "lead-remelted",      name: "Remelted lead ingots",              metal: "lead",      type: "primary",  unit: "MT" },
    { id: "lead-refined",       name: "Refined lead ingots",               metal: "lead",      type: "primary",  unit: "MT" },
    { id: "lead-antimony",      name: "Antimony lead ingots",              metal: "lead",      type: "primary",  unit: "MT" },
    { id: "al-scrap-ubc",       name: "Aluminium scrap UBC (extrusion/Talk)", metal: "aluminium", type: "scrap", unit: "MT" },
    { id: "brass-scrap-honey",  name: "Brass scrap (honey / ocean radiator)", metal: "brass", type: "scrap",    unit: "MT" },
    { id: "lead-oxide",         name: "Lead oxide",                        metal: "lead",      type: "compound", unit: "MT" },
    { id: "cu-scrap-berry",     name: "Copper scrap (berry)",              metal: "copper",    type: "scrap",    unit: "MT" },
    { id: "cu-scrap-birch",     name: "Copper scrap (birch/cliff)",        metal: "copper",    type: "scrap",    unit: "MT" },
    { id: "cu-scrap-millberry", name: "Copper scrap (millberry)",          metal: "copper",    type: "scrap",    unit: "MT" },
    { id: "zinc-oxide",         name: "Zinc oxide",                        metal: "zinc",      type: "compound", unit: "MT" },
    { id: "cast-iron",          name: "Cast iron",                         metal: "iron",      type: "primary",  unit: "MT" },
    { id: "brass-alloy-ingots", name: "Brass alloy ingots",                metal: "brass",     type: "primary",  unit: "MT" },
    { id: "brass-billet",       name: "Brass billet",                      metal: "brass",     type: "product",  unit: "MT" },
    { id: "copper-busbar",      name: "Copper busbar",                     metal: "copper",    type: "product",  unit: "MT" },
    { id: "al-sows",            name: "Aluminium sows A7–A5",              metal: "aluminium", type: "primary",  unit: "MT" },
    { id: "copper-pipe",        name: "Copper pipe",                       metal: "copper",    type: "product",  unit: "MT" },
    { id: "ss-304",             name: "Stainless steel 304",               metal: "stainless", type: "product",  unit: "MT" },
    { id: "al-talon",           name: "Aluminium Talon",                   metal: "aluminium", type: "scrap",    unit: "MT" },
    { id: "al-wheels",          name: "Aluminium wheels",                  metal: "aluminium", type: "scrap",    unit: "MT" }
  ];

  App.productById = function (id) {
    return App.PRODUCTS.find(function (p) { return p.id === id; });
  };

  /* ---- The 27 EU member states ---- */
  App.COUNTRIES = [
    { code: "AT", name: "Austria",        flag: "🇦🇹" },
    { code: "BE", name: "Belgium",        flag: "🇧🇪" },
    { code: "BG", name: "Bulgaria",       flag: "🇧🇬" },
    { code: "HR", name: "Croatia",        flag: "🇭🇷" },
    { code: "CY", name: "Cyprus",         flag: "🇨🇾" },
    { code: "CZ", name: "Czechia",        flag: "🇨🇿" },
    { code: "DK", name: "Denmark",        flag: "🇩🇰" },
    { code: "EE", name: "Estonia",        flag: "🇪🇪" },
    { code: "FI", name: "Finland",        flag: "🇫🇮" },
    { code: "FR", name: "France",         flag: "🇫🇷" },
    { code: "DE", name: "Germany",        flag: "🇩🇪" },
    { code: "GR", name: "Greece",         flag: "🇬🇷" },
    { code: "HU", name: "Hungary",        flag: "🇭🇺" },
    { code: "IE", name: "Ireland",        flag: "🇮🇪" },
    { code: "IT", name: "Italy",          flag: "🇮🇹" },
    { code: "LV", name: "Latvia",         flag: "🇱🇻" },
    { code: "LT", name: "Lithuania",      flag: "🇱🇹" },
    { code: "LU", name: "Luxembourg",     flag: "🇱🇺" },
    { code: "MT", name: "Malta",          flag: "🇲🇹" },
    { code: "NL", name: "Netherlands",    flag: "🇳🇱" },
    { code: "PL", name: "Poland",         flag: "🇵🇱" },
    { code: "PT", name: "Portugal",       flag: "🇵🇹" },
    { code: "RO", name: "Romania",        flag: "🇷🇴" },
    { code: "SK", name: "Slovakia",       flag: "🇸🇰" },
    { code: "SI", name: "Slovenia",       flag: "🇸🇮" },
    { code: "ES", name: "Spain",          flag: "🇪🇸" },
    { code: "SE", name: "Sweden",         flag: "🇸🇪" }
  ];

  App.countryByCode = function (code) {
    var c = App.COUNTRIES.find(function (x) { return x.code === code; });
    if (c) return c;
    if (App.Store && App.Store.customCountries) {
      return App.Store.customCountries().find(function (x) { return x.code === code; });
    }
    return undefined;
  };

  // All selectable countries = the 27 EU members + any custom ones the user added.
  App.allCountries = function () {
    var custom = (App.Store && App.Store.customCountries) ? App.Store.customCountries() : [];
    return App.COUNTRIES.concat(custom);
  };

  /* ---- LME price rows shown in the panel ---- */
  // Aluminium also carries an EU duty-paid premium (Fastmarkets MB / LME page).
  App.PRICE_ROWS = [
    { key: "copper",    label: "Copper (Grade A)",  metal: "copper" },
    { key: "aluminium", label: "Aluminium (P1020)", metal: "aluminium", hasPremium: true },
    { key: "zinc",      label: "Zinc (SHG)",        metal: "zinc" },
    { key: "lead",      label: "Lead",              metal: "lead" },
    { key: "nickel",    label: "Nickel",            metal: "stainless" }
  ];

  /* Reference link for the EU aluminium premium the user mentioned. */
  App.PREMIUM_SOURCE_URL =
    "https://www.lme.com/metals/non-ferrous/lme-aluminium-premiums/lme-aluminium-premium-duty-paid-european-fastmarkets-mb";

  /* Job titles that flag someone responsible for BUYING metals.
     Sent to the Apollo proxy as person_titles (partial matching). */
  App.BUYER_TITLES = [
    "procurement", "purchasing", "buyer", "sourcing", "supply chain",
    "trader", "trading", "commodity", "raw materials", "category manager",
    "commercial", "head of metals"
  ];

})(window.App);
