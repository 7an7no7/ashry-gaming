/* ============================================================================
   ROOM GAME RULES
   ----------------------------------------------------------------------------
   One branch per game, all reached through applyRoomAction. The room server
   (rooms-worker/) never needs to know what any of these games are.

   The rule that shapes everything here: anything a player must not see goes in
   `room.secrets[playerId]`, which the server only ever sends back to that one
   player. `room.shared` goes to everybody. So a Codenames operative cannot read
   the key card out of a network response, and an imposter's word never reaches
   the other phones.
   ========================================================================= */

const shuffled = (arr) => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
};

/**
 * A turn that goes round the table (ارسم وخمّن's drawer, كلمة واحدة's guesser):
 * a shuffled order kept in shared (`turnOrder`, `turnAt`) and stepped through.
 * Whoever has left is dropped, and the pointer moves back one for each of them at
 * or before it, so nobody goes twice and nobody is skipped; latecomers join the end.
 * `prev` is the last round's shared, or {} for a new game (a fresh shuffle).
 */
const roomTurnStep = (prev, players) => {
  const here = players.map(p => p.id);
  // Who left is counted against where the pointer was, not where it has moved to: two
  // leaving at or before it used to move it back only once, and the next player was skipped.
  const was = prev && typeof prev.turnAt === 'number' ? prev.turnAt : -1;
  let at = was;
  const order = [];
  ((prev && Array.isArray(prev.turnOrder)) ? prev.turnOrder : []).forEach((id, i) => {
    if (here.indexOf(id) !== -1) order.push(id);
    else if (i <= was) at -= 1;
  });
  if (!order.length) { at = -1; shuffled(here).forEach(id => order.push(id)); }
  else here.forEach(id => { if (order.indexOf(id) === -1) order.push(id); });
  at = (at + 1) % order.length;
  return { order: order, at: at, player: players.find(p => p.id === order[at]) };
};

/**
 * Host-only moves. `standIn` marks a move that only gets the room moving (the
 * next round, closing a vote, playing for a quiet phone): once the host has been
 * away HOST_STAND_IN_MS (the owner, 28 Sep 2026: 20 seconds), anyone in the room
 * may make it, so a table never freezes behind a locked phone. `room._hostAway`
 * is stamped by room.js for the length of one move (the rules can't see who is
 * connected); room.js already checked that `playerId` is a person or a screen in
 * the room, so only a computer player is turned away here. Settings, seating,
 * dealing a new game and taking someone out stay the host's alone.
 */
const requireHost = (room, playerId, standIn) => {
  if (room.hostId === playerId) return;
  if (standIn && room._hostAway && !isRoomBot(room, playerId)) return;
  throw new Error('دي للمضيف بس');
};
/** A move that gets the room moving: the host's, or anyone's once the host is away (requireHost). */
const requireMoveOn = (room, playerId) => requireHost(room, playerId, true);

/**
 * Clears a game down to nothing, but remembers the sides people picked.
 * Boards and keys must never survive; team assignments are tedious to redo, so
 * they're stashed and offered back if the room returns to Codenames.
 */
const clearGameState = (room) => {
  // Sides kept as a map (أسماء الرموز's); سكرو's two lists of seats are dealt afresh, and
  // الليزر's { pid: 0 | 1 } is no side أسماء الرموز knows (nobody showed on one, and a team
  // chat went to everyone).
  if (room.game === 'codenames' && room.shared && room.shared.teams && !Array.isArray(room.shared.teams)) room._teamsMemo = room.shared.teams;
  // Codenames' options and the evening's score come back with the teams.
  if (room.game === 'codenames' && room.shared) {
    room._cnMemo = { settings: room.shared.settings || null, wins: room.shared.wins || null };
  }
  room.shared = {};
  room.secrets = {};
  // A team's channel belongs to that game; the next one may have other sides.
  if (room.chat) room.chat = room.chat.filter(m => !m.team);
  // Every piece of server-side scratch, or the previous game's answer survives
  // into the next one.
  room._key = null;
  room._pack = null;
  room._tourHidden = null;
  room._assignments = null;
  room._clueText = null;
  room._truth = null;
  room._lies = null;
  room._word = null;
  room._ballots = null;
  room._voteOwners = null;
  room._fibTruthId = null;
  room._joWord = null;
  room._joWords = null;
  room._fakeId = null;
  room._target = null;
  room._deck = null;
  room._qIdx = null;
  room._currentQ = null;
  room._answers = null;
  room._qStart = null;
  room._triviaCount = null;
  room._stopOpts = null;
  room._stopTotals = null;
  room._stopRound = null;
  room._chamSecret = null;
  room._chamId = null;
  room._impSecret = null;
  room._impSpies = null;
  room._impWords = null;
  room._impScores = null;
  room._waScores = null;
  room._restartNight = null;
  room._spyLoc = null;
  room._spyIds = null;
  room._bombStart = null;
  room._bombEndsAt = null;
  room._tt = null;
  room._card = null;
  room._quizCount = null;
  room._fiveDeck = null;
  room._fiveRounds = null;
  room._chains = null;
  room._herd = null;
  room._mafia = null;
  room._screw = null;
  room._domino = null;
  room._bank = null;
  room._uno = null;
  room._timeline = null;
  room._doubt = null;
  room._om = null;
  room._skull = null;   // جمجمة: every disc, hand and pile, the «هيعملها؟» answers (RoomSkull.js)
  room._est = null;
  room._chairs = null;   // الكراسي الموسيقية: the stop moment and the fake pauses (RoomChairs.js)
  room._reaction = null; // رد الفعل «أسرع إيد»: the green moment and the fakes (RoomReaction.js)
  room._witness = null;  // الشاهد: the real face and its place in the lineup (RoomWitness.js)
  room._vault = null;    // الخزنة: the notebook's seed, the safe, each side's progress (RoomVault.js); the room's best (_vaultBest) stays
  room._wire = null;     // الحقوا!: the panels, the controls' states, what is broken (RoomWire.js); the room's best (_wireBest) stays
  room._box = null;      // المزاد: the eight boxes, the clues, the bids, a key's peek (RoomBox.js)
  room._dark = null;     // الأوضة المضلمة: the map's seed and the near misses (RoomDark.js); the room's best (_darkBest) stays
  room.screenOnly = null; // the screen's own slice (src/view.js): الأوضة المضلمة's map for the TV
  room._exact = null;    // حط إيدك!: each phone's secret and every tap's events (RoomExact.js)
  room._hear = null;     // ارسم اللي بتسمعه: the picture and every drawing until the grading (RoomHear.js)
  room._hum = null;      // دندنها: the deck of songs, the one on now, its token, the right choice, the picks (RoomHum.js)
  // The engine's secret and boards (RoomSolve.js).
  room._solve = null;
  // A bot's next move belonged to the game that was cleared.
  room._botAt = null;
  room._botKey = null;
  room._botPid = null;
  room._botFails = 0;
  room._forcedFailed = null;
};

/** The stashed sides, minus anyone who has since left. */
const rememberedTeams = (room) => {
  if (!room._teamsMemo) return null;
  const present = room.players.map(p => p.id);
  const kept = {};
  Object.keys(room._teamsMemo).forEach(id => {
    if (present.indexOf(id) !== -1) kept[id] = room._teamsMemo[id];
  });
  return Object.keys(kept).length ? kept : null;
};

// ROOM_GAME_IDS: every room game's id, built from GAME_LIST (Games.js).

const ROOM_CHAT_MAX = 60;       // lines a room keeps, events included
/* The audience (the improvement plan, Phase 4, Jackbox's idea): whoever is
   watching a game - a latecomer, the fifth person at a table of four - cheers
   (an emoji that floats up on every screen) and, in the first minute and a half
   of a game, says who will win. Right guesses are said in the chat when the
   room goes back to the hub. Players may cheer and guess too; the phone only
   offers it to those watching. Our own take (the owner: never a copy of another
   app): the cheers are what an Egyptian living room shouts - برافو، جامد،
   هههه، يا نهار، يا رب - and a زغروطة that trills on the TV. */
const AUDIENCE_CHEERS = ['bravo', 'fire', 'haha', 'yanhar', 'yarab', 'zaghrouta'];
const PREDICT_OPEN_MS = 90000;
const CHEER_BURST = 4;          // a person's taps in CHEER_WINDOW_MS; more is a stuck finger
const CHEER_WINDOW_MS = 3000;

const ROOM_CHAT_MAX_LEN = 200;  // characters in one

/**
 * Adds a line to the room's chat, keeping only the last ROOM_CHAT_MAX. Ids
 * only ever grow (room.chatSeq): counting on from the last line reused an id
 * once a team's lines had been dropped, and a phone took the new line for one
 * it had already shown.
 */
const pushChat = (room, entry) => {
  const chat = (room.chat || []).slice(-(ROOM_CHAT_MAX - 1));
  const top = chat.reduce((m, x) => Math.max(m, Number(x.id) || 0), Number(room.chatSeq) || 0);
  room.chatSeq = top + 1;
  chat.push(Object.assign({ id: room.chatSeq, at: Date.now() }, entry));
  room.chat = chat;
};

/**
 * A name as a room keeps it: control, zero-width and direction characters out (a pasted
 * 'منى' + U+200B sat beside 'منى' looking the same, and U+202E turned the text after it
 * round), trimmed, 24 at most. The join, the seat claim, a screen becoming a player, a rename.
 */
const cleanRoomName = (raw) => String(raw || '').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g, '').trim().slice(0, 24);

/**
 * Two names for one person: case, spaces, diacritics and the Arabic letters
 * people spell alike (samePlayer on the phone). A room's join and a screen
 * becoming a player both refuse a name that is already taken this way.
 */
const sameRoomName = (a, b) =>
  foldArabicLetters(cleanRoomName(a)).replace(/\s+/g, ' ').trim() === foldArabicLetters(cleanRoomName(b)).replace(/\s+/g, ' ').trim();

/* --- «ده أنا»: taking your own seat back (the ideas of 7 Oct 2026, 1272 + 1278) ----------
   A phone whose battery died or whose browser was cleared comes back with no key, and its
   name is taken - by itself. Joining with that name, when that seat's phone has been gone
   over a minute, may ask for the seat back: the asking phone waits, the host (or, the host
   away 20 s, two different seated people who aren't computer players) answers «منى رجعت؟ رجّعها مكانها»,
   and on yes the phone is given that seat - its id, so its night points and place in the
   game - with a fresh key: the old key stops working. room.js does the waiting and the keys
   (claim, claimSeat); these decide. room._claims: [{ id, seat, name, at, token, status:
   'pending' | 'yes' | 'no', yes?: [stand-in ids], key?, doneAt? }]; only the pending ones' id,
   seat, name, time and stand-ins' yes reach a phone (roomClaimsView), never a token or a key. */
const SEAT_CLAIM_AWAY_MS = 60000;      // the seat's phone gone this long before it can be asked for
const SEAT_CLAIM_MS = 3 * 60 * 1000;   // an ask unanswered this long lapses; an answer is kept this long for its phone
const SEAT_CLAIM_MAX = 4;              // asks waiting at once in one room
const SEAT_CLAIM_STAND_IN_MS = 20000;  // the host away this long: anyone seated may answer (HOST_STAND_IN_MS)

/** Whether a seat's phone has been away long enough to be asked for. `online`: a Set of the ids connected. */
const roomSeatAway = (room, pid, online, now) => {
  const p = (room.players || []).find(x => x.id === pid);
  if (!p || p.bot || (online && online.has(pid))) return false;
  const seen = room.lastSeen && room.lastSeen[pid];
  return !!seen && now - seen >= SEAT_CLAIM_AWAY_MS;
};

/** Drops the asks that lapsed and the answers nobody came for. True when anything went. */
const roomClaimsPrune = (room, now) => {
  const list = Array.isArray(room._claims) ? room._claims : [];
  const keep = list.filter(c => (c.status === 'pending' ? now - c.at < SEAT_CLAIM_MS : now - (c.doneAt || c.at) < SEAT_CLAIM_MS));
  if (keep.length === list.length) return false;
  room._claims = keep;
  return true;
};

/** What every phone is shown: the asks waiting (whose seat, the name, since when, the stand-ins' yes so far). */
const roomClaimsView = (room, now) => (Array.isArray(room._claims) ? room._claims : [])
  .filter(c => c.status === 'pending' && now - c.at < SEAT_CLAIM_MS && (room.players || []).some(p => p.id === c.seat))
  .map(c => ({ id: c.id, seat: c.seat, name: c.name, at: c.at, yes: Array.isArray(c.yes) ? c.yes.slice() : [] }));

/** A phone asks for the seat named `rawName`. Returns the ask (its id and token go to that phone only) or throws. */
const roomClaimAsk = (room, rawName, online, now, id, token) => {
  const name = cleanRoomName(rawName);
  const p = (room.players || []).find(x => !x.bot && sameRoomName(x.name, name));
  if (!p) throw new Error('CLAIM_NONE');
  if (!roomSeatAway(room, p.id, online, now)) throw new Error('الاسم ده لسه متصل في الغرفة، اختار اسم تاني');
  roomClaimsPrune(room, now);
  // A second ask for the same seat (its phone tried again) replaces the first.
  room._claims = (room._claims || []).filter(c => !(c.status === 'pending' && c.seat === p.id));
  if (room._claims.filter(c => c.status === 'pending').length >= SEAT_CLAIM_MAX) throw new Error('استنى شوية وجرب تاني');
  const c = { id: String(id), seat: p.id, name: p.name, at: now, token: String(token), status: 'pending' };
  room._claims.push(c);
  return c;
};

/**
 * Someone answers an ask. `hostAwayFor`: how long the host has been away (ms, 0 when here).
 * On yes the seat gets `newKey` (room.keys) and the chat says it. Returns the ask, or null when
 * it was already answered or lapsed (a double tap: nothing to do).
 */
