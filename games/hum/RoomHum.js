/* ============================================================================
   دندنها — HUM IT (rooms), the owner's rules of 1 Oct 2026
   ----------------------------------------------------------------------------
   Egyptian songs (Songs.js), Apple's 30-second preview as the sound. Two ways,
   a lobby switch:
     «دندنة» (mode 'hum')     one player at a time (the hummer, in turn) hears
                              the song privately on their phone, then hums it
                              out loud; everyone else types its name.
     «سمّع» (mode 'listen')   no hummer: every phone plays the same clip at the
                              same moment (the server's clock) and everyone
                              races to name it. The host picks how the clip is
                              heard: «أول ١٠ ثواني مرة واحدة» ('once10'), «الـ٣٠
                              ثانية كلها وتعيد براحتك» ('full'), «بتطول» ('grow':
                              2 s, then 5 s, then 10 s while the round is open).
   A typed answer is judged by guessVerdict (RoomGames.js) against the title and
   its alternatives; the singer alone is never an answer. The fastest three
   typed answers score 3 / 2 / 1 (a later right one 1); if the typing window
   closes with someone still guessing, four choices appear (the right one and
   three of the same era) worth 1. The hummer scores 2 when at least one typed
   answer was right. 5, 10 or 15 songs; the board, the podium, the night.

   What is hidden (never in shared until the reveal):
     room._hum      the game's deck of songs, the one on now (cur), its round
                    token, the right choice's place and the picks.
     the hummer's slice  ({ song, token }) in «دندنة»: the title in the DJ's
                    envelope and the token that plays it - nobody else's.
     a guesser's slice   only their own: a near miss, their pick.
   In «سمّع» everyone needs the sound, so the round's token is in shared from
   the countdown on; the token is opaque (/song/CODE/TOKEN on the rooms server
   streams the preview: rooms-worker/src/index.js, Room.songOf), so the title,
   the singer, the trackId and Apple's address never reach a guesser's phone.

   «الظرف التلاتة» (the owner's pick of 7 Oct 2026): in «دندنة» the hummer is
   first handed three sealed envelopes - three songs, the titles in their slice
   only (you.envelopes) - and picks the one they know (envelope { deal, i });
   the other two go back to the end of the deck. shared.envelope is true while
   they choose (envEndsAt; the clock takes the first one), and only then is the
   song dealt with its token, as before. No more rounds of a song nobody knows.

   Phases (shared.phase):
     arm      «سمّع» before the first song: every phone taps ▶ once (iPhones play
              sound only after a tap), or the host starts (go), or the clock
     listen   «دندنة»: the hummer hears it (HUM_LISTEN_MS at most, or «خلاص»)
     count    «سمّع»: 3-2-1 while every phone loads the clip; it plays at playAt
     type     typing (typeEndsAt); ends early once every guesser has it
     choices  four choices to whoever hasn't got it (choiceEndsAt)
     reveal   the song, the points; the host's (or «التالي لوحده»'s) next song
     gameover the board
   Bundled after RoomGames.js (requireHost, requireMoveOn, staleTap, shuffled,
   nextPrompts, guessVerdict, normaliseClue, addScore, roomPlayerName). Every
   name here starts with hum / HUM_.
   ========================================================================= */
const HUM_MIN = 2;
const HUM_MAX = 12;
const HUM_COUNTS = [5, 10, 15];
const HUM_MODES = ['hum', 'listen'];
const HUM_REPLAYS = ['once10', 'full', 'grow'];
const HUM_LISTEN_MS = 30000;       // «دندنة»: the hummer's time with the song (the whole preview)
const HUM_TYPE_MS = 15000;         // typing, before the choices come down (the owner's 15 s)
const HUM_GROW_TYPE_MS = 22000;    // «بتطول»: typing lasts the three clips
const HUM_CHOICE_MS = 10000;       // the four choices
const HUM_COUNT_MS = 4000;         // «سمّع»: 3-2-1 while the clip loads on every phone
const HUM_ARM_MS = 30000;          // «سمّع»: waiting for every ▶ before the first song
const HUM_ONCE_MS = 10000;         // «أول ١٠ ثواني مرة واحدة»
const HUM_GRACE_MS = 600;          // an answer sent as the clock hit zero is still on its way
// «بتطول»: when each clip starts (after playAt), how long it plays, and the bonus for answering during it.
const HUM_GROW = [{ at: 0, len: 2000, bonus: 2 }, { at: 4000, len: 5000, bonus: 1 }, { at: 11000, len: 10000, bonus: 0 }];
const HUM_RANK_PTS = [3, 2, 1];    // the fastest three typed answers
const HUM_LATE_PTS = 1;            // a right typed answer after the first three
const HUM_CHOICE_PTS = 1;          // the right choice
const HUM_HUMMER_PTS = 2;          // the hummer, when at least one typed answer was right
const HUM_TRIES = 40;              // typed tries a phone may send for one song
const HUM_REDEALS = 3;             // songs a round may skip by itself (a preview that won't load)
const HUM_SPARE = 8;               // songs dealt beyond the game's count, for those skips
const HUM_BROKEN_PHONES = 2;       // «سمّع» once it plays: phones that must report a clip broken before it is dealt again
const HUM_ENVELOPES = 3;           // «دندنة»: the sealed envelopes the hummer picks from
const HUM_ENVELOPE_MS = 20000;     // the hummer's time to pick one (then the first is taken)

