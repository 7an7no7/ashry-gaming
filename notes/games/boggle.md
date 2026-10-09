# شبكة الحروف — Letter Grid

Made by `npm run new:game` on 2026-10-09: games/boggle/ holds its code, its words and its rules.
What is there now is the starting game every new game gets (a secret number each, tap «+1»
until you reach it, the nearest wins). Replace it with the real game once the owner has
answered its rules and picked its look from a sheet of three (GEMINI.md, *How we work*).

## The owner's spec

(The rules as the owner answered them, one question at a time.)

## How it is built

- Rooms: `RoomBoggle.js` (the rules, ROOM_RULES.boggle), `JS_RoomBoggle.html` (ROOM_GAMES.boggle and TV_GAMES.boggle)
- One phone: `JS_Boggle.html` (setupBoggle, startBoggle, VIEW_RESTORE for a reload)
- Its words and rules: `boggle.text.js`.
