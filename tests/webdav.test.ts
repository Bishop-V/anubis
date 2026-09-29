import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { collectData } from '@/utils/backup';
import { listSites, setSite, setSiteLevel } from '@/utils/personal';
import { editPersonal, loadPersonal, updateSettings } from '@/utils/storage';
import { accountItem, connect, statusItem, syncChanges, syncFileUrl, syncWithServer } from '@/utils/webdav';

// Two browsers (each with its own storage, as Firefox and Chrome have) syncing
// through one fake WebDAV server.

const FOLDER = 'https://dav.example/files/me';
const FILE = `${FOLDER}/anubis-sync.json`;
const ACCOUNT = { url: FOLDER, user: 'me', password: 'app-password' };

class FakeDav {
  files = new Map<string, { body: string; etag: string }>();
  requests: string[] = [];
  /** Runs before the next PUT is handled: another browser saving in between. */
  beforePut?: () => void;
  private version = 0;

  save(url: string, body: string) {
    this.files.set(url, { body, etag: `"${++this.version}"` });
  }

  fetch = async (input: string | URL, init: RequestInit = {}): Promise<Response> => {
    const url = String(input);
    const headers = init.headers as Record<string, string>;
    this.requests.push(`${init.method} ${url}`);
    if (headers.Authorization !== `Basic ${btoa('me:app-password')}`) return new Response(null, { status: 401 });
    if (init.method === 'GET') {
      const file = this.files.get(url);
      return file ? new Response(file.body, { headers: { ETag: file.etag } }) : new Response(null, { status: 404 });
    }
    const hook = this.beforePut;
    this.beforePut = undefined;
    hook?.();
    const file = this.files.get(url);
    if (headers['If-Match'] && headers['If-Match'] !== file?.etag) return new Response(null, { status: 412 });
    if (headers['If-None-Match'] === '*' && file) return new Response(null, { status: 412 });
    if (!url.startsWith(`${FOLDER}/`)) return new Response(null, { status: 409 });
    this.save(url, String(init.body));
    return new Response(null, { status: 201 });
  };
}

let server: FakeDav;
const browsers = new Map<string, { local: Record<string, unknown>; sync: Record<string, unknown> }>();
let current: string | undefined;
let firefoxVersion: string;

/** Switch to another browser, keeping this one's storage for later. */
async function use(name: string) {
  const { local, sync } = fakeBrowser.storage;
  if (current) browsers.set(current, { local: await local.get(null), sync: await sync.get(null) });
  fakeBrowser.reset();
  const saved = browsers.get(name);
  if (saved) {
    await local.set(saved.local);
    await sync.set(saved.sync);
  }
  permissions(name);
  current = name;
}

/** The fake permissions API allows every request unless a test overrides it. */
function permissions(name: string) {
  Object.assign(fakeBrowser.permissions, { getAll: async () => ({ origins: [], permissions: [] }), contains: async () => true });
  Object.assign(fakeBrowser.runtime, {
    getBrowserInfo: async () => ({ name: name === 'firefox' ? 'Firefox' : 'Chrome', version: firefoxVersion }),
  });
}

const serverData = () => JSON.parse(server.files.get(FILE)!.body);
const sitesOf = (text: string) => Object.fromEntries(listSites(text).map((e) => [e.site, e.level]));

beforeEach(async () => {
  server = new FakeDav();
  vi.stubGlobal('fetch', server.fetch);
  browsers.clear();
  current = undefined;
  firefoxVersion = '140.0';
  await use('firefox');
});
afterEach(() => vi.unstubAllGlobals());

