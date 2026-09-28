import { domainChoices, siteOf } from '@/utils/domain';
import { h, icon } from '@/utils/dom';
import type { EngineDef } from '@/utils/engines';
import { ICON_ANUBIS, ICON_CLOSE, ICON_GEAR, ICON_HIDE, LEVEL_CHIPS, LEVEL_ICONS, LEVEL_LABELS } from '@/utils/icons';
import type { TagDef } from '@/utils/listformat';
import { LEVELS, type Level, type TagPref, type Verdict } from '@/utils/matcher';
import type { PageStats } from '@/utils/messages';
import { getSite, type PersonalLevel } from '@/utils/personal';
import { summarySentence } from '@/utils/summary';
import type { FoundResult } from './results';
import shadowCss from './shadow.css?inline';

export type PageTheme = 'light' | 'dark';

// Every piece of Anubis UI on the page is a custom element with a closed shadow
// root: the page's CSS can't restyle it and its scripts can't read tag names out of it.
const roots = new WeakMap<HTMLElement, ShadowRoot>();
const renderKeys = new WeakMap<HTMLElement, string>();
// What each host currently shows. (`:scope` can't be used for this: inside a
// shadow root it matches nothing, so old content would pile up.)
const rendered = new WeakMap<HTMLElement, Node>();
const HOST_TAGS = 'anubis-chips, anubis-weigh, anubis-bar, anubis-summary, anubis-popover';

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
  const next = build();
  const prev = rendered.get(host);
  if (prev?.parentNode) prev.parentNode.replaceChild(next, prev);
  else roots.get(host)!.append(next);
  rendered.set(host, next);
}

export function applyTheme(theme: PageTheme): void {
  for (const el of document.querySelectorAll<HTMLElement>(HOST_TAGS)) el.dataset.theme = theme;
}

const chipsHosts = new WeakMap<HTMLElement, HTMLElement>();
const weighHosts = new WeakMap<HTMLElement, HTMLElement>();
const barHosts = new WeakMap<HTMLElement, HTMLElement>();
const weighResult = new WeakMap<HTMLElement, FoundResult>();

/**
 * Take Anubis off an element that is no longer a result, for instance after the
 * engine's own "hide this site" collapsed it or its scripts re-rendered it.
 */
export function detachResult(container: HTMLElement): void {
  for (const map of [chipsHosts, weighHosts, barHosts]) {
    map.get(container)?.remove();
    map.delete(container);
  }
}

function stop(e: Event) {
  e.preventDefault();
  e.stopPropagation();
}

// ---------------------------------------------------------------------------
// Tags and verdict under the title

export interface ChipContext {
  tags: Map<string, TagDef>;
  prefs: Record<string, TagPref>;
  theme: PageTheme;
}

export function renderChips(result: FoundResult, verdict: Verdict, ctx: ChipContext, revealed: boolean): void {
  const { container, titleBlock } = result;
  const level = verdict.level !== 'normal' && (verdict.level !== 'hide' || revealed) ? verdict.level : undefined;
  const tags = verdict.tags.filter((id) => !ctx.prefs[id]?.muted && ctx.tags.has(id));
  const page = result.page;

  let host = chipsHosts.get(container);
  if (!level && !tags.length && !page) {
    host?.remove();
    return;
  }
  if (!host) {
    host = makeHost('anubis-chips', ctx.theme).host;
    chipsHosts.set(container, host);
  }
  // Keep it right after the title, even if the page re-rendered around it.
  if (host.previousElementSibling !== titleBlock) titleBlock.after(host);
  host.dataset.theme = ctx.theme;

  const key = JSON.stringify([level, tags.map((id) => ctx.tags.get(id)), page]);
  render(host, key, () =>
    h(
      'div',
      { class: 'chips' },
      level &&
        h(
          'span',
          { class: `verdict ${level}`, title: verdict.reasons.map((r) => `${r.list}: ${r.text}`).join('\n') },
          icon(LEVEL_ICONS[level]),
          LEVEL_CHIPS[level],
        ),
      tags.map((id) => {
        const tag = ctx.tags.get(id)!;
        const sources = verdict.tagSources[id] ?? [];
        return h(
          'span',
          {
            class: 'tag',
            style: `--c: ${tag.color}`,
            title: [tag.description, `From ${sources.join(', ')}`].filter(Boolean).join('\n'),
          },
          h('i', { class: 'gem' }),
          tag.label,
        );
      }),
      page ? h('span', { class: 'page-note', title: 'Brought over by “Weigh deeper”' }, `from page ${page}`) : null,
    ),
  );
}

// ---------------------------------------------------------------------------
// Weigh button

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
    const owner = made.host;
    button.addEventListener('click', (e) => {
      // Keep the click from reaching the result link underneath.
      stop(e);
      onOpen(button, weighResult.get(owner)!);
    });
    made.root.append(button);
    host = owner;
    weighHosts.set(container, host);
  }
  weighResult.set(host, result);
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

