/* ============================================================================
   «الشلة» (the crew): a family or a group of friends kept across evenings. The
   rules here are plain functions, shared by the rooms server (bundled by
   rooms-worker/build.mjs: the Crew Durable Object in rooms-worker/src/crew.js
   keeps a crew, the Room turns its night into one with crewNightInput) and the
   rules tests. No DOM, no storage, no clock of its own: `now` is always passed.

   A night is one room session opened «للشلة» (room.crew): every game banked on
   the night's leaderboard (bankNightPoints, 5/3/2 and 1 for everyone else, a game) adds up to the night's
   points, the most points wins the night, and the season is the calendar month
   (Cairo time, the night's start less six hours, so a night that goes past
   midnight stays on the day it began). The table: nights won, then points.

   Every name starts with crew / CREW_.
   ========================================================================= */

// Six letters for a crew's code, none that is read wrong out loud (no I, L, O).
const CREW_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const CREW_CODE_LEN = 6;
const CREW_CODE_RE = /^[A-Z]{6}$/;
const CREW_NAME_MAX = 30;
const CREW_MEMBER_NAME_MAX = 24;
const CREW_MAX_MEMBERS = 30;
const CREW_MAX_NIGHTS = 400;          // a crew that plays every night keeps over a year of them
const CREW_MAX_PACKS = 30;
const CREW_NIGHTS_SHOWN = 30;         // the السهرات tab
const CREW_DAY_SHIFT_MS = 6 * 3600 * 1000;
const CREW_TZ = 'Africa/Cairo';
const CREW_PROGRAMS_KEPT = 3;         // «برنامج السهرة»: a night keeps its last three programs
const CREW_PROGRAM_AWARDS = 8;        // and each one's awards (the program gives eight at most)

/** A code for a new crew, from a random source returning 0..1. */
const crewNewCode = (rnd) => {
  let s = '';
  for (let i = 0; i < CREW_CODE_LEN; i++) s += CREW_ALPHABET[Math.floor(rnd() * CREW_ALPHABET.length) % CREW_ALPHABET.length];
  return s;
};

/** A typed code or a pasted link (/s/CODE, ?crew=CODE) to the code, or ''. */
const crewCleanCode = (raw) => {
  const text = String(raw || '').trim();
  const m = /(?:[?&]crew=|\/s\/)([A-Za-z]{6})/.exec(text);
  const code = (m ? m[1] : text).toUpperCase().replace(/[^A-Z]/g, '');
  return CREW_CODE_RE.test(code) ? code : '';
};

