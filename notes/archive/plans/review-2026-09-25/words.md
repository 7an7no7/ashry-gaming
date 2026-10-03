# Review of the word and party games, 25-26 Sep 2026 (area "words")

Reviewer N2. I played these games in headless Chrome against a local rooms
server on :8802, with the preview on :4352:

- بدون كلام, with the team relay
- أوصف لي, with the relay
- خلصت الكلمة / ثلاث جولات
- من أنا؟, with the ask director and the room
- كلمة واحدة
- أسماء الرموز
- المشنقة, two on one phone and both room ways
- ارسم وخمّن
- ارسم واكتب
- ربع قرد, in all three modes, on one phone and in a room

**Phones:** one phone at 375×812 in Arabic light, 667×375 in Arabic and English
dark, and 1280×720 in English dark.

**Rooms:** four phones. Two were 375×812 Arabic, one was 667×375 Arabic and one
was 375×812 English dark. The TV ran at 1920×1080 Arabic, and again at 1280×720
English dark.

**Checks run:**
- `npm run check`: passes.
- `npm run test:rules`: passes. One estimation check is flaky (see the end).
- `node test/play-all.mjs http://127.0.0.1:8802`: 2336 passed, 0 failed.

Screenshots are in `shots-words/`.

## What I fixed

### Everywhere in these games: "1 / 3" was drawn as "3 / 1" in Arabic

A fraction with spaces round the slash, inside an Arabic line, is laid out
right to left. I measured it in the page: the 3 sits to the left of the 1. It
affected:
- the relay's turn counter
- «خبّي الموبايل عن … · 1 / 4» in من أنا؟
- كلمة واحدة's round on one phone, and its "0 / 3" on the room phone and the TV
- ارسم واكتب's step, the "sent" count and the reveal pill. The pill showed
  «4/1·4/1», which also didn't say what the two numbers meant.

**Fix:** a new `ltrFrac(a, b)` in `JS_TeamRelay.html` holds the fraction left to
right (LRI…PDI, built from char codes). The reveal pill now reads «🔗 1 / 4 ·
خطوة 1 / 4». I added a Traps note in GEMINI.md. Other games' TV counters still
write `${a} / ${b}` (trivia, votes, fibbage); I left those to their reviewers.

**Files:** JS_TeamRelay.html, JS_WhoAmI.html, JS_NewGames.html,
JS_RoomTelephone.html, JS_RoomGames.html, JS_RoomTv.html (the just-one line
only).

### ثلاث جولات
- **The play area wasn't first.** The live turn was a small word card, with
  half the screen empty on a phone and most of it empty on a laptop. It now uses
  the same stage as بدون كلام and أوصف لي (`view--stage`, `play-stage__*`): the
  word card fills the height, and on a phone on its side and on a laptop the
  card sits beside its two buttons. The word is bigger (text-5xl).
- **The round's rule is on the live card** («الجولة 2: كلمة واحدة بس!»). The rule
  was only on the "ready" card, so a clue giver in round 2 or 3 had nothing on
  screen to remind them.
- **The buttons are in the same places as the other two games.** Skip is now on
  the right in Arabic and Correct on the left, as in بدون كلام and أوصف لي. They
  were swapped, which invites mis-taps when moving between the three games.
- **Taps behind the final score kept scoring** (a real bug). ✅ still worked
  after the last card, so a reachable tap could push the total past 3 × the deck.
  It stopped a scripted run at 178 for a 35-card deck. `currentCard` is now
  cleared at the finale.
- The "need 4 players" toast is in Egyptian Arabic now.

**Files:** Controller.html, JS_TimesUp.html.

### بدون كلام / أوصف لي team relay
- The handover said «دور فريق · … الفريق الأحمر» and «مرر الموبايل لفريق
  الفريق الأحمر». Now it says «الدور · 1 / 3» and «مرّروا الموبايل للفريق ده»; the
  team's name is shown big right above it.
- In English: "Turn · 1 / 3" and "Hand the phone to this team".

### من أنا؟
- **A new phone started on «✍️ إدخال يدوي».** Start then went to typing the
  characters in by hand. It now starts on the first real category. A category
  already picked is kept.
- In the room, the lines «اسأل الآخرين أسئلة بنعم أو لا لتعرف من أنت» and «هويات
  الآخرين» are now Egyptian: «…إجابتها أيوه أو لأ عشان تعرف انت مين», «هويات
  الباقيين».
