import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import config from '../wxt.config';

describe('package contracts', () => {
  it('excludes per-user agent notes from the Firefox reviewer package', () => {
    expect(config.zip?.excludeSources).toContain('CLAUDE.local.md');
  });

  it('declares the minimum Node version required by the build tools', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
    expect(manifest.engines.node).toBe('>=22.12.0');
    expect(lock.packages[''].engines.node).toBe(manifest.engines.node);
  });
});
