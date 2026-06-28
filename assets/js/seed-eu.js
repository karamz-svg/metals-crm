/* ============================================================
   seed-eu.js  —  EU non-ferrous starter buyer list (research leads)
   ------------------------------------------------------------
   These are real, publicly-known non-ferrous producers, smelters
   and recyclers across the EU, with their public website domains.
   They are STARTING RESEARCH LEADS, not verified buyers:
     • Contact emails/phones are intentionally left blank — use the
       Apollo "Find buyers" button to pull verified procurement
       contacts for each domain.
     • The "materials" tags are INDICATIVE (what each firm broadly
       works with) and should be verified before you pitch.
   Load them from the app: Import → "Load EU starter list".
   ============================================================ */
window.App = window.App || {};

(function (App) {
  "use strict";

  var N = "Research lead — verify contact & materials; pull contacts via Apollo.";

  App.EU_SEED = [
    // Germany
    { name: "Aurubis AG", country: "DE", city: "Hamburg", website: "aurubis.com", materials: ["copper-cathode", "cu-scrap-millberry", "copper-billet"], notes: N },
    { name: "Wieland-Werke AG", country: "DE", city: "Ulm", website: "wieland.com", materials: ["brass-alloy-ingots", "brass-billet", "copper-busbar"], notes: N },
    { name: "KME Germany GmbH", country: "DE", city: "Osnabrück", website: "kme.com", materials: ["copper-busbar", "copper-pipe", "brass-billet"], notes: N },
    { name: "TRIMET Aluminium SE", country: "DE", city: "Essen", website: "trimet.eu", materials: ["aluminium-ingots", "al-sows", "al-scrap-ubc"], notes: N },
    { name: "Speira GmbH", country: "DE", city: "Grevenbroich", website: "speira.com", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },

    // Sweden
    { name: "Boliden AB", country: "SE", city: "Stockholm", website: "boliden.com", materials: ["copper-cathode", "zinc-ingot-hg", "lead-refined"], notes: N },
    { name: "Gränges AB", country: "SE", city: "Stockholm", website: "granges.com", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },
    { name: "Stena Metall AB", country: "SE", city: "Gothenburg", website: "stenametall.com", materials: ["cu-scrap-berry", "al-scrap-ubc", "ss-304"], notes: N },

    // Finland
    { name: "Kuusakoski Oy", country: "FI", city: "Espoo", website: "kuusakoski.com", materials: ["cu-scrap-millberry", "al-scrap-ubc", "ss-304"], notes: N },
    { name: "Boliden Harjavalta Oy", country: "FI", city: "Harjavalta", website: "boliden.com", materials: ["copper-cathode"], notes: N },

    // Belgium
    { name: "Umicore", country: "BE", city: "Brussels", website: "umicore.com", materials: ["lead-oxide", "zinc-oxide", "copper-cathode"], notes: N },
    { name: "Aurubis Beerse", country: "BE", city: "Beerse", website: "aurubis.com", materials: ["copper-cathode", "cu-scrap-millberry"], notes: N },

    // Netherlands
    { name: "Nyrstar Budel", country: "NL", city: "Budel", website: "nyrstar.com", materials: ["zinc-ingot-hg", "zinc-oxide"], notes: N },
    { name: "Nedzink B.V.", country: "NL", city: "Budel", website: "nedzink.com", materials: ["zinc-ingot-hg", "zinc-oxide"], notes: N },
    { name: "Aldel (Aluminium Delfzijl)", country: "NL", city: "Delfzijl", website: "aldel.nl", materials: ["aluminium-ingots", "al-sows"], notes: N },

    // Spain
    { name: "Atlantic Copper S.L.U.", country: "ES", city: "Huelva", website: "atlanticcopper.es", materials: ["copper-cathode", "copper-billet"], notes: N },
    { name: "Cunext Group", country: "ES", city: "Córdoba", website: "cunext.com", materials: ["copper-rod", "copper-cathode"], notes: N },
    { name: "Befesa S.A.", country: "ES", city: "Bilbao", website: "befesa.com", materials: ["zinc-oxide", "al-scrap-ubc"], notes: N },

    // France
    { name: "Nexans", country: "FR", city: "Paris", website: "nexans.com", materials: ["copper-rod", "copper-busbar"], notes: N },
    { name: "Constellium SE", country: "FR", city: "Paris", website: "constellium.com", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },
    { name: "Recylex SA", country: "FR", city: "Suresnes", website: "recylex.eu", materials: ["lead-refined", "lead-oxide", "zinc-oxide"], notes: N },

    // Italy
    { name: "Raffmetal S.p.A.", country: "IT", city: "Brescia", website: "raffmetal.it", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },
    { name: "Eural Gnutti S.p.A.", country: "IT", city: "Brescia", website: "eural.com", materials: ["brass-billet", "brass-alloy-ingots"], notes: N },
    { name: "KME Italy S.p.A.", country: "IT", city: "Florence", website: "kme.com", materials: ["copper-busbar", "copper-pipe"], notes: N },

    // Poland
    { name: "KGHM Polska Miedź S.A.", country: "PL", city: "Lubin", website: "kghm.com", materials: ["copper-cathode", "copper-rod", "copper-billet"], notes: N },
    { name: "Grupa Kęty S.A.", country: "PL", city: "Kęty", website: "grupakety.com", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },
    { name: "Boryszew S.A. (Hutmen)", country: "PL", city: "Warsaw", website: "boryszew.com", materials: ["brass-billet", "copper-busbar"], notes: N },

    // Austria
    { name: "AMAG Austria Metall AG", country: "AT", city: "Ranshofen", website: "amag.at", materials: ["aluminium-ingots", "al-scrap-ubc", "al-sows"], notes: N },
    { name: "Montanwerke Brixlegg AG", country: "AT", city: "Brixlegg", website: "montanwerke-brixlegg.com", materials: ["copper-cathode", "cu-scrap-millberry"], notes: N },

    // Greece
    { name: "ElvalHalcor S.A.", country: "GR", city: "Athens", website: "elvalhalcor.com", materials: ["copper-busbar", "aluminium-ingots", "copper-pipe"], notes: N },
    { name: "Metlen (Aluminium of Greece)", country: "GR", city: "Athens", website: "metlen.com", materials: ["aluminium-ingots", "al-sows"], notes: N },

    // Bulgaria
    { name: "Aurubis Bulgaria AD", country: "BG", city: "Pirdop", website: "aurubis.com", materials: ["copper-cathode"], notes: N },
    { name: "KCM AD", country: "BG", city: "Plovdiv", website: "kcm.bg", materials: ["lead-refined", "zinc-ingot-hg", "zinc-oxide"], notes: N },
    { name: "Alcomet AD", country: "BG", city: "Shumen", website: "alcomet.eu", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },

    // Slovenia
    { name: "Talum d.d.", country: "SI", city: "Kidričevo", website: "talum.si", materials: ["aluminium-ingots", "al-sows"], notes: N },
    { name: "Impol Group", country: "SI", city: "Slovenska Bistrica", website: "impol.si", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },

    // Slovakia
    { name: "Slovalco a.s.", country: "SK", city: "Žiar nad Hronom", website: "slovalco.sk", materials: ["aluminium-ingots", "al-sows"], notes: N },
    { name: "Kovohuty a.s.", country: "SK", city: "Krompachy", website: "kovohuty.sk", materials: ["copper-cathode", "cu-scrap-millberry"], notes: N },

    // Czechia
    { name: "Kovohutě Příbram", country: "CZ", city: "Příbram", website: "kovohute.cz", materials: ["lead-refined", "lead-oxide"], notes: N },
    { name: "AL INVEST Břidličná, a.s.", country: "CZ", city: "Břidličná", website: "alinvest.cz", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },

    // Romania
    { name: "Alro S.A.", country: "RO", city: "Slatina", website: "alro.ro", materials: ["aluminium-ingots", "al-sows", "al-scrap-ubc"], notes: N },

    // Hungary
    { name: "Hydro Extrusion Hungary", country: "HU", city: "Székesfehérvár", website: "hydro.com", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },

    // Denmark
    { name: "H.J. Hansen Recycling", country: "DK", city: "Odense", website: "hjhansen.dk", materials: ["cu-scrap-berry", "al-scrap-ubc", "ss-304"], notes: N },

    // Croatia
    { name: "TLM d.d. Šibenik", country: "HR", city: "Šibenik", website: "tlm.hr", materials: ["aluminium-ingots", "al-scrap-ubc"], notes: N },

    // Luxembourg
    { name: "Befesa (HQ)", country: "LU", city: "Luxembourg", website: "befesa.com", materials: ["zinc-oxide"], notes: N },

    // Portugal
    { name: "Cabelte (cables)", country: "PT", city: "Porto", website: "cabelte.pt", materials: ["copper-rod", "copper-busbar"], notes: N },

    // Ireland
    { name: "Hammond Lane Metal Company", country: "IE", city: "Dublin", website: "hammondlane.ie", materials: ["cu-scrap-berry", "al-scrap-ubc", "ss-304"], notes: N },

    // Lithuania
    { name: "EMP Recycling", country: "LT", city: "Vilnius", website: "emp.lt", materials: ["cu-scrap-berry", "al-scrap-ubc"], notes: N },

    // Estonia
    { name: "Kuusakoski AS (Estonia)", country: "EE", city: "Tallinn", website: "kuusakoski.com", materials: ["cu-scrap-millberry", "al-scrap-ubc"], notes: N }
  ];

})(window.App);
