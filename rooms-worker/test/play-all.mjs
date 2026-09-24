/**
 * Plays every room game with robot players against a rooms server, and checks
 * the things that matter: turns, votes, scores, that secrets never reach the
 * wrong phone, live updates, reconnects, leaving, the server's own clocks, and
 * the prompt memory shared between rooms.
 *
 *   node test/play-all.mjs                         # local: npx wrangler dev
 *   node test/play-all.mjs https://ashry-rooms.3ashry.workers.dev
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
  '\nreturn { SKREW_CARDS, skrewMatches, skrewValue, skrewHandValues, skrewPileCommands };')();

// أونو's cards, for the robots to know what fits. They only learn a card the way a phone does: their own hand, or the pile.
const UNO = new Function(readFileSync(new URL('../../UnoCards.js', import.meta.url), 'utf8') +
  '\nreturn { unoCanPlay, unoSameCard, unoIsWild, unoValueOf, unoColorOf, unoHandPoints, unoDrawOf };')();
// The domino tiles, read by the robots to find a tile that fits and to check a
// round's score from the hands it shows at the end - never another hand before that.
const DOMINO = new Function(readFileSync(new URL('../../DominoTiles.js', import.meta.url), 'utf8') +
  '\nreturn { dominoParse, dominoFits, dominoEnds, dominoCanPlay, dominoHandPips };')();
// بنك الحظ's board, for the robots to see what a place costs before they buy it, as a player reads the card.
const BANK = new Function(readFileSync(new URL('../../BankAlhaz.js', import.meta.url), 'utf8') +
  '\nreturn { BANK_SQUARES };')();

// خمّن مين's faces and questions: the robots ask from the list and work out what is left on their own board.
const GW = new Function(readFileSync(new URL('../../GuessWho.js', import.meta.url), 'utf8') +
  ';return { gwBotQuestion, gwAnswer, gwUp, gwRuledOut };')();

// شطرنج's legal moves (and باغ هاوس's drops), for the robots of a chess tournament and of bughouse.
const CHM = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') + ';return { chessLegalMoves, chessBugDrops };')();

const ARGS = process.argv.slice(2);
const BASE = (ARGS.find((a) => !a.startsWith('--')) || 'http://127.0.0.1:8787').replace(/\/$/, '');
// --slow also waits out the presence clocks (a silent socket, a host away): about three minutes more.
const SLOW = ARGS.includes('--slow');
// --only=duels runs just the tournament and إكس أو rounds (duelTourRobots), for working on them.
const ONLY = ((ARGS.find((a) => a.startsWith('--only=')) || '').slice(7));
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

/* --- إكس أو in rooms, and the duels' tournament (RoomTournament.js) ------------------------- */

// A robot's move in its own match of a tournament, from what its phone sees: the match's game, and its own secret.
const TOUR_MOVE = {
  connect4: (b, g) => {
    if (g.seats[g.turn] !== b.pid) return null;
    const open = Array.from({ length: g.cols }, (_, c) => c).filter((c) => !g.grid[c]);
    return { action: 'move', payload: { col: open[Math.floor(Math.random() * open.length)], move: g.moves } };
  },
  dots: (b, g) => {
    if (g.seats[g.turn] !== b.pid) return null;
    const free = g.lines.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    return { action: 'move', payload: { edge: free[Math.floor(Math.random() * free.length)], move: g.moves } };
  },
  xo: (b, g) => {
    if (g.seats[g.turn] !== b.pid) return null;
    const free = g.cells.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    return { action: 'move', payload: { cell: free[Math.floor(Math.random() * free.length)], move: g.moves } };
  },
  guesswho: (b, g) => {
    const seat = g.seats.indexOf(b.pid);
    const you = b.state.you || {};
    if (g.phase !== 'play') return null;
    if (g.stage === 'answer' && seat === 1 - g.turn) {
      const yes = g.q && g.q.kind === 'list' ? GW.gwAnswer(g.q.qi, g.faces[you.face]) : Math.random() < 0.5;
      return { action: 'answer', payload: { yes, seq: g.turnSeq } };
    }
    if (seat !== g.turn) return null;
    if (g.stage === 'flip') return { action: 'done', payload: { seq: g.turnSeq } };
    const up = GW.gwUp(g.faces, g.down[seat]);
    if (up.length <= 3 || Math.random() < 0.25) return { action: 'guess', payload: { face: up[Math.floor(Math.random() * up.length)], seq: g.turnSeq } };
    const qi = GW.gwBotQuestion(g.faces, g.down[seat], g.asked[seat], 'easy');
    return qi < 0 ? { action: 'guess', payload: { face: up[0], seq: g.turnSeq } } : { action: 'ask', payload: { q: qi, seq: g.turnSeq } };
  },
  chess: (b, g, m) => {
    // The first round's match is drawn twice by agreement (the replay, then Armageddon, where a draw is
    // Black's); every other game is random moves and a resignation after twenty.
    const seat = g.seats.indexOf(b.pid);
    const bd = g.chess;
    if (g.phase !== 'play' || !bd || bd.result) return null;
    if (bd.offer) return bd.offer.seat !== seat ? { action: 'answerDraw', payload: { accept: true } } : null;
    if (bd.g.turn !== seat) return null;
    if (m.r === 1 && bd.moves === 2 && bd.offered[seat] !== bd.moves) return { action: 'offerDraw', payload: { move: bd.moves } };
    if (bd.moves >= 20) return { action: 'resign', payload: { round: g.round } };
    const all = CHM.chessLegalMoves(bd.g);
    const mv = all[Math.floor(Math.random() * all.length)];
    return { action: 'move', payload: { from: mv.from, to: mv.to, promo: mv.promo, move: bd.moves } };
  },
  battleship: (b, g) => {
    const seat = g.seats.indexOf(b.pid);
    if (g.phase === 'place') return !g.ready[seat] && b.state.you && b.state.you.fleet ? { action: 'place', payload: { fleet: b.state.you.fleet } } : null;
    if (g.phase !== 'play' || g.turn !== seat) return null;
    const open = g.seas[1 - seat].grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    return { action: 'fire', payload: { cell: open[Math.floor(Math.random() * open.length)], seq: g.turnSeq } };
  }
};

/** Every robot plays its own match until the tournament is over; `watch` sees each state as it goes. */
async function playTournament(game, bots, watch, ms = 150000) {
  const until = Date.now() + ms;
  const seen = { together: 0 };
  while (Date.now() < until) {
    const t = bots[0].state && bots[0].state.shared && bots[0].state.shared.tour;
    if (!t || t.phase === 'over') break;
    if (t.matches.filter((m) => m.state === 'play').length > 1) seen.together++;
    if (watch) watch(seen);
    let moved = false;
    for (const b of bots) {
      const s = b.state && b.state.shared;
      if (!s || !s.tour || b.closedWith) continue;
      const m = s.tour.matches.find((x) => x.state === 'play' && (x.seats || []).indexOf(b.pid) !== -1);
      const g = m && s.games[m.id];
      if (!g) continue;
      const mv = TOUR_MOVE[game](b, g, m);
      if (!mv) continue;
      moved = true;
      await b.act(mv.action, Object.assign({ match: m.id, mg: m.games }, mv.payload));
    }
    if (!moved) await sleep(120);
  }
  return seen;
}

async function duelTourRobots() {
  console.log('• إكس أو in a room (winner stays, 3 marks only)');
  {
    const H = await Bot.host('هالة', null);
    const J = await Bot.join(H.code, 'جميل');
    const K = await Bot.join(H.code, 'كمال');
    const xoBots = [H, J, K];
    await H.must('chooseGame', { game: 'xo' });
    await H.must('start', { three: true });
    await all(xoBots, (s) => s.game === 'xo' && s.shared.phase === 'play' && s.shared.cells.length === 9 && s.shared.rule3 === true && s.shared.line.length === 1,
              'xo: two sit down on an empty board with 3 marks only, one waits in line');
    const first = byId(xoBots, H.state.shared.seats[0]);
    const second = byId(xoBots, H.state.shared.seats[1]);
    const watcher = xoBots.find((b) => b !== first && b !== second);
    check((await watcher.act('move', { cell: 0, move: 0 })).ok === false, 'xo: someone waiting in line cannot move');
    let mv = 0;
    const mark = async (bot, cell) => { await bot.must('move', { cell, move: mv }); mv++; };
    for (const [bot, cell] of [[first, 0], [second, 3], [first, 1], [second, 4], [first, 8], [second, 7]]) await mark(bot, cell);
    check((await first.act('move', { cell: 0, move: mv })).ok === false, 'xo: the new mark can\'t go where the oldest still stands');
    await mark(first, 2);
    await all(xoBots, (s) => s.shared.cells[0] === '' && s.shared.cells[2] === 'X' && s.shared.last.gone === 0,
              'xo: a fourth mark takes the oldest off, on every phone');
    for (let guard = 0; guard < 80 && H.state.shared.phase === 'play'; guard++) {
      const s = H.state.shared;
      const free = s.cells.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      const bot = byId(xoBots, s.seats[s.turn]);
      await bot.act('move', { cell: free[Math.floor(Math.random() * free.length)], move: s.moves });
      await sleep(20);
    }
    await all(xoBots, (s) => s.shared.phase === 'over' && !s.shared.result.draw && s.shared.win.length === 3,
              'xo: with 3 marks only it ends on a line');
    await watcher.must('nextRound', { round: H.state.shared.round });
    await all(xoBots, (s) => s.shared.phase === 'play' && s.shared.round === 2 && s.shared.seats[0] === watcher.pid,
              'xo: the next in line sits down against the winner and plays X');
    await H.must('backToHub');
    xoBots.forEach((b) => b.close());
  }

  for (const game of ['connect4', 'dots', 'xo', 'guesswho', 'battleship', 'chess']) {
    console.log(`• ${game}: a tournament of five (byes, matches at once, the bracket, a podium)`);
    const names = ['نادر', 'Lina', 'سمير', 'Tarek', 'هبة'];
    const H = await Bot.host(names[0], null);
    const bots = [H];
    for (const n of names.slice(1)) bots.push(await Bot.join(H.code, n));
    const S = await Bot.join(H.code, '', true);
    await H.must('chooseGame', { game });
    const opts = { connect4: { mode: 4 }, dots: { size: 4 }, xo: { three: false }, guesswho: { size: 16 }, battleship: {}, chess: { clock: '5+0' } }[game];
    // Four people or more: the tournament; the host alone starts it.
    check((await bots[1].act('start', Object.assign({ tournament: true }, opts))).ok === false, `${game}: only the host starts a tournament`);
    await H.must('start', Object.assign({ tournament: true }, opts));
    await all(bots.concat([S]), (s) => s.game === game && s.shared.tour && s.shared.tour.size === 8 && s.shared.tour.rounds === 3 &&
                                        s.shared.tour.matches.filter((m) => m.r === 1 && (m.out[0] || m.out[1])).length === 3,
              `${game}: five people: a bracket of eight, three byes, on every phone and the TV`);
    check(S.state.you === null, `${game}: the TV holds no secret`);
    let wrongYou = false;
    let late = null;
    const seen = await playTournament(game, bots, () => {
      for (const b of bots) {
        const you = b.state && b.state.you;
        if (!you) continue;
        const m = b.state.shared.tour.matches.find((x) => x.id === you.tm);
        if (!m || (m.seats || m.p).indexOf(b.pid) === -1) wrongYou = true;
      }
    });
    check(seen.together > 0, `${game}: two matches are played at the same time`);
    check(!wrongYou, `${game}: a phone holds a secret only of the match it is playing`);
    await all(bots.concat([S]), (s) => s.shared.tour.phase === 'over' && !!s.shared.tour.champion && s.phase === 'over',
              `${game}: the final ends the tournament, with a champion, on every screen`, 20000);
    const t = H.state.shared.tour;
    check(H.state.shared.board[0].id === t.champion && H.state.shared.board[0].score === 3 && H.state.shared.scores[t.runnerUp] === 2 &&
          t.semis.length === 2 && t.semis.every((id) => H.state.shared.scores[id] === 1),
          `${game}: the champion 3, the runner-up 2, the two semi-finalists 1`);
    if (game === 'chess') {
      const r1 = t.matches.find((m) => m.r === 1 && m.p[0] && m.p[1]);
      check(r1.draws === 2 && r1.games === 3 && r1.whites.length === 3 && r1.whites[1] !== r1.whites[0],
            'chess: a drawn match is replayed with the colours swapped, then played as Armageddon');
      check(r1.state === 'done' && r1.winner === r1.p.find((id) => id !== r1.whites[2]) && r1.reason === 'won',
            'chess: a draw in Armageddon sends Black through');
      check(H.state.shared.settings.clock === '5+0', 'chess: the lobby clock is every match clock');
    }
    if (game === 'connect4') {
      // Someone joins now: they watch, and are in the next tournament.
      late = await Bot.join(H.code, 'متأخر');
      await late.waitFor((s) => s.shared.tour && s.inGame === false, 'connect4: someone who joins after the draw watches the tournament');
      await H.must('tourNew', { mode: 'tour', round: H.state.shared.round });
      await all(bots.concat([late]), (s) => s.shared.tour.no === 2 && s.shared.tour.phase === 'play' && s.shared.tour.entrants.length === 6 &&
                                           s.shared.scores[t.champion] === 3,
                `connect4: a new tournament: a new draw with everyone in the room, the points kept`);
      // A player of a match about to start leaves: the other goes through.
      const t2 = H.state.shared.tour;
      // (Not the last champion, whose points are checked on the night's leaderboard below.)
      const m = t2.matches.find((x) => x.state === 'ready' && x.p.indexOf(H.pid) === -1 && x.p.some((id) => id !== t.champion));
      const leaverId = m.p.find((id) => id !== t.champion);
      const stays = m.p.find((id) => id !== leaverId);
      const leaver = byId(bots.concat([late]), leaverId);
      await api('/leave', { code: H.code, pid: leaver.pid, key: leaver.key });
      leaver.close();
      await H.waitFor((s) => { const x = s.shared.tour.matches.find((y) => y.id === m.id); return x.state === 'done' && x.winner === stays && x.reason === 'left'; },
                      'connect4: a player who leaves before their match hands it over');
      await H.must('backToHub');
      await H.waitFor((s) => s.phase === 'lobby' && (s.night[t.champion] || 0) === 3, 'connect4: the tournament\'s points go on the night\'s leaderboard');
    } else if (game === 'dots') {
      await H.must('tourNew', { mode: 'stay', round: H.state.shared.round });
      await all(bots, (s) => !s.shared.tour && s.shared.phase === 'play' && s.shared.seats.length === 2 && s.shared.line.length === 3,
                'dots: back to winner stays after a tournament');
      await H.must('backToHub');
    } else {
      await H.must('backToHub');
    }
    bots.concat([S, late]).filter(Boolean).forEach((b) => b.close());
  }
}

/* --- chess for teams: شطرنج بالتصويت and المخ والإيد (RoomVoteChess.js, RoomHandBrain.js) ------- */

async function teamChessRobots() {
  console.log('• votechess (the host\'s teams, secret votes, the tally, a tie, the clock, the host\'s close, resigning by vote, play again, a team left empty)');
  {
    const H = await Bot.host('منى', null);
    const J = await Bot.join(H.code, 'Jana');
    const K = await Bot.join(H.code, 'كريم');
    const S = await Bot.join(H.code, '', true);
    const three = [H, J, K];
    await H.must('chooseGame', { game: 'votechess' });
    await H.must('sides', { shuffle: true });
    await all(three.concat([S]), (s) => s.shared.lobby && Object.keys(s.shared.lobby.sides).length === 3, 'votechess: every phone and the TV see the host\'s split');
    // Put the host alone on White, the other two on Black.
    const sides = H.state.shared.lobby.sides;
    if (sides[H.pid] !== 0) await H.must('sides', { move: H.pid });
    for (const b of [J, K]) if (H.state.shared.lobby.sides[b.pid] !== 1) await H.must('sides', { move: b.pid });
    await H.waitFor((s) => s.shared.lobby.sides[H.pid] === 0 && s.shared.lobby.sides[J.pid] === 1 && s.shared.lobby.sides[K.pid] === 1, 'votechess: a tap moves a player to the other side');
    check((await J.act('sides', { shuffle: true })).ok === false, 'votechess: only the host splits the teams');
    await H.must('start', { secs: 20 });
    await all(three.concat([S]), (s) => s.game === 'votechess' && s.shared.phase === 'play' && s.shared.vote && s.shared.vote.team === 0 && s.shared.teams[0].join() === H.pid,
      'votechess: 1 against 2 - White\'s team votes first, on every phone and the TV');
    const n0 = H.state.shared.chess.moves;
    check((await J.act('vote', { from: 'e7', to: 'e5', n: n0 })).ok === false, 'votechess: the other team can\'t vote');
    check((await S.act('vote', { from: 'e2', to: 'e4', n: n0 })).ok === false, 'votechess: the TV can\'t vote');
    await H.must('vote', { from: 'f2', to: 'f3', n: 0 });
    await all(three.concat([S]), (s) => s.shared.chess.moves === 1 && s.shared.tallies.length === 1 && s.shared.tallies[0].list[0].san === 'f3' && s.shared.vote.team === 1,
      'votechess: a team of one has all voted - the move is played and its tally reaches everyone');
    // Black: two vote apart, a tie drawn at random between them.
    await J.must('vote', { from: 'e7', to: 'e5', n: 1 });
    await H.waitFor((s) => s.shared.vote.voted.indexOf(J.pid) !== -1, 'votechess: who voted reaches every phone');
    check(!leaks(H, '"e5"') && !leaks(K, '"e5"') && !leaks(S, '"e5"') && J.state.you && J.state.you.vote && J.state.you.vote.to === 'e5',
      'votechess: what Jana voted is on her phone only - not her teammate\'s, not the other team\'s, not the TV');
    await K.must('vote', { from: 'e7', to: 'e6', n: 1 });
    await all(three.concat([S]), (s) => s.shared.chess.moves === 2 && s.shared.tallies[1].how === 'tie' && s.shared.tallies[1].list.length === 2,
      'votechess: a tie - one of the two drawn at random, and the table told so');
    // White's vote runs out with nobody voting: a random legal move.
    await all(three, (s) => s.shared.vote && s.shared.vote.team === 0, 'votechess: White\'s turn again');
    await H.waitFor((s) => s.shared.chess.moves === 3, 'votechess: the 20-second clock runs out on the server', 30000);
    check(H.state.shared.tallies[2].how === 'random', 'votechess: nobody voted - a random legal move, said as such');
    // Black: the host closes a vote that waits on a quiet phone.
    await J.must('vote', { ...CHM.chessLegalMoves(J.state.shared.chess.g)[0], n: 3 });
    check((await J.act('closeVote', { n: 3 })).ok === false, 'votechess: only the host closes a vote');
    await H.must('closeVote', { n: 3 });
    await all(three.concat([S]), (s) => s.shared.chess.moves === 4 && s.shared.tallies[3].how === 'host', 'votechess: the host closes it - the votes so far decide');
    // White resigns by vote.
    await H.must('vote', { resign: true, n: 4 });
    await all(three.concat([S]), (s) => s.shared.phase === 'over' && s.shared.result.reason === 'resign' && s.shared.result.winner === 1 && (s.shared.scores[J.pid] || 0) === 1,
      'votechess: the team votes to resign - Black wins, a point to each of them');
    await H.must('playAgain', {});
    await all(three, (s) => s.shared.phase === 'play' && s.shared.teams[1].join() === H.pid && s.shared.round === 2, 'votechess: play again - the same teams, the colours swapped');
    // Mona's side left with nobody: the other team wins.
    const [w0] = H.state.shared.teams[0];
    await api('/leave', { code: H.code, pid: w0 === J.pid ? J.pid : K.pid, key: (w0 === J.pid ? J : K).key });
    await H.waitFor((s) => s.shared.teams[0].length === 1, 'votechess: a member who leaves drops out of the count');
    const other = [J, K].find((b) => H.state.shared.teams[0].indexOf(b.pid) !== -1);
    await api('/leave', { code: H.code, pid: other.pid, key: other.key });
    await H.waitFor((s) => s.shared.phase === 'over' && s.shared.result.reason === 'left' && s.shared.result.winner === 1, 'votechess: a team with nobody left loses');
    await H.must('backToHub');
    three.concat([S]).forEach((b) => b.close());
  }

  console.log('• handbrain (computer players fill the seats, the Brain names, the Hand moves, bots on the server\'s clock, the host\'s "play for", resigning, play again swaps roles)');
  {
    const H = await Bot.host('هالة', null);
    const J = await Bot.join(H.code, 'Jad');
    const S = await Bot.join(H.code, '', true);
    const two = [H, J];
    await H.must('chooseGame', { game: 'handbrain' });
    await H.must('seats', {});
    await all(two, (s) => s.shared.lobby && s.shared.lobby.order.length === 4 && s.shared.lobby.order.filter(Boolean).length === 2, 'handbrain: the lobby seats the two people, two seats empty');
    // Mona is White's Brain, Jad White's Hand: the computer plays Black.
    await H.must('seats', { order: [H.pid, J.pid, null, null] });
    await H.must('start', { clock: 'off', botNames: ['زيزو', 'بندق'] });
    await all(two.concat([S]), (s) => s.shared.phase === 'play' && s.players.filter((p) => p.bot).length === 2 && s.shared.teams[0].join() === H.pid + ',' + J.pid && s.shared.stage === 'name',
      'handbrain: two computer players take the empty seats, White\'s Brain is up');
    check((await J.act('name', { kind: 2, n: 0 })).ok === false, 'handbrain: the Hand can\'t name');
    check((await H.act('name', { kind: 5, n: 0 })).ok === false, 'handbrain: a kind with no legal move can\'t be named');
    await H.must('name', { kind: 2, n: 0 });
    await all(two.concat([S]), (s) => s.shared.stage === 'move' && s.shared.named && s.shared.named.kind === 2, 'handbrain: "the knight!" reaches every phone and the TV');
    check((await J.act('move', { from: 'e2', to: 'e4', move: 0 })).ok === false, 'handbrain: the Hand must move the kind named');
    check((await H.act('move', { from: 'g1', to: 'f3', move: 0 })).ok === false, 'handbrain: the Brain can\'t move');
    await J.must('move', { from: 'g1', to: 'f3', move: 0 });
    await all(two.concat([S]), (s) => s.shared.chess.moves >= 2 && s.shared.stage === 'name' && s.shared.chess.g.turn === 0,
      'handbrain: the Hand plays the knight; Black\'s computer Brain and Hand answer on the server\'s clock', 12000);
    // The host plays for a quiet Hand.
    await H.must('name', { kind: 1, n: 2 });
    await H.must('skipTurn', { move: 2, stage: 'move' });
    await all(two, (s) => s.shared.chess.moves >= 3 && s.shared.chess.hist.length >= 3, 'handbrain: the host plays a pawn for a quiet Hand');
    check(H.state.shared.calls.some((c) => c.kind === 1 && c.n === 2), 'handbrain: what the Brain named is kept for the log');
    await H.waitFor((s) => s.shared.chess.g.turn === 0 && s.shared.stage === 'name', 'handbrain: back to White', 12000);
    await J.must('resign', { round: 1 });
    await all(two.concat([S]), (s) => s.shared.phase === 'over' && s.shared.result.reason === 'resign' && s.shared.result.winner === 1, 'handbrain: the Hand resigns for the team');
    await H.must('playAgain', {});
    await all(two.concat([S]), (s) => s.shared.phase === 'play' && s.shared.round === 2 && s.shared.teams[1].join() === J.pid + ',' + H.pid,
      'handbrain: play again - the roles swapped (Jad the Brain, Mona the Hand) and the colours too');
    // Now the computer is White: it names and moves by itself.
    await H.waitFor((s) => s.shared.chess.moves >= 1 && s.shared.chess.g.turn === 1, 'handbrain: the computer\'s team opens as White', 12000);
    await J.must('resign', { round: 2 });
    await H.waitFor((s) => s.shared.phase === 'over', 'handbrain: the second game ends');
    await H.must('backToHub');
    two.concat([S]).forEach((b) => b.close());
  }
}

