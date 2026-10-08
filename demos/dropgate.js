/* drop gate demo: the real line rules (points ranking, referral caps, trickle then drain,
   two-tier chat filter) running in your browser against a simulated crowd. time is sped up. */
window.DEMOS = window.DEMOS || {};
window.DEMOS.dropgate = function (el) {
  if (!document.getElementById("dm-dropgate-css")) {
    const st = document.createElement("style");
    st.id = "dm-dropgate-css";
    st.textContent = `
.dm-dropgate{max-width:440px;margin-inline:auto;font-family:var(--body);color:var(--ink)}
.dm-dropgate *{box-sizing:border-box}
.dm-dropgate .dg-label{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-family:var(--mono);font-size:11px;color:var(--ink-3);margin-bottom:8px}
.dm-dropgate .dg-label b{color:var(--red);font-weight:500}
.dm-dropgate .dg-phone{background:var(--card);border:1px solid var(--rule);border-radius:16px;overflow:hidden}
.dm-dropgate .dg-ann{background:var(--ink);color:var(--paper);text-align:center;font-size:12px;font-weight:600;padding:7px 10px}
.dm-dropgate .dg-hd{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:11px 14px;border-bottom:1px solid var(--rule);font-size:11.5px;color:var(--ink-2)}
.dm-dropgate .dg-hd b{font-family:var(--display);font-weight:800;font-size:16px;color:var(--ink);letter-spacing:-.01em}
.dm-dropgate .dg-hd b i{color:var(--red);font-style:normal;margin-right:3px}
.dm-dropgate .dg-hd span:last-child{text-align:right}
.dm-dropgate .mono{font-family:var(--mono)}
.dm-dropgate .dg-join{padding:44px 22px 40px;text-align:center;display:grid;gap:14px}
.dm-dropgate .dg-eb{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.dm-dropgate .dg-title{font-family:var(--mono);font-weight:700;font-size:clamp(22px,6vw,28px);margin:0}
.dm-dropgate .dg-sub{font-family:var(--mono);font-size:12px;color:var(--ink-3);line-height:1.6;margin:0}
.dm-dropgate .dg-field{display:flex;border:1px solid var(--ink);border-radius:2px;overflow:hidden;margin-top:6px}
.dm-dropgate .dg-field input{flex:1;min-width:0;font-family:var(--mono);font-size:16px;border:0;padding:12px;background:var(--paper);color:var(--ink)}
.dm-dropgate .dg-btn{font-family:var(--mono);font-weight:700;font-size:13px;border:0;background:var(--red);color:#fff;padding:0 16px;cursor:pointer}
.dm-dropgate .dg-err{font-family:var(--mono);font-size:12px;color:var(--red);min-height:16px}
.dm-dropgate .dg-note{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.dm-dropgate .dg-bar{background:var(--ink);color:var(--paper);padding:12px 14px 14px;display:grid;gap:10px}
.dm-dropgate .dg-phase{font-family:var(--mono);font-size:11.5px;opacity:.75}
.dm-dropgate .dg-main{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
.dm-dropgate .dg-you{display:flex;align-items:baseline;gap:8px}
.dm-dropgate .dg-you small{font-weight:800;font-size:12px;letter-spacing:.05em}
.dm-dropgate .dg-rank{font-family:var(--display);font-weight:800;font-size:44px;line-height:1;color:var(--red);font-variant-numeric:tabular-nums}
.dm-dropgate .dg-timer{text-align:right}
.dm-dropgate .dg-timer small{display:block;font-family:var(--mono);font-size:11px;opacity:.7}
.dm-dropgate .dg-timer b{font-family:var(--mono);font-size:28px;font-variant-numeric:tabular-nums}
.dm-dropgate .dg-timer b.urgent{color:var(--red)}
.dm-dropgate .dg-meta{display:flex;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:11.5px;opacity:.85}
.dm-dropgate .dg-meta span:last-child{margin-left:auto}
.dm-dropgate .dg-cta{font-family:var(--body);font-weight:700;font-size:14px;background:var(--red);color:#fff;border:0;border-radius:2px;padding:12px;cursor:pointer;width:100%}
.dm-dropgate .dg-cta:disabled{opacity:.55;cursor:not-allowed}
.dm-dropgate .dg-toast{font-family:var(--mono);font-size:11.5px;color:var(--paper);opacity:.85;min-height:15px}
.dm-dropgate .dg-lbt{display:flex;justify-content:space-between;align-items:baseline;padding:12px 14px 6px}
.dm-dropgate .dg-lbt h4{margin:0;font-family:var(--display);font-weight:800;font-size:15px}
.dm-dropgate .dg-lbt span{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.dm-dropgate ol{list-style:none;margin:0;padding:0 8px 8px}
.dm-dropgate ol li{display:grid;grid-template-columns:30px 1fr auto;gap:6px;padding:5px 6px;font-size:13px;border-radius:3px;align-items:center}
.dm-dropgate ol li:nth-child(-n+3){font-weight:700;background:var(--rule-2)}
.dm-dropgate ol li .n{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.dm-dropgate ol li .p{font-family:var(--mono);font-size:12px;font-variant-numeric:tabular-nums}
.dm-dropgate ol li.me{background:color-mix(in srgb,var(--red) 14%,transparent);color:var(--ink);font-weight:700}
.dm-dropgate ol li.gap{grid-template-columns:1fr;text-align:center;color:var(--ink-3);font-family:var(--mono);font-size:11px;padding:2px}
.dm-dropgate .dg-chat{border-top:2px solid var(--ink)}
.dm-dropgate .dg-ch{font-size:11.5px;font-weight:700;padding:9px 14px 4px}
.dm-dropgate .dg-ch b{color:var(--red);font-weight:500}
.dm-dropgate .dg-log{height:200px;overflow-y:auto;padding:0 14px 6px;font-size:13px;display:flex;flex-direction:column;gap:3px;overscroll-behavior:contain}
.dm-dropgate .dg-log div{overflow-wrap:anywhere}
.dm-dropgate .dg-log b{color:var(--red);margin-right:6px;font-weight:600}
.dm-dropgate .dg-log .mine b{color:var(--ink)}
.dm-dropgate .dg-log .ghost{opacity:.55}
.dm-dropgate .dg-log .ghost em{display:block;font-style:normal;font-family:var(--mono);font-size:10.5px;color:var(--red);opacity:1}
.dm-dropgate .dg-log .sys{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.dm-dropgate .dg-cf{display:flex;gap:8px;padding:8px 10px 10px;border-top:1px solid var(--rule)}
.dm-dropgate .dg-cf input{flex:1;min-width:0;font-size:16px;font-family:var(--body);border:1px solid var(--rule);border-radius:3px;padding:8px 10px;background:var(--paper);color:var(--ink)}
.dm-dropgate .dg-cf button{border:0;background:var(--ink);color:var(--paper);border-radius:3px;width:40px;cursor:pointer;font-size:16px}
.dm-dropgate .dg-tryhint{font-family:var(--mono);font-size:11px;color:var(--ink-3);padding:0 14px 12px}
.dm-dropgate .dg-tryhint button{font:inherit;color:var(--ink-2);background:none;border:1px dashed var(--rule);border-radius:3px;padding:1px 6px;cursor:pointer;margin:2px 2px 0 0}
.dm-dropgate .dg-in{padding:56px 22px;text-align:center;display:grid;gap:14px;justify-items:center}
.dm-dropgate .dg-in a,.dm-dropgate .dg-in button{font-family:var(--mono);font-weight:700;font-size:13px;text-decoration:none;border-radius:2px;padding:12px 18px;cursor:pointer}
.dm-dropgate .dg-in a{background:var(--red);color:#fff}
.dm-dropgate .dg-in button{background:transparent;border:1px solid var(--ink);color:var(--ink)}
.dm-dropgate input:focus-visible,.dm-dropgate button:focus-visible,.dm-dropgate a:focus-visible{outline:2px solid var(--red);outline-offset:2px}
`;
    document.head.appendChild(st);
  }

  /* ---------- real chat-filter.js logic (slur list left out of the public demo) ---------- */
  const MASK_ROOTS = ["fuck","shit","bitch","cunt","asshole","dickhead","motherfuck","bullshit","dumbass","jackass","pussy","bastard","slut","whore","prick","wanker","twat","bollocks","cock","douche"];
  const SCAM = ["scam","scammer","scammed","gotscammed","fraud","fraudulent","fake","faker","itsfake","notlegit","notreal","ripoff","rippedoff","ripped","sketchy","phishing","dontbuy","donotbuy","stolen","theystole","theytook","tookmymoney","stolemymoney"];
  const SHIPPING = ["nevershipped","didntship","dontship","doesntship","wontship","noship","theydontship","theynevership","neverarrived","didntarrive","neverarrive","neverreceived","didntreceive","wheresmyorder","whereismyorder","wheresmystuff","chargeback","disputecharge","stillwaiting","2weeks","monthnoship","slowshipping","badshipping"];
  const RESERVED = ["v2","velare","v2byvelare","admin","administrator","support","mod","moderator","official","staff","team","help","system"];
  const LEET = { "4":"a","@":"a","3":"e","1":"i","!":"i","0":"o","5":"s","$":"s","7":"t","+":"t","8":"b","9":"g","v":"u" };
  const LINK_RE = /(https?:\/\/|www\.)|(\b[a-z0-9-]{2,}\.(com|net|org|io|co|shop|store|xyz|link|gg|me|ly|info|biz|site|online|app|dev)\b)/i;
  const CONTACT_RE = /(venmo|cash\s?app|cashtag|paypal|pay\s?pal|zelle|\$[a-z0-9_]{3,})|(@[a-z0-9_]{3,})|(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b)|(\bdm\s*me\b|hit\s*me\s*up|text\s*me\b|\bdm\s*for\b)/i;
  const normBase = (t) => String(t).toLowerCase().split("").map((c) => LEET[c] ?? c).join("").replace(/[^a-z0-9]/g, "");
  const normalize = (t) => normBase(t).replace(/([a-z])\1{2,}/g, "$1");
  const _scam = SCAM.map(normBase), _ship = SHIPPING.map(normBase), _mask = MASK_ROOTS.map(normBase);
  function filterMessage(text) {
    const sliced = String(text).slice(0, 200), norm = normalize(sliced);
    if (LINK_RE.test(sliced)) return { action: "ghost", text: sliced, reason: "link" };
    if (CONTACT_RE.test(sliced)) return { action: "ghost", text: sliced, reason: "contact / payment" };
    if (_scam.some((t) => norm.includes(t))) return { action: "ghost", text: sliced, reason: "scam talk" };
    if (_ship.some((t) => norm.includes(t))) return { action: "ghost", text: sliced, reason: "shipping complaint" };
    let masked = false;
    const out = sliced.split(/(\s+)/).map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      const n = normalize(tok);
      if (_mask.some((r) => n.includes(r))) { masked = true; return "#".repeat(tok.length); }
      return tok;
    }).join("");
    return masked ? { action: "mask", text: out, reason: "profanity" } : { action: "allow", text: sliced, reason: null };
  }
  function validateUsername(raw) {
    const t = String(raw || "").trim();
    if (!t) return { ok: false, error: "pick a username" };
    const lower = t.toLowerCase();
    if (!/^[a-z0-9_.]{3,16}$/.test(lower)) return { ok: false, error: "3-16 chars, letters/numbers/_/. only" };
    if (lower.startsWith(".") || lower.endsWith(".") || lower.includes("..")) return { ok: false, error: "no leading/trailing or double dots" };
    if (RESERVED.includes(lower)) return { ok: false, error: "that name is reserved" };
    if (filterMessage(raw).action !== "allow") return { ok: false, error: "pick a different name" };
    return { ok: true, name: lower };
  }

  /* ---------- real config, time compressed ---------- */
  const CFG = {
    referralPts: 300, maxReferrals: 50, refVelocity: { max: 5, windowMs: 60000 },
    chat: { max: 5, windowMs: 10000 }, autoMuteAfter: 4,
    dropInMs: 80000,      // real: set per drop
    trickleLeadMs: 25000, // real: 7 min
    trickleRate: 2,       // real: 2 / sec
    capSec: 12,           // real: 80s to drain the whole line
  };
  const HANDLES = ["moodyangel","shoegazer","lvr_boy","staticbloom","2ndyou","forestwalk","dreampop","velaregirl","softboy","ghostgaze"];
  const SAY = ["who else locked in 😭","this line moving CRAZY","refer refer refer","need this drop fr","im not leaving this tab","💙💙","top 10 lets gooo","you're in line twin","so close to the front","first drop i actually made it to","the chat is unhinged rn","praying for a good spot","just referred 3 ppl lets go","this is so addicting","velare got us in a chokehold","climbing 📈","who tryna trade spots lol","been here since it opened","a second you fr","im so locked in its scary","chat is moving too fast","we eating good today"];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const byRank = (a, b) => b.points - a.points || a.joinTime - b.joinTime;
  const fmtClock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const fmtDur = (s) => (s < 60 ? s + "s" : Math.floor(s / 60) + "m " + (s % 60) + "s");

  let users, me, dropAt, timers = [], refTimes, chatTimes, strikes, chatLog;

  el.innerHTML = `<div class="dm-dropgate">
    <div class="dg-label"><span><b>●</b> simulated crowd · 150 fake people</span><span>time sped up</span></div>
    <div class="dg-phone">
      <div class="dg-ann">the line is live, lock in to hold your place 💙</div>
      <div class="dg-hd"><span>the line</span><b><i>*</i>v2byvelare</b><span>still becoming</span></div>
      <div data-dg-view></div>
    </div></div>`;
  const view = el.querySelector("[data-dg-view]");

  function stopAll() { timers.forEach(clearInterval); timers = []; }
  function every(ms, fn) { const id = setInterval(() => { if (!el.isConnected) return stopAll(); fn(); }, ms); timers.push(id); }

  function showJoin() {
    stopAll();
    view.innerHTML = `<form class="dg-join" novalidate>
      <div class="dg-eb">a second you</div>
      <h3 class="dg-title">the drop is loading.</h3>
      <p class="dg-sub">pick a name to hold your place in line. the longer you stay locked in, the higher you climb. leave, and you lose it.</p>
      <div class="dg-field"><input aria-label="pick a username" placeholder="pick a username" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="dg-btn" type="submit">join the line</button></div>
      <div class="dg-err" aria-live="polite"></div>
      <div class="dg-note">the real one texts you a 6-digit code first. skipped here.</div>
    </form>`;
    const f = view.querySelector("form"), inp = f.querySelector("input"), err = f.querySelector(".dg-err");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = validateUsername(inp.value);
      if (!v.ok) { err.textContent = v.error; return; }
      start(v.name);
    });
  }

  function start(name) {
    const now = Date.now();
    users = [];
    for (let i = 0; i < 150; i++) {
      users.push({ id: "b" + i, name: (HANDLES[i % 10] + i).slice(0, 16), bot: true, state: "queued",
        points: Math.floor(Math.pow(Math.random(), 1.8) * 1300), joinTime: now - Math.floor(Math.random() * 600000), referrals: 0 });
    }
    me = { id: "me", name, bot: false, state: "queued", points: 0, joinTime: now, referrals: 0 };
    users.push(me);
    dropAt = now + CFG.dropInMs; refTimes = []; chatTimes = []; strikes = 0; chatLog = [];
    renderQueue();
    for (let i = 0; i < 8; i++) pushChat(rand(users).name, rand(SAY));
    every(1000, tick);
    every(1200, () => { if (Math.random() < 0.75) { const b = rand(users.filter((u) => u.bot && u.state === "queued")); if (b) pushChat(b.name, rand(SAY)); } });
    every(1500, () => { const q = users.filter((u) => u.bot && u.state === "queued"); if (q.length) { const b = rand(q); if (b.referrals < CFG.maxReferrals) { b.points += CFG.referralPts; b.referrals++; } } });
  }

  function phase(now) {
    if (now < dropAt - CFG.trickleLeadMs) return "WAITING";
    if (now < dropAt) return "TRICKLE";
    return "DRAIN";
  }

  function tick() {
    const now = Date.now(), ph = phase(now);
    users.forEach((u) => { if (u.state === "queued") u.points += 1; });
    // admission: same rule as queue.js admitRate, with the drain window compressed
    const queued = users.filter((u) => u.state === "queued").sort(byRank);
    const rate = ph === "WAITING" ? 0 : ph === "TRICKLE" ? Math.min(queued.length, CFG.trickleRate) : Math.ceil(queued.length / CFG.capSec);
    queued.slice(0, rate).forEach((u) => { u.state = "admitted"; });
    if (me.state === "admitted") return showIn();
    update();
  }

  function renderQueue() {
    view.innerHTML = `
      <div class="dg-bar">
        <div class="dg-phase mono">v2byvelare · <span data-k="phase"></span></div>
        <div class="dg-main">
          <div class="dg-you"><small>YOU'RE</small><span class="dg-rank" data-k="rank">#–</span></div>
          <div class="dg-timer"><small data-k="tlabel">drop in</small><b data-k="timer">--:--</b></div>
        </div>
        <div class="dg-meta"><span><b data-k="pts">0</b> pts</span><span><b data-k="refs">0</b> referred</span><span data-k="waited">0s</span><span data-k="total"></span></div>
        <button class="dg-cta" type="button" data-k="cta">refer = jump the line ↗</button>
        <div class="dg-toast" data-k="toast" aria-live="polite"></div>
      </div>
      <div class="dg-lbt"><h4>the line</h4><span data-k="lt"></span></div>
      <ol data-k="lb" aria-label="leaderboard"></ol>
      <div class="dg-chat">
        <div class="dg-ch">chat <b>· everyone in line</b></div>
        <div class="dg-log" data-k="log" aria-live="off"></div>
        <form class="dg-cf"><input aria-label="chat message" placeholder="drop something…" maxlength="200" autocomplete="off"><button type="submit" aria-label="send">↑</button></form>
        <div class="dg-tryhint">try the filter: <button type="button">sc4m</button><button type="button">s c a m</button><button type="button">dm me for cheaper</button><button type="button">this fvcking line</button></div>
      </div>`;
    const k = (n) => view.querySelector(`[data-k="${n}"]`);
    k("cta").addEventListener("click", refer);
    const f = view.querySelector(".dg-cf"), inp = f.querySelector("input");
    f.addEventListener("submit", (e) => { e.preventDefault(); sendChat(inp.value); inp.value = ""; });
    view.querySelectorAll(".dg-tryhint button").forEach((b) => b.addEventListener("click", () => sendChat(b.textContent)));
    update();
  }

  function refer() {
    // the button stands in for "a friend joins from your link and verifies". same caps as the server.
    const now = Date.now();
    refTimes = refTimes.filter((t) => now - t < CFG.refVelocity.windowMs);
    const toast = view.querySelector('[data-k="toast"]');
    if (me.referrals >= CFG.maxReferrals) { toast.textContent = "referral cap hit (50)"; return; }
    if (refTimes.length >= CFG.refVelocity.max) { toast.textContent = "5 referrals a minute max. the real server holds the rest."; return; }
    refTimes.push(now); me.points += CFG.referralPts; me.referrals++;
    toast.textContent = "a friend joined from your link · +300";
    update();
  }

  function sendChat(raw) {
    const text = String(raw || "").trim();
    if (!text) return;
    const now = Date.now();
    chatTimes = chatTimes.filter((t) => now - t < CFG.chat.windowMs);
    if (chatTimes.length >= CFG.chat.max) { addLine({ sys: "slow down. 5 messages per 10 seconds." }); return; }
    chatTimes.push(now);
    const v = strikes >= CFG.autoMuteAfter ? { action: "ghost", text, reason: "auto-muted after 4 strikes" } : filterMessage(text);
    if (v.action === "ghost") {
      strikes++;
      addLine({ name: me.name, text: v.text, mine: true, ghost: v.reason });
    } else addLine({ name: me.name, text: v.text, mine: true });
  }

  function pushChat(name, text) { addLine({ name, text }); }
  function addLine(m) {
    chatLog.push(m); if (chatLog.length > 60) chatLog.shift();
    const log = view.querySelector('[data-k="log"]'); if (!log) return;
    const d = document.createElement("div");
    if (m.sys) { d.className = "sys"; d.textContent = m.sys; }
    else {
      d.className = (m.mine ? "mine" : "") + (m.ghost ? " ghost" : "");
      d.innerHTML = `<b>${esc(m.name)}</b>${esc(m.text)}${m.ghost ? `<em>muted (only you can see this) · ${esc(m.ghost)}</em>` : ""}`;
    }
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.appendChild(d);
    while (log.children.length > 60) log.firstChild.remove();
    if (atBottom || m.mine) log.scrollTop = log.scrollHeight;
  }

  function update() {
    const k = (n) => view.querySelector(`[data-k="${n}"]`);
    if (!k("rank")) return;
    const now = Date.now(), ph = phase(now);
    const board = users.filter((u) => u.state === "queued").sort(byRank);
    const myRank = board.indexOf(me) + 1;
    k("phase").textContent = ph === "WAITING" ? "the gate is closed, climb while you wait" : ph === "TRICKLE" ? "doors cracking, top of the line walking in" : "the line is moving, hold on, you're almost in";
    k("rank").textContent = myRank ? "#" + myRank : "#–";
    k("pts").textContent = me.points.toLocaleString();
    k("refs").textContent = me.referrals;
    k("waited").textContent = fmtDur(Math.floor((now - me.joinTime) / 1000));
    k("total").textContent = board.length + " in line";
    k("lt").textContent = board.length + " in line";
    const timer = k("timer");
    if (ph === "WAITING") { k("tlabel").textContent = "drop in"; timer.textContent = fmtClock(dropAt - now); timer.classList.toggle("urgent", dropAt - now < 30000); }
    else {
      const rate = ph === "TRICKLE" ? CFG.trickleRate : Math.max(1, Math.ceil(board.length / CFG.capSec));
      k("tlabel").textContent = "your eta"; timer.textContent = fmtClock(((myRank - 1) / rate) * 1000); timer.classList.add("urgent");
    }
    const top = board.slice(0, 10);
    let rows = top.map((u, i) => `<li class="${u === me ? "me" : ""}"><span class="n">${i + 1}</span><span>${esc(u.name)}${u === me ? " (you)" : ""}</span><span class="p">${u.points.toLocaleString()}</span></li>`).join("");
    if (myRank > 10) rows += `<li class="gap">· · ·</li><li class="me"><span class="n">${myRank}</span><span>${esc(me.name)} (you)</span><span class="p">${me.points.toLocaleString()}</span></li>`;
    k("lb").innerHTML = rows;
  }

  function showIn() {
    stopAll();
    view.innerHTML = `<div class="dg-in">
      <div class="dg-eb">a second you</div>
      <h3 class="dg-title">you're in. 💙</h3>
      <p class="dg-sub">you beat the line. the rest are still waiting. go.</p>
      <a href="https://v2byvelare.com" target="_blank" rel="noopener">enter the drop →</a>
      <button type="button">run it again</button>
      <p class="dg-note">in the real one this hands you a signed 5 minute entry token and sends you into the collection.</p>
    </div>`;
    view.querySelector("button").addEventListener("click", showJoin);
  }

  showJoin();
};
