/**
 * Opens, updates or closes the GitHub issue a scheduled check writes (7 Oct 2026, the owner:
 * "a robot that says when something broke" and "a monthly look at what is played"). Run by
 * .github/workflows/weekly-check.yml and monthly-plays.yml with the workflow's own
 * GITHUB_TOKEN (permissions: issues: write) - no other service, nothing to look after. GitHub
 * emails the owner on a new issue and on every comment.
 *
 *   node ci-issue.mjs --mode=upsert --label=weekly-check --title="…" --body-file=report.md
 *       the open issue with the label gets the report as a comment; none open: a new issue
 *   node ci-issue.mjs --mode=close --label=weekly-check --body-file=fine.md
 *       the open issue with the label gets the comment and is closed; none open: nothing
 *   node ci-issue.mjs --mode=once --label=monthly-plays --title="Plays in 2026-09" --body-file=plays.md
 *       a new issue unless one with this title and label already exists (open or closed)
 *
 * DRY_RUN=1 prints what it would do, the body included, and calls nothing (no token needed).
 * Needs GITHUB_TOKEN and GITHUB_REPOSITORY (owner/name), which Actions sets; the label is
 * made the first time it is needed.
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const mode = opt('mode');
const label = opt('label');
const title = opt('title');
const body = opt('body-file') ? readFileSync(opt('body-file'), 'utf8') : '';
const DRY = !!process.env.DRY_RUN && process.env.DRY_RUN !== '0';
const REPO = process.env.GITHUB_REPOSITORY || '';
const TOKEN = process.env.GITHUB_TOKEN || '';
const COLOURS = { 'weekly-check': 'd93f0b', 'monthly-plays': '5319e7' };

if (!['upsert', 'close', 'once'].includes(mode) || !label || (mode !== 'close' && (!title || !body))) {
  console.error('usage: node ci-issue.mjs --mode=upsert|close|once --label=… [--title=…] --body-file=…');
  process.exit(2);
}
if (!DRY && (!REPO || !TOKEN)) {
  console.error('GITHUB_TOKEN and GITHUB_REPOSITORY are needed (DRY_RUN=1 to try it without them)');
  process.exit(2);
}

async function gh(method, path, data) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });
  const text = await res.text();
  if (!res.ok && !(method === 'GET' && res.status === 404)) throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
  return { status: res.status, data: text ? JSON.parse(text) : null };
}
const dry = (what) => { console.log(`DRY_RUN: would ${what}`); };
const showBody = () => console.log(`----- body -----\n${body}\n----------------`);

async function ensureLabel() {
  if (DRY) return;
  const got = await gh('GET', `/labels/${encodeURIComponent(label)}`);
  if (got.status === 404) await gh('POST', '/labels', { name: label, color: COLOURS[label] || 'ededed', description: 'Written by a scheduled check (.github/workflows)' });
}
// Issues only: the issues list also returns pull requests, which carry `pull_request`.
async function issuesWithLabel(state) {
  if (DRY) return [];
  const got = await gh('GET', `/issues?labels=${encodeURIComponent(label)}&state=${state}&per_page=100`);
  return (got.data || []).filter((i) => !i.pull_request);
}

if (mode === 'upsert') {
  const open = DRY ? [] : await issuesWithLabel('open');
  if (open.length) {
    const n = open[0].number;
    await gh('POST', `/issues/${n}/comments`, { body });
    console.log(`commented on #${n} (${open[0].html_url})`);
  } else if (DRY) {
    dry(`comment on the open "${label}" issue, or open "${title}" with the label "${label}" if none is open`);
    showBody();
  } else {
    await ensureLabel();
    const made = await gh('POST', '/issues', { title, body, labels: [label] });
    console.log(`opened #${made.data.number} (${made.data.html_url})`);
  }
} else if (mode === 'close') {
  if (DRY) {
    dry(`comment on and close the open "${label}" issue, if there is one`);
    showBody();
  } else {
    const open = await issuesWithLabel('open');
    if (!open.length) console.log(`no open "${label}" issue: nothing to close`);
    for (const issue of open) {
      if (body) await gh('POST', `/issues/${issue.number}/comments`, { body });
      await gh('PATCH', `/issues/${issue.number}`, { state: 'closed', state_reason: 'completed' });
      console.log(`closed #${issue.number}`);
    }
  }
} else if (mode === 'once') {
  if (DRY) {
    dry(`open "${title}" with the label "${label}", unless an issue of that title and label exists`);
    showBody();
  } else {
    const same = (await issuesWithLabel('all')).find((i) => i.title === title);
    if (same) console.log(`"${title}" is already #${same.number}: nothing new`);
    else {
      await ensureLabel();
      const made = await gh('POST', '/issues', { title, body, labels: [label] });
      console.log(`opened #${made.data.number} (${made.data.html_url})`);
    }
  }
}
