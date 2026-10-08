import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { storage } from '#imports';
import {
  BUNDLED_DIRECTORY,
  defaultSubscriptions,
  fetchText,
  getSubscriptions,
  listsToDiscover,
  migrateDefaultLists,
  saveSubscriptions,
  subscriptionId,
  type DirectoryEntry,
} from '@/utils/subscriptions';
import { installEnglish } from './english';

const MB = 1024 * 1024;

/** A response that streams `chunks` and counts how many were read. */
function streamed(chunks: number, chunkSize: number, headers: HeadersInit = {}) {
  let pulled = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulled === chunks) return controller.close();
      pulled++;
      controller.enqueue(new Uint8Array(chunkSize).fill(0x61));
    },
  });
  return { response: new Response(body, { headers }), pulled: () => pulled };
}

describe('downloading lists', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads a list', async () => {
    vi.stubGlobal('fetch', async () => new Response('example.com\n'));
    expect(await fetchText('https://example.org/list.txt')).toBe('example.com\n');
  });

  it('refuses a list that says it is over 5 MB without reading it', async () => {
    const { response, pulled } = streamed(10, MB, { 'content-length': String(10 * MB) });
    vi.stubGlobal('fetch', async () => response);
    await expect(fetchText('https://example.org/big.txt')).rejects.toThrow('larger than 5 MB');
    expect(pulled()).toBeLessThanOrEqual(1);
  });

  it('stops reading a list once it passes 5 MB', async () => {
    const { response, pulled } = streamed(100, MB);
    vi.stubGlobal('fetch', async () => response);
    await expect(fetchText('https://example.org/big.txt')).rejects.toThrow('larger than 5 MB');
    expect(pulled()).toBeLessThan(10);
  });

  it('says when it got a web page', async () => {
    vi.stubGlobal('fetch', async () => new Response('<!DOCTYPE html><html></html>'));
    await expect(fetchText('https://example.org/')).rejects.toThrow('web page');
  });
});

describe('default lists on update', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    installEnglish();
  });

  it('subscribes an existing install to every default list once, keeping its own', async () => {
    const defaults = defaultSubscriptions();
    const own = { id: 'own', url: 'https://example.org/own.anubis', enabled: true, addedAt: 1 };
    // Saved before the newer defaults existed: one default switched off, another missing.
    await saveSubscriptions([{ ...defaults[0]!, enabled: false }, own]);
    await migrateDefaultLists();
    const after = await getSubscriptions();
    expect(after.find((s) => s.id === 'own')).toEqual(own);
    for (const d of defaults) expect(after.find((s) => s.id === d.id)?.enabled, d.id).toBe(true);
    // Only once: switching a default off afterwards sticks.
    await saveSubscriptions(after.map((s) => (s.id === defaults[0]!.id ? { ...s, enabled: false } : s)));
    await migrateDefaultLists();
    expect((await getSubscriptions()).find((s) => s.id === defaults[0]!.id)?.enabled).toBe(false);
  });

  it('leaves an install that never changed its lists on the defaults', async () => {
    await migrateDefaultLists();
    expect(await storage.getItem('sync:subscriptions')).toBeNull();
  });
});

describe('the lists offered under More lists', () => {
  const entry = (id: string, extra: Partial<DirectoryEntry> = {}): DirectoryEntry => ({
    id,
    name: id,
    description: '',
    url: `https://example.org/${id}.txt`,
    ...extra,
  });
  const sub = (d: DirectoryEntry) => ({ id: d.builtin ? `builtin:${d.id}` : subscriptionId(d.url), url: d.url });

  it('leaves out lists you already subscribe to', () => {
    const [a, b] = [entry('a'), entry('b', { builtin: true })];
    expect(listsToDiscover([a, b, entry('c')], [sub(a), sub(b)]).map((d) => d.id)).toEqual(['c']);
  });

  it('leaves out a list that covers the same sites as one you have', () => {
    const [labels, hides] = [entry('labels', { overlaps: ['hides'] }), entry('hides', { overlaps: ['labels'] })];
    expect(listsToDiscover([labels, hides, entry('other')], [sub(labels)]).map((d) => d.id)).toEqual(['other']);
    expect(listsToDiscover([labels, hides, entry('other')], [sub(hides)]).map((d) => d.id)).toEqual(['other']);
    expect(listsToDiscover([labels, hides], []).map((d) => d.id)).toEqual(['labels', 'hides']);
  });

  it('has overlaps in the directory that name real lists and go both ways', () => {
    const byId = new Map(BUNDLED_DIRECTORY.map((d) => [d.id, d]));
    for (const d of BUNDLED_DIRECTORY) {
      for (const id of d.overlaps ?? []) expect(byId.get(id)?.overlaps, `${d.id} overlaps ${id}`).toContain(d.id);
    }
  });
});
