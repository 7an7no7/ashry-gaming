// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   ارسم واكتب — DRAWING TELEPHONE
   Every player starts a chain with a phrase. The next player draws it, the
   one after describes the drawing, the next draws that description... Each
   step everyone works on a different chain at once, and at the end the
   host walks the table through each chain. Nothing is scored: the reveal
   is the game.
   ========================================================================== */
const TELE_MAX_STEPS = 6;          // the phrase and five more
const TELE_DRAW_SECONDS = 75;
const TELE_WRITE_SECONDS = 35;
const TELE_GRACE_MS = 1500;
const TELE_COLLECT_MS = 3000;
const TELE_TWICE_MAX = 4;          // «لفّة كمان»: for a table of 3 or 4

/** The same limits Draw & Guess puts on a stroke list, for a whole drawing at once. */
const cleanStrokes = (batch) => {
  const out = [];
  let points = 0;
  (Array.isArray(batch) ? batch : []).forEach(st => {
    const left = DRAW_MAX_POINTS - points;
    if (left < 2) return;
    const tool = DRAW_TOOLS.indexOf(String((st && st.t) || 'f')) !== -1 ? String(st.t || 'f') : 'f';
    let pts = ((st && st.p) || []).map(n => Math.max(0, Math.min(255, Math.round(Number(n) || 0))));
    const exact = DRAW_TOOL_POINTS[tool];
    if (exact) {
      if (pts.length !== exact || left < exact) return;
    } else {
      if (pts.length > left) pts = pts.slice(0, left - (left % 2));
      if (pts.length < 2) return;
    }
    const stroke = { c: String(st.c || '#111').slice(0, 8), w: Math.max(1, Math.min(48, Number(st.w) || 4)), p: pts };
    if (tool !== 'f') stroke.t = tool;
    out.push(stroke);
    points += pts.length;
  });
  return out;
};

const telephoneAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    if (action === 'playAgain' && room.shared.phase !== 'done') return;
    const lang = roomLangOf(room, payload);
    const roster = room.players.map(p => p.id);
    const phrases = nextPrompts(room, DRAW_WORDS[lang] || DRAW_WORDS.ar, 'tele_' + lang, roster.length);
    room._chains = roster.map((pid, i) => ({ owner: pid, steps: [{ kind: 'text', by: pid, text: phrases[i] }] }));
    // «لفّة كمان» (the owner's 573): 3 or 4 players may go round the table
    // twice, so the chain still gets its six steps; a player meets their own
    // chain again near the end. Ignored from 5 players, where one lap is long enough.
    const twice = payload.twice === true && roster.length <= TELE_TWICE_MAX;
    room.shared = {
      phase: 'working', lang: lang, roster: roster, twice: twice,
      steps: Math.min(roster.length * (twice ? 2 : 1), TELE_MAX_STEPS),
      step: 0, kind: null, submitted: [], endsAt: null, seconds: 0
    };
    room.phase = 'play';
    startTelephoneStep(room, 1);
    return;
  }

  const s = room.shared;

  if (action === 'submit') {
    // A drawing sent as its step ended, arriving after the next one began, would
    // be filed on someone else's chain as a blank. It belongs to no step now.
    if (staleTap(payload, 'step', s.step)) return;
    if (s.phase !== 'working' && s.phase !== 'collecting') throw new Error('انتهت هذه الخطوة');
    const task = (room.secrets[playerId] || {}).task;
    if (!task) throw new Error('لست ضمن هذه الجولة');
    if (s.submitted.indexOf(playerId) !== -1) return;
    // A phone too old to say its step still gives itself away: a drawing for a
    // step that asks for words, or words for one that asks for a drawing.
    const sent = payload || {};
    if (task.kind === 'draw' ? !Array.isArray(sent.strokes) : sent.text === undefined) return;
    const chain = room._chains[task.chain];
    chain.steps[s.step] = task.kind === 'draw'
      ? { kind: 'draw', by: playerId, strokes: cleanStrokes(payload && payload.strokes) }
      : { kind: 'text', by: playerId, text: String((payload && payload.text) || '').trim().slice(0, 60) };
    s.submitted.push(playerId);
    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) finishTelephoneStep(room);
    return;
  }

  if (action === 'revealNext' || action === 'revealBack') {
    if (s.phase !== 'reveal') return;
    const r = s.reveal;
    // The chain's owner tells its story from their own phone (the owner's 574);
    // the host (or anyone, once the host is away) can still take over.
    const owner = room._chains[r.chain] && room._chains[r.chain].owner;
    if (!(owner && owner === playerId && room.players.some(p => p.id === playerId))) requireMoveOn(room, playerId);
    // The step the host was looking at: a double tap must not flash a drawing
    // past every screen (or end the reveal) with its second press.
    if (staleTap(payload, 'at', r.chain + ':' + r.step)) return;
    const last = room._chains[r.chain].steps.length - 1;
    if (action === 'revealBack') {
      if (r.step > 0) r.step -= 1;
      else if (r.chain > 0) { r.chain -= 1; r.step = room._chains[r.chain].steps.length - 1; publishTelephoneChain(room); }
      return;
    }
    if (r.step < last) { r.step += 1; return; }
    if (r.chain < room._chains.length - 1) { r.chain += 1; r.step = 0; publishTelephoneChain(room); return; }
    s.phase = 'done';
    s.chain = null;
    s.summary = room._chains.map(ch => ({
      ownerName: roomPlayerName(room, ch.owner),
      first: ch.steps[0].text,
      last: (ch.steps.filter(st => st.kind === 'text').slice(-1)[0] || {}).text || ''
    }));
    return;
  }

  throw new Error('إجراء غير معروف');
};