const roomClaimAnswer = (room, pid, claimId, yes, online, now, hostAwayFor, newKey) => {
  roomClaimsPrune(room, now);
  const c = (room._claims || []).find(x => x.id === String(claimId || '') && x.status === 'pending');
  if (!c) return null;
  const seated = (room.players || []).some(p => p.id === pid && !p.bot);
  if (room.hostId !== pid && !(seated && hostAwayFor >= SEAT_CLAIM_STAND_IN_MS)) throw new Error('دي للمضيف بس');
  if (pid === c.seat) throw new Error('دي للمضيف بس');
  const p = (room.players || []).find(x => x.id === c.seat);
  // Its own phone came back meanwhile (or it left): the seat is not for asking any more.
  if (!yes || !p || !roomSeatAway(room, c.seat, online, now)) { c.doneAt = now; c.status = 'no'; return c; }
  // The host's yes alone gives the seat back; with the host away it takes two different seated
  // people's yes, so one person can't ask from a second tab and approve it from their own seat
  // (audit 7 Oct 2026, S1). A stand-in who has since left or become a screen no longer counts.
  if (room.hostId !== pid) {
    const stillSeated = (id) => (room.players || []).some(x => x.id === id && !x.bot && id !== c.seat);
    c.yes = (Array.isArray(c.yes) ? c.yes : []).filter(stillSeated);
    if (!c.yes.includes(pid)) c.yes.push(pid);
    if (c.yes.length < 2) return c;
  }
  c.doneAt = now;
  c.status = 'yes';
  c.key = String(newKey);
  room.keys = room.keys || {};
  room.keys[c.seat] = c.key;
  roomEvent(room, 'back', { name: p.name });
  return c;
};

/**
 * The asking phone comes for its answer: the ask (null: no such ask). An answer stays until it
 * lapses (roomClaimsPrune, SEAT_CLAIM_MS after it was given), so a poll whose reply was lost asks
 * again with the same token and gets the same answer and key (audit 7 Oct 2026, S4).
 */
const roomClaimTake = (room, claimId, token, now) => {
  roomClaimsPrune(room, now);
  const list = room._claims || [];
  const c = list.find(x => x.id === String(claimId || '') && x.token === String(token || ''));
  return c || null;
};

/**
 * A tap aimed at a state that has since moved on - the second of a double
 * tap, or a slow phone - carries what its phone saw (the round, the player
 * up), and is dropped without an error when that no longer matches. A phone
 * too old to send it is trusted, as before.
 */
/* ==========================================================================
   «اعمل مسابقتك» and «كلماتنا» — WHAT THE FAMILY WRITES (30 Sep 2026)
   A quiz or the family word pack, kept by the rooms server under a code
   (Packs.js, rooms-worker/src/packs.js). The lobby names it (payload.pack on
   start); room.js reads it from its store and hands it to this one move as
   room._packIn - never a phone's copy, so a quiz's answers can't be forged or
   seen. roomPackAdopt keeps it as room._pack for the rest of the game (play
   again, the next round), never projected. A start that names no pack clears it.
   ========================================================================== */
const roomPackAdopt = (room, action, payload) => {
  const code = payload && payload.pack ? packCode(payload.pack) : '';
  if (code) {
    const got = room._packIn;
    if (!got || got.code !== code) throw new Error('مش لاقيين المسابقة أو الكلمات بالكود ده');
    room._pack = { code: got.code, kind: got.kind, pack: got.pack };
  } else if (action === 'start') {
    room._pack = null;
  }
};
/** The quiz this game plays, or null. */
const roomPackQuiz = (room) => (room._pack && room._pack.kind === 'quiz' ? room._pack : null);
/** The family's words this game deals from, or null. */
const roomPackWords = (room) => (room._pack && room._pack.kind === 'words' ? room._pack.pack.words : null);
/**
 * A quiz's questions as a deck: the choices shuffled (the author often writes the right one first).
 * `sec`: the section the question is in (769: the last heading at or before it), '' before any.
 */
const roomPackDeck = (quiz) => {
  let sec = '';
  return quiz.pack.questions.map(q => {
    if (q.s) sec = String(q.s);
    const order = shuffled([0, 1, 2, 3]);
    return { q: (q.e ? q.e + ' ' : '') + q.q, choices: order.map(k => q.c[k]), answer: order.indexOf(q.a), sec: sec };
  });
};

const staleTap = (payload, field, current) => {
  if (!payload || payload[field] === undefined || payload[field] === null) return false;
  return String(payload[field]) !== String(current);
};

/** A fresh `shared.dealId`: phones key "already sent this" on it. */
const newDealId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/**
 * Something that happened, said in the chat so a player who isn't in the room
 * with the others can follow: who came and went, what started, who hosts now.
 * Stored as a kind and its details (`sys`, `p`), so every phone says it in its
 * own language. They never count as unread.
 */
const roomEvent = (room, kind, details) => pushChat(room, { sys: kind, p: details || {} });

/**
 * The chat one device may read. A team's channel in أسماء الرموز goes only to
 * that team - the other team, and a screen facing everyone, never receive it.
 */
const chatFor = (room, playerId) => {
  const mine = roomChatTeam(room, playerId);
  return (room.chat || []).filter(m => !m.team || (!!mine && mine.team === m.team));
};

/**
 * A player's side for the team channel: أسماء الرموز's { team, role }, or in
 * شطرنج بالتصويت (RoomVoteChess.js) the colour their team plays ('w' / 'b').
 * Null in any other game, and for a screen.
 */
const roomChatTeam = (room, playerId) => {
  const s = room.shared || {};
  if (room.game === 'votechess') {
    const k = typeof vcTeamOf === 'function' && room.phase !== 'lobby' ? vcTeamOf(s, playerId) : -1;
    return k === -1 ? null : { team: k ? 'b' : 'w' };
  }
  const teams = s.teams && !Array.isArray(s.teams) ? s.teams : {};
  return teams[playerId] || null;
};

// Must match MAX_PLAYERS and MAX_SCREENS in rooms-worker/src/room.js.
const ROOM_MAX_PLAYERS = 12;
const ROOM_MAX_SCREENS = 3;

/* ==========================================================================
   COMPUTER PLAYERS
   --------------------------------------------------------------------------
   In the games that register here (أونو, الدومينو), the host can add a
   computer player in the lobby - to play alone, or to make up a table of
   four for teams. A bot is an ordinary entry in room.players with `bot` set
   to its level ('easy' or 'hard'): it holds a seat, is dealt like anyone,
   and its hand is in room.secrets like anyone's. It has no key and no
   socket, so it can never be a phone.

   It moves through the same door as a phone. After every move the game is
   asked whether a bot has something to do (`pending`, with a key naming
   that moment); if so, room._botAt is set a second or so ahead, the server's
   alarm wakes on it (roomDeadline), and roomTimeout asks the game what that
   bot does (`decide`, from its own secret and what the table can see - never
   another hand) and applies it with applyRoomAction, exactly as if the bot
   had tapped it. A move that is refused falls back to the game's safe move
   (`fallback`: draw, pass), so a bot never stalls a table.

   Bots belong to their game: going back to the hub parks them (room._botsMemo)
   and choosing a game that has bots again sits them back down.
   ========================================================================== */
const ROOM_BOT_GAMES = {};                // id -> { max, pending(room), decide(room, pid), fallback(room, pid) }
const ROOM_BOT_LEVELS = ['easy', 'hard'];
const ROOM_BOT_DELAY_MS = [1000, 1700];   // how long a bot "thinks": long enough to see each move land
const ROOM_BOT_RETRY_MS = 3000;
const ROOM_BOT_MAX_FAILS = 3;

/* ==========================================================================
   Forced moves (the owner, 21 Sep 2026: "in any scenario where only one
   thing can be done, it should be done automatically"). A game registers
   ROOM_FORCED_GAMES[id] = (room) => { pid, key, move: { action, payload },
   delay? } for a person whose only legal move is known - أونو's take when
   nothing stacks, a draw when nothing fits, the last square of a board - and
   the same clock that moves the bots makes it for them after a beat
   (ROOM_FORCED_DELAY_MS), through applyRoomAction like a tap. It is looked
   at again when the beat is up, so a move the table made meanwhile, or one
   that stopped being the only one, is never made. Never for what the tap
   itself is (أونو!, العقل, مافيا's night), nor for anything the player is
   meant to work out (الدومينو with the helpers off).
   ========================================================================== */
const ROOM_FORCED_GAMES = {};
const ROOM_FORCED_DELAY_MS = 1200;

/** A person with only one thing to do right now, from their game's hook. */
const roomForcedMove = (room) => {
  const hook = room.game && ROOM_FORCED_GAMES[room.game];
  if (!hook || room.phase === 'lobby') return null;
  let f = null;
  try { f = hook(room); } catch (err) { f = null; }
  if (!f || !f.pid || !f.move || isRoomBot(room, f.pid) || !room.players.some(p => p.id === f.pid)) return null;
  return f;
};

const newBotId = () => 'b' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const isRoomBot = (room, pid) => room.players.some(p => p.id === pid && !!p.bot);
const roomBotLevel = (room, pid) => ((room.players.find(p => p.id === pid) || {}).bot) || null;

/* The names the phone offers (ROOM_BOT_NAMES in JS_Room.html), for a bot seated
   with none sent - a play again from an older page, say - so it is never "Bot". */
const ROOM_BOT_FALLBACK = {
  ar: ['زيزو', 'بندق', 'سمسم', 'فلفل', 'كوكي', 'توتا', 'شوشو', 'لولي', 'ميمي', 'بسبوسة', 'كراميلا'],
  en: ['Robo', 'Chip', 'Pixel', 'Byte', 'Echo', 'Nova', 'Bolt', 'Zippy', 'Sparky', 'Widget', 'Dot']
};
/** A name from that list nobody here has, in the language the room's bots already use (Arabic by default). */
const roomBotFallbackName = (room) => {
  const bots = room.players.filter(p => p.bot).map(p => String(p.name || '').replace(/ \d+$/, ''));
  const lang = bots.some(n => ROOM_BOT_FALLBACK.en.some(x => sameRoomName(n, x))) ? 'en' : 'ar';
  const list = ROOM_BOT_FALLBACK[lang];
  return list.find(n => !room.players.some(p => sameRoomName(p.name, n))) || list[0];
};

/** A bot's name, as the host's phone offered it, made unique in the room. */
const uniqueBotName = (room, raw) => {
  const base = String(raw || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20) || roomBotFallbackName(room);
  let name = base;
  for (let n = 2; room.players.some(p => sameRoomName(p.name, name)); n++) name = base + ' ' + n;
  return name;
};

/** The seats a bot game can hold. */
const roomBotCap = (room) => {
  const hook = ROOM_BOT_GAMES[room.game];
  return Math.min(ROOM_MAX_PLAYERS, (hook && hook.max) || ROOM_MAX_PLAYERS);
};

/** Back to the hub, or on to a game without bots: they get up and wait. */
const parkRoomBots = (room) => {
  const bots = room.players.filter(p => p.bot);
  if (!bots.length) return;
  // Along with any still waiting for a seat from last time.
  room._botsMemo = bots.concat((room._botsMemo || []).filter(b => !bots.some(x => x.id === b.id)));
  room.players = room.players.filter(p => !p.bot);
  if (room.secrets) bots.forEach(b => { delete room.secrets[b.id]; });
};

/** A game with bots again: the ones parked sit back down, while there are seats. */
const unparkRoomBots = (room) => {
  if (!ROOM_BOT_GAMES[room.game] || !Array.isArray(room._botsMemo)) return;
  const cap = roomBotCap(room);
  const waiting = [];
  room._botsMemo.forEach(b => {
    if (room.players.some(p => p.id === b.id || sameRoomName(p.name, b.name))) return;   // a person has the name now
    if (room.players.length >= cap) { waiting.push(b); return; }                            // no seat: keeps waiting
    room.players.push({ id: b.id, name: b.name, bot: ROOM_BOT_LEVELS.indexOf(b.bot) !== -1 ? b.bot : 'easy' });
  });
  room._botsMemo = waiting.length ? waiting : null;
};

/** The host's lobby actions for bots. True when `action` was one of them. */
const roomBotAction = (room, playerId, action, payload) => {
  if (action !== 'addBot' && action !== 'removeBot' && action !== 'setBotLevel') return false;
  requireHost(room, playerId);
  if (!ROOM_BOT_GAMES[room.game]) throw new Error('اللعبة دي مفيهاش لاعبين كمبيوتر');
  if (room.phase !== 'lobby') throw new Error('الكمبيوتر يتضاف أو يتشال قبل ما اللعبة تبدأ');
  const p = payload || {};
  if (action === 'addBot') {
    if (room.players.length >= roomBotCap(room)) throw new Error('مفيش أماكن تانية في اللعبة دي');
    const level = ROOM_BOT_LEVELS.indexOf(p.level) !== -1 ? p.level : 'easy';
    const name = uniqueBotName(room, p.name);
    room.players.push({ id: newBotId(), name: name, bot: level });
    roomEvent(room, 'joined', { name: name, bot: true });
    return true;
  }
  const target = room.players.find(x => x.id === String(p.playerId || '') && x.bot);
  if (!target) return true;               // already gone: nothing to do
  if (action === 'setBotLevel') {
    target.bot = ROOM_BOT_LEVELS.indexOf(p.level) !== -1 ? p.level : (target.bot === 'easy' ? 'hard' : 'easy');
    return true;
  }
  room.players = room.players.filter(x => x.id !== target.id);
  if (room.secrets) delete room.secrets[target.id];
  roomEvent(room, 'left', { name: target.name, bot: true });
  return true;
};

/**
 * After anything that can change whose move it is: is a bot up? The same
 * moment (the same key) keeps the time it already had, so a chat line or a
 * presence tick never makes a bot wait longer; a new moment gets a new wait.
 */
const scheduleBots = (room) => {
  const hook = room.game && ROOM_BOT_GAMES[room.game];
  let next = null;
  if (hook && room.phase !== 'lobby' && room.players.some(p => p.bot)) {
    try { next = hook.pending(room); } catch (err) { next = null; }
  }
  if (next && !isRoomBot(room, next.pid)) next = null;
  // No bot up: perhaps a person with only one thing to do (see Forced moves).
  let forced = false;
  if (!next) {
    const f = roomForcedMove(room);
    if (f && 'f|' + f.pid + '|' + String(f.key || '') !== room._forcedFailed) {
      next = { pid: f.pid, key: 'f|' + String(f.key || ''), delay: typeof f.delay === 'number' ? f.delay : ROOM_FORCED_DELAY_MS };
      forced = true;
    }
  }
  if (!next) {
    room._botAt = null; room._botKey = null; room._botPid = null; room._botFails = 0;
    return;
  }
  const key = next.pid + '|' + String(next.key || '');
  if (room._botKey === key && room._botAt) return;
  const [lo, hi] = ROOM_BOT_DELAY_MS;
  room._botKey = key;
  room._botPid = next.pid;
  room._botFails = 0;
  room._botAt = Date.now() + (typeof next.delay === 'number' ? next.delay : lo + Math.floor(Math.random() * (hi - lo)));
  if (forced) room._forcedFailed = null;
};

