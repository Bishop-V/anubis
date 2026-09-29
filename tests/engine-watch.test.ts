import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINES } from '@/utils/engines';

const watchConfigPath = resolve('.github/engine-watch.json');
const scriptPath = resolve('.github/scripts/watch-engines.mjs');
const config = JSON.parse(readFileSync(watchConfigPath, 'utf8')) as {
  watched: Record<string, string[]>;
  unwatched: Record<string, string>;
};

function git(repo: string, ...args: string[]): string {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
}

function commit(repo: string, file: string, content: string, date: Date): string {
  const path = join(repo, file);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
  git(repo, 'add', file);
  execFileSync('git', ['-C', repo, 'commit', '-m', `Change ${file}`], {
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: date.toISOString(),
      GIT_COMMITTER_DATE: date.toISOString(),
    },
    stdio: 'ignore',
  });
  return git(repo, 'rev-parse', 'HEAD');
}

function withRepo(run: (repo: string, temp: string) => void): void {
  const temp = mkdtempSync(join(tmpdir(), 'anubis-engine-watch-'));
  const repo = join(temp, 'builtin');
  try {
    execFileSync('git', ['init', '-q', repo]);
    git(repo, 'config', 'user.name', 'Anubis tests');
    git(repo, 'config', 'user.email', 'tests@example.invalid');
    for (const file of Object.keys(config.watched)) {
      const path = join(repo, file);
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, 'baseline');
    }
    git(repo, 'add', 'serpinfo');
    execFileSync('git', ['-C', repo, 'commit', '-m', 'Baseline SERPINFO files'], {
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: new Date(Date.now() - 30 * 86400_000).toISOString(),
        GIT_COMMITTER_DATE: new Date(Date.now() - 30 * 86400_000).toISOString(),
      },
      stdio: 'ignore',
    });
    run(repo, temp);
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

  it('reports recent watched-file changes and skips reported commits', () => {
    withRepo((repo, temp) => {
      const now = new Date();
      commit(repo, 'serpinfo/google.yml', 'first', new Date(now.getTime() - 2 * 86400_000));
      const reportedSha = commit(repo, 'serpinfo/google.yml', 'second', new Date(now.getTime() - 86400_000));
      const currentSha = commit(repo, 'serpinfo/bing.yml', 'bing', new Date(now.getTime() - 12 * 3600_000));
      const reported = join(temp, 'reported.txt');
      const output = join(temp, 'issue.md');
      writeFileSync(reported, `${reportedSha}\n`);

      const result = execFileSync(process.execPath, [scriptPath, repo, reported, '10', output], { encoding: 'utf8' });
      const body = readFileSync(output, 'utf8');
      expect(result).toContain('Engine rules changed upstream: Google, Bing');
      expect(body).toContain(`commit/${currentSha}`);
      expect(body).not.toContain(`commit/${reportedSha}`);
      expect(body).toContain('serpinfo/google.yml');
      expect(body).toContain('serpinfo/bing.yml');
    });
  });

  it('ignores changes outside watched files and outside the lookback window', () => {
    withRepo((repo, temp) => {
      const now = new Date();
      commit(repo, 'serpinfo/google.yml', 'old', new Date(now.getTime() - 30 * 86400_000));
      commit(repo, 'serpinfo/searxng.yml', 'unwatched', new Date(now.getTime() - 3600_000));
      const output = join(temp, 'issue.md');
      const result = execFileSync(process.execPath, [scriptPath, repo, '', '10', output], { encoding: 'utf8' });
      expect(result).toContain('No new changes upstream');
      expect(existsSync(output)).toBe(false);
    });
  });

  it('fails visibly if an upstream path in the watch map disappears', () => {
    withRepo((repo, temp) => {
      git(repo, 'rm', 'serpinfo/google.yml');
      execFileSync('git', ['-C', repo, 'commit', '-m', 'Remove Google SERPINFO'], { stdio: 'ignore' });
      const result = spawnSync(process.execPath, [scriptPath, repo, '', '10', join(temp, 'issue.md')], { encoding: 'utf8' });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Mapped SERPINFO file(s) missing upstream: serpinfo/google.yml');
    });
  });
});
