/**
 * A fingerprint of everything the rooms server runs: the files build.mjs
 * bundles (FILES) and src/. build.mjs writes it into generated/rules.js,
 * /health reports it, and tools/check-live.mjs compares it with this folder's,
 * so "is the server running what is here?" doesn't depend on when anything
 * was committed or deployed. Line endings are ignored: a checkout may have
 * either.
 */
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

/** The FILES list, read out of build.mjs so there is one copy of it. */
export async function serverFiles() {
  const src = await readFile(path.join(here, 'build.mjs'), 'utf8');
  const list = ((/const FILES = \[([^\]]*)\]/.exec(src) || [])[1] || '').match(/'[^']+'/g) || [];
  return list.map((f) => f.slice(1, -1));
}

export async function rulesFingerprint(files) {
  const hash = createHash('sha256');
  const add = async (label, file) => {
    hash.update(label + '\n');
    hash.update((await readFile(file, 'utf8')).replace(/\r\n/g, '\n'));
  };
  for (const f of files || await serverFiles()) await add(f, path.join(root, f));
  for (const f of (await readdir(path.join(here, 'src'))).filter((x) => x.endsWith('.js')).sort()) {
    await add('src/' + f, path.join(here, 'src', f));
  }
  return hash.digest('hex').slice(0, 16);
}
