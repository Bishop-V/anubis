import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { storage } from '#imports';
import { listSites } from '@/utils/personal';
import { DEFAULT_PERSONAL, loadPersonal, migrateLegacy, savePersonal, splitIntoChunks } from '@/utils/storage';

beforeEach(() => fakeBrowser.reset());

describe('personal list storage', () => {
  it('splits text into sync-sized chunks that join back exactly', () => {
    const text = Array.from({ length: 3000 }, (_, i) => `$site=site${i}.example.com,discard,tag=ünïcödé-😀`).join('\n');
    const chunks = splitIntoChunks(text);
    expect(chunks.length).toBeGreaterThan(10);
    for (const c of chunks) expect(new TextEncoder().encode(JSON.stringify(c)).length).toBeLessThanOrEqual(7000);
    expect(chunks.join('')).toBe(text);
  });

  it('starts with the default list', async () => {
    expect(await loadPersonal()).toBe(DEFAULT_PERSONAL);
  });

  it('round-trips through chunked sync storage and shrinks cleanly', async () => {
    const big = Array.from({ length: 800 }, (_, i) => `$site=s${i}.com,discard`).join('\n');
    await savePersonal(big);
    expect(await loadPersonal()).toBe(big);
    await savePersonal('$site=one.com,pin');
    expect(await loadPersonal()).toBe('$site=one.com,pin');
    expect(await storage.getItem('sync:personal.1')).toBeNull();
  });

  it('migrates the legacy sync:blockedSites array once', async () => {
    await storage.setItem('sync:blockedSites', ['fandom.com', 'pinterest.com']);
    await migrateLegacy();
    expect(listSites(await loadPersonal()).map((e) => e.site)).toEqual(['fandom.com', 'pinterest.com']);
    expect(await storage.getItem('sync:blockedSites')).toBeNull();
  });
});
