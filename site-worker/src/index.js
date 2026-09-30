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
 *
 *   /s/ABCDEF?n=<name>   -> «الشلة»'s link: «انضم لشلة <name> على عشرى جيمينج», then /?crew=ABCDEF
 *                           (the name comes from the sharer's phone, in the link; nothing is looked up)
 *
 * A browser goes on at once (a meta refresh, and location.replace so /r/ABCD
 * isn't left in its history). A phone that has the app is sent on by the app's
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

function page({ lang, title, desc, image, alt, url, target, site }) {
  const t = esc(title), d = esc(desc), i = esc(image), u = esc(url), g = esc(target);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
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
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#2e1065;color:#fff;font:600 18px system-ui,sans-serif}a{color:#fbbf24}</style>
</head>
<body><p><a href="${g}">${t}</a></p></body>
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

  let title, desc;
  if (lang === 'en') {
    title = gameName ? `Come play ${gameName} - room ${code}` : `Join room ${code} on ${site}`;
    desc = `Open the link, type your name and you're in. Party games on your phones, free, nothing to install.`;
  } else {
    title = gameName ? `تعالى نلعب ${gameName} - الغرفة ${code}` : `ادخل الغرفة ${code} على ${site}`;
    desc = `افتح اللينك واكتب اسمك وتبقى معانا. ألعاب جماعية على الموبايلات، ببلاش ومن غير تحميل.`;
  }
  const image = url.origin + '/og/' + (game && game.img ? game.img : 'app.jpg');
  const target = url.origin + '/?room=' + code;
  const self = url.origin + '/r/' + code + (url.search || '');
  return new Response(page({ lang, title, desc, image, alt: gameName || site, url: self, target, site }), {
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
    title = name ? `انضم لشلة «${name}» على ${site}` : `انضم للشلة على ${site}`;
    desc = `الدوري بتاعنا: مين يكسب ليالي أكتر الشهر ده. افتح اللينك واختار اسمك.`;
  }
  const target = url.origin + '/?crew=' + code;
  const self = url.origin + '/s/' + code + (url.search || '');
  return new Response(page({ lang, title, desc, image: url.origin + '/og/app.jpg', alt: site, url: self, target, site }), {
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
