# 🔮 العرّاف — The Oracle

The app guesses what you are thinking of (an Akinator of our own: an Egyptian uncle in a
tarboosh with his crystal ball). One phone. Built 9 Oct 2026 (phase 1 of 2: the engine, the
question list, the data format, the validator and the first 334 entries; other writers add
~800 more in the same format - see *Writing entries* below).

## The owner's spec (notes/ideas.md, "New games of 9 Oct 2026", item 1436)

- One phone only. Kinds: famous people (Egyptian, Arab and world-famous; traits that don't
  change only), cartoon and film characters, animals, things and jobs. The kind is asked as
  part of the questions («هو إنسان؟»), never picked first.
- Five answers: أيوه / لأ / مش عارف / غالباً أيوه / غالباً لأ. 20 questions; it may guess early
  when sure; three guesses in all. A take-back of the last answer («رجّع»).
- A first list of 1,000+ entries, each tagged with its traits, checked by the validator.
- When it loses it asks «كنت بتفكر في مين؟»: the name and the answers go to the server's report
  list for the owner to review and add (like «في غلطة؟»); nothing typed reaches other players.
  The phone says «شكراً، هتعلّم».
- English too: every entry and question has its English name.
- The look: أ «العرّاف على المسرح» from the sheet https://claude.ai/artifact/LtDnAyWLkZExt5yxDBpxMH
  (mock in notes/archive/sheets/oracle-looks.js.txt): the drawn uncle on the stage, the
  question in his speech bubble, the answers stacked under him.

## Decided while building (not in the rules)

- **The fourth kind is two in the data**: things (`t`) and jobs (`j`), so job questions («بيشتغل
  في مستشفى؟») don't have to be answered for a chair. On screen they are one kind («حاجة أو
  شغلانة»).
- **A guess doesn't use a question**: 20 questions and, apart from them, 3 guesses. After a wrong
  guess the oracle is surprised («يا خبر! مش هو؟ طيب…») and goes on asking; once the 20 are
  used he spends the guesses he has left one after the other. Out of guesses = he lost, even
  with questions left.
- **«رجّع» takes back the last answer only** (as often as wanted, one at a time). A wrong guess
  is a fact and is not taken back. On a guess screen «رجّع» drops the guess and the last
  question comes back.
- **What he guesses is drawn, never a photo**: a person or a job is a silhouette with a badge
  (the entry's icon: ⚽ a footballer, 🎤 a singer); a character, an animal or a thing is its own
  emoji on a round tile.
- **The record** on the setup: «العرّاف عرف N من M مرة» (`appState.oracleRecord`, this phone only).
- The first three questions vary a little (any of the near-best), so two games don't open the
  same; after that he always asks the best question.
- A miss is sent once per game, the name cut at 40 characters; the answers go as question ids
  and answer codes only.

## How it plays

Setup (`setup-oracle`): the oracle in his idle mood under a bubble «فكّر في حد مشهور أو شخصية أو
حيوان أو حاجة… وأنا هعرفه!», the four kinds as chips, the line about 20 questions and 3 guesses,
the record, «كمّل اللعبة» when a game is unfinished, «ابدأ».

Play (`play-oracle`), look أ:
- the count: «سؤال N من 20», three little crystal balls for the guesses left, twenty pips;
- the stage: the question in his speech bubble (its number on a badge), the oracle under it;
- the answers: أيوه (green) and لأ (red) big, then غالباً أيوه / غالباً لأ, then مش عارف; under them
  «↶ رجّع: <the last question> <its answer>» and «خروج» (`playExit`: asks mid-game).
- After an answer its tag flies into the bubble, the oracle closes his eyes («استنى… بركّز», the
  ball dims, the answers wait, 650 ms), then the next question pops in. When he is sure: «جالي! ✨»
  (the ball glows, 800 ms), then «بتفكر في… <name>؟» with its kind, and «أيوه، هو ده! 🎉» /
  «لأ، مش هو» and how many guesses he has left after this one.
- Won: «عرفتك! 😄», the oracle laughing, the card with the silhouette or icon, the name, the kind,
  the questions it took (counting up) and which guess; confetti. «العب تاني», «خروج».
- Lost: «غلبتني! 🙌 كنت بتفكر في مين؟», the oracle sad (a tear), a field «اسمه أو اسمها» and «ابعت»;
  then «شكراً، هتعلّم». Under it how many questions and guesses and what he guessed.
- His moods (`oracleArt(mood, ball)`): idle, think (eyes shut), sure (one brow up, a smirk),
  surprised (round eyes, an O, a shake), sad (brows up in the middle, a frown, a tear), happy
  (^^ and a grin). The ball: `?`, dim, glowing, a face in it.
- Sideways: the count across the top, the oracle beside his bubble on one side, the answers on
  the other. Laptop / TV: the stage and the answers side by side in the middle (60rem).
- Reduced motion: no flight, no beats, nothing breathing; every state is drawn at once.
- Reload: the whole game is `appState.oracle` (answers, wrong guesses, the step on show), so it
  comes back to the same question or guess (`VIEW_RESTORE`); a beat cut by the reload is skipped.

## How it works

Files, all in `games/oracle/` and in the game's chunk (`CHUNKS.oracle`, `tools/lazy-split.mjs`;
the `.js` ones are also in `SHARED_LISTS`, page only, like `ChessPuzzles.js`): nothing of it is
in the shell but its card, its help entry, `art:oracle` (ICON_ART) and its `SETUP_PAINTERS` line.
- `JS_Oracle.html`: the screens, the drawing, the moods, the motion, the miss.
- `Oracle.js`: the engine, pure (no page): `oracleData()`, `oracleOdds()`, `oracleNextStep()`.
- `OracleQuestions.js`: the questions. `OraclePeople.js`, `OracleCharacters.js`,
  `OracleAnimals.js`, `OracleThings.js` (things and jobs): the entries.
