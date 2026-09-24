import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

// Read key and target address
const key = process.env.ASHRY_ADMIN_KEY;
if (!key) {
  console.error('Error: ASHRY_ADMIN_KEY environment variable is not set.');
  process.exit(1);
}

let address = process.argv[2];
if (!address) {
  try {
    const config = JSON.parse(readFileSync(path.join(here, 'site.config.json'), 'utf8'));
    address = config.roomsUrl;
  } catch (e) {
    console.error('Error reading tools/site.config.json:', e.message);
    process.exit(1);
  }
}

address = address.replace(/\/+$/, '');

// Load StopWords dictionary helper
const dictSrc = ['SpyWords.js', 'MonkeyWords.js', 'StopWords.js']
  .map((f) => readFileSync(path.join(root, f), 'utf8'))
  .join('\n;\n');
const { stopWordKnown } = new Function(dictSrc + '\nreturn { stopWordKnown };')();

try {
  const res = await fetch(`${address}/stop-words`, {
    headers: { Authorization: `Bearer ${key}` }
  });

  if (!res.ok) {
    console.error(`Request failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const list = await res.json();
  if (!Array.isArray(list) || !list.length) {
    console.log('No stop words logged.');
    process.exit(0);
  }

  // Group by language and category
  const groups = new Map();
  for (const item of list) {
    const lang = item.lang || 'ar';
    const cat = item.cat || '';
    const gKey = `${lang}:${cat}`;
    if (!groups.has(gKey)) groups.set(gKey, []);
    groups.get(gKey).push(item);
  }

  for (const [gKey, entries] of groups) {
    const [lang, cat] = gKey.split(':');
    entries.sort((a, b) => b.n - a.n);
    console.log(`\n=== [${lang.toUpperCase()}] ${cat} (${entries.length} entries) ===`);
    console.log('Count | In Dict | Word');
    console.log('------+---------+---------------------');
    for (const item of entries) {
      const known = stopWordKnown(lang, cat, item.word);
      const knownStr = known === true ? 'yes' : known === false ? 'no' : 'n/a';
      console.log(`${String(item.n).padStart(5)} | ${knownStr.padEnd(7)} | ${item.word}`);
    }
  }
} catch (err) {
  console.error('Failed to fetch stop words:', err.message);
  process.exit(1);
}
