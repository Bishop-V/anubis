import { h, icon } from '@/utils/dom';
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
import { t, tn, tParts } from '@/utils/i18n';
import { importIntoPersonal } from '@/utils/importers';
import { guide, REPO_URL } from '@/utils/links';
import { themeSwitcher } from '@/utils/theme';
import { flash, flashed, rerender } from './flash';
import { download, helpLink, pageTitle, switchRow } from './parts';

/** What loading this many extra pages costs, said as the amount changes. */
export function deeperTip(pages: number): { text: string; warn: boolean } {
  if (pages === 0) return { text: t('deeperTipOff'), warn: false };
  // Each page waits 0.7 s after the last, plus the time to load it.
  const time = tn('deeperTipTime', Math.max(1, Math.round(pages * 1.2)));
  if (pages <= 3) return { text: t('deeperTipFew', time), warn: false };
  if (pages < 10) return { text: t('deeperTipSome', time), warn: true };
  return { text: t('deeperTipMany', time), warn: true };
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
      h('label', { attrs: { for: 'deeper' } }, h('b', null, t('deeperAuto'))),
      h(
        'span',
        { class: 'muted' },
        t('deeperAutoHint', MAX_DEEPER),
        ' ',
        helpLink('guide/more-results', t('deeperHelp')),
      ),
      tip,
    ),
    h('span', { class: 'amount' }, input, h('span', { attrs: { 'aria-hidden': 'true' } }, t('deeperUnit'))),
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
    pageTitle(t('appearanceHeading'), t('appearanceIntro')),
    h(
      'div',
      { class: 'panel' },
      h(
        'div',
        { class: 'setting' },
        h(
          'div',
          null,
          h('b', null, t('themeHeading')),
          h('span', { class: 'muted' }, t('themeHint')),
        ),
        themeSwitcher(settings.theme),
      ),
      segRow<Palette>(
        t('paletteHeading'),
        t('paletteHint'),
        [
          { value: 'gold', label: t('paletteGold') },
          { value: 'plain', label: t('palettePlain') },
        ],
        settings.palette,
        (palette) => void updateSettings({ palette }),
      ),
      segRow<HideStyle>(
        t('hideStyleHeading'),
        t('hideStyleHint'),
        [
          { value: 'remove', label: t('hideStyleRemove') },
          { value: 'collapse', label: t('hideStyleCollapse') },
          { value: 'dim', label: t('hideStyleDim') },
        ],
        settings.hideStyle,
        (hideStyle) => void updateSettings({ hideStyle }),
      ),
      toggleRow(
        t('rerankHeading'),
        t('rerankHint'),
        'rerank',
        settings,
        helpLink('guide/ranking#reranking', t('rerankHelp')),
      ),
      deeperRow(settings.deeper),
      toggleRow(t('chipsHeading'), t('chipsHint'), 'showChips', settings),
      toggleRow(t('summaryHeading'), t('summaryHint'), 'showSummary', settings),
      toggleRow(t('enabledHeading'), t('enabledHint'), 'enabled', settings),
    ),
  );
}

