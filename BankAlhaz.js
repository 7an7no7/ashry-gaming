/* ============================================================================
   بنك الحظ — the board, the cards, the rules and the computer players
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (SHARED_LISTS in
   tools/build-*.mjs) for a game against the phone and to draw the board, and
   the rooms server bundles it (FILES in rooms-worker/build.mjs) to judge a
   room. No DOM, nothing that runs at load, every name prefixed bank / BANK_.

   The owner's rules (21 Sep 2026, asked one at a time, then checked against
   another AI's rulebook):
     - The classic 40 squares with Egyptian cities: 1,500 each to start, 200
       for passing Start (400 for landing on it exactly, a lobby switch, off).
     - 2 to 6 players. A place nobody buys stays with the bank - no auction.
     - Buying starts once you have passed Start (the owner, 22 Sep 2026: a
       lobby switch, on by default). Until then a free place you land on
       stays with the bank, and a trade can't give you a place; rent is
       still paid. A card that takes you to or past Start counts; jail
       doesn't.
     - High rents (the owner, 22 Sep 2026: a lobby switch, off - the classic
       numbers by default): a place with no buildings rents for 15 on the
       cheapest up to 50 on القاهرة, by its price, doubled for a whole
       colour; a جراج then pays at least the whole colour's rent + 10, so a
       building always pays more than the step before.
     - Buildings are the Egyptian box's جراج ← استراحة ← سوق on a whole colour,
       built evenly, no limit: rent is the base, twice that for a whole colour,
       then the classic 1 house, 3 houses and hotel rents. A step costs the
       colour's price once, then twice, then twice; sold back for half.
     - Mortgage for half the price, no rent while mortgaged, back for +10%.
     - Jail: pay 50, use a card, or roll a double (three tries; after the
       third miss pay 50 and move). Rent is still collected in jail. Three
       doubles in a row go to jail; a double otherwise rolls again.
     - The free-parking corner is الأتوبيس السريع: move again by the same
       number. The free-parking pot is a lobby switch, off: taxes and fines
       go to the middle and the bus takes them.
     - The two decks, حظ and محاكمة, sixteen cards each, shuffled once, drawn
       from the top and put back at the bottom; a get-out-of-jail card is kept
       (it can be traded) and goes back to its own deck when used.
     - Trading on your own turn: an offer of places, money and jail cards,
       which the other accepts or refuses. Places with buildings on their
       colour can't be traded.
     - Short of money: raise it (sell buildings, mortgage) or go bankrupt.
       Bankrupt to a player: they get the cash and the places (the buildings
       sold to the bank first; mortgaged places stay mortgaged). To the bank:
       the places go back, free to buy. Paying every player at once (عزومة)
       and going bankrupt goes to the bank.
     - The game ends when one is left, or when the time is up: the lap is
       finished, so everyone has had the same turns, and the richest wins -
       cash, the places (half if mortgaged) and what the buildings cost.

   The game is two objects. `g` is shaped like a room's `shared` - everything
   on the table, which every phone may see. `priv` holds what nobody may see:
   the order of the two decks. Every change is an event (`g.events`, the last
   BANK_EVENTS), which the screens animate. Money moves are in whole جنيه.
   ========================================================================= */

const BANK_START_CASH = 1500;
const BANK_PASS = 200;
const BANK_GO_EXACT = 400;
const BANK_JAIL_FINE = 50;
const BANK_JAIL = 10;
const BANK_BUS = 20;
const BANK_TOJAIL = 30;
const BANK_MIN_PLAYERS = 2;
const BANK_MAX_PLAYERS = 6;
const BANK_LENGTHS = [0, 30, 45, 60];     // minutes; 0: until one is left
const BANK_LENGTH_DEFAULT = 45;
const BANK_CLOCKS = [0, 60, 90];
const BANK_EVENTS = 40;
const BANK_TOKENS = ['car', 'camel', 'boat', 'plane', 'scooter', 'hat'];
const BANK_STATIONS = [5, 15, 25, 35];
const BANK_COMPANIES = [12, 28];

/** Each colour and what one step of building on it costs. */
const BANK_GROUPS = {
  br: { house: 50 }, lb: { house: 50 }, pk: { house: 100 }, or: { house: 100 },
  rd: { house: 150 }, ye: { house: 150 }, gr: { house: 200 }, db: { house: 200 }
};
const BANK_GROUP_ORDER = ['br', 'lb', 'pk', 'or', 'rd', 'ye', 'gr', 'db'];

/**
 * The 40 squares from Start, going round. A place (`p`) has its colour, price
 * and rents: [base, جراج, استراحة, سوق]. Names are [Arabic, English].
 */
const BANK_SQUARES = [
  { t: 'go', n: ['البداية', 'Start'] },
  { t: 'p', g: 'br', n: ['الفيوم', 'Fayoum'], price: 60, rent: [2, 10, 90, 250] },
  { t: 'court', n: ['محاكمة', 'Court'] },
  { t: 'p', g: 'br', n: ['بني سويف', 'Beni Suef'], price: 60, rent: [4, 20, 180, 450] },
  { t: 'tax', n: ['الضرايب', 'Taxes'], amount: 200 },
  { t: 'st', n: ['محطة رمسيس', 'Ramses Station'], price: 200, icon: 'train' },
  { t: 'p', g: 'lb', n: ['المنيا', 'Minya'], price: 100, rent: [6, 30, 270, 550] },
  { t: 'luck', n: ['حظ', 'Luck'] },
  { t: 'p', g: 'lb', n: ['أسيوط', 'Assiut'], price: 100, rent: [6, 30, 270, 550] },
  { t: 'p', g: 'lb', n: ['سوهاج', 'Sohag'], price: 120, rent: [8, 40, 300, 600] },
  { t: 'jail', n: ['السجن', 'Jail'] },
  { t: 'p', g: 'pk', n: ['الزقازيق', 'Zagazig'], price: 140, rent: [10, 50, 450, 750] },
  { t: 'co', n: ['الكهرباء', 'Electricity'], price: 150, icon: 'power' },
  { t: 'p', g: 'pk', n: ['المنصورة', 'Mansoura'], price: 140, rent: [10, 50, 450, 750] },
  { t: 'p', g: 'pk', n: ['طنطا', 'Tanta'], price: 160, rent: [12, 60, 500, 900] },
  { t: 'st', n: ['محطة سيدي جابر', 'Sidi Gaber Station'], price: 200, icon: 'train' },
  { t: 'p', g: 'or', n: ['السويس', 'Suez'], price: 180, rent: [14, 70, 550, 950] },
  { t: 'court', n: ['محاكمة', 'Court'] },
  { t: 'p', g: 'or', n: ['الإسماعيلية', 'Ismailia'], price: 180, rent: [14, 70, 550, 950] },
  { t: 'p', g: 'or', n: ['بورسعيد', 'Port Said'], price: 200, rent: [16, 80, 600, 1000] },
  { t: 'bus', n: ['الأتوبيس السريع', 'Express Bus'] },
  { t: 'p', g: 'rd', n: ['قنا', 'Qena'], price: 220, rent: [18, 90, 700, 1050] },
  { t: 'luck', n: ['حظ', 'Luck'] },
  { t: 'p', g: 'rd', n: ['الأقصر', 'Luxor'], price: 220, rent: [18, 90, 700, 1050] },
  { t: 'p', g: 'rd', n: ['أسوان', 'Aswan'], price: 240, rent: [20, 100, 750, 1100] },
  { t: 'st', n: ['ميناء دمياط', 'Damietta Port'], price: 200, icon: 'ship' },
  { t: 'p', g: 'ye', n: ['مرسى مطروح', 'Marsa Matrouh'], price: 260, rent: [22, 110, 800, 1150] },
  { t: 'p', g: 'ye', n: ['العلمين', 'El Alamein'], price: 260, rent: [22, 110, 800, 1150] },
  { t: 'co', n: ['المياه', 'Water'], price: 150, icon: 'water' },
  { t: 'p', g: 'ye', n: ['الإسكندرية', 'Alexandria'], price: 280, rent: [24, 120, 850, 1200] },
  { t: 'tojail', n: ['روح السجن', 'Go to Jail'] },
  { t: 'p', g: 'gr', n: ['دهب', 'Dahab'], price: 300, rent: [26, 130, 900, 1275] },
  { t: 'p', g: 'gr', n: ['الغردقة', 'Hurghada'], price: 300, rent: [26, 130, 900, 1275] },
  { t: 'court', n: ['محاكمة', 'Court'] },
  { t: 'p', g: 'gr', n: ['شرم الشيخ', 'Sharm El Sheikh'], price: 320, rent: [28, 150, 1000, 1400] },
  { t: 'st', n: ['مطار القاهرة', 'Cairo Airport'], price: 200, icon: 'plane' },
  { t: 'luck', n: ['حظ', 'Luck'] },
  { t: 'p', g: 'db', n: ['الجيزة', 'Giza'], price: 350, rent: [35, 175, 1100, 1500] },
  { t: 'tax', n: ['رسوم', 'Fees'], amount: 100 },
  { t: 'p', g: 'db', n: ['القاهرة', 'Cairo'], price: 400, rent: [50, 200, 1400, 2000] }
];

