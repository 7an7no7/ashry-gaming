# Ashry Gaming — roadmap runbook

The owner agreed this plan on 20 Sep 2026. It carries two kinds of work: **Phase 0**, correcting content that is wrong on the live site today, and **Phases 1-9**, the agreed feature roadmap.

---

## The executor's contract

- Branch `feature/roadmap`. One commit per task, message starting with the task id (`T0A.1: …`).
- Never deploy, never build, never push. `docs/`, `.preview/`, `rooms-worker/generated/`, `Tailwind.html` and `Logo.html` are generated output — never edit them by hand.
- Anchor on the quoted string, never a line number. **If a "Before" string is not in the file, skip the task and say so in the report.** Do not improvise a replacement.
- Never add a Tailwind utility class that is not already used in the markup (Tailwind is pre-compiled; a new class silently does nothing). Add CSS to `Style.html` instead.
- Every player-visible string goes through `TRANSLATIONS` in `JS_Core.html`, in **both** the `ar` and the `en` block, under the same key.
- Run `cd tools && npm run check` before committing any content or translation task. It must print "no problems found" and "i18n OK".
- Run `cd rooms-worker && npm run test:rules` before committing any task that touched `RoomGames.js` or a bundled word list.

## Invariants — do not change these

1. **One global scope.** Every `JS_*.html` and root `*.js` is concatenated into one page. Grep the repo before defining any new top-level name.
2. **`RoomGames.js` and the word lists run on the server too.** No `document`, `window` or `localStorage` in them.
3. **Hidden information lives on the server.** Anything a player must not see goes in `room.secrets[playerId]`; `project()` sends each phone only its own slice. Never move that to the client.
4. **Dealing.** One phone deals through `freshPick`; rooms deal through `nextPrompt` / `nextPrompts`. Never `Math.random()` for content.
5. **Design tokens only.** No hardcoded colours, no `left`/`right` (use logical properties), no `letter-spacing` on Arabic, no `position: fixed` inside a view, no viewport-height sizing (the shell is `--app-h`).
6. **Motion rules.** `transform` and `opacity` only; check `motionOff()` before animating and set the end state directly when it is true; key a reveal with `motionFirst(key)` so a redraw doesn't replay it; every end state also set by a timer, never only by an animation event. New CSS goes in section 14 of `Style.html`.
7. **The trivia board bank needs at least five questions per category per level.** `npm run check` enforces this. If a task deletes or re-levels a card, the level must still have five.
8. **Content rules.** Arabic content is for an Egyptian family table: Egyptian colloquial, no classical-Arabic schoolbook phrases, only facts that never change (no "how many times has X won" for anything still being played, no current title holders, no ages). A category names a kind of thing, never a riddle about a property.

## Decisions already made