/** The bot that is up makes its move. True when the room changed. */
const ROOM_BOT_BURST_MS = 1000;
const runRoomBot = (room) => {
  const hook = room.game && ROOM_BOT_GAMES[room.game];
  const pid = room._botPid;
  const key = room._botKey;
  room._botAt = null;
  const attempt = (move) => {
    if (!move || !move.action) return false;
    // A copy, so a move refused halfway through leaves nothing behind.
    const trial = structuredClone(room);
    applyRoomAction(trial, pid, move.action, move.payload || {});
    Object.keys(room).forEach(k => { delete room[k]; });
    Object.assign(room, trial);
    return true;
  };
  if (pid && !isRoomBot(room, pid)) {
    // A person's only move: made if it is still that moment and still their only move.
    const f = roomForcedMove(room);
    if (f && f.pid === pid && pid + '|f|' + String(f.key || '') === key) {
      try {
        if (attempt(f.move)) return true;
      } catch (err) {
        console.error('forced move', room.game, String((err && err.message) || err));
        room._forcedFailed = 'f|' + pid + '|' + String(f.key || '');   // refused: left to the person, not tried again for this moment
      }
    }
    scheduleBots(room);
    return true;
  }
  if (!hook || !pid) { scheduleBots(room); return true; }
  try {
    if (attempt(hook.decide(room, pid))) return true;
  } catch (err) {
    console.error('bot move', room.game, String((err && err.message) || err));
  }
  try {
    if (hook.fallback && attempt(hook.fallback(room, pid))) return true;
  } catch (err) {
    console.error('bot fallback', room.game, String((err && err.message) || err));
  }
  // Nothing it tried was allowed: look again shortly, a few times, then leave it to the host.
  room._botFails = (room._botFails || 0) + 1;
  if (room._botFails < ROOM_BOT_MAX_FAILS) room._botAt = Date.now() + ROOM_BOT_RETRY_MS;
  return true;
};

/**
 * A room game that registers itself (5 Oct 2026). Its Room<Game>.js says, once:
 *
 *   ROOM_RULES.mygame = {
 *     action(room, playerId, action, payload) { … },   // every move (start, nextRound, playAgain, its own)
 *     deadline(room) { return ms or null; },           // optional: when its clock next needs the server
 *     timeout(room, now) { return true if it acted; }, // optional: what happens then
 *     left(room, playerId, name) { … },                // what happens when someone leaves mid-round
 *   };
 *
 * and this engine calls them: no case to add to applyRoomAction, gameDeadline,
 * gameTimeout or gamePlayerLeft (tools/new-game.mjs writes such a file). The
 * games written before keep their cases below.
 */
const ROOM_RULES = {};

/** The longest line of the host's options a room keeps (lobbySum, 1283). */
const LOBBY_SUM_MAX = 120;

/** How many of the night's games a room remembers for «لعبناها» (room.played, sent to every phone). */
const ROOM_PLAYED_KEEP = 60;

const applyRoomAction = (room, playerId, action, payload) => {
  // Room-level actions come first: they're about the group, not the game.

  // A device switches between playing and showing the room on a big screen.
  // Between games only: in the middle of a round a player may hold a card.
  if (action === 'becomeScreen' || action === 'becomePlayer') {
    if (room.phase !== 'lobby') throw new Error('غيّر نوع الجهاز بين الجولات');
    room.screens = room.screens || [];
    if (action === 'becomeScreen') {
      if (!room.players.some(p => p.id === playerId)) return;          // already a screen
      if (room.screens.length >= ROOM_MAX_SCREENS) throw new Error('اكتمل عدد الشاشات في الغرفة');
      room.players = room.players.filter(p => p.id !== playerId);
      room.screens.push({ id: playerId });
      if (room.shared && room.shared.teams) delete room.shared.teams[playerId];
      missionFill(room);   // المهمة السرية: a screen holds no file, and nobody aims at it
      return;
    }
    if (!room.screens.some(s => s.id === playerId)) return;              // already a player
    const name = cleanRoomName(payload && payload.name);
    if (!name) throw new Error('اكتب اسمك أولاً');
    if (room.players.length >= ROOM_MAX_PLAYERS) throw new Error('الغرفة ممتلئة');
    if (room.players.some(p => sameRoomName(p.name, name))) {
      throw new Error('الاسم مستخدم بالفعل في هذه الغرفة');
    }
    room.screens = room.screens.filter(s => s.id !== playerId);
    const seat = { id: playerId, name: name };
    // Its face (1282) when it sent a good one; a bad one is dropped, as on join.
    const face = faceClean(payload && payload.face);
    if (face) seat.face = face;
    room.players.push(seat);
    missionFill(room);   // المهمة السرية: dealt in
    return;
  }

  // «أنت: منى ✏️» (the owner, 26 Sep 2026): a room is opened and joined under the
  // name the phone used last time, without asking, so the lobby is where it is
  // changed. Between games only: a game in play keeps its players' names.
  if (action === 'rename') {
    if (room.phase !== 'lobby') throw new Error('غيّر اسمك بين الألعاب');
    const me = room.players.find(p => p.id === playerId && !p.bot);
    if (!me) throw new Error('لست في الغرفة');
    const name = cleanRoomName(payload && payload.name);
    if (!name) throw new Error('اكتب اسمك أولاً');
    if (room.players.some(p => p.id !== playerId && sameRoomName(p.name, name))) {
      throw new Error('الاسم ده مستخدم في الغرفة، اختار اسم تاني');
    }
    // «اعمل وشك» (1282): the face made in the same sheet, checked digit by digit against its
    // parts (faceClean, Faces.js); '' goes back to the initial, anything else is refused.
    // An old phone sends no face at all, and keeps the one it has.
    if (payload && payload.face !== undefined) {
      const face = faceClean(payload.face);
      if (face === null) throw new Error('الوش ده مش مظبوط');
      if (face) me.face = face; else delete me.face;
    }
    me.name = name;
    missionFill(room);   // المهمة السرية keeps the names it tells the story with
    return;
  }

  if (action === 'chat') {
    // Short messages between the phones, for a table that isn't at one table.
    // Kept on the room, outside any game, so it survives the hub and every deal.
    const text = String((payload && payload.text) || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, ROOM_CHAT_MAX_LEN);
    if (!text) throw new Error('اكتب رسالة');
    const who = room.players.find(p => p.id === playerId) || (room.screens || []).find(x => x.id === playerId);
    if (!who) throw new Error('لست في الغرفة');
    if (mafiaSilenced(room, playerId)) throw new Error('إنت خرجت من اللعبة: بتتفرج وساكت لحد آخرها 🤐');
    const now = Date.now();
    // Five in five seconds is a person; more is a stuck key.
    if ((room.chat || []).filter(m => m.from === playerId && now - m.at < 5000).length >= 5) throw new Error('على مهلك شوية');
    const entry = { from: playerId, name: who.name || '📺', text: text };
    if (payload && payload.to === 'team') {
      // أسماء الرموز: the team's own channel. The projection keeps it from the
      // other team (chatFor). A spymaster in play reads it and can't write to
      // it: the real game lets them hear the table, never talk to it.
      const mine = (room.game === 'codenames' || room.game === 'votechess') && roomChatTeam(room, playerId);
      if (!mine) throw new Error('الشات ده للفريق بس');
      if (mine.role === 'spymaster' && room.phase === 'playing') throw new Error('الرئيس بيقرأ بس، مايكتبش لفريقه');
      entry.team = mine.team;
    }
    pushChat(room, entry);
    return;
  }

  if (action === 'cheer') {
    const e = String((payload && payload.e) || '');
    if (AUDIENCE_CHEERS.indexOf(e) === -1) throw new Error('مش موجودة');   // one of the six shouts
    const who = room.players.find(p => p.id === playerId && !p.bot);
    if (!who || !room.game || room.phase === 'lobby' || mafiaSilenced(room, playerId)) return;
    const now = Date.now();
    room._cheers = (room._cheers || []).filter(c => now - c.at < CHEER_WINDOW_MS);
    if (room._cheers.filter(c => c.from === playerId).length >= CHEER_BURST) return;
    room._cheers.push({ from: playerId, at: now });
    room.cheer = { seq: ((room.cheer && room.cheer.seq) || 0) + 1, e: e, name: who.name };
    return;
  }

  if (action === 'predict') {
    const p = room.predict;
    const target = String((payload && payload.target) || '');
    const who = room.players.find(x => x.id === playerId && !x.bot);
    if (!p || !who || p.game !== room.game || Date.now() > p.until || roomGameIsOver(room)) throw new Error('التوقع اتقفل');
    const roster = (room.shared && room.shared.roster) || [];
    if (roster.indexOf(target) === -1) throw new Error('مش في اللعبة');
    p.picks[playerId] = target;
    return;
  }

  // المهمة السرية (RoomMission.js): the room's switch and each person's file, beside any game.
  if (missionAction(room, playerId, action, payload)) return;

  // «ادخل» on the big screen (the ideas of 7 Oct 2026, 1287): the host's phone asks the TV to
  // show its corner QR big for a few seconds, for someone who has just come in. Only the moment.
  if (action === 'tvQr') {
    requireHost(room, playerId);
    room.tvQrAt = Date.now();
    return;
  }

  // The host's folded options as one line for everyone else (the ideas of 7 Oct 2026, 1283): what the
  // host's phone shows over its options, kept for the game chosen and sent to every phone (lobbySum).
  // Only text, and only while that game waits in the lobby; a line for a game no longer chosen is dropped.
  if (action === 'lobbySum') {
    requireHost(room, playerId);
    const game = String((payload && payload.game) || '');
    if (room.phase !== 'lobby' || !room.game || game !== room.game) return;
    const raw = String((payload && payload.text) || '');
    const text = Array.from(raw).map(ch => (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 ? ' ' : ch)).join('')
      .replace(/\s+/g, ' ').trim().slice(0, LOBBY_SUM_MAX);
    room.lobbySum = text ? { game: game, text: text } : null;
    return;
  }

  // The host sits a computer player down, takes one out, or changes its level.
  if (roomBotAction(room, playerId, action, payload)) return;

  // برنامج السهرة (RoomProgram.js): its own actions, and the room-level moves it changes while it runs.
  if (programAction(room, playerId, action, payload)) return;
  if (programGuard(room, playerId, action, payload)) return;

  // «⚙️ غيّر الإعدادات» (the owner, 8 Oct 2026): the same game again with other options - the night
  // is banked as «لعبة تانية» banks it, and the room lands in that game's lobby, not the list.
  if (action === 'reconfigure') {
    requireHost(room, playerId);
    const game = room.game;
    if (!game) throw new Error('اختر لعبة أولاً');
    if (room.program) throw new Error('البرنامج هيكمّل لوحده');
    applyRoomAction(room, playerId, 'backToHub', {});
    applyRoomAction(room, playerId, 'chooseGame', { game: game });
    return;
  }

  if (action === 'chooseGame') {
    requireHost(room, playerId);
    const game = String(payload.game || '');
    if (ROOM_GAME_IDS.indexOf(game) === -1) throw new Error('لعبة غير معروفة');
    if (roomGameIsOff(game)) throw new Error('اللعبة دي واقفة شوية عشان بنصلّحها، وهترجع قريب');

    clearGameState(room);
    room.game = game;
    room.phase = 'lobby';
    room.lobbySum = null;   // the host's phone sends the new game's line (1283)
    // Bots play only the games that know how; the ones parked come back for those.
    if (ROOM_BOT_GAMES[game]) unparkRoomBots(room); else parkRoomBots(room);

    if (game === 'codenames') {
      const teams = rememberedTeams(room);
      if (teams) room.shared.teams = teams;
      if (room._cnMemo && room._cnMemo.settings) room.shared.settings = room._cnMemo.settings;
      if (room._cnMemo && room._cnMemo.wins) room.shared.wins = room._cnMemo.wins;
    }
    return;
  }

  if (action === 'backToHub') {
    requireHost(room, playerId);
    const had = room.game;
    // A finished round the host took back to the game's lobby («لعبة جديدة», restart): its board
    // waited server-side (the lobby shows none), and is the one banked if no round followed it.
    const restarted = room._restartNight;
    room._restartNight = null;
    let lobbyTeams = null;
    if (had && restarted && restarted.game === had && room.phase === 'lobby' && !(room.shared || {}).board) {
      // أسماء الرموز: its sides are placed by the winner, as they were played - not as the lobby
      // has them since (someone switched, a latecomer picked one).
      lobbyTeams = restarted.teams ? (room.shared || {}).teams || null : null;
      room.shared = Object.assign({}, room.shared, { board: restarted.board, roster: restarted.roster },
        restarted.winner ? { winner: restarted.winner } : {}, restarted.teams ? { teams: restarted.teams } : {});
    }
    // The night's table, taken from the game's own board before it is cleared. ارسم وخمّن and
    // الفنان المزيف keep a board only at a round's result: left mid-round, their running scores.
    const sh = room.shared || {};
    if (had) bankNightPoints(room, sh.board || (NIGHT_BOARD_FROM_SCORES[had] && sh.scores ? scoreboardOf(room) : undefined));
    if (had) settlePredictions(room);
    // The lobby's sides are the ones remembered for the next game of it (clearGameState).
    if (lobbyTeams) room.shared.teams = lobbyTeams;
    clearGameState(room);
    room.game = null;
    room.phase = 'lobby';
    parkRoomBots(room);
    if (had) roomEvent(room, 'hub');
    return;
  }

  if (!room.game) throw new Error('اختر لعبة أولاً');

  // Dealing happens once. Without this a second 'start' - a double tap either
  // side of the round trip, or a retry - re-deals a game already under way.
  if (action === 'start' && room.phase !== 'lobby') {
    throw new Error('اللعبة بدأت بالفعل');
  }

  // "Next round" sent from a round that is already over - the second tap of a
  // double tap - would deal another round nobody saw. Every game, one place.
  if (action === 'nextRound' && room.shared && room.shared.round !== undefined && staleTap(payload, 'round', room.shared.round)) return;

  // «التالي لوحده» (the next batch): the host's lobby switch, kept for the game on the room.
  if (AUTONEXT_GAMES[room.game] && (action === 'start' || action === 'playAgain')) {
    if (payload && typeof payload.autoNext === 'boolean') room._autoNext = payload.autoNext;
    else if (action === 'start') room._autoNext = false;
  }
  // «⏸ استنى»: the count to the next round stops, for this round; «التالي» is by hand again.
  if (action === 'autoPause') { autoNextPause(room, playerId, payload); return; }

  // «اعمل مسابقتك» / «كلماتنا»: a pack the lobby named, which room.js loaded (_packIn).
  if (action === 'start' || action === 'playAgain') roomPackAdopt(room, action, payload);

  // What was there before the move, to tell whether it dealt something new.
  const sharedBefore = room.shared;
  const dealing = action === 'start' || action === 'nextRound' || action === 'playAgain';
  const textBefore = dealing ? JSON.stringify(room.shared || {}) : '';

  // A game switched off for a fix (DisabledGames.js) deals nothing new: no start, no play
  // again, and no next game once this one is over (a duel's winner stays, a new tournament).
  // The rounds inside a game already running go on to its end.
  const wasOver = roomGameIsOver(room);
  const OFF_MSG = 'اللعبة دي واقفة شوية عشان بنصلّحها، وهترجع قريب';
  if ((action === 'start' || action === 'playAgain') && roomGameIsOff(room.game)) throw new Error(OFF_MSG);
  if ((action === 'nextRound' || action === 'tourNew') && wasOver && roomGameIsOff(room.game)) throw new Error(OFF_MSG);
  // The board the finished game ended on (its players' rows), for the audience's guesses if this deals the next one.
  // Winner stays (the duels' next game, the owner's E4 of 8 Oct 2026): each game is settled on its
  // own result, not on the session's tally of wins (shared.board), and a fresh «مين هيكسب؟» opens.
  const duelNext = action === 'nextRound' && wasOver && ['connect4', 'dots', 'xo', 'blockway'].indexOf(room.game) !== -1 && !(room.shared || {}).tour && !(room.shared || {}).multi;
  const boardBefore = action === 'playAgain' || action === 'tourNew' ? nightBoardOf(room, (room.shared || {}).board, true)
    : (duelNext ? duelResultBoard(room) : null);
  // «لعبة جديدة» (restart) after a finished round: the guesses on it are settled before the game's
  // state is replaced - the next Start would open new ones over them, unscored.
  const restartBoard = action === 'restart' && room.predict && (wasOver || room.phase === 'result')
    ? nightBoardOf(room, (room.shared || {}).board, true) : null;
  // برنامج السهرة: what this move is about to wipe (the buzzer's line), for the awards.
  programBeforeMove(room, playerId, action, payload);

  switch (room.game) {
    case 'imposter':  imposterAction(room, playerId, action, payload); break;
    case 'justone':   justOneAction(room, playerId, action, payload); break;
    case 'whoami':    whoAmIAction(room, playerId, action, payload); break;
    case 'codenames': codenamesAction(room, playerId, action, payload); break;
    case 'wouldyou':   wouldYouRatherAction(room, playerId, action, payload); break;
    case 'mostlikely': mostLikelyAction(room, playerId, action, payload); break;
    case 'fibbage':    fibbageAction(room, playerId, action, payload); break;
    case 'drawguess':  drawGuessAction(room, playerId, action, payload); break;
    case 'fakeartist': fakeArtistAction(room, playerId, action, payload); break;
    case 'trivia':     triviaAction(room, playerId, action, payload); break;
    case 'buzzer':     buzzerAction(room, playerId, action, payload); break;
    case 'stop':       stopAction(room, playerId, action, payload); break;
    case 'chameleon':  chameleonRoomAction(room, playerId, action, payload); break;
    case 'spyfall':    spyfallRoomAction(room, playerId, action, payload); break;
    case 'bomb':       bombRoomAction(room, playerId, action, payload); break;
    case 'twotruths':  twoTruthsAction(room, playerId, action, payload); break;
    // فوازير إيموجي: a riddle a player writes, or the app's as a race, is the engine's (RoomSolve.js); the quiz is quizAction.
    case 'emoji':      (svEmojiOnEngine(room, action, payload) ? solveAction : quizAction)(room, playerId, action, payload); break;
    case 'proverbs':   quizAction(room, playerId, action, payload); break;
    case 'fiveseconds': fiveSecondsAction(room, playerId, action, payload); break;
    case 'telephone':  telephoneAction(room, playerId, action, payload); break;
    case 'monkey':     monkeyRoomAction(room, playerId, action, payload); break;
    case 'herd':       herdAction(room, playerId, action, payload); break;
    case 'mafia':      mafiaAction(room, playerId, action, payload); break;
    case 'screw':      screwAction(room, playerId, action, payload); break;
    case 'mind':       mindAction(room, playerId, action, payload); break;
    case 'timeline':   timelineAction(room, playerId, action, payload); break;
    case 'uno':        unoAction(room, playerId, action, payload); break;       // RoomUno.js
    case 'domino':     dominoAction(room, playerId, action, payload); break;    // RoomDomino.js
    case 'connect4':   connect4Action(room, playerId, action, payload); break;
    case 'dots':       dotsAction(room, playerId, action, payload); break;
    case 'xo':         xoRoomAction(room, playerId, action, payload); break;     // RoomDuels.js
    case 'battleship': battleshipAction(room, playerId, action, payload); break;  // RoomBattleship.js
    case 'chairs':     chairsAction(room, playerId, action, payload); break;      // RoomChairs.js
    case 'reaction':   reactionAction(room, playerId, action, payload); break;    // RoomReaction.js
    case 'witness':    witnessAction(room, playerId, action, payload); break;     // RoomWitness.js
    case 'wire':       wireAction(room, playerId, action, payload); break;        // RoomWire.js
    case 'vault':      vaultAction(room, playerId, action, payload); break;       // RoomVault.js
    case 'box':        boxAction(room, playerId, action, payload); break;         // RoomBox.js
    case 'exact':      exactAction(room, playerId, action, payload); break;       // RoomExact.js
    case 'hear':       hearAction(room, playerId, action, payload); break;        // RoomHear.js
    case 'hum':        humAction(room, playerId, action, payload); break;         // RoomHum.js
    case 'bumper':     bumperAction(room, playerId, action, payload); break;      // RoomBumper.js
    case 'darkroom':   darkAction(room, playerId, action, payload); break;        // RoomDark.js
    case 'chess':      chessAction(room, playerId, action, payload); break;       // RoomChess.js
    case 'votechess':  voteChessAction(room, playerId, action, payload); break;   // RoomVoteChess.js
    case 'handbrain':  handBrainAction(room, playerId, action, payload); break;   // RoomHandBrain.js
    case 'bughouse':   bughouseAction(room, playerId, action, payload); break;    // RoomBughouse.js
    case 'chess4':     chess4Action(room, playerId, action, payload); break;      // RoomChess4.js
    case 'ludo':       ludoAction(room, playerId, action, payload); break;      // RoomLudo.js
    case 'snakes':     snakesAction(room, playerId, action, payload); break;    // RoomSnakes.js
    case 'bank':       bankAction(room, playerId, action, payload); break;      // RoomBank.js
    case 'guesswho':   guessWhoAction(room, playerId, action, payload); break;  // RoomGuessWho.js
    case 'hangman':    hangmanAction(room, playerId, action, payload); break;   // RoomHangman.js
    case 'minigolf':   minigolfAction(room, playerId, action, payload); break;  // RoomMiniGolf.js
    case 'bowling':    bowlingAction(room, playerId, action, payload); break;   // RoomBowling.js
    case 'doubt':      doubtAction(room, playerId, action, payload); break;     // RoomDoubt.js
    case 'oldmaid':    oldMaidAction(room, playerId, action, payload); break;   // RoomOldMaid.js
    case 'skull':      skullAction(room, playerId, action, payload); break;     // RoomSkull.js
    case 'estimation': estimationAction(room, playerId, action, payload); break; // RoomEstimation.js
    case 'wordle':
    case 'guessnum':
    case 'flags':      solveAction(room, playerId, action, payload); break;     // RoomSolve.js
    // سباق ألغاز (RoomRace.js): the ten puzzles race on the same engine.
    case 'strands': case 'wordwheel': case 'connections': case 'pinpoint': case 'queens':
    case 'tango': case 'nonogram': case 'mines': case 'streak': case 'sudoku':
      solveAction(room, playerId, action, payload); break;
    default:
      if (!ROOM_RULES[room.game]) throw new Error('لعبة غير معروفة');
      ROOM_RULES[room.game].action(room, playerId, action, payload);
  }

  if (action === 'start' && room.phase !== 'lobby') {
    roomEvent(room, 'started', { game: room.game });
    // «لعبناها» (the ideas of 7 Oct 2026, 1314): the games dealt tonight, for the ✓ on the room's tiles.
    room.played = (Array.isArray(room.played) ? room.played : []).concat([room.game]).slice(-ROOM_PLAYED_KEEP);
    room.predict = { game: room.game, until: Date.now() + PREDICT_OPEN_MS, picks: {} };
    // The last cheer goes, its number stays: a phone only floats a cheer newer than
    // the last it saw, so a count starting over hid every cheer from game 2 on.
    room.cheer = room.cheer ? { seq: room.cheer.seq } : null;
  }

  // Play again, or a new tournament, after a game that was over: the guesses on the
  // game that ended are settled against its board, and a fresh «مين هيكسب؟» opens -
  // the old picks must not be scored against a later game's board.
  const dealtNew = room.shared !== sharedBefore || (dealing && JSON.stringify(room.shared || {}) !== textBefore);
  if ((action === 'playAgain' || action === 'tourNew' || duelNext) && wasOver && dealtNew && !roomGameIsOver(room)) {
    settlePredictions(room, boardBefore);
    room.predict = { game: room.game, until: Date.now() + PREDICT_OPEN_MS, picks: {} };
  }
  if (restartBoard && room.phase === 'lobby') settlePredictions(room, restartBoard);

  // Whoever is present when a game is dealt is in it. This can't be inferred
  // from secrets — a Codenames operative and a Just One guesser both have none.
  if ((action === 'start' || action === 'nextRound') && room.shared && !room.shared.roster) {
    room.shared.roster = room.players.map(p => p.id);
  }

  // A new deal - a start, a next round, a play again that changed anything, or
  // a game that replaced its whole state (the next trivia question) - gets a
  // fresh stamp, so a phone's "I already sent this" memory can't carry over.
  if (room.shared && typeof room.shared === 'object' &&
      (room.shared !== sharedBefore || (dealing && JSON.stringify(room.shared) !== textBefore))) {
    room.shared.dealId = newDealId();
  }

  // A round's result just shown, with «التالي لوحده» on: the count to the next one starts.
  autoNextSync(room);
  // برنامج السهرة: a game that just ended is banked, and its result given its pause.
  programSync(room);

  // Whatever changed, a computer player may be up now.
  scheduleBots(room);
};

