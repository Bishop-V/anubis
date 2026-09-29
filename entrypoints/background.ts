import { browser, defineBackground, storage } from '#imports';
import { readSubscribeLink, subscribeQuery } from '@/utils/links';
import { sendToActiveTab, type Message } from '@/utils/messages';
import { getSettings, migrateLegacy, migrateSettings, settingsItem, updateSettings, watchPersonal } from '@/utils/storage';
import { refreshStale } from '@/utils/subscriptions';

// The background script keeps subscribed lists fresh, shows the hidden-result
// count on the toolbar icon, greys the icon out while Anubis is off, unpacks your
// list when it arrives from sync, and opens the welcome page on first install. Updates run when the browser starts and when a
// search page asks, at most every 30 minutes, so no "alarms" permission is needed.

const LAST_CHECK = 'local:lastUpdateCheck' as const;
const CHECK_EVERY_MS = 30 * 60 * 1000;

export default defineBackground(() => {
  // MV3 has `action`; Firefox MV2 has `browserAction`.
  const action = browser.action ?? browser.browserAction;

  // Grey icon while off. Set on every start of the background script, since the
  // browser doesn't keep a changed icon across restarts.
  const showEnabled = (enabled: boolean) => {
    const dir = enabled ? 'icon' : 'icon-off';
    void action.setIcon({ path: { 16: `/${dir}/16.png`, 32: `/${dir}/32.png`, 48: `/${dir}/48.png` } });
    void action.setTitle({ title: enabled ? 'Anubis' : 'Anubis is off' });
  };
  void getSettings().then((s) => showEnabled(s.enabled));
  settingsItem.watch((s) => showEnabled(s?.enabled !== false));

  // Reading the list when it arrives from sync unpacks it into this device's copy,
  // so search pages find it ready even if they can't unpack it themselves.
  watchPersonal(() => undefined);

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
  });
  browser.runtime.onStartup.addListener(() => void maybeRefresh());

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
        const n = message.stats.hidden;
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
        return;
      case 'refresh-all':
        void refresh(true).then(sendResponse);
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
