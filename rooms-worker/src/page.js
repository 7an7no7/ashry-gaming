/* The connection test page the Worker serves at /test. Open it on a phone to
   check that rooms work on that network: it joins a real (empty) room, keeps a
   live connection, and shows the ping. */
export default `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>اختبار الاتصال - عشرى جيمينج</title>
<style>
  :root { color-scheme: light dark; --bg:#f6f4ff; --card:#fff; --text:#1f1b2e; --muted:#6b6780; --accent:#6d28d9; --ok:#15803d; --bad:#b91c1c; }
  @media (prefers-color-scheme: dark) { :root { --bg:#14111f; --card:#1f1b2e; --text:#f3f0ff; --muted:#a8a3bd; --accent:#a78bfa; --ok:#4ade80; --bad:#f87171; } }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif; background: var(--bg); color: var(--text); }
  main { max-width: 480px; margin: 0 auto; padding: 16px; }
  h1 { font-size: 1.3rem; margin: 8px 0 4px; }
  p { color: var(--muted); margin: 0 0 12px; font-size: .95rem; }
  .card { background: var(--card); border-radius: 16px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,.06); }
  label { display: block; font-weight: 700; font-size: .9rem; margin: 8px 0 4px; }
  input { width: 100%; font: inherit; padding: 12px; border-radius: 12px; border: 1px solid #8884; background: transparent; color: inherit; }
  button { width: 100%; font: inherit; font-weight: 800; padding: 14px; border: 0; border-radius: 14px; background: var(--accent); color: #fff; margin-top: 10px; }
  .row { display: flex; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid #8882; }
  .row:last-child { border-bottom: 0; }
  .num { font-weight: 800; font-variant-numeric: tabular-nums; }
  .ok { color: var(--ok); } .bad { color: var(--bad); }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 6px 0; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
<main>
  <h1>اختبار اتصال الغرف 📶</h1>
  <p>اكتب اسمك وادخل. عشان تجرب مع حد تاني، ابعتله رابط الغرفة.</p>

  <section class="card" id="join">
    <label for="code">كود الغرفة (سيبه فاضي لغرفة جديدة)</label>
    <input id="code" maxlength="8" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em;text-align:center">
    <label for="name">اسمك</label>
    <input id="name" maxlength="24" autocomplete="off">
    <button id="go">دخول</button>
    <p id="error" class="bad" hidden></p>
  </section>

  <section id="room" hidden>
    <div class="card">
      <div class="row"><span>الغرفة</span><span class="num" id="roomCode"></span></div>
      <div class="row"><span>الاتصال</span><span id="status">…</span></div>
      <div class="row"><span>البنج</span><span class="num" id="ping">-</span></div>
      <div class="row"><span>رحلة للغرفة وراجع</span><span class="num" id="trip">-</span></div>
      <button id="share">📋 رابط الغرفة</button>
      <button id="leave" style="background:transparent;color:var(--accent);border:2px solid var(--accent)">خروج</button>
    </div>
    <div class="card"><b>في الغرفة دلوقتي</b><ul id="people"></ul></div>
  </section>
</main>
<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  $('code').value = (params.get('room') || '').toUpperCase();
  try { $('name').value = localStorage.getItem('rt_name') || ''; } catch (e) {}

  var session = null, ws = null, pingAt = 0, tripAt = 0, timer = null, wanted = false;
  var ms = function (n) { return n + ' مللي ثانية'; };

  function post(path, body) {
    return fetch(path, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  function status(text, ok) { $('status').textContent = text; $('status').className = ok ? 'ok' : 'bad'; }

  function show(state) {
    $('people').innerHTML = '';
    state.players.forEach(function (p) {
      var li = document.createElement('li');
      li.textContent = (p.online ? '🟢 ' : '⚪ ') + p.name + (p.id === session.playerId ? ' (أنت)' : '');
      $('people').appendChild(li);
    });
  }

  function connect() {
    var url = location.origin.replace(/^http/, 'ws') + '/ws?code=' + session.code + '&pid=' + session.playerId + '&key=' + session.key;
    ws = new WebSocket(url);
    status('جارٍ الاتصال…', false);
    ws.onopen = function () {
      status('متصل ✅', true);
      clearInterval(timer);
      timer = setInterval(function () {
        if (ws.readyState !== 1) return;
        pingAt = Date.now(); ws.send('ping');
        tripAt = Date.now(); ws.send(JSON.stringify({ t: 'sync' }));
      }, 2000);
    };
    ws.onmessage = function (e) {
      if (e.data === 'pong') { $('ping').textContent = ms(Date.now() - pingAt); return; }
      var m = JSON.parse(e.data);
      if (m.t === 'state') {
        if (tripAt) { $('trip').textContent = ms(Date.now() - tripAt); tripAt = 0; }
        show(m.state);
      } else if (m.t === 'gone' || m.t === 'kicked') {
        wanted = false; status('الغرفة انتهت', false);
      }
    };
    ws.onclose = function () {
      clearInterval(timer);
      if (!wanted) return;
      status('انقطع — بيحاول تاني…', false);
      setTimeout(connect, 1000);
    };
  }

  $('go').onclick = function () {
    var code = $('code').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    var name = $('name').value.trim();
    if (!name) { $('name').focus(); return; }
    try { localStorage.setItem('rt_name', name); } catch (e) {}
    $('error').hidden = true;
    var t0 = Date.now();
    (code ? post('/join', { code: code, name: name }) : post('/create', { name: name })).then(function (res) {
      if (!res.ok) throw new Error(res.error === 'ROOM_NOT_FOUND' ? 'مفيش غرفة بالكود ده' : res.error);
      session = { code: res.state.code, playerId: res.playerId, key: res.key };
      history.replaceState(null, '', '/test?room=' + session.code);
      $('join').hidden = true;
      $('room').hidden = false;
      $('roomCode').textContent = session.code + ' (' + ms(Date.now() - t0) + ')';
      show(res.state);
      wanted = true;
      connect();
    }).catch(function (err) {
      $('error').textContent = err.message || 'تعذر الاتصال';
      $('error').hidden = false;
    });
  };

  $('share').onclick = function () {
    var link = location.origin + '/test?room=' + session.code;
    if (navigator.share) navigator.share({ url: link }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { $('share').textContent = '✅ اتنسخ'; });
  };

  $('leave').onclick = function () {
    wanted = false;
    if (ws) ws.close();
    post('/leave', { code: session.code, pid: session.playerId, key: session.key }).catch(function () {});
    location.href = '/test';
  };

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && wanted && (!ws || ws.readyState > 1)) connect();
  });
})();
</script>
</body>
</html>`;
