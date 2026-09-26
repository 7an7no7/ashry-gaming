# Review of 25-26 Sep 2026: the party games (area "party")

Reviewer 3. I played on the local rooms server (port 8803) and preview (4353) in headless Chrome with motion on. The room had three phones and a TV: منى as host (375×812, Arabic light), Sara (375×812, English dark), كريم (667×375, Arabic light) and the TV (1280×720, then 1920×1080).

## Checks run
- `cd tools && npm run check`: no problems, i18n OK.
- `cd rooms-worker && npm run test:rules`: passes. Two random checks failed once each and passed when run again. Neither is in my area:
  - `proverbs: LEAK: cards to come stay on the server` failed once in five runs. It is probably two proverbs that share an answer word.
  - `estimation bots: a hard computer player makes its call more often than an easy one (41% against 47%)` is a statistics check.
- `node test/play-all.mjs http://127.0.0.1:8803`: **2330 passed, 0 failed**.

## What I played, per game
- **القنبلة, one phone** (375, Arabic): setup, a round, a reload mid-fuse (it came back ticking), the boom, choosing who held it (tapping the same name again takes it back), a second round, and the end podium with a tie for second.
- **القنبلة, room**: three phones and the TV. I played a pass and a boom, and saw the strikes board.
- **أتوبيس كومبليت, one phone**: a letter, وقف, the score table. **Room**: I started it with «متسامح» on, pressed وقف, and saw the review table on the phone and the TV.
- **لو خيروك, room**: a vote to the results on the phones and the TV.
- **مين أكثر واحد, room**: a vote, the results and the standings (phone in English dark, and the TV).
- **على نفس الموجة, room**: a clue, the dial moved from another phone, the host locking it, the result.
- **زي الكل, room**: answers typed on three phones, grouped (قطة and القطه came out as one answer), then scored with the sheep. I looked at the reveal on the TV at 1280 and 1920.
- **الجرس, room**: two presses, the order shown on the phone and the TV.
- **خمس ثواني, room**: «ابدأ» from the player up, the ring counting down on the phone and the TV.
- **على راسك, one phone**: the deck counts in both languages, a turn (the ready screen, then a card sideways at 667×375), answers, and the end-of-turn list.
- **The room lobby and hub** on the phones and the TV. I went back and forth between the hub and every game above.
- **The audience bar**: a watcher in a كونكت ٤ duel (the third person in the line) at 375×812 and 667×375, in Arabic light and English dark, with a rotation while the bar was showing.
- I reloaded every phone and the TV mid-game (كونكت ٤): everything came back to its screen.
- I opened Help 📘 on each play and room screen of my games. Every one maps to a topic that has rules.
- Console: no errors. The only lines were Chrome refusing to buzz before a tap, which a headless browser always logs.

## Fixed (UI)
- **القنبلة, one phone** (`JS_Bomb.html`): the boom screen's sticky bar had three full-width buttons stacked (about 170px), which covered the strikes board. «إنهاء اللعبة» and «خروج» now share one row under «جولة جديدة».
- **القنبلة, room** (`JS_RoomBomb.html`, new keys `bomb_room_category_hint` and `bomb_room_letter_hint` in `JS_Core.html`): the card said «ومرّر الموبايل» ("pass the phone"). In a room nobody passes a phone: it now says «ومرّر القنبلة» ("pass the bomb").
- **مين أكثر واحد / لو خيروك / فيبج results** (`Style.html`, `.result-list + .scoreboard`): the heading «الترتيب / Standings» sat directly on the last result card. It now has a gap above it, on the phones and the TV.
- **على نفس الموجة**:
  - The psychic's name after "Psychic:" and in "waiting for a clue from …" is now held in `<bdi>`. An Arabic name in an English line had moved the colon to the wrong side. Fixed on the phone (`JS_RoomWavelength.html`) and the TV (`JS_RoomTv.html`).
  - The hint «اضبط المؤشر حسب التلميح:» ended on a colon with nothing after it. It now reads «حرّكوا المؤشر على حسب التلميح» / "Turn the dial to match the clue".
- **زي الكل on the TV** (`Style.html`): the grouped answers were tiny chips (the `--tv-xs` size) in the middle of an empty screen, too small to read from the sofa. They now use `--tv-md` with the TV gap.
- **الجرس on the TV** (`JS_RoomTv.html`): the queue chip «2. Sara» came out as «Sara .2» in Arabic. It is now the number as a `.metric` plus the name in `<bdi>`.
- **Counters written "1 / 2" in Arabic lines**: this is the trap in GEMINI.md, where the numbers come out reversed. They now go through `ltrFrac`:
  - خمس ثواني's round, on one phone, in a room and on the TV (`JS_FiveSeconds.html`, `JS_RoomFiveSeconds.html`, `JS_RoomTv.html`)
  - the vote count «صوّت: 0 / 3» (`JS_RoomVoting.html`)
  - زي الكل's «اتكتب: 2 / 3», on the phone and the TV (`JS_RoomHerd.html`)
