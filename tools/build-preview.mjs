/**
 * Assembles the Apps Script templates into one static page under .preview/ so
 * the app can be opened in a normal browser: include() calls are inlined, the
 * server-injected template vars get sample data and google.script.run is
 * stubbed. Serve it over http (not file://) — the app writes to localStorage,
 * which is blocked on file:// and data: URLs.
 *
 *   npm run build:preview
 *   npx http-server ../.preview     # or any static server
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name) => readFile(path.join(root, `${name}.html`), 'utf8');


// Stand in for the Apps Script runtime. The real server files are evaluated in
// the browser against fake Cache/Lock/ScriptApp services, so the preview runs
// the same room rules the deployment will — and because the fake cache is
// localStorage, two browser tabs behave like two phones in one room.
const SERVER_FILES = ['SpyWords.js', 'CodenamesWords.js', 'PartyContent.js', 'RoomGames.js', 'Rooms.js'];
const serverSource = (
  await Promise.all(SERVER_FILES.map((f) => readFile(path.join(root, f), 'utf8')))
).join('\n\n');
const stubSource = await readFile(
  path.join(root, 'tools', 'preview-server-stub.js'),
  'utf8'
);

// The real spy words, the same ones doGet injects.
const SPY_WORDS = new Function(
  (await readFile(path.join(root, 'SpyWords.js'), 'utf8')) + '\nreturn SPY_WORDS;'
)();

const STUB =
  '<script>\n' + stubSource + '\n</script>\n' +
  '<script>\n' + serverSource + '\n</script>';

let html = await read('Controller');

// Resolve <?!= include('X'); ?> the way HtmlService would.
const includes = [...html.matchAll(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g)];
for (const [tag, name] of includes) {
  html = html.replace(tag, await read(name));
}

// A ?room=CODE on the preview URL stands in for a scanned join link, the same
// way doGet forwards the real query parameter.
const previewRoom = process.argv.includes('--room')
  ? process.argv[process.argv.indexOf('--room') + 1] || ''
  : '';

html = html
  .replace('<?!= initialSpyData ?>', JSON.stringify(SPY_WORDS))
  .replace('<?!= initialRoom ?>', JSON.stringify(previewRoom))
  .replace('<?!= webAppUrl ?>', JSON.stringify('http://127.0.0.1:8777/index.html'))
  .replace('</head>', `${STUB}\n</head>`);

const leftover = html.match(/<\?!?=?[\s\S]{0,40}\?>/);
if (leftover) throw new Error(`unresolved template tag: ${leftover[0]}`);

const outDir = path.join(root, '.preview');
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'index.html'), html, 'utf8');

// Apps Script serves a web app inside a full-window iframe, and the app shell
// sizes itself with 100dvh. This wrapper reproduces that so the layout can be
// checked the way it will actually be served.
const IFRAME_HARNESS = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Apps Script iframe simulation</title>
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; }
  iframe { display: block; width: 100%; height: 100%; border: 0; }
</style>
</head>
<body><iframe src="./index.html" title="app"></iframe></body>
</html>
`;
await writeFile(path.join(outDir, 'iframe-test.html'), IFRAME_HARNESS, 'utf8');

console.log(`.preview/index.html written (${(html.length / 1024).toFixed(0)} KB)`);
console.log('.preview/iframe-test.html written (Apps Script iframe simulation)');
