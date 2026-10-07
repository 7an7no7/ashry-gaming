/* ============================================================================
   الكراسي الموسيقية — MUSICAL CHAIRS (rooms), the owner's rules of 27 Sep 2026
   ----------------------------------------------------------------------------
   Every phone is a player. The music plays (on the TV, or the host's phone),
   the server stops it at a moment nobody can predict, and every screen shows
   «اقعد!»: the fastest taps get the chairs (players − 1), the last one
   standing is out. One out a round until one is left.

   What is hidden: the stop moment, and the fake pauses. They live in
   room._chairs (never projected), like the bomb's fuse. Everything else is
   shared: the alive players, who sat in what order, the loser, the wins.

   Fair on the network: a tap carries `at`, the phone's estimate of the server
   time it was made at (the phone knows the server's clock from serverNow),
   and the server keeps it only inside the window it can prove - not before
   the music stopped, not after the tap arrived. A tap with no usable `at` is
   timed by its arrival. So a slow connection doesn't lose a chair, and a
   phone can't claim a time it hadn't seen yet.

   Phases (shared.phase):
     music   the music plays from startAt; a tap now is a false start and ends
             the round with that player out (the owner's rule)
     sit     the music stopped at stopAt; taps are ranked; closes when every
             alive player has sat or CHAIRS_SIT_MS after the stop (no tap = last)
     result  who is out, the order; the next round starts at nextAt, or on the
             host's nextRound
     gameover  one left: the winner, the places, the wins tally
   «الدي جي» (the owner, 2 Oct 2026; a lobby switch, off by default): from
   round 2 the latest one out runs the music (shared.dj). Their phone stops it
   (djStop) and, with the fake stops on, pauses it (djFake); never in the first
   CHAIRS_DJ_FIRST_MS, and the server stops it by itself at CHAIRS_DJ_MAX_MS.
   The press is stamped by the server as it arrives, and the taps are judged
   against it exactly as against the secret stop. A DJ who leaves or is away
   CHAIRS_DJ_AWAY_MS hands the round back to the secret stop (chairsDjLost).
   The DJ scores nothing; whoever caught the most with a fake is «أحلى دي جي».
   Off, nothing of this runs: the game is the secret stop, as it always was.

   Bundled after RoomGames.js (its helpers: requireHost, roomPlayerName,
   shuffled, staleTap). Every name here starts with chairs / CHAIRS_.
   ========================================================================= */
const CHAIRS_MIN = 3;
const CHAIRS_MAX = 12;
const CHAIRS_MUSIC_MS = [5000, 20000];   // the music plays for a random length inside this
const CHAIRS_SIT_MS = 3000;             // after the stop, whoever hasn't tapped is last
const CHAIRS_FAKE_MS = 600;             // a fake pause is this long
const CHAIRS_BETWEEN_MS = 5500;         // the result stays this long before the next round
const CHAIRS_GRACE_MS = 40;             // a tap may claim up to this before the server heard the stop land (clock drift)
const CHAIRS_MIN_REACT_MS = 120;        // no hand is faster than this after the stop: a stamp claiming less counts as this
// «الدي جي» (shared.settings.dj): the one out runs the music.
const CHAIRS_DJ_FIRST_MS = 4000;        // the DJ can't stop (or fake) in the music's first 4 s
const CHAIRS_DJ_MAX_MS = 25000;         // not stopped by then: the server stops it
const CHAIRS_DJ_AWAY_MS = 3000;         // a DJ whose phone has been gone this long: the secret stop takes the round over
const CHAIRS_DJ_TAKEOVER_MS = [2500, 7000];   // ...at a secret moment this far ahead (never before the 4 s)
const CHAIRS_DJ_FAKES = 3;              // fake stops a DJ has in one round
const CHAIRS_DJ_FAKE_GAP_MS = 1500;     // between the end of one fake and the next
const CHAIRS_DJ_TRAP_MS = 800;          // a tap this soon after a DJ's fake ended still counts as caught by it

const chairsRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/** The players still in, in the room. */
const chairsAlive = (room) => (room.shared.alive || []).filter(id => room.players.some(p => p.id === id));

const chairsAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < CHAIRS_MIN) throw new Error('محتاجين 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const fake = payload && typeof payload.fake === 'boolean' ? payload.fake : !!(prev.settings && prev.settings.fake);
    const dj = payload && typeof payload.dj === 'boolean' ? payload.dj : !!(prev.settings && prev.settings.dj);
    const roster = people.slice(0, CHAIRS_MAX);
    room.secrets = {};
    room.shared = {
      settings: { fake, dj },
      roster,
      alive: roster.slice(),
      outOrder: [],
      left: [],                       // who left the room mid-game (a win against only them isn't one)
      round: 0,
      wins: action === 'playAgain' ? (prev.wins || {}) : {},
      winnerId: null,
      loserId: null,
      loserName: '',
      why: null,
      sits: [],
      phase: 'result',
      dj: null,                       // «الدي جي»: who runs this round's music (null: the server's secret stop)
      djCaught: {},                   // a DJ's fake stops that caught somebody, this game
      bestDj: null,
      best: chairsBestOf(room),        // «الأرقام القياسية»: the room's fastest sit of the evening (across games)
      record: null,                    // set on the round that broke it
      board: []
    };
    room.shared.board = chairsBoard(room);
    room.phase = 'play';
    chairsStartRound(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'sit') {
    if (staleTap(payload, 'round', s.round)) return;
    if (chairsAlive(room).indexOf(playerId) === -1) return;          // out already, or watching
    if (s.phase === 'music') {
      // Tapped before the music stopped: out of the round at once (the owner's rule).
      // In a DJ's fake stop (or just after it), that DJ caught them.
      const now = Date.now();
      const fake = s.pause && s.pause.dj ? s.pause : s.djLastFake;
      if (s.dj && fake && now >= fake.at && now <= fake.until + CHAIRS_DJ_TRAP_MS) {
        s.trapBy = s.dj;
        s.djCaught = s.djCaught || {};
        s.djCaught[s.dj] = (s.djCaught[s.dj] || 0) + 1;
      }
      chairsEndRound(room, playerId, 'early');
      return;
    }
    if (s.phase !== 'sit') return;
    if (s.sits.some(x => x.id === playerId)) return;
    const now = Date.now();
    let at = payload && typeof payload.at === 'number' && isFinite(payload.at) ? payload.at : now;
    // An honest stamp is never before the stop (the phone saw the stop after it happened)
    // and never after its arrival, so a stamp outside that is one the phone couldn't
    // have had: the arrival counts for it. A hair before the stop is clock drift.
    if (at < s.stopAt - CHAIRS_GRACE_MS || at > now) at = now;
    // stopAt is on every phone, so a page changed to send it as its stamp sat first every
    // time: nobody is quicker than a hand can be, and taps held to that floor go by arrival.
    at = Math.max(s.stopAt + CHAIRS_MIN_REACT_MS, Math.min(now, at));
    s.sits.push({ id: playerId, name: roomPlayerName(room, playerId), ms: Math.max(0, at - s.stopAt), arr: now });
    s.sits.sort((a, b) => a.ms - b.ms || (a.arr || 0) - (b.arr || 0));
    if (chairsAlive(room).every(id => s.sits.some(x => x.id === id))) chairsCloseSit(room);
    return;
  }
  if (action === 'djStop' || action === 'djFake') {
    // «الدي جي»: only this round's DJ, only while the music plays, never in its first seconds.
    if (staleTap(payload, 'round', s.round)) return;
    const h = room._chairs;
    if (s.phase !== 'music' || !s.dj || s.dj !== playerId || !h || h.dj !== playerId) return;
    const now = Date.now();
    if (now < s.startAt + CHAIRS_DJ_FIRST_MS) return;
    if (action === 'djStop') { chairsStop(room, now); return; }      // stamped here, on the server's clock
    if (!s.settings || !s.settings.fake || s.pause) return;
    if ((s.djFakes || 0) >= CHAIRS_DJ_FAKES) return;
    if (s.djLastFake && now < s.djLastFake.until + CHAIRS_DJ_FAKE_GAP_MS) return;
    if (now + CHAIRS_FAKE_MS + 500 >= h.stopAt) return;                // the server's own stop is about to come
    s.pause = { at: now, until: now + CHAIRS_FAKE_MS, dj: true };
    s.djLastFake = { at: now, until: now + CHAIRS_FAKE_MS };
    s.djFakes = (s.djFakes || 0) + 1;
    return;
  }
  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'result') return;
    chairsStartRound(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/**
 * «الدي جي»: who runs the music of the round about to start. Round 1 never has
 * one (nobody is out yet). Otherwise the latest one out who is still in the room
 * with their phone here; a computer player never (if one is out, the next person
 * out before it). Nobody: null, and the server's secret stop.
 */
const chairsPickDj = (room) => {
  const s = room.shared;
  if (!s.settings || !s.settings.dj || (s.round || 0) < 1) return null;
  const out = (s.outOrder || []).slice().reverse();
  for (const id of out) {
    const p = room.players.find(x => x.id === id);
    if (!p || p.bot) continue;
    if (room.lastSeen && room.lastSeen[id]) continue;                 // away: not this round
    return id;
  }
  return null;
};

/** The DJ left or went away mid-music: the server's secret stop takes this round over. */
const chairsDjLost = (room, now) => {
  const s = room.shared;
  const h = room._chairs;
  if (!h || !h.dj || s.phase !== 'music') return;
  h.dj = null;
  h.stopAt = Math.max(now + chairsRand(CHAIRS_DJ_TAKEOVER_MS[0], CHAIRS_DJ_TAKEOVER_MS[1]), s.startAt + CHAIRS_DJ_FIRST_MS);
  s.dj = null;
  s.djLost = true;                     // djName stays, for «الدي جي مشي»
};

/** A new round: the music starts now, the stop moment (and any fake pauses) kept on the server. */
const chairsStartRound = (room) => {
  const s = room.shared;
  const alive = chairsAlive(room);
  s.alive = alive;
  if (alive.length < 2) { chairsGameOver(room); return; }
  const now = Date.now();
  const dj = chairsPickDj(room);
  s.dj = dj;
  s.djName = dj ? roomPlayerName(room, dj) : '';
  s.djLost = false;
  s.djFakes = 0;
  s.djLastFake = null;
  s.trapBy = null;
  // With a DJ the stop is theirs: the server keeps only its backstop (a public rule, 25 s).
  const len = dj ? CHAIRS_DJ_MAX_MS : chairsRand(CHAIRS_MUSIC_MS[0], CHAIRS_MUSIC_MS[1]);
  const fakes = [];
  if (!dj && s.settings && s.settings.fake && len >= 8000) {
    // One or two fake pauses, never in the first 2.5 s and never within 2 s of the real stop or of each other.
    const n = chairsRand(1, 2);
    for (let k = 0; k < n; k++) {
      const at = now + chairsRand(2500, len - 2000);
      if (fakes.every(f => Math.abs(f - at) > 2000)) fakes.push(at);
    }
    fakes.sort((a, b) => a - b);
  }
  room._chairs = { stopAt: now + len, fakes, fakeAt: 0, dj };
  s.round = (s.round || 0) + 1;
  s.phase = 'music';
  s.startAt = now;
  s.stopAt = null;
  s.pause = null;
  s.sits = [];
  s.loserId = null;
  s.loserName = '';
  s.why = null;
  s.record = null;
  s.nextAt = null;
  s.chairs = alive.length - 1;
  s.order = shuffled(alive);          // the order the avatars circle in on every screen
};

/** The music stops: every screen gets the button. */
const chairsStop = (room, now) => {
  const s = room.shared;
  s.phase = 'sit';
  s.stopAt = now;
  s.pause = null;
  s.sits = [];
};

/** Everyone has sat, or the window closed: the last one (or whoever didn't tap) is out. */
const chairsCloseSit = (room) => {
  const s = room.shared;
  const alive = chairsAlive(room);
  const missing = alive.filter(id => !s.sits.some(x => x.id === id));
  // Whoever didn't tap is last; among several, the order they are drawn in decides.
  missing.forEach(id => s.sits.push({ id, name: roomPlayerName(room, id), ms: null }));
  const loser = s.sits[s.sits.length - 1];
  chairsNoteRecord(room);
  chairsEndRound(room, loser ? loser.id : null, missing.indexOf(loser && loser.id) !== -1 ? 'late' : 'last');
};

/**
 * «الأرقام القياسية» (the owner's pick of 7 Oct 2026, 854): the room keeps its fastest sit
 * of the evening across play again and new games from the hub (room._chairsBest, like
 * الحقوا!'s _wireBest), public as shared.best. A round whose quickest sit beats it sets
 * shared.record for the result («رقم جديد للأوضة!» with the name). The evening's first
 * sit only sets the record quietly: a slam on every first round would mean nothing.
 */
const chairsBestOf = (room) => (room._chairsBest ? Object.assign({}, room._chairsBest) : null);
const chairsNoteRecord = (room) => {
  const s = room.shared;
  const first = (s.sits || []).find(x => typeof x.ms === 'number');
  if (!first || !first.id) return;
  const was = room._chairsBest || null;
  if (was && first.ms >= was.ms) return;
  room._chairsBest = { ms: first.ms, id: first.id, name: first.name || roomPlayerName(room, first.id) || '' };
  if (was) s.record = { ms: first.ms, id: first.id, name: room._chairsBest.name, was: was.ms, wasName: was.name || '' };
  s.best = chairsBestOf(room);
};

/**
 * The round's loser leaves the ring. `why`: 'last' (the slowest), 'late' (no tap),
 * 'early' (a false start), 'left' (left the room mid-round; `name` since they are gone).
 */
const chairsEndRound = (room, loserId, why, name) => {
  const s = room.shared;
  room._chairs = null;
  s.phase = 'result';
  s.pause = null;
  if (why === 'early') { s.stopAt = s.stopAt || Date.now(); }
  s.loserId = loserId;
  s.loserName = loserId ? (roomPlayerName(room, loserId) || name || '') : '';
  s.why = why;
  if (loserId) {
    s.alive = s.alive.filter(id => id !== loserId);
    s.outOrder = (s.outOrder || []).concat([loserId]);
  }
  s.alive = chairsAlive(room);
  if (s.alive.length < 2) { chairsGameOver(room); return; }
  s.nextAt = Date.now() + CHAIRS_BETWEEN_MS;
};

const chairsGameOver = (room) => {
  const s = room.shared;
  room._chairs = null;
  s.phase = 'gameover';
  s.nextAt = null;
  s.pause = null;
  const alive = chairsAlive(room);
  s.winnerId = alive.length === 1 ? alive[0] : null;
  s.winnerName = s.winnerId ? roomPlayerName(room, s.winnerId) : '';
  // A win counts only against somebody: a game where everyone else left is nobody's.
  const left = s.left || [];
  if (s.winnerId && (s.outOrder || []).some(id => left.indexOf(id) === -1)) s.wins[s.winnerId] = (s.wins[s.winnerId] || 0) + 1;
  // The places: the winner, then the last out first.
  s.places = (s.winnerId ? [s.winnerId] : []).concat((s.outOrder || []).slice().reverse())
    .map(id => ({ id, name: roomPlayerName(room, id) }));
  // «أحلى دي جي»: whoever caught the most with a fake stop (if anyone did); level ones share it.
  const caught = s.djCaught || {};
  const most = Object.keys(caught).reduce((m, id) => Math.max(m, caught[id] || 0), 0);
  const best = most > 0 ? Object.keys(caught).filter(id => caught[id] === most) : [];
  s.bestDj = best.length ? { n: most, ids: best, names: best.map(id => roomPlayerName(room, id) || '') } : null;
  s.board = chairsBoard(room);
};

/**
 * The night's board: the wins of the evening at this game, best first, for the people in
 * this game (its roster - a phone that joined to watch isn't on it). Level wins are told
 * apart by the last game's places (`tie`, boardRowKey in RoomGames.js): one game is the
 * winner, then the last out first, not everyone else tied for second.
 */
const chairsBoard = (room) => {
  const s = room.shared || {};
  const roster = Array.isArray(s.roster) ? s.roster : room.players.map(p => p.id);
  const places = (s.places || []).map(x => x.id);
  const placeOf = (id) => (places.indexOf(id) === -1 ? null : places.indexOf(id) + 1);
  return room.players
    .filter(p => !p.bot && roster.indexOf(p.id) !== -1)
    .map(p => ({ id: p.id, name: p.name, score: (s.wins || {})[p.id] || 0, tie: placeOf(p.id) }))
    .sort((a, b) => (b.score - a.score) || ((a.tie || 99) - (b.tie || 99)));
};

/** The server's next moment: a fake pause's start or end, the stop, the sit window, the next round. */
const chairsDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return null;
  if (s.phase === 'music') {
    const h = room._chairs;
    if (!h) return null;
    if (s.pause) return s.pause.until;
    const away = h.dj && room.lastSeen && room.lastSeen[h.dj] ? room.lastSeen[h.dj] + CHAIRS_DJ_AWAY_MS : Infinity;
    const fake = h.fakes.find(f => f > (h.fakeAt || 0));
    return Math.min(fake && fake < h.stopAt ? fake : h.stopAt, away);
  }
  if (s.phase === 'sit') return (s.stopAt || 0) + CHAIRS_SIT_MS;
  if (s.phase === 'result') return s.nextAt || null;
  return null;
};

const chairsTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return false;
  if (s.phase === 'music') {
    const h = room._chairs;
    if (!h) return false;
    let moved = false;
    if (s.pause) {
      if (now < s.pause.until) return false;
      s.pause = null;                      // the music goes on
      moved = true;                        // ...and whatever else is due now is done too (a timeout does everything due)
    }
    // The DJ's phone gone a while: the secret stop takes over (its moment is ahead, never due now).
    if (h.dj && room.lastSeen && room.lastSeen[h.dj] && now >= room.lastSeen[h.dj] + CHAIRS_DJ_AWAY_MS) {
      chairsDjLost(room, now);
      moved = true;
    }
    // Stamped when it is published, not when it was planned: a late alarm must not eat the sit window.
    if (now >= h.stopAt) { chairsStop(room, now); return true; }
    let fake = h.fakes.find(f => f > (h.fakeAt || 0));
    while (fake && now >= fake) {
      h.fakeAt = fake;
      if (now < fake + CHAIRS_FAKE_MS) { s.pause = { at: fake, until: fake + CHAIRS_FAKE_MS }; return true; }
      // Handled too late to show (its pause is over already): skip it, or its deadline stays due and the room rests 30 s.
      moved = true;
      fake = h.fakes.find(f => f > h.fakeAt);
    }
    return moved;
  }
  if (s.phase === 'sit') {
    if (now < (s.stopAt || 0) + CHAIRS_SIT_MS) return false;
    chairsCloseSit(room);
    return true;
  }
  if (s.phase === 'result') {
    if (!s.nextAt || now < s.nextAt) return false;
    chairsStartRound(room);
    return true;
  }
  return false;
};