export function weighButtonOf(container: HTMLElement): HTMLButtonElement | undefined {
  const host = weighHosts.get(container);
  return host ? (roots.get(host)?.querySelector('button') ?? undefined) : undefined;
}

// ---------------------------------------------------------------------------
// One quiet line in place of a hidden result

/** "by your list", "because it's tagged “AI slop”", "by Copycats removal"… */
export function hiddenReason(verdict: Verdict, tags: Map<string, TagDef>): string {
  const by = verdict.hiddenBy;
  if (!by) return '';
  if (by.kind === 'personal') return 'by your list';
  if (by.kind === 'tag') return `because it’s tagged “${tags.get(by.name)?.label ?? by.name}”`;
  if (by.kind === 'lens') return `because ${by.name} doesn’t include it`;
  return `by ${by.name}`;
}

export function renderHiddenBar(
  result: FoundResult,
  verdict: Verdict,
  theme: PageTheme,
  tags: Map<string, TagDef>,
  show: boolean,
  actions: { reveal: () => void },
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

  const why = hiddenReason(verdict, tags);
  const site = result.host.replace(/^www\./, '');
  render(host, JSON.stringify([site, why]), () =>
    h(
      'div',
      { class: 'gone' },
      icon(ICON_HIDE),
      h('span', { class: 'why' }, h('b', null, site), ` hidden ${why}`),
      h(
        'button',
        {
          class: 'text-btn',
          type: 'button',
          on: {
            click: (e) => {
              stop(e);
              actions.reveal();
            },
          },
        },
        'Show',
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// The summary line above the results

let summaryHost: HTMLElement | undefined;

export function renderSummary(
  before: HTMLElement | undefined,
  stats: PageStats,
  theme: PageTheme,
  actions: { toggleReveal: () => void; settings: () => void; deeper: () => void },
): void {
  const worthShowing =
    stats.hidden || stats.pinned || stats.raised || stats.lowered || stats.tagged || stats.canGoDeeper || stats.pages > 1;
  if (!before?.parentElement || !worthShowing) {
    summaryHost?.remove();
    return;
  }
  summaryHost ??= makeHost('anubis-summary', theme).host;
  if (summaryHost.nextElementSibling !== before) before.before(summaryHost);
  summaryHost.dataset.theme = theme;

  render(summaryHost, JSON.stringify(stats), () =>
    h(
      'div',
      { class: 'summary' },
      h('span', { class: 'mark' }, icon(ICON_ANUBIS)),
      h('span', { class: 'sentence' }, summarySentence(stats)),
      stats.hidden
        ? h(
            'button',
            { class: 'text-btn', type: 'button', on: { click: actions.toggleReveal } },
            stats.revealed ? 'Hide them again' : 'Show hidden',
          )
        : null,
      stats.canGoDeeper || stats.loading
        ? h(
            'button',
            {
              class: 'text-btn',
              type: 'button',
              disabled: stats.loading,
              title: 'Bring the next page of results here and weigh them together',
              on: { click: actions.deeper },
            },
            stats.loading ? 'Weighing…' : 'Weigh deeper',
          )
        : null,
      h(
        'button',
        { class: 'icon-btn', type: 'button', title: 'Anubis settings', attrs: { 'aria-label': 'Anubis settings' }, on: { click: actions.settings } },
        icon(ICON_GEAR),
      ),
    ),
  );
}

export function removeAllUi(): void {
  document.querySelectorAll(HOST_TAGS).forEach((el) => el.remove());
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
  /** Subscribed lists with an issue tracker, for "suggest" links, with the tag ids each defines. */
  trackers: { name: string; issues: string; tags: string[] }[];
  theme: PageTheme;
}

export interface PopoverActions {
  setLevel(domain: string, level: PersonalLevel): void;
  toggleTag(domain: string, tag: string): void;
  createTag(domain: string, label: string): void;
  suggest(tracker: { name: string; issues: string; tags: string[] }, domain: string): string | undefined;
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

  const opening = !popover;
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
  const focusKey = root.activeElement?.getAttribute('data-focus-key');
  const oldPop = rendered.get(popover.host) as HTMLElement | undefined;
  const oldBalance = oldPop?.querySelector('svg.balance');
  const { pop, level } = buildPopover(data, actions, domain, (d) => {
    if (popover) popover.domain = d;
    openPopover(anchor, data, actions);
  });
  if (opening) pop.classList.add('opening');

  // Keep the old balance so it swings to the new weight instead of jumping.
  const balance = oldBalance ?? pop.querySelector('svg.balance')!;
  if (oldBalance) pop.querySelector('svg.balance')?.replaceWith(oldBalance);
  oldPop?.remove();
  root.append(pop);
  rendered.set(popover.host, pop);
  // Position only on open: if the result moves when reranked, the menu stays put.
  if (opening) position(popover.host, anchor);
  if (opening) setBalance(balance, 'normal');
  requestAnimationFrame(() => requestAnimationFrame(() => setBalance(balance, level)));

  const focusTarget =
    (focusKey && root.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)) ||
    root.querySelector<HTMLElement>('.level[aria-pressed="true"]') ||
    root.querySelector<HTMLElement>('.level');
  focusTarget?.focus({ preventScroll: true });
}

function position(host: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(312, window.innerWidth - 16);
  let left = rect.right - width + window.scrollX;
  left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + window.innerWidth - width - 8));
  host.style.left = `${left}px`;
  host.style.top = `${rect.bottom + window.scrollY + 6}px`;
}

// The balance tilts with the verdict: a hidden site sinks, a pinned one rises
// against the feather. Angles in degrees; negative drops the site's (left) pan.
const TILT: Record<Level, number> = { hide: -13, lower: -6, normal: 0, raise: 6, pin: 13 };
const ARM = 52;

function balanceSvg(): SVGSVGElement {
  return icon(`<svg xmlns="http://www.w3.org/2000/svg" class="balance" viewBox="0 0 132 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M66 7v28M56 37h20"/>
    <circle cx="66" cy="5" r="1.6" fill="currentColor" stroke="none"/>
    <g class="beam" style="transform-origin: 66px 9px; transform-box: view-box"><path d="M14 9h104"/></g>
    <g class="pan left">
      <path d="M14 9 7 24M14 9l7 15"/><path d="M4 24h20a10 5 0 0 1-20 0z" fill="currentColor" fill-opacity=".14"/>
      <path d="M14 21.5c-1.8-1.6-3.2-2.6-3.2-4a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 1.4-1.4 2.4-3.2 4z" fill="currentColor" stroke="none"/>
    </g>
    <g class="pan right">
      <path d="M118 9l-7 15M118 9l7 15"/><path d="M108 24h20a10 5 0 0 1-20 0z" fill="currentColor" fill-opacity=".14"/>
      <path d="M115 22.5c1.5-3.5 3.5-5.8 6-7-.3 3.2-2.4 5.6-6 7zM116.4 20.6l2.4-.4"/>
    </g>
  </svg>`) as SVGSVGElement;
}

function setBalance(svg: Element, level: Level): void {
  const deg = TILT[level];
  const rad = (deg * Math.PI) / 180;
  const dy = ARM * Math.sin(rad);
  const dx = ARM * (1 - Math.cos(rad));
  svg.querySelector<SVGGElement>('.beam')?.style.setProperty('transform', `rotate(${deg}deg)`);
  svg.querySelector<SVGGElement>('.pan.left')?.style.setProperty('transform', `translate(${dx}px, ${-dy}px)`);
  svg.querySelector<SVGGElement>('.pan.right')?.style.setProperty('transform', `translate(${-dx}px, ${dy}px)`);
}

function buildPopover(
  data: PopoverData,
  actions: PopoverActions,
  domain: string,
  switchDomain: (d: string) => void,
): { pop: HTMLElement; level: Level } {
  const entry = getSite(data.personalText, domain);
  const personal = entry?.level;
  const pressed: Level | undefined = personal === 'allow' ? 'normal' : personal && personal !== 'normal' ? personal : undefined;
  const fromLists = data.baseline.level;
  const shown: Level = pressed ?? fromLists;
  const choices = domainChoices(data.result.host);

  const select = h(
    'select',
    {
      class: 'domain',
      title: choices.length > 1 ? 'Choose how much of the site this applies to' : undefined,
      disabled: choices.length < 2,
      attrs: { 'aria-label': 'Site to weigh' },
    },
    choices.map((d) => h('option', { value: d, selected: d === domain }, d)),
  );
  select.addEventListener('change', () => switchDomain(select.value));

  const levels = h(
    'div',
    { class: 'levels', attrs: { role: 'group', 'aria-label': 'Weight' } },
    LEVELS.map((level) =>
      h(
        'button',
        {
          class: `level ${level}${!pressed && level === fromLists && level !== 'normal' ? ' from-list' : ''}`,
          type: 'button',
          attrs: { 'aria-pressed': String(pressed === level), 'data-focus-key': `level-${level}` },
          on: {
            click: () => {
              if (level === 'normal') {
                // "Normal" has to beat the lists when they rank this site, so it becomes an explicit allow.
                actions.setLevel(domain, fromLists === 'normal' ? 'normal' : 'allow');
              } else actions.setLevel(domain, pressed === level ? 'normal' : level);
            },
          },
        },
        LEVEL_LABELS[level],
      ),
    ),
  );

  let hint: string;
  if (personal === 'allow') hint = 'Normal, whatever your lists say.';
  else if (pressed) hint = `Your weighing of ${domain}, on every search.`;
  else if (fromLists !== 'normal') {
    const lists = [...new Set(data.baseline.reasons.map((r) => r.list))].join(', ');
    hint = `${LEVEL_CHIPS[fromLists]} by ${lists}. Choose a weight to decide yourself.`;
  } else hint = 'Choose a weight. It applies on every search.';

  // Tags you set toggle; tags from lists are shown but fixed.
  const mine = new Set(entry?.tags ?? []);
  const fromList = new Set(data.verdict.tags.filter((id) => (data.verdict.tagSources[id] ?? []).some((s) => s !== 'Your list')));
  const tagIds = [...data.tags.keys()].sort((a, b) => {
    const rank = (id: string) => (mine.has(id) ? 0 : fromList.has(id) ? 1 : 2);
    return rank(a) - rank(b) || data.tags.get(a)!.label.localeCompare(data.tags.get(b)!.label);
  });
  const tagItems = tagIds.map((id) => {
    const tag = data.tags.get(id)!;
    const on = mine.has(id);
    if (!on && fromList.has(id)) {
      return h(
        'span',
        { class: 'fixed', style: `--c: ${tag.color}`, title: `From ${(data.verdict.tagSources[id] ?? []).join(', ')}` },
        h('i', { class: 'gem' }),
        tag.label,
      );
    }
    return h(
      'button',
      {
        type: 'button',
        style: `--c: ${tag.color}`,
        title: tag.description ?? (on ? `Untag ${domain}` : `Tag ${domain} “${tag.label}”`),
        attrs: { 'aria-pressed': String(on), 'data-focus-key': `tag-${id}` },
        on: { click: () => actions.toggleTag(domain, id) },
      },
      h('i', { class: on ? 'gem' : 'gem hollow' }),
      tag.label,
    );
  });

  const input = h('input', {
    type: 'text',
    placeholder: 'New tag',
    maxLength: 32,
    attrs: { 'aria-label': 'New tag name', 'data-focus-key': 'new-tag' },
  });
  const create = () => {
    const label = input.value.trim();
    if (label) actions.createTag(domain, label);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      create();
    }
  });

  // Once you've weighed a site yourself, offer to propose it to up to two lists:
  // those that already use one of your tags for it come first.
  const ranked = entry
    ? [...data.trackers].sort((a, b) => Number(b.tags.some((t) => mine.has(t))) - Number(a.tags.some((t) => mine.has(t))))
    : [];
  const suggestLinks = ranked
    .slice(0, 2)
    .map((t) => {
      const href = actions.suggest(t, domain);
      return href
        ? h('a', { href, target: '_blank', rel: 'noopener noreferrer', title: `Propose ${domain} to ${t.name} on its issue tracker` }, t.name)
        : null;
    })
    .filter((a): a is HTMLAnchorElement => a !== null);

  const reasons = data.verdict.reasons.slice(0, 6);

  const pop = h(
    'div',
    { class: 'pop', attrs: { role: 'dialog', 'aria-label': `Weigh ${domain}` } },
    h(
      'div',
      { class: 'head' },
      h('span', { class: 'cartouche' }, select),
      h(
        'button',
        { class: 'icon-btn close', type: 'button', title: 'Close', attrs: { 'aria-label': 'Close' }, on: { click: () => closePopover() } },
        icon(ICON_CLOSE),
      ),
    ),
    balanceSvg(),
    levels,
    h('p', { class: 'hint' }, hint),
    h(
      'div',
      { class: 'section' },
      h('h3', null, 'Tags'),
      tagItems.length ? h('div', { class: 'tags' }, tagItems) : null,
      h(
        'div',
        { class: 'new-tag' },
        input,
        h('button', { class: 'text-btn', type: 'button', on: { click: create } }, 'Add tag'),
      ),
    ),
    reasons.length || suggestLinks.length
      ? h(
          'div',
          { class: 'section' },
          h('h3', null, 'Why'),
          reasons.length
            ? h('ul', { class: 'reasons' }, reasons.map((r) => h('li', null, h('b', null, r.list), ` ${r.text}.`)))
            : null,
          suggestLinks.length
            ? h(
                'p',
                { class: 'suggest' },
                'Should a list include it? Suggest it to ',
                suggestLinks.flatMap((a, i) => (i ? [' or ', a] : [a])),
                '.',
              )
            : null,
        )
      : null,
    h(
      'div',
      { class: 'foot' },
      h('span', null, entry ? 'Saved in your list.' : ''),
      h('button', { class: 'text-btn', type: 'button', on: { click: actions.settings } }, 'Settings'),
    ),
  );
  return { pop, level: shown };
}

