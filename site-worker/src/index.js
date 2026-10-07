/*
 * play - the app's main address (https://play.3ashry.workers.dev).
 *
 * Almost everything here is docs/ served as static files by Cloudflare, which
 * never runs this script and costs nothing. The one exception is a room's link,
 * /r/CODE (wrangler.toml, assets.run_worker_first = ["/r/*"]): a crawler that
 * fetches it (WhatsApp, Telegram, Facebook, X, iMessage...) needs a page with the
 * room's own title and picture, and the app's page is the same for every link.
 *
 *   /r/ABCD              -> a small page: «ادخل الغرفة ABCD على عشرى جيمينج» and
 *                           og/app.jpg, then straight on to /?room=ABCD
 *   /r/ABCD?g=imposter   -> «تعالى نلعب الجاسوس - الغرفة ABCD» and og/imposter.jpg
 *   /r/ABCD?l=en         -> the same in English (the sharer's phone was in English)
 *   /r/ABCD?p=5          -> a room running برنامج السهرة: «سهرة الليلة: ٥ ألعاب - الغرفة ABCD»
 *   /r/ABCD?c=1&n=<name> -> a room opened «للشلة»: «سهرة الشلة «<name>» - الغرفة ABCD»
 *                           (both from the sharer's phone, in the link; the ideas of 7 Oct 2026, 1323)
 *
 *   /s/ABCDEF?n=<name>   -> «الشلة»'s link: «انضم لشلة <name> على عشرى جيمينج», then /?crew=ABCDEF
 *                           (the name comes from the sharer's phone, in the link; nothing is looked up)
 *
 * A browser goes on at once (a meta refresh, and location.replace so /r/ABCD
 * isn't left in its history); a webview that blocks both still shows the code big
 * and a button that goes in (1322). A phone that has the app is sent on by the app's
 * own service worker before it even asks (sw.js). The names come from
 * docs/og/games.json (tools/make-og.mjs), read through the assets binding: a
 * new room game needs no change here. Nothing is stored and nothing is logged.
 */

const CODE = /^[A-Za-z0-9]{4,8}$/;
const CREW_CODE = /^[A-Za-z]{6}$/;
const GAME = /^[a-z0-9]{1,24}$/;

let gamesCache = null;   // { at, data }
const GAMES_TTL_MS = 10 * 60 * 1000;