/**
 * Someone left: out of the ring; one left ends the game. Leaving while the
 * chairs are being taken makes the leaver this round's one out, so nobody
 * else loses a chair to the gap (chairsCloseSit would have knocked out the
 * last to sit too). The chairs are counted again only while the music plays:
 * during the sit and the result the ring reads them as they were dealt.
 */
const chairsPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!s || room.phase !== 'play') return;
  const wasAlive = (s.alive || []).indexOf(playerId) !== -1;
  if (s.dj === playerId && s.phase === 'music') chairsDjLost(room, Date.now());   // the DJ left: the secret stop
  s.alive = chairsAlive(room);
  s.order = (s.order || []).filter(id => id !== playerId);
  if (s.phase === 'gameover') return;
  if (wasAlive) s.left = (s.left || []).concat([playerId]);
  if (s.sits) s.sits = s.sits.filter(x => x.id !== playerId);
  if (wasAlive && s.phase === 'sit' && s.alive.length >= 2) {
    chairsEndRound(room, playerId, 'left', name);
    return;
  }
  if (wasAlive) s.outOrder = (s.outOrder || []).concat([playerId]);
  if (s.alive.length < 2) { chairsGameOver(room); return; }
  if (s.phase === 'music') s.chairs = Math.max(0, s.alive.length - 1);
};