/**
 * The two decks. `go` moves forward to a square, `near` to the next station
 * or company ahead, `back` back that many squares, `jail` to jail, `free` is
 * a get-out-of-jail card, `cash` from or to the bank, `repair` [per جراج or
 * استراحة, per سوق], `each` from or to every other player.
 */
const BANK_CARDS = {
  luck: [
    { go: 0, ar: 'اتقدّم لنقطة البداية وخد ٢٠٠', en: 'Advance to Start and collect 200' },
    { go: 39, ar: 'روح القاهرة', en: 'Go to Cairo' },
    { go: 29, ar: 'روح الإسكندرية، ولو عدّيت على البداية خد ٢٠٠', en: 'Go to Alexandria; if you pass Start, collect 200' },
    { go: 23, ar: 'روح الأقصر، ولو عدّيت على البداية خد ٢٠٠', en: 'Go to Luxor; if you pass Start, collect 200' },
    { go: 5, ar: 'روح محطة رمسيس، ولو عدّيت على البداية خد ٢٠٠', en: 'Go to Ramses Station; if you pass Start, collect 200' },
    { near: 'st', ar: 'روح لأقرب محطة، ولو ليها صاحب ادفعله الإيجار مرتين', en: 'Go to the next station; if someone owns it, pay them twice the rent' },
    { near: 'co', ar: 'روح لأقرب شركة، ولو ليها صاحب ارمي النرد وادفعله ١٠ أضعاف الرقم', en: 'Go to the next company; if someone owns it, roll and pay them 10 times the dice' },
    { go: 20, ar: 'اركب الأتوبيس السريع: روح خانته', en: 'Take the Express Bus: go to its square' },
    { back: 3, ar: 'ارجع ٣ خانات', en: 'Go back 3 squares' },
    { jail: 1, ar: 'روح السجن على طول، ومن غير ما تعدّي على البداية', en: 'Go straight to jail, without passing Start' },
    { free: 1, ar: 'كارت خروج من السجن: احتفظ بيه أو بيعه', en: 'Get out of jail free: keep it or sell it' },
    { cash: 50, ar: 'البنك صرفلك أرباح: خد ٥٠', en: 'The bank pays you a dividend: collect 50' },
    { cash: 150, ar: 'قسط الشقة خلص: خد ١٥٠', en: 'Your flat is paid off: collect 150' },
    { cash: -15, ar: 'مخالفة سرعة: ادفع ١٥', en: 'Speeding fine: pay 15' },
    { repair: [25, 100], ar: 'صيانة: ادفع ٢٥ عن كل جراج أو استراحة، و١٠٠ عن كل سوق', en: 'Upkeep: pay 25 for each garage or rest stop, 100 for each market' },
    { each: -50, ar: 'عزومة على حسابك: ادفع لكل لاعب ٥٠', en: 'Dinner is on you: pay every player 50' }
  ],
  court: [
    { go: 0, ar: 'اتقدّم لنقطة البداية وخد ٢٠٠', en: 'Advance to Start and collect 200' },
    { cash: 200, ar: 'غلطة في حساب البنك لصالحك: خد ٢٠٠', en: 'Bank error in your favour: collect 200' },
    { cash: -50, ar: 'كشف عند الدكتور: ادفع ٥٠', en: "Doctor's visit: pay 50" },
    { cash: 50, ar: 'بعت حاجة قديمة: خد ٥٠', en: 'You sold something old: collect 50' },
    { free: 1, ar: 'كارت خروج من السجن: احتفظ بيه أو بيعه', en: 'Get out of jail free: keep it or sell it' },
    { jail: 1, ar: 'روح السجن على طول، ومن غير ما تعدّي على البداية', en: 'Go straight to jail, without passing Start' },
    { each: 10, ar: 'عيد ميلادك: كل لاعب يديك ١٠', en: "It's your birthday: every player gives you 10" },
    { cash: 100, ar: 'عيدية: خد ١٠٠', en: 'Eid money: collect 100' },
    { cash: 20, ar: 'استرداد ضرايب: خد ٢٠', en: 'Tax refund: collect 20' },
    { cash: 100, ar: 'التأمين صرفلك: خد ١٠٠', en: 'The insurance pays out: collect 100' },
    { cash: -100, ar: 'مصاريف مستشفى: ادفع ١٠٠', en: 'Hospital bills: pay 100' },
    { cash: -50, ar: 'مصاريف المدرسة: ادفع ٥٠', en: 'School fees: pay 50' },
    { cash: 25, ar: 'أتعاب شغل: خد ٢٥', en: 'Consulting fee: collect 25' },
    { repair: [40, 115], ar: 'تصليح الشارع: ادفع ٤٠ عن كل جراج أو استراحة، و١١٥ عن كل سوق', en: 'Street repairs: pay 40 for each garage or rest stop, 115 for each market' },
    { cash: 10, ar: 'كسبت المركز التاني في مسابقة: خد ١٠', en: 'Second prize in a contest: collect 10' },
    { cash: 100, ar: 'ورثت من قريب: خد ١٠٠', en: 'You inherit from a relative: collect 100' }
  ]
};

/* --- small pieces ------------------------------------------------------------------- */

const bankSq = (i) => BANK_SQUARES[i];
const bankIsOwnable = (i) => { const t = BANK_SQUARES[i].t; return t === 'p' || t === 'st' || t === 'co'; };
const bankGroupSquares = (grp) => BANK_SQUARES.map((q, i) => (q.g === grp ? i : -1)).filter(i => i !== -1);
const bankOwnerOf = (g, i) => ((g.own || {})[i] || {}).by || null;
const bankLevel = (g, i) => ((g.own || {})[i] || {}).lvl || 0;
const bankActive = (g) => g.seats.filter(pid => g.out.indexOf(pid) === -1);
/** Whether `pid` may buy yet: always, or once past Start when the table plays the first lap. */
const bankCanBuyYet = (g, pid) => !(g.settings && g.settings.firstLap) || !!(g.lapped || {})[pid];
const bankRoll6 = (rnd) => 1 + Math.floor((rnd || Math.random)() * 6);

