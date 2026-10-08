import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { collectData, toBackup } from '@/utils/backup';
import { listSites, setSite, setSiteLevel } from '@/utils/personal';
import { editPersonal, loadPersonal, setTagPref, tagPrefsItem, updateSettings } from '@/utils/storage';
import { accountItem, changeEncryptionPassphrase, connect, disconnect, statusItem, syncChanges, syncFileUrl, syncWithServer } from '@/utils/webdav';
import { decryptSyncData, encryptSyncData, isEncryptedSyncFile } from '@/utils/webdav-crypto';

// Two browsers (each with its own storage, as Firefox and Chrome have) syncing
// through one fake WebDAV server.

const FOLDER = 'https://dav.example/files/me';
const FILE = `${FOLDER}/anubis-sync.json`;
const ACCOUNT = { url: FOLDER, user: 'me', password: 'app-password' };
const ENCRYPTED_ACCOUNT = { ...ACCOUNT, encryptionPassphrase: 'a long sync passphrase' };

class FakeDav {
  files = new Map<string, { body: string; etag: string }>();
  requests: string[] = [];
  /** Runs before the next PUT is handled: another browser saving in between. */
  beforePut?: () => void;
  putStatus?: number;
  /** Saves the next PUT, then loses the answer: the connection drops on the way back. */
  dropPutAnswer = false;
  /** Fails every request after the next PUT, as if the network went away. */
  offlineAfterPut = false;
  private offline = false;
  private version = 0;

  save(url: string, body: string) {
    this.files.set(url, { body, etag: `"${++this.version}"` });
  }

  fetch = async (input: string | URL, init: RequestInit = {}): Promise<Response> => {
    const url = String(input);
    const headers = init.headers as Record<string, string>;
    this.requests.push(`${init.method} ${url}`);
    if (this.offline) throw new TypeError('Failed to fetch');
    if (headers.Authorization !== `Basic ${btoa('me:app-password')}`) return new Response(null, { status: 401 });
    if (init.method === 'GET') {
      const file = this.files.get(url);
      return file ? new Response(file.body, { headers: { ETag: file.etag } }) : new Response(null, { status: 404 });
    }
    const hook = this.beforePut;
    this.beforePut = undefined;
    hook?.();
    if (this.putStatus) return new Response(null, { status: this.putStatus });
    const file = this.files.get(url);
    if (headers['If-Match'] && headers['If-Match'] !== file?.etag) return new Response(null, { status: 412 });
    if (headers['If-None-Match'] === '*' && file) return new Response(null, { status: 412 });
    if (!url.startsWith(`${FOLDER}/`)) return new Response(null, { status: 409 });
    this.save(url, String(init.body));
    if (this.offlineAfterPut) this.offline = true;
    if (this.dropPutAnswer || this.offline) {
      this.dropPutAnswer = false;
      throw new TypeError('Failed to fetch');
    }
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
  firefoxVersion = '142.0';
  await use('firefox');
});
afterEach(() => vi.unstubAllGlobals());