- **The audience bar** (`JS_RoomAudience.html`, `Style.html`):
  - On a phone on its side it was a two-row card (about 120px) over the bottom third of the board, and it ran over the nav rail. It now clears the rail. On a short landscape screen its two rows sit side by side in one strip (about 52px), and the page's bottom padding follows.
  - The bar is placed from the nav's position, but that was measured only on the room's changes. After rotating the phone to portrait it stayed at the foot, covering the bottom tabs. It is now placed again on `resize`.
- **على راسك** (`JS_Core.html`): the end of a turn said «2 كلمات صح», which is wrong Arabic grammar for 2. The heading now says «2 صح».
- **Help text** (`GAME_RULES` in `JS_Core.html`):
  - أتوبيس كومبليت's rules now explain the host's «متسامح» switch, in Arabic and English.
  - الموجة's Arabic rules were stiff Fus-ha («وحده»، «تلميحاً واحداً»، «مفهومين متناقضين»). They are Egyptian now.

## Content changes
I checked every earlier finding against the current file before applying it. List sizes are unchanged, and `PartyContent.js` stays server-only.

### PartyContent.js: لو خيروك (ar 472 / en 484)
I replaced 35 Arabic and 32 English pairs.
- **Family-safe, removed**:
  - the day and way you die
  - laughing at a funeral
  - the lottery (replaced by a treasure)
  - 200 years vs 60, and 100 ordinary years vs 50 of adventure
  - being lighter by 10 kg, and eating without gaining weight
  - "who has a crush on you" and "your soulmate"
  - a phone ringing **during prayer**, now "in the middle of a film at the cinema"
  - «تقول بحبك للمدرس» ("say I love you to the teacher"), now «يا ماما» ("mum")
  - eating insects, now eating a whole lemon
- **Duplicates, replaced**: space vs the ocean floor, every language vs every instrument, the future vs the past (the same idea four times), no AC vs no internet, songs vs films, traffic vs walking, pausing vs rewinding time, train vs plane, ancient Egypt vs the future, the exam pairs.
- **Confusing or with an obvious answer, replaced**: the queue pair, "choose your food but eat alone", 4 hours of sleep vs 10, sunglasses at night vs "wearing an umbrella", "get lost in the city or the desert", a first flight vs a boat in a storm.
- **The new pairs** keep each theme: a Arabic dialect vs imitating voices, oral vs written exams, a house on the Nile vs one in the mountains, a glider vs a submarine, a night in a tent vs one in a boat's cabin, a day as a farmer vs as a fisherman, writing with your left hand vs eating with it, and others.
- **MSA to Egyptian**: «سيارة» to «عربية», «بدون» to «من غير», «التيك توك» to «النت / الموبايلات».

### PartyContent.js: مين أكثر واحد (ar 723 / en 723)
I replaced 18 Arabic and 15 English prompts.
- **Family-safe, changed**:
  - a car crash, now parking a metre from the kerb
  - president, now head teacher
  - most children, now the biggest house in the family
  - a wedding anniversary, now a brother's birthday
  - a diet, now "decides on Monday to wake up early"
  - nail-biting
  - clothes that no longer fit
  - writing a poem to someone
  - sleeping through an earthquake
  - the lottery, now "a fortune" (en)
- **Duplicates, replaced**: a social-media star (a repeat of "famous online"), owning a big company, "become a teacher", a fifth "cries at the end of a cartoon".
- **Fixed wording**:
  - «الناس تقفله وتسقفله» was garbled.
  - «يبكي» is now «يعيط».
  - «يكلم الغرب في القطر» was a typo, now «ناس ميعرفهمش».
  - «يخاف من الحمام» could mean the bathroom or pigeons. It now says «الحمام اللي في الشارع» ("the pigeons in the street").
- I reviewed the English list to the end (the earlier pass stopped around line 2099). Nothing else needed changing.

