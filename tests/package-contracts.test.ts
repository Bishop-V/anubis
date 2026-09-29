import { describe, expect, it } from 'vitest';
import config from '../wxt.config';

describe('source archive contracts', () => {
  it('excludes per-user agent notes from the Firefox reviewer package', () => {
    expect(config.zip?.excludeSources).toContain('CLAUDE.local.md');
  });
});
