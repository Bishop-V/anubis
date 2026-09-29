import { browser } from '#imports';
import { h } from '@/utils/dom';
import { t, type MessageKey } from '@/utils/i18n';
import { send } from '@/utils/messages';
import { personalIsLocal, SYNC_QUOTA_BYTES, syncBytesInUse } from '@/utils/storage';
import {
  accountItem,
  connect,
  disconnect,
  hasDataConsent,
  permissionsFor,
  statusItem,
  type PermissionRequest,
  type SyncErrorCode,
  type SyncStatus,
  type WebdavAccount,
} from '@/utils/webdav';
import { flash, flashed, rerender } from './flash';
import { pageTitle } from './parts';

// Settings → Sync: browser sync, which Anubis only has to explain, and optionally
// a WebDAV server for sharing between browsers.

/** What's typed into the connect form, kept across re-renders (which replace the inputs). */
const draft = { url: '', user: '', password: '' };
let syncing = false;

const ERRORS: Record<SyncErrorCode, MessageKey> = {
  auth: 'webdavErrorAuth',
  forbidden: 'webdavErrorForbidden',
  folder: 'webdavErrorFolder',
  permission: 'webdavErrorPermission',
  network: 'webdavErrorNetwork',
  file: 'webdavErrorFile',
  server: 'webdavErrorServer',
  failed: 'webdavErrorFailed',
};

const host = (account: WebdavAccount) => new URL(account.url).hostname;

/** A time today, or a date and time before today. */
function when(at: number): string {
  const today = new Date(at).toDateString() === new Date().toDateString();
  return new Date(at).toLocaleString(undefined, today ? { timeStyle: 'short' } : { dateStyle: 'medium', timeStyle: 'short' });
}

async function browserSyncPanel(): Promise<HTMLElement> {
  const android = import.meta.env.FIREFOX && /Android/.test(navigator.userAgent);
  const [local, bytes] = await Promise.all([personalIsLocal(), syncBytesInUse()]);
  const kb = (n: number) => Math.ceil(n / 1024);
  return h(
    'div',
    { class: 'panel' },
    h('h3', null, t('syncBrowserHeading')),
    h('p', { class: 'muted' }, t(android ? 'syncFirefoxAndroid' : import.meta.env.FIREFOX ? 'syncFirefox' : 'syncChrome')),
    android ? null : local ? h('div', { class: 'notice' }, t('syncTooBig')) : h('p', { class: 'muted' }, t('syncUsage', kb(bytes), kb(SYNC_QUOTA_BYTES))),
  );
}

/** Ask for what syncing needs, straight from the click (Firefox only asks during it), then sync. */
function syncNow(account: WebdavAccount, dataConsent: boolean, first = false): void {
  const asked = browser.permissions.request(permissionsFor(account.url, dataConsent) as PermissionRequest).catch(() => false);
  void asked.then(async (granted) => {
    if (!granted) {
      flash('sync', 'error', t('webdavDenied', host(account)));
      return rerender();
    }
    if (first) {
      await connect(account);
      draft.password = '';
    }
    syncing = true;
    rerender();
    await send({ type: 'sync-server' });
    syncing = false;
    rerender();
  });
}

function connectPanel(dataConsent: boolean): HTMLElement {
  const field = (id: keyof typeof draft, label: MessageKey, props: Record<string, unknown>, hint?: MessageKey) => {
    const input = h('input', { id: `webdav-${id}`, value: draft[id], spellcheck: false, ...props });
    input.addEventListener('input', () => (draft[id] = input.value));
    return [
      h('label', { attrs: { for: `webdav-${id}` } }, t(label)),
      input,
      hint ? h('span', { class: 'hint' }, t(hint)) : null,
    ];
  };
  const form = h(
    'form',
    { class: 'fields' },
    field('url', 'webdavAddress', { type: 'url', placeholder: 'https://' }, 'webdavAddressHint'),
    field('user', 'webdavUser', { type: 'text', autocomplete: 'username' }),
    field('password', 'webdavPassword', { type: 'password', autocomplete: 'current-password' }, 'webdavPasswordHint'),
    h('button', { class: 'btn primary', type: 'submit' }, t('webdavConnect')),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const account = { url: draft.url.trim(), user: draft.user.trim(), password: draft.password };
    let https = false;
    try {
      https = new URL(account.url).protocol === 'https:';
    } catch {
      // Not an address at all.
    }
    if (!https) flash('sync', 'error', t('webdavBadAddress'));
    else if (!account.user || !account.password) flash('sync', 'error', t('webdavMissingLogin'));
    else return syncNow(account, dataConsent, true);
    rerender();
  });
  return h(
    'div',
    { class: 'panel' },
    h('h3', null, t('webdavHeading')),
    h('p', { class: 'muted' }, t('webdavIntro')),
    form,
    h('p', { class: 'muted' }, t('webdavPrivacy')),
    flashed('sync'),
  );
}

function connectedPanel(account: WebdavAccount, status: SyncStatus | null, dataConsent: boolean): HTMLElement {
  const failed = status?.error && t(ERRORS[status.error], status.error === 'server' ? String(status.status ?? '') : host(account));
  const leave = async () => {
    await disconnect();
    if (dataConsent) await browser.permissions.remove({ data_collection: ['browsingActivity'] } as PermissionRequest).catch(() => false);
    Object.assign(draft, { url: account.url, user: account.user, password: '' });
    flash('sync', 'ok', t('webdavDisconnected'));
    rerender();
  };
  return h(
    'div',
    { class: 'panel' },
    h('h3', null, t('webdavHeading')),
    h('p', { class: 'muted' }, t('webdavConnected', host(account), account.user), ' ', t('webdavWhen')),
    syncing
      ? h('div', { class: 'notice' }, t('webdavSyncing'))
      : failed
        ? h('div', { class: 'notice error' }, failed, ' ', t('webdavLastTried', when(status!.at)))
        : status
          ? h('div', { class: 'notice ok' }, t('webdavLastSync', when(status.at)))
          : null,
    h(
      'div',
      { class: 'toolbar', style: 'margin-top:12px' },
      h('button', { class: 'btn primary', type: 'button', disabled: syncing, on: { click: () => syncNow(account, dataConsent) } }, t('webdavSyncNow')),
      h('button', { class: 'btn ghost', type: 'button', on: { click: () => void leave() } }, t('webdavDisconnect')),
    ),
    flashed('sync'),
  );
}

export async function renderSync(): Promise<HTMLElement> {
  const [account, status, dataConsent] = await Promise.all([accountItem.getValue(), statusItem.getValue(), hasDataConsent()]);
  return h(
    'div',
    null,
    pageTitle(t('syncHeading'), t('syncIntro')),
    await browserSyncPanel(),
    account ? connectedPanel(account, status, dataConsent) : connectPanel(dataConsent),
  );
}

/** Calls back when the connected server or the last sync's outcome changes. */
export function watchSync(cb: () => void): () => void {
  const unwatch = [accountItem.watch(cb), statusItem.watch(cb)];
  return () => unwatch.forEach((u) => u());
}