- **20 Sep 2026 — المختلف (Undercover): nobody is told their role.** Every player sees only a word. The odd one out has to realise it from the clues. There is no "you are the undercover" card.
- **20 Sep 2026 — in المختلف, being named ends the round.** No guess from six. The runbook originally reused الجاسوس's guess step, which was a mistake: the odd one out holds a near relative of the table's word, so picking it out of six unrelated words is free, and catching them would be worth nothing. الجاسوس keeps its guess exactly as it is. (`resolveImposterVote` in `RoomGames.js`; pinned by two cases in `rooms-worker/test/rules.mjs`.)
- **20 Sep 2026 — the leaderboard of the night awards only games that keep a score.** 3/2/1 to the top three. A game with no scores at all (ارسم واكتب) adds nothing to the night's table.
- **20 Sep 2026 — قبل ولا بعد (Timeline) is Egyptian and Arab first**, with famous world dates mixed in so the cards spread across the centuries.
- **20 Sep 2026 — out of scope, do not do:** adding `autocorrect` / `autocapitalize` / `spellcheck` attributes to any input (the owner said no); the Tarneeb 41 edge-case rules (they need the owner's decision); a "دندنها" humming category.
- **20 Sep 2026 — the English banks keep their international content.** Phase 0 corrects the Arabic banks only. Golf, rugby and baseball staying in the English lists is deliberate: the English side is for a table playing in English, not an Egyptian table. The one exception is T0B.4, where an English group is factually wrong.

## Already built — do not undo

- `guessVerdict` in `RoomGames.js` judges typed guesses leniently (طماطم counts for طماطماية, one letter off in a long word counts, a near miss is flagged `close`). Do not tighten any guess comparison back to `normaliseClue` equality.
- `scrollToAction(el)` in `JS_Core.html` and `roomScrollToAction` in `JS_Room.html` scroll each new step to the top. Do not remove these calls.
- The browser gate in `Controller.html` (the ES5 script after the intro, `window.ASHRY_UNSUPPORTED`). Keep it ES5 and free of CSS variables.
- `Proverbs.js` is Egyptian colloquial only, and `DRAW_WORDS.ar` is a curated 690-word drawable list. Do not add classical sayings or undrawable words back.
- The سكرو cards carry no "must be thrown" rule: `plus20` and `red25` have no `drawn` field. Do not add one.

## Phase index

| Phase | Title | Risk |
|---|---|---|
| 0A | The trivia board bank: wrong, stale and leaking cards | content only, but live-wrong today |
| 0B | The other banks: charades, describe it, connections, party content | content only |
| 1 | Two real-table problems + the keyboard viewport | logic, medium |
| 2 | The home and the solo hub: filter, اختارلنا, archive, stats | client only |
| 3 | المختلف (Undercover) in الجاسوس | rooms + one phone + content |
| 4 | The leaderboard of the night | rooms |
| 5 | The motion batch | client only |
| 6 | Shareable result cards | client only |
| 7 | العقل (The Mind) — a new room game | rooms |
| 8 | قبل ولا بعد (Timeline) — a new room game + its bank | rooms + content |
| 9 | The Mafia narrator | client only |

Phases 3-9 are detailed later in this document. **Do not start a phase you have not been given.**

---

# Phase 0A — The trivia board bank

Every task in this phase edits `JS_TriviaBoardBank.html` unless it says otherwise. The bank's own header states the rule these cards break: no "how many times has X won" for anything still being played.

Each card is `["سؤال بالعربي", "الإجابة", "English question", "English answer"]`.

**Rule for the whole phase:** after every deletion or re-levelling, run `cd tools && npm run check`. If it complains that a category/level has fewer than five questions, add a replacement card at that level from the verified list in T0A.8 — never invent a fact.

### T0A.1 — The squash card that pays out a wrong answer
**Finding:** review A1. Nour El Sherbini has **eight** world titles, not seven, and the count is still growing — the exact shape the bank bans.
**Files:** `JS_TriviaBoardBank.html`
**Before** (the card containing):
```
"كم مرة فازت البطلة المصرية نور الشربيني ببطولة العالم للإسكواش للسيدات؟", "7 مرات"
```
**After** — replace the whole four-item card with a fact that cannot change:
```js
["مين أول مصري يفوز ببطولة العالم للإسكواش؟", "عمرو شبانة", "Who was the first Egyptian to win the World Squash Championship?", "Amr Shabana"],
```
> ⛔ Do not "fix" the number to 8. She is still competing; the card would be wrong again next season.
**Accept when:**
- [ ] `git grep "7 مرات"` returns nothing in `JS_TriviaBoardBank.html`
- [ ] the new card sits at the same level (same array) as the one it replaced
- [ ] `npm run check` passes

### T0A.2 — The retired world number one
**Finding:** review A2. Ali Farag retired in May 2025, so "المصنف أول عالمياً" is false; it is also ungrammatical (an ordinal needs the article).
**Files:** `JS_TriviaBoardBank.html`
**Before:**
```
"من هو بطل الإسكواش المصري المصنف أول عالمياً وتخرج من جامعة هارفارد؟", "علي فرج"
```
**After:**
```js
["مين بطل الإسكواش المصري اللي فاز ببطولة العالم 4 مرات وخريج جامعة هارفارد؟", "علي فرج", "Which Egyptian squash champion won four World Championships and graduated from Harvard?", "Ali Farag"],
```
**Accept when:**
- [ ] no card in the file says `المصنف أول عالمياً`
- [ ] the card now opens with `مين` like the other 83 person-questions in the bank

### T0A.3 — Speedball is played on a pole, not a reel
**Finding:** review A3. The Arabic says `بكرة` (a reel); the English half of the same card says "pole", which is correct. The same wrong word was copied into the Describe It card.
**Files:** `JS_TriviaBoardBank.html`, `JS_DescribeIt.html`
**Before (1):** `وكورة مربوطة بخيط في بكرة؟`
**After (1):** `وكورة مربوطة بخيط في عمود؟`
**Before (2)** in `JS_DescribeIt.html`:
```js
{ word: "كرة سرعة", forbidden: ["مضرب", "خيط", "بكرة"] },
```
**After (2):**
```js
{ word: "كرة سرعة", forbidden: ["مضرب", "خيط", "عمود"] },
```
> ⚠️ The second edit matters for play, not just accuracy: forbidding the wrong word leaves the describer free to say the real give-away.
**Accept when:**
- [ ] neither file contains `بكرة` in a speedball context
- [ ] `npm run check` passes (Describe It cards must still have exactly three forbidden words)

### T0A.4 — The English handball question names its own answer
**Finding:** review A4. The English asks "In which 2001 tournament…" and the answer is "World Championship in France". The Arabic half is fine.
**Files:** `JS_TriviaBoardBank.html`
**Before:** the English half of the card whose Arabic is `"في أي بطولة شارك منتخب مصر لكرة اليد كأول فريق غير أوروبي يصل لنصف النهائي سنة 2001؟"`
**After:** change **only the English question and answer** of that card to:
```js
"Which country hosted the 2001 championship where Egypt became the first non-European team to reach the semi-finals?", "France"
```
Leave the Arabic question and its answer `"كأس العالم بفرنسا"` untouched.
**Accept when:**
- [ ] the English question no longer contains the words of its own answer
- [ ] the Arabic half is byte-identical to before

### T0A.5 — The dessert card that cannot be got wrong
**Finding:** review A5. `"تُصنع من الأرز واللبن والسكر"` → answer `"الأرز باللبن"`. The validator missed it because it compares literally and `باللبن` ≠ `واللبن`. It sits at 500, the hardest level.
**Files:** `JS_TriviaBoardBank.html`
**Action:** delete the whole card. Then follow the phase rule: if the food category's 500 level now has fewer than five, add one from T0A.8.
**Accept when:**
- [ ] `git grep "الأرز واللبن"` returns nothing
- [ ] `npm run check` passes

### T0A.6 — Two cards that will go stale
**Finding:** review B1, B2.
**Files:** `JS_TriviaBoardBank.html`
**Action (a):** the card `"أي نادٍ مصري فاز ببرونزية كأس العالم للأندية 4 مرات؟"` counts wins in a competition Al Ahly still enters. Replace with a dated fact, keeping the same level:
```js
["في أي سنة فاز الأهلي ببرونزية كأس العالم للأندية لأول مرة؟", "2006", "In which year did Al Ahly first win the FIFA Club World Cup bronze medal?", "2006"],
```
**Action (b):** delete the card `"أي دولة عربية تسيطر تاريخياً على ألقاب بطولة العالم للإسكواش للرجال والسيدات؟"` — `تسيطر تاريخياً` is an undated claim rather than a fact, and in an Egyptian app the answer `مصر` is the only plausible one. It is also the third card in the bank whose answer is `مصر`.
**Accept when:**
- [ ] neither `ببرونزية كأس العالم للأندية 4 مرات` nor `تسيطر تاريخياً` appears in the file
- [ ] `npm run check` passes

### T0A.7 — The same fact asked twice at the same level
**Finding:** review C1. `"مين مدرب منتخب مصر اللي فاز بكأس أمم أفريقيا 3 مرات متتالية (2006-2008-2010)؟"` (حسن شحاتة) and `"مين حارس مرمى منتخب مصر في 3 بطولات أمم أفريقيا متتالية من 2006 لـ2010؟"` (عصام الحضري) are the same fact, in the same words, in the same level block. The board deals one card per cell, so a table meets both.
**Files:** `JS_TriviaBoardBank.html`
**Action:** delete the حسن شحاتة card, keep عصام الحضري.
**Accept when:**
- [ ] only one card mentions `3 بطولات أمم أفريقيا متتالية` or `3 مرات متتالية`
- [ ] `npm run check` passes

### T0A.8 — The food ladder: four cards sit at the wrong value
**Finding:** review D1. أم علي, الكوارع, الفطير المشلتت and الحواوشي are dishes every Egyptian child names instantly, but they were placed at 400 and 500 — the same tier as questions the bank reserves for real difficulty. The existing 200-level food cards are الكشري, الملوخية and الفتة, which is exactly the knowledge these four need.
**Files:** `JS_TriviaBoardBank.html`
**Action:** move these cards into the levels shown, keeping each card's four items unchanged:

| card (find by its answer) | from | to |
|---|---|---|
| `"أم علي"` | 500 | 200 |
| `"الكوارع"` | 500 | 300 |
| `"الفطير المشلتت"` | 400 | 200 |
| `"الحواوشي"` | 400 | 200 |

Then bring every food level back to at least five cards using **only** these verified replacements, in this order, skipping any whose answer already appears anywhere in `JS_TriviaBoardBank.html` or `TriviaQuestions.js` (grep the answer first):

```js
// 500
["أي جبنة مصرية بتتعتق في براميل خشب وريحتها نفّاذة؟", "المش", "Which Egyptian cheese is aged in wooden barrels and has a pungent smell?", "Mish"],
["إيه اسم الطبق النوبي المعمول من البامية المجففة المطحونة؟", "الويكة", "What is the Nubian dish made from dried, ground okra called?", "Weika"],
["أي أكلة مصرية من الفول المدشوش بتتاكل في الصعيد؟", "البصارة", "Which Egyptian dish of mashed fava beans and greens is eaten in Upper Egypt?", "Bessara"],
// 400
["أي سمك مملح بياكلوه المصريين في شم النسيم؟", "الفسيخ", "Which salted fish do Egyptians eat at Sham El-Nessim?", "Fesikh"],
["إيه اسم خليط التوابل المصري اللي بيتغمس فيه العيش بزيت الزيتون؟", "الدقة", "What is the Egyptian spice mix that bread is dipped into with olive oil called?", "Dukkah"],
```
> ⚠️ Every level of every category must end with five or more. `npm run check` fails otherwise — that is the proof for this task.
**Accept when:**
- [ ] each of the four cards is in its new level's array and appears exactly once in the file
- [ ] `npm run check` passes, so no level dropped below five
- [ ] no replacement card's answer appears twice across the two trivia banks

### T0A.9 — Three cards break the bank's Arabic voice
**Finding:** review E1, E2. 83 person-questions open with `مين`. The only `من هو` cards and the only `ما هو` card outside science are these three, all added in the same commit. The `ما هو` one is also the longest card in its category and will wrap badly on a phone.
**Files:** `JS_TriviaBoardBank.html`
**Action:**
- `"من هو أسطورة الإسكواش المصري…"` → open with `مين` instead of `من هو`. (The other `من هو` card is rewritten by T0A.2.)
- Replace the whole Arabic question `"ما هو المركز التاريخي الذي حققه منتخب مصر لكرة اليد في أولمبياد طوكيو 2020 كأول منتخب عربي وأفريقي؟"` with `"منتخب مصر لكرة اليد خلّص في أي مركز في أولمبياد طوكيو 2020؟"`. Leave its answer and both English halves alone.
- In the Youssef Chahine card, `"صاحب فيلم «المصير» و«إسكندرية ليه»"` → `"صاحب فيلمَي «المصير» و«إسكندرية ليه»"` (dual).
- Replace the Nelly card's Arabic question `"مين نجمة الفوازير الرمضانية الشهيرة بصاحبة «الخاطبة» و«عالم ورق» و«صندوق الدنيا»؟"` with `"مين نجمة الفوازير الرمضانية اللي قدمت «الخاطبة» و«عالم ورق» و«صندوق الدنيا»؟"` — `الشهيرة بـ` + `صاحبة` is a doubled construction.
**Accept when:**
- [ ] `git grep "من هو" JS_TriviaBoardBank.html` returns nothing
- [ ] no card's Arabic question is longer than 90 characters
- [ ] `npm run check` passes

---

# Phase 0B — The other banks

### T0B.1 — Three swimming strokes nobody can mime
**Finding:** review G1. The charades sports category now holds `سباحة`, `سباحة فراشة`, `سباحة حرة` and `سباحة صدر`. Charades is acting without words: a player cannot mime "freestyle" so that a family shouts *breaststroke* rather than *swimming*. Three of the four are unwinnable cards. Same problem, milder, for `وثب ثلاثي` next to the existing `قفز طويل`, `قفز عالي`, `الوثب العالي` and `قفز بالزانة`.
**Files:** `JS_Charades.html` (the Arabic sports lists only)
**Action:** delete `"سباحة فراشة"`, `"سباحة حرة"`, `"سباحة صدر"` and `"وثب ثلاثي"`. Keep `"سباحة"`, `"غطس"` and `"رمي القرص"` (that one mimes distinctly from رمي الرمح and رمي الجلة). Replace the four deleted with four that a family can act out and that are not already in the list — grep each before adding:
```
"كرة الطائرة الشاطئية", "سباق الجمال", "تزحلق على الرمل", "رفع الأثقال الأولمبي"
```
If any of those is already present, use `"سباق الزوارق"`, `"قفز بالمظلات"` or `"تنس طاولة"` instead.
**Accept when:**
- [ ] exactly one `سباحة` entry remains in the Arabic sports lists
- [ ] no word appears twice in `JS_Charades.html` (`npm run check` proves it)

### T0B.2 — Charades' proverbs are schoolbook Arabic
**Finding:** the owner's decision of 17 Sep 2026 purged classical sayings from `Proverbs.js`, but `CHARADES_DB.ar["أمثال 📜"]` still holds the same ones. On top of that, a charade has to be *actable*: "النظافة من الإيمان" cannot be mimed at all.
**Files:** `JS_Charades.html`, the `"أمثال 📜"` category
**Action:** delete every entry that is classical Arabic rather than Egyptian colloquial, **and** every entry with no physical action in it. At minimum these must go:
```
"الوقت كالسيف", "من حفر حفرة لأخيه", "العلم نور والجهل ظلام", "النظافة من الإيمان",
"لا تؤجل عمل اليوم للغد", "في التأني السلامة", "فاقد الشيء لا يعطيه", "اتق شر الحليم إذا غضب",
"الصديق وقت الضيق", "لسانك حصانك", "من شب على شيء شاب عليه", "الكترة تغلب الشجاعة",
"اللي يزرع يحصد", "ألف قلبة ولا غلبة", "الحركة بركة"
```
Keep the ones a table can act: القرد في عين أمه غزال, باب النجار مخلع, دخول الحمام مش زي خروجه, اللي على راسه بطحة, عصفور في اليد, زي الأطرش في الزفة, اضرب الحديد وهو سخن, الجمل ما يشوفش عوجة رقبته, and their like.
> ⛔ Do not add new proverbs. This task only removes.
**Accept when:**
- [ ] none of the listed strings appears in `JS_Charades.html`
- [ ] the category still holds at least 40 entries
- [ ] `npm run check` passes

### T0B.3 — The same Connections group four times over
**Finding:** review C5. `{كرة قدم، كرة سلة، كرة يد، كرة طائرة}` (and its `كورة` spelling) is now the solution group in four different puzzles, including hard ones — where a free group defeats the level's whole purpose.
**Files:** `JS_Connections.html` (Arabic lists)
**Action:** find every group whose four words are the plain ball sports. Keep **one** (in `CONNECTIONS_EASY`). In the others, swap words so each group is distinct, for example `{كرة ماء، كرة يد، كرة طائرة، كرة سلة}` in one and `{كرة سرعة، كرة يد، كرة طائرة، كرة سلة}` in another.
> ⚠️ A word may not repeat across the groups of a single puzzle — `npm run check` fails on that. Check each puzzle after editing it.
**Accept when:**
- [ ] no two puzzles in the Arabic lists share all four words of a group
- [ ] `npm run check` passes

### T0B.4 — Golf is not a ball sport next to basketball
**Finding:** review H2. The Arabic twin of this group had `جولف` removed; the English one still reads `{ name: 'Ball Sports', words: ['Basketball', 'Volleyball', 'Handball', 'Golf'] }`.
**Files:** `JS_Connections.html`
**Before:** `{ name: 'Ball Sports', words: ['Basketball', 'Volleyball', 'Handball', 'Golf'] }`
**After:** `{ name: 'Ball Sports', words: ['Basketball', 'Volleyball', 'Handball', 'Football'] }`
> ⚠️ Check that `Football` is not already in another group of the same puzzle. If it is, use `Water Polo`.
**Accept when:**
- [ ] the group has no golf in it
- [ ] `npm run check` passes

### T0B.5 — Two party cards
**Finding:** review E3, G3.
**Files:** `PartyContent.js`
**Before (a):** `'مين أكثر واحد بيجامل ويبارك ويعزّي في كل مناسبة؟',`
**After (a):** `'مين أكثر واحد ممكن يبارك ويهنّي في كل مناسبة؟',`
— every neighbour in that list uses the `مين أكثر واحد ممكن …` shape, and condolences don't belong in a section of birthday cakes and gifts.
**Before (b):** `['تكسب بطولة العالم في الإسكواش', 'تكسب ميدالية ذهبية في الأولمبياد'],`
**After (b):** `['تكسب بطولة العالم في الإسكواش', 'تلعب في نهائي كأس أمم أفريقيا'],`
— an Olympic gold beats a squash world title for almost everyone, so the original is not a dilemma.
**Accept when:**
- [ ] `git grep "يعزّي"` returns nothing in `PartyContent.js`
- [ ] `npm run check` passes

---

# Phase 1 — Two real-table problems, and the keyboard

### T1.1 — When a TV is in the room, the TV is the only voice
**Finding:** verified in the code on 20 Sep 2026. Every phone plays the same ticks, fanfares and alarms as the TV. `JS_RoomStop.html` ticks on **every** phone for the last five seconds and cheers on every phone when the letter lands. Six phones and a TV playing the same cue, each 50-200ms apart over the network, is an echo, and tables end up muting their phones.
**Files:** `JS_Room.html` → a new helper; `JS_RoomStop.html`, `JS_RoomMafia.html`, `JS_RoomCodenames.html`, `JS_RoomFiveSeconds.html`, `JS_RoomMonkey.html`, `JS_RoomScrew.html` → the ambient call sites; `JS_Sounds.html` → the confetti fanfare.
**Built before:** القنبلة already does exactly this by hand — `JS_RoomBomb.html` ticks only `if (st.youAreScreen || mine)`, and سكرو's clock does the same. Those two are the precedent; do not change them.
**After** — add to `JS_Room.html`, next to the other room helpers:
```js
/**
 * A room with a big screen has one voice: the TV's. A cue every phone would
 * play at the same moment (a tick, a fanfare, the letter landing) is the TV's
 * job — eight phones playing it 200ms apart is an echo, and the table mutes
 * them. Anything personal (your turn, your answer, your buzz) still sounds on
 * the phone that it belongs to.
 */
function roomHasScreen() {
  const s = Room.state;
  return !!(s && !s.youAreScreen && (s.screens || []).some(x => x.online));
}

function playRoomFx(name) {
  if (roomHasScreen()) return;
  playSound(name);
}
```
Then change **only these** calls from `playSound(` to `playRoomFx(`, keeping every existing condition around them:
- `JS_RoomStop.html`: the `spinLetter` landing callback (`playSound('success')`), the `if (stop) { playSound('alarm')` line, and the `onTick` `playSound('tick')`.
- `JS_RoomMafia.html`: `if (s.phase === 'night') playSound('tick');` and the day-news `playSound(...)` on the next line.
- `JS_RoomCodenames.html`: the three reveal sounds (`playSound(good ? 'success' : 'alarm')`, the assassin `playSound('alarm')`, and the `else playSound('success')`).
- `JS_RoomFiveSeconds.html`: the two inside `onTick` / `onEnd` that are already gated by `loud`.
- `JS_RoomMonkey.html`: the two bare `playSound('tick')` / `playSound('alarm')` calls. **Leave** the one already gated by `turnId === Room.me`.
- `JS_RoomScrew.html`: `skrSound`'s fallback `playSound('alarm')`, and the `playSound('alarm')` / `playSound('success')` pair that follows a move. **Leave** line `if (left > 0 && left <= 5 && … (st.youAreScreen || mine)) playSound('tick')` and the `mine && !was` turn cue — both are already personal.

In `JS_Sounds.html`, inside the `confetti` wrapper, skip only the **sound** when `typeof roomHasScreen === 'function' && roomHasScreen()`; the confetti still draws on every phone.

> ⛔ These must keep sounding on the phone, do not touch them: `JS_RoomTurn.html` ("دورك!"), `JS_RoomQuiz.html`'s `if (fresh && gotIt)`, `JS_RoomHerd.html`'s two personal cues, `JS_RoomDraw.html`'s tool clicks, `JS_RoomChat.html`, `JS_RoomTelephone.html`, `JS_RoomTrivia.html`'s tap click, and everything in `JS_RoomTv.html` — the TV is the one that must be loud.

**Accept when:**
- [ ] with no screen in the room, every sound behaves exactly as before (`roomHasScreen()` false → `playRoomFx` is `playSound`)
- [ ] with an online screen in `state.screens`, a player's phone plays no tick, no letter-landing cheer, no fanfare
- [ ] the same state still plays "دورك!" on the phone it belongs to
- [ ] `roomHasScreen` returns false on the screen itself (`youAreScreen`), so the TV is never silenced
- [ ] `roomHasScreen` and `playRoomFx` are each defined exactly once in the repo
- [ ] a mock test covers: no screens → sound; one online screen → silent; one offline screen → sound; this device is the screen → sound

### T1.2 — Fixing round 3 must not destroy rounds 4 to 8
**Finding:** verified. `undoCardScoreRound(id)` is the only way back, and it removes the **last** round. In Estimation (13 rounds) or Trix (20 deals), noticing a typo from five rounds ago means destroying everything since.
**Files:** `JS_CardScore.html` → `csHistoryHtml`, `saveCardScoreRound`, `csDraftOf`, plus the round card's action bar; `JS_Core.html` → two new translation keys.
**Built before:** every round already stores what was typed into it — `s.rounds.push(Object.assign({}, result, { input, draft: csDraftOf(), … }))` — and totals are recomputed from `s.rounds`, so a corrected round re-scores the game with no extra work. The take-back already relies on this.
**After:**
1. In `csHistoryHtml`, make each history row a button that calls `csEditRound('<id>', n)`, keeping the row's current markup and classes inside it. Use `.cs-row` as it is; do not add a Tailwind class.
2. Add `csEditRound(id, n)`: refuse unless `s.rounds[n]` exists; copy `s.rounds[n].draft` back into `s.draft`; set `s.editing = n`; `saveToLocal()`; repaint; scroll the entry card into view with the existing `scrollToAction`.
3. In `saveCardScoreRound`, when `s.editing` is a number, **replace** `s.rounds[s.editing]` instead of pushing, then clear `s.editing`. Re-evaluate `g.ended(s, csTotals(id))` afterwards exactly as the push path does, so correcting a round can also end or un-end a game.
4. While `s.editing` is set, the round card's save button reads the new key `cs_save_edit` ("احفظ التعديل" / "Save the change") and a ghost button beside it calls `csCancelEdit(id)`, which clears `s.editing` and `s.draft` and repaints.
5. `csProject` (the live preview) must project the **edited** round in place rather than as an extra round, so the preview shows the real new totals.
**Accept when:**
- [ ] with eight rounds saved, editing round 3 and saving leaves eight rounds, with rounds 4-8 byte-identical
- [ ] the totals after the edit equal a fresh replay of the same eight rounds
- [ ] editing a round that would end the game sets `phase` to `over`; editing it back reopens the game
- [ ] cancelling an edit leaves `s.rounds` untouched and clears `s.editing`
- [ ] a reload mid-edit (`s.editing` saved in state) comes back on the same edit, or cleanly cancels it — say in the report which you chose
- [ ] both new keys exist in the `ar` and `en` blocks; `npm run check` passes
- [ ] a mock test covers: edit round 3 of 8 → rounds 4-8 unchanged and totals recomputed; cancel → nothing changed

### T1.3 — The keyboard covers the button it is there to press
**Finding:** on Android Chrome the on-screen keyboard slides over the page without resizing it, so a submit button can end up underneath it. `interactive-widget=resizes-content` tells the browser to shrink the layout instead. iOS Safari ignores it, so nothing changes there.
**Files:** `Controller.html`
**Before:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```
**After:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
```
> ⚠️ This changes layout on every typing screen. The reviewer tests it in a browser; mark the behavioural checks UNVERIFIED.
**Accept when:**
- [ ] the meta tag is exactly as above, and it is the only viewport meta in the file
- [ ] `--app-h` still comes from `syncAppHeight` — do not change that function in this task

---

# Phase 2 — The home and the solo hub

### T2.1 — Filter the home by how many people are here
**Finding:** roadmap item 3. With 45+ games across nine sections, "what fits six of us?" is answered by scrolling. Every catalog entry already carries `players: [min, max]`.
**Files:** `JS_Catalog.html` → `renderHome`, `applyHomeFilter`, and a new control; `JS_Core.html` → translation keys; `Style.html` → section 12 for any new CSS.
**Built before:** `HOME_FILTERS` and `setHomeFilter(id)` already filter by *mode* (one phone, own phones, TV, two players, solo) by toggling `hidden` on cards and sections, and the search box does the same. The player count is a **second, independent** filter: a game must pass both to show.
**After:** a compact stepper or chip row beside the filter chips, `أحنا كام؟` ("How many are we?"), values off / 2 / 3 / 4 / 5 / 6 / 7 / 8+ . Keep the chosen count in the same place `homeFilter` lives, remember it with `rememberOptions` so an evening keeps it, and extend `applyHomeFilter` so a card is hidden unless `count >= players[0] && count <= players[1]`. "8+" means 8 or more, so it matches any game whose max is 8 or above.
> ⚠️ Search must keep working on top of the count, and the count must survive a language change (the home is redrawn by `applyTranslations`).
**Accept when:**
- [ ] picking 6 hides every game whose range excludes 6, in every section, and shows the rest
- [ ] picking "off" restores every card
- [ ] the count combines with a mode chip and with the search box (all three at once)
- [ ] a section whose cards are all hidden is hidden too, as it already is for the mode chips
- [ ] the choice is still there after switching the app to English and back
- [ ] a mock test covers the predicate for [2,4] at counts 1, 2, 4, 5 and "8+" against [3,12]

### T2.2 — اختارلنا: one tap when nobody can decide
**Finding:** roadmap item 3.
**Files:** `JS_Catalog.html`, `JS_Core.html` (keys), `Style.html` (section 12)
**After:** a button on the home hero, `🎲 اختارلنا` / "Pick for us", which chooses one game at random from those **currently visible** (so it obeys the count, the mode chip and the search) and opens it through `catalogOpen(id, el)` so the icon still flies to the hero and the game is recorded as recent. Deal it with `freshPick('homePick', ids, 1)` so the same game is not picked twice in a row.
> ⛔ Not `Math.random()`. `freshPick` is what keeps it from repeating.
**Accept when:**
- [ ] with a count of 6 set, it never opens a game that does not take 6
- [ ] pressing it ten times in a row does not open the same game twice until the pool has gone round
- [ ] with a search that matches nothing, it does nothing and says so (a toast), rather than throwing
- [ ] it works on the home only, and the tools tab is unaffected

### T2.5 — مع بعض، ولا كل واحد في مكان؟
**Finding:** the owner, 20 Sep 2026. The mode badges say *how* you play (one phone / own phones / TV) but not *where you are*. "Own phones" reads as if it works from anywhere, and for half the room games it doesn't: مافيا, الجاسوس and الحرباء are mostly people talking to each other, which the app does not carry. A table that is apart needs to know that before it picks.
**Files:** `JS_Catalog.html` → `GAME_CATALOG` and `applyHomeFilter`; `JS_Core.html` → keys; `Style.html` → section 12 if any CSS is needed.
**Decision (owner, 20 Sep 2026):** two states only, and being apart never blocks a game — it filters the home, and in a room it only hints (T2.6).
**After:**
1. Add `faceToFace: true` to exactly these nine catalog entries — the games with a phase where people talk to each other with nothing on the screen (a discussion clock, asking each other questions, saying names in turn, a host reading out loud, the table judging an answer):
   `imposter`, `chameleon`, `spyfall`, `mafia`, `whoami`, `justone`, `monkey`, `buzzer`, `fiveseconds`.
   Every other room game keeps every action inside the app and plays fine from separate places: `fakeartist`, `fibbage`, `twotruths`, `codenames`, `drawguess`, `telephone`, `bomb`, `stop`, `wouldyou`, `mostlikely`, `wavelength`, `herd`, `trivia`, `emoji`, `proverbs`, `screw`. Do not mark those.
2. A two-chip control on the home beside the player count: `🛋️ مع بعض` (the default, nothing filtered) and `🌍 كل واحد في مكان`.
3. When `كل واحد في مكان` is chosen, `applyHomeFilter` hides **both** every entry with `faceToFace: true` **and** every entry whose `modes` do not include `room` — a game you play by passing one phone around cannot be played by people who are not in the same place.
4. Remember the choice with `rememberOptions`, like the player count.
> ⚠️ This is a third independent filter. A card shows only when it passes the mode chip, the player count, the together/apart chip and the search box, all four.
**Accept when:**
- [ ] with `كل واحد في مكان` chosen, مافيا, الجاسوس, من أنا؟ and كلمة واحدة are hidden, and ارسم وخمّن, فيبج, سكرو and تحدي المعلومات are shown
- [ ] with the same chip chosen, every solo game, every card scorer and بدون كلام are hidden (they are not `room` games)
- [ ] `مع بعض` shows everything again
- [ ] the nine `faceToFace` flags are exactly the nine listed, no more
- [ ] a mock test covers the predicate for a faceToFace room game, a plain room game and a device-only game, under both chips

### T2.6 — The room hub says which games want everyone in one place
**Finding:** the owner, 20 Sep 2026. The same question matters more once a room is open, because that is where a host picks a game for people who may be scattered.
**Files:** `JS_Room.html` → `renderRoomHub`; `JS_Core.html` → keys
**Built before:** `renderRoomHub` draws a tile per `ROOM_HUB_GAMES` entry and already greys a tile that has too few players (`is-disabled` plus a `game-card__need` badge). Follow that pattern exactly; do not invent a second one.
**After:** a small two-chip control at the top of the hub, host only, remembered on the host's phone with `rememberOptions` (**no server change, no new room state** — it only decides what the host's own screen says). When `كل واحد في مكان` is chosen, every tile whose catalog entry has `faceToFace: true` carries a hint badge reading `أحسن وانتوا مع بعض` / "Better in one room".
> ⛔ The tile stays tappable and the game stays playable. A room that is apart is often a room on a video call, where مافيا works fine. Never block, never disable, never hide.
**Accept when:**
- [ ] with the chip on `مع بعض` the hub looks exactly as it does today
- [ ] with `كل واحد في مكان`, the nine face-to-face tiles carry the hint and every tile is still tappable
- [ ] a player who is not the host sees no chip and no change
- [ ] nothing about this reaches the rooms server: `git diff` for this task touches no file under `rooms-worker/` and not `RoomGames.js`

