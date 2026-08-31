/* ==========================================================================
   app.js — orquestación de la página principal: lee los inputs, llama a los
   módulos de cálculo (RF.compute, RF.linkBudget...), pinta los resultados y
   conecta los controles nuevos (terreno real, presupuesto de enlace,
   escenarios guardados, tema, impresión, logout).
   ========================================================================== */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var terrainData = null; // perfil real cacheado (null = usar modelo plano)

  /* ---------- Guardia de sesión ---------- */
  if(!RF.auth.isLoggedIn()){
    location.replace("index.html");
    return;
  }
  $("whoami").textContent = "admin";
  $("btnLogout").addEventListener("click", function(){
    RF.auth.logout();
    location.replace("index.html");
  });

  /* ---------- Tema ---------- */
  RF.theme.init();
  function paintThemeIcon(){
    var dark = RF.theme.get() === "dark";
    $("themeIcon").querySelector("use").setAttribute("href", dark ? "#i-sun" : "#i-moon");
    $("btnTheme").setAttribute("aria-label", dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
  }
  paintThemeIcon();
  $("btnTheme").addEventListener("click", function(){ RF.theme.toggle(); paintThemeIcon(); });

  /* ---------- Entradas ---------- */
  function readInputs(){
    var fu = parseFloat($("funit").value);
    var fHz = parseFloat($("freq").value)*fu;
    return {
      latA:parseFloat($("latA").value), lonA:parseFloat($("lonA").value), hA:parseFloat($("hA").value),
      latB:parseFloat($("latB").value), lonB:parseFloat($("lonB").value), hB:parseFloat($("hB").value),
      fHz:fHz, k:parseFloat($("kfac").value),
      obsOn:$("obsOn").checked, obsD:parseFloat($("obsD").value), obsH:parseFloat($("obsH").value),
      lbOn:$("lbOn").checked,
      ptxDbm:parseFloat($("ptx").value), gtxDbi:parseFloat($("gtx").value), grxDbi:parseFloat($("grx").value),
      lossDb:parseFloat($("lloss").value), rxSensDbm:parseFloat($("rxsens").value),
      terrainOn:$("terrainOn").checked,
      terrain: $("terrainOn").checked ? terrainData : null
    };
  }

  function validate(v){
    var e = [];
    if(!isFinite(v.latA)||!isFinite(v.latB)||Math.abs(v.latA)>90||Math.abs(v.latB)>90) e.push("Las latitudes deben estar entre -90 y 90.");
    if(!isFinite(v.lonA)||!isFinite(v.lonB)||Math.abs(v.lonA)>180||Math.abs(v.lonB)>180) e.push("Las longitudes deben estar entre -180 y 180.");
    if(!isFinite(v.hA)||!isFinite(v.hB)||v.hA<0||v.hB<0) e.push("Las alturas de torre deben ser números positivos.");
    if(!isFinite(v.fHz)||v.fHz<=0) e.push("La frecuencia debe ser mayor que cero.");
    if(v.lbOn && (!isFinite(v.ptxDbm)||!isFinite(v.gtxDbi)||!isFinite(v.grxDbi)||!isFinite(v.lossDb))) e.push("Completa los campos del presupuesto de enlace.");
    return e;
  }

  function fmt(n,dp){ return isFinite(n) ? n.toFixed(dp===undefined?2:dp) : "—"; }

  /* ---------- Veredicto ----------
     classify() centraliza el umbral del 60% de F1 (simplificación categórica
     de la curva continua de pérdida por difracción de la P.526 §4.1) para
     que el veredicto principal y la verificación con k crítico usen
     exactamente el mismo criterio. */
  function classify(r){
    if(r >= 1)   return { fg:"var(--ok)",    bg:"var(--ok-fill)",    icon:"i-check", state:"Despejado" };
    if(r >= 0.6) return { fg:"var(--ok)",    bg:"var(--ok-fill)",    icon:"i-check", state:"Apto" };
    if(r >= 0)   return { fg:"var(--amber)", bg:"var(--amber-fill)", icon:"i-warn",  state:"Marginal" };
    return           { fg:"var(--alert)", bg:"var(--alert-fill)", icon:"i-x",     state:"Obstruido" };
  }

  function paintVerdict(res, resCrit){
    var r = res.minRatio, c = classify(r), why;
    if(r >= 1){
      why = "El primer elipsoide está libre en su totalidad. El enlace se comporta como espacio libre.";
    }else if(r >= 0.6){
      why = "Queda libre el " + Math.round(r*100) + " % de F₁, por encima del 60 % recomendado por la UIT-R P.526.";
    }else if(r >= 0){
      why = "Solo el " + Math.round(r*100) + " % de F₁ está despejado. Hay pérdidas por difracción: sube las torres o reubica un extremo.";
    }else{
      why = "La obstrucción corta la línea de vista por " + fmt(-res.crit.clr,1) + " m. El enlace no es viable en esta configuración.";
    }
    var vi = $("vicon");
    vi.style.background = c.bg; vi.style.color = c.fg;
    var use = vi.querySelector("use"); if(use) use.setAttribute("href","#"+c.icon);
    $("vstate").textContent = c.state; $("vstate").style.color = c.fg;

    var extra = " Punto crítico a " + fmt(res.crit.x,2) + " km del sitio A.";
    if(res.beyondHorizon){
      extra += " Además, la distancia supera el horizonte radioeléctrico calculado (" + fmt(res.horizonKm,1) + " km): la curvatura terrestre ya limita la línea de vista.";
    }
    $("vwhy").textContent = why + extra;

    // Verificación adicional con k crítico de subrefracción (práctica de
    // diseño de la Rec. UIT-R P.530, que complementa a la P.526): si el k
    // seleccionado ya ES el crítico, no hay nada que agregar.
    var check = "";
    if(resCrit){
      var cc = classify(resCrit.minRatio);
      check = "Verificación con subrefracción (k=" + RF.SUBREFRACTION_K.toFixed(2) + "): " + cc.state +
              " (razón despeje/F₁ = " + fmt(resCrit.minRatio,2) + ").";
    }
    $("vcheck").textContent = check;
  }

  function paintReadouts(res, v){
    $("oDist").textContent  = fmt(res.d,3);
    $("oR1").textContent    = fmt(res.r1crit,2);
    $("oR60").textContent   = fmt(res.r1crit*0.6,2);
    $("oClr").textContent   = fmt(res.crit.clr,2);
    $("oRatio").textContent = fmt(res.minRatio,2);
    $("oAz").textContent    = fmt(res.az,1);
    $("oFspl").textContent  = fmt(res.fspl,1);
    $("oLam").textContent   = res.lam >= 1 ? fmt(res.lam,3) : fmt(res.lam,4);
    $("oHorizon").textContent = fmt(res.horizonKm,1);
    $("tileHorizon").classList.toggle("warn", !!res.beyondHorizon);
    $("oDiffLoss").textContent = fmt(res.diffLossDb,1);
    $("tileDiff").classList.toggle("warn", isFinite(res.diffLossDb) && res.diffLossDb>=6);

    if(v.lbOn){
      var lb = RF.linkBudget({ ptxDbm:v.ptxDbm, gtxDbi:v.gtxDbi, grxDbi:v.grxDbi, lossDb:v.lossDb, fsplDb:res.fspl, rxSensDbm:v.rxSensDbm });
      $("oPrx").textContent = fmt(lb.prx,1);
      $("oMargin").textContent = isFinite(lb.margin) ? fmt(lb.margin,1) : "—";
      $("tileMargin").classList.toggle("warn", isFinite(lb.margin) && lb.margin<0);
    }else{
      $("oPrx").textContent = "—"; $("oMargin").textContent = "—";
      $("tileMargin").classList.remove("warn");
    }
  }

  /* ---------- Orquestación principal ---------- */
  function run(fit){
    var v = readInputs();
    var errs = validate(v);
    var box = $("errbox");
    if(errs.length){ box.hidden=false; $("errtxt").textContent = errs.join(" "); return; }
    box.hidden = true;

    $("fhz").textContent = "= " + v.fHz.toLocaleString("es-CO",{maximumFractionDigits:0}) + " Hz";
    RF.mapApi.sync(v);
    var res = RF.compute(v);

    // Verificación adicional con k crítico de subrefracción (ver classify()
    // más abajo): reutiliza los mismos datos de entrada, solo cambia k.
    var resCrit = null;
    if(Math.abs(v.k - RF.SUBREFRACTION_K) > 1e-6){
      resCrit = RF.compute(Object.assign({}, v, { k: RF.SUBREFRACTION_K }));
    }

    paintVerdict(res, resCrit); paintReadouts(res, v); RF.drawProfile($("svg"), res);
    if(fit && RF.mapApi.isReady() && res.d>0){ RF.mapApi.fitTo(v.latA,v.lonA,v.latB,v.lonB); }
  }

  /* ---------- Terreno real (Open-Elevation) ---------- */
  function setTerrainStatus(msg, kind){
    var el = $("terrainStatus");
    el.textContent = msg;
    el.className = "hint" + (kind ? " "+kind : "");
  }
  function updateTerrain(){
    var v = readInputs();
    if(!isFinite(v.latA)||!isFinite(v.lonA)||!isFinite(v.latB)||!isFinite(v.lonB)) return;
    setTerrainStatus("Consultando elevación real…", "");
    RF.fetchElevationProfile(v.latA,v.lonA,v.latB,v.lonB).then(function(arr){
      terrainData = arr;
      setTerrainStatus("Terreno real cargado (" + arr.length + " muestras). Vuelve a pulsar Actualizar si mueves los sitios.", "ok-text");
      run(false);
    }).catch(function(err){
      terrainData = null;
      $("terrainOn").checked = false;
      setTerrainStatus("No se pudo obtener el terreno real (" + err.message + "). Se usa el modelo plano + curvatura.", "err-text");
      run(false);
    });
  }
  $("btnTerrainUpdate").addEventListener("click", updateTerrain);
  $("terrainOn").addEventListener("change", function(){
    if(this.checked && !terrainData){ updateTerrain(); } else { run(false); }
  });

  /* ---------- Escenarios guardados ---------- */
  function renderScenarios(){
    var list = RF.scenarios.list();
    var box = $("scenList");
    if(!list.length){ box.innerHTML = '<div class="hint">Aún no has guardado ningún escenario.</div>'; return; }
    box.innerHTML = list.map(function(s){
      var d = new Date(s.ts);
      var when = d.toLocaleDateString("es-CO") + " " + d.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});
      return '<div class="scen-row">' +
        '<div class="scen-info"><div class="scen-name">'+escapeHtml(s.name)+'</div><div class="hint">'+when+'</div></div>' +
        '<div class="scen-actions">' +
          '<button type="button" class="icon-btn ghost" data-load="'+encodeURIComponent(s.name)+'" title="Cargar"><svg class="ico"><use href="#i-load"/></svg></button>' +
          '<button type="button" class="icon-btn ghost" data-del="'+encodeURIComponent(s.name)+'" title="Eliminar"><svg class="ico"><use href="#i-trash"/></svg></button>' +
        '</div></div>';
    }).join("");
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }

  function applyScenario(inputs){
    ["latA","lonA","hA","latB","lonB","hB","freq","funit","kfac","obsD","obsH","ptx","gtx","grx","lloss","rxsens"].forEach(function(id){
      if(inputs[id] !== undefined) $(id).value = inputs[id];
    });
    $("obsOn").checked = !!inputs.obsOn; $("obsD").disabled = !inputs.obsOn; $("obsH").disabled = !inputs.obsOn;
    $("lbOn").checked = !!inputs.lbOn;
    ["ptx","gtx","grx","lloss","rxsens"].forEach(function(id){ $(id).disabled = !inputs.lbOn; });
    run(true);
  }

  $("btnScenSave").addEventListener("click", function(){
    var name = $("scenName").value.trim();
    if(!name){ $("scenName").focus(); return; }
    var fields = ["latA","lonA","hA","latB","lonB","hB","freq","funit","kfac","obsD","obsH","ptx","gtx","grx","lloss","rxsens"];
    var inputs = {}; fields.forEach(function(id){ inputs[id] = $(id).value; });
    inputs.obsOn = $("obsOn").checked; inputs.lbOn = $("lbOn").checked;
    RF.scenarios.save(name, inputs);
    $("scenName").value = "";
    renderScenarios();
  });
  $("scenList").addEventListener("click", function(e){
    var loadBtn = e.target.closest("[data-load]");
    var delBtn = e.target.closest("[data-del]");
    if(loadBtn){ applyScenario(RF.scenarios.load(decodeURIComponent(loadBtn.getAttribute("data-load")))); }
    if(delBtn){ RF.scenarios.remove(decodeURIComponent(delBtn.getAttribute("data-del"))); renderScenarios(); }
  });

  /* ---------- Imprimir informe ---------- */
  $("btnPrint").addEventListener("click", function(){ window.print(); });

  /* ---------- Eventos de los campos ---------- */
  ["latA","lonA","hA","latB","lonB","hB","freq","funit","kfac","obsD","obsH","ptx","gtx","grx","lloss","rxsens"].forEach(function(id){
    $(id).addEventListener("input", function(){ run(false); });
    $(id).addEventListener("change", function(){ run(false); });
  });
  $("obsOn").addEventListener("change", function(){
    var on = this.checked;
    $("obsD").disabled = !on; $("obsH").disabled = !on;
    run(false);
  });
  $("lbOn").addEventListener("change", function(){
    var on = this.checked;
    ["ptx","gtx","grx","lloss","rxsens"].forEach(function(id){ $(id).disabled = !on; });
    run(false);
  });
  $("btnCalc").addEventListener("click", function(){ run(true); });
  $("pickA").addEventListener("click", function(){ RF.mapApi.setPick(RF.mapApi.getPick()==="A"?null:"A"); syncPickButtons(); });
  $("pickB").addEventListener("click", function(){ RF.mapApi.setPick(RF.mapApi.getPick()==="B"?null:"B"); syncPickButtons(); });
  function syncPickButtons(){
    var mode = RF.mapApi.getPick();
    $("pickA").setAttribute("aria-pressed", mode==="A");
    $("pickB").setAttribute("aria-pressed", mode==="B");
  }
  $("btnSwap").addEventListener("click", function(){
    var t;
    t=$("latA").value; $("latA").value=$("latB").value; $("latB").value=t;
    t=$("lonA").value; $("lonA").value=$("lonB").value; $("lonB").value=t;
    t=$("hA").value;   $("hA").value=$("hB").value;     $("hB").value=t;
    terrainData = null; $("terrainOn").checked = false;
    run(true);
  });

  /* ---------- Arranque ---------- */
  var initial = { latA:parseFloat($("latA").value), lonA:parseFloat($("lonA").value),
                  latB:parseFloat($("latB").value), lonB:parseFloat($("lonB").value) };
  try{
    RF.mapApi.init("map", initial,
      function onDrag(site,lat,lon){
        $(site==="A"?"latA":"latB").value = lat.toFixed(5);
        $(site==="A"?"lonA":"lonB").value = lon.toFixed(5);
        run(false);
      },
      function onPick(site,lat,lon){
        $(site==="A"?"latA":"latB").value = lat.toFixed(5);
        $(site==="A"?"lonA":"lonB").value = lon.toFixed(5);
        syncPickButtons();
        run(false);
      });
  }catch(e){ /* sin red: la app sigue funcionando sin mapa */ }

  renderScenarios();
  run(true);
})();