- The toasts are Egyptian too: «اختار قسم واحد على الأقل!» and «اكتب شخصية
  الأول!».
- The Help line «نعم أو لا» now says «أيوه أو لأ».

### كلمة واحدة
- **The page title was «إعداد 'كلمة واحدة'»** on the setup, the play screen and
  the room. It is now «كلمة واحدة» / "Just One".
- **Dark mode:** the secret word sat on a bright light-green plate (hardcoded
  `bg-green-50`). The pink and green text were hardcoded too. They now use the
  design system: `plate-success`, `tx-success` and `tx-accent`, and the view has
  `data-accent="rose"`.
- **Classical Arabic turned Egyptian:**
  - «أعط الهاتف لـ» → «إدّي الموبايل لـ»
  - «أنا هو، أرني الكلمة» → «أيوه أنا، وريني الكلمة»
  - «اكتب تلميحاً واحداً (كلمة واحدة فقط!)» → «اكتب تلميح واحد (كلمة واحدة بس!)»
  - «ما هي الكلمة السرية؟» → «إيه الكلمة السرية؟»
  - «❌ لم يعرفها» → «❌ ما عرفهاش»
  - «خاطئة» → «غلط»
  - In the room: «أنت المخمّن هذه الجولة / انتظر حتى…» → «انت المخمّن الجولة دي /
    استنى لحد ما الكل يكتب تلميحه»
  - «لم يتبق أي تلميح!» → «مفيش ولا تلميح فاضل!»
  - the lobby hint
  - the toasts
- I changed the markup fallbacks in Controller.html to match.

### أسماء الرموز
Egyptian wording for these:
- «أعط التلميح» → «قول التلميح»
- «دور الفريق الآخر» → «دور الفريق التاني»
- «فريقك يخمّن الآن…» → «فريقك بيخمّن دلوقتي…»
- «التلميح لا يمكن أن يكون…» → «التلميح ما ينفعش يكون…»
- «لا أحد بعد» → «لسه مفيش حد»
- the lobby hint
- «كلماتكم الخاصة» → «كلماتكم انتوا»
- the server's own errors for this game (RoomGames.js): «ليس دور فريقك» → «مش دور
  فريقك», «التلميح معطى بالفعل» → «التلميح اتقال خلاص», «القائد فقط يعطي التلميح»
  → «القائد بس اللي يقول التلميح»
- the Help: «فريقان» → «فريقين», «القائد وحده» → «القائد بس اللي»

I played a whole game to the end (key, clues, marks and guesses, the win, the
clue log, a phone reloaded mid-game) on phones and on the TV at both sizes.
Nothing else needed changing.

### ارسم وخمّن
- The drawer's screen said «أنت الرسام» / «ارسم هذه الكلمة». It now says «انت
  الرسام» / «ارسم الكلمة دي».
- The Help showed the fill tool as 🪵 but the toolbar shows 🪣. It also said "the
  colours are a row that scrolls", when they are two rows with a custom colour
  last. I fixed both, and redo ↷ is mentioned now (Arabic and English).
- Lenient judging worked as documented: «فرشاة أسن» for «فرشاة أسنان» gave 🔥
  قريب, and the right word gave the win and the podium.

### ارسم واكتب
- **The reveal put the name of whoever owned the chain on the phrase the app
  dealt** («منى كتب: شواية فحم»), but nobody wrote it. The first step now says
  «بدأت بـ».
- «{name} كتب / رسم» had the wrong gender for a woman («منى كتب»). It is now
  «وصف {name}» / «رسمة {name}», which reads right for any name, the same way
  مافيا's news is worded.

**File:** JS_RoomTelephone.html.

### ربع قرد
- Three classical toasts on one phone («اختر لاعبين على الأقل», «عدد الفائزين لا
  يمكن أن يزيد عن…», «هل أنت متأكد من إنهاء اللعبة؟») are Egyptian now.
- I played letters (a closing word, a liar who was right and one who was wrong,
  give-ups to a monkey, the win sheet), the chain, and a reload mid-chain, on
  one phone and in a room with the TV. The referee works.

### المشنقة
Nothing to fix in the screens:
- Two on one phone: a two-word name with a hint, a miss, a reload mid-word, and
  the whole word.
- The room, with a writer: a hint, a guess of the whole word right and one wrong,
  and closing the word.