- `oracle.text.js`: its words and its rules.
- Styles: section ORACLE at the end of `styles/Style_Talk.html` (`.orx-*`, all moved into the
  chunk by css-split).

**The engine.** Every entry has a truth for every question: Y (yes), M (maybe), U (unlisted:
«غالباً لأ»), N (no), X (not about its kind: a firm no). Each answer multiplies an entry's
likelihood by `ORACLE_LIKE[truth][answer]`:

|   | أيوه | غالباً أيوه | مش عارف | غالباً لأ | لأ |
|---|---|---|---|---|---|
| Y | .80 | .10 | .05 | .03 | .02 |
| M | .25 | .30 | .20 | .15 | .10 |
| U | .07 | .08 | .15 | .20 | .50 |
| N | .02 | .03 | .05 | .10 | .80 |
| X | .01 | .02 | .05 | .07 | .85 |

«مش عارف» changes nothing when it is said. Nothing is ever ruled out, so a wrong answer only
costs a few questions. The next question is the one with the least expected doubt left (the
entropy of the odds after each answer, weighted by how likely that answer is), over the entries
within 1/10,000 of the leader. He guesses when the leader holds 72% of the odds with 3 guesses
left, 80% with 2, 90% with 1 (`ORACLE_SURE`); with 3 questions or fewer left, a leader at 50%
and three times the next one; and at question 20 always. A wrong guess sets that entry to 0.

**The misses.** `POST /oracle-miss { name, answers, guesses, lang }` on the rooms server
(`rooms-worker/src/index.js`, `oracleMissOf`): the name cleaned and cut at 40, the answers as
`qid:a` (ids and answer codes only), the guesses' ids; kept in the `WordLog` named `oracle`
(the same store as the plays and the reports: kept until read, 5,000 at most, `xl` words up to
600 characters), rate-limited with the plays and the reports (`countAllowed`, 120 an hour per
address). No player name, no address. The owner reads them with
`ASHRY_ADMIN_KEY=… npm run oracle:misses` in `tools/` (`-- --answers` to see each game's
answers by question, `-- --clear` to empty it): names folded together, most-sent first, and
"(already an entry: … - check its traits)" when the name is one we have.

**Tests.** `npm run check` (validate-content.js) runs the strict checks below. `npm run
check:oracle` runs them and then plays every entry twice with a robot thinking of it (truthful,
and one answer in ten wrong), printing how often he wins and the entries lost; it fails under
90% truthful. On 9 Oct 2026, 201 questions, 334 entries: truthful 100% (9.3 questions on
average), one in ten wrong 97.6%.