/** What the next step of building costs: the colour's price once, then twice, then twice. */
const bankStepCost = (grp, lvl) => BANK_GROUPS[grp].house * (lvl <= 1 ? 1 : 2);
/** What everything built on a place cost. */
const bankBuiltCost = (grp, lvl) => { let c = 0; for (let k = 1; k <= lvl; k++) c += bankStepCost(grp, k); return c; };
const bankMortgageValue = (i) => Math.floor(BANK_SQUARES[i].price / 2);
const bankUnmortgageCost = (i) => Math.ceil(BANK_SQUARES[i].price / 2 * 1.1);

/** Whether `pid` owns every place of a colour. */
const bankHasSet = (g, pid, grp) => bankGroupSquares(grp).every(i => bankOwnerOf(g, i) === pid);
const bankGroupBuilt = (g, grp) => bankGroupSquares(grp).some(i => bankLevel(g, i) > 0);

/** The places a player owns. */
const bankPlacesOf = (g, pid) => Object.keys(g.own || {}).map(Number).filter(i => g.own[i].by === pid).sort((a, b) => a - b);

/**
 * The rent on a square for someone landing there. `dice` is the roll (for a
 * company); `mul` doubles a station (the card), `coMul` sets a company's
 * multiplier (the card's 10).
 */
/**
 * A place's rents as this table plays them: [no buildings, جراج, استراحة, سوق].
 * The classic numbers, or with high rents on: 15 up to 50 by price, and a
 * جراج that still pays more than the whole colour does.
 */
const bankRents = (g, i) => {
  const q = BANK_SQUARES[i];
  if (!q.rent) return null;
  if (!(g && g.settings && g.settings.highRent)) return q.rent;
  const base = Math.round(15 + (q.price - 60) * 35 / 340);
  return [base, Math.max(q.rent[1], base * 2 + 10), q.rent[2], q.rent[3]];
};

const bankRentOf = (g, i, dice, mul, coMul) => {
  const q = BANK_SQUARES[i];
  const o = (g.own || {})[i];
  if (!o || o.mort) return 0;
  if (q.t === 'p') {
    const lvl = o.lvl || 0;
    const rents = bankRents(g, i);
    if (lvl > 0) return rents[lvl];
    return rents[0] * (bankHasSet(g, o.by, q.g) ? 2 : 1);
  }
  if (q.t === 'st') {
    const n = BANK_STATIONS.filter(k => bankOwnerOf(g, k) === o.by).length;
    return [0, 25, 50, 100, 200][n] * (mul || 1);
  }
  if (q.t === 'co') {
    const both = BANK_COMPANIES.every(k => bankOwnerOf(g, k) === o.by);
    return (dice || 0) * (coMul || (both ? 10 : 4));
  }
  return 0;
};

/** What a player is worth: cash, the places (half if mortgaged) and what the buildings cost. */
const bankWorth = (g, pid) => {
  let w = g.cash[pid] || 0;
  bankPlacesOf(g, pid).forEach(i => {
    const o = g.own[i];
    const q = BANK_SQUARES[i];
    w += o.mort ? Math.floor(q.price / 2) : q.price;
    if (q.t === 'p') w += bankBuiltCost(q.g, o.lvl || 0);
  });
  return w;
};

/** How much a player could raise: cash, the buildings sold back, and every place mortgaged. */
const bankLiquid = (g, pid) => {
  let w = g.cash[pid] || 0;
  bankPlacesOf(g, pid).forEach(i => {
    const o = g.own[i];
    const q = BANK_SQUARES[i];
    if (q.t === 'p' && o.lvl) w += Math.floor(bankBuiltCost(q.g, o.lvl) / 2);
    if (!o.mort) w += bankMortgageValue(i);
  });
  return w;
};

const bankEvent = (g, type, fields) => {
  const clean = {};
  Object.keys(fields || {}).forEach(k => { if (fields[k] !== undefined && fields[k] !== null) clean[k] = fields[k]; });
  g.eventSeq = (g.eventSeq || 0) + 1;
  g.events = (g.events || []).concat([Object.assign({ seq: g.eventSeq, type: type }, clean)]).slice(-BANK_EVENTS);
};

const bankShuffle = (arr, rnd) => {
  const a = arr.slice();
  const r = rnd || Math.random;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};

/* --- a new game -------------------------------------------------------------------------- */

/**
 * The tokens for the players who didn't pick one: the first free ones, in
 * the order of BANK_TOKENS.
 */
const bankFillTokens = (ids, picked) => {
  const out = {};
  const taken = [];
  ids.forEach(id => {
    const t = picked && picked[id];
    if (BANK_TOKENS.indexOf(t) !== -1 && taken.indexOf(t) === -1) { out[id] = t; taken.push(t); }
  });
  ids.forEach(id => {
    if (out[id]) return;
    const t = BANK_TOKENS.find(x => taken.indexOf(x) === -1);
    out[id] = t;
    taken.push(t);
  });
  return out;
};

/**
 * Who starts: everyone rolls the two dice, the highest starts, and those
 * level on top roll again. { first, rounds: [[{ pid, d: [a, b] }...]...] }.
 */
const bankRollOff = (ids, rnd) => {
  let left = ids.slice();
  const rounds = [];
  for (let k = 0; k < 20 && left.length > 1; k++) {
    const round = left.map(pid => ({ pid: pid, d: [bankRoll6(rnd), bankRoll6(rnd)] }));
    rounds.push(round);
    const top = Math.max.apply(null, round.map(r => r.d[0] + r.d[1]));
    left = round.filter(r => r.d[0] + r.d[1] === top).map(r => r.pid);
  }
  return { first: left[0], rounds: rounds };
};

/**
 * A new game. `settings`: { length (minutes, 0 = until one is left), pot,
 * go400, firstLap (on unless false), highRent }. Returns { g, priv }.
 */
const bankNewGame = (ids, tokens, first, settings, now, rnd) => {
  const seats = ids.slice();
  const cash = {};
  const pos = {};
  const cards = {};
  seats.forEach(id => { cash[id] = BANK_START_CASH; pos[id] = 0; cards[id] = []; });
  const set = settings || {};
  const length = BANK_LENGTHS.indexOf(Number(set.length)) !== -1 ? Number(set.length) : BANK_LENGTH_DEFAULT;
  const g = {
    seats: seats,
    tokens: tokens,
    cash: cash,
    pos: pos,
    jail: {},
    cards: cards,
    own: {},
    turn: { pid: seats.indexOf(first) !== -1 ? first : seats[0], stage: 'roll', dice: null, dbl: 0, again: false, total: 0 },
    pot: 0,
    settings: { length: length, pot: !!set.pot, go400: !!set.go400, firstLap: set.firstLap !== false, highRent: !!set.highRent },
    lapped: {},
    out: [],
    phase: 'play',
    places: null,
    worth: null,
    startedAt: now || 0,
    endsAt: length ? (now || 0) + length * 60000 : null,
    firstPid: seats.indexOf(first) !== -1 ? first : seats[0],
    lastLap: false,
    offer: null,
    debt: null,
    landed: null,
    turnNo: 1,
    turnSeq: 1,
    events: [],
    eventSeq: 0
  };
  const idx = (n) => { const a = []; for (let k = 0; k < n; k++) a.push(k); return a; };
  const priv = { decks: { luck: bankShuffle(idx(BANK_CARDS.luck.length), rnd), court: bankShuffle(idx(BANK_CARDS.court.length), rnd) } };
  return { g: g, priv: priv };
};

