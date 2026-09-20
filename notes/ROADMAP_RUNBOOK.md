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

# Phases 3-9

**DETAIL PENDING.** These are being written while Phase 0 runs. Do not start any of them until the phase section appears in this document and you are given it by name.

- **Phase 3** — المختلف (Undercover) in الجاسوس: a curated close-pair list, one phone and rooms, nobody told their role.
- **Phase 4** — the leaderboard of the night: 3/2/1 banked per scored game, shown in the room hub.
- **Phase 5** — the motion batch: floating points, Connections shake, 3-2-1 pops and edge pulse, buzzer press, superlatives, the وقف slam, the Draw & Guess stamp, the Wordle shake, the Mafia day/night fade.
- **Phase 6** — shareable result cards drawn on a canvas.
- **Phase 7** — العقل (The Mind), a new room game with no content at all.
- **Phase 8** — قبل ولا بعد (Timeline), a new room game and its dated-events bank.
- **Phase 9** — the Mafia narrator, an optional setting, default off.
