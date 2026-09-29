// Gets a release ready: bumps the version, runs every check, and makes the zips.
//
//   npm run release:prep -- 0.3.0     set the version to 0.3.0
//   npm run release:prep -- patch     or minor, or major
//   npm run release:prep              keep the version, run the checks again
//
// It stops at the first failure. It doesn't commit or tag: the tag has to be on
// a commit already merged into main (release.yml checks), so that comes after.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = () => JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const current = pkg().version;
const arg = process.argv[2];

function parse(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v ?? '');
  return m && m.slice(1).map(Number);
}

function next(arg) {
  const [major, minor, patch] = parse(current);
  if (arg === 'major') return `${major + 1}.0.0`;
  if (arg === 'minor') return `${major}.${minor + 1}.0`;
  if (arg === 'patch') return `${major}.${minor}.${patch + 1}`;
  return arg;
}

function compare(a, b) {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

function run(label, cmd, args) {
  console.log(`\n▶ ${label}: ${[cmd, ...args].join(' ')}`);
  const started = Date.now();
  const { status } = spawnSync(cmd, args, { stdio: 'inherit' });
  const took = ((Date.now() - started) / 1000).toFixed(0);
  if (status !== 0) {
    console.error(`\n✗ ${label} failed after ${took}s. Fix it, then run \`npm run release:prep\` again.`);
    process.exit(status ?? 1);
  }
  console.log(`✓ ${label} (${took}s)`);
}

const version = arg ? next(arg) : current;
if (!parse(version)) {
  console.error(`"${arg}" isn't a version. Use one like 0.3.0, or patch, minor, or major.`);
  process.exit(1);
}
if (compare(version, current) < 0) {
  console.error(`${version} is lower than the current ${current}. The stores only take a higher version.`);
  process.exit(1);
}

if (version === current) {
  console.log(`Keeping version ${current}.`);
} else {
  // Updates package-lock.json too. WXT copies the version into the manifest.
  run(`Set version ${current} → ${version}`, 'npm', ['version', version, '--no-git-tag-version']);
}

run('Type-check', 'npm', ['run', 'compile']);
run('Unit tests', 'npm', ['test']);
// Builds .output/firefox-mv2 and makes the Firefox zip and the sources zip for AMO.
run('Firefox build and zips', 'npm', ['run', 'zip']);
run('Firefox add-on linter', 'npx', ['web-ext', 'lint', '--source-dir', '.output/firefox-mv2', '--warnings-as-errors']);
// Builds for Chrome, then runs every network-free part against the mock pages.
run('End-to-end checks', 'npm', ['run', 'e2e']);

console.log(`
All checks passed for ${version}. In .output/:
  anubis-${version}-firefox.zip   upload to AMO
  anubis-${version}-sources.zip   AMO asks for it after the upload

Next:
  1. ${version === current ? 'Make sure this version is on main.' : 'Commit the version change and merge it into main through a pull request.'}
  2. On main: git tag v${version} && git push origin v${version}
     release.yml then submits to every store that has its keys in the release environment.`);