/* --- money ---------------------------------------------------------------------------- */

/** Money paid to the bank: into the pot when the table plays with one. */
const bankToBank = (g, amount, fine) => {
  if (fine && g.settings.pot) g.pot = (g.pot || 0) + amount;
};

/**
 * `pid` owes `amount` to `to` (a player, 'bank', or 'each' - every other
 * player an equal part). Paid at once when the cash is there; otherwise the
 * turn waits on a debt (stage 'debt') and `then` runs once it is paid.
 * Returns true when it was paid now.
 */
const bankCharge = (g, pid, amount, to, fine, then) => {
  if (amount <= 0) return true;
  if ((g.cash[pid] || 0) >= amount) {
    bankPayNow(g, pid, amount, to, fine);
    return true;
  }
  g.debt = { pid: pid, amount: amount, to: to, fine: !!fine, then: then || { kind: 'after' } };
  g.turn.stage = 'debt';
  g.turnSeq = (g.turnSeq || 0) + 1;
  bankEvent(g, 'debt', { pid: pid, amount: amount, to: to });
  return false;
};

const bankPayNow = (g, pid, amount, to, fine) => {
  g.cash[pid] -= amount;
  if (to === 'bank') bankToBank(g, amount, fine);
  else if (to === 'each') {
    const others = bankActive(g).filter(x => x !== pid);
    const part = others.length ? Math.floor(amount / others.length) : 0;
    others.forEach(x => { g.cash[x] += part; });
  } else if (to && g.cash[to] !== undefined) g.cash[to] += amount;
};

/* --- moving ------------------------------------------------------------------------------- */

/** Money for going past (or landing on) Start; from now on this player may buy. */
const bankPassStart = (g, pid, exact) => {
  const amount = exact && g.settings.go400 ? BANK_GO_EXACT : BANK_PASS;
  g.cash[pid] += amount;
  const first = g.settings.firstLap && !bankCanBuyYet(g, pid);
  g.lapped = g.lapped || {};
  g.lapped[pid] = true;
  bankEvent(g, 'start', first ? { pid: pid, amount: amount, first: 1 } : { pid: pid, amount: amount });
};

/** Moves `pid` forward to square `to` (passing Start pays), then what the square does. */
const bankMoveTo = (g, priv, pid, to, how, rnd, opts) => {
  const from = g.pos[pid];
  g.pos[pid] = to;
  bankEvent(g, 'move', { pid: pid, from: from, to: to, how: how });
  if (to < from || (to === 0 && from !== 0)) bankPassStart(g, pid, to === 0);
  bankLand(g, priv, pid, rnd, opts || {});
};

/** To jail: no Start, no more rolls this turn. */
const bankToJail = (g, pid, why) => {
  const from = g.pos[pid];
  g.pos[pid] = BANK_JAIL;
  g.jail[pid] = 0;
  g.turn.again = false;
  g.turn.dbl = 0;
  bankEvent(g, 'jail', { pid: pid, why: why, from: from });
};

/** What landing on a square does. Leaves the turn at 'buy', 'debt', or carried on (bankAfter). */
const bankLand = (g, priv, pid, rnd, opts) => {
  const at = g.pos[pid];
  const q = BANK_SQUARES[at];
  g.landed = { pid: pid, sq: at };
  if (q.t === 'p' || q.t === 'st' || q.t === 'co') {
    const owner = bankOwnerOf(g, at);
    if (!owner && !bankCanBuyYet(g, pid)) {
      bankEvent(g, 'notYet', { pid: pid, sq: at });
      bankAfter(g);
      return;
    }
    if (!owner) {
      g.turn.stage = 'buy';
      g.turnSeq = (g.turnSeq || 0) + 1;
      return;
    }
    if (owner !== pid && !g.own[at].mort) {
      let dice = g.turn.total || 0;
      let coMul = null;
      if (q.t === 'co' && opts.coMul) {
        const d = [bankRoll6(rnd), bankRoll6(rnd)];
        dice = d[0] + d[1];
        coMul = opts.coMul;
        bankEvent(g, 'roll', { pid: pid, d: d, forRent: 1 });
      }
      const rent = bankRentOf(g, at, dice, opts.mul, coMul);
      bankEvent(g, 'rent', { pid: pid, to: owner, sq: at, amount: rent });
      if (!bankCharge(g, pid, rent, owner, false)) return;
    }
    bankAfter(g);
    return;
  }
  if (q.t === 'tax') {
    bankEvent(g, 'tax', { pid: pid, sq: at, amount: q.amount });
    if (!bankCharge(g, pid, q.amount, 'bank', true)) return;
    bankAfter(g);
    return;
  }
  if (q.t === 'luck' || q.t === 'court') {
    bankDraw(g, priv, pid, q.t, rnd);
    return;
  }
  if (q.t === 'tojail') {
    bankToJail(g, pid, 'square');
    bankAfter(g);
    return;
  }
  if (q.t === 'bus') {
    if (g.settings.pot && g.pot > 0) {
      g.cash[pid] += g.pot;
      bankEvent(g, 'pot', { pid: pid, amount: g.pot });
      g.pot = 0;
    }
    const n = g.turn.total || 0;
    if (n > 0 && !opts.fromBus) {
      bankEvent(g, 'bus', { pid: pid, n: n });
      bankMoveTo(g, priv, pid, (BANK_BUS + n) % 40, 'bus', rnd, { fromBus: true });
      return;
    }
    bankAfter(g);
    return;
  }
  // Start, jail (visiting): nothing.
  bankAfter(g);
};

/** A card from the top of a deck, put back at the bottom (a jail card is kept). */
const bankDraw = (g, priv, pid, deck, rnd) => {
  const list = priv.decks[deck];
  const k = list.shift();
  const c = BANK_CARDS[deck][k];
  if (!c.free) list.push(k);
  g.landed = { pid: pid, sq: g.pos[pid], deck: deck, card: k };
  bankEvent(g, 'card', { pid: pid, deck: deck, card: k });
  if (c.free) {
    g.cards[pid] = (g.cards[pid] || []).concat([deck]);
    bankAfter(g);
    return;
  }
  if (c.jail) { bankToJail(g, pid, 'card'); bankAfter(g); return; }
  if (c.go !== undefined) { bankMoveTo(g, priv, pid, c.go, 'card', rnd); return; }
  if (c.near) {
    const list2 = c.near === 'st' ? BANK_STATIONS : BANK_COMPANIES;
    const here = g.pos[pid];
    const to = list2.find(i => i > here);
    bankMoveTo(g, priv, pid, to === undefined ? list2[0] : to, 'card', rnd, c.near === 'st' ? { mul: 2 } : { coMul: 10 });
    return;
  }
  if (c.back) {
    const from = g.pos[pid];
    g.pos[pid] = (from - c.back + 40) % 40;
    bankEvent(g, 'move', { pid: pid, from: from, to: g.pos[pid], how: 'back' });
    bankLand(g, priv, pid, rnd, {});
    return;
  }
  if (c.cash) {
    if (c.cash > 0) { g.cash[pid] += c.cash; bankAfter(g); return; }
    if (!bankCharge(g, pid, -c.cash, 'bank', true)) return;
    bankAfter(g);
    return;
  }
  if (c.repair) {
    let total = 0;
    bankPlacesOf(g, pid).forEach(i => {
      const lvl = bankLevel(g, i);
      if (lvl === 3) total += c.repair[1];
      else if (lvl > 0) total += c.repair[0];
    });
    if (total) bankEvent(g, 'repair', { pid: pid, amount: total });
    if (!bankCharge(g, pid, total, 'bank', true)) return;
    bankAfter(g);
    return;
  }
  if (c.each) {
    const others = bankActive(g).filter(x => x !== pid);
    if (c.each > 0) {
      // Everyone gives: whoever is short raises it (sold back, mortgaged) or goes bankrupt to them.
      others.forEach(o => {
        if (g.out.indexOf(o) !== -1) return;
        if ((g.cash[o] || 0) < c.each) bankRaise(g, o, c.each);
        if ((g.cash[o] || 0) >= c.each) { g.cash[o] -= c.each; g.cash[pid] += c.each; }
        else bankGoBankrupt(g, priv, o, pid);
      });
      if (g.phase !== 'play') return;
      bankAfter(g);
      return;
    }
    if (!bankCharge(g, pid, -c.each * others.length, 'each', false)) return;
    bankAfter(g);
  }
};

