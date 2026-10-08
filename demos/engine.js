/* reach explorer: real per-reel numbers from the content engine's database (views, watch time, format, month only) */
(function(){
window.DEMOS = window.DEMOS || {};

const NAMES = {walk:"walk skit",hype:"hype",fitcheck:"fit check",compare:"compare",candid:"candid","talking-head":"talking head",scorecard:"scorecard",pricecheck:"price check",other:"other"};
const CSS = `
.dm-engine{display:grid;gap:16px;font-family:var(--body)}
.dm-engine .dm-chips{display:flex;flex-wrap:wrap;gap:6px}
.dm-engine .dm-c{font-family:var(--mono);font-size:12.5px;border:1px solid var(--rule);background:var(--card);color:var(--ink);border-radius:999px;padding:5px 11px;cursor:pointer}
.dm-engine .dm-c small{color:var(--ink-3);margin-left:5px;font-size:11px}
.dm-engine .dm-c[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.dm-engine .dm-c[aria-pressed="true"] small{color:var(--paper);opacity:.7}
.dm-engine .dm-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
@media (max-width:640px){.dm-engine .dm-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
.dm-engine .dm-s{background:var(--card);border:1px solid var(--rule);border-radius:6px;padding:10px 12px;display:grid;gap:2px;min-width:0}
.dm-engine .dm-s b{font-family:var(--display);font-stretch:110%;font-weight:800;font-size:clamp(19px,2.2vw,24px);letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.dm-engine .dm-s span{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.dm-engine .dm-chart{background:var(--card);border:1px solid var(--rule);border-radius:6px;padding:12px}
.dm-engine .dm-chart svg{width:100%;height:auto;display:block}
.dm-engine .dm-chart text{fill:var(--ink-3);font-family:var(--mono);font-size:10.5px}
.dm-engine .dm-cap{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-family:var(--mono);font-size:12px;color:var(--ink-2);margin-bottom:8px}
.dm-engine .dm-cap i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 5px 0 10px;vertical-align:-1px}
.dm-engine .dm-tablewrap{overflow-x:auto}
.dm-engine table{width:100%;border-collapse:collapse;font-size:14px;min-width:420px}
.dm-engine th,.dm-engine td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--rule);font-variant-numeric:tabular-nums}
.dm-engine th{font-family:var(--mono);font-weight:500;font-size:11.5px;color:var(--ink-3)}
.dm-engine td.n{text-align:right} .dm-engine th.n{text-align:right}
.dm-engine tr.sel td{background:var(--rule-2)}
.dm-engine .dm-bar{height:6px;background:var(--rule-2);border-radius:2px;min-width:60px}
.dm-engine .dm-bar div{height:100%;background:var(--ink);border-radius:2px}
.dm-engine .dm-theory{border:1px solid var(--rule);border-radius:6px;background:var(--card)}
.dm-engine .dm-theory button{width:100%;text-align:left;background:none;border:0;padding:12px 14px;cursor:pointer;font-family:var(--mono);font-size:12.5px;color:var(--ink);display:flex;justify-content:space-between;gap:10px}
.dm-engine .dm-theory .dm-tb{padding:0 14px 14px;display:grid;gap:10px;font-size:14.5px;color:var(--ink-2)}
.dm-engine .dm-vs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.dm-engine .dm-vs div{border:1px solid var(--rule);border-radius:4px;padding:10px;display:grid;gap:2px}
.dm-engine .dm-vs b{font-family:var(--display);font-weight:800;font-stretch:110%;font-size:20px;color:var(--ink)}
.dm-engine .dm-vs span{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.dm-engine .dm-src{font-family:var(--mono);font-size:11.5px;color:var(--ink-3)}
`;
function injectCSS(){ if (document.getElementById("dm-engine-css")) return; const s=document.createElement("style"); s.id="dm-engine-css"; s.textContent=CSS; document.head.appendChild(s); }
const med = a => { if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y), m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; };
const k = v => v>=1e6 ? parseFloat((v/1e6).toFixed(v>=1e7?0:2))+"M" : v>=1e3 ? parseFloat((v/1e3).toFixed(v>=1e5?0:1))+"k" : String(Math.round(v));

window.DEMOS.engine = function(el){
  injectCSS();
  el.classList.add("dm-engine");
  el.innerHTML = `<p class="dm-src">loading reel data…</p>`;
  fetch("demos/engine-data.json").then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }).then(data=>mount(el,data)).catch(()=>{
    el.innerHTML = `<p class="dm-src">couldn't load the reel data. refresh to try again.</p>`;
  });
};

