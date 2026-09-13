/* ==========================================================================
   auth.js — control de acceso muy simple, del lado del cliente.

   No pide usuario ni contraseña: es una pantalla intermedia (portada) que
   hay que pulsar para entrar, no un control de acceso real. Como todo el
   proyecto es HTML/JS estático sin servidor ni base de datos, no existe
   ningún lugar donde validar credenciales de verdad — cualquiera que abra
   app.html directamente, o que ejecute sessionStorage.setItem("rf_auth","1")
   en la consola, entra igual. Ver docs/documentacion-tecnica.html, sección
   "El acceso y sus límites".
   ========================================================================== */
(function(RF){
  "use strict";
  var KEY = "rf_auth";

  RF.auth = {
    isLoggedIn: function(){
      return sessionStorage.getItem(KEY) === "1";
    },
    login: function(){
      sessionStorage.setItem(KEY, "1");
    },
    logout: function(){
      sessionStorage.removeItem(KEY);
    }
  };
})(window.RF = window.RF || {});
