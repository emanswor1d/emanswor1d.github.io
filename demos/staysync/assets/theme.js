/* STAY SYNC theme.js — no dependencies. Modules mount on [data-*] hooks and re-mount in the theme editor. */
(() => {
  'use strict';
  const SS = window.SS || {};
  const d = document;
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || d.body.hasAttribute('data-rm');
  const GLITCH = parseFloat(getComputedStyle(d.documentElement).getPropertyValue('--glitch')) || 0;
  const store = {
    get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  };
  const cleanups = new WeakMap();
  const onCleanup = (root, fn) => { const list = cleanups.get(root) || []; list.push(fn); cleanups.set(root, list); };

  /* ---------- helpers ---------- */
  function toast(msg, ms = 2600) {
    const t = $('[data-toast]'); if (!t || !msg) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), ms);
  }
  function formatMoney(cents, format = SS.moneyFormat || '${{amount}}') {
    const n = (cents || 0) / 100;
    const fmt = (v, dec, th = ',', dp = '.') => {
      const [i, f] = v.toFixed(dec).split('.');
      return i.replace(/\B(?=(\d{3})+(?!\d))/g, th) + (f ? dp + f : '');
    };
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, k) => ({
      amount: fmt(n, 2), amount_no_decimals: fmt(n, 0),
      amount_with_comma_separator: fmt(n, 2, '.', ','), amount_no_decimals_with_comma_separator: fmt(n, 0, '.', ',')
    })[k] || fmt(n, 2));
  }
  function glitchOnce(el) {
    if (RM || !GLITCH || !el) return;
    el.classList.remove('is-glitching'); void el.offsetWidth; el.classList.add('is-glitching');
    setTimeout(() => el.classList.remove('is-glitching'), 400);
  }
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  /* ---------- modules ---------- */
  const M = {};

  // Countdown — data-date="2026-11-14T12:00" data-tz="-05:00" data-live-hours="48"
  const timers = new Set();
  let tickHandle = null;
  function tickAll() {
    const now = Date.now();
    timers.forEach((t) => t(now));
    tickHandle = setTimeout(tickAll, 1000 - (Date.now() % 1000) + 5);
  }
  M.countdown = (el) => {
    let raw = (el.dataset.date || '').trim();
    if (!raw) return;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) raw += 'T00:00';
    if (/T\d{2}:\d{2}$/.test(raw)) raw += ':00';
    const target = Date.parse(raw + (el.dataset.tz || ''));
    if (isNaN(target)) return;
    const liveMs = parseFloat(el.dataset.liveHours || '0') * 3600e3;
    const scope = el.closest('[data-countdown-scope]') || el;
    const parts = { d: $('[data-cd=d]', el), h: $('[data-cd=h]', el), m: $('[data-cd=m]', el), s: $('[data-cd=s]', el) };
    let last = '';
    const fn = (now) => {
      let diff = target - now;
      const state = diff > 0 ? 'pre' : (liveMs === 0 || now < target + liveMs ? 'live' : 'ended');
      if (state !== scope.dataset.state) {
        if (scope.dataset.state === 'pre') glitchOnce(scope);
        scope.dataset.state = state;
        scope.dispatchEvent(new CustomEvent('countdown:state', { bubbles: true, detail: state }));
      }
      if (state === 'live' && liveMs > 0 && el.dataset.countLive !== undefined) diff = target + liveMs - now;
      diff = Math.max(0, diff);
      const vals = { d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60 };
      Object.keys(parts).forEach((k) => {
        const p = parts[k]; if (!p) return;
        const v = pad(vals[k]);
        if (p.textContent !== v) {
          p.textContent = v;
          if (!RM && GLITCH && k === 's') { p.classList.remove('flip'); void p.offsetWidth; p.classList.add('flip'); }
        }
      });
      const label = `${vals.d}d ${vals.h}h ${vals.m}m`;
      if (label !== last) { el.setAttribute('aria-label', label); last = label; }
    };
    fn(Date.now());
    timers.add(fn);
    if (!tickHandle) tickAll();
    return () => timers.delete(fn);
  };
  d.addEventListener('visibilitychange', () => {
    if (d.hidden) { clearTimeout(tickHandle); tickHandle = null; } else if (timers.size && !tickHandle) tickAll();
  });

  // Reveal on scroll (+ one glitch hit on headings marked data-glitch-reveal)
  let revealIO = null;
  M.reveal = (el) => {
    if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return; }
    revealIO = revealIO || new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      if (e.target.hasAttribute('data-glitch-reveal')) setTimeout(() => glitchOnce(e.target), 150);
      $$('[data-glitch-reveal]', e.target).forEach((g) => setTimeout(() => glitchOnce(g), 200));
      revealIO.unobserve(e.target);
    }), { rootMargin: '0px 0px -10% 0px' });
    revealIO.observe(el);
    return () => revealIO && revealIO.unobserve(el);
  };

  // Idle glitch: hits every few seconds while on screen
  M.glitchIdle = (el) => {
    if (RM || !GLITCH) return;
    let h;
    const loop = () => { h = setTimeout(() => { if (!d.hidden) glitchOnce(el); loop(); }, 3500 + Math.random() * 3500); };
    loop();
    return () => clearTimeout(h);
  };

  // Typewriter: [data-type] types its own text; [data-type-lines] types children in order
  function typeInto(node, text, speed) {
    return new Promise((res) => {
      if (RM) { node.textContent = text; return res(); }
      let i = 0; node.textContent = '';
      const step = () => { node.textContent = text.slice(0, ++i); i < text.length ? (node._t = setTimeout(step, speed)) : res(); };
      step();
    });
  }
  M.typeLines = (el) => {
    const lines = $$('[data-line]', el);
    const texts = lines.map((l) => l.textContent);
    const speed = parseInt(el.dataset.speed || '22', 10);
    let skipped = false;
    const finish = () => { skipped = true; lines.forEach((l, i) => { clearTimeout(l._t); l.textContent = texts[i]; l.classList.add('is-on'); }); el.classList.add('is-done'); };
    if (RM) return finish();
    lines.forEach((l) => { l.textContent = ''; });
    const run = async () => {
      for (let i = 0; i < lines.length && !skipped; i++) {
        lines[i].classList.add('is-on');
        await typeInto(lines[i], texts[i], speed);
        await new Promise((r) => setTimeout(r, 160));
      }
      if (!skipped) el.classList.add('is-done');
    };
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); run(); } });
    io.observe(el);
    const skip = $('[data-type-skip]', el);
    skip && skip.addEventListener('click', finish);
    return () => { io.disconnect(); finish(); };
  };

  // Announcement rotator
  M.rotator = (el) => {
    const items = $$('[data-rotator-item]', el);
    if (items.length < 2) return;
    let i = 0;
    const ms = parseInt(el.dataset.interval || '4', 10) * 1000;
    const h = setInterval(() => {
      if (d.hidden || el.matches(':hover')) return;
      items[i].hidden = true; i = (i + 1) % items.length; items[i].hidden = false;
      const txt = $('[data-rotator-text]', items[i]);
      if (txt) typeInto(txt, txt.dataset.full || (txt.dataset.full = txt.textContent), 18);
    }, ms);
    return () => clearInterval(h);
  };

  // Marquee: duplicate track so the CSS loop is seamless
  M.marquee = (el) => {
    const track = $('[data-marquee-track]', el);
    if (!track || track.dataset.cloned) return;
    track.dataset.cloned = '1';
    const copy = track.innerHTML;
    track.innerHTML = copy + copy.replace(/<(\w+)/g, '<$1 aria-hidden="true"');
  };

  // Mobile menu
  M.menu = (btn) => {
    const menu = d.getElementById(btn.getAttribute('aria-controls'));
    if (!menu) return;
    const toggle = (open) => {
      open = open ?? btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open); menu.classList.toggle('is-open', open); d.body.classList.toggle('menu-open', open);
    };
    btn.addEventListener('click', () => toggle());
    $$('[data-menu-close]', menu).forEach((c) => c.addEventListener('click', () => toggle(false)));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => toggle(false)));
    const esc = (e) => e.key === 'Escape' && toggle(false);
    d.addEventListener('keydown', esc);
    return () => d.removeEventListener('keydown', esc);
  };

  // Product duo: character select. Marks the card in view (mobile scroller) or hovered (desktop).
  M.duo = (el) => {
    const cards = $$('[data-duo-card]', el);
    const dots = $$('[data-duo-dot]', el);
    const pick = (i) => {
      cards.forEach((c, j) => c.classList.toggle('is-selected', i === j));
      dots.forEach((dt, j) => dt.setAttribute('aria-current', i === j));
    };
    cards.forEach((c, i) => {
      c.addEventListener('mouseenter', () => { pick(i); glitchOnce($('.rgb', c)); });
      c.addEventListener('focusin', () => pick(i));
    });
    dots.forEach((dt, i) => dt.addEventListener('click', () => cards[i].scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })));
    const scroller = $('[data-duo-scroller]', el);
    let io;
    if (scroller && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) pick(cards.indexOf(e.target)); }), { root: scroller, threshold: 0.6 });
      cards.forEach((c) => io.observe(c));
    }
    pick(0);
    return () => io && io.disconnect();
  };

  // Share: Web Share API, falls back to copying the link
  M.share = (btn) => {
    btn.addEventListener('click', async () => {
      const url = btn.dataset.url ? new URL(btn.dataset.url, location.origin).href : location.href;
      const data = { title: btn.dataset.title || d.title, text: btn.dataset.text || '', url };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(`${data.text} ${url}`.trim());
        toast((SS.strings && SS.strings.copied) || 'LINK COPIED');
      } catch (e) { /* user cancelled */ }
    });
  };

  // SMS form: normalise the phone to E.164, stamp the consent tag, remember the signup
  M.smsForm = (form) => {
    form.addEventListener('submit', () => {
      const tel = $('input[type=tel]', form);
      if (tel) {
        let v = tel.value.replace(/[^\d+]/g, '');
        const cc = (SS.countryCode || '+1').replace(/[^\d+]/g, '');
        if (!v.startsWith('+')) v = (cc === '+1' && v.length === 11 && v[0] === '1') ? '+' + v : cc + v;
        tel.value = v;
      }
      const tags = $('input[name="contact[tags]"]', form);
      const box = $('[data-consent-box]', form);
      if (tags && (!box || box.checked)) tags.value += `, sms-consent-${new Date().toISOString().slice(0, 10)}`;
      $$('button[type=submit]', form).forEach((b) => b.classList.add('is-loading'));
      if (form.closest('[data-sms-popup]')) store.set('ss_pop_submitted', '1', true);
    });
  };
  // A success state was rendered: never show the popup again
  M.smsSuccess = () => { store.set('ss_sms_done', '1'); };

  // GIF SMS popup
  M.popup = (dlg) => {
    let cfg = {};
    try { cfg = JSON.parse(dlg.dataset.config || '{}'); } catch (e) {}
    const media = $('[data-pop-media]', dlg);
    const loadMedia = () => {
      if (!media || media.dataset.loaded) return;
      media.dataset.loaded = '1';
      const src = RM ? media.dataset.fallback : (media.dataset.src || media.dataset.fallback);
      if (!src) return;
      if (/\.(mp4|webm)(\?|$)/i.test(src)) {
        const v = d.createElement('video');
        Object.assign(v, { src, muted: true, loop: true, autoplay: true, playsInline: true });
        v.setAttribute('playsinline', ''); media.appendChild(v);
      } else media.style.backgroundImage = `url("${src}")`;
    };
    const open = () => {
      if (dlg.open) return;
      loadMedia();
      typeof dlg.showModal === 'function' ? dlg.showModal() : dlg.setAttribute('open', '');
      d.body.classList.add('pop-open');
      glitchOnce($('.glitch', dlg));
    };
    const close = (snooze) => {
      if (snooze) store.set('ss_pop_until', String(Date.now() + (cfg.days || 7) * 864e5));
      typeof dlg.close === 'function' ? dlg.close() : dlg.removeAttribute('open');
      d.body.classList.remove('pop-open');
    };
    $$('[data-pop-close]', dlg).forEach((b) => b.addEventListener('click', () => close(true)));
    dlg.addEventListener('cancel', () => store.set('ss_pop_until', String(Date.now() + (cfg.days || 7) * 864e5)));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(true); });

    // Coming back from a submit: reopen to show the success or error, but only if the popup sent it
    if ($('[data-pop-result]', dlg)) {
      if ($('[data-sms-success]', dlg)) store.set('ss_sms_done', '1');
      if (store.get('ss_pop_submitted', true)) { store.set('ss_pop_submitted', '', true); open(); }
      return;
    }
    if (SS.designMode) { if (cfg.preview) open(); return; }

    // Suppression
    const qs = new URLSearchParams(location.search);
    if (qs.get('utm_source') === 'sms' || qs.get('utm_medium') === 'sms') store.set('ss_from_sms', '1', true);
    if (store.get('ss_sms_done') || store.get('ss_from_sms', true)) return;
    if (+(store.get('ss_pop_until') || 0) > Date.now()) return;
    if (store.get('ss_pop_shown', true)) return;

    let fired = false, scrolled = false, timer = 0;
    const fire = () => {
      if (fired) return;
      const atc = +(store.get('ss_atc_at', true) || 0);
      if (Date.now() - atc < 10000 || d.body.classList.contains('drawer-open') || d.body.classList.contains('menu-open')) {
        clearTimeout(timer); timer = setTimeout(fire, 10000); return;
      }
      fired = true; store.set('ss_pop_shown', '1', true); cleanup(); open();
    };
    const onScroll = () => {
      const max = d.documentElement.scrollHeight - innerHeight;
      if (scrollY > 120) scrolled = true;
      if (max > 0 && scrollY / max * 100 >= (cfg.scroll || 50)) fire();
    };
    const start = Date.now();
    const poll = setInterval(() => { if (scrolled && Date.now() - start >= (cfg.delay || 12) * 1000) fire(); }, 1000);
    const onOut = (e) => { if (!e.relatedTarget && e.clientY < 10 && Date.now() - start > 5000) fire(); };
    addEventListener('scroll', onScroll, { passive: true });
    if (cfg.exit && matchMedia('(pointer:fine)').matches) d.addEventListener('mouseout', onOut);
    function cleanup() { clearInterval(poll); clearTimeout(timer); removeEventListener('scroll', onScroll); d.removeEventListener('mouseout', onOut); }
    return cleanup;
  };

  // Product form: variant picker, price/stock/gallery sync, sticky bar
  M.product = (root) => {
    const json = $('[data-variants]', root);
    const variants = json ? JSON.parse(json.textContent) : [];
    const form = $('form[data-add-form]', root);
    const idInput = form && $('input[name=id]', form);
    const radios = $$('[data-option-index]', root);
    const buttons = $$('[data-atc]', root.closest('[data-product-section]') || root);
    const strings = SS.strings || {};

    const current = () => {
      const chosen = [];
      radios.forEach((r) => { if (r.checked) chosen[+r.dataset.optionIndex] = r.value; });
      return variants.find((v) => v.options.every((o, i) => chosen[i] === undefined || chosen[i] === o));
    };
    const markAvailability = () => {
      // grey out values that have no available variant given the other selections
      radios.forEach((r) => {
        const idx = +r.dataset.optionIndex;
        const others = radios.filter((x) => x.checked && +x.dataset.optionIndex !== idx);
        const ok = variants.some((v) => v.available && v.options[idx] === r.value && others.every((o) => v.options[+o.dataset.optionIndex] === o.value));
        r.closest('[data-swatch]')?.classList.toggle('is-out', !ok);
      });
    };
    const update = () => {
      const v = current();
      markAvailability();
      buttons.forEach((b) => {
        const label = $('[data-atc-label]', b) || b;
        b.disabled = !v || !v.available;
        label.textContent = !v ? strings.unavailable : v.available ? strings.addToCart : strings.soldOut;
      });
      $$('[data-payment-buttons]', root).forEach((p) => { p.hidden = !v || !v.available; });
      if (!v) return;
      if (idInput) idInput.value = v.id;
      $$('[data-price]', root.closest('[data-product-section]') || root).forEach((p) => {
        p.innerHTML = formatMoney(v.price) + (v.compare_at_price > v.price ? ` <s class="price__was">${formatMoney(v.compare_at_price)}</s>` : '');
      });
      $$('[data-selected-label]', root.closest('[data-product-section]') || root).forEach((l) => { l.textContent = v.title; });
      const stock = $('[data-stock]', root);
      if (stock) {
        const max = +stock.dataset.threshold || 5;
        const show = v.available && v.inv !== null && v.inv > 0 && v.inv <= max;
        stock.hidden = !show;
        if (show) {
          $('[data-stock-count]', stock).textContent = v.inv;
          $$('[data-hp]', stock).forEach((seg, i) => seg.classList.toggle('is-on', i < v.inv));
        }
      }
      if (v.media_id) {
        const slide = $(`[data-media-id="${v.media_id}"]`, root.closest('[data-product-section]') || d);
        const gal = slide && slide.closest('[data-gallery]');
        if (gal && slide) {
          if (gal.scrollWidth > gal.clientWidth) gal.scrollTo({ left: slide.offsetLeft - gal.offsetLeft, behavior: RM ? 'auto' : 'smooth' });
          else if (slide.getBoundingClientRect().top < 0 || slide.getBoundingClientRect().top > innerHeight) slide.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
        }
      }
      if (root.dataset.updateUrl !== undefined && history.replaceState) {
        const u = new URL(location.href); u.searchParams.set('variant', v.id); history.replaceState({}, '', u);
      }
    };
    radios.forEach((r) => r.addEventListener('change', update));
    if (variants.length) update();
  };

  // Gallery dots
  M.gallery = (gal) => {
    const slides = $$('[data-media-id]', gal);
    const dots = $$('[data-gallery-dot]', gal.parentElement);
    if (!dots.length) return;
    const io = new IntersectionObserver((en) => en.forEach((e) => {
      if (e.isIntersecting) { const i = slides.indexOf(e.target); dots.forEach((dt, j) => dt.setAttribute('aria-current', i === j)); }
    }), { root: gal, threshold: 0.6 });
    slides.forEach((s) => io.observe(s));
    dots.forEach((dt, i) => dt.addEventListener('click', () => gal.scrollTo({ left: slides[i].offsetLeft - gal.offsetLeft, behavior: 'smooth' })));
    return () => io.disconnect();
  };

  // Sticky buy bar: on when the main buy button is off screen
  M.sticky = (bar) => {
    const target = d.getElementById(bar.dataset.watch);
    if (!target) return;
    const io = new IntersectionObserver(([e]) => {
      const past = !e.isIntersecting && e.boundingClientRect.top < 0;
      bar.classList.toggle('is-on', past); d.body.classList.toggle('sticky-on', past);
    });
    io.observe(target);
    return () => { io.disconnect(); d.body.classList.remove('sticky-on'); };
  };

  // Modal / sheet (size chart etc): [data-modal-open="id"] opens <dialog id>
  M.modalOpen = (btn) => {
    const dlg = d.getElementById(btn.dataset.modalOpen);
    if (!dlg) return;
    if (!dlg.dataset.wired) {
      dlg.dataset.wired = '1';
      dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-modal-close]')) dlg.close(); });
    }
    btn.addEventListener('click', () => { dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); });
  };

  // Tabs (size chart cm/in, etc): [data-tabs] > [data-tab="x"] + [data-panel="x"]
  M.tabs = (el) => {
    const tabs = $$('[data-tab]', el);
    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', x === t));
      $$('[data-panel]', el).forEach((p) => { p.hidden = p.dataset.panel !== t.dataset.tab; });
    }));
  };

  /* ---------- cart ---------- */
  const Cart = {
    drawer: () => $('[data-cart-drawer]'),
    sections() { return this.drawer() ? 'cart-drawer' : ''; },
    async render(data) {
      const html = data && data.sections && data.sections['cart-drawer'];
      const drawer = this.drawer();
      if (html && drawer) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const fresh = $('[data-cart-drawer-inner]', doc);
        const inner = $('[data-cart-drawer-inner]', drawer);
        if (fresh && inner) { inner.replaceWith(fresh); mount(drawer); }
      }
      const count = data && data.item_count !== undefined ? data.item_count : (await (await fetch(`${SS.routes.cart}.js`)).json()).item_count;
      $$('[data-cart-count]').forEach((c) => { c.textContent = count; c.closest('[data-cart-count-wrap]')?.classList.toggle('has-items', count > 0); });
    },
    open() {
      const dr = this.drawer(); if (!dr) return false;
      dr.classList.add('is-open'); dr.setAttribute('aria-hidden', 'false'); d.body.classList.add('drawer-open');
      setTimeout(() => $('[data-cart-close]', dr)?.focus(), 50);
      return true;
    },
    close() {
      const dr = this.drawer(); if (!dr) return;
      dr.classList.remove('is-open'); dr.setAttribute('aria-hidden', 'true'); d.body.classList.remove('drawer-open');
    },
    async add(form, submitter) {
      const btn = submitter || $('[type=submit]', form) || $(`[form="${form.id}"]`);
      const err = $('[data-form-error]', form.closest('[data-product-section]') || form);
      btn && btn.classList.add('is-loading');
      if (err) err.hidden = true;
      try {
        const fd = new FormData(form);
        const sec = this.sections(); if (sec) fd.append('sections', sec);
        const res = await fetch(`${SS.routes.cart_add}.js`, { method: 'POST', body: fd, headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
        const data = await res.json();
        if (!res.ok || data.status) throw new Error(data.description || data.message || (SS.strings && SS.strings.error));
        store.set('ss_atc_at', String(Date.now()), true);
        const cartData = await (await fetch(`${SS.routes.cart}.js`)).json();
        await this.render({ sections: data.sections, item_count: cartData.item_count });
        if (!this.open()) { if (SS.cartType === 'page' && form.dataset.redirect !== 'false') location.href = SS.routes.cart; else toast(SS.strings.added); }
      } catch (e) {
        if (err) { err.textContent = e.message; err.hidden = false; } else toast(e.message);
      } finally { btn && btn.classList.remove('is-loading'); }
    },
    async change(key, quantity) {
      const sec = this.sections();
      const res = await fetch(`${SS.routes.cart_change}.js`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ id: key, quantity, sections: sec || undefined }) });
      const data = await res.json();
      if (!res.ok) { toast(data.description || data.message); $$('[data-qty-change].is-loading').forEach((b) => b.classList.remove('is-loading')); return; }
      if (d.body.classList.contains('template-cart')) return location.reload();
      await this.render(data);
    }
  };
  d.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-add-form]');
    if (!form || !window.fetch) return;
    e.preventDefault(); Cart.add(form, e.submitter);
  });
  d.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-cart-open]');
    if (opener && SS.cartType === 'drawer' && !d.body.classList.contains('template-cart')) { if (Cart.open()) e.preventDefault(); return; }
    if (e.target.closest('[data-cart-close]') || e.target.matches('[data-cart-overlay]')) { Cart.close(); return; }
    const q = e.target.closest('[data-qty-change]');
    if (q) { e.preventDefault(); q.classList.add('is-loading'); Cart.change(q.dataset.key, parseInt(q.dataset.qty, 10)); }
  });
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') Cart.close(); });
  d.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-qty-input]');
    if (inp) Cart.change(inp.dataset.key, Math.max(0, parseInt(inp.value, 10) || 0));
  });
  window.SSCart = Cart;

  /* ---------- registry ---------- */
  const registry = [
    ['[data-countdown]', M.countdown], ['[data-reveal]', M.reveal], ['[data-glitch-idle]', M.glitchIdle],
    ['[data-type-lines]', M.typeLines], ['[data-rotator]', M.rotator], ['[data-marquee]', M.marquee],
    ['[data-menu-toggle]', M.menu], ['[data-duo]', M.duo], ['[data-share]', M.share],
    ['form[data-sms-form]', M.smsForm], ['[data-sms-success]', M.smsSuccess], ['[data-sms-popup]', M.popup],
    ['[data-product-form]', M.product], ['[data-gallery]', M.gallery], ['[data-sticky-atc]', M.sticky],
    ['[data-modal-open]', M.modalOpen], ['[data-tabs]', M.tabs]
  ];
  function mount(root = d) {
    registry.forEach(([sel, fn]) => {
      const els = $$(sel, root);
      if (root !== d && root.matches && root.matches(sel)) els.unshift(root);
      els.forEach((el) => {
        const key = 'ss' + fn.name;
        if (el.dataset[key]) return;
        el.dataset[key] = '1';
        try { const off = fn(el); if (typeof off === 'function') onCleanup(el, off); } catch (err) { console.warn('[stay-sync]', sel, err); }
      });
    });
  }
  function unmount(root) {
    [root, ...$$('*', root)].forEach((el) => {
      (cleanups.get(el) || []).forEach((f) => { try { f(); } catch (e) {} });
      cleanups.delete(el);
    });
  }

  /* ---------- global extras ---------- */
  // CRT intro (session mode) removes itself after it plays
  $$('[data-crt-intro]').forEach((c) => c.addEventListener('animationend', () => c.remove(), { once: true }));

  // Welcome back, P1
  if (SS.welcome) {
    const last = +(store.get('ss_last') || 0);
    if (last && Date.now() - last > 36e5 && !store.get('ss_welcomed', true)) { store.set('ss_welcomed', '1', true); setTimeout(() => toast(SS.welcome), 1200); }
    store.set('ss_last', String(Date.now()));
  }

  // Easter egg: konami code or 7 taps on the wordmark
  if (SS.egg) {
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let pos = 0, taps = 0, tapT = 0;
    const unlock = () => { glitchOnce($('.site-header .glitch') || d.body); toast(SS.egg.text, 1400); setTimeout(() => { location.href = SS.egg.url; }, 1200); };
    d.addEventListener('keydown', (e) => { pos = e.key === code[pos] || e.key.toLowerCase() === code[pos] ? pos + 1 : 0; if (pos === code.length) { pos = 0; unlock(); } });
    d.addEventListener('click', (e) => {
      if (!e.target.closest('[data-wordmark]') || !matchMedia('(pointer:coarse)').matches) return;
      if (Date.now() - tapT > 3000) taps = 0;
      tapT = Date.now();
      if (++taps === 7) { e.preventDefault(); unlock(); } else if (taps > 1) e.preventDefault();
    });
  }

  // Theme editor support
  d.addEventListener('shopify:section:load', (e) => mount(e.target));
  d.addEventListener('shopify:section:unload', (e) => unmount(e.target));
  d.addEventListener('shopify:section:select', (e) => { if (e.target.querySelector('[data-cart-drawer]')) Cart.open(); });
  d.addEventListener('shopify:section:deselect', (e) => { if (e.target.querySelector('[data-cart-drawer]')) Cart.close(); });
  d.addEventListener('shopify:block:select', (e) => {
    const det = e.target.closest('details') || e.target.querySelector('details'); if (det) det.open = true;
    e.target.scrollIntoView && e.target.scrollIntoView({ block: 'nearest' });
  });

  mount();
})();
