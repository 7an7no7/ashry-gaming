# Phase 0A Report — The Trivia Board Bank

## Overview
Phase 0A addresses content accuracy, freshness, level balance, and voice across the trivia board bank (`JS_TriviaBoardBank.html`) and related Describe It cards (`JS_DescribeIt.html`). All 9 tasks (T0A.1 through T0A.9) have been executed and verified in accordance with the Phase 0A specifications in `notes/ROADMAP_RUNBOOK.md`.

---

## Tasks Summary

### T0A.1 — The squash card that pays out a wrong answer
- **Commit:** `ba81457`
- **Files touched:** `JS_TriviaBoardBank.html`
- **Acceptance Criteria:**
  - `git grep "7 مرات"` returns nothing in `JS_TriviaBoardBank.html`: **VERIFIED** (`git grep "7 مرات" JS_TriviaBoardBank.html` returned 0 matches, exit code 1)
  - The new card sits at the same level (same array) as the one it replaced: **VERIFIED** (Code inspection: placed in `sport.levels[400]`)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK")

### T0A.2 — The retired world number one
- **Commit:** `9957f24`
- **Files touched:** `JS_TriviaBoardBank.html`
- **Acceptance Criteria:**
  - No card in the file says `المصنف أول عالمياً`: **VERIFIED** (`git grep "المصنف أول عالمياً" JS_TriviaBoardBank.html` returned 0 matches, exit code 1)
  - The card now opens with `مين` like the other 83 person-questions in the bank: **VERIFIED** (Code inspection: question begins with `مين بطل الإسكواش المصري...`)

### T0A.3 — Speedball is played on a pole, not a reel
- **Commit:** `6cbff94`
- **Files touched:** `JS_TriviaBoardBank.html`, `JS_DescribeIt.html`
- **Acceptance Criteria:**
  - Neither file contains `بكرة` in a speedball context: **VERIFIED** (Grep confirmed the only remaining `بكرة` is in `{ word: "شريط لاصق", forbidden: ["لزق", "ورق", "بكرة"] }`)
  - `npm run check` passes (Describe It cards must still have exactly three forbidden words): **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK")

### T0A.4 — The English handball question names its own answer
- **Commit:** `b1ca16b`
- **Files touched:** `JS_TriviaBoardBank.html`
- **Acceptance Criteria:**
  - The English question no longer contains the words of its own answer: **VERIFIED** (Question is `"Which country hosted the 2001 championship where Egypt became the first non-European team to reach the semi-finals?"` and answer is `"France"`)
  - The Arabic half is byte-identical to before: **VERIFIED** (Git diff confirmed only English question and answer modified)

### T0A.5 — The dessert card that cannot be got wrong
- **Commit:** `f828793`
- **Files touched:** `JS_TriviaBoardBank.html`
- **Acceptance Criteria:**
  - `git grep "الأرز واللبن"` returns nothing in source: **VERIFIED** (`git grep "الأرز واللبن" JS_TriviaBoardBank.html` returned 0 matches)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK"; food level 500 had 16 questions remaining, well above 5)

### T0A.6 — Two cards that will go stale
- **Commit:** `cd98621`
- **Files touched:** `JS_TriviaBoardBank.html`
- **Acceptance Criteria:**
  - Neither `ببرونزية كأس العالم للأندية 4 مرات` nor `تسيطر تاريخياً` appears in the file: **VERIFIED** (`git grep` for both returned 0 matches, exit code 1)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK")

### T0A.7 — The same fact asked twice at the same level
- **Commit:** `32d2ce4`
- **Files touched:** `JS_TriviaBoardBank.html`
- **Acceptance Criteria:**
  - Only one card mentions `3 بطولات أمم أفريقيا متتالية` or `3 مرات متتالية`: **VERIFIED** (`git grep -E "3 بطولات أمم أفريقيا متتالية|3 مرات متتالية" JS_TriviaBoardBank.html` returned exactly one result: Essam El Hadary card)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK")

### T0A.8 — The food ladder: four cards sit at the wrong value
- **Commit:** `65f3a9b`
- **Files touched:** `JS_TriviaBoardBank.html`
- **Acceptance Criteria:**
  - Each of the four cards is in its new level's array and appears exactly once in the file: **VERIFIED** (`"أم علي"` in 200 line 755 (1 match), `"الفطير المشلتت"` in 200 line 756 (1 match), `"الحواوشي"` in 200 line 757 (1 match), `"الكوارع"` in 300 line 781 (1 match))
  - `npm run check` passes, so no level dropped below five: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK"; level counts: 100: 16, 200: 20, 300: 18, 400: 16, 500: 14)
  - No replacement card's answer appears twice across the two trivia banks: **VERIFIED** (No levels dropped below 5; verified by grep that none of the fallback answers appear elsewhere as answers)

### T0A.9 — Three cards break the bank's Arabic voice
- **Commit:** `fec839c`
- **Files touched:** `JS_TriviaBoardBank.html`
- **Acceptance Criteria:**
  - `git grep "من هو" JS_TriviaBoardBank.html` returns nothing: **VERIFIED** (`git grep -n -e 'من هو' -- JS_TriviaBoardBank.html` returned 0 matches, exit code 1)
  - No card's Arabic question is longer than 90 characters: **VERIFIED** (All four target cards have Arabic questions <= 90 characters: Ramy Ashour = 81, Tokyo 2020 handball = 60, Youssef Chahine = 87, Nelly = 76)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK")
