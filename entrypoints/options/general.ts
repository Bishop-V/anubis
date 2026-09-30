import { h, icon, plural } from '@/utils/dom';
import { ENGINES } from '@/utils/engines';
import { ICON_DOWNLOAD, ICON_UPLOAD } from '@/utils/icons';
import { loadRuleSet } from '@/utils/ruleset';
import {
  editPersonal,
  getSettings,
  setTagPref,
  settingsItem,
  subscriptionsItem,
  tagPrefsItem,
  updateSettings,
  DEFAULT_SETTINGS,
  MAX_DEEPER,
  clampDeeper,
  type HideStyle,
  type Palette,
  type Settings,
} from '@/utils/storage';
import { applyData, collectData, readBackup, toBackup } from '@/utils/backup';
import { importIntoPersonal } from '@/utils/importers';
import { guide, REPO_URL } from '@/utils/links';
import { themeSwitcher } from '@/utils/theme';
import { flash, flashed, rerender } from './flash';
import { helpLink, pageTitle, switchRow } from './parts';
import { download } from './sites';

/** What loading this many extra pages costs, said as the amount changes. */
export function deeperTip(pages: number): { text: string; warn: boolean } {
  if (pages === 0) return { text: 'Off: more results load only when you press “Load more results”.', warn: false };
  // Each page waits 0.7 s after the last, plus the time to load it.
  const seconds = Math.max(1, Math.round(pages * 1.2));
  const time = `Adds about ${plural(seconds, 'second')} to each search.`;
  if (pages <= 3) return { text: `${time} Engines rarely mind a few pages.`, warn: false };
  if (pages < 10) return { text: `${time} Some engines may start asking you to confirm you’re not a robot.`, warn: true };
  return {
    text: `${time} Google and Bing often ask you to confirm you’re not a robot after this many. Some engines run out of pages before then.`,
    warn: true,
  };
}

function deeperRow(stored: number): HTMLElement {
  const initial = clampDeeper(stored);
  const tip = h('span', { class: 'tip', attrs: { id: 'deeper-tip', 'aria-live': 'polite' } });
  const showTip = (pages: number) => {
    const { text, warn } = deeperTip(pages);
    tip.textContent = text;
    tip.classList.toggle('warn', warn);
  };
  showTip(initial);
  const input = h('input', {
    id: 'deeper',
    type: 'number',
    value: String(initial),
    attrs: { min: '0', max: String(MAX_DEEPER), step: '1', inputmode: 'numeric', 'aria-describedby': 'deeper-tip' },
    on: {
      input: () => showTip(clampDeeper(input.value)),
      change: () => {
        const pages = clampDeeper(input.value);
        input.value = String(pages);
        showTip(pages);
        void updateSettings({ deeper: pages });
      },
    },
  });
  return h(
    'div',
    { class: 'setting' },
    h(
      'div',
      null,
      h('label', { attrs: { for: 'deeper' } }, h('b', null, 'Load more results automatically')),
      h(
        'span',
        { class: 'muted' },
        `Add the next pages of results to the first one and rank them together, so a site you pinned on page 3 rises to the top. “Load more results” above the results does the same when you ask. Type how many pages to add, from 0 (off) to ${MAX_DEEPER}.`,
        ' ',
        helpLink('guide/more-results', 'How loading more works'),
      ),
      tip,
    ),
    h('span', { class: 'amount' }, input, h('span', { attrs: { 'aria-hidden': 'true' } }, 'more pages')),
  );
}

function toggleRow(label: string, hint: string, key: keyof Settings, settings: Settings, help?: HTMLElement): HTMLElement {
  return switchRow(label, hint, Boolean(settings[key]), (on) => void updateSettings({ [key]: on }), help);
}

function segRow<T extends string>(
  label: string,
  hint: string,
  options: { value: T; label: string }[],
  current: T,
  onPick: (v: T) => void,
): HTMLElement {
  const seg = h('div', { class: 'seg', attrs: { role: 'group', 'aria-label': label } });
  const buttons = options.map((o) =>
    h(
      'button',
      {
        type: 'button',
        attrs: { 'aria-pressed': String(o.value === current) },
        on: {
          click: () => {
            buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i]!.value === o.value)));
            onPick(o.value);
          },
        },
      },
      o.label,
    ),
  );
  seg.append(...buttons);
  return h('div', { class: 'setting' }, h('div', null, h('b', null, label), h('span', { class: 'muted' }, hint)), seg);
}

