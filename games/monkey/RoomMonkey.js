// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   ربع قرد — MONKEY (rooms)
   The classic letter game, the last-letter chain and the name-a-turn
   variant on separate phones, with the server as referee: it holds the
   dictionaries (MonkeyWords.js, plus the spy words for animals and food),
   settles كذاب, notices a closed name, and keeps the quarters. A monkey is
   skipped in the order and cannot act; the host swaps them back in.
   ========================================================================== */
const MONKEY_ROOM_MODES = ['letters', 'chain', 'names'];
const MONKEY_TIMERS = [0, 15, 30, 45, 60];
const MONKEY_GRACE_MS = 1500;

const monkeyRoomAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    if (action === 'playAgain' && room.shared.phase !== 'gameover') return;
    const prev = (action === 'playAgain' && room.shared) || {};
    const lang = roomLangOf(room, payload);
    const mode = MONKEY_ROOM_MODES.indexOf(payload && payload.mode) !== -1 ? payload.mode : (prev.mode || 'letters');
    const category = MONKEY_CATEGORIES.some(c => c.id === (payload && payload.category)) ? payload.category : (prev.category || 'countries');
    const timer = MONKEY_TIMERS.indexOf(Number(payload && payload.timer)) !== -1 ? Number(payload.timer) : (typeof prev.timer === 'number' ? prev.timer : 30);
    const order = room.players.map(p => p.id);
    const winners = Math.max(1, Math.min(Number(payload && payload.winners) || prev.winners || 1, order.length - 1));
    const autoPenalty = payload && typeof payload.autoPenalty === 'boolean' ? payload.autoPenalty : (typeof prev.autoPenalty === 'boolean' ? prev.autoPenalty : true);
    const quarters = {};
    order.forEach(id => { quarters[id] = 0; });
    room.secrets = {};
    room.shared = {
      phase: 'play', mode: mode, category: category, lang: lang, timer: timer, winners: winners, autoPenalty: autoPenalty,
      order: order, roster: order.slice(), turn: 0, quarters: quarters,
      letters: [], required: '', used: [], history: [], verdict: null, endsAt: null, timedOut: false
    };
    setMonkeyTurn(room, 0);
    room.phase = 'play';
    return;
  }

  const s = room.shared;
  // The host's quarter or skip names the player it was for ({ target }): a
  // double tap would otherwise hand the next player a quarter too. Checked
  // before the end of the game, which the first tap may have brought about.
  if ((action === 'penalty' || action === 'skip') && staleTap(payload, 'target', s.phase === 'play' ? s.turnId : null)) return;
  // A flip is allowed on the verdict that ended the game too: the one-phone game offers "عكس الحكم" there.
  if (s.phase !== 'play' && action !== 'setQuarters' && !(action === 'flip' && s.phase === 'gameover')) throw new Error('اللعبة انتهت');
  const isTurn = playerId === s.turnId;
  const me = room.players.find(p => p.id === playerId);

  if (action === 'letter') {
    if (s.mode !== 'letters') throw new Error('ليست لعبة حروف');
    if (!isTurn) throw new Error('دور لاعب آخر');
    // A monkey doesn't play (a swap or the host's quarters can leave the turn on one).
    if ((s.quarters[playerId] || 0) >= 4) throw new Error('القرد ما بيلعبش');
    const ch = monkeyFold(String((payload && payload.ch) || '')).charAt(0);
    if (!ch) throw new Error('اكتب حرفاً');
    s.letters.push({ ch: ch, by: playerId, name: roomPlayerName(room, playerId) });
    s.verdict = null;
    const word = s.letters.map(l => l.ch).join('');
    const exact = monkeyExact(s.lang, s.category, word);
    if (exact) {
      monkeyQuarter(room, playerId);
      s.history.unshift({ kind: 'word', text: exact, by: roomPlayerName(room, playerId) });
      s.used.unshift(exact);
      s.verdict = { kind: 'closed', word: exact, loser: roomPlayerName(room, playerId), loserId: playerId };
      s.letters = [];
      if (monkeyCheckEnd(room)) return;
      advanceMonkey(room, s.turn);
      return;
    }
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'liar') {
    if (s.mode !== 'letters') throw new Error('ليست لعبة حروف');
    if (!s.letters.length) throw new Error('مفيش حروف لسه');
    // Only someone playing this game: a latecomer watching has no quarters to lose.
    if (!me || s.order.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');
    if ((s.quarters[playerId] || 0) >= 4) throw new Error('القرد ما يتكلمش');
    const last = s.letters[s.letters.length - 1];
    if (last.by === playerId) throw new Error('ده حرفك انت');
    const word = s.letters.map(l => l.ch).join('');
    const matches = monkeyPrefixWords(s.lang, s.category, word);
    const loserId = matches.length ? playerId : last.by;
    const otherId = matches.length ? last.by : playerId;
    monkeyQuarter(room, loserId);
    s.verdict = {
      kind: matches.length ? 'liar-wrong' : 'liar-right',
      word: word, examples: matches.slice(0, 3),
      loser: roomPlayerName(room, loserId), loserId: loserId, otherId: otherId, canFlip: true
    };
    s.history.unshift({ kind: 'liar', text: word, by: roomPlayerName(room, loserId) });
    s.letters = [];
    if (monkeyCheckEnd(room)) return;
    // The new name starts with the player after the one who lost.
    advanceMonkey(room, Math.max(0, s.order.indexOf(loserId)));
    return;
  }

  if (action === 'flip') {
    // The table disagrees with the dictionary: the quarter moves to the other party.
    requireHost(room, playerId);
    const v = s.verdict;
    if (!v || !v.canFlip || v.flipped) return;
    const wasOver = s.phase === 'gameover';
    if ((s.quarters[v.loserId] || 0) > 0) s.quarters[v.loserId]--;
    // The quarter taken back may be the one that made them a monkey: they are not the new one any more.
    if (s.newMonkey === v.loserId && (s.quarters[v.loserId] || 0) < 4) delete s.newMonkey;
    monkeyQuarter(room, v.otherId);
    v.flipped = true;
    const swap = v.loserId; v.loserId = v.otherId; v.otherId = swap;
    v.loser = roomPlayerName(room, v.loserId);
    v.kind = 'flipped';
    s.board = monkeyBoard(room);
    if (wasOver) { s.phase = 'play'; room.phase = 'play'; s.winnerNames = null; }
    if (monkeyCheckEnd(room)) return;
    // The verdict that ended the game was overruled: play goes on after the new loser.
    if (wasOver) { advanceMonkey(room, Math.max(0, s.order.indexOf(v.loserId))); return; }
    // Overruled onto the player up: they may be a monkey now, and a monkey can't play.
    if ((s.quarters[s.turnId] || 0) >= 4) advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'name') {
    if (s.mode === 'letters') throw new Error('ليست لعبة أسماء');
    if (!isTurn) throw new Error('دور لاعب آخر');
    const text = String((payload && payload.text) || '').trim().slice(0, 40);
    const f = monkeyFold(text);
    if (!f) throw new Error('اكتب اسماً');
    const hit = monkeyPool(s.lang, s.category).find(n => monkeyFold(n) === f);
    if (!hit) throw new Error('مش لاقيها في القايمة');
    if (s.used.some(n => monkeyFold(n) === f)) throw new Error('اتقالت قبل كده');
    if (s.mode === 'chain' && s.required && monkeyChainFirst(f) !== s.required) throw new Error('لازم تبدأ بحرف ' + s.required);
    s.used.unshift(hit);
    s.required = f.slice(-1);
    s.history.unshift({ kind: 'name', text: hit, by: roomPlayerName(room, playerId) });
    s.verdict = null;
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'giveUp') {
    if (!isTurn) throw new Error('دور لاعب آخر');
    // 692: «مفيش عندي» in the chain and names is checked against the list. Nothing
    // unused fits: no quarter, «فعلاً مفيش!», and a new chain starts with the same
    // player (the chain from any letter; the names with the list fresh again).
    if (s.mode !== 'letters') {
      const fits = monkeyFitting(s.lang, s.category, s.used, s.mode === 'chain' ? s.required : '');
      if (!fits.length) {
        s.verdict = { kind: 'nothing', loser: roomPlayerName(room, playerId), loserId: null, byId: playerId, letter: s.required || '' };
        s.history.unshift({ kind: 'nothing', text: s.required || '', by: roomPlayerName(room, playerId) });
        if (s.mode === 'chain') s.required = ''; else s.used = [];
        setMonkeyTurn(room, s.turn);
        return;
      }
      monkeyQuarter(room, playerId);
      s.verdict = { kind: 'giveup', loser: roomPlayerName(room, playerId), loserId: playerId, examples: shuffled(fits).slice(0, 3) };
      s.history.unshift({ kind: 'giveup', text: s.required || '', by: roomPlayerName(room, playerId) });
      if (monkeyCheckEnd(room)) return;
      advanceMonkey(room, s.turn);
      return;
    }
    monkeyQuarter(room, playerId);
    s.verdict = { kind: 'giveup', loser: roomPlayerName(room, playerId), loserId: playerId };
    s.history.unshift({ kind: 'giveup', text: s.mode === 'letters' ? s.letters.map(l => l.ch).join('') : (s.required || ''), by: roomPlayerName(room, playerId) });
    if (s.mode === 'letters') s.letters = [];
    if (monkeyCheckEnd(room)) return;
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'penalty') {
    // The host: a quarter to the player up (a timeout the table agreed on), and on.
    requireHost(room, playerId);
    monkeyQuarter(room, s.turnId);
    s.verdict = { kind: 'timeout', loser: s.turnName, loserId: s.turnId };
    if (s.mode === 'letters') s.letters = [];
    if (monkeyCheckEnd(room)) return;
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'skip') {
    requireMoveOn(room, playerId);
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'undo') {
    requireHost(room, playerId);
    if (s.mode !== 'letters') return;
    // The letters the host saw: a double tap must not take back the letter
    // before it too (someone else's, and right).
    if (staleTap(payload, 'n', s.letters.length)) return;
    const l = s.letters.pop();
    if (!l) return;
    s.verdict = null;
    const at = s.order.indexOf(l.by);
    // Back to whoever typed it - unless they are a monkey now (a swap, the host's
    // quarters): then the next one who isn't.
    if (at === -1) setMonkeyTurn(room, s.turn);
    else if ((s.quarters[l.by] || 0) >= 4) advanceMonkey(room, at);
    else setMonkeyTurn(room, at);
    return;
  }

  if (action === 'swap') {
    // The monkey talked someone into it: they swap places.
    requireHost(room, playerId);
    const monkeyId = String((payload && payload.monkeyId) || '');
    const targetId = String((payload && payload.targetId) || '');
    if (s.order.indexOf(monkeyId) === -1 || s.order.indexOf(targetId) === -1) throw new Error('تبديل غير صحيح');
    if ((s.quarters[monkeyId] || 0) < 4 || (s.quarters[targetId] || 0) >= 4) throw new Error('تبديل غير صحيح');
    const keep = s.quarters[targetId] || 0;
    s.quarters[targetId] = 4;
    s.quarters[monkeyId] = keep;
    s.verdict = { kind: 'swap', loser: roomPlayerName(room, targetId), loserId: targetId, other: roomPlayerName(room, monkeyId) };
    s.board = monkeyBoard(room);
    if (monkeyCheckEnd(room)) return;
    if (s.turnId === targetId) advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'setQuarters') {
    requireHost(room, playerId);
    const id = String((payload && payload.playerId) || '');
    const n = Number(payload && payload.n);
    if (!(id in s.quarters) || !(n >= 0 && n <= 4)) throw new Error('قيمة غير صحيحة');
    s.quarters[id] = Math.floor(n);
    s.board = monkeyBoard(room);
    if (s.phase === 'play') {
      if (monkeyCheckEnd(room)) return;
      if (s.turnId === id && n >= 4) advanceMonkey(room, s.turn);
    }
    return;
  }

  throw new Error('إجراء غير معروف');
};

