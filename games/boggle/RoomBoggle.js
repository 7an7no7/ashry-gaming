// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   شبكة الحروف — LETTER GRID in rooms (the owner's rules of 9 Oct 2026)
   --------------------------------------------------------------------------
   Every phone gets the same grid (4 x 4 for 2 minutes, or the host's 5 x 5
   for 3), dealt here from the server's random (boggleMake, Boggle.js), and
   traces words across touching squares, diagonals too. A phone sends the
   path it traced (`word { round, path }`); the server reads the word off its
   own grid (boggleTraceWord), folds it (ال is free, ة/ه and ى/ي one letter)
   and looks it up: a listed word counts at once, any other is kept for the
   room's vote. 3 rounds (the host: 1, 3 or 5).

   What is hidden: each phone's words are room.secrets[pid].words, sent to
   that phone alone, until the round closes; the table sees only how many
   each has (shared.counts). Then every list goes on the table
   (shared.reveal) and only the words nobody else found score, by length:
   3 letters 1, 4 = 2, 5 = 3, 6 and more 5.

   Phases (shared.phase):
     play     the clock (endsAt); «خلصت» from everyone, the clock, or the
              host's «خلّص الجولة» closes it
     judge    the words nobody else found that aren't in the lists, each put
              to the others: «تتحسب؟» yes / no, the most wins (a tie is no);
              with nobody else to ask, the host says. Ends when all have
              said, at judge.endsAt, or on the host's «اقفل التصويت». An
              accepted word goes to the Stop word log (room._stopTaps).
     result   every list, the round's points; the host's «الجولة الجاية»
     gameover after the last round: the board (the night's points)
   ========================================================================== */
const BOGGLE_MIN_PLAYERS = 2;
const BOGGLE_LEAD_MS = 600;          // the clock starts as the grid reaches the phones
const BOGGLE_GRACE_MS = 1200;        // a word traced in the last moment still counts
const BOGGLE_JUDGE_MS = 20000;       // the vote: this long,
const BOGGLE_JUDGE_EACH_MS = 5000;   // and this much more a word,
const BOGGLE_JUDGE_MAX_MS = 60000;   // at most
const BOGGLE_UNLISTED_MAX = 12;      // words not in the lists a phone may keep for the vote, a round

const boggleHere = (room, id) => room.players.some(p => p.id === id);
const bogglePresent = (room) => ((room.shared || {}).roster || []).filter(id => boggleHere(room, id));

/** Deals the next round: a grid every phone shares, an empty list each, the clock started. */
const boggleDeal = (room) => {
  const s = room.shared;
  const made = boggleMake(s.size, s.lang, soloRng(Math.floor(Math.random() * 2147483646) + 1))
    || boggleMake(s.size, s.lang, soloRng(Math.floor(Math.random() * 2147483646) + 1));
  if (!made) throw new Error('ماعرفناش نجهّز الحروف، جرّبوا تاني');
  s.round += 1;
  s.grid = made.grid;
  s.total = made.words.length;
  s.counts = {};
  s.done = [];
  s.reveal = null;
  s.judge = null;
  s.gained = {};
  s.stars = {};
  s.endsAt = Date.now() + BOGGLE_LEAD_MS + BOGGLE_SIZES[s.size] * 1000;
  s.phase = 'play';
  room.secrets = {};
  bogglePresent(room).forEach(pid => { room.secrets[pid] = { words: [], last: null }; });
  room.phase = 'play';
};

/** The board: everyone dealt in and still here, best first. */
const boggleBoard = (room) => bogglePresent(room)
  .map(id => ({ id, name: roomPlayerName(room, id), score: (room.shared.scores || {})[id] || 0 }))
  .sort((a, b) => b.score - a.score);

/** Who is asked about a word: everyone in the round but its writer; nobody else, the host. */
const boggleVoters = (room, item) => {
  const others = bogglePresent(room).filter(id => id !== item.by);
  return others.length ? others : [room.hostId];
};

/** The clock is up (or everyone is done, or the host ended it): every list on the table. */
const boggleClose = (room) => {
  const s = room.shared;
  if (s.phase !== 'play') return;
  const lists = {};
  bogglePresent(room).forEach(pid => { lists[pid] = ((room.secrets[pid] || {}).words || []).slice(); });
  const seen = {};
  Object.keys(lists).forEach(pid => lists[pid].forEach(w => { seen[w.f] = (seen[w.f] || 0) + 1; }));
  const reveal = {};
  const items = [];
  Object.keys(lists).forEach(pid => {
    reveal[pid] = lists[pid].map(w => {
      const n = seen[w.f];
      const st = w.ok ? 'ok' : (n > 1 ? 'no' : 'vote');
      if (st === 'vote') items.push({ f: w.f, w: w.w, by: pid, yes: [], no: [] });
      return { f: w.f, w: w.w, n, st, listed: !!w.ok };
    });
  });
  room.secrets = {};
  s.reveal = reveal;
  s.endsAt = null;
  if (items.length) {
    s.judge = { items, endsAt: Date.now() + Math.min(BOGGLE_JUDGE_MAX_MS, BOGGLE_JUDGE_MS + items.length * BOGGLE_JUDGE_EACH_MS) };
    s.phase = 'judge';
    return;
  }
  boggleScore(room);
};

/** Every word put to the vote has been said yes or no by everyone asked. */
const boggleJudged = (room) => {
  const j = room.shared.judge;
  return !!j && j.items.every(it => boggleVoters(room, it).every(id => it.yes.indexOf(id) !== -1 || it.no.indexOf(id) !== -1));
};

/** The vote is over: each word is in or out, then the points. */
const boggleSettle = (room) => {
  const s = room.shared;
  if (s.phase !== 'judge' || !s.judge) return;
  s.judge.items.forEach(it => {
    it.ok = it.yes.length > it.no.length;
    const row = (s.reveal[it.by] || []).find(w => w.f === it.f);
    if (row) row.st = it.ok ? 'ok' : 'no';
    if (it.ok) {
      room._stopTaps = room._stopTaps || [];
      room._stopTaps.push({ lang: s.lang || 'ar', cat: 'boggle', word: it.w });
    }
  });
  s.judge.endsAt = null;
  s.judge.closed = true;
  boggleScore(room);
};

/** The round's points: a word nobody else found, listed or voted in, by its length. */
const boggleScore = (room) => {
  const s = room.shared;
  s.gained = {};
  s.stars = {};
  Object.keys(s.reveal || {}).forEach(pid => {
    let pts = 0;
    let star = null;
    s.reveal[pid].forEach(w => {
      w.pts = w.n === 1 && w.st === 'ok' ? boggleWordPts(w.f) : 0;
      pts += w.pts;
      if (w.pts && (!star || w.pts > star.pts || (w.pts === star.pts && w.f.length > star.f.length))) star = w;
    });
    s.gained[pid] = pts;
    if (star && star.pts >= 3) s.stars[pid] = star.f;
    addScore(room, pid, pts);
  });
  s.history = (s.history || []).concat([{ round: s.round, gained: Object.assign({}, s.gained) }]);
  s.board = boggleBoard(room);
  s.phase = s.round >= s.rounds ? 'gameover' : 'result';
  room.phase = 'play';
};

/** Fewer than two left: the game ends where it is. */
const boggleTooFew = (room) => bogglePresent(room).length < 1;

ROOM_RULES.boggle = {
  action(room, playerId, action, payload) {
    if (action === 'start' || action === 'playAgain') {
      requireHost(room, playerId);
      const people = room.players.filter(p => !p.bot).map(p => p.id);
      if (people.length < BOGGLE_MIN_PLAYERS) throw new Error('محتاجين لاعبين على الأقل');
      const prev = room.shared || {};
      if (action === 'playAgain' && prev.phase !== 'gameover') return;
      const pay = payload || {};
      const rounds = BOGGLE_ROUND_CHOICES.indexOf(Number(pay.rounds)) !== -1 ? Number(pay.rounds)
        : (BOGGLE_ROUND_CHOICES.indexOf(prev.rounds) !== -1 ? prev.rounds : 3);
      const size = BOGGLE_SIZES[Number(pay.size)] ? Number(pay.size) : (BOGGLE_SIZES[prev.size] ? prev.size : 4);
      room.shared = { roster: people, rounds, size, lang: roomLangOf(room, pay), round: 0, scores: {}, board: [], history: [] };
      boggleDeal(room);
      return;
    }
    const s = room.shared;
    if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');
    if (s.phase === 'gameover') return;
    const pay = payload || {};
    if (staleTap(pay, 'round', s.round)) return;
    const mine = s.roster.indexOf(playerId) !== -1 && room.secrets[playerId];

    if (action === 'word') {
      if (s.phase !== 'play' || !mine || s.done.indexOf(playerId) !== -1) return;
      if (s.endsAt && Date.now() > s.endsAt + BOGGLE_GRACE_MS) return;
      const sec = room.secrets[playerId];
      const letters = boggleTraceWord(s.grid, s.size, Array.isArray(pay.path) ? pay.path.map(Number) : null, s.lang);
      const f = letters ? boggleResolve(letters, s.lang, (x) => boggleListed(x, s.lang)) : '';
      if (!f) { sec.last = { kind: 'bad', at: Date.now() }; return; }
      const had = sec.words.find(w => w.f === f);
      if (had) { sec.last = { kind: 'again', f, w: had.w, at: Date.now() }; return; }
      const ok = boggleListed(f, s.lang);
      if (!ok && sec.words.filter(w => !w.ok).length >= BOGGLE_UNLISTED_MAX) { sec.last = { kind: 'full', f, w: f, at: Date.now() }; return; }
      const w = ok ? boggleShow(f, s.lang) : f;
      sec.words.unshift({ f, w, ok });
      sec.last = { kind: ok ? 'ok' : 'vote', f, w, at: Date.now() };
      s.counts[playerId] = sec.words.length;
      return;
    }
    if (action === 'drop') {
      // A word not in the lists, taken back before the round closes.
      if (s.phase !== 'play' || !mine) return;
      const sec = room.secrets[playerId];
      const f = String(pay.f || '');
      const before = sec.words.length;
      sec.words = sec.words.filter(w => w.ok || w.f !== f);
      if (sec.words.length !== before) { sec.last = null; s.counts[playerId] = sec.words.length; }
      return;
    }
    if (action === 'done') {
      if (s.phase !== 'play' || !mine || s.done.indexOf(playerId) !== -1) return;
      s.done.push(playerId);
      if (bogglePresent(room).every(id => s.done.indexOf(id) !== -1)) boggleClose(room);
      return;
    }
    if (action === 'finish') {
      requireMoveOn(room, playerId);
      if (s.phase === 'play') boggleClose(room);
      return;
    }
    if (action === 'judge') {
      if (s.phase !== 'judge' || !s.judge) return;
      const it = s.judge.items.find(x => x.f === String(pay.f || '') && x.by === String(pay.by || ''));
      if (!it || boggleVoters(room, it).indexOf(playerId) === -1) return;
      it.yes = it.yes.filter(id => id !== playerId);
      it.no = it.no.filter(id => id !== playerId);
      (pay.yes ? it.yes : it.no).push(playerId);
      if (boggleJudged(room)) boggleSettle(room);
      return;
    }
    if (action === 'closeJudge') {
      requireMoveOn(room, playerId);
      boggleSettle(room);
      return;
    }
    if (action === 'nextRound') {
      requireMoveOn(room, playerId);
      if (s.phase !== 'result') return;
      if (boggleTooFew(room)) { s.phase = 'gameover'; s.board = boggleBoard(room); return; }
      boggleDeal(room);
      return;
    }
    throw new Error('إجراء غير معروف');
  },
  deadline(room) {
    const s = room.shared || {};
    if (room.phase !== 'play') return null;
    if (s.phase === 'play' && s.endsAt) return s.endsAt + BOGGLE_GRACE_MS;
    if (s.phase === 'judge' && s.judge && s.judge.endsAt) return s.judge.endsAt;
    return null;
  },
  timeout(room, now) {
    const s = room.shared || {};
    if (room.phase !== 'play') return false;
    if (s.phase === 'play' && s.endsAt && now >= s.endsAt + BOGGLE_GRACE_MS) { boggleClose(room); return true; }
    if (s.phase === 'judge' && s.judge && s.judge.endsAt && now >= s.judge.endsAt) { boggleSettle(room); return true; }
    return false;
  },
  /** Someone left: their list goes with them, the round goes on without waiting for them. */
  left(room, playerId) {
    const s = room.shared;
    if (!s || room.phase !== 'play' || s.phase === 'gameover') return;
    if (s.phase === 'play') {
      s.done = s.done.filter(id => id !== playerId);
      delete s.counts[playerId];
      if (boggleTooFew(room)) { boggleClose(room); return; }
      if (bogglePresent(room).every(id => s.done.indexOf(id) !== -1)) boggleClose(room);
      return;
    }
    if (s.reveal) delete s.reveal[playerId];
    if (s.phase === 'judge' && s.judge) {
      s.judge.items = s.judge.items.filter(it => it.by !== playerId);
      s.judge.items.forEach(it => { it.yes = it.yes.filter(id => id !== playerId); it.no = it.no.filter(id => id !== playerId); });
      if (!s.judge.items.length || boggleJudged(room)) boggleSettle(room);
      return;
    }
    s.board = boggleBoard(room);
  }
};
