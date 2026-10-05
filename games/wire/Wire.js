/* ============================================================================
   الحقوا! (first called سلك مقطوع) — the controls, the places and the numbers (29 Sep 2026)
   ----------------------------------------------------------------------------
   Shared by the page (inlined, SHARED_LISTS) and the rooms server (bundled
   before RoomGames.js): the server deals panels and orders from these lists,
   the phone draws the controls and writes an order in its own language.
   No DOM, nothing that runs at load. Every name starts with wire / WIRE_.

   A control: { id, t, ar, en, ... }
     t 'btn'   a button pressed n times      do: [ar, en] the order's words ("اضرب الكلاكس")
     t 'sw'    a switch, on or off (1 / 0)   on / off: [ar, en] the two orders
     t 'dial'  a knob, 1 to 5 (a tap turns it on one)
     t 'slide' a slider, 1 to 5              o: 'h' across, 'v' up and down (the wedding's faders)
   A btn has a colour c. Ids are the place's name, a dot and the control's own.
   ========================================================================= */
const WIRE_PLACES = ['bus', 'kitchen', 'wedding'];
const WIRE_PLACE_NAMES = {
  bus: ['الميكروباص عطلان', 'The broken-down microbus'],
  kitchen: ['المطبخ قبل الضيوف', 'The kitchen before the guests'],
  wedding: ['الفرح والنور قاطع', 'The wedding with the power cut']
};

// The numbers of a level, in one place (the owner's rules: harder every level,
// lost by the damage or the clock, whichever runs out first).
const WIRE_MIN = 3;                 // players to start
const WIRE_MAX = 8;                 // players at the table; the rest watch
const WIRE_LEVEL_MS = 75000;        // the level's clock
const WIRE_READY_MS = 4000;         // the level's card before the orders start
const WIRE_BETWEEN_MS = 4500;       // a level won stays this long before the next one's card
const WIRE_DMG_MAX = 5;             // missed orders a level can take with three at the table, one more for each player past three
const WIRE_GAP_MS = 700;            // a phone's next order comes this long after the last
const WIRE_GRACE_MS = 300;          // an order counts this long past its bar (the network's share)
const WIRE_OWN_CHANCE = 0.25;       // an order for a control on your own panel (usually it is someone else's)
const WIRE_WIPES = 4;               // taps to wipe a control out of the smoke
const WIRE_FLIP_MS = 9000;          // a control turned upside down this long
const WIRE_SHAKE_MS = 7000;         // «الكل يهز الموبايل!»: this long to shake
const WIRE_SHAKE_BONUS = 2;         // a shake everyone made: progress
const WIRE_VALUES = 5;              // a dial or a slider: 1..5
const WIRE_MASH_EVERY = 3;          // every third pointless move in a row by one phone (a change no order waits on)…
const WIRE_MASH_DMG = 0.25;         // …costs the table a quarter of a miss (the review of 1 Oct 2026: mashing beat listening)

/** How many controls a phone gets: 6 with three at the table, 4 from six (8 × 4 = 32 of a place's 34). */
const wirePanelSize = (n) => (n <= 3 ? 6 : n <= 5 ? 5 : 4);

/** A level: how many orders to finish, how long an order lasts. Harder every level. */
const wireLevel = (level, n) => {
  const L = Math.max(1, level || 1);
  return {
    target: Math.round(Math.max(2, n) * (2.5 + 0.5 * L)) + 2,
    orderMs: Math.max(5000, 11500 - 800 * (L - 1)),
    dmgMax: WIRE_DMG_MAX + Math.max(0, Math.min(n, WIRE_MAX) - 3),   // every phone has an order running at once
    levelMs: WIRE_LEVEL_MS,
    counts: L >= 3 ? 3 : 2,                       // a button: pressed up to this many times
    breakEvery: Math.max(8000, 18000 - 900 * (L - 1)),
    breaksAtOnce: L >= 4 ? 2 : 1
  };
};