### T2.3 — The archive of past dailies
**Finding:** roadmap item 4. Every daily is seeded by its date (`soloDaySeed(id, day)` already takes a day), so past puzzles can be dealt exactly as they were, with no storage.
**Files:** `JS_Daily.html`, `JS_Solo.html`, `Controller.html` (a view), `JS_Core.html` (`VIEW_META`, `validViews`, keys, `GAME_RULES`), `JS_Utils.html` (`HELP_ENTRIES`, `HELP_FOR_VIEW`)
**Decision (owner, 20 Sep 2026):** an archived puzzle **never** counts toward the streak and never overwrites the result recorded for that date.
**After:** a `📅 الأرشيف` entry on the تحدي اليوم screen opening a month grid of the last two months: each day shows how many of its challenges were finished. Tapping a day lists that day's games; tapping a game starts it seeded for that date, with a clear "أرشيف" badge on the board. On finishing, show the result sheet as usual but record nothing in `ashryDaily_v1`.
> ⛔ `soloMarkDaily` must not be called for an archive play. Route the archive through a flag that `soloResult` can read, and make sure `soloStreak()` is unchanged.
**Accept when:**
- [ ] starting yesterday's puzzle deals the same board as yesterday's seed (prove it: same `soloDaySeed(id, day)` in, same first cells out)
- [ ] finishing an archive puzzle leaves `ashryDaily_v1` byte-identical and `soloStreak()` unchanged
- [ ] today's own daily still records and still counts
- [ ] the archive board is visibly marked as archive while playing
- [ ] a reload on an archive board comes back to it, or to the archive screen — not to today's daily
- [ ] the new view has `VIEW_META`, is in `validViews`, has a `restoreView` branch, and has an entry in `HELP_FOR_VIEW`
- [ ] a mock test covers: archive finish → daily store unchanged; today's finish → store written

