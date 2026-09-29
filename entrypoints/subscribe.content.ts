import { defineContentScript } from '#imports';
import { readSubscribeLink, SUBSCRIBE_PAGE } from '@/utils/links';
import { send } from '@/utils/messages';

// Prefill Settings from a subscribe link; adding the list still requires confirmation.
export default defineContentScript({
  matches: [`${SUBSCRIBE_PAGE}*`],
  runAt: 'document_start',

  main() {
    // Don't reopen Settings when returning through history.
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigation?.type === 'back_forward') return;
    const link = readSubscribeLink(location.search);
    if (link) void send({ type: 'open-subscribe', link, back: history.length > 1 });
  },
});