describe('syncing through a WebDAV server', () => {
  it('does nothing until a server is connected', async () => {
    expect(await syncWithServer()).toBeNull();
    expect(server.requests).toEqual([]);
  });

  it('requires Firefox data consent before syncing', async () => {
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

  it('does not fall back to host-only access if checking Firefox consent fails', async () => {
    await connect(ACCOUNT);
    Object.assign(fakeBrowser.permissions, { contains: async () => { throw new Error('consent check failed'); } });

    expect((await syncWithServer())?.error).toBe('failed');
    expect(server.requests).toEqual([]);
  });

  it('checks only the server permission in Chrome', async () => {
    await connect(ACCOUNT);
    Object.assign(fakeBrowser.runtime, { getBrowserInfo: async () => ({ name: 'Chrome', version: '148.0' }) });
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

  it('encrypts the server copy so it contains no readable sync data', async () => {
    await editPersonal((text) => setSite(text, 'private.example', 'pin', []));
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();

    const body = server.files.get(FILE)!.body;
    expect(isEncryptedSyncFile(body)).toBe(true);
    expect(body).not.toContain('private.example');
    expect(body).not.toContain('personal');
    expect(body).not.toContain(ENCRYPTED_ACCOUNT.encryptionPassphrase);
    expect((await decryptSyncData(body, ENCRYPTED_ACCOUNT.encryptionPassphrase)).personal).toContain('private.example');
  });

  it('shares encrypted data with another browser using the same passphrase', async () => {
    await editPersonal((text) => setSite(text, 'encrypted.example', 'raise', []));
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();

    await use('chrome');
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();

    expect(sitesOf(await loadPersonal())).toMatchObject({ 'encrypted.example': 'raise' });
  });

  it('never replaces an encrypted file when the passphrase is missing or wrong', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    const encryptedFile = server.files.get(FILE)!.body;

    await use('chrome');
    await connect(ACCOUNT);
    expect((await syncWithServer())?.error).toBe('encrypted');
    expect(server.files.get(FILE)!.body).toBe(encryptedFile);

    await connect({ ...ACCOUNT, encryptionPassphrase: 'a different wrong passphrase' });
    expect((await syncWithServer())?.error).toBe('passphrase');
    expect(server.files.get(FILE)!.body).toBe(encryptedFile);
  });

  it('upgrades a legacy plaintext file when encryption is enabled', async () => {
    await editPersonal((text) => setSite(text, 'legacy.example', 'pin', []));
    await connect(ACCOUNT);
    await syncWithServer();
    await accountItem.setValue(ENCRYPTED_ACCOUNT);
    await syncWithServer();

    const body = server.files.get(FILE)!.body;
    expect(isEncryptedSyncFile(body)).toBe(true);
    expect((await decryptSyncData(body, ENCRYPTED_ACCOUNT.encryptionPassphrase)).personal).toContain('legacy.example');
  });

  it('does not accept a plaintext downgrade after encryption is established', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    const encrypted = server.files.get(FILE)!.body;
    const clearData = await decryptSyncData(encrypted, ENCRYPTED_ACCOUNT.encryptionPassphrase);
    server.save(FILE, JSON.stringify(toBackup(clearData)));

    expect((await syncWithServer())?.error).toBe('unencrypted');
    expect(server.files.get(FILE)!.body).toContain('"anubis":1');
    expect((await accountItem.getValue())?.encryptionReady).toBe(true);
  });

  it('changes the passphrase only after re-encrypting the shared file', async () => {
    await editPersonal((text) => setSite(text, 'rotation.example', 'pin', []));
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();

    expect((await changeEncryptionPassphrase('a different new passphrase'))?.error).toBeUndefined();
    const body = server.files.get(FILE)!.body;
    expect(isEncryptedSyncFile(body)).toBe(true);
    expect((await decryptSyncData(body, 'a different new passphrase')).personal).toContain('rotation.example');
    await expect(decryptSyncData(body, ENCRYPTED_ACCOUNT.encryptionPassphrase)).rejects.toThrow();
    expect((await accountItem.getValue())?.encryptionPassphrase).toBe('a different new passphrase');
  });

  it('leaves the file and saved passphrase unchanged when the current passphrase is wrong', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    const original = server.files.get(FILE)!.body;
    const wrong = { ...ENCRYPTED_ACCOUNT, encryptionPassphrase: 'wrong current passphrase' };
    await accountItem.setValue(wrong);

    expect((await changeEncryptionPassphrase('a different new passphrase'))?.error).toBe('passphrase');
    expect(server.files.get(FILE)!.body).toBe(original);
    expect(await accountItem.getValue()).toEqual(wrong);
  });

  it('does not overwrite a concurrent server edit while changing the passphrase', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    const concurrent = await encryptSyncData(await collectData(), ENCRYPTED_ACCOUNT.encryptionPassphrase);
    server.beforePut = () => server.save(FILE, concurrent);

    expect((await changeEncryptionPassphrase('a different new passphrase'))?.error).toBe('changed');
    expect(server.files.get(FILE)!.body).toBe(concurrent);
    expect((await accountItem.getValue())?.encryptionPassphrase).toBe(ENCRYPTED_ACCOUNT.encryptionPassphrase);
  });

  it('keeps the old passphrase when the server rejects the replacement file', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    const original = server.files.get(FILE)!.body;
    server.putStatus = 500;

    expect((await changeEncryptionPassphrase('a different new passphrase'))).toMatchObject({ error: 'server', status: 500 });
    expect(server.files.get(FILE)!.body).toBe(original);
    expect((await accountItem.getValue())?.encryptionPassphrase).toBe(ENCRYPTED_ACCOUNT.encryptionPassphrase);
  });

  it('saves the new passphrase when the server took the file but its answer was lost', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    server.dropPutAnswer = true;

    expect((await changeEncryptionPassphrase('a different new passphrase'))?.error).toBeUndefined();
    await decryptSyncData(server.files.get(FILE)!.body, 'a different new passphrase');
    expect((await accountItem.getValue())?.encryptionPassphrase).toBe('a different new passphrase');
    expect((await syncWithServer())?.error).toBeUndefined();
  });

  it('says the outcome is unknown when the server cannot be reached to check the new passphrase', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    server.offlineAfterPut = true;

    expect((await changeEncryptionPassphrase('a different new passphrase'))?.error).toBe('unconfirmed');
    expect((await statusItem.getValue())?.error).toBe('unconfirmed');
  });

  it('does not reconnect a server that was disconnected while the passphrase changed', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    server.beforePut = () => void disconnect();

    await changeEncryptionPassphrase('a different new passphrase');
    expect(await accountItem.getValue()).toBeNull();
    expect(await statusItem.getValue()).toBeNull();
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

  it('keeps the WebDAV login and encryption passphrase out of browser sync', async () => {
    await connect(ENCRYPTED_ACCOUNT);
    await syncWithServer();
    const syncStorage = JSON.stringify(await fakeBrowser.storage.sync.get(null));
    expect(syncStorage).not.toContain('app-password');
    expect(syncStorage).not.toContain(ENCRYPTED_ACCOUNT.encryptionPassphrase);
    expect(await accountItem.getValue()).toMatchObject(ENCRYPTED_ACCOUNT);
  });

  it('keeps settings and tag choices made in both browsers, and a choice set back', async () => {
    await connect(ACCOUNT);
    await syncWithServer();
    await use('chrome');
    await connect(ACCOUNT);
    await syncWithServer();

    await setTagPref('ai', { action: 'hide', color: '#112233' });
    await setTagPref('wiki', { action: 'raise' });
    await updateSettings((s) => ({ engines: { ...s.engines, bing: false } }));
    await syncWithServer();
    await use('firefox');
    await setTagPref('forum', { label: 'Forums', muted: true });
    await updateSettings((s) => ({ cleanup: { ...s.cleanup, ai: true }, hideStyle: 'dim' }));
    await syncWithServer();
    await setTagPref('wiki', { action: undefined });
    await syncWithServer();
    await use('chrome');
    await syncWithServer();

    for (const name of ['chrome', 'firefox']) {
      await use(name);
      const { settings, tagPrefs } = await collectData();
      expect(tagPrefs).toEqual({ ai: { action: 'hide', color: '#112233' }, wiki: {}, forum: { label: 'Forums', muted: true } });
      expect(settings).toMatchObject({ engines: { bing: false }, hideStyle: 'dim' });
      expect(settings.cleanup.ai).toBe(true);
    }
    expect(serverData().tagPrefs).toEqual((await collectData()).tagPrefs);
  });
});