/**
 * After a square has done what it does: another roll after a double, or the
 * player's turn to build, trade and end. Leaves 'buy' and 'debt' alone.
 */
const bankAfter = (g) => {
  if (g.phase !== 'play') return;
  if (g.turn.stage === 'buy' || g.turn.stage === 'debt') return;
  const again = g.turn.again && g.jail[g.turn.pid] === undefined;
  g.turn.stage = again ? 'roll' : 'act';
  g.turn.again = false;
  g.turnSeq = (g.turnSeq || 0) + 1;
};

/* --- a turn --------------------------------------------------------------------------------- */

const bankMustTurn = (g, pid, stages) => {
  if (g.phase !== 'play') throw new Error('اللعبة خلصت');
  if (g.turn.pid !== pid) throw new Error('مش دورك');
  if (stages && stages.indexOf(g.turn.stage) === -1) throw new Error('مش وقتها');
};

/** `pid` rolls `d` = [a, b]. */
const bankRoll = (g, priv, pid, d, rnd) => {
  bankMustTurn(g, pid, ['roll']);
  if (g.offer) g.offer = null;
  const a = d[0];
  const b = d[1];
  const dbl = a === b;
  g.turn.dice = [a, b];
  g.turn.total = a + b;
  bankEvent(g, 'roll', { pid: pid, d: [a, b], dbl: dbl ? 1 : undefined });
  if (g.jail[pid] !== undefined) {
    if (dbl) {
      delete g.jail[pid];
      bankEvent(g, 'free', { pid: pid, how: 'dbl' });
      g.turn.again = false;
      bankMoveTo(g, priv, pid, (g.pos[pid] + a + b) % 40, 'dice', rnd);
      return;
    }
    g.jail[pid] += 1;
    if (g.jail[pid] >= 3) {
      // The third miss: pay and go.
      bankEvent(g, 'free', { pid: pid, how: 'forced' });
      const n = a + b;
      if (!bankCharge(g, pid, BANK_JAIL_FINE, 'bank', true, { kind: 'jailMove', n: n })) return;
      delete g.jail[pid];
      bankMoveTo(g, priv, pid, (g.pos[pid] + n) % 40, 'dice', rnd);
      return;
    }
    g.turn.again = false;
    bankAfter(g);
    return;
  }
  g.turn.dbl = dbl ? (g.turn.dbl || 0) + 1 : 0;
  if (g.turn.dbl >= 3) {
    bankToJail(g, pid, 'three');
    bankAfter(g);
    return;
  }
  g.turn.again = dbl;
  bankMoveTo(g, priv, pid, (g.pos[pid] + a + b) % 40, 'dice', rnd);
};

/** Buys the place just landed on, or leaves it with the bank. */
const bankBuy = (g, pid, yes) => {
  bankMustTurn(g, pid, ['buy']);
  const at = g.pos[pid];
  const q = BANK_SQUARES[at];
  if (yes) {
    if (!bankCanBuyYet(g, pid)) throw new Error('تشتري بعد ما تعدّي البداية');
    if ((g.cash[pid] || 0) < q.price) throw new Error('فلوسك مش مكفية');
    g.cash[pid] -= q.price;
    g.own[at] = { by: pid, lvl: 0, mort: false };
    bankEvent(g, 'buy', { pid: pid, sq: at, price: q.price });
  } else {
    bankEvent(g, 'pass', { pid: pid, sq: at });
  }
  g.turn.stage = 'landed';
  bankAfter(g);
};

/** Out of jail before rolling: 50, or a card. */
const bankPayJail = (g, pid) => {
  bankMustTurn(g, pid, ['roll']);
  if (g.jail[pid] === undefined) throw new Error('انت مش في السجن');
  if ((g.cash[pid] || 0) < BANK_JAIL_FINE) throw new Error('فلوسك مش مكفية');
  g.cash[pid] -= BANK_JAIL_FINE;
  bankToBank(g, BANK_JAIL_FINE, true);
  delete g.jail[pid];
  bankEvent(g, 'free', { pid: pid, how: 'pay' });
  g.turnSeq = (g.turnSeq || 0) + 1;
};

const bankUseCard = (g, priv, pid) => {
  bankMustTurn(g, pid, ['roll']);
  if (g.jail[pid] === undefined) throw new Error('انت مش في السجن');
  const held = g.cards[pid] || [];
  if (!held.length) throw new Error('معاكش كارت');
  const deck = held[0];
  g.cards[pid] = held.slice(1);
  const k = BANK_CARDS[deck].findIndex(c => c.free);
  priv.decks[deck].push(k);
  delete g.jail[pid];
  bankEvent(g, 'free', { pid: pid, how: 'card', deck: deck });
  g.turnSeq = (g.turnSeq || 0) + 1;
};

/** The debt is paid; what was waiting on it goes on. */
const bankPayDebt = (g, priv, pid, rnd) => {
  bankMustTurn(g, pid, ['debt']);
  const d = g.debt;
  if (!d || d.pid !== pid) throw new Error('مفيش دين');
  if ((g.cash[pid] || 0) < d.amount) throw new Error('فلوسك لسه مش مكفية');
  bankPayNow(g, pid, d.amount, d.to, d.fine);
  bankEvent(g, 'paid', { pid: pid, amount: d.amount, to: d.to });
  g.debt = null;
  g.turn.stage = 'landed';
  if (d.then && d.then.kind === 'jailMove') {
    delete g.jail[pid];
    bankMoveTo(g, priv, pid, (g.pos[pid] + d.then.n) % 40, 'dice', rnd);
    return;
  }
  bankAfter(g);
};

/** The turn is over: the next player, or - time up and the lap done - the end. */
const bankEndTurn = (g, pid, now) => {
  bankMustTurn(g, pid, ['act']);
  if (g.offer) { bankEvent(g, 'refuse', { from: g.offer.from, to: g.offer.to, why: 'turn' }); g.offer = null; }
  bankNextTurn(g, now);
};

const bankLapStart = (g) => {
  const at = g.seats.indexOf(g.firstPid);
  for (let k = 0; k < g.seats.length; k++) {
    const id = g.seats[(at + k) % g.seats.length];
    if (g.out.indexOf(id) === -1) return id;
  }
  return null;
};

