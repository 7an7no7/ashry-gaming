# Content decisions (the content audit of 27 Sep 2026, the owner's content decisions of 26 Sep 2026)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Decided, and why

- **The content audit of 27 Sep 2026** (the owner, playing خيوط: «وسائل
  مواصلات» dealt صاروخ - "audit it and make sure all data fits and is spelled
  correctly, and check the other games too"). Eight reviewers went through
  every list the games deal from, one file each, against the same rules: a
  word fits its category the way a family at the table understands the name
  (a rocket is not transport, a nail is not a tool, a drink is not a dish, a
  plate is not cutlery), the standard Egyptian spelling (ضابط not ظابط, نظارة
  not نضارة, إصبع, no diacritics), no word twice or in two spellings, no
  property-named category, family-clean, nothing obscure (ترومبيت, يعسوب, the
  Konosuba characters). About 500 changes across `ChameleonWords.js` (both
  languages), `SpyWords.js` (the drinks and bare ingredients left «أكلات» /
  Food: they are not dishes; **the drinks were added to `StopWords.js`'s
  food list**, so a table that writes شاي under أكل keeps its points),
  `MonkeyWords.js`, `BombPrompts.js`, `StopWords.js`, `ConnectionsWords.js`
  (a word that fit two groups of a hard puzzle was a bug: بومة under night
  animals beside birds of prey), `EmojiRiddles.js` (foreign titles as
  Egyptians say them: جوراسيك بارك, فاست آند فيوريس, the old name kept as an
  alternative), `Proverbs.js` (five sayings in the wording they are said,
  four arguable ones replaced), `PartyContent.js` (Gulf wording made
  Egyptian, two Fibbage facts made exact), `WordleWords.js` (office and
  political words out), `Countries.js` (the ج spellings accepted:
  أنجولا, أوروجواي), `TimelineEvents.js` (the High Dam's 1970 replaced by
  Nasser's death: it opened in 1971), the charades, describe, Who Am I, Just
  One and drawing lists (R-rated and political films out, sequels' numbers
  out, house parts out of tools). Left for the owner: السادات and عبد الناصر
  among the famous, رأفت الهجان and الممر in the films, the Coptic months and
  African currencies in the hard Connections, «رياضات ⚽» and «رياضات
  أولمبية» overlapping. Every list keeps its size; `npm run check` passes.

- **The review of 1 Oct 2026, content** ("apply the improvements"):
  - **قبل ولا بعد's bank grew from 42 to 163 events** (`TimelineEvents.js`,
    622-2022): a four-player game deals 21, so two games went through it.
    Only years that are settled facts - inventions, famous buildings and
    bridges, sport firsts, Egyptian history and culture (the Citadel, the
    Khedivial Opera and Aida, the Egyptian Museum, Cairo University, Banque
    Misr, the radio, the TV, the Cairo Tower, «إنت عمري», Abu Simbel's move,
    the book fair, the film festival, the metro lines, Zewail's Nobel), space,
    games and everyday things. Left out on purpose: anything political or
    divisive, events whose name holds their year (ثورة 1919, ويندوز 95), firsts
    that are argued about (the first cartoon feature, the first photograph,
    the radio), and Paris or London Olympics (each city held several).
    **Two cards may share a year** now: `timelineFits` already took a card
    beside one of its own year on either side, so the one-card-a-year check
    became "no event twice".
  - **Trivia** (`TriviaQuestions.js`): every question tagged with a category
    for the room lobby's pick, and the bank swept for disputed facts and
    distractors, rankings that go stale and mixed فصحى/عامية (the list is in
    `notes/games/trivia.md`); the count stays 577 Arabic, 579 English.

- **The owner's content decisions of 26 Sep 2026** (the review of 25 Sep,
  `notes/archive/plans/review-2026-09-25/`, asked each question; the owner answered):
  - **Cut**: prompts about height («أطول/أقصر واحد في العيلة» in لو خيروك,
    «شخص قصير ↔ طويل جداً» on the موجة dial, both languages) and romance
    («تتفرج على فيلم رومانسي مع أبوك»), each replaced by a family item of the
    same kind; «الراقصة والسياسي» and «الإرهاب والكباب» out of the films that
    بدون كلام and على راسك deal (and فوازير إيموجي's), replaced by عائلة زيزي
    and أم العروسة; الحرباء's رياضات مائية (سنوركلينج, باراسيلينج, ويك بورد)
    and أنمي boards and جرين لانترن swapped for boards a family knows
    (رياضات, في المدرسة, بلاك ويدو); the Arabic emoji riddles' «أفلام أجنبية»
    trimmed to the thirteen best known in Egypt, the rest Egyptian films; the
    bomb's categories that name a property (things with buttons, round
    things, things that fly, float, glow, cold, hot, a colour, a material)
    replaced by kinds of thing; إسرائيل and تل أبيب out of ربع قرد's lists
    (Palestine stays, as in خمّن الدولة).
  - **Kept**: الأهلي ↔ الزمالك, the wedding prompts, named celebrities, YouTube
    and WhatsApp.
  - **Facts made exact**: the paper question asks where the paper we write on
    today was invented (China; papyrus made مصر arguable); Amr Shabana is the
    first Egyptian to win the Squash World Open (2003), not "the first world
    champion"; the White Nile out of Lake Victoria became the Blue Nile out of
    Lake Tana. Golf's «الهرم» is «هرم سقارة المدرّج» (its name only).
  - **الجاسوس in English**: its own words and pairs (*الجاسوس in English*).

- **The review of 1 Oct 2026, content** (Part 2; the owner: "apply the improvements").
  - **English lists grown**: كمّل المثل 73 → 164 proverbs, فوازير إيموجي 128 → 232
    riddles, in the kinds already there (`notes/games/party-rooms.md`).
  - **Wordle's daily keeps to one spelling**: no final ي/ى, no hamza (ء ئ ؤ), no loanword
    written with ة or ه or a letter more or less, no colloquial form beside its proper one
    (`WORDLE_DAILY_SKIP`, `wordleDailySafe`); the free game still deals them. Wordle checks
    a guess against the app's word lists, softly: unknown shakes once, Enter again sends it.
  - **تشابه**: the near-copy hard puzzles rewritten (15 in each language, 23 two groups),
    «كلام بنقوله في المناسبات» named «تهاني ومجاملات» (a phrase read as a kind), and a check
    against near copies (three shared category names in a level; a whole group twice among
    the hard puzzles).
  - **The Chameleon's categories** are one icon and one name each in a language (English
    «Sports 🏅» is «Olympic Sports»; في الحديقة 🌷, أجزاء العربية 🔧, أدوات الرسم 🖌️, ممثلين
    مصريين 🌟, لاعبين كورة 👟, في ماتش كورة 📣), since إيه اللي يجمعهم؟ offers them side by
    side; it never offers a category sharing four words with the answer
    (`notes/games/solo.md`).

## 8 Oct 2026 - the owner on the audit's content swaps

- **The films stay** (the owner, after the audit of 8 Oct 2026 replaced them): إبراهيم الأبيض, الجريمة, سهر الليالي,
  عن العشق والهوى, بشتري راجل, الكيت كات, الخلية, جواب اعتقال and الاختيار are back in بدون كلام and فوازير
  إيموجي, and the replacements (مراتي مدير عام, البيه البواب…) are gone again. Don't cut these films again.
- **Arabic and English content are not swapped for each other**: an Arabic entry is not replaced by a foreign one
  («ثورة يناير» stays in قبل ولا بعد, not a British royal wedding), and an English card is not rewritten to match
  the Arabic one (the longest place name stays 85 letters in English, 168 in Arabic).
