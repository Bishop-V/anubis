import { browser, defineBackground, storage } from '#imports';
import type { Message } from '@/utils/messages';
import { migrateLegacy } from '@/utils/storage';
import { refreshStale } from '@/utils/subscriptions';

// The background script keeps subscribed lists fresh and shows the hidden-result
// count on the toolbar icon. Updates run when the browser starts and when a
// search page asks, at most every 30 minutes, so no "alarms" permission is needed.

const LAST_CHECK = 'local:lastUpdateCheck' as const;
const CHECK_EVERY_MS = 30 * 60 * 1000;

export default defineBackground(() => {
  // MV3 has `action`; Firefox MV2 has `browserAction`.
  const action = browser.action ?? browser.browserAction;

  let running: Promise<number> | undefined;
  const refresh = (force = false) => {
    running ??= refreshStale(force)
      .catch((error) => {
        console.warn('[anubis] list update failed', error);
        return 0;
      })
      .finally(() => {
        running = undefined;
      });
    return running;
  };

  const maybeRefresh = async () => {
    const last = (await storage.getItem<number>(LAST_CHECK)) ?? 0;
    if (Date.now() - last < CHECK_EVERY_MS) return;
    await storage.setItem(LAST_CHECK, Date.now());
    await refresh();
  };

  browser.runtime.onInstalled.addListener(async () => {
    await migrateLegacy();
    await refresh();
  });
  browser.runtime.onStartup.addListener(() => void maybeRefresh());

  browser.runtime.onMessage.addListener((raw, sender) => {
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
        return refresh(true);
      case 'open-options':
        if (message.tab) {
          return browser.tabs.create({ url: `${browser.runtime.getURL('/options.html')}#${message.tab}` });
        }
        return browser.runtime.openOptionsPage();
    }
  });
});