### T2.4 — أرقامي: what this phone has done
**Finding:** roadmap item 4. Bests and daily results are already stored (`ashrySoloBest_v1`, `ashryDaily_v1`); nothing shows them in one place.
**Files:** `JS_Daily.html` or a new `JS_Stats.html` (your choice — say which in the report), `Controller.html`, `JS_Core.html`, `JS_Utils.html`
**After:** one screen listing, per solo game, the best result this phone holds (Sudoku's best time per level, 2048's best score, Minesweeper's, Queens', Tango's, Nonogram's, the word games', Flags'), plus the daily streak, the best streak, and how many dailies are finished in total. Read-only; no new storage key. Reached from تحدي اليوم and from the الأدوات tab.
> ⚠️ A game with no record yet shows a dash, not a zero.
**Accept when:**
- [ ] a phone with an empty `ashrySoloBest_v1` shows the screen with dashes and does not throw
- [ ] a best written by playing a game appears on the screen without a reload
- [ ] the streak shown equals `soloStreak()`
- [ ] no new localStorage key is introduced
- [ ] the view is registered in `VIEW_META`, `validViews`, `HELP_FOR_VIEW`

---

# Phase 3 — المختلف (Undercover) in الجاسوس

**Decision (owner, 20 Sep 2026): nobody is told their role.** Every player sees a word and nothing else. Most players have the same word; one or more have a close relative of it (قهوة against نسكافيه). The odd one out has to work it out from how the clues sound. There is no "you are the undercover" card, and the phone must not know either — see T3.2.

