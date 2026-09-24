/* ============================================================================
   شطرنج بالتصويت — TEAM VOTE CHESS in rooms
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomChess.js (FILES in rooms-worker/build.mjs),
   whose board functions it plays on (chessBoardNew, chessBoardMove,
   chessBoardResult): the server judges a move with Chess.js, the very file the
   phones light their squares with.

   The owner's rules (24 Sep 2026):
   - Two teams, any number from 2 (1 vs 1 is plain chess by a vote of one). The
     host splits them in the lobby: at random, then a tap moves a player to the
     other side (🔀 draws them again).
   - On a team's move every member taps a move on their own board; the move
     with the most votes is played when the vote clock ends or when every
     member still in the room has voted. A tie is drawn at random among the
     tied moves. Nobody voted: a random legal move, said as such.
   - The vote clock: 30 seconds by default (20 / 30 / 60, the host's).
   - Votes are secret until the move is played: who voted is public, not for
     what (the voting engine's rule). Then the table sees how the team voted
     (shared.tallies: ♞f3 ×3, e4 ×1).
   - No computer players. The team chat is the room chat's team channel.

   Decided here (open to change, each in one place):
   - Resigning is a vote too (🏳️ beside the moves): it wins only with more
     votes than any move - a tie with a move never resigns by lot.
   - "Play again" keeps the teams and swaps the colours (the old Black team
     has White); a newcomer joins the smaller team; the team chat of the last
     game is dropped (its colours are the other side's now).
   - A member who leaves drops out of the count (the vote may close on the
     spot); a team with nobody left loses ('left').
   - Someone who joins mid-game watches (lateJoin) and plays the next game.

   shared:
     phase     'play' | 'over'
     settings  { secs: 20 | 30 | 60 }
     lobby     { sides: { pid: 0 | 1 } }       the host's split, before a game
     teams     [[white ids], [black ids]]       team k plays colour k (0 White)
     names     { pid: name }                    kept for a member who left
     chess     ONE BOARD (chessBoardNew), no chess clock
     vote      { team, n, endsAt, voted: [pid] } the open vote: who, never what
     tallies   [{ n, team, list: [{ k, san, from, to, promo, resign, count }],
                  pick, how: 'votes' | 'tie' | 'random' | 'host' }]  the last few
     result    { result 'w'|'b'|'d', reason, winner: 0 | 1 | null }
     tw        [white team's wins, black team's] - the games each team has won
     scores, board, round
   room._vc = { votes: { pid: { from, to, promo } | { resign: true } } } - never
   sent; a voter's own vote is also in room.secrets[pid].vote (its ghost arrow).
   ========================================================================= */

const VC_SECS = [20, 30, 60];
const VC_SECS_DEFAULT = 30;
const VC_GRACE_MS = 400;          // a vote tapped as the clock ends still counts
const VC_TALLIES_KEPT = 12;
const VC_MIN_PLAYERS = 2;

/** The people here (vote chess has no computer players). */
const vcHere = (room) => room.players.filter(p => !p.bot).map(p => p.id);

/** The team (0 White, 1 Black) a player is on in this game, or -1. */
const vcTeamOf = (s, pid) => {
  const t = (s && s.teams) || [];
  if ((t[0] || []).indexOf(pid) !== -1) return 0;
  if ((t[1] || []).indexOf(pid) !== -1) return 1;
  return -1;
};

/**
 * A split of `ids` into two sides: whoever already has a side keeps it, anyone
 * new goes to the smaller side, and neither side is left empty while there are
 * two people.
 */
const vcFitSides = (ids, sides) => {
  const out = {};
  const count = [0, 0];
  ids.forEach(id => { const k = sides && (sides[id] === 0 || sides[id] === 1) ? sides[id] : -1; if (k !== -1) { out[id] = k; count[k]++; } });
  ids.forEach(id => {
    if (out[id] === 0 || out[id] === 1) return;
    const k = count[0] <= count[1] ? 0 : 1;
    out[id] = k; count[k]++;
  });
  if (ids.length >= 2) {
    for (let k = 0; k < 2; k++) {
      if (!count[k]) {
        const from = ids.filter(id => out[id] === 1 - k);
        const mover = from[from.length - 1];
        out[mover] = k; count[k]++; count[1 - k]--;
      }
    }
  }
  return out;
};