const startTelephoneStep = (room, k) => {
  const s = room.shared;
  const n = s.roster.length;
  s.step = k;
  s.kind = k % 2 === 1 ? 'draw' : 'write';
  s.submitted = [];
  s.phase = 'working';
  s.seconds = s.kind === 'draw' ? TELE_DRAW_SECONDS : TELE_WRITE_SECONDS;
  s.endsAt = Date.now() + s.seconds * 1000;
  s.collectEndsAt = null;
  room.secrets = {};
  // What this step works from: the latest step of the kind it needs that isn't
  // blank. A player who left (or never sent) leaves a blank in their chain, and
  // the next player used to be asked to draw "" or describe an empty page.
  const want = s.kind === 'draw' ? 'text' : 'draw';
  const filled = (st) => st && st.kind === want && (want === 'text' ? !!st.text : (st.strokes || []).length > 0);
  room._chains.forEach((chain, c) => {
    const pid = s.roster[(c + k) % n];
    const prev = chain.steps.slice(0, k).reverse().find(filled) || chain.steps[k - 1] || { kind: 'text', text: '' };
    room.secrets[pid] = {
      task: {
        chain: c,
        kind: s.kind,
        prev: prev.kind === 'draw' ? { kind: 'draw', strokes: prev.strokes || [] } : { kind: 'text', text: prev.text || '' }
      }
    };
  });
};

const finishTelephoneStep = (room) => {
  const s = room.shared;
  // Whoever never sent leaves a blank in their chain rather than holding the table.
  room._chains.forEach(chain => {
    if (!chain.steps[s.step]) chain.steps[s.step] = s.kind === 'draw' ? { kind: 'draw', by: null, strokes: [] } : { kind: 'text', by: null, text: '' };
  });
  if (s.step + 1 >= s.steps) {
    s.phase = 'reveal';
    s.reveal = { chain: 0, step: 0 };
    s.endsAt = null;
    s.collectEndsAt = null;
    room.secrets = {};
    publishTelephoneChain(room);
    return;
  }
  startTelephoneStep(room, s.step + 1);
};

/** One chain at a time reaches the phones: a whole evening's drawings at once would be most of a phone's data. */
const publishTelephoneChain = (room) => {
  const s = room.shared;
  const ch = room._chains[s.reveal.chain];
  s.chainCount = room._chains.length;
  s.chain = {
    ownerId: ch.owner,
    ownerName: roomPlayerName(room, ch.owner),
    steps: ch.steps.map(st => ({ kind: st.kind, byName: st.by ? roomPlayerName(room, st.by) : '', text: st.text, strokes: st.strokes }))
  };
};
