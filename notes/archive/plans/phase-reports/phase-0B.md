# Phase 0B Report — The Other Banks

## Overview
Phase 0B addresses content accuracy, actability, and uniqueness across Charades (`JS_Charades.html`), Connections (`JS_Connections.html`), and Party Content (`PartyContent.js`). All 5 tasks (T0B.1 through T0B.5) have been executed and verified in accordance with the Phase 0B specifications in `notes/ROADMAP_RUNBOOK.md`.

---

## Tasks Summary

### T0B.1 — Three swimming strokes nobody can mime
- **Commit:** `35364d3`
- **Files touched:** `JS_Charades.html`
- **Acceptance Criteria:**
  - exactly one `سباحة` entry remains in the Arabic sports lists: **VERIFIED** (`git grep -n "سباحة" JS_Charades.html` returned exactly one match on line 200: `"إسكواش", "سباحة", "غطس", "ملاكمة", "مصارعة", "كاراتيه",`)
  - no word appears twice in `JS_Charades.html` (`npm run check` proves it): **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK")

### T0B.2 — Charades' proverbs are schoolbook Arabic
- **Commit:** `3618b11`
- **Files touched:** `JS_Charades.html`
- **Acceptance Criteria:**
  - none of the listed strings appears in `JS_Charades.html`: **VERIFIED** (`git grep -E "الوقت كالسيف|من حفر حفرة لأخيه|العلم نور والجهل ظلام|النظافة من الإيمان|لا تؤجل عمل اليوم للغد|في التأني السلامة|فاقد الشيء لا يعطيه|اتق شر الحليم إذا غضب|الصديق وقت الضيق|لسانك حصانك|من شب على شيء شاب عليه|الكترة تغلب الشجاعة|اللي يزرع يحصد|ألف قلبة ولا غلبة|الحركة بركة" JS_Charades.html` returned 0 matches, exit code 1)
  - the category still holds at least 40 entries: **VERIFIED** (Inspection evaluated `CHARADES_DB.ar["أمثال 📜"]` length at 70 entries, exceeding the 40-entry minimum)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK")

### T0B.3 — The same Connections group four times over
- **Commit:** `79550bc`
- **Files touched:** `JS_Connections.html`
- **Acceptance Criteria:**
  - no two puzzles in the Arabic lists share all four words of a group: **VERIFIED** (Script evaluated all ball sports groups across Arabic connections puzzles: EASY P13 kept as the single classic plain ball group; EASY P20, EASY P60, HARD P7, HARD P16, and HARD P38 each received distinct ball sport combinations ensuring all 6 groups are unique)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK", verifying no word repeats within any puzzle)

### T0B.4 — Golf is not a ball sport next to basketball
- **Commit:** `f5603f0`
- **Files touched:** `JS_Connections.html`
- **Acceptance Criteria:**
  - the group has no golf in it: **VERIFIED** (`git grep -n "Golf" JS_Connections.html` returned 0 matches, exit code 1; replaced with `'Football'`)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK")

### T0B.5 — Two party cards
- **Commit:** `f30b2ba`
- **Files touched:** `PartyContent.js`
- **Acceptance Criteria:**
  - `git grep "يعزّي"` returns nothing in `PartyContent.js`: **VERIFIED** (`git grep -n "يعزّي" PartyContent.js` returned 0 matches, exit code 1)
  - `npm run check` passes: **VERIFIED** (`cd tools && npm run check` printed "no problems found" and "i18n OK"; `cd rooms-worker && npm run test:rules` printed "all room rules pass")