### T3.1 — The pairs
**Files:** `SpyWords.js`
**After:** add one new top-level const beside `SPY_WORDS`, with this comment and exactly these pairs. The first word goes to the table, the second to the odd one out.
```js
/* ============================================================================
   المختلف — the close pairs.
   The odd one out gets the second word. A pair has to be close enough that a
   clue for one could pass for the other ("سخن", "بشربه الصبح"), and far enough
   that the table can hear the difference once people start talking. Egyptian
   first: the pairs are things a family names every day.
   ========================================================================= */
const SPY_PAIRS = [
  ['قهوة', 'نسكافيه'], ['شاي', 'ينسون'], ['كشري', 'مكرونة'], ['فول', 'طعمية'],
  ['ملوخية', 'بامية'], ['كنافة', 'بسبوسة'], ['محشي', 'ورق عنب'], ['فطير', 'بيتزا'],
  ['عصير مانجو', 'عصير جوافة'], ['آيس كريم', 'مهلبية'], ['شاورما', 'برجر'],
  ['سينما', 'مسرح'], ['تلفزيون', 'موبايل'], ['كمبيوتر', 'لابتوب'], ['تابلت', 'موبايل'],
  ['فيسبوك', 'إنستجرام'], ['واتساب', 'ماسنجر'], ['يوتيوب', 'تيك توك'],
  ['بحر', 'نهر'], ['إسكندرية', 'الغردقة'], ['القاهرة', 'الجيزة'], ['الأقصر', 'أسوان'],
  ['أتوبيس', 'ميكروباص'], ['مترو', 'قطر'], ['تاكسي', 'أوبر'], ['عجلة', 'موتوسيكل'],
  ['طيارة', 'هليكوبتر'], ['مركب', 'لانش'],
  ['دكتور', 'صيدلي'], ['مدرس', 'ناظر'], ['شرطي', 'عسكري'], ['محامي', 'قاضي'],
  ['صحفي', 'مذيع'], ['ممثل', 'مخرج'], ['مطرب', 'ملحن'], ['رسام', 'نحات'],
  ['سباك', 'كهربائي'], ['نجار', 'حداد'], ['حلاق', 'كوافير'], ['ترزي', 'مكوجي'],
  ['بواب', 'حارس أمن'], ['سواق', 'كمساري'],
  ['كورة قدم', 'كورة سلة'], ['الأهلي', 'الزمالك'], ['ملعب', 'جيم'], ['حكم', 'مدرب'],
  ['مدرسة', 'جامعة'], ['امتحان', 'واجب'], ['كتاب', 'مجلة'], ['قلم رصاص', 'قلم جاف'],
  ['تكييف', 'مروحة'], ['ثلاجة', 'فريزر'], ['غسالة', 'نشافة'], ['كنبة', 'كرسي'],
  ['سرير', 'مرتبة'], ['شباك', 'بلكونة'], ['عمارة', 'فيلا'], ['مطبخ', 'حمام'],
  ['عيد الفطر', 'عيد الأضحى'], ['فرح', 'خطوبة'], ['سبوع', 'عيد ميلاد'], ['عزومة', 'بوفيه'],
  ['شنطة', 'محفظة'], ['ساعة', 'أسورة'], ['نضارة شمس', 'نضارة طبية'], ['جزمة', 'شبشب'],
  ['تيشيرت', 'قميص'], ['بنطلون', 'شورت'],
  ['صيدلية', 'مستشفى'], ['بنك', 'مكتب بريد'], ['سوبر ماركت', 'بقالة'], ['مول', 'سوق'],
  ['كافيه', 'مطعم'], ['فرن', 'مخبز']
];
```
An English list is **not** part of this task; المختلف deals Arabic pairs whatever the interface language, the way the spy categories already do for a table playing in Arabic.
**Accept when:**
- [ ] `SPY_PAIRS` is defined exactly once in the repo (`git grep -c "const SPY_PAIRS"` = 1)
- [ ] every entry is an array of exactly two non-empty strings
- [ ] no word appears in more than one pair (a mock test proves both)
- [ ] `npm run check` passes

