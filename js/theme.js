/* ==========================================================================
   theme.js — alterna y persiste el tema claro/oscuro.
   ========================================================================== */
(function(RF){
  "use strict";
  var KEY = "rf_theme";

  RF.theme = {
    get: function(){
      return localStorage.getItem(KEY) || "light";
    },
    apply: function(mode){
      document.documentElement.setAttribute("data-theme", mode);
      localStorage.setItem(KEY, mode);
    },
    toggle: function(){
      var next = RF.theme.get() === "dark" ? "light" : "dark";
      RF.theme.apply(next);
      return next;
    },
    init: function(){
      RF.theme.apply(RF.theme.get());
    }
  };
})(window.RF = window.RF || {});
