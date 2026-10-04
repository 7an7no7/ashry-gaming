# Stockfish (the chess coach and review)

`sf19-lite.js` and `sf19-lite.wasm` are Stockfish 19, the "lite single-threaded"
build of Stockfish.js (npm `stockfish@19.0.0`: `bin/stockfish-19-lite-single.js`
and `.wasm`, renamed), by Nathan Rugg / Chess.com, based on Stockfish by the
Stockfish developers. https://github.com/nmrugg/stockfish.js and
https://github.com/official-stockfish/Stockfish

License: GPLv3, `Copying.txt` here. The app's source is public
(https://github.com/7an7no7/ashry-gaming), which the GPL asks for.

`tools/build-site.mjs` and `tools/build-preview.mjs` copy the two files into
`g/` beside the games' chunks (the offline copy keeps them like a chunk);
`JS_ChessStockfish.html` runs them in a Web Worker. To update: replace the two
files with a newer lite-single build, rename them (`sf20-lite.*`) and change
`CH_SF.file` - a new name, so phones fetch it again.