### T3.2 — Rooms: a word for everyone, and the phone never knows who is different
**Files:** `RoomGames.js` → the `imposter` branch's `start`; `JS_RoomImposter.html` → the reveal card and the lobby option; `JS_Core.html` → keys
**Problem:** today the spy's slice is `{ role: 'spy', word: null, category }`, and the phone reads `role` to draw the spy card. In المختلف nobody may learn their own role — not from the screen and not from the network. The slice itself must not say it.
**Before** (in the `start` branch of the imposter game):
```js
    room.secrets = {};
    room.players.forEach(p => {
      const isSpy = spies.indexOf(p.id) !== -1;
      room.secrets[p.id] = {
        role: isSpy ? 'spy' : 'player',
        word: isSpy ? null : secret,
        category: category
      };
    });
```
**After:** when the host started with `undercover: true`, deal a pair instead of one word and give **every** slice `role: 'player'` and a word; the server keeps the truth in `room._impSpies`, as it already does.
```js
    room.secrets = {};
    room.players.forEach(p => {
      const isSpy = spies.indexOf(p.id) !== -1;
      // المختلف: every slice looks the same — a role and a word — so nobody can
      // learn they are the odd one out, not from the screen and not by reading
      // the traffic. room._impSpies is the only record of who is who.
      room.secrets[p.id] = undercover
        ? { role: 'player', word: isSpy ? pairOther : secret, category: category }
        : { role: isSpy ? 'spy' : 'player', word: isSpy ? null : secret, category: category };
    });
```
Deal the pair through the shared memory, keying on strings so `PromptMemory` still works. These four lines **replace the existing `const secret = …` line** and sit above `const spyCount = …`, so every name is defined before the `room.secrets` loop uses it:
```js
    const undercover = !!payload.undercover;
    // PromptMemory keys on the dealt value, so deal the pair as one string.
    const pair = undercover ? nextPrompt(room, SPY_PAIRS.map(p => p[0] + '|' + p[1]), 'imppair').split('|') : null;
    const secret = undercover ? pair[0] : nextPrompt(room, words, 'imp_' + category);
    const pairOther = undercover ? pair[1] : null;
```
Put `undercover: !!payload.undercover` on `room.shared` so every phone and the TV can word their screens for it, and publish `shared.pairOther` **only** with the result, next to `shared.secretWord`.
> ⛔ Do not put `pairOther` in `shared` at deal time. It is the other half of the secret; published early it is on every screen while the round is still being played.
> ⚠️ With `undercover` on, a category is not chosen and `spyWords(category)` is not called. Keep the guard that refuses an empty word list for the ordinary mode only.
**Accept when:**
- [ ] with `undercover: true`, every `room.secrets[*]` has `role: 'player'` and a non-empty `word`, and no slice differs in shape from any other
- [ ] the odd one out's word is the pair's second word; everyone else has the first
- [ ] `room._impSpies` still names the right players, and the vote, the accusation and the scoring behave exactly as before
- [ ] `shared` contains no `pairOther` until the round is over
- [ ] with `undercover` absent or false, the deal is byte-for-byte the behaviour it has today
- [ ] `npm run test:rules` passes, and a mock test covers both modes' slices

### T3.3 — Rooms: the screens
**Files:** `JS_RoomImposter.html`, `JS_Core.html` (keys), `JS_RoomTv.html` if the TV names the role
**After:**
- A lobby switch beside the spy count: `🎭 المختلف` with the hint "كل واحد بياخد كلمة، والمختلف كلمته قريبة" / "Everyone gets a word; the odd one out's word is a near miss". Remembered on the host's phone like the other lobby choices.
- The reveal card in المختلف shows the word alone, in the same colour and the same size for every player, with no role line and no `is-spy` class.
- Every place the round says "الجاسوس" says "المختلف" in this mode: the discussion prompt, the vote's question, the result. Use new keys; do not rewrite the existing ones.
- The result names both words: "الكلمة كانت **قهوة**، والمختلف كانت معاه **نسكافيه**".
**Accept when:**
- [ ] two phones in المختلف show cards that are identical but for the word
- [ ] nothing on the odd one out's screen, at any point before the reveal, differs from the others'
- [ ] the ordinary الجاسوس mode's screens are unchanged
- [ ] every new string exists in both `ar` and `en`; `npm run check` passes

### T3.4 — One phone
**Files:** `JS_Imposter.html` → `continuePrepImposter`, `fillRole`; `Controller.html` → the setup switch; `JS_Core.html` → keys
**Before** (in `fillRole`):
```js
      const spy = player.role === 'Imposter';
      wordDiv.innerText = spy
          ? (appState.lang === 'ar' ? "🕵️‍♂️ أنت الجاسوس!" : "🕵️‍♂️ You are the Imposter!")
          : appState.imposter.secretWord;
```
**After:** in المختلف every player sees a word, and the card carries no spy styling:
```js
      const undercover = !!appState.imposter.config.undercover;
      const spy = !undercover && player.role === 'Imposter';
      wordDiv.innerText = undercover
          ? (player.role === 'Imposter' ? appState.imposter.pairOther : appState.imposter.secretWord)
          : (spy ? (appState.lang === 'ar' ? "🕵️‍♂️ أنت الجاسوس!" : "🕵️‍♂️ You are the Imposter!")
                 : appState.imposter.secretWord);
      wordDiv.className = 'metric metric--lg ' + (spy ? 'tx-danger' : 'tx-success');
      if (card) card.classList.toggle('is-spy', spy);
```
In `continuePrepImposter`, when the switch is on, deal a pair with `freshPick('imppair', SPY_PAIRS, 1, { key: p => p[0] + '|' + p[1] })` — pass the `key` explicitly: `freshPick` falls back to `JSON.stringify` for anything that is not a string, and the memory is easier to read and to keep in step with the room's key when it holds `'قهوة|نسكافيه'` — and store `appState.imposter.secretWord = pair[0]` and `appState.imposter.pairOther = pair[1]`. Add the switch to the الجاسوس setup screen with `data-remember` so the phone keeps it.
> ⚠️ `.hold-card` must be the same height for every role — the trap that made the spy's card shorter once. In المختلف both faces carry one word, so this is satisfied by construction; do not add a second line to either.
**Accept when:**
- [ ] with the switch on, every player's card shows one word, same colour, same size, and `is-spy` is never added
- [ ] the odd one out's word is the pair's second word
- [ ] with the switch off, the game is exactly what it is today
- [ ] the switch is still set after leaving the screen and coming back
- [ ] a mock test covers `fillRole`'s four cases: undercover×spy, undercover×citizen, ordinary×spy, ordinary×citizen

---

# Phase 4 — The leaderboard of the night

**Decision (owner, 20 Sep 2026):** 3 points to the first, 2 to the second, 1 to the third, banked at the end of every room game **that keeps a score**. A game with no scores at all adds nothing.

### T4.1 — Bank the placements when a game ends
**Files:** `RoomGames.js`
**Built before:** `scoreboardOf(room)` already returns the sorted board, and `room.shared.board` is set by every scored game. `clearGameState` is what runs when the room goes back to the hub — read it before you change anything.
**After:** one helper, called exactly once per finished game:
```js
/**
 * The leaderboard of the night. Placement points rather than the games' own
 * scores, because a trivia score and a سكرو score are not the same currency:
 * 3 for the first, 2 for the second, 1 for the third, shared on a tie.
 * Games with no score at all (ارسم واكتب) never call this.
 */
function bankNightPoints(room, board) { … }
```
- It reads a board of `{ id, score }` (the shape `scoreboardOf` returns), skips it entirely when every score is 0 or the board has fewer than two players, and adds to `room.night` — a room-level object `{ [playerId]: points }` that survives `backToHub` and every deal.
- Ties share: two players tied first both get 3, and the next takes 1.
- سكرو is lowest-wins: pass it a board already inverted, do not special-case it inside the helper.
- Call it from the place each game becomes final, once. Guard against a second call for the same deal with a marker on `shared` (`nightBanked: true`), the way `closeVote` guards itself.
**Accept when:**
- [ ] a finished trivia round adds 3/2/1 to `room.night`, and playing it again adds again
- [ ] going back to the hub and playing another game keeps the earlier points
- [ ] a game where nobody scored adds nothing
- [ ] ارسم واكتب adds nothing
- [ ] calling the end action twice banks once
- [ ] `room.night` survives `clearGameState`
- [ ] سكرو banks the lowest total as first
- [ ] `npm run test:rules` passes; a mock test covers ties, a single player, an all-zero board and the double call

### T4.2 — Show it in the hub
**Files:** `JS_Room.html` → `renderRoomHub`; `JS_RoomTv.html` → the lobby frame; `JS_Core.html` → keys
**After:** under the game picker, a compact board titled `🌙 ليلتنا` listing every player with points, highest first, drawn with the existing `renderScoreboard` so `animateScoreboards` counts the new points up when a game lands. Nothing when `room.night` is empty. The TV lobby shows the same board, larger.
**Accept when:**
- [ ] the board appears only once a game has been banked
- [ ] the numbers match `room.night` exactly
- [ ] a player who joins mid-evening appears with 0 once they have played a game
- [ ] the hub looks unchanged in a room that has played nothing
- [ ] the strings exist in `ar` and `en`