### PartyContent.js: على نفس الموجة (ar 349 / en 347)
- I rewrote the first 65 Arabic spectra from stiff Fus-ha to Egyptian (for example «باهظ الثمن للغاية» became «غالي أوي», «أخرق» became «بيتكعبل دايماً»). I made the English ones plain («Opulent Palace» became «Spotless palace», «Temporary Fleeting» became «Over in a moment»).
- **Not one scale, fixed**: spicy vs sweet (now «مش حرّاق خالص ↔ حرّاق نار»), scary vs funny, documentary vs sci-fi.
- **Not family, replaced**: family-friendly vs not, a first date, romantic vs not, an unsafe website.
- **63 Arabic and 61 English duplicates replaced** with new single-scale spectra. Examples: دمه تقيل ↔ دمه خفيف, منحوس ↔ محظوظ, بيحب الروتين ↔ بيحب التغيير, مكان تروحه بالشبشب ↔ لازم تروحه بجزمة, بتاع جيل جدو ↔ بتاع جيل دلوقتي, طفل مؤدب ↔ طفل شقي, في رمضان بس ↔ طول السنة, القطط بتحبه ↔ القطط بتكرهه.

### BombPrompts.js
These prompts are also used by خمس ثواني and زي الكل.
- **en, too hard for a family table**: 'Words borrowed from other languages', 'Pasta shapes', 'Cheeses', 'Dance styles', 'Currencies', 'Islands' and 'Italian dishes' were replaced. The new ones are 'Things in a toy shop', 'Things you eat with a spoon', 'Things in a lunchbox', 'Things at a wedding', 'Things at a sports club', 'Things at a birthday party' and 'Ramadan dishes'.
- **ar**: I replaced «أنواع رقص» ("kinds of dance"), «كلمات إنجليزي بنقولها في العربي» ("English words we say in Arabic"), «أكلات إيطالية» ("Italian dishes") and «عملات» ("currencies"). The new ones are «حاجات في الفرح», «حاجات في محل اللعب», «أكلات بنعملها في رمضان» and «حاجات في النادي».

### Not changed
- **StopWords.js**: it is a dictionary for accepting words, not something dealt to players. Nothing is shown from it, so a bigger list is better; I found nothing unsafe to remove. The ten Stop categories are fine.
- **HU_DECKS** (على راسك): this is only a mapping to other areas' lists. Every deck resolves in both languages: mix 1832/1626 words, movies 284/151, people 203/129, and so on.
  - The sports, vehicles and instruments categories of بدون كلام ("Charades") are in no deck, so they never come up in على راسك.
- **زي الكل's prompts** are the Chameleon categories plus the bomb's categories that aren't "حاجات…" ("things…"), so the bomb changes above reach it.

## Questions for the owner (left as they are)
- Items that may not suit a family table:
  - Height: «أطول/أقصر واحد في العيلة» (tallest or shortest in the family), «شخص قصير ↔ طويل جداً» (a short person ↔ a very tall one)
  - «تتفرج على فيلم رومانسي مع أبوك» (watch a romantic film with your dad)
  - «الرقص الشرقي ↔ الباليه» (belly dance ↔ ballet)
  - «رئيس الأهلي ↔ رئيس الزمالك» (president of Al Ahly ↔ of Zamalek)
- Named celebrities that may date: عمرو دياب، أحمد حلمي، صلاح وميسي.
- YouTube vs WhatsApp.
- «يتجوز الأول في المجموعة» (the first in the group to marry) and the wedding-planning prompts.
- Keep or cut?
- **BombPrompts, categories that name a property, not a kind**: «حاجات ليها زراير» (things with buttons), «حاجات مدورة» (round things), «حاجات بتطير» (things that fly) and the colours. They go against the "a kind of thing" rule. These are flagged only, not removed.
- **على راسك's movies deck** (from بدون كلام's list, another reviewer's area) deals «الراقصة والسياسي» (a film about a belly dancer and a politician) and «الإرهاب والكباب» (a comedy with "terrorism" in its title). Are they OK for a family?
- **Stop's score table**: the total column is headed «Σ». A family may not read it; «المجموع» ("the total") would be wider. Change it?

## Seen but not fixed
- The English header truncates «Would You Rather» and «Herd Mentality» at 375px next to the chat, sound and gear icons. It is a site-wide header matter.
- Stop's score table scrolls sideways at 375px with five categories. It scrolls, so nothing is lost.
- On a phone on its side, the audience strip still covers the lowest row of a duel board. It is much less than before; making it collapsible would be a bigger change.

## What I could not check
- A real iPhone (sound, the tilt in على راسك, the safe areas).
- The bomb's fuse running out naturally in a room (I only saw the boom state).
- Every one of the roughly 1,500 changed and kept prompt lines, read aloud to a family. I read them all on screen.
