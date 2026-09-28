import { storage } from '#imports';
import { h, icon } from '@/utils/dom';
import { ENGINES } from '@/utils/engines';
import { ICON_DOWNLOAD, ICON_SHARE } from '@/utils/icons';
import type { TagPref } from '@/utils/matcher';
import { getSubscriptions, loadRuleSet, saveSubscriptions } from '@/utils/ruleset';
import {
  getSettings,
  savePersonal,
  settingsItem,
  tagPrefsItem,
  updateSettings,
  DEFAULT_SETTINGS,
  type HideStyle,
  type Settings,
  type Subscription,
} from '@/utils/storage';
import { themeSwitcher } from '@/utils/theme';
import { download } from './sites';

function title(heading: string, text: string) {
  return h('div', { class: 'page-title' }, h('div', null, h('h2', null, heading), h('p', null, text)));
}

function toggleRow(label: string, hint: string, key: keyof Settings, settings: Settings): HTMLElement {
  const input = h('input', { type: 'checkbox', checked: Boolean(settings[key]), attrs: { 'aria-label': label } });
  input.addEventListener('change', () => void updateSettings({ [key]: input.checked }));
  return h(
    'div',
    { class: 'setting' },
    h('div', null, h('b', null, label), h('span', { class: 'muted' }, hint)),
    h('label', { class: 'switch' }, input, h('span')),
  );
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
    title('Appearance', 'How Anubis looks here and on search pages.'),
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
          h('span', { class: 'muted' }, 'Auto follows your system here, and each search engine’s own light or dark mode on its pages.'),
        ),
        themeSwitcher(settings.theme),
      ),
      segRow<HideStyle>(
        'Hidden results',
        'Collapse leaves a slim bar you can open. Remove takes them off the page. Dim fades them.',
        [
          { value: 'collapse', label: 'Collapse' },
          { value: 'remove', label: 'Remove' },
          { value: 'dim', label: 'Dim' },
        ],
        settings.hideStyle,
        (hideStyle) => void updateSettings({ hideStyle }),
      ),
      toggleRow('Rerank results', 'Move raised and pinned results up and lowered ones down, like a Brave Goggle.', 'rerank', settings),
      segRow<string>(
        'Look deeper automatically',
        'Load the next result pages onto the first one and rerank them together, so a site you pinned on page 3 rises to the top. Uses the same engine and query; “Weigh deeper” on the page does it on request.',
        [
          { value: '0', label: 'Off' },
          { value: '1', label: '+1 page' },
          { value: '2', label: '+2 pages' },
        ],
        String(settings.deeper),
        (v) => void updateSettings({ deeper: Number(v) }),
      ),
      toggleRow('Tag chips', 'Show tags and verdicts under each result title.', 'showChips', settings),
      toggleRow('Summary bar', 'Show “Anubis weighed N results” above the results.', 'showSummary', settings),
      toggleRow('Anubis is on', 'Turn this off to leave search pages alone without uninstalling.', 'enabled', settings),
    ),
  );
}

export async function renderEngines(): Promise<HTMLElement> {
  const settings = await getSettings();
  return h(
    'div',
    null,
    title(
      'Search engines',
      'Anubis weighs web results on these engines. Results are found by page structure where possible, so small redesigns don’t break it.',
    ),
    h(
      'div',
      { class: 'panel' },
      h(
        'div',
        { class: 'engines' },
        ENGINES.map((engine) => {
          const input = h('input', { type: 'checkbox', checked: settings.engines[engine.id] !== false, attrs: { 'aria-label': engine.name } });
          input.addEventListener('change', async () => {
            const current = await getSettings();
            await updateSettings({ engines: { ...current.engines, [engine.id]: input.checked } });
          });
          return h('label', { class: 'engine' }, h('span', null, engine.name), h('span', { class: 'switch' }, input, h('span')));
        }),
      ),
    ),
  );
}

interface Backup {
  anubis: 1;
  exportedAt: string;
  settings: Settings;
  tagPrefs: Record<string, TagPref>;
  subscriptions: Subscription[];
  personal: string;
}

