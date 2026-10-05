// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   الفنان المزيف — A FAKE ARTIST GOES TO NEW YORK
   Everyone but one draws the same word, one line per turn, two laps round the
   table. The fake only has everyone else's lines to go on.
   ========================================================================== */

/** The language a round is dealt in: what the host sent, else what the game already uses. */
const roomLangOf = (room, payload) => {
  const asked = payload && payload.lang;
  if (asked === 'en' || asked === 'ar') return asked;
  return (room.shared && room.shared.lang === 'en') ? 'en' : 'ar';
};

// Kept here rather than borrowed from DRAW_COLOURS: that list lives in
// JS_RoomDraw.html, which is client code the server never sees. (The preview
// concatenates client and server into one page, which is what hid it.)
// Every colour reads on white paper, and none of them is white.
const FAKE_ARTIST_COLOURS = ['#e11d48', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2',
                             '#db2777', '#65a30d', '#111827', '#78350f', '#ea580c', '#64748b'];
const FAKE_ARTIST_ROUNDS = 2;
// Points per line. A phone that reconnects is sent the whole room again, so
// twelve artists × two laps × this many points is kept small.
const FAKE_ARTIST_MAX_POINTS = 150;

const fakeArtistAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId, action === 'nextRound');
    // Only from the results screen, so a double tap can't deal two rounds.
    if (action === 'nextRound' && room.shared.phase !== 'results') return;
    if (room.players.length < 3) throw new Error('الحد الأدنى 3 لاعبين');

    const lang = roomLangOf(room, payload);
    const scores = action === 'nextRound' ? (room.shared.scores || {}) : {};
    const order = shuffled(room.players.map(p => p.id));
    // The order is fully random, so the fake may open and has to bluff (the owner,
    // 22 Sep 2026): "the fake never goes first" let a table of three work the fake
    // out from the order alone.
    const fakeId = order[Math.floor(Math.random() * order.length)];
    const word = nextPrompt(room, DRAW_WORDS[lang], 'draw_' + lang);
    // The fake is told the word's category, as in the original game (the review of
    // 1 Oct 2026); the painters see it too, so every slice carries one. The word never
    // reaches the fake's.
    const category = drawWordCategory(lang, word);

    room.secrets = {};
    order.forEach(id => {
      room.secrets[id] = id === fakeId ? { isFake: true, category: category } : { isFake: false, word: word, category: category };
    });
    room._word = word;
    room._fakeId = fakeId;

    const colors = {};
    order.forEach((id, i) => { colors[id] = FAKE_ARTIST_COLOURS[i % FAKE_ARTIST_COLOURS.length]; });

    room.shared = {
      round: 1,
      totalRounds: FAKE_ARTIST_ROUNDS,
      drawerOrder: order,
      turnIndex: 0,
      currentDrawerId: order[0],
      colors: colors,
      strokes: [],
      phase: 'drawing',
      scores: scores,
      lang: lang,
      roster: order.slice()
    };
    room.phase = 'play';
    return;
  }

  const s = room.shared;

  if (action === 'sendStroke') {
    if (s.phase !== 'drawing') throw new Error('ليس وقت الرسم');
    if (playerId !== s.currentDrawerId) throw new Error('ليس دورك في الرسم');
    const raw = payload && payload.stroke && payload.stroke.p;
    if (!Array.isArray(raw) || raw.length < 4) throw new Error('ارسم خطاً أولاً');

    const grid = (v) => Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
    const p = [];
    for (let i = 0; i + 1 < raw.length && p.length < FAKE_ARTIST_MAX_POINTS * 2; i += 2) {
      p.push(grid(raw[i]), grid(raw[i + 1]));
    }
    s.strokes.push({ c: s.colors[playerId] || '#111827', p: p });
    advanceFakeArtistTurn(room);
    return;
  }

  // A drawer whose phone died would hold the table forever; the host moves on.
  // The tap names the turn it was meant for ({ turn: turnIndex, round }), so a
  // double tap doesn't skip the next artist too.
  if (action === 'skipTurn') {
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'turn', s.turnIndex) || staleTap(payload, 'round', s.round)) return;
    if (s.phase === 'drawing') advanceFakeArtistTurn(room);
    return;
  }

  if (action === 'vote') {
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    // castVote closes the vote by itself once the last ballot is in, and the
    // reveal has to follow it or the table sits on a finished vote.
    if (castVote(room, playerId, String((payload && payload.option) || ''))) revealFakeArtist(room);
    return;
  }

  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'voting') return;
    closeVote(room);
    revealFakeArtist(room);
    return;
  }

  if (action === 'fakeGuess') {
    if (s.phase !== 'guessing') throw new Error('ليس وقت التخمين');
    if (playerId !== room._fakeId) throw new Error('الفنان المزيف فقط');
    const guess = String((payload && payload.guess) || '').trim().slice(0, 40);
    if (!guess) throw new Error('اكتب تخمينك');
    s.fakeGuessWord = guess;
    finishFakeArtist(room, guessVerdict(guess, [room._word], DRAW_WORDS[s.lang] || DRAW_WORDS.ar) === 'right' ? 'fake' : 'artists');
    return;
  }

  // The caught fake left, or won't answer: the host settles it for the artists.
  if (action === 'skipGuess') {
    requireMoveOn(room, playerId);
    if (s.phase === 'guessing') finishFakeArtist(room, 'artists');
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** Hands the pen on, skipping anyone who has left. After the last lap: the vote. */
const advanceFakeArtistTurn = (room) => {
  const s = room.shared;
  const present = room.players.map(p => p.id);
  const turns = s.drawerOrder.length * s.totalRounds;

  for (let guard = 0; guard < turns; guard++) {
    s.turnIndex++;
    if (s.turnIndex >= s.drawerOrder.length) { s.turnIndex = 0; s.round++; }
    if (s.round > s.totalRounds) break;
    if (present.indexOf(s.drawerOrder[s.turnIndex]) !== -1) {
      s.currentDrawerId = s.drawerOrder[s.turnIndex];
      return;
    }
  }

  s.round = s.totalRounds;
  s.currentDrawerId = null;
  s.phase = 'voting';
  const options = s.drawerOrder
    .filter(id => present.indexOf(id) !== -1)
    .map(id => ({ id: id, label: (room.players.find(p => p.id === id) || {}).name || id }));
  openVote(room, options, activeRoster(room, s.roster));
};

/**
 * Caught only by a clear plurality — a tie at the top means the table couldn't
 * agree, and the fake walks. A caught fake still gets to guess, so the word is
 * not published until they have: it would otherwise be on their own screen.
 */
const revealFakeArtist = (room) => {
  const s = room.shared;
  const results = (s.vote && s.vote.results) || [];
  const top = results.reduce((most, r) => Math.max(most, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);

  s.fakeId = room._fakeId;
  s.fakeCaught = leaders.length === 1 && leaders[0].id === room._fakeId;
  if (s.fakeCaught) s.phase = 'guessing';
  else finishFakeArtist(room, 'fake');
};

/** Publishes the word and scores it: 2 to a fake who wins, 1 to each artist otherwise. */
const finishFakeArtist = (room, winner) => {
  const s = room.shared;
  s.phase = 'results';
  s.winner = winner;
  s.secretWord = room._word;
  (s.roster || []).forEach(id => {
    const isFake = id === room._fakeId;
    if (winner === 'fake' && isFake) addScore(room, id, 2);
    if (winner === 'artists' && !isFake) addScore(room, id, 1);
  });
  s.board = scoreboardOf(room);
};
