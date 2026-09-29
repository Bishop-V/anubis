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
import { syncChanges, syncIfDue, syncWithServer } from '@/utils/webdav';

const LAST_CHECK = 'local:lastUpdateCheck' as const;
const CHECK_EVERY_MS = 30 * 60 * 1000;

export default defineBackground(() => {
  // MV3 has `action`; Firefox MV2 has `browserAction`.
  const action = browser.action ?? browser.browserAction;

  // Clear the old page's count while the tab navigates.
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

  // Debounce WebDAV sync after changes; sync writes don't trigger another sync.
  let changed: ReturnType<typeof setTimeout> | undefined;
  const syncSoon = () => {
    clearTimeout(changed);
    changed = setTimeout(() => void syncChanges(), 3000);
  };
  settingsItem.watch(syncSoon);
  tagPrefsItem.watch(syncSoon);
  subscriptionsItem.watch(syncSoon);
  // Unpack synced list changes for search pages.
  watchPersonal(syncSoon);

  // Serialize updates; a forced update waits for an active routine check.
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

  // Reveal state lives in the content script, so forward the shortcut there.
  browser.commands?.onCommand.addListener((command) => {
    if (command === 'toggle-enabled') void updateSettings((s) => ({ enabled: !s.enabled }));
    else if (command === 'toggle-hidden') void sendToActiveTab({ type: 'toggle-reveal' });
  });

  // Use sendResponse: Chrome ignores promises returned by message listeners.
  browser.runtime.onMessage.addListener((raw, sender, sendResponse) => {
    const message = raw as Message;
    switch (message.type) {
      case 'stats': {
        const tabId = sender.tab?.id;
        if (tabId === undefined) return;
        const n = hiddenCount(message.stats);
        void action.setBadgeText({ tabId, text: n ? String(n) : '' });
        void action.setBadgeBackgroundColor({ tabId, color: '#d4a637' });
        // Firefox only: dark text on gold.
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
      case 'open-options':
        if (message.tab) void browser.tabs.create({ url: `${browser.runtime.getURL('/options.html')}#${message.tab}` });
        else void browser.runtime.openOptionsPage();
        return;
      case 'open-subscribe': {
        // Open Settings beside the link, then return to its source or close the tab.
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