const bankNextTurn = (g, now) => {
  if (g.phase !== 'play') return;
  if (g.endsAt && (now || 0) >= g.endsAt && !g.lastLap) {
    g.lastLap = true;
    bankEvent(g, 'lastlap', {});
  }
  const at = g.seats.indexOf(g.turn.pid);
  let next = null;
  for (let k = 1; k <= g.seats.length; k++) {
    const id = g.seats[(at + k + g.seats.length) % g.seats.length];
    if (g.out.indexOf(id) === -1) { next = id; break; }
  }
  if (!next) return;
  if (g.lastLap && next === bankLapStart(g)) { bankFinish(g, 'time'); return; }
  g.turn = { pid: next, stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  g.debt = null;
  g.landed = null;
  g.turnNo = (g.turnNo || 0) + 1;
  g.turnSeq = (g.turnSeq || 0) + 1;
};

/** The end: the richest first, then whoever went bankrupt last. */
const bankFinish = (g, why) => {
  const worth = {};
  g.seats.forEach(id => { worth[id] = g.out.indexOf(id) === -1 ? bankWorth(g, id) : 0; });
  const active = bankActive(g).slice().sort((a, b) => (worth[b] - worth[a]) || (g.seats.indexOf(a) - g.seats.indexOf(b)));
  g.places = active.concat(g.out.slice().reverse());
  g.worth = worth;
  g.phase = 'gameover';
  g.offer = null;
  g.debt = null;
  g.turn = { pid: null, stage: null, dice: null, dbl: 0, again: false, total: 0 };
  g.turnSeq = (g.turnSeq || 0) + 1;
  bankEvent(g, 'over', { why: why, places: g.places.slice() });
};

/* --- building, mortgages ---------------------------------------------------------------------- */

const bankOwnPlace = (g, pid, i) => {
  const sq = Math.floor(Number(i));
  if (!bankIsOwnable(sq) || bankOwnerOf(g, sq) !== pid) throw new Error('المكان ده مش بتاعك');
  return sq;
};

/** Whether `pid` may put the next step on place `i`: the whole colour, none mortgaged, evenly, and the money. */
const bankCanBuild = (g, pid, i) => {
  const q = BANK_SQUARES[i];
  if (!q || q.t !== 'p' || bankOwnerOf(g, i) !== pid) return false;
  if (!bankHasSet(g, pid, q.g)) return false;
  const sqs = bankGroupSquares(q.g);
  if (sqs.some(k => g.own[k].mort)) return false;
  const lvl = bankLevel(g, i);
  if (lvl >= 3) return false;
  if (lvl > Math.min.apply(null, sqs.map(k => bankLevel(g, k)))) return false;
  return (g.cash[pid] || 0) >= bankStepCost(q.g, lvl + 1);
};

/** Whether the top step on place `i` may be sold: evenly, from the highest. */
const bankCanSell = (g, pid, i) => {
  const q = BANK_SQUARES[i];
  if (!q || q.t !== 'p' || bankOwnerOf(g, i) !== pid) return false;
  const lvl = bankLevel(g, i);
  if (!lvl) return false;
  return lvl >= Math.max.apply(null, bankGroupSquares(q.g).map(k => bankLevel(g, k)));
};

const bankCanMortgage = (g, pid, i) => {
  const q = BANK_SQUARES[i];
  if (!q || !bankIsOwnable(i) || bankOwnerOf(g, i) !== pid || g.own[i].mort) return false;
  return q.t !== 'p' || !bankGroupBuilt(g, q.g);
};

const bankCanUnmortgage = (g, pid, i) => bankIsOwnable(i) && bankOwnerOf(g, i) === pid && !!g.own[i].mort && (g.cash[pid] || 0) >= bankUnmortgageCost(i);

const BANK_MANAGE_STAGES = ['roll', 'buy', 'act', 'debt'];

const bankBuild = (g, pid, i) => {
  bankMustTurn(g, pid, ['roll', 'buy', 'act']);
  const sq = bankOwnPlace(g, pid, i);
  if (!bankCanBuild(g, pid, sq)) throw new Error('مينفعش تبني هنا دلوقتي');
  const q = BANK_SQUARES[sq];
  const lvl = bankLevel(g, sq) + 1;
  const cost = bankStepCost(q.g, lvl);
  g.cash[pid] -= cost;
  g.own[sq].lvl = lvl;
  bankEvent(g, 'build', { pid: pid, sq: sq, lvl: lvl, cost: cost });
};

const bankSell = (g, pid, i) => {
  bankMustTurn(g, pid, BANK_MANAGE_STAGES);
  const sq = bankOwnPlace(g, pid, i);
  if (!bankCanSell(g, pid, sq)) throw new Error('بيع البنا بالتساوي من الأعلى');
  const q = BANK_SQUARES[sq];
  const lvl = bankLevel(g, sq);
  const back = Math.floor(bankStepCost(q.g, lvl) / 2);
  g.cash[pid] += back;
  g.own[sq].lvl = lvl - 1;
  bankEvent(g, 'sell', { pid: pid, sq: sq, lvl: lvl - 1, amount: back });
};

const bankMortgage = (g, pid, i) => {
  bankMustTurn(g, pid, BANK_MANAGE_STAGES);
  const sq = bankOwnPlace(g, pid, i);
  if (!bankCanMortgage(g, pid, sq)) throw new Error('مينفعش ترهن ده دلوقتي');
  g.own[sq].mort = true;
  const v = bankMortgageValue(sq);
  g.cash[pid] += v;
  bankEvent(g, 'mortgage', { pid: pid, sq: sq, amount: v });
};

const bankUnmortgage = (g, pid, i) => {
  bankMustTurn(g, pid, ['roll', 'buy', 'act']);
  const sq = bankOwnPlace(g, pid, i);
  if (!bankCanUnmortgage(g, pid, sq)) throw new Error('فك الرهن محتاج فلوس أكتر');
  const cost = bankUnmortgageCost(sq);
  g.cash[pid] -= cost;
  g.own[sq].mort = false;
  bankEvent(g, 'unmortgage', { pid: pid, sq: sq, amount: cost });
};

/**
 * Raises money for a player automatically - a computer player, the clock,
 * or someone who owes a birthday: the buildings sold back (evenly, from the
 * cheapest colour), then places mortgaged (the ones not in a whole colour
 * first, the cheapest first), until the cash reaches `need` or nothing is
 * left. Returns whether it did.
 */
const bankRaise = (g, pid, need) => {
  for (let guard = 0; guard < 200 && (g.cash[pid] || 0) < need; guard++) {
    const places = bankPlacesOf(g, pid);
    const sell = places.filter(i => bankCanSell(g, pid, i)).sort((a, b) => BANK_SQUARES[a].price - BANK_SQUARES[b].price)[0];
    if (sell !== undefined) {
      const q = BANK_SQUARES[sell];
      const lvl = bankLevel(g, sell);
      const back = Math.floor(bankStepCost(q.g, lvl) / 2);
      g.cash[pid] += back;
      g.own[sell].lvl = lvl - 1;
      bankEvent(g, 'sell', { pid: pid, sq: sell, lvl: lvl - 1, amount: back });
      continue;
    }
    const can = places.filter(i => bankCanMortgage(g, pid, i));
    if (!can.length) break;
    const inSet = (i) => BANK_SQUARES[i].t === 'p' && bankHasSet(g, pid, BANK_SQUARES[i].g);
    can.sort((a, b) => (inSet(a) - inSet(b)) || (BANK_SQUARES[a].price - BANK_SQUARES[b].price));
    const sq = can[0];
    g.own[sq].mort = true;
    const v = bankMortgageValue(sq);
    g.cash[pid] += v;
    bankEvent(g, 'mortgage', { pid: pid, sq: sq, amount: v });
  }
  return (g.cash[pid] || 0) >= need;
};

/* --- bankruptcy ---------------------------------------------------------------------------- */

/**
 * `pid` is out. To a player: the buildings are sold to the bank, and the
 * cash, the places and the jail cards go to them. To the bank ('bank' or
 * 'each'): the places go back, free to buy, and the jail cards to their decks.
 */
const bankGoBankrupt = (g, priv, pid, to) => {
  if (g.out.indexOf(pid) !== -1) return;
  const creditor = to && to !== 'bank' && to !== 'each' && g.out.indexOf(to) === -1 && g.cash[to] !== undefined ? to : null;
  const places = bankPlacesOf(g, pid);
  places.forEach(i => {
    const q = BANK_SQUARES[i];
    if (q.t === 'p' && g.own[i].lvl) {
      g.cash[pid] += Math.floor(bankBuiltCost(q.g, g.own[i].lvl) / 2);
      g.own[i].lvl = 0;
    }
  });
  if (creditor) {
    g.cash[creditor] += Math.max(0, g.cash[pid]);
    places.forEach(i => { g.own[i].by = creditor; });
    g.cards[creditor] = (g.cards[creditor] || []).concat(g.cards[pid] || []);
  } else {
    places.forEach(i => { delete g.own[i]; });
    (g.cards[pid] || []).forEach(deck => { priv.decks[deck].push(BANK_CARDS[deck].findIndex(c => c.free)); });
  }
  g.cash[pid] = 0;
  g.cards[pid] = [];
  delete g.jail[pid];
  g.out.push(pid);
  if (g.offer && (g.offer.from === pid || g.offer.to === pid)) g.offer = null;
  bankEvent(g, 'bankrupt', { pid: pid, to: creditor || 'bank' });
  if (bankActive(g).length <= 1) bankFinish(g, 'last');
};

/** The player whose turn it is gives up the debt they can't pay. */
const bankBankrupt = (g, priv, pid, now) => {
  bankMustTurn(g, pid, ['debt']);
  const d = g.debt;
  g.debt = null;
  bankGoBankrupt(g, priv, pid, d ? d.to : 'bank');
  if (g.phase === 'play') bankNextTurn(g, now);
};

/**
 * A player leaves the game: out, with everything going back to the bank, and
 * the turn moving on if it was theirs.
 */
const bankRemovePlayer = (g, priv, pid, now) => {
  if (g.seats.indexOf(pid) === -1 || g.out.indexOf(pid) !== -1 || g.phase !== 'play') return;
  const wasUp = g.turn.pid === pid;
  if (wasUp) g.debt = null;
  bankGoBankrupt(g, priv, pid, 'bank');
  if (g.phase === 'play' && wasUp) bankNextTurn(g, now);
};

/* --- trading --------------------------------------------------------------------------------- */

const bankCleanSide = (g, pid, side) => {
  const s = side || {};
  const cash = Math.max(0, Math.floor(Number(s.cash) || 0));
  const sqs = Array.from(new Set((Array.isArray(s.sqs) ? s.sqs : []).map(Number))).filter(i => bankIsOwnable(i));
  const cards = (Array.isArray(s.cards) ? s.cards : []).filter(d => d === 'luck' || d === 'court').slice(0, 2);
  if (cash > (g.cash[pid] || 0)) throw new Error('الفلوس دي مش موجودة');
  sqs.forEach(i => {
    if (bankOwnerOf(g, i) !== pid) throw new Error('المكان ده مش بتاعه');
    const q = BANK_SQUARES[i];
    if (q.t === 'p' && bankGroupBuilt(g, q.g)) throw new Error('بيع البنا الأول قبل ما تبدّل اللون ده');
  });
  const held = (g.cards[pid] || []).slice();
  cards.forEach(d => {
    const k = held.indexOf(d);
    if (k === -1) throw new Error('الكارت ده مش معاه');
    held.splice(k, 1);
  });
  return { cash: cash, sqs: sqs, cards: cards };
};

/** Nobody gets a place in a trade before they may buy one (money and jail cards may go). */
const bankTradeLapped = (g, receiver, side) => {
  if (side.sqs.length && !bankCanBuyYet(g, receiver)) throw new Error('مايقدرش ياخد أماكن قبل ما يعدّي البداية');
};

/** On your own turn: an offer to one other player. */
const bankOffer = (g, pid, o) => {
  bankMustTurn(g, pid, ['roll', 'act']);
  if (g.offer) throw new Error('فيه عرض لسه مستني رد');
  const to = String((o || {}).to || '');
  if (to === pid || bankActive(g).indexOf(to) === -1) throw new Error('اختار لاعب');
  const give = bankCleanSide(g, pid, o.give);
  const get = bankCleanSide(g, to, o.get);
  bankTradeLapped(g, to, give);
  bankTradeLapped(g, pid, get);
  const empty = (s) => !s.cash && !s.sqs.length && !s.cards.length;
  if (empty(give) && empty(get)) throw new Error('العرض فاضي');
  g.offerSeq = (g.offerSeq || 0) + 1;
  g.offer = { id: g.offerSeq, from: pid, to: to, give: give, get: get };
  bankEvent(g, 'offer', { from: pid, to: to });
};

const bankCancelOffer = (g, pid) => {
  if (!g.offer || g.offer.from !== pid) return;
  bankEvent(g, 'refuse', { from: g.offer.from, to: g.offer.to, why: 'cancel' });
  g.offer = null;
};

/** The other player says yes or no. Everything is checked again: the table may have moved. */
const bankAnswer = (g, pid, yes, id) => {
  const o = g.offer;
  if (!o || o.to !== pid || (id !== undefined && id !== null && Number(id) !== o.id)) return;
  g.offer = null;
  if (!yes) { bankEvent(g, 'refuse', { from: o.from, to: o.to }); return; }
  const give = bankCleanSide(g, o.from, o.give);
  const get = bankCleanSide(g, o.to, o.get);
  bankTradeLapped(g, o.to, give);
  bankTradeLapped(g, o.from, get);
  const move = (a, b, s) => {
    g.cash[a] -= s.cash;
    g.cash[b] += s.cash;
    s.sqs.forEach(i => { g.own[i].by = b; });
    s.cards.forEach(d => {
      const k = g.cards[a].indexOf(d);
      g.cards[a].splice(k, 1);
      g.cards[b] = (g.cards[b] || []).concat([d]);
    });
  };
  move(o.from, o.to, give);
  move(o.to, o.from, get);
  bankEvent(g, 'trade', { from: o.from, to: o.to, give: give, get: get });
};

/* --- the phone plays for someone -------------------------------------------------------------- */

/**
 * The clock ran out, or the host moved a quiet phone on: the rest of the turn
 * is played for them - a debt raised and paid (or bankrupt), a roll, no
 * buying, and the turn ended.
 */
const bankAuto = (g, priv, pid, rnd, now) => {
  for (let guard = 0; guard < 30 && g.phase === 'play' && g.turn.pid === pid; guard++) {
    const st = g.turn.stage;
    if (st === 'debt') {
      bankRaise(g, pid, g.debt.amount);
      if ((g.cash[pid] || 0) >= g.debt.amount) bankPayDebt(g, priv, pid, rnd);
      else bankBankrupt(g, priv, pid, now);
    } else if (st === 'roll') {
      bankRoll(g, priv, pid, [bankRoll6(rnd), bankRoll6(rnd)], rnd);
    } else if (st === 'buy') {
      bankBuy(g, pid, false);
    } else if (st === 'act') {
      bankEndTurn(g, pid, now);
    } else break;
  }
};

/* --- the computer players ------------------------------------------------------------------------
   From the table alone - everything but the decks is on it. They answer
   offers and never make them. Easy buys most of what it lands on, builds
   now and then, and pays what it owes by selling the cheapest things first.
   Hard keeps a cushion, buys what completes or blocks a colour, builds
   evenly on its colours while it can afford it, pays its way out of jail
   early in the game and sits in it late, and only takes a trade that pays.
   ------------------------------------------------------------------------------------------ */

/** How much a colour is worth to someone: a place completing it, or blocking someone else's. */
const bankSetValue = (g, pid, i) => {
  const q = BANK_SQUARES[i];
  if (q.t !== 'p') return 0;
  const sqs = bankGroupSquares(q.g);
  const mine = sqs.filter(k => bankOwnerOf(g, k) === pid).length;
  const others = {};
  sqs.forEach(k => { const o = bankOwnerOf(g, k); if (o && o !== pid) others[o] = (others[o] || 0) + 1; });
  let v = 0;
  if (mine === sqs.length - 1) v += 2;           // completes mine
  Object.keys(others).forEach(o => { if (others[o] === sqs.length - 1) v += 1; });   // blocks theirs
  return v;
};

const bankUnownedLeft = (g) => BANK_SQUARES.filter((q, i) => bankIsOwnable(i) && !bankOwnerOf(g, i)).length;

/** A computer player's next move, as a phone would send it: { action, payload } or null. */
const bankBotMove = (g, priv, pid, level, rnd) => {
  if (g.phase !== 'play') return null;
  const r = rnd || Math.random;
  const hard = level === 'hard';
  // An offer waiting on this bot is answered first.
  if (g.offer && g.offer.to === pid) return { action: 'answer', payload: { yes: bankBotLikes(g, pid, g.offer, level), id: g.offer.id } };
  if (g.turn.pid !== pid) return null;
  const st = g.turn.stage;
  const cash = g.cash[pid] || 0;
  if (st === 'debt') {
    const need = g.debt.amount;
    if (cash >= need) return { action: 'payDebt', payload: {} };
    if (bankLiquid(g, pid) < need) return { action: 'bankrupt', payload: {} };
    const places = bankPlacesOf(g, pid);
    const sell = places.filter(i => bankCanSell(g, pid, i)).sort((a, b) => BANK_SQUARES[a].price - BANK_SQUARES[b].price)[0];
    if (sell !== undefined) return { action: 'sell', payload: { sq: sell } };
    const can = places.filter(i => bankCanMortgage(g, pid, i));
    const inSet = (i) => BANK_SQUARES[i].t === 'p' && bankHasSet(g, pid, BANK_SQUARES[i].g);
    can.sort((a, b) => (inSet(a) - inSet(b)) || (BANK_SQUARES[a].price - BANK_SQUARES[b].price));
    return can.length ? { action: 'mortgage', payload: { sq: can[0] } } : { action: 'bankrupt', payload: {} };
  }
  if (st === 'roll') {
    if (g.jail[pid] !== undefined) {
      if ((g.cards[pid] || []).length) return { action: 'useCard', payload: {} };
      const early = bankUnownedLeft(g) > 8;
      if (hard ? (early && cash >= 250) : (cash >= 400 && r() < 0.5)) return { action: 'payJail', payload: {} };
    }
    return { action: 'roll', payload: {} };
  }
  if (st === 'buy') {
    const q = BANK_SQUARES[g.pos[pid]];
    let yes;
    if (hard) {
      const special = bankSetValue(g, pid, g.pos[pid]) > 0;
      yes = cash - q.price >= (special ? 60 : 180);
    } else {
      yes = cash - q.price >= 50 && r() < 0.85;
    }
    return { action: 'buy', payload: { yes: !!yes } };
  }
  if (st === 'act') {
    const places = bankPlacesOf(g, pid);
    if (hard) {
      // Back from the bank first what belongs to a whole colour, then build evenly while a cushion is left.
      const unm = places.filter(i => g.own[i].mort && cash - bankUnmortgageCost(i) >= 500);
      if (unm.length) return { action: 'unmortgage', payload: { sq: unm[0] } };
      const build = places.filter(i => bankCanBuild(g, pid, i) && cash - bankStepCost(BANK_SQUARES[i].g, bankLevel(g, i) + 1) >= 250)
        .sort((a, b) => BANK_SQUARES[b].price - BANK_SQUARES[a].price);
      if (build.length) return { action: 'build', payload: { sq: build[0] } };
    } else {
      const build = places.filter(i => bankCanBuild(g, pid, i) && cash - bankStepCost(BANK_SQUARES[i].g, bankLevel(g, i) + 1) >= 450);
      if (build.length && r() < 0.6) return { action: 'build', payload: { sq: build[0] } };
    }
    return { action: 'endTurn', payload: {} };
  }
  return null;
};

/** What one side of an offer is worth to `pid`, face value plus what it does to the colours. */
const bankSideValue = (g, pid, side, receiving, level) => {
  let v = side.cash || 0;
  (side.sqs || []).forEach(i => {
    const q = BANK_SQUARES[i];
    v += g.own[i] && g.own[i].mort ? Math.floor(q.price / 2) : q.price;
    if (level === 'hard' && q.t === 'p') {
      const sqs = bankGroupSquares(q.g);
      if (receiving) {
        // Would it give me the whole colour?
        const mine = sqs.filter(k => bankOwnerOf(g, k) === pid || (side.sqs || []).indexOf(k) !== -1).length;
        if (mine === sqs.length) v += q.price * 2;
      }
    }
  });
  v += (side.cards || []).length * 40;
  return v;
};

/** Does a computer player take the offer made to it? */
const bankBotLikes = (g, pid, o, level) => {
  const receive = bankSideValue(g, pid, o.give, true, level);
  const giveAway = bankSideValue(g, pid, o.get, false, level);
  if (level !== 'hard') return receive >= giveAway * 0.9;
  // Hard: never hand over a colour's last place unless paid for it handsomely.
  let penalty = 0;
  (o.get.sqs || []).forEach(i => {
    const q = BANK_SQUARES[i];
    if (q.t !== 'p') return;
    const sqs = bankGroupSquares(q.g);
    const theirs = sqs.filter(k => bankOwnerOf(g, k) === o.from || (o.get.sqs || []).indexOf(k) !== -1).length;
    if (theirs === sqs.length) penalty += q.price * 3;
  });
  return receive >= (giveAway + penalty) * 1.1;
};

/**
 * The one move a player could make, when there is only one: a debt nothing
 * can cover (bankrupt), or a place they can't pay for and nothing to raise
 * the money with (leave it). Otherwise null.
 */
const bankOnlyMove = (g, pid) => {
  if (g.phase !== 'play' || g.turn.pid !== pid) return null;
  if (g.turn.stage === 'debt' && g.debt && bankLiquid(g, pid) < g.debt.amount) return { action: 'bankrupt', payload: {} };
  if (g.turn.stage === 'buy') {
    const q = BANK_SQUARES[g.pos[pid]];
    if (bankLiquid(g, pid) < q.price) return { action: 'buy', payload: { yes: false } };
  }
  return null;
};
