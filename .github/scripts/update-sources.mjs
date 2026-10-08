// The weekly update of lists made from other projects' data
// (.github/workflows/sources.yml). Fetches each source, converts it
// (sources/convert.mjs), and rewrites lists/sources/<id>.anubis when its rules
// changed. When anything changed, it writes the pull request's body to [pr.md]
// and its title to $GITHUB_OUTPUT (or prints both).
//
//   node .github/scripts/update-sources.mjs [pr.md]
//
// A list that would lose more than a fifth of its rules isn't written: that's
// more likely an upstream mistake or a format change than a real clean-up, and
// a person should look first. The run then fails, which GitHub reports.

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { body, HUGE_AI, hugeAi, INDIE_WIKIS, indieWikis, render } from './sources/convert.mjs';

const ROOT = new URL('../../', import.meta.url);
const DEST = new URL('lists/sources/', ROOT);
const [out = 'pr.md'] = process.argv.slice(2);

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

/** The commit a repository's default branch is at. */
function head(repository) {
  return execFileSync('git', ['ls-remote', repository, 'HEAD'], { encoding: 'utf8' }).split(/\s/)[0];
}

const SOURCES = [
  {
    id: 'ai-content',
    name: 'HUGE AI Blocklist',
    repository: HUGE_AI.repository,
    async build() {
      const commit = head(HUGE_AI.repository);
      const [main, nuclear] = await Promise.all([fetchText(HUGE_AI.main), fetchText(HUGE_AI.nuclear)]);
      return hugeAi({ main, nuclear, commit, date: new Date().toISOString().slice(0, 10) });
    },
  },
  {
    id: 'independent-wikis',
    name: 'Indie Wiki Buddy',
    repository: INDIE_WIKIS.repository,
    async build() {
      const [data, licence] = await Promise.all([
        fetchText(INDIE_WIKIS.data).then(JSON.parse),
        fetchText(`${INDIE_WIKIS.repository.replace('github.com', 'raw.githubusercontent.com')}/main/LICENSE`),
      ]);
      return indieWikis(data, { commit: data.commit ?? head(INDIE_WIKIS.repository), licence });
    },
  },
];

const count = (text) => (text ? body(text).split('\n').filter(Boolean).length : 0);
const changed = [];
const refused = [];

for (const source of SOURCES) {
  const list = await source.build();
  const text = render(list);
  const file = new URL(`${source.id}.anubis`, DEST);
  const before = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (before && body(before) === body(text)) {
    console.log(`${source.id}: no change in its rules.`);
    continue;
  }
  const [was, now] = [count(before), count(text)];
  if (was && now < was * 0.8) {
    refused.push(`${source.id}: would go from ${was} rules to ${now}. Check ${source.repository} before updating it by hand.`);
    continue;
  }
  mkdirSync(DEST, { recursive: true });
  writeFileSync(file, text);
  changed.push({ ...source, was, now, skipped: list.skipped });
}

if (changed.length) {
  const title = `Lists from other projects updated: ${changed.map((c) => c.name).join(', ')}`;
  const report = [
    `The weekly update rewrote these lists from their sources. The diff shows each site added or removed.`,
    '',
    ...changed.flatMap((c) => [
      `### ${c.name} (\`lists/sources/${c.id}.anubis\`)`,
      '',
      `- Rules: ${c.was} → ${c.now}. Source: ${c.repository}`,
      c.skipped.length ? `- Left out, since an Anubis list can't express them: ${c.skipped.length}.` : '',
      '',
    ]),
    '### What to check',
    '',
    '- [ ] Skim the diff for sites that look wrong. Report them upstream, not here: these files are rewritten every week.',
    '- [ ] CI passes (every list must parse cleanly).',
    '',
    '_Opened by the weekly update of lists from other projects (`.github/workflows/sources.yml`)._',
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n');
  writeFileSync(out, report);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `title=${title}\n`);
  console.log(`${title}\n\n${report}`);
} else {
  console.log('Every list from other projects is up to date.');
}

if (refused.length) {
  console.error(refused.join('\n'));
  process.exit(1);
}
