import { domainChoices, siteOf } from '@/utils/domain';
import { h, icon, plural } from '@/utils/dom';
import type { EngineDef } from '@/utils/engines';
import {
  ICON_ANUBIS,
  ICON_CHECK,
  ICON_CLOSE,
  ICON_EXTERNAL,
  ICON_GEAR,
  ICON_HIDE,
  ICON_SHOW,
  LEVEL_CHIPS,
  LEVEL_ICONS,
  LEVEL_LABELS,
} from '@/utils/icons';
import { TAG_PALETTE, type TagDef } from '@/utils/listformat';
import { LEVELS, type Level, type TagPref, type Verdict } from '@/utils/matcher';
import type { PageStats } from '@/utils/messages';
import { formatSiteLine, getSite, type PersonalLevel } from '@/utils/personal';
import type { FoundResult } from './results';
import shadowCss from './shadow.css?inline';

export type PageTheme = 'light' | 'dark';

// Every piece of Anubis UI on the page is a custom element with a closed shadow
// root: the page's CSS can't restyle it and its scripts can't read tag names out of it.
const roots = new WeakMap<HTMLElement, ShadowRoot>();
const renderKeys = new WeakMap<HTMLElement, string>();

function makeHost(tag: string, theme: PageTheme): { host: HTMLElement; root: ShadowRoot } {
  const host = document.createElement(tag);
  const root = host.attachShadow({ mode: 'closed' });
  root.append(h('style', null, shadowCss));
  host.dataset.theme = theme;
  roots.set(host, root);
  return { host, root };
}

/** Replace a host's content unless it's already showing the same thing. */
function render(host: HTMLElement, key: string, build: () => Node): void {
  if (renderKeys.get(host) === key) return;
  renderKeys.set(host, key);
  const root = roots.get(host)!;
  root.querySelector(':scope > :not(style)')?.remove();
  root.append(build());
}

export function applyTheme(theme: PageTheme): void {
  for (const el of document.querySelectorAll<HTMLElement>('anubis-chips, anubis-weigh, anubis-bar, anubis-summary, anubis-popover')) {
    el.dataset.theme = theme;
  }
}

// ---------------------------------------------------------------------------
// Chips under the title

export interface ChipContext {
  tags: Map<string, TagDef>;
  prefs: Record<string, TagPref>;
  theme: PageTheme;
}

const chipsHosts = new WeakMap<HTMLElement, HTMLElement>();

