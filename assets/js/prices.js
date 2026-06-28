/* ============================================================
   prices.js  —  formatting, derived values, optional live feed
   ============================================================ */
window.App = window.App || {};

(function (App) {
  "use strict";

  var Prices = {
    fmt: function (v) {
      if (v === null || v === undefined || v === "" || isNaN(v)) return "—";
      return Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
    },

    // The all-in aluminium price your buyers actually pay in the EU = LME + premium.
    aluminiumAllIn: function (prices) {
      var row = prices.rows.aluminium || {};
      if (row.value == null) return null;
      return Number(row.value) + Number(row.premium || 0);
    },

    // Rough indicative brass value (no LME contract): ~60% Cu + ~37% Zn.
    // Purely a helper for your quoting — clearly indicative, not a quote.
    brassIndicative: function (prices) {
      var cu = prices.rows.copper && prices.rows.copper.value;
      var zn = prices.rows.zinc && prices.rows.zinc.value;
      if (cu == null || zn == null) return null;
      return Math.round(cu * 0.60 + zn * 0.37);
    },

    ageText: function (ts) {
      if (!ts) return "never updated";
      var mins = Math.round((Date.now() - ts) / 60000);
      if (mins < 1) return "updated just now";
      if (mins < 60) return "updated " + mins + " min ago";
      var hrs = Math.round(mins / 60);
      if (hrs < 24) return "updated " + hrs + "h ago";
      var days = Math.round(hrs / 24);
      return "updated " + days + "d ago";
    },

    /* ------------------------------------------------------------
       Live feed. Defaults to the local proxy's /api/prices endpoint
       (which scans your configured provider daily), or override with
       window.App.PRICE_FEED_URL. See server/apollo-proxy.js + README.
       ------------------------------------------------------------ */
    feedUrl: function () {
      if (App.PRICE_FEED_URL) return App.PRICE_FEED_URL;
      var base = (App.Store.settings().apolloProxyUrl || "http://localhost:8787").replace(/\/+$/, "");
      return base + "/api/prices";
    },

    fetchLive: function (force) {
      var url = this.feedUrl() + (force ? "?force=1" : "");
      return fetch(url).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error || ("Price feed responded " + r.status));
          return j;
        });
      }).catch(function (err) {
        if (err instanceof TypeError) {
          throw new Error("Can't reach the price feed. Start the proxy and set PRICE_PROVIDER (see README).");
        }
        throw err;
      });
    }
  };

  App.Prices = Prices;

})(window.App);
