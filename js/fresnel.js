/* ==========================================================================
   fresnel.js — física del radioenlace: elipsoide de Fresnel, curvatura
   terrestre, pérdida en espacio libre, horizonte radioeléctrico, presupuesto
   de enlace, y la función compute() que arma el perfil completo del vano.

   Todas las funciones son puras (mismos argumentos -> mismo resultado, sin
   tocar el DOM) para poder probarlas sueltas desde la consola, p. ej.:
     RF.fresnelR1(5,5,5.8,10)  ->  radio F1 en el punto medio de un vano de 10 km
   ========================================================================== */
(function(RF){
  "use strict";
  var C = 299792458; // m/s, velocidad de la luz en el vacío

  // Radio del primer elipsoide de Fresnel (m). d1,d2,d en km; fGHz en GHz.
  // Fórmula de la Rec. UIT-R P.526: r1 = 17.32 * sqrt(d1*d2/(f*d))
  RF.fresnelR1 = function(d1,d2,fGHz,d){
    if(d<=0 || fGHz<=0) return 0;
    return 17.32*Math.sqrt((d1*d2)/(fGHz*d));
  };

  // Abultamiento de la Tierra (m) en un punto a distancias d1,d2 (km) de los
  // extremos de un vano de longitud d1+d2, con factor de radio equivalente k.
  RF.bulge = function(d1,d2,k){
    return (d1*d2)/(12.75*k);
  };

  // Pérdida en espacio libre (dB). dKm en km, fHz en Hz.
  RF.fspl = function(dKm,fHz){
    if(dKm<=0 || fHz<=0) return NaN;
    return 32.44 + 20*Math.log10(dKm) + 20*Math.log10(fHz/1e6);
  };

  RF.wavelength = function(fHz){
    return fHz>0 ? C/fHz : NaN;
  };

  // Horizonte radioeléctrico de una antena de altura h (m) con factor k
  // (distancia, en km, hasta donde la curvatura terrestre "esconde" el
  // horizonte visual, corregida por refracción atmosférica).
  RF.radioHorizonKm = function(hMeters,k){
    if(!isFinite(hMeters) || hMeters<=0 || !isFinite(k) || k<=0) return 0;
    return 3.57*Math.sqrt(k*hMeters);
  };

  // Presupuesto de enlace simplificado (todo en dB / dBm / dBi).
  // Prx = Ptx + Gtx + Grx - Lcable - FSPL   |   margen = Prx - sensibilidad
  RF.linkBudget = function(o){
    var prx = o.ptxDbm + o.gtxDbi + o.grxDbi - o.lossDb - o.fsplDb;
    var margin = isFinite(o.rxSensDbm) ? prx - o.rxSensDbm : NaN;
    return { prx:prx, margin:margin };
  };

  // Parámetro de difracción de Fresnel-Kirchhoff, ν (Rec. UIT-R P.526 §4.1).
  // hMeters: altura del obstáculo/terreno POR ENCIMA de la línea de vista, en
  // metros (positivo = obstruye, negativo = despejado). d1Km,d2Km: distancias
  // del punto al extremo A y B, en km. lam: longitud de onda, en metros.
  RF.fresnelKirchhoffNu = function(hMeters,d1Km,d2Km,lam){
    if(!isFinite(hMeters) || !isFinite(lam) || lam<=0 || d1Km<=0 || d2Km<=0) return NaN;
    var d1 = d1Km*1000, d2 = d2Km*1000; // a metros, para que las unidades cuadren con λ
    return hMeters*Math.sqrt((2/lam)*(1/d1+1/d2));
  };

  // Pérdida por difracción de un obstáculo tipo "filo de cuchillo" (Rec.
  // UIT-R P.526 §4.1), aproximación cerrada de J(ν) válida para ν > -0.7;
  // por debajo, la pérdida adicional es despreciable (el trayecto directo
  // ya está lo bastante lejos del obstáculo) y se reporta como 0 dB.
  RF.knifeEdgeLossDb = function(nu){
    if(!isFinite(nu)) return NaN;
    if(nu <= -0.7) return 0;
    var t = Math.sqrt((nu-0.1)*(nu-0.1)+1) + nu - 0.1;
    return 6.9 + 20*Math.log10(t);
  };

  /* ------------------------------------------------------------------------
     compute(v) — arma el perfil completo del vano y evalúa el criterio de
     despeje del 60% de F1 (Rec. UIT-R P.526).

     v = {
       latA,lonA,hA, latB,lonB,hB,      // sitios
       fHz, k,                          // radio y refracción
       obsOn,obsD,obsH,                 // obstáculo puntual opcional
       terrain: [m0..mN] | null         // perfil real opcional (elevación
                                         // absoluta, msnm, N+1 muestras
                                         // equiespaciadas de A a B)
     }
     ---------------------------------------------------------------------- */
  RF.compute = function(v){
    var d = RF.haversineKm(v.latA,v.lonA,v.latB,v.lonB); // km
    var fGHz = v.fHz/1e9;
    var lam = RF.wavelength(v.fHz);
    var N = 241, prof = [];
    var minRatio = Infinity, crit = null;

    var hasTerrain = Array.isArray(v.terrain) && v.terrain.length === N+1;
    var terrA = hasTerrain ? v.terrain[0] : 0;
    var terrB = hasTerrain ? v.terrain[N] : 0;

    for(var i=0;i<=N;i++){
      var x = d*i/N, d1 = x, d2 = d-x;
      var los = v.hA + (v.hB-v.hA)*(d>0 ? x/d : 0);
      var ground = RF.bulge(d1,d2,v.k);

      if(hasTerrain){
        // relieve real relativo a la cuerda recta entre las bases A y B
        var baseline = terrA + (terrB-terrA)*(d>0 ? x/d : 0);
        ground += (v.terrain[i] - baseline);
      }
      if(v.obsOn && isFinite(v.obsD) && isFinite(v.obsH)){
        var w = Math.max(d*0.02, 0.05); // obstáculo triangular, semiancho 2% del vano
        var t = 1 - Math.abs(x - v.obsD)/w;
        if(t>0) ground += v.obsH*t;
      }

      var r1 = RF.fresnelR1(d1,d2,fGHz,d);
      var clr = los - ground;
      prof.push({x:x, los:los, ground:ground, r1:r1, clr:clr});

      if(r1 > 0.05*RF.fresnelR1(d/2,d/2,fGHz,d)){ // ignora extremos donde r1->0
        var ratio = clr/r1;
        if(ratio < minRatio){ minRatio = ratio; crit = prof[prof.length-1]; }
      }
    }
    if(!crit){ crit = prof[Math.floor(N/2)]; minRatio = crit.clr/(crit.r1||1); }

    var horizonKm = RF.radioHorizonKm(v.hA,v.k) + RF.radioHorizonKm(v.hB,v.k);

    // Pérdida por difracción real (P.526 §4.1) en el punto crítico: h es la
    // altura del obstáculo/terreno por encima de la LOS, es decir -clr.
    var nu = RF.fresnelKirchhoffNu(-crit.clr, crit.x, d-crit.x, lam);
    var diffLossDb = RF.knifeEdgeLossDb(nu);

    return {
      d:d, fGHz:fGHz, lam:lam, prof:prof, crit:crit, minRatio:minRatio,
      r1max:RF.fresnelR1(d/2,d/2,fGHz,d),
      r1crit:crit.r1,
      az:RF.bearingDeg(v.latA,v.lonA,v.latB,v.lonB),
      fspl: RF.fspl(d, v.fHz),
      horizonKm: horizonKm,
      beyondHorizon: d>0 && horizonKm>0 && d > horizonKm,
      nu: nu,
      diffLossDb: diffLossDb,
      v:v
    };
  };

  // k-factor de subrefracción usado como "condición crítica" de referencia,
  // consistente con la práctica de diseño de la Rec. UIT-R P.530 (que
  // complementa a la P.526 para enlaces terrestres LOS): además del despeje
  // en condición promedio, se verifica un caso de refracción anómala.
  RF.SUBREFRACTION_K = 0.6667;

  RF.C = C;
})(window.RF = window.RF || {});