/** A random split: half and half, the odd one out on a random side. */
const vcRandomSides = (ids) => {
  const order = shuffled(ids);
  const first = Math.random() < 0.5 ? Math.ceil(order.length / 2) : Math.floor(order.length / 2);
  const out = {};
  order.forEach((id, i) => { out[id] = i < first ? 0 : 1; });
  return vcFitSides(ids, out);
};

/** The host's split, before a game: `{ shuffle }` draws again, `{ move: pid }` puts one on the other side. */
const vcLobbySides = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const ids = vcHere(room);
  room.shared = room.shared || {};
  const was = (room.shared.lobby && room.shared.lobby.sides) || null;
  let sides;
  if (p.shuffle || !was) sides = vcRandomSides(ids);
  else {
    sides = Object.assign({}, was);
    const who = String(p.move || '');
    if (ids.indexOf(who) !== -1 && (sides[who] === 0 || sides[who] === 1)) sides[who] = 1 - sides[who];
    sides = vcFitSides(ids, sides);
  }
  room.shared.lobby = { sides: sides };
};

const vcSettings = (p, was) => {
  const secs = VC_SECS.indexOf(Number(p.secs)) !== -1 ? Number(p.secs)
    : (VC_SECS.indexOf(Number(was.secs)) !== -1 ? Number(was.secs) : VC_SECS_DEFAULT);
  return { secs: secs };
};

/** A new game: the lobby's split (a start), or the last game's teams with the colours swapped (play again). */
const vcNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'over') return;
  const ids = vcHere(room);
  if (ids.length < VC_MIN_PLAYERS) throw new Error('شطرنج بالتصويت محتاج لاعبين على الأقل');
  let sides;
  if (action === 'playAgain' && Array.isArray(prev.teams)) {
    // The old Black team takes White.
    const was = {};
    (prev.teams[1] || []).forEach(id => { was[id] = 0; });
    (prev.teams[0] || []).forEach(id => { was[id] = 1; });
    sides = vcFitSides(ids, was);
  } else {
    sides = vcFitSides(ids, (prev.lobby && prev.lobby.sides) || vcRandomSides(ids));
  }
  const teams = [ids.filter(id => sides[id] === 0), ids.filter(id => sides[id] === 1)];
  const names = {};
  ids.forEach(id => { names[id] = roomPlayerName(room, id); });
  room.shared = {
    phase: 'play',
    settings: vcSettings(p, action === 'playAgain' ? (prev.settings || {}) : {}),
    teams: teams,
    names: names,
    roster: ids.slice(),
    round: (action === 'playAgain' ? (prev.round || 1) : 0) + 1,
    scores: action === 'playAgain' ? (prev.scores || {}) : {},
    // Games won by each team, across play again (the teams keep, the colours swap).
    tw: action === 'playAgain' && Array.isArray(prev.tw) ? [prev.tw[1] || 0, prev.tw[0] || 0] : [0, 0],
    chess: chessBoardNew('off'),
    vote: null,
    tallies: [],
    result: null,
    board: []
  };
  room.shared.board = scoreboardOf(room);
  room.secrets = {};
  room._vc = { votes: {} };
  room.phase = 'play';
  // The team channel belongs to a game: its sides may be the other colour now.
  if (room.chat) room.chat = room.chat.filter(m => !m.team);
  vcOpenVote(room);
};

/** The team to move votes now, on the clock. */
const vcOpenVote = (room) => {
  const s = room.shared;
  const bd = s.chess;
  s.vote = { team: bd.g.turn, n: bd.moves, endsAt: Date.now() + (s.settings.secs || VC_SECS_DEFAULT) * 1000, voted: [] };
  room._vc = { votes: {} };
  Object.keys(room.secrets || {}).forEach(id => { delete room.secrets[id]; });
};

