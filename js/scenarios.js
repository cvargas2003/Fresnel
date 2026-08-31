/* ==========================================================================
   scenarios.js — guardar/cargar configuraciones de enlace en localStorage.

   Pensado para trabajo en equipo (hasta 3 estudiantes, según el enunciado):
   cada quien puede guardar el enlace que propuso con un nombre y comparar
   resultados sin perder las demás pruebas. Los datos quedan solo en el
   navegador de quien los guarda (localStorage), no se envían a ningún lado.
   ========================================================================== */
(function(RF){
  "use strict";
  var KEY = "rf_scenarios";

  function readAll(){
    try{
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  }
  function writeAll(arr){
    localStorage.setItem(KEY, JSON.stringify(arr));
  }

  RF.scenarios = {
    list: function(){
      return readAll().sort(function(a,b){ return b.ts-a.ts; });
    },
    save: function(name, inputs){
      var arr = readAll().filter(function(s){ return s.name !== name; });
      arr.push({ name:name, ts:Date.now(), inputs:inputs });
      writeAll(arr);
    },
    load: function(name){
      var found = readAll().filter(function(s){ return s.name === name; })[0];
      return found ? found.inputs : null;
    },
    remove: function(name){
      writeAll(readAll().filter(function(s){ return s.name !== name; }));
    }
  };
})(window.RF = window.RF || {});
