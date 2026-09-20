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
import { readFileSync } from 'node:fs';
import { stopDictionary, stopAnswerFits, stopWordKnown, foldStopAnswer } from '../generated/rules.js';

// سكرو's cards, read by the robots to decide what to do with what they drew and
// to check the score at the reveal. They only ever learn a card the way a
// player does: their own slice, or a card the table sees.
const SKREW = new Function(readFileSync(new URL('../../SkrewCards.js', import.meta.url), 'utf8') +
  '\nreturn { SKREW_CARDS, skrewMatches, skrewValue, skrewHandValues };')();

const ARGS = process.argv.slice(2);
const BASE = (ARGS.find((a) => !a.startsWith('--')) || 'http://127.0.0.1:8787').replace(/\/$/, '');
// --slow also waits out the presence clocks (a silent socket, a host away): about three minutes more.
const SLOW = ARGS.includes('--slow');
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
      // The heartbeat a real phone sends: a socket nothing is heard on for 70s counts as gone.
      clearInterval(this.pinger);
      this.pinger = setInterval(() => { try { if (ws.readyState === 1) ws.send('ping'); } catch (e) {} }, 20000);
      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
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
      ws.onclose = () => { clearTimeout(timer); if (this.ws === ws) clearInterval(this.pinger); resolve(this); };
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

  close() { clearInterval(this.pinger); try { this.ws.close(); } catch (e) {} }
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
  const takenFolded = await api('/join', { code: A.code, name: ' احمد ' });
  check(!takenFolded.ok && /مستخدم/.test(takenFolded.error), 'a taken name spelt another way (احمد for أحمد) is refused too');
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
  const talk = (s) => (s.chat || []).filter((m) => !m.sys);
  check(['سارة', 'Omar', 'منى'].every((n) => A.state.chat.some((m) => m.sys === 'joined' && m.p.name === n)), 'every join is said in the chat');
  check(A.state.chat.every((m) => !m.sys || !m.from), 'room events belong to nobody, so they count against no one');
  await A.must('chat', { text: 'أهلا يا جماعة' });
  await all(bots, (s) => talk(s).length === 1 && talk(s)[0].text === 'أهلا يا جماعة' && talk(s)[0].name === A.name, 'a message reaches every phone with its sender');
  await B.must('chat', { text: 'x'.repeat(300) });
  await all(bots, (s) => talk(s).length === 2 && talk(s)[1].text.length === 200, 'a message is cut at 200 characters');
  check((await B.act('chat', { text: 'team?', to: 'team' })).ok === false, 'there is no team channel outside a team game');
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
  await all(bots, (s) => s.phase === 'writing' && !!s.shared.dealId, 'just one dealt, with a deal stamp');
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
  check(guesser.state.shared.clues.filter((c) => c.removed).every((c) => c.text === '') && !leaks(guesser, 'قطة') && !leaks(guesser, 'قطه'),
    "a removed clue's text never reaches the guesser's phone");
  await guesser.must('submitGuess', { guess: secretJO });
  await all(bots, (s) => s.phase === 'judging' && s.shared.clues.some((c) => c.removed && c.text === 'قطة'), 'the removed clues are shown once the guess is in');
  await A.must('judge', { correct: true });
  await all(bots, (s) => s.phase === 'result' && s.shared.score === 1, 'just one scores');
  const joDeal = A.state.shared.dealId;
  await A.must('nextRound', { round: 1 });
  await all(bots, (s) => s.phase === 'writing' && s.shared.round === 2 && !!s.shared.dealId && s.shared.dealId !== joDeal, 'next round deals round 2, with a new stamp');
  await A.must('nextRound', { round: 1 });
  await A.must('nextRound', {});
  check(A.state.shared.round === 2 && A.state.phase === 'writing', 'a second tap on next round is ignored, with or without the round');
  const writer2 = bots.find((b) => b.pid !== A.state.shared.guesserId);
  await writer2.must('submitClue', { clue: 'واحد' });
  check((await B.act('closeWriting')).ok === false, 'only the host closes the writing');
  await A.must('closeWriting');
  await all(bots, (s) => s.phase === 'guessing' && s.shared.clues.length === 1, 'the host goes on with the clues that are in');
  check((await B.act('skipGuess')).ok === false, 'only the host skips the guess');
  await A.must('skipGuess');
  await all(bots, (s) => s.phase === 'result' && s.shared.lastResult === 'skipped' && !!s.shared.secretWord && s.shared.score === 1,
    'skipping the guess shows the word and scores nothing');
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
  // A team's channel before the game: gone once the board is dealt.
  // A spymaster may talk to the team before the game (D is still rate limited from the chat test).
  await C.must('chat', { text: 'blue before the deal', to: 'team' });
  await all([C, D], (s) => s.chat.some((m) => m.text === 'blue before the deal'), 'a lobby team message reaches its team, spymaster included');
  const chatTop = Math.max(...C.state.chat.map((m) => m.id));
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.phase === 'playing' && s.shared.board.length === 25, 'codenames board dealt');
  await all(bots, (s) => s.chat.some((m) => m.sys === 'started' && m.p.game === 'codenames') && !s.chat.some((m) => m.text === 'blue before the deal'),
    'the start is said in the chat, and last round of team talk is gone');
  check(C.state.chat.filter((m) => m.sys === 'started' && m.p.game === 'codenames').pop().id > chatTop, "a chat id is never reused after the team's lines are dropped");
  // Team chat: operatives write to their side, the other side never receives it.
  await B.must('chat', { text: 'red team secret plan', to: 'team' });
  await all([A, B], (s) => s.chat.some((m) => m.text === 'red team secret plan' && m.team === 'red'), 'a team message reaches both members of that team');
  await sleep(400);
  check(!leaks(C, 'red team secret plan') && !leaks(D, 'red team secret plan'), 'the other team never receives it');
  check((await A.act('chat', { text: 'spymaster hint', to: 'team' })).ok === false, 'a spymaster in play cannot write to the team');
  await A.must('chat', { text: 'good luck everyone' });
  await all(bots, (s) => s.chat.some((m) => m.text === 'good luck everyone' && !m.team), 'a spymaster can still talk to the whole room');
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
  // The host's way out of a stuck board: pass a team's turn, hand a team's key on.
  const stuckTurn = A.state.shared.turn;
  check((await B.act('passTurn')).ok === false, "only the host passes a team's turn");
  await A.must('passTurn');
  await all([A, TV], (s) => s.shared.turn !== stuckTurn && !s.shared.clue, "the host passes a stuck team's turn, clue or not");
  const sideOf = (b) => A.state.shared.teams[b.pid] || {};
  const redLead = bots.find((b) => sideOf(b).team === 'red' && sideOf(b).role === 'spymaster');
  const redOp = bots.find((b) => sideOf(b).team === 'red' && sideOf(b).role === 'operative');
  const blueOp = bots.find((b) => sideOf(b).team === 'blue' && sideOf(b).role === 'operative');
  check((await B.act('setSpymaster', { team: 'red', playerId: redOp.pid })).ok === false || B === A, 'only the host hands a key on');
  check((await A.act('setSpymaster', { team: 'red', playerId: blueOp.pid })).ok === false, 'a spymaster comes from their own team');
  await A.must('setSpymaster', { team: 'red', playerId: redOp.pid });
  await all(bots, (s) => s.shared.teams[redOp.pid].role === 'spymaster' && s.shared.teams[redLead.pid].role === 'operative', "the host hands a team's key to another player");
  await redOp.waitFor((s) => !!(s.you && s.you.key && s.you.key.length === 25), 'the new spymaster gets the key');
  await redLead.waitFor((s) => s.you === null, 'and the old one no longer has it');
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
  await A.must('nextRound', { lang: 'ar', round: 1 });
  await A.must('nextRound', { lang: 'ar', round: 1 });
  await A.must('nextRound', { lang: 'ar' });
  await all(bots, (s) => s.shared.round === 2 && s.shared.vote.phase === 'voting', 'next question: once, however often it is tapped');
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
  await all(bots, (s) => s.phase === 'voting' && s.you && !!s.you.voteOwn, 'fibbage moves to voting, each phone told which option is its own');
  // Nothing published may point at the truth: no owners, no telling ids.
  const fibOptions = A.state.shared.vote.options;
  check(fibOptions.length === 5 && fibOptions.every((o) => !('ownerId' in o) && o.id !== 'truth' && bots.every((b) => o.id.indexOf(b.pid) === -1)),
    'fibbage options carry no owner and no telling id');
  const ownOf = (b) => b.state.you.voteOwn;
  check(bots.every((b) => bots.every((x) => x === b || JSON.stringify(b.state.you).indexOf(ownOf(x)) === -1) && JSON.stringify(b.state).indexOf('truthId') === -1),
    'each phone is told only its own option, and nothing names the truth while voting');
  const fibTruth = fibOptions.find((o) => bots.every((b) => ownOf(b) !== o.id)).id;
  check((await A.act('vote', { option: ownOf(A) })).ok === false, 'you cannot vote for your own lie');
  await A.must('vote', { option: fibTruth });
  await B.must('vote', { option: ownOf(A) });
  await C.must('vote', { option: fibTruth });
  await D.must('vote', { option: fibTruth });
  await all(bots, (s) => s.shared.phase === 'results' && s.shared.scores[A.pid] === 1500 && s.shared.truthId === fibTruth &&
    s.shared.vote.results.find((r) => r.id === ownOf(A)).ownerId === A.pid, 'fibbage scores truth + fooling, and names the truth and the owners after');
  await A.must('nextRound', { lang: 'ar', round: A.state.shared.round });
  await all(bots, (s) => s.phase === 'writing' && s.shared.round === 2 && !(s.you && s.you.voteOwn), 'fibbage next round forgets whose option was whose');
  check((await A.act('nextRound', { lang: 'ar', round: 1 })).ok && A.state.shared.round === 2, 'a next round from the round before is ignored');
  // A writer who never sends: the host opens the vote with what is in.
  await B.must('submitLie', { lie: 'كذبة بس' });
  check((await B.act('closeWriting')).ok === false, 'only the host closes the writing');
  await A.must('closeWriting');
  await all(bots, (s) => s.phase === 'voting' && s.shared.vote.options.length === 2, 'closing the writing opens the vote on the one lie and the truth');
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
  await A.must('wrong', { id: C.pid });
  await A.must('wrong', { id: C.pid });
  await all(bots, (s) => s.shared.buzzes.length === 2 && s.shared.buzzes[0].id === B.pid && s.shared.last && s.shared.last.ok === false && s.shared.last.id === C.pid,
    'a wrong answer passes the question to the next in line, once however often it is tapped');
  await A.must('correct', { id: B.pid });
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
  const buzzLate = await Bot.join(A.code, 'متأخر');
  check(buzzLate.state.inGame === false, 'someone who joins mid-game watches the buzzer first');
  await A.must('playAgain');
  await all(bots, (s) => s.shared.round === 1 && !s.shared.scores[B.pid] && !s.shared.scores[D.pid], 'play again clears the scores');
  await buzzLate.waitFor((s) => s.inGame === true, 'and deals in whoever joined during the evening');
  await api('/leave', { code: A.code, pid: buzzLate.pid, key: buzzLate.key });
  buzzLate.close();
  await A.waitFor((s) => s.players.length === 4, 'the latecomer leaves again');
  await A.must('backToHub');

  /* --- أتوبيس كومبليت --------------------------------------------------------- */
  console.log('• stop the bus');
  await A.must('chooseGame', { game: 'stop' });
  await A.must('start', { lang: 'ar', cats: ['name', 'animal', 'food'], timer: 0, rounds: 3 });
  await all(bots, (s) => s.shared.phase === 'writing' && s.shared.round === 1 && s.shared.cats.length === 3 && !!s.shared.letter, 'stop deals a letter, no clock');
  const L = A.state.shared.letter;
  // Real words on this letter from the dictionary, so the check can tell them from a made-up one.
  // One word per spelling: two dictionary entries that fold to the same word
  // (a hamza, ة/ه) would score as a shared answer, 5 rather than 10.
  const onLetter = (cat) => {
    const seen = new Set();
    return [...stopDictionary('ar', cat)].filter((w) => {
      if (w.length < 3 || !stopAnswerFits(w, 'ar', L)) return false;
      const key = foldStopAnswer(w, 'ar', L);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const [name1, name2] = onLetter('name');
  const [animal1, animal2] = onLetter('animal');
  const [food1] = onLetter('food');
  const madeUp = L + 'ززظظ';
  check(!!(name2 && animal2 && food1), 'the dictionary has names, animals and food on the letter');
  check(stopWordKnown('ar', 'animal', madeUp) === false, 'a made-up word is not in the dictionary');
  await A.must('submit', { answers: { name: name1, animal: animal1, food: 'xx' }, stop: false });
  await B.must('submit', { answers: { name: name1, animal: animal2, food: '' } });
  await all(bots, (s) => s.shared.phase === 'writing' && s.shared.submitted.length === 2, 'two sheets in, the round is still open');
  check(!leaks(C, name1), 'answers stay on the server until the round closes');
  check((await C.act('submit', { answers: { name: name2, animal: '', food: food1 }, stop: true })).ok === false, 'وقف is refused with an empty box');
  check((await C.act('submit', { answers: { name: name2, animal: 'xx' + madeUp, food: food1 }, stop: true })).ok === false, 'وقف is refused with a word on another letter');
  await C.must('submit', { answers: { name: name2, animal: madeUp, food: food1 }, stop: true });
  await all(bots, (s) => s.shared.phase === 'collecting' && s.shared.stopperId === C.pid, 'وقف closes the round for the table');
  await D.must('submit', { answers: { name: '', animal: animal1, food: food1 } });
  await all(bots, (s) => s.shared.phase === 'review' && !!s.shared.results, 'the last sheet in scores the round');
  const r = A.state.shared.results;
  check(r[A.pid].name.pts === 5 && r[B.pid].name.pts === 5, 'a shared answer scores 5');
  check(r[C.pid].name.pts === 10 && r[C.pid].name.word === 'known', 'a unique answer the dictionary knows scores 10');
  check(r[A.pid].food.pts === 0 && r[B.pid].food.pts === 0 && r[D.pid].name.pts === 0, 'a blank or a wrong initial scores 0');
  check(r[C.pid].animal.pts === 0 && r[C.pid].animal.word === 'unknown', 'a word the dictionary does not know scores 0, marked for the host');
  check(A.state.shared.roundTotals[A.pid] === 10 && A.state.shared.roundTotals[C.pid] === 15, 'round totals add up');
  check((await B.act('adjust', { playerId: A.pid, cat: 'food', pts: 10 })).ok === false, 'only the host corrects a cell');
  await A.must('adjust', { playerId: A.pid, cat: 'food', pts: 10 });
  await all(bots, (s) => s.shared.results[A.pid].food.pts === 10 && s.shared.roundTotals[A.pid] === 20, 'the host can correct a cell');
  await A.must('nextRound');
  await all(bots, (s) => s.shared.phase === 'writing' && s.shared.round === 2 && s.shared.totals[A.pid] === 20 && s.shared.letter !== L, 'next round banks the points and deals a new letter');
  await B.must('submit', { answers: { name: name1, animal: animal1, food: food1 }, round: 1 });
  check(B.state.shared.submitted.length === 0, "a sheet from last round, arriving late, is not filed under this one");
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
  if (drawWord.length >= 4) {
    // Three letters on the end: too far to count (a letter off would be right now), near enough for a nudge.
    await viewers[0].must('guess', { guess: drawWord + 'ااا' });
    await all(viewers, (s) => s.shared.guesses.length === 2 && !s.shared.guesses[1].right && s.shared.guesses[1].close === true, 'a near miss is marked close, not right');
  }
  await viewers[0].must('guess', { guess: drawWord });
  await all(bots, (s) => s.phase === 'result' && s.shared.word === drawWord, 'a right guess ends the round');
  check(A.state.shared.scores[viewers[0].pid] === 2 && A.state.shared.scores[drawer.pid] === 1, 'guesser and drawer score');
  await A.must('nextRound', { lang: 'ar', round: 1 });
  await A.must('nextRound', { lang: 'ar', round: 1 });
  await A.must('nextRound', { lang: 'ar' });
  await all(bots, (s) => s.phase === 'drawing' && s.shared.round === 2 && !s.shared.word, "next round: one new drawer, however often it is tapped");
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
  // Play the rest out with everyone catching the lie, so the first storyteller -
  // the only one who fooled anybody - takes the title at the end.
  for (let guard = 0; A.state.shared.phase !== 'gameover' && guard < 8; guard++) {
    const teller = byId(bots, A.state.shared.subjectId);
    // The host's state is the one just waited for; a bot that has not polled
    // since the last turn still holds the previous storyteller's statements.
    const itsLie = 'i' + A.state.shared.items.indexOf(teller.name + ' 3');
    for (const b of bots) if (b !== teller) await b.must('vote', { option: itsLie });
    await A.waitFor((s) => s.shared.phase === 'result', 'the vote closes', 3000);
    await A.must('next');
    await A.waitFor((s) => s.shared.phase === 'voting' || s.shared.phase === 'gameover', 'on to the next storyteller', 3000);
  }
  await all(bots, (s) => s.shared.phase === 'gameover', 'two truths: every storyteller has had a turn');
  check(!!A.state.shared.bestLiar && A.state.shared.bestLiar.id === subject.pid && A.state.shared.bestLiar.n === 2,
        'the one who fooled the most is named at the end');
  check(bots.every((b) => JSON.stringify(b.state.shared.bestLiar) === JSON.stringify(A.state.shared.bestLiar)),
        'and every phone is told the same one');
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
  await bots[0].must('submit', { strokes: [{ c: '#111111', w: 4, p: [1, 1, 50, 50] }], step: 1 });
  await bots[1].must('submit', { strokes: [] });
  check(bots[1].state.shared.submitted.length === 0, "a drawing that arrives after its step ended is not filed under the next one (with or without the step)");
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
  const quartersSum = (s) => Object.values(s.shared.quarters).reduce((n, q) => n + q, 0);
  const penalised = A.state.shared.turnId;
  const sumBefore = quartersSum(A.state);
  await A.must('penalty', { target: penalised });
  await A.must('penalty', { target: penalised });
  await all(bots, (s) => quartersSum(s) === sumBefore + 1 && s.shared.turnId !== penalised, "the host's quarter goes to the player up, once however often it is tapped");
  const skipped = A.state.shared.turnId;
  const nextUp = A.state.shared.order[(A.state.shared.turn + 1) % 4];
  await A.must('skip', { target: skipped });
  await A.must('skip', { target: skipped });
  await all(bots, (s) => s.shared.turnId === nextUp, 'a skip moves the turn on once');
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
  await A.must('skipTurn', { turn: 0, round: 1 });
  await A.must('skipTurn', { turn: 0, round: 1 });
  await all(bots, (s) => s.shared.turnIndex === 1 && s.shared.strokes.length === 0, 'the host skips a silent artist once, however often it is tapped');
  for (let turnNo = 0; turnNo < 7; turnNo++) {
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
  // The title of the night. Which bot ends up fastest depends on the questions
  // dealt, so what is checked is that it reaches every phone and names someone
  // really in the room.
  check(bots.every((b) => 'fastest' in b.state.shared), 'the end-of-game title reaches every phone');
  const fastest = A.state.shared.fastest;
  check(fastest === null || (!!fastest.name && fastest.n >= 1 && bots.some((b) => b.pid === fastest.id)),
        'the fastest is a player who is really in the room, with a count');
  check(bots.every((b) => JSON.stringify(b.state.shared.fastest) === JSON.stringify(fastest)),
        'and every phone is told the same one');
  await A.must('backToHub');

  /* --- زي الكل ----------------------------------------------------------------- */
  console.log('• herd mentality');
  await A.must('chooseGame', { game: 'herd' });
  await A.must('start', { lang: 'ar', target: 5 });
  await all(bots, (s) => s.shared.phase === 'writing' && !!s.shared.prompt && s.shared.target === 5, 'herd: one question for everyone');
  check((await B.act('submit', { text: '   ' })).ok === false, 'an empty answer is refused');
  await A.must('submit', { text: 'قطة' });
  await B.must('submit', { text: 'القطه' });
  await C.must('submit', { text: 'كلب' });
  check(!leaks(D, 'كلب') && !leaks(D, 'قطة'), 'the answers stay on the server until everyone has written');
  await D.must('submit', { text: 'أسد' });
  await all(bots, (s) => s.shared.phase === 'reveal' && s.shared.groups.length === 3 && s.shared.groups[0].ids.length === 2, 'the answers are grouped through the fold');
  check((await B.act('merge', { from: 'x', into: 'y' })).ok === false, 'only the host joins answers');
  const herdDog = A.state.shared.groups.find((g) => g.label === 'كلب');
  const herdLion = A.state.shared.groups.find((g) => g.label === 'أسد');
  await A.must('merge', { from: herdDog.key, into: herdLion.key });
  await all(bots, (s) => s.shared.groups.length === 2 && s.shared.groups.every((g) => g.ids.length === 2), 'the host joins two answers that mean the same');
  await A.must('unmerge');
  await all(bots, (s) => s.shared.groups.length === 3, 'and can put them back');
  await A.must('score');
  await all(bots, (s) => s.shared.phase === 'result' && !!s.shared.majorityKey && !s.shared.sheepId, 'the biggest group scores; two alone means no sheep');
  check(A.state.shared.scores[A.pid] === 1 && A.state.shared.scores[B.pid] === 1 && !A.state.shared.scores[C.pid], 'a point each for the herd');
  await A.must('nextRound');
  await all(bots, (s) => s.shared.phase === 'writing' && s.shared.round === 2 && s.shared.submitted.length === 0, 'the next question');
  await D.must('submit', { text: 'قديم', round: 1 });
  check(D.state.shared.submitted.length === 0, "an answer to last round's question is not filed under this one");
  for (const b of [A, B, C]) await b.must('submit', { text: 'موز' });
  await D.must('submit', { text: 'تفاح' });
  await all(bots, (s) => s.shared.phase === 'reveal', 'round two is revealed');
  await A.must('score');
  await all(bots, (s) => s.shared.phase === 'result' && s.shared.sheepId === D.pid && s.shared.scores[C.pid] === 1, 'the only one alone takes the sheep');
  await A.must('backToHub');

  /* --- العقل ------------------------------------------------------------------- */
  console.log('• the mind');
  await A.must('chooseGame', { game: 'mind' });
  await A.must('start', {});
  await all(bots, (s) => s.shared.phase === 'play' && s.shared.level === 1 && s.shared.lives === 4, 'mind: level 1, a heart per player');
  // The whole game is the numbers: a phone must see its own and nobody else's.
  const myCards = (bot) => ((bot.state.you || {}).cards || []).slice();
  check(bots.every((b) => myCards(b).length === 1), 'mind: one card each, on its own phone');
  for (const b of bots) {
    const mine = myCards(b)[0];
    const others = bots.filter((x) => x !== b);
    check(others.every((x) => !leaks(x, '"cards":[' + mine + ']')), 'mind: ' + b.name + "'s number is on no other phone");
  }
  check(bots.every((b) => Object.keys(b.state.shared.held).length === 4 &&
                          Object.values(b.state.shared.held).every((n) => n === 1)),
        'mind: shared says how many cards each holds, not which');

  const lowestBot = () => bots.filter((b) => myCards(b).length).sort((x, y) => myCards(x)[0] - myCards(y)[0])[0];
  const highestBot = () => bots.filter((b) => myCards(b).length).sort((x, y) => myCards(y)[0] - myCards(x)[0])[0];

  // Out of order on purpose: the highest card first.
  const wrongBot = highestBot();
  const beneath = bots.filter((b) => b !== wrongBot).map((b) => myCards(b)[0]).filter((n) => n < myCards(wrongBot)[0]).sort((a, b) => a - b);
  await wrongBot.must('play');
  await all(bots, (s) => s.shared.lives === 3, 'mind: playing out of order costs a heart');
  check(JSON.stringify(A.state.shared.discarded) === JSON.stringify(beneath), 'mind: and every lower card is shown to the table');
  check(bots.every((b) => !myCards(b).some((n) => n < A.state.shared.pile[0])), 'mind: nobody is left holding a card that was missed');

  // Everyone left plays in order: the level clears.
  for (let i = 0; i < 4 && A.state.shared.phase === 'play'; i++) {
    const up = lowestBot();
    if (!up) break;
    await up.must('play');
  }
  await all(bots, (s) => s.shared.phase === 'levelDone', 'mind: every card down clears the level');
  check(A.state.shared.lives === 3, 'mind: no further heart was lost');
  check((await B.act('nextLevel')).ok === false, 'mind: only the host deals the next level');
  await A.must('nextLevel');
  await all(bots, (s) => s.shared.phase === 'play' && s.shared.level === 2, 'mind: the next level deals one more card each');
  check(bots.every((b) => myCards(b).length === 2), 'mind: two cards each at level 2');
  check(bots.every((b) => JSON.stringify(myCards(b)) === JSON.stringify(myCards(b).slice().sort((x, y) => x - y))),
        'mind: a hand arrives sorted, so the first is always the lowest');
  await A.must('backToHub');

  /* --- قبل ولا بعد -------------------------------------------------------------- */
  console.log('• timeline');
  await A.must('chooseGame', { game: 'timeline' });
  await A.must('start', { lang: 'ar' });
  await all(bots, (s) => s.shared.phase === 'play' && s.shared.timeline.length === 1 && !!s.shared.turnId,
            'timeline: one card starts the line');
  const tlHand = (bot) => ((bot.state.you || {}).cards || []).slice();
  check(bots.every((b) => tlHand(b).length === A.state.shared.handSize), 'timeline: the same number of cards each');
  check(bots.every((b) => tlHand(b).every((c) => c.y === undefined && !!c.text)),
        'timeline: a hand arrives with the events on it but no years');
  // The one that matters: a card in a hand is on that phone and nowhere else.
  // Ids are compared exactly: "t1" is a substring of "t10", so a text search
  // would report a leak that is not there.
  for (const b of bots) {
    const ids = tlHand(b).map((c) => c.id);
    const others = bots.filter((x) => x !== b);
    check(others.every((x) => tlHand(x).every((c) => ids.indexOf(c.id) === -1)),
          'timeline: ' + b.name + "'s cards are on no other phone");
    check(b.state.shared.timeline.every((c) => ids.indexOf(c.id) === -1),
          'timeline: ' + b.name + "'s cards are not on the line either");
  }
  check(bots.every((b) => Object.keys(b.state.shared.hands).length === 4), 'timeline: shared says how many each holds');

  const tlUp = () => byId(bots, A.state.shared.turnId);
  const tlOther = bots.find((b) => b !== tlUp());
  check((await tlOther.act('place', { card: tlHand(tlOther)[0].id, at: 0 })).ok === false,
        'timeline: only the player up can place a card');
  check((await tlUp().act('place', { card: 'nope', at: 0 })).ok === false, 'timeline: and only a card they hold');

  // A placement at the front of the line. The bot cannot see the year, so what
  // is checked is that whichever way it goes, the table is left consistent.
  {
    const who = tlUp();
    const card = tlHand(who)[0];
    const lineWas = A.state.shared.timeline.length;
    const handWas = tlHand(who).length;
    await who.must('place', { card: card.id, at: 0 });
    await A.waitFor((s) => !!s.shared.last && s.shared.last.text === card.text, 'timeline: the placement reaches the table', 3000);
    const last = A.state.shared.last;
    check(typeof last.y === 'number' && last.name === who.name, 'timeline: the table is told what it was and who put it');
    if (last.right) {
      check(A.state.shared.timeline.length === lineWas + 1, 'timeline: a right card joins the line');
      check(A.state.shared.phase === 'gameover' || tlHand(who).length === handWas - 1,
            'timeline: and a right placement is one card off the hand');
    } else {
      check(A.state.shared.timeline.length === lineWas, 'timeline: a wrong card does not join the line');
      check(tlHand(who).length === handWas, 'timeline: and a replacement is drawn in its place');
    }
    check(A.state.shared.timeline.every((c, i, arr) => i === 0 || arr[i - 1].y <= c.y),
          'timeline: the line is still in order');
    check(A.state.shared.phase === 'gameover' || A.state.shared.turnId !== who.pid, 'timeline: the turn moves on');
  }

  if (A.state.shared.phase === 'play') {
    check((await B.act('skipTurn')).ok === false, 'timeline: only the host can skip a turn');
    const wasUp = A.state.shared.turnId;
    await A.must('skipTurn');
    await all(bots, (s) => s.shared.turnId !== wasUp, 'timeline: the host can move a stuck turn on');
  }
  await A.must('backToHub');

  /* --- مافيا ---------------------------------------------------------------------- */
  console.log('• mafia');
  await A.must('chooseGame', { game: 'mafia' });
  check((await A.act('start', { mode: 'roles' })).ok === false, 'mafia needs five players');
  const E = await Bot.join(A.code, 'Eve');
  const F = await Bot.join(A.code, 'فريدة');
  const six = [A, B, C, D, E, F];
  await all(six, (s) => s.players.length === 6, 'six players for mafia');
  await A.must('start', { mode: 'roles', revealRoles: false, discuss: 2, night: 30 });
  await all(six, (s) => s.shared.phase === 'roles' && !!(s.you && s.you.role), 'mafia: everyone has a role');
  const roleOf = (b) => b.state.you.role;
  const mafiosi = six.filter((b) => roleOf(b) === 'mafia');
  const doctor = six.find((b) => roleOf(b) === 'doctor');
  const detective = six.find((b) => roleOf(b) === 'detective');
  const lawyer = six.find((b) => roleOf(b) === 'lawyer');
  const citizens = six.filter((b) => roleOf(b) === 'citizen');
  check(mafiosi.length === 1 && !!doctor && !!detective && !!lawyer && citizens.length === 2, 'six players: one mafia, a doctor, a detective, a lawyer and two citizens');
  const boss = mafiosi[0];
  check(lawyer.state.you.mafia.length === 1 && lawyer.state.you.mafia[0].id === boss.pid, 'the lawyer knows who the mafia are');
  check(JSON.stringify(boss.state.you).indexOf(lawyer.pid) === -1, 'the mafia do not know the lawyer');
  check(JSON.stringify(citizens[0].state.you) === '{"role":"citizen"}' && !citizens[0].state.shared.roles, 'a citizen learns nothing about anyone');
  check((await B.act('startNight')).ok === false || B === A, 'only the host starts the night');
  await A.must('startNight');
  await all(six, (s) => s.shared.phase === 'night' && s.shared.night === 1 && !!s.shared.endsAt, 'night falls, with a clock');
  const victim = citizens[0];
  check((await boss.act('nightPick', { target: boss.pid })).ok === false, 'the mafia cannot pick themselves');
  await boss.must('nightPick', { target: victim.pid });
  await detective.must('nightPick', { target: lawyer.pid });
  await detective.waitFor((s) => (s.you.checks || []).some((c) => c.id === lawyer.pid && c.mafia === false), 'the detective sees the lawyer as not mafia');
  check((await detective.act('nightPick', { target: boss.pid })).ok === false, 'one check a night');
  await doctor.must('nightPick', { target: doctor.pid });
  check(JSON.stringify(citizens[1].state.you).indexOf(victim.pid) === -1 && JSON.stringify(doctor.state.you).indexOf(victim.pid) === -1, 'the target is not told to anyone else at night');
  for (const b of [lawyer, citizens[0], citizens[1]]) await b.must('nightPick', { target: detective.pid });
  await all(six, (s) => s.shared.phase === 'day' && s.shared.news.kind === 'out' && s.shared.news.id === victim.pid && s.shared.news.role === 'citizen', 'morning: the target left the game');
  const dayEnds = A.state.shared.endsAt;
  await A.must('moreTime');
  await A.waitFor((s) => s.shared.endsAt === dayEnds + 60000, 'the host adds a minute to the discussion');
  await A.must('startVote');
  await all(six, (s) => s.shared.phase === 'voting' && s.shared.vote.options.some((o) => o.id === 'nobody'), 'the vote opens, with nobody as an option');
  check((await victim.act('vote', { option: 'nobody' })).ok === false, 'a player out of the game cannot vote');
  check((await lawyer.act('vote', { option: lawyer.pid })).ok === false, 'nobody votes themselves out');
  for (const b of six.filter((x) => x !== victim)) await b.must('vote', { option: b === lawyer ? boss.pid : lawyer.pid });
  await all(six, (s) => s.shared.phase === 'dayResult' && s.shared.news.kind === 'voted' && s.shared.news.id === lawyer.pid && s.shared.news.role === 'citizen', 'the lawyer voted out shows as a citizen');
  await A.must('startNight');
  await all(six, (s) => s.shared.phase === 'night' && s.shared.night === 2, 'the second night');
  check((await doctor.act('nightPick', { target: doctor.pid })).ok === false, 'the doctor cannot protect the same person two nights running');
  check((await lawyer.act('nightPick', { target: boss.pid })).ok === false, 'someone out of the game does nothing at night');
  await boss.must('nightPick', { target: citizens[1].pid });
  await doctor.must('nightPick', { target: citizens[1].pid });
  await detective.must('nightPick', { target: boss.pid });
  await detective.waitFor((s) => (s.you.checks || []).some((c) => c.id === boss.pid && c.mafia === true), 'the detective finds the mafia');
  await citizens[1].must('nightPick', { target: detective.pid });
  await all(six, (s) => s.shared.phase === 'day' && s.shared.news.kind === 'saved' && s.shared.alive.length === 4, 'the doctor saves the target');
  await A.must('startVote');
  for (const b of [boss, doctor, detective, citizens[1]]) await b.must('vote', { option: b === boss ? detective.pid : boss.pid });
  await all(six, (s) => s.shared.phase === 'gameover' && s.shared.winner === 'town' && s.shared.roles.length === 6, 'the mafia voted out: the town wins and every role is shown');
  check(A.state.shared.news.role === 'mafia', 'a mafia member always shows as mafia');
  check(six.every((b) => (A.state.shared.scores[b.pid] || 0) === (['mafia', 'lawyer'].indexOf(roleOf(b)) !== -1 ? 0 : 1)), 'a point to each winner, none to the mafia or the lawyer');
  await A.must('backToHub');
  for (const b of [E, F]) { await api('/leave', { code: A.code, pid: b.pid, key: b.key }); b.close(); }
  await A.waitFor((s) => s.players.length === 4, 'the two extra players leave');

  /* --- سكرو ------------------------------------------------------------------------ */
  console.log('• skrew (classic, the thief vote, partners, المسحراتي with أوسكار, an empty hand, sudden death, the house rules, leaving)');
  const { SKREW_CARDS, skrewMatches, skrewValue, skrewHandValues } = SKREW;
  const skTV = await Bot.join(A.code, '', true);
  let skBots = [A, B, C, D];
  let skView = [A, B, C, D, skTV];
  // What the table could know: slot id -> card, from the robots' own slices and
  // the cards the table sees; which slots are face up for everyone; which cards
  // the whole table saw face up and went back face down (`pub`, what each
  // slot's h.known must say); and anything that reached a phone it shouldn't have.
  const sk = {};
  const skReset = () => Object.assign(sk, { known: {}, shown: new Set(), pub: {}, drawn: {}, seenKey: {}, ev: 0, privacy: [], expScores: {}, discards: [], reshuffles: 0 });
  skReset();
  const skUntil = (bot, pred, ms = 6000) => new Promise((resolve) => {
    let timer = null;
    const test = () => {
      let ok = false;
      try { ok = !!(bot.state && pred(bot.state)); } catch (e) {}
      if (ok) { clearTimeout(timer); bot.watchers.delete(test); resolve(true); }
      return ok;
    };
    if (test()) return;
    timer = setTimeout(() => { bot.watchers.delete(test); resolve(false); }, ms);
    bot.watchers.add(test);
  });
  const sks = () => skBots[0].state.shared;
  const skHand = (pid) => (sks().hands || {})[pid] || [];
  const skUp = () => byId(skBots, sks().turn.pid);
  const skProtected = (id) => {
    const s = sks();
    return !!s.caller && (id === s.caller || !!(s.teams && s.teams.some((t) => t.includes(s.caller) && t.includes(id))));
  };
  const skSettle = (version) => Promise.all(skView.map((b) => skUntil(b, (s) => s.version >= version)));
  const SK_NO_CARD = ['deal', 'ready', 'draw', 'peekOwn', 'spyOther', 'blindSwap', 'give', 'seeSwap', 'penalty', 'khoshaf', 'allAround', 'cannon', 'scream', 'ping', 'wakeUp', 'skip', 'screw', 'asYouLike',
    'finish', 'lastLap', 'pass', 'thiefVote', 'accuse', 'boom', 'thiefSteal', 'stealSwap'];

  const skLearn = () => {
    const s = sks();
    const trade = (map, a, b) => {
      const x = map[a], y = map[b];
      if (y === undefined) delete map[a]; else map[a] = y;
      if (x === undefined) delete map[b]; else map[b] = x;
    };
    const swap = (a, b) => {
      trade(sk.known, a, b);
      trade(sk.pub, a, b);
      const sa = sk.shown.has(a), sb = sk.shown.has(b);
      sk.shown.delete(a); sk.shown.delete(b);
      if (sa) sk.shown.add(b);
      if (sb) sk.shown.add(a);
    };
    for (const e of s.events || []) {
      if (e.seq <= sk.ev) continue;
      sk.ev = e.seq;
      if (SK_NO_CARD.includes(e.type) && 'card' in e) sk.privacy.push(`a ${e.type} event carries a card`);
      switch (e.type) {
        case 'deal': sk.known = {}; sk.shown = new Set(); sk.pub = {}; sk.drawn = {}; sk.seenKey = {}; sk.discards = []; sk.reshuffles = 0; break;
        case 'discard': sk.discards.push(e.card); break;
        case 'reshuffle': sk.reshuffles++; break;
        case 'boomThrow': delete sk.known[e.slot]; delete sk.pub[e.slot]; sk.shown.delete(e.slot); break;
        case 'scream':
          // Dealt again blind: nothing about those hands is known any more (an exposed hand shows again below).
          for (const id of Object.keys(e.counts || {})) for (const h of skHand(id)) { delete sk.known[h.id]; delete sk.pub[h.id]; sk.shown.delete(h.id); }
          break;
        case 'thiefVote': if (Object.keys(e).sort().join() !== 'pid,seq,type') sk.privacy.push('a thiefVote event carries more than who voted'); break;
        case 'keep': sk.known[e.slot] = sk.drawn[e.pid]; delete sk.pub[e.slot]; sk.shown.delete(e.slot); break;
        case 'takePile': sk.known[e.slot] = e.card; sk.pub[e.slot] = e.card; sk.shown.delete(e.slot); break;
        case 'match': case 'pong': case 'basra':
          // Wrong, the card turned up for everyone and went back face down in its slot.
          if (e.ok) { delete sk.known[e.slot]; delete sk.pub[e.slot]; sk.shown.delete(e.slot); } else { sk.known[e.slot] = e.card; sk.pub[e.slot] = e.card; }
          break;
        case 'blindSwap': case 'stealSwap': swap(e.slot, e.slot2); break;
        case 'seeSwap': if (e.swapped) swap(e.slot, e.slot2); break;
        case 'give':
          if (e.slot in sk.known) sk.known[e.slot2] = sk.known[e.slot];
          if (e.slot in sk.pub) sk.pub[e.slot2] = sk.pub[e.slot];
          delete sk.known[e.slot];
          delete sk.pub[e.slot];
          if (sk.shown.delete(e.slot)) sk.shown.add(e.slot2);
          break;
      }
    }
    const t = s.phase === 'play' && s.turn ? s.turn : {};
    for (const b of skBots) {
      const you = b.state.you;
      if (!(s.order || []).includes(b.pid)) continue;
      if (!you) { sk.privacy.push(`${b.name} has no slice`); continue; }
      (you.memorize || []).forEach((m) => { sk.known[m.slot] = m.card; });
      const key = JSON.stringify(you.seen);
      if (you.seen && sk.seenKey[b.pid] !== key) you.seen.forEach((m) => { sk.known[m.slot] = m.card; });
      sk.seenKey[b.pid] = key;
      if (you.drawn) sk.drawn[b.pid] = you.drawn;
      const up = t.pid === b.pid;
      if (you.drawn && !(up && t.stage === 'drawn')) sk.privacy.push(`${b.name} holds a drawn card off their turn`);
      if (you.khoshaf && !(up && t.stage === 'khoshaf')) sk.privacy.push(`${b.name} holds الخشاف off their turn`);
      if (you.memorize && (s.phase !== 'memorize' || you.memorize.some((m) => !skHand(b.pid).some((h) => h.id === m.slot)))) sk.privacy.push(`${b.name} memorizes out of place`);
    }
    if (skView.some((b) => b.state.youAreScreen && b.state.you !== null)) sk.privacy.push('a screen has a slice');
    // بوم waiting on phones: who has picked is public, which card is not.
    if (s.boom && Object.keys(s.boom).sort().join() !== 'picked,waiting') sk.privacy.push('shared.boom says more than who has picked');
    // The thief vote: who voted is public, what they voted reaches no phone before the close.
    if (s.phase === 'thiefGuess' && skView.some((b) => JSON.stringify(b.state).indexOf('"votes"') !== -1)) sk.privacy.push('a vote is on a phone before the close');
    // Face up: only an exposed hand (the cannon), or everything at the reveal. A slot's story
    // (h) names a card only when the whole table saw that card face up (sk.pub).
    const revealed = s.phase === 'reveal' || s.phase === 'gameover';
    const HOWS = ['deal', 'deck', 'pile', 'penalty', 'swap', 'give', 'scream', 'khoshaf'];
    for (const pid of s.order || []) {
      const exposed = (s.exposed || []).includes(pid);
      for (const h of skHand(pid)) {
        if (exposed) sk.shown.add(h.id);
        if (h.up) sk.known[h.id] = h.up;
        if (!!h.up !== (revealed || sk.shown.has(h.id))) sk.privacy.push(`slot ${h.id}: up ${h.up} in ${s.phase}`);
        if (!h.h || !HOWS.includes(h.h.how) || !Array.isArray(h.h.looks) || typeof h.h.at !== 'number') sk.privacy.push(`slot ${h.id}: no story`);
        else if (h.h.known !== (sk.pub[h.id] || null)) sk.privacy.push(`slot ${h.id}: h.known ${h.h.known}, the table saw ${sk.pub[h.id] || 'nothing'}`);
      }
    }
  };

  const skDo = async (bot, action, payload = {}) => {
    const res = await bot.act(action, Object.assign({ seq: bot.state.shared.turnSeq }, payload));
    if (!res.ok) throw new Error(`skrew: ${bot.name} ${action} ${JSON.stringify(payload)}: ${res.error}`);
    await skSettle(res.state.version);
    skLearn();
    return res;
  };
  // A move that should be refused: false when it was.
  const skTry = async (bot, action, payload = {}) => {
    const res = await bot.act(action, Object.assign({ seq: bot.state.shared.turnSeq }, payload));
    if (res.ok) { await skSettle(res.state.version); skLearn(); }
    return res.ok;
  };
  const skStart = async (opts) => {
    await A.must('chooseGame', { game: 'screw' });
    const res = await A.must('start', opts);
    skReset();
    await skSettle(res.state.version);
    skLearn();
  };
  // The next round, or a new game when this one ended before everything wanted came up.
  const skOnward = async () => {
    if (sks().phase === 'reveal') return skNext();
    if (sks().phase !== 'gameover') return;
    const res = await A.must('playAgain', {});
    await skSettle(res.state.version);
    skLearn();
  };
  const skReadyAll = async () => { for (const b of skBots) if (sks().phase === 'memorize') await skDo(b, 'ready'); };
  const skNext = async () => {
    const res = await A.must('nextRound', { round: sks().round, seq: sks().turnSeq });
    await skSettle(res.state.version);
    skLearn();
  };
  const skPrivacy = (label) => check(!sk.privacy.length, `skrew ${label}: no card ever face up, or on a phone, where it shouldn't be` + (sk.privacy.length ? ' - ' + sk.privacy.slice(0, 3).join('; ') : ''));

  /**
   * The round's score worked out again from the revealed hands, against the
   * server's: hand values (a life jacket copying), units, the round scores
   * (a finisher, a caller who ties or is beaten, or neither), then the thief
   * from the published votes.
   */
  const skCheckRound = (label) => {
    const s = sks();
    const r = s.results;
    const ids = Object.keys(r.hands);
    const per = {};
    const vals = {};
    ids.forEach((id) => { per[id] = skrewHandValues(r.hands[id]); vals[id] = per[id].reduce((n, v) => n + v, 0); });
    const handsShown = ids.every((id) => JSON.stringify(r.hands[id]) === JSON.stringify(skHand(id).map((h) => h.up)));
    const valuesShown = ids.every((id) => JSON.stringify(r.values[id]) === JSON.stringify(per[id]));
    const units = s.teams ? s.teams.map((team, i) => ({ key: 'AB'[i], ids: team.filter((id) => ids.includes(id)) })) : ids.map((id) => ({ key: id, ids: [id] }));
    const keys = units.map((u) => u.key);
    const unitOf = (id) => (units.find((u) => u.ids.includes(id)) || {}).key || null;
    const tot = {};
    units.forEach((u) => { tot[u.key] = u.ids.reduce((n, id) => n + vals[id], 0); });
    const cu = r.caller ? unitOf(r.caller) : null;
    const fu = r.finisher ? unitOf(r.finisher) : null;
    const exp = Object.assign({}, tot);
    const lowestOf = (list) => { const m = Math.min(...list.map((k) => tot[k])); return list.filter((k) => tot[k] === m); };
    let low;
    let dbl = false;
    if (fu) { low = [fu]; dbl = !!(cu && cu !== fu); }
    else if (cu) {
      const others = keys.filter((k) => k !== cu);
      if (others.every((k) => tot[k] >= tot[cu])) low = [cu];
      else { low = lowestOf(others); dbl = true; }
    } else low = lowestOf(keys);
    if (dbl) exp[cu] = tot[cu] + vals[r.caller];   // only the caller's own hand is doubled (in teams, added to the partners')
    low.forEach((k) => { exp[k] = 0; });
    let thiefOk = r.thief === null;
    let note = '';
    if (s.settings.groups.includes('thief') && r.thief === null) {
      // سرقة الحرامي: no vote, which is only right when nobody could hold the thief.
      thiefOk = !!s.settings.thiefSteal && !ids.some((id) => r.hands[id].includes('thief'));
      note = ', no vote: nobody could hold the thief';
    } else if (s.settings.groups.includes('thief')) {
      const th = r.thief || {};
      const holder = ids.find((id) => r.hands[id].includes('thief')) || null;
      const votes = th.votes || {};
      const voters = Object.keys(votes);
      const keyOf = (v) => (v === null ? '' : v);
      let accused = null;
      if (voters.length) {
        const count = {};
        voters.forEach((v) => { count[keyOf(votes[v])] = (count[keyOf(votes[v])] || 0) + 1; });
        const most = Math.max(...Object.values(count));
        const top = Object.keys(count).filter((k) => count[k] === most);
        if (top.length === 1) accused = top[0] || null;
        else if (r.caller && r.caller in votes && top.includes(keyOf(votes[r.caller]))) accused = votes[r.caller];
      }
      let caught = false;
      let stole = false;
      let victims = [];
      if (holder) {
        const hk = unitOf(holder);
        if (accused === holder) { exp[hk] += 25; caught = true; }
        else {
          const m = Math.min(...keys.map((k) => exp[k]));
          if (exp[hk] !== m) {
            victims = keys.filter((k) => exp[k] === m);
            victims.forEach((k) => { exp[k] += 25; });
            exp[hk] = m;
            stole = true;
          }
        }
      }
      thiefOk = !!r.thief && th.holder === holder && th.accused === accused && th.caught === caught && th.stole === stole &&
        th.victims.slice().sort().join() === victims.slice().sort().join() && th.skipped === !voters.length;
      note = !holder ? ', nobody held the thief' : caught ? ', the thief caught' : stole ? ', the thief stole the lowest' : ', the thief already lowest';
    }
    units.forEach((u) => u.ids.forEach((id) => { sk.expScores[id] = (sk.expScores[id] || 0) + exp[u.key]; }));
    const ok = handsShown && valuesShown && thiefOk && units.every((u) => r.round[u.key] === exp[u.key] && u.ids.every((id) => r.round[id] === exp[u.key])) &&
      r.callerDouble === dbl;
    const how = fu ? 'a finisher: 0' + (dbl ? ', the caller doubled' : '') : cu ? (low.includes(cu) ? 'the caller lowest or tied: 0' : 'the caller beaten: doubled') : 'no caller';
    check(ok, `${label}: every hand face up and scored as the rules say (${how}${note})`);
  };

  /** A power the player up has just been offered, used (and checked the first time, while it is in `want`), or skipped. */
  const skPower = async (bot, power, want) => {
    const me = bot.pid;
    const s = sks();
    const mine = skHand(me);
    const others = s.order.filter((id) => id !== me && skHand(id).length);
    // After سكرو the caller's hand, and in teams their partners', is off limits.
    const open = others.filter((id) => !skProtected(id));
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const slices = () => skBots.filter((b) => b !== bot).map((b) => JSON.stringify(b.state.you)).join('|');
    const before = slices();
    const same = () => slices() === before && skTV.state.you === null;
    const evFrom = sks().eventSeq;
    const evs = (type) => sks().events.filter((e) => e.seq > evFrom && e.type === type);
    const checking = want.has(power);
    const inner = checking && power !== 'asYouLike';
    let use = power;
    let extra = {};
    if (power === 'asYouLike') {
      use = open.length && mine.length ? 'give' : 'basra';
      extra = { as: use };
    }
    const ids = (pid) => skHand(pid).map((h) => h.id).join();
    const run = async () => {
      switch (use) {
        case 'peekOwn': {
          if (!mine.length) return false;
          const slot = mine[mine.length - 1].id;
          await skDo(bot, 'power', { slot });
          const seen = bot.state.you.seen || [];
          if (inner) check(seen.length === 1 && seen[0].pid === me && seen[0].slot === slot && !!seen[0].card && evs('peekOwn').length === 1 && same() &&
            skHand(me).find((h) => h.id === slot).h.looks.includes(me),
            'skrew: 7/8 peek: your own card on your phone alone; the table sees only which slot, and that you looked');
          return true;
        }
        case 'spyOther': {
          if (!others.length) return false;
          const target = pick(others);
          const slot = skHand(target)[0].id;
          await skDo(bot, 'power', { target, slot });
          const seen = bot.state.you.seen || [];
          if (inner) check(seen.length === 1 && seen[0].pid === target && seen[0].slot === slot && !!seen[0].card && evs('spyOther')[0].target === target && same() &&
            skHand(target).find((h) => h.id === slot).h.looks.includes(me),
            "skrew: 9/10 spy: one card of another player, on the spy's phone alone (not on its owner's); the card's story says who looked");
          return true;
        }
        case 'blindSwap': {
          if (!open.length || !mine.length) return false;
          const target = pick(open);
          const slot = mine[0].id;
          const slot2 = skHand(target)[0].id;
          const mineIds = ids(me), theirIds = ids(target);
          await skDo(bot, 'power', { slot, target, slot2 });
          const ev = evs('blindSwap')[0];
          if (inner) check(ev && ev.pid === me && ev.slot === slot && ev.target === target && ev.slot2 === slot2 && ids(me) === mineIds && ids(target) === theirIds && same(),
            'skrew: خد وهات: the table sees which two slots traded, the slots stay put, nobody sees a card');
          return true;
        }
        case 'basra': {
          if (!mine.length) return false;
          const e = mine.find((h) => sk.known[h.id] && sk.known[h.id] !== 'red25' && sk.known[h.id] !== 'thief') || mine[0];
          const n = mine.length;
          await skDo(bot, 'power', Object.assign({ slot: e.id }, extra));
          const ev = evs('basra')[0];
          if (inner) check(ev && ev.ok === (ev.card !== 'red25' && ev.card !== 'thief') &&
            (ev.ok ? skHand(me).length === n - 1 && sks().pile.slice(-1)[0] === ev.card : skHand(me).find((h) => h.id === e.id).h.known === ev.card && !skHand(me).find((h) => h.id === e.id).up),
            'skrew: بصرة throws one of your cards face up (the red screw or the thief go back face down, known)');
          return true;
        }
        case 'allAround': {
          const payload = others.length
            ? { picks: others.map((id) => ({ target: id, slot: skHand(id)[skHand(id).length - 1].id })) }
            : { own: mine.slice(0, 2).map((h) => h.id) };
          await skDo(bot, 'power', payload);
          const seen = bot.state.you.seen || [];
          if (inner) check((payload.picks
            ? seen.length === payload.picks.length && seen.every((x, i) => x.pid === payload.picks[i].target && x.slot === payload.picks[i].slot && !!x.card)
            : seen.length === payload.own.length) && same(), 'skrew: كعب داير: a card of every other player, on this phone alone');
          return true;
        }
        case 'give': {
          if (!open.length || !mine.length) return false;
          const target = pick(open);
          const slot = mine[0].id;
          const n = mine.length, m = skHand(target).length;
          await skDo(bot, 'power', Object.assign({ slot, target }, extra));
          const ev = evs('give')[0];
          const theirs = skHand(target);
          if (inner) check(ev && ev.slot === slot && ev.target === target && skHand(me).length === n - 1 && theirs.length === m + 1 && theirs[m].id === ev.slot2 && same(),
            'skrew: خد بس: your card goes into a new slot at the end of their hand, unseen');
          return true;
        }
        case 'seeSwap': {
          if (!open.length) return false;
          const target = pick(open);
          const slot = skHand(target)[0].id;
          await skDo(bot, 'power', { target, slot });
          const t = sks().turn;
          const seen = bot.state.you.seen || [];
          const looked = t.stage === 'seeSwap' && t.look.target === target && t.look.slot === slot && seen.length === 1 && seen[0].slot === slot && !!seen[0].card && same();
          const mineNow = skHand(me);
          await skDo(bot, 'seeSwapDo', mineNow.length ? { slot: mineNow[0].id } : {});
          const ev = evs('seeSwap')[0];
          if (inner) check(looked && ev && ev.target === target && ev.slot === slot && ev.swapped === !!mineNow.length && bot.state.you.seen === null,
            'skrew: شوف وبدّل: a look on your phone alone, then a swap the table sees');
          return true;
        }
        case 'cannon': {
          const fresh = open.filter((id) => !(sks().exposed || []).includes(id));
          if (!fresh.length) return false;
          const target = pick(fresh);
          await skDo(bot, 'power', { target });
          if (inner) check(sks().exposed.includes(target) && skView.every((b) => b.state.shared.hands[target].every((h) => !!h.up)) && evs('cannon')[0].target === target,
            'skrew: المدفع: their hand is face up on every phone and the screen');
          return true;
        }
        case 'khoshaf': {
          await skDo(bot, 'power', {});
          if (!(sks().turn && sks().turn.pid === me && sks().turn.stage === 'khoshaf')) return true;   // nothing left to show
          const four = bot.state.you.khoshaf || [];
          const deck = sks().deckCount;
          if (inner) check(sks().turn.stage === 'khoshaf' && four.length >= 1 && four.length <= 4 && same() && evs('khoshaf').length === 1,
            'skrew: الخشاف: the top cards of the deck on this phone alone');
          await skDo(bot, 'khoshafPick', { index: 0 });
          const t = sks().turn;
          if (sks().phase === 'play' && t && t.pid === me && t.stage === 'drawn') {
            if (inner) check(bot.state.you.drawn === four[0] && sks().deckCount === deck + four.length - 1, 'skrew: the one picked is in hand, the rest go under the deck');
            if (SKREW_CARDS[four[0]].drawn === 'keep') await skDo(bot, 'keep', skHand(me).length ? { slot: skHand(me)[0].id } : {});
            else {
              await skDo(bot, 'discard');
              const tt = sks().turn;
              const offered = !!(tt && tt.pid === me && tt.stage === 'power');
              const info = SKREW_CARDS[four[0]];
              if (inner) check(offered === !!(info.power && !info.drawn), 'skrew: a card picked from الخشاف and thrown uses its power, like a card drawn from the deck');
              if (offered) await skDo(bot, 'skipPower');
            }
          }
          return true;
        }
      }
      return false;
    };
    if (!(await run())) { await skDo(bot, 'skipPower'); return; }
    want.delete(power);
    if (checking && power === 'asYouLike') check(evs('asYouLike').length === 1 && evs('asYouLike')[0].as === use && evs(use).length === 1, `skrew: على كيفك used as ${use}`);
  };

  /**
   * بوم and صرخة أوسكار fire the moment they come off the deck (the owner,
   * 20 Sep 2026), so what they did is checked here rather than in skPower -
   * and against a picture of the table taken before the draw.
   */
  const skSlotIds = (pid) => skHand(pid).map((h) => h.id).join();

  const skForced = async (bot, want, snap, evFrom) => {
    const me = bot.pid;
    const s = sks();
    if (s.phase !== 'play' || !s.turn || s.turn.pid !== me) return;
    const evs = (type) => sks().events.filter((e) => e.seq > evFrom && e.type === type);
    const scream = evs('scream')[0];
    const boom = evs('boom')[0];
    if (scream) {
      const inner = want.has('scream');
      want.delete('scream');
      if (inner) check(scream.pid === me && Object.keys(scream.counts).length === snap.circle.length &&
        snap.circle.every((id, i) => scream.counts[id] === snap.counts[i] && skHand(id).length === snap.counts[i]) &&
        sks().order.every((id, i) => skSlotIds(id) === snap.ids[i]) &&
        snap.circle.every((id) => skHand(id).every((h) => h.h.how === 'scream' && h.h.by === me && h.h.known === null && h.h.looks.length === 0 && !!h.up === snap.exposed.includes(id))) &&
        skBots.every((b) => !b.state.you || b.state.you.seen === null) && sks().turn && sks().turn.pid === me && sks().turn.stage === 'choose',
        'skrew: صرخة أوسكار fires on the draw: every hand dealt again blind, the same count and slots each, nobody knows a card, and the turn stays with the player');
      return;
    }
    if (!boom) return;
    const inner = want.has('boom');
    want.delete('boom');
    const b = sks().boom;
    if (inner) check(!!(await skTry(bot, 'keep', { slot: skHand(me)[0] && skHand(me)[0].id })) === false &&
      (await skTry(bot, 'discard', {})) === false && (await skTry(bot, 'skipPower', {})) === false,
      'skrew: بوم cannot be kept, thrown or skipped - it fired on the draw');
    if (!b) return;                // nobody left to pick: the player's new turn came at once
    if (inner) {
      check(sks().turn.stage === 'boom' && sks().turn.pid === me && b.waiting.join() === snap.expect.join() && b.picked.length === 0 &&
        Object.keys(boom).sort().join() === 'pid,seq,type' &&
        skView.every((v) => JSON.stringify(v.state.shared.boom) === JSON.stringify(b)),
        'skrew: بوم: every other player with cards has to pick one of their own, and every phone and the screen see who');
      check((await skTry(skTV, 'boomPick', { slot: skHand(snap.expect[0])[0].id })) === false,
        'skrew: the screen picks nothing');
    }
    const seq = sks().turnSeq;
    const picks = {};
    const sent = await Promise.all(b.waiting.map((id) => {
      const hand = skHand(id);
      const slot = (hand.find((h) => sk.known[h.id] && skrewValue(sk.known[h.id]) >= 10) || hand[hand.length - 1]).id;
      picks[id] = slot;
      return byId(skBots, id).act('boomPick', { seq, slot });
    }));
    await skSettle(Math.max(...sent.map((x) => (x.ok ? x.state.version : 0))));
    skLearn();
    const thrown = sks().events.filter((e) => e.seq > evFrom && e.type === 'boomThrow');
    const ended = sks().phase !== 'play';
    if (inner) check(sent.every((x) => x.ok) && thrown.map((e) => e.pid).join() === snap.expect.join() &&
      thrown.every((e) => e.slot === picks[e.pid] && !!e.card && !skHand(e.pid).some((h) => h.id === e.slot)) &&
      sks().pile.slice(-thrown.length).join() === thrown.map((e) => e.card).join() &&
      (ended ? !!(sks().results && sks().results.finisher) : snap.expect.every((id) => skHand(id).length === snap.sizes[id] - 1) && sks().turn.pid === me && sks().turn.stage === 'choose' && sks().boom === null),
      'skrew: بوم: every phone picks at once, the cards go up together in seat order after the player, and the turn stays with the player');
  };

  /** The player up draws, then keeps (a card that must be kept, or when asked) or throws it, using a power in `want`. */
  const skDrawTurn = async (want, keep = false) => {
    const bot = skUp();
    const me = bot.pid;
    if (!sks().deckCount && (sks().settings.suddenDeath || sks().pile.length <= 1)) { await skDo(bot, 'pass'); return; }
    // The picture the two forced powers are judged against.
    const at = sks().order.indexOf(me);
    const circle = sks().order.filter((id) => !skProtected(id));
    const expect = sks().order.slice(at + 1).concat(sks().order.slice(0, at)).filter((id) => !skProtected(id) && skHand(id).length);
    const sizes = {};
    expect.forEach((id) => { sizes[id] = skHand(id).length; });
    const snap = { circle: circle, counts: circle.map((id) => skHand(id).length), ids: sks().order.map(skSlotIds),
                   exposed: (sks().exposed || []).slice(), expect: expect, sizes: sizes };
    const forcedFrom = sks().eventSeq;
    await skDo(bot, 'draw');
    const s = sks();
    if (s.phase !== 'play' || !s.turn || s.turn.pid !== me || s.turn.stage !== 'drawn') {
      await skForced(bot, want, snap, forcedFrom);   // it played itself
      return;
    }
    const card = bot.state.you.drawn;
    const info = SKREW_CARDS[card];
    if (info.drawn === 'keep' || (keep && info.drawn !== 'discard') || card === 'lifeJacket') {
      await skDo(bot, 'keep', skHand(me).length ? { slot: skHand(me)[0].id } : {});
      return;
    }
    await skDo(bot, 'discard');
    const t = sks().turn;
    if (t && t.pid === me && t.stage === 'power') {
      if (want.has(info.power)) await skPower(bot, info.power, want);
      else await skDo(bot, 'skipPower');
    }
  };

  // 1. Classic, four players: the deal, every move, every base power, سكرو, three rounds.
  await skStart({ edition: 'classic', rounds: 3, screwFromLap: 1, turnClock: 0 });
  await all(skView, (s) => s.game === 'screw' && s.shared.phase === 'memorize' && s.shared.round === 1 && s.shared.order.length === 4, 'skrew: dealt to four, everyone memorizing');
  check(skBots.every((b) => b.state.you && b.state.you.memorize.length === 2 && b.state.you.memorize.every((m, i) => m.slot === skHand(b.pid)[2 + i].id && !!m.card)),
    'skrew: each phone memorizes its own slots 3 and 4');
  check(sks().order.every((id) => skHand(id).length === 4 && skHand(id).every((h) => h.up === null)) && sks().pile.length === 1 && sks().deckCount === 42 && sks().settings.basraCount === 4,
    'skrew: four face-down slots each, one card on the pile, 42 in the deck (four بصرة by default)');
  check(skTV.state.you === null && skTV.state.shared.hands && Object.keys(skTV.state.shared.hands).length === 4, 'skrew: the screen sees the table and gets no slice');
  check((await B.act('beginRound', {})).ok === false, 'skrew: only the host starts a round without waiting');
  for (const b of skBots) await skDo(b, 'ready');
  check(sks().phase === 'play' && sks().turn.stage === 'choose' && sks().turn.pid === sks().order[0] && skBots.every((b) => b.state.you.memorize === null),
    'skrew: everyone memorized: the first seat is up and the cards are hidden again');
  {
    const bot = skUp();
    const other = skBots.find((b) => b !== bot);
    check((await skTry(other, 'draw')) === false, 'skrew: only the player up draws');
    check((await skTry(other, 'match', { slot: skHand(other.pid)[0].id })) === false, 'skrew: a card is thrown on your own turn only');
    const seq0 = sks().turnSeq;
    await skDo(bot, 'draw');
    const card = bot.state.you.drawn;
    check(!!card && sks().turn.stage === 'drawn' && sks().turnSeq === seq0 + 1, 'skrew: a draw moves the turn on to its next stage');
    check(skBots.every((b) => b === bot || JSON.stringify(b.state.you) === '{"memorize":null,"drawn":null,"seen":null,"khoshaf":null}') && skTV.state.you === null &&
      !('card' in sks().events.slice(-1)[0]), "skrew: the drawn card reaches the drawer's phone only; the draw event doesn't carry it");
    const stale = await bot.act('draw', { seq: seq0 });
    await skSettle(stale.state.version);
    check(stale.ok && sks().turn.stage === 'drawn' && bot.state.you.drawn === card && sks().deckCount === 41, 'skrew: a tap with a stale seq is dropped quietly');
    check(!SKREW_CARDS.plus20.drawn && !SKREW_CARDS.red25.drawn, 'skrew: a +20 or a red screw carries no rule when drawn: kept or thrown like any card (the owner, 17 Sep 2026)');
    if (SKREW_CARDS[card].drawn === 'play') {
      // بينج or المسحراتي played itself on the draw; nothing to keep.
    } else {
      const slot = skHand(bot.pid)[0].id;
      check((await skTry(bot, 'keep', { slot: skHand(other.pid)[0].id })) === false, 'skrew: a card is kept in your own slot only');
      await skDo(bot, 'keep', { slot });
      const ev = sks().events.filter((e) => e.type === 'keep').pop();
      check(ev.pid === bot.pid && ev.slot === slot && sks().pile.slice(-1)[0] === ev.card && sks().turn.pid !== bot.pid && skHand(bot.pid).length === 4 && sk.known[slot] === card && skHand(bot.pid)[0].up === null,
        'skrew: keep puts it face down in the slot, the old card goes face up on the pile');
      const h = skHand(bot.pid)[0].h;
      check(skView.every((b) => { const x = b.state.shared.hands[bot.pid][0].h; return x.how === 'deck' && x.by === bot.pid && x.known === null && x.looks.join() === bot.pid && x.at === ev.seq; }) && h.from === null,
        "skrew: every phone and the screen see the slot's story: kept from the deck, looked at by its drawer only");
    }
  }
  const want1 = new Set(['takePile', 'matchRight', 'matchWrong', 'peekOwn', 'spyOther', 'blindSwap', 'basra', 'allAround']);
  const skClassicTurn = async () => {
    const bot = skUp();
    const me = bot.pid;
    const s = sks();
    const top = s.pile[s.pile.length - 1];
    const hand = skHand(me);
    const knownHere = hand.filter((h) => sk.known[h.id]);
    const right = knownHere.find((h) => skrewMatches(top, sk.known[h.id]));
    const wrong = knownHere.find((h) => !skrewMatches(top, sk.known[h.id]));
    if (want1.has('matchRight') && right) {
      const card = sk.known[right.id];
      await skDo(bot, 'match', { slot: right.id });
      const ev = sks().events.filter((e) => e.type === 'match').pop();
      check(ev.ok === true && ev.card === card && skHand(me).length === hand.length - 1 && !skHand(me).some((h) => h.id === right.id) && sks().pile.slice(-1)[0] === card && sks().turn.pid !== me,
        'skrew: a card that matches the pile leaves the hand, and the turn ends');
      want1.delete('matchRight');
      return;
    }
    if (want1.has('matchWrong') && wrong) {
      const card = sk.known[wrong.id];
      await skDo(bot, 'match', { slot: wrong.id });
      const ev = sks().events.filter((e) => e.type === 'match').pop();
      const pen = sks().events.filter((e) => e.type === 'penalty').pop();
      const after = skHand(me);
      const last = after[after.length - 1];
      check(ev.ok === false && ev.card === card && after.length === hand.length + 1 && pen && pen.pid === me && pen.slot === last.id && last.up === null && sks().turn.pid !== me &&
        last.h.how === 'penalty' && last.h.looks.length === 0 && bot.state.you.drawn === null && JSON.stringify(bot.state.you.seen || []).indexOf(last.id) === -1,
        'skrew: a wrong throw goes back into its slot and a penalty card comes blind, face down, at the end - its owner doesn\'t see it either');
      check(skView.every((b) => { const x = b.state.shared.hands[me].find((h) => h.id === wrong.id); return x.up === null && x.h.known === card; }),
        'skrew: every phone and the screen see the wrong card back face down, and know it');
      want1.delete('matchWrong');
      return;
    }
    if (want1.has('takePile') && hand.length) {
      const slot = hand[hand.length - 1].id;
      await skDo(bot, 'takePile', { slot });
      const ev = sks().events.filter((e) => e.type === 'takePile').pop();
      check(ev.pid === me && ev.card === top && ev.slot === slot && skHand(me).find((h) => h.id === slot).up === null && sk.known[slot] === top && sks().turn.pid !== me,
        "skrew: taking the pile puts its top card face down in the slot, and the slot's card goes on the pile");
      check(skView.every((b) => { const x = b.state.shared.hands[me].find((h) => h.id === slot).h; return x.how === 'pile' && x.by === me && x.known === top; }),
        'skrew: a card taken from the pile is known to every phone and the screen (h.known)');
      want1.delete('takePile');
      return;
    }
    await skDrawTurn(want1);
  };
  for (let round = 1; round <= 3; round++) {
    if (round > 1) {
      await skNext();
      if (round === 2) check(sks().phase === 'memorize' && sks().round === 2 && sks().results === null && skBots.every((b) => b.state.you.memorize.length === 2), 'skrew: the next round is dealt');
      await skReadyAll();
      if (round === 2) check(sks().turn.pid === sks().order[1], 'skrew: the first seat moves on one each round');
    }
    let turns = 0;
    while (sks().phase === 'play' && !sks().caller) {
      if (want1.size && turns < 80) { await skClassicTurn(); turns++; continue; }
      const caller = skUp();
      await skDo(caller, 'screw');
      if (round === 1) {
        const o = sks().order;
        const at = o.indexOf(caller.pid);
        check(sks().caller === caller.pid && sks().finalLeft.join() === [1, 2, 3].map((k) => o[(at + k) % 4]).join() && sks().turn.pid === o[(at + 1) % 4] && sks().events.slice(-1)[0].type === 'screw',
          'skrew: سكرو gives the other three one more turn each, in seat order');
        check((await skTry(skUp(), 'screw')) === false, 'skrew: one سكرو a round');
      }
    }
    const lastTurns = [];
    while (sks().phase === 'play') { lastTurns.push(sks().turn.pid); await skDrawTurn(new Set()); }
    if (round === 1) check(lastTurns.length === 3 && new Set(lastTurns).size === 3 && !lastTurns.includes(sks().results.caller), 'skrew: the round ends once each of the others has played');
    check(sks().phase === (round < 3 ? 'reveal' : 'gameover') && sks().results.round && sks().order.every((id) => skHand(id).every((h) => !!h.up)), `skrew: round ${round} revealed, every card face up`);
    skCheckRound(`skrew: round ${round}`);
  }
  check(!want1.size, 'skrew: every move and every base power came up and was checked' + (want1.size ? ' - missing ' + [...want1].join(', ') : ''));
  {
    const s = sks();
    const low = Math.min(...s.order.map((id) => s.scores[id] || 0));
    check(s.board.length === 4 && s.board.every((x, i, a) => !i || a[i - 1].score <= x.score) && s.order.every((id) => (s.scores[id] || 0) === sk.expScores[id]),
      'skrew: three rounds, every total adds up, the board lowest first');
    check(s.winners.slice().sort().join() === s.order.filter((id) => (s.scores[id] || 0) === low).sort().join(), 'skrew: the lowest total wins');
  }
  skPrivacy('classic');
  check((await B.act('playAgain', {})).ok === false, 'skrew: only the host plays again');
  {
    const res = await A.must('playAgain', {});
    await skSettle(res.state.version);
    check(sks().phase === 'memorize' && sks().round === 1 && Object.keys(sks().scores).length === 0 && sks().settings.rounds === 3 && sks().settings.edition === 'classic',
      'skrew: play again deals a new game with the same options');
  }
  await A.must('backToHub');

  // 2. الحرامي: the table votes on every phone - caught, unnoticed, closed by the host - with خد بس and شوف وبدّل on the way.
  await skStart({ edition: 'thief', rounds: 7, screwFromLap: 1 });
  {
    const want2 = new Set(['give', 'seeSwap']);
    const vote2 = new Set(['caught', 'stole', 'closed']);
    const holderOf = () => sks().order.find((id) => skHand(id).some((h) => sk.known[h.id] === 'thief')) || null;
    let firstVote = true;
    let accuseSeen = false;
    for (let round = 0; round < 20 && (vote2.size || want2.size); round++) {
      await skOnward();
      await skReadyAll();
      let turns = 0;
      while (sks().phase === 'play' && !sks().caller) {
        const holder = holderOf();
        const up = skUp();
        const needHolder = vote2.has('caught') || vote2.has('stole');
        if ((holder && needHolder && holder !== up.pid && (!want2.size || turns > 40)) || turns > 70) { await skDo(up, 'screw'); break; }
        await skDrawTurn(want2);
        turns++;
      }
      while (sks().phase === 'play') await skDrawTurn(new Set());
      check(sks().phase === 'thiefGuess' && sks().turn === null && sks().thiefVote && sks().thiefVote.voted.length === 0 && sks().results === null,
        'skrew: with the thief in the deck, the round ends in the table\'s vote');
      const seated = sks().order.slice();
      const voters = seated.map((id) => byId(skBots, id));
      const holder = holderOf();
      let plan = null;
      let expect = null;
      if (holder && vote2.has('caught')) { plan = holder; expect = 'caught'; }
      else if (holder && vote2.has('stole')) { plan = seated.find((id) => id !== holder); expect = 'stole'; }
      if (firstVote) {
        firstVote = false;
        check(sks().order.every((id) => skHand(id).every((h) => !h.up || sk.shown.has(h.id))) && skView.every((b) => JSON.stringify(b.state).indexOf('"votes"') === -1),
          'skrew: while the table votes, every card stays face down and no phone holds a vote');
        check((await skTry(skTV, 'thiefVote', { pid: null })) === false, 'skrew: a screen has no vote');
        // Three phones vote at the same moment, on the same seq: none is dropped as stale.
        const seq = sks().turnSeq;
        const three = voters.slice(0, 3);
        const sent = await Promise.all(three.map((b) => b.act('thiefVote', { seq, pid: seated[1] })));
        await skSettle(Math.max(...sent.map((x) => (x.ok ? x.state.version : 0))));
        skLearn();
        const who = three.map((b) => b.pid).sort().join();
        check(sent.every((x) => x.ok) && sks().turnSeq === seq && skView.every((b) => b.state.shared.phase === 'thiefGuess' && b.state.shared.thiefVote.voted.slice().sort().join() === who),
          'skrew: three phones voting together all count, and every phone and the screen see who has voted');
        check(skView.every((b) => JSON.stringify(b.state).indexOf('"votes"') === -1), 'skrew: who voted is public, what they voted is on no phone');
        // A change of mind, then the host closes with three votes in.
        for (const b of three) await skDo(b, 'thiefVote', { pid: plan });
        check(sks().thiefVote.voted.length === 3 && sks().events.filter((e) => e.type === 'thiefVote').length === 3, 'skrew: a vote can be changed until the close');
        const notHost = skBots.find((b) => b !== A);
        check((await skTry(notHost, 'closeThiefVote')) === false, 'skrew: only the host closes the vote');
        await skDo(A, 'closeThiefVote');
        const th = sks().results.thief;
        check(sks().phase !== 'thiefGuess' && Object.keys(th.votes).sort().join() === who && three.every((b) => th.votes[b.pid] === plan) && !th.skipped,
          'skrew: the host closes the vote with the votes cast, published with the result');
        vote2.delete('closed');
      } else {
        // Every phone votes; the last vote closes it.
        for (const b of voters) await skDo(b, 'thiefVote', { pid: plan });
        check(sks().phase !== 'thiefGuess' && Object.keys(sks().results.thief.votes).length === voters.length, 'skrew: every phone votes, and the last vote closes it');
      }
      const th = sks().results.thief;
      if (!accuseSeen) {
        const ev = sks().events.filter((e) => e.type === 'accuse').pop();
        check(ev && ev.accused === th.accused && ev.caught === th.caught && Object.keys(ev).sort().join() === 'accused,caught,seq,type', 'skrew: the close is an accuse event, with nothing hidden in it');
        accuseSeen = true;
      }
      if (expect === 'caught') {
        check(th.holder === holder && th.accused === holder && th.caught && !th.stole && sks().results.hands[holder].includes('thief'), 'skrew: the table points at the holder: caught, +25');
        vote2.delete('caught');
      } else if (expect === 'stole' && th.stole) {
        check(th.holder === holder && th.accused === plan && !th.caught && th.victims.length >= 1 && th.score !== null && sks().results.round[holder] === th.score,
          'skrew: the table points at someone else: the thief steals the lowest score, and whoever had it takes +25');
        vote2.delete('stole');
      }
      skCheckRound('skrew: a thief round');
    }
    check(!vote2.size && !want2.size, 'skrew: the thief caught and unnoticed, a vote closed by the host, and خد بس and شوف وبدّل came up' + (vote2.size || want2.size ? ' - missing ' + [...vote2, ...want2].join(', ') : ''));
  }
  skPrivacy('the thief');
  await A.must('backToHub');

  // 3. صاحب صاحبه: partners, بينج and بونج, على كيفك.
  await skStart({ edition: 'sahib', teams: true, rounds: 7, screwFromLap: 1 });
  {
    const o = sks().order;
    check(sks().settings.teams && sks().teams[0].join() === [o[0], o[2]].join() && sks().teams[1].join() === [o[1], o[3]].join() &&
      sks().board.every((x) => x.team === (sks().teams[0].includes(x.id) ? 'A' : 'B')), 'skrew: partners sit across from each other, A B A B');
    const want3 = new Set(['asYouLike']);
    let pinged = false;
    let ponged = false;
    let teamRound = false;
    for (let round = 0; round < 20 && !(pinged && ponged && !want3.size && teamRound); round++) {
      await skOnward();
      await skReadyAll();
      let turns = 0;
      while (sks().phase === 'play') {
        if (!sks().caller && ((pinged && ponged && !want3.size) || turns > 60)) { await skDo(skUp(), 'screw'); continue; }
        const up = skUp();
        const seat = sks().order.indexOf(up.pid);
        const from = sks().eventSeq;
        await skDrawTurn(sks().caller ? new Set() : want3);
        turns++;
        const ping = sks().events.find((e) => e.seq > from && e.type === 'ping');
        if (!ping || sks().phase !== 'play' || sks().caller) continue;
        const ord = sks().order;
        if (!pinged) {
          check(ping.pid === up.pid && ping.target === ord[(seat + 1) % 4] && sks().turn.pid === ord[(seat + 2) % 4] && sks().turn.pongOpen === true && sks().turn.pingFrom === up.pid && sks().pile.includes('ping'),
            'skrew: a ping plays itself: the next player is skipped, the partner is up with Pong open');
          pinged = true;
        }
        const pb = skUp();
        const hand = skHand(pb.pid);
        if (ponged || !hand.length) continue;
        const slot = (hand.find((h) => sk.known[h.id] === 'pong') || hand.find((h) => sk.known[h.id] && sk.known[h.id] !== 'pong') || hand[0]).id;
        await skDo(pb, 'pong', { slot });
        const ev = sks().events.filter((e) => e.type === 'pong').pop();
        check(ev.slot === slot && ev.ok === (ev.card === 'pong') && skHand(pb.pid).length === (ev.ok ? hand.length - 1 : hand.length + 1) && sks().turn.pid === pb.pid && !sks().turn.pongOpen && sks().turn.stage === 'choose',
          `skrew: Pong thrown after the ping (${ev.ok ? 'right: it leaves the hand' : 'wrong: shown, and a penalty card'}), and the turn is still to play`);
        ponged = true;
      }
      if (!teamRound) {
        const r = sks().results;
        const teamOf = (id) => (sks().teams[0].includes(id) ? 'A' : 'B');
        check(r.totals.A !== undefined && r.totals.B !== undefined && sks().order.every((id) => r.round[id] === r.round[teamOf(id)] && (sks().scores[id] || 0) === sks().teamScores[teamOf(id)]),
          "skrew: partners' hands are added up and both partners carry the side's score");
        teamRound = true;
      }
      skCheckRound('skrew: a partners round');
    }
    check(pinged && ponged && !want3.size, 'skrew: بينج, بونج and على كيفك came up' + (!pinged ? ' - no ping' : '') + (!ponged ? ' - no pong' : '') + (want3.size ? ' - no على كيفك' : ''));
  }
  skPrivacy('partners');
  await A.must('backToHub');

  // 4. المسحراتي with أوسكار, a custom deck: the cannon, الخشاف, the scream, بوم, اللايف جاكيت, the wake-up.
  await skStart({ edition: 'custom', groups: ['mesaharaty', 'oscar', 'nonsense'], rounds: 7, screwFromLap: 3 });
  check(sks().settings.groups.join() === 'base,mesaharaty,oscar' && sks().deckCount === 65 - 17, 'skrew: a custom deck mixes the versions chosen');
  {
    const want4 = new Set(['cannon', 'khoshaf', 'scream', 'boom']);
    let woke = false;
    let jacket = false;
    const done4 = () => woke && jacket && !want4.size;
    for (let round = 0; round < 25 && !done4(); round++) {
      await skOnward();
      await skReadyAll();
      let turns = 0;
      while (sks().phase === 'play' && !done4()) {
        if (turns > 70 && !sks().caller && sks().lap >= 3) { await skDo(skUp(), 'screw'); continue; }
        const up = skUp();
        const from = sks().eventSeq;
        await skDrawTurn(sks().caller ? new Set() : want4);
        turns++;
        const wake = sks().events.find((e) => e.seq > from && e.type === 'wakeUp');
        if (wake && !woke) {
          check(wake.pid === up.pid && sks().phase !== 'play' && sks().results.caller === up.pid && sks().pile.includes('mesaharaty') && sks().order.every((id) => skHand(id).every((h) => !!h.up)),
            'skrew: المسحراتي drawn: the round is revealed at once, the one who drew it as the caller');
          woke = true;
        }
      }
      if (sks().results && sks().phase !== 'play') {
        skCheckRound('skrew: an أوسكار round');
        const r = sks().results;
        for (const id of Object.keys(r.hands)) {
          const at = r.hands[id].indexOf('lifeJacket');
          const others = r.hands[id].filter((c) => c !== 'lifeJacket');
          if (jacket || at === -1 || !others.length) continue;
          check(r.values[id][at] === Math.min(...others.map(skrewValue)) && skHand(id)[at].up === 'lifeJacket' && r.sums[id] === r.values[id].reduce((n, v) => n + v, 0),
            'skrew: اللايف جاكيت at the reveal counts as the lowest other card in its hand (results.values)');
          jacket = true;
        }
      }
    }
    check(done4(), 'skrew: المسحراتي, المدفع, الخشاف, صرخة أوسكار, بوم and اللايف جاكيت came up' + (!woke ? ' - no wake-up' : '') + (!jacket ? ' - no life jacket at a reveal' : '') + (want4.size ? ' - missing ' + [...want4].join(', ') : ''));
  }
  skPrivacy('المسحراتي and أوسكار');
  await A.must('backToHub');

  // 5. A hand that runs out ends the round at once. The host skips everyone else, so the
  //    pile's top stays for the one emptying their hand; two بصرة a deck.
  await skStart({ edition: 'classic', rounds: 7, screwFromLap: 1, basraCount: 2 });
  check(sks().settings.basraCount === 2 && sks().deckCount === 40, 'skrew: two بصرة a deck (the first print): 40 in the deck for four');
  {
    const F = A;
    const me = F.pid;
    const knownPair = () => {
      const hand = skHand(me).filter((h) => sk.known[h.id]);
      return hand.find((x) => hand.some((y) => y !== x && skrewMatches(sk.known[x.id], sk.known[y.id])));
    };
    // Throw what matches, line a pair up on the pile, learn the hand, use بصرة and the peeks.
    const finisherTurn = async () => {
      const top = sks().pile.slice(-1)[0];
      const right = skHand(me).find((h) => sk.known[h.id] && skrewMatches(top, sk.known[h.id]));
      if (right) { await skDo(F, 'match', { slot: right.id }); return; }
      const pair = knownPair();
      if (pair) { await skDo(F, 'takePile', { slot: pair.id }); return; }
      await skDo(F, 'draw');
      const t = sks().turn;
      if (sks().phase !== 'play' || !t || t.pid !== me || t.stage !== 'drawn') return;
      const card = F.state.you.drawn;
      const info = SKREW_CARDS[card];
      const mine = skHand(me);
      const unknown = mine.filter((h) => !sk.known[h.id]);
      const pairs = mine.some((h) => sk.known[h.id] && skrewMatches(card, sk.known[h.id]));
      const useful = info.power === 'basra' || (info.power === 'peekOwn' && unknown.length);
      if (info.drawn === 'keep' || (info.drawn !== 'discard' && !pairs && !useful && unknown.length)) {
        await skDo(F, 'keep', { slot: (unknown[0] || mine[0]).id });
        return;
      }
      await skDo(F, 'discard');
      const t2 = sks().turn;
      if (!(t2 && t2.pid === me && t2.stage === 'power')) return;
      const hand = skHand(me);
      if (info.power === 'basra') await skDo(F, 'power', { slot: (hand.find((h) => sk.known[h.id] && !skrewMatches(card, sk.known[h.id])) || hand[0]).id });
      else if (info.power === 'peekOwn' && hand.some((h) => !sk.known[h.id])) await skDo(F, 'power', { slot: hand.find((h) => !sk.known[h.id]).id });
      else await skDo(F, 'skipPower');
    };
    let finished = false;
    for (let round = 0; round < 7 && !finished; round++) {
      await skOnward();
      await skReadyAll();
      let turns = 0;
      while (sks().phase === 'play') {
        if (skUp() !== F) { await skDo(A, 'skipTurn'); continue; }
        if (turns++ > 150 && !sks().caller) { await skDo(F, 'screw'); continue; }
        await finisherTurn();
      }
      const s = sks();
      const r = s.results;
      if (r && r.finisher) {
        const evs = s.events.map((e) => e.type);
        check(r.finisher === me && s.finisher === me && r.hands[me].length === 0 && r.round[me] === 0 && s.turn === null && s.caller === null &&
          evs.slice(-2).join() === 'finish,reveal' && s.events.slice(-2)[0].pid === me && skView.every((b) => b.state.shared.results && b.state.shared.results.finisher === me),
          'skrew: the last card thrown ends the round at once: nobody plays on, the finisher scores 0, every phone and the screen see it');
        finished = true;
      }
      skCheckRound('skrew: an empty-hand round');
    }
    check(finished, 'skrew: a hand ran out of cards');
  }
  skPrivacy('an empty hand');
  await A.must('backToHub');

  // 6. موت مفاجئ with four بصرة: the deck runs out, a last turn each, then the reveal - never a reshuffle.
  await skStart({ edition: 'classic', rounds: 3, screwFromLap: 1, suddenDeath: true, basraCount: 4 });
  check(sks().settings.suddenDeath === true && sks().settings.basraCount === 4 && sks().deckCount === 42, 'skrew: sudden death with four بصرة: 42 in the deck for four');
  {
    const firstPile = sks().pile.slice();
    await skReadyAll();
    let lastLap = null;
    let refused = false;
    const played = [];
    while (sks().phase === 'play') {
      const up = skUp();
      if (sks().deckCount) {
        await skDo(up, 'draw');
        if (!lastLap && sks().lastLap) {
          const o = sks().order;
          const at = o.indexOf(up.pid);
          lastLap = sks().lastLap;
          const ev = sks().events.filter((e) => e.type === 'lastLap').pop();
          check(lastLap.by === up.pid && ev && ev.pid === up.pid && sks().finalLeft.join() === [1, 2, 3].map((k) => o[(at + k) % 4]).join() && sks().turn.pid === up.pid && sks().caller === null,
            'skrew: the last card drawn starts the last lap: everyone else once more, in seat order');
        }
        await skDo(up, 'discard');
        const t = sks().turn;
        if (t && t.pid === up.pid && t.stage === 'power') await skDo(up, 'skipPower');
        continue;
      }
      if (!refused) {
        check((await skTry(up, 'draw')) === false && (await skTry(up, 'screw')) === false, 'skrew: in the last lap nothing can be drawn and سكرو is refused');
        refused = true;
      }
      played.push(up.pid);
      await skDo(up, 'pass');
      check(sks().events.filter((e) => e.type === 'pass').pop().pid === up.pid, `skrew: ${up.name} passes`);
    }
    const r = sks().results;
    const all = firstPile.concat(sk.discards, ...Object.values(r.hands));
    check(!!lastLap && played.length === 3 && new Set(played).size === 3 && !played.includes(lastLap.by) && sks().phase === 'reveal' && r.caller === null && r.finisher === null && sk.reshuffles === 0,
      'skrew: after the last turns the round is revealed, with no caller and no reshuffle');
    check(all.length === 59 && all.filter((c) => c === 'basra').length === 4, `skrew: every card of the deck came out: 59 with four بصرة (${all.length}, ${all.filter((c) => c === 'basra').length})`);
    skCheckRound('skrew: a sudden-death round');
  }
  skPrivacy('sudden death');
  await A.must('backToHub');

  // 8. The house rules: سرقة الحرامي, then بصرة الفريق.
  await skStart({ edition: 'thief', rounds: 7, screwFromLap: 1, thiefSteal: true });
  check(sks().settings.thiefSteal === true, 'skrew: سرقة الحرامي on');
  {
    let stolen = false;
    for (let round = 0; round < 20 && !stolen; round++) {
      await skOnward();
      await skReadyAll();
      let turns = 0;
      while (sks().phase === 'play') {
        const bot = skUp();
        const me = bot.pid;
        if (!sks().caller && (turns > 70 || stolen)) { await skDo(bot, 'screw'); continue; }
        turns++;
        if (sks().caller) { await skDrawTurn(new Set()); continue; }
        await skDo(bot, 'draw');
        const t = sks().turn;
        if (sks().phase !== 'play' || !t || t.pid !== me || t.stage !== 'drawn') continue;
        const card = bot.state.you.drawn;
        if (card !== 'thief') {
          await skDo(bot, 'discard');
          const t2 = sks().turn;
          if (t2 && t2.pid === me && t2.stage === 'power') await skDo(bot, 'skipPower');
          continue;
        }
        // The thief drawn: played as a steal.
        const target = sks().order.find((id) => id !== me && !skProtected(id) && skHand(id).length);
        const slot = skHand(target)[0].id;
        const others = skBots.filter((b) => b !== bot);
        const slices = () => others.map((b) => JSON.stringify(b.state.you)).join('|');
        const before = slices();
        await skDo(bot, 'thiefSteal', { target, slot });
        const seen = bot.state.you.seen || [];
        const tv = sks().events.filter((e) => e.type === 'thiefSteal').pop();
        check(sks().turn.stage === 'steal' && sks().turn.look.target === target && sks().turn.look.slot === slot && sks().pile.slice(-1)[0] === 'thief' &&
          seen.length === 1 && seen[0].pid === target && seen[0].slot === slot && !!seen[0].card && slices() === before && skTV.state.you === null &&
          tv && tv.pid === me && tv.target === target && tv.slot === slot,
          "skrew: سرقة الحرامي: the thief goes up on the pile, and the card looked at is on the stealer's phone alone");
        check((await skTry(bot, 'stealSwap', {})) === false, 'skrew: the steal\'s swap is forced');
        const mine = skHand(me)[0].id;
        await skDo(bot, 'stealSwap', { slot: mine });
        const ev = sks().events.filter((e) => e.type === 'stealSwap').pop();
        check(ev && ev.pid === me && ev.slot === mine && ev.target === target && ev.slot2 === slot && sks().turn.pid !== me && bot.state.you.seen === null &&
          skView.every((b) => b.state.shared.hands[me].find((h) => h.id === mine).h.looks.includes(me)),
          "skrew: then one of the stealer's own cards for it, seen by every phone and the screen; the turn ends");
        stolen = true;
      }
      if (sks().phase === 'thiefGuess') {
        for (const b of skBots) if (sks().phase === 'thiefGuess') await skDo(b, 'thiefVote', { pid: null });
      } else if (stolen) {
        check(sks().results && sks().results.thief === null && !sks().events.some((e) => e.type === 'accuse'), 'skrew: the thief spent on a steal: the round ends with no vote');
      }
      if (sks().results) skCheckRound('skrew: a سرقة الحرامي round');
    }
    check(stolen, 'skrew: the thief was played as a steal');
  }
  skPrivacy('سرقة الحرامي');
  await A.must('backToHub');

  await skStart({ edition: 'sahib', teams: true, rounds: 7, screwFromLap: 1, teamBasra: true });
  check(sks().settings.teamBasra === true, 'skrew: بصرة الفريق on');
  {
    const want = new Set(['refused', 'right', 'wrong']);
    for (let round = 0; round < 20 && want.size; round++) {
      await skOnward();
      await skReadyAll();
      let turns = 0;
      while (sks().phase === 'play') {
        const bot = skUp();
        const me = bot.pid;
        const s = sks();
        if (!s.caller && (turns > 60 || !want.size)) { await skDo(bot, 'screw'); continue; }
        turns++;
        if (s.caller) { await skDrawTurn(new Set()); continue; }
        const team = s.teams.find((t) => t.includes(me));
        const top = s.pile[s.pile.length - 1];
        const theirs = team.filter((id) => id !== me).map((id) => skHand(id).map((h) => ({ id, slot: h.id }))).flat().filter((x) => sk.known[x.slot]);
        const right = theirs.find((x) => skrewMatches(top, sk.known[x.slot]));
        const wrong = theirs.find((x) => !skrewMatches(top, sk.known[x.slot]));
        if (want.has('refused')) {
          const opp = s.order.find((id) => !team.includes(id) && skHand(id).length);
          const stamp = () => JSON.stringify(sks().hands) + '|' + sks().turnSeq + '|' + sks().eventSeq;
          const before = stamp();
          const res = await bot.act('match', { seq: s.turnSeq, slot: skHand(opp)[0].id, owner: opp });
          if (res.ok) { await skSettle(res.state.version); skLearn(); }
          check(res.ok && stamp() === before && sks().turn.pid === me, "skrew: بصرة الفريق: an opponent's card is refused quietly");
          want.delete('refused');
          continue;
        }
        if (want.has('right') && right) {
          const size = skHand(right.id).length;
          const mine = skHand(me).length;
          const card = sk.known[right.slot];
          await skDo(bot, 'match', { slot: right.slot, owner: right.id });
          const ev = sks().events.filter((e) => e.type === 'match').pop();
          const ended = sks().phase !== 'play';
          check(ev.ok === true && ev.owner === right.id && ev.pid === me && ev.card === card && !skHand(right.id).some((h) => h.id === right.slot) &&
            skHand(right.id).length === size - 1 && skHand(me).length === mine && (ended ? sks().results.finisher === right.id : sks().turn.pid !== me),
            "skrew: بصرة الفريق: a partner's matching card leaves the partner's hand, the thrower's stays as it was");
          want.delete('right');
          continue;
        }
        if (want.has('wrong') && wrong) {
          const size = skHand(wrong.id).length;
          const mine = skHand(me).length;
          const card = sk.known[wrong.slot];
          await skDo(bot, 'match', { slot: wrong.slot, owner: wrong.id });
          const ev = sks().events.filter((e) => e.type === 'match').pop();
          const pen = sks().events.filter((e) => e.type === 'penalty').pop();
          const back = skHand(wrong.id).find((h) => h.id === wrong.slot);
          const last = skHand(me)[skHand(me).length - 1];
          check(ev.ok === false && ev.owner === wrong.id && ev.card === card && skHand(wrong.id).length === size && back && back.up === null && back.h.known === card &&
            skHand(me).length === mine + 1 && pen && pen.pid === me && pen.slot === last.id && last.h.how === 'penalty' && last.h.by === me && sks().turn.pid !== me,
            "skrew: بصرة الفريق: a wrong one goes back face down in the partner's slot, known, and the penalty card is the thrower's");
          want.delete('wrong');
          continue;
        }
        await skDrawTurn(new Set());
      }
      if (sks().results) skCheckRound('skrew: a بصرة الفريق round');
    }
    check(!want.size, "skrew: بصرة الفريق: a partner's card thrown right and wrong, and an opponent's refused" + (want.size ? ' - missing ' + [...want].join(', ') : ''));
  }
  skPrivacy('بصرة الفريق');
  await A.must('backToHub');

  skTV.close();
  await api('/leave', { code: A.code, pid: skTV.pid, key: skTV.key });
  await A.waitFor((s) => s.screens.length === 0, 'skrew: the screen leaves');

  // 7. The host's skip and players leaving mid-turn.
  {
    const K = [await Bot.host('كمال', null)];
    for (const name of ['كوثر', 'كرم', 'كنزي']) K.push(await Bot.join(K[0].code, name));
    await all(K, (s) => s.players.length === 4, 'skrew: a room of four');
    skBots = K;
    skView = K.slice();
    await K[0].must('chooseGame', { game: 'screw' });
    const started = await K[0].must('start', { edition: 'classic', rounds: 3, screwFromLap: 2 });
    skReset();
    await skSettle(started.state.version);
    for (const b of K) await skDo(b, 'ready');
    check((await skTry(skUp(), 'screw')) === false, 'skrew: سكرو before the lap chosen is refused');
    const skipped = skUp();
    await skDo(skipped, 'draw');
    const card = skipped.state.you.drawn;
    const notHost = K.find((b) => b !== K[0]);
    check((await skTry(notHost, 'skipTurn')) === false, 'skrew: only the host skips a turn');
    await skDo(K[0], 'skipTurn');
    check(sks().turn.pid !== skipped.pid && sks().pile.slice(-1)[0] === card && skipped.state.you.drawn === null && sks().events.some((e) => e.type === 'skip' && e.pid === skipped.pid),
      'skrew: the host skips a player: the drawn card is thrown and the turn passes');
    while (skUp() === K[0]) await skDo(K[0], 'skipTurn');
    const leaver = skUp();
    await skDo(leaver, 'draw');
    const seat = sks().order.indexOf(leaver.pid);
    const nextId = sks().order[(seat + 1) % 4];
    const deckBefore = sks().deckCount;
    const handSize = skHand(leaver.pid).length;
    await api('/leave', { code: K[0].code, pid: leaver.pid, key: leaver.key });
    leaver.close();
    const rest = K.filter((b) => b !== leaver);
    await all(rest, (s) => s.shared.order.length === 3 && !s.shared.hands[leaver.pid], 'skrew: a player who leaves mid-turn loses their seat and their hand');
    skBots = rest;
    check(sks().deckCount === deckBefore + handSize + 1 && sks().turn.pid === nextId && sks().turn.stage === 'choose' && rest.every((b) => b.state.you && b.state.you.drawn === null),
      'skrew: their cards, the drawn one too, go under the deck and the next player is up');
    const second = rest.find((b) => b !== K[0]);
    await api('/leave', { code: K[0].code, pid: second.pid, key: second.key });
    second.close();
    const two = rest.filter((b) => b !== second);
    await all(two, (s) => s.shared.order.length === 2 && s.shared.phase === 'play', 'skrew: two players play on');
    const third = two.find((b) => b !== K[0]);
    await api('/leave', { code: K[0].code, pid: third.pid, key: third.key });
    third.close();
    await K[0].waitFor((s) => s.shared.phase === 'gameover' && s.phase === 'gameover' && s.shared.winners.join() === K[0].pid, 'skrew: one player left: the game is over');
    K[0].close();
    skBots = [A, B, C, D];
  }

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

  /* --- leaving mid-round, and removing a phone that is gone ---------------- */
  console.log('• leaving mid-round (the round stops waiting), removing a gone phone');
  const L1 = await Bot.host('لمى', null);
  const L2 = await Bot.join(L1.code, 'ليث');
  const L3 = await Bot.join(L1.code, 'لؤي');
  const L4 = await Bot.join(L1.code, 'ليلى');
  const L5 = await Bot.join(L1.code, 'لبنى');
  await all([L1, L2, L3, L4, L5], (s) => s.players.length === 5 && s.players.every((p) => p.online), 'a room of five');

  L5.close();
  await L1.waitFor((s) => s.players.find((p) => p.id === L5.pid).online === false, 'a closed phone shows as away');
  check((await L2.act('kick', { playerId: L5.pid })).ok === false, 'only the host removes a player');
  check((await L1.act('kick', { playerId: L4.pid })).ok === false, 'a player still connected cannot be removed');
  check((await L1.act('kick', { playerId: L1.pid })).ok === false, 'the host cannot remove themselves');
  await L1.must('kick', { playerId: L5.pid });
  await all([L1, L2, L3, L4], (s) => s.players.length === 4 && s.chat.some((m) => m.sys === 'left' && m.p.name === 'لبنى'),
    'the host removes a phone that is gone, said in the chat like a leave');
  check((await L1.act('kick', { playerId: L5.pid })).ok, 'removing someone already gone is nothing to do');
  await L5.connect();
  check(L5.closedWith === 'kicked', 'the removed phone is told so when it comes back');

  // A vote closes when the one who hadn't voted leaves.
  await L1.must('chooseGame', { game: 'mostlikely' });
  await L1.must('start', { lang: 'ar' });
  await all([L1, L2, L3, L4], (s) => s.shared.vote && s.shared.vote.phase === 'voting', 'most likely opens a vote for four');
  for (const b of [L1, L2, L3]) await b.must('vote', { option: L2.pid });
  await api('/leave', { code: L1.code, pid: L4.pid, key: L4.key });
  L4.close();
  await all([L1, L2, L3], (s) => s.players.length === 3 && s.shared.phase === 'results' && s.shared.scores[L2.pid] === 1,
    'the last voter leaving closes the vote and scores it');

  // Just One: the last writer leaving hands the clues to the guesser.
  await L1.must('backToHub');
  await L1.must('chooseGame', { game: 'justone' });
  await L1.must('start', {});
  await all([L1, L2, L3], (s) => s.phase === 'writing' && s.shared.guesserId === L1.pid, 'just one for three');
  await L2.must('submitClue', { clue: 'واحدة' });
  await api('/leave', { code: L1.code, pid: L3.pid, key: L3.key });
  L3.close();
  await all([L1, L2], (s) => s.players.length === 2 && s.phase === 'guessing' && s.shared.clues.length === 1,
    'the last writer leaving moves the round on to the guess');

  // The bomb: whoever holds it leaves, and it goes on to the next player.
  const L6 = await Bot.join(L1.code, 'لين');
  await L1.must('backToHub');
  await L1.must('chooseGame', { game: 'bomb' });
  await L1.must('start', { lang: 'ar', mode: 'category', fuse: 'long' });
  await all([L1, L2, L6], (s) => s.shared.phase === 'ticking', 'the bomb ticks for three');
  if (L1.state.shared.holderId === L1.pid) await L1.must('pass');
  const bombHolder = byId([L2, L6], L1.state.shared.holderId);
  await api('/leave', { code: L1.code, pid: bombHolder.pid, key: bombHolder.key });
  bombHolder.close();
  const bombLeft = [L1, L2, L6].filter((b) => b !== bombHolder);
  await all(bombLeft, (s) => s.players.length === 2 && s.shared.phase === 'ticking' && bombLeft.some((b) => b.pid === s.shared.holderId),
    'the bomb in the hands of someone who leaves goes on to the next player');
  [L1, L2, L3, L4, L5, L6].forEach((b) => b.close());

  /* --- leaving ----------------------------------------------------------- */
  console.log('• leaving');
  await api('/leave', { code: A.code, pid: D.pid, key: D.key });
  await A.waitFor((s) => s.players.length === 3, 'a player who leaves is removed');
  await A.act('leave');
  A.ws.send(JSON.stringify({ t: 'leave' }));
  await B.waitFor((s) => s.players.length === 2 && s.hostId !== A.pid, 'the host leaving hands the room on');
  check(B.state.youAreHost || C.state.youAreHost, 'someone is host again');
  bots.forEach((b) => b.close());

  if (SLOW) {
    /* --- presence clocks: a socket that dies without closing, a screen host -- */
    console.log('• presence (--slow: waits about three minutes)');
    // A host whose phone stops pinging but whose socket never closes, like a locked iPhone.
    const Z = await Bot.host('زومبي', null);
    const zAt = Date.now();
    const Y = await Bot.join(Z.code, 'يحيى');
    clearInterval(Z.pinger);
    // A room opened from a TV, whose TV then goes away.
    const S = await Bot.host('', null, true);
    const P = await Bot.join(S.code, 'بسمة');
    await P.waitFor((s) => s.screens.length === 1 && s.screens[0].online, 'the screen host is here');
    // The room's own early alarms (at create and join) run while the TV is still here, so
    // nothing but the TV's leaving can start the handover clock.
    await sleep(25000);
    S.close();
    await P.waitFor((s) => s.screens[0].online === false, 'the screen host shows as away when its socket closes');
    await Y.waitFor((s) => s.players.find((p) => p.id === Z.pid).online === false, 'a socket silent for 70 seconds counts as away', 100000);
    await Promise.all([
      Y.waitFor((s) => s.hostId === Y.pid && s.youAreHost, 'a silent host hands the room on after two minutes', 150000)
        .then(() => check(Date.now() - zAt < 150000, `two minutes counted from when the host was last heard (${Math.round((Date.now() - zAt) / 1000)}s)`)),
      P.waitFor((s) => s.hostId === P.pid && s.youAreHost, 'a room hosted by a screen that went away hands over to a player', 150000)
    ]);
    [Z, Y, S, P].forEach((b) => b.close());
  }

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