const WIRE_CONTROLS = {
  // «تابلوه الميكروباص»: the microbus broken down on the desert road.
  bus: [
    { id: 'brake', t: 'sw', ar: 'فرامل اليد', en: 'Handbrake', on: ['شد فرامل اليد', 'Pull the handbrake'], off: ['نزّل فرامل اليد', 'Release the handbrake'] },
    { id: 'tape', t: 'dial', ar: 'الكاسيت', en: 'Cassette' },
    { id: 'horn', t: 'btn', c: '#e5383b', ar: 'الكلاكس أبو صوتين', en: 'Two-tone horn', do: ['اضرب الكلاكس', 'Honk the horn'] },
    { id: 'wiper', t: 'sw', ar: 'المسّاحات', en: 'Wipers', on: ['شغّل المسّاحات', 'Turn the wipers on'], off: ['اطفي المسّاحات', 'Turn the wipers off'] },
    { id: 'ac', t: 'slide', o: 'h', ar: 'شفّاط التكييف', en: 'AC fan' },
    { id: 'bell', t: 'btn', c: '#2f6fd6', ar: 'جرس «على جنب يا اسطى»', en: '"Pull over!" bell', do: ['اضرب جرس «على جنب»', 'Ring the "pull over" bell'] },
    { id: 'radiator', t: 'btn', c: '#1f9d55', ar: 'منفاخ الرادياتير', en: 'Radiator pump', do: ['انفخ في الرادياتير', 'Pump the radiator'] },
    { id: 'hazard', t: 'sw', ar: 'الانتظار', en: 'Hazard lights', on: ['ولّع الانتظار', 'Hazard lights on'], off: ['اطفي الانتظار', 'Hazard lights off'] },
    { id: 'seat', t: 'dial', ar: 'كرسي السوّاق', en: "Driver's seat" },
    { id: 'mirror', t: 'dial', ar: 'المراية', en: 'Mirror' },
    { id: 'fare', t: 'btn', c: '#f59e0b', ar: 'درج الأجرة', en: 'Fare drawer', do: ['خبّط على درج الأجرة', 'Bang the fare drawer'] },
    { id: 'door', t: 'sw', ar: 'الباب الجرّار', en: 'Sliding door', on: ['افتح الباب الجرّار', 'Open the sliding door'], off: ['اقفل الباب الجرّار', 'Shut the sliding door'] },
    { id: 'fan', t: 'slide', o: 'h', ar: 'مروحة التابلوه', en: 'Dashboard fan' },
    { id: 'beam', t: 'sw', ar: 'النور العالي', en: 'High beams', on: ['ولّع النور العالي', 'High beams on'], off: ['اطفي النور العالي', 'High beams off'] },
    { id: 'gear', t: 'dial', ar: 'الفتيس', en: 'Gearstick' },
    { id: 'gas', t: 'slide', o: 'h', ar: 'دوّاسة البنزين', en: 'Gas pedal' },
    { id: 'radio', t: 'dial', ar: 'الراديو', en: 'Radio' },
    { id: 'beads', t: 'btn', c: '#7c3aed', ar: 'سبحة المراية', en: 'Mirror beads', do: ['هز سبحة المراية', 'Shake the mirror beads'] },
    { id: 'window', t: 'sw', ar: 'الشبّاك', en: 'Window', on: ['افتح الشبّاك', 'Open the window'], off: ['اقفل الشبّاك', 'Close the window'] },
    { id: 'visor', t: 'sw', ar: 'الشمسية', en: 'Sun visor', on: ['نزّل الشمسية', 'Pull the sun visor down'], off: ['ارفع الشمسية', 'Push the sun visor up'] },
    { id: 'tissue', t: 'btn', c: '#0ea5a4', ar: 'علبة المناديل', en: 'Tissue box', do: ['اسحب منديل', 'Pull a tissue'] },
    { id: 'spare', t: 'btn', c: '#57534e', ar: 'الكاوتش الاستبن', en: 'Spare tyre', do: ['اخبط الاستبن', 'Kick the spare tyre'] },
    { id: 'oil', t: 'slide', o: 'h', ar: 'زيت الموتور', en: 'Engine oil' },
    { id: 'heater', t: 'sw', ar: 'الدفاية', en: 'Heater', on: ['شغّل الدفاية', 'Heater on'], off: ['اطفي الدفاية', 'Heater off'] },
    { id: 'wedhorn', t: 'btn', c: '#db2777', ar: 'كلاكس العروسة', en: 'Wedding horn', do: ['اضرب كلاكس العروسة', 'Play the wedding horn'] },
    { id: 'meter', t: 'dial', ar: 'العدّاد', en: 'Meter' },
    { id: 'speaker', t: 'slide', o: 'h', ar: 'صوت السمّاعة', en: 'Speaker volume' },
    { id: 'pump', t: 'btn', c: '#ea580c', ar: 'طرمبة البنزين', en: 'Fuel pump', do: ['دوس الطرمبة', 'Work the fuel pump'] },
    { id: 'lock', t: 'sw', ar: 'ترباس الباب', en: 'Door bolt', on: ['اقفل الترباس', 'Shoot the bolt'], off: ['افتح الترباس', 'Draw the bolt'] },
    { id: 'fog', t: 'sw', ar: 'كشافات الشبّورة', en: 'Fog lights', on: ['ولّع كشافات الشبّورة', 'Fog lights on'], off: ['اطفي كشافات الشبّورة', 'Fog lights off'] },
    { id: 'wheel', t: 'dial', ar: 'الدريكسيون', en: 'Steering wheel' },
    { id: 'cooler', t: 'btn', c: '#2563eb', ar: 'الكولمان', en: 'Water cooler', do: ['املا كوباية من الكولمان', 'Fill a cup from the cooler'] },
    { id: 'boot', t: 'sw', ar: 'الشنطة', en: 'Boot', on: ['افتح الشنطة', 'Open the boot'], off: ['اقفل الشنطة', 'Shut the boot'] },
    { id: 'sign', t: 'dial', ar: 'يافطة الخط', en: 'Route sign' }
  ],
  // «ورقة ماما على التلاجة»: the kitchen an hour before the guests.
  kitchen: [
    { id: 'gas', t: 'dial', ar: 'البوتاجاز', en: 'Cooker' },
    { id: 'tap', t: 'sw', ar: 'حنفية المية الزرقا', en: 'Blue tap', on: ['افتح حنفية المية الزرقا', 'Turn the blue tap on'], off: ['اقفل حنفية المية الزرقا', 'Turn the blue tap off'] },
    { id: 'mahshi', t: 'btn', c: '#1f9d55', ar: 'المحشي', en: 'Stuffed vine leaves', do: ['قلّب المحشي', 'Turn the vine leaves'] },
    { id: 'hood', t: 'sw', ar: 'الشفّاط', en: 'Cooker hood', on: ['شغّل الشفّاط', 'Hood fan on'], off: ['اطفي الشفّاط', 'Hood fan off'] },
    { id: 'oven', t: 'slide', o: 'h', ar: 'نار الفرن', en: 'Oven heat' },
    { id: 'blender', t: 'btn', c: '#e5383b', ar: 'الخلّاط', en: 'Blender', do: ['شغّل الخلّاط', 'Pulse the blender'] },
    { id: 'kettle', t: 'sw', ar: 'الكاتل', en: 'Kettle', on: ['شغّل الكاتل', 'Kettle on'], off: ['اطفي الكاتل', 'Kettle off'] },
    { id: 'molokhia', t: 'btn', c: '#15803d', ar: 'الملوخية', en: 'Molokhia', do: ['شهّق للملوخية', 'Gasp over the molokhia'] },
    { id: 'rice', t: 'dial', ar: 'نار الرز', en: 'Rice flame' },
    { id: 'fridge', t: 'sw', ar: 'باب التلاجة', en: 'Fridge door', on: ['افتح التلاجة', 'Open the fridge'], off: ['اقفل التلاجة', 'Shut the fridge'] },
    { id: 'salt', t: 'btn', c: '#57534e', ar: 'الملّاحة', en: 'Salt shaker', do: ['رش ملح', 'Shake some salt'] },
    { id: 'timer', t: 'dial', ar: 'منبّه الفرن', en: 'Oven timer' },
    { id: 'dough', t: 'slide', o: 'h', ar: 'عجينة الفطير', en: 'Pastry dough' },
    { id: 'onion', t: 'btn', c: '#a855f7', ar: 'البصل', en: 'Onions', do: ['قطّع بصلة', 'Chop an onion'] },
    { id: 'light', t: 'sw', ar: 'نور المطبخ', en: 'Kitchen light', on: ['ولّع نور المطبخ', 'Kitchen light on'], off: ['اطفي نور المطبخ', 'Kitchen light off'] },
    { id: 'washer', t: 'sw', ar: 'الغسّالة', en: 'Washing machine', on: ['شغّل الغسّالة', 'Start the washing machine'], off: ['وقّف الغسّالة', 'Stop the washing machine'] },
    { id: 'ladle', t: 'btn', c: '#f59e0b', ar: 'المغرفة', en: 'Ladle', do: ['قلّب الشوربة', 'Stir the soup'] },
    { id: 'ceiling', t: 'slide', o: 'h', ar: 'مروحة السقف', en: 'Ceiling fan' },
    { id: 'micro', t: 'dial', ar: 'الميكرويف', en: 'Microwave' },
    { id: 'doorbell', t: 'btn', c: '#2f6fd6', ar: 'جرس الباب', en: 'Doorbell', do: ['رد على جرس الباب', 'Answer the doorbell'] },
    { id: 'window', t: 'sw', ar: 'شبّاك المطبخ', en: 'Kitchen window', on: ['افتح شبّاك المطبخ', 'Open the kitchen window'], off: ['اقفل شبّاك المطبخ', 'Close the kitchen window'] },
    { id: 'garlic', t: 'btn', c: '#78716c', ar: 'التوم', en: 'Garlic', do: ['دُق التوم', 'Crush the garlic'] },
    { id: 'sugar', t: 'slide', o: 'h', ar: 'سكر الشاي', en: 'Sugar in the tea' },
    { id: 'plug', t: 'sw', ar: 'سدّادة الحوض', en: 'Sink plug', on: ['حط سدّادة الحوض', 'Put the sink plug in'], off: ['شيل سدّادة الحوض', 'Pull the sink plug out'] },
    { id: 'fatta', t: 'dial', ar: 'حلّة الفتّة', en: 'Fatta pot' },
    { id: 'plates', t: 'btn', c: '#0ea5a4', ar: 'الأطباق', en: 'Plates', do: ['رُص طبق', 'Stack a plate'] },
    { id: 'kahk', t: 'btn', c: '#b45309', ar: 'الكحك', en: 'Kahk', do: ['انقش كحكة', 'Stamp a kahk'] },
    { id: 'radio', t: 'sw', ar: 'الراديو', en: 'Radio', on: ['شغّل الراديو', 'Radio on'], off: ['اطفي الراديو', 'Radio off'] },
    { id: 'aircon', t: 'slide', o: 'h', ar: 'التكييف', en: 'Air conditioner' },
    { id: 'heater', t: 'dial', ar: 'السخّان', en: 'Water heater' },
    { id: 'foil', t: 'btn', c: '#64748b', ar: 'ورق الفويل', en: 'Foil', do: ['اقطع فويل', 'Tear some foil'] },
    { id: 'balcony', t: 'sw', ar: 'باب البلكونة', en: 'Balcony door', on: ['افتح باب البلكونة', 'Open the balcony door'], off: ['اقفل باب البلكونة', 'Shut the balcony door'] },
    { id: 'mixer', t: 'slide', o: 'h', ar: 'سرعة العجّان', en: 'Mixer speed' },
    { id: 'lemon', t: 'btn', c: '#eab308', ar: 'اللمون', en: 'Lemons', do: ['اعصر لمونة', 'Squeeze a lemon'] }
  ],
  // «عم الفرح والمكسر»: the wedding with the power cut. Its faders stand up.
  wedding: [
    { id: 'vol', t: 'slide', o: 'v', ar: 'الصوت', en: 'Volume' },
    { id: 'light', t: 'slide', o: 'v', ar: 'النور', en: 'Light' },
    { id: 'dj', t: 'sw', ar: 'الدي جي', en: 'The DJ', on: ['شغّل الدي جي', 'DJ on'], off: ['اطفي الدي جي', 'DJ off'] },
    { id: 'lamps', t: 'sw', ar: 'الكلوبات', en: 'Lanterns', on: ['ولّع الكلوبات', 'Light the lanterns'], off: ['اطفي الكلوبات', 'Put the lanterns out'] },
    { id: 'zag', t: 'btn', c: '#e5387b', ar: 'زغروطة!', en: 'Zaghrouta!', do: ['اطلق زغروطة', 'Let out a zaghrouta'] },
    { id: 'drum', t: 'btn', c: '#f59e0b', ar: 'الطبلة', en: 'Tabla', do: ['اضرب الطبلة', 'Hit the tabla'] },
    { id: 'gen', t: 'sw', ar: 'المولّد', en: 'Generator', on: ['شغّل المولّد', 'Start the generator'], off: ['اطفي المولّد', 'Stop the generator'] },
    { id: 'disco', t: 'dial', ar: 'كورة الديسكو', en: 'Disco ball' },
    { id: 'smoke', t: 'slide', o: 'v', ar: 'الدخان', en: 'Smoke machine' },
    { id: 'cake', t: 'btn', c: '#ec4899', ar: 'التورتة', en: 'The cake', do: ['قطّع التورتة', 'Cut the cake'] },
    { id: 'flash', t: 'btn', c: '#0ea5a4', ar: 'فلاش المصوّر', en: 'Camera flash', do: ['صوّر العروسة', 'Snap the bride'] },
    { id: 'fan', t: 'sw', ar: 'مروحة الكوشة', en: 'Stage fan', on: ['شغّل مروحة الكوشة', 'Stage fan on'], off: ['اطفي مروحة الكوشة', 'Stage fan off'] },
    { id: 'mic', t: 'dial', ar: 'المايك', en: 'The mic' },
    { id: 'bass', t: 'slide', o: 'v', ar: 'البيز', en: 'Bass' },
    { id: 'roses', t: 'btn', c: '#e5383b', ar: 'الورد', en: 'Rose petals', do: ['ارمي ورد', 'Throw petals'] },
    { id: 'confetti', t: 'btn', c: '#7c3aed', ar: 'الكونفيتي', en: 'Confetti', do: ['اطلق كونفيتي', 'Fire the confetti'] },
    { id: 'spot', t: 'dial', ar: 'الكشّاف', en: 'Spotlight' },
    { id: 'carpet', t: 'sw', ar: 'السجادة الحمرا', en: 'Red carpet', on: ['افرش السجادة الحمرا', 'Roll the red carpet out'], off: ['لِم السجادة الحمرا', 'Roll the red carpet up'] },
    { id: 'rocket', t: 'btn', c: '#ea580c', ar: 'الصواريخ', en: 'Fireworks', do: ['ولّع صاروخ', 'Light a firework'] },
    { id: 'bubbles', t: 'sw', ar: 'مكنة الفقاقيع', en: 'Bubble machine', on: ['شغّل مكنة الفقاقيع', 'Bubbles on'], off: ['اطفي مكنة الفقاقيع', 'Bubbles off'] },
    { id: 'riq', t: 'btn', c: '#b45309', ar: 'الرِّق', en: 'Tambourine', do: ['هز الرِّق', 'Shake the tambourine'] },
    { id: 'violins', t: 'slide', o: 'v', ar: 'الكمنجات', en: 'Violins' },
    { id: 'zaffa', t: 'sw', ar: 'الزفّة', en: 'The zaffa', on: ['ابدأ الزفّة', 'Start the zaffa'], off: ['وقّف الزفّة', 'Stop the zaffa'] },
    { id: 'rows', t: 'dial', ar: 'صفوف الكراسي', en: 'Rows of chairs' },
    { id: 'sherbet', t: 'btn', c: '#dc2626', ar: 'الشربات', en: 'Sherbet', do: ['وزّع شربات', 'Hand out sherbet'] },
    { id: 'aircon', t: 'slide', o: 'v', ar: 'التكييف', en: 'Air conditioning' },
    { id: 'curtain', t: 'sw', ar: 'ستارة المسرح', en: 'Stage curtain', on: ['افتح ستارة المسرح', 'Open the curtain'], off: ['اقفل ستارة المسرح', 'Close the curtain'] },
    { id: 'camera', t: 'dial', ar: 'زاوية الكاميرا', en: 'Camera angle' },
    { id: 'balloon', t: 'btn', c: '#2563eb', ar: 'البالونات', en: 'Balloons', do: ['فرقع بالونة', 'Pop a balloon'] },
    { id: 'slow', t: 'sw', ar: 'الرقصة السلو', en: 'Slow dance', on: ['ابدأ الرقصة السلو', 'Start the slow dance'], off: ['وقّف الرقصة السلو', 'Stop the slow dance'] },
    { id: 'echo', t: 'slide', o: 'v', ar: 'الصدى', en: 'Echo' },
    { id: 'horns', t: 'btn', c: '#16a34a', ar: 'كلاكسات الزفّة', en: 'Procession horns', do: ['اضرب كلاكسات الزفّة', 'Sound the procession horns'] },
    { id: 'bulbs', t: 'dial', ar: 'لمبات الزينة', en: 'Fairy lights' },
    { id: 'kids', t: 'btn', c: '#0891b2', ar: 'العيال', en: 'The kids', do: ['هدّي العيال', 'Calm the kids down'] }
  ]
};