- The race.

The data agent made the race skip entries whose hint gives the answer away (see
below).

## Content changes

Each list keeps its size, except MonkeyWords, which only grew. Every change is
in `git diff`. Five helper reviewers did the bulk reading, and I spot-checked
their work.

- **CHARADES_DB (JS_Charades.html), 186 changes.**
  - About 40 actions were listed twice in Arabic, once formal and once Egyptian
    (يطبخ/بيطبخ, يعطس/بيعطس…). The formal copy was replaced with Egyptian
    actions, for example يسبح → بيقزقز لب, يقود سيارة → بيلعب دومينو, يغسل أسنان →
    بيدور على شبكة للموبايل.
  - Standard-Arabic twins of Egyptian job names were replaced with
    Egyptian-street jobs (شرطي → بياع عرقسوس, خباز → ماسح جزم…).
  - Gulf shows became Egyptian ones (طاش ما طاش → يوميات ونيس, درب الزلق → أبو
    العروسة).
  - Obscure animals were replaced (خلد → جرو, قضاعة → قرموط, نيص → محار…).
  - The unknown instruments ترومبيت and ساكسفون were replaced.
  - Two fixes where a missing shadda changes the meaning: بيأكل القطة → بيحط أكل
    للقطة, بيحمي طفل → بيحمّي البيبي.
  - English: R-rated films out (Pulp Fiction, Fight Club, Goodfellas, Psycho,
    The Shining, Deadpool → family films), and repeats replaced.
- **DESCRIBE_DB (JS_DescribeIt.html), 48 changes.**
  - 26 Arabic cards repeated another card (مظلة/شمسية, النيل/نهر النيل, فرعون…)
    and were replaced with new cards and obvious forbidden words (e.g. مأذون :
    كتب الكتاب، جواز، دفتر; بمب : العيد، صوت، فرقعة).
  - Five forbidden-word fixes. For example, فهد : أسد → نمر, and طاولة زهر no
    longer forbids دومينو.
  - English: 17 repeated cards replaced.
- **TIMESUP_DB (JS_TimesUp.html).**
  - Near-repeats became Egyptian items (فانوس رمضان, عروسة المولد, مدفع الإفطار,
    مسحراتي…).
  - Unknown people were replaced (ابن رشد → أحمد شوقي, ميريل ستريب → هند رستم, آل
    باتشينو → فاتن حمامة).
  - Deadpool and Pulp Fiction out.
  - The classical proverbs the owner removed from كمّل المثل were replaced (الوقت
    كالسيف → اللي ميعرفش يقول عدس…).
  - Obscure animals and the unknown instruments were replaced, and twins (تلاجة
    and ثلاجة) became one.
- **WHOAMI_DB (JS_WhoAmI.html).**
  - The room dealt «فظ» and «يراعة»; those and other obscure animals were
    replaced (رنة, وعل, خلد, قضاعة, نيص…).
  - 31 standard-Arabic twins in جماد were replaced with Egyptian objects.
  - مشاهير:
    - Controversial or adult names out: كاني ويست, كيم كارداشيان, كريس براون and
      مرتضى منصور → سمير غانم, محمد حماقي, يسرا, أبو تريكة.
    - Names unknown to an Egyptian family became Egyptian stars: جاي زي → أحمد
      زكي, بريتني سبيرز → ليلى علوي…
  - شخصيات خيالية: Rick and Morty, Futurama, Deadpool and Steven Universe out;
    بكار, بوجي وطمطم, سالي, عدنان ولينا, جريندايزر and others in.
  - **The «League of Legends 🎮» category is now «ألعاب فيديو 🎮» / "Video Games
    🎮".** It holds characters and games families know: Mario, Pokémon,
    Minecraft, Angry Birds, Talking Tom, PUBG, FIFA… The 🎮 stays, so the two
    languages still match.
  - English: politicians, adult celebrities and obscure jobs out.