/** A name as two phones would agree on it: أحمد and احمد, spaces and marks folded. */
const crewFold = (name) => String(name || '').toLowerCase()
  .replace(/[ً-ْٰـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي')
  .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ک/g, 'ك')
  .replace(/\s+/g, ' ').trim();

const crewCleanName = (raw, max) => String(raw || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** 'YYYY-MM-DD' of a night that started at `ts` (Cairo time, the day starting at 6 AM). */
const crewDateOf = (ts) => {
  const d = new Date(Number(ts) - CREW_DAY_SHIFT_MS);
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: CREW_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch (e) {
    return d.toISOString().slice(0, 10);   // no time zones in this engine: UTC is close enough
  }
};
const crewMonthOf = (ts) => crewDateOf(ts).slice(0, 7);

/* --- the games a title counts (a first place in one of these, a game of the night) ---
   Every room game is in one group (a cooperative one - العقل, الحقوا!, الأوضة المضلمة, حط إيدك!,
   ارسم واكتب, لو خيروك - banks no first place, but is listed for when it does). A tournament
   counts as its own duel's id (room.game stays connect4, dots, xo...). The review of 1 Oct 2026
   found seven missing and the trivia under "words"; rules.mjs fails on a room game with no group. */
// CREW_TITLE_GAMES (title -> room game ids) is built from each game's `crew` in Games.js.
// Titles (the season's; a holder needs 2 at least and to be alone on top): the key is the
// translation's `crew_t_<key>` on the page. Never a "worst" title.
const CREW_TITLES = ['fast', 'liar', 'detective', 'oracle', 'cards', 'brain', 'words', 'sport', 'luck'];
// The rooms' own tallies that count toward a title besides first places (s.fastest, s.bestLiar).
const CREW_TALLY_TITLE = { fastest: 'fast', bestLiar: 'liar' };
// Record scores kept from a game's board: the top row's score (higher is better).
const CREW_RECORD_GAMES = ['bowling', 'trivia'];

/**
 * What a room's night is, for its crew (the Room calls this; the crew maps names).
 * `room.night` is pid -> points (bankNightPoints), `room.nightx` what bankNightPoints
 * and settlePredictions noted beside it (names, first places, best scores, guesses right),
 * `room.crewLinks` pid -> member id for the phones that proved they are a member.
 * Computer players are left out. Returns null when nobody scored.
 */
const crewNightInput = (room) => {
  const night = room.night || {};
  const x = room.nightx || {};
  const names = x.names || {};
  const links = room.crewLinks || {};
  const botIds = new Set(((room.players || []).filter(p => p.bot)).map(p => p.id).concat(x.bots || []));
  const nameOf = (pid) => {
    const p = (room.players || []).find(q => q.id === pid);
    return (p && p.name) || names[pid] || '';
  };
  const person = (pid) => !botIds.has(pid) && !!nameOf(pid);
  const rows = Object.keys(night).filter(person)
    .map(pid => ({ name: nameOf(pid), member: links[pid] || null, points: Number(night[pid]) || 0 }))
    .filter(r => r.points > 0)
    .sort((a, b) => b.points - a.points);
  if (!rows.length) return null;
  const tag = (pid) => ({ name: nameOf(pid), member: links[pid] || null });
  return {
    id: String(room.crewNight || ''),
    start: Number(room.createdAt) || Date.now(),
    games: (x.games || []).slice(-40),
    rows,
    wins: (x.wins || []).filter(w => person(w.id)).map(w => Object.assign(tag(w.id), { g: w.g })).slice(-60),
    best: (x.best || []).filter(b => person(b.id)).map(b => Object.assign(tag(b.id), { g: b.g, s: b.s })).slice(-20),
    tally: (x.tally || []).filter(b => person(b.id)).map(b => Object.assign(tag(b.id), { k: b.k, n: b.n })).slice(-20),
    pred: Object.keys(x.pred || {}).filter(person).map(pid => Object.assign(tag(pid), { n: x.pred[pid] })),
    // «برنامج السهرة» (RoomProgram.js, nightProgramFinished): a night that was a program says so,
    // with its champion(s) and awards - small, the last three programs of the night at most.
    programs: (x.programs || []).slice(-CREW_PROGRAMS_KEPT).map(p => {
      const who = (id, name) => ({ name: name || nameOf(id), member: links[id] || null });
      return {
        at: Number(p.at) || 0,
        games: (p.games || []).filter(g => g && !g.skipped).map(g => String(g.id || '')).slice(0, 8),
        champions: (p.champions || []).filter(id => !botIds.has(id)).map(id => {
          const row = (p.table || []).find(r => r.id === id) || {};
          return who(id, row.name);
        }).filter(c => c.name),
        awards: (p.awards || []).filter(a => a && !botIds.has(a.id)).slice(0, CREW_PROGRAM_AWARDS)
          .map(a => Object.assign(who(a.id, a.name), { k: a.k, v: a.v, g: a.g || '', with: a.with || '', from: a.from || '' }))
          .filter(a => a.name)
      };
    })
  };
};

/**
 * A night as the crew keeps it, from what a room sent: names mapped to members (a
 * member id the room proved, else the folded name), guests kept by name.
 */
const crewCleanNight = (input, members, now) => {
  const inp = input || {};
  const byId = new Set(members.map(m => m.id));
  const byName = new Map(members.map(m => [crewFold(m.name), m.id]));
  // One room name per member: a member playing under another name with a proven link, and a
  // guest whose name folds to theirs, were two rows of one member - their points and nights
  // counted twice. A proven link is claimed first (the most points first), then a name match;
  // a second claim on a member already taken is a guest.
  const decided = new Map();   // room name -> member id, or null for a guest
  const taken = new Set();
  const claim = (n, m) => {
    if (decided.has(n)) return;
    if (m && !taken.has(m)) { taken.add(m); decided.set(n, m); } else decided.set(n, null);
  };
  const src = (Array.isArray(inp.rows) ? inp.rows : []).slice(0, 12).filter(r => r && typeof r === 'object')
    .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
  const cleanName = (r) => crewCleanName(r && r.name, CREW_MEMBER_NAME_MAX);
  src.forEach(r => { if (byId.has(r.member)) claim(cleanName(r), r.member); });
  src.forEach(r => { const n = cleanName(r); claim(n, byName.get(crewFold(n)) || null); });
  const who = (r) => {
    const name = cleanName(r);
    claim(name, r && byId.has(r.member) ? r.member : (byName.get(crewFold(name)) || null));
    return { m: decided.get(name), n: name };
  };
  const rows = src.map(r => Object.assign(who(r), { p: Math.max(0, Math.floor(Number(r.points) || 0)) }))
    .filter(r => r.n && r.p > 0).sort((a, b) => b.p - a.p);
  const start = Number(inp.start) > 0 ? Number(inp.start) : now;
  const keep = (list, max, extra) => (Array.isArray(list) ? list : []).slice(0, max).map(r => Object.assign(who(r), extra(r))).filter(r => r.n);
  return {
    id: String(inp.id || '').slice(0, 40),
    start,
    at: now,
    date: crewDateOf(start),
    month: crewMonthOf(start),
    games: (Array.isArray(inp.games) ? inp.games : []).map(g => String(g).slice(0, 24)).filter(Boolean).slice(0, 40),
    rows,
    wins: keep(inp.wins, 60, r => ({ g: String(r.g || '').slice(0, 24) })),
    best: keep(inp.best, 20, r => ({ g: String(r.g || '').slice(0, 24), s: Number(r.s) || 0 })),
    tally: keep(inp.tally, 20, r => ({ k: String(r.k || '').slice(0, 24), n: Math.max(0, Math.floor(Number(r.n) || 0)) })),
    pred: keep(inp.pred, 12, r => ({ k: 'oracle', c: Math.max(0, Math.floor(Number(r.n) || 0)) })),
    prog: (Array.isArray(inp.programs) ? inp.programs : []).slice(-CREW_PROGRAMS_KEPT).map(p => ({
      at: Number(p && p.at) || 0,
      g: (Array.isArray(p && p.games) ? p.games : []).map(g => String(g).slice(0, 24)).filter(Boolean).slice(0, 8),
      c: keep(p && p.champions, 12, () => ({})),
      aw: keep(p && p.awards, CREW_PROGRAM_AWARDS, a => ({ k: String(a.k || '').replace(/[^a-z]/gi, '').slice(0, 16),
        v: Number(a.v) || 0, g: String(a.g || '').slice(0, 24),
        w: crewCleanName(a.with, CREW_MEMBER_NAME_MAX), f: Math.floor(Number(a.from) || 0) })).filter(a => a.k)
    })).filter(p => p.g.length)
  };
};

/** The winners of a night: the members at the top (a tie is a win for each; a guest on top alone means no member won). */
const crewNightWinners = (night) => {
  const rows = night.rows || [];
  if (!rows.length) return [];
  const top = rows[0].p;
  return rows.filter(r => r.p === top);
};

/** The season's table: every member, nights won, then points, then nights played. */
const crewTable = (nights, members, month) => {
  const rows = members.map(m => ({ id: m.id, name: m.name, won: 0, points: 0, played: 0 }));
  const by = new Map(rows.map(r => [r.id, r]));
  nights.filter(n => n.month === month).forEach(n => {
    // A member counts once a night (a night kept before crewCleanNight made it so may hold two rows).
    const seen = new Set(), won = new Set();
    (n.rows || []).forEach(r => { const row = r.m && !seen.has(r.m) && by.get(r.m); if (row) { seen.add(r.m); row.played++; row.points += r.p; } });
    crewNightWinners(n).forEach(r => { const row = r.m && !won.has(r.m) && by.get(r.m); if (row) { won.add(r.m); row.won++; } });
  });
  return rows.sort((a, b) => b.won - a.won || b.points - a.points || b.played - a.played || String(a.name).localeCompare(String(b.name)));
};

/** A month's champion(s): the top of its table, when anyone won a night. */
const crewChampionOf = (nights, members, month) => {
  const table = crewTable(nights, members, month);
  if (!table.length || !table[0].won) return null;
  const top = table.filter(r => r.won === table[0].won && r.points === table[0].points);
  return { month, ids: top.map(r => r.id), names: top.map(r => r.name), won: top[0].won, points: top[0].points };
};

/** The season's titles: [{ key, id, name, n }] - a member alone on top with 2 or more. */
const crewTitles = (nights, members, month) => {
  const count = {};
  CREW_TITLES.forEach(k => { count[k] = {}; });
  const groupOf = {};
  Object.keys(CREW_TITLE_GAMES).forEach(k => CREW_TITLE_GAMES[k].forEach(g => { groupOf[g] = k; }));
  const add = (k, m, n) => { if (m && count[k]) count[k][m] = (count[k][m] || 0) + n; };
  nights.filter(n => n.month === month).forEach(n => {
    (n.wins || []).forEach(w => add(groupOf[w.g], w.m, 1));
    (n.tally || []).forEach(t => add(CREW_TALLY_TITLE[t.k], t.m, t.n));
    (n.pred || []).forEach(p => add('oracle', p.m, p.c));
  });
  const name = new Map(members.map(m => [m.id, m.name]));
  const out = [];
  CREW_TITLES.forEach(k => {
    const ids = Object.keys(count[k]).filter(id => name.has(id));
    if (!ids.length) return;
    const best = Math.max.apply(null, ids.map(id => count[k][id]));
    const top = ids.filter(id => count[k][id] === best);
    if (best >= 2 && top.length === 1) out.push({ key: k, id: top[0], name: name.get(top[0]), n: best });
  });
  return out;
};

/** The records (every night kept): [{ key, id, name, value, date }]. */
const crewRecords = (nights, members, champs) => {
  const name = new Map(members.map(m => [m.id, m.name]));
  const nm = (r) => (r.m && name.get(r.m)) || r.n;
  const sorted = nights.slice().sort((a, b) => a.start - b.start);
  const out = [];
  const bestOf = (key, pick) => { if (pick && pick.value > 0) out.push(Object.assign({ key }, pick)); };
  // A record score in a game, over every night (the top row of that game's board).
  CREW_RECORD_GAMES.forEach(g => {
    let best = null;
    sorted.forEach(n => (n.best || []).forEach(b => {
      if (b.g === g && (!best || b.s > best.value)) best = { id: b.m, name: nm(b), value: b.s, date: n.date };
    }));
    bestOf('best_' + g, best);
  });
  // The most points in one night.
  let most = null;
  sorted.forEach(n => { const r = (n.rows || [])[0]; if (r && (!most || r.p > most.value)) most = { id: r.m, name: nm(r), value: r.p, date: n.date }; });
  bestOf('night_points', most);
  // The most games won in one night.
  let games = null;
  sorted.forEach(n => {
    const by = {};
    (n.wins || []).forEach(w => { const k = w.m || ('g:' + crewFold(w.n)); by[k] = by[k] || { r: w, n: 0 }; by[k].n++; });
    Object.keys(by).forEach(k => { if (!games || by[k].n > games.value) games = { id: by[k].r.m, name: nm(by[k].r), value: by[k].n, date: n.date }; });
  });
  if (games && games.value >= 2) bestOf('night_games', games);
  // The longest run of nights won one after another (a member only).
  let run = null;
  let cur = { id: null, len: 0 };
  sorted.forEach(n => {
    const w = crewNightWinners(n).filter(r => r.m);
    const id = w.length === 1 ? w[0].m : (w.some(r => r.m === cur.id) ? cur.id : (w[0] ? w[0].m : null));
    if (id && id === cur.id) cur.len++; else cur = { id, len: id ? 1 : 0 };
    if (cur.id && name.has(cur.id) && (!run || cur.len > run.value)) run = { id: cur.id, name: name.get(cur.id), value: cur.len, date: n.date };
  });
  if (run && run.value >= 2) bestOf('streak', run);
  // The most nights won in one month (the champions' wall and the month being played).
  let month = null;
  (champs || []).forEach(c => { if (!month || c.won > month.value) month = { id: c.ids[0], name: c.names.join('، '), value: c.won, date: c.month }; });
  bestOf('month_nights', month);
  return out;
};

/** A night as the السهرات tab shows it: its date, its games, the top three and the winner(s). */
const crewNightSummary = (n, members) => {
  const name = new Map(members.map(m => [m.id, m.name]));
  const nm = (r) => (r.m && name.get(r.m)) || r.n;
  return {
    id: n.id, date: n.date, games: n.games || [],
    winners: crewNightWinners(n).map(nm),
    top: (n.rows || []).slice(0, 3).map(r => ({ name: nm(r), p: r.p, guest: !r.m || !name.has(r.m) })),
    // A night that was a program: its last program's champion(s) and awards, and how many there were.
    prog: (n.prog && n.prog.length) ? (() => {
      const p = n.prog[n.prog.length - 1];
      return { n: n.prog.length, games: p.g.length, champs: p.c.map(nm),
        aw: p.aw.map(a => ({ k: a.k, name: nm(a), v: a.v, g: a.g, with: a.w || '', from: a.f || 0 })) };
    })() : null
  };
};

/**
 * Everything a member's page shows, worked out from the kept nights. `champs` is
 * the frozen wall of past months (kept even when nights are dropped).
 */
const crewView = (meta, nights, now, you, mgr) => {
  const members = meta.members || [];
  const month = crewMonthOf(now + CREW_DAY_SHIFT_MS);   // "now" is today's date, not a night's start
  // The frozen wall, and any past month not frozen yet (its last room may still be closing).
  const have = new Set((meta.champs || []).map(c => c.month));
  const extra = Array.from(new Set(nights.map(n => n.month))).filter(m => m < month && !have.has(m))
    .map(m => crewChampionOf(nights, members, m)).filter(Boolean);
  const champs = (meta.champs || []).concat(extra).sort((a, b) => (a.month < b.month ? 1 : -1));
  const sorted = nights.slice().sort((a, b) => b.start - a.start);
  return {
    code: meta.code,
    name: meta.name,
    createdAt: meta.createdAt,
    managerId: meta.managerId,
    members: members.map(m => ({ id: m.id, name: m.name })),
    you: you || null,
    // This phone holds the manager's power (a manager key, crewKeyIsManager): the manager's name
    // on a phone that claimed it is not enough. Without `mgr` (a test), being the manager is.
    mgr: mgr === undefined ? !!you && you === meta.managerId : !!mgr,
    month,
    table: crewTable(nights, members, month),
    champions: champs,
    titles: crewTitles(nights, members, month),
    records: crewRecords(nights, members, champs),
    nights: sorted.slice(0, CREW_NIGHTS_SHOWN).map(n => crewNightSummary(n, members)),
    nightCount: nights.length,
    packs: (meta.packs || []).map(p => ({ code: p.code, kind: p.kind, title: p.title, by: p.by, byId: p.byId || '', at: p.at }))
  };
};

/**
 * Past months with nights and no frozen champion yet, frozen now (called on a write).
 * Only two days after the month ended: a room open across midnight on the last day
 * still sends its night when it closes (a room lives a day at most).
 */
const crewFreezeChamps = (meta, nights, now) => {
  const current = crewMonthOf(now - 2 * 24 * 3600 * 1000 + CREW_DAY_SHIFT_MS);
  const have = new Set((meta.champs || []).map(c => c.month));
  const months = Array.from(new Set(nights.map(n => n.month))).filter(m => m < current && !have.has(m)).sort();
  let changed = false;
  months.forEach(m => {
    const c = crewChampionOf(nights, meta.members || [], m);
    if (c) { meta.champs = (meta.champs || []).concat([c]); changed = true; }
  });
  return changed;
};

/* --- the crew's packs: codes of quizzes and word packs («اعمل مسابقتك», «كلماتنا») ----------
   A crew keeps the codes, never the packs (the rooms server's PackStore has them): every member
   sees them on the crew's page and in the word games without typing a code. Any member adds one;
   the member who added it, or the manager, takes it off. `me` is a member ({ id, name }) - the
   Durable Object proves it from the phone's key first; `me.server` is another feature's own call
   (attachPack). Errors are the Arabic words the page shows (ROOM_ERR_EN in JS_Room.html). */
const CREW_PACK_KINDS = ['quiz', 'words'];

const crewAddPackTo = (meta, me, p) => {
  const m = me || {};
  if (!m.server && !(meta.members || []).some(x => x.id === m.id)) throw new Error('مش في الشلة');
  const code = String((p && p.code) || '').trim().toUpperCase().slice(0, 16);
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error('كود مش صحيح');
  const kind = CREW_PACK_KINDS.indexOf(String((p && p.kind) || '')) !== -1 ? String(p.kind) : 'quiz';
  const title = crewCleanName(p && p.title, 40);
  const packs = meta.packs = Array.isArray(meta.packs) ? meta.packs : [];
  const had = packs.find(x => x.code === code);
  if (had) { if (title) had.title = title; return had; }   // added already: whoever added it first keeps it
  if (packs.length >= CREW_MAX_PACKS) throw new Error('الشلة فيها حاجات كتير، امسح واحدة الأول');
  const pack = { code, kind, title, by: crewCleanName(m.name, CREW_MEMBER_NAME_MAX), byId: m.server ? '' : String(m.id), at: Date.now() };
  packs.unshift(pack);
  return pack;
};

const crewRemovePackFrom = (meta, me, code) => {
  const m = me || {};
  if (!(meta.members || []).some(x => x.id === m.id)) throw new Error('مش في الشلة');
  const c = String(code || '').trim().toUpperCase();
  const pack = (meta.packs || []).find(x => x.code === c);
  if (!pack) throw new Error('مش موجودة');
  // The manager is a key's power (`m.manager`, from the Durable Object), not a name: a phone that
  // claimed the manager's name is a member like any other. Without it (a test), the member is.
  const manager = 'manager' in m ? !!m.manager : m.id === meta.managerId;
  if (!manager && pack.byId !== m.id) throw new Error('اللي ضافها أو اللي ماسك الشلة بس');
  meta.packs = meta.packs.filter(x => x !== pack);
  return pack;
};

/* --- the keys: who a phone is, and what it may do (the review of 1 Oct 2026) -----------------
   A crew is joined with its code alone, and «إنت مين فيهم؟» gives a phone any member's key, so a
   member's id proves nothing: the manager's power belongs to KEYS, not to the id. A key is
   { m: the member, at: issued, u: last used, mg: a manager key, c: a claim gave it }:
   - create (the manager's), and joining as someone new: the member's own phone;
   - a claim (tapping a name already there): a member key, never the manager's whoever's name it
     is, and «اخرج من الشلة» from it forgets only that phone (anyone with the code can claim any
     name, so a claim can't take anyone out of the crew, or end it);
   - pairing («ضيف موبايلك التاني»): the manager's phone makes a 6-digit code for 10 minutes and the
     manager's other phone (in by a claim of their name) types it: that key becomes a manager key;
   - handing over, and the manager leaving: the new manager's own phones become manager keys.
   Keys kept before this had no kind: crewKeysMigrate, once, makes every key the manager's id had
   a manager key (a phone that managed keeps managing) and every member's keys but the first claims. */
const CREW_KEYS_PER_MEMBER = 6;               // phones a member can be on at once
const CREW_PAIR_MS = 10 * 60 * 1000;          // a pairing code lives ten minutes
const CREW_PAIR_TRIES = 5;                    // and is voided after five wrong tries

/** Keys from before the kinds, once (meta.keysV): true when it changed something to save. */
const crewKeysMigrate = (meta) => {
  if (!meta || meta.keysV >= 2) return false;
  const keys = meta.keys = meta.keys || {};
  const first = {};
  Object.keys(keys).forEach(k => {
    const r = keys[k];
    if (!first[r.m] || (keys[first[r.m]].at || 0) > (r.at || 0)) first[r.m] = k;
  });
  Object.keys(keys).forEach(k => {
    const r = keys[k];
    if (first[r.m] !== k) r.c = 1;
    if (r.m === meta.managerId) r.mg = true;
  });
  meta.keysV = 2;
  return true;
};

/** A key's record when it proves someone still in the crew, else null. */
const crewKeyRec = (meta, key) => {
  const k = String(key || '');
  const r = k && meta && meta.keys && Object.prototype.hasOwnProperty.call(meta.keys, k) ? meta.keys[k] : null;
  return r && (meta.members || []).some(m => m.id === r.m) ? r : null;
};

/** Does this key hold the manager's power? The manager's id and a manager key, both. */
const crewKeyIsManager = (meta, key) => {
  const r = crewKeyRec(meta, key);
  return !!(r && r.mg && r.m === meta.managerId);
};

/**
 * A new key `key` for a member, by `how` it came: 'create' (the manager's), 'join' (someone
 * new), 'claim' (a name already there) or 'pair' (the manager's other phone). Past
 * CREW_KEYS_PER_MEMBER one goes: the least recently used key a claim gave, so claiming a name
 * again and again only pushes out other claims - never the phone the member joined with, nor a
 * manager's. With no such key, the least recently used of the rest; a claim is then refused (null).
 */
const crewIssueKey = (meta, memberId, how, now, key) => {
  const keys = meta.keys = meta.keys || {};
  const used = (k) => keys[k].u || keys[k].at || 0;
  for (;;) {
    const mine = Object.keys(keys).filter(k => keys[k].m === memberId);
    if (mine.length < CREW_KEYS_PER_MEMBER) break;
    let pool = mine.filter(k => keys[k].c && !keys[k].mg);
    if (!pool.length) {
      if (how === 'claim') return null;
      pool = mine;
    }
    pool.sort((a, b) => used(a) - used(b));
    delete keys[pool[0]];
  }
  const rec = { m: memberId, at: now };
  if (how === 'claim') rec.c = 1;
  if (how === 'create' || how === 'pair') rec.mg = true;
  keys[key] = rec;
  return key;
};

/**
 * The crew changes hands (handOver, the manager leaving): the manager keys become the new
 * manager's own phones (not one a claim gave), or all of theirs if a claim gave every one, so a
 * crew is never left with nobody able to run it. No one else's key is the manager's any more.
 */
const crewSetManager = (meta, memberId) => {
  meta.managerId = memberId;
  const keys = meta.keys = meta.keys || {};
  Object.keys(keys).forEach(k => { delete keys[k].mg; });
  const mine = Object.keys(keys).filter(k => keys[k].m === memberId);
  const own = mine.filter(k => !keys[k].c);
  (own.length ? own : mine).forEach(k => { keys[k].mg = true; });
  delete meta.pair;
};

/** «ضيف موبايلك التاني»: the manager's phone makes a pairing code (`code`: six digits, made by the caller). */
const crewPairMake = (meta, key, now, code) => {
  if (!crewKeyIsManager(meta, key)) throw new Error('ده للي ماسك الشلة بس');
  meta.pair = { code: String(code), m: meta.managerId, until: now + CREW_PAIR_MS, tries: 0 };
  return { code: meta.pair.code, until: meta.pair.until };
};

/**
 * The manager's other phone types the code: its key (a claim of the manager's name) becomes a
 * manager key. A wrong code counts a try - the caller keeps `meta` even when this throws - and
 * the code is voided at CREW_PAIR_TRIES; a right one is used up.
 */
const crewPairUse = (meta, key, code, now) => {
  const r = crewKeyRec(meta, key);
  const p = meta.pair;
  if (!r || r.m !== meta.managerId) throw new Error('ده للي ماسك الشلة بس');
  if (!p || p.m !== meta.managerId || p.until < now) {
    delete meta.pair;
    throw new Error('الكود ده خلص، اعمل كود جديد من موبايلك التاني');
  }
  if (String(code || '').replace(/[^0-9]/g, '') !== p.code) {
    p.tries = (p.tries || 0) + 1;
    if (p.tries >= CREW_PAIR_TRIES) delete meta.pair;
    throw new Error('الكود غلط');
  }
  delete meta.pair;
  r.mg = true;
  delete r.c;
  return true;
};