const monkeyQuarter = (room, id) => {
  const s = room.shared;
  if (!(id in s.quarters)) s.quarters[id] = 0;
  if (s.quarters[id] < 4) s.quarters[id]++;
  if (s.quarters[id] === 4) s.newMonkey = id;
  s.board = monkeyBoard(room);
};

/** Fewest quarters first, with the monkeys at the bottom. */
const monkeyBoard = (room) => {
  const s = room.shared;
  return room.players
    .filter(p => s.order.indexOf(p.id) !== -1)
    // `score` is the quarters (fewest first, best-first like every board): the night, the
    // program and «مين هيكسب؟» rank a board by its rows' scores.
    .map(p => { const q = s.quarters[p.id] || 0; return { id: p.id, name: p.name, quarters: q, score: q, monkey: q >= 4 }; })
    .sort((a, b) => a.quarters - b.quarters);
};

const setMonkeyTurn = (room, at) => {
  const s = room.shared;
  s.turn = at;
  s.turnId = s.order[at];
  s.turnName = roomPlayerName(room, s.turnId);
  s.endsAt = s.timer ? Date.now() + s.timer * 1000 : null;
  s.timedOut = false;
  s.board = monkeyBoard(room);
};

/** The next player after `from` who is not a monkey (and still in the room). */
const advanceMonkey = (room, from) => {
  const s = room.shared;
  const n = s.order.length;
  const present = room.players.map(p => p.id);
  for (let step = 1; step <= n; step++) {
    const at = (from + step) % n;
    const id = s.order[at];
    if ((s.quarters[id] || 0) < 4 && present.indexOf(id) !== -1) { setMonkeyTurn(room, at); return; }
  }
  setMonkeyTurn(room, (from + 1) % n);
};

/**
 * Safe players down to the winners' count: the game is over. Only those still
 * in the room count - someone who left is neither safe nor a monkey - and the
 * winners' count shrinks with the table, or two left of three with two winners
 * would play on forever.
 */
const monkeyCheckEnd = (room) => {
  const s = room.shared;
  const present = s.order.filter(id => room.players.some(p => p.id === id));
  const safe = present.filter(id => (s.quarters[id] || 0) < 4);
  const winners = Math.max(1, Math.min(s.winners, present.length - 1));
  if (present.length >= 2 && safe.length > winners) return false;
  s.phase = 'gameover';
  s.endsAt = null;
  s.turnId = null;
  s.turnName = '';
  s.winnerNames = safe.map(id => roomPlayerName(room, id));
  s.board = monkeyBoard(room);
  room.phase = 'gameover';
  return true;
};