export async function renderAppearance(): Promise<HTMLElement> {
  const settings = await getSettings();
  return h(
    'div',
    null,
    pageTitle('Appearance', 'How Anubis looks here and on search pages.'),
    h(
      'div',
      { class: 'panel' },
      h(
        'div',
        { class: 'setting' },
        h(
          'div',
          null,
          h('b', null, 'Colour scheme'),
          h('span', { class: 'muted' }, 'Auto follows your browser here and in the menu on each result, and each search engine’s own light or dark mode for the rest of what Anubis adds to its pages.'),
        ),
        themeSwitcher(settings.theme),
      ),
      segRow<Palette>(
        'Colours on search pages',
        'Plain draws everything Anubis adds to search pages in grey, with no gold. Tags lose their colours and are told apart by their names. Settings and the toolbar popup stay gold.',
        [
          { value: 'gold', label: 'Gold' },
          { value: 'plain', label: 'Plain' },
        ],
        settings.palette,
        (palette) => void updateSettings({ palette }),
      ),
      segRow<HideStyle>(
        'Hidden results',
        'Remove takes them off the page; the summary above the results counts them, and Show hidden brings them back. Collapse leaves one slim line for each run of hidden results. Dim fades them.',
        [
          { value: 'remove', label: 'Remove' },
          { value: 'collapse', label: 'Collapse' },
          { value: 'dim', label: 'Dim' },
        ],
        settings.hideStyle,
        (hideStyle) => void updateSettings({ hideStyle }),
      ),
      toggleRow(
        'Rerank results',
        'Move raised and pinned results up and lowered ones down, like a Brave Goggle.',
        'rerank',
        settings,
        helpLink('guide/ranking#reranking', 'How reranking works'),
      ),
      deeperRow(settings.deeper),
      toggleRow('Tag chips', 'Show tags and rankings under each result title.', 'showChips', settings),
      toggleRow('Summary', 'Show a one-line summary of what Anubis changed above the results.', 'showSummary', settings),
      toggleRow('Anubis is on', 'Turn this off to leave search pages alone without uninstalling.', 'enabled', settings),
    ),
  );
}

export async function renderEngines(): Promise<HTMLElement> {
  const settings = await getSettings();
  return h(
    'div',
    null,
    pageTitle(
      'Search engines',
      'Anubis works on web results from these engines. Results are found by page structure where possible, so small redesigns don’t break it.',
    ),
    h(
      'div',
      { class: 'panel' },
      h(
        'div',
        { class: 'engines' },
        ENGINES.map((engine) => {
          const input = h('input', { type: 'checkbox', checked: settings.engines[engine.id] !== false, attrs: { 'aria-label': engine.name } });
          input.addEventListener('change', () => {
            void updateSettings((current) => ({ engines: { ...current.engines, [engine.id]: input.checked } }));
          });
          return h('label', { class: 'engine' }, h('span', null, engine.name), h('span', { class: 'switch' }, input, h('span')));
        }),
      ),
      h(
        'p',
        { class: 'muted', style: 'margin:14px 0 0;font-size:13px' },
        'Anubis doing nothing on a search page?',
        ' ',
        helpLink('guide/troubleshooting#anubis-does-nothing-on-a-search-page', 'What to check'),
      ),
    ),
  );
}