async function games(env, origin) {
  if (gamesCache && Date.now() - gamesCache.at < GAMES_TTL_MS) return gamesCache.data;
  let data = null;
  try {
    const res = await env.ASSETS.fetch(new Request(origin + '/og/games.json'));
    if (res.ok) data = await res.json();
  } catch (e) { /* the page still works with the app's own words */ }
  data = data || { app: { ar: 'عشرى جيمينج', en: 'Ashry Gaming' }, games: {} };
  gamesCache = { at: Date.now(), data };
  return data;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function page({ lang, title, desc, image, alt, url, target, site, code, cta }) {
  const t = esc(title), d = esc(desc), i = esc(image), u = esc(url), g = esc(target);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  // What a person sees if the redirect is blocked (an in-app browser that ignores the refresh):
  // the code big, and a button as tall as the app's own (48px) that goes in.
  const body = code
    ? `<main><p class="c" dir="ltr">${esc(code)}</p><a class="b" href="${g}">${esc(cta || title)}</a><p class="t">${t}</p></main>`
    : `<p><a href="${g}">${t}</a></p>`;
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${u}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site)}">
<meta property="og:locale" content="${lang === 'ar' ? 'ar_EG' : 'en_US'}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${i}">
<meta property="og:image:secure_url" content="${i}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
<meta name="theme-color" content="#4c1d95">
<meta http-equiv="refresh" content="0;url=${g}">
<script>location.replace(${JSON.stringify(target)});</script>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#2e1065;color:#fff;font:600 18px system-ui,sans-serif;padding:16px;box-sizing:border-box}a{color:#fbbf24}main{display:grid;justify-items:center;gap:16px;text-align:center;max-width:28rem}.c{margin:0;font:800 64px/1 system-ui,sans-serif;letter-spacing:.12em}.b{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 28px;border-radius:14px;background:#fbbf24;color:#2e1065;font-weight:800;font-size:20px;text-decoration:none}.t{margin:0;color:rgba(255,255,255,.8);font-size:16px}</style>
</head>
<body>${body}</body>
</html>`;
}

async function roomPage(request, env, url) {
  const rest = url.pathname.slice(3).replace(/\/+$/, '');   // after "/r/"
  if (!CODE.test(rest)) {
    // Not a code: an asset asked for relative to /r/ (a page opened at /r/CODE by an
    // older offline copy of the app), or a mistyped link. The file if there is one,
    // else the app.
    if (rest && rest.indexOf('/') === -1 && rest.indexOf('.') !== -1) {
      return env.ASSETS.fetch(new Request(url.origin + '/' + rest, request));
    }
    return Response.redirect(url.origin + '/', 302);
  }
  const code = rest.toUpperCase();
  const lang = url.searchParams.get('l') === 'en' ? 'en' : 'ar';
  const gameId = (url.searchParams.get('g') || '').toLowerCase();
  const data = await games(env, url.origin);
  const game = GAME.test(gameId) ? data.games[gameId] : null;
  const site = data.app[lang] || data.app.ar;
  const gameName = game && (game[lang] || game.ar);
  // A night rather than one game (1323): برنامج السهرة's number of games (?p=), or «الشلة» (?c=1, its name in ?n=).
  const progN = Math.floor(Number(url.searchParams.get('p')));
  const prog = progN >= 1 && progN <= 12 ? progN : 0;
  const crew = url.searchParams.get('c') === '1';
  const crewName = crew ? String(url.searchParams.get('n') || '').replace(/[\u0000-\u001f\u007f<>«»"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30) : '';
  const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

  let title, desc;
  if (lang === 'en') {
    title = prog ? `Tonight's show: ${prog} game${prog === 1 ? '' : 's'} - room ${code}`
      : crew ? `The crew's night${crewName ? ` “${crewName}”` : ''} - room ${code}`
      : gameName ? `Come play ${gameName} - room ${code}` : `Join room ${code} on ${site}`;
    desc = `Open the link, type your name and you're in. Party games on your phones, free, nothing to install.`;
  } else {
    title = prog ? `سهرة الليلة: ${arNum(prog)} ${prog >= 3 && prog <= 10 ? 'ألعاب' : 'لعبة'} - الغرفة ${code}`
      : crew ? `سهرة الشلة${crewName ? ` «${crewName}»` : ''} - الغرفة ${code}`
      : gameName ? `تعالى نلعب ${gameName} - الغرفة ${code}` : `ادخل الغرفة ${code} على ${site}`;
    desc = `افتح اللينك واكتب اسمك وتبقى معانا. ألعاب جماعية على الموبايلات، ببلاش ومن غير تحميل.`;
  }
  // A night's preview is the app's picture: no one game stands for it.
  const image = url.origin + '/og/' + (game && game.img && !prog && !crew ? game.img : 'app.jpg');
  const target = url.origin + '/?room=' + code;
  const self = url.origin + '/r/' + code + (url.search || '');
  const cta = lang === 'en' ? 'Join the room' : 'ادخل الغرفة';
  return new Response(page({ lang, title, desc, image, alt: (!prog && !crew && gameName) || site, url: self, target, site, code, cta }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // The same for everyone who opens this link; a short while, since a room lives for hours.
      'cache-control': 'public, max-age=300',
      'x-robots-tag': 'noindex'
    }
  });
}

/** «الشلة»'s link, /s/CODE: a preview page with the crew's name (the sharer's, in ?n=), then the app. */
async function crewPage(request, env, url) {
  const rest = url.pathname.slice(3).replace(/\/+$/, '');   // after "/s/"
  if (!CREW_CODE.test(rest)) {
    if (rest && rest.indexOf('/') === -1 && rest.indexOf('.') !== -1) {
      return env.ASSETS.fetch(new Request(url.origin + '/' + rest, request));
    }
    return Response.redirect(url.origin + '/', 302);
  }
  const code = rest.toUpperCase();
  const lang = url.searchParams.get('l') === 'en' ? 'en' : 'ar';
  const name = String(url.searchParams.get('n') || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30);
  const data = await games(env, url.origin);
  const site = data.app[lang] || data.app.ar;
  let title, desc;
  if (lang === 'en') {
    title = name ? `Join the crew “${name}” on ${site}` : `Join a crew on ${site}`;
    desc = `Our family's own league: who wins the most nights this month. Open the link and pick your name.`;
  } else {
    title = name ? `انضم لـ «${name}» على ${site}` : `انضم للشلة على ${site}`;
    desc = `الدوري بتاعنا: مين يكسب ليالي أكتر الشهر ده. افتح اللينك واختار اسمك.`;
  }
  const target = url.origin + '/?crew=' + code;
  const self = url.origin + '/s/' + code + (url.search || '');
  return new Response(page({ lang, title, desc, image: url.origin + '/og/app.jpg', alt: site, url: self, target, site, code, cta: lang === 'en' ? 'Open the crew' : 'ادخل الشلة' }), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-robots-tag': 'noindex' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/r' || url.pathname.startsWith('/r/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('method not allowed', { status: 405 });
      if (url.pathname === '/r' || url.pathname === '/r/') return Response.redirect(url.origin + '/', 302);
      return roomPage(request, env, url);
    }
    if (url.pathname === '/s' || url.pathname.startsWith('/s/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('method not allowed', { status: 405 });
      if (url.pathname === '/s' || url.pathname === '/s/') return Response.redirect(url.origin + '/', 302);
      return crewPage(request, env, url);
    }
    // Anything else that reaches the script is what the assets don't have: let them answer (a 404).
    return env.ASSETS.fetch(request);
  }
};
