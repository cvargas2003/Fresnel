/* ==========================================================================
   icons.js — inserta el sprite SVG de iconos una sola vez por página.
   Evita duplicar <symbol> en cada HTML y funciona sin servidor (no usa fetch).
   ========================================================================== */
(function(){
  "use strict";
  var SPRITE =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<symbol id="i-tower" viewBox="0 0 24 24"><path d="M12 2l6 19M12 2L6 21M9.5 15h5M8 21h8"/></symbol>' +
    '<symbol id="i-distance" viewBox="0 0 24 24"><path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4"/></symbol>' +
    '<symbol id="i-ellipse" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9.5" ry="5.2"/></symbol>' +
    '<symbol id="i-ellipse-dash" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9.5" ry="5.2" stroke-dasharray="2.6 2.6"/></symbol>' +
    '<symbol id="i-clearance" viewBox="0 0 24 24"><path d="M12 20V4M12 4l-5 5M12 4l5 5"/></symbol>' +
    '<symbol id="i-ratio" viewBox="0 0 24 24"><circle cx="7.5" cy="7.5" r="2.4"/><circle cx="16.5" cy="16.5" r="2.4"/><line x1="5" y1="19" x2="19" y2="5"/></symbol>' +
    '<symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.8 9.2l-2 4-3.6 1.6 2-4z"/></symbol>' +
    '<symbol id="i-signal" viewBox="0 0 24 24"><path d="M4 20v-4M9 20v-8M14 20V8M19 20V4"/></symbol>' +
    '<symbol id="i-wave" viewBox="0 0 24 24"><path d="M2 12c2-4.2 4-4.2 6 0s4 4.2 6 0 4-4.2 6 0"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.5l2.6 2.6L16.5 9"/></symbol>' +
    '<symbol id="i-warn" viewBox="0 0 24 24"><path d="M12 3.5l9.5 16.5H2.5z"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="17" r=".3"/></symbol>' +
    '<symbol id="i-x" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M9 9l6 6M15 9l-6 6"/></symbol>' +
    '<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="10.5" x2="12" y2="16.5"/><circle cx="12" cy="7.4" r=".3"/></symbol>' +
    '<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></symbol>' +
    '<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6"/></symbol>' +
    '<symbol id="i-horizon" viewBox="0 0 24 24"><path d="M2 16a10 6 0 0 1 20 0"/><line x1="2" y1="16" x2="22" y2="16"/></symbol>' +
    '<symbol id="i-budget" viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M20 19H4"/></symbol>' +
    '<symbol id="i-terrain" viewBox="0 0 24 24"><path d="M2 19l5-9 3.5 5L14 8l8 11z"/></symbol>' +
    '<symbol id="i-diffraction" viewBox="0 0 24 24"><path d="M2 17h4l3-9 4 14 3-9h6"/></symbol>' +
    '<symbol id="i-save" viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/></symbol>' +
    '<symbol id="i-load" viewBox="0 0 24 24"><path d="M4 8V4h6l2 2h8v12H4v-6"/><path d="M4 14l3-4 2 2 4-5 4 5"/></symbol>' +
    '<symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></symbol>' +
    '<symbol id="i-print" viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4v-6h16v6h-2M6 14h12v7H6z"/></symbol>' +
    '<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/></symbol>' +
    '<symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></symbol>' +
    '<symbol id="i-logout" viewBox="0 0 24 24"><path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/></symbol>' +
    '</defs></svg>';

  document.addEventListener("DOMContentLoaded", function(){
    document.body.insertAdjacentHTML("afterbegin", SPRITE);
  });
})();