export async function renderShare(): Promise<HTMLElement> {
  const rules = await loadRuleSet();
  const status = h('div', null, flashed('backup'));

  const exportAll = async () => {
    const backup = toBackup(await collectData());
    download(`anubis-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json');
  };

  const file = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      await applyData(readBackup(await f.text()));
      flash('backup', 'ok', 'Backup restored.');
    } catch (error) {
      flash('backup', 'error', `Couldn’t restore: ${error instanceof Error ? error.message : String(error)}`);
    }
    file.value = '';
    rerender();
  });

  // Import from uBlacklist, HOHSER, a Goggle, or a domain list
  const importArea = h('textarea', {
    class: 'code',
    rows: 6,
    spellcheck: false,
    placeholder: 'Paste uBlacklist rules, a HOHSER export, a Goggle, or one domain per line',
    style: 'min-height:0',
    attrs: { 'aria-label': 'Sites to import' },
  });
  const importFile = h('input', { type: 'file', accept: '.txt,.json,.goggle,.anubis,text/plain,application/json', hidden: true });
  importFile.addEventListener('change', async () => {
    const f = importFile.files?.[0];
    if (f) importArea.value = await f.text();
    importFile.value = '';
  });
  const importStatus = h('div', null, flashed('import'));
  const runImport = async () => {
    if (!importArea.value.trim()) return;
    let summary = '';
    let highlight: string[] = [];
    await editPersonal((t) => {
      const r = importIntoPersonal(t, importArea.value);
      highlight = r.highlightTags;
      const names = { hohser: 'HOHSER export', ublacklist: 'uBlacklist rules', goggle: 'Goggle', anubis: 'Anubis list', domains: 'domain list' };
      summary =
        `Read as a ${names[r.source]}: ${r.added} site${r.added === 1 ? '' : 's'} added, ${r.updated} updated.` +
        (r.skipped
          ? ` ${r.skipped} rule${r.skipped === 1 ? '' : 's'} with URL patterns or unsupported syntax left out; subscribe to the original list to keep them.`
          : '');
      return r.text;
    });
    for (const id of highlight) await setTagPref(id, { action: 'highlight' });
    flash('import', 'ok', summary);
    rerender();
  };

  const reset = async () => {
    if (!confirm('Reset all Anubis settings, tags, and subscriptions? Your list is kept.')) return;
    await settingsItem.setValue(DEFAULT_SETTINGS);
    await tagPrefsItem.setValue({});
    // Absent, not empty: the default subscriptions come back.
    await subscriptionsItem.removeValue();
    flash('backup', 'ok', 'Settings reset.');
    rerender();
  };

  return h(
    'div',
    null,
    pageTitle('Back up, import, and share', 'Keep a copy of everything, bring your sites over from another tool, or publish your list for others to subscribe to.'),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Publish your list'),
      h(
        'p',
        { class: 'muted' },
        'No server needed: a public git repository is the database, and pull requests are how people contribute.',
        ' ',
        helpLink('guide/publish-a-list', 'How to publish a list'),
      ),
      h(
        'ol',
        { class: 'steps' },
        h('li', null, 'Download your list below. Set its ', h('code', null, '! name:'), ', ', h('code', null, '! description:'), ', and ', h('code', null, '! author:'), ' lines at the top.'),
        h('li', null, 'Create a public GitHub repository (or a gist) and add the file, e.g. ', h('code', null, 'lists/my-list.anubis'), '.'),
        h('li', null, 'Add ', h('code', null, '! issues: https://github.com/you/repo/issues'), ' so people can suggest sites to your list from the menu on each result.'),
        h('li', null, 'Share the file’s link. People paste it into Lists → Add a list.'),
        h(
          'li',
          null,
          'Want it under More lists for everyone? Open a pull request adding it to ',
          h('a', { href: `${REPO_URL}/blob/main/lists/directory.json`, target: '_blank', rel: 'noopener noreferrer' }, 'lists/directory.json'),
          '.',
        ),
      ),
      h(
        'div',
        { class: 'toolbar', style: 'margin-top:12px' },
        h('button', { class: 'btn primary', type: 'button', on: { click: () => download('my-anubis-list.anubis', rules.personalText) } }, icon(ICON_DOWNLOAD), 'Download my list'),
        h('a', { class: 'btn', href: guide('list-format'), target: '_blank', rel: 'noopener noreferrer' }, 'List format'),
      ),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Import sites'),
      h(
        'p',
        { class: 'muted' },
        'Coming from uBlacklist or HOHSER? Paste your rules or export here and the sites join your list. Hidden stays hidden, HOHSER’s partial hide becomes Lower, and highlight colours become tags that highlight.',
        ' ',
        helpLink('guide/import-and-backup#import-sites', 'What each tool’s rules become'),
      ),
      importArea,
      h(
        'div',
        { class: 'toolbar', style: 'margin-top:10px' },
        h('button', { class: 'btn primary', type: 'button', on: { click: () => void runImport() } }, 'Import'),
        h('button', { class: 'text-btn', type: 'button', on: { click: () => importFile.click() } }, 'Choose a file'),
        importFile,
      ),
      importStatus,
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Backup'),
      h('p', { class: 'muted' }, 'Everything in one file: settings, tag choices, subscriptions, and your list.'),
      h(
        'div',
        { class: 'toolbar' },
        h('button', { class: 'btn', type: 'button', on: { click: () => void exportAll() } }, icon(ICON_DOWNLOAD), 'Export backup'),
        h('button', { class: 'btn', type: 'button', on: { click: () => file.click() } }, icon(ICON_UPLOAD), 'Restore backup'),
        h('button', { class: 'btn danger', type: 'button', on: { click: () => void reset() } }, 'Reset settings'),
        file,
      ),
      status,
    ),
  );
}
