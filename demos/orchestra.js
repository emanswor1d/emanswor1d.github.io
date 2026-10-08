/* sales orchestra, embedded. ported from ~/sales-orchestra (index.html + server.js replay feed).
   the feed runs client side: replay of a ~$45k drop day, compressed to ~2.5 min at 1x. */
(function(){
window.DEMOS = window.DEMOS || {};

const CSS = `
.dm-orchestra{position:relative;width:100%;aspect-ratio:16/9;min-height:340px;max-height:640px;background:#080604;border-radius:6px;overflow:hidden;
  font-family:ui-monospace,"SF Mono",Menlo,monospace;color-scheme:dark;isolation:isolate}
.dm-orchestra canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.dm-orchestra .scrim{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(46% 42% at 50% 50%,rgba(8,6,4,.78) 0%,rgba(8,6,4,0) 70%)}
.dm-orchestra .vig{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 120% at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%)}
.dm-orchestra .stage{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;user-select:none;gap:2px;padding:0 16px;text-align:center}
.dm-orchestra .drop{font-size:11px;letter-spacing:.38em;text-transform:uppercase;color:rgba(255,196,140,.55);margin-bottom:8px}
.dm-orchestra .drop .clock{color:rgba(255,255,255,.28);letter-spacing:.2em}
.dm-orchestra .hero{font-weight:700;line-height:.95;letter-spacing:-.01em;color:#ffd9a0;font-variant-numeric:tabular-nums;
  text-shadow:0 0 28px rgba(255,150,70,.55),0 0 70px rgba(255,110,50,.3);transition:color .25s,text-shadow .25s}
.dm-orchestra .hero.mile{color:#ffe7b0;text-shadow:0 0 40px rgba(255,200,90,.95),0 0 120px rgba(255,160,60,.6)}
.dm-orchestra .velo{margin-top:12px;font-size:12px;letter-spacing:.14em;color:rgba(255,206,150,.6)}
.dm-orchestra .velo b{color:rgba(255,224,170,.92)}
.dm-orchestra .velo .dim{color:rgba(255,255,255,.22)}
.dm-orchestra .goalwrap{margin-top:18px;width:min(60%,460px)}
.dm-orchestra .goalbar{height:6px;border-radius:6px;background:rgba(255,180,120,.12);box-shadow:inset 0 0 0 1px rgba(255,180,120,.12);overflow:hidden}
.dm-orchestra .goalfill{height:100%;width:0;border-radius:6px;background:linear-gradient(90deg,rgba(255,140,60,.9),rgba(255,214,140,.96));box-shadow:0 0 18px rgba(255,160,70,.65)}
.dm-orchestra .goaltxt{margin-top:8px;font-size:11px;letter-spacing:.12em;color:rgba(255,206,150,.55)}
.dm-orchestra .goaltxt b{color:rgba(255,224,170,.92)}
.dm-orchestra .label{position:absolute;left:12px;top:10px;z-index:3;font-size:10.5px;letter-spacing:.14em;color:rgba(255,206,150,.5)}
.dm-orchestra .ctrls{position:absolute;right:10px;bottom:10px;z-index:4;display:flex;gap:6px}
.dm-orchestra .ctrls button,.dm-orchestra .gate button{font:inherit;font-size:11.5px;letter-spacing:.08em;cursor:pointer;border-radius:4px;
  background:rgba(20,14,10,.7);color:rgba(255,214,170,.85);border:1px solid rgba(255,180,120,.28);padding:5px 10px}
.dm-orchestra .ctrls button:hover,.dm-orchestra .gate button:hover{border-color:rgba(255,200,150,.7)}
.dm-orchestra .ctrls button[aria-pressed="true"]{background:rgba(255,190,130,.9);color:#1a0f08}
.dm-orchestra button:focus-visible{outline:2px solid #ffd9a0;outline-offset:2px}
.dm-orchestra .gate{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  background:radial-gradient(60% 60% at 50% 45%,rgba(21,16,11,.92) 0%,rgba(8,6,4,.96) 100%);color:rgba(255,210,165,.6);font-size:12px;letter-spacing:.16em;text-align:center;padding:16px;transition:opacity .6s}
.dm-orchestra .gate.gone{opacity:0;pointer-events:none}
.dm-orchestra .gate .big{font-size:18px;letter-spacing:.3em;color:rgba(255,200,150,.88)}
.dm-orchestra .gate .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.dm-orchestra .gate button.main{font-size:13px;padding:8px 16px;background:rgba(255,190,130,.92);color:#1a0f08;border-color:transparent}
@media (prefers-reduced-motion:reduce){.dm-orchestra .gate,.dm-orchestra .hero{transition:none}}
`;

const MILESTONES=[5000,10000,25000,50000,100000];
const GOAL=45000;
// real v2 catalog weights from server.js (value only, no PII)
const CATALOG=[[28,6],[46,4],[65,7],[68,12],[72,6],[74,5],[78,4],[120,2],[129,2],[87,8]];
const BASKET=CATALOG.reduce((s,[,w])=>s+w,0);
function pickItem(){ let r=Math.random()*BASKET; for(const [p,w] of CATALOG){ if((r-=w)<=0) return p; } return 68; }
const PAL=[[255,176,92],[255,138,110],[255,206,140],[236,120,130],[255,158,80]];
const SCALE=[146.83,164.81,185.00,220.00,246.94,293.66,329.63,369.99,440.00,493.88,587.33,659.25,739.99,880.00,987.77];

window.DEMOS.orchestra = function(el){
  if(!document.getElementById('dm-orchestra-css')){ const s=document.createElement('style'); s.id='dm-orchestra-css'; s.textContent=CSS; document.head.appendChild(s); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.innerHTML = `<div class="dm-orchestra" role="region" aria-label="sales orchestra demo, replay with simulated orders">
    <canvas aria-hidden="true"></canvas><div class="scrim"></div><div class="vig"></div>
    <div class="label">replay · simulated orders</div>
    <div class="stage" aria-live="off">
      <div class="drop">layer 04 <span class="clock">00:00</span></div>
      <div class="hero">$0</div>
      <div class="velo"><b>0</b> orders <span class="dim">·</span> <b>$0</b>/min</div>
      <div class="goalwrap"><div class="goalbar"><div class="goalfill"></div></div><div class="goaltxt">to <b>$45,000</b> · <b>0%</b></div></div>
    </div>
    <div class="ctrls">
      <button type="button" data-a="speed" aria-pressed="false" title="play 4x faster">4x</button>
      <button type="button" data-a="mute" aria-pressed="false">mute</button>
      <button type="button" data-a="restart">restart</button>
    </div>
    <div class="gate">
      <div class="big">v2 · drop day</div>
      <div>a $45k drop day, replayed in about 2 minutes</div>
      <div class="row"><button type="button" class="main" data-a="start">start (sound on)</button><button type="button" data-a="startq">start muted</button></div>
    </div>
  </div>`;
  const root=el.querySelector('.dm-orchestra'), canvas=root.querySelector('canvas'), ctx=canvas.getContext('2d');
  const heroEl=root.querySelector('.hero'), veloEl=root.querySelector('.velo'), clockEl=root.querySelector('.clock');
  const goalFill=root.querySelector('.goalfill'), goalTxt=root.querySelector('.goaltxt'), gate=root.querySelector('.gate');
  const btnSpeed=root.querySelector('[data-a=speed]'), btnMute=root.querySelector('[data-a=mute]');

  let W=1,H=1,DPR=Math.min(2,window.devicePixelRatio||1);
  function resize(){ const r=root.getBoundingClientRect(); W=canvas.width=Math.max(1,Math.floor(r.width*DPR)); H=canvas.height=Math.max(1,Math.floor(r.height*DPR));
    heroEl.style.fontSize=Math.max(40,Math.min(r.width*0.13,120))+'px'; }
  const ro=new ResizeObserver(()=>{ resize(); if(!running) drawFrame(0); }); ro.observe(root); resize();

  // ---- world ----
  let spots=[], labels=[], waves=[], lastSpot=null, swell=0, intensity=0;
  let revenue=0, orders=0, displayRev=0, nextMile=0, saleTimes=[];
  let simElapsed=0; // ms of replay time played (pauses offscreen)
  function makeRosette(scale){ const n=6+Math.floor(Math.random()*4), base=Math.random()*6.28, gap=Math.floor(Math.random()*n), ring=[], rad=scale*(0.9+Math.random()*0.4);
    for(let i=0;i<n;i++){ if(i===gap) continue; const a=base+(i/n)*6.28+(Math.random()-.5)*0.35, rr=rad*(0.82+Math.random()*0.3);
      ring.push({dx:Math.cos(a)*rr,dy:Math.sin(a)*rr,pr:scale*(0.2+Math.random()*0.12)}); } return ring; }
  function placeSpot(amount){ const v=Math.max(10,Math.min(amount,400)), norm=(v-10)/390, scale=(0.016+norm*0.045)*Math.min(W,H)*1.4;
    let x,y; if(lastSpot&&Math.random()<0.6){ const sp=scale*5+50*DPR; x=Math.min(W-20,Math.max(20,lastSpot.x+(Math.random()-.5)*sp*2)); y=Math.min(H-20,Math.max(20,lastSpot.y+(Math.random()-.5)*sp*2)); }
    else { x=(0.07+Math.random()*0.86)*W; y=(0.1+Math.random()*0.8)*H; }
    const col=PAL[Math.floor(Math.random()*PAL.length)];
    const s={x,y,scale,col,ring:makeRosette(scale),glow:reduce?0.2:1,settle:0.09+norm*0.14,from:lastSpot?{x:lastSpot.x,y:lastSpot.y}:null,thread:reduce?0:1};
    spots.push(s); if(spots.length>700) spots.splice(0,spots.length-700); lastSpot=s;
    if(!reduce && W/DPR>560){ labels.push({x,y:y-scale*1.8,text:'+$'+Math.round(amount),life:0,ttl:2.4,col}); if(labels.length>28) labels.shift(); } }
  function flare(level){ if(!reduce){ waves.push({r:0,life:0,ttl:2.2}); swell=Math.min(2,swell+1.2); }
    heroEl.classList.add('mile'); setTimeout(()=>heroEl.classList.remove('mile'),900); playChime(level); }

  function drawFrame(dt){
    const now=performance.now(), cut=now-60000;
    while(saleTimes.length&&saleTimes[0].t<cut) saleTimes.shift();
    const rev60=saleTimes.reduce((s,e)=>s+e.amt,0), ord60=saleTimes.length;
    intensity+=(Math.min(1,ord60/(45*speed))-intensity)*Math.min(1,dt*1.5); setAudioIntensity(intensity);
    const lift=0.05*swell+0.04*intensity;
    const bg=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,Math.max(W,H)*.8);
    bg.addColorStop(0,`rgb(${Math.round(20+lift*140)},${Math.round(14+lift*80)},${Math.round(10+lift*45)})`); bg.addColorStop(1,'#080604');
    ctx.globalCompositeOperation='source-over'; ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(const s of spots){ if(s.from&&s.thread>0.01){ s.thread-=dt*0.5; const [r,g,b]=s.col; ctx.strokeStyle=`rgba(${r},${g},${b},${0.1*s.thread})`; ctx.lineWidth=DPR; ctx.beginPath(); ctx.moveTo(s.from.x,s.from.y); ctx.lineTo(s.x,s.y); ctx.stroke(); } }
    for(const s of spots){ if(s.glow>0) s.glow=Math.max(0,s.glow-dt*0.5); const [r,g,b]=s.col, a=s.settle*(0.5+0.5*swell+0.3*intensity)+s.glow*0.75;
      for(const p of s.ring){ const px=s.x+p.dx,py=s.y+p.dy,pr=Math.max(1,p.pr), gr=ctx.createRadialGradient(px,py,0,px,py,pr);
        gr.addColorStop(0,`rgba(${r},${g},${b},${a})`); gr.addColorStop(.55,`rgba(${r},${g},${b},${a*0.4})`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(px,py,pr,0,6.28); ctx.fill(); }
      ctx.globalCompositeOperation='source-over'; const dc=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.scale*0.55);
      dc.addColorStop(0,`rgba(20,8,4,${0.5*(s.settle*4+s.glow)})`); dc.addColorStop(1,'rgba(20,8,4,0)'); ctx.fillStyle=dc; ctx.beginPath(); ctx.arc(s.x,s.y,s.scale*0.55,0,6.28); ctx.fill();
      ctx.globalCompositeOperation='lighter';
      if(s.glow>0.02){ const hr=s.scale*2.6, gr=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,hr); gr.addColorStop(0,`rgba(${r},${g},${b},${s.glow*0.45})`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(s.x,s.y,hr,0,6.28); ctx.fill(); } }
    for(let i=waves.length-1;i>=0;i--){ const w=waves[i]; w.life+=dt; const t=w.life/w.ttl; if(t>=1){ waves.splice(i,1); continue; } w.r=Math.max(W,H)*t*0.7;
      ctx.strokeStyle=`rgba(255,200,110,${(1-t)*0.5})`; ctx.lineWidth=(6*(1-t)+1)*DPR; ctx.beginPath(); ctx.arc(W/2,H/2,w.r,0,6.28); ctx.stroke(); }
    ctx.globalCompositeOperation='source-over';
    for(let i=labels.length-1;i>=0;i--){ const l=labels[i]; l.life+=dt; const t=l.life/l.ttl; if(t>=1){ labels.splice(i,1); continue; }
      const a=(t<0.18?t/0.18:1-(t-0.18)/0.82)*0.8, [r,g,b]=l.col; ctx.font=`600 ${Math.round(11*DPR)}px ui-monospace,Menlo,monospace`; ctx.textAlign='center';
      ctx.fillStyle=`rgba(${r},${g},${b},${a})`; ctx.fillText(l.text,l.x,l.y-t*16*DPR); }
    if(swell>0.001) swell=Math.max(0,swell-dt*0.5);
    displayRev = reduce ? revenue : displayRev+(revenue-displayRev)*Math.min(1,dt*4); if(revenue-displayRev<0.5) displayRev=revenue;
    heroEl.textContent='$'+Math.round(displayRev).toLocaleString();
    veloEl.innerHTML=`<b>${orders.toLocaleString()}</b> orders <span class="dim">·</span> <b>$${Math.round(rev60/speed).toLocaleString()}</b>/min`;
    const gp=Math.min(1,displayRev/GOAL); goalFill.style.width=(gp*100).toFixed(1)+'%';
    goalTxt.innerHTML = gp>=1 ? `<b>$45,000</b> · drop done 💙` : `to <b>$45,000</b> · <b>${Math.floor(gp*100)}%</b> · <b>$${Math.round(GOAL-displayRev).toLocaleString()}</b> to go`;
    const s=Math.floor(simElapsed/1000); clockEl.textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  }

  // ---- audio (same chain as the original: compressor, reverb wash, drone, cha-ching bells) ----
  let actx=null, master=null, wash=null, dry=null, droneFilt=null, noiseBuf=null, muted=false;
  function buildReverb(sec=4.6,dec=3.0){ const rate=actx.sampleRate,len=rate*sec,buf=actx.createBuffer(2,len,rate);
    for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,dec); } return buf; }
  function startAudio(){ if(actx) return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; actx=new AC();
    master=actx.createGain(); master.gain.value=0;
    const comp=actx.createDynamicsCompressor(); comp.threshold.value=-16; comp.knee.value=24; comp.ratio.value=4; comp.attack.value=0.003; comp.release.value=0.25;
    master.connect(comp).connect(actx.destination); master.gain.linearRampToValueAtTime(muted?0:0.8,actx.currentTime+2);
    noiseBuf=actx.createBuffer(1,Math.floor(actx.sampleRate*0.2),actx.sampleRate); { const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
    const conv=actx.createConvolver(); conv.buffer=buildReverb(); const ret=actx.createGain(); ret.gain.value=0.9; conv.connect(ret).connect(master); wash=conv;
    dry=actx.createGain(); dry.gain.value=0.32; dry.connect(master);
    const droneGain=actx.createGain(); droneGain.gain.value=0; droneGain.connect(conv); droneGain.connect(dry); droneGain.gain.linearRampToValueAtTime(0.05,actx.currentTime+6);
    droneFilt=actx.createBiquadFilter(); droneFilt.type='lowpass'; droneFilt.frequency.value=520; droneFilt.Q.value=0.7; droneFilt.connect(droneGain);
    const lfo=actx.createOscillator(), lg=actx.createGain(); lfo.frequency.value=0.045; lg.gain.value=260; lfo.connect(lg).connect(droneFilt.frequency); lfo.start();
    [73.42,110.0,146.83,220.0].forEach((f,i)=>{ const o=actx.createOscillator(); o.type=i<2?'sawtooth':'triangle'; o.frequency.value=f; o.detune.value=(i-1.5)*6; o.connect(droneFilt); o.start(); }); }
  function setAudioIntensity(x){ if(!droneFilt) return; droneFilt.frequency.setTargetAtTime(420+x*1700,actx.currentTime,0.5); }
  function audible(){ return actx && !muted && actx.state==='running'; }
  function playChime(){ if(!audible()) return; const t=actx.currentTime; [440,587.33,659.25,880].forEach((f,i)=>{ const o=actx.createOscillator(); o.type='triangle'; o.frequency.value=f*2;
    const g=actx.createGain(), tt=t+i*0.12; g.gain.setValueAtTime(0.0001,tt); g.gain.exponentialRampToValueAtTime(0.16,tt+0.02); g.gain.exponentialRampToValueAtTime(0.0001,tt+2.2);
    o.connect(g); g.connect(wash); g.connect(dry); o.start(tt); o.stop(tt+2.3); }); }
  function bell(freq,when,peak,dur){ [1,2.76,5.40].forEach((rt,i)=>{ const gains=[1,.5,.28], o=actx.createOscillator(); o.type='sine'; o.frequency.value=freq*rt;
    const g=actx.createGain(); g.gain.setValueAtTime(0.0001,when); g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak*gains[i]),when+0.004); g.gain.exponentialRampToValueAtTime(0.0001,when+dur*(1-i*0.18));
    o.connect(g); g.connect(dry); g.connect(wash); o.start(when); o.stop(when+dur+0.05); }); }
  function tick(when,peak){ if(!noiseBuf) return; const s=actx.createBufferSource(); s.buffer=noiseBuf; const hp=actx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=3500;
    const g=actx.createGain(); g.gain.setValueAtTime(peak,when); g.gain.exponentialRampToValueAtTime(0.0001,when+0.03); s.connect(hp).connect(g).connect(dry); s.start(when); s.stop(when+0.06); }
  function playChaChing(amount){ if(!audible()) return; const v=Math.max(10,Math.min(amount,400)), norm=(v-10)/390, sc=1/(1+intensity*1.4), f1=760*(0.92+(1-norm)*0.36), t=actx.currentTime+0.01;
    tick(t,0.05*sc); bell(f1,t,0.13*sc,0.5); const t2=t+0.085; tick(t2,0.045*sc); bell(f1*1.5,t2,0.16*sc,0.85); }

  // ---- feed: server.js startReplay(45000, 6min) compressed to 2.5 min ----
  const SPAN=150000, TARGET=45000;
  let booked=0, feedTimer=null, speed=1, done=false;
  function recordSale(amount){ placeSpot(amount); playChaChing(amount); revenue+=amount; orders+=1; saleTimes.push({t:performance.now(),amt:amount});
    while(nextMile<MILESTONES.length&&revenue>=MILESTONES[nextMile]){ flare(nextMile); nextMile++; } }
  function feedTick(){
    feedTimer=null; if(!running||done) return;
    const t=simElapsed/SPAN;
    if(t>=1||booked>=TARGET){ done=true; setTimeout(()=>{ if(done&&visible) restart(true); },8000); return; }
    const inten=Math.pow(1-t,1.7)*5+0.4, n=Math.random()<inten-Math.floor(inten)?Math.ceil(inten):Math.floor(inten);
    const amts=[]; for(let i=0;i<n;i++){ const a=pickItem(); if(booked+a>TARGET+60) break; booked+=a; amts.push(a); }
    const gap=(700+Math.random()*900)*(SPAN/360000);
    amts.forEach((a,i)=>setTimeout(()=>{ if(running) recordSale(a); },(i/Math.max(1,amts.length))*gap/speed));
    simElapsed+=gap; feedTimer=setTimeout(feedTick,gap/speed);
  }
  function restart(auto){
    spots=[]; labels=[]; waves=[]; lastSpot=null; revenue=0; orders=0; displayRev=0; nextMile=0; saleTimes=[]; booked=0; simElapsed=0; done=false;
    if(feedTimer){ clearTimeout(feedTimer); feedTimer=null; } if(running) feedTick(); if(!running) drawFrame(0);
  }

  // ---- loop with offscreen pause ----
  let started=false, running=false, visible=true, raf=0, prevT=performance.now();
  function loop(now){ const dt=Math.min(0.05,(now-prevT)/1000); prevT=now; drawFrame(dt); if(running) raf=requestAnimationFrame(loop); }
  function play(){ if(running||!started||!visible) return; running=true; prevT=performance.now(); raf=requestAnimationFrame(loop); if(!feedTimer&&!done) feedTick(); if(actx&&actx.state==='suspended') actx.resume(); }
  function pause(){ running=false; cancelAnimationFrame(raf); if(feedTimer){ clearTimeout(feedTimer); feedTimer=null; } if(actx&&actx.state==='running') actx.suspend(); }
  const io=new IntersectionObserver(es=>{ visible=es[0].isIntersecting; visible?play():pause(); },{threshold:0.15}); io.observe(root);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) pause(); else if(visible) play(); });

  function begin(withSound){ if(started) return; started=true; muted=!withSound; btnMute.setAttribute('aria-pressed',String(muted)); btnMute.textContent=muted?'sound on':'mute';
    if(withSound) startAudio(); gate.classList.add('gone'); restart(); play(); btnSpeed.focus(); }
  root.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; const a=b.dataset.a;
    if(a==='start') begin(true); else if(a==='startq') begin(false);
    else if(a==='speed'){ speed=speed===1?4:1; b.setAttribute('aria-pressed',String(speed===4)); if(running&&feedTimer){ clearTimeout(feedTimer); feedTimer=setTimeout(feedTick,50); } }
    else if(a==='mute'){ muted=!muted; if(!muted) startAudio(); if(master) master.gain.setTargetAtTime(muted?0:0.8,actx.currentTime,0.05);
      b.setAttribute('aria-pressed',String(muted)); b.textContent=muted?'sound on':'mute'; }
    else if(a==='restart'){ if(!started) begin(false); restart(); }
  });

  // resting frame: a few quiet rosettes so the panel isn't empty before start
  for(let i=0;i<26;i++){ placeSpot(pickItem()); } spots.forEach(s=>{ s.glow=0; s.thread=0; }); labels=[];
  drawFrame(0); // the real run starts clean: begin() calls restart()
};
})();
