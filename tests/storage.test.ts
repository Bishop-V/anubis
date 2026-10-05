import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { storage } from '#imports';
import { readBackup } from '@/utils/backup';
import { parseList } from '@/utils/listformat';
import { collectTags, compileList } from '@/utils/matcher';
import { listSites, setSiteLevel } from '@/utils/personal';
import {
  checksum,
  compress,
  DEFAULT_PERSONAL,
  DEFAULT_SETTINGS,
  editPersonal,
  getSettings,
  loadPersonal,
  migrateLegacy,
  migrateSettings,
  personalIsLocal,
  savePersonal,
  settingsItem,
  splitIntoChunks,
  SYNC_QUOTA_BYTES,
  syncBytesInUse,
  updateSettings,
} from '@/utils/storage';
import { getSubscriptions, saveSubscriptions } from '@/utils/subscriptions';
import { clampDeeper, MAX_DEEPER } from '@/utils/storage';

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

describe('personal list in browser sync', () => {
  const sites = (n: number, level = 'discard') =>
    Array.from({ length: n }, (_, i) => `$site=${(i * 7919).toString(36)}-${i}.example.org,${level},tag=ünï`).join('\n');

  /** What another computer's save looks like when only some of it has arrived. */
  async function arriving(text: string) {
    const chunks = splitIntoChunks(await compress(text));
    return {
      meta: () => storage.setItem('sync:personal', { chunks: chunks.length, updatedAt: Date.now(), encoding: 'deflate', sum: checksum(text) }),
      chunks: () => storage.setItems(chunks.map((value, i) => ({ key: `sync:personal.${i}`, value }))),
    };
  }

  it('compresses the list, so a list bigger than sync holds still syncs', async () => {
    const text = sites(6000);
    expect(new TextEncoder().encode(text).length).toBeGreaterThan(SYNC_QUOTA_BYTES);
    await savePersonal(text);
    expect(await personalIsLocal()).toBe(false);
    expect(await syncBytesInUse()).toBeLessThan(SYNC_QUOTA_BYTES);
    await storage.removeItem('local:personalCopy');
    expect(await loadPersonal()).toBe(text);
  });

  it('reads a list saved before lists were compressed', async () => {
    await storage.setItems([
      { key: 'sync:personal.0', value: '$site=old.com,' },
      { key: 'sync:personal.1', value: 'discard' },
      { key: 'sync:personal', value: { chunks: 2, updatedAt: 1 } },
    ]);
    expect(await loadPersonal()).toBe('$site=old.com,discard');
  });

  it('keeps the last good copy until the rest of a list arrives from sync', async () => {
    const mine = sites(50);
    const theirs = sites(60, 'pin');
    await savePersonal(mine);
    const other = await arriving(theirs);
    await other.meta();
    expect(await loadPersonal()).toBe(mine);
    await other.chunks();
    expect(await loadPersonal()).toBe(theirs);
  });

  it('doesn’t fail on chunks mixed from two computers when there is no copy yet', async () => {
    await (await arriving(sites(50))).meta();
    await storage.setItem('sync:personal.0', 'bm90IGRlZmxhdGU=');
    await expect(loadPersonal()).resolves.toBe('');
  });

  it('waits for the rest of the list before saving an edit on top of it', async () => {
    await savePersonal(sites(50));
    const theirs = sites(60, 'pin');
    const other = await arriving(theirs);
    await other.meta();
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const edited = editPersonal((t) => `${t}\n$site=new.com,pin`);
      await vi.waitFor(() => expect(vi.getTimerCount()).toBe(1));
      await other.chunks();
      await vi.advanceTimersByTimeAsync(1500);
      expect(await edited).toBe(`${theirs}\n$site=new.com,pin`);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('edits and subscriptions', () => {
  it('runs quick edits one after another without losing any', async () => {
    await Promise.all(['a.com', 'b.com', 'c.com', 'd.com'].map((d) => editPersonal((t) => setSiteLevel(t, d, 'hide'))));
    const sites = listSites(await loadPersonal()).map((e) => e.site);
    expect(sites).toEqual(expect.arrayContaining(['a.com', 'b.com', 'c.com', 'd.com']));
  });

  it('treats missing subscriptions as the defaults, and an empty list as empty', async () => {
    const subscriptions = await getSubscriptions();
    expect(subscriptions.map((s) => s.id)).toContain('builtin:official-docs');
    expect(subscriptions.map((s) => s.id)).toContain('builtin:foss-tools');
    await saveSubscriptions([]);
    expect(await getSubscriptions()).toEqual([]);
  });
});

describe('hidden results style', () => {
  it('removes hidden results by default', async () => {
    expect((await getSettings()).hideStyle).toBe('remove');
  });

  it('moves settings saved with the old default over once, then leaves them alone', async () => {
    await settingsItem.setValue({ ...DEFAULT_SETTINGS, hideStyle: 'collapse' });
    await migrateSettings();
    expect((await getSettings()).hideStyle).toBe('remove');
    // Choosing Collapse afterwards sticks.
    await updateSettings({ hideStyle: 'collapse' });
    await migrateSettings();
    expect((await getSettings()).hideStyle).toBe('collapse');
  });
});

describe('colours on search pages', () => {
  it('stays gold for settings saved before the choice existed', async () => {
    const { palette: _, ...older } = DEFAULT_SETTINGS;
    await settingsItem.setValue(older as typeof DEFAULT_SETTINGS);
    expect((await getSettings()).palette).toBe('gold');
    await updateSettings({ palette: 'plain' });
    expect((await getSettings()).palette).toBe('plain');
  });
});

describe('tag choices from a backup or sync file', () => {
  const read = (tagPrefs: unknown) => readBackup(JSON.stringify({ anubis: 1, tagPrefs })).tagPrefs;

  it('keeps what Settings saves', () => {
    const prefs = { reference: { action: 'raise', color: '#3FA37A', label: 'Docs', muted: true }, paywall: { action: 'hide' } };
    expect(read(prefs)).toEqual({ reference: { action: 'raise', color: '#3fa37a', label: 'Docs', muted: true }, paywall: { action: 'hide' } });
  });

  it('drops entries search pages couldn’t read', () => {
    const prefs = read({ reference: null, paywall: 'hide', docs: { action: 'explode', color: 'red; background: url(https://x.test/)', muted: 'yes' } });
    expect(prefs).toEqual({ docs: {} });
    const list = compileList('a', parseList('! tag: reference | Reference\nexample.com$tag=reference\n'));
    expect(collectTags([list], read({ reference: null })).get('reference')?.label).toBe('Reference');
  });
});

describe('tag names', () => {
  it('uses a list’s definition over the id a personal list falls back on', () => {
    const mine = compileList('mine', parseList('example.com$tag=forum\n'));
    const lists = compileList('a', parseList('! tag: forum | Discussion\nexample.org$tag=forum\n'));
    expect(collectTags([mine, lists]).get('forum')).toEqual(expect.objectContaining({ label: 'Discussion' }));
    expect(collectTags([mine]).get('forum')?.label).toBe('forum');
  });
});

describe('extra pages to load automatically', () => {
  it('keeps a typed or stored amount to a whole number from 0 to the limit', () => {
    expect(clampDeeper(3)).toBe(3);
    expect(clampDeeper('7')).toBe(7);
    expect(clampDeeper(2.6)).toBe(3);
    expect(clampDeeper(-4)).toBe(0);
    expect(clampDeeper(500)).toBe(MAX_DEEPER);
    expect(clampDeeper('')).toBe(0);
    expect(clampDeeper('lots')).toBe(0);
    expect(clampDeeper(undefined)).toBe(0);
  });
});