export async function renderShare(): Promise<HTMLElement> {
  const rules = await loadRuleSet();
  const status = h('div');

  const exportAll = async () => {
    const backup: Backup = {
      anubis: 1,
      exportedAt: new Date().toISOString(),
      settings: rules.settings,
      tagPrefs: rules.prefs,
      subscriptions: await getSubscriptions(),
      personal: rules.personalText,
    };
    download(`anubis-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json');
  };

  const file = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as Partial<Backup>;
      if (data.anubis !== 1) throw new Error('This isn’t an Anubis backup.');
      if (data.settings) await settingsItem.setValue({ ...DEFAULT_SETTINGS, ...data.settings });
      if (data.tagPrefs) await tagPrefsItem.setValue(data.tagPrefs);
      if (Array.isArray(data.subscriptions)) await saveSubscriptions(data.subscriptions);
      if (typeof data.personal === 'string') await savePersonal(data.personal);
      status.replaceChildren(h('div', { class: 'notice ok' }, 'Backup restored.'));
    } catch (error) {
      status.replaceChildren(h('div', { class: 'notice error' }, `Couldn’t restore: ${error instanceof Error ? error.message : String(error)}`));
    }
    file.value = '';
  });

  const reset = async () => {
    if (!confirm('Reset all Anubis settings, tags and subscriptions? Your list is kept.')) return;
    await settingsItem.setValue(DEFAULT_SETTINGS);
    await tagPrefsItem.setValue({});
    await storage.removeItem('sync:subscriptions');
    status.replaceChildren(h('div', { class: 'notice ok' }, 'Settings reset.'));
  };

  return h(
    'div',
    null,
    title('Share & backup', 'Your list is a plain text file. Publish it and anyone can subscribe; keep a backup of everything else.'),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Publish your list'),
      h('p', { class: 'muted' }, 'No server needed: a public git repository is the database, and pull requests are how people contribute.'),
      h(
        'ol',
        { class: 'steps' },
        h('li', null, 'Download your list below. Set its ', h('code', null, '! name:'), ', ', h('code', null, '! description:'), ' and ', h('code', null, '! author:'), ' lines at the top.'),
        h('li', null, 'Create a public GitHub repository (or a gist) and add the file, e.g. ', h('code', null, 'lists/my-list.anubis'), '.'),
        h('li', null, 'Add ', h('code', null, '! issues: https://github.com/you/repo/issues'), ' so the weigh menu can offer “Suggest to your list”.'),
        h('li', null, 'Share the file’s link. People paste it into Lists → Add a list.'),
        h(
          'li',
          null,
          'Want it in Discover for everyone? Open a pull request adding it to ',
          h('a', { href: 'https://github.com/Bishop-V/anubis/blob/main/lists/directory.json', target: '_blank', rel: 'noopener noreferrer' }, 'lists/directory.json'),
          '.',
        ),
      ),
      h(
        'div',
        { class: 'toolbar', style: 'margin-top:12px' },
        h('button', { class: 'btn primary', type: 'button', on: { click: () => download('my-anubis-list.anubis', rules.personalText) } }, icon(ICON_DOWNLOAD), 'Download my list'),
        h('a', { class: 'btn', href: 'https://github.com/Bishop-V/anubis/blob/main/docs/list-format.md', target: '_blank', rel: 'noopener noreferrer' }, 'List format'),
      ),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Backup'),
      h('p', { class: 'muted' }, 'Everything in one file: settings, tag choices, subscriptions and your list.'),
      h(
        'div',
        { class: 'toolbar' },
        h('button', { class: 'btn', type: 'button', on: { click: () => void exportAll() } }, icon(ICON_DOWNLOAD), 'Export backup'),
        h('button', { class: 'btn', type: 'button', on: { click: () => file.click() } }, icon(ICON_SHARE), 'Restore backup'),
        h('button', { class: 'btn ghost danger', type: 'button', on: { click: () => void reset() } }, 'Reset settings'),
        file,
      ),
      status,
    ),
  );
}
