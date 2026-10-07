// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   مافيا — MAFIA
   The app is the narrator. Each phone gets a role in its own secret slice:
   Mafia (who also see each other), Citizen, and in the Roles mode the
   Doctor, the Detective and the Lawyer. The Lawyer knows who the Mafia are
   and argues for them as if a citizen; the Mafia don't know the Lawyer; the
   Detective's check says "not Mafia" about the Lawyer; the Lawyer wins with
   the Mafia but counts with the town when the sides are counted.

   How many Mafia is the app's choice, from the number of players (MAFIA_COUNT).
   A night: every living phone taps a name - the Mafia their target (their
   picks are shown to each other; the most picked is it, a tie is decided at
   random), the Doctor someone to protect (not the same person two nights
   running), the Detective someone to check (answered at once, privately),
   and everyone else a suspect nobody sees, so nobody can tell who acted by
   who is busy with their phone. The night ends when everyone has tapped or
   its clock runs out. The morning says who left the game - as a Citizen,
   unless they were Mafia, or the host turned on showing real roles - then a
   discussion clock (the host can open the vote early or add a minute), then
   a vote with "nobody" among the options; a tie sends nobody out. The Mafia
   win when they are as many as everyone else; the town when none are left.
   The words are for a family: "خرج من اللعبة", never killing.
   ========================================================================== */
const MAFIA_MIN_PLAYERS = 5;
const MAFIA_DISCUSS_MINUTES = [2, 3, 5];
const MAFIA_NIGHT_SECONDS = [30, 45, 60];
const MAFIA_GRACE_MS = 1500;
const MAFIA_SKIP = 'nobody';

/** The Mafia for a table of n: one to six players, two to nine, three beyond. */
const mafiaCount = (n) => (n <= 6 ? 1 : n <= 9 ? 2 : 3);

/** The roles for a table of n, in the mode chosen. */
const mafiaRoles = (n, mode) => {
  const roles = [];
  for (let i = 0; i < mafiaCount(n); i++) roles.push('mafia');
  if (mode === 'roles') {
    roles.push('doctor', 'detective');
    if (n >= 6) roles.push('lawyer');
  }
  while (roles.length < n) roles.push('citizen');
  return roles;
};

const mafiaAlive = (room) => room.shared.alive.filter(id => room.players.some(p => p.id === id));

/** What a player who leaves is shown as. */
const mafiaShownRole = (room, id) => {
  const role = room._mafia.roles[id];
  if (role === 'mafia') return 'mafia';
  return room.shared.revealRoles ? role : 'citizen';
};

const mafiaAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const n = room.players.length;
    if (n < MAFIA_MIN_PLAYERS) throw new Error('المافيا محتاجة 5 لاعبين على الأقل');
    const opts = payload || {};
    const mode = opts.mode === 'roles' ? 'roles' : (opts.mode === 'classic' ? 'classic' : (prev.mode || 'classic'));
    const discuss = MAFIA_DISCUSS_MINUTES.indexOf(Number(opts.discuss)) !== -1 ? Number(opts.discuss) : (prev.discuss || 3);
    const night = MAFIA_NIGHT_SECONDS.indexOf(Number(opts.night)) !== -1 ? Number(opts.night) : (prev.nightSeconds || 45);
    const revealRoles = opts.revealRoles === undefined ? !!prev.revealRoles : !!opts.revealRoles;
    // The narrator: one setting for the whole room, so every device agrees on
    // whether the evening has a voice. Which device speaks is the phone's own
    // business (JS_RoomMafia.html).
    const narrate = opts.narrate === undefined ? !!prev.narrate : !!opts.narrate;
    // Idea 538 (7 Oct 2026): whoever is out watches everything, silent. On unless the host
    // turned it off; an older phone that sends nothing keeps the last game's, else on.
    const outSee = opts.outSee === undefined ? prev.outSee !== false : !!opts.outSee;
    const roster = room.players.map(p => p.id);
    const roles = shuffled(mafiaRoles(n, mode));
    room._mafia = { roles: {}, lastSave: null, night: null };
    roster.forEach((id, i) => { room._mafia.roles[id] = roles[i]; });
    room.shared = {
      mode: mode,
      discuss: discuss,
      nightSeconds: night,
      revealRoles: revealRoles,
      narrate: narrate,
      outSee: outSee,
      mafiaCount: mafiaCount(n),
      roleList: mafiaRoles(n, mode).filter((r, i, a) => a.indexOf(r) === i),
      roster: roster,
      alive: roster.slice(),
      out: [],
      night: 0,
      day: 0,
      news: null,
      scores: action === 'playAgain' ? (prev.scores || {}) : (prev.scores || {}),
      phase: 'roles'
    };
    room.shared.board = scoreboardOf(room);
    mafiaWriteSecrets(room);
    room.phase = 'roles';
    return;
  }

  const s = room.shared;
  if (!s || !s.phase || !room._mafia) throw new Error('اللعبة لم تبدأ بعد');
  const alive = s.alive.indexOf(playerId) !== -1;

  if (action === 'startNight') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'roles' && s.phase !== 'dayResult') return;
    mafiaStartNight(room);
    return;
  }

  if (action === 'nightPick') {
    if (s.phase !== 'night') throw new Error('مش وقت الليل');
    if (!alive) throw new Error('خرجت من اللعبة');
    const target = String((payload && payload.target) || '');
    if (mafiaAlive(room).indexOf(target) === -1) throw new Error('اختيار غير صحيح');
    const role = room._mafia.roles[playerId];
    const night = room._mafia.night;
    if (role === 'mafia') {
      if (room._mafia.roles[target] === 'mafia') throw new Error('ده من المافيا');
      night.kills[playerId] = target;
    } else if (role === 'doctor') {
      if (target === room._mafia.lastSave) throw new Error('مينفعش تحمي نفس الشخص ليلتين ورا بعض');
      night.save = target;
    } else if (role === 'detective') {
      if (target === playerId) throw new Error('اختار حد غيرك');
      if (night.checked) throw new Error('كشفت خلاص الليلة دي');
      night.checked = target;
      const mafia = room._mafia.roles[target] === 'mafia';
      night.checks = night.checks || [];
      room._mafia.checks = (room._mafia.checks || []).concat([{ id: target, name: roomPlayerName(room, target), mafia: mafia, night: s.night }]);
    } else {
      night.suspects[playerId] = target;
    }
    // Who has tapped stays on the server (the slow ones at night are the roles);
    // the phones and the TV get the count.
    room._mafiaActed = room._mafiaActed || [];
    if (room._mafiaActed.indexOf(playerId) === -1) room._mafiaActed.push(playerId);
    s.actedN = room._mafiaActed.length;
    mafiaWriteSecrets(room);
    if (mafiaAlive(room).every(id => room._mafiaActed.indexOf(id) !== -1)) mafiaEndNight(room);
    return;
  }

  if (action === 'endNight') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'night') return;
    mafiaEndNight(room);
    return;
  }

  if (action === 'moreTime') {
    requireHost(room, playerId);
    if (s.phase !== 'day' || !s.endsAt) return;
    s.endsAt += 60000;
    return;
  }

  if (action === 'startVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'day') return;
    mafiaOpenVote(room);
    return;
  }

  if (action === 'vote') {
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) mafiaResolveVote(room);
    return;
  }

  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'voting') return;
    if (closeVote(room)) mafiaResolveVote(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** Every phone's slice: its role, and what that role knows. */
const mafiaWriteSecrets = (room) => {
  const s = room.shared;
  const m = room._mafia;
  const mafiaIds = Object.keys(m.roles).filter(id => m.roles[id] === 'mafia');
  const night = m.night;
  room.secrets = {};
  s.roster.filter(id => room.players.some(p => p.id === id)).forEach(id => {
    const role = m.roles[id];
    const slice = { role: role };
    if (role === 'mafia' || role === 'lawyer') slice.mafia = mafiaIds.map(x => ({ id: x, name: roomPlayerName(room, x) }));
    if (role === 'mafia' && night) slice.picks = Object.keys(night.kills).map(x => ({ by: roomPlayerName(room, x), byId: x, target: night.kills[x], name: roomPlayerName(room, night.kills[x]) }));
    if (role === 'doctor') { slice.lastSave = m.lastSave; if (night && night.save) slice.pick = night.save; }
    if (role === 'detective') { slice.checks = m.checks || []; if (night && night.checked) slice.pick = night.checked; }
    if ((role === 'citizen' || role === 'lawyer') && night && night.suspects[id]) slice.pick = night.suspects[id];
    if (role === 'mafia' && night && night.kills[id]) slice.pick = night.kills[id];
    if (mafiaSpectating(room, id)) slice.spectate = mafiaSpectateView(room);
    room.secrets[id] = slice;
  });
};

/**
 * Idea 538 (the owner, 7 Oct 2026, a lobby switch, on by default): a player who is out
 * watches from the front row - every role and, at night, every pick as it is made -
 * and is silent: no vote (the ballot is the living), no chat and no shouts (mafiaSilenced).
 */
const mafiaSpectating = (room, id) => {
  const s = room.shared || {};
  return !!room._mafia && s.outSee !== false && s.phase !== 'gameover' && Array.isArray(s.alive) &&
    (s.roster || []).indexOf(id) !== -1 && s.alive.indexOf(id) === -1;
};

/** A spectator's phone may not talk while the game is on. */
const mafiaSilenced = (room, id) => room.game === 'mafia' && mafiaSpectating(room, id);

/** What the out see: everyone's real role, and tonight's picks so far. */
const mafiaSpectateView = (room) => {
  const s = room.shared;
  const m = room._mafia;
  const nameOf = (id) => roomPlayerName(room, id) || ((s.out || []).find(o => o.id === id) || {}).name || '';
  const night = m.night;
  return {
    roles: s.roster.map(id => ({ id: id, name: nameOf(id), role: m.roles[id], alive: s.alive.indexOf(id) !== -1 })),
    night: night ? {
      mafia: Object.keys(night.kills).map(by => ({ by: nameOf(by), name: nameOf(night.kills[by]) })),
      save: night.save ? nameOf(night.save) : null,
      check: night.checked ? { name: nameOf(night.checked), mafia: m.roles[night.checked] === 'mafia' } : null,
      suspects: Object.keys(night.suspects).map(by => ({ by: nameOf(by), name: nameOf(night.suspects[by]) }))
    } : null
  };
};

const mafiaStartNight = (room) => {
  const s = room.shared;
  s.night = (s.night || 0) + 1;
  room._mafiaActed = []; s.actedN = 0; delete s.acted;
  s.news = null;
  s.vote = null;
  s.endsAt = Date.now() + s.nightSeconds * 1000;
  s.phase = 'night';
  room._mafia.night = { kills: {}, save: null, checked: null, suspects: {} };
  room.phase = 'night';
  mafiaWriteSecrets(room);
};

const mafiaEndNight = (room) => {
  const s = room.shared;
  const m = room._mafia;
  const night = m.night || { kills: {}, suspects: {} };
  // The Mafia's target: the most picked; a tie is settled at random. Only
  // picks by, and of, someone still in the game.
  const living = mafiaAlive(room);
  const tally = {};
  Object.keys(night.kills).forEach(by => {
    if (living.indexOf(by) === -1) return;
    const t = night.kills[by];
    if (living.indexOf(t) === -1) return;
    tally[t] = (tally[t] || 0) + 1;
  });
  const top = Object.keys(tally).reduce((mx, id) => Math.max(mx, tally[id]), 0);
  const leaders = Object.keys(tally).filter(id => tally[id] === top && top > 0);
  const target = leaders.length ? leaders[Math.floor(Math.random() * leaders.length)] : null;
  m.lastSave = night.save || null;
  if (target && night.save === target) {
    s.news = { kind: 'saved' };
  } else if (target && s.alive.indexOf(target) !== -1) {
    mafiaRemove(room, target);
    s.news = { kind: 'out', id: target, name: roomPlayerName(room, target), role: mafiaShownRole(room, target) };
  } else {
    s.news = { kind: 'quiet' };
  }
  m.night = null;
  room._mafiaActed = []; s.actedN = 0; delete s.acted;
  if (mafiaCheckEnd(room)) return;
  s.day = (s.day || 0) + 1;
  s.endsAt = Date.now() + s.discuss * 60000;
  s.phase = 'day';
  room.phase = 'day';
  mafiaWriteSecrets(room);
};

const mafiaRemove = (room, id) => {
  const s = room.shared;
  s.alive = s.alive.filter(x => x !== id);
  s.out = s.out.concat([{ id: id, name: roomPlayerName(room, id), role: mafiaShownRole(room, id), night: s.phase === 'night' }]);
};

const mafiaOpenVote = (room) => {
  const s = room.shared;
  const alive = mafiaAlive(room);
  const options = room.players.filter(p => alive.indexOf(p.id) !== -1).map(p => ({ id: p.id, label: p.name, ownerId: p.id }));
  options.push({ id: MAFIA_SKIP, label: '🤷' });
  openVote(room, options, alive);
  s.endsAt = null;
  s.phase = 'voting';
  room.phase = 'voting';
};

/** Most votes leaves the game; a tie, or "nobody" on top, sends nobody out. */
const mafiaResolveVote = (room) => {
  const s = room.shared;
  const results = (s.vote && s.vote.results) || [];
  const top = results.reduce((mx, r) => Math.max(mx, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);
  const chosen = leaders.length === 1 && leaders[0].id !== MAFIA_SKIP ? leaders[0].id : null;
  if (chosen && s.alive.indexOf(chosen) !== -1) {
    mafiaRemove(room, chosen);
    s.news = { kind: 'voted', id: chosen, name: roomPlayerName(room, chosen), role: mafiaShownRole(room, chosen) };
  } else {
    s.news = { kind: leaders.length > 1 ? 'tie' : 'nobody' };
  }
  if (mafiaCheckEnd(room)) return;
  s.phase = 'dayResult';
  room.phase = 'dayResult';
  mafiaWriteSecrets(room);
};

/**
 * The Mafia as many as everyone else, or no Mafia left: the game is over.
 * Counted among those still in the room, like the night and the vote: a game
 * that counted a player who had left kept going round with nobody able to win.
 */
const mafiaCheckEnd = (room) => {
  const s = room.shared;
  const m = room._mafia;
  const alive = mafiaAlive(room);
  const mafia = alive.filter(id => m.roles[id] === 'mafia').length;
  const others = alive.length - mafia;
  const winner = mafia === 0 ? 'town' : (mafia >= others ? 'mafia' : null);
  if (!winner) return false;
  s.winner = winner;
  s.endsAt = null;
  // Someone who left is no longer in the room; their name is kept on the list of those out.
  const nameOf = (id) => roomPlayerName(room, id) || ((s.out || []).find(o => o.id === id) || {}).name || '';
  s.roles = s.roster.map(id => ({ id: id, name: nameOf(id), role: m.roles[id], alive: alive.indexOf(id) !== -1 }));
  s.roster.forEach(id => {
    const role = m.roles[id];
    const onMafiaSide = role === 'mafia' || role === 'lawyer';
    if (room.players.some(p => p.id === id) && (winner === 'mafia') === onMafiaSide) addScore(room, id, 1);
  });
  s.board = scoreboardOf(room);
  s.phase = 'gameover';
  room.phase = 'gameover';
  mafiaWriteSecrets(room);
  return true;
};
