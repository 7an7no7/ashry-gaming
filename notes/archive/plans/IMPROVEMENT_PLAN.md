# From 8 to 9-10: the improvement plan

Written 25 Sep 2026. A proposal for the owner; nothing here is built until the
owner answers the questions at the end (the "ask before building" rule).

## Where we stand

8/10. The strengths are breadth with depth (about 100 catalog entries, chess
alone a full product), engineering few studios match (secrets on the server,
the leak check, robots, the screen test), Arabic first, free and offline.

The weak points holding it back:

1. **Too much at the door.** A first-time family at a party sees a huge menu.
2. **The page is heavy.** `docs/index.html` is 6.97 MB (it was 5.7 MB on
   23 Sep). The copy on the phone hides it for returning players; a first visit
   on a weak connection still waits.
3. **Content mistakes keep coming back** (trivia, proverbs, drawing words).
4. **Hardly anyone but us has played it.** Most polish was checked in headless
   Chrome; `notes/TO-TRY-ON-A-PHONE.md` is still open.
5. **No idea what people actually play.** Without any numbers every decision
   is a guess.
6. **The knowledge lives in one very long file** (GEMINI.md).

## What the big apps do that we can use

| App | What makes it work | What we take (within the owner's rules) |
|---|---|---|
| **Jackbox** ([Pack 12, fall 2026](https://www.gamingonlinux.com/2026/05/the-jackbox-party-pack-12-announced-for-release-later-this-year/), [streaming/accessibility features](https://www.jackboxgames.com/blog/streaming-moderation-accessibility-features-jackbox-party-pack-eight)) | Join from any browser with a code; **audience mode** so a group of 20 all take part; a family-friendly filter; **extended timers** for slow typers and kids; the host can moderate; a few polished games per pack, not 100 | An audience for room games past their player cap (vote, predict, cheer); a room-wide "extra time" switch; curated "packs" on the home |
| **Plato** ([Play store](https://play.google.com/store/apps/details?id=com.plato.android.mena&hl=en_US)) | 50+ games inside a chat; friends list with online status; clubs with weekly competitions; ranked games; no ads | We already have room chat and the night's leaderboard. Take the **"the group" idea**: a saved group (already on the phone) gets its own history: who won what, all-time table. No accounts needed |
| **Jawaker** ([site](https://www.jawaker.com/en/games)) | The Arab world's card games played properly: Tarneeb, Trix, Estimation, 41, Baloot, Jackaroo, Hand, Leekha; tournaments, weekly events | **Our biggest gap.** We have score keepers for إستميشن, طرنيب, تريكس, كونكان, باصرة, but you can't play them in a room the way you can play سكرو. Turn the best ones into real room games, plus جاكارو |
| **Gartic Phone / Kahoot** | Nothing to set up: open, share a link or QR, play. One screen explains the game | We already have the link and QR. What's missing is the **30-second explanation** before round one, and a "quick game" button that picks for you |
| **Heads Up / Psych!** | Themed packs that come and go (holidays, films, football) | **Seasonal packs**: Ramadan (فوازير), Eid, the World Cup, back to school, from the lists we already have, shown only in their season |
| **chess.com / Lichess** | Daily puzzles, streaks, reviews | Already done. Nothing to add here |

## The plan, part by part

Each phase is one release, tested the targeted way (CLAUDE.md step 5).

### Phase 1: the first five minutes (door, onboarding)
- **"الليلة دي" (tonight):** on the home, one question, *how many are you and
  how are you playing?* (one phone / everyone's phone / TV), and three picks
  for that answer. It uses the catalog's `players` and `modes`; no new content.
- **Curated packs**: rows like «سهرة عيلة», «لاتنين», «مسابقات», «ورق مصري»
  above the full catalog, so the 100 games are browsed as 5-6 shelves of 5.
- **A first round that teaches**: the first-play card becomes a short
  illustrated walkthrough for the ten most-played games (3 pictures, not text).
- **Hide what's rarely used** behind «كل الألعاب» once we have numbers (Phase 0).

### Phase 0: know what's played (before anything is cut)
- **Cloudflare Web Analytics** (free, no cookies, nothing personal, no banner
  needed) on play.3ashry.workers.dev: visits and first-visit load time.
- A **count per game started** on the rooms server (already a Durable Object
  pattern: `WordLog`), a number per game id and nothing else, read with the
  admin key like the Stop word log.

### Phase 2: speed (page size)
- Set a **budget**: the first paint under 300 KB compressed, the home under
  1.5 MB total.
- **Load games on demand**: the big 3D and heavy modules (chess and its
  review/puzzles/openings, golf, bowling, battleship, bank, the chess puzzle
  bank, trivia banks) move out of `index.html` into files the page fetches when
  the game opens, and the offline worker caches them after the first visit.
  `npm run check:size` fails the build past the budget.

### Phase 3: content you can trust
- A **«في غلطة؟» button** on every question, card and word: one tap sends the
  item's id to a log (the Stop word log's pattern). We fix from the list.
- One review pass per bank a month, with the checked rules already written in
  the trivia banks' headers.

### Phase 4: rooms for big groups (Jackbox's lessons)
- **Audience**: people past a game's maximum (or who join mid-round) get a
  role instead of a "wait" screen: vote for the best answer, bet on the winner,
  send reactions that show on the TV.
- **Extra time switch** for the room (kids, grandparents): every clock ×1.5.
- **End-of-night awards** (a share card): the night's champion, the best liar,
  the fastest answer, from the scores already kept.

### Phase 5: the Arab card table (Jawaker's lesson)
- In rooms with the TV and computer players, like سكرو and أونو:
  **طرنيب** first (the score keeper's rules are done), then **باصرة**,
  **إستميشن**, **تريكس**, and **جاكارو** (new). Each with every rule asked
  first, as always.

### Phase 6: coming back (retention without accounts)
- **Group history**: a saved group gets an all-time table and "last time"
  memory, on the phone.
- **Seasonal packs** from existing lists, dated.
- **Weekly challenge**: one shared puzzle a week in تحدي اليوم with a result
  card to send to the family group.

### Phase 7: polish and access
- A text size and colour-blind setting (the cards' red/yellow/green/blue get a
  symbol), bigger targets option, sound levels (music vs effects).
- Real-phone checklist nights: play three evenings with families who are not
  ours, write down every stumble, fix, close `TO-TRY-ON-A-PHONE.md`.

### Phase 8: keep it maintainable
- Split GEMINI.md: the overview and rules stay; each game's spec moves to
  `notes/games/<id>.md`, linked from it.
- Delete or fold games nobody plays (from Phase 0's numbers, the owner's call).

## Scoring the target

| Area | Now | After |
|---|---|---|
| First-time experience | 6 | 9 |
| Speed on a first visit | 6 | 9 |
| Content quality | 7 | 9 |
| Big groups | 7 | 9 |
| Game depth (Arab tables) | 8 | 10 |
| Coming back | 7 | 8.5 |
| Engineering | 9 | 9.5 |

## Questions for the owner

1. **Analytics**: OK to add Cloudflare Web Analytics (no cookies, nothing
   personal) and a per-game counter on the rooms server?
2. **Cutting**: once we have numbers, may rarely played games move behind
   «كل الألعاب», or even be removed?
3. **Tonight's picks and packs**: which shelves would you want (names)?
4. **Card games**: which first: طرنيب, باصرة, إستميشن, تريكس, جاكارو, بلوت?
5. **Audience in rooms**: yes? And in which games first?
6. **«في غلطة؟» reports**: OK to keep an anonymous list on the server like
   the Stop word log?
7. **Seasonal packs**: which seasons matter to your family (Ramadan, Eid,
   football, school)?
8. **Order**: Phase 0 and 2 first (numbers and speed), or Phase 1 first
   (the door)?

## The owner's answers (25 Sep 2026)

- **Apply all**, phase by phase, each live when done.
- **Order**: speed and numbers first (Phase 0 and Phase 2), then the first five
  minutes, content reports, big groups, card games, coming back, polish, upkeep.
- **Rare games** go behind «كل الألعاب» (still there and searchable).
- **The first card game in rooms: إستميشن**, every rule asked one at a time
  before building.
- **Seasonal packs: skipped for now.**

## Progress

- 25 Sep 2026: Phase 0 (the play counter, `npm run plays`), Phase 2 (the minified page, 6.97 → 4.6 MB, a 1,600 KB gzipped budget) and the first part of Phase 1 («الليلة دي؟», «ابدأوا بدول»). Still to do in Phase 1: the picture walkthroughs, and hiding rare games once a month of numbers is in. Cloudflare Web Analytics needs a token from the owner's dashboard.
- 25 Sep 2026, second batch: «في غلطة؟» reports (Phase 3: trivia board, emoji riddles, proverbs; `npm run reports`), the audience - cheers and "who'll win?" for watchers - and the night's share card (Phase 4), «ليالينا» in أرقامي (Phase 6), Settings → رموز للألوان (Phase 7). Left for later: the room-wide extra time (a change to each game's clock), lazy-loading the heavy games (Phase 2b), picture walkthroughs, hiding rare games (after a month of numbers), splitting GEMINI.md (Phase 8, after إستميشن merges).

## إستميشن in rooms: the owner's answers (25 Sep 2026)

- Bidding the Jawaker way: a trump auction first (tricks + suit, no-trump > ♠ > ♥ > ♦ > ♣, at least 4 tricks; all four pass = a new deal), the winner is the caller and names trumps; then the others call in turn and the last to call can't make the total 13.
- Dash (0 called before the bidding): allowed, two at most; ±33 under / ±25 over, or the Egyptian +33 / −23 as a lobby choice.
- Length: the host's choice, 18 by default (13 + 5 speed rounds) or 13.
- Speed rounds: no auction, trumps in a fixed order - ♠, ♥, ♦, ♣, no trumps; everyone calls, the last can't make 13.
- Computer players easy and hard fill the four seats; a turn clock off by default (30 / 60 s); the host's "play for".
- The look: the playing cards of كدّاب and الشايب (بلوكات), every trick animated to its winner.
- Helpers: the cards you may play lit; each seat's taken / called; the last trick on a tap.
- Scoring: the score keeper's rules as built (JS_CardRules.html).

## Our own touch, never a copy (the owner, 25 Sep 2026)

The owner: an idea from another app is only a starting point; it is rebuilt in the app's style with something only this app has - for new features and for the games we already have. Done so far: the audience's cheers are Egyptian shouts (برافو، جامد!، هههه، يا نهار!، يا رب، and a زغروطة that trills on the TV); a right guess is «عينهم صح»; the night card says «القعدة كانت لـ…».

Proposals for the games we have (the owner picks; each is asked before building):

1. **المعلّق (the commentator)**: one bank of short Egyptian lines for the big moments of every game - a comeback, a last-second win, a draw, a streak («يا سلام يا سلام!»، «رجعت من بعيد!») - on the TV and the phones, in the app's own voice (text, and the narrator's speech on the TV where there is a voice).
2. **عقاب الخسران (the loser's forfeit)**: at the end of a night the host can deal the night's last place a family forfeit from a clean list (يعمل الشاي، يغني مقطع، يقلد حد من القعدة...), turned over like the spy card.
3. **خمن الكلمة بالعامية**: a switch for Egyptian colloquial words (not only Fus-ha), and the day's word with a line about where it is said.
4. **أونو / كدّاب / الشايب table talk**: the phones shout the table's own words at the moment (أونو! as «واحدة!», كدّاب! with a stamp «بتكدب!», الشايب turning up with «يا خسارة»).
5. **Trivia «سؤال التيتة»**: a category of old Egyptian life (أفلام الأبيض والإسود، أغاني زمان، إعلانات التلفزيون القديمة) that the grandparents win.
6. **على راسك / بدون كلام «من القعدة»**: before a round, each person secretly adds a word about the family (a nickname, a joke of the family) into the deck.
7. **مافيا بصوت مصري**: the narrator's lines rewritten as an Egyptian storyteller (حكواتي), with a few lines picked at random each night.