Phase 2, things and jobs (9 Oct 2026): 149 things (fruit, Egyptian dishes and drinks, the
house, school, clothes, vehicles, toys and music, places and landmarks, nature) and 61 jobs
(مكوجي, بوّاب, ترزي, نقّاش, حدّاد, بيّاع فول, قهوجي, مسحّراتي, سايس…). Fifteen questions came with
them: for things `peel` (بنقشّره قبل ما ناكله؟) and `meat_t` (فيه لحمة أو فراخ؟); for jobs
`shop_j`, `house_j`, `stage_j`, `sport_j`, `army_j`, `words_j`, `clothes_j`, `travel_j`,
`plants_j`, `clean_j`, `cart_j`, `lab_j`, `music_j` - every older thing and job was gone over
for them. With 544 entries: truthful 100%, one in ten wrong 95.0% (things 90.7%, jobs 97.8%).

## Writing entries

Entries live in four files by kind. One line each:

```js
{ id: 'cheetah', icon: '🐆', ar: 'فهد', en: 'Cheetah', yes: 'mammal wild meat africa_a legs4 fur tail spots fast yellow', maybe: 'danger' },
```

- `id`: lowercase English letters, digits and `_`, unique across all files; never change one.
- `icon`: one emoji. For a person: what they are known for (⚽ 🎤 🎬 👑 ✍️ 🔬), shown as a badge on
  a drawn silhouette. Never a photo, never a flag that could offend.
- `ar`, `en`: the name as a family would say it (Egyptian spelling: «تعلب», «دبّانة»). No name may
  repeat another entry's (compared the way typed words are: hamza, ة/ه, ى/ي, «ال»).
- `yes`: the ids of the questions (OracleQuestions.js) that are **true**: space-separated.
- `maybe`: true **partly**, or what most people would answer «غالباً أيوه» (a lion is yellow-ish,
  a tomato is in the kitchen, Cleopatra is Egyptian).