/** A vote's own key: the move as 'e2e4' ('e7e8q' with its promotion), or 'resign'. */
const vcKeyOf = (v) => (v.resign ? 'resign' : v.from + v.to + (v.promo || ''));

/** The members still in the room of team k. */
const vcPresent = (room, k) => {
  const here = room.players.map(p => p.id);
  return ((room.shared.teams || [])[k] || []).filter(id => here.indexOf(id) !== -1);
};

/** Everyone still here on the team voting has voted: the vote closes. */
const vcAllVoted = (room) => {
  const s = room.shared;
  if (!s.vote) return false;
  const present = vcPresent(room, s.vote.team);
  return present.length > 0 && present.every(id => s.vote.voted.indexOf(id) !== -1);
};

/**
 * The vote closes: the move with the most votes is played (a tie drawn at
 * random, never a resignation), or with no vote a random legal move. The
 * tally goes public with the move.
 */
const vcClose = (room, how) => {
  const s = room.shared;
  const bd = s.chess;
  if (s.phase !== 'play' || !s.vote || bd.result) return false;
  const team = s.vote.team;
  const votes = (room._vc && room._vc.votes) || {};
  const groups = {};
  Object.keys(votes).forEach(pid => {
    const v = votes[pid];
    const k = vcKeyOf(v);
    if (!groups[k]) groups[k] = { k: k, from: v.from || '', to: v.to || '', promo: v.promo || '', resign: !!v.resign, count: 0 };
    groups[k].count++;
  });
  const list = Object.keys(groups).map(k => groups[k]);
  // Each move's name as the table writes it (♞f3 on the phones).
  list.forEach(x => {
    if (x.resign) { x.san = ''; return; }
    const info = chessPlay(chessCloneGame(bd.g), { from: x.from, to: x.to, promo: x.promo });
    x.san = info ? info.san : '';
  });
  list.sort((a, b) => b.count - a.count || (a.resign ? 1 : 0) - (b.resign ? 1 : 0) || (a.san < b.san ? -1 : 1));
  let pick = null;
  let way = how === 'host' ? 'host' : 'votes';
  if (!list.length) {
    const legal = chessLegalMoves(bd.g);
    const m = legal[Math.floor(Math.random() * legal.length)];
    pick = { k: m.from + m.to + (m.promo || ''), from: m.from, to: m.to, promo: m.promo || '', resign: false };
    way = 'random';
  } else {
    const top = list[0].count;
    const leaders = list.filter(x => x.count === top);
    const moves = leaders.filter(x => !x.resign);
    if (leaders.length === 1) pick = leaders[0];
    else { pick = moves[Math.floor(Math.random() * moves.length)]; way = 'tie'; }
  }
  const tally = { n: bd.moves, team: team, list: list, pick: pick.k, how: way };
  if (way === 'random') {
    const info = chessPlay(chessCloneGame(bd.g), { from: pick.from, to: pick.to, promo: pick.promo });
    tally.san = info ? info.san : '';
  }
  s.tallies = (s.tallies || []).concat([tally]).slice(-VC_TALLIES_KEPT);
  s.vote = null;
  room._vc = { votes: {} };
  Object.keys(room.secrets || {}).forEach(id => { delete room.secrets[id]; });
  if (pick.resign) {
    bd.endedAt = Date.now();
    vcEnd(room, chessBoardResult(bd, team === 0 ? 'b' : 'w', 'resign'));
    return true;
  }
  const res = chessBoardMove(bd, team, { from: pick.from, to: pick.to, promo: pick.promo }, Date.now());
  if (bd.last && bd.last.n === bd.moves) bd.last.vote = way;
  if (res) vcEnd(room, res);
  else vcOpenVote(room);
  return true;
};