---

# Phase 5A — Four moments that fall flat today

Every task here obeys the motion rules in the Invariants: `transform` and `opacity` only, check `motionOff()` first and set the end state directly when it is true, key a reveal with `motionFirst(key)` so a redraw does not replay it, and back every end state with a timer as well as the animation event. New CSS goes in **section 14** of `Style.html`, with its `prefers-reduced-motion` line in the block at the end of that section.

### T5A.1 — "✋ الأتوبيس وقف!"
**Finding:** in the paper game, shouting *stop* makes everyone drop their pen. On the phones it is a grey line of text under the card.
**Files:** `JS_RoomStop.html`, `JS_Stop.html` (one phone), `Style.html` §14, `JS_Core.html` (one key)
**Built before:** the room already knows who stopped it — `s.stopperName` is drawn as `✋ {name} {stop_room_stopped_by}` in two places. Keep that line; this task adds the moment before it.
**After:** when a phone first sees the round leave `writing`, a full-screen banner reading `✋ الأتوبيس وقف!` slams in over the screen for about 900ms: scale from 1.4 to 1 with a short overshoot, opacity 0 to 1, then fade. Under it, one line: `{name} وقف الأتوبيس`. Key it `motionFirst('stop-slam|' + state.code + '|' + s.round)` so a redraw does not replay it, and remove it with a timer as well as `onfinish`.
> ⚠️ The banner must not swallow a tap: `pointer-events: none` on the layer.
> ⚠️ Sound is T1.1's business — route any cue through `playRoomFx`, not `playSound`.
**Accept when:**
- [ ] the banner plays once per round on every phone and on the TV, not once per redraw
- [ ] with motion off, no banner at all (not a 0.01ms one)
- [ ] a tap during the banner still reaches the screen underneath
- [ ] the existing `✋ {name}` line is unchanged

### T5A.2 — "خمّن صح!" on the drawing
**Files:** `JS_RoomDraw.html`, `Style.html` §14, `JS_Core.html`
**Built before:** the result frame already says `draw_guessed_by` with the winner's name, and the round ends by `shared.word` being set, not `winnerId` — read that trap in GEMINI.md before you branch on anything.
**After:** when a round ends **with** a winner, stamp `خمّن صح!` diagonally across the canvas on every phone and the TV: scale 2.2 → 1 with a slam, a slight rotation, then hold. Reuse the existing stamp keyframes if `Style.html` already has one (`skr-stamp-in` — grep for it) rather than writing a second.
**Accept when:**
- [ ] the stamp appears only when someone guessed, never when the host gave up
- [ ] it plays once, on every phone and the TV
- [ ] it sits over the drawing without clearing or repainting the canvas
- [ ] with motion off, the stamp is drawn already settled

### T5A.3 — The Wordle row shakes on a short word
**Files:** `JS_Wordle.html` → `submitWordleGuess`; `Style.html` if needed
**Built before:** `animate-shake` already exists and is used by Connections (`grid.classList.add('animate-shake')`). Reuse that class; do not write a second shake.
**Before:**
```js
    if(appState.wordle.currentGuess.length !== appState.wordle.wordLength) {
        playSound('alarm');
        const msg = appState.lang === 'ar' ? "الكلمة قصيرة جداً!" : "Word too short!";
        showToast(msg);
        return;
    }
```
**After:** the same, plus the active row taking `animate-shake` for its duration and losing it on a timer.
**Accept when:**
- [ ] a short word shakes the row being typed, not the whole board
- [ ] the class is gone afterwards, so the next short word shakes again
- [ ] a complete word never shakes
- [ ] with motion off, nothing moves and the toast still shows

### T5A.4 — Mafia's night and day
**Files:** `JS_RoomMafia.html`, `Style.html` §14
**Built before:** `.mafia-night` is an existing class on the night card. This task is about the **screen behind it**, not that card.
**After:** the view's background crosses over about one second when the phase moves between `night` and `day`/`dayResult` — a deep night wash into a warm dawn one. Build it from the existing accent tokens (a night and a dawn tint defined once in §14), never a hex colour, and animate `opacity` on a layer rather than changing `background` on the view.
**Accept when:**
- [ ] going night → day crosses over once, and day → night the other way
- [ ] a redraw inside the same phase does not restart it
- [ ] with motion off, the screen is simply in the right state
- [ ] on the TV as well as the phone
- [ ] no hardcoded colour anywhere in the diff

---

# Phase 5B — The rest of the motion batch

### T5B.1 — Points that fly to the score
**Files:** `JS_Motion.html` (the helper), `JS_RoomTrivia.html` and `JS_RoomQuiz.html` (the callers), `Style.html` §14
**Built before:** `animateScoreboards` already counts a risen score up and slides a player whose place changed, keyed on `data-pid` / `data-score`. This task adds the number leaving the answer and arriving at the board; it does not replace the count-up.
**After:** one helper beside `flyEmoji`, `flyPoints(text, fromRect, target)`, that floats `+10` from where the answer was tapped up to that player's row and pops it on arrival. Call it only on **this phone's own** right answer.
**Accept when:**
- [ ] it fires on your own right answer and on nobody else's screen
- [ ] the count-up still runs after it lands
- [ ] with motion off, no ghost is created at all
- [ ] `flyPoints` is defined exactly once

### T5B.2 — "One away" shakes the four you chose
**Files:** `JS_Connections.html`
**Built before:** a wrong guess already shakes the **whole grid** (`grid.classList.add('animate-shake')`) and already tells the player when three of four match (`conn_one_away`). Do not remove either.
**After:** on a one-away guess only, shake the four selected tiles instead of the grid — capture their elements **before** `connections.selected = []` runs.
**Accept when:**
- [ ] one away shakes four tiles; an ordinary wrong guess still shakes the grid
- [ ] the toast is unchanged in both cases
- [ ] the selection is still cleared afterwards

### T5B.3 — The last three seconds
**Files:** `Style.html` §14, and the clocks that already mark urgency
**Built before:** `.timer-display.is-urgent` and `.tb-timer.is-urgent` already pulse, and `.tv-timer.is-low` already turns red. Extend those; do not add a third convention.
**After:** at 3, 2 and 1 the number pops once (scale 1 → 1.25 → 1), and a warning tint breathes at the very edge of the screen. The edge layer is one element at the view's root with `pointer-events: none`.
**Accept when:**
- [ ] the pop happens exactly three times, once per second, not on every tick
- [ ] the edge tint appears only under three seconds and is removed when the clock stops
- [ ] nothing moves with motion off
- [ ] the tint never covers a button (it is `pointer-events: none` and only a rim)

### T5B.4 — The buzzer feels like a buzzer
**Files:** `JS_RoomBuzzer.html`, `Style.html` §14
**After:** the big button presses in (scale ~0.94 with a shadow that shortens) and a ring expands from it on `buzz`. The phones that were beaten dim their button into the locked state they already show.
**Accept when:**
- [ ] pressing it moves the button and rings once
- [ ] the first buzzer's phone and the others still show exactly the states they show today
- [ ] `roomAct('buzz')` is still sent exactly once per press

### T5B.5 — Playful titles at the end
**Files:** `JS_RoomTrivia.html`, `JS_RoomTwoTruths.html`, `JS_Core.html` (keys)
**Scope, deliberately narrow:** award a title only where the data is **already published in `shared`**. Trivia publishes `shared.order` (who answered first), so it can name `⚡ أسرع واحد`. صدق ولا كذب publishes who fooled whom, so it can name `🎭 أحسن كداب`.
> ⛔ Do not add a field to the server for this, and do not invent a title for a game whose data is not already there. If a game cannot support one, skip it and say so in the report.
**Accept when:**
- [ ] each title is computed from `shared` alone, with no change under `rooms-worker/` and none to `RoomGames.js`
- [ ] a game with one player, or with nobody scoring, shows no title rather than an empty one
- [ ] the titles read in both languages

---

# Phase 6 — A result card you can send

