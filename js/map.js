/* ==========================================================================
   map.js — mapa Leaflet: marcadores arrastrables de los sitios A/B, línea
   entre ellos y modo "fijar en el mapa" con un clic. Expone una API pequeña
   (RF.mapApi) para que app.js no dependa de los detalles de Leaflet.
   ========================================================================== */
(function(RF){
  "use strict";
  var map, mA, mB, line, pickMode = null;
  var onDragCb = null, onPickCb = null;

  RF.mapApi = {
    // elId: id del <div> contenedor. initial: {latA,lonA,latB,lonB}.
    // onDrag(site,lat,lon): llamado al arrastrar un marcador ("A" o "B").
    // onPick(site,lat,lon): llamado al fijar un sitio con un clic en el mapa.
    init: function(elId, initial, onDrag, onPick){
      onDragCb = onDrag; onPickCb = onPick;
      map = L.map(elId, {
        zoomControl:true
      }).setView([(initial.latA+initial.latB)/2, (initial.lonA+initial.lonB)/2], 11);

      // Mosaicos vía Wikimedia (datos de OpenStreetMap, sin necesidad de clave
      // de API) en vez del servidor crudo tile.openstreetmap.org: ese servidor
      // está pensado solo para uso muy ocasional y bloquea con 403
      // ("osm.wiki/Blocked") en cuanto detecta el tráfico repetido típico de
      // una app en desarrollo/pruebas.
      L.tileLayer("https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",{
        maxZoom:19,
        attribution:"&copy; OpenStreetMap contributors, tiles: Wikimedia"
      }).addTo(map);

      mA = L.marker([initial.latA,initial.lonA],{draggable:true,title:"Sitio A"})
             .addTo(map).bindTooltip("A",{permanent:true,direction:"top"});
      mB = L.marker([initial.latB,initial.lonB],{draggable:true,title:"Sitio B"})
             .addTo(map).bindTooltip("B",{permanent:true,direction:"top"});
      line = L.polyline([mA.getLatLng(),mB.getLatLng()],{color:"#0E7C88",weight:3,dashArray:"6 5"}).addTo(map);

      // OJO: escuchar solo "drag" (arrastre real del usuario), nunca "move".
      // "move" se dispara también con setLatLng() programático, y como
      // sync() más abajo llama setLatLng() para reflejar los inputs en el
      // mapa, escuchar "move" aquí crearía un ciclo infinito (arrastrar ->
      // recalcular -> setLatLng -> "move" -> recalcular -> ...).
      mA.on("drag", function(){ var p=mA.getLatLng(); onDragCb("A",p.lat,p.lng); });
      mB.on("drag", function(){ var p=mB.getLatLng(); onDragCb("B",p.lat,p.lng); });

      map.on("click", function(e){
        if(!pickMode) return;
        var site = pickMode;
        RF.mapApi.setPick(null);
        onPickCb(site, e.latlng.lat, e.latlng.lng);
      });
    },

    sync: function(v){
      if(!map) return;
      mA.setLatLng([v.latA,v.lonA]);
      mB.setLatLng([v.latB,v.lonB]);
      line.setLatLngs([[v.latA,v.lonA],[v.latB,v.lonB]]);
    },

    setPick: function(mode){
      pickMode = mode;
      if(!map) return;
      map.getContainer().style.cursor = mode ? "crosshair" : "";
    },
    getPick: function(){ return pickMode; },

    fitTo: function(latA,lonA,latB,lonB){
      if(!map) return;
      // invalidateSize() antes del primer fitBounds: si el contenedor cambió
      // de tamaño (o aún no tenía su tamaño final) desde que Leaflet lo midió
      // por última vez, fitBounds usaría ese tamaño viejo/cero en caché y
      // calcularía un zoom completamente equivocado (p. ej. el mundo entero).
      map.invalidateSize(false);
      map.fitBounds(L.latLngBounds([[latA,lonA],[latB,lonB]]).pad(0.35));
    },

    isReady: function(){ return !!map; }
  };
})(window.RF = window.RF || {});
