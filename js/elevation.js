/* ==========================================================================
   elevation.js — perfil de elevación real del terreno (opcional).

   Usa la API pública y gratuita Open-Elevation (https://open-elevation.com),
   consistente con lo que permite el enunciado ("cualquier fuente de
   información cartográfica disponible en la red"). Es un servicio de
   terceros de mejor esfuerzo: puede tardar, fallar o no responder. Por eso
   esta función SIEMPRE se usa con try/catch en el llamador y el programa
   sigue funcionando con el modelo plano (curvatura + obstáculo puntual) si
   la consulta no se puede completar.
   ========================================================================== */
(function(RF){
  "use strict";
  var ENDPOINT = "https://api.open-elevation.com/api/v1/lookup";
  var N = 241; // debe coincidir con el muestreo de RF.compute

  // Devuelve una Promise<number[]> con N+1 elevaciones (msnm) equiespaciadas
  // entre A y B. Lanza si la red falla o la API responde con error.
  RF.fetchElevationProfile = function(latA,lonA,latB,lonB){
    var locations = [];
    for(var i=0;i<=N;i++){
      var t = i/N;
      var p = RF.lerpLatLon(latA,lonA,latB,lonB,t);
      locations.push({ latitude:p.lat, longitude:p.lon });
    }
    var controller = new AbortController();
    var timeout = setTimeout(function(){ controller.abort(); }, 12000);

    return fetch(ENDPOINT, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ locations: locations }),
      signal: controller.signal
    }).then(function(r){
      if(!r.ok) throw new Error("La API de elevación respondió con error "+r.status);
      return r.json();
    }).then(function(data){
      if(!data || !Array.isArray(data.results) || data.results.length !== N+1){
        throw new Error("Respuesta de elevación incompleta");
      }
      return data.results.map(function(p){ return p.elevation; });
    }).finally(function(){ clearTimeout(timeout); });
  };
})(window.RF = window.RF || {});
