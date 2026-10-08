// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   الموقع السري — SPYFALL (rooms)
   Everyone is told the place and a job there, in their own secret slice; the
   spy is told only that they are the spy. The full list of places is public
   (it is what the spy guesses from). A clock runs on the server: when it
   runs out the vote opens by itself. The spy may stop the game at any time
   to guess the place.
   ========================================================================== */
const SPYFALL_MINUTES = [5, 8, 10];
const SPYFALL_GRACE_MS = 1500;
const SPYFALL_CARD = 24;         // places shown per round, the real one among them

const spyfallRoomAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId, action === 'nextRound');
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'nextRound' && prev.phase !== 'results') return;
    const lang = roomLangOf(room, payload);
    const pool = SPYFALL_DB[lang] || SPYFALL_DB.ar;
    const loc = nextPrompt(room, pool, 'spyfall_' + lang);
    const askedMinutes = Number(payload && payload.minutes);
    const minutes = SPYFALL_MINUTES.indexOf(askedMinutes) !== -1 ? askedMinutes : (prev.minutes || 8);
    let spyCount = Number(payload && payload.spies) === 2 ? 2 : (payload && payload.spies ? 1 : (prev.spyCount || 1));
    // Two spies among five leave too few who know the place to catch anyone.
    if (room.players.length < 6) spyCount = 1;
    const roster = room.players.map(p => p.id);
    const order = shuffled(roster);
    const spyIds = order.slice(0, spyCount);
    const jobs = shuffled(loc.roles || []);
    room.secrets = {};
    let j = 0;
    roster.forEach(id => {
      room.secrets[id] = spyIds.indexOf(id) !== -1
        ? { role: 'spy' }
        : { role: 'agent', location: loc.location, job: jobs.length ? jobs[j++ % jobs.length] : '' };
    });
    room._spyLoc = loc.location;
    room._spyIds = spyIds;
    room.shared = {
      round: (prev.round || 0) + 1,
      lang: lang,
      minutes: minutes,
      spyCount: spyCount,
      phase: 'play',
      endsAt: Date.now() + minutes * 60000,
      // A card of 24 places to guess from, the real one among them: the whole
      // list is too long to read on a phone and too dense on a TV.
      locations: shuffled(shuffled(pool.map(l => l.location).filter(l => l !== loc.location)).slice(0, SPYFALL_CARD - 1).concat([loc.location])),
      // Anyone may ask first, the spy included: always a non-spy told the table who wasn't the spy.
      firstId: order[Math.floor(Math.random() * order.length)],
      scores: action === 'start' ? {} : (prev.scores || {}),
      roster: roster,
      vote: null,
      outcome: null,
      bold: false,
      spyPts: 0
    };
    room.shared.board = scoreboardOf(room);
    room.phase = 'play';
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'startVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'play') return;
    openSpyfallVote(room);
    return;
  }
  if (action === 'vote') {
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) resolveSpyfallVote(room);
    return;
  }
  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'voting') return;
    if (closeVote(room)) resolveSpyfallVote(room);
    return;
  }
  if (action === 'spyGuess') {
    if ((room._spyIds || []).indexOf(playerId) === -1) throw new Error('الجاسوس فقط يخمّن');
    const mayGuess = s.phase === 'play' || (s.phase === 'guess' && s.guesserId === playerId);
    if (!mayGuess) throw new Error('ليس وقت التخمين');
    const guess = String((payload && payload.location) || '');
    if (s.locations.indexOf(guess) === -1) throw new Error('اختيار غير صحيح');
    // 520 «جرأة الجاسوس»: a guess while nobody has accused the spy (the play
    // phase) is the bold one; a caught spy's guess is the last chance.
    s.bold = s.phase === 'play';
    finishSpyfall(room, guess === room._spyLoc ? 'stole' : 'caught', guess, playerId);
    return;
  }
  if (action === 'skipGuess') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'guess') return;
    finishSpyfall(room, 'caught', null, s.guesserId);
    return;
  }
  throw new Error('إجراء غير معروف');
};

const openSpyfallVote = (room) => {
  const s = room.shared;
  openVote(room, room.players.filter(p => s.roster.indexOf(p.id) !== -1).map(p => ({ id: p.id, label: p.name, ownerId: p.id })), s.roster);
  s.phase = 'voting';
};

/** Most votes is accused; a tie lets the spy escape. An accused spy gets one guess. */
const resolveSpyfallVote = (room) => {
  const s = room.shared;
  const results = s.vote.results || [];
  const top = results.reduce((m, r) => Math.max(m, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);
  const accused = leaders.length === 1 ? leaders[0] : null;
  s.accusedId = accused ? accused.id : null;
  s.accusedName = accused ? accused.label : '';
  if (accused && (room._spyIds || []).indexOf(accused.id) !== -1) {
    // A spy named after leaving (the other spy still here) has no guess to make: caught.
    if (!room.players.some(p => p.id === accused.id)) { finishSpyfall(room, 'caught', null, accused.id); return; }
    s.guesserId = accused.id;
    s.guesserName = accused.label;
    s.phase = 'guess';
    return;
  }
  finishSpyfall(room, 'escaped', null, null);
};

/** Caught: a point to every agent. Escaped: two to each spy. Guessed the place:
 *  three to each spy when nobody had accused them (bold, 520), one when caught first. */
const SPYFALL_STOLE_BOLD = 3;
const SPYFALL_STOLE_CAUGHT = 1;
const SPYFALL_ESCAPED = 2;
const finishSpyfall = (room, outcome, guess, spyId) => {
  const s = room.shared;
  const spies = room._spyIds || [];
  s.outcome = outcome;
  s.guess = guess;
  s.guesserId = spyId || s.guesserId || null;
  s.location = room._spyLoc;
  s.spyIds = spies.slice();
  s.spyNames = spies.map(id => roomPlayerName(room, id));
  if (outcome === 'caught') {
    s.roster.forEach(id => { if (spies.indexOf(id) === -1 && room.players.some(p => p.id === id)) addScore(room, id, 1); });
  } else if (outcome !== 'revealed') {
    const pts = outcome === 'stole' ? (s.bold ? SPYFALL_STOLE_BOLD : SPYFALL_STOLE_CAUGHT) : SPYFALL_ESCAPED;
    s.spyPts = pts;
    spies.forEach(id => addScore(room, id, pts));
  }
  s.board = scoreboardOf(room);
  s.phase = 'results';
};
