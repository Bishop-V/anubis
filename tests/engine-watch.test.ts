import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINES } from '@/utils/engines';

const config = JSON.parse(readFileSync(resolve('.github/engine-watch.json'), 'utf8')) as {
  watched: Record<string, string[]>;
  unwatched: Record<string, string>;
  ignoredHosts: Record<string, string>;
};
const scriptPath = resolve('.github/scripts/sync-serpinfo.mjs');

/**
 * The hosts a SERPINFO file's pages match ("- https://www.google.com/search?*" →
 * "www.google.com"). Only `matches` lists hold addresses as list items, so reading
 * those lines is enough, and anchors (`&matches`, `*matches`) only repeat them.
 */
function upstreamHosts(text: string): string[] {
  const urls = [...text.matchAll(/^\s*- ["']?(?:https?|\*):\/\/([^/"'\s]+)/gm)];
  return [...new Set(urls.map((m) => m[1]!))];
}

/** Whether a manifest match pattern's host part covers `host`, as the browser reads it. */
function patternCovers(pattern: string, host: string): boolean {
  const part = pattern.replace(/^[^:]*:\/\//, '').split('/')[0]!;
  if (part === host) return true;
  // "*.startpage.com" upstream is the same pattern; otherwise "*." covers the domain and its subdomains.
  return part.startsWith('*.') && (host === part.slice(2) || host.endsWith(part.slice(1)));
}

function git(repo: string, ...args: string[]): string {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
}

function commit(repo: string, file: string, content: string, subject = `Change ${file}`): string {
  const path = join(repo, file);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
  git(repo, 'add', file);
  execFileSync('git', ['-C', repo, 'commit', '-m', subject], { stdio: 'ignore' });
  return git(repo, 'rev-parse', 'HEAD');
}

/** A fake ublacklist/builtin with every watched file, and an empty folder for the copies. */
function withRepo(run: (repo: string, dest: string, sync: () => string) => void): void {
  const temp = mkdtempSync(join(tmpdir(), 'anubis-engine-sync-'));
  const repo = join(temp, 'builtin');
  const dest = join(temp, 'upstream');
  try {
    execFileSync('git', ['init', '-q', repo]);
    git(repo, 'config', 'user.name', 'Anubis tests');
    git(repo, 'config', 'user.email', 'tests@example.invalid');
    commit(repo, 'LICENSE', 'MIT License');
    for (const file of Object.keys(config.watched)) commit(repo, file, `baseline ${file}`);
    const sync = () =>
      execFileSync(process.execPath, [scriptPath, repo, join(temp, 'pr.md')], {
        encoding: 'utf8',
        env: { ...process.env, SERPINFO_DEST: dest, GITHUB_OUTPUT: '' },
      });
    run(repo, dest, sync);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

describe('engine watch', () => {
  it('accounts for every supported engine exactly once', () => {
    const tracked = Object.values(config.watched).flat();
    const all = [...tracked, ...Object.keys(config.unwatched)];
    expect(all.toSorted()).toEqual(ENGINES.map((engine) => engine.name).toSorted());
    expect(new Set(all).size).toBe(all.length);
    expect(Object.values(config.unwatched).every((reason) => reason.trim().length > 0)).toBe(true);
  });

  it('keeps a copy of every watched file, and nothing else', () => {
    const copies = readdirSync(resolve('upstream/serpinfo')).filter((f) => f.endsWith('.yml'));
    expect(copies.map((f) => `serpinfo/${f}`).toSorted()).toEqual(Object.keys(config.watched).toSorted());
    const source = JSON.parse(readFileSync(resolve('upstream/serpinfo/source.json'), 'utf8'));
    expect(source.commit).toMatch(/^[0-9a-f]{40}$/);
  });

  // The weekly sync's pull request fails here when uBlacklist starts matching a new
  // address for an engine, such as another country's Google.
  it.each(Object.entries(config.watched))('covers every address uBlacklist matches in %s', (file, names) => {
    const patterns = ENGINES.filter((e) => names.includes(e.name)).flatMap((e) => e.matches);
    const hosts = upstreamHosts(readFileSync(resolve('upstream', file), 'utf8'));
    expect(hosts.length).toBeGreaterThan(0);
    const missing = hosts.filter((h) => !(h in config.ignoredHosts) && !patterns.some((p) => patternCovers(p, h)));
    expect(missing).toEqual([]);
  });

  it('recognises every covered address as its engine', () => {
    for (const [file, names] of Object.entries(config.watched)) {
      const engines = ENGINES.filter((e) => names.includes(e.name));
      for (const h of upstreamHosts(readFileSync(resolve('upstream', file), 'utf8'))) {
        if (h.includes('*') || h in config.ignoredHosts) continue;
        expect([h, engines.some((e) => !e.host || e.host.test(h))]).toEqual([h, true]);
      }
    }
  });
});

describe('engine sync script', () => {
  it('copies the watched files and lists the commits since the last sync', () => {
    withRepo((repo, dest, sync) => {
      expect(sync()).toContain('Engine rules changed upstream: Google');
      expect(readFileSync(join(dest, 'serpinfo/google.yml'), 'utf8')).toBe('baseline serpinfo/google.yml');
      expect(existsSync(join(dest, 'serpinfo/LICENSE'))).toBe(true);
      const first = JSON.parse(readFileSync(join(dest, 'serpinfo/source.json'), 'utf8')).commit;
      expect(first).toBe(git(repo, 'rev-parse', 'HEAD'));

      expect(sync()).toContain('match uBlacklist');

      const bing = commit(repo, 'serpinfo/bing.yml', 'new bing', 'Fix Bing for @someone [see] <b>');
      commit(repo, 'serpinfo/searxng.yml', 'unwatched');
      const out = sync();
      expect(out).toContain('Engine rules changed upstream: Bing');
      expect(out).not.toContain('Google (');
      expect(out).toContain(`commit/${bing}`);
      // Someone else's text can't ping people or make links.
      expect(out).toContain('Fix Bing for @​someone see b');
      expect(existsSync(join(dest, 'serpinfo/searxng.yml'))).toBe(false);
    });
  });

  it('fails visibly if an upstream path in the watch map disappears', () => {
    withRepo((repo, dest, sync) => {
      git(repo, 'rm', '-q', 'serpinfo/google.yml');
      execFileSync('git', ['-C', repo, 'commit', '-m', 'Remove Google SERPINFO'], { stdio: 'ignore' });
      const result = spawnSync(process.execPath, [scriptPath, repo], {
        encoding: 'utf8',
        env: { ...process.env, SERPINFO_DEST: dest },
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Mapped SERPINFO file(s) missing upstream: serpinfo/google.yml');
      expect(sync).toThrow();
    });
  });
});
