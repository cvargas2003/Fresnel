/* ==========================================================================
   geo.js — geodesia básica sobre una Tierra esférica.
   ========================================================================== */
(function(RF){
  "use strict";
  var R_EARTH_KM = 6371.0088;

  function rad(d){ return d*Math.PI/180; }
  function deg(r){ return r*180/Math.PI; }

  // Distancia ortodrómica entre dos puntos (fórmula de Haversine)
  RF.haversineKm = function(la1,lo1,la2,lo2){
    var dLat = rad(la2-la1), dLon = rad(lo2-lo1);
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(rad(la1))*Math.cos(rad(la2))*Math.sin(dLon/2)*Math.sin(dLon/2);
    return 2*R_EARTH_KM*Math.asin(Math.min(1,Math.sqrt(a)));
  };

  // Azimut (rumbo inicial) de A hacia B, en grados 0-360
  RF.bearingDeg = function(la1,lo1,la2,lo2){
    var y = Math.sin(rad(lo2-lo1))*Math.cos(rad(la2));
    var x = Math.cos(rad(la1))*Math.sin(rad(la2)) -
            Math.sin(rad(la1))*Math.cos(rad(la2))*Math.cos(rad(lo2-lo1));
    return (deg(Math.atan2(y,x))+360)%360;
  };

  // Punto intermedio a fracción t (0..1) del trayecto A→B (interpolación lineal
  // de lat/lon; suficientemente precisa para los tramos cortos típicos de un
  // radioenlace terrestre, donde no hace falta interpolación de gran círculo).
  RF.lerpLatLon = function(la1,lo1,la2,lo2,t){
    return { lat: la1+(la2-la1)*t, lon: lo1+(lo2-lo1)*t };
  };

  RF.R_EARTH_KM = R_EARTH_KM;
})(window.RF = window.RF || {});
