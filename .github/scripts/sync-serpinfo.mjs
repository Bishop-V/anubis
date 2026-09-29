// The weekly engine sync (.github/workflows/engines.yml). uBlacklist keeps rules
// for finding results on each engine (serpinfo/*.yml in ublacklist/builtin) and
// updates them as the engines change their markup. Anubis keeps a copy of the
// files for the engines it supports in upstream/serpinfo/, so a change upstream
// arrives as a pull request whose diff shows exactly what moved, and whose CI
// (tests/serpinfo.test.ts) fails when upstream matches an address Anubis doesn't.
//
//   node .github/scripts/sync-serpinfo.mjs <builtin clone> [pr.md]
//
// Copies the watched files from the clone's HEAD into upstream/serpinfo/ and
// records the commit in source.json. When anything changed, it writes the pull
// request's body to [pr.md] and its title to $GITHUB_OUTPUT (or prints both).

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
// CI checks this map against utils/engines.ts so new engines can't go unwatched.
const { watched: WATCHED } = JSON.parse(readFileSync(new URL('.github/engine-watch.json', ROOT), 'utf8'));
const UPSTREAM = 'https://github.com/ublacklist/builtin';
// Tests point this elsewhere.
const DEST = process.env.SERPINFO_DEST ? new URL(`file://${process.env.SERPINFO_DEST.replace(/\/?$/, '/')}`) : new URL('upstream/', ROOT);
const SOURCE = new URL('serpinfo/source.json', DEST);

const [repo, out = 'pr.md'] = process.argv.slice(2);
if (!repo) {
  console.error('Usage: node .github/scripts/sync-serpinfo.mjs <builtin clone> [pr.md]');
  process.exit(1);
}
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });

const upstreamFiles = new Set(git('ls-tree', '-r', '--name-only', 'HEAD', '--', 'serpinfo/').split('\n').filter(Boolean));
const missingFiles = Object.keys(WATCHED).filter((file) => !upstreamFiles.has(file));
if (missingFiles.length) {
  throw new Error(`Mapped SERPINFO file(s) missing upstream: ${missingFiles.join(', ')}`);
}

const head = git('rev-parse', 'HEAD').trim();
const previous = existsSync(SOURCE) ? JSON.parse(readFileSync(SOURCE, 'utf8')).commit : undefined;
// The previous commit is only useful for listing what changed if the clone has it.
let known = false;
try {
  known = !!previous && git('cat-file', '-t', previous).trim() === 'commit';
} catch {}
// Commit subjects are someone else's text: keep them from pinging people or making links.
const plain = (s) => s.replace(/@/g, '@​').replace(/[[\]<>`]/g, '');

const changed = [];
for (const [file, engines] of Object.entries(WATCHED)) {
  const text = git('show', `HEAD:${file}`);
  const dest = new URL(file, DEST);
  if (existsSync(dest) && readFileSync(dest, 'utf8') === text) continue;
  mkdirSync(new URL('.', dest), { recursive: true });
  writeFileSync(dest, text);
  const commits = known
    ? git('log', '--format=%H%x09%as%x09%s', `${previous}..HEAD`, '--', file)
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [sha, date, subject] = line.split('\t');
          return { sha, date, subject };
        })
    : [];
  changed.push({ file, engines, commits });
}

if (!changed.length) {
  console.log('The copies in upstream/serpinfo/ match uBlacklist.');
  process.exit(0);
}

// The files are uBlacklist's, under its MIT licence; the copy carries it.
writeFileSync(new URL('serpinfo/LICENSE', DEST), git('show', 'HEAD:LICENSE'));
const date = git('show', '-s', '--format=%as', 'HEAD').trim();
writeFileSync(SOURCE, `${JSON.stringify({ repository: UPSTREAM, commit: head, date }, null, 2)}\n`);

const names = changed.flatMap((c) => c.engines.filter((e) => !e.includes('(')));
const title = `Engine rules changed upstream: ${names.join(', ')}`;
const body = [
  `uBlacklist changed how it finds results on ${names.join(', ')}. It tracks these engines' markup closely, so Anubis may need the same change. This updates the copies in \`upstream/serpinfo/\` to [${head.slice(0, 7)}](${UPSTREAM}/commit/${head}) (${date}); the diff shows what moved.`,
  '',
  ...changed.flatMap(({ file, engines, commits }) => [
    `### ${engines.join(', ')} (\`${file}\`)`,
    '',
    ...(commits.length
      ? commits.map((c) => `- ${c.date} [${plain(c.subject)}](${UPSTREAM}/commit/${c.sha})`)
      : [`- [History of ${file}](${UPSTREAM}/commits/main/${file})`]),
    '',
  ]),
  '### What to check',
  '',
  '- [ ] If CI fails in `tests/serpinfo.test.ts`, upstream now matches an address Anubis doesn\'t: add it to the engine in `utils/engines.ts`, or to `ignoredHosts` in `.github/engine-watch.json` with a reason.',
  '- [ ] Compare each change with the engine in `utils/engines.ts` (and `cleanupSelectors` for panels and AI answers).',
  '- [ ] Load the extension on a live results page for that engine.',
  '- [ ] If something broke, model the new markup in `e2e/fixtures.mjs`, confirm the check fails, then fix it on this branch.',
  '- [ ] Note what was confirmed, with the date, in `docs/experiments.md`.',
  '',
  '_Opened by the weekly engine sync (`.github/workflows/engines.yml`)._',
].join('\n');

writeFileSync(out, body);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `title=${title}\n`);
console.log(`${title}\n\n${body}`);
