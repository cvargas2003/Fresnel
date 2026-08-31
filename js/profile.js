/* ==========================================================================
   profile.js — dibuja el perfil vertical del enlace (línea de vista, primer
   elipsoide de Fresnel, umbral del 60% y superficie efectiva) como SVG.
   No usa ninguna librería de gráficos: se generan los <path>/<line> a mano
   a partir de las muestras que entrega RF.compute().
   ========================================================================== */
(function(RF){
  "use strict";

  function fmt(n,dp){ return isFinite(n) ? n.toFixed(dp===undefined?2:dp) : "—"; }
  function niceStep(raw){
    if(!isFinite(raw)||raw<=0) return 1;
    var e = Math.pow(10, Math.floor(Math.log10(raw))), n = raw/e;
    return (n<1.5?1:n<3.5?2:n<7.5?5:10)*e;
  }
  function trim(n){ return (Math.round(n*100)/100).toString(); }

  function tower(x,yBase,yTop,color,tag,h){
    var s = '<line x1="'+x.toFixed(1)+'" y1="'+yBase.toFixed(1)+'" x2="'+x.toFixed(1)+'" y2="'+yTop.toFixed(1)+'" stroke="'+color+'" stroke-width="2.6"/>';
    s += '<circle cx="'+x.toFixed(1)+'" cy="'+yTop.toFixed(1)+'" r="4" fill="'+color+'"/>';
    s += '<text x="'+(x).toFixed(1)+'" y="'+(yTop-11).toFixed(1)+'" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-size="13" font-weight="700" fill="'+color+'">'+tag+'</text>';
    s += '<text x="'+(x).toFixed(1)+'" y="'+(yBase+15).toFixed(1)+'" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10.5" fill="'+color+'">'+h+' m</text>';
    return s;
  }

  // svgEl: elemento <svg viewBox="0 0 1000 380">. res: salida de RF.compute().
  RF.drawProfile = function(svgEl, res){
    var W=1000,H=380,ML=58,MR=22,MT=18,MB=38;
    var PW=W-ML-MR, PH=H-MT-MB;
    var p=res.prof, d=res.d;

    var yMin=0,yMax=1;
    for(var i=0;i<p.length;i++){
      yMax = Math.max(yMax, p[i].los+p[i].r1, p[i].ground, res.v.hA, res.v.hB);
      yMin = Math.min(yMin, p[i].los-p[i].r1, p[i].ground, 0);
    }
    var span = yMax-yMin; yMax += span*0.10; yMin -= span*0.10; span = yMax-yMin;

    function X(km){ return ML + (d>0 ? km/d : 0)*PW; }
    function Y(m){ return MT + PH - ((m-yMin)/span)*PH; }

    var o=[];
    o.push('<rect x="'+ML+'" y="'+MT+'" width="'+PW+'" height="'+PH+'" fill="#FBFCFD" stroke="#DFE6EA"/>');

    var yStep = niceStep(span/6), yStart = Math.ceil(yMin/yStep)*yStep;
    for(var yv=yStart; yv<=yMax; yv+=yStep){
      var yy=Y(yv);
      o.push('<line x1="'+ML+'" y1="'+yy.toFixed(1)+'" x2="'+(ML+PW)+'" y2="'+yy.toFixed(1)+'" stroke="#EDF1F3"/>');
      o.push('<text x="'+(ML-8)+'" y="'+(yy+4).toFixed(1)+'" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="11" fill="#5A7080">'+Math.round(yv)+'</text>');
    }
    var xStep = niceStep(d/6);
    for(var xv=0; xv<=d+1e-9; xv+=xStep){
      var xx=X(xv);
      o.push('<line x1="'+xx.toFixed(1)+'" y1="'+MT+'" x2="'+xx.toFixed(1)+'" y2="'+(MT+PH)+'" stroke="#EDF1F3"/>');
      o.push('<text x="'+xx.toFixed(1)+'" y="'+(MT+PH+18)+'" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11" fill="#5A7080">'+trim(xv)+'</text>');
    }
    o.push('<text x="'+(ML-8)+'" y="'+(MT-4)+'" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10" fill="#5A7080">m</text>');
    o.push('<text x="'+(ML+PW)+'" y="'+(MT+PH+34)+'" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10" fill="#5A7080">km desde A</text>');

    var up="",dn="",lo60="";
    for(var j=0;j<p.length;j++){
      up += (j?"L":"M")+X(p[j].x).toFixed(1)+","+Y(p[j].los+p[j].r1).toFixed(1)+" ";
      lo60 += (j?"L":"M")+X(p[j].x).toFixed(1)+","+Y(p[j].los-0.6*p[j].r1).toFixed(1)+" ";
    }
    for(var m=p.length-1;m>=0;m--){
      dn += "L"+X(p[m].x).toFixed(1)+","+Y(p[m].los-p[m].r1).toFixed(1)+" ";
    }
    o.push('<path d="'+up+dn+'Z" fill="rgba(14,124,136,.13)" stroke="#0E7C88" stroke-width="1.4"/>');
    o.push('<path d="'+lo60+'" fill="none" stroke="#0E7C88" stroke-width="1.2" stroke-dasharray="2 3" opacity=".85"/>');

    var gp="";
    for(var g=0;g<p.length;g++){ gp += (g?"L":"M")+X(p[g].x).toFixed(1)+","+Y(p[g].ground).toFixed(1)+" "; }
    o.push('<path d="'+gp+'L'+(ML+PW)+','+(MT+PH)+' L'+ML+','+(MT+PH)+' Z" fill="#DCE3E7" stroke="#7C8F9B" stroke-width="1.4"/>');

    o.push('<line x1="'+X(0)+'" y1="'+Y(res.v.hA)+'" x2="'+X(d)+'" y2="'+Y(res.v.hB)+'" stroke="#C8860B" stroke-width="1.8" stroke-dasharray="7 4"/>');

    o.push(tower(X(0), Y(0), Y(res.v.hA), "#0E7C88", "A", res.v.hA));
    o.push(tower(X(d), Y(0), Y(res.v.hB), "#C8860B", "B", res.v.hB));

    var cx=X(res.crit.x);
    o.push('<line x1="'+cx.toFixed(1)+'" y1="'+Y(res.crit.los).toFixed(1)+'" x2="'+cx.toFixed(1)+'" y2="'+Y(res.crit.ground).toFixed(1)+'" stroke="#C23B33" stroke-width="1.6"/>');
    o.push('<circle cx="'+cx.toFixed(1)+'" cy="'+Y(res.crit.ground).toFixed(1)+'" r="3.2" fill="#C23B33"/>');
    var lblX = cx > ML+PW*0.7 ? cx-8 : cx+8;
    var anchor = cx > ML+PW*0.7 ? "end" : "start";
    o.push('<text x="'+lblX.toFixed(1)+'" y="'+(Y(res.crit.ground)-7).toFixed(1)+'" text-anchor="'+anchor+'" font-family="IBM Plex Mono,monospace" font-size="11.5" font-weight="600" fill="#C23B33">despeje '+fmt(res.crit.clr,1)+' m</text>');

    var exag = (PH/span)/(PW/(d*1000));
    o.push('<text x="'+(ML+6)+'" y="'+(MT+14)+'" font-family="IBM Plex Mono,monospace" font-size="10.5" fill="#5A7080">escala vertical ×'+Math.round(exag)+'</text>');

    svgEl.innerHTML = o.join("");
  };
})(window.RF = window.RF || {});