/** The game is over: the winning team scores a point each. */
const vcEnd = (room, res) => {
  const s = room.shared;
  s.vote = null;
  s.result = { result: res.result, reason: res.reason, winner: res.winner === 0 || res.winner === 1 ? res.winner : null };
  if (s.result.winner !== null) {
    (s.teams[s.result.winner] || []).forEach(id => addScore(room, id, 1));
    s.tw[s.result.winner] = (s.tw[s.result.winner] || 0) + 1;
  }
  s.board = scoreboardOf(room);
  s.phase = 'over';
  room.phase = 'over';
  room._vc = { votes: {} };
  room.secrets = {};
};

const voteChessAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'sides') { vcLobbySides(room, playerId, p); return; }
  if (action === 'start' || action === 'playAgain') { vcNewGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.phase || !s.chess) throw new Error('اللعبة لم تبدأ بعد');
  const bd = s.chess;

  if (action === 'vote') {
    if (s.phase !== 'play' || !s.vote || bd.result) return;
    // Drawn for a move that has been played since: the second tap of a double tap, or a slow phone.
    if (staleTap(p, 'n', bd.moves)) return;
    const team = vcTeamOf(s, playerId);
    if (team === -1) throw new Error('انت بتتفرج دلوقتي، هتلعب الدور الجاي');
    if (team !== s.vote.team) throw new Error('مش دور فريقك');
    let v;
    if (p.resign) v = { resign: true };
    else {
      const from = String(p.from || ''), to = String(p.to || ''), promo = String(p.promo || '').toLowerCase().slice(0, 1);
      const legal = chessLegalMoves(bd.g).filter(m => m.from === from && m.to === to);
      if (!legal.length) throw new Error('النقلة دي مش مسموحة');
      const m = legal.find(x => (x.promo || '') === promo) || legal.find(x => x.promo === 'q') || legal[0];
      v = { from: m.from, to: m.to, promo: m.promo || '' };
    }
    room._vc = room._vc || { votes: {} };
    room._vc.votes[playerId] = v;
    room.secrets = room.secrets || {};
    room.secrets[playerId] = { vote: v, n: bd.moves };
    if (s.vote.voted.indexOf(playerId) === -1) s.vote.voted.push(playerId);
    if (vcAllVoted(room)) vcClose(room, 'all');
    return;
  }

  if (action === 'closeVote') {
    // The host closes a vote that waits on a phone gone quiet: the votes so far decide it.
    requireHost(room, playerId);
    if (s.phase !== 'play' || !s.vote || staleTap(p, 'n', bd.moves)) return;
    vcClose(room, 'host');
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const vcDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.vote && s.vote.endsAt ? s.vote.endsAt + VC_GRACE_MS : null;
};

const vcTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.vote || !s.vote.endsAt || now < s.vote.endsAt + VC_GRACE_MS) return false;
  return vcClose(room, 'clock');
};

/* --- someone leaves ---------------------------------------------------------------- */

const vcPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s) return;
  if (room.phase === 'lobby') {
    if (s.lobby && s.lobby.sides) {
      delete s.lobby.sides[playerId];
      s.lobby.sides = vcFitSides(vcHere(room), s.lobby.sides);
    }
    return;
  }
  if (!s.chess || s.phase !== 'play') { if (s.board) s.board = scoreboardOf(room); return; }
  const k = vcTeamOf(s, playerId);
  if (k === -1) return;
  // Out of the count: their vote goes, and the team goes on without them.
  s.teams[k] = s.teams[k].filter(id => id !== playerId);
  if (room._vc && room._vc.votes) delete room._vc.votes[playerId];
  if (room.secrets) delete room.secrets[playerId];
  if (s.vote) s.vote.voted = s.vote.voted.filter(id => id !== playerId);
  if (!vcPresent(room, k).length) {
    const bd = s.chess;
    bd.endedAt = Date.now();
    vcEnd(room, chessBoardResult(bd, k === 0 ? 'b' : 'w', 'left'));
    return;
  }
  if (s.vote && s.vote.team === k && s.vote.voted.length && vcAllVoted(room)) vcClose(room, 'all');
};