function mount(el, data){
  const rows = data.rows.map(r=>({v:r[0], w:r[1], f:r[2], m:r[3]}));
  const allMed = med(rows.map(r=>r.v));
  const counts = {}; rows.forEach(r=>counts[r.f]=(counts[r.f]||0)+1);
  const fmts = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
  let sel = "all";

  el.innerHTML = `
    <div class="dm-chips" role="group" aria-label="filter by format">
      <button type="button" class="dm-c" data-f="all" aria-pressed="true">all reels<small>${rows.length}</small></button>
      ${fmts.map(f=>`<button type="button" class="dm-c" data-f="${f}" aria-pressed="false">${NAMES[f]||f}<small>${counts[f]}</small></button>`).join("")}
    </div>
    <div class="dm-stats" aria-live="polite">
      <div class="dm-s"><b id="dme-n">–</b><span>reels</span></div>
      <div class="dm-s"><b id="dme-med">–</b><span>median views</span></div>
      <div class="dm-s"><b id="dme-top">–</b><span>views from the top 10%</span></div>
      <div class="dm-s"><b id="dme-hit">–</b><span>hit 3x the median</span></div>
      <div class="dm-s"><b id="dme-max">–</b><span>best reel</span></div>
    </div>
    <div class="dm-chart">
      <div class="dm-cap"><span>how many reels landed at each view count · log scale</span><span><i style="background:var(--bar-a)"></i>all<i style="background:var(--ink)"></i><span id="dme-lbl">selected</span></span></div>
      <svg id="dme-svg" viewBox="0 0 640 230" role="img"></svg>
    </div>
    <div class="dm-tablewrap"><table>
      <thead><tr><th>format</th><th class="n">reels</th><th class="n">median views</th><th class="n">median watch</th><th>3x hit rate</th></tr></thead>
      <tbody id="dme-tb"></tbody></table></div>
    <div class="dm-theory">
      <button type="button" id="dme-tt" aria-expanded="false"><span>the theory the data killed</span><span aria-hidden="true">+</span></button>
      <div class="dm-tb" id="dme-tbody" hidden>
        <p>early on, my best reels all had two people on screen. 8 hand-picked reels made it look like the driver, so i almost built the whole engine around it.</p>
        <div class="dm-vs"><div><b>18,920</b><span>median views, 2 people (18 reels)</span></div><div><b>18,355</b><span>median views, solo (368 reels)</span></div></div>
        <p>at scale there's no difference. what does hold up: watch time predicts reach, and a person wearing the clothes beats product-only shots.</p>
        <span class="dm-src">from my content research pass over the engine's data, oct 2026. the people-count tags aren't in this public export.</span>
      </div>
    </div>
    <p class="dm-src">${rows.length} reels posted ${rows[0] ? "jun 2025 to jul 2026" : ""}. only views, watch time, format and month are exported here: no captions, comments or accounts. data stops in july when the instagram token expired.</p>`;
  const $ = s => el.querySelector(s);

  el.querySelector(".dm-chips").addEventListener("click", e=>{
    const b=e.target.closest(".dm-c"); if(!b) return; sel=b.dataset.f;
    el.querySelectorAll(".dm-c").forEach(x=>x.setAttribute("aria-pressed", x===b)); update();
  });
  $("#dme-tb").addEventListener("click", e=>{ const tr=e.target.closest("tr[data-f]"); if(!tr) return; el.querySelector(`.dm-c[data-f="${tr.dataset.f}"]`).click(); });
  $("#dme-tt").addEventListener("click", ()=>{ const o=$("#dme-tbody").hidden; $("#dme-tbody").hidden=!o; $("#dme-tt").setAttribute("aria-expanded",o); $("#dme-tt").lastElementChild.textContent=o?"−":"+"; });

  // table
  const stat = f => { const rs = f==="all"?rows:rows.filter(r=>r.f===f); const ws=rs.map(r=>r.w).filter(x=>x!=null);
    return {n:rs.length, med:med(rs.map(r=>r.v)), watch:ws.length?med(ws):null, hit:rs.filter(r=>r.v>=3*allMed).length/Math.max(1,rs.length), rs}; };
  const S = {}; ["all",...fmts].forEach(f=>S[f]=stat(f));
  const maxHit = Math.max(...fmts.map(f=>S[f].hit));
  function table(){
    const order = [...fmts].sort((a,b)=>S[b].med-S[a].med);
    $("#dme-tb").innerHTML = order.map(f=>`<tr data-f="${f}" class="${f===sel?"sel":""}" style="cursor:pointer"><td>${NAMES[f]||f}</td><td class="n">${S[f].n}</td><td class="n">${k(S[f].med)}</td><td class="n">${S[f].watch!=null?S[f].watch.toFixed(1)+"s":"–"}</td><td><div style="display:flex;gap:8px;align-items:center"><div class="dm-bar" style="flex:1"><div style="width:${(S[f].hit/maxHit*100).toFixed(0)}%"></div></div><span style="font-family:var(--mono);font-size:12px;min-width:34px;text-align:right">${Math.round(S[f].hit*100)}%</span></div></td></tr>`).join("");
  }

  // histogram on log10 bins
  const lo=2, hi=7, nb=25, bw=(hi-lo)/nb;
  const bin = v => Math.min(nb-1, Math.max(0, Math.floor((Math.log10(Math.max(v,100))-lo)/bw)));
  const allBins = Array(nb).fill(0); rows.forEach(r=>allBins[bin(r.v)]++);
  const ymax = Math.max(...allBins);
  function draw(){
    const W=640,H=230,L=34,R=8,T=10,B=28, cw=(W-L-R)/nb;
    const y=c=>T+(H-T-B)*(1-c/ymax);
    const selBins = Array(nb).fill(0); (sel==="all"?[]:S[sel].rs).forEach(r=>selBins[bin(r.v)]++);
    let s="";
    [0,Math.round(ymax/2),ymax].forEach(c=>{ s+=`<line x1="${L}" x2="${W-R}" y1="${y(c)}" y2="${y(c)}" stroke="var(--rule-2)"/><text x="${L-6}" y="${y(c)+3.5}" text-anchor="end">${c}</text>`; });
    allBins.forEach((c,i)=>{ if(c) s+=`<rect x="${L+i*cw+1}" y="${y(c)}" width="${cw-2}" height="${y(0)-y(c)}" fill="var(--bar-a)" rx="1"/>`; });
    selBins.forEach((c,i)=>{ if(c) s+=`<rect x="${L+i*cw+1}" y="${y(c)}" width="${cw-2}" height="${y(0)-y(c)}" fill="var(--ink)" rx="1"/>`; });
    [2,3,4,5,6,7].forEach(e=>{ const X=L+(e-lo)/(hi-lo)*(W-L-R); s+=`<text x="${X}" y="${H-10}" text-anchor="${e===lo?"start":e===hi?"end":"middle"}">${k(10**e)}</text>`; });
    const mx = L+(Math.log10(allMed)-lo)/(hi-lo)*(W-L-R);
    s+=`<line x1="${mx}" x2="${mx}" y1="${T}" y2="${y(0)}" stroke="var(--red)" stroke-dasharray="3 3"/><text x="${mx+4}" y="${T+10}" style="fill:var(--red)">median ${k(allMed)}</text>`;
    $("#dme-svg").innerHTML = s;
    $("#dme-svg").setAttribute("aria-label", `histogram of views per reel on a log scale, ${sel==="all"?"all formats":NAMES[sel]+" highlighted"}`);
  }

  function update(){
    const st = S[sel], vs = st.rs.map(r=>r.v).sort((a,b)=>b-a), top = Math.max(1,Math.floor(vs.length/10));
    const share = vs.slice(0,top).reduce((a,b)=>a+b,0)/Math.max(1,vs.reduce((a,b)=>a+b,0));
    $("#dme-n").textContent = st.n;
    $("#dme-med").textContent = k(st.med);
    $("#dme-top").textContent = Math.round(share*100)+"%";
    $("#dme-hit").textContent = Math.round(st.hit*100)+"%";
    $("#dme-max").textContent = k(vs[0]||0);
    $("#dme-lbl").textContent = sel==="all" ? "pick a format" : NAMES[sel];
    table(); draw();
  }
  update();
}
})();
