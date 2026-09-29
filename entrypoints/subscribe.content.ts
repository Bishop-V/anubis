import { defineContentScript } from '#imports';
import { readSubscribeLink, SUBSCRIBE_PAGE } from '@/utils/links';
import { send } from '@/utils/messages';

// Runs on the user guide's subscribe page, where the Subscribe links in the lists
// directory (and on list authors' own pages) lead. It hands the list to the
// background, which opens Settings → Lists with it filled in for you to confirm.
// Nothing is subscribed from here: anyone can make a link.
export default defineContentScript({
  matches: [`${SUBSCRIBE_PAGE}*`],
  runAt: 'document_start',

  main() {
    // Back or Forward onto this page leaves it be, so settings don't open again.
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigation?.type === 'back_forward') return;
    const link = readSubscribeLink(location.search);
    if (link) void send({ type: 'open-subscribe', link, back: history.length > 1 });
  },
});
