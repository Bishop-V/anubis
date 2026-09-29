import { browser, storage } from '#imports';
import { applyData, collectData, freshInstall, mergeData, toBackup, type SyncData } from './backup';
import { deepEqual } from './merge';
import { decryptSyncData, EncryptedFileError, encryptSyncData, isEncryptedSyncFile } from './webdav-crypto';

// Syncing through a WebDAV server, to share between browsers: browser sync only
// reaches the same browser on other computers. Off unless the user connects a
// server in Settings → Sync. Each browser reads and writes one file there, in the
// backup format, and merges it with what it has. `local:webdavBase` holds what
// both had at the last sync, so changes made on either side since then survive.

export interface WebdavAccount {
  /** The folder's address, as entered (or a .json file's). */
  url: string;
  user: string;
  password: string;
  /** A sync-file key saved only in this browser; never sent to the server. */
  encryptionPassphrase?: string;
  /** Set after the connected file has been encrypted successfully. */
  encryptionReady?: boolean;
}

export type SyncErrorCode = 'auth' | 'forbidden' | 'folder' | 'permission' | 'network' | 'file' | 'encrypted' | 'passphrase' | 'unencrypted' | 'changed' | 'unconfirmed' | 'server' | 'failed';

export interface SyncStatus {
  /** When the last sync finished. */
  at: number;
  /** Why it failed; absent when it worked. */
  error?: SyncErrorCode;
  /** The HTTP status, for `server`. */
  status?: number;
}

// All on this device: the password never goes into browser sync, and each browser
// connects on its own.
export const accountItem = storage.defineItem<WebdavAccount | null>('local:webdav', { fallback: null });
export const statusItem = storage.defineItem<SyncStatus | null>('local:webdavStatus', { fallback: null });
const baseItem = storage.defineItem<SyncData | null>('local:webdavBase', { fallback: null });

export const SYNC_FILE = 'anubis-sync.json';

function sameAccount(a: WebdavAccount | null, b: WebdavAccount): boolean {
  return Boolean(a && a.url === b.url && a.user === b.user && a.password === b.password && a.encryptionPassphrase === b.encryptionPassphrase);
}

let operationTail: Promise<void> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = operationTail.then(operation, operation);
  operationTail = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

/** The sync file's address: the address itself if it names a .json file, otherwise `anubis-sync.json` in that folder. */
export function syncFileUrl(address: string): string {
  const url = new URL(address.trim());
  if (!/\.json$/i.test(url.pathname)) url.pathname = `${url.pathname.replace(/\/+$/, '')}/${SYNC_FILE}`;
  return url.href;
}

/**
 * What syncing with this address needs: access to its host and, where Firefox
 * asks for consent to send data (Firefox 140 and later), consent to send the
 * list. Firefox counts the sites in it as browsing activity.
 */
export function permissionsFor(address: string, requestDataConsent: boolean): { origins: string[]; data_collection?: string[] } {
  const origins = [`https://${new URL(address.trim()).hostname}/*`];
  return requestDataConsent ? { origins, data_collection: ['browsingActivity'] } : { origins };
}

/** `permissions.request` and `contains` take `data_collection` in Firefox 140 and later; the types don't know it yet. */
export type PermissionRequest = Parameters<typeof browser.permissions.request>[0];

/** Whether this browser requires Firefox's built-in data-transmission consent for WebDAV. */
export async function supportsDataConsent(): Promise<boolean> {
  const runtime = browser.runtime as typeof browser.runtime & {
    getBrowserInfo?: () => Promise<{ name: string; version: string }>;
  };
  const info = await runtime.getBrowserInfo?.();
  if (!info || info.name !== 'Firefox') return false;
  const major = Number.parseInt(info.version, 10);
  if (!Number.isInteger(major)) throw new Error(`Unexpected Firefox version: ${info.version}`);
  return major >= 140;
}

/** Whether this browser has Firefox's consent for sending data (`permissions.getAll` then lists `data_collection`). */
export async function hasDataConsent(): Promise<boolean> {
  return 'data_collection' in (await browser.permissions.getAll());
}

class SyncError extends Error {
  constructor(
    readonly code: SyncErrorCode,
    readonly status?: number,
  ) {
    super(status ? `${code} (HTTP ${status})` : code);
  }
}

function httpError(status: number): SyncError {
  if (status === 401) return new SyncError('auth');
  if (status === 403) return new SyncError('forbidden');
  // 409: WebDAV's answer to saving into a folder that doesn't exist.
  if (status === 404 || status === 409) return new SyncError('folder');
  return new SyncError('server', status);
}

