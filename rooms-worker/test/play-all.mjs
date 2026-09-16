/**
 * Plays every room game with robot players against a rooms server, and checks
 * the things that matter: turns, votes, scores, that secrets never reach the
 * wrong phone, live updates, reconnects, leaving, the server's own clocks, and
 * the prompt memory shared between rooms.
 *
 *   node test/play-all.mjs                         # local: npx wrangler dev
 *   node test/play-all.mjs https://ashry-rooms.rooms-worker.workers.dev
 *
 * Needs Node 22+ (built-in fetch and WebSocket). Takes about half a minute,
 * most of it waiting for a trivia question to time out on the server.
 */
const BASE = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');
const WS_BASE = BASE.replace(/^http/, 'ws');

let passed = 0;
const failures = [];
const check = (ok, label) => {
  if (ok) passed++;
  else { failures.push(label); console.log('  ✗ ' + label); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (path, body) => {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(body)
  });
  return res.json();
};

class Bot {
  constructor(name) {
    this.name = name;
    this.state = null;
    this.live = [];
    this.pending = new Map();
    this.nextId = 1;
    this.watchers = new Set();
    this.patchMisses = 0;
    this.closedWith = null;
  }

  static async host(name, game, screen = false) {
    const bot = new Bot(name);
    const res = await api('/create', { name, game, screen });
    if (!res.ok) throw new Error('create failed: ' + res.error);
    Object.assign(bot, { code: res.state.code, pid: res.playerId, key: res.key, state: res.state });
    await bot.connect();
    return bot;
  }

  static async join(code, name, screen = false) {
    const bot = new Bot(name);
    const res = await api('/join', { code, name, screen });
    if (!res.ok) throw new Error('join failed: ' + res.error);
    Object.assign(bot, { code, pid: res.playerId, key: res.key, state: res.state });
    await bot.connect();
    return bot;
  }

