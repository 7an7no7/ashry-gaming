# The night of 25-26 Sep 2026: what was done

## Published (live on both addresses, pushed to GitHub)
- **The play counter**: `npm run plays` (with the admin key) shows how often each game is started.
- **A lighter page**: 6.97 MB → 4.7 MB, about 25% less on a first visit, with a size budget that fails the build if it grows past it.
- **The home**: «الليلة دي؟» (how many are you, how are you playing → three games) and «ابدأوا بدول» for a first visit.
- **«في غلطة؟»**: a report button under the answer in دوري المعرفة, فوازير إيموجي and كمّل المثل; read the reports with `npm run reports`.
- **The audience**: people watching a room game get Egyptian shouts (برافو، جامد!، يا نهار!، a زغروطة on the TV) and "مين هيكسب؟". Right guesses are announced in the chat as «عينهم صح».
- **The night**: a share card «القعدة كانت لـ…», and «ليالينا» in أرقامي.
- **Settings → رموز للألوان**: shapes next to the colours on أونو cards, for colour-blind players.
- **إستميشن in rooms**, built to your 8 answers.
- **A stylesheet bug fixed**: a missing brace made باغ هاوس, شطرنج الأربعة and more lay out only on phones set to reduced motion.

## Merged on this computer, NOT published yet
Five of the seven reviews are merged: duels/chess/sports, quizzes, word games, party games, and the app shell + tools + puzzles. The card and table games review is merged too. The per-area reports in this folder list every change and every question: duels.md, quiz.md, words.md, party.md, shell.md, table.md.

Highlights:
- **Wrong answers and family-unfit content fixed**:
  - trivia: the largest living thing on land isn't the elephant;
  - emoji films: adult films replaced;
  - لو خيروك / مين أكثر واحد: about 100 prompts about death, gambling, weight and romance replaced;
  - Wavelength rewritten in Egyptian, its duplicates replaced;
  - obscure Wordle and Connections words replaced.
- **Numbers and counters drawn backwards in Arabic**, fixed in many games: "3 / 1", "10+", "50 - 1".
- **Help texts that contradicted their games**: about 15 corrected.
- **Room errors**: now in English on an English phone, and the room lines in Egyptian Arabic.
- **Chess**: opening names corrected, and the coach's sentences now fit every piece.
- **Two flaky tests fixed**: the chess 1200 mate-in-one check and the proverbs leak check.

## Left to do
1. **The deduction games review was stopped by the usage limit** before it committed. Its unfinished changes are in `.claude/worktrees/agent-a7bddf4987e72a9fa`. It needs finishing, or its changes checked and merged.
2. **One test failure after the last merge**: in `test:rules`, the leak check "guessnum … at night.p4". A secret number matched a night score of the same value. That is the known trap "a number secret is any count", so the check needs to ignore `night`; it isn't a real leak. Fix the probe, then run `test:rules`, `npm test`, `ONLY=screens,rooms npm run test:ui`, build the site, deploy the rooms server and the site, run `test:live`, push, and run `check:live`.
3. **Mini golf's "next hole starts by itself"** failed in 2 of 4 live runs. A direct probe of the live server showed it starts on time (7.1-7.6 s), so it looks like a busy test machine.
4. **The C: drive has about 2.2 GB free**, which is why the review ran 3 at a time.
5. **Your questions** are at the end of each area report: named celebrities, الأهلي vs الزمالك, the property-type bomb categories, Israel in ربع قرد's lists, how player counts should count computer players, and more.