### T6.1 — Draw the card
**Files:** a new `JS_ShareCard.html` (included from `Controller.html` next to the other `JS_*` files), `JS_Core.html` (keys)
**After:** one function, `shareResultCard({ title, icon, rows, footer })`, that draws a 1080×1920 card on an off-screen `<canvas>` and hands it to `navigator.share` with `files`, falling back to a download and then to the existing `shareOrCopy` text when neither is available. The card carries the app's own look: the violet ground, the mark drawn from `#ashry-mark`, the game's name, up to eight rows of `name — score`, and the app's link at the foot.
> ⚠️ Arabic on a canvas does not shape itself in every browser the way it does in the DOM. Draw the Arabic with `ctx.direction = 'rtl'` and `textAlign = 'right'`, and **check one rendered card by eye** before calling this done — if the letters come out disconnected, say so in the report rather than shipping it.
> ⚠️ `navigator.share` with files must be called inside the tap, or iOS refuses it. Build the blob first, then share.
**Accept when:**
- [ ] a card renders with three players, with eight, and with one
- [ ] a long Arabic name is truncated, not overflowed
- [ ] with no `navigator.canShare({files})`, it downloads instead, and with neither it copies the text
- [ ] nothing is drawn until the button is pressed (no canvas work on every result)

### T6.2 — Put it where a result already is
**Files:** `JS_Solo.html` (`soloResult`'s share button), the room podium renderers
**After:** the existing "📤 شارك" on a solo result and at the end of a room game builds the card instead of sending only text. A long-press or a second button keeps the plain text for anyone who wants it.
**Accept when:**
- [ ] the daily's share still carries its own text line (the streak and the grid), now with the card
- [ ] a room's end-of-game share names the game and the top three
- [ ] the button does nothing surprising when a game ended with no scores

---

# Phase 7 — العقل (The Mind)

A cooperative room game with **no content at all**: every player holds secret numbers from 1 to 100 and the table must lay them down in rising order without saying a word. A wrong order costs a life. Levels: level *n* deals *n* cards each.

### T7.1 — The rules on the server
**Files:** `RoomGames.js`, `rooms-worker/test/play-all.mjs`
**After:** a `mindAction(room, playerId, action, payload)` branch. `start` deals level 1: each player gets one number, unique across the table, kept in `room.secrets[pid].cards`. `play` puts a player's lowest held card down: the server compares it against every card still held by anyone — if any unplayed card anywhere is lower, the table loses a life and **every** card lower than the one played is discarded face up (that is the real game's rule and it keeps the round moving). A level is cleared when no cards are held; then `nextLevel` deals level + 1. Lives start at the player count; at zero the game is over. `shared` carries the level, the lives, the pile and how many cards each player still holds — never the numbers themselves.
> ⛔ The numbers are the whole secret. `shared` never holds an unplayed number, and `project()` gives each phone only its own.
**Accept when:**
- [ ] no phone's state contains another player's unplayed number (prove it in the robot round)
- [ ] playing out of order costs exactly one life and discards every lower card
- [ ] a level with every card played moves to the next level with one more card each
- [ ] lives at zero ends the game
- [ ] a player leaving mid-level drops their cards and the level can still be finished (`roomPlayerLeft`)
- [ ] `roomTurnOf` returns this game for a phone still holding a card — it is always your turn in The Mind
- [ ] a round of it in `play-all.mjs` passes, and `npm run test:rules` passes

### T7.2 — The screens
**Files:** `JS_RoomMind.html` (new), `JS_Room.html` (`ROOM_HUB_GAMES`), `Controller.html` (the view), `JS_Core.html` (`VIEW_META`, keys, `GAME_RULES`), `JS_Utils.html` (`HELP_ENTRIES`, `HELP_FOR_VIEW`), `JS_Catalog.html` (`GAME_CATALOG`)
**After:** your cards big and tappable, the pile's last card, the level and the lives. A card that goes down flies to the pile; a life lost shakes the screen once. The TV shows the level, the lives and the pile.
> ⚠️ This is a room game, so it needs every piece in the checklist: `RoomGames.js` branch, `ROOM_GAMES` and `TV_GAMES` renderers, `ROOM_HUB_GAMES`, `ROOM_GAME_IDS`, `roomPlayerLeft`, `roomTurnOf`, a `GAME_CATALOG` entry with `modes: ['room','tv']`, `VIEW_META`, and rules in all three help registries. **`faceToFace` is false** — The Mind needs no talking at all, which is the point of it.
**Accept when:**
- [ ] every item in that checklist exists (list them one by one in the report)
- [ ] the hub tile is greyed under 2 players
- [ ] the help sheet opens on it from its own screen

---

# Phase 8 — قبل ولا بعد (Timeline)

**Decision (owner, 20 Sep 2026):** Egyptian and Arab first, with famous world dates mixed in so the cards spread across the centuries.

### T8.1 — The bank
**Files:** a new `TimelineEvents.js` at the repo root, added to `FILES` in `rooms-worker/build.mjs` and to the `SHARED_LISTS` inlining in `tools/build-*.mjs`
**After:** `const TIMELINE_EVENTS = [{ y: 1869, ar: '…', en: '…' }, …]`, sorted by nothing in particular, each with a year that is not in dispute. **Ship exactly these to begin with** — every one is a date with a single well-known answer:
```
1869 افتتاح قناة السويس · 1876 اختراع التليفون · 1903 أول طيران للأخوين رايت
1912 غرق التيتانيك · 1922 اكتشاف مقبرة توت عنخ آمون · 1932 تأسيس المملكة العربية السعودية
1945 نهاية الحرب العالمية التانية · 1952 ثورة يوليو · 1956 تأميم قناة السويس
1969 أول إنسان على القمر · 1970 افتتاح السد العالي · 1971 تأسيس الإمارات
1973 حرب أكتوبر · 1975 وفاة أم كلثوم · 1977 وفاة عبد الحليم حافظ
1987 افتتاح أول خط مترو في القاهرة · 1988 نجيب محفوظ يفوز بجايزة نوبل
1990 أول موقع على الإنترنت · 2004 إطلاق فيسبوك · 2007 أول آيفون
2011 ثورة يناير · 2015 افتتاح قناة السويس الجديدة
```
> ⛔ Do not add an event whose year you cannot source. A trivia game with a disputed date is worse than a short bank. If you want more, say so in the report and leave it to the owner.
**Accept when:**
- [ ] every entry has a `y`, an `ar` and an `en`
- [ ] no year appears twice
- [ ] `tools/validate-content.js` gained a check for both of those, and `npm run check` runs it

### T8.2 — The game
**Files:** `RoomGames.js`, `JS_RoomTimeline.html` (new), plus the full room-game checklist as in T7.2
**After:** each player holds three event cards with the years hidden. In turn, a player places one on the table's timeline — before, between or after the cards already down. The server checks the real year: right, it stays and the player draws another; wrong, it is discarded and the year is shown. First to place all of theirs wins, or a fixed number of rounds.
> ⛔ The years of unplayed cards are secret. `shared` carries a placed card's year (everyone has seen it) and never an unplayed one's.
> **`faceToFace` is false** — every move is a tap.
**Accept when:**
- [ ] no phone holds another player's unplayed year
- [ ] a correct placement keeps the card and the timeline stays sorted
- [ ] a wrong placement reveals that card's year and discards it
- [ ] the same event never appears twice in one game (deal through `nextPrompts`)
- [ ] the whole room-game checklist, listed item by item in the report
- [ ] a round in `play-all.mjs` passes

---

# Phase 9 — The Mafia narrator

### T9.1 — A voice that reads the night
**Files:** `JS_RoomMafia.html`, `JS_Sounds.html` or a new small helper, `JS_Core.html` (the setting and its keys)
**Decision (owner, 20 Sep 2026):** an option, **off by default**, until it has been heard on a real phone.
**After:** when the option is on and this device is the **TV** (or the host's phone when there is no TV), `window.speechSynthesis` reads one short line at each phase change: the town falling asleep, the mafia waking, the morning news. Pick an Arabic voice from `speechSynthesis.getVoices()` when one exists and say nothing at all when none does — never read Arabic text with an English voice.
> ⚠️ `getVoices()` is empty until `voiceschanged` fires on most browsers. Wait for it.
> ⚠️ Speech needs a user gesture on iOS: prime it on the host's first tap, and if it is refused, fail silently.
> ⛔ It must never read anything role-specific. One narration for the room, the same on every device that speaks.
**Accept when:**
- [ ] with the option off (the default) `speechSynthesis` is never called
- [ ] with it on and no Arabic voice present, nothing is spoken and nothing throws
- [ ] only one device speaks in a room
- [ ] leaving the game or the room cancels any speech in progress (`speechSynthesis.cancel()`)
- [ ] the lines say nothing that identifies a role
- [ ] the setting is in both languages and survives a reload
- **Phase 5** — the motion batch: floating points, Connections shake, 3-2-1 pops and edge pulse, buzzer press, superlatives, the وقف slam, the Draw & Guess stamp, the Wordle shake, the Mafia day/night fade.
- **Phase 6** — shareable result cards drawn on a canvas.
- **Phase 7** — العقل (The Mind), a new room game with no content at all.
- **Phase 8** — قبل ولا بعد (Timeline), a new room game and its dated-events bank.
- **Phase 9** — the Mafia narrator, an optional setting, default off.
