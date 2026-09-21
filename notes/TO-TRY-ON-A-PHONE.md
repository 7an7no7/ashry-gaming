# What still wants a real phone, a real TV or a real table

Everything in the September 2026 roadmap is built, tested and live. These are
the things a script could not settle — gathered from the "Not verified" section
at the end of each report in `phase-reports/`, which still hold the detail and
how each phase was checked.

Nothing here is known to be broken. They are the judgement calls and the
device-specific paths that only get answered by playing.

---

## The one to try first

**The مافيا narrator has never been heard by anybody.** It ships off by default
for exactly that reason (Settings are in the Mafia lobby: «الراوي يقرأ بصوت
عالي»). Turn it on for one round and listen.

- How it sounds at all: the voice, the pace (`rate: 0.95`) and the wording of
  the five lines are guesses until you hear them.
- **On an iPhone**, speech only starts inside a tap. `speakPrime` runs on the
  first tap anywhere in the app, which is the documented way, but it has not
  been tried on iOS. If it is refused the narrator simply never speaks — by
  design, and silently.
- **Which Arabic voice** a phone picks: it takes the first whose language starts
  with `ar`, which on a phone with several may not be the best one. If it reads
  badly, choosing by `voice.name` is a small change.
- **A TV with no Arabic voice at all** (likely on a streaming stick) stays
  silent. That is intended, but it means the narrator may do nothing on exactly
  the device it was written for.

## The share card on an iPhone

**`navigator.share` with a file.** The picture is built before the call, but
`canvas.toBlob` is asynchronous and iOS is strict about a share happening
inside the gesture. If it refuses, the card falls through to a download — which
on iOS Safari opens the picture rather than saving it. This is the one thing
that has to be tried on your own phone.

- Whether the card reads as a WhatsApp thumbnail (it is 1080×1920, the shape
  WhatsApp and Instagram stories expect).
- On a cold cache, whether Cairo has loaded by the moment of the tap.

## The two new games, at a table

**العقل** is the one game whose whole quality is timing, and it cannot be judged
from a screenshot: does the silence work, and does the tension read without a
turn indicator? Also a level at twelve cards each on a 375px phone — they wrap,
but twelve of them may be a lot to read and tap.

**قبل ولا بعد**: whether 22 events is enough for an evening (a second game
re-deals most of the same cards — the table will notice before the app does);
the line on a TV once it is ten or twelve cards long, where it scrolls sideways
and nobody is touching the screen; and whether an Arabic table reads a
left-to-right timeline naturally. The rule (a physical axis stays LTR) is the
app's own and the numbers agree with it, but only you can say how it feels.

## The four table games of 21 Sep, in your hands

أونو, الدومينو, كونكت ٤ and نقط ومربعات were played to the end in the browser
by script and by robots (1381 checks), at every screen size. What only fingers
can answer:

- **كونكت ٤**: dragging along the board to aim and letting go to drop, on an
  iPhone - and that a vertical swipe still scrolls instead of dropping a disc.
- **نقط ومربعات on 8x8**: whether the nearest line under a finger is the one
  you meant, on a 375px phone.
- **أونو's jump in and امسكه!** are races. Whether one tap is quick enough, and
  whether a hard computer player catches you too soon or too late (it waits
  about two seconds).
- **الدومينو**: a tile that fits one end plays on one tap; one that fits two
  asks which end. Whether that feels right at a real table, and whether the
  computer players' pace (about a second a move) is right.

## Motion, where it actually runs

Everything in the motion batch was verified with `document.hidden` overridden,
because the Browser pane runs hidden and stills every animation. On a real
phone:

- The وقف slam through a real round with several phones, and Mafia's night/day
  cross-fade through a real night.
- The «خمّن صح» stamp over a **real** drawing — it was measured against a
  stand-in, and a real canvas is what gives `.draw-wrap` its size.
- The last-three-seconds rim through a real room round. It is drawn at the root
  of the current view; every view carrying one of those clocks is about one
  screen tall, but a view that scrolled would push the rim's top and bottom
  edges off-screen (its side edges would still show).
- The end-of-game titles on a real TV, where `.tv-scale` does the sizing.
- Two phones finishing a game and watching the night's points land.

## Wording, which is yours to judge

- `⚡ أسرع واحد` and `🎭 أحسن كداب` read aloud at a table.
- The narrator's five lines.

---

## And one thing waiting on a decision, from before the roadmap

**Two طرنيب ٤١ rules** the scorer does not guess at — see *Waiting* in
`GEMINI.md`: what a failed bid of 13 should score, and who wins when both teams
qualify in the same round.