/* ==========================================================================
   VOTING ENGINE
   --------------------------------------------------------------------------
   Shared by لو خيروك, مين أكثر واحد and فيبج. Three games, one implementation.

   The rule that makes voting work: **who** voted is public, **what** they voted
   for is not — until the round closes. Choices live in `room._ballots`, which is
   server-side scratch and never projected, so a phone cannot see the tally
   forming and change its mind accordingly.
   ========================================================================== */

/**
 * Opens a vote.
 *   options   [{ id, label, ownerId? }]  ownerId marks whose answer it is, so a
 *                                        player can be stopped from voting for
 *                                        their own (Fibbage).
 *   eligible  player ids allowed to vote; defaults to the whole roster.
 *   opts.hideOwners  when whose option is whose is itself the secret (Fibbage:
 *                    the one option nobody owns is the truth). The owners stay
 *                    in room._voteOwners, the published options carry none, and
 *                    each owner's own slice says which option is theirs
 *                    (`voteOwn`). Once the vote closes the owners are public.
 */
const openVote = (room, options, eligible, opts) => {
  room._ballots = {};
  // The last vote's owners, and every phone's note of which option was its own.
  room._voteOwners = null;
  Object.keys(room.secrets || {}).forEach(id => {
    const slice = room.secrets[id];
    if (!slice || !('voteOwn' in slice)) return;
    delete slice.voteOwn;
    if (!Object.keys(slice).length) delete room.secrets[id];
  });

  let published = options;
  if (opts && opts.hideOwners) {
    room._voteOwners = {};
    room.secrets = room.secrets || {};
    published = options.map(o => {
      const copy = Object.assign({}, o);
      if (copy.ownerId) {
        room._voteOwners[copy.id] = copy.ownerId;
        room.secrets[copy.ownerId] = Object.assign({}, room.secrets[copy.ownerId] || {}, { voteOwn: copy.id });
      }
      delete copy.ownerId;
      return copy;
    });
  }

  room.shared.vote = {
    options: published,
    eligible: eligible || room.players.map(p => p.id),
    voted: [],
    phase: 'voting',
    results: null
  };
};

/** Whose option this is, whether it was published or kept on the server. */
const voteOwnerOf = (room, option) =>
  option.ownerId || (room._voteOwners && room._voteOwners[option.id]) || null;

