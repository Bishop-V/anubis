// The weekly engine watch (.github/workflows/engines.yml). uBlacklist keeps rules
// for finding results on each engine (serpinfo/*.yml in ublacklist/builtin) and
// updates them as the engines change their markup. A change there for an engine
// Anubis supports is an early sign that utils/engines.ts may need one too.
//
//   node .github/scripts/watch-engines.mjs <builtin clone> <reported.txt> <days> <issue.md>
//
// <reported.txt> holds the bodies of issues already opened, so a commit is only
// reported once. When there is something new, it writes the issue's body to
// <issue.md> and its title to $GITHUB_OUTPUT (or prints both).

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

// CI checks this manifest against utils/engines.ts so new engines cannot go unwatched.
const { watched: WATCHED } = JSON.parse(readFileSync(new URL('../engine-watch.json', import.meta.url), 'utf8'));
const UPSTREAM = 'https://github.com/ublacklist/builtin';

const [repo, reportedFile, days = '10', out = 'issue.md'] = process.argv.slice(2);
if (!repo) {
  console.error('Usage: node .github/scripts/watch-engines.mjs <builtin clone> <reported.txt> [days] [issue.md]');
  process.exit(1);
}
const upstreamFiles = new Set(
  execFileSync('git', ['-C', repo, 'ls-tree', '-r', '--name-only', 'HEAD', '--', 'serpinfo/'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean),
);
const missingFiles = Object.keys(WATCHED).filter((file) => !upstreamFiles.has(file));
if (missingFiles.length) {
  throw new Error(`Mapped SERPINFO file(s) missing upstream: ${missingFiles.join(', ')}`);
}
const reported = reportedFile && existsSync(reportedFile) ? readFileSync(reportedFile, 'utf8') : '';
// Commit subjects are someone else's text: keep them from pinging people or making links.
const plain = (s) => s.replace(/@/g, '@​').replace(/[[\]<>`]/g, '');

const changed = [];
for (const [file, engines] of Object.entries(WATCHED)) {
  const log = execFileSync('git', ['-C', repo, 'log', `--since=${Number(days)} days ago`, '--format=%H%x09%as%x09%s', 'HEAD', '--', file], {
    encoding: 'utf8',
  });
  const commits = log
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, date, subject] = line.split('\t');
      return { sha, date, subject };
    })
    .filter((c) => !reported.includes(c.sha));
  if (commits.length) changed.push({ file, engines, commits });
}

if (!changed.length) {
  console.log(`No new changes upstream for supported engines in the last ${days} days.`);
  process.exit(0);
}

const names = changed.flatMap((c) => c.engines.filter((e) => !e.includes('(')));
const title = `Engine rules changed upstream: ${names.join(', ')}`;
const body = [
  `uBlacklist changed how it finds results on ${names.join(', ')} in the last ${days} days. It tracks these engines' markup closely, so Anubis may need the same change.`,
  '',
  ...changed.flatMap(({ file, engines, commits }) => [
    `### ${engines.join(', ')} (\`${file}\`)`,
    '',
    ...commits.map((c) => `- ${c.date} [${plain(c.subject)}](${UPSTREAM}/commit/${c.sha})`),
    '',
  ]),
  '### What to check',
  '',
  '- [ ] Compare each change with the engine in `utils/engines.ts` (and `utils/cleanup.ts` for panels and AI answers).',
  '- [ ] Load the extension on a live results page for that engine.',
  '- [ ] If something broke, model the new markup in `e2e/fixtures.mjs`, confirm the check fails, then fix it.',
  '- [ ] Note what was confirmed, with the date, in `docs/experiments.md`.',
  '',
  '_Opened by the weekly engine watch (`.github/workflows/engines.yml`)._',
].join('\n');

writeFileSync(out, body);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `title=${title}\n`);
console.log(`${title}\n\n${body}`);
