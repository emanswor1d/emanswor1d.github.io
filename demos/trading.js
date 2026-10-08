/* prop-firm monte carlo, ported from my /propsim skill (Tradeify Select 50K rules) */
(function(){
window.DEMOS = window.DEMOS || {};

const ACCT = { size:50000, fee:159, target:2500, trail:2000, lockDelta:100, minDays:3, consistency:0.40 };
const PRESETS = {
  backtest:{label:"the flagship, as backtested", wr:58, win:1.19, loss:1, risk:0.5, tpd:0.62, days:105,
    note:"blind-test profit factor about 1.65 over 4 years of data. this is the version that convinced me."},
  real:{label:"the flagship, as it actually traded", wr:40, win:1.19, loss:1, risk:0.5, tpd:0.38, days:105,
    note:"5 months of forward testing, apr to sep 2026: 40 trades, 40% win rate, profit factor 0.79."},
  coin:{label:"coin flip", wr:50, win:1, loss:1, risk:0.5, tpd:1, days:105,
    note:"no edge at all. useful to see what pure luck looks like under these rules."}
};
const FIELDS = [
  ["wr","win rate","%",20,80,1],
  ["win","avg win","R",0.5,3,0.01],
  ["loss","avg loss","R",0.5,2,0.01],
  ["risk","risk per trade","% of 50k",0.1,2,0.05],
  ["tpd","trades per day","",0.1,4,0.01],
  ["days","days before you give up","",20,250,1]
];
const RUNS = 2000, PATHS = 40;

const CSS = `
.dm-trading{display:grid;gap:18px;font-family:var(--body)}
.dm-trading .dm-presets{display:flex;flex-wrap:wrap;gap:6px}
.dm-trading .dm-p{font-family:var(--mono);font-size:12.5px;border:1px solid var(--rule);background:var(--card);color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer}
.dm-trading .dm-p[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.dm-trading .dm-note{font-size:14px;color:var(--ink-2);min-height:1.5em}
.dm-trading .dm-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:20px}
@media (max-width:760px){.dm-trading .dm-grid{grid-template-columns:1fr}}
.dm-trading .dm-in{display:grid;gap:12px;align-content:start}
.dm-trading .dm-f{display:grid;gap:4px}
.dm-trading .dm-f label{display:flex;justify-content:space-between;gap:8px;font-family:var(--mono);font-size:12px;color:var(--ink-2)}
.dm-trading .dm-f output{color:var(--ink);font-variant-numeric:tabular-nums}
.dm-trading input[type=range]{width:100%;accent-color:var(--ink)}
.dm-trading .dm-pf{font-family:var(--mono);font-size:12px;color:var(--ink-3)}
.dm-trading .dm-run{font-family:var(--mono);font-size:13px;background:var(--ink);color:var(--paper);border:0;border-radius:4px;padding:9px 14px;cursor:pointer;justify-self:start}
.dm-trading .dm-run:disabled{opacity:.6;cursor:progress}
.dm-trading .dm-out{display:grid;gap:14px;min-width:0}
.dm-trading .dm-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
@media (max-width:520px){.dm-trading .dm-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
.dm-trading .dm-s{background:var(--card);border:1px solid var(--rule);border-radius:6px;padding:10px 12px;display:grid;gap:2px;min-width:0}
.dm-trading .dm-s b{font-family:var(--display);font-stretch:110%;font-weight:800;font-size:clamp(20px,2.4vw,26px);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.dm-trading .dm-s span{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.dm-trading .dm-s.good b{color:var(--green)} .dm-trading .dm-s.bad b{color:var(--red)}
.dm-trading .dm-chart{background:var(--card);border:1px solid var(--rule);border-radius:6px;padding:12px}
.dm-trading .dm-chart svg{width:100%;height:auto;display:block}
.dm-trading .dm-chart text{fill:var(--ink-3);font-family:var(--mono);font-size:10.5px}
.dm-trading .dm-verdict{border-left:2px solid var(--ink);padding:2px 0 2px 12px;font-size:15px;color:var(--ink)}
.dm-trading .dm-verdict.bad{border-color:var(--red)} .dm-trading .dm-verdict.good{border-color:var(--green)}
.dm-trading .dm-ev{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-family:var(--mono);font-size:12px;color:var(--ink-2)}
.dm-trading .dm-ev input{width:80px;font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--rule);border-radius:3px;padding:3px 6px}
`;
function injectCSS(){ if (document.getElementById("dm-trading-css")) return; const s=document.createElement("style"); s.id="dm-trading-css"; s.textContent=CSS; document.head.appendChild(s); }

// tiny seeded rng so a run is repeatable
function rng(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function poisson(lam, r){ const L=Math.exp(-lam); let k=0,p=1; do{ k++; p*=r(); }while(p>L); return k-1; }

// one eval attempt under Select 50K rules. returns {outcome, days, path}
function attempt(p, r, keepPath){
  const riskD = p.risk/100*ACCT.size;
  let eq=ACCT.size, peak=eq, floor=eq-ACCT.trail, locked=false, best=0, daysTraded=0;
  const path = keepPath ? [0] : null;
  for (let d=1; d<=p.days; d++){
    const n = poisson(p.tpd, r); let dayPnl=0;
    for (let i=0;i<n;i++){
      const pnl = r() < p.wr/100 ? p.win*riskD : -p.loss*riskD;
      eq += pnl; dayPnl += pnl;
      if (eq <= floor){ if(path) path.push(eq-ACCT.size); return {outcome:"blow", days:d, path}; }
    }
    if (n>0) daysTraded++;
    if (dayPnl>best) best=dayPnl;
    if (eq>peak) peak=eq;
    if (!locked){
      if (peak >= ACCT.size+ACCT.trail+ACCT.lockDelta){ locked=true; floor=ACCT.size+ACCT.lockDelta; }
      else floor = peak-ACCT.trail;
    }
    if (path) path.push(eq-ACCT.size);
    const profit = eq-ACCT.size;
    if (profit >= ACCT.target && daysTraded >= ACCT.minDays && best <= ACCT.consistency*profit) return {outcome:"pass", days:d, path};
  }
  return {outcome:"timeout", days:p.days, path};
}

function fmt$(v){ const s=Math.round(Math.abs(v)).toLocaleString("en-US"); return (v<0?"−$":"$")+s; }

window.DEMOS.trading = function(el){
  injectCSS();
  const state = Object.assign({}, PRESETS.backtest);
  let current = "backtest", job = 0, passValue = 1500, last = null;
  el.classList.add("dm-trading");
  el.innerHTML = `
    <div class="dm-presets" role="group" aria-label="presets">${Object.entries(PRESETS).map(([k,v])=>`<button type="button" class="dm-p" data-k="${k}" aria-pressed="${k===current}">${v.label}</button>`).join("")}</div>
    <p class="dm-note" id="dmt-note"></p>
    <div class="dm-grid">
      <div class="dm-in">
        ${FIELDS.map(f=>`<div class="dm-f"><label for="dmt-${f[0]}"><span>${f[1]}</span><output id="dmt-o-${f[0]}"></output></label><input type="range" id="dmt-${f[0]}" data-f="${f[0]}" min="${f[3]}" max="${f[4]}" step="${f[5]}"></div>`).join("")}
        <span class="dm-pf" id="dmt-pf"></span>
        <span class="dm-pf">rules: $50k account, pass at +$2,500, trailing drawdown $2,000, best day under 40% of profit, $159 to try. ${RUNS.toLocaleString()} simulated attempts per run.</span>
        <button type="button" class="dm-run" id="dmt-run">run ${RUNS.toLocaleString()} attempts</button>
      </div>
      <div class="dm-out">
        <div class="dm-stats">
          <div class="dm-s" id="dmt-pass"><b>–</b><span>pass</span></div>
          <div class="dm-s" id="dmt-blow"><b>–</b><span>blow the account</span></div>
          <div class="dm-s" id="dmt-time"><b>–</b><span>run out of time</span></div>
          <div class="dm-s" id="dmt-ev"><b>–</b><span>expected value per try</span></div>
        </div>
        <div class="dm-chart"><svg id="dmt-svg" viewBox="0 0 640 260" role="img" aria-label="simulated account paths"></svg></div>
        <div class="dm-ev"><label for="dmt-val">if a pass is worth</label><input id="dmt-val" type="number" min="0" step="100" value="${passValue}"><span>to you (a guess, change it)</span></div>
        <p class="dm-verdict" id="dmt-verdict" aria-live="polite"></p>
      </div>
    </div>`;
  const $ = s => el.querySelector(s);

  function syncInputs(){
    const F = {wr:v=>Math.round(v)+"%", win:v=>v.toFixed(2)+"R", loss:v=>v.toFixed(2)+"R", risk:v=>v.toFixed(2)+"%", tpd:v=>v.toFixed(2), days:v=>Math.round(v)+" days"};
    FIELDS.forEach(f=>{ const i=$("#dmt-"+f[0]); i.value=state[f[0]]; $("#dmt-o-"+f[0]).textContent = F[f[0]](+state[f[0]]); });
    const wr=state.wr/100, pf=(wr*state.win)/((1-wr)*state.loss);
    $("#dmt-pf").textContent = `profit factor ${pf.toFixed(2)} · ${fmt$(state.risk/100*ACCT.size)} risked per trade`;
    $("#dmt-note").textContent = current ? PRESETS[current].note : "custom settings.";
    el.querySelectorAll(".dm-p").forEach(b=>b.setAttribute("aria-pressed", b.dataset.k===current));
  }
  el.querySelector(".dm-presets").addEventListener("click", e=>{
    const b=e.target.closest(".dm-p"); if(!b) return;
    current=b.dataset.k; Object.assign(state, PRESETS[current]); syncInputs(); run();
  });
  el.querySelectorAll("input[type=range]").forEach(i=>i.addEventListener("input", ()=>{ state[i.dataset.f]=+i.value; current=null; syncInputs(); }));
  el.querySelectorAll("input[type=range]").forEach(i=>i.addEventListener("change", run));
  $("#dmt-run").addEventListener("click", run);
  $("#dmt-val").addEventListener("input", ()=>{ passValue=Math.max(0,+$("#dmt-val").value||0); if(last) showStats(last); });

  function run(){
    const my = ++job, p = Object.assign({}, state), r = rng(20260921);
    const res = {pass:0, blow:0, timeout:0, paths:[], days:p.days};
    $("#dmt-run").disabled = true; $("#dmt-run").textContent = "running…";
    let i = 0;
    function chunk(){
      if (my !== job) return;
      const end = Math.min(RUNS, i+250);
      for (; i<end; i++){ const a = attempt(p, r, i < PATHS); res[a.outcome]++; if (a.path) res.paths.push(a); }
      if (i < RUNS) requestAnimationFrame(chunk);
      else { last = res; showStats(res); draw(res); $("#dmt-run").disabled=false; $("#dmt-run").textContent=`run ${RUNS.toLocaleString()} attempts`; }
    }
    requestAnimationFrame(chunk);
  }

  function showStats(res){
    const pr=res.pass/RUNS, br=res.blow/RUNS, tr=res.timeout/RUNS, ev=pr*passValue-ACCT.fee;
    const set=(id,v,cls)=>{ const n=$(id); n.querySelector("b").textContent=v; n.className="dm-s"+(cls?" "+cls:""); };
    set("#dmt-pass",(pr*100).toFixed(1)+"%", pr>=0.5?"good":pr<0.1?"bad":"");
    set("#dmt-blow",(br*100).toFixed(1)+"%", br>=0.3?"bad":"");
    set("#dmt-time",(tr*100).toFixed(1)+"%", "");
    set("#dmt-ev",fmt$(ev), ev>0?"good":"bad");
    const v=$("#dmt-verdict");
    let msg, cls;
    const pf=(state.wr/100*state.win)/((1-state.wr/100)*state.loss);
    if (pf<1.05 && pf>0.95 && pr>=0.05){ msg=`zero edge still passes ${Math.round(pr*100)}% of the time. that's luck, and the firm prices it in: a funded account keeps the same odds, so it usually blows before it ever pays out.`; cls=""; }
    else if (pr>=0.5 && ev>0){ msg=`on paper this is a business. ${Math.round(pr*100)} of 100 tries pass. this is exactly what made me deploy it.`; cls="good"; }
    else if (pr<0.05){ msg=`this never gets there. ${Math.round(pr*1000)/10}% pass, and every try costs $159. in real life the flagship got 0 passes in 5 months and my kill rule shut it down.`; cls="bad"; }
    else if (ev<=0){ msg=`some tries pass, but not enough to pay for the ones that don't. you're paying the firm to gamble.`; cls="bad"; }
    else { msg=`positive, but thin. one bad stretch and the math flips.`; cls=""; }
    v.textContent=msg; v.className="dm-verdict "+cls;
  }

  function draw(res){
    const W=640,H=260,L=46,R=10,T=12,B=26, days=res.days;
    const lo=-ACCT.trail-300, hi=ACCT.target+800;
    const x=d=>L+d/days*(W-L-R), y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
    let s="";
    [-2000,-1000,0,1000,2000].forEach(v=>{ s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--rule-2)"/><text x="${L-6}" y="${y(v)+3.5}" text-anchor="end">${v>0?"+":""}${v/1000}k</text>`; });
    s+=`<line x1="${L}" x2="${W-R}" y1="${y(ACCT.target)}" y2="${y(ACCT.target)}" stroke="var(--green)" stroke-dasharray="4 4"/><text x="${W-R}" y="${y(ACCT.target)-5}" text-anchor="end" style="fill:var(--green)">pass +$2,500</text>`;
    s+=`<line x1="${L}" x2="${W-R}" y1="${y(-ACCT.trail)}" y2="${y(-ACCT.trail)}" stroke="var(--red)" stroke-dasharray="4 4"/><text x="${W-R}" y="${y(-ACCT.trail)+13}" text-anchor="end" style="fill:var(--red)">starting drawdown −$2,000</text>`;
    [0,Math.round(days/2),days].forEach((d,i)=>{ s+=`<text x="${x(d)}" y="${H-8}" text-anchor="${["start","middle","end"][i]}">day ${d}</text>`; });
    res.paths.forEach(a=>{
      const col = a.outcome==="pass"?"var(--green)":a.outcome==="blow"?"var(--red)":"var(--ink-3)";
      const pts = a.path.map((v,d)=>`${x(d).toFixed(1)},${y(Math.max(lo,Math.min(hi,v))).toFixed(1)}`).join(" ");
      s+=`<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.2" stroke-opacity=".55"/>`;
    });
    $("#dmt-svg").innerHTML = s;
    $("#dmt-svg").setAttribute("aria-label", `${PATHS} sample attempts: green passed, red blew the account, grey ran out of time`);
  }

  syncInputs(); run();
};
})();