const castVote = (room, playerId, optionId) => {
  const v = room.shared.vote;
  if (!v || v.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
  if (v.eligible.indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');

  const option = v.options.find(o => o.id === optionId);
  if (!option) throw new Error('اختيار غير صحيح');
  if (voteOwnerOf(room, option) === playerId) {
    throw new Error('لا يمكنك التصويت لإجابتك');
  }

  room._ballots = room._ballots || {};
  room._ballots[playerId] = optionId;
  if (v.voted.indexOf(playerId) === -1) v.voted.push(playerId);

  // Close once everyone still in the room has voted. Someone whose phone died
  // must not hold the round open forever.
  const waitingOn = activeRoster(room, v.eligible);
  if (waitingOn.every(id => v.voted.indexOf(id) !== -1)) closeVote(room);
  return v.phase === 'results';
};

/** Tallies and publishes. Only now do the individual choices become visible. */
const closeVote = (room) => {
  const v = room.shared.vote;
  // Returns false when there was nothing to close, so callers don't score a
  // round twice — the host's close button can arrive after the auto-close.
  if (!v || v.phase === 'results') return false;
  const ballots = room._ballots || {};
  const nameOf = (id) => {
    const p = room.players.find(x => x.id === id);
    return p ? p.name : '';
  };

  v.results = v.options.map(o => {
    const voters = Object.keys(ballots).filter(pid => ballots[pid] === o.id);
    return {
      id: o.id,
      label: o.label,
      ownerId: voteOwnerOf(room, o),
      count: voters.length,
      voters: voters.map(nameOf)
    };
  });
  v.totalVotes = Object.keys(ballots).length;
  v.phase = 'results';
  return true;
};

/**
 * Someone left while a vote was open: their ballot goes with them, and the vote
 * closes if everyone still here has voted. True when it closed, so the game
 * can resolve it exactly as after the last ballot.
 */
const voteDropPlayer = (room, playerId) => {
  const v = room.shared && room.shared.vote;
  if (!v || v.phase !== 'voting') return false;
  if (room._ballots) delete room._ballots[playerId];
  v.voted = v.voted.filter(id => id !== playerId);
  v.eligible = v.eligible.filter(id => id !== playerId);
  if (!activeRoster(room, v.eligible).every(id => v.voted.indexOf(id) !== -1)) return false;
  return closeVote(room);
};

/** Running scoreboard, kept across rounds of the same game. */
const addScore = (room, playerId, points) => {
  room.shared.scores = room.shared.scores || {};
  room.shared.scores[playerId] = (room.shared.scores[playerId] || 0) + points;
};

const scoreboardOf = (room) =>
  room.players
    .map(p => ({ name: p.name, id: p.id, score: (room.shared.scores || {})[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

/* Is the game in the room over - its result on the screens? The audience's bar
   goes and «مين هيكسب؟» closes then, not only after PREDICT_OPEN_MS (the owner,
   26 Sep 2026). The test, roomGameIsOver, is in app/Common.js: the phones close
   the bar on the very same one. */

/** The audience's guesses, checked against the board the game ended on (the first row's
    score, ties all count). A board is best-first, and some games win low (القنبلة's strikes,
    الشايب's losses, ميني جولف's strokes, سكرو's points), so the top is the first row, never
    the biggest number - the audit of 28 Sep 2026 found «مين هيكسب؟» crowning the loser. */
function settlePredictions(room, boardOf) {
  const p = room.predict;
  room.predict = null;
  if (!p || p.game !== room.game) return;
  const voters = Object.keys(p.picks || {});
  if (!voters.length) return;
  const board = boardOf !== undefined ? (boardOf || []).filter(r => r && r.id) : nightBoardOf(room, (room.shared || {}).board, true);
  if (!board.length) return;
  const top = boardRowKey(board[0]);
  if (board.every(r => boardRowKey(r) === top)) return;   // nobody ahead of anybody
  const winners = board.filter(r => boardRowKey(r) === top).map(r => r.id);
  const nameOf = (id) => ((room.players.find(x => x.id === id) || {}).name || '');
  const rightIds = voters.filter(v => winners.indexOf(p.picks[v]) !== -1);
  const right = rightIds.map(nameOf).filter(Boolean);
  // «الشلة»'s العرّاف: a guess right counts toward the title (crewNightInput, Crew.js).
  if (rightIds.length) {
    const x = nightExtras(room);
    rightIds.forEach(id => { x.pred[id] = (x.pred[id] || 0) + 1; x.names[id] = nameOf(id) || x.names[id] || ''; });
  }
  roomEvent(room, 'predicted', { names: right.join('، '), n: voters.length });
}

/** The duel just played (winner stays, s.result in RoomDuels.js), as a board: the winner first; a draw is level. */
const duelResultBoard = (room) => {
  const r = (room.shared || {}).result || {};
  return r.winnerId ? [{ id: r.winnerId, score: 1 }].concat(r.loserId ? [{ id: r.loserId, score: 0 }] : []) : [];
};

/* --- the leaderboard of the night --------------------------------------------
   Placement points rather than each game's own score: a trivia score and a
   سكرو score are not the same currency. 5 for the first, 3 for the second, 2
   for the third and 1 for everyone else who played (the owner, 30 Sep 2026:
   the same rule as «برنامج السهرة», one rule everywhere), and tied players
   share a place - two firsts both take 5 and the next takes 2. Every game's board is already best-first (سكرو sorts
   ascending because its lowest total wins), so a row's place is where it sits.

   Banked once, when the room leaves a game for the hub: that is the only
   moment every game has in common, and it needs no end-of-game hook in each of
   them. Playing the same game again before going back counts once, on the
   board it finished on. A game nobody scored in, and a game that keeps no
   scores at all (ارسم واكتب), add nothing.
   ---------------------------------------------------------------------------- */
const NIGHT_PLACES = [5, 3, 2];
const NIGHT_PLAYED = 1;   // everyone else on the board
// Games whose shared.board is set only at a round's result: left mid-round, the night ranks
// their running scores (scoreboardOf) instead of everyone level.
const NIGHT_BOARD_FROM_SCORES = { drawguess: true, fakeartist: true };

/* Every board is the roster's (the audit of 1 Oct 2026). Many boards are built from
   room.players, so someone who joined after the deal and only watched was on them with 0:
   1 point for a game they never played, and in القنبلة (fewest strikes first) a first
   place. The night, «مين هيكسب؟» and the program read a board through these. */

/** Who played the game in the room: a tournament's entrants, else the seats, else the team lists,
    else its roster - the first of them the game keeps (someone benched from a table's seats is on
    the roster and only watched); null when it keeps none. */
const nightPlayedIds = (room) => {
  const s = room.shared || {};
  const flat = (x) => (Array.isArray(x) ? x.reduce((a, y) => a.concat(flat(y)), []) : (typeof x === 'string' ? [x] : []));
  let ids = null;
  if (s.tour && Array.isArray(s.tour.entrants) && s.tour.entrants.length) ids = s.tour.entrants;
  // Winner stays (the duels' seats): everyone who sat this session, not only the pair seated now.
  else if (Array.isArray(s.sat) && s.sat.length) ids = s.sat;
  // إستميشن's computer player in a leaver's seat (s.standIns): the leaver played, the bot didn't.
  else if (Array.isArray(s.seats) && flat(s.seats).length) ids = flat(s.seats).map(id => (s.standIns && s.standIns[id]) || id);
  else if (Array.isArray(s.teams) && flat(s.teams).length) ids = flat(s.teams);
  // أسماء الرموز keeps its sides as { pid: { team, role } }: someone on neither side only watched.
  else if (s.teams && typeof s.teams === 'object' && !Array.isArray(s.teams) && Object.keys(s.teams).length) ids = Object.keys(s.teams);
  else if (Array.isArray(s.roster) && s.roster.length) ids = s.roster;
  return ids ? ids.filter((id, i) => id && ids.indexOf(id) === i) : null;
};

/* A game whose own board is the evening's tally of wins at its table (لودو, السلم, بنك الحظ,
   كدّاب, الشايب, جمجمة) gives the result of the game just played here: rows best first, or null
   before its end (the review of 1 Oct 2026). Each game's file registers its own.
   «مين هيكسب؟» is settled on it (the guess was about that game, not the evening); the night and
   the program bank it for the games in NIGHT_FROM_RESULT, whose tally board tied everyone but the
   winner (6 players banked 5/3/3/3/3/3; in الشايب every non-loser 5). لودو, السلم and بنك الحظ
   bank their tally board, its level wins told apart by this game's places (`tie`). */
const ROOM_RESULT_BOARDS = {};
const NIGHT_FROM_RESULT = { doubt: true, oldmaid: true, skull: true };

/* A way of a game the owner put on no table at all (الخزنة's endless levels: "co-op, nothing on
   the night's board"): no places, so neither the night nor the program banks it. */
const NIGHT_NO_PLACES = {
  vault: (room) => (((room.shared || {}).settings || {}).win || 'levels') !== 'set'
};

/** Result rows from places: `groups` best first, each a list of ids sharing one place (an id
    already placed in an earlier group is left out of a later one, so the last group can be "the
    rest of the table"); the score is the place counted from the bottom, so boardRowKey ranks it. */
const roomResultRows = (room, groups) => {
  const seen = [];
  const kept = groups.map(g => (g || []).filter(id => {
    if (!id || seen.indexOf(id) !== -1) return false;
    seen.push(id);
    return true;
  })).filter(g => g.length);
  return kept.reduce((all, g, k) => all.concat(g.map(id => ({ id, name: roomPlayerName(room, id), score: kept.length - k }))), []);
};

/** A row's standing: its score, and what breaks a tie in it (`tie`: this game's place under the
    evening's wins - الكراسي, the bumper cars, لودو, السلم, بنك الحظ). Two rows share a place only
    when both match. */
const boardRowKey = (r) => (Number(r && r.score) || 0) + '|' + (r && r.tie !== undefined && r.tie !== null ? r.tie : '');

/** The game's board as the night counts it: best-first, only the people who played, every row
    with a score. A team game whose board is something else (أسماء الرموز: the cards) is its sides,
    the winners first (PROGRAM_TEAMS, as the program places it). `result`: the game just played
    where the game keeps one (ROOM_RESULT_BOARDS), as «مين هيكسب؟» reads it. */
const nightBoardOf = (room, board, result) => {
  const g = room.game;
  const own = g && ROOM_RESULT_BOARDS[g] && (NIGHT_FROM_RESULT[g] || result);
  let rows = (own ? (ROOM_RESULT_BOARDS[g](room) || []) : (board || [])).filter(r => r && r.id);
  if (!rows.length && g && PROGRAM_TEAMS[g]) {
    const teams = PROGRAM_TEAMS[g](room);
    if (teams && teams.length > 1) {
      rows = teams.reduce((all, ids, k) => all.concat(ids.map(id => ({ id, name: roomPlayerName(room, id), score: teams.length - k }))), []);
    }
  }
  const played = nightPlayedIds(room);
  return played ? rows.filter(r => played.indexOf(r.id) !== -1) : rows;
};

/**
 * The places of the game in the room: { coop, rows: [{ id, place }] } for everyone who played
 * (computer players included). The one source of truth for the room's night (bankNightPoints) and
 * برنامج السهرة (programBank), so the two never disagree (the review of 1 Oct 2026):
 * - a co-op game (PROGRAM_COOP) puts everyone who played first (5 each, no first places counted);
 * - a team game puts its winning side first and the other second;
 * - else the board, best first, tied rows sharing a place (competition ranking: 5, 5, 2), and
 *   anyone who played but isn't on it after everyone on it;
 * - nobody ahead of anybody: a game played to its end is everyone first; one cut short
 *   (`cut`) is everyone "played" (place 99: 1 point) - nobody won anything yet.
 */
const nightPlacesOf = (room, board, cut) => {
  const game = room.game;
  const p = room.program || {};
  // Who played: what the game keeps, else who was in the program's game, else the room (a board
  // banked with no game in the room - the secret mission's - is its own list of who played).
  // A program's people only for the program's game: the mission ends with no game in the room.
  const played = nightPlayedIds(room) || (game && Array.isArray(p.present) ? p.present.slice()
    : (game ? (room.players || []).map(x => x.id) : (board || []).filter(r => r && r.id).map(r => r.id)));
  if (game && NIGHT_NO_PLACES[game] && NIGHT_NO_PLACES[game](room)) return { coop: true, rows: [] };
  if (game && PROGRAM_COOP[game]) return { coop: true, rows: played.map(id => ({ id, place: 1 })) };
  const teams = game && PROGRAM_TEAMS[game] && PROGRAM_TEAMS[game](room);
  if (teams) {
    const rows = [];
    teams.forEach((group, k) => group.forEach(id => { if (!rows.some(r => r.id === id)) rows.push({ id, place: k + 1 }); }));
    played.forEach(id => { if (!rows.some(r => r.id === id)) rows.push({ id, place: teams.length + 1 }); });
    return { coop: teams.length < 2, rows };
  }
  const on = nightBoardOf(room, board).filter(r => played.indexOf(r.id) !== -1);
  const keys = on.map(boardRowKey);
  if (!on.length || keys.every(k => k === keys[0])) {
    // Someone who played is off the board (a leaver: most boards drop them): a game played to its
    // end ranks the board first and them after, still as played - a forfeit used to bank the
    // leaver the winner's 5 (U1, the owner, 8 Oct 2026). One cut short stays everyone "played".
    const off = played.filter(id => !on.some(r => r.id === id));
    if (on.length && !cut && off.some(id => !(room.players || []).some(x => x.id === id))) {
      return { coop: false, rows: on.map(r => ({ id: r.id, place: 1 })).concat(off.map(id => ({ id, place: on.length + 1 }))) };
    }
    return { coop: true, rows: played.map(id => ({ id, place: cut ? 99 : 1 })) };
  }
  const rows = on.map((r, i) => ({ id: r.id, place: 1 + keys.indexOf(keys[i]) }));
  played.forEach(id => { if (!rows.some(r => r.id === id)) rows.push({ id, place: on.length + 1 }); });
  return { coop: false, rows };
};

const nightPointsFor = (place) => NIGHT_PLACES[place - 1] || NIGHT_PLAYED;

/**
 * Banks the game in the room on the night's table. Inside برنامج السهرة it banks exactly what the
 * program banked for this game (its places), and nothing for a game the program didn't count (the
 * host ending the program mid-game). Elsewhere the same places (nightPlacesOf), a game left before
 * its end counted as cut short. A game chosen and never dealt adds nothing; and with no game in the
 * room (the secret mission's own rows) a board with nobody ahead of anybody adds nothing.
 */
const bankNightPoints = (room, board) => {
  // Chosen and never dealt: in the lobby, no roster stamped (every start stamps one) and nobody scored.
  if (room.game && room.phase === 'lobby' && !(room.shared || {}).roster &&
      !(board || []).some(r => r && r.id && (Number(r.score) || 0) !== 0)) return false;
  const prog = room.program;
  const cur = room.game && prog && prog.phase !== 'final' ? programCurrent(room) : null;
  let res;
  if (cur && cur.id === room.game) {
    const done = prog.banked === prog.at ? prog.done[prog.done.length - 1] : null;
    if (!done || done.id !== room.game || !done.places.length) return false;
    res = { coop: !!done.coop, rows: done.places.map(x => ({ id: x.id, place: x.place })) };
  } else {
    if (!room.game) {
      const keys = (board || []).filter(r => r && r.id).map(boardRowKey);
      if (keys.every(k => k === keys[0])) return false;
    }
    res = nightPlacesOf(room, board, !roomGameIsOver(room));
    if (res.rows.length < 2) return false;
  }
  room.night = room.night || {};
  const x = nightExtras(room);
  let banked = false;
  res.rows.forEach(row => {
    const points = nightPointsFor(row.place);
    room.night[row.id] = (room.night[row.id] || 0) + points;
    // Beside the points, for «الشلة» (Crew.js, crewNightInput): the name (kept for someone who
    // leaves), a first place in this game (the titles), and a computer player to leave out.
    const who = (room.players || []).find(p => p.id === row.id);
    const onBoard = (board || []).find(r => r && r.id === row.id);
    x.names[row.id] = (who && who.name) || (onBoard && onBoard.name) || x.names[row.id] || '';
    if (who && who.bot && x.bots.indexOf(row.id) === -1) x.bots.push(row.id);
    if (row.place === 1 && !res.coop && room.game) x.wins = x.wins.concat([{ id: row.id, g: room.game }]).slice(-60);
    banked = true;
  });
  if (banked && room.game) {
    x.games = x.games.concat([room.game]).slice(-40);
    // A record score (the top row, a game where higher is better) and the rooms' own titles' tallies.
    const s = room.shared || {};
    const rows = nightBoardOf(room, board);
    if (CREW_RECORD_GAMES.indexOf(room.game) !== -1 && rows[0] && Number(rows[0].score) > 0) {
      x.best = x.best.concat([{ id: rows[0].id, g: room.game, s: Number(rows[0].score) }]).slice(-20);
    }
    Object.keys(CREW_TALLY_TITLE).forEach(k => {
      const t = s[k];
      if (t && t.id && t.n > 0) {
        x.tally = x.tally.concat([{ id: t.id, k: k, n: t.n }]).slice(-20);
        x.names[t.id] = x.names[t.id] || t.name || '';
      }
    });
  }
  return banked;
};

/** What the night keeps beside its points, for «الشلة» (never sent to a phone: view.js). */
const nightExtras = (room) => {
  const x = room.nightx = room.nightx || {};
  x.names = x.names || {}; x.wins = x.wins || []; x.games = x.games || [];
  x.best = x.best || []; x.tally = x.tally || []; x.pred = x.pred || {}; x.bots = x.bots || [];
  return x;
};

/**
 * Pulls a prompt that hasn't been dealt lately, reshuffling once a pool is exhausted.
 *
 * The history is kept per pool: indices into the Would You Rather list mean
 * nothing in the Most Likely To list, and sharing one list made switching games
 * skip prompts that had never been shown.
 */
/*
 * What has been dealt is remembered across all rooms, not per room: a room only
 * lasts an evening, and its history used to go with it, so the next evening's
 * room started every list from the top again. The calls below are Apps Script's
 * Script Properties; rooms-worker/build.mjs points them at the PromptMemory
 * Durable Object. Each list is stored as "length|i,j,k": once a list is edited
 * its length changes and it starts over, rather than trusting indices that now
 * point at different prompts.
 */
const SEEN_PROPERTY_PREFIX = 'seen_';

const readSeen = (key, size) => {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(SEEN_PROPERTY_PREFIX + key);
    if (!raw) return null;
    const bar = raw.indexOf('|');
    if (Number(raw.slice(0, bar)) !== size) return [];
    const rest = raw.slice(bar + 1);
    return rest ? rest.split(',').map(Number) : [];
  } catch (e) {
    return null;   // Properties unavailable: the room's own memory still works
  }
};

const writeSeen = (key, size, used) => {
  try {
    PropertiesService.getScriptProperties().setProperty(SEEN_PROPERTY_PREFIX + key, size + '|' + used.join(','));
  } catch (e) {}
};

/**
 * Deals `count` prompts from `pool` that haven't been dealt lately, starting the
 * list over once all of it has been used. One read and one write however many
 * are dealt, since each Properties call is a round trip.
 */
const nextPrompts = (room, pool, poolKey, count, accept) => {
  const key = poolKey || ('pool' + pool.length);
  room._used = room._used || {};
  // Older rooms may hold an array from before this was keyed.
  if (Array.isArray(room._used)) room._used = {};

  let used = readSeen(key, pool.length) || room._used[key] || [];
  const picks = [];
  const want = Math.min(count, pool.length);
  // `accept(item)` (optional): deal from these first - one category of
  // trivia's questions - in the same memory as the whole list. Once the
  // category has all been dealt lately its own cycle starts over; once all of
  // it is in this very deal, the rest of the list fills the deal.
  const ok = accept ? pool.map(item => !!accept(item)) : null;
  for (let n = 0; n < want; n++) {
    // Starting the list over keeps the latest deals out a while longer (up to half the list, never
    // so many that this deal can't be filled): the memory is every room's, and starting from empty
    // let the next room's board repeat words the room before had just been dealt (7 Oct 2026).
    if (used.length >= pool.length) used = used.slice(used.length - Math.max(0, Math.min(Math.floor(pool.length / 2), pool.length - want)));
    let taken = {};
    used.forEach(i => { taken[i] = true; });
    picks.forEach(i => { taken[i] = true; });
    if (ok && !pool.some((_, i) => ok[i] && !taken[i]) && pool.some((_, i) => ok[i] && picks.indexOf(i) === -1)) {
      used = used.filter(i => !ok[i] || picks.indexOf(i) !== -1);
      taken = {};
      used.forEach(i => { taken[i] = true; });
      picks.forEach(i => { taken[i] = true; });
    }
    let open = [];
    if (ok) for (let i = 0; i < pool.length; i++) if (ok[i] && !taken[i]) open.push(i);
    if (!open.length) for (let i = 0; i < pool.length; i++) if (!taken[i]) open.push(i);
    if (!open.length && ok) for (let i = 0; i < pool.length; i++) if (picks.indexOf(i) === -1) open.push(i);
    const idx = open.length ? open[Math.floor(Math.random() * open.length)] : Math.floor(Math.random() * pool.length);
    picks.push(idx);
    used.push(idx);
  }
  room._used[key] = used;
  writeSeen(key, pool.length, used);
  return picks.map(i => pool[i]);
};

/** A single prompt; see nextPrompts. */
const nextPrompt = (room, pool, poolKey) => nextPrompts(room, pool, poolKey, 1)[0];

/** Roster members who are still in the room — used for "has everyone answered?". */
const activeRoster = (room, roster) => {
  const present = room.players.map(p => p.id);
  return (roster || present).filter(id => present.indexOf(id) !== -1);
};

/* ==========================================================================
   التالي لوحده — NEXT BY ITSELF (the next batch, 30 Sep 2026)
   --------------------------------------------------------------------------
   The older room games wait for the host's «التالي» after every result. With
   the host's lobby switch on (room._autoNext, off by default), a result shown
   sets shared.nextAt: long enough to enjoy it (its staged reveal counted in),
   and when it passes the server deals the next round exactly as the host's
   «التالي» would - the same action through applyRoomAction, so the stale-tap
   guards, the deal id and the prompt memory (room.js loads it for this
   timeout, roomTimeoutDeals) all hold. The last round goes to the end, never
   to a new game. «⏸ استنى» (autoPause, a move-on action) clears nextAt for
   this round; «التالي» by hand still works any time. Off: no field is added.

   shared.nextAt  when the next round deals itself (the server's time), or null
                  once paused; nextMs the whole pause (the draining bar);
                  nextFor the result it was set for; nextPaused after «استنى».
   ========================================================================== */
// The pause after each result, its reveal counted in: the trivia answer is told
// over ~3.7 s (triviaRevealPlan), a vote's bars ~3 s (voteRevealTimes),
// فيبج's cards one by one (fibRevealPlan).
// About 7-8 s after each reveal ends (the owner, 8 Oct 2026: felt slow).
const AUTONEXT_TRIVIA_MS = 8000;    // 10000 -> 8000 (the owner, 8 Oct 2026: felt slow)
const AUTONEXT_VOTE_MS = 9000;      // 12000 -> 9000 (the owner, 8 Oct 2026: felt slow)
const AUTONEXT_HERD_MS = 9000;      // 12000 -> 9000 (the owner, 8 Oct 2026: felt slow)
const AUTONEXT_TT_MS = 10000;       // 13000 -> 10000 (the owner, 8 Oct 2026: felt slow)
const AUTONEXT_HUM_MS = 8000;       // 10000 -> 8000 (the owner, 8 Oct 2026: felt slow)
// فيبج: the lies turn over 0.9 s apart, then the truth (+1.5 s), the board (+1 s): ~3.7 s + 0.9 s a lie.
// 9000 + 3700 -> 5300 + 3700 (the owner, 8 Oct 2026: felt slow): 9 s, plus 0.9 s a lie after the first.
const AUTONEXT_FIB_MS = (s) => {
  const lies = ((s.vote || {}).results || []).length - 1;
  return 5300 + 3700 + 900 * Math.max(0, lies - 1);
};
const AUTONEXT_GAMES = {
  trivia:     { action: 'nextQuestion', deals: false, ms: AUTONEXT_TRIVIA_MS, ready: (s) => s.phase === 'results', key: (s) => 'q' + s.qIndex, args: (s) => ({ qIndex: s.qIndex }) },
  wouldyou:   { action: 'nextRound', deals: true, ms: AUTONEXT_VOTE_MS, ready: (s) => !!(s.vote && s.vote.phase === 'results'), key: (s) => 'r' + s.round, args: (s) => ({ lang: s.lang, round: s.round }) },
  mostlikely: { action: 'nextRound', deals: true, ms: AUTONEXT_VOTE_MS, ready: (s) => s.phase === 'results', key: (s) => 'r' + s.round, args: (s) => ({ lang: s.lang, round: s.round }) },
  fibbage:    { action: 'nextRound', deals: true, ms: AUTONEXT_FIB_MS, ready: (s) => s.phase === 'results', key: (s) => 'r' + s.round, args: (s) => ({ lang: s.lang, round: s.round }) },
  herd:       { action: 'nextRound', deals: true, ms: AUTONEXT_HERD_MS, ready: (s) => s.phase === 'result', key: (s) => 'r' + s.round, args: (s) => ({ round: s.round }) },
  twotruths:  { action: 'next', deals: false, ms: AUTONEXT_TT_MS, ready: (s) => s.phase === 'result', key: (s) => 't' + s.turn, args: (s) => ({ turn: s.turn }) },
  // دندنها (RoomHum.js): the banner, the front row and the points take about 3 s; the songs were dealt at the start.
  hum:        { action: 'nextRound', deals: false, ms: AUTONEXT_HUM_MS, ready: (s) => s.phase === 'reveal', key: (s) => 'r' + s.round + '.' + s.deal, args: (s) => ({ round: s.round }) }
};

/** Starts the count once per result, or takes it away once the result is gone (or the switch is off). */
const autoNextSync = (room) => {
  const cfg = AUTONEXT_GAMES[room.game];
  const s = room.shared;
  if (!cfg || !s || typeof s !== 'object' || room.phase === 'lobby') return;
  if (!room._autoNext || !cfg.ready(s)) {
    ['nextAt', 'nextMs', 'nextFor', 'nextPaused'].forEach(k => { if (k in s) delete s[k]; });
    return;
  }
  const key = cfg.key(s);
  if (s.nextFor === key) return;   // set (or paused) for this result already
  const ms = typeof cfg.ms === 'function' ? cfg.ms(s) : cfg.ms;
  s.nextFor = key;
  s.nextAt = Date.now() + ms;
  s.nextMs = ms;
  s.nextPaused = false;
};

/** When the next round deals itself, or null. */
const autoNextDeadline = (room) => {
  const cfg = AUTONEXT_GAMES[room.game];
  const s = room.shared;
  if (!cfg || !room._autoNext || !s || typeof s.nextAt !== 'number' || !cfg.ready(s)) return null;
  return s.nextAt;
};

/** True when the timeout due now deals prompts: room.js loads the shared prompt memory for it. */
const roomTimeoutDeals = (room, now) => {
  // برنامج السهرة deals the next game from its clock: the game may deal from a list.
  if (programTimeoutDeals(room, now)) return true;
  const at = autoNextDeadline(room);
  return at !== null && now >= at && AUTONEXT_GAMES[room.game].deals;
};

/**
 * The count ran out: the host's «التالي», through the same door. A move the
 * rules refuse (too few left to deal a round) stops the count instead of
 * trying again for ever; the host's button decides then.
 */
const autoNextFire = (room) => {
  const cfg = AUTONEXT_GAMES[room.game];
  const s = room.shared;
  const trial = structuredClone(room);
  try {
    applyRoomAction(trial, room.hostId, cfg.action, cfg.args(s));
  } catch (err) {
    s.nextAt = null;
    s.nextPaused = true;
    return true;
  }
  Object.keys(room).forEach(k => { delete room[k]; });
  Object.assign(room, trial);
  // A move that did nothing must not leave its deadline in the past.
  const again = autoNextDeadline(room);
  if (again !== null && again <= Date.now()) { room.shared.nextAt = null; room.shared.nextPaused = true; }
  return true;
};

/** «⏸ استنى»: a move-on action, aimed at the result it was pressed on. */
const autoNextPause = (room, playerId, payload) => {
  if (!AUTONEXT_GAMES[room.game]) throw new Error('إجراء غير معروف');
  requireMoveOn(room, playerId);
  const s = room.shared || {};
  if (staleTap(payload, 'key', s.nextFor)) return;
  if (typeof s.nextAt !== 'number') return;
  s.nextAt = null;
  s.nextPaused = true;
};

/* ==========================================================================
   CLOCKS THE SERVER KEEPS
   --------------------------------------------------------------------------
   A timed round has to end even when no phone is awake to end it. The room
   server asks roomDeadline when to look at a room again, and calls
   roomTimeout at that moment. Phones still end rounds on time themselves;
   this is the backstop, a moment later.
   ========================================================================== */
const DRAW_TIMEOUT_GRACE_MS = 1500;

/**
 * When this room next needs the server to act on its own, or null: a game's
 * own clock, or a computer player's next move, whichever comes first.
 */
const roomDeadline = (room) => {
  // برنامج السهرة's pauses (a result, the standings) come before any game's clock.
  const prog = programDeadline(room);
  if (prog !== null) return typeof room._botAt === 'number' ? Math.min(prog, room._botAt) : prog;
  const game = gameDeadline(room);
  const bot = typeof room._botAt === 'number' ? room._botAt : null;
  if (game === null) return bot;
  return bot === null ? game : Math.min(game, bot);
};

/** A game's own clock: the round, the turn, the vote that has to end on time. */
const gameDeadline = (room) => {
  const s = room.shared || {};
  // A knockout tournament of a duel: every match's clock, and the next match's start (RoomTournament.js).
  if (isTourRoom(room)) return tourDeadline(room);
  // «التالي لوحده»: the next round deals itself at nextAt.
  const autoAt = autoNextDeadline(room);
  if (autoAt !== null) return autoAt;
  // A game that registered itself (ROOM_RULES): its own clock.
  if (ROOM_RULES[room.game]) return ROOM_RULES[room.game].deadline ? ROOM_RULES[room.game].deadline(room) : null;
  if (room.game === 'trivia' && s.phase === 'answering' && s.endsAt) {
    return s.endsAt + TRIVIA_GRACE_MS;
  }
  if (room.game === 'drawguess' && room.phase === 'drawing' && !s.word && s.endsAt) {
    return s.endsAt + DRAW_TIMEOUT_GRACE_MS;
  }
  if (room.game === 'codenames' && room.phase === 'playing' && !s.winner && s.endsAt) {
    return s.endsAt + CODENAMES_GRACE_MS;
  }
  if (room.game === 'spyfall' && s.phase === 'play' && s.endsAt) return s.endsAt + SPYFALL_GRACE_MS;
  if (room.game === 'imposter' && room.phase === 'discuss' && s.endsAt) return s.endsAt + IMPOSTER_GRACE_MS;
  if (room.game === 'bomb' && s.phase === 'ticking' && room._bombEndsAt) {
    const total = room._bombEndsAt - room._bombStart;
    const heat = s.heat || 0;
    const steps = bombHeatAt(room);
    return heat < steps.length ? room._bombStart + total * steps[heat] : room._bombEndsAt;
  }
  if (room.game === 'stop' && s.phase === 'writing' && s.endsAt) return s.endsAt + STOP_GRACE_MS;
  if (room.game === 'stop' && s.phase === 'collecting' && s.collectEndsAt) return s.collectEndsAt + STOP_GRACE_MS;
  if (QUIZ_GAMES[room.game] && s.phase === 'answering' && s.endsAt) return quizDeadline(room);
  if (room.game === 'fiveseconds' && s.phase === 'counting' && s.endsAt) return s.endsAt + FIVE_GRACE_MS;
  if (room.game === 'telephone' && s.phase === 'working' && s.endsAt) return s.endsAt + TELE_GRACE_MS;
  if (room.game === 'telephone' && s.phase === 'collecting' && s.collectEndsAt) return s.collectEndsAt + TELE_GRACE_MS;
  if (room.game === 'monkey' && s.phase === 'play' && s.endsAt && !s.timedOut) return s.endsAt + MONKEY_GRACE_MS;
  if (room.game === 'mafia' && (s.phase === 'night' || s.phase === 'day') && s.endsAt) return s.endsAt + MAFIA_GRACE_MS;
  if (room.game === 'screw' && (s.phase === 'memorize' || s.phase === 'play' || s.phase === 'thiefGuess') && s.endsAt) return s.endsAt + SKREW_GRACE_MS;
  if (room.game === 'uno') return unoDeadline(room);
  // «خسران غياب»: the seat to move gone a minute (RoomDuels.js).
  // كونكت ٤ in teams: the member up has 20 seconds (RoomDuels.js).
  if (room.game === 'connect4' && s.teamMode) return c4tDeadline(room);
  if (room.game === 'connect4' || room.game === 'dots' || room.game === 'xo') return duelAwayDeadline(room);
  if (room.game === 'domino') return dominoDeadline(room);
  if (room.game === 'ludo') return ludoDeadline(room);
  if (room.game === 'snakes') return snakesDeadline(room);
  if (room.game === 'bank') return bankDeadline(room);
  if (room.game === 'guesswho') return gwDeadline(room);
  if (room.game === 'battleship') return bsDeadline(room);
  if (room.game === 'chess') return chessDeadline(room);
  if (room.game === 'votechess') return vcDeadline(room);
  if (room.game === 'handbrain') return hbDeadline(room);
  if (room.game === 'bughouse') return bughouseDeadline(room);
  if (room.game === 'chess4') return chess4Deadline(room);
  if (room.game === 'hangman') return hmDeadline(room);
  if (room.game === 'bowling') return bowlDeadline(room);
  if (room.game === 'doubt') return doubtDeadline(room);
  if (room.game === 'oldmaid') return omDeadline(room);
  if (room.game === 'skull') return skullDeadline(room);
  if (room.game === 'estimation') return estDeadline(room);
  if (room.game === 'minigolf') return mgDeadline(room);
  if (room.game === 'chairs') return chairsDeadline(room);
  if (room.game === 'reaction') return reactionDeadline(room);
  if (room.game === 'witness') return witnessDeadline(room);
  if (room.game === 'wire') return wireDeadline(room);
  if (room.game === 'vault') return vaultDeadline(room);
  if (room.game === 'box') return boxDeadline(room);
  if (room.game === 'exact') return exactDeadline(room);
  if (room.game === 'hear') return hearDeadline(room);
  if (room.game === 'hum') return humDeadline(room);
  if (room.game === 'bumper') return bumperDeadline(room);
  if (room.game === 'darkroom') return darkDeadline(room);
  if (svKindOf(room)) return svDeadline(room);   // RoomSolve.js
  return null;
};

/** Acts on a deadline that has passed. True when the room changed. */
const roomTimeout = (room, now) => {
  let changed = false;
  // برنامج السهرة: a result that gives way to the standings, the standings to the next game.
  if (programTimeout(room, now)) return true;
  if (typeof room._botAt === 'number' && now >= room._botAt) {
    changed = runRoomBot(room);
    // A game whose computer players move faster than the room's alarm can wake (ALARM_FLOOR_MS in
    // room.js: a second) plays the next few in this same pass (`burst`: شطرنج الأربعة once only
    // computer players are left - their 250 ms was really a second, the audit of 1 Oct 2026).
    const hook = () => room.game && ROOM_BOT_GAMES[room.game];
    for (let k = 0; k < 3 && hook() && hook().burst && typeof room._botAt === 'number' && room._botAt - Date.now() < ROOM_BOT_BURST_MS; k++) runRoomBot(room);
  }
  const due = gameDeadline(room);
  if (due && now >= due && gameTimeout(room, now)) {
    changed = true;
    // A question the clock closed shows its result: with «التالي لوحده» on, the count starts.
    autoNextSync(room);
    // A game the clock ended, in a program: banked.
    programSync(room);
    // A turn the clock ended may have handed the move to a bot.
    scheduleBots(room);
  }
  return changed;
};

/** A game's own clock ran out. True when the room changed. */
const gameTimeout = (room, now) => {
  const due = gameDeadline(room);
  if (!due || now < due) return false;
  // The engine first: فوازير إيموجي on it must not reach the quiz's clock below (RoomSolve.js).
  if (svKindOf(room)) return svTimeout(room, now);
  if (isTourRoom(room)) return tourTimeout(room, now);
  const autoAt = autoNextDeadline(room);
  if (autoAt !== null && now >= autoAt) return autoNextFire(room);
  if (ROOM_RULES[room.game]) return ROOM_RULES[room.game].timeout ? !!ROOM_RULES[room.game].timeout(room, now) : false;
  if (room.game === 'trivia') {
    closeTriviaQuestion(room);
    return true;
  }
  if (room.game === 'drawguess') return revealDrawWord(room);
  if (room.game === 'codenames') {
    // No clue, or no guesses, in time: the other team is up.
    endCodenamesTurn(room);
    return true;
  }
  if (room.game === 'spyfall') {
    // Time's up: the table has to vote now.
    if (room.shared.phase !== 'play') return false;
    openSpyfallVote(room);
    return true;
  }
  if (room.game === 'imposter') {
    // The discussion's limit ran out: the vote opens by itself.
    if (room.phase !== 'discuss') return false;
    openImposterVote(room);
    return true;
  }
  if (room.game === 'bomb') {
    const s = room.shared;
    if (s.phase !== 'ticking') return false;
    if (now >= room._bombEndsAt) { explodeBomb(room); return true; }
    const total = room._bombEndsAt - room._bombStart;
    let bumped = false;
    const steps = bombHeatAt(room);
    while ((s.heat || 0) < steps.length && now >= room._bombStart + total * steps[s.heat || 0]) {
      s.heat = (s.heat || 0) + 1;
      bumped = true;
    }
    return bumped;
  }
  if (room.game === 'stop') {
    const s = room.shared;
    if (s.phase === 'writing') {
      // Time's up: give the phones a moment to send what they have.
      s.phase = 'collecting';
      s.collectEndsAt = now + STOP_COLLECT_MS;
      return true;
    }
    if (s.phase === 'collecting') { scoreStopRound(room); return true; }
    return false;
  }
  if (QUIZ_GAMES[room.game]) return quizTimeout(room, now);
  if (room.game === 'fiveseconds') {
    if (room.shared.phase !== 'counting') return false;
    room.shared.phase = 'judging';
    return true;
  }
  if (room.game === 'telephone') {
    const s = room.shared;
    if (s.phase === 'working') {
      // Time's up: give the phones a moment to send what they have.
      s.phase = 'collecting';
      s.collectEndsAt = now + TELE_COLLECT_MS;
      return true;
    }
    if (s.phase === 'collecting') { finishTelephoneStep(room); return true; }
    return false;
  }
  if (room.game === 'monkey') {
    const s = room.shared;
    if (s.phase !== 'play' || !s.endsAt || s.timedOut) return false;
    if (s.autoPenalty) {
      // Time's up: a quarter to the player up, and on to the next.
      monkeyQuarter(room, s.turnId);
      s.verdict = { kind: 'timeout', loser: s.turnName, loserId: s.turnId };
      if (s.mode === 'letters') s.letters = [];
      if (!monkeyCheckEnd(room)) advanceMonkey(room, s.turn);
    } else {
      s.timedOut = true;      // the host decides from the phones
    }
    return true;
  }
  if (room.game === 'mafia') {
    // The night's clock: whoever hasn't tapped doesn't act. The day's: the vote opens.
    const s = room.shared;
    if (s.phase === 'night') { mafiaEndNight(room); return true; }
    if (s.phase === 'day') { mafiaOpenVote(room); return true; }
    return false;
  }
  if (room.game === 'screw') {
    // The memorize clock ran out: play starts. A turn's (or the vote's) clock: the same as the host's skip.
    if (!room._screw) return false;
    return screwApply(room, () => {
      if (room.shared.phase !== 'memorize') return screwSkip(room);
      screwBeginPlay(room);
      return true;
    });
  }
  if (room.game === 'uno') return unoTimeout(room, now);
  if (room.game === 'connect4' && (room.shared || {}).teamMode) return c4tTimeout(room, now);
  if (room.game === 'connect4' || room.game === 'dots' || room.game === 'xo') return duelAwayTimeout(room, now);
  if (room.game === 'domino') return dominoTimeout(room, now);
  if (room.game === 'ludo') return ludoTimeout(room, now);
  if (room.game === 'snakes') return snakesTimeout(room, now);
  if (room.game === 'bank') return bankTimeout(room, now);
  if (room.game === 'guesswho') return gwTimeout(room, now);
  if (room.game === 'battleship') return bsTimeout(room, now);
  if (room.game === 'chess') return chessTimeout(room, now);
  if (room.game === 'votechess') return vcTimeout(room, now);
  if (room.game === 'handbrain') return hbTimeout(room, now);
  if (room.game === 'bughouse') return bughouseTimeout(room, now);
  if (room.game === 'chess4') return chess4Timeout(room, now);
  if (room.game === 'hangman') return hmTimeout(room, now);
  if (room.game === 'bowling') return bowlTimeout(room, now);
  if (room.game === 'doubt') return doubtTimeout(room, now);
  if (room.game === 'oldmaid') return omTimeout(room, now);
  if (room.game === 'skull') return skullTimeout(room, now);
  if (room.game === 'estimation') return estTimeout(room, now);
  if (room.game === 'minigolf') return mgTimeout(room, now);
  if (room.game === 'chairs') return chairsTimeout(room, now);
  if (room.game === 'reaction') return reactionTimeout(room, now);
  if (room.game === 'witness') return witnessTimeout(room, now);
  if (room.game === 'wire') return wireTimeout(room, now);
  if (room.game === 'vault') return vaultTimeout(room, now);
  if (room.game === 'box') return boxTimeout(room, now);
  if (room.game === 'exact') return exactTimeout(room, now);
  if (room.game === 'hear') return hearTimeout(room, now);
  if (room.game === 'hum') return humTimeout(room, now);
  if (room.game === 'bumper') return bumperTimeout(room, now);
  if (room.game === 'darkroom') return darkTimeout(room, now);
  return false;
};

/* ==========================================================================
   WHEN SOMEONE LEAVES
   --------------------------------------------------------------------------
   The room server calls roomPlayerLeft once a player has left, or the host
   has removed one whose phone is gone: they are already out of room.players
   and their secret is deleted. Each game lets go of them at once instead of
   waiting on someone who will never answer - the round moves on when they
   were the last one it waited for, a turn or a bomb they held passes, a vote
   they hadn't cast closes, a guess only they could make is settled the way
   the host's skip would settle it. `name` is theirs, since the room no
   longer knows it.

   The server runs it on a copy and keeps the room as it was if it throws, so
   leaving always works.
   ========================================================================== */
const roomPlayerLeft = (room, playerId, name) => {
  gamePlayerLeft(room, playerId, name);
  // A vote a leaver closed shows its result: the count to the next round starts.
  autoNextSync(room);
  // A game a leaver ended, in a program: banked (the leaver keeps their row on the night's table).
  programPlayerLeft(room, playerId, name);
  // The turn they held may have moved on to a computer player.
  scheduleBots(room);
};

const gamePlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!room.game || !s || typeof s !== 'object') return;
  const here = (id) => room.players.some(p => p.id === id);
  const allIn = (list) => activeRoster(room, s.roster).every(id => (list || []).indexOf(id) !== -1);
  // Their ballot goes with them; true when the vote is now complete and closed.
  const voteClosed = () => voteDropPlayer(room, playerId);

  if (room.game === 'codenames') {
    // Their place on a side is free again: a spymaster's slot can be taken in
    // the lobby, or handed on by the host mid-game (setSpymaster).
    if (s.teams) delete s.teams[playerId];
    Object.keys(s.marks || {}).forEach(idx => {
      const left = s.marks[idx].filter(x => x !== playerId);
      if (left.length) s.marks[idx] = left; else delete s.marks[idx];
    });
    return;
  }
  if (room.phase === 'lobby') {
    // The lobby's seats are the room's (shared.lobby): a leaver comes off them
    // now, so every phone's lobby shows who is really here.
    if (room.game === 'votechess') vcPlayerLeft(room, playerId);
    else if (room.game === 'handbrain') hbPlayerLeft(room, playerId, name);
    return;
  }
  // A tournament: their match is lost by forfeit, and so is any they would have played (RoomTournament.js).
  if (isTourRoom(room)) { tourPlayerLeft(room, playerId); return; }

  // Every impostor gone before a vote caught them: the round has nothing left to
  // find, so it ends as the host's reveal would - the answer shown, nobody scores.
  const impostorsGone = (ids) => (ids || []).length > 0 && !(ids || []).some(here);

  switch (room.game) {
    case 'imposter':
      if ((room.phase === 'reveal' || room.phase === 'discuss' || room.phase === 'voting') && impostorsGone(room._impSpies)) {
        s.impostorLeft = true;
        finishImposter(room, 'revealed', null);
        // Named from here: they are no longer in the room for the result's line to look up.
        room.shared.impostorLeftName = name || '';
        return;
      }
      if (room.phase === 'voting' && voteClosed()) resolveImposterVote(room);
      if (room.phase === 'guess' && !here(s.guesserId)) finishImposter(room, 'caught', null);
      // The one who was to ask first has gone before the questions got going: someone else starts.
      if ((room.phase === 'reveal' || room.phase === 'discuss') && s.firstId && !here(s.firstId)) imposterPickFirst(room);
      // «مين يسأل مين؟»: the asker gone, the next pair is named; the target gone, the same asker
      // asks someone else (audit 7 Oct 2026, E2).
      if (room.phase === 'discuss' && s.dir) {
        if (s.dir.askerId && !here(s.dir.askerId)) imposterDirNext(room, null);
        else if (s.dir.targetId && !here(s.dir.targetId)) imposterDirNext(room, s.dir.askerId);
      }
      return;
    case 'chameleon':
      if (s.phase !== 'guess' && s.phase !== 'results' && impostorsGone([room._chamId])) {
        s.impostorLeft = true;
        finishChameleon(room, 'revealed', null);
        // Named from here: they are no longer in the room for the result's line to look up.
        room.shared.impostorLeftName = name || '';
        return;
      }
      if (s.phase === 'voting' && voteClosed()) resolveChameleonVote(room);
      if (s.phase === 'guess' && !here(room._chamId)) finishChameleon(room, 'caught', null);
      return;
    case 'spyfall':
      if (s.phase !== 'guess' && s.phase !== 'results' && impostorsGone(room._spyIds)) {
        s.impostorLeft = true;
        finishSpyfall(room, 'revealed', null, null);
        // Named from here: they are no longer in the room for the result's line to look up.
        room.shared.impostorLeftName = name || '';
        return;
      }
      if (s.phase === 'voting' && voteClosed()) resolveSpyfallVote(room);
      if (s.phase === 'guess' && !here(s.guesserId)) finishSpyfall(room, 'caught', null, s.guesserId);
      // The one who was to ask first has gone: someone still here starts, as in الجاسوس.
      if (s.phase === 'play' && s.firstId && !here(s.firstId)) {
        const left = (s.roster || []).filter(here);
        s.firstId = left.length ? left[Math.floor(Math.random() * left.length)] : null;
      }
      return;
    case 'justone':
      // Without the guesser there is no round: the word is shown, no point.
      if ((s.phase === 'writing' || s.phase === 'guessing') && !here(s.guesserId)) skipJustOneRound(room);
      else if (s.phase === 'writing' && justOneAllWritten(room)) revealJustOneClues(room);
      return;
    case 'whoami':
      if (room.phase === 'playing' && allIn(s.guessed)) revealWhoAmI(room);
      return;
    case 'wouldyou':
      voteClosed();
      return;
    case 'mostlikely':
      if (voteClosed()) scoreMostLikely(room);
      return;
    case 'fibbage':
      if (s.phase === 'writing' && allIn(s.submitted)) openFibbageVote(room);
      else if (s.phase === 'voting' && voteClosed()) scoreFibbage(room);
      return;
    case 'drawguess':
      if (room.phase === 'drawing' && !s.word && !here(s.drawerId)) revealDrawWord(room);
      return;
    case 'fakeartist':
      // The fake gone before the vote named them: the round ends as the others' did - the
      // word and the fake shown, nobody scores (finishFakeArtist scores no 'revealed').
      if ((s.phase === 'drawing' || s.phase === 'voting') && impostorsGone([room._fakeId])) {
        s.impostorLeft = true;
        s.fakeId = room._fakeId;
        s.fakeCaught = false;
        s.fakeName = name || '';   // for the line's {name}: they are no longer in the room
        finishFakeArtist(room, 'revealed');
        return;
      }
      if (s.phase === 'drawing' && !here(s.currentDrawerId)) advanceFakeArtistTurn(room);
      else if (s.phase === 'voting' && voteClosed()) revealFakeArtist(room);
      if (s.phase === 'guessing' && !here(room._fakeId)) finishFakeArtist(room, 'artists');
      return;
    case 'trivia':
      if (s.phase === 'answering' && allIn(s.answered)) closeTriviaQuestion(room);
      return;
    case 'emoji':
    case 'proverbs':
      if (svKindOf(room)) { svPlayerLeft(room, playerId); return; }   // a written riddle, or the race (RoomSolve.js)
      if (s.phase === 'answering' && activeRoster(room, s.roster).every(id => (room._answers || {})[id])) closeQuizCard(room);
      return;
    case 'buzzer':
      if (Array.isArray(s.buzzes)) s.buzzes = s.buzzes.filter(b => b.id !== playerId);
      // The room may have a new host: a quiz's answer goes to their phone.
      if (s.quiz) buzzerQuizSync(room);
      return;
    case 'chairs':
      chairsPlayerLeft(room, playerId, name);
      return;
    case 'reaction':
      reactionPlayerLeft(room, playerId);
      return;
    case 'witness':
      witnessPlayerLeft(room, playerId);
      return;
    case 'wire':
      wirePlayerLeft(room, playerId);
      return;
    case 'vault':
      vaultPlayerLeft(room, playerId);
      return;
    case 'box':
      boxPlayerLeft(room, playerId);
      return;
    case 'exact':
      exactPlayerLeft(room, playerId);
      return;
    case 'hear':
      hearPlayerLeft(room, playerId);
      return;
    case 'hum':
      humPlayerLeft(room, playerId);
      return;
    case 'bumper':
      bumperPlayerLeft(room, playerId);
      return;
    case 'darkroom':
      darkPlayerLeft(room, playerId);
      return;
    case 'stop':
      if ((s.phase === 'writing' || s.phase === 'collecting') && allIn(s.submitted)) scoreStopRound(room);
      return;
    case 'bomb':
      if (s.phase !== 'ticking') return;
      if (s.fromId === playerId) s.fromId = null;
      if (!here(s.holderId)) {
        // The bomb goes on to the next in the seating order after whoever held it.
        const order = s.order || [];
        const at = order.indexOf(s.holderId);
        for (let k = 1; k <= order.length; k++) {
          const id = order[(at + k + order.length) % order.length];
          if (here(id)) { s.holderId = id; s.holderName = roomPlayerName(room, id); s.fromId = null; break; }
        }
      }
      return;
    case 'twotruths':
      if (s.phase === 'writing' && allIn(s.submitted)) {
        if (s.submitted.some(here)) { s.order = shuffled(s.submitted.filter(here)); nextTwoTruthsTurn(room); }
      } else if (s.phase === 'voting') {
        if (!here(s.subjectId)) nextTwoTruthsTurn(room);
        else if (voteClosed()) resolveTwoTruths(room);
      }
      return;
    case 'fiveseconds':
      if ((s.phase === 'ready' || s.phase === 'counting' || s.phase === 'judging') && !here(s.turnId)) advanceFive(room);
      return;
    case 'telephone':
      if ((s.phase === 'working' || s.phase === 'collecting') && allIn(s.submitted)) finishTelephoneStep(room);
      return;
    case 'monkey':
      monkeyPlayerLeft(room, playerId);
      return;
    case 'herd':
      if (s.sheepId === playerId) { s.sheepId = null; s.sheepName = ''; }
      if (s.phase === 'pick' && s.picker === playerId) herdPick(room, -1);   // 710: the picker left, the app picks
      if (s.phase === 'writing' && allIn(s.submitted)) revealHerd(room);
      else if (s.phase === 'reveal') s.groups = herdPresentGroups(room, s.groups);
      return;
    case 'mafia':
      mafiaPlayerLeft(room, playerId, name);
      return;
    case 'screw':
      screwPlayerLeft(room, playerId);
      return;
    case 'mind':
      mindPlayerLeft(room, playerId);
      return;
    case 'timeline':
      timelinePlayerLeft(room, playerId);
      return;
    case 'uno':
      unoPlayerLeft(room, playerId, name);
      return;
    case 'domino':
      dominoPlayerLeft(room, playerId, name);
      return;
    case 'ludo':
      ludoPlayerLeft(room, playerId, name);
      return;
    case 'snakes':
      snakesPlayerLeft(room, playerId, name);
      return;
    case 'bank':
      bankPlayerLeft(room, playerId, name);
      return;
    case 'guesswho':
      // A seated player loses by forfeit, as in the duels (RoomGuessWho.js).
      gwPlayerLeft(room, playerId);
      return;
    case 'battleship':
      // A seated player loses by forfeit, as in the duels (RoomBattleship.js).
      bsPlayerLeft(room, playerId);
      return;
    case 'chess':
      // A seated player loses by forfeit, as in the duels (RoomChess.js).
      chessPlayerLeft(room, playerId);
      return;
    case 'votechess':
      // Out of the count; a team with nobody left loses (RoomVoteChess.js).
      vcPlayerLeft(room, playerId);
      return;
    case 'handbrain':
      // A computer player takes the seat for the rest of the game (RoomHandBrain.js).
      hbPlayerLeft(room, playerId, name);
      return;
    case 'bughouse':
      // A computer player takes their board for the rest of the game (RoomBughouse.js).
      bughousePlayerLeft(room, playerId, name);
      return;
    case 'chess4':
      // FFA: out, their pieces grey walls; teams: a computer player takes the seat (RoomChess4.js).
      chess4PlayerLeft(room, playerId, name);
      return;
    case 'hangman':
      hmPlayerLeft(room, playerId);
      return;
    case 'wordle':
    case 'guessnum':
    case 'flags':
    case 'strands': case 'wordwheel': case 'connections': case 'pinpoint': case 'queens':
    case 'tango': case 'nonogram': case 'mines': case 'streak': case 'sudoku':
      svPlayerLeft(room, playerId);   // RoomSolve.js (and the race, RoomRace.js)
      return;
    case 'minigolf':
      // Their ball leaves the hole; the turn and the hole move on without them (RoomMiniGolf.js).
      mgPlayerLeft(room, playerId);
      return;
    case 'bowling':
      bowlPlayerLeft(room, playerId);
      return;
    case 'doubt':
      doubtPlayerLeft(room, playerId);
      return;
    case 'oldmaid':
      omPlayerLeft(room, playerId);
      return;
    case 'skull':
      // Their discs and pile leave the table; a bet of theirs is called off (RoomSkull.js).
      skullPlayerLeft(room, playerId);
      return;
    case 'estimation':
      // A hard computer player takes the seat, hand and points for the rest of the game (RoomEstimation.js).
      estPlayerLeft(room, playerId, name);
      return;
    case 'connect4':
    case 'dots':
    case 'xo':
      // A seated player loses by forfeit; the next in line sits down (RoomDuels.js).
      duelPlayerLeft(room, playerId);
      return;
    default:
      if (ROOM_RULES[room.game] && ROOM_RULES[room.game].left) ROOM_RULES[room.game].left(room, playerId, name);
      return;
  }
};

/** ربع قرد: out of the order, and the turn goes on from where they sat. */
const monkeyPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (s.phase !== 'play' || !Array.isArray(s.order)) return;
  const at = s.order.indexOf(playerId);
  if (at === -1) return;
  const wasUp = s.turnId === playerId;
  s.order = s.order.filter(id => id !== playerId);
  if (s.quarters) delete s.quarters[playerId];
  // The last letter was theirs: «كذاب» on it would hand a quarter to nobody, so the word starts over.
  const lastLetter = Array.isArray(s.letters) && s.letters[s.letters.length - 1];
  if (lastLetter && lastLetter.by === playerId) s.letters = [];
  // A verdict about them can't move a quarter to, or from, someone who isn't here.
  if (s.verdict && (s.verdict.loserId === playerId || s.verdict.otherId === playerId)) s.verdict.canFlip = false;
  s.board = monkeyBoard(room);
  if (monkeyCheckEnd(room)) return;
  const n = s.order.length;
  const up = s.order.indexOf(s.turnId);
  if (wasUp || up === -1) advanceMonkey(room, ((wasUp ? at : 0) - 1 + n) % n);
  else s.turn = up;
};

/** مافيا: out of the game (shown as left), then the same checks as after a night or a vote. */
const mafiaPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!room._mafia || !Array.isArray(s.alive) || s.phase === 'gameover') return;
  if (s.alive.indexOf(playerId) !== -1) {
    s.alive = s.alive.filter(x => x !== playerId);
    s.out = (s.out || []).concat([{ id: playerId, name: name || '', role: mafiaShownRole(room, playerId), night: s.phase === 'night', left: true }]);
  }
  if (mafiaCheckEnd(room)) return;
  // Their tap no longer counts toward the night's «N / alive» (it showed 6/6 with one still to tap).
  if (room._mafiaActed) {
    room._mafiaActed = room._mafiaActed.filter(id => id !== playerId);
    s.actedN = room._mafiaActed.length;
  }
  if (s.phase === 'night' && mafiaAlive(room).every(id => (room._mafiaActed || []).indexOf(id) !== -1)) { mafiaEndNight(room); return; }
  // The day vote: someone who left is no longer a choice, and whoever voted for them votes again
  // (their ballot would be wasted, and the result would say the table sent nobody out).
  if (s.phase === 'voting' && s.vote && s.vote.phase === 'voting') {
    s.vote.options = s.vote.options.filter(o => o.id !== playerId);
    const b = room._ballots || {};
    Object.keys(b).forEach(pid => { if (b[pid] === playerId) { delete b[pid]; s.vote.voted = s.vote.voted.filter(x => x !== pid); } });
  }
  if (s.phase === 'voting' && voteDropPlayer(room, playerId)) { mafiaResolveVote(room); return; }
  mafiaWriteSecrets(room);
};
