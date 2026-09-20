/**
 * قبل ولا بعد — the dated events the Timeline game deals from.
 *
 * Egyptian and Arab first, with famous world dates mixed in so the cards
 * spread across the centuries (the owner, 20 Sep 2026).
 *
 * Every entry is { y, ar, en }: one year that is not in dispute, and the event
 * in both languages. **A date only goes in if it has one well-known answer.**
 * A game whose cards can be argued about is worse than a short bank - there is
 * no host to settle it, and the server's word is final.
 *
 * `tools/validate-content.js` checks that every entry has all three fields and
 * that no year appears twice (two cards with the same year make a placement
 * that is right and wrong at the same time).
 *
 * THIS FILE IS SERVER-ONLY. It is bundled into the Worker by
 * rooms-worker/build.mjs and is deliberately NOT inlined into the page by
 * tools/build-*.mjs: the years of the cards still in a hand are the whole
 * secret of the game, and shipping the answer key inside the app would hand
 * every player a lookup table. The phone is told a card's year only once the
 * table has seen it go down.
 */
const TIMELINE_EVENTS = [
  { y: 1869, ar: 'افتتاح قناة السويس',                  en: 'The Suez Canal opens' },
  { y: 1876, ar: 'اختراع التليفون',                      en: 'The telephone is invented' },
  { y: 1903, ar: 'أول طيران للأخوين رايت',               en: "The Wright brothers' first flight" },
  { y: 1912, ar: 'غرق التيتانيك',                        en: 'The Titanic sinks' },
  { y: 1922, ar: 'اكتشاف مقبرة توت عنخ آمون',            en: "Tutankhamun's tomb is discovered" },
  { y: 1932, ar: 'تأسيس المملكة العربية السعودية',        en: 'Saudi Arabia is founded' },
  { y: 1945, ar: 'نهاية الحرب العالمية التانية',          en: 'The Second World War ends' },
  { y: 1952, ar: 'ثورة يوليو',                           en: 'The July Revolution in Egypt' },
  { y: 1956, ar: 'تأميم قناة السويس',                    en: 'The Suez Canal is nationalised' },
  { y: 1969, ar: 'أول إنسان على القمر',                  en: 'The first man on the Moon' },
  { y: 1970, ar: 'افتتاح السد العالي',                   en: 'The Aswan High Dam opens' },
  { y: 1971, ar: 'تأسيس الإمارات',                       en: 'The United Arab Emirates is founded' },
  { y: 1973, ar: 'حرب أكتوبر',                           en: 'The October War' },
  { y: 1975, ar: 'وفاة أم كلثوم',                        en: 'Umm Kulthum dies' },
  { y: 1977, ar: 'وفاة عبد الحليم حافظ',                 en: 'Abdel Halim Hafez dies' },
  { y: 1987, ar: 'افتتاح أول خط مترو في القاهرة',        en: "Cairo's first metro line opens" },
  { y: 1988, ar: 'نجيب محفوظ يفوز بجايزة نوبل',          en: 'Naguib Mahfouz wins the Nobel Prize' },
  { y: 1990, ar: 'أول موقع على الإنترنت',                en: 'The first website' },
  { y: 2004, ar: 'إطلاق فيسبوك',                         en: 'Facebook launches' },
  { y: 2007, ar: 'أول آيفون',                            en: 'The first iPhone' },
  { y: 2011, ar: 'ثورة يناير',                           en: 'The January Revolution in Egypt' },
  { y: 2015, ar: 'افتتاح قناة السويس الجديدة',           en: 'The New Suez Canal opens' }
];
