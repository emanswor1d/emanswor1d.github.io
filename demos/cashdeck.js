/* cash deck, playable. the weekly model is a straight port of ~/cashdeck/engine (drop.schedule, sim.run, solve.solve_cash_sized),
   with dates swapped for week numbers. sample numbers only. */
(function(){
window.DEMOS = window.DEMOS || {};

const CSS = `
.dm-cashdeck{font-family:var(--body);color:var(--ink);background:var(--card);border:1px solid var(--rule);border-radius:8px;padding:18px;display:grid;gap:16px}
.dm-cashdeck *{box-sizing:border-box}
.dm-cashdeck .top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline}
.dm-cashdeck .ttl{font-weight:600;font-size:15px}
.dm-cashdeck .smp{font-family:var(--mono);font-size:11.5px;color:var(--ink-3);border:1px dashed var(--rule);border-radius:3px;padding:1px 7px}
.dm-cashdeck .grid{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:22px;align-items:start}
@media (max-width:760px){.dm-cashdeck .grid{grid-template-columns:1fr}.dm-cashdeck .out{order:-1}}
.dm-cashdeck .ctl{display:grid;gap:12px}
.dm-cashdeck .f{display:grid;gap:4px}
.dm-cashdeck .f .lab{display:flex;justify-content:space-between;gap:8px;font-size:13.5px;color:var(--ink-2)}
.dm-cashdeck .f .lab b{font-family:var(--mono);font-weight:500;color:var(--ink);font-variant-numeric:tabular-nums}
.dm-cashdeck input[type=range]{width:100%;accent-color:var(--ink);margin:0}
.dm-cashdeck .seg{display:flex;gap:4px;background:var(--rule-2);padding:3px;border-radius:7px}
.dm-cashdeck .seg button{flex:1;font:inherit;font-size:13px;border:0;background:transparent;color:var(--ink-2);padding:6px 8px;border-radius:5px;cursor:pointer}
.dm-cashdeck .seg button[aria-pressed="true"]{background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.dm-cashdeck .out{display:grid;gap:14px;min-width:0}
.dm-cashdeck .kpis{display:flex;gap:10px 26px;flex-wrap:wrap;align-items:flex-end}
.dm-cashdeck .k .l{font-size:12.5px;color:var(--ink-3)}
.dm-cashdeck .k .v{font-size:26px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}
.dm-cashdeck .k .s{font-size:12px;color:var(--ink-3)}
.dm-cashdeck .pill{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;padding:4px 11px;border-radius:999px}
.dm-cashdeck .pill.ok{color:var(--green);background:color-mix(in srgb,var(--green) 13%,transparent)}
.dm-cashdeck .pill.bad{color:var(--red);background:color-mix(in srgb,var(--red) 12%,transparent)}
.dm-cashdeck .chart{width:100%;min-width:0}
.dm-cashdeck svg{width:100%;height:auto;display:block;overflow:visible}
.dm-cashdeck svg text{font-family:var(--mono);font-size:10.5px;fill:var(--ink-3)}
.dm-cashdeck .read{font-family:var(--mono);font-size:12px;color:var(--ink-2);min-height:1.5em}
.dm-cashdeck .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.dm-cashdeck .btn{font:inherit;font-size:13.5px;font-weight:500;background:var(--ink);color:var(--paper);border:0;border-radius:7px;padding:8px 14px;cursor:pointer}
.dm-cashdeck .btn.ghost{background:transparent;color:var(--ink-2);border:1px solid var(--rule)}
.dm-cashdeck .msg{font-size:13px;color:var(--ink-2)}
.dm-cashdeck .ass{font-size:12px;color:var(--ink-3);line-height:1.5}
.dm-cashdeck button:focus-visible,.dm-cashdeck input:focus-visible{outline:2px solid var(--red);outline-offset:2px}
`;

const A = { organic_net_per_day:220, organic_orders_per_day:2.6, proc_fee:0.035, reversal_rate:0.05, reversal_lag_weeks:2,
            fulfil_per_order:9, fixed_per_month:5500, ads_roas:2.5, ads_aov:95, sell_window_weeks:6, week1_share:0.55 };
const N = 16;           // weeks shown
const ORDER_W = 1;      // you place the factory order next week

// drop.schedule(), week-indexed
function schedule(p){
  const Z=()=>new Array(N).fill(0), inr=i=>i>=0&&i<N;
  const production=Z(), revenue=Z(), fulfil_orders=Z(), ads_spend=Z(), ads_revenue=Z(), lineup_rev=Z();
  const premade = p.mode==='premade' ? 1 : 0;
  const order_w=ORDER_W, dep_w=ORDER_W, land_w=ORDER_W+p.weeks, launch_w = premade ? land_w : ORDER_W+1;
  const prod_cost=p.qty*p.cost, premade_cost=prod_cost*premade, share=p.price?p.cost/p.price:0;
  const total=p.qty*p.price*p.st, avg_price=p.price;
  const curve=new Array(A.sell_window_weeks).fill(0);
  if(total){ curve[0]=A.week1_share*total; const rest=total-curve[0]; for(let k=1;k<curve.length;k++) curve[k]=rest/(curve.length-1); }
  curve.forEach((v,k)=>{ if(inr(launch_w+k)) lineup_rev[launch_w+k]+=v; });
  for(let k=0;k<A.sell_window_weeks;k++){ const i=launch_w+k; if(inr(i)){ ads_spend[i]+=p.ads; ads_revenue[i]+=p.ads*A.ads_roas; } }
  for(let i=0;i<N;i++){
    revenue[i]=lineup_rev[i]+ads_revenue[i];
    const lo=avg_price?lineup_rev[i]/avg_price:0, ao=A.ads_aov?ads_revenue[i]/A.ads_aov:0;
    fulfil_orders[i]+=lo*premade;
    const j=Math.max(i,land_w); if(inr(j)) fulfil_orders[j]+=lo*(1-premade)+ao;
  }
  if(premade_cost){ if(inr(dep_w)) production[dep_w]+=p.dep*premade_cost; if(inr(land_w)) production[land_w]+=(1-p.dep)*premade_cost; }
  let accrued=0, paid=0;
  for(let i=0;i<N;i++){
    const inc=(lineup_rev[i]*(1-premade)+ads_revenue[i])*share; accrued+=inc;
    if(i===dep_w && dep_w!==land_w){ const pay=Math.max(0,p.dep*accrued-paid); production[i]+=pay; paid+=pay; }
    if(i===land_w){ const pay=accrued-paid; production[i]+=pay; paid+=pay; }
    else if(i>land_w){ production[i]+=inc; paid+=inc; }
  }
  return {production,revenue,fulfil_orders,ads_spend,ads_revenue,dep_w,land_w,launch_w};
}

// sim.run(), model weeks only
function run(p){
  const s=schedule(p), fixed_wk=A.fixed_per_month*12/52, q=new Array(N+A.reversal_lag_weeks+1).fill(0);
  let cash=p.cash; const rows=[];
  for(let i=0;i<N;i++){
    const organic=A.organic_net_per_day*7, oo=A.organic_orders_per_day*7;
    const ads_rev=s.ads_revenue[i], drop_rev=s.revenue[i]-ads_rev;
    const fulfil=(oo+s.fulfil_orders[i])*A.fulfil_per_order;
    const sales=organic+drop_rev+ads_rev, fees=sales*A.proc_fee, reversals=q[i];
    q[i+A.reversal_lag_weeks]+=sales*A.reversal_rate;
    const inflow=organic+drop_rev+ads_rev, outflow=fixed_wk+s.production[i]+s.ads_spend[i]+fulfil+fees+reversals;
    const opening=cash; cash+=inflow-outflow;
    rows.push({i,opening,closing:cash,inflow,outflow,production:s.production[i],ads:s.ads_spend[i],sales});
  }
  let mn=rows[0]; rows.forEach(r=>{ if(r.closing<mn.closing) mn=r; });
  const breach=rows.find(r=>r.closing<p.floor);
  return {rows,s,min:mn.closing,minW:mn.i,breach:breach?breach.i:null,end:rows[N-1].closing,rev:rows.reduce((t,r)=>t+r.sales,0)};
}

// solve.solve_cash_sized(): biggest batch that keeps min cash >= floor
function solve(p){
  const ok=q=>run({...p,qty:q}).min>=p.floor;
  let lo=0, hi=3000;
  if(ok(hi)) return hi;
  if(!ok(0)) return 0;
  while(hi-lo>1){ const mid=Math.floor((lo+hi)/2); if(ok(mid)) lo=mid; else hi=mid; }
  return lo;
}

const FIELDS=[
  ['cash','cash today',0,60000,500,25000,v=>money(v)],
  ['qty','units to make',0,3000,10,900,v=>Math.round(v).toLocaleString()],
  ['cost','cost per unit, landed',5,60,1,22,v=>'$'+v],
  ['price','price',20,200,1,74,v=>'$'+v],
  ['dep','deposit to the factory',0,100,1,36,v=>v+'%'],
  ['weeks','weeks until it lands',1,12,1,5,v=>v+(v==1?' week':' weeks')],
  ['ads','ad spend per week',0,10000,100,1500,v=>money(v)],
  ['st','sell-through',10,100,1,85,v=>v+'%'],
  ['floor','cash floor',0,40000,500,8000,v=>money(v)]
];
function money(v){ const n=Math.round(v); return (n<0?'−$':'$')+Math.abs(n).toLocaleString(); }
function short(v){ const a=Math.abs(v), s=v<0?'−':''; return s+'$'+(a>=1000?(Math.round(a/100)/10)+'k':Math.round(a)); }

let uid=0;
window.DEMOS.cashdeck = function(el){
  if(!document.getElementById('dm-cashdeck-css')){ const s=document.createElement('style'); s.id='dm-cashdeck-css'; s.textContent=CSS; document.head.appendChild(s); }
  const id='dmcd'+(++uid);
  el.innerHTML=`<div class="dm-cashdeck" role="region" aria-label="cash deck simulator with sample numbers">
    <div class="top"><span class="ttl">will this drop leave enough cash?</span><span class="smp">sample numbers</span></div>
    <div class="grid">
      <div class="ctl">
        <div class="seg" role="group" aria-label="how you sell it">
          <button type="button" data-mode="premade" aria-pressed="true">premade</button>
          <button type="button" data-mode="preorder" aria-pressed="false">preorder</button>
        </div>
        ${FIELDS.map(f=>`<label class="f" for="${id}-${f[0]}"><span class="lab">${f[1]} <b id="${id}-${f[0]}-v"></b></span>
          <input type="range" id="${id}-${f[0]}" data-k="${f[0]}" min="${f[2]}" max="${f[3]}" step="${f[4]}" value="${f[5]}"></label>`).join('')}
      </div>
      <div class="out">
        <div class="kpis">
          <div class="k"><div class="l">lowest point</div><div class="v" data-o="min"></div><div class="s" data-o="minw"></div></div>
          <div class="k"><div class="l">cash after 16 weeks</div><div class="v" data-o="end"></div><div class="s" data-o="rev"></div></div>
          <div class="k"><span class="pill" data-o="pill"></span></div>
        </div>
        <div class="chart" data-o="chart"></div>
        <div class="read" data-o="read" aria-live="polite"></div>
        <div class="row"><button type="button" class="btn" data-a="solve">solve: most units without breaking the floor</button><button type="button" class="btn ghost" data-a="reset">reset</button><span class="msg" data-o="msg"></span></div>
        <div class="ass">also in the model: $220/day of normal sales, $5.5k/month fixed costs, 3.5% card fees, 5% refunds two weeks later, $9 to ship each order, ads return 2.5x. preorders get paid before the factory, premade pays the factory before a single sale.</div>
      </div>
    </div>
  </div>`;
  const root=el.querySelector('.dm-cashdeck'), o=k=>root.querySelector(`[data-o="${k}"]`);
  let mode='premade';
  const inputs={}; FIELDS.forEach(f=>inputs[f[0]]=root.querySelector(`#${id}-${f[0]}`));
  function params(){ const v=k=>+inputs[k].value; return {mode,cash:v('cash'),qty:v('qty'),cost:v('cost'),price:v('price'),dep:v('dep')/100,weeks:v('weeks'),ads:v('ads'),st:v('st')/100,floor:v('floor')}; }

  let last=null;
  function render(){
    FIELDS.forEach(f=>{ root.querySelector(`#${id}-${f[0]}-v`).textContent=f[6](+inputs[f[0]].value); });
    const p=params(), r=run(p); last={p,r};
    o('min').textContent=money(r.min); o('min').style.color = r.min<p.floor?'var(--red)':'';
    o('minw').textContent='week '+(r.minW+1);
    o('end').textContent=money(r.end); o('rev').textContent=short(r.rev)+' in sales';
    const pill=o('pill'); if(r.breach==null){ pill.className='pill ok'; pill.textContent='floor holds'; } else { pill.className='pill bad'; pill.textContent='floor breaks in week '+(r.breach+1); }
    drawChart(p,r); o('read').textContent='hover or tap a week to see it';
  }

  function drawChart(p,r){
    const Wd=640, Hd=240, L=48, R=10, T=14, B=34;
    const pts=[p.cash].concat(r.rows.map(x=>x.closing));
    let lo=Math.min(0,p.floor,...pts), hi=Math.max(p.floor,...pts); const padv=(hi-lo)*0.08||1000; lo-=padv; hi+=padv;
    const x=i=>L+(i/N)*(Wd-L-R), y=v=>T+(Hd-T-B)*(1-(v-lo)/(hi-lo));
    const step=niceStep((hi-lo)/4); let s=`<svg viewBox="0 0 ${Wd} ${Hd}" role="img" aria-label="cash by week for 16 weeks. lowest point ${money(r.min)} in week ${r.minW+1}.">`;
    for(let v=Math.ceil(lo/step)*step; v<=hi; v+=step){ s+=`<line x1="${L}" x2="${Wd-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--rule-2)"/><text x="${L-6}" y="${y(v)+3.5}" text-anchor="end">${short(v)}</text>`; }
    if(lo<0&&hi>0) s+=`<line x1="${L}" x2="${Wd-R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--ink-3)" stroke-width="1"/>`;
    for(let i=0;i<=N;i+=2) s+=`<text x="${x(i)}" y="${Hd-B+16}" text-anchor="middle">${i===0?'now':'w'+i}</text>`;
    s+=`<line x1="${L}" x2="${Wd-R}" y1="${y(p.floor)}" y2="${y(p.floor)}" stroke="var(--red)" stroke-dasharray="5 4" stroke-width="1.2"/><text x="${Wd-R}" y="${y(p.floor)-5}" text-anchor="end" style="fill:var(--red)">floor ${short(p.floor)}</text>`;
    s+=`<line x1="${x(0)}" x2="${x(0)}" y1="${T}" y2="${Hd-B}" stroke="var(--ink-3)" stroke-dasharray="2 3"/><text x="${x(0)+4}" y="${T+8}">today</text>`;
    const path=pts.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    s+=`<path d="${path} L${x(N)},${y(lo)} L${x(0)},${y(lo)} Z" fill="color-mix(in srgb, var(--ink) 6%, transparent)"/>`;
    s+=`<path d="${path}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>`;
    const mark=(w,label,col)=>{ if(w<0||w>=N) return ''; const xi=x(w+1), yi=y(r.rows[w].closing); return `<circle cx="${xi}" cy="${yi}" r="4" fill="${col}"/><text x="${xi}" y="${yi+16}" text-anchor="middle" style="fill:${col}">${label}</text>`; };
    s+=mark(r.s.dep_w,'deposit','var(--amber)');
    if(r.s.land_w!==r.s.dep_w) s+=mark(r.s.land_w,'lands','var(--amber)');
    if(r.s.launch_w!==r.s.land_w) s+=mark(r.s.launch_w,'launch','var(--green)');
    s+=`<circle cx="${x(r.minW+1)}" cy="${y(r.min)}" r="5" fill="none" stroke="${r.min<p.floor?'var(--red)':'var(--ink)'}" stroke-width="2"/>`;
    r.rows.forEach((w,i)=>{ s+=`<rect data-w="${i}" x="${x(i)}" y="${T}" width="${x(i+1)-x(i)}" height="${Hd-T-B}" fill="transparent" style="cursor:crosshair"/>`; });
    s+='</svg>'; o('chart').innerHTML=s;
  }
  function niceStep(raw){ const p=Math.pow(10,Math.floor(Math.log10(raw||1))), f=raw/p; return (f<1.5?1:f<3?2:f<7?5:10)*p; }

  o('chart').addEventListener('pointermove',e=>{ const t=e.target.closest('rect[data-w]'); if(!t||!last) return; const w=last.r.rows[+t.dataset.w];
    o('read').textContent=`week ${w.i+1}: in ${money(w.inflow)} · out ${money(w.outflow)}${w.production>1?` (factory ${money(w.production)})`:''} · cash ${money(w.closing)}`; });

  root.addEventListener('input',e=>{ if(e.target.matches('input[type=range]')){ o('msg').textContent=''; render(); } });
  root.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.mode){ mode=b.dataset.mode; root.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); o('msg').textContent=''; render(); }
    if(b.dataset.a==='solve'){ const p=params(); const q=solve(p); const max=+inputs.qty.max;
      const set=Math.min(max,q-(q%10)); inputs.qty.value=set; render();
      const base=run({...p,qty:0}).min;
      o('msg').textContent = base<p.floor ? 'the floor breaks even with 0 units. raise cash or lower the floor.'
        : q>=3000 ? '3,000+ units fit. cash isn\'t the limit here.' : `solved: about ${set.toLocaleString()} units is the most this cash can carry.`; }
    if(b.dataset.a==='reset'){ FIELDS.forEach(f=>inputs[f[0]].value=f[5]); mode='premade'; root.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.mode==='premade'))); o('msg').textContent=''; render(); }
  });
  render();
};
})();