- `no`: firmly false **where a player might think otherwise** (a dolphin is not a fish, a penguin
  doesn't fly, Salah never played for Al Ahly). Use it to stop a likely mix-up.

**The rule for what is not listed**: a question about the entry's kind that is in none of the
three lists reads as «غالباً لأ» (U). A question about another kind (`kinds` on the question)
is a firm «لأ» (X). So: list every trait that is true, the doubtful ones under `maybe`, and the
false ones only where a player could be fooled. The kind questions (`human`, `real`, `fiction`,
`animal`, `job`, `object`) are answered by the kind itself (`auto`); don't list them, except a
character, which must say `human` in yes, maybe or no (and `animal` when it is one).

`implies` on a question adds its traits for you: `ahly`, `zamalek`, `england`, `spain`, `italy`,
`keeper`, `defender`, `striker`, `worldcup`, `afcon`, `ballon` → `football` → `athlete`; `tennis`,
`squash`, `runner`, `swimmer`, `lifter`, `basket` → `othersport` → `athlete`; `egypt`, `levant`,
`gulf`, `maghreb` → `arab`; `south` → `egypt`; `uk`, `france` → `europe`; `pharaoh` → `bc` →
`before1800` → `born1930` → `born1950` → `born1970` (so a person's birth is one trait: the
earliest that is true); `poet` → `writer`; `princess` → `female`; `fruit`, `veg`, `dish` →
`edible`; `screen` → `electric`.

The people's questions added with the second batch (9 Oct 2026, with 251 people): `born1970`,
`director`, `villainroles`, `oscar`, `built` (a pyramid, a temple, a famous building), `uk`,
`france`, `italy`, `defender`, `tennis`, `squash`, `runner`, `swimmer`, `lifter`, `basket`.
Two entries apart need a *yes* one hasn't (a maybe does not set them apart): many Egyptian
actors share every trait, so only those a trait tells apart are in (Shadia beside Soad Hosny,
Beethoven beside Mozart, Nadal beside Federer could not be, yet).

Five things' questions of the third pass (9 Oct 2026): `square` (مربع أو مستطيل), `long`
(طويل ورفيع), `soft` (طري لما تلمسه), `smell` (ريحته حلوة), `colorful` (ألوانه كتير). Every thing
was gone over for all five (an unmarked one reads «غالباً لأ», so a soft thing left out misleads
him): a yes where a family would say yes, a maybe where it depends. With 1,065 entries:
truthful 100%, one in ten wrong 96.3% (things 93.2%, from 89.8%).

**The twins of the full review** (9 Oct 2026). Once every entry's traits were reviewed question by
question (data complete and true), 83 pairs had the same answers: the old data had told them apart
only by a true trait marked on one and missing on the other. They were set apart without a false
trait. True traits that were missing: ambulance white, volcano a place, tangerine small, headphones
worn, Ramadan decorations long, the monkey in a group, Popeye's powers, Uncle Fouad old, Snow White
yellow, Boogie a child, Muhammad Ali Pasha a warrior, Champollion and Muhammad Ali born before 1800,
Mary Mounib born in Damascus (levant), garbageman and delivery come to the house, the licorice seller
and the beekeeper in a set outfit; Cleopatra `no: bc1000`. Then 38 questions, each marked on every
entry of its kinds: people `bc1000`, `before1500` (in the birth chain: pharaoh → bc1000 → bc →
before1500 → before1800; born1970 → born1975 → born1980), `born1975`, `born1980`, `midfield`, `dance`,
`math`; characters `parent`, `stepmother`; animals `pulls`, `fantail`; things `twowheels`, `cargo`,
`fare`, `siren`, `standing`, `travel`, `floor`, `bedroom`, `read`, `internet`, `byremote`, `touch`,
`listen`, `seeds`, `stuffed`, `fried`, `leaves`, `flame`, `holdsdrink`, `rainy`; jobs `voice_j`,
`film_j`, `boss_j`, `danger_j`, `gov_j`, `scale_j`, `stands_j`. Seven entries a family could not tell
from a more famous one were removed: triceratops (dinosaur), squid (octopus), mullet (sardine), falcon
(eagle), Mufasa (Simba), Mohamed Fouad (Amr Diab), Zaza and Gargir (Boogie and Tamtam, Baqlaz). With
1,058 entries and 293 questions: truthful 100% (10.6 questions), a real player 91.9%, one in ten
wrong 88.1%.

Only facts that don't change: where they are from, what they did, what they won, when they were
born. Never alive or dead, still playing, married. No politicians of our time, nothing divisive,
nothing adult, no religious figures. Kinds in the files: `OraclePeople.js` (`p`),
`OracleCharacters.js` (`c`), `OracleAnimals.js` (`a`), `OracleThings.js` (`ORACLE_THINGS` `t`,
`ORACLE_JOBS` `j`). A new file of entries is added to `oracleEntryLists()` in Oracle.js, to
`ORACLE_FILES` in tools/oracle-data.cjs and to `CHUNKS.oracle` and `SHARED_LISTS` in
tools/lazy-split.mjs.

**A new question** only when entries can't be told apart without it, and it is about something
that doesn't change: id, `kinds`, `ar` (ending in ؟), `en` (ending in ?), `auto`/`implies` if
needed; at least one entry must say yes to it.

**Check your work**: `cd tools && npm run check:oracle`. It fails on:
- an id used twice, a field it doesn't know, a missing `ar`, `en` or `icon`, Latin letters in
  `ar` or Arabic in `en`, a name used twice;
- a trait that is no question, or a question not asked about the entry's kind;
- one trait in two lists, a `no` that a `yes` implies, an `auto` yes listed again, fewer than
  2 yes traits, a character that doesn't say whether it is human;
- two entries with the same answers (one has to have a yes the other hasn't): add a trait;
- the truthful games won under 90%.
Then read its list of lost entries and what was guessed for them: that pair needs a trait apart.
`npm run check:oracle -- --entry=salah` plays one entry question by question.

## The fix of 10 Oct 2026 (the owner: wrong questions and wrong guesses)

- The owner answered «لأ» to «ست أو بنت؟» and was offered a woman. Cause: every answer only moved the odds (a «لأ» made a woman 25 times less likely), and many true traits were missing, so a truthful «أيوه» to an unmarked trait cost the right entry about 11 times - two such gaps outweighed the gender. The old check answered from the data itself, so it could not see it.
- **Firm questions** (`firm: true` in OracleQuestions.js: the kind questions, female, egypt, actor, singer, athlete, football, cartoon; `arab` stays soft because of the pharaohs): their data is complete (unmarked = no), their likelihood is sharp (`ORACLE_LIKE_FIRM`), and an entry a firm «أيوه»/«لأ» rules out is never guessed (`oracleContradicts`) and not weighed when choosing a question.
- **No settled questions**: a question every still-likely entry answers the same way is never asked (`oracleSaid` in `oracleBestQuestions`); in the simulation 30 of 3,765 questions were settled before, 0 after.
- **The data reviewed question by question** (six reviewers, one kind each, merged by script): about 1,200 true traits added, wrong ones corrected; that made 83 entries identical to another, so 38 questions were added (each marked on every entry of its kinds) and 7 near-duplicates removed. 1,058 entries, 293 questions.
- **check:oracle plays a real player too**: an unmarked trait answered «أيوه» 12% of the time, 1 in 20 other answers wrong, firm questions never wrong. Truthful 100%, real player 98.5%; one answer in 10 wrong at random (firm ones included) 87% - a wrong firm answer loses by design.

## The new areas of 10 Oct 2026

Four writers at once, each in its own file, merged by hand (1,058 entries and 293 questions before;
1,482 and 396 after: 455 people, 296 characters, 178 animals, 309 things, 91 jobs, 153 places).
- **Content creators** (`OracleCreators.js`, kind `p`, 38): YouTubers, TikTokers, gamers, chefs and
  children's channels, Egyptian, Arab and world. 16 questions: `creator` (firm: everyone mainly known
  for making videos online; a TV chef with a big channel is a maybe), `gaming_v`, `live_v`, `cook_v`,
  `explain_v`, `kids_v`, `tiktok`, `challenge_v`, `family_v`, `group_v`, `sports_v`, `beauty_v`,
  `travel_v`, `tech_v`, `vlog_v`, `podcast`; the older people marked where true (Mostafa Mahmoud
  `explain_v`, Shobeir `sports_v`, Disney and Miyazaki `kids_v`, Ramez Galal `challenge_v`).
- **Games and apps** (`OracleApps.js`, kind `t`, 73: 34 video games, 3 games devices, 36 apps).
  26 questions: `appgame` (firm: «لعبة فيديو أو أبلكيشن؟»), `vgame` → `appgame`, `onphone`,
  `onconsole`, `online`, `footgame`, `battle`, `building`, `racing`, `cargame`, `puzzle`, `cardgame`,
  `tablegame`, `oldgame`, `japan_g`, `chatapp`, `posts`, `watchapp`, `payapp`, `orderapp`, `shopapp`,
  `google`, `meta`, `askapp`, `mapapp`, `workapp`; the PlayStation, chess, backgammon, dice and cards
  marked. A game's hero stays a character (ماريو, باك مان): the kind questions tell them apart.
- **Places** (`OraclePlaces.js`, a new kind `l`, 153: 109 countries from the app's list, 16 Egyptian
  cities, 28 world cities). The kind question `countrycity` («بلد أو مدينة؟», firm, `l:y` and a no for
  every other kind); `human`, `real`, `fiction`, `animal`, `job` say `l:n`. **auto `m`**: an `auto`
  may now give a kind a maybe - `object` is `l:m` (a country is «not a person or an animal» but hardly
  «a thing»), `place` is `l:y`. 55 questions: `city` and the continents `africa_l`, `asia_l`,
  `europe_l`, `america_l` firm; regions (`gulf_l`, `levant_l`, `maghreb_l` → `arab`; `eastasia`,
  `seasia`, `southasia`, `north_eu`, `easteu`, `southam`, `oceania`), Egypt's own (`delta`, `south_l`,
  `sinai` → `egypt`, `nubia`, `nile_l`, `neighbor_eg`), seas (`sea_l`, `med`, `redsea`), the land, the
  languages, the cups, history, cities (`capital`, `river_city`, `beach_city`, `canals_city` → `city`)
  and the flag's colours. `egypt` and `arab` are asked of places too. An entry's id starts `l_`.
- **The newer stars** (in `OraclePeople.js` and `OracleCharacters.js`): 90 people (Egyptian and Arab
  actors and singers of the last fifteen years, world actors and singers children know, today's
  footballers and coaches, athletes) and 69 characters (Bluey, Paw Patrol, Inside Out, Encanto,
  Spacetoon anime, phone games, الكبير أوي). 5 questions, each marked on every person, the creators
  included: `born1990`, `born2000` (the birth chain goes on: born1980 → born1990 → born2000, so a
  person is marked with the earliest that is true), `germany` → `football`, `racer` → `othersport`,
  `famousparent`.

The numbers after the merge and the cross-check: truthful 100% (11.2 questions); a real player 98.0%
(p 98.7, c 99.7, a 98.3, t 93.9, j 98.9, l 100); one in ten wrong 85.5%. **Things fell from about
96% to about 94%** (the same over several seeds of the real player) and true marks don't bring
them back: a thing's game now spends three more questions on kinds - «حاجة؟», then `appgame`, then
`countrycity` (the places' `object` maybe keeps them alive), sometimes `fiction` (the 26 characters
that are objects) - before its own questions, so a few unlucky answers leave too few questions. If it
matters, the place to look is the engine or `object: l:m`, not the data.
