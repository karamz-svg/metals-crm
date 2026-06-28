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
       OPTIONAL live feed adapter.
       LME / SMM data is licensed and most endpoints block browser
       (CORS) requests, so this is left as a clearly-marked hook.
       To enable: deploy a tiny proxy/backend that returns JSON like
         { copper: 9000, aluminium: 2300, premium: 290, zinc: 2700,
           lead: 2100, nickel: 16500, source: "...", asOf: 1700000000000 }
       then set window.App.PRICE_FEED_URL to its address.
       ------------------------------------------------------------ */
    fetchLive: function () {
      var url = App.PRICE_FEED_URL;
      if (!url) {
        return Promise.reject(new Error(
          "No live feed configured. Enter prices manually, or set App.PRICE_FEED_URL " +
          "to a JSON endpoint you control (see README)."
        ));
      }
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error("Feed responded " + r.status);
        return r.json();
      });
    }
  };

  App.Prices = Prices;

})(window.App);
