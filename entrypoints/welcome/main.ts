import { machineTranslationNote } from '@/utils/translated';
import '@/assets/theme.css';
import './style.css';
import { browser } from '#imports';
import { renderDemo } from './demo';
import { renderListsExample, renderPanelsExample, renderTagsExample } from './extras';
import { localizePage, t, type MessageKey } from '@/utils/i18n';
import { wiki } from '@/utils/wiki';
import { getSubscriptions } from '@/utils/subscriptions';
import { initTheme } from '@/utils/theme';

// The page that opens when Anubis is installed. Ranking comes first: a headline says what
// Anubis is for, and a practice search page, with a short tour and a checklist of its
// three steps, lets people try it (demo.ts). Tags, lists, and removing panels wait under "More to try", each opened on
// its own (extras.ts). The toolbar button comes last: Anubis works without it. Opened by
// the background script on install only, never on updates.

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

/** Each browser's own way to put an extension's button on the toolbar. */
function pinSteps(): MessageKey {
  const ua = navigator.userAgent;
  // Firefox for Android keeps extensions in its menu, with no toolbar to pin to.
  if (import.meta.env.FIREFOX) return /\bAndroid\b/.test(ua) ? 'welcomePinAndroid' : 'welcomePinFirefox';
  if (/\bEdg\//.test(ua)) return 'welcomePinEdge';
  if (/\bOPR\//.test(ua)) return 'welcomePinOpera';
  return 'welcomePinChrome';
}

// Chrome and Edge say whether the button is on the toolbar (getUserSettings), and
// newer versions say when that changes. Where they can't, the steps stay.
interface ToolbarSettings {
  getUserSettings?: () => Promise<{ isOnToolbar?: boolean }>;
  onUserSettingsChanged?: { addListener(cb: () => void): void };
}
const action = (browser.action ?? browser.browserAction) as unknown as ToolbarSettings | undefined;

async function renderPin() {
  const pinned = await action
    ?.getUserSettings?.()
    .then((s) => s.isOnToolbar === true)
    .catch(() => false);
  $('#pin').classList.toggle('done', !!pinned);
  $('#pin-text').textContent = pinned ? t('welcomePinned') : t(pinSteps());
}

async function renderExtras() {
  const subscribed = (await getSubscriptions()).filter((sub) => sub.enabled).length;
  renderTagsExample($('#tags-demo .extra'));
  renderListsExample($('#lists-demo .extra'), subscribed);
  renderPanelsExample($('#panels-demo .extra'));
}

async function main() {
  localizePage();
  const note = machineTranslationNote();
  if (note) $('main').prepend(note);
  renderDemo($('#demo'), $('#demo-reset'), { list: $('#steps'), done: $('#steps-done') });
  $<HTMLAnchorElement>('#guide').href = wiki();
  $<HTMLAnchorElement>('#privacy').href = wiki('guide/privacy');
  await initTheme();
  await Promise.all([renderPin(), renderExtras()]);
  // Pinning happens in the browser's toolbar, outside this page.
  action?.onUserSettingsChanged?.addListener(() => void renderPin());
  window.addEventListener('focus', () => void renderPin());
}

void main();