export function renderChips(result: FoundResult, verdict: Verdict, ctx: ChipContext, revealed: boolean): void {
  const { container, titleBlock } = result;
  const verdictChip = verdict.level !== 'normal' && (verdict.level !== 'hide' || revealed) ? verdict.level : undefined;
  const tags = verdict.tags.filter((id) => !ctx.prefs[id]?.muted && ctx.tags.has(id));

  let host = chipsHosts.get(container);
  if (!verdictChip && !tags.length) {
    host?.remove();
    return;
  }
  if (!host) {
    host = makeHost('anubis-chips', ctx.theme).host;
    chipsHosts.set(container, host);
  }
  // Keep it right after the title, even if the page re-rendered around it.
  if (host.previousElementSibling !== titleBlock) titleBlock.after(host);

  const key = JSON.stringify([verdictChip, verdict.score, tags.map((id) => ctx.tags.get(id)), ctx.theme]);
  host.dataset.theme = ctx.theme;
  render(host, key, () =>
    h(
      'div',
      { class: 'chips' },
      verdictChip &&
        h(
          'span',
          {
            class: `chip verdict-${verdictChip}`,
            title: verdict.reasons.map((r) => `${r.list}: ${r.text}`).join('\n'),
          },
          icon(LEVEL_ICONS[verdictChip]),
          LEVEL_CHIPS[verdictChip],
        ),
      tags.map((id) => {
        const tag = ctx.tags.get(id)!;
        const sources = verdict.tagSources[id] ?? [];
        return h(
          'span',
          {
            class: 'chip',
            style: `--c: ${tag.color}`,
            title: `${tag.description ? `${tag.description}\n` : ''}Tagged by ${sources.join(', ')}`,
          },
          h('i', { class: 'dot' }),
          tag.label,
        );
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Weigh button

const weighHosts = new WeakMap<HTMLElement, HTMLElement>();

export function ensureWeighButton(
  result: FoundResult,
  engine: EngineDef,
  theme: PageTheme,
  onOpen: (button: HTMLElement, result: FoundResult) => void,
): void {
  const { container } = result;
  let host = weighHosts.get(container);
  if (!host) {
    const made = makeHost('anubis-weigh', theme);
    host = made.host;
    const button = h(
      'button',
      {
        class: 'weigh',
        type: 'button',
        title: 'Weigh this site',
        attrs: { 'aria-label': 'Weigh this site with Anubis', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' },
      },
      icon(ICON_ANUBIS),
    );
    // Keep the click from reaching the result link underneath.
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onOpen(button, current.get(host!)!);
    });
    made.root.append(button);
    weighHosts.set(container, host);
  }
  current.set(host, result);
  host.dataset.theme = theme;

  if (engine.table) {
    // Table rows can't position children; sit inline after the title instead.
    host.style.cssText = 'position:relative;display:inline-block;vertical-align:middle;margin-left:6px;--anubis-weigh-opacity:.8';
    if (host.previousElementSibling !== result.link) result.link.after(host);
    return;
  }
  const { top, right } = engine.button ?? { top: '2px', right: '2px' };
  host.style.top = top;
  host.style.right = right;
  if (host.parentElement !== container) container.append(host);
  // The button is absolutely positioned, so the result must be a positioning context.
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
}
const current = new WeakMap<HTMLElement, FoundResult>();

export function weighButtonOf(container: HTMLElement): HTMLButtonElement | undefined {
  const host = weighHosts.get(container);
  return host ? (roots.get(host)?.querySelector('button') ?? undefined) : undefined;
}

// ---------------------------------------------------------------------------
// Collapsed bar for hidden results

const barHosts = new WeakMap<HTMLElement, HTMLElement>();

export function renderHiddenBar(
  result: FoundResult,
  verdict: Verdict,
  theme: PageTheme,
  show: boolean,
  actions: { reveal: () => void; weigh: (button: HTMLElement) => void },
): void {
  const { container } = result;
  let host = barHosts.get(container);
  if (!show) {
    host?.remove();
    return;
  }
  if (!host) {
    host = makeHost('anubis-bar', theme).host;
    barHosts.set(container, host);
  }
  if (container.firstElementChild !== host) container.prepend(host);
  host.dataset.theme = theme;

  const by = [...new Set(verdict.reasons.map((r) => r.list))].join(', ');
  render(host, JSON.stringify([result.host, by, theme]), () => {
    const weigh = h('button', { class: 'ghost', type: 'button', title: 'Weigh this site' }, icon(ICON_ANUBIS), 'Weigh');
    weigh.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      actions.weigh(weigh);
    });
    return h(
      'div',
      { class: 'bar' },
      icon(ICON_HIDE),
      h('span', { class: 'why', title: verdict.reasons.map((r) => `${r.list}: ${r.text}`).join('\n') }, 'Hidden: ', h('b', null, result.host.replace(/^www\./, '')), by ? ` · ${by}` : ''),
      h('span', { class: 'spacer' }),
      h(
        'button',
        {
          class: 'ghost',
          type: 'button',
          on: {
            click: (e) => {
              e.preventDefault();
              e.stopPropagation();
              actions.reveal();
            },
          },
        },
        icon(ICON_SHOW),
        'Show',
      ),
      weigh,
    );
  });
}

// ---------------------------------------------------------------------------
// Summary above the results

let summaryHost: HTMLElement | undefined;

export function renderSummary(
  before: HTMLElement | undefined,
  stats: PageStats,
  theme: PageTheme,
  actions: { toggleReveal: () => void; settings: () => void },
): void {
  const worthShowing = stats.hidden || stats.pinned || stats.raised || stats.lowered || stats.tagged;
  if (!before?.parentElement || !worthShowing) {
    summaryHost?.remove();
    return;
  }
  summaryHost ??= makeHost('anubis-summary', theme).host;
  if (summaryHost.nextElementSibling !== before) before.before(summaryHost);
  summaryHost.dataset.theme = theme;

  render(summaryHost, JSON.stringify([stats, theme]), () => {
    const stat = (n: number, label: string) => (n ? h('span', { class: 'stat' }, h('b', null, n), label) : null);
    return h(
      'div',
      { class: 'summary' },
      h('span', { class: 'logo' }, icon(ICON_ANUBIS)),
      h('span', null, 'Anubis weighed ', h('strong', null, plural(stats.total, 'result'))),
      stat(stats.hidden, 'hidden'),
      stat(stats.pinned, 'pinned'),
      stat(stats.raised, 'raised'),
      stat(stats.lowered, 'lowered'),
      stat(stats.tagged, 'tagged'),
      h('span', { class: 'spacer' }),
      stats.hidden
        ? h(
            'button',
            { class: 'ghost', type: 'button', on: { click: actions.toggleReveal } },
            icon(stats.revealed ? ICON_HIDE : ICON_SHOW),
            stats.revealed ? 'Hide again' : 'Show hidden',
          )
        : null,
      h(
        'button',
        { class: 'icon-btn', type: 'button', title: 'Anubis settings', on: { click: actions.settings } },
        icon(ICON_GEAR),
      ),
    );
  });
}

export function removeAllUi(): void {
  document
    .querySelectorAll('anubis-chips, anubis-weigh, anubis-bar, anubis-summary, anubis-popover')
    .forEach((el) => el.remove());
  summaryHost = undefined;
}

// ---------------------------------------------------------------------------
// The weigh menu

export interface PopoverData {
  result: FoundResult;
  verdict: Verdict;
  /** What the subscribed lists alone say, ignoring the personal list. */
  baseline: Verdict;
  personalText: string;
  tags: Map<string, TagDef>;
  prefs: Record<string, TagPref>;
  /** Subscribed lists with an issue tracker, for "suggest" links. */
  trackers: { name: string; issues: string }[];
  theme: PageTheme;
}

export interface PopoverActions {
  setLevel(domain: string, level: PersonalLevel): void;
  toggleTag(domain: string, tag: string): void;
  createTag(domain: string, label: string, color: string): void;
  suggest(tracker: { name: string; issues: string }, domain: string): string | undefined;
  settings(): void;
}

let popover: { host: HTMLElement; anchor: HTMLElement; cleanup: () => void; domain?: string } | undefined;

export function closePopover(): void {
  if (!popover) return;
  popover.cleanup();
  popover.anchor.setAttribute('aria-expanded', 'false');
  popover.host.remove();
  popover = undefined;
}

export function popoverAnchor(): HTMLElement | undefined {
  return popover?.anchor;
}

export function openPopover(anchor: HTMLElement, data: PopoverData, actions: PopoverActions): void {
  const same = popover?.anchor === anchor;
  const keepDomain = same ? popover?.domain : undefined;
  if (popover && !same) closePopover();

  if (!popover) {
    const { host } = makeHost('anubis-popover', data.theme);
    document.documentElement.append(host);
    const onDown = (e: Event) => {
      if (!e.composedPath().includes(host) && !e.composedPath().includes(anchor)) closePopover();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePopover();
        anchor.focus();
      }
    };
    const onResize = () => position(host, anchor);
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    popover = {
      host,
      anchor,
      cleanup: () => {
        document.removeEventListener('pointerdown', onDown, true);
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', onResize);
      },
    };
    anchor.setAttribute('aria-expanded', 'true');
  }

  const choices = domainChoices(data.result.host);
  const existing = choices.find((d) => getSite(data.personalText, d));
  const domain = keepDomain && choices.includes(keepDomain) ? keepDomain : (existing ?? siteOf(data.result.host));
  popover.domain = domain;
  popover.host.dataset.theme = data.theme;

  const root = roots.get(popover.host)!;
  const hadFocus = root.activeElement?.getAttribute('data-focus-key');
  root.querySelector(':scope > .pop')?.remove();
  root.append(buildPopover(data, actions, domain, (d) => {
    if (popover) popover.domain = d;
    openPopover(anchor, data, actions);
  }));
  position(popover.host, anchor);
  const focusTarget =
    (hadFocus && root.querySelector<HTMLElement>(`[data-focus-key="${hadFocus}"]`)) ||
    root.querySelector<HTMLElement>('.level[aria-pressed="true"], .level');
  focusTarget?.focus({ preventScroll: true });
}

function position(host: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(336, window.innerWidth - 16);
  let left = rect.right - width + window.scrollX;
  left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + window.innerWidth - width - 8));
  host.style.left = `${left}px`;
  host.style.top = `${rect.bottom + window.scrollY + 8}px`;
}

