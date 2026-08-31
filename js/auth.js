/* ==========================================================================
   auth.js — control de acceso muy simple, del lado del cliente.

   IMPORTANTE (léelo antes de usar esto como referencia de seguridad real):
   este archivo es HTML/CSS/JS estático sin servidor ni base de datos, así
   que no hay ningún lugar seguro donde comprobar una contraseña: cualquiera
   puede abrir este archivo con el navegador y leer el usuario/clave en texto
   plano. Esto es intencional y suficiente para el objetivo académico (una
   pantalla de acceso previa a la herramienta), pero NO debe tomarse como
   patrón para un sistema real. Un login real necesita un backend que
   verifique credenciales y emita una sesión firmada (p. ej. JWT/cookies
   HttpOnly) — ver docs/documentacion-tecnica.html, sección "Límites del login".
   ========================================================================== */
(function(RF){
  "use strict";
  var KEY = "rf_auth";
  var USER = "admin";
  var PASS = "123";

  RF.auth = {
    isLoggedIn: function(){
      return sessionStorage.getItem(KEY) === "1";
    },
    tryLogin: function(user, pass){
      if(user === USER && pass === PASS){
        sessionStorage.setItem(KEY, "1");
        return true;
      }
      return false;
    },
    logout: function(){
      sessionStorage.removeItem(KEY);
    }
  };
})(window.RF = window.RF || {});