async function main() {
  console.log('rooms server:', BASE);
  const t0 = Date.now();
  if (ONLY === 'teamchess') {
    await teamChessRobots();
    console.log(`\n${passed} passed, ${failures.length} failed, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    if (failures.length) console.log('failed:\n - ' + failures.join('\n - '));
    process.exit(failures.length ? 1 : 0);
  }
  if (ONLY === 'duels') {
    await duelTourRobots();
    console.log(`\n${passed} passed, ${failures.length} failed, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    if (failures.length) console.log('failed:\n - ' + failures.join('\n - '));
    process.exit(failures.length ? 1 : 0);
  }

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

  /* --- لاعبين كمبيوتر (the lobby side; each bot game plays its own) ------------ */
  console.log('• computer players');
  await A.must('chooseGame', { game: 'uno' });
  check((await B.act('addBot', { level: 'easy', name: 'زيزو' })).ok === false, 'bots: only the host adds a computer player');
  await A.must('addBot', { level: 'easy', name: 'زيزو' });
  await all(bots, (s) => s.players.some((p) => p.bot === 'easy' && p.name === 'زيزو' && p.online), 'bots: everyone sees the bot, always here');
  await A.must('addBot', { level: 'hard', name: 'زيزو' });
  await all(bots, (s) => s.players.some((p) => p.bot === 'hard' && p.name === 'زيزو 2'), 'bots: a second bot of the same name is told apart');
  const botIds = () => A.state.players.filter((p) => p.bot).map((p) => p.id);
  check(!A.state.players.some((p) => p.bot && JSON.stringify(p).indexOf('key') !== -1), 'bots: a bot carries no key');
  await A.must('setBotLevel', { playerId: botIds()[0] });
  await all(bots, (s) => (s.players.find((p) => p.id === botIds()[0]) || {}).bot === 'hard', 'bots: the host changes a level with a tap');
  check((await B.act('removeBot', { playerId: botIds()[1] })).ok === false, 'bots: only the host removes a bot');
  await A.must('removeBot', { playerId: botIds()[1] });
  await all(bots, (s) => s.players.filter((p) => p.bot).length === 1, 'bots: and takes one out');
  const nameTaken = await api('/join', { code: A.code, name: 'زيزو' });
  check(nameTaken.ok === false, "bots: a phone can't join under a bot's name");
  await A.must('backToHub');
  await all(bots, (s) => !s.game && s.players.length === 4 && !s.players.some((p) => p.bot), 'bots: the hub parks them');
  await A.must('chooseGame', { game: 'trivia' });
  check(!A.state.players.some((p) => p.bot), 'bots: a game without bots never seats them');
  check((await A.act('addBot', { level: 'easy', name: 'Robo' })).ok === false, 'bots: and refuses to add one');
  await A.must('backToHub');
  await A.must('chooseGame', { game: 'domino' });
  check(!A.state.players.some((p) => p.bot) && A.state.players.length === 4, 'bots: a full table of four keeps its people');
  check((await A.act('addBot', { level: 'easy', name: 'Robo' })).ok === false, 'bots: and has no seat for a fifth');
  await A.must('backToHub');
  await A.must('chooseGame', { game: 'uno' });
  await all(bots, (s) => s.players.some((p) => p.bot && p.name === 'زيزو'), 'bots: a game with bots sits them back down');
  await A.must('backToHub');
  /* --- كونكت ٤: winner stays on ------------------------------------------------- */
  console.log('• connect 4 (winner stays on, a draw, someone joining, a forfeit)');
  {
    const H = await Bot.host('هند', null);
    const J = await Bot.join(H.code, 'جمال');
    const K = await Bot.join(H.code, 'كريم');
    let duelBots = [H, J, K];
    await H.must('chooseGame', { game: 'connect4' });
    await H.must('start', { mode: 4 });
    await all(duelBots, (s) => s.game === 'connect4' && s.shared.phase === 'play' && s.shared.seats.length === 2 &&
                               s.shared.line.length === 1 && s.shared.cols === 7 && s.shared.turn === 0,
              'connect4: two sit down, one waits in line');
    const first = byId(duelBots, H.state.shared.seats[0]);
    const second = byId(duelBots, H.state.shared.seats[1]);
    const watcher = duelBots.find((b) => b !== first && b !== second);
    check(duelBots.every((b) => b.state.inGame !== false), 'connect4: everyone in the room at the deal is in it');

    check((await watcher.act('move', { col: 0, move: 0 })).ok === false, 'connect4: someone waiting in line cannot move');
    check((await second.act('move', { col: 0, move: 0 })).ok === false, 'connect4: nor the player whose turn it is not');
    check((await first.act('move', { col: 9, move: 0 })).ok === false, 'connect4: a column that is not on the board is refused');
    let mv = 0;
    const play = async (bot, col) => { await bot.must('move', { col, move: mv }); mv++; };
    await play(first, 3);
    const again = await first.act('move', { col: 3, move: 0 });
    await sleep(150);
    check(again.ok && H.state.shared.moves === 1 && H.state.shared.turn === 1, 'connect4: a double tap (a stale move count) is dropped');
    // The first seat builds four down the middle, the second beside it.
    for (const [bot, col] of [[second, 4], [first, 3], [second, 4], [first, 3], [second, 4], [first, 3]]) await play(bot, col);
    await all(duelBots, (s) => s.shared.phase === 'over' && s.shared.result.winnerId === first.pid && s.shared.win.length === 4 &&
                               s.shared.last.col === 3,
              'connect4: four in a row wins, on every phone');
    check(JSON.stringify(H.state.shared.line) === JSON.stringify([watcher.pid, second.pid]), 'connect4: the loser goes to the back of the line');
    check(H.state.shared.board[0].id === first.pid && H.state.shared.board[0].score === 1, 'connect4: the win is on the board of the room');

    await watcher.must('nextRound', { round: H.state.shared.round });
    await all(duelBots, (s) => s.shared.phase === 'play' && s.shared.round === 2 && s.shared.seats[0] === watcher.pid && s.shared.seats[1] === first.pid,
              'connect4: the next in line sits down against the winner, and moves first');
    const again2 = await second.act('nextRound', { round: 1 });
    await sleep(150);
    check(again2.ok && H.state.shared.round === 2 && H.state.shared.phase === 'play', 'connect4: a second "next game" is dropped');

    // Someone joins mid-game: they watch this one and join the back of the line.
    const L = await Bot.join(H.code, 'لمياء');
    duelBots = duelBots.concat([L]);
    await L.waitFor((s) => s.game === 'connect4' && s.shared.phase === 'play' && s.inGame === false, 'connect4: a latecomer sees the game being played');
    check((await L.act('move', { col: 0, move: 0 })).ok === false, 'connect4: and cannot move in it');

    // A draw: a full board with no line (pairs of columns alternating, row by row),
    // dropped in an order that alternates the colours.
    const noLine = (i) => 1 + ((Math.floor(i / 7) + Math.floor((i % 7) / 2)) % 2);
    const heights = [0, 0, 0, 0, 0, 0, 0];
    const order = [];
    const fill = (k) => {
      if (k === 42) return true;
      const want = (k % 2) + 1;
      for (let c = 0; c < 7; c++) {
        if (heights[c] >= 6) continue;
        const r = 5 - heights[c];
        if (noLine(r * 7 + c) !== want) continue;
        heights[c]++; order.push(c);
        if (fill(k + 1)) return true;
        heights[c]--; order.pop();
      }
      return false;
    };
    check(fill(0), 'connect4: (a drawn board can be played in turn)');
    mv = 0;
    const seatsNow = [watcher, first];
    for (let k = 0; k < order.length; k++) await play(seatsNow[k % 2], order[k]);
    await all(duelBots, (s) => s.shared.phase === 'over' && s.shared.result.draw && !s.shared.win.length,
              'connect4: a full board with no line is a draw');
    check(H.state.shared.champ === first.pid && JSON.stringify(H.state.shared.line) === JSON.stringify([second.pid, L.pid, watcher.pid]),
          'connect4: after a draw the champion keeps the seat, the latecomer is in line, the challenger goes to the back');
    check((H.state.shared.scores[watcher.pid] || 0) === 0 && H.state.shared.scores[first.pid] === 1, 'connect4: a draw scores nobody');

    // A seated player who leaves mid-game loses by forfeit.
    await L.must('nextRound', { round: H.state.shared.round });
    await all(duelBots, (s) => s.shared.phase === 'play' && s.shared.seats[0] === second.pid && s.shared.seats[1] === first.pid,
              'connect4: whoever waited longest challenges next');
    check(L.state.inGame !== false, 'connect4: the latecomer is in the room\'s game now');
    mv = 0;
    await play(second, 0);
    await api('/leave', { code: H.code, pid: second.pid, key: second.key });
    second.close();
    duelBots = duelBots.filter((b) => b !== second);
    await all(duelBots, (s) => s.shared.phase === 'over' && s.shared.result.reason === 'left' && s.shared.result.winnerId === first.pid &&
                               s.shared.line.indexOf(second.pid) === -1,
              'connect4: a seated player who leaves loses by forfeit');
    // Read from the champion, who stays: the seats are drawn at random, so the one who left may have been the host.
    check(first.state.shared.scores[first.pid] === 2 && first.state.shared.streak.n === 2, 'connect4: the forfeit counts, and the streak with it');
    await L.must('nextRound', { round: first.state.shared.round });
    await all(duelBots, (s) => s.shared.phase === 'play' && s.shared.seats[0] === L.pid && s.shared.seats[1] === first.pid,
              'connect4: the one who joined late sits down next, and moves first');
    const hostNow = byId(duelBots, first.state.hostId);
    await hostNow.must('backToHub');
    await hostNow.waitFor((s) => s.phase === 'lobby' && (s.night[first.pid] || 0) === 3, 'connect4: the wins go on the night\'s leaderboard');
    duelBots.forEach((b) => b.close());
  }

  /* --- نقط ومربعات --------------------------------------------------------------- */
  console.log('• dots & boxes (a box keeps the turn, two alternate, the TV cannot move)');
  {
    const P = await Bot.host('بسمة', null);
    const Q = await Bot.join(P.code, 'قاسم');
    const TV = await Bot.join(P.code, '', true);
    const pair = [P, Q];
    await P.must('chooseGame', { game: 'dots' });
    await P.must('start', { size: 4 });
    await all(pair.concat([TV]), (s) => s.game === 'dots' && s.shared.phase === 'play' && s.shared.size === 4 && s.shared.lines.length === 40,
              'dots: the host picks 4x4');
    const seatBots = P.state.shared.seats.map((id) => byId(pair, id));
    check((await TV.act('move', { edge: 0, move: 0 })).ok === false, 'dots: the TV cannot draw a line');
    let turn = 0, mv = 0, last = null;
    const draw = async (edge) => {
      const res = await seatBots[turn].must('move', { edge, move: mv });
      mv++;
      last = res.state.shared;
      turn = last.turn;
    };
    // Box 0: top, bottom, left, right. Whoever draws the fourth side takes it and goes again.
    await draw(0); await draw(4); await draw(20);
    const taker = turn;
    await draw(21);
    check(last.boxes[0] === taker + 1 && last.turn === taker && last.count[taker] === 1 && JSON.stringify(last.last.boxes) === '[0]',
          'dots: the fourth side takes the box, and the same player goes again');
    check((await seatBots[taker].act('move', { edge: 0, move: mv })).ok === false, 'dots: a line already drawn is refused');
    check((await seatBots[1 - taker].act('move', { edge: 1, move: mv })).ok === false, 'dots: the other player waits for the turn');
    for (let e = 0; e < 40 && last.phase === 'play'; e++) if (!last.lines[e]) await draw(e);
    await all(pair.concat([TV]), (s) => s.shared.phase === 'over' && s.shared.count[0] + s.shared.count[1] === 16,
              'dots: every box taken ends the game');
    const c = P.state.shared.count;
    const r = P.state.shared.result;
    check(r.draw ? c[0] === c[1] : r.winnerId === P.state.shared.seats[c[0] > c[1] ? 0 : 1], 'dots: the most boxes win');
    const before = P.state.shared.seats.slice();
    await Q.must('nextRound', { round: P.state.shared.round });
    await all(pair, (s) => s.shared.phase === 'play' && s.shared.seats[0] === before[1] && s.shared.seats[1] === before[0],
              'dots: with two in the room they keep playing, and the first move alternates');
    await P.must('backToHub');
    [P, Q, TV].forEach((b) => b.close());
  }

  /* --- أونو --------------------------------------------------------------------- */
  console.log('• uno (a round to the end, stacking both ways, draw rules, 7-0, jump-in, UNO and a catch, rounds, bots on the server clock, the turn clock, leaving)');
  {
    // The robots play the way a phone lets its player: from their own hand and what the table shows.
    const players = [A, B, C, D];
    const unoTopOf = (st) => { const pile = st.shared.pile || []; return pile[pile.length - 1] || null; };
    const unoFits = (st, c) => UNO.unoCanPlay(c.k, (unoTopOf(st) || {}).k, st.shared.color, st.shared.pending, st.shared.settings);
    const unoSettle = async (list) => {
      for (let n = 0; n < 200; n++) {
        const v = Math.max(...list.map((b) => b.state.version));
        if (list.every((b) => b.state.version === v)) return;
        await sleep(10);
      }
    };
    const unoPayload = (bot, card, extra) => {
      const st = bot.state.shared;
      const p = Object.assign({ card: card.i }, extra || {});
      if (UNO.unoIsWild(card.k)) p.color = 'g';
      if (st.settings.sevenO && UNO.unoValueOf(card.k) === '7' && bot.state.you.hand.length > 1) p.target = st.order.find((id) => id !== bot.pid);
      return p;
    };
    // The phone up makes the move a careful player would: the first card that fits (saying UNO), else draw or take.
    const unoMove = async (list, opts = {}) => {
      await unoSettle(list);
      const s = list[0].state.shared;
      if (s.phase !== 'play' || !s.turn) return null;
      const bot = list.find((b) => b.pid === s.turn.pid);
      if (!bot) { await sleep(40); return null; }        // a computer player's turn: the server's clock plays it
      const st = bot.state.shared;
      const hand = bot.state.you.hand;
      const seq = st.turnSeq;
      const say = opts.sayUno !== false;
      if (st.turn.stage === 'color') return bot.act('pickColor', { color: 'r', seq });
      if (st.turn.stage === 'drawn') {
        const c = hand.find((x) => x.i === bot.state.you.drawn);
        return bot.act('play', unoPayload(bot, c, { seq, uno: say && hand.length === 2 }));
      }
      const fit = hand.find((c) => unoFits(bot.state, c));
      if (fit) return bot.act('play', unoPayload(bot, fit, { seq, uno: say && hand.length === 2 }));
      return bot.act(st.pending ? 'take' : 'draw', { seq });
    };
    // Plays until `until(state)` says stop (checked before every move) or the round is over.
    const unoPlayUntil = async (list, until, max = 600, opts) => {
      for (let n = 0; n < max; n++) {
        await unoSettle(list);
        const st = list[0].state;
        if (st.shared.phase !== 'play') return false;
        if (until && until(st)) return true;
        const res = await unoMove(list, opts);
        if (res && !res.ok) { check(false, 'uno: a robot move was refused: ' + res.error); return false; }
      }
      return false;
    };
    const unoNoLeak = (list) => list.every((x) => (x.state.you ? x.state.you.hand : []).every((c) =>
      list.filter((y) => y !== x).every((y) => { const t = JSON.stringify(y.state); return t.indexOf('"i":' + c.i + ',') === -1 && t.indexOf('"i":' + c.i + '}') === -1; })));
    const unoUp = (list) => { const s = list[0].state.shared; return s.phase === 'play' && s.turn ? list.find((b) => b.pid === s.turn.pid) || null : null; };

    await A.must('chooseGame', { game: 'uno' });
    // The bot parked by the computer-players section sits back down; this table is four people.
    for (const bot of A.state.players.filter((p) => p.bot)) await A.must('removeBot', { playerId: bot.id });
    await all(players, (s) => s.game === 'uno' && s.players.length === 4, 'uno: four at the table');
    check((await B.act('start', {})).ok === false, 'uno: only the host deals');
    await A.must('start', {});
    await all(players, (s) => s.shared.phase === 'play' && s.you && s.you.hand.length === 7 && s.shared.order.every((id) => s.shared.counts[id] === 7),
      'uno: seven cards each, on each phone');
    check(players.every((b) => b.state.shared.settings.stacking === true && b.state.shared.settings.length === 'one'), 'uno: stacking and one round by default');
    check(unoNoLeak(players), "uno: no phone holds another phone's cards, or can read them");
    const TVu = await Bot.join(A.code, '', true);
    await TVu.waitFor((s) => s.youAreScreen && s.game === 'uno' && s.shared.phase === 'play', 'uno: a screen sees the table');
    check(TVu.state.you === null && players.every((b) => b.state.you.hand.every((c) => JSON.stringify(TVu.state).indexOf('"i":' + c.i + ',') === -1)), 'uno: the screen gets no hand');
    check((await TVu.act('callUno', {})).ok === false, 'uno: a screen is not a player');
    TVu.close();
    await api('/leave', { code: A.code, pid: TVu.pid, key: TVu.key });

    // Out of turn, a card that doesn't fit, a stale tap.
    await unoPlayUntil(players, (st) => st.shared.turn.stage === 'play' && !st.shared.pending);
    {
      const upBot = unoUp(players);
      const other = players.find((b) => b !== upBot);
      check((await other.act('play', { card: other.state.you.hand[0].i, seq: other.state.shared.turnSeq })).ok === false, 'uno: only the player up plays');
      check((await other.act('draw', { seq: other.state.shared.turnSeq })).ok === false, 'uno: or draws');
      const misfit = upBot.state.you.hand.find((c) => !unoFits(upBot.state, c));
      if (misfit) check((await upBot.act('play', { card: misfit.i, color: 'r', seq: upBot.state.shared.turnSeq })).ok === false, 'uno: a card that does not fit is refused');
      const before = upBot.state.shared.counts[upBot.pid];
      const oldSeq = upBot.state.shared.turnSeq - 1;
      check((await upBot.act('draw', { seq: oldSeq })).ok === true && upBot.state.shared.counts[upBot.pid] === before, 'uno: a tap with a stale seq is dropped quietly');
    }

    // A round played to the end, checking the table as it goes.
    let drewAndPlayed = false;
    let drewAndPassed = false;
    let stacked = false;
    let tookPile = false;
    for (let n = 0; n < 800 && A.state.shared.phase === 'play'; n++) {
      await unoSettle(players);
      const st = A.state.shared;
      const upBot = unoUp(players);
      if (!upBot) break;
      const us = upBot.state.shared;
      const hand = upBot.state.you.hand;
      // A draw that fits waits to be played; the drawn card may be played and no other.
      if (us.turn.stage === 'play' && !us.pending && !hand.some((c) => unoFits(upBot.state, c))) {
        const countWas = us.counts[upBot.pid];
        await upBot.must('draw', { seq: us.turnSeq });
        await unoSettle(players);
        const after = upBot.state;
        if (after.shared.turn && after.shared.turn.pid === upBot.pid && after.shared.turn.stage === 'drawn') {
          const drawn = after.you.hand.find((c) => c.i === after.you.drawn);
          check(!!drawn && after.shared.counts[upBot.pid] === countWas + 1 && players.filter((b) => b !== upBot).every((b) => b.state.you.drawn === null),
            'uno: a card drawn that fits is on the drawer\'s phone alone, to play or keep');
          const other = after.you.hand.find((c) => c.i !== drawn.i && unoFits(after, c));
          if (other) check((await upBot.act('play', { card: other.i, color: 'r', seq: after.shared.turnSeq })).ok === false, 'uno: after drawing, only the drawn card can be played');
          await upBot.must('play', unoPayload(upBot, drawn, { seq: after.shared.turnSeq, uno: after.you.hand.length === 2 }));
          drewAndPlayed = true;
        } else if (after.shared.phase === 'play') {
          drewAndPassed = drewAndPassed || (after.shared.counts[upBot.pid] === countWas + 1 && after.shared.turn.pid !== upBot.pid);
        }
        continue;
      }
      // A draw waiting on the player up: stack it if they can, or take it all.
      if (us.pending) {
        const waiting = us.pending.n;
        const stack = hand.find((c) => unoFits(upBot.state, c));
        const countWas = us.counts[upBot.pid];
        if (stack) {
          await upBot.must('play', unoPayload(upBot, stack, { seq: us.turnSeq, uno: hand.length === 2 }));
          await unoSettle(players);
          if (A.state.shared.phase === 'play') {
            check(A.state.shared.pending && A.state.shared.pending.n === waiting + UNO.unoDrawOf(stack.k), 'uno: stacked, the draw grows and passes on');
            stacked = true;
          }
        } else {
          await upBot.must('take', { seq: us.turnSeq });
          await unoSettle(players);
          check(!A.state.shared.pending && upBot.state.shared.counts[upBot.pid] >= countWas + Math.min(waiting, 1) && A.state.shared.turn.pid !== upBot.pid,
            'uno: taking the draw ends the turn');
          tookPile = true;
        }
        continue;
      }
      if (n % 15 === 0) check(unoNoLeak(players), 'uno: mid-round, no phone can read another hand');
      const res = await unoMove(players);
      if (res && !res.ok) { check(false, 'uno: a robot move was refused: ' + res.error); break; }
    }
    await all(players, (s) => s.shared.phase === 'gameover' && !!s.shared.results, 'uno: one round: played to the end, the first out wins');
    {
      const r = A.state.shared.results;
      const others = A.state.shared.order.filter((id) => id !== r.winner);
      check(r.hands[r.winner].length === 0 && A.state.shared.winners.join() === r.winner, 'uno: the winner has no cards left');
      check(r.gained === others.reduce((sum, id) => sum + UNO.unoHandPoints(r.hands[id]), 0) && others.every((id) => r.points[id] === UNO.unoHandPoints(r.hands[id])),
        'uno: the round is worth the cards left in the other hands');
      check(A.state.shared.board[0].id === r.winner && A.state.shared.board[0].score === 1 && A.state.shared.board.slice(1).every((row) => row.score === 0),
        'uno: one round is won, not scored: the board counts the win');
      check(drewAndPlayed || drewAndPassed, 'uno: a turn drew a card, and played it or passed');
    }

    // Stacking "+2 on +2, +4 on +4" and "also +4 on a +2", and no stacking: games until each has happened.
    const unoPlayAgain = async (opts) => {
      await A.must('backToHub');
      await A.must('chooseGame', { game: 'uno' });
      await A.must('start', opts);
      await all(players, (s) => s.shared.phase === 'play' && s.you && s.you.hand.length >= 7, 'uno: dealt again');
    };
    let mixedSeen = false;
    for (let game = 0; game < 14 && !mixedSeen; game++) {
      await unoPlayAgain({ stackMode: 'mixed' });
      await unoPlayUntil(players, (st) => {
        if (!st.shared.pending || st.shared.pending.kind !== 'd') return false;
        const upBot = unoUp(players);
        return !!upBot && upBot.state.you.hand.some((c) => c.k === 'w4');
      });
      if (A.state.shared.phase !== 'play') continue;
      const upBot = unoUp(players);
      const s0 = upBot.state.shared;
      const w4 = upBot.state.you.hand.find((c) => c.k === 'w4');
      await upBot.must('play', { card: w4.i, color: 'b', seq: s0.turnSeq, uno: upBot.state.you.hand.length === 2 });
      await unoSettle(players);
      if (A.state.shared.phase === 'play') {
        check(A.state.shared.pending.kind === 'w4' && A.state.shared.pending.n === s0.pending.n + 4 && A.state.shared.color === 'b', 'uno: "also +4 on a +2": the +4 raises the draw');
        const next = unoUp(players);
        const two = next.state.you.hand.find((c) => UNO.unoValueOf(c.k) === 'd');
        if (two) check((await next.act('play', { card: two.i, seq: next.state.shared.turnSeq })).ok === false, 'uno: and a +2 cannot answer it');
        mixedSeen = true;
      }
    }
    check(mixedSeen, 'uno: a +4 answered a +2 (within fourteen games)');
    let offSeen = false;
    for (let game = 0; game < 4 && !offSeen; game++) {
      await unoPlayAgain({ stacking: false });
      await unoPlayUntil(players, (st) => {
        const upBot = unoUp(players);
        return !!upBot && st.shared.turn.stage === 'play' && upBot.state.you.hand.some((c) => UNO.unoValueOf(c.k) === 'd' && unoFits(upBot.state, c));
      });
      if (A.state.shared.phase !== 'play') continue;
      const upBot = unoUp(players);
      const s0 = A.state.shared;
      const d2 = upBot.state.you.hand.find((c) => UNO.unoValueOf(c.k) === 'd' && unoFits(upBot.state, c));
      const victim = s0.order[(s0.order.indexOf(upBot.pid) + s0.dir + s0.order.length) % s0.order.length];
      const victimHad = s0.counts[victim];
      await upBot.must('play', { card: d2.i, seq: upBot.state.shared.turnSeq, uno: upBot.state.you.hand.length === 2 });
      await unoSettle(players);
      if (A.state.shared.phase === 'play') {
        check(!A.state.shared.pending && A.state.shared.counts[victim] === victimHad + 2 && A.state.shared.turn.pid !== victim, 'uno: without stacking the next player draws two and is skipped');
        offSeen = true;
      }
    }
    check(offSeen, 'uno: a +2 without stacking came up');
    check(stacked || tookPile, 'uno: a draw waiting was stacked or taken');

    // Draw until you can play: a draw always ends on a card that fits (while the deck lasts).
    let untilSeen = false;
    for (let game = 0; game < 4 && !untilSeen; game++) {
    await unoPlayAgain({ drawUntil: true });
    for (let n = 0; n < 300 && !untilSeen && A.state.shared.phase === 'play'; n++) {
      await unoSettle(players);
      const upBot = unoUp(players);
      if (!upBot) continue;
      const us = upBot.state.shared;
      if (us.turn.stage === 'play' && !us.pending && !upBot.state.you.hand.some((c) => unoFits(upBot.state, c))) {
        await upBot.must('draw', { seq: us.turnSeq });
        await unoSettle(players);
        const ev = A.state.shared.events.filter((e) => e.type === 'draw' && e.pid === upBot.pid).pop();
        check(!!ev && ev.n >= 1 && (upBot.state.shared.turn.stage === 'drawn' || A.state.shared.deckCount === 0), 'uno: "draw until you can play" stops on a card that fits');
        untilSeen = true;
        continue;
      }
      await unoMove(players);
    }
    }
    check(untilSeen, 'uno: a player had to draw with "draw until you can play"');

    // 7-0: a 7 swaps two hands, a 0 passes every hand on.
    let sevenSeen = false;
    let zeroSeen = false;
    for (let game = 0; game < 5 && !(sevenSeen && zeroSeen); game++) {
      await unoPlayAgain({ sevenO: true });
      for (let n = 0; n < 400 && A.state.shared.phase === 'play' && !(sevenSeen && zeroSeen); n++) {
        await unoSettle(players);
        const upBot = unoUp(players);
        if (!upBot) continue;
        const us = upBot.state.shared;
        const hand = upBot.state.you.hand;
        const seven = !sevenSeen && us.turn.stage === 'play' && !us.pending && hand.length > 2 && hand.find((c) => UNO.unoValueOf(c.k) === '7' && unoFits(upBot.state, c));
        const zero = !zeroSeen && us.turn.stage === 'play' && !us.pending && hand.length > 2 && hand.find((c) => UNO.unoValueOf(c.k) === '0' && unoFits(upBot.state, c));
        if (seven) {
          const target = us.order.find((id) => id !== upBot.pid);
          const mine = hand.length - 1;
          const theirs = us.counts[target];
          check((await upBot.act('play', { card: seven.i, seq: us.turnSeq })).ok === false, 'uno: 7-0: a 7 needs someone to swap with');
          await upBot.must('play', { card: seven.i, target, seq: us.turnSeq });
          await unoSettle(players);
          check(A.state.shared.counts[upBot.pid] === theirs && A.state.shared.counts[target] === mine && A.state.shared.events.some((e) => e.type === 'swap' && e.pid === upBot.pid && e.target === target),
            'uno: 7-0: a 7 swaps your hand with the one you picked');
          check(unoNoLeak(players), 'uno: 7-0: a swapped hand reaches its new phone only');
          sevenSeen = true;
          continue;
        }
        if (zero) {
          const before = Object.assign({}, us.counts);
          before[upBot.pid] -= 1;
          const order = us.order;
          const dir = us.dir;
          await upBot.must('play', { card: zero.i, seq: us.turnSeq });
          await unoSettle(players);
          const after = A.state.shared.counts;
          check(order.every((id, i) => after[order[(i + dir + order.length) % order.length]] === before[id]), 'uno: 7-0: a 0 passes every hand one seat on');
          zeroSeen = true;
          continue;
        }
        await unoMove(players);
      }
    }
    check(sevenSeen && zeroSeen, 'uno: 7-0: a 7 and a 0 were played');

    // Jump in: the very same card as the top one, out of turn.
    let jumpSeen = false;
    for (let game = 0; game < 6 && !jumpSeen; game++) {
      await unoPlayAgain({ jumpIn: true });
      for (let n = 0; n < 400 && A.state.shared.phase === 'play' && !jumpSeen; n++) {
        await unoSettle(players);
        const s = A.state.shared;
        if (s.phase !== 'play' || !s.turn) continue;
        const top = unoTopOf(A.state);
        const jumper = s.turn.stage !== 'color' && top && players.find((b) => b.pid !== s.turn.pid && b.state.you.hand.length > 2 &&
          b.state.you.hand.some((c) => UNO.unoSameCard(c.k, top.k) && !(s.settings.sevenO && UNO.unoValueOf(c.k) === '7')));
        if (jumper) {
          const card = jumper.state.you.hand.find((c) => UNO.unoSameCard(c.k, top.k));
          const stale = await jumper.act('jump', { card: card.i, top: -1 });
          check(stale.ok && jumper.state.shared.counts[jumper.pid] === s.counts[jumper.pid], 'uno: jump in aimed at a covered card is dropped');
          await jumper.must('jump', { card: card.i, top: top.i });
          await unoSettle(players);
          const now = A.state.shared;
          check(now.pile[now.pile.length - 1].i === card.i && now.events.some((e) => e.type === 'play' && e.jump && e.pid === jumper.pid), 'uno: jump in: the same card out of turn goes on the pile');
          if (/^[0-9]$/.test(UNO.unoValueOf(card.k)) && now.phase === 'play') {
            const after = s.order[(s.order.indexOf(jumper.pid) + s.dir + s.order.length) % s.order.length];
            check(now.turn.pid === after, 'uno: and play carries on from the one who jumped');
          }
          jumpSeen = true;
          continue;
        }
        await unoMove(players);
      }
    }
    check(jumpSeen, 'uno: someone jumped in');
    // Jump in is refused when it's off.
    await unoPlayAgain({});
    {
      const top = unoTopOf(A.state);
      const other = players.find((b) => b.pid !== A.state.shared.turn.pid);
      check((await other.act('jump', { card: other.state.you.hand[0].i, top: top.i })).ok === false, 'uno: jump in is refused when it is off');
    }

    // UNO!: said, or forgotten and caught.
    let caughtSeen = false;
    let saidSeen = false;
    for (let game = 0; game < 6 && !(caughtSeen && saidSeen); game++) {
      if (game) await unoPlayAgain({});
      for (let n = 0; n < 500 && A.state.shared.phase === 'play' && !(caughtSeen && saidSeen); n++) {
        await unoSettle(players);
        const upBot = unoUp(players);
        if (!upBot) continue;
        const us = upBot.state.shared;
        const hand = upBot.state.you.hand;
        const fit = us.turn.stage === 'play' && hand.length === 2 && hand.find((c) => unoFits(upBot.state, c));
        if (fit && !caughtSeen) {
          await upBot.must('play', unoPayload(upBot, fit, { seq: us.turnSeq }));
          await all(players, (s) => s.shared.unoCatch === upBot.pid, 'uno: down to one card without saying it: catchable');
          const catcher = players.find((b) => b !== upBot);
          check((await upBot.act('catchUno', { target: upBot.pid })).ok === false, 'uno: nobody catches themselves');
          await catcher.must('catchUno', { target: upBot.pid });
          await all(players, (s) => s.shared.counts[upBot.pid] === 3 && !s.shared.unoCatch && s.shared.events.some((e) => e.type === 'caught' && e.pid === upBot.pid && e.by === catcher.pid),
            'uno: caught: two cards, and everyone sees who caught whom');
          const late = players.find((b) => b !== upBot && b !== catcher);
          await late.must('catchUno', { target: upBot.pid });
          await unoSettle(players);
          check(A.state.shared.counts[upBot.pid] === 3, 'uno: a second catch is too late');
          caughtSeen = true;
          continue;
        }
        if (fit && !saidSeen) {
          await upBot.must('callUno', {});
          await all(players, (s) => (s.shared.said || []).indexOf(upBot.pid) !== -1 && s.shared.events.some((e) => e.type === 'uno' && e.pid === upBot.pid), 'uno: said just before playing, on every phone');
          await upBot.must('play', unoPayload(upBot, fit, { seq: upBot.state.shared.turnSeq }));
          await unoSettle(players);
          check(A.state.shared.phase !== 'play' || !A.state.shared.unoCatch, 'uno: said: nobody can catch them');
          saidSeen = true;
          continue;
        }
        await unoMove(players);
      }
    }
    check(caughtSeen && saidSeen, 'uno: a forgotten UNO was caught, and a said one was safe');

    // A number of rounds, with points.
    await unoPlayAgain({ length: 'rounds', rounds: 3 });
    check(A.state.shared.rounds === 3 && A.state.shared.round === 1, 'uno: three rounds chosen');
    for (let round = 1; round <= 3; round++) {
      await unoPlayUntil(players, null, 1200);
      const want = round < 3 ? 'roundOver' : 'gameover';
      await all(players, (s) => s.shared.phase === want && s.shared.results && s.shared.results.round === round, 'uno: round ' + round + ' played out');
      const st = A.state.shared;
      check(st.scores[st.results.winner] >= st.results.gained && st.board[0].score >= st.results.gained, 'uno: the round\'s winner banks the cards left');
      if (round < 3) {
        check((await B.act('nextRound', { round })).ok === false || B.state.youAreHost, 'uno: only the host deals the next round');
        await A.must('nextRound', { round });
        await all(players, (s) => s.shared.phase === 'play' && s.shared.round === round + 1 && s.you.hand.length >= 7, 'uno: the next round is dealt, the scores kept');
        await A.must('nextRound', { round });
        check(A.state.shared.round === round + 1, 'uno: a stale "next round" is dropped');
      }
    }
    {
      const st = A.state.shared;
      const best = Math.max(...st.order.map((id) => st.scores[id] || 0));
      check(st.winners.length >= 1 && st.winners.every((id) => (st.scores[id] || 0) === best) && st.board[0].score === best, 'uno: after the last round, the most points wins');
    }
    await A.must('backToHub');
    check(Object.keys(A.state.night || {}).length > 0, 'uno: the night table banked the game');

    // Leaving: the player up leaves and the turn moves on; fewer than two ends the game.
    const U1 = await Bot.host('يونس', null);
    const U2 = await Bot.join(U1.code, 'ياسمين');
    const U3 = await Bot.join(U1.code, 'يوسف');
    const uRoom = [U1, U2, U3];
    await U1.must('chooseGame', { game: 'uno' });
    await U1.must('start', {});
    await all(uRoom, (s) => s.shared.phase === 'play' && s.you && s.you.hand.length >= 7, 'uno: a table of three');
    await unoPlayUntil(uRoom, (st) => st.shared.turn.pid !== U1.pid && st.shared.turn.stage === 'play');
    {
      const leaver = uRoom.find((b) => b.pid === U1.state.shared.turn.pid);
      const stay = uRoom.filter((b) => b !== leaver);
      const deckWas = U1.state.shared.deckCount;
      const held = U1.state.shared.counts[leaver.pid];
      await api('/leave', { code: U1.code, pid: leaver.pid, key: leaver.key });
      leaver.close();
      await all(stay, (s) => s.shared.order.length === 2 && s.shared.turn.pid !== leaver.pid && s.shared.deckCount === deckWas + held,
        'uno: the player up leaves: their cards go under the deck, the turn moves on');
      const last = stay.find((b) => b !== U1);
      await api('/leave', { code: U1.code, pid: last.pid, key: last.key });
      last.close();
      await U1.waitFor((s) => s.shared.phase === 'gameover' && s.shared.winners.join() === U1.pid, 'uno: one player left ends the game');
    }
    U1.close();

    // Computer players: one person and two bots, the bots moving on the server's clock, the turn clock playing once for the person.
    const H = await Bot.host('هالة', null);
    await H.must('chooseGame', { game: 'uno' });
    check((await H.act('start', {})).ok === false, 'uno: one person alone cannot start');
    await H.must('addBot', { level: 'easy', name: 'بسبوسة' });
    await H.must('addBot', { level: 'hard', name: 'كراميلا' });
    await H.must('start', { turnClock: 30 });
    await H.waitFor((s) => s.shared.phase === 'play' && s.shared.order.length === 3 && s.you.hand.length >= 7, 'uno bots: one person and two computer players are dealt');
    check(H.state.shared.settings.turnClock === 30 && !!H.state.shared.endsAt, 'uno: the turn clock is on');
    // Wait for the person's turn, then let the clock run out on it.
    await H.waitFor((s) => s.shared.phase !== 'play' || s.shared.turn.pid === H.pid, 'uno bots: the bots play until it is the person\'s turn', 20000);
    if (H.state.shared.phase === 'play') {
      // A turn with nothing that fits is drawn for them at once (forced moves), so
      // the clock may fire on a later turn: what it did is read from the events.
      const seqWas = H.state.shared.turnSeq;
      await H.waitFor((s) => s.shared.turnSeq !== seqWas && s.shared.events.some((e) => e.type === 'auto' && e.pid === H.pid && e.why === 'clock'),
        'uno: time up: the server plays for the quiet player', 70000);
      const evs = H.state.shared.events || [];
      const at = evs.findIndex((e) => e.type === 'auto' && e.pid === H.pid && e.why === 'clock');
      const did = at === -1 ? null : evs.slice(at + 1).find((e) => e.pid === H.pid && e.type !== 'color');
      check(H.state.shared.phase !== 'play' || (did && ((did.type === 'draw' && did.n === 1) || did.type === 'take' || did.type === 'keep')),
        'uno: a draw for them (or the draw that waited, or the drawn card kept), and the turn passes');
    }
    // Now the person plays on, quickly; the bots keep moving by themselves.
    const t0uno = Date.now();
    // A long game (reshuffles, a hard bot's waits) can run past two minutes: that is a long game, not a stall.
    for (let n = 0; n < 1600 && H.state.shared.phase === 'play' && Date.now() - t0uno < 240000; n++) {
      const s = H.state.shared;
      if (s.turn && s.turn.pid === H.pid) {
        const res = await unoMove([H]);
        if (res && !res.ok && !/مش دورك|مش دلوقتي/.test(res.error || '')) check(false, 'uno bots: the person\'s move was refused: ' + res.error);
      } else {
        await sleep(120);
      }
    }
    check(H.state.shared.phase === 'gameover' && !!H.state.shared.results, 'uno bots: a game with computer players finishes on the server\'s clock');
    check(H.state.shared.events.some((e) => e.type === 'play' && e.pid !== H.pid), 'uno bots: the computer players played cards');
    H.close();
  }

  /* --- الدومينو ------------------------------------------------------------------- */
  console.log('• domino (2, 3 and 4 players, teams, both modes, drawing and knocking, a blocked table, the helpers, computer players, the clock, leaving)');
  {
    const until = async (fn, ms = 4000) => {
      for (const end = Date.now() + ms; Date.now() < end;) {
        try { if (fn()) return true; } catch (e) {}
        await sleep(25);
      }
      return false;
    };
    const dS = (b) => b.state.shared || {};
    const dHand = (b) => ((b.state.you || {}).hand || []);
    const onTable = (s) => (s.table.line || []).concat(s.table.up || [], s.table.down || []).map((x) => x.t);
    const tilesOnTable = (s) => onTable(s).length;
    // What a player's phone would send: the first tile that fits, else draw, else knock.
    const firstFit = (b) => {
      const s = dS(b);
      for (const t of dHand(b)) {
        const f = DOMINO.dominoFits(s.table, t);
        if (f.length) return { action: 'play', payload: { tile: t, end: f[0], seq: s.turnSeq } };
      }
      return { action: s.drawing && s.bone > 0 ? 'draw' : 'pass', payload: { seq: s.turnSeq } };
    };
    // A player who closes numbers: the tile whose open number is already most on the table. It blocks tables.
    const closer = (b) => {
      const s = dS(b);
      const down = onTable(s);
      const count = (v) => down.filter((t) => DOMINO.dominoParse(t).indexOf(v) !== -1).length;
      let best = null;
      dHand(b).forEach((t) => DOMINO.dominoFits(s.table, t).forEach((end) => {
        const p = DOMINO.dominoParse(t);
        const e = DOMINO.dominoEnds(s.table).find((q) => q.end === end);
        const open = e ? (p[0] === e.value ? p[1] : p[0]) : p[1];
        const v = count(open) * 2 + (p[0] === p[1] ? 1 : 0);
        if (!best || v > best.v) best = { v: v, tile: t, end: end };
      }));
      return best ? { action: 'play', payload: { tile: best.tile, end: best.end, seq: s.turnSeq } } : firstFit(b);
    };
    // Every phone caught up with the same turn.
    const settled = (players) => until(() => players.every((b) => dS(b).turnSeq === dS(players[0]).turnSeq && dS(b).phase === dS(players[0]).phase));
    // No tile in anyone's hand is in what another phone was sent.
    const leaks = (players) => players.some((b) => {
      const text = JSON.stringify(b.state);
      return players.some((o) => o !== b && dHand(o).some((t) => text.indexOf('"' + t + '"') !== -1));
    });
    const events = new Map();
    const note = (b) => (dS(b).events || []).forEach((e) => events.set(e.seq + '|' + b.code, e));
    let refused = 0;
    // One round played to its end by the phones whose turn it is (a computer player's turn is the server's).
    const playRound = async (players, pick, ms = 90000) => {
      const host = players[0];
      for (const end = Date.now() + ms; Date.now() < end;) {
        const s = dS(host);
        note(host);
        if (s.phase !== 'play') return true;
        const up = players.find((b) => b.pid === s.turn);
        if (!up) { await sleep(60); continue; }
        await until(() => dS(up).turnSeq === s.turnSeq, 3000);
        const move = pick(up);
        const res = await up.act(move.action, move.payload);
        if (!res.ok) { refused++; console.log('  ! refused', move.action, JSON.stringify(move.payload), res.error); }
        await until(() => dS(host).turnSeq !== s.turnSeq || dS(host).phase !== 'play', 3000);
      }
      return false;
    };
    const unitPips = (r, ids) => ids.reduce((sum, id) => sum + DOMINO.dominoHandPips(r.hands[id]), 0);
    // The end of a round, checked against the rules from the hands it shows.
    const roundRight = (s, label) => {
      const r = s.result;
      if (!r) return false;
      const units = Array.isArray(s.teams) ? s.teams.map((t, i) => ({ key: 'AB'[i], ids: t })) : s.order.map((id) => ({ key: id, ids: [id] }));
      const pips = units.map((u) => unitPips(r, u.ids));
      let winner = null;
      let raw = 0;
      if (r.how === 'out') {
        if (DOMINO.dominoHandPips(r.hands[r.by]) !== 0 || (r.hands[r.by] || []).length) return false;
        winner = units.find((u) => u.ids.indexOf(r.by) !== -1).key;
      } else {
        const low = Math.min(...pips);
        if (pips.filter((p) => p === low).length === 1) winner = units[pips.indexOf(low)].key;
        // A blocked table really is: nothing anyone holds goes anywhere.
        if (s.order.some((id) => DOMINO.dominoCanPlay(s.table, r.hands[id]))) return false;
      }
      if (winner) raw = units.reduce((sum, u, i) => (u.key === winner ? sum : sum + pips[i]), 0);
      const points = s.settings.mode === 'american' ? Math.floor((raw + 2) / 5) : raw;
      const ok = r.winner === winner && r.raw === raw && r.points === points && (!!r.tie === (!winner && r.how === 'blocked'));
      if (!ok) console.log('  ! ' + label, JSON.stringify({ r, expect: { winner, raw, points } }));
      return ok;
    };

    // Two players: seven each and fourteen to draw from.
    const P1 = await Bot.host('بسمة', null);
    const P2 = await Bot.join(P1.code, 'Karim');
    const two = [P1, P2];
    await P1.must('chooseGame', { game: 'domino' });
    check((await P2.act('start', {})).ok === false, 'domino: only the host deals');
    await P1.must('start', { mode: 'normal', target: 51 });
    await all(two, (s) => s.shared.phase === 'play' && s.shared.round === 1 && s.you && Array.isArray(s.you.hand), 'domino: two players are dealt');
    await settled(two);
    let s2 = dS(P1);
    check(s2.drawing && tilesOnTable(s2) === 1 && dHand(P1).length + dHand(P2).length + s2.bone + 1 === 28 && s2.counts[P1.pid] === dHand(P1).length,
      'domino: seven each, fourteen to draw from, and the first tile opens by itself');
    check(s2.settings.helpFit === false && s2.settings.helpPoints === false && s2.settings.turnClock === 0 && s2.settings.target === 51,
      'domino: the helpers and the clock are off unless the host turns them on');
    check(!leaks(two), "domino: no phone is sent another's tiles, or the ones left to draw");
    const upB = two.find((b) => b.pid === s2.turn);
    const offB = two.find((b) => b.pid !== s2.turn);
    check((await offB.act('play', { tile: dHand(offB)[0], seq: s2.turnSeq })).ok === false, 'domino: out of turn is refused');
    const noFit = dHand(upB).find((t) => !DOMINO.dominoFits(s2.table, t).length);
    if (noFit) check((await upB.act('play', { tile: noFit, seq: s2.turnSeq })).ok === false, "domino: a tile that doesn't fit is refused, helpers or not");
    check((await upB.act('play', { tile: dHand(offB)[0], seq: s2.turnSeq })).ok === false, "domino: a tile that isn't yours is refused");
    if (DOMINO.dominoCanPlay(s2.table, dHand(upB))) check((await upB.act('draw', { seq: s2.turnSeq })).ok === false, 'domino: no drawing while a tile fits');
    const staleRes = await upB.act('play', { tile: dHand(upB)[0], end: 'R', seq: s2.turnSeq - 1 });
    await sleep(150);
    check(staleRes.ok && dS(P1).turnSeq === s2.turnSeq && tilesOnTable(dS(P1)) === 1, 'domino: a tap from a turn that has moved on is dropped');
    // Play the game out.
    let rounds = 0;
    let roundsRight = true;
    while (dS(P1).phase !== 'gameover' && rounds < 25) {
      const done = await playRound(two, firstFit);
      if (!done) break;
      await settled(two);
      rounds++;
      roundsRight = roundsRight && roundRight(dS(P1), '2p round');
      if (dS(P1).phase === 'roundOver') {
        const lead = dS(P1).lead;
        if (rounds === 1) check((await P2.act('nextRound', { round: dS(P1).round })).ok === false, 'domino: only the host deals the next round');
        await P1.must('nextRound', { round: dS(P1).round });
        await settled(two);
        if (rounds === 1 && lead) check(dS(P1).turn === lead && tilesOnTable(dS(P1)) === 0, 'domino: the winner of the last round leads the next with any tile');
      }
    }
    check(refused === 0, 'domino: every move a phone made by the rules was taken');
    check(roundsRight, 'domino: every round scored by the rules (going out, قفلة, a tie)');
    const over2 = dS(P1);
    check(over2.phase === 'gameover' && over2.winners.length === 1 && over2.scores[over2.winner] >= 51 && over2.board[0].id === over2.winner,
      'domino: the game ends past the target, the board best first');
    check([...events.values()].some((e) => e.type === 'draw' && e.n >= 1), 'domino: with two, a player who can\'t play draws');
    await P1.must('playAgain', {});
    await all(two, (s) => s.shared.phase === 'play' && s.shared.round === 1 && s.shared.settings.target === 51, 'domino: play again keeps the options');
    await P1.must('backToHub');
    two.forEach((b) => b.close());

    // Three players, أمريكاني, the helpers on.
    const Q1 = await Bot.host('نادية', null);
    const Q2 = await Bot.join(Q1.code, 'Sam');
    const Q3 = await Bot.join(Q1.code, 'حسن');
    const three = [Q1, Q2, Q3];
    await Q1.must('chooseGame', { game: 'domino' });
    await Q1.must('start', { mode: 'american', target: 30, helpFit: true, helpPoints: true });
    await all(three, (s) => s.shared.phase === 'play' && s.shared.settings.mode === 'american', 'domino: three players in أمريكاني');
    await settled(three);
    check(dS(Q1).bone === 7 && dS(Q1).settings.helpFit && dS(Q1).settings.helpPoints, 'domino: seven left to draw with three, and the helpers the host chose');
    check(!leaks(three), 'domino: three phones, no tile of another hand in any');
    events.clear();
    let rounds3 = 0;
    let right3 = true;
    while (dS(Q1).phase !== 'gameover' && rounds3 < 30) {
      if (!(await playRound(three, firstFit))) break;
      await settled(three);
      rounds3++;
      right3 = right3 && roundRight(dS(Q1), '3p american round');
      if (dS(Q1).phase === 'roundOver') { await Q1.must('nextRound', { round: dS(Q1).round }); await settled(three); }
    }
    const plays = [...events.values()].filter((e) => e.type === 'play' && typeof e.sum === 'number');
    check(plays.length > 0 && plays.every((e) => (e.sum % 5 === 0 && e.sum > 0 ? e.pts === e.sum / 5 : !e.pts)), 'domino: in أمريكاني every move scores its ends when they add up to a multiple of 5');
    check(plays.some((e) => e.pts > 0), 'domino: …and some did');
    check(right3 && dS(Q1).phase === 'gameover', 'domino: أمريكاني rounds rounded to the nearest 5, to the end of the game');
    await Q1.must('backToHub');

    // Leaving mid-round, on your own: their tiles go, the turn moves on.
    await Q1.must('chooseGame', { game: 'domino' });
    await Q1.must('start', { mode: 'normal' });
    await settled(three);
    const leaverQ = three.find((b) => b.pid === dS(Q1).turn && b !== Q1) || Q2;
    await api('/leave', { code: Q1.code, pid: leaverQ.pid, key: leaverQ.key });
    leaverQ.close();
    const stayQ = three.filter((b) => b !== leaverQ);
    await all(stayQ, (s) => s.shared.phase === 'play' && s.shared.order.length === 2 && s.shared.order.indexOf(leaverQ.pid) === -1 && !(leaverQ.pid in s.shared.counts)
      && s.shared.order.indexOf(s.shared.turn) !== -1, 'domino: whoever leaves on their own, their tiles are set aside and the turn moves on');
    const last = stayQ.find((b) => b !== Q1);
    await api('/leave', { code: Q1.code, pid: last.pid, key: last.key });
    last.close();
    await Q1.waitFor((s) => s.shared.phase === 'gameover', 'domino: one player left ends the game');
    Q1.close();

    // Four players in teams: the host seats them, partners opposite, and a blocked table.
    const T1 = await Bot.host('طارق', null);
    const T2 = await Bot.join(T1.code, 'Lina');
    const T3 = await Bot.join(T1.code, 'مها');
    const T4 = await Bot.join(T1.code, 'Yusuf');
    const TV = await Bot.join(T1.code, '', true);
    const four = [T1, T2, T3, T4];
    await T1.must('chooseGame', { game: 'domino' });
    check((await T2.act('seats', { teams: true })).ok === false, 'domino: only the host seats the partners');
    await T1.must('seats', { teams: true });
    await all(four, (s) => s.shared.lobby && s.shared.lobby.teams && s.shared.lobby.order.length === 4, 'domino: teams on, everyone sees the seats drawn at random');
    const seats = [T4.pid, T3.pid, T2.pid, T1.pid];
    await T1.must('seats', { teams: true, order: seats });
    await all(four, (s) => s.shared.lobby.order.join() === seats.join(), 'domino: the host swaps the seats');
    await T1.must('start', { mode: 'normal', teams: true, target: 201 });
    await all(four, (s) => s.shared.phase === 'play' && s.shared.order.join() === seats.join() && s.shared.teams[0].join() === [T4.pid, T2.pid].join()
      && s.shared.teams[1].join() === [T3.pid, T1.pid].join(), 'domino: seats 1 & 3 against 2 & 4, as the host sat them');
    await settled(four);
    check(!dS(T1).drawing && dS(T1).bone === 0 && dS(T1).table.root === '6-6' && four.every((b) => b.state.you.hand.length + (b.pid === dS(T1).events[1].pid ? 1 : 0) === 7),
      'domino: four players hold all 28 and the double six opens');
    check('A' in dS(T1).scores && !(T1.pid in dS(T1).scores), 'domino: two sides keep one score each');
    await until(() => TV.state && TV.state.shared && TV.state.shared.phase === 'play');
    check(TV.state.youAreScreen && TV.state.you === null && !four.some((b) => dHand(b).some((t) => JSON.stringify(TV.state).indexOf('"' + t + '"') !== -1)),
      'domino: the big screen sees the table and no hand');
    check(!leaks(four), 'domino: four phones, no tile of another hand in any');
    events.clear();
    let roundsT = 0;
    let rightT = true;
    let blockedSeen = false;
    // The closer plays for a blocked table; rounds go on until one blocks and someone has had to pass
    // (a deal can block before anyone knocks, and the knock is checked below).
    const passSeen = () => [...events.values()].some((e) => e.type === 'pass');
    while (roundsT < 14 && !(blockedSeen && passSeen())) {
      if (!(await playRound(four, closer))) break;
      await settled(four);
      roundsT++;
      const st = dS(T1);
      rightT = rightT && roundRight(st, 'teams round');
      if (st.result && st.result.how === 'blocked') blockedSeen = true;
      if (st.phase === 'roundOver') { await T1.must('nextRound', { round: st.round }); await settled(four); }
      else if (st.phase === 'gameover') { await T1.must('playAgain', {}); await settled(four); }
    }
    check(rightT, "domino: in teams going out takes the two opponents' pips, the partner's counting for nobody; blocked, the lower side takes the other's");
    check(blockedSeen, 'domino: a blocked table (قفلة) ends the round, and the lower side takes the rest');
    check([...events.values()].some((e) => e.type === 'pass'), 'domino: with four, a player who can\'t play knocks (دق)');
    const knockedOk = [...events.values()].filter((e) => e.type === 'pass').length > 0;
    check(knockedOk && Object.keys(dS(T1).knocked || {}).every((pid) => four.some((b) => b.pid === pid)), 'domino: the table remembers who knocked on which numbers');
    // Someone leaves a game of teams: a side one short can't play on.
    await api('/leave', { code: T1.code, pid: T4.pid, key: T4.key });
    T4.close();
    await all([T1, T2, T3], (s) => s.shared.phase === 'gameover' && s.shared.ended === 'left', 'domino: in teams, a side one short ends the game');
    [T1, T2, T3, TV].forEach((b) => b.close());

    // One person and three computer players: the table plays itself on the server's clock, and the turn clock plays for a quiet phone.
    const H = await Bot.host('هالة', null);
    await H.must('chooseGame', { game: 'domino' });
    check((await H.act('start', {})).ok === false, 'domino: one person alone is refused');
    await H.must('addBot', { level: 'easy', name: 'زيزو' });
    await H.must('addBot', { level: 'hard', name: 'بندق' });
    await H.must('addBot', { level: 'hard', name: 'سمسم' });
    check((await H.act('addBot', { level: 'easy', name: 'Robo' })).ok === false, 'domino: four seats, no fifth');
    await H.must('start', { mode: 'american', turnClock: 30 });
    await H.waitFor((s) => s.shared.phase === 'play' && s.shared.order.length === 4 && typeof s.shared.endsAt === 'number', 'domino: a table of one person and three computer players, with a turn clock');
    const seenHuman = [];
    // Wait for the person's turn while the computer players play theirs, then let the clock play for them.
    await until(() => dS(H).phase !== 'play' || dS(H).turn === H.pid, 20000);
    if (dS(H).phase === 'play' && dS(H).turn === H.pid) {
      seenHuman.push(JSON.stringify(H.state));
      const clockAt = dS(H).endsAt;
      const played = await until(() => (dS(H).events || []).some((e) => e.type === 'auto' && e.why === 'clock' && e.pid === H.pid), clockAt - Date.now() + 9000);
      check(played, 'domino: when the clock runs out the phone plays for the player (first tile that fits, else draw or knock)');
    } else check(false, "domino: the person's turn came round");
    // Then the person plays their own turns until the round is over; the computer players the rest.
    for (const end = Date.now() + 120000; Date.now() < end && dS(H).phase === 'play';) {
      if (dS(H).turn === H.pid) {
        seenHuman.push(JSON.stringify(H.state));
        const move = firstFit(H);
        await H.act(move.action, move.payload);
        await until(() => dS(H).turn !== H.pid || dS(H).phase !== 'play', 3000);
      } else await sleep(100);
    }
    const hr = dS(H);
    check(hr.phase === 'roundOver' || hr.phase === 'gameover', 'domino: …and the round is played to its end');
    check((hr.events || []).some((e) => e.type === 'play' && e.pid !== H.pid && !e.forced), 'domino: the computer players moved on the server clock, with no phone to tap');
    const botTiles = hr.order.filter((id) => id !== H.pid).reduce((acc, id) => acc.concat((hr.result && hr.result.hands[id]) || []), []);
    check(!!hr.result && !seenHuman.some((text) => botTiles.some((t) => text.indexOf('"' + t + '"') !== -1)), "domino: the person's phone was never sent a computer player's tiles");
    check(hr.board.length === 4 && hr.board[0].score >= hr.board[3].score, 'domino: the board carries all four, best first');
    H.close();
  }

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
  const { SKREW_CARDS, skrewMatches, skrewValue, skrewHandValues, skrewPileCommands } = SKREW;
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
    let asYouLikeSaw = [];
    if (power === 'asYouLike') {
      // A mimic: it can only copy a command card already face up on the pile,
      // and with none there it goes down as a plain بصرة.
      const onPile = skrewPileCommands(sks().pile);
      asYouLikeSaw = onPile;
      // Only the two whose case here carries `extra` through to the server.
      // The general rule - it copies whatever command is on the pile, and
      // refuses one that is not - is pinned deterministically in rules.mjs.
      const usable = onPile.filter((id) => {
        const q = SKREW_CARDS[id].power;
        if (q === 'give') return open.length && mine.length;
        return q === 'basra' && mine.length;
      });
      if (usable.length) { extra = { as: usable[0] }; use = SKREW_CARDS[usable[0]].power; }
      else if (onPile.length) { use = ''; }             // a command this robot can't drive: skip the power
      else { extra = {}; use = 'basra'; }               // nothing to copy: the server falls back for us
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
    if (checking && power === 'asYouLike' && use) {
      const ev = evs('asYouLike')[0];
      check(ev && ev.as === use && evs(use).length === 1 &&
        (extra.as ? ev.from === extra.as && asYouLikeSaw.indexOf(extra.as) !== -1 : ev.from === null),
        `skrew: على كيفك copied ${extra.as || 'nothing on the pile, so بصرة'}`);
    }
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
        // After a سكرو the first caller stays the caller (the owner's rule), so the wake-up's caller is theirs.
        const callerBefore = sks().caller || null;
        await skDrawTurn(sks().caller ? new Set() : want4);
        turns++;
        const wake = sks().events.find((e) => e.seq > from && e.type === 'wakeUp');
        if (wake && !woke) {
          check(wake.pid === up.pid && sks().phase !== 'play' && sks().results.caller === (callerBefore || up.pid) && sks().pile.includes('mesaharaty') && sks().order.every((id) => skHand(id).every((h) => !!h.up)),
            'skrew: المسحراتي drawn: the round is revealed at once, the one who drew it as the caller (after a سكرو, the first caller)');
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

  /* --- لودو ------------------------------------------------------------------------ */
  console.log('• ludo (colours in the lobby, who plays with five, the roll-off, turns, the server\'s dice, a computer player, play again, leaving)');
  {
    const lS = (b) => b.state.shared || {};
    const until = async (fn, ms = 4000) => {
      for (const end = Date.now() + ms; Date.now() < end;) {
        try { if (fn()) return true; } catch (e) {}
        await sleep(25);
      }
      return false;
    };
    const L1 = await Bot.host('نور', null);
    const L2 = await Bot.join(L1.code, 'Adam');
    const L3 = await Bot.join(L1.code, 'سلمى');
    const L4 = await Bot.join(L1.code, 'Omar');
    const L5 = await Bot.join(L1.code, 'هنا');
    const five = [L1, L2, L3, L4, L5];
    await L1.must('chooseGame', { game: 'ludo' });
    await L2.must('color', { color: 'G' });
    check((await L3.act('color', { color: 'G' })).ok === false, 'ludo: a colour already taken is refused');
    check((await L5.act('color', { color: 'Y' })).ok === false, 'ludo: with five in the room the fifth watches and picks no colour');
    check((await L2.act('seat', { playerId: L5.pid, on: true })).ok === false, 'ludo: only the host picks who plays');
    await L1.must('seat', { playerId: L4.pid, on: false });
    await L1.must('seat', { playerId: L5.pid, on: true });
    await L5.must('color', { color: 'Y' });
    await all(five, (s) => s.shared.lobby && s.shared.lobby.colors[L5.pid] === 'Y' && s.shared.lobby.colors[L2.pid] === 'G', 'ludo: every phone sees who took which colour');
    check((await L2.act('start', {})).ok === false, 'ludo: only the host starts');
    await L1.must('start', { turnClock: 0 });
    await all(five, (s) => s.phase === 'play' && Array.isArray(s.shared.seats) && s.shared.seats.length === 4, 'ludo: the four seated are dealt in');
    const s0 = lS(L1);
    check(s0.seats.indexOf(L4.pid) === -1 && s0.colors[L2.pid] === 'G' && s0.colors[L5.pid] === 'Y' && new Set(Object.values(s0.colors)).size === 4,
      'ludo: the host benched one; the colours picked are kept and the rest filled in');
    check(L4.state.inGame !== false, 'ludo: whoever watches still sees the board');
    check(s0.events.some((e) => e.type === 'rolloff' && e.first === s0.turn.pid), 'ludo: the roll-off decides who starts');
    check(Object.values(s0.pieces).every((p) => p.every((r) => r === -1)), 'ludo: every piece starts in its yard');
    const upB = five.find((b) => b.pid === s0.turn.pid);
    const offB = five.find((b) => b.pid !== s0.turn.pid && s0.seats.indexOf(b.pid) !== -1);
    check((await offB.act('roll', { seq: s0.turnSeq })).ok === false, 'ludo: out of turn is refused');
    check((await L4.act('roll', { seq: s0.turnSeq })).ok === false, 'ludo: a watcher cannot roll');
    check((await upB.act('move', { piece: 0, seq: s0.turnSeq })).ok && lS(L1).turnSeq === s0.turnSeq, 'ludo: a move before the roll does nothing');
    // Play turns: whoever is up rolls, then moves the first piece that can go (the server moves a lone piece itself).
    let refused = 0;
    let rolls = 0;
    let sawMove = false;
    let sawForced = false;
    for (let k = 0; k < 60 && lS(L1).phase === 'play'; k++) {
      const s = lS(L1);
      const up = five.find((b) => b.pid === s.turn.pid);
      await until(() => lS(up).turnSeq === s.turnSeq, 2000);
      if (s.turn.stage === 'roll') {
        const res = await up.act('roll', { seq: s.turnSeq });
        if (!res.ok) refused++;
        rolls++;
      } else {
        // Only one move: the server makes it after a beat. Otherwise the phone picks.
        if (await until(() => lS(L1).turnSeq !== s.turnSeq, 1500)) sawForced = true;
        else {
          const res = await up.act('move', { piece: s.movable[0], seq: s.turnSeq });
          if (!res.ok) refused++;
          else sawMove = true;
        }
      }
      await until(() => lS(L1).turnSeq !== s.turnSeq, 3000);
    }
    check(refused === 0, 'ludo: every roll and move a phone made by the rules was taken');
    check(rolls >= 10 && (sawMove || sawForced), 'ludo: turns go round, the dice roll on the server and pieces move');
    const pieces = lS(L1).pieces;
    check(Object.keys(pieces).every((id) => pieces[id].length === 4 && pieces[id].every((r) => r >= -1 && r <= 56)), 'ludo: every piece is somewhere on the board');
    // Someone leaves: their pieces go, and the game goes on while two are left.
    const leaver = five.find((b) => b.pid !== L1.pid && lS(L1).seats.indexOf(b.pid) !== -1);
    await api('/leave', { code: L1.code, pid: leaver.pid, key: leaver.key });
    leaver.close();
    await L1.waitFor((s) => s.shared.seats.indexOf(leaver.pid) === -1 && !s.shared.pieces[leaver.pid] && s.shared.phase === 'play', 'ludo: a player who leaves takes their pieces off, and play goes on');
    five.forEach((b) => b.close());

    // A person and a computer player: the bot rolls and moves on the server's own clock.
    const H = await Bot.host('Laila', null);
    await H.must('chooseGame', { game: 'ludo' });
    await H.must('addBot', { level: 'hard', name: 'زيزو' });
    await H.must('start', {});
    const bot = lS(H).seats.find((id) => id !== H.pid);
    const botMoved = async () => {
      for (let k = 0; k < 80; k++) {
        const s = lS(H);
        if (s.phase !== 'play') return false;
        if (s.events.some((e) => e.type === 'roll' && e.pid === bot)) return true;
        if (s.turn.pid === H.pid) {
          if (s.turn.stage === 'roll') await H.act('roll', { seq: s.turnSeq });
          else await until(() => lS(H).turnSeq !== s.turnSeq, 2500) || await H.act('move', { piece: s.movable[0], seq: s.turnSeq });
        }
        await until(() => lS(H).turnSeq !== s.turnSeq, 3000);
      }
      return false;
    };
    check(await botMoved(), 'ludo bots: the computer player rolls on its own');
    const P = await Bot.join(H.code, 'Karim');
    check(P.state.inGame === false && Array.isArray((P.state.shared || {}).seats), 'ludo: someone who joins mid-game is sent the board to watch');
    // The last person leaves a game with a computer player: it is over.
    await api('/leave', { code: H.code, pid: P.pid, key: P.key });
    P.close();
    H.close();
  }

  /* --- بنك الحظ ------------------------------------------------------------------------ */
  console.log('• bank (pieces in the lobby, the options, the roll-off, turns and buying, the decks kept secret, an offer, a computer player, leaving)');
  {
    const bS = (b) => b.state.shared || {};
    const until = async (fn, ms = 4000) => {
      for (const end = Date.now() + ms; Date.now() < end;) {
        try { if (fn()) return true; } catch (e) {}
        await sleep(25);
      }
      return false;
    };
    const K1 = await Bot.host('ليلى', null);
    const K2 = await Bot.join(K1.code, 'Sam');
    const K3 = await Bot.join(K1.code, 'حسن');
    const three = [K1, K2, K3];
    await K1.must('chooseGame', { game: 'bank' });
    await K2.must('token', { token: 'camel' });
    check((await K3.act('token', { token: 'camel' })).ok === false, 'bank: a piece already taken is refused');
    check((await K2.act('start', {})).ok === false, 'bank: only the host starts');
    await K1.must('start', { length: 30, pot: true, go400: false, firstLap: false, turnClock: 0 });
    await all(three, (s) => s.phase === 'play' && Array.isArray(s.shared.seats) && s.shared.seats.length === 3, 'bank: three are dealt in');
    const s0 = bS(K1);
    check(s0.tokens[K2.pid] === 'camel' && new Set(Object.values(s0.tokens)).size === 3 && s0.settings.length === 30 && s0.settings.pot === true && s0.settings.firstLap === false,
      "bank: the piece picked is kept, the rest filled in, and the host's options apply");
    check(s0.events.some((e) => e.type === 'rolloff' && e.first === s0.turn.pid) && Object.values(s0.cash).every((c) => c === 1500), 'bank: the roll-off decides who starts; 1,500 each');
    check(!three.some((b) => JSON.stringify(b.state).includes('"decks"')), 'bank: no phone is sent the order of the decks');
    const off = three.find((b) => b.pid !== s0.turn.pid);
    check((await off.act('roll', { seq: s0.turnSeq })).ok === false, 'bank: out of turn is refused');
    // Play turns: roll, buy what can be bought, end the turn.
    let refused = 0;
    let bought = 0;
    let paidRent = false;
    for (let k = 0; k < 70 && bS(K1).phase === 'play'; k++) {
      const s = bS(K1);
      const up = three.find((b) => b.pid === s.turn.pid);
      if (!up) break;
      await until(() => bS(up).turnSeq === s.turnSeq && bS(up).eventSeq === s.eventSeq, 2000);
      const st = s.turn.stage;
      let res = { ok: true };
      if (st === 'roll') res = await up.act('roll', { seq: s.turnSeq });
      else if (st === 'buy') {
        // Buy what the cash covers; leave the rest with the bank, as a player would.
        const yes = (s.cash[up.pid] || 0) >= BANK.BANK_SQUARES[s.pos[up.pid]].price;
        res = await up.act('buy', { yes, seq: s.turnSeq });
        if (res.ok && yes) bought++;
      }
      else if (st === 'act') res = await up.act('endTurn', { seq: s.turnSeq });
      else if (st === 'debt') res = await up.act(s.cash[up.pid] >= s.debt.amount ? 'payDebt' : 'bankrupt', { seq: s.turnSeq });
      if (!res.ok) { refused++; console.log('  ! refused', st, res.error); }
      if ((bS(K1).events || []).some((e) => e.type === 'rent' && e.amount > 0)) paidRent = true;
      await until(() => bS(K1).turnSeq !== s.turnSeq || bS(K1).eventSeq !== s.eventSeq, 3000);
    }
    check(refused === 0, 'bank: every move a phone made by the rules was taken');
    check(bought >= 3, 'bank: places are bought and the turns go round');
    const sM = bS(K1);
    check(Object.keys(sM.own).every((i) => sM.seats.indexOf(sM.own[i].by) !== -1) && Object.values(sM.cash).every((c) => c >= 0), 'bank: every place has an owner at the table, and no cash below nothing');
    // An offer on your own turn, answered by the other phone. The loop above
    // stops wherever the turn was; offers are made from 'roll' or 'act', so a
    // purchase or a debt waiting is settled first.
    for (let k = 0; k < 8 && bS(K1).phase === 'play'; k++) {
      const s = bS(K1);
      if (s.turn.stage === 'roll' || s.turn.stage === 'act') break;
      const up = three.find((b) => b.pid === s.turn.pid);
      await until(() => bS(up).turnSeq === s.turnSeq && bS(up).eventSeq === s.eventSeq, 2000);
      if (s.turn.stage === 'buy') await up.act('buy', { yes: false, seq: s.turnSeq });
      else if (s.turn.stage === 'debt') await up.act(s.cash[up.pid] >= s.debt.amount ? 'payDebt' : 'bankrupt', { seq: s.turnSeq });
      await until(() => bS(K1).turnSeq !== s.turnSeq || bS(K1).eventSeq !== s.eventSeq, 3000);
    }
    await until(() => bS(K1).turn.stage === 'roll' || bS(K1).turn.stage === 'act', 3000);
    const upO = three.find((b) => b.pid === bS(K1).turn.pid);
    const other = three.find((b) => b !== upO);
    const third = three.find((b) => b !== upO && b !== other);
    await until(() => bS(upO).eventSeq === bS(K1).eventSeq, 2000);
    const made = await upO.act('offer', { to: other.pid, give: { cash: 10 }, get: {}, ev: bS(upO).eventSeq });
    check(made.ok, 'bank: an offer is made on your own turn');
    await other.waitFor((s) => !!s.shared.offer && s.shared.offer.to === other.pid, 'bank: the offer reaches the other phone');
    const oid = (bS(other).offer || {}).id;
    await third.act('answer', { yes: true, id: oid });
    await sleep(300);
    check(!!bS(K1).offer, 'bank: only the player it was made to can answer');
    const cashBefore = bS(K1).cash[other.pid];
    await other.must('answer', { yes: true, id: oid });
    await K1.waitFor((s) => !s.shared.offer && s.shared.cash[other.pid] === cashBefore + 10, 'bank: yes: the money changes hands');
    // Someone leaves: their places go back to the bank, and play goes on.
    const leaver = three.find((b) => b !== K1);
    await api('/leave', { code: K1.code, pid: leaver.pid, key: leaver.key });
    leaver.close();
    await K1.waitFor((s) => s.shared.out.indexOf(leaver.pid) !== -1 && !Object.values(s.shared.own).some((o) => o.by === leaver.pid), 'bank: a player who leaves is out, and their places go back to the bank');
    three.forEach((b) => b.close());

    // A person and a computer player: the bot plays on the server's own clock.
    const H = await Bot.host('Mona', null);
    await H.must('chooseGame', { game: 'bank' });
    await H.must('addBot', { level: 'hard', name: 'زيزو' });
    await H.must('start', {});
    const bot = bS(H).seats.find((id) => id !== H.pid);
    let botRolled = false;
    for (let k = 0; k < 40 && !botRolled; k++) {
      const s = bS(H);
      if ((s.events || []).some((e) => e.type === 'roll' && e.pid === bot)) { botRolled = true; break; }
      if (s.turn.pid === H.pid) {
        const st = s.turn.stage;
        if (st === 'roll') await H.act('roll', { seq: s.turnSeq });
        else if (st === 'buy') await H.act('buy', { yes: false, seq: s.turnSeq });
        else if (st === 'act') await H.act('endTurn', { seq: s.turnSeq });
        else if (st === 'debt') await H.act('bankrupt', { seq: s.turnSeq });
      }
      await until(() => bS(H).eventSeq !== s.eventSeq, 3000);
    }
    check(botRolled, 'bank bots: the computer player rolls on its own');
    H.close();
  }

  /* --- prompt memory across rooms ---------------------------------------- */
  /* --- خمّن مين: two duel, the room watches, winner stays on ---------------------- */
  console.log('• guess who (the secret faces, a list question the other answers, one out loud, one typed, a wrong guess, winner stays on, a computer player)');
  {
    const H = await Bot.host('هاني', null);
    const J = await Bot.join(H.code, 'جنى');
    const K = await Bot.join(H.code, 'كمال');
    const S = await Bot.join(H.code, '', true);
    const gwBots = [H, J, K];
    await H.must('chooseGame', { game: 'guesswho' });
    await H.must('start', { size: 16 });
    await all(gwBots.concat([S]), (s) => s.game === 'guesswho' && s.shared.phase === 'play' && s.shared.faces.length === 16 &&
                                         s.shared.seats.length === 2 && s.shared.line.length === 1,
              'guesswho: two sit down with 16 faces, one waits in line');
    const first = byId(gwBots, H.state.shared.seats[0]);
    const second = byId(gwBots, H.state.shared.seats[1]);
    const watcher = gwBots.find((b) => b !== first && b !== second);
    check(typeof first.state.you.face === 'number' && typeof second.state.you.face === 'number' && !watcher.state.you && S.state.you === null,
          'guesswho: each seated phone holds its own face, the one watching and the TV none');
    check(!leaks(watcher, '"reveal":[') && !leaks(S, '"reveal":['), 'guesswho: no face is shown to the table while it is played');
    let s = H.state.shared;
    const q = GW.gwBotQuestion(s.faces, s.down[0], [], 'hard');
    check((await watcher.act('ask', { q, seq: s.turnSeq })).ok === false, 'guesswho: someone in the line cannot ask');
    await first.must('ask', { q, seq: s.turnSeq });
    await all(gwBots, (st) => st.shared.q && st.shared.q.qi === q && st.shared.stage === 'answer' && st.shared.q.answer === null,
              'guesswho: a list question waits on the other phone');
    const truth = GW.gwAnswer(q, second.state.shared.faces[second.state.you.face]);
    check((await second.act('answer', { yes: !truth, seq: second.state.shared.turnSeq })).ok === false, 'guesswho: a wrong answer to a list question is refused');
    await second.must('answer', { yes: truth, seq: second.state.shared.turnSeq });
    await all(gwBots, (st) => st.shared.stage === 'flip' && st.shared.q.answer === truth && st.shared.turn === 0,
              'guesswho: the true answer reaches the whole room, and the asker flips by hand');
    await first.must('done', { seq: first.state.shared.turnSeq });
    await all(gwBots, (st) => st.shared.turn === 1 && st.shared.stage === 'ask', 'guesswho: done passes the turn');
    // Out loud: the other answers on their phone, then the asker flips by hand.
    s = second.state.shared;
    await second.must('loud', { seq: s.turnSeq });
    await first.waitFor((st) => st.shared.stage === 'answer', 'guesswho: an out-loud question waits on the other phone');
    await first.must('answer', { yes: true, seq: first.state.shared.turnSeq });
    await second.waitFor((st) => st.shared.stage === 'flip' && st.shared.q.answer === true, 'guesswho: the answer comes back to the asker');
    await second.must('flip', { face: 0, down: true });
    await second.must('done', { seq: second.state.shared.turnSeq });
    await all(gwBots, (st) => st.shared.turn === 0 && st.shared.down[1].indexOf(0) !== -1, 'guesswho: a face put down by hand is down on every phone');
    // Typed: the text reaches the other phone, and the answer comes back.
    await first.must('typed', { text: 'بتضحك؟', seq: first.state.shared.turnSeq });
    await second.waitFor((st) => st.shared.stage === 'answer' && st.shared.q.kind === 'typed' && st.shared.q.text === 'بتضحك؟', 'guesswho: a typed question reaches the other phone');
    await second.must('answer', { yes: false, seq: second.state.shared.turnSeq });
    await first.waitFor((st) => st.shared.stage === 'flip' && st.shared.q.answer === false, 'guesswho: its answer comes back');
    await first.must('done', { seq: first.state.shared.turnSeq });
    await all(gwBots, (st) => st.shared.turn === 1 && st.shared.stage === 'ask', 'guesswho: and the turn passes');
    s = second.state.shared;
    const q2 = GW.gwBotQuestion(s.faces, s.down[1], s.asked[1], 'hard');
    await second.must('ask', { q: q2, seq: s.turnSeq });
    await first.waitFor((st) => st.shared.stage === 'answer', 'guesswho: the second asks from the list');
    await first.must('answer', { yes: GW.gwAnswer(q2, first.state.shared.faces[first.state.you.face]), seq: first.state.shared.turnSeq });
    await second.waitFor((st) => st.shared.stage === 'flip', 'guesswho: and is answered');
    await second.must('done', { seq: second.state.shared.turnSeq });
    await all(gwBots, (st) => st.shared.turn === 0 && st.shared.stage === 'ask', 'guesswho: back to the first');
    // A wrong guess loses the game.
    s = first.state.shared;
    const wrong = s.faces.map((_, i) => i).find((i) => i !== second.state.you.face);
    await first.must('guess', { face: wrong, seq: s.turnSeq });
    await all(gwBots.concat([S]), (st) => st.shared.phase === 'over' && st.shared.result.reason === 'wrong' && st.shared.result.winnerId === second.pid &&
                                         Array.isArray(st.shared.reveal) && st.shared.reveal[1] === second.state.you.face,
              'guesswho: a wrong guess loses, and both faces are shown on every screen');
    await watcher.must('nextRound', { round: H.state.shared.round });
    await all(gwBots, (st) => st.shared.phase === 'play' && st.shared.seats[0] === watcher.pid && st.shared.seats[1] === second.pid,
              'guesswho: the next in line sits down against the winner, and asks first');
    check(first.state.you === null || first.state.you.face === undefined, 'guesswho: the one who lost holds no face any more');
    await H.must('backToHub');
    gwBots.concat([S]).forEach((b) => b.close());

    // Against a computer player, played to the end on the server's clock.
    const P = await Bot.host('بسام', null);
    await P.must('chooseGame', { game: 'guesswho' });
    await P.must('addBot', { level: 'hard', name: 'زيزو' });
    await P.must('start', { size: 24 });
    const end = Date.now() + 90000;
    while (Date.now() < end && P.state.shared.phase === 'play') {
      const st = P.state.shared;
      const seat = st.seats.indexOf(P.pid);
      if (st.stage === 'answer' && st.turn !== seat) {
        await P.act('answer', { yes: GW.gwAnswer(st.q.qi, st.faces[P.state.you.face]), seq: st.turnSeq });
      } else if (st.stage === 'flip' && st.turn === seat) {
        for (const f of GW.gwRuledOut(st.faces, st.down[seat], st.q.qi, st.q.answer)) await P.act('flip', { face: f, down: true });
        await P.act('done', { seq: P.state.shared.turnSeq });
      } else if (st.turn === seat && st.stage === 'ask') {
        const left = GW.gwUp(st.faces, st.down[seat]);
        const qi = GW.gwBotQuestion(st.faces, st.down[seat], st.asked[seat], 'hard');
        if (qi < 0 || left.length <= 1) await P.act('guess', { face: left[0], seq: st.turnSeq });
        else await P.act('ask', { q: qi, seq: st.turnSeq });
      }
      await sleep(250);
    }
    check(P.state.shared.phase === 'over' && P.state.shared.result.reason === 'guess', 'guesswho: a game against a computer player is played to the end');
    const botSeat = P.state.shared.seats.findIndex((id) => id !== P.pid);
    check(P.state.shared.log.filter((e) => e.seat === botSeat).every((e) => e.kind === 'list' || e.kind === 'guess'),
          'guesswho: the computer player asks from the list');
    P.close();
  }

  /* --- حرب السفن: two duel, the room watches, winner stays on ------------------------- */
  console.log('• battleship (each fleet on its own phone, placing and ready, a hit shoots again, a sunk ship shown, winner stays on, the host plays for a quiet phone)');
  {
    const H = await Bot.host('بحري', null);
    const J = await Bot.join(H.code, 'Jana');
    const K = await Bot.join(H.code, 'كريم');
    const S = await Bot.join(H.code, '', true);
    const bsBots = [H, J, K];
    const cellsOf = (fleet) => {
      const out = [];
      [5, 4, 3, 3, 2].forEach((len, i) => { const p = fleet[i]; const c = []; for (let n = 0; n < len; n++) c.push(p.d === 'v' ? (p.y + n) * 10 + p.x : p.y * 10 + p.x + n); out.push(c); });
      return out;
    };
    await H.must('chooseGame', { game: 'battleship' });
    await H.must('start', {});
    await all(bsBots.concat([S]), (s) => s.game === 'battleship' && s.shared.phase === 'place' && s.shared.seats.length === 2 && s.shared.line.length === 1,
              'battleship: two sit down to place their fleets, one waits in line');
    const first = byId(bsBots, H.state.shared.seats[0]);
    const second = byId(bsBots, H.state.shared.seats[1]);
    const watcher = bsBots.find((b) => b !== first && b !== second);
    check(first.state.you && first.state.you.fleet.length === 5 && second.state.you && second.state.you.fleet.length === 5 && !watcher.state.you && S.state.you === null,
          'battleship: each seated phone holds its own fleet, the one watching and the TV none');
    check(!leaks(watcher, '"fleet"') && !leaks(S, '"fleet"') && !leaks(first, JSON.stringify(second.state.you.fleet)),
          'battleship: no fleet reaches another phone or the TV');
    const touching = [{ x: 0, y: 0, d: 'h' }, { x: 0, y: 1, d: 'h' }, { x: 0, y: 4, d: 'h' }, { x: 0, y: 6, d: 'h' }, { x: 0, y: 8, d: 'h' }];
    check((await first.act('place', { fleet: touching })).ok === false, 'battleship: a fleet with ships touching is refused');
    await first.must('place', { fleet: first.state.you.fleet });
    await second.waitFor((s) => s.shared.ready[0] === true && s.shared.phase === 'place', 'battleship: ready shows on the other phone, and the game waits');
    await second.must('place', { fleet: second.state.you.fleet });
    await all(bsBots.concat([S]), (s) => s.shared.phase === 'play' && s.shared.turn === 0, 'battleship: both ready, the first seat fires');
    let seq = first.state.shared.turnSeq;
    check((await second.act('fire', { cell: 0, seq: second.state.shared.turnSeq })).ok === false, 'battleship: out of turn is refused');
    check((await watcher.act('fire', { cell: 0, seq })).ok === false, 'battleship: someone in the line cannot fire');
    // The robots know where the other fleet is (the test must); the rules don't care how the square was chosen.
    const target = cellsOf(second.state.you.fleet);
    await first.must('fire', { cell: target[4][0], seq });
    await all(bsBots.concat([S]), (s) => s.shared.shots === 1 && s.shared.turn === 0 && s.shared.last.res === 'hit',
              'battleship: a hit reaches every screen, and the same player fires again');
    await first.must('fire', { cell: target[4][1], seq: first.state.shared.turnSeq });
    await all(bsBots.concat([S]), (s) => s.shared.last.res === 'sunk' && s.shared.last.ship === 4 && s.shared.seas[1].sunk.length === 1 &&
                                         s.shared.seas[1].sunk[0].x === second.state.you.fleet[4].x && s.shared.seas[1].grid.some((v) => v === 4),
              'battleship: a sunk ship is shown whole on every screen, the water round it marked');
    const water = second.state.shared.seas[1].grid.map((v, i) => i).find((i) => second.state.shared.seas[1].grid[i] === 0 && !target.some((c) => c.indexOf(i) !== -1));
    await first.must('fire', { cell: water, seq: first.state.shared.turnSeq });
    await all(bsBots, (s) => s.shared.turn === 1 && s.shared.last.res === 'miss', 'battleship: a miss passes the turn');
    // Played to the end: whoever is up fires at the next square of a ship afloat.
    const fleets = [cellsOf(first.state.you.fleet), target];
    for (let k = 0; k < 60 && H.state.shared.phase === 'play'; k++) {
      const s = H.state.shared;
      const up = byId(bsBots, s.seats[s.turn]);
      // The first sinks ships; the second only finds water, so the first wins.
      const aim = s.turn === 0 ? fleets[1].flat().find((c) => s.seas[1].grid[c] === 0)
        : s.seas[0].grid.map((v, i) => i).find((i) => s.seas[0].grid[i] === 0 && !fleets[0].flat().includes(i));
      await up.must('fire', { cell: aim, seq: s.turnSeq });
      await H.waitFor((st) => st.shared.shots > s.shots, 'battleship: a shot lands', 3000);
    }
    await all(bsBots.concat([S]), (s) => s.shared.phase === 'over' && s.shared.result.winnerId === first.pid && s.shared.result.reason === 'fleet' &&
                                         Array.isArray(s.shared.reveal) && JSON.stringify(s.shared.reveal[1]) === JSON.stringify(second.state.you.fleet),
              'battleship: the last ship down wins, and both fleets are shown on every screen');
    await watcher.must('nextRound', { round: H.state.shared.round });
    await all(bsBots, (s) => s.shared.phase === 'place' && s.shared.seats[0] === watcher.pid && s.shared.seats[1] === first.pid,
              'battleship: the next in line sits down against the winner, and fires first');
    check(!second.state.you || second.state.you.fleet === undefined, 'battleship: the one who lost holds no fleet any more');
    // The host plays for a quiet phone: placing, then a shot at random.
    await H.must('skipTurn', { seq: H.state.shared.turnSeq });
    await all(bsBots, (s) => s.shared.phase === 'play', 'battleship: the host\'s "play for" sails both fleets as they are');
    await H.must('skipTurn', { seq: H.state.shared.turnSeq });
    await all(bsBots, (s) => s.shared.shots === 1, 'battleship: and fires one shot at random for the player up');
    await H.must('backToHub');
    bsBots.concat([S]).forEach((b) => b.close());
  }

  /* --- شطرنج: two play, the room watches, winner stays on, a clock ------------------ */
  console.log('• chess (White first, illegal and stale moves refused, a draw offered and refused, mate, winner stays on, resigning, a forfeit, the clock)');
  {
    const H = await Bot.host('شطرنج', null);
    const J = await Bot.join(H.code, 'Jana');
    const K = await Bot.join(H.code, 'كريم');
    const S = await Bot.join(H.code, '', true);
    const chBots = [H, J, K];
    const mv = (b, u) => b.act('move', { from: u.slice(0, 2), to: u.slice(2, 4), promo: u.slice(4), move: b.state.shared.chess.moves });
    await H.must('chooseGame', { game: 'chess' });
    await H.must('start', { clock: '3+2' });
    await all(chBots.concat([S]), (s) => s.game === 'chess' && s.shared.phase === 'play' && s.shared.seats.length === 2 && s.shared.line.length === 1 &&
                                        s.shared.chess.clock.left[0] === 180000 && s.shared.chess.g.turn === 0,
              'chess: two sit down (White first), one waits in line, the clock is the host\'s 3+2');
    let white = byId(chBots, H.state.shared.seats[0]);
    let black = byId(chBots, H.state.shared.seats[1]);
    let watcher = chBots.find((b) => b !== white && b !== black);
    check((await mv(black, 'e7e5')).ok === false, 'chess: Black can\'t move first');
    check((await mv(watcher, 'e2e4')).ok === false, 'chess: someone in the line can\'t move');
    check((await mv(white, 'e2e5')).ok === false, 'chess: an illegal move is refused');
    check((await S.act('move', { from: 'e2', to: 'e4', move: 0 })).ok === false, 'chess: the TV can\'t move');
    await white.must('move', { from: 'f2', to: 'f3', move: 0 });
    await all(chBots.concat([S]), (s) => s.shared.chess.moves === 1 && s.shared.chess.last.to === 'f3' && s.shared.chess.clock.at > 0,
              'chess: a move reaches every screen, and Black\'s clock starts');
    await white.act('move', { from: 'f3', to: 'f4', move: 0 });
    check(white.state.shared.chess.moves === 1, 'chess: a second tap drawn for the board before is dropped');
    await mv(black, 'e7e5');
    await black.waitFor((s) => s.shared.chess.moves === 2, 'chess: Black moves');
    await white.must('offerDraw', { move: 2 });
    await black.waitFor((s) => s.shared.chess.offer && s.shared.chess.offer.seat === 0, 'chess: the draw offer reaches the other player');
    await black.must('answerDraw', { accept: false });
    await all(chBots, (s) => !s.shared.chess.offer && s.shared.phase === 'play', 'chess: refused, the game goes on');
    await mv(white, 'g2g4');
    await black.waitFor((s) => s.shared.chess.moves === 3, 'chess: White moves');
    await mv(black, 'd8h4');
    await all(chBots.concat([S]), (s) => s.shared.phase === 'over' && s.shared.chess.result.reason === 'mate' && s.shared.result.winnerId === black.pid &&
                                        s.shared.chess.sans.join(' ') === 'f3 e5 g4 Qh4#' && s.shared.chess.hist.join(' ') === 'f2f3 e7e5 g2g4 d8h4',
              'chess: the fool\'s mate ends the game on every screen; the moves are kept (for the review)');
    await watcher.must('nextRound', { round: H.state.shared.round });
    await all(chBots, (s) => s.shared.phase === 'play' && s.shared.seats[0] === watcher.pid && s.shared.seats[1] === black.pid && s.shared.chess.moves === 0,
              'chess: the next in line sits down with White against the champion');
    white = byId(chBots, H.state.shared.seats[0]); black = byId(chBots, H.state.shared.seats[1]);
    await black.must('resign', { round: H.state.shared.round });
    await all(chBots, (s) => s.shared.phase === 'over' && s.shared.chess.result.reason === 'resign' && s.shared.result.winnerId === white.pid,
              'chess: resigning gives the game to the other');
    await H.must('nextRound', { round: H.state.shared.round });
    await all(chBots, (s) => s.shared.phase === 'play', 'chess: the next game');
    // A seated player who leaves loses by forfeit.
    const seatedNow = H.state.shared.seats.map((id) => byId(chBots, id));
    const leaver = seatedNow.find((b) => b !== H) || seatedNow[1];
    const stayer = seatedNow.find((b) => b !== leaver);
    await api('/leave', { code: H.code, pid: leaver.pid, key: leaver.key });
    await stayer.waitFor((s) => s.shared.phase === 'over' && s.shared.result.reason === 'left' && s.shared.result.winnerId === stayer.pid,
                         'chess: a seated player who leaves loses by forfeit');
    await H.must('backToHub');
    chBots.concat([S]).forEach((b) => b.close());
  }

  await teamChessRobots();
  /* --- باغ هاوس: four on two boards, the hands, drops, computer players --------------- */
  console.log('• bughouse (two people and two computer players, two boards, a capture sent to the partner and dropped, the bots on their own, a leaver taken over, resigning, play again)');
  {
    const H = await Bot.host('منى', null);
    const J = await Bot.join(H.code, 'Joe');
    const S = await Bot.join(H.code, '', true);
    const people = [H, J];
    await H.must('chooseGame', { game: 'bughouse' });
    check((await J.act('start', {})).ok === false, 'bughouse: only the host starts');
    await H.must('start', { clock: '5+0', botNames: ['زيزو', 'بندق'] });
    await all(people.concat([S]), (s) => s.game === 'bughouse' && s.shared.phase === 'play' && s.shared.seats.length === 4 && s.shared.boards.length === 2 &&
                                        s.players.filter((p) => p.bot).length === 2 && s.shared.boards[0].clock.left[0] === 300000,
              'bughouse: two people and two computer players take the four seats, two boards, the host\'s 5+0 on both');
    const seatOf = (b) => H.state.shared.seats.indexOf(b.pid);
    const bs = () => H.state.shared;
    check((await S.act('move', { from: 'e2', to: 'e4', move: 0 })).ok === false, 'bughouse: the TV can\'t move');
    // Each person moves on their own board whenever it is their turn; the bots answer on the server's clock.
    const played = { moves: 0, drops: 0, captures: 0 };
    let refused = 0;
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline && bs().phase === 'play' && (played.moves < 12 || !played.drops)) {
      let moved = false;
      for (const b of people) {
        const s = b.state.shared;
        const k = s.seats.indexOf(b.pid);
        const bd = s.boards[k >> 1];
        if (s.phase !== 'play' || bd.g.turn !== (k & 1)) continue;
        const drops = CHM.chessBugDrops(bd.g), moves = CHM.chessLegalMoves(bd.g);
        const caps = moves.filter((m) => m.capture);
        let r;
        if (drops.length) { const d = drops[Math.floor(Math.random() * drops.length)]; r = await b.act('drop', { drop: d.drop, to: d.to, move: bd.moves }); if (r.ok) played.drops++; }
        else if (moves.length) { const m = (caps.length ? caps : moves)[Math.floor(Math.random() * (caps.length || moves.length))]; r = await b.act('move', { from: m.from, to: m.to, promo: m.promo, move: bd.moves }); if (r.ok && m.capture) played.captures++; }
        if (r && r.ok) { played.moves++; moved = true; } else if (r) refused++;
      }
      if (!moved) await new Promise((res) => setTimeout(res, 250));
    }
    check(!refused && played.moves >= 6, `bughouse: every move and drop the phones made by the rules was taken (${played.moves} moves, ${played.drops} drops, ${played.captures} captures)`);
    const s1 = bs();
    const botSeats = s1.seats.map((id, k) => (H.state.players.some((p) => p.id === id && p.bot) ? k : -1)).filter((k) => k >= 0);
    check(botSeats.some((k) => s1.boards[k >> 1].sans.length > (k & 1)), 'bughouse: the computer players move on their own, on the server');
    check(!played.drops || s1.boards.some((bd) => bd.sans.some((x) => x.indexOf('@') !== -1)), 'bughouse: a drop is written with @ (N@f3)');
    await all(people.concat([S]), (s) => JSON.stringify(s.shared.boards.map((bd) => bd.g.hand)) === JSON.stringify(bs().boards.map((bd) => bd.g.hand)) || s.shared.phase === 'over',
              'bughouse: every phone and the TV see the same hands');
    if (bs().phase === 'play') {
      // Joe leaves: a computer player takes his board, and the game goes on.
      const k = seatOf(J);
      await api('/leave', { code: H.code, pid: J.pid, key: J.key });
      J.close();
      await H.waitFor((s) => s.shared.phase !== 'play' || (s.shared.seats[k] !== J.pid && s.shared.subs && s.shared.subs[k] === 'Joe' &&
                             s.players.some((p) => p.id === s.shared.seats[k] && p.bot === 'hard')),
                      'bughouse: a player who leaves is replaced on their board by a computer player');
    }
    if (bs().phase === 'play') await H.must('resign', { round: bs().round });
    await all([H, S], (s) => s.shared.phase === 'over' && !!s.shared.result && s.shared.board.length >= 1, 'bughouse: the game ends (a mate, a flag or a resignation) on every screen, with the scores');
    const pairs = (s) => [[s.seats[0], s.seats[3]], [s.seats[1], s.seats[2]]].map((p) => p.slice().sort().join('+')).sort().join('/');
    const before = pairs(bs());
    await H.must('playAgain', { round: bs().round });
    await all([H, S], (s) => s.shared.phase === 'play' && s.shared.round === 2 && s.shared.boards[0].moves === 0, 'bughouse: play again deals two new boards');
    check(pairs(bs()) !== before, 'bughouse: play again turns the partners round');
    await H.must('backToHub');
    [H, S].forEach((b) => b.close());
  }

  /* --- المشنقة: one writes and the rest guess, then a race ------------------------ */
  console.log('• hangman (a written word kept from the guessers, each board its own, the writer\'s points, a race, the clock)');
  {
    const H = await Bot.host('هالة', null);
    const J = await Bot.join(H.code, 'جاد');
    const K = await Bot.join(H.code, 'Kate');
    const S = await Bot.join(H.code, '', true);
    const hmBots = [H, J, K];
    await H.must('chooseGame', { game: 'hangman' });
    await H.must('start', { mode: 'setter', rounds: 3, clock: 0, lang: 'ar' });
    await all(hmBots, (s) => s.game === 'hangman' && s.shared.phase === 'writing' && !!s.shared.setter, 'hangman: one writes the first word');
    const writer = byId(hmBots, H.state.shared.setter);
    const guessers = hmBots.filter((b) => b !== writer);
    check((await guessers[0].act('setWord', { word: 'مدرسة', round: 1 })).ok === false, 'hangman: only the writer writes');
    check((await writer.act('setWord', { word: 'مدرسة كبيرة في البلد', round: 1 })).ok === false, 'hangman: four words are a sentence, and refused');
    await writer.must('setWord', { word: 'مدرسة', hint: 'مكان', round: 1 });
    await all(hmBots, (s) => s.shared.phase === 'guessing' && s.shared.len === 5 && s.shared.cat === 'مكان',
              'hangman: the word is out, five blanks and the writer\'s hint on every phone');
    check(writer.state.you.word === 'مدرسة' && guessers.every((b) => !leaks(b, 'مدرسة') && Array.isArray(b.state.you.pattern)) && !leaks(S, 'مدرسة'),
          'hangman: the word is on the writer\'s phone only - not the guessers\', not the TV');
    await guessers[0].must('guess', { letter: 'د', round: 1 });
    await guessers[0].must('guess', { letter: 'ك', round: 1 });
    await guessers[1].waitFor((s) => s.shared.progress[guessers[0].pid].n === 1 && s.shared.progress[guessers[0].pid].miss === 1,
                              'hangman: the table sees how far a board is');
    check(guessers[1].state.you.pattern.join('') === '' && !leaks(guessers[1], '"g":["د"]'), 'hangman: and never its letters');
    await guessers[0].must('whole', { text: 'مدرسه', round: 1 });
    for (const l of ['ث', 'ج', 'ح', 'خ', 'ذ', 'ز']) await guessers[1].must('guess', { letter: l, round: 1 });
    await all(hmBots.concat([S]), (s) => s.shared.phase === 'result' && s.shared.result.word === 'مدرسة', 'hangman: the word ends when all are done, and is shown');
    check(H.state.shared.scores[guessers[0].pid] === 10 && H.state.shared.scores[writer.pid] === 5 && !H.state.shared.scores[guessers[1].pid],
          'hangman: a solve is 10, the writer 5 for the one who was hanged');
    await H.must('nextRound', { round: 1 });
    await all(hmBots, (s) => s.shared.phase === 'writing' && s.shared.round === 2 && s.shared.setter !== writer.pid, 'hangman: the next word has the next writer');
    await H.must('backToHub');

    // The race: the app's word, the fastest first, the clock ending it.
    await H.must('chooseGame', { game: 'hangman' });
    await H.must('start', { mode: 'race', rounds: 3, clock: 60, lang: 'ar' });
    await all(hmBots, (s) => s.shared.phase === 'guessing' && !!s.shared.cat && !s.shared.setter && Array.isArray(s.you && s.you.pattern),
              'hangman: the race deals one word with its kind to everyone');
    const letters = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');
    for (const b of hmBots) {
      for (const l of letters) {
        if (!b.state.you || b.state.you.state !== 'play' || b.state.shared.phase !== 'guessing') break;
        await b.act('guess', { letter: l, round: 1 });
      }
    }
    await all(hmBots, (s) => s.shared.phase === 'result' && s.shared.result.rows.length === 3, 'hangman: a race word ends once every board is done');
    await H.must('nextRound', { round: 1 });
    await H.must('closeWord', { round: 2 });
    await H.must('nextRound', { round: 2 });
    await H.must('closeWord', { round: 3 });
    await all(hmBots.concat([S]), (s) => s.shared.phase === 'gameover' && s.phase === 'gameover', 'hangman: the game ends after the chosen number of words');
    await H.must('backToHub');
    await H.waitFor((s) => s.phase === 'lobby', 'hangman: back in the hub');
    hmBots.concat([S]).forEach((b) => b.close());
  }

  /* --- one sets, everyone solves (RoomSolve.js): خمن الكلمة, خمّن الرقم, خمّن الدولة, فوازير إيموجي ---- */
  console.log('• one sets, everyone solves (the secret on the setter\'s phone only, each board its own, the order\'s bonus, the setter\'s points, a race)');
  {
    // What each game's setter sends, a wrong guess, the right one, and a check of a wrong guess's answer on the solver's own board.
    const GAMES = {
      wordle: {
        start: { len: 5 }, secret: { word: 'مدرسة' }, bad: { word: 'قطة' }, show: 'مدرسة',
        wrong: { text: 'ملعقة' }, rightG: { text: 'مدرسة' },
        mark: (b) => b.board.g[0].c === 'caaac', markLabel: 'the colours come from the server (ملعقة against مدرسة: green, grey, grey, grey, green)',
        pub: (s) => s.pub.len === 5 && s.pub.alpha === 'ar'
      },
      guessnum: {
        start: { max: 100 }, secret: { n: 64 }, bad: { n: 101 }, show: 64,
        wrong: { n: 50 }, rightG: { n: 64 },
        mark: (b) => b.board.g[0].v === 'higher' && b.board.lo === 51, markLabel: 'higher or lower comes from the server, and the narrowed range is the solver\'s own',
        pub: (s) => s.pub.max === 100 && s.maxTries === 9
      },
      flags: {
        start: { clue: 'flag', level: 'easy' }, secret: { code: 'JP' }, bad: { code: 'ZZ' }, show: 'JP',
        wrong: { code: 'EG' }, rightG: { code: 'JP' },
        mark: (b) => b.board.g[0].km > 9000 && b.board.g[0].deg > 0 && b.board.g[0].p < 60, markLabel: 'the distance and the direction come from the server',
        pub: (s) => s.pub.clue === 'flag' && !!s.pub.flag && s.maxTries === 6
      },
      emoji: {
        start: { way: 'setter' }, secret: { answer: 'الفيل الأزرق', clue: '🐘🔵', kind: 'film' }, bad: { answer: 'الفيل الأزرق', clue: 'فيل 🐘', kind: 'film' }, show: 'الفيل الأزرق',
        wrong: { text: 'الأسد الملك' }, rightG: { text: 'الفيل الازرق' },
        mark: (b) => b.board.g[0].v === '', markLabel: 'a wrong guess is judged on the server',
        pub: (s) => s.pub.e === '🐘🔵' && s.pub.k === 'film'
      }
    };
    for (const game of Object.keys(GAMES)) {
      const G = GAMES[game];
      const H = await Bot.host('سارة', null);
      const J = await Bot.join(H.code, 'Jude');
      const K = await Bot.join(H.code, 'كريم');
      const S = await Bot.join(H.code, '', true);
      const svBots = [H, J, K];
      await H.must('chooseGame', { game });
      await H.must('start', Object.assign({ mode: 'setter', rounds: 3, clock: 0, lang: 'ar' }, G.start));
      await all(svBots, (s) => s.game === game && s.shared.solve === game && s.shared.phase === 'setting' && !!s.shared.setter, game + ': one sets the first secret, by default');
      const setter = byId(svBots, H.state.shared.setter);
      const [a, b] = svBots.filter((x) => x !== setter);
      check((await a.act('setSecret', Object.assign({ round: 1 }, G.secret))).ok === false, game + ': only the setter sets it');
      check((await setter.act('setSecret', Object.assign({ round: 1 }, G.bad))).ok === false, game + ': a secret that breaks the rules is refused');
      await setter.must('setSecret', Object.assign({ round: 1 }, G.secret));
      await all(svBots.concat([S]), (s) => s.shared.phase === 'solving' && G.pub(s.shared), game + ': the secret is set, and what the table may see of it is on every screen');
      // A number is looked for as a value (a timestamp holds any digits); a word or a code anywhere.
      const hidden = (bot) => (typeof G.show === 'number'
        ? !(bot.state.you && bot.state.you.mine) && !new RegExp(':' + G.show + '[,}]').test(JSON.stringify(bot.state.shared))
        : JSON.stringify(bot.state).indexOf(JSON.stringify(G.show)) === -1);
      check(!!setter.state.you.mine && hidden(a) && hidden(b) && hidden(S) && Array.isArray(a.state.you.board.g),
            game + ': the secret is on the setter\'s phone only - not a solver\'s, not the TV');
      await a.must('guess', Object.assign({ round: 1 }, G.wrong));
      check(G.mark(a.state.you), game + ': ' + G.markLabel);
      await b.waitFor((s) => s.shared.progress[a.pid].n === 1, game + ': the table sees how many tries a board has made');
      check(b.state.you.board.g.length === 0 && JSON.stringify(b.state.shared.progress).indexOf(JSON.stringify(G.wrong[Object.keys(G.wrong)[0]])) === -1,
            game + ': and never what they were');
      await b.must('guess', Object.assign({ round: 1 }, G.rightG));
      await a.must('guess', Object.assign({ round: 1 }, G.rightG));
      await all(svBots.concat([S]), (s) => s.shared.phase === 'result' && !!s.shared.result.reveal, game + ': the round ends once every board is done, and the secret is shown');
      check(H.state.shared.scores[b.pid] === 15 && H.state.shared.scores[a.pid] === 14 && !H.state.shared.scores[setter.pid],
            game + ': the first solve is 10 + 5, the second 10 + 4; nobody failed, so the setter has nothing');
      check(H.state.shared.board[0].id === b.pid && H.state.shared.board[0].tries === 1, game + ': the board keeps the tries for a tie');
      await H.must('nextRound', { round: 1 });
      await all(svBots, (s) => s.shared.phase === 'setting' && s.shared.round === 2 && s.shared.setter !== setter.pid, game + ': the next secret has the next setter');
      await H.must('skipTurn', { round: 2 });
      await all(svBots, (s) => s.shared.phase === 'setting' && s.shared.round === 2, game + ': the host moves on from a quiet setter');
      await H.must('backToHub');

      // The race: the app's pick, nobody sets; the host closes it.
      await H.must('chooseGame', { game });
      await H.must('start', Object.assign({ mode: 'race', way: 'race', rounds: 3, clock: game === 'wordle' ? 90 : 60, lang: 'ar' }, game === 'emoji' ? {} : G.start, game === 'emoji' ? { way: 'race' } : {}));
      await all(svBots.concat([S]), (s) => s.shared.phase === 'solving' && !s.shared.setter && !!s.shared.endsAt, game + ': the race deals the app\'s pick to everyone, on the clock');
      check(svBots.every((x) => !x.state.you.mine && Array.isArray(x.state.you.board.g)), game + ': in the race nobody holds the secret, everyone a board');
      if (game === 'guessnum') {
        // Halving finds it: the verdicts are all a phone needs.
        for (let k = 0; k < 9 && J.state.you.state === 'play'; k++) {
          const lo = J.state.you.board.lo, hi = J.state.you.board.hi;
          await J.must('guess', { n: Math.floor((lo + hi) / 2), round: 1 });
        }
        check(J.state.you.state === 'won', 'guessnum: halving on the server\'s higher and lower finds the number');
      }
      await H.must('closeRound', { round: 1 });
      await all(svBots.concat([S]), (s) => s.shared.phase === 'result' && s.shared.result.rows.length === 3 && !s.shared.result.setterPts, game + ': the host closes the race, and nobody sets, so nobody takes a setter\'s points');
      await H.must('backToHub');
      await H.waitFor((s) => s.phase === 'lobby', game + ': back in the hub');
      svBots.concat([S]).forEach((x) => x.close());
    }
  }

  /* --- ميني جولف: all at once, then in turns ------------------------------------------ */
  console.log('• minigolf (a mixed game drawn on the server, every ball on the hole at once, the putt on every phone, what the hole asks for + 3 strokes then picked up; nine hard holes in turns with the balls knocking each other, the next hole on the server\'s clock)');
  {
    const MG = new Function(readFileSync(new URL('../../MiniGolf.js', import.meta.url), 'utf8') + '\nreturn { golfHoleById, golfMaxOf };')();
    const G1 = await Bot.host('جميلة', null);
    const G2 = await Bot.join(G1.code, 'Gus');
    const G3 = await Bot.join(G1.code, 'غادة');
    const TV = await Bot.join(G1.code, '', true);
    const golfers = [G1, G2, G3];
    // The hole's clock the way a phone keeps it: the server's clock, not this computer's (they can be
    // seconds apart on the live server), taken from the smallest gap between a change and its arrival.
    const skew = new Map();
    const seeStamp = (b) => { const st = b.state.shared.stamp; if (!st) return; const gap = Date.now() - st; if (!skew.has(b) || gap < skew.get(b)) skew.set(b, gap); };
    const now = (b) => { seeStamp(b); return Date.now() - (skew.get(b) || 0) - b.state.shared.startedAt; };
    const putt = (b, shot) => b.act('putt', Object.assign({ hole: b.state.shared.hole, n: b.state.shared.balls[b.pid].n, t0: now(b) }, shot));
    await G1.must('chooseGame', { game: 'minigolf' });
    await G1.must('start', { holes: 3 });
    await all(golfers.concat([TV]), (s) => s.game === 'minigolf' && s.shared.phase === 'play' && s.shared.hole === 0 && Object.keys(s.shared.balls).length === 3,
              'minigolf: every ball on the first tee, all at once by default');
    const course = G1.state.shared.holes;
    check(G1.state.shared.settings.level === 'mix' && course.length === 3 && course.map((id) => MG.golfHoleById(id).lvl).join() === '1,2,3' &&
          golfers.concat([TV]).every((b) => JSON.stringify(b.state.shared.holes) === JSON.stringify(course)),
          'minigolf: a mixed game of three is one easy, one medium and one hard hole, the same list on every phone and the TV (' + course.join(', ') + ')');
    const tee0 = MG.golfHoleById(course[0]).tee, max0 = MG.golfMaxOf(MG.golfHoleById(course[0]));
    check(TV.state.you === null && !JSON.stringify(G2.state).includes('"_'), 'minigolf: nothing is hidden, and nothing server-only is sent');
    // Two putt together; every phone gets both putts to replay.
    const sent = now(G2);
    await Promise.all([putt(G2, { dx: 0, dy: 1000, power: 300, t0: sent }), putt(G3, { dx: 100, dy: 995, power: 250 })]);
    await all(golfers.concat([TV]), (s) => s.shared.shots[G2.pid] && s.shared.shots[G3.pid] && s.shared.shotSeq === 2,
              'minigolf: two putt at once, and every phone and the TV get both putts');
    const sh = G1.state.shared.shots[G2.pid];
    check(sh.t0 === sent && sh.from.join() === tee0.join() && Array.isArray(sh.at) && sh.dur > 0, 'minigolf: the putter\'s own moment is kept, with where the ball stopped and how long it rolled');
    check((await G2.act('putt', { dx: 0, dy: 1000, power: 300, t0: now(G2), hole: 0, n: 0 })).ok && G2.state.shared.balls[G2.pid].n === 1,
          'minigolf: a putt for a stroke already played is dropped');
    // Everyone runs out of strokes: picked up at 6, the hole counts 7, the next hole on the server's clock.
    for (const b of golfers) {
      for (let k = 0; k < 9 && !b.state.shared.balls[b.pid].done; k++) await putt(b, { dx: 0, dy: 1000, power: 20 });
    }
    await all(golfers, (s) => s.shared.phase === 'between' && s.shared.card[G1.pid][0] === max0 + 1,
              'minigolf: what the hole asks for + 3 strokes, then the ball is picked up; the hole counts ' + (max0 + 1) + ' and its card shows');
    await all(golfers, (s) => s.shared.phase === 'play' && s.shared.hole === 1, 'minigolf: the next hole starts by itself', 15000);
    await G1.must('backToHub');

    // In turns: one putt at a time, round the table, the balls knocking each other; nine holes.
    await G1.must('chooseGame', { game: 'minigolf' });
    await G1.must('start', { mode: 'turns', holes: 9, guide: true, level: 'hard' });
    await all(golfers, (s) => s.shared.phase === 'play' && s.shared.settings.mode === 'turns' && !!s.shared.turn && s.shared.settings.guide && s.shared.holes.length === 9,
              'minigolf: in turns, nine holes, one player is up');
    check(G1.state.shared.settings.level === 'hard' && G1.state.shared.holes.every((id) => MG.golfHoleById(id).lvl === 3) && new Set(G1.state.shared.holes).size === 9,
          'minigolf: a hard game deals nine different hard holes');
    let up = byId(golfers, G1.state.shared.turn);
    const notUp = golfers.find((b) => b !== up);
    check((await putt(notUp, { dx: 0, dy: 1000, power: 200 })).ok === false, 'minigolf: in turns, a putt out of turn is refused');
    const settle = async (pred) => { for (let i = 0; i < 80 && !pred(G1.state); i++) await sleep(50); };
    await putt(up, { dx: 0, dy: 1000, power: 100 });
    await all(golfers, (s) => s.shared.turn && s.shared.turn !== up.pid, 'minigolf: the turn goes round the table');
    check(Array.isArray(G1.state.shared.shots[up.pid].others) && !G1.state.shared.shots[up.pid].others.length,
          'minigolf: the first putt of the hole has no other ball to meet (the rest are still on the tee, off the course)');
    // The next one putts from the tee straight up the line into the ball lying there.
    const firstBall = up.pid;
    const lay = G1.state.shared.balls[firstBall].at.slice();
    up = byId(golfers, G1.state.shared.turn);
    const seq0 = G1.state.shared.shotSeq;
    // aimed from the tee at the ball lying a metre up the hole
    const aimAt = [lay[0] - G1.state.shared.balls[up.pid].at[0], lay[1] - G1.state.shared.balls[up.pid].at[1]];
    const aimL = Math.hypot(aimAt[0], aimAt[1]) || 1;
    await putt(up, { dx: Math.round(aimAt[0] / aimL * 1000), dy: Math.round(aimAt[1] / aimL * 1000), power: 260 });
    await settle((s) => s.shared.shotSeq > seq0);
    const knock = G1.state.shared.shots[up.pid];
    check(knock.others.some((o) => o.id === firstBall) && knock.moved.some((m) => m.id === firstBall) &&
          G1.state.shared.balls[firstBall].n === 1 && JSON.stringify(G1.state.shared.balls[firstBall].at) === JSON.stringify(knock.moved.find((m) => m.id === firstBall).at),
          'minigolf: in turns a putt knocks the ball lying in its way, on every phone the same (it lay at ' + lay.join(',') + ')');
    for (let hole = 0; hole < 9; hole++) {
      for (let guard = 0; guard < 40 && G1.state.shared.phase === 'play' && G1.state.shared.hole === hole; guard++) {
        up = byId(golfers, G1.state.shared.turn);
        const seq = G1.state.shared.shotSeq;
        await putt(up, { dx: 0, dy: 1000, power: 20 });
        await settle((s) => s.shared.shotSeq > seq);
      }
      if (G1.state.shared.phase === 'play' && G1.state.shared.hole === hole) break;
      if (hole < 8) {
        await G1.waitFor((s) => s.shared.phase === 'between', 'minigolf: in turns, hole ' + (hole + 1) + ' ends when every ball is done');
        await G1.must('nextHole', { hole });
      }
    }
    await all(golfers.concat([TV]), (s) => s.shared.phase === 'gameover' && s.phase === 'gameover' && s.shared.board.length === 3 &&
              s.shared.card[G1.pid].every((v) => typeof v === 'number') && s.shared.board[0].score <= s.shared.board[2].score,
              'minigolf: after the ninth hole the game is over, lowest total first');
    await G1.must('backToHub');
    golfers.concat([TV]).forEach((b) => b.close());
  }

  /* --- بولينج: turns, the same pins on every phone, the clock's ball, the end ------------ */
  console.log('• bowling (turns, the server\'s pins equal a replay of the shot, the clock throws a gentle ball, a leave, the end)');
  {
    const BW = new Function(readFileSync(new URL('../../Bowling.js', import.meta.url), 'utf8') +
      '\nreturn { bowlThrow, bowlGentleShot, bowlTotal };')();
    const H = await Bot.host('باسم', null);
    const J = await Bot.join(H.code, 'Jana');
    const K = await Bot.join(H.code, 'كريم');
    const S = await Bot.join(H.code, '', true);
    const bw = [H, J, K];
    await H.must('chooseGame', { game: 'bowling' });
    await H.must('start', { frames: 5, clock: 20, guide: true });
    await all(bw.concat([S]), (s) => s.game === 'bowling' && s.shared.phase === 'play' && s.shared.settings.frames === 5 &&
      s.shared.settings.guide === true && !!s.shared.turn, 'bowling: the game starts, 5 frames and the host\'s choices on every phone');
    const upBot = () => byId(bw, H.state.shared.turn.pid);
    const first = upBot();
    const other = bw.find((b) => b !== first);
    check((await other.act('throw', { x: 0, aim: 0, speed: 700, spin: 0, seq: H.state.shared.turnSeq })).ok === false, 'bowling: only the player up throws');
    const shot = { x: 4, aim: 2, speed: 780, spin: 35 };
    const seq0 = first.state.shared.turnSeq;
    await first.must('throw', Object.assign({ seq: seq0 }, shot));
    await all(bw.concat([S]), (s) => s.shared.throwSeq === 1 && !!s.shared.last, 'bowling: every phone and the TV get the ball');
    const replay = BW.bowlThrow(Array(10).fill(true), shot);
    const last = S.state.shared.last;
    check(JSON.stringify(last.shot) === JSON.stringify(shot) && JSON.stringify(last.after) === JSON.stringify(replay.after) && last.down === replay.down,
      'bowling: the pins the server has down are the ones a phone gets replaying the shot');
    check(S.state.you === null && S.state.shared.board.length === 0, 'bowling: the TV has no secret, and no board to give a ball away before it falls');
    const dup = await first.act('throw', Object.assign({ seq: seq0 }, shot));
    check(dup.ok && H.state.shared.throwSeq === 1, 'bowling: a second tap for the same ball is dropped');
    // The clock throws for whoever is up.
    const upNow = H.state.shared.turn.pid;
    const endsAt = H.state.shared.endsAt;
    check(endsAt > H.state.shared.readyAt, 'bowling: the turn clock counts from when the lane is set again');
    await H.waitFor((s) => s.shared.throwSeq === 2, 'bowling: the clock runs out and the server throws', Math.max(8000, endsAt - Date.now() + 6000));
    check(H.state.shared.last.auto === 'clock' && H.state.shared.last.pid === upNow &&
      JSON.stringify(H.state.shared.last.shot) === JSON.stringify(BW.bowlGentleShot()), 'bowling: that ball is a gentle straight one, thrown for the player up');
    // The host plays for someone.
    const before3 = H.state.shared.turn.pid;
    await H.must('skipTurn', { seq: H.state.shared.turnSeq });
    await H.waitFor((s) => s.shared.throwSeq === 3 && s.shared.last.auto === 'host' && s.shared.last.pid === before3, 'bowling: the host throws for a quiet phone');
    // Someone leaves: their card goes and the turn goes on.
    await api('/leave', { code: K.code, pid: K.pid, key: K.key });
    await H.waitFor((s) => !s.shared.cards[K.pid] && s.shared.order.indexOf(K.pid) === -1 && s.shared.phase === 'play', 'bowling: a player who leaves takes their card with them');
    K.close();
    // Play it out.
    for (let guard = 0; guard < 60 && H.state.shared.phase === 'play'; guard++) {
      const up = byId([H, J], H.state.shared.turn.pid);
      if (!up) break;
      await up.act('throw', { x: -6, aim: 1, speed: 800, spin: 30, seq: H.state.shared.turnSeq });
      await sleep(60);
    }
    await all([H, J, S], (s) => s.shared.phase === 'gameover' && s.phase === 'gameover' && s.shared.board.length === 2, 'bowling: the game ends after the last frame, the board is everyone\'s pins');
    const b = H.state.shared.board;
    check(b[0].score >= b[1].score && b.every((r) => r.score === BW.bowlTotal(H.state.shared.cards[r.id])) && (H.state.shared.winners || []).indexOf(b[0].id) !== -1,
      'bowling: the most pins wins');
    await H.must('playAgain');
    await H.waitFor((s) => s.shared.phase === 'play' && s.shared.throwSeq === 0 && s.shared.settings.frames === 5, 'bowling: play again keeps the choices');
    await H.must('backToHub');
    await H.waitFor((s) => s.phase === 'lobby', 'bowling: back in the hub');
    [H, J, S].forEach((x) => x.close());
  }

  /* --- كدّاب: claims face down, a call, the pile out, the end; computer players ------------ */
  console.log('• doubt (hands on their own phones, a claim, a call turned over, passes and the pile out, first out, bots on the server clock)');
  {
    const H = await Bot.host('حسن', null);
    const J = await Bot.join(H.code, 'جنى');
    const K = await Bot.join(H.code, 'Kim');
    const S = await Bot.join(H.code, '', true);
    const dbBots = [H, J, K];
    await H.must('chooseGame', { game: 'doubt' });
    await H.must('start', { end: 'first', turnClock: 0 });
    await all(dbBots.concat([S]), (s) => s.game === 'doubt' && s.shared.phase === 'play' && !!s.shared.turn, 'doubt: dealt to three');
    const handOf = (b) => (b.state.you && b.state.you.hand) || [];
    check(dbBots.every((b) => handOf(b).length >= 17) && dbBots.reduce((n, b) => n + handOf(b).length, 0) === 52 && S.state.you === null,
          'doubt: one deck, every card dealt, each hand on its own phone, none on the TV');
    check(!/"c":"/.test(JSON.stringify(S.state.shared)), 'doubt: no card face in what the table sees');
    const upBot = () => byId(dbBots, H.state.shared.turn.pid);
    const lead = upBot();
    const two = handOf(lead).slice(0, 2);
    await lead.must('play', { cards: two.map((c) => c.i), rank: '7', seq: lead.state.shared.turnSeq });
    await all(dbBots.concat([S]), (s) => s.shared.last && s.shared.last.n === 2 && s.shared.last.rank === '7' && s.shared.pileCount === 2, 'doubt: a claim reaches every phone: two cards, sevens');
    check(dbBots.filter((b) => b !== lead).every((b) => !two.some((c) => JSON.stringify(b.state).includes('"i":' + c.i + ','))) && !JSON.stringify(S.state).includes('"i":' + two[0].i + ','),
          'doubt: the cards laid are on no other phone and not on the TV');
    const liar = two.some((c) => !/^7/.test(c.c));
    const caller = dbBots.find((b) => b !== lead);
    check((await lead.act('call', { play: lead.state.shared.last.id })).ok === false, 'doubt: nobody calls their own play');
    await caller.must('call', { play: caller.state.shared.last.id });
    await all(dbBots.concat([S]), (s) => { const e = (s.shared.events || []).slice(-1)[0]; return e && e.type === 'call' && e.cards.length === 2; }, 'doubt: a call turns the play over for everyone');
    const callEv = H.state.shared.events.slice(-1)[0];
    check(callEv.truth === !liar && callEv.taker === (liar ? lead.pid : caller.pid) && H.state.shared.turn.stage === 'lead' &&
          H.state.shared.turn.pid === (liar ? caller.pid : lead.pid), 'doubt: the liar or the caller takes the pile, and whoever was right leads');
    // Everyone passes: the pile goes out.
    const l2 = upBot();
    await l2.must('play', { cards: [handOf(l2)[0].i], rank: 'K', seq: l2.state.shared.turnSeq });
    await all(dbBots, (s) => s.shared.last && s.shared.last.pid === l2.pid, 'doubt: the lead lands');
    for (let k = 0; k < 2; k++) {
      const b = upBot();
      await b.must('pass', { seq: b.state.shared.turnSeq });
      await all(dbBots, (s) => (s.shared.passed || []).length === k + 1 || s.shared.pileCount === 0, 'doubt: the pass lands');
    }
    await all(dbBots, (s) => s.shared.pileCount === 0 && s.shared.turn.pid === l2.pid && s.shared.turn.stage === 'lead' && s.shared.events.slice(-1)[0].type === 'pileOut',
              'doubt: everyone passes: the pile is out, and the last to play leads');
    // Played truthfully to the end: the first out wins.
    for (let guard = 0; guard < 600 && H.state.shared.phase === 'play'; guard++) {
      const s = H.state.shared;
      const b = byId(dbBots, s.turn.pid);
      await b.waitFor((st) => st.shared.turnSeq === s.turnSeq, 'doubt: the phone up sees its turn', 3000);
      const hand = handOf(b);
      const bs = b.state.shared;
      if (bs.turn.stage === 'lead') {
        const r = hand[0].c.slice(0, -1);
        await b.act('play', { cards: hand.filter((c) => c.c.slice(0, -1) === r).map((c) => c.i), rank: r, seq: bs.turnSeq });
      } else {
        const mine = hand.filter((c) => c.c.slice(0, -1) === bs.rank);
        if (mine.length) await b.act('play', { cards: mine.map((c) => c.i), seq: bs.turnSeq });
        else await b.act('pass', { seq: bs.turnSeq });
      }
      await H.waitFor((st) => st.shared.turnSeq !== s.turnSeq || st.shared.phase !== 'play', 'doubt: the move lands', 3000);
    }
    await all(dbBots.concat([S]), (s) => s.shared.phase === 'gameover' && s.shared.winners.length === 1 && s.shared.board[0].score === 1, 'doubt: first out wins, counted on the board');
    await H.must('playAgain', {});
    await all(dbBots, (s) => s.shared.phase === 'play' && Object.values(s.shared.wins).reduce((a, b) => a + b, 0) === 1, 'doubt: play again keeps the tally');
    await H.must('backToHub');
    dbBots.concat([S]).forEach((b) => b.close());

    // With computer players: they lead, follow, bluff and call on the server's clock.
    const P = await Bot.host('بسمة', null);
    await P.must('chooseGame', { game: 'doubt' });
    await P.must('addBot', { level: 'hard', name: 'زيزو' });
    await P.must('addBot', { level: 'easy', name: 'بندق' });
    await P.must('start', { end: 'places', turnClock: 30 });
    const botIds = P.state.players.filter((p) => p.bot).map((p) => p.id);
    let botMoves = 0;
    const until = Date.now() + 25000;
    while (Date.now() < until && P.state.shared.phase === 'play' && botMoves < 4) {
      const s = P.state.shared;
      botMoves = (s.events || []).filter((e) => ['play', 'pass', 'call'].indexOf(e.type) !== -1 && botIds.indexOf(e.pid) !== -1).length;
      if (s.turn && s.turn.pid === P.pid) {
        const hand = P.state.you.hand;
        if (s.turn.stage === 'lead') await P.act('play', { cards: [hand[0].i], rank: hand[0].c.slice(0, -1), seq: s.turnSeq });
        else await P.act('pass', { seq: s.turnSeq });
      }
      await sleep(300);
    }
    check(botMoves >= 4, 'doubt: computer players take their turns on the server (' + botMoves + ' moves)');
    check(P.state.you.hand.length === P.state.shared.counts[P.pid], "doubt: a person's phone holds its own hand, and the bots' are counts");
    await P.must('backToHub');
    P.close();
  }

  /* --- الشايب: a lift the table sees, a drag the lifted card follows, the draw, the loser --- */
  console.log('• oldmaid (the deck for the table, a lifted card, dragging, the draw kept secret, pairs out, the loser and the tally, shuffled hands, leaving)');
  {
    const H = await Bot.host('هدى', null);
    const J = await Bot.join(H.code, 'جمال');
    const K = await Bot.join(H.code, 'Karl');
    const S = await Bot.join(H.code, '', true);
    const omBots = [H, J, K];
    await H.must('chooseGame', { game: 'oldmaid' });
    await H.must('start', { mode: 'drag', turnClock: 0 });
    await all(omBots.concat([S]), (s) => s.game === 'oldmaid' && s.shared.phase === 'play' && !!s.shared.turn, 'oldmaid: dealt to three');
    const handOf = (b) => (b.state.you && b.state.you.hand) || [];
    const s0 = H.state.shared;
    check(s0.deckSize === 49 && s0.pairs === 24 && omBots.reduce((n, b) => n + handOf(b).length, 0) + s0.thrown.length * 2 === 49,
          'oldmaid: three players: 24 pairs and الشايب, every card dealt, the pairs in a hand thrown out');
    check(!JSON.stringify(S.state).includes('"OM"') && S.state.you === null && omBots.filter((b) => !handOf(b).some((c) => c.c === 'OM')).every((b) => !JSON.stringify(b.state).includes('"OM"')),
          'oldmaid: الشايب is on its holder\'s phone only');
    const drawer = byId(omBots, s0.turn.pid);
    const victim = byId(omBots, s0.turn.from);
    await drawer.must('lift', { pos: 0, seq: drawer.state.shared.turnSeq });
    await all(omBots.concat([S]), (s) => s.shared.aim && s.shared.aim.pos === 0, 'oldmaid: everyone sees which card is lifted');
    const lifted = handOf(victim)[0];
    await victim.must('move', { card: lifted.i, to: handOf(victim).length - 1 });
    await drawer.waitFor((s) => s.shared.aim && s.shared.aim.pos === s.shared.counts[victim.pid] - 1, 'oldmaid: the lifted card moves with its card when it is dragged');
    check(!JSON.stringify(drawer.state).includes('"i":' + lifted.i + ',') && !JSON.stringify(drawer.state).includes('"i":' + lifted.i + '}'), 'oldmaid: the drawer never sees the ids of the other hand');
    const before = handOf(drawer).length;
    await drawer.must('take', { seq: drawer.state.shared.turnSeq });
    await all(omBots.concat([S]), (s) => s.shared.turn && s.shared.turn.pid === victim.pid, 'oldmaid: the one drawn from draws next');
    const got = handOf(drawer);
    check((got.length === before + 1 && got.some((c) => c.c === lifted.c)) || got.length === before - 1, 'oldmaid: the drawer has the card (or its pair went out)');
    const third = omBots.find((b) => b !== drawer && b !== victim);
    const thrownNow = H.state.shared.thrown.flatMap((t) => t.cards);
    check(thrownNow.indexOf(lifted.c) !== -1 || (!JSON.stringify(third.state).includes('"' + lifted.c + '"') && !JSON.stringify(S.state).includes('"' + lifted.c + '"')),
          'oldmaid: which card was drawn stays with the two it concerns');
    for (let guard = 0; guard < 400 && H.state.shared.phase === 'play'; guard++) {
      const s = H.state.shared;
      const b = byId(omBots, s.turn.pid);
      await b.waitFor((st) => st.shared.turnSeq === s.turnSeq, 'oldmaid: the phone up sees its turn', 3000);
      await b.act('lift', { pos: Math.floor(Math.random() * b.state.shared.counts[s.turn.from]), seq: s.turnSeq });
      await b.act('take', { seq: s.turnSeq });
      await H.waitFor((st) => st.shared.turnSeq !== s.turnSeq || st.shared.phase !== 'play', 'oldmaid: the draw lands', 3000);
    }
    await all(omBots.concat([S]), (s) => s.shared.phase === 'gameover' && !!s.shared.loser && s.shared.reveal.cards.join() === 'OM' && s.shared.losses[s.shared.loser] === 1,
              'oldmaid: the last one holding cards holds الشايب, shown to everyone only now');
    await H.must('playAgain', { mode: 'shuffle' });
    await all(omBots, (s) => s.shared.phase === 'play' && s.shared.settings.mode === 'shuffle' && Object.values(s.shared.losses).reduce((a, b) => a + b, 0) === 1,
              'oldmaid: play again keeps the tally, with the hands shuffled this time');
    check((await J.act('move', { card: handOf(J)[0].i, to: 1 })).ok === false, 'oldmaid: shuffled hands cannot be dragged');
    // Someone leaves mid-game: their cards go to the next hand still playing.
    const leaver = H.state.shared.turn.from === H.pid ? byId(omBots, H.state.shared.turn.pid) : byId(omBots, H.state.shared.turn.from);
    const stay = omBots.filter((b) => b !== leaver);
    const total = H.state.shared.deckSize;
    await api('/leave', { code: H.code, pid: leaver.pid, key: leaver.key });
    await all(stay, (s) => s.players.length === 2 && (s.shared.phase === 'gameover' || (s.shared.counts[leaver.pid] === 0 && s.shared.turn && s.shared.turn.pid !== leaver.pid && s.shared.turn.from !== leaver.pid)),
              "oldmaid: a leaver's cards go to the next hand, and the draw goes on without them");
    check(stay[0].state.shared.phase === 'gameover' || stay.reduce((n, b) => n + handOf(b).length, 0) + stay[0].state.shared.thrown.length * 2 === total, 'oldmaid: no card is lost when someone leaves');
    await H.must('backToHub');
    omBots.concat([S]).forEach((b) => b.close());
  }

  await duelTourRobots();

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