function buildPopover(
  data: PopoverData,
  actions: PopoverActions,
  domain: string,
  switchDomain: (d: string) => void,
): HTMLElement {
  const entry = getSite(data.personalText, domain);
  const personal = entry?.level;
  const pressed: Level | undefined = personal === 'allow' ? 'normal' : personal && personal !== 'normal' ? personal : undefined;
  const inherited = data.baseline.level;
  const choices = domainChoices(data.result.host);

  const select = h(
    'select',
    { class: 'domain', title: 'Apply to', attrs: { 'aria-label': 'Apply to' } },
    choices.map((d) => h('option', { value: d, selected: d === domain }, d)),
  );
  select.addEventListener('change', () => switchDomain(select.value));

  const levels = h(
    'div',
    { class: 'levels', attrs: { role: 'group', 'aria-label': 'Ranking' } },
    LEVELS.map((level) =>
      h(
        'button',
        {
          class: `level ${level}${!pressed && level === inherited && level !== 'normal' ? ' inherited' : ''}`,
          type: 'button',
          attrs: { 'aria-pressed': String(pressed === level), 'data-focus-key': `level-${level}` },
          on: {
            click: () => {
              if (level === 'normal') {
                // "Normal" must beat the lists when they rank this site, so it becomes an explicit allow.
                actions.setLevel(domain, inherited === 'normal' ? 'normal' : 'allow');
              } else actions.setLevel(domain, pressed === level ? 'normal' : level);
            },
          },
        },
        icon(LEVEL_ICONS[level]),
        LEVEL_LABELS[level],
      ),
    ),
  );

  let hint: string;
  if (pressed) {
    hint = personal === 'allow' ? 'You set this site to Normal, overriding your lists.' : `Your choice for ${domain}.`;
  } else if (inherited !== 'normal') {
    const lists = [...new Set(data.baseline.reasons.map((r) => r.list))].join(', ');
    hint = `${LEVEL_CHIPS[inherited]} by ${lists}. Pick a level to override it.`;
  } else hint = 'Not weighed yet. Your choice applies to every search.';

  // Tags: personal ones toggle; ones from lists are shown as fixed.
  const personalTags = new Set(entry?.tags ?? []);
  const fromLists = new Set(data.verdict.tags.filter((id) => (data.verdict.tagSources[id] ?? []).some((s) => s !== 'Your list')));
  const tagIds = [...data.tags.keys()].sort((a, b) => {
    const rank = (id: string) => (personalTags.has(id) ? 0 : fromLists.has(id) ? 1 : 2);
    return rank(a) - rank(b) || data.tags.get(a)!.label.localeCompare(data.tags.get(b)!.label);
  });
  const tagButtons = tagIds.map((id) => {
    const tag = data.tags.get(id)!;
    const on = personalTags.has(id);
    const locked = !on && fromLists.has(id);
    if (locked) {
      return h(
        'span',
        {
          class: 'chip locked',
          style: `--c: ${tag.color}`,
          title: `From ${(data.verdict.tagSources[id] ?? []).join(', ')}`,
        },
        h('i', { class: 'dot' }),
        tag.label,
      );
    }
    return h(
      'button',
      {
        class: 'chip',
        type: 'button',
        style: `--c: ${tag.color}; --tagc: ${tag.color}`,
        title: tag.description ?? (on ? `Remove “${tag.label}”` : `Tag ${domain} “${tag.label}”`),
        attrs: { 'aria-pressed': String(on), 'data-focus-key': `tag-${id}` },
        on: { click: () => actions.toggleTag(domain, id) },
      },
      h('i', { class: 'dot' }),
      tag.label,
      on ? icon(ICON_CHECK) : null,
    );
  });

  // New tag
  let color = TAG_PALETTE[data.tags.size % TAG_PALETTE.length] ?? '#d4a637';
  const input = h('input', {
    type: 'text',
    placeholder: 'New tag…',
    maxLength: 32,
    attrs: { 'aria-label': 'New tag name', 'data-focus-key': 'new-tag' },
  });
  const swatches = h(
    'div',
    { class: 'swatches' },
    TAG_PALETTE.slice(0, 5).map((c) => {
      const b = h('button', {
        class: 'swatch',
        type: 'button',
        style: `--sw: ${c}`,
        title: c,
        attrs: { 'aria-pressed': String(c === color), 'aria-label': `Colour ${c}` },
      });
      b.addEventListener('click', () => {
        color = c;
        swatches.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
      });
      return b;
    }),
  );
  const create = () => {
    const label = input.value.trim();
    if (label) actions.createTag(domain, label, color);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      create();
    }
  });
  const newTag = h(
    'div',
    { class: 'new-tag' },
    input,
    swatches,
    h('button', { class: 'add', type: 'button', title: 'Create tag', on: { click: create } }, 'Add'),
  );

  const reasons = data.verdict.reasons.slice(0, 6);
  const suggestLinks = data.trackers
    .slice(0, 3)
    .map((t) => {
      const href = actions.suggest(t, domain);
      return href
        ? h(
            'a',
            { class: 'ghost', href, target: '_blank', rel: 'noopener noreferrer', title: `Propose ${domain} to ${t.name} on its issue tracker` },
            icon(ICON_EXTERNAL),
            `Suggest to ${t.name}`,
          )
        : null;
    })
    .filter(Boolean);

  const close = h(
    'button',
    { class: 'icon-btn', type: 'button', title: 'Close', attrs: { 'aria-label': 'Close' }, on: { click: () => closePopover() } },
    icon(ICON_CLOSE),
  );

  const pop = h(
    'div',
    { class: 'pop', attrs: { role: 'dialog', 'aria-label': `Weigh ${domain}` } },
    h(
      'div',
      { class: 'pop-head' },
      h('span', { class: 'seal' }, icon(ICON_ANUBIS)),
      h('div', { class: 'pop-title' }, h('small', null, 'Weigh this site'), select),
      close,
    ),
    h(
      'div',
      { class: 'pop-body' },
      h('div', { class: 'section' }, levels, h('p', { class: 'hint' }, hint)),
      h(
        'div',
        { class: 'section' },
        h('div', { class: 'label' }, 'Tags'),
        tagButtons.length ? h('div', { class: 'tags' }, tagButtons) : h('p', { class: 'hint' }, 'No tags yet. Make one:'),
        newTag,
      ),
      reasons.length || suggestLinks.length
        ? h(
            'div',
            { class: 'section' },
            h('div', { class: 'label' }, 'Why'),
            reasons.length
              ? h(
                  'ul',
                  { class: 'reasons' },
                  reasons.map((r) => h('li', null, h('span', { class: 'src' }, r.list), h('span', { class: 'what' }, r.text))),
                )
              : null,
            suggestLinks.length ? h('div', { class: 'links' }, suggestLinks) : null,
          )
        : null,
    ),
    h(
      'div',
      { class: 'pop-foot' },
      h('span', null, entry ? h('code', null, formatSiteLine(entry.site, entry.level, entry.tags) ?? '') : 'Saved to your list'),
      h('button', { type: 'button', on: { click: actions.settings } }, 'Settings'),
    ),
  );
  return pop;
}