  connect(key = this.key) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${WS_BASE}/ws?code=${this.code}&pid=${this.pid}&key=${key}`);
      this.ws = ws;
      const timer = setTimeout(() => reject(new Error(this.name + ' connect timeout')), 8000);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.t === 'state') { this.state = msg.state; clearTimeout(timer); resolve(this); }
        else if (msg.t === 'strokes') this.applyStrokes(msg);
        else if (msg.t === 'ack') {
          if (msg.patch) this.applyStrokes(msg.patch);
          else if (msg.state) this.state = msg.state;
          const waiter = this.pending.get(msg.id);
          if (waiter) { this.pending.delete(msg.id); waiter(msg); }
        } else if (msg.t === 'live') this.live.push(msg.d);
        else if (msg.t === 'gone' || msg.t === 'kicked' || msg.t === 'left') {
          this.closedWith = msg.t; clearTimeout(timer); resolve(this);
        }
        this.watchers.forEach((fn) => fn());
      };
      ws.onerror = () => {};
      ws.onclose = () => { clearTimeout(timer); resolve(this); };
    });
  }

  applyStrokes(patch) {
    const s = this.state;
    if (s && s.version === patch.from && s.shared && Array.isArray(s.shared.strokes)) {
      s.shared.strokes.push(...patch.add);
      s.version = patch.v;
    } else {
      this.patchMisses++;
      this.ws.send(JSON.stringify({ t: 'sync' }));
    }
  }

  act(action, payload = {}) {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.ws.send(JSON.stringify({ t: 'act', id, action, payload }));
      setTimeout(() => { if (this.pending.delete(id)) resolve({ ok: false, error: 'ack timeout' }); }, 8000);
    });
  }

  async must(action, payload) {
    const res = await this.act(action, payload);
    if (!res.ok) throw new Error(`${this.name} ${action}: ${res.error}`);
    return res;
  }

  waitFor(pred, label, ms = 5000) {
    return new Promise((resolve) => {
      const test = () => {
        let ok = false;
        try { ok = !!(this.state && pred(this.state)); } catch (e) {}
        if (ok) { done(true); return true; }
        return false;
      };
      const done = (ok) => { clearTimeout(timer); this.watchers.delete(test); check(ok, `${label} (${this.name})`); resolve(ok); };
      const timer = setTimeout(() => done(false), ms);
      if (!test()) this.watchers.add(test);
    });
  }

  close() { try { this.ws.close(); } catch (e) {} }
}

const all = (bots, pred, label, ms) => Promise.all(bots.map((b) => b.waitFor(pred, label, ms)));
const byId = (bots, id) => bots.find((b) => b.pid === id);
const leaks = (bot, text) => JSON.stringify(bot.state).indexOf(text) !== -1;

async function main() {
  console.log('rooms server:', BASE);
  const t0 = Date.now();

  /* --- room basics ------------------------------------------------------- */
  console.log('• room: create, join, presence, keys');
  const A = await Bot.host('أحمد', null);
  const B = await Bot.join(A.code, 'سارة');
  const C = await Bot.join(A.code, 'Omar');
  const D = await Bot.join(A.code, 'منى');
  const bots = [A, B, C, D];
  await all(bots, (s) => s.players.length === 4 && s.players.every((p) => p.online), 'everyone sees 4 players online');
  check(A.state.youAreHost && !B.state.youAreHost, 'only the creator is host');

  // The line on the together tab: this room is in the count, and nothing that
  // identifies it is. The Worker holds the count for up to 15 seconds.
  let live = null;
  for (const until = Date.now() + 20000; Date.now() < until;) {
    live = await fetch(BASE + '/live').then((r) => r.json()).catch(() => null);
    if (live && live.ok && live.players >= 4 && live.rooms >= 1) break;
    await sleep(1000);
  }
  check(live && live.ok && live.players >= 4 && live.rooms >= 1, 'the live count includes the four players in this room');
  check(live && !JSON.stringify(live).includes(A.code) && !JSON.stringify(live).includes(A.name), 'the live count names no room and no player');

  const taken = await api('/join', { code: A.code, name: 'omar' });
  check(!taken.ok && /مستخدم/.test(taken.error), 'a taken name is refused');
  const missing = await api('/join', { code: 'ZZZZ', name: 'x' });
  check(!missing.ok && missing.error === 'ROOM_NOT_FOUND', 'unknown room code is refused');

  const forged = await api('/act', { code: A.code, pid: B.pid, key: 'wrong', action: 'chooseGame', payload: { game: 'trivia' } });
  check(!forged.ok && forged.kicked, 'a move with the wrong key is refused');
  const spy = new Bot('spy'); Object.assign(spy, { code: A.code, pid: B.pid });
  await spy.connect('wrong');
  check(spy.closedWith === 'kicked', "connecting as someone else without their key is refused");

  const notHost = await B.act('chooseGame', { game: 'imposter' });
  check(!notHost.ok, 'only the host can choose a game');

  /* --- presence and reconnect -------------------------------------------- */
  B.close();
  await A.waitFor((s) => s.players.find((p) => p.id === B.pid).online === false, 'a closed phone shows as away');
  await B.connect();
  await A.waitFor((s) => s.players.find((p) => p.id === B.pid).online === true, 'a reconnected phone shows as here');

  const poll = await api('/poll', { code: A.code, pid: C.pid, key: C.key, v: C.state.version });
  check(poll.ok && (poll.same || poll.state), 'HTTP fallback poll answers');
  const httpAct = await api('/act', { code: A.code, pid: A.pid, key: A.key, action: 'chooseGame', payload: { game: 'imposter' } });
  check(httpAct.ok && httpAct.state.game === 'imposter', 'a move over HTTP works');

  /* --- the chat ------------------------------------------------------------------- */
  console.log('• chat');
  await A.must('chat', { text: 'أهلا يا جماعة' });
  await all(bots, (s) => s.chat && s.chat.length === 1 && s.chat[0].text === 'أهلا يا جماعة' && s.chat[0].name === A.name, 'a message reaches every phone with its sender');
  await B.must('chat', { text: 'x'.repeat(300) });
  await all(bots, (s) => s.chat.length === 2 && s.chat[1].text.length === 200, 'a message is cut at 200 characters');
  check((await C.act('chat', { text: '   ' })).ok === false, 'an empty message is refused');
  let refused = false;
  for (let i = 0; i < 6; i++) { const r = await D.act('chat', { text: 'spam ' + i }); if (!r.ok) refused = true; }
  check(refused, 'the sixth message in five seconds is refused');

  /* --- الجاسوس ------------------------------------------------------------ */
  console.log('• imposter');
  await all(bots, (s) => s.game === 'imposter', 'imposter chosen');
  await A.must('start', { category: 'حيوانات', spies: 1 });
  await all(bots, (s) => s.phase === 'reveal' && s.you, 'imposter dealt');
  const spies = bots.filter((b) => b.state.you.role === 'spy');
  const players = bots.filter((b) => b.state.you.role === 'player');
  check(spies.length === 1 && players.length === 3, 'one spy, three players');
  const word = players[0].state.you.word;
  check(players.every((b) => b.state.you.word === word) && word, 'players share the word');
  check(!leaks(spies[0], word), "the spy's phone never receives the word");
  check((await A.act('start', { category: 'حيوانات' })).ok === false, 'a second start is refused');
  await A.must('beginDiscussion');
  await A.must('startVote');
  await all(bots, (s) => s.phase === 'voting', 'the host opens the vote on the imposter');
  const theSpyBot = spies[0];
  check((await theSpyBot.act('vote', { option: theSpyBot.pid })).ok === false, 'you cannot accuse yourself');
  for (const b of bots) await b.must('vote', { option: b === theSpyBot ? players[0].pid : theSpyBot.pid });
  await all(bots, (s) => s.phase === 'guess' && s.shared.guesserId === theSpyBot.pid && s.shared.options.length === 6 && s.shared.options.indexOf(word) !== -1,
    'a caught imposter gets six words to pick from');
  check(!('secretWord' in theSpyBot.state.shared), 'the word is still not published while the spy guesses');
  await theSpyBot.must('guess', { word: theSpyBot.state.shared.options.find((w) => w !== word) });
  await all(bots, (s) => s.phase === 'result' && s.shared.outcome === 'caught' && s.shared.secretWord === word && s.shared.scores[players[0].pid] === 1,
    'a wrong guess: the players score and the word is shown');
  await A.must('restart');
  await all(bots, (s) => s.phase === 'lobby' && s.shared.scores && s.shared.scores[players[0].pid] === 1, 'restart keeps the scores');
  await A.must('backToHub');

  /* --- كلمة واحدة ----------------------------------------------------------- */
  console.log('• just one');
  await A.must('chooseGame', { game: 'justone' });
  await A.must('start', {});
  await all(bots, (s) => s.phase === 'writing', 'just one dealt');
  const guesser = byId(bots, A.state.shared.guesserId);
  const writers = bots.filter((b) => b !== guesser);
  check(guesser.state.you.word === null && writers.every((b) => b.state.you.word), 'only the guesser lacks the word');
  const secretJO = writers[0].state.you.word;
  check(!leaks(guesser, secretJO), "the guesser's phone never receives the word");
  await writers[0].must('submitClue', { clue: 'قطة' });
  await writers[1].must('submitClue', { clue: 'قطه' });
  await writers[2].must('submitClue', { clue: 'بيت' });
  await all(bots, (s) => s.phase === 'guessing', 'just one moves to guessing');
  check(A.state.shared.removedCount === 2, 'duplicate clues are removed (قطة = قطه)');
  await guesser.must('submitGuess', { guess: secretJO });
  await A.must('judge', { correct: true });
  await all(bots, (s) => s.phase === 'result' && s.shared.score === 1, 'just one scores');
  await A.must('backToHub');

  /* --- من أنا؟ -------------------------------------------------------------- */
  console.log('• who am i');
  await A.must('chooseGame', { game: 'whoami' });
  await A.must('start', { words: ['أسد', 'قمر', 'بحر', 'نار', 'شمس'] });
  await all(bots, (s) => s.phase === 'playing', 'who am i dealt');
  check(bots.every((b) => b.state.you.others.length === 3), 'each phone sees the other three');
  await B.must('gotIt');
  await C.must('gotIt');
  await all(bots, (s) => s.shared.guessed.length === 2 && s.shared.scores[B.pid] === 3 && s.shared.scores[C.pid] === 2, 'the first to get it scores 3, the second 2');
  await B.must('gotIt');
  check(B.state.shared.scores[B.pid] === 3, 'a second press changes nothing');
  await D.must('gotIt');
  await all(bots, (s) => s.shared.scores[D.pid] === 1, 'the third to press scores 1');
  await D.must('notYet');
  await all(bots, (s) => s.shared.guessed.indexOf(D.pid) === -1 && !s.shared.scores[D.pid] && s.shared.scores[B.pid] === 3,
    'taking back "I know who I am" returns its points, and nobody has lost theirs');
  await A.must('reveal');
  await all(bots, (s) => s.phase === 'result' && s.shared.all.length === 4 && s.shared.all.find((x) => x.id === B.pid).got === 1, 'who am i reveal shows who got it in what order');
  await A.must('backToHub');

  /* --- أسماء الرموز --------------------------------------------------------- */
  console.log('• codenames');
  await A.must('chooseGame', { game: 'codenames' });
  check((await B.act('setOptions', { timer: 60 })).ok === false, 'only the host sets the codenames options');
  await A.must('setOptions', { timer: 60, rotate: true, custom: 'بابا\nماما، تيتا, بابا' });
  check(A.state.shared.settings.timer === 60 && A.state.shared.settings.custom.join('|') === 'بابا|ماما|تيتا',
        'own words are split, trimmed and counted once');
  await A.must('shuffleTeams');
  const dealtSides = Object.values(A.state.shared.teams);
  check(dealtSides.length === 4 && dealtSides.filter((t) => t.role === 'spymaster').length === 2,
        'shuffling puts everyone on a side, with a spymaster each');
  for (const b of bots) await b.must('setTeam', { team: b === A || b === B ? 'red' : 'blue', role: 'operative' });
  await A.must('setTeam', { team: 'red', role: 'spymaster' });
  await C.must('setTeam', { team: 'blue', role: 'spymaster' });
  check((await D.act('setTeam', { team: 'blue', role: 'spymaster' })).ok === false, 'a second spymaster per team is refused');
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.phase === 'playing' && s.shared.board.length === 25, 'codenames board dealt');
  check(['بابا', 'ماما', 'تيتا'].every((w) => A.state.shared.board.some((c) => c.word === w)), "the room's own words are on the board");
  // The list's words only: the room's own ones never go through the shared memory.
  const firstBoard = A.state.shared.board.map((c) => c.word).filter((w) => ['بابا', 'ماما', 'تيتا'].indexOf(w) === -1);
  check(typeof A.state.shared.endsAt === 'number', 'the clue clock is running');
  check(A.state.you.key.length === 25 && C.state.you.key.length === 25, 'spymasters get the key');
  check(B.state.you === null && D.state.you === null && !leaks(B, 'assassin') && !leaks(D, 'assassin'), "operatives' phones never receive the key");

  const turn = A.state.shared.turn;
  const master = turn === 'red' ? A : C;
  const operative = turn === 'red' ? B : D;
  const otherMaster = turn === 'red' ? C : A;
  const otherOperative = turn === 'red' ? D : B;

  const swapAt = A.state.shared.board.findIndex((c) => ['بابا', 'ماما', 'تيتا'].indexOf(c.word) === -1);
  const oldWord = A.state.shared.board[swapAt].word;
  check((await operative.act('swapWord', { index: swapAt })).ok === false, 'an operative cannot swap a word');
  await A.must('swapWord', { index: swapAt });
  await all(bots, (s) => s.shared.board[swapAt].word !== oldWord, 'the host swaps a word before the first clue');

  const boardWord = master.state.shared.board[0].word;
  check((await master.act('giveClue', { word: ' ' + boardWord + ' ', count: 1 })).ok === false, 'a word on the board is refused as a clue');
  await master.must('giveClue', { word: 'xyzclue', count: 'inf' });
  await all(bots, (s) => s.shared.clue && s.shared.guessesLeft === -1, 'an ∞ clue leaves the guesses open');
  check((await A.act('swapWord', { index: swapAt })).ok === false, 'no swapping once a clue is given');

  const mine = master.state.you.key.findIndex((colour) => colour === turn);
  check((await master.act('mark', { index: mine })).ok === false, 'a spymaster cannot mark cards');
  await operative.must('mark', { index: mine, on: true });
  await all(bots, (s) => (s.shared.marks[mine] || []).indexOf(operative.pid) !== -1, 'a mark reaches every phone');
  await operative.must('guess', { index: mine });
  await all(bots, (s) => s.shared.board[mine].revealed && !s.shared.marks[mine] &&
    s.shared.remaining[turn] === (turn === s.shared.startingTeam ? 8 : 7), 'a right guess is revealed, counted and unmarked');
  await operative.must('endTurn');
  await all(bots, (s) => s.shared.turn !== turn, 'ending the turn passes it');

  await otherMaster.must('giveClue', { word: 'abcclue', count: 1 });
  const assassin = otherMaster.state.you.key.indexOf('assassin');
  await otherOperative.must('guess', { index: assassin });
  await all(bots, (s) => s.shared.winner === turn && s.shared.endReason === 'assassin' && s.shared.wins[turn] === 1,
            'the assassin loses the game and the win is counted');
  check(B.state.shared.board.every((c) => c.colour), 'the whole key is shown once the game is over');

  await A.must('restart');
  await all(bots, (s) => s.phase === 'lobby' && s.shared.wins[turn] === 1 && s.shared.settings.timer === 60 &&
    s.shared.teams[B.pid].role === 'spymaster' && s.shared.teams[D.pid].role === 'spymaster',
    'play again keeps the score and the options, and rotates the spymasters');
  await A.must('backToHub');
  await A.must('chooseGame', { game: 'codenames' });
  await all(bots, (s) => s.shared.wins && s.shared.wins[turn] === 1, 'the score survives a trip to the hub');
  await A.must('backToHub');

  /* --- big screens --------------------------------------------------------- */
  console.log('• tv screen');
  const TV = await Bot.join(A.code, '', true);
  await all([A, TV], (s) => s.screens.length === 1 && s.players.length === 4, 'a screen joins without taking a player slot');
  check(TV.state.youAreScreen === true && TV.state.you === null && A.state.youAreScreen === false, 'the screen knows it is one');
  await A.must('chooseGame', { game: 'codenames' });
  check((await TV.act('setTeam', { team: 'red', role: 'operative' })).ok === false, 'a screen cannot join a team');
  await A.must('start', { lang: 'en' });
  await all([A, TV], (s) => s.phase === 'playing', 'codenames starts with a screen in the room');
  check(TV.state.you === null && !leaks(TV, 'assassin'), 'the screen never receives the key');
  const tvTurn = TV.state.shared.turn;
  const tvMaster = bots.find((b) => (b.state.shared.teams[b.pid] || {}).team === tvTurn && b.state.shared.teams[b.pid].role === 'spymaster');
  await tvMaster.must('giveClue', { word: 'screenclue', count: 1 });
  const tvPick = tvMaster.state.you.key.findIndex((colour) => colour === tvTurn);
  await TV.must('guess', { index: tvPick });
  await all([A, TV], (s) => s.shared.board[tvPick].revealed, 'the team can guess from the big screen');
  await A.must('backToHub');
  check((await TV.act('chooseGame', { game: 'trivia' })).ok === false, 'a screen that is not the host cannot pick a game');

  await D.must('becomeScreen');
  await A.waitFor((s) => s.players.length === 3 && s.screens.length === 2, 'a phone becomes a screen in the lobby');
  check((await D.act('becomePlayer', { name: 'سارة' })).ok === false, 'a taken name is refused when a screen becomes a player');
  await D.must('becomePlayer', { name: 'منى' });
  await A.waitFor((s) => s.players.length === 4 && s.screens.length === 1, 'and back into a player');
  TV.close();
  await api('/leave', { code: A.code, pid: TV.pid, key: TV.key });
  await A.waitFor((s) => s.screens.length === 0, 'a screen that leaves is removed');

  const S = await Bot.host('', null, true);
  check(S.state.youAreScreen && S.state.youAreHost && S.state.players.length === 0, 'a screen can open a room and host it');
  const P1 = await Bot.join(S.code, 'لاعب ١');
  const P2 = await Bot.join(S.code, 'لاعب ٢');
  await S.must('chooseGame', { game: 'trivia' });
  await S.must('start', { lang: 'ar', count: 5 });
  await all([S, P1, P2], (s) => s.shared.phase === 'answering' && s.shared.roster.length === 2, 'the screen deals trivia to the phones only');
  check((await S.act('answer', { choice: 0 })).ok === false, 'the screen cannot answer');
  await P1.must('answer', { choice: 0 });
  await P2.must('answer', { choice: 1 });
  await S.waitFor((s) => s.shared.phase === 'results', 'the question closes once both phones answer');
  await S.must('nextQuestion');
  await all([S, P1, P2], (s) => s.shared.qIndex === 1, 'the screen moves everyone to the next question');
  [S, P1, P2].forEach((b) => b.close());

  /* --- voting games ------------------------------------------------------ */
  console.log('• would you rather, most likely, fibbage');
  await A.must('chooseGame', { game: 'wouldyou' });
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.shared.vote && s.shared.vote.phase === 'voting', 'would you rather opens a vote');
  for (const b of bots) await b.must('vote', { option: b === A ? 'a' : 'b' });
  await all(bots, (s) => s.shared.vote.phase === 'results' && s.shared.vote.results[1].count === 3, 'would you rather closes by itself and counts');
  await A.must('backToHub');

  await A.must('chooseGame', { game: 'mostlikely' });
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.shared.vote && s.shared.vote.phase === 'voting', 'most likely opens a vote');
  for (const b of bots) await b.must('vote', { option: B.pid });
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.scores[B.pid] === 1, 'most likely scores the pick');
  await A.must('backToHub');

  await A.must('chooseGame', { game: 'fibbage' });
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.phase === 'writing', 'fibbage asks for lies');
  check(!bots.some((b) => b.state.shared.truth), 'fibbage truth stays on the server');
  const lies = ['كذبة أولى', 'كذبة تانية', 'كذبة تالتة', 'كذبة رابعة'];
  for (let i = 0; i < 4; i++) await bots[i].must('submitLie', { lie: lies[i] });
  await all(bots, (s) => s.phase === 'voting', 'fibbage moves to voting');
  check((await A.act('vote', { option: 'l_' + A.pid })).ok === false, 'you cannot vote for your own lie');
  await A.must('vote', { option: 'truth' });
  await B.must('vote', { option: 'l_' + A.pid });
  await C.must('vote', { option: 'truth' });
  await D.must('vote', { option: 'truth' });
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.scores[A.pid] === 1500, 'fibbage scores truth + fooling');
  await A.must('backToHub');

  /* --- الجرس ----------------------------------------------------------------- */
  console.log('• buzzer');
  await A.must('chooseGame', { game: 'buzzer' });
  await A.must('start', {});
  await all(bots, (s) => s.shared.phase === 'armed' && s.shared.round === 1, 'buzzer arms on start');
  await C.must('buzz');
  await B.must('buzz');
  await D.must('buzz');
  await all(bots, (s) => s.shared.buzzes.length === 3 && s.shared.buzzes[0].id === C.pid && s.shared.buzzes[1].id === B.pid && s.shared.buzzes[2].id === D.pid,
    'buzzes keep their arrival order');
  await C.must('buzz');
  check(C.state.shared.buzzes.length === 3, 'a second press by the same player is ignored');
  check((await B.act('correct')).ok === false, 'only the host judges an answer');
  await A.must('wrong');
  await all(bots, (s) => s.shared.buzzes[0].id === B.pid && s.shared.last && s.shared.last.ok === false && s.shared.last.id === C.pid,
    'a wrong answer passes the question to the next in line');
  await A.must('correct');
  await all(bots, (s) => s.shared.scores[B.pid] === 1 && s.shared.buzzes.length === 0 && s.shared.round === 2 && s.shared.board[0].id === B.pid,
    'a right answer scores, clears the line and moves on');
  await A.must('lock');
  await all(bots, (s) => s.shared.phase === 'locked', 'the host can lock the buzzers');
  await D.must('buzz');
  check(D.state.shared.buzzes.length === 0, 'a press while locked is ignored');
  await A.must('arm');
  await all(bots, (s) => s.shared.phase === 'armed', 'and open them again');
  await A.must('adjust', { id: D.pid, delta: 2 });
  await all(bots, (s) => s.shared.scores[D.pid] === 2 && s.shared.board[0].id === D.pid, 'the host can adjust a score by hand');
  await A.must('playAgain');
  await all(bots, (s) => s.shared.round === 1 && !s.shared.scores[B.pid] && !s.shared.scores[D.pid], 'play again clears the scores');
  await A.must('backToHub');

  /* --- أتوبيس كومبليت --------------------------------------------------------- */
  console.log('• stop the bus');
  await A.must('chooseGame', { game: 'stop' });
  await A.must('start', { lang: 'ar', cats: ['name', 'animal', 'country'], timer: 0, rounds: 3 });
  await all(bots, (s) => s.shared.phase === 'writing' && s.shared.round === 1 && s.shared.cats.length === 3 && !!s.shared.letter, 'stop deals a letter, no clock');
  const L = A.state.shared.letter;
  await A.must('submit', { answers: { name: L + 'حمد', animal: L + 'سد', country: 'xx' }, stop: false });
  await B.must('submit', { answers: { name: L + 'حمد', animal: L + 'رنب', country: '' } });
  await all(bots, (s) => s.shared.phase === 'writing' && s.shared.submitted.length === 2, 'two sheets in, the round is still open');
  check(!leaks(C, L + 'حمد'), 'answers stay on the server until the round closes');
  await C.must('submit', { answers: { name: L + 'ياد', animal: '', country: L + 'مريكا' }, stop: true });
  await all(bots, (s) => s.shared.phase === 'collecting' && s.shared.stopperId === C.pid, 'وقف closes the round for the table');
  await D.must('submit', { answers: { name: '', animal: L + 'سد', country: L + 'مريكا' } });
  await all(bots, (s) => s.shared.phase === 'review' && !!s.shared.results, 'the last sheet in scores the round');
  const r = A.state.shared.results;
  check(r[A.pid].name.pts === 5 && r[B.pid].name.pts === 5, 'a shared answer scores 5');
  check(r[C.pid].name.pts === 10, 'a unique answer scores 10');
  check(r[A.pid].country.pts === 0 && r[B.pid].country.pts === 0 && r[C.pid].animal.pts === 0, 'a blank or a wrong initial scores 0');
  check(A.state.shared.roundTotals[A.pid] === 10 && A.state.shared.roundTotals[C.pid] === 15, 'round totals add up');
  check((await B.act('adjust', { playerId: A.pid, cat: 'country', pts: 10 })).ok === false, 'only the host corrects a cell');
  await A.must('adjust', { playerId: A.pid, cat: 'country', pts: 10 });
  await all(bots, (s) => s.shared.results[A.pid].country.pts === 10 && s.shared.roundTotals[A.pid] === 20, 'the host can correct a cell');
  await A.must('nextRound');
  await all(bots, (s) => s.shared.phase === 'writing' && s.shared.round === 2 && s.shared.totals[A.pid] === 20 && s.shared.letter !== L, 'next round banks the points and deals a new letter');
  await A.must('backToHub');

  /* --- الحرباء ----------------------------------------------------------------- */
  console.log('• chameleon');
  await A.must('chooseGame', { game: 'chameleon' });
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.shared.phase === 'clues' && s.shared.words.length === 16 && s.shared.order.length === 4, 'chameleon deals a board and an order');
  const chams = bots.filter((b) => b.state.you && b.state.you.role === 'chameleon');
  check(chams.length === 1, 'exactly one chameleon');
  const cham = chams[0];
  const restBots = bots.filter((b) => b !== cham);
  const secret = restBots[0].state.you.secret;
  check(restBots.every((b) => b.state.you.secret === secret), 'everyone else is told the same secret index');
  check(cham.state.you.secret === undefined && !('secretWord' in cham.state.shared), 'the chameleon is told nothing');
  await A.must('startVote');
  await all(bots, (s) => s.shared.phase === 'voting', 'the host opens the vote');
  check((await cham.act('vote', { option: cham.pid })).ok === false, 'you cannot accuse yourself');
  for (const b of bots) await b.must('vote', { option: b === cham ? restBots[0].pid : cham.pid });
  await all(bots, (s) => s.shared.phase === 'guess' && s.shared.chameleonId === cham.pid, 'a caught chameleon gets a guess');
  check((await restBots[0].act('guess', { index: secret })).ok === false, 'only the chameleon guesses');
  await cham.must('guess', { index: (secret + 1) % 16 });
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.outcome === 'caught' && s.shared.secretWord === s.shared.words[secret] && s.shared.scores[restBots[0].pid] === 1,
    'a wrong guess: the players score and the word is revealed');
  await A.must('nextRound', { lang: 'ar' });
  await all(bots, (s) => s.shared.phase === 'clues' && s.shared.round === 2, 'next round deals again');
  await A.must('backToHub');

  /* --- الموقع السري --------------------------------------------------------- */
  console.log('• spyfall');
  await A.must('chooseGame', { game: 'spyfall' });
  await A.must('start', { lang: 'ar', minutes: 5, spyBots: 1 });
  await all(bots, (s) => s.shared.phase === 'play' && s.shared.locations.length > 20 && s.shared.endsAt > Date.now(), 'spyfall deals a place and starts the clock');
  const spyBots = bots.filter((b) => b.state.you && b.state.you.role === 'spy');
  check(spyBots.length === 1, 'one spy');
  const theSpy = spyBots[0];
  const agents = bots.filter((b) => b !== theSpy);
  const place = agents[0].state.you.location;
  check(!!place && agents.every((b) => b.state.you.location === place && b.state.you.job), 'agents share the place and have jobs');
  check(!theSpy.state.you.location && !('location' in theSpy.state.shared), 'the theSpy is not told the place');
  check((await agents[0].act('spyGuess', { location: place })).ok === false, 'only the theSpy guesses');
  await theSpy.must('spyGuess', { location: theSpy.state.shared.locations.find((l) => l !== place) });
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.outcome === 'caught' && s.shared.location === place && s.shared.scores[agents[0].pid] === 1,
    'a wrong guess by the theSpy: the agents score');
  await A.must('nextRound', { lang: 'ar' });
  await all(bots, (s) => s.shared.phase === 'play' && s.shared.round === 2, 'next round deals again');
  await A.must('startVote');
  await all(bots, (s) => s.shared.phase === 'voting', 'the host opens the vote');
  const spy2 = bots.find((b) => b.state.you.role === 'spy');
  const agent2 = bots.find((b) => b.state.you.role !== 'spy');
  const spyBefore = spy2.state.shared.scores[spy2.pid] || 0;
  for (const b of bots) await b.must('vote', { option: b === agent2 ? spy2.pid : agent2.pid });
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.outcome === 'escaped' && s.shared.scores[spy2.pid] === spyBefore + 2, 'accusing the wrong player: the spy escapes with two points');
  await A.must('backToHub');

  /* --- القنبلة (waits for a short fuse, up to ~32s) ------------------------- */
  console.log('• bomb (waits for a short fuse on the server clock)');
  await A.must('chooseGame', { game: 'bomb' });
  await A.must('start', { lang: 'ar', mode: 'category', fuse: 'short' });
  await all(bots, (s) => s.shared.phase === 'ticking' && !!s.shared.prompt && s.shared.heat === 0 && s.shared.order.length === 4 && !!s.shared.holderId, 'the bomb starts ticking in someone\'s hands');
  check(!JSON.stringify(A.state).includes('bombEndsAt'), 'the fuse length stays on the server');
  const prompt0 = A.state.shared.prompt;
  await A.must('swap');
  await all(bots, (s) => s.shared.prompt !== prompt0, 'the host can swap the category');
  const holder0 = byId(bots, A.state.shared.holderId);
  const notHolder = bots.find((b) => b !== holder0);
  check((await notHolder.act('pass')).ok === false, 'only the holder can pass the bomb');
  await holder0.must('pass');
  const order = A.state.shared.order;
  const expectedNext = order[(order.indexOf(holder0.pid) + 1) % order.length];
  await all(bots, (s) => s.shared.holderId === expectedNext && s.shared.passes === 1 && s.shared.fromId === holder0.pid, 'a pass moves the bomb to the next in order');
  // Passed without saying anything: whoever was handed it hands it straight back.
  const handed = byId(bots, expectedNext);
  check((await bots.find((b) => b !== handed && b !== A).act('sendBack')).ok === false, 'only the holder or the host sends a pass back');
  await handed.must('sendBack');
  await all(bots, (s) => s.shared.holderId === holder0.pid && s.shared.passes === 0 && !s.shared.fromId, 'a send-back returns the bomb and undoes the pass');
  check((await handed.act('sendBack')).ok === false, 'there is nothing to send back twice');
  await holder0.must('pass');
  await all(bots, (s) => s.shared.holderId === expectedNext, 'and the pass can be made again');
  await all(bots, (s) => s.shared.heat >= 1, 'the server raises the heat as the fuse burns', 20000);
  await all(bots, (s) => s.shared.phase === 'boom' && s.shared.loserId === s.shared.holderId && s.shared.strikes[s.shared.holderId] === 1, 'the server sets it off in the holder\'s hands', 35000);
  const loser0 = A.state.shared.loserId;
  const other = bots.find((b) => b.pid !== loser0);
  await A.must('markLoser', { playerId: other.pid });
  await all(bots, (s) => s.shared.loserId === other.pid && s.shared.strikes[other.pid] === 1 && !s.shared.strikes[loser0], 'the host can move the strike to someone else');
  await A.must('nextRound', { lang: 'ar' });
  await all(bots, (s) => s.shared.phase === 'ticking' && s.shared.round === 2 && s.shared.strikes[other.pid] === 1 && s.shared.holderId === other.pid, 'next round keeps the strikes and the loser starts');
  await A.must('backToHub');

  /* --- رسم وتخمين ----------------------------------------------------------- */
  console.log('• draw & guess (strokes, live line, guesses)');
  await A.must('chooseGame', { game: 'drawguess' });
  await A.must('start', { lang: 'ar', seconds: 30 });
  await all(bots, (s) => s.phase === 'drawing', 'draw & guess dealt');
  const drawer = byId(bots, A.state.shared.drawerId);
  const viewers = bots.filter((b) => b !== drawer);
  const drawWord = drawer.state.you.word;
  check(drawWord && viewers.every((b) => !leaks(b, drawWord)), "only the drawer's phone gets the word");
  check(viewers.every((b) => b.state.shared.hint && b.state.shared.hint.replace(/[_ ]/g, '') === ''), "guessers get the word's shape, never a letter of it");
  for (let i = 0; i < 5; i++) {
    await drawer.must('addStrokes', { strokes: [{ c: '#111111', w: 4, p: [i, i, i + 40, i + 40] }] });
  }
  await all(viewers, (s) => s.shared.strokes.length === 5, 'strokes reach every viewer');
  check(drawer.state.shared.strokes.length === 5, "the drawer's own copy matches");
  check(bots.every((b) => b.patchMisses === 0), 'every stroke update applied as a small patch');
  drawer.ws.send(JSON.stringify({ t: 'live', d: { i: 0, p: [1, 2, 3, 4] } }));
  viewers[0].ws.send(JSON.stringify({ t: 'live', d: { i: 0, p: [9, 9] } }));
  await sleep(600);
  check(viewers.every((b) => b.live.length === 1) && drawer.live.length === 0, 'the live line goes to viewers, and only from the drawer');
  const late = new Bot('reconnect'); Object.assign(late, { code: A.code, pid: viewers[1].pid });
  viewers[1].close();
  await late.connect(viewers[1].key);
  check(late.state.shared.strokes.length === 5, 'a reconnecting phone gets the whole drawing');
  late.close();
  await viewers[1].connect();
  await viewers[0].must('guess', { guess: 'غلط' });
  await all(viewers, (s) => s.shared.guesses.length === 1 && !s.shared.guesses[0].right, 'a wrong guess is not right');
  if (drawWord.length >= 3) {
    await viewers[0].must('guess', { guess: drawWord + 'ا' });
    await all(viewers, (s) => s.shared.guesses.length === 2 && s.shared.guesses[1].close === true, 'a near miss is marked close');
  }
  await viewers[0].must('guess', { guess: drawWord });
  await all(bots, (s) => s.phase === 'result' && s.shared.word === drawWord, 'a right guess ends the round');
  check(A.state.shared.scores[viewers[0].pid] === 2 && A.state.shared.scores[drawer.pid] === 1, 'guesser and drawer score');
  await A.must('backToHub');

  /* --- صدق ولا كذب ------------------------------------------------------------- */
  console.log('• two truths and a lie');
  await A.must('chooseGame', { game: 'twotruths' });
  await A.must('start', {});
  await all(bots, (s) => s.shared.phase === 'writing', 'two truths: everyone writes');
  check((await A.act('submit', { statements: ['a', '', 'c'], lie: 1 })).ok === false, 'three statements are required');
  for (const b of bots) await b.must('submit', { statements: [b.name + ' 1', b.name + ' 2', b.name + ' 3'], lie: 2 });
  await all(bots, (s) => s.shared.phase === 'voting' && !!s.shared.subjectId && s.shared.items.length === 3, 'the last sheet in opens the first vote');
  const subject = byId(bots, A.state.shared.subjectId);
  const voters = bots.filter((b) => b !== subject);
  check(!('lieIndex' in subject.state.shared) || subject.state.shared.lieIndex === null, 'the lie is not published while the vote is open');
  check((await subject.act('vote', { option: 'i0' })).ok === false, 'the storyteller cannot vote on their own statements');
  const lieText = subject.name + ' 3';
  const lieOpt = 'i' + subject.state.shared.items.indexOf(lieText);
  await voters[0].must('vote', { option: lieOpt });
  await voters[1].must('vote', { option: lieOpt === 'i0' ? 'i1' : 'i0' });
  await voters[2].must('vote', { option: lieOpt === 'i0' ? 'i1' : 'i0' });
  await all(bots, (s) => s.shared.phase === 'result' && s.shared.items[s.shared.lieIndex] === lieText, 'the vote closes and the lie is shown');
  check(A.state.shared.scores[voters[0].pid] === 1 && A.state.shared.scores[subject.pid] === 2, 'a point for catching it, one per voter fooled');
  await A.must('next');
  await all(bots, (s) => s.shared.phase === 'voting' && s.shared.turn === 1, 'next storyteller');
  await A.must('backToHub');

  /* --- فوازير إيموجي ------------------------------------------------------------ */
  console.log('• emoji riddles');
  await A.must('chooseGame', { game: 'emoji' });
  await A.must('start', { lang: 'ar', count: 5 });
  await all(bots, (s) => s.shared.phase === 'answering' && !!s.shared.card.e && s.shared.total === 5, 'emoji deals a riddle with a clock');
  check(bots.every((b) => !('a' in b.state.shared.card) && !('answer' in b.state.shared)), 'the answer stays on the server');
  await B.must('guess', { text: 'غلط تماما' });
  await all(bots, (s) => s.shared.feed.length === 1 && s.shared.feed[0].right === false, 'a wrong guess is shown to the table');
  await A.must('closeQuestion');
  await all(bots, (s) => s.shared.phase === 'results' && !!s.shared.answer, 'the host closes the riddle and the answer shows');
  const emojiAnswer = A.state.shared.answer;
  await A.must('nextQuestion');
  await all(bots, (s) => s.shared.phase === 'answering' && s.shared.qIndex === 1, 'next riddle');
  check(A.state.shared.card.e !== undefined && emojiAnswer !== A.state.shared.answer, 'a new card');
  await A.must('backToHub');

  /* --- كمّل المثل --------------------------------------------------------------- */
  console.log('• proverbs');
  await A.must('chooseGame', { game: 'proverbs' });
  await A.must('start', { lang: 'en', count: 5 });
  await all(bots, (s) => s.shared.phase === 'answering' && s.shared.card.p.indexOf('___') !== -1, 'a proverb with a blank');
  await B.must('guess', { text: 'nonsense' });
  await all(bots, (s) => s.shared.tried.length === 1, 'one wrong answer is one try used');
  await B.must('guess', { text: 'nonsense again' });
  check(B.state.shared.tried.length === 1, 'a second answer is ignored');
  await A.must('closeQuestion');
  await all(bots, (s) => s.shared.phase === 'results' && !!s.shared.answer && s.shared.answers.length === 1, 'the answer and what was typed are shown');
  await A.must('backToHub');

  /* --- خمس ثواني ----------------------------------------------------------------- */
  console.log('• five seconds (waits for the server clock)');
  await A.must('chooseGame', { game: 'fiveseconds' });
  await A.must('start', { lang: 'ar', rounds: 1 });
  await all(bots, (s) => s.shared.phase === 'ready' && !!s.shared.turnId, 'five seconds: a first player is up');
  const upBot = byId(bots, A.state.shared.turnId);
  const notUp = bots.find((b) => b !== upBot && b !== A);
  check((await notUp.act('go', {})).ok === false, 'only the player up (or the host) starts the clock');
  await upBot.must('go', {});
  await all(bots, (s) => s.shared.phase === 'counting' && !!s.shared.prompt && !!s.shared.endsAt, 'a category and five seconds');
  await all(bots, (s) => s.shared.phase === 'judging', 'the server clock ends the five seconds', 8000);
  await A.must('judge', { ok: true });
  await all(bots, (s) => s.shared.phase === 'ready' && s.shared.turn === 1 && s.shared.scores[upBot.pid] === 1, 'a point, and the next player is up');
  await A.must('backToHub');

  /* --- ارسم واكتب ---------------------------------------------------------------- */
  console.log('• drawing telephone');
  await A.must('chooseGame', { game: 'telephone' });
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.shared.phase === 'working' && s.shared.kind === 'draw' && s.shared.step === 1 && s.shared.steps === 4, 'telephone: everyone draws a phrase');
  check(bots.every((b) => b.state.you.task && b.state.you.task.kind === 'draw' && b.state.you.task.prev.kind === 'text' && b.state.you.task.prev.text), 'each phone has a phrase to draw');
  const chainsSeen = new Set(bots.map((b) => b.state.you.task.chain));
  check(chainsSeen.size === 4, 'four different chains');
  for (const b of bots) await b.must('submit', { strokes: [{ c: '#111111', w: 4, p: [10, 10, 100, 100] }] });
  await all(bots, (s) => s.shared.step === 2 && s.shared.kind === 'write', 'everyone in: the next step is to write');
  check(bots.every((b) => b.state.you.task.kind === 'write' && b.state.you.task.prev.kind === 'draw' && b.state.you.task.prev.strokes.length === 1), 'each phone gets a drawing to describe');
  for (const b of bots) await b.must('submit', { text: 'وصف ' + b.name });
  await all(bots, (s) => s.shared.step === 3 && s.shared.kind === 'draw', 'and draws again');
  for (const b of bots) await b.must('submit', { strokes: [] });
  await all(bots, (s) => s.shared.phase === 'reveal' && s.shared.chain && s.shared.chain.steps.length === 4 && s.shared.reveal.chain === 0, 'the last step opens the reveal');
  check(bots.every((b) => !b.state.you || !b.state.you.task), 'no tasks left on the phones');
  await A.must('revealNext');
  await all(bots, (s) => s.shared.reveal.step === 1, 'the host steps through a chain');
  for (let i = 0; i < 3 + 4 * 3; i++) await A.must('revealNext');
  await all(bots, (s) => s.shared.phase === 'done' && s.shared.summary.length === 4, 'after the last chain, the summary');
  await A.must('backToHub');

  /* --- ربع قرد ------------------------------------------------------------------- */
  console.log('• monkey (letters, liar, chain)');
  await A.must('chooseGame', { game: 'monkey' });
  await A.must('start', { lang: 'ar', mode: 'letters', category: 'countries', timer: 0, winners: 1, autoPenalty: true });
  await all(bots, (s) => s.shared.phase === 'play' && s.shared.mode === 'letters' && !!s.shared.turnId, 'monkey: letters, a first player is up');
  const up = () => byId(bots, A.state.shared.turnId);
  check((await bots.find((b) => b !== up()).act('letter', { ch: 'م' })).ok === false, 'only the player up adds a letter');
  await up().must('letter', { ch: 'م' });
  await all(bots, (s) => s.shared.letters.length === 1, 'a letter is on the word');
  await up().must('letter', { ch: 'ص' });
  await all(bots, (s) => s.shared.letters.length === 2, 'two letters on the word');
  const closer = up();
  await closer.must('letter', { ch: 'ر' });
  await all(bots, (s) => s.shared.letters.length === 0 && s.shared.verdict && s.shared.verdict.kind === 'closed' && s.shared.verdict.word === 'مصر' && s.shared.quarters[closer.pid] === 1,
    'مصر is closed: a quarter to the one who closed it');
  const bluffer = up();
  await bluffer.must('letter', { ch: 'ذ' });
  await all(bots, (s) => s.shared.letters.length === 1 && s.shared.turnId !== bluffer.pid, 'the bluff is on the word and the turn moved on');
  check((await bluffer.act('liar', {})).ok === false, 'you cannot call your own letter');
  const caller = bots.find((b) => b !== bluffer);
  await caller.must('liar', {});
  await all(bots, (s) => s.shared.verdict.kind === 'liar-right' && s.shared.letters.length === 0, 'كذاب: no country starts with ذ, the bluffer takes the quarter');
  const honest = up();
  await honest.must('letter', { ch: 'ا' });
  await all(bots, (s) => s.shared.letters.length === 1 && s.shared.turnId !== honest.pid, 'an honest letter, and the turn moved on');
  const caller2 = bots.find((b) => b !== honest);
  const before2 = A.state.shared.quarters[caller2.pid] || 0;
  await caller2.must('liar', {});
  await all(bots, (s) => s.shared.verdict.kind === 'liar-wrong' && s.shared.quarters[caller2.pid] === before2 + 1 && s.shared.verdict.examples.length > 0,
    'a wrong كذاب: the caller takes the quarter and sees what it could have been');
  await A.must('flip', {});
  await all(bots, (s) => s.shared.verdict.flipped && s.shared.quarters[caller2.pid] === before2, 'the host can overrule the verdict');
  await A.must('backToHub');
  await A.must('chooseGame', { game: 'monkey' });
  await A.must('start', { lang: 'ar', mode: 'chain', category: 'countries', timer: 0, winners: 1 });
  await all(bots, (s) => s.shared.mode === 'chain' && !s.shared.required, 'monkey: the chain starts open');
  check((await up().act('name', { text: 'بلد وهمية' })).ok === false, 'an unknown name is refused');
  await up().must('name', { text: 'مصر' });
  await all(bots, (s) => s.shared.required === 'ر' && s.shared.used[0] === 'مصر', 'مصر: the next name must start with ر');
  check((await up().act('name', { text: 'فرنسا' })).ok === false, 'a name on the wrong letter is refused');
  check((await up().act('name', { text: 'مصر' })).ok === false, 'a name said before is refused');
  await up().must('name', { text: 'روسيا' });
  await all(bots, (s) => s.shared.required === 'ا' && s.shared.used.length === 2, 'روسيا: the next name must start with ا');
  const giver = up();
  await giver.must('giveUp', {});
  await all(bots, (s) => s.shared.quarters[giver.pid] === 1 && s.shared.verdict.kind === 'giveup', 'giving up is a quarter');
  await A.must('backToHub');

  /* --- الفنان المزيف -------------------------------------------------------- */
  console.log('• fake artist');
  await A.must('chooseGame', { game: 'fakeartist' });
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.shared.phase === 'drawing', 'fake artist dealt');
  const fake = bots.find((b) => b.state.you.isFake);
  const faWord = bots.find((b) => !b.state.you.isFake).state.you.word;
  check(fake && !leaks(fake, faWord), "the fake's phone never receives the word");
  for (let turnNo = 0; turnNo < 8; turnNo++) {
    const artist = byId(bots, A.state.shared.currentDrawerId);
    await artist.must('sendStroke', { stroke: { p: [turnNo * 10, 5, turnNo * 10 + 30, 60] } });
    await all(bots, (s) => s.shared.strokes.length === turnNo + 1, `fake artist line ${turnNo + 1} reaches everyone`, 3000);
  }
  await all(bots, (s) => s.shared.phase === 'voting', 'fake artist moves to the vote');
  for (const b of bots) await b.must('vote', { option: b === fake ? bots.find((x) => x !== fake).pid : fake.pid });
  await all(bots, (s) => s.shared.phase === 'guessing', 'a caught fake gets to guess');
  check(!leaks(fake, faWord), 'the word is still hidden from the fake while guessing');
  await fake.must('fakeGuess', { guess: 'مش هي' });
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.winner === 'artists' && s.shared.secretWord === faWord, 'fake artist result');
  await A.must('backToHub');

  /* --- على نفس الموجة ------------------------------------------------------- */
  console.log('• wavelength');
  await A.must('chooseGame', { game: 'wavelength' });
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.shared.phase === 'clue', 'wavelength dealt');
  const psychic = byId(bots, A.state.shared.psychicId);
  const target = psychic.state.you.target;
  check(typeof target === 'number' && bots.filter((b) => b !== psychic).every((b) => b.state.you === null), 'only the psychic sees the target');
  await psychic.must('giveClue', { clue: 'سخن' });
  const dialer = bots.find((b) => b !== psychic);
  check((await psychic.act('setDial', { dial: target })).ok === false, 'the psychic cannot move the dial');
  await dialer.must('setDial', { dial: target });
  await all(bots, (s) => s.shared.dial === target, 'the dial moves on every phone');
  await A.must('lockDial');
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.pointsEarned === 4 && s.shared.target === target, 'wavelength scores a bullseye');
  await A.must('backToHub');

  /* --- تحدي المعلومات ------------------------------------------------------- */
  console.log('• trivia (waits ~17s for the server clock)');
  await A.must('chooseGame', { game: 'trivia' });
  await A.must('start', { lang: 'ar', count: 5 });
  await all(bots, (s) => s.shared.phase === 'answering' && s.shared.totalQuestions === 5, 'trivia starts with the chosen 5 questions');
  check(!bots.some((b) => 'correctAnswer' in b.state.shared), 'the answer stays on the server while answering');
  // Each bot picks a different choice, so exactly one of them is right.
  for (let i = 0; i < 4; i++) await bots[i].must('answer', { choice: i });
  await all(bots, (s) => s.shared.phase === 'results' && typeof s.shared.correctAnswer === 'number', 'all answered closes the question');
  const firstQ = A.state.shared;
  const rightBot = bots[firstQ.correctAnswer];
  check(firstQ.gained[rightBot.pid] === 15 && Object.keys(firstQ.gained).length === 1,
        'the one right answer scores 10 + 5 for being the fastest');
  await A.must('nextQuestion');
  await all(bots, (s) => s.shared.phase === 'answering' && s.shared.qIndex === 1, 'trivia question 2');
  // Nobody answers and nobody closes it: the server's own clock must.
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.qIndex === 1, 'the server closes a question when time is up', 22000);
  for (let q = 2; q < 5; q++) {
    await A.must('nextQuestion');
    await all(bots, (s) => s.shared.qIndex === q && s.shared.phase === 'answering', `trivia question ${q + 1}`, 3000);
    for (const b of bots) await b.must('answer', { choice: 1 });
    await A.waitFor((s) => s.shared.phase === 'results', `question ${q + 1} closes`, 3000);
  }
  await A.must('nextQuestion');
  await all(bots, (s) => s.shared.phase === 'gameover' && s.shared.board.length === 4, 'trivia game over after the chosen 5 questions');
  await A.must('backToHub');

  /* --- prompt memory across rooms ---------------------------------------- */
  console.log('• prompt memory shared between rooms');
  const H = await Bot.host('H', 'codenames');
  const others = [H, await Bot.join(H.code, 'I'), await Bot.join(H.code, 'J'), await Bot.join(H.code, 'K')];
  await others[0].must('setTeam', { team: 'red', role: 'spymaster' });
  await others[1].must('setTeam', { team: 'red', role: 'operative' });
  await others[2].must('setTeam', { team: 'blue', role: 'spymaster' });
  await others[3].must('setTeam', { team: 'blue', role: 'operative' });
  await H.must('start', { lang: 'ar' });
  await H.waitFor((s) => s.phase === 'playing', 'second room dealt');
  const secondBoard = H.state.shared.board.map((c) => c.word);
  const repeated = secondBoard.filter((w) => firstBoard.indexOf(w) !== -1);
  check(repeated.length === 0, `a new room's board skips the last room's words (${repeated.length} repeated)`);
  others.forEach((b) => b.close());

  /* --- leaving ----------------------------------------------------------- */
  console.log('• leaving');
  await api('/leave', { code: A.code, pid: D.pid, key: D.key });
  await A.waitFor((s) => s.players.length === 3, 'a player who leaves is removed');
  await A.act('leave');
  A.ws.send(JSON.stringify({ t: 'leave' }));
  await B.waitFor((s) => s.players.length === 2 && s.hostId !== A.pid, 'the host leaving hands the room on');
  check(B.state.youAreHost || C.state.youAreHost, 'someone is host again');
  bots.forEach((b) => b.close());

  console.log(`\n${passed} passed, ${failures.length} failed, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (failures.length) {
    console.log('failed:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('test crashed:', err && err.stack || err);
  process.exit(2);
});