describe('syncing through a WebDAV server', () => {
  it('does nothing until a server is connected', async () => {
    expect(await syncWithServer()).toBeNull();
    expect(server.requests).toEqual([]);
  });

  it('requires Firefox 140 data consent before syncing', async () => {
    await connect(ACCOUNT);
    const contains = vi.fn(async () => false);
    Object.assign(fakeBrowser.permissions, { contains });

    expect((await syncWithServer())?.error).toBe('permission');
    expect(contains).toHaveBeenCalledWith({
      origins: ['https://dav.example/*'],
      data_collection: ['browsingActivity'],
    });
    expect(server.requests).toEqual([]);
  });

  it('does not fall back to host-only access if checking Firefox 140 consent fails', async () => {
    await connect(ACCOUNT);
    Object.assign(fakeBrowser.permissions, { contains: async () => { throw new Error('consent check failed'); } });

    expect((await syncWithServer())?.error).toBe('failed');
    expect(server.requests).toEqual([]);
  });

  it('checks only the server permission on older Firefox', async () => {
    firefoxVersion = '139.0';
    await connect(ACCOUNT);
    const contains = vi.fn(async () => true);
    Object.assign(fakeBrowser.permissions, { contains });

    expect((await syncWithServer())?.error).toBeUndefined();
    expect(contains).toHaveBeenCalledWith({ origins: ['https://dav.example/*'] });
    expect(server.requests.length).toBeGreaterThan(0);
  });

  it('keeps the file in a folder, or at a .json address as given', () => {
    expect(syncFileUrl('https://app.koofr.net/dav/Koofr')).toBe('https://app.koofr.net/dav/Koofr/anubis-sync.json');
    expect(syncFileUrl('https://x.teracloud.jp/dav/')).toBe('https://x.teracloud.jp/dav/anubis-sync.json');
    expect(syncFileUrl('https://example.org/dav/mine.json')).toBe('https://example.org/dav/mine.json');
  });

  it('creates the file from the first browser, in the backup format', async () => {
    await editPersonal((t) => setSite(t, 'a.com', 'pin', []));
    await connect(ACCOUNT);
    expect(await syncWithServer()).toEqual({ at: expect.any(Number) });
    const data = serverData();
    expect(data.anubis).toBe(1);
    expect(sitesOf(data.personal)).toMatchObject({ 'a.com': 'pin' });
  });

  it('gives a fresh browser everything from the server, without bringing back what the first removed', async () => {
    await editPersonal((t) => setSiteLevel(setSite(t, 'a.com', 'pin', []), 'fandom.com', 'normal'));
    await updateSettings({ theme: 'dark' });
    await connect(ACCOUNT);
    await syncWithServer();

    await use('chrome');
    await connect(ACCOUNT);
    await syncWithServer();
    expect(sitesOf(await loadPersonal())).toEqual({ 'a.com': 'pin' });
    expect((await collectData()).settings.theme).toBe('dark');
  });

  it('keeps the sites a browser already had when it joins', async () => {
    await editPersonal((t) => setSite(t, 'a.com', 'pin', []));
    await connect(ACCOUNT);
    await syncWithServer();

    await use('chrome');
    await editPersonal((t) => setSite(t, 'mine.com', 'raise', []));
    await connect(ACCOUNT);
    await syncWithServer();
    expect(sitesOf(await loadPersonal())).toMatchObject({ 'a.com': 'pin', 'mine.com': 'raise' });
    expect(sitesOf(serverData().personal)).toMatchObject({ 'a.com': 'pin', 'mine.com': 'raise' });
  });

  it('keeps changes made in both browsers', async () => {
    await connect(ACCOUNT);
    await syncWithServer();
    await use('chrome');
    await connect(ACCOUNT);
    await syncWithServer();

    await editPersonal((t) => setSite(t, 'from-chrome.com', 'hide', []));
    await use('firefox');
    await editPersonal((t) => setSite(t, 'from-firefox.com', 'raise', []));
    await updateSettings({ deeper: 2 });
    await syncWithServer();
    await use('chrome');
    await syncWithServer();
    await use('firefox');
    await syncWithServer();

    for (const name of ['firefox', 'chrome']) {
      await use(name);
      expect(sitesOf(await loadPersonal())).toMatchObject({ 'from-chrome.com': 'hide', 'from-firefox.com': 'raise' });
      expect((await collectData()).settings.deeper).toBe(2);
    }
  });

  it('merges again when another browser saved between reading and writing', async () => {
    await connect(ACCOUNT);
    await syncWithServer();
    await editPersonal((t) => setSite(t, 'mine.com', 'pin', []));
    server.beforePut = () => {
      const other = serverData();
      server.save(FILE, JSON.stringify({ ...other, personal: setSite(other.personal, 'theirs.com', 'hide', []) }));
    };
    expect((await syncWithServer())?.error).toBeUndefined();
    expect(sitesOf(serverData().personal)).toMatchObject({ 'mine.com': 'pin', 'theirs.com': 'hide' });
    expect(sitesOf(await loadPersonal())).toMatchObject({ 'mine.com': 'pin', 'theirs.com': 'hide' });
  });

  it('says why when the password is wrong or the folder doesn’t exist, and leaves the file alone', async () => {
    await connect({ ...ACCOUNT, password: 'wrong' });
    expect((await syncWithServer())?.error).toBe('auth');
    await connect({ ...ACCOUNT, url: 'https://dav.example/nowhere' });
    expect((await syncWithServer())?.error).toBe('folder');
    expect((await statusItem.getValue())?.error).toBe('folder');
    expect(server.files.size).toBe(0);
  });

  it('won’t overwrite a file it can’t read', async () => {
    server.save(FILE, '{"something": "else"}');
    await connect(ACCOUNT);
    expect((await syncWithServer())?.error).toBe('file');
    expect(server.files.get(FILE)!.body).toBe('{"something": "else"}');
  });

  it('asks the server only when something changed here', async () => {
    await connect(ACCOUNT);
    await syncWithServer();
    const before = server.requests.length;
    await syncChanges();
    expect(server.requests.length).toBe(before);
    await editPersonal((t) => setSite(t, 'new.com', 'hide', []));
    await syncChanges();
    expect(server.requests.length).toBeGreaterThan(before);
  });

  it('keeps the password out of browser sync', async () => {
    await connect(ACCOUNT);
    await syncWithServer();
    expect(JSON.stringify(await fakeBrowser.storage.sync.get(null))).not.toContain('app-password');
    expect(await accountItem.getValue()).toEqual(ACCOUNT);
  });
});