async function request(account: WebdavAccount, method: 'GET' | 'PUT', url: string, headers: Record<string, string> = {}, body?: string) {
  const login = new TextEncoder().encode(`${account.user}:${account.password}`);
  try {
    return await fetch(url, {
      method,
      body,
      headers: { Authorization: `Basic ${btoa(String.fromCharCode(...login))}`, ...headers },
      // No cookies: Nextcloud prefers a signed-in browser session to the password,
      // and turns the request down. And never a cached copy of the file.
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new SyncError('network');
  }
}

const TRIES = 3;

async function syncOnce(account: WebdavAccount): Promise<void> {
  const url = syncFileUrl(account.url);
  const needed = permissionsFor(account.url, await supportsDataConsent());
  const allowed = await browser.permissions.contains(needed as PermissionRequest);
  if (!allowed) throw new SyncError('permission');
  for (let attempt = 1; ; attempt++) {
    const last = attempt === TRIES;
    const got = await request(account, 'GET', url);
    let remote: SyncData | undefined;
    let encryptedRemote = false;
    if (got.status !== 404) {
      if (!got.ok) throw httpError(got.status);
      const text = await got.text();
      try {
        encryptedRemote = isEncryptedSyncFile(text);
        if (account.encryptionPassphrase && account.encryptionReady && !encryptedRemote) throw new SyncError('unencrypted');
        remote = await decryptSyncData(text, account.encryptionPassphrase);
      } catch (error) {
        if (error instanceof SyncError) throw error;
        if (error instanceof EncryptedFileError && (error.reason === 'encrypted' || error.reason === 'passphrase')) throw new SyncError(error.reason);
        throw new SyncError('file');
      }
    }
    const etag = got.headers.get('ETag');
    const [local, base] = await Promise.all([collectData(), baseItem.getValue()]);
    // A first sync starts from what a fresh install has, so an untouched browser
    // takes everything from the server, and the server's side wins where both
    // changed the same thing.
    const merged = remote ? mergeData(base ?? freshInstall(), local, remote, base ? 'local' : 'remote') : local;
    if (!deepEqual(merged, local)) {
      // Something changed here while the server answered: start again with it.
      if (!last && !deepEqual(await collectData(), local)) continue;
      await applyData(merged, local);
    }
    if (!remote || !deepEqual(merged, remote) || (account.encryptionPassphrase && !encryptedRemote)) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      // Only replace the copy just read. If another browser saved in between, the
      // server refuses (412) and this merges again. A weak ETag (W/) never matches.
      if (!last && remote && etag && !etag.startsWith('W/')) headers['If-Match'] = etag;
      if (!last && !remote) headers['If-None-Match'] = '*';
      const body = account.encryptionPassphrase ? await encryptSyncData(merged, account.encryptionPassphrase) : JSON.stringify(toBackup(merged), null, 2);
      const put = await request(account, 'PUT', url, headers, body);
      if (put.status === 412 && !last) continue;
      if (put.status === 412) throw new SyncError('changed');
      if (!put.ok) throw httpError(put.status);
    }
    // Unless another server was connected meanwhile, whose first sync starts afresh.
    if (deepEqual(await accountItem.getValue(), account)) {
      await baseItem.setValue(merged);
      if (account.encryptionPassphrase && !account.encryptionReady) await accountItem.setValue({ ...account, encryptionReady: true });
    }
    return;
  }
}

let running: Promise<SyncStatus | null> | undefined;
let queued: Promise<SyncStatus | null> | undefined;

/**
 * Sync with the connected server, if there is one. One sync at a time: a call
 * during one runs once more after it, for changes it may have missed.
 */
export function syncWithServer(): Promise<SyncStatus | null> {
  if (running) {
    queued ??= running.then(() => {
      queued = undefined;
      return syncWithServer();
    });
    return queued;
  }
  running = serialize(async () => {
    const account = await accountItem.getValue();
    if (!account) return null;
    let status: SyncStatus;
    try {
      await syncOnce(account);
      status = { at: Date.now() };
    } catch (error) {
      console.warn('[anubis] sync with the server failed', error);
      status = error instanceof SyncError ? { at: Date.now(), error: error.code, status: error.status } : { at: Date.now(), error: 'failed' };
    }
    // Disconnected meanwhile: leave nothing behind.
    if (sameAccount(await accountItem.getValue(), account)) await statusItem.setValue(status);
    return status;
  }).finally(() => {
    running = undefined;
  });
  return running;
}

/**
 * Whether the server's file opens with this passphrase: for when a save's answer
 * was lost or an error, since the server may have saved it anyway.
 */
async function fileOpensWith(account: WebdavAccount, url: string, passphrase: string): Promise<boolean> {
  let got: Response;
  try {
    got = await request(account, 'GET', url);
  } catch {
    throw new SyncError('unconfirmed');
  }
  if (!got.ok) throw new SyncError('unconfirmed');
  try {
    await decryptSyncData(await got.text(), passphrase);
    return true;
  } catch {
    return false;
  }
}

/**
 * Re-encrypt the shared file under a new passphrase. The current file must be
 * readable here and support a strong ETag so concurrent writes cannot be lost.
 * Runs in the background script, where `serialize` also holds syncs back.
 */
export function changeEncryptionPassphrase(nextPassphrase: string): Promise<SyncStatus | null> {
  return serialize(async () => {
    const account = await accountItem.getValue();
    if (!account?.encryptionPassphrase) return null;
    let status: SyncStatus;
    try {
      if (nextPassphrase.length < 12) throw new SyncError('failed');
      const url = syncFileUrl(account.url);
      const needed = permissionsFor(account.url, await supportsDataConsent());
      if (!(await browser.permissions.contains(needed as PermissionRequest))) throw new SyncError('permission');
      const got = await request(account, 'GET', url);
      if (got.status === 404) throw new SyncError('file');
      if (!got.ok) throw httpError(got.status);
      const etag = got.headers.get('ETag');
      if (!etag || etag.startsWith('W/')) throw new SyncError('changed');
      const text = await got.text();
      if (!isEncryptedSyncFile(text)) throw new SyncError('unencrypted');
      const data = await decryptSyncData(text, account.encryptionPassphrase);
      const body = await encryptSyncData(data, nextPassphrase);
      if (!sameAccount(await accountItem.getValue(), account)) throw new SyncError('changed');
      let put: Response | undefined;
      try {
        put = await request(account, 'PUT', url, { 'Content-Type': 'application/json', 'If-Match': etag }, body);
      } catch (error) {
        if (!(error instanceof SyncError) || error.code !== 'network') throw error;
      }
      if (put?.status === 412) throw new SyncError('changed');
      // A refusal (4xx) saved nothing. No answer, or a server error, may have come
      // after the file was saved: then only the new passphrase opens it.
      if (put && !put.ok && put.status < 500) throw httpError(put.status);
      if (!put?.ok && !(await fileOpensWith(account, url, nextPassphrase))) throw put ? httpError(put.status) : new SyncError('network');
      // Disconnected or changed meanwhile: don't bring the old connection back.
      if (sameAccount(await accountItem.getValue(), account)) {
        await accountItem.setValue({ ...account, encryptionPassphrase: nextPassphrase, encryptionReady: true });
      }
      status = { at: Date.now() };
    } catch (error) {
      console.warn('[anubis] changing the sync encryption passphrase failed', error);
      status =
        error instanceof SyncError
          ? { at: Date.now(), error: error.code, status: error.status }
          : error instanceof EncryptedFileError
            ? { at: Date.now(), error: error.reason === 'passphrase' ? 'passphrase' : error.reason === 'encrypted' ? 'encrypted' : 'file' }
            : { at: Date.now(), error: 'failed' };
    }
    const current = await accountItem.getValue();
    if (sameAccount(current, account) || current?.encryptionPassphrase === nextPassphrase) await statusItem.setValue(status);
    return status;
  });
}

/** Sync if something changed here since the last sync. */
export async function syncChanges(): Promise<void> {
  if (!(await accountItem.getValue())) return;
  const [local, base] = await Promise.all([collectData(), baseItem.getValue()]);
  if (!base || !deepEqual(local, base)) await syncWithServer();
}

const DUE_MS = 5 * 60 * 1000;

/** Sync unless the last one was under five minutes ago: for search pages, which open often. */
export async function syncIfDue(): Promise<void> {
  const status = await statusItem.getValue();
  if (!status || Date.now() - status.at >= DUE_MS) await syncWithServer();
}

/** Remember the server. The first sync with it merges from scratch. */
export async function connect(account: WebdavAccount): Promise<void> {
  await Promise.all([baseItem.removeValue(), statusItem.removeValue()]);
  await accountItem.setValue(account);
}

/** Forget the server. The file stays on it. */
export async function disconnect(): Promise<void> {
  await Promise.all([accountItem.removeValue(), baseItem.removeValue(), statusItem.removeValue()]);
}
