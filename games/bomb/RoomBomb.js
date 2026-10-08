// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   القنبلة — PASS THE BOMB (rooms)
   The category is on the big screen and on every phone, and the bomb is on
   one phone at a time: the holder says a word and presses pass, and it jumps
   to the next player in `order`. The fuse is a server clock nobody can read:
   the deadline stays in room._bombEndsAt, and what phones get is `heat`
   (0-3), bumped by the alarm at about 40%, 65% and 85% of the fuse, which is what
   makes the ticking speed up. The steps move a little every round (room._bombHeatAt,
   bombHeatSteps), so timing one doesn't tell the table when the bomb goes off. When it goes off the server knows who was
   holding it, so the strike is automatic; the host can still correct it.
   The strikes are the scoreboard - fewest wins.
   ========================================================================== */
const BOMB_FUSES_ROOM = { short: [15, 30], normal: [25, 55], long: [40, 80] };
// A pass can be sent straight back for this long: the phone cannot hear whether
// anything was said, so the table settles it. The host is not on the clock.
const BOMB_SEND_BACK_MS = 15000;
// BOMB_HEAT_AT, BOMB_HEAT_JITTER and bombHeatSteps are in BombPrompts.js: one phone deals its fuse's steps the same way (699).
/** The steps of the round being played (a room from before the jitter: the fixed ones). */
const bombHeatAt = (room) => (Array.isArray(room._bombHeatAt) && room._bombHeatAt.length === BOMB_HEAT_AT.length ? room._bombHeatAt : BOMB_HEAT_AT);

const bombRoomAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound' || action === 'playAgain') {
    requireHost(room, playerId, action === 'nextRound');
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'nextRound' && prev.phase !== 'boom') return;
    const askedMode = payload && payload.mode;
    const askedFuse = payload && payload.fuse;
    dealBomb(room, {
      lang: roomLangOf(room, payload),
      mode: ['category', 'letter', 'mix'].indexOf(askedMode) !== -1 ? askedMode : (prev.mode || 'category'),
      fuse: BOMB_FUSES_ROOM[askedFuse] ? askedFuse : (prev.fuse || 'normal'),
      round: action === 'nextRound' ? (prev.round || 0) + 1 : 1,
      strikes: action === 'nextRound' ? (prev.strikes || {}) : {}
    });
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'swap') {
    requireHost(room, playerId);
    if (s.phase !== 'ticking') return;
    // For the category the host saw (`swaps`, how many times it was swapped): a double tap
    // used to burn two categories.
    if (staleTap(payload, 'swaps', s.swaps || 0)) return;
    const next = bombPrompt(room, s.lang, s.mode);
    s.prompt = next.text;
    s.kind = next.kind;
    s.swaps = (s.swaps || 0) + 1;
    return;
  }
  if (action === 'pass') {
    // Only the holder passes, and only to the next player still in the room.
    if (s.phase !== 'ticking') return;
    if (playerId !== s.holderId) throw new Error('القنبلة مش معاك');
    const present = s.order.filter(id => room.players.some(p => p.id === id));
    if (present.length < 2) return;
    const at = present.indexOf(s.holderId);
    s.fromId = s.holderId;                 // who it came from, for a send-back
    s.passedAt = Date.now();
    s.holderId = present[(at + 1) % present.length];
    s.holderName = roomPlayerName(room, s.holderId);
    s.passes = (s.passes || 0) + 1;
    s.passSeq = (s.passSeq || 0) + 1;      // only grows: a send-back's stale-tap key
    // 703: the round's hands, for the TV's replay after the boom (who held it is public).
    s.trail = (Array.isArray(s.trail) ? s.trail : []).concat([s.holderId]).slice(-BOMB_TRAIL_MAX);
    return;
  }
  if (action === 'sendBack') {
    // "You passed without saying anything." The phone can't hear the table, so
    // whoever was handed the bomb can hand it straight back, and the host can
    // settle it at any point. The fuse keeps burning through the argument.
    if (s.phase !== 'ticking') return;
    // Aimed at the pass the phone saw: a second tap, or one after the bomb moved on, does nothing.
    // `seq` only grows (passes and from repeat once the bomb is passed again after a send-back).
    if (staleTap(payload, 'seq', s.passSeq || 0) || staleTap(payload, 'passes', s.passes || 0) || staleTap(payload, 'from', s.fromId)) return;
    const isHost = room.hostId === playerId;
    if (!s.fromId) throw new Error('مفيش تمريرة ترجع');
    if (!isHost && playerId !== s.holderId) throw new Error('القنبلة مش معاك');
    if (!isHost && Date.now() - (s.passedAt || 0) > BOMB_SEND_BACK_MS) throw new Error('فات وقت الاعتراض');
    if (!room.players.some(p => p.id === s.fromId)) throw new Error('اللاعب ده مش في الغرفة');
    s.holderId = s.fromId;
    s.holderName = roomPlayerName(room, s.holderId);
    s.fromId = null;
    s.passes = Math.max(0, (s.passes || 0) - 1);
    s.passSeq = (s.passSeq || 0) + 1;
    if (Array.isArray(s.trail) && s.trail.length > 1) s.trail = s.trail.slice(0, -1);
    s.sentBack = (s.sentBack || 0) + 1;
    return;
  }
  if (action === 'markLoser') {
    // The host corrects who was holding it: the automatic strike moves.
    requireHost(room, playerId);
    if (s.phase !== 'boom') return;
    const id = String((payload && payload.playerId) || '');
    if (!room.players.some(p => p.id === id)) throw new Error('لاعب غير معروف');
    if (s.loserId && s.loserId !== id) s.strikes[s.loserId] = Math.max(0, (s.strikes[s.loserId] || 0) - 1);
    if (s.loserId !== id) s.strikes[id] = (s.strikes[id] || 0) + 1;
    s.loserId = id;
    s.loserName = roomPlayerName(room, id);
    s.board = bombBoard(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** 703: how many hands the TV's replay keeps (the last ones: the end is the funny part). */
const BOMB_TRAIL_MAX = 40;

/** The bomb went off in the holder's hands. */
const explodeBomb = (room) => {
  const s = room.shared;
  s.phase = 'boom';
  const holder = s.holderId && room.players.some(p => p.id === s.holderId) ? s.holderId : null;
  s.loserId = holder;
  s.loserName = holder ? roomPlayerName(room, holder) : '';
  if (holder) s.strikes[holder] = (s.strikes[holder] || 0) + 1;
  s.board = bombBoard(room);
};

const bombPrompt = (room, lang, mode) => {
  const wantLetter = mode === 'letter' || (mode === 'mix' && Math.random() < 0.35);
  if (wantLetter) return { kind: 'letter', text: nextPrompt(room, BOMB_LETTERS[lang] || BOMB_LETTERS.ar, 'bombl_' + lang) };
  return { kind: 'category', text: nextPrompt(room, BOMB_PROMPTS[lang] || BOMB_PROMPTS.ar, 'bomb_' + lang) };
};

const dealBomb = (room, o) => {
  const range = BOMB_FUSES_ROOM[o.fuse] || BOMB_FUSES_ROOM.normal;
  const seconds = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
  const prompt = bombPrompt(room, o.lang, o.mode);
  const prev = room.shared || {};
  const roster = room.players.map(p => p.id);
  // The seating order, kept from round to round so people don't shuffle;
  // anyone new goes on the end. The last loser starts the next round.
  const kept = (prev.order || []).filter(id => roster.indexOf(id) !== -1);
  const order = kept.length >= 2 ? kept.concat(roster.filter(id => kept.indexOf(id) === -1)) : shuffled(roster);
  const holder = prev.loserId && roster.indexOf(prev.loserId) !== -1 ? prev.loserId : order[Math.floor(Math.random() * order.length)];
  room._bombStart = Date.now();
  room._bombEndsAt = room._bombStart + seconds * 1000;
  room._bombHeatAt = bombHeatSteps();
  room.secrets = {};
  room.shared = {
    round: o.round,
    lang: o.lang,
    mode: o.mode,
    fuse: o.fuse,
    prompt: prompt.text,
    kind: prompt.kind,
    phase: 'ticking',
    heat: 0,
    order: order,
    holderId: holder,
    holderName: roomPlayerName(room, holder),
    passes: 0,
    passSeq: Number(prev.passSeq) || 0,
    trail: [holder],
    strikes: o.strikes,
    loserId: null,
    loserName: '',
    roster: roster
  };
  room.shared.board = bombBoard(room);
  room.phase = 'play';
};

/** Fewest strikes first: this board is who is losing least. */
const bombBoard = (room) =>
  room.players
    .map(p => ({ id: p.id, name: p.name, score: (room.shared.strikes || {})[p.id] || 0 }))
    .sort((a, b) => a.score - b.score);