export async function renderEngines(): Promise<HTMLElement> {
  const settings = await getSettings();
  return h(
    'div',
    null,
    pageTitle(
      t('enginesHeading'),
      t('enginesIntro'),
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
        t('enginesTrouble'),
        ' ',
        helpLink('guide/troubleshooting#anubis-does-nothing-on-a-search-page', t('enginesTroubleHelp')),
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
      flash('backup', 'ok', t('backupRestored'));
    } catch (error) {
      flash('backup', 'error', t('backupRestoreFailed', error instanceof Error ? error.message : String(error)));
    }
    file.value = '';
    rerender();
  });

  // Import from uBlacklist, HOHSER, a Goggle, or a domain list
  const importArea = h('textarea', {
    class: 'code',
    rows: 6,
    spellcheck: false,
    placeholder: t('importPlaceholder'),
    style: 'min-height:0',
    attrs: { 'aria-label': t('importLabel') },
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
    try {
      await editPersonal((text) => {
        const r = importIntoPersonal(text, importArea.value);
        highlight = r.highlightTags;
        const names = {
          hohser: t('importSourceHohser'),
          ublacklist: t('importSourceUblacklist'),
          goggle: t('importSourceGoggle'),
          anubis: t('importSourceAnubis'),
          domains: t('importSourceDomains'),
        };
        summary = tn('importRead', r.added, names[r.source], r.updated) + (r.skipped ? ` ${tn('importSkipped', r.skipped)}` : '');
        return r.text;
      });
      for (const id of highlight) await setTagPref(id, { action: 'highlight' });
      flash('import', 'ok', summary);
    } catch (error) {
      flash('import', 'error', t('importFailed', error instanceof Error ? error.message : String(error)));
    }
    rerender();
  };

  const reset = async () => {
    const [settings, prefs, subs] = await Promise.all([settingsItem.getValue(), tagPrefsItem.getValue(), subscriptionsItem.getValue()]);
    await settingsItem.setValue(DEFAULT_SETTINGS);
    await tagPrefsItem.setValue({});
    // Absent, not empty: the default subscriptions come back.
    await subscriptionsItem.removeValue();
    // Undo puts back what was there, as it was stored.
    flash('backup', 'ok', t('resetDone'), async () => {
      await (settings ? settingsItem.setValue(settings) : settingsItem.removeValue());
      await tagPrefsItem.setValue(prefs);
      if (subs) await subscriptionsItem.setValue(subs);
    });
    rerender();
  };

  return h(
    'div',
    null,
    pageTitle(t('shareHeading'), t('shareIntro')),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('publishHeading')),
      h('p', { class: 'muted' }, t('publishIntro'), ' ', helpLink('guide/publish-a-list', t('publishHelp'))),
      h(
        'ol',
        { class: 'steps' },
        h('li', null, tParts('publishStepDownload', h('code', null, '! name:'), h('code', null, '! description:'), h('code', null, '! author:'))),
        h('li', null, tParts('publishStepRepository', h('code', null, 'lists/my-list.anubis'))),
        // Not translated: a line of the list format.
        h('li', null, tParts('publishStepIssues', h('code', null, '! issues: https://github.com/you/repo/issues'))),
        h('li', null, t('publishStepShare')),
        h(
          'li',
          null,
          tParts(
            'publishStepDirectory',
            h('a', { href: `${REPO_URL}/blob/main/lists/directory.json`, target: '_blank', rel: 'noopener noreferrer' }, 'lists/directory.json'),
          ),
        ),
      ),
      h(
        'div',
        { class: 'toolbar', style: 'margin-top:12px' },
        h('button', { class: 'btn primary', type: 'button', on: { click: () => download('my-anubis-list.anubis', rules.personalText) } }, icon(ICON_DOWNLOAD), t('publishDownload')),
        h('a', { class: 'btn', href: guide('list-format'), target: '_blank', rel: 'noopener noreferrer' }, t('publishFormat')),
      ),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('importHeading')),
      h('p', { class: 'muted' }, t('importIntro'), ' ', helpLink('guide/import-and-backup#import-sites', t('importHelp'))),
      importArea,
      h(
        'div',
        { class: 'toolbar', style: 'margin-top:10px' },
        h('button', { class: 'btn primary', type: 'button', on: { click: () => void runImport() } }, t('importButton')),
        h('button', { class: 'text-btn', type: 'button', on: { click: () => importFile.click() } }, t('importChooseFile')),
        importFile,
      ),
      importStatus,
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('backupHeading')),
      h('p', { class: 'muted' }, t('backupIntro')),
      h(
        'div',
        { class: 'toolbar' },
        h('button', { class: 'btn', type: 'button', on: { click: () => void exportAll() } }, icon(ICON_DOWNLOAD), t('backupExport')),
        h('button', { class: 'btn', type: 'button', on: { click: () => file.click() } }, icon(ICON_UPLOAD), t('backupRestore')),
        h('button', { class: 'btn danger', type: 'button', on: { click: () => void reset() } }, t('resetButton')),
        file,
      ),
      status,
    ),
  );
}