- **JO_WORDS_AR / JO_WORDS_EN (JS_NewGames.html, كلمة واحدة's words).**
  - 216 Arabic and 128 English replacements.
  - Removed: MSA/Egyptian twins (حليب/لبن…), singular/plural pairs, longer forms
    of words already in the list, words with two meanings (رجل, قطر…), obscure
    words (the dealt «خضري», خلد, أيل…), and «كاكا».
  - Added: common family nouns such as فطار, عريس, سبوع, فانوس, امتحان, فسحة,
    أبو الهول, طبلية, كمسري, استغماية.
  - Also مجفف شعر → سشوار and صانع حلويات → حلواني.
- **CODENAMES_WORDS (CodenamesWords.js).**
  - Arabic, 146 changes: repeated spellings (تلاجة/ثلاجة, كورة/كرة, عربية/سيارة…)
    and unknown words (خلد, ترومبيت, فظ…) became Egyptian everyday nouns
    (عرسة, كاوتش, كلاكس, طشت, وابور, طبلية, كورنيش, مكوجي, كمسري…).
  - I swapped the helper's «جحش» for «قبة»: جحش is a common insult.
  - English, 66 changes: plural and UK/US twins, and obscure words.
- **DRAW_WORDS (PartyContent.js).**
  - Arabic, 19 changes: Egyptian names (مطرقة → شاكوش, طبيب → دكتور, شرطي →
    عسكري, مرآة → مراية…) and near-duplicates.
  - English, 213 changes: twins, look-alike animals, body parts, drinks that are
    all "a cup", herbs and dishes that can't be drawn, replaced with drawable
    things.
- **MonkeyWords.js.**
  - Fixes: لوتسمبورغ → لوكسمبورغ, «الكوريا الجنوبية» removed, Hong Kong removed
    from the English countries.
  - Additions for the referee: the ج spellings Egyptian papers use (بنجلاديش,
    الكونجو…), more Egyptian and Arab cities, and English animals and foods.
- **Hangman.js.** New `hmHintGives`: the race no longer deals «جبنة كريمي» under
  «أنواع جبنة», or "Cream Cheese" under "Cheeses". It drops 20 Arabic and 26
  English entries. There is a check in rules.mjs.

## Questions for the owner

1. **Israel is still in ربع قرد's lists** (إسرائيل / Israel, and تل أبيب / Tel
   Aviv). خمّن الدولة leaves it out and keeps Palestine. Should ربع قرد do the
   same?
2. **من أنا؟ now starts on a real category, not «إدخال يدوي».** Did you want typing
   by hand to be the default?
3. **ثلاث جولات loses the whole game on a reload.** That's three rounds and about
   20 minutes. The deck and the scores could be kept and a reload could come
   back to the "ready" card. That's a bigger change than tonight's polish, so I
   left it. Worth doing?
4. **The room's host-only error is still classical everywhere** («المضيف فقط
   يمكنه فعل ذلك», RoomGames.js `requireHost`). I left it because every
   reviewer's games share that line. «المضيف بس اللي يقدر يعمل كده» would fit the
   app.

## Seen, not fixed

- **The players strip under every room game has small taps.** For the host each
  name is a button about 28×21 px. It's shared room UI, not only mine.
- **ربع قرد's Arabic keypad keys are 23-25 px wide** on a 375 phone (12 keys
  across). They look like the phone's own keyboard and worked. Widening them
  would mean a different layout.
- **Content items the helpers flagged but didn't change** (they belong to other
  lists or other reviewers):
  - ChameleonWords, which feeds المشنقة's race: obscure breads, cheeses and
    sports (شاباتا, ريكوتا, كابويرا…), and a «نضارة» spelling.
  - EmojiRiddles films in المشنقة's race: «قطار إلى بوسان» (zombie horror) and
    «الجوكر» (R-rated).
  - SpyWords حيوانات: «بورس» is probably a typo for برص.
  - TimesUp / WhoAmI: I couldn't confirm «مارد وشوشني», «شلبي سلفان/سلوفان» or
    «شمشون». أوصف لي's play titles «عفروتو» and «مسرحية لعبة الست» are unconfirmed
    too. «بسيط» under شخصيات كرتون is unclear.
- **Data comment headings are loose.** Some of the helpers' replacements took the
  slot of the word they replaced, so a few items now sit under another
  category's comment in the files (JO words, codenames). It's harmless: the
  lists are flat.

## Couldn't check

- Real phones: iPhone sound and haptics, and the real keyboard over the Arabic
  typing fields.
- The telephone reveal past its first step: my script used a wrong action name.
  The code path for later steps is the same labels I fixed.
- **A flaky estimation check** in test:rules: "a hard computer player makes its
  call more often than an easy one" failed once (47% vs 47%) and passed on the
  rerun. It's not my area.
