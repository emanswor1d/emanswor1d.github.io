/* preorder tracker demo: same ui + lookup rules as the live tracker on v2byvelare.com,
   running on 3 sample orders instead of the real shopify + google sheet backend. */
window.DEMOS = window.DEMOS || {};
window.DEMOS.preorder = function (el) {
  if (!document.getElementById("dm-preorder-css")) {
    const st = document.createElement("style");
    st.id = "dm-preorder-css";
    st.textContent = `
.dm-preorder{max-width:560px;margin-inline:auto;background:var(--card);border:1px solid var(--rule);border-radius:10px;padding:clamp(20px,4vw,36px);font-family:var(--body);color:var(--ink)}
.dm-preorder *{box-sizing:border-box}
.dm-preorder .pt-tag{display:inline-block;font-family:var(--mono);font-size:11px;color:var(--ink-3);border:1px dashed var(--rule);border-radius:3px;padding:2px 7px;margin-bottom:16px}
.dm-preorder .pt-eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);margin:0 0 8px}
.dm-preorder h3{font-family:var(--display);font-weight:800;font-stretch:115%;font-size:clamp(24px,5vw,30px);line-height:1.05;margin:0 0 6px;letter-spacing:-.02em}
.dm-preorder .pt-sub{font-size:14px;color:var(--ink-2);margin:0 0 22px}
.dm-preorder form{display:grid;gap:14px}
.dm-preorder label{display:grid;gap:6px}
.dm-preorder .pt-lab{font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3)}
.dm-preorder input{width:100%;font:inherit;font-size:16px;color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:4px;padding:11px 12px}
.dm-preorder input:focus-visible,.dm-preorder button:focus-visible{outline:2px solid var(--red);outline-offset:2px}
.dm-preorder .pt-go{font-family:var(--mono);font-size:14px;letter-spacing:.04em;background:var(--ink);color:var(--paper);border:0;border-radius:4px;padding:13px;cursor:pointer}
.dm-preorder .pt-hint{font-size:12px;color:var(--ink-3);margin:0}
.dm-preorder .pt-try{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.dm-preorder .pt-try button{font-family:var(--mono);font-size:11.5px;background:transparent;color:var(--ink-2);border:1px solid var(--rule);border-radius:999px;padding:4px 10px;cursor:pointer}
.dm-preorder .pt-try button:hover{border-color:var(--ink)}
.dm-preorder .pt-load{display:flex;gap:6px;justify-content:center;padding:36px 0}
.dm-preorder .pt-load span{width:7px;height:7px;border-radius:50%;background:var(--ink);animation:dmPtDot 1s infinite ease-in-out}
.dm-preorder .pt-load span:nth-child(2){animation-delay:.15s}.dm-preorder .pt-load span:nth-child(3){animation-delay:.3s}
@keyframes dmPtDot{0%,100%{opacity:.25}50%{opacity:1}}
.dm-preorder .pt-err{display:grid;gap:12px;padding:6px 0}
.dm-preorder .pt-err p{margin:0;font-size:15px}
.dm-preorder .pt-why{font-family:var(--mono);font-size:11.5px;color:var(--ink-3);border-left:2px solid var(--red);padding-left:10px}
.dm-preorder .pt-again{justify-self:start;font-family:var(--mono);font-size:12.5px;background:transparent;color:var(--ink);border:1px solid var(--ink);border-radius:4px;padding:8px 14px;cursor:pointer}
.dm-preorder .pt-order{font-family:var(--mono);font-size:12px;color:var(--ink-3);letter-spacing:.1em;text-transform:uppercase;margin:0 0 14px}
.dm-preorder .pt-prods{display:grid;gap:16px;margin-bottom:18px}
.dm-preorder .pt-card{border:1px solid var(--rule);border-radius:8px;padding:16px;display:grid;gap:14px;background:var(--paper)}
.dm-preorder .pt-top{display:flex;gap:12px;align-items:center}
.dm-preorder .pt-top img{width:54px;height:66px;object-fit:cover;border-radius:4px;background:var(--rule-2);flex:none}
.dm-preorder .pt-meta{min-width:0}
.dm-preorder .pt-title{font-weight:600;font-size:15px}
.dm-preorder .pt-color{font-size:13px;color:var(--ink-2)}
.dm-preorder .pt-eta{font-family:var(--mono);font-size:12px;color:var(--ink);margin-top:2px}
.dm-preorder .pt-bar{height:3px;background:var(--rule);border-radius:3px;overflow:hidden}
.dm-preorder .pt-fill{height:100%;width:0;background:var(--ink);transition:width 1.2s cubic-bezier(.4,0,.2,1)}
.dm-preorder .pt-pct{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin-top:-6px}
.dm-preorder ol{list-style:none;margin:0;padding:0;display:grid}
.dm-preorder li{display:flex;gap:12px;align-items:flex-start;position:relative;padding-bottom:14px}
.dm-preorder li:last-child{padding-bottom:0}
.dm-preorder li::after{content:"";position:absolute;left:10px;top:22px;bottom:0;width:1.5px;background:var(--rule)}
.dm-preorder li:last-child::after{display:none}
.dm-preorder li.done::after{background:var(--ink-3)}
.dm-preorder .pt-node{width:22px;height:22px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--rule);background:var(--paper);position:relative;z-index:1}
.dm-preorder li.done .pt-node,.dm-preorder li.now .pt-node{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.dm-preorder li.now .pt-node{box-shadow:0 0 0 4px color-mix(in srgb,var(--ink) 14%,transparent)}
.dm-preorder li.now .pt-node i{width:6px;height:6px;border-radius:50%;background:var(--paper);animation:dmPtDot 1.6s infinite}
.dm-preorder .pt-sn{font-size:13.5px;font-weight:600;text-transform:lowercase;line-height:1.3}
.dm-preorder .pt-sd{font-size:11.5px;color:var(--ink-3)}
.dm-preorder li.done .pt-sn{font-weight:500;color:var(--ink-2)}
.dm-preorder li.todo .pt-sn{font-weight:400;color:var(--ink-3)}
.dm-preorder li.todo .pt-sd{opacity:.6}
.dm-preorder .pt-delay{font-size:12.5px;color:var(--ink-2);background:color-mix(in srgb,var(--amber) 14%,transparent);border-radius:4px;padding:8px 10px}
.dm-preorder .pt-ship{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--green)}
@media (prefers-reduced-motion:reduce){.dm-preorder *{animation:none!important;transition:none!important}}
`;
    document.head.appendChild(st);
  }

  // same 8 stages the live store uses
  const STAGES = [
    ["order confirmed", "your preorder is locked in"],
    ["fabric sourcing", "materials being selected + ordered"],
    ["cutting", "patterns laid out + fabric cut"],
    ["stitching", "pieces being sewn together"],
    ["finishing", "details, hardware, final touches"],
    ["in transit to us", "on the way from production"],
    ["processing & packing", "quality check, labels, packaging"],
    ["shipped", "tracking link sent via sms"],
  ];
  // sample orders. made up numbers and emails, real v2 products.
  const ORDERS = {
    "1042": { email: "demo@v2.com", products: [
      { title: "noire hoodie", colorway: "grey", img: "img/brand-02.jpg", stage: 4, eta: "est. ships late october" },
      { title: "noire set", colorway: "grey", img: "img/brand-03.jpg", stage: 4, eta: "est. ships late october" },
      { title: "thorned belt", colorway: "black", img: "", in_stock: true },
    ]},
    "1043": { email: "sam@v2.com", products: [
      { title: "anorak jacket", colorway: "sand", img: "img/brand-14.jpg", stage: 2, eta: "est. ships mid november",
        delay: "the fabric mill pushed us back 5 days. still on track for november :)" },
    ]},
    "1044": { email: "jules@v2.com", products: [
      { title: "rainline windbreaker", colorway: "red", img: "img/brand-13.jpg", stage: 6, eta: "lands with us next week" },
    ]},
  };
  const ERR = "we couldn't find that order. double-check your order number + email from your confirmation, then try again.";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  el.innerHTML = `<div class="dm-preorder">
    <span class="pt-tag">sample orders · no real customer data</span>
    <p class="pt-eyebrow">preorder status</p>
    <h3>where's my order?</h3>
    <p class="pt-sub">enter your order details below to track each item.</p>
    <div data-pt-view></div>
  </div>`;
  const view = el.querySelector("[data-pt-view]");

  function showForm(prefill) {
    view.innerHTML = `<form novalidate>
      <label><span class="pt-lab">order number</span><input name="order" placeholder="#1042" autocomplete="off" value="${esc(prefill ? prefill[0] : "")}"></label>
      <label><span class="pt-lab">email on order</span><input name="email" type="email" placeholder="you@email.com" autocomplete="off" value="${esc(prefill ? prefill[1] : "")}"></label>
      <button class="pt-go" type="submit">check status →</button>
      <p class="pt-hint">we'll show production status for each item in your order.</p>
      <div class="pt-try" role="group" aria-label="sample orders">
        <button type="button" data-o="#1042" data-e="demo@v2.com">#1042 · demo@v2.com</button>
        <button type="button" data-o="#1043" data-e="sam@v2.com">#1043 · sam@v2.com</button>
        <button type="button" data-o="#1044" data-e="jules@v2.com">#1044 · jules@v2.com</button>
        <button type="button" data-o="#1042" data-e="wrong@v2.com">#1042 · wrong email</button>
      </div>
    </form>`;
    const f = view.querySelector("form");
    f.addEventListener("submit", (e) => { e.preventDefault(); lookup(f.order.value, f.email.value); });
    view.querySelectorAll(".pt-try button").forEach((b) => b.addEventListener("click", () => {
      f.order.value = b.dataset.o; f.email.value = b.dataset.e; lookup(b.dataset.o, b.dataset.e);
    }));
  }

  function lookup(orderRaw, emailRaw) {
    // same normalization + checks as the worker
    const order = String(orderRaw || "").trim().replace(/^#/, "").toLowerCase();
    const email = String(emailRaw || "").trim().toLowerCase();
    view.innerHTML = `<div class="pt-load" aria-label="looking up"><span></span><span></span><span></span></div>`;
    setTimeout(() => {
      const o = ORDERS[order];
      // unknown order and wrong email get the exact same answer, so nobody can fish for real order numbers
      if (!order || !email || !o || o.email !== email) return showError([orderRaw, emailRaw]);
      showResults("#" + order, o.products);
    }, reduce ? 0 : 750);
  }

  function showError(prev) {
    view.innerHTML = `<div class="pt-err" role="alert">
      <p>${esc(ERR)}</p>
      <span class="pt-why">same message whether the order doesn't exist or the email is wrong. that's on purpose, so nobody can guess other people's orders.</span>
      <button class="pt-again" type="button">try again</button></div>`;
    view.querySelector(".pt-again").addEventListener("click", () => showForm(prev));
  }

  function card(p) {
    const top = `<div class="pt-top">${p.img ? `<img src="${esc(p.img)}" alt="" onerror="this.style.display='none'">` : ""}
      <div class="pt-meta"><div class="pt-title">${esc(p.title)}</div><div class="pt-color">${esc(p.colorway)}</div>${p.eta ? `<div class="pt-eta">${esc(p.eta)}</div>` : ""}</div></div>`;
    if (p.in_stock) return `<div class="pt-card">${top}<div class="pt-ship">✓ ships with your preorder</div></div>`;
    const active = p.stage - 1, total = STAGES.length - 1;
    const pct = Math.round((active / total) * 100);
    const label = pct === 0 ? "production starting very soon :)" : pct >= 100 ? "shipped" : pct + "% there";
    const steps = STAGES.map((s, i) => {
      const cls = i < active ? "done" : i === active ? "now" : "todo";
      const node = cls === "done" ? "✓" : cls === "now" ? "<i></i>" : "";
      return `<li class="${cls}"><span class="pt-node" aria-hidden="true">${node}</span><div><div class="pt-sn">${s[0]}${cls === "now" ? '<span class="pt-sr" style="position:absolute;left:-9999px"> (current)</span>' : ""}</div><div class="pt-sd">${s[1]}</div></div></li>`;
    }).join("");
    return `<div class="pt-card">${top}<div class="pt-bar"><div class="pt-fill" data-pct="${pct}"></div></div><div class="pt-pct">${label}</div>
      <ol>${steps}</ol>${p.delay ? `<div class="pt-delay">${esc(p.delay)}</div>` : ""}</div>`;
  }

  function showResults(name, products) {
    view.innerHTML = `<p class="pt-order">order ${esc(name)}</p><div class="pt-prods">${products.map(card).join("")}</div>
      <button class="pt-again" type="button">look up a different order</button>`;
    setTimeout(() => view.querySelectorAll(".pt-fill").forEach((f) => (f.style.width = f.dataset.pct + "%")), 60);
    view.querySelector(".pt-again").addEventListener("click", () => showForm());
  }

  showForm();
};
