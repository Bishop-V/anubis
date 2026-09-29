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
  supportsDataConsent,
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
const draft = { url: '', user: '', password: '', encryptionPassphrase: '', encryptionConfirmation: '', encrypt: true };
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
  encrypted: 'webdavErrorNeedsPassphrase',
  passphrase: 'webdavErrorWrongPassphrase',
  unencrypted: 'webdavErrorUnencrypted',
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
function syncNow(account: WebdavAccount, requestDataConsent: boolean, first = false, saveAccount = false): void {
  const asked = browser.permissions.request(permissionsFor(account.url, requestDataConsent) as PermissionRequest).catch(() => false);
  void asked.then(async (granted) => {
    if (!granted) {
      flash('sync', 'error', t('webdavDenied', host(account)));
      return rerender();
    }
    if (first) {
      await connect(account);
      draft.password = '';
      draft.encryptionPassphrase = '';
      draft.encryptionConfirmation = '';
    } else if (saveAccount) await accountItem.setValue(account);
    syncing = true;
    rerender();
    await send({ type: 'sync-server' });
    syncing = false;
    rerender();
  });
}

function connectPanel(requestDataConsent: boolean): HTMLElement {
  let passphrase: HTMLElement;
  const field = (id: 'url' | 'user' | 'password' | 'encryptionPassphrase' | 'encryptionConfirmation', label: MessageKey, props: Record<string, unknown>, hint?: MessageKey) => {
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
    h(
      'label',
      { class: 'check-row' },
      h('input', {
        type: 'checkbox',
        checked: draft.encrypt,
        on: {
          change: (event: Event) => {
            draft.encrypt = (event.currentTarget as HTMLInputElement).checked;
            passphrase.hidden = !draft.encrypt;
          },
        },
      }),
      t('webdavEncrypt'),
    ),
    (passphrase = h(
      'div',
      { class: 'passphrase-fields' },
      ...field('encryptionPassphrase', 'webdavEncryptionPassphrase', { type: 'password', autocomplete: 'new-password' }, 'webdavEncryptionHint'),
      ...field('encryptionConfirmation', 'webdavConfirmPassphrase', { type: 'password', autocomplete: 'new-password' }),
    )),
    h('button', { class: 'btn primary', type: 'submit' }, t('webdavConnect')),
  );
  passphrase.hidden = !draft.encrypt;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const account = {
      url: draft.url.trim(),
      user: draft.user.trim(),
      password: draft.password,
      ...(draft.encrypt && { encryptionPassphrase: draft.encryptionPassphrase }),
    };
    let https = false;
    try {
      https = new URL(account.url).protocol === 'https:';
    } catch {
      // Not an address at all.
    }
    if (!https) flash('sync', 'error', t('webdavBadAddress'));
    else if (!account.user || !account.password) flash('sync', 'error', t('webdavMissingLogin'));
    else if (draft.encrypt && draft.encryptionPassphrase.length < 12) flash('sync', 'error', t('webdavEncryptionShort'));
    else if (draft.encrypt && draft.encryptionPassphrase !== draft.encryptionConfirmation) flash('sync', 'error', t('webdavPassphraseMismatch'));
    else return syncNow(account, requestDataConsent, true);
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

function encryptionSetup(account: WebdavAccount, requestDataConsent: boolean, updateKey: boolean): HTMLElement {
  const input = h('input', { id: 'webdav-encryption-passphrase', type: 'password', autocomplete: 'new-password' });
  const confirmation = h('input', { id: 'webdav-encryption-confirmation', type: 'password', autocomplete: 'new-password' });
  const form = h(
    'form',
    { class: 'fields' },
    h('label', { attrs: { for: 'webdav-encryption-passphrase' } }, t(updateKey ? 'webdavCorrectPassphrase' : 'webdavEncryptionPassphrase')),
    input,
    h('span', { class: 'hint' }, t(updateKey ? 'webdavCorrectPassphraseHint' : 'webdavEncryptionHint')),
    h('label', { attrs: { for: 'webdav-encryption-confirmation' } }, t('webdavConfirmPassphrase')),
    confirmation,
    h('button', { class: 'btn primary', type: 'submit' }, t('webdavSavePassphrase')),
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (input.value.length < 12) {
      flash('sync', 'error', t('webdavEncryptionShort'));
      return rerender();
    }
    if (input.value !== confirmation.value) {
      flash('sync', 'error', t('webdavPassphraseMismatch'));
      return rerender();
    }
    const encryptedAccount = { ...account, encryptionPassphrase: input.value };
    syncNow(encryptedAccount, requestDataConsent, false, true);
  });
  return form;
}

function connectedPanel(account: WebdavAccount, status: SyncStatus | null, dataConsent: boolean, requestDataConsent: boolean): HTMLElement {
  const failed = status?.error && t(ERRORS[status.error], status.error === 'server' ? String(status.status ?? '') : host(account));
  const leave = async () => {
    await disconnect();
    if (dataConsent) await browser.permissions.remove({ data_collection: ['browsingActivity'] } as PermissionRequest).catch(() => false);
    Object.assign(draft, { url: account.url, user: account.user, password: '', encryptionPassphrase: '', encryptionConfirmation: '', encrypt: true });
    flash('sync', 'ok', t('webdavDisconnected'));
    rerender();
  };
  return h(
    'div',
    { class: 'panel' },
    h('h3', null, t('webdavHeading')),
    h('p', { class: 'muted' }, t('webdavConnected', host(account), account.user), ' ', t('webdavWhen')),
    h(
      'p',
      { class: 'muted' },
      t(account.encryptionReady ? 'webdavEncrypted' : account.encryptionPassphrase ? 'webdavEncryptionPending' : 'webdavEncryptionMissing'),
    ),
    !account.encryptionPassphrase || status?.error === 'passphrase' || status?.error === 'encrypted'
      ? encryptionSetup(account, requestDataConsent, Boolean(account.encryptionPassphrase))
      : null,
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
      h('button', { class: 'btn primary', type: 'button', disabled: syncing, on: { click: () => syncNow(account, requestDataConsent) } }, t('webdavSyncNow')),
      h('button', { class: 'btn', type: 'button', on: { click: () => void leave() } }, t('webdavDisconnect')),
    ),
    flashed('sync'),
  );
}

export async function renderSync(): Promise<HTMLElement> {
  const [account, status, dataConsent, requestDataConsent] = await Promise.all([
    accountItem.getValue(),
    statusItem.getValue(),
    hasDataConsent(),
    supportsDataConsent(),
  ]);
  return h(
    'div',
    null,
    pageTitle(t('syncHeading'), t('syncIntro')),
    await browserSyncPanel(),
    account ? connectedPanel(account, status, dataConsent, requestDataConsent) : connectPanel(requestDataConsent),
  );
}

/** Calls back when the connected server or the last sync's outcome changes. */
export function watchSync(cb: () => void): () => void {
  const unwatch = [accountItem.watch(cb), statusItem.watch(cb)];
  return () => unwatch.forEach((u) => u());
}