/** Every title, alternative and English title: the bank a guess is held against (another song's name is never "close enough"). */
const HUM_TITLES = HUM_SONGS.reduce((all, x) => all.concat([x.t], x.alt || [], [x.en]), []);
const HUM_INDEX = HUM_SONGS.map((x, i) => i);

const humHere = (room, id) => room.players.some(p => p.id === id);
const humPresent = (room) => ((room.shared || {}).roster || []).filter(id => humHere(room, id));
/** Who answers this song: the roster still here, less the hummer. */
const humGuessers = (room) => {
  const s = room.shared || {};
  return humPresent(room).filter(id => !(s.mode === 'hum' && id === s.hummerId));
};
const humIsRight = (s, id) => (s.right || []).some(r => r.id === id);

/** An opaque round address: 24 letters from 32 (8 divides 256, so every letter is as likely). */
const humToken = () => {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789';
  let bytes = null;
  try { if (typeof crypto !== 'undefined' && crypto.getRandomValues) bytes = crypto.getRandomValues(new Uint8Array(24)); } catch (e) {}
  let out = '';
  for (let i = 0; i < 24; i++) out += a[(bytes ? bytes[i] : Math.floor(Math.random() * 256)) % a.length];
  return out;
};

const humAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < HUM_MIN) throw new Error('محتاجين 2 على الأقل');
    const p = payload || {};
    const mode = HUM_MODES.indexOf(p.mode) !== -1 ? p.mode : (prev.mode || 'hum');
    const replay = HUM_REPLAYS.indexOf(p.replay) !== -1 ? p.replay : (prev.replay || 'full');
    const rounds = HUM_COUNTS.indexOf(Number(p.count)) !== -1 ? Number(p.count) : (prev.rounds || 10);
    const roster = people.slice(0, HUM_MAX);
    room.secrets = {};
    // «دندنة» deals three envelopes a song (the two left go back to the deck).
    const dealt = (mode === 'hum' ? rounds * HUM_ENVELOPES : rounds) + HUM_SPARE;
    room._hum = { deck: nextPrompts(room, HUM_INDEX, 'hum_songs', dealt), at: 0, cur: null, offer: null, token: null, correct: null, picks: {}, tries: {} };
    room.shared = {
      roster,
      mode,
      replay: mode === 'listen' ? replay : null,
      rounds,
      round: 0,
      deal: 0,
      order: shuffled(roster),     // «دندنة»: who hums, in turn
      turn: -1,
      scores: {},
      gained: {},
      board: [],
      history: [],
      phase: 'arm'
    };
    room.phase = 'play';
    if (mode === 'listen') {
      room.shared.armed = [];
      room.shared.armEndsAt = Date.now() + HUM_ARM_MS;
    } else humStartRound(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase === 'gameover') return;
  const h = room._hum;

  if (action === 'arm') {
    if (s.phase !== 'arm' || (s.roster || []).indexOf(playerId) === -1) return;
    if (s.armed.indexOf(playerId) === -1) s.armed = s.armed.concat([playerId]);
    if (humPresent(room).every(id => s.armed.indexOf(id) !== -1)) humStartRound(room);
    return;
  }
  if (action === 'go') {
    requireMoveOn(room, playerId);
    if (s.phase === 'arm') humStartRound(room);
    return;
  }
  if (action === 'envelope') {
    // «الظرف التلاتة»: the hummer picks the song they know; the other two go back to the deck.
    if (staleTap(payload, 'deal', s.deal)) return;
    if (s.phase !== 'listen' || !s.envelope || playerId !== s.hummerId || !h || !h.offer) return;
    const i = Math.floor(Number(payload && payload.i));
    if (!(i >= 0 && i < h.offer.length)) return;
    humTakeEnvelope(room, i);
    return;
  }
  if (action === 'heard') {
    // The hummer has heard enough: the humming (and the typing) starts.
    if (staleTap(payload, 'deal', s.deal)) return;
    if (s.phase !== 'listen' || s.envelope || playerId !== s.hummerId) return;
    humOpenTyping(room, Date.now());
    return;
  }
  if (action === 'guess') {
    if (staleTap(payload, 'deal', s.deal)) return;
    if (s.phase !== 'type' || !h) return;
    if (humGuessers(room).indexOf(playerId) === -1) throw new Error(s.mode === 'hum' && playerId === s.hummerId ? 'إنت اللي بتدندن!' : 'إنت بتتفرج المرة دي');
    if (humIsRight(s, playerId)) return;
    const text = String((payload && payload.text) || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!text) return;
    h.tries[playerId] = (h.tries[playerId] || 0) + 1;
    if (h.tries[playerId] > HUM_TRIES) return;
    const song = HUM_SONGS[h.cur];
    // The English title too, for a phone with a Latin keyboard (guessVerdict forgives a letter in a long one).
    const verdict = guessVerdict(text, [song.t].concat(song.alt || [], [song.en]), HUM_TITLES);
    const now = Date.now();
    if (verdict === 'right') {
      const rank = s.right.length + 1;
      const stage = humStageAt(s, now);
      const bonus = stage === null ? 0 : HUM_GROW[stage].bonus;
      const pts = (HUM_RANK_PTS[rank - 1] || HUM_LATE_PTS) + bonus;
      s.right = s.right.concat([{ id: playerId, rank, pts, bonus, stage, ms: Math.max(0, now - (s.typeStartAt || now)) }]);
      room.secrets[playerId] = { deal: s.deal, hit: true };
      if (humGuessers(room).every(id => humIsRight(s, id))) humReveal(room);
    } else {
      const was = (room.secrets[playerId] && room.secrets[playerId].deal === s.deal && room.secrets[playerId].miss) || { n: 0 };
      room.secrets[playerId] = { deal: s.deal, miss: { n: was.n + 1, close: verdict === 'close' } };
    }
    return;
  }
  if (action === 'pick') {
    if (staleTap(payload, 'deal', s.deal)) return;
    if (s.phase !== 'choices' || !h) return;
    if (humGuessers(room).indexOf(playerId) === -1 || humIsRight(s, playerId)) return;
    if (Object.prototype.hasOwnProperty.call(h.picks, playerId)) return;
    const i = Math.floor(Number(payload && payload.i));
    if (!(i >= 0 && i < (s.choices || []).length)) return;
    h.picks[playerId] = i;
    s.picked = (s.picked || []).concat([playerId]);
    room.secrets[playerId] = { deal: s.deal, pick: i };
    if (humAllAnswered(room)) humReveal(room);
    return;
  }
  if (action === 'broken') {
    // The preview wouldn't load on a phone: the round deals another song by itself (nobody loses anything).
    // «سمّع»: once the clip is playing, one phone's bad network is that phone's alone - the song is
    // dealt again only when a second phone says so too (the review of 1 Oct 2026); during the
    // count-in, before anyone has heard it, one report is enough. The phone says which on its own.
    if (staleTap(payload, 'deal', s.deal)) return;
    if (['listen', 'count', 'type'].indexOf(s.phase) === -1 || (s.right || []).length || s.envelope) return;
    if (s.mode === 'hum' ? playerId !== s.hummerId : (s.roster || []).indexOf(playerId) === -1) return;
    if ((s.redeals || 0) >= HUM_REDEALS) return;
    if (s.mode === 'listen' && s.phase !== 'count' && h) {
      if (!h.broken || h.broken.deal !== s.deal) h.broken = { deal: s.deal, ids: [] };
      if (h.broken.ids.indexOf(playerId) === -1) h.broken.ids = h.broken.ids.concat([playerId]);
      if (h.broken.ids.length < HUM_BROKEN_PHONES) return;
    }
    s.redeals = (s.redeals || 0) + 1;
    humDeal(room);
    return;
  }
  if (action === 'skipSong') {
    // The host (or a stand-in) moves on: the song is shown now, and whatever was right so far counts.
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'deal', s.deal)) return;
    if (['listen', 'count', 'type', 'choices'].indexOf(s.phase) === -1) return;
    // Skipped while the envelopes are still sealed: the first one is the song shown.
    if (s.envelope) humTakeEnvelope(room, 0);
    s.skipped = true;
    humReveal(room);
    return;
  }
  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'reveal') return;
    humStartRound(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** The next song: «دندنة»'s next hummer still here; the game ends after the chosen count or when too few are left. */
const humStartRound = (room) => {
  const s = room.shared;
  if (humPresent(room).length < HUM_MIN || (s.round || 0) >= s.rounds) { humGameOver(room); return; }
  s.round = (s.round || 0) + 1;
  s.redeals = 0;
  s.armed = null;
  s.armEndsAt = null;
  if (s.mode === 'hum') {
    const next = humNextHummer(room, s.turn);
    if (next === null) { humGameOver(room); return; }
    s.turn = next;
    s.hummerId = s.order[next];
  } else s.hummerId = null;
  humDeal(room);
};

/** The place in the order of the next hummer still here, going round. */
const humNextHummer = (room, from) => {
  const o = room.shared.order || [];
  for (let k = 1; k <= o.length; k++) {
    const at = ((from < 0 ? -1 : from) + k) % o.length;
    if (humHere(room, o[at])) return at;
  }
  return null;
};

/** The next song off the deck, never one of `avoid` (the envelopes already in hand). */
const humDraw = (room, avoid) => {
  const h = room._hum;
  while (h.at < h.deck.length) {
    const i = h.deck[h.at++];
    if (avoid.indexOf(i) === -1) return i;
  }
  const used = h.deck.concat(avoid, h.cur === null ? [] : [h.cur]);
  const open = HUM_INDEX.filter(i => used.indexOf(i) === -1);
  const any = HUM_INDEX.filter(i => avoid.indexOf(i) === -1);
  const pool = open.length ? open : any;
  const idx = pool[Math.floor(Math.random() * pool.length)];
  h.deck.push(idx);
  h.at = h.deck.length;
  return idx;
};

/** The envelope the hummer picked (or the clock, or a skip, took): the song and its token, the rest back in the deck. */
const humTakeEnvelope = (room, i) => {
  const s = room.shared;
  const h = room._hum;
  const k = Math.max(0, Math.min(h.offer.length - 1, i));
  h.cur = h.offer[k];
  h.offer.forEach((x, j) => { if (j !== k) h.deck.push(x); });
  h.offer = null;
  h.token = humToken();
  s.envelope = false;
  s.envEndsAt = null;
  s.listenEndsAt = Date.now() + HUM_LISTEN_MS;
  const song = HUM_SONGS[h.cur];
  room.secrets = {};
  room.secrets[s.hummerId] = { deal: s.deal, song: { t: song.t, s: song.s, en: song.en, se: song.se }, token: h.token };
};

/** A song for this round (a fresh one when a preview failed): its own token, nothing of the last one left. */
const humDeal = (room) => {
  const s = room.shared;
  const h = room._hum;
  // Envelopes never opened (the hummer left, a redeal) go back to the deck.
  if (h.offer) { h.offer.forEach(x => h.deck.push(x)); h.offer = null; }
  const idx = humDraw(room, []);
  h.cur = idx;
  h.token = humToken();
  h.correct = null;
  h.picks = {};
  h.tries = {};
  h.broken = null;
  room.secrets = {};
  s.deal = (s.deal || 0) + 1;
  s.right = [];
  s.picked = [];
  s.choices = null;
  s.song = null;
  s.correct = null;
  s.picks = null;
  s.gained = {};
  s.skipped = false;
  s.token = null;
  s.listenEndsAt = s.playAt = s.typeStartAt = s.typeEndsAt = s.choiceEndsAt = null;
  s.envelope = false;
  s.envEndsAt = null;
  const now = Date.now();
  if (s.mode === 'hum') {
    // «الظرف التلاتة»: three sealed envelopes on the hummer's phone; no song (and no token) until one is picked.
    s.phase = 'listen';
    const offer = [idx];
    while (offer.length < HUM_ENVELOPES) offer.push(humDraw(room, offer));
    h.offer = offer;
    h.cur = null;
    h.token = null;
    s.envelope = true;
    s.envEndsAt = now + HUM_ENVELOPE_MS;
    room.secrets[s.hummerId] = { deal: s.deal, envelopes: offer.map(i => ({ t: HUM_SONGS[i].t, s: HUM_SONGS[i].s, en: HUM_SONGS[i].en, se: HUM_SONGS[i].se })) };
  } else {
    s.phase = 'count';
    s.playAt = now + HUM_COUNT_MS;
    s.token = h.token;      // opaque: the sound every phone plays, nothing that names it
  }
};

/** The typing window opens: the hum starts («دندنة»), or the clip plays («سمّع»). */
const humOpenTyping = (room, at) => {
  const s = room.shared;
  s.phase = 'type';
  s.listenEndsAt = null;
  s.typeStartAt = at;
  s.typeEndsAt = at + (s.mode === 'listen' && s.replay === 'grow' ? HUM_GROW_TYPE_MS : HUM_TYPE_MS);
  if (!humGuessers(room).length) humReveal(room);
};

/** «بتطول»: which clip is playing at `now` (its bonus), or null in any other way of playing. */
const humStageAt = (s, now) => {
  if (s.mode !== 'listen' || s.replay !== 'grow' || typeof s.playAt !== 'number') return null;
  let stage = 0;
  HUM_GROW.forEach((g, k) => { if (now - s.playAt >= g.at) stage = k; });
  return stage;
};

/** The four choices: the right one and three others, from the same era when there are enough. */
const humOpenChoices = (room) => {
  const s = room.shared;
  const h = room._hum;
  const song = HUM_SONGS[h.cur];
  const taken = [normaliseClue(song.t)];
  const pickFrom = (list) => {
    const out = [];
    shuffled(list).forEach(i => {
      if (out.length >= 3) return;
      const key = normaliseClue(HUM_SONGS[i].t);
      if (i === h.cur || taken.indexOf(key) !== -1) return;
      taken.push(key);
      out.push(i);
    });
    return out;
  };
  let others = pickFrom(HUM_INDEX.filter(i => HUM_SONGS[i].era === song.era));
  if (others.length < 3) others = others.concat(pickFrom(HUM_INDEX).slice(0, 3 - others.length));
  const four = shuffled([h.cur].concat(others));
  h.correct = four.indexOf(h.cur);
  s.choices = four.map(i => ({ t: HUM_SONGS[i].t, s: HUM_SONGS[i].s, en: HUM_SONGS[i].en, se: HUM_SONGS[i].se }));
  s.phase = 'choices';
  s.typeEndsAt = null;
  s.choiceEndsAt = Date.now() + HUM_CHOICE_MS;
  if (humAllAnswered(room)) humReveal(room);
};

/** Has every guesser here answered (right by typing, or a pick)? */
const humAllAnswered = (room) => {
  const s = room.shared;
  const h = room._hum || { picks: {} };
  return humGuessers(room).every(id => humIsRight(s, id) || Object.prototype.hasOwnProperty.call(h.picks, id));
};

/** The song, the right choice, the picks and the points. */
const humReveal = (room) => {
  const s = room.shared;
  const h = room._hum;
  if (!h || h.cur === null || ['listen', 'count', 'type', 'choices'].indexOf(s.phase) === -1) return;
  const song = HUM_SONGS[h.cur];
  s.phase = 'reveal';
  s.envelope = false;
  s.envEndsAt = null;
  s.song = { t: song.t, s: song.s, en: song.en, se: song.se, era: song.era };
  s.token = h.token;      // the song is out: everyone may hear it now
  s.correct = h.correct;
  s.picks = Object.assign({}, h.picks);
  s.listenEndsAt = s.typeEndsAt = s.choiceEndsAt = null;
  s.gained = {};
  const gain = (id, n) => { if (!n) return; addScore(room, id, n); s.gained[id] = (s.gained[id] || 0) + n; };
  (s.right || []).forEach(r => gain(r.id, r.pts));
  Object.keys(h.picks).forEach(id => { if (h.picks[id] === h.correct) gain(id, HUM_CHOICE_PTS); });
  // A hummer who has left scores nothing (the review of 1 Oct 2026).
  if (s.mode === 'hum' && s.hummerId && humHere(room, s.hummerId) && (s.right || []).length) gain(s.hummerId, HUM_HUMMER_PTS);
  s.history = (s.history || []).concat([{ round: s.round, hummerId: s.hummerId || null, right: (s.right || []).length, t: song.t }]);
  s.board = humBoard(room);
  room.secrets = {};
};

const humGameOver = (room) => {
  const s = room.shared;
  room.secrets = {};
  if (room._hum) { room._hum.token = null; room._hum.cur = null; room._hum.offer = null; }
  s.phase = 'gameover';
  s.envelope = false;
  s.envEndsAt = null;
  s.token = null;
  s.armed = null;
  s.listenEndsAt = s.playAt = s.typeEndsAt = s.choiceEndsAt = s.armEndsAt = null;
  s.board = humBoard(room);
};

/** The board: everyone who played and is still here, best first. */
const humBoard = (room) => {
  const s = room.shared || {};
  return (s.roster || [])
    .filter(id => humHere(room, id))
    .map(id => ({ id, name: roomPlayerName(room, id), score: (s.scores || {})[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

/** The server's next moment. */
const humDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return null;
  if (s.phase === 'arm' && s.armEndsAt) return s.armEndsAt;
  if (s.phase === 'listen' && s.envelope && s.envEndsAt) return s.envEndsAt;
  if (s.phase === 'listen' && s.listenEndsAt) return s.listenEndsAt;
  if (s.phase === 'count' && s.playAt) return s.playAt;
  if (s.phase === 'type' && s.typeEndsAt) return s.typeEndsAt + HUM_GRACE_MS;
  if (s.phase === 'choices' && s.choiceEndsAt) return s.choiceEndsAt + HUM_GRACE_MS;
  return null;
};

const humTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return false;
  if (s.phase === 'arm' && s.armEndsAt && now >= s.armEndsAt) { humStartRound(room); return true; }
  // The hummer didn't pick an envelope in time: the first one is theirs.
  if (s.phase === 'listen' && s.envelope && s.envEndsAt && now >= s.envEndsAt && room._hum && room._hum.offer) { humTakeEnvelope(room, 0); return true; }
  if (s.phase === 'listen' && !s.envelope && s.listenEndsAt && now >= s.listenEndsAt) { humOpenTyping(room, now); return true; }
  if (s.phase === 'count' && s.playAt && now >= s.playAt) { humOpenTyping(room, s.playAt); return true; }
  if (s.phase === 'type' && s.typeEndsAt && now >= s.typeEndsAt + HUM_GRACE_MS) {
    if (humGuessers(room).every(id => humIsRight(s, id))) humReveal(room);
    else humOpenChoices(room);
    return true;
  }
  if (s.phase === 'choices' && s.choiceEndsAt && now >= s.choiceEndsAt + HUM_GRACE_MS) { humReveal(room); return true; }
  return false;
};

/**
 * Someone left. Too few left ends the game; a hummer gone before humming hands the
 * round to the next one (a new song), one gone while humming sends the round to the
 * choices (and scores nothing); every "has everyone answered?" runs again.
 */
const humPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || room.phase !== 'play' || s.phase === 'gameover') return;
  if (s.armed) s.armed = s.armed.filter(id => id !== playerId);
  if (humPresent(room).length < HUM_MIN) { humGameOver(room); return; }
  if (s.phase === 'arm') {
    if (humPresent(room).every(id => (s.armed || []).indexOf(id) !== -1)) humStartRound(room);
    return;
  }
  if (s.phase === 'listen' && s.mode === 'hum' && playerId === s.hummerId) {
    const next = humNextHummer(room, s.turn);
    if (next === null) { humGameOver(room); return; }
    s.turn = next;
    s.hummerId = s.order[next];
    humDeal(room);
    return;
  }
  if (s.phase === 'type' && humGuessers(room).every(id => humIsRight(s, id))) { humReveal(room); return; }
  // «دندنة»: the hummer gone after «خلاص» - nobody is humming any more, so whoever hasn't
  // got it goes straight to the four choices (the review of 1 Oct 2026).
  if (s.phase === 'type' && s.mode === 'hum' && playerId === s.hummerId) { humOpenChoices(room); return; }
  if (s.phase === 'choices' && humAllAnswered(room)) { humReveal(room); return; }
  if (s.phase === 'reveal') s.board = humBoard(room);
};
