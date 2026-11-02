/* RISEx tab — on-ramp prototype (regular user, Bank Transfer).
   Screens follow Figma section "2. Design - On Ramp Flow" (90:5843), row
   "Regular user flow (No Crossmint's account)": 01 Trade → 02 Use Crypto →
   03 Use Cash → 04 Top up → 05 Login / Sign up → 06 Pay with Bank Account →
   07 Confirm Order (pending) → 08 TopPay tab. The completion states after 07
   are the approved prototype-only addition. */
(function () {
  var S = window.DemoStore, D = S.DEMO;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 60) : ms); }); };

  function paintIcons(root) {
    $$('i[data-icon]', root).forEach(function (el) {
      if (el.firstChild) return;
      var svg = window.ICONS[el.getAttribute('data-icon')];
      if (svg) el.innerHTML = svg;
    });
  }

  /* ---------------- static trade data (from Figma 01) ---------------- */
  var ASKS = [['77,449.0','169.8','671.52K',300],['77,444.0','200.99K','671.35K',300],['77,436.0','3.69K','470.36K',210],['77,435.0','266.6','466.66K',210],['77,433.0','149.27K','466.40K',210],['77,428.0','557.4','317.12K',135],['77,427.0','8.33K','316.57K',135],['77,424.0','40.0','308.23K',135],['77,421.0','12.0','308.19K',135],['77,418.0','2.00K','308.18K',135],['77,416.0','46.8','306.18K',135],['77,415.0','595.6','306.13K',135],['77,413.0','148.21K','305.53K',135],['77,403.0','150.66K','157.32K',75],['77,399.0','4.35K','6.65K',45],['77,397.0','1.95K','2.30K',0],['77,385.0','349.9','349.9',0]];
  var BIDS = [['77,384.0','141.00K','141.00K',45],['77,383.0','1.38K','142.38K',60],['77,382.0','1.63K','144.02K',60],['77,381.0','4.99K','149.02K',60],['77,380.0','928.5','149.95K',60],['77,379.0','144.51K','294.47K',105],['77,377.0','5.00K','299.47K',105],['77,375.0','1.99K','301.47K',105],['77,373.0','46.8','301.51K',105],['77,371.0','695.5','302.21K',105],['77,368.0','773.6','302.98K',105],['77,366.0','9.99K','312.98K',120],['77,362.0','11.6','312.99K',120]];
  var TICKER = [['BTC','3.14%',0],['HYPE','15.34%',1],['ETH','4.48%',0],['XRP','2.81%',0],['XMR','1.04%',1],['SOL','3.41%',0],['LIT','2.45%',0],['VVV','4.12%',0],['TAO','6.58%',0],['BNB','6.51%',0],['ZEC','0.34%',0],['NEAR','1.19%',0],['AERO','7.82%',0],['PUMP','6.01%',0],['ZRO','3.24%',1],['ENA','4.18%',0]];
  var RISK = ['#15b79e','#1eb698','#26b692','#2fb58c','#37b586','#40b480','#48b47a','#51b374','#59b36e','#62b268','#6ab262','#73b15c','#7bb156','#84b050','#8cb04a','#95af44','#9daf3e','#a6ae38','#aeae32','#b7ad2c','#bfad26','#c8ac20','#d0ac1a','#d9ab14','#e1ab0e','#eaaa08','#eba50a','#eba00c','#ec9b0e','#ed960f','#ed9111','#ee8c13','#ef8715','#ef8217','#f07d19','#f1781a','#f1731c','#f26e1e','#f36820','#f46322','#f45e24','#f55925','#f65427','#f64f29','#f74a2b','#f8452d','#f8402f','#f93b30','#fa3632','#fa3134'];

  function renderStatic() {
    var row = function (r, side) { return '<div class="ob-row ' + side + '"><i class="bar" style="width:' + r[3] + 'px"></i><span class="p">' + r[0] + '</span><span>' + r[1] + '</span><span>' + r[2] + '</span></div>'; };
    $('#asks').innerHTML = ASKS.map(function (r) { return row(r, 'ask'); }).join('');
    $('#bids').innerHTML = BIDS.map(function (r) { return row(r, 'bid'); }).join('');
    $('#ticker').innerHTML = TICKER.map(function (t) {
      return '<span class="tk"><span class="sym">' + t[0] + '</span><span class="' + (t[2] ? 'up' : 'dn') + '">' + t[1] + '</span><i data-icon="' + (t[2] ? 'trend-up' : 'trend-down') + '" class="i12 ' + (t[2] ? 'up' : 'dn') + '"></i></span>';
    }).join('');
    $('#risk').innerHTML = RISK.map(function (c) { return '<span style="background:' + c + '"></span>'; }).join('');
  }

  /* ---------------- balances ---------------- */
  var shown = null; // what the Trade screen currently displays (deposited USDC)
  function figures(dep) {
    var eq = D.base.equity + dep;
    return { equity: S.fmtUsd(eq), collat: S.fmtUsd(D.base.collat + dep), available: S.fmtUsdc(D.base.available + dep) + ' USDC', leverage: (D.base.notional / eq).toFixed(2) + 'x' };
  }
  function paintBalances(dep) {
    var f = figures(dep);
    $$('[data-bind]').forEach(function (el) { var k = el.getAttribute('data-bind'); if (f[k] != null) el.textContent = f[k]; });
  }
  function animateBalances(to) {
    var from = shown == null ? to : shown; shown = to;
    if (from === to || reduced) { paintBalances(to); return; }
    var t0 = performance.now(), dur = 700;
    var els = $$('[data-bind="equity"],[data-bind="collat"],[data-bind="available"],[data-bind="leverage"]');
    els.forEach(function (el) { el.classList.add('flash'); });
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      paintBalances(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else setTimeout(function () { els.forEach(function (el) { el.classList.remove('flash'); }); }, 900);
    })(t0);
  }

  /* ---------------- feedback ---------------- */
  var toastTimer;
  function toast(msg, kind) {
    var t = $('#toast');
    t.textContent = msg; t.className = 'toast' + (kind ? ' ' + kind : ''); t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, kind === 'success' ? 3200 : 1800);
  }
  function nudge(el) { el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('.ob, .ob-field');
    if (!el) return;
    e.preventDefault();
    nudge(el);
    toast('“' + (el.getAttribute('data-ob') || 'This control') + '” is outside this demo flow');
  });

  /* ---------------- demo step indicator ---------------- */
  var STEPS = {
    trade: '01 · Trade — click Deposit', crypto: '02 · Use Crypto — switch to Use Cash', cash: '03 · Use Cash — choose Bank Transfer',
    topup: '04 · Top up — Continue', login: '05 · Login — continue with Google', pay: '06 · Pay with Bank Account',
    pending: '07 · Pending — pay in the TopPay tab', paid: '07 · Payment received', done: 'Done — Back to Trade', after: 'Deposit complete · Restart to replay'
  };
  function stepLabel(k) { $('#demoStep').textContent = STEPS[k] || ''; }

  /* ---------------- modal layer ---------------- */
  var layer = $('#layer'), app = $('#app'), depModal = $('#depositModal'), widget = $('#widget');
  var current = null, lastFocus = null;

  function openLayer() {
    if (!layer.hidden) return;
    lastFocus = document.activeElement;
    layer.hidden = false; app.inert = true;
    requestAnimationFrame(function () { layer.classList.add('is-open'); });
  }
  function closeLayer() {
    layer.classList.remove('is-open');
    [depModal, widget].forEach(function (m) { if (!m.hidden) { m.classList.remove('is-in'); m.classList.add('is-out'); } });
    setTimeout(function () {
      layer.hidden = true; app.inert = false;
      [depModal, widget].forEach(function (m) { m.hidden = true; m.classList.remove('is-out'); });
      resetWidget();
      current = null; stepLabel(isComplete() ? 'after' : 'trade');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, reduced ? 10 : 240);
  }
  function swapTo(modal, focusEl) {
    var other = modal === depModal ? widget : depModal;
    if (!other.hidden) {
      other.classList.remove('is-in'); other.classList.add('is-out');
      setTimeout(function () { other.hidden = true; other.classList.remove('is-out'); }, reduced ? 10 : 160);
    }
    if (modal.hidden) {
      modal.hidden = false; modal.classList.remove('is-out');
      void modal.offsetWidth;
      setTimeout(function () { modal.classList.add('is-in'); }, other.hidden ? 0 : 70);
    }
    if (focusEl) setTimeout(function () { focusEl.focus({ preventScroll: true }); }, 30);
  }

  /* ---------------- 02 / 03 deposit modal ---------------- */
  var seg = $('.seg', depModal);
  function showDeposit(tab) {
    openLayer();
    setTab(tab, false);
    swapTo(depModal, $('[aria-selected="true"]', depModal));
    current = tab === 'cash' ? 'cash' : 'crypto'; stepLabel(current);
  }
  function setTab(tab, animate) {
    seg.setAttribute('data-active', tab);
    $$('.seg-item', seg).forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
    var show = tab === 'cash' ? $('#paneCash') : $('#paneCrypto'), hide = tab === 'cash' ? $('#paneCrypto') : $('#paneCash');
    hide.hidden = true; show.hidden = false;
    $('#optBank').classList.remove('is-selected');
    if (animate) { show.classList.remove('is-entering'); void show.offsetWidth; show.classList.add('is-entering'); }
  }
  $$('.seg-item', seg).forEach(function (b) {
    b.addEventListener('click', function () {
      var tab = b.getAttribute('data-tab');
      if (seg.getAttribute('data-active') === tab) return;
      setTab(tab, true); current = tab; stepLabel(tab);
    });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var tab = seg.getAttribute('data-active') === 'cash' ? 'crypto' : 'cash';
        setTab(tab, true); current = tab; stepLabel(tab);
        $('[aria-selected="true"]', seg).focus(); e.preventDefault();
      }
    });
  });
  $('#depositBtn').addEventListener('click', function () { showDeposit('crypto'); });
  $('#optBank').addEventListener('click', function () {
    var b = this; b.classList.add('is-selected');
    setTimeout(function () { showWidget('topup'); }, reduced ? 0 : 140);
  });

  /* ---------------- 04 top up ---------------- */
  var amount = $('#amount'), mirror = $('#amountMirror'), amountRow = $('.amount-row'), help = $('#amountHelp'), cont = $('#continueBtn');
  var MAX_VND = S.vndFor(D.limitUsd), MIN_VND = S.vndFor(D.minUsdc);
  var flow = { vnd: D.defaultVnd, signedIn: false, orderId: null };

  function setAmount(vnd, fromTyping) {
    flow.vnd = vnd;
    var txt = vnd > 0 ? S.fmtVndDots(vnd) : '';
    if (amount.value !== txt) amount.value = txt;
    mirror.textContent = txt || '0';
    amount.style.width = mirror.offsetWidth + 3 + 'px'; // layout width — the modal may still be mid scale-in
    if (fromTyping) { try { amount.setSelectionRange(txt.length, txt.length); } catch (e) {} }
    validate();
  }
  function validate() {
    var v = flow.vnd, msg = '';
    if (v > 0 && v < MIN_VND) msg = 'Minimum ' + S.fmtVndDots(MIN_VND) + ' VND';
    else if (v > MAX_VND) msg = 'Maximum ' + S.fmtVndDots(MAX_VND) + ' VND ($4k limit)';
    var ok = v >= MIN_VND && v <= MAX_VND;
    amountRow.classList.toggle('is-invalid', !!msg);
    help.textContent = msg; help.classList.toggle('is-on', !!msg);
    cont.disabled = !ok; cont.setAttribute('aria-disabled', String(!ok));
    return ok;
  }
  amount.placeholder = '0';
  amount.addEventListener('input', function () {
    var digits = amount.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
    setAmount(digits ? Number(digits) : 0, true);
  });
  amount.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !cont.disabled) cont.click(); });
  amount.addEventListener('focus', function () { amountRow.classList.add('is-focused'); });
  amount.addEventListener('blur', function () { amountRow.classList.remove('is-focused'); });
  amountRow.addEventListener('mousedown', function (e) { if (!e.target.closest('button')) { e.preventDefault(); amount.focus(); var l = amount.value.length; amount.setSelectionRange(l, l); } });
  $$('.quick .btn').forEach(function (b) {
    b.addEventListener('click', function () {
      setAmount(S.vndFor(Number(b.getAttribute('data-usd'))));
      amountRow.animate && !reduced && amountRow.animate([{ transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 200, easing: 'ease-out' });
    });
  });

  function showWidget(state) {
    openLayer();
    if (widget.hidden) { widget.setAttribute('data-state', 'topup'); }
    swapTo(widget, state === 'topup' ? amount : null);
    setWidgetState(state);
  }
  function setWidgetState(state) {
    widget.setAttribute('data-state', state);
    var topup = $('#topup');
    topup.inert = state !== 'topup';
    if (state === 'topup') { hideSheet(); current = 'topup'; stepLabel('topup'); setAmount(flow.vnd); setTimeout(function () { amount.focus({ preventScroll: true }); }, 60); }
    else { setSheet(state); }
  }
  function resetWidget() {
    flow.vnd = D.defaultVnd; flow.orderId = null;
    cont.classList.remove('is-loading');
    widget.setAttribute('data-state', 'topup'); $('#topup').inert = false;
    var sh = $('#sheet'); sh.hidden = true; sh.classList.remove('is-hidden'); sh.style.height = ''; $('#sheetInner').innerHTML = '';
    setAmount(flow.vnd);
  }
  cont.addEventListener('click', function () {
    if (!validate()) return;
    cont.classList.add('is-loading'); cont.innerHTML = '<span class="btn-label">Continue</span>';
    wait(450).then(function () { cont.classList.remove('is-loading'); setWidgetState(flow.signedIn ? 'pay' : 'login'); });
  });

  /* ---------------- sheets 05 / 06 / 07 ---------------- */
  var sheet = $('#sheet'), inner = $('#sheetInner');
  function hideSheet() {
    if (sheet.hidden) return;
    sheet.classList.add('is-hidden');
    setTimeout(function () { if (sheet.classList.contains('is-hidden')) { sheet.hidden = true; inner.innerHTML = ''; sheet.style.height = ''; } }, reduced ? 10 : 240);
  }
  function setSheet(view) {
    var tpl = { login: '#tplLogin', pay: '#tplPay', confirm: '#tplConfirm' }[view];
    var node = $(tpl).content.firstElementChild.cloneNode(true);
    paintIcons(node);
    var wasHidden = sheet.hidden || sheet.classList.contains('is-hidden');
    var from = wasHidden ? 0 : sheet.offsetHeight;
    inner.innerHTML = ''; inner.appendChild(node);
    sheet.hidden = false; sheet.style.height = 'auto';
    var to = sheet.offsetHeight;
    if (wasHidden) {
      sheet.classList.add('is-hidden'); void sheet.offsetWidth;
      requestAnimationFrame(function () { sheet.classList.remove('is-hidden'); });
    } else {
      node.classList.add('is-entering');
      sheet.style.height = from + 'px'; void sheet.offsetWidth; sheet.style.height = to + 'px';
      setTimeout(function () { sheet.style.height = 'auto'; }, reduced ? 10 : 280);
    }
    wire[view](node);
    current = view;
  }
  function resizeSheet(mutate) {
    var from = sheet.offsetHeight; mutate();
    sheet.style.height = 'auto'; var to = sheet.offsetHeight;
    sheet.style.height = from + 'px'; void sheet.offsetWidth; sheet.style.height = to + 'px';
    setTimeout(function () { sheet.style.height = 'auto'; }, reduced ? 10 : 280);
  }
  function focusFirst(node, sel) { setTimeout(function () { var el = $(sel, node); if (el) el.focus({ preventScroll: true }); }, 60); }

  var wire = {
    login: function (node) {
      stepLabel('login');
      var g = $('#googleBtn', node);
      g.addEventListener('click', function () {
        g.classList.add('is-loading'); g.setAttribute('aria-busy', 'true');
        wait(900).then(function () { flow.signedIn = true; setWidgetState('pay'); });
      });
      focusFirst(node, '#googleBtn');
    },
    pay: function (node) {
      stepLabel('pay');
      $('[data-bind="vndTotal"]', node).textContent = '₫ ' + S.fmtVndDots(flow.vnd);
      var b = $('#payBtn', node);
      b.addEventListener('click', function () {
        var usdc = S.usdcFor(flow.vnd), id = S.newOrderId();
        S.update(function (s) { s.order = { id: id, vnd: flow.vnd, usdc: usdc, status: 'pending', createdAt: Date.now(), ack: false }; });
        flow.orderId = id;
        var w = openProvider(id); // must run inside the click to avoid the pop-up blocker
        b.classList.add('is-loading'); b.setAttribute('aria-busy', 'true');
        wait(600).then(function () {
          setWidgetState('confirm');
          runCreated();
          if (!w) toast('Pop-up blocked — use “Payment Link Not Opening?” to open TopPay');
        });
      });
      focusFirst(node, '#payBtn');
    },
    confirm: function (node) {
      stepLabel('pending');
      $('#reopenLink', node).addEventListener('click', function () {
        var w = openProvider(flow.orderId);
        toast(w ? 'TopPay payment page reopened in a new tab' : 'Pop-up blocked — allow pop-ups for this site and try again');
      });
      $('#backToTrade', node).addEventListener('click', function () { acknowledge(); closeLayer(); });
    }
  };
  function setStep(name, state) {
    var li = $('.step[data-step="' + name + '"]', inner);
    if (!li) return;
    li.setAttribute('data-state', state);
    $('.st-s', li).textContent = state === 'done' ? 'completed' : state === 'active' ? 'in progress' : 'not started';
  }
  function runCreated() {
    setStep('created', 'active'); setStep('payment', 'idle'); setStep('sent', 'idle');
    wait(700).then(function () { setStep('created', 'done'); return wait(250); }).then(function () {
      setStep('payment', 'active');
      var o = S.read().order; if (o && o.id === flow.orderId && o.status === 'paid') complete();
    });
  }
  function openProvider(id) {
    var url = 'toppay.html?order=' + encodeURIComponent(id || '');
    var w = null;
    try { w = window.open(url, 'risex_toppay_demo'); } catch (e) { w = null; }
    if (w) { try { w.focus(); } catch (e) {} }
    return w;
  }

  /* ---------------- completion (prototype-only addition) ---------------- */
  var completing = false;
  function whenVisible() {
    return new Promise(function (res) {
      if (!document.hidden) return res();
      document.addEventListener('visibilitychange', function h() { if (!document.hidden) { document.removeEventListener('visibilitychange', h); res(); } });
    });
  }
  function complete() {
    if (completing) return; completing = true;
    stepLabel('paid');
    whenVisible().then(function () { return wait(350); }).then(function () {
      setStep('payment', 'done');
      return wait(300);
    }).then(function () {
      setStep('sent', 'active');
      return wait(1500);
    }).then(function () {
      var s = S.update(function (st) { if (st.order && st.order.status !== 'complete') { st.deposited = Math.round((st.deposited + st.order.usdc) * 100) / 100; st.order.status = 'complete'; } });
      setStep('sent', 'done');
      showResult(s.order);
      completing = false;
    });
  }
  function showResult(order) {
    stepLabel('done');
    resizeSheet(function () {
      var pend = $('[data-part="pending"]', inner), done = $('[data-part="done"]', inner);
      pend.hidden = true; done.hidden = false;
      $('[data-bind="resultCopy"]', done).textContent = S.fmtUsdc(order.usdc) + ' USDC has been added to your RISEx Perps balance.';
      done.classList.add('sheet-view', 'is-entering');
    });
    focusFirst(inner, '#backToTrade');
  }
  function acknowledge() {
    var s = S.update(function (st) { if (st.order) st.order.ack = true; });
    var o = s.order;
    setTimeout(function () {
      animateBalances(s.deposited);
      if (o) toast('Deposit complete · +' + S.fmtUsdc(o.usdc) + ' USDC', 'success');
    }, reduced ? 0 : 260);
  }
  function isComplete() { var s = S.read(); return !!(s.order && s.order.status === 'complete'); }

  S.subscribe(function (s) {
    if (s.order && s.order.id === flow.orderId && s.order.status === 'paid' && current === 'confirm') {
      var li = $('.step[data-step="payment"]', inner);
      if (li && li.getAttribute('data-state') === 'active') complete();
    }
    if (!s.order && flow.orderId) location.reload(); // restarted from another tab
  });

  /* ---------------- close / back / collapse / keyboard ---------------- */
  layer.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]');
    if (!a) return;
    var act = a.getAttribute('data-action');
    if (act === 'close') closeLayer();
    else if (act === 'back') { showDeposit('cash'); }
    else if (act === 'collapse') {
      if (current === 'confirm') { nudge(a); toast('Order in progress — finish the payment in the TopPay tab'); }
      else setWidgetState('topup');
    }
  });
  $('#overlay').addEventListener('click', function () {
    if (current === 'crypto' || current === 'cash' || current === 'topup') closeLayer();
  });
  document.addEventListener('keydown', function (e) {
    if (layer.hidden) return;
    if (e.key === 'Escape') {
      if (current === 'crypto' || current === 'cash' || current === 'topup') closeLayer();
      else if (current === 'login' || current === 'pay') setWidgetState('topup');
      else toast('Order in progress — finish the payment in the TopPay tab');
    }
    if (e.key === 'Tab') { // keep focus inside the open dialog
      var m = !widget.hidden ? widget : depModal;
      var f = $$('button:not([disabled]), input:not([tabindex="-1"]), [tabindex="0"]', m).filter(function (el) { return el.offsetParent !== null && !el.closest('[inert]'); });
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { f[0].focus(); e.preventDefault(); }
    }
  });

  /* ---------------- restart ---------------- */
  $('#restartBtn').addEventListener('click', function () {
    S.reset();
    try { sessionStorage.setItem('risex-demo-restarted', '1'); } catch (e) {}
    location.reload();
  });

  /* ---------------- boot ---------------- */
  renderStatic();
  paintIcons(document);
  var st = S.read();
  shown = st.deposited; paintBalances(st.deposited);
  setAmount(flow.vnd);
  stepLabel(st.order && st.order.status === 'complete' ? 'after' : 'trade');
  try { if (sessionStorage.getItem('risex-demo-restarted')) { sessionStorage.removeItem('risex-demo-restarted'); setTimeout(function () { toast('Demo restarted'); }, 300); } } catch (e) {}

  // A refresh mid-payment returns to the same order instead of a blank or stale screen.
  if (st.order && !st.order.ack) {
    flow.orderId = st.order.id; flow.vnd = st.order.vnd; flow.signedIn = true;
    if (st.order.status === 'complete') { shown = st.deposited - st.order.usdc; paintBalances(shown); }
    showWidget('confirm');
    setStep('created', 'done');
    if (st.order.status === 'pending') setStep('payment', 'active'), setStep('sent', 'idle');
    else if (st.order.status === 'paid') { setStep('payment', 'active'); setStep('sent', 'idle'); complete(); }
    else { setStep('payment', 'done'); setStep('sent', 'done'); showResult(st.order); }
  }
})();
