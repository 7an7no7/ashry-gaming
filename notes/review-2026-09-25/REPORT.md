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

## The review of every game (all seven areas, published 26 Sep 2026)
The per-area reports in this folder list every change and every question: duels.md, quiz.md, words.md, party.md, table.md, deduction.md, shell.md.

Highlights:
- **Bugs a player would hit**: one-phone المختلف dealt blank cards (live since it shipped); مافيا's night was a navy block over the whole screen; a reload ended الحرباء, الموقع السري and تشابه; باغ هاوس had no layout; room errors were Arabic on an English phone; بنك الحظ's one-die card said ×10 instead of ×20.
- **Wrong or unfit content**: trivia answers, adult films in the emoji riddles, about 100 لو خيروك / مين أكثر واحد prompts (death, gambling, weight, romance), the Wavelength scales, the spy words (about 55 twins), Fibbage facts, obscure Wordle / Connections / charades words; قبل ولا بعد went from 22 to 42 cards.
- **Numbers backwards in Arabic** ("3 / 1", "10+", "50 - 1") fixed across many games; suit symbols in Arabic score keepers now words.
- **Wording**: many lines made Egyptian and fit any name («اللي كسب: …», role-as-subject sentences); about 15 Help texts that contradicted their games corrected.
- **Chess**: opening names, the coach's sentences, names cut off at 375.
- **Tests**: three flaky checks fixed (chess 1200 mate-in-one, the proverbs and guessnum leak checks).

## Still open
- Your questions at the end of each area report (celebrities, الأهلي vs الزمالك, property-type bomb categories, Israel in ربع قرد's lists, an English spy-word list, how player counts count computer players, and more).
- Not checked by the reviewers: a real iPhone (sound, vibration, tilt, install); كدّاب and الشايب were only read, not played; a whole room game of bowling or golf.
- The C: drive filled up once in the night; with more space now this is no longer a problem.
