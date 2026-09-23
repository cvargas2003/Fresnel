/* ==========================================================================
   elevation.js — perfil de elevación real del terreno (opcional).

   Fuentes cartográficas públicas y gratuitas, en orden de preferencia
   (el enunciado permite "cualquier fuente de información cartográfica
   disponible en la red"):
     1. Open-Meteo Elevation API (Copernicus DEM 90 m) — rápida, con CORS.
     2. OpenTopoData (SRTM 90 m) — respaldo, 1 petición/s.
     3. Open-Elevation — último recurso (servicio inestable).
   Cada proveedor admite máx. 100 puntos por consulta, así que el perfil
   se pide por lotes. Si los tres fallan, la función lanza y el llamador
   sigue con el modelo plano (curvatura + obstáculo puntual).
   ========================================================================== */
(function(RF){
  "use strict";
  var N = 241;          // debe coincidir con el muestreo de RF.compute
  var BATCH = 100;      // límite de puntos por petición de los proveedores
  var TIMEOUT = 10000;  // ms por petición

  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  function fetchJSON(url, opts){
    var controller = new AbortController();
    var t = setTimeout(function(){ controller.abort(); }, TIMEOUT);
    opts = opts || {};
    opts.signal = controller.signal;
    return fetch(url, opts).then(function(r){
      if(!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).catch(function(e){
      if(e.name === "AbortError") throw new Error("tiempo de espera agotado");
      throw e;
    }).finally(function(){ clearTimeout(t); });
  }

  function chunks(arr, n){
    var out = [];
    for(var i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n));
    return out;
  }

  function checkBatch(vals, len){
    if(!Array.isArray(vals) || vals.length !== len) throw new Error("respuesta incompleta");
    vals.forEach(function(v){
      if(typeof v !== "number" || !isFinite(v)) throw new Error("elevación inválida");
    });
    return vals;
  }

  /* ---------- Proveedores: reciben un lote [{lat,lon}] y devuelven number[] ---------- */
  var PROVIDERS = [
    {
      name: "Open-Meteo",
      delay: 0,
      get: function(pts){
        var la = pts.map(function(p){ return p.lat.toFixed(5); }).join(",");
        var lo = pts.map(function(p){ return p.lon.toFixed(5); }).join(",");
        return fetchJSON("https://api.open-meteo.com/v1/elevation?latitude=" + la + "&longitude=" + lo)
          .then(function(d){ return checkBatch(d && d.elevation, pts.length); });
      }
    },
    {
      name: "OpenTopoData",
      delay: 1100, // límite público: 1 petición por segundo
      get: function(pts){
        var loc = pts.map(function(p){ return p.lat.toFixed(5) + "," + p.lon.toFixed(5); }).join("|");
        return fetchJSON("https://api.opentopodata.org/v1/srtm90m?locations=" + encodeURIComponent(loc))
          .then(function(d){
            if(!d || d.status !== "OK" || !Array.isArray(d.results)) throw new Error("respuesta inválida");
            return checkBatch(d.results.map(function(r){ return r.elevation; }), pts.length);
          });
      }
    },
    {
      name: "Open-Elevation",
      delay: 0,
      get: function(pts){
        return fetchJSON("https://api.open-elevation.com/api/v1/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locations: pts.map(function(p){ return { latitude:p.lat, longitude:p.lon }; }) })
        }).then(function(d){
          if(!d || !Array.isArray(d.results)) throw new Error("respuesta inválida");
          return checkBatch(d.results.map(function(r){ return r.elevation; }), pts.length);
        });
      }
    }
  ];

  // Pide todos los lotes a un proveedor, en serie (respeta límites de tasa).
  function fromProvider(prov, batches){
    var all = [];
    return batches.reduce(function(chain, b, i){
      return chain.then(function(){
        return (i > 0 && prov.delay ? sleep(prov.delay) : Promise.resolve())
          .then(function(){ return prov.get(b); })
          .then(function(vals){ all = all.concat(vals); });
      });
    }, Promise.resolve()).then(function(){ return all; });
  }

  // Nombre del proveedor que respondió en la última consulta exitosa.
  RF.elevationSource = null;

  // Devuelve una Promise<number[]> con N+1 elevaciones (msnm) equiespaciadas
  // entre A y B. Prueba cada proveedor en orden; lanza si todos fallan.
  RF.fetchElevationProfile = function(latA,lonA,latB,lonB){
    var pts = [];
    for(var i=0;i<=N;i++){
      pts.push(RF.lerpLatLon(latA,lonA,latB,lonB,i/N));
    }
    var batches = chunks(pts, BATCH);
    var errors = [];

    return PROVIDERS.reduce(function(chain, prov){
      return chain.catch(function(){
        return fromProvider(prov, batches).then(function(arr){
          if(arr.length !== N+1) throw new Error("respuesta incompleta");
          RF.elevationSource = prov.name;
          return arr;
        }).catch(function(e){
          errors.push(prov.name + ": " + e.message);
          if(window.console) console.warn("[elevation] " + prov.name + " falló:", e);
          throw e;
        });
      });
    }, Promise.reject()).catch(function(){
      RF.elevationSource = null;
      throw new Error("ninguna fuente respondió — " + errors.join("; "));
    });
  };
})(window.RF = window.RF || {});
