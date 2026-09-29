import { browser, defineBackground, storage } from '#imports';
import { t } from '@/utils/i18n';
import { readSubscribeLink, subscribeQuery } from '@/utils/links';
import { hiddenCount, sendToActiveTab, type Message } from '@/utils/messages';
import {
  getSettings,
  migrateLegacy,
  migrateSettings,
  settingsItem,
  subscriptionsItem,
  tagPrefsItem,
  updateSettings,
  watchPersonal,
} from '@/utils/storage';
import { refreshStale } from '@/utils/subscriptions';
import { recordColorScheme } from '@/utils/theme';
import { changeEncryptionPassphrase, syncChanges, syncIfDue, syncWithServer } from '@/utils/webdav';

// The background script keeps subscribed lists fresh, shows the hidden-result
// count on the toolbar icon, greys the icon out while Anubis is off, unpacks your
// list when it arrives from sync, syncs with a WebDAV server if one is connected,
// and opens the welcome page on first install. Updates run when the browser starts and when a
// search page asks, at most every 30 minutes, so no "alarms" permission is needed.

const LAST_CHECK = 'local:lastUpdateCheck' as const;
const CHECK_EVERY_MS = 30 * 60 * 1000;

export default defineBackground(() => {
  // MV3 has `action`; Firefox MV2 has `browserAction`.
  const action = browser.action ?? browser.browserAction;

  // Badges belong to a document, not to the tab indefinitely. Clear the old
  // count as soon as navigation starts; the next search page will report anew.
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') void action.setBadgeText({ tabId, text: '' });
  });

  // Grey icon while off. Set on every start of the background script, since the
  // browser doesn't keep a changed icon across restarts.
  const showEnabled = (enabled: boolean) => {
    const dir = enabled ? 'icon' : 'icon-off';
    void action.setIcon({ path: { 16: `/${dir}/16.png`, 32: `/${dir}/32.png`, 48: `/${dir}/48.png` } });
    void action.setTitle({ title: enabled ? 'Anubis' : t('toolbarOff') });
  };
  void getSettings().then((s) => showEnabled(s.enabled));
  settingsItem.watch((s) => showEnabled(s?.enabled !== false));

  // Firefox's background page sees light or dark as the popup will. Chrome's service
  // worker can't (no matchMedia), but there search pages see the same.
  recordColorScheme();

  // Syncing with a WebDAV server, when one is connected (Settings → Sync): a few
  // seconds after a change here, when the browser starts, and when a search page
  // opens, at most every 5 minutes. Changes the sync itself makes match what it
  // last synced, so they don't start another.
  let changed: ReturnType<typeof setTimeout> | undefined;
  const syncSoon = () => {
    clearTimeout(changed);
    changed = setTimeout(() => void syncChanges(), 3000);
  };
  settingsItem.watch(syncSoon);
  tagPrefsItem.watch(syncSoon);
  subscriptionsItem.watch(syncSoon);
  // Reading the list when it arrives from browser sync also unpacks it into this
  // device's copy, so search pages find it ready even if they can't unpack it.
  watchPersonal(syncSoon);

  // One update at a time. "Update all" (forced) doesn't settle for a routine check
  // that's already running: it runs straight after it.
  let running: Promise<number> | undefined;
  let runningForced = false;
  const refresh = (force = false): Promise<number> => {
    if (running && (runningForced || !force)) return running;
    const before = running;
    const run: Promise<number> = (async () => {
      await before;
      return refreshStale(force);
    })()
      .catch((error) => {
        console.warn('[anubis] list update failed', error);
        return 0;
      })
      .finally(() => {
        if (running === run) running = undefined;
      });
    running = run;
    runningForced = force;
    return run;
  };

  const maybeRefresh = async () => {
    const last = (await storage.getItem<number>(LAST_CHECK)) ?? 0;
    if (Date.now() - last < CHECK_EVERY_MS) return;
    await storage.setItem(LAST_CHECK, Date.now());
    await refresh();
  };

  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    // First install only: how to keep Anubis in the toolbar, and a search to try.
    if (reason === 'install') void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
    await migrateLegacy();
    await migrateSettings();
    await refresh();
    await syncWithServer();
  });
  browser.runtime.onStartup.addListener(() => {
    void maybeRefresh();
    void syncWithServer();
  });

  // Keyboard shortcuts, declared as `commands` in wxt.config.ts. The page keeps
  // its own Show hidden state, so that one goes to the tab as a message.
  browser.commands?.onCommand.addListener((command) => {
    if (command === 'toggle-enabled') void updateSettings((s) => ({ enabled: !s.enabled }));
    else if (command === 'toggle-hidden') void sendToActiveTab({ type: 'toggle-reveal' });
  });

  // Replies go through sendResponse (and `return true` while one is pending):
  // Chrome ignores a promise returned from the listener.
  browser.runtime.onMessage.addListener((raw, sender, sendResponse) => {
    const message = raw as Message;
    switch (message.type) {
      case 'stats': {
        const tabId = sender.tab?.id;
        if (tabId === undefined) return;
        const n = hiddenCount(message.stats);
        void action.setBadgeText({ tabId, text: n ? String(n) : '' });
        void action.setBadgeBackgroundColor({ tabId, color: '#d4a637' });
        // Firefox only: dark text reads better on gold.
        (action as { setBadgeTextColor?: (d: object) => Promise<void> }).setBadgeTextColor?.({
          tabId,
          color: '#1b1a16',
        });
        return;
      }
      case 'refresh-stale':
        void maybeRefresh();
        void syncIfDue();
        return;
      case 'refresh-all':
        void refresh(true).then(sendResponse);
        return true;
      case 'sync-server':
        void syncWithServer().then(sendResponse);
        return true;
      // Here rather than in settings, so it can't overlap a sync.
      case 'change-passphrase':
        void changeEncryptionPassphrase(message.passphrase).then(sendResponse);
        return true;
      case 'open-options':
        if (message.tab) void browser.tabs.create({ url: `${browser.runtime.getURL('/options.html')}#${message.tab}` });
        else void browser.runtime.openOptionsPage();
        return;
      case 'open-subscribe': {
        // Settings open in a new tab next to the subscribe page, which goes back to
        // where the link was (the directory, a README), or closes if it was opened
        // on its own. That leaves no page in the history that opens settings again.
        const tab = sender.tab;
        const link = readSubscribeLink(subscribeQuery(message.link));
        if (tab?.id === undefined || !link) return;
        const tabId = tab.id;
        const url = `${browser.runtime.getURL('/options.html')}?${subscribeQuery(link)}#lists`;
        void browser.tabs.create({ url, index: tab.index + 1, active: tab.active, openerTabId: tabId }).then(() =>
          message.back ? browser.tabs.goBack(tabId).catch(() => browser.tabs.remove(tabId)) : browser.tabs.remove(tabId),
        );
        return;
      }
    }
  });
});
