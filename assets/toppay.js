/* Provider tab (TopPay / ACB). Opened by RISEx "Pay with Bank Account".
   Account number and recipient are demo placeholders so nobody can transfer
   real money from this page; the QR image is the illustrative, non-payable
   pattern from Figma. */
(function () {
  var S = window.DemoStore, D = S.DEMO;
  var $ = function (s) { return document.querySelector(s); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEMO_ACCOUNT = '00000000';
  var DEMO_NAME = 'TÀI KHOẢN DEMO';

  document.querySelectorAll('i[data-icon]').forEach(function (el) { var s = window.ICONS[el.getAttribute('data-icon')]; if (s) el.innerHTML = s; });

  var orderId = new URLSearchParams(location.search).get('order') || '';
  var order = null;

  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('is-on'); }, 1800);
  }

  function view(name) {
    $('#viewPay').hidden = name !== 'pay';
    $('#viewPaid').hidden = name !== 'paid';
    $('#viewGone').hidden = name !== 'gone';
    $('#simBtn').disabled = name !== 'pay';
    $('#simBtn').querySelector('.btn-label').textContent = name === 'paid' ? 'Payment simulated' : name === 'gone' ? 'No active demo order' : 'Simulate successful payment';
  }

  function sync() {
    var s = S.read();
    order = s.order && s.order.id === orderId ? s.order : null;
    if (!order) { view('gone'); stopTimer(); return; }
    var amt = S.fmtVndCommas(order.vnd);
    $('#vAccount').textContent = DEMO_ACCOUNT;
    $('#vName').textContent = DEMO_NAME;
    $('#vAmount').textContent = amt + ' VND';
    $('#qrAmount').textContent = amt;
    $('#paidAmount').textContent = amt;
    document.querySelectorAll('[data-memo]').forEach(function (el) { el.textContent = D.memo; });
    $('#vMemo').textContent = D.memo;
    if (order.status === 'pending') { view('pay'); startTimer(); }
    else { $('#paidAt').textContent = new Date(order.paidAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); view('paid'); stopTimer(); }
  }

  /* countdown — 15 min from order creation (illustrative) */
  var timer = null;
  function tick() {
    var left = Math.max(0, order.createdAt + D.qrMinutes * 60000 - Date.now());
    var sec = Math.floor(left / 1000);
    var p = function (n) { return String(n).padStart(2, '0'); };
    $('#hh').textContent = p(Math.floor(sec / 3600)); $('#mm').textContent = p(Math.floor(sec / 60) % 60); $('#ss').textContent = p(sec % 60);
  }
  function startTimer() { if (timer) return; tick(); timer = setInterval(tick, 1000); }
  function stopTimer() { clearInterval(timer); timer = null; }

  /* copy */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } finally { ta.remove(); }
    });
  }
  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!order) return;
      var key = b.getAttribute('data-copy');
      var val = { account: DEMO_ACCOUNT, name: DEMO_NAME, amount: String(order.vnd), memo: D.memo }[key];
      copyText(val).then(function () {
        b.classList.add('is-done'); b.textContent = 'Đã sao chép';
        toast('Đã sao chép: ' + val);
        setTimeout(function () { b.classList.remove('is-done'); b.textContent = 'Sao chép'; }, 1600);
      }, function () { toast('Không thể sao chép — hãy chọn và sao chép thủ công'); });
    });
  });

  /* download QR — the illustrative pattern, captioned as non-payable */
  $('#dlBtn').addEventListener('click', function () {
    var b = this; if (!order) return;
    b.classList.add('is-loading');
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'), pad = 40, size = 290, cap = 56;
      c.width = (size + pad * 2) * 2; c.height = (size + pad * 2 + cap) * 2;
      var x = c.getContext('2d'); x.scale(2, 2);
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, pad, pad, size, size);
      x.textAlign = 'center'; x.fillStyle = '#ff4446'; x.font = '500 18px Geist, sans-serif';
      x.fillText(S.fmtVndCommas(order.vnd) + ' VND', pad + size / 2, pad + size + 28);
      x.fillStyle = '#7a879a'; x.font = '500 11px "Geist Mono", monospace';
      x.fillText('DEMO ONLY · NOT A PAYMENT QR · ' + D.memo, pad + size / 2, pad + size + 50);
      c.toBlob(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'toppay-qr-' + D.memo + '-demo.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        b.classList.remove('is-loading');
        var l = b.querySelector('.dl-label'); l.textContent = 'Đã tải mã QR';
        toast('Đã tải xuống ' + a.download);
        setTimeout(function () { l.textContent = 'Tải mã QR'; }, 1800);
      });
    };
    img.onerror = function () { b.classList.remove('is-loading'); toast('Không thể tải mã QR'); };
    img.src = 'assets/brand/qr.svg';
  });

  $('#langBtn').addEventListener('click', function () { toast('Đổi ngôn ngữ không nằm trong bản demo'); });

  /* simulate payment */
  $('#simBtn').addEventListener('click', function () {
    var b = this; if (!order || order.status !== 'pending') return;
    b.classList.add('is-loading'); b.disabled = true;
    setTimeout(function () {
      S.update(function (s) { if (s.order && s.order.id === orderId && s.order.status === 'pending') { s.order.status = 'paid'; s.order.paidAt = Date.now(); } });
      b.classList.remove('is-loading');
      sync();
    }, reduced ? 50 : 1100);
  });

  $('#backBtn').addEventListener('click', function () {
    try { if (window.opener && !window.opener.closed) window.opener.focus(); } catch (e) {}
    window.close();
    setTimeout(function () { toast('Hãy chuyển về tab RISEx để xem trạng thái'); }, 150);
  });

  S.subscribe(sync);
  sync();
})();