/** Every control by its full id ('bus.brake'). */
const WIRE_BY_ID = (() => {
  const out = {};
  WIRE_PLACES.forEach((pl) => WIRE_CONTROLS[pl].forEach((c) => { out[pl + '.' + c.id] = Object.assign({ place: pl, key: pl + '.' + c.id }, c); }));
  return out;
})();
const wireControl = (cid) => WIRE_BY_ID[cid] || null;

/** A control's name in a language ('ar' | 'en'). */
const wireName = (cid, lang) => {
  const c = wireControl(cid);
  return c ? (lang === 'en' ? c.en : c.ar) : '';
};

/**
 * An order's words in a language: { c, v } (a switch, a dial or a slider set
 * to v) or { c, n } (a button pressed n times). Numbers are western digits,
 * as everywhere in the app.
 */
const wireOrderText = (o, lang) => {
  const c = o && wireControl(o.c);
  if (!c) return '';
  const k = lang === 'en' ? 1 : 0;
  if (c.t === 'btn') {
    const n = o.n || 1;
    const base = c.do[k];
    if (n === 1) return base;
    if (k) return base + (n === 2 ? ' twice' : ' ' + n + ' times');
    return base + (n === 2 ? ' مرتين' : ' ' + n + ' مرات');
  }
  if (c.t === 'sw') return (o.v ? c.on : c.off)[k];
  return k ? c.en + ' to ' + o.v : c.ar + ' على ' + o.v;
};
