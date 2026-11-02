/* Shared demo state for the RISEx tab and the provider (TopPay) tab.
   Both pages are served from the same origin, so localStorage + the `storage`
   event keep them in sync. Nothing here talks to a network or a payment API. */
(function () {
  var KEY = 'risex-onramp-demo-v1';
  var TTL = 30 * 60 * 1000; // a returning visitor after 30 min starts fresh

  // Illustrative figures only — not a Crossmint quote or a live exchange rate.
  // 2.580.313 VND in the Figma design = 100.00 USDC at this demo rate.
  var DEMO = {
    rate: 25803.13,          // VND per 1 USDC (illustrative)
    defaultVnd: 2580313,
    limitUsd: 4000,          // "$4k limit" on the Bank Transfer option
    minUsdc: 1,
    base: { equity: 23.72, collat: 23.70, available: 15.09, notional: 17.32 },
    memo: 'A8K3T2GR',
    qrMinutes: 15
  };

  function now() { return Date.now(); }
  function blank() { return { v: 1, deposited: 0, order: null, updatedAt: now() }; }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var s = JSON.parse(raw);
      if (!s || s.v !== 1 || now() - (s.updatedAt || 0) > TTL) return blank();
      return s;
    } catch (e) { return blank(); }
  }
  function write(s) {
    s.updatedAt = now();
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function update(fn) { var s = read(); fn(s); return write(s); }
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    // second write so other tabs get a `storage` event even if nothing was stored
    try { localStorage.setItem(KEY + ':reset', String(now())); } catch (e) {}
  }
  function subscribe(cb) {
    window.addEventListener('storage', function (e) {
      if (e.key === KEY || e.key === KEY + ':reset' || e.key === null) cb(read());
    });
  }

  function usdcFor(vnd) { return Math.round((vnd / DEMO.rate) * 100) / 100; }
  function vndFor(usd) { return Math.round(usd * DEMO.rate); }
  function fmtVndDots(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function fmtVndCommas(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmtUsd(n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmtUsdc(n) { return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function newOrderId() { return 'ord_' + Math.random().toString(36).slice(2, 8) + now().toString(36).slice(-4); }

  window.DemoStore = {
    DEMO: DEMO, read: read, write: write, update: update, reset: reset, subscribe: subscribe,
    usdcFor: usdcFor, vndFor: vndFor, fmtVndDots: fmtVndDots, fmtVndCommas: fmtVndCommas,
    fmtUsd: fmtUsd, fmtUsdc: fmtUsdc, newOrderId: newOrderId
  };
})();
