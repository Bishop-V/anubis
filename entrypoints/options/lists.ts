import { browser } from '#imports';
import { h, icon } from '@/utils/dom';
import { normalizeDomain } from '@/utils/domain';
import { t, tJoin, tList, tn, tParts, type MessageKey } from '@/utils/i18n';
import { ICON_REFRESH, ICON_TRASH } from '@/utils/icons';
import { readSubscribeLink, REPO_URL, type SubscribeLink } from '@/utils/links';
import { colorForTag, parseList, type ListFormat, type ParsedList } from '@/utils/listformat';
import { send } from '@/utils/messages';
import { flash, flashed, rerender } from './flash';
import { foldable, helpLink, pageTitle } from './parts';
import { editListCache, listCacheItem, type CachedList, type Subscription } from '@/utils/storage';
import {
  builtinId,
  changeRequestUrl,
  displayName,
  downloadList,
  freshCopy,
  editSubscriptions,
  fetchDirectory,
  getSubscriptions,
  listsToDiscover,
  listText,
  originPermissionFor,
  refreshList,
  subscriptionId,
  toRawUrl,
  type DirectoryEntry,
  type ListChange,
} from '@/utils/subscriptions';

const FORMAT_LABEL: Record<ListFormat, MessageKey> = {
  anubis: 'listFormatAnubis',
  goggle: 'listFormatGoggle',
  ublacklist: 'listFormatUblacklist',
  domains: 'listFormatDomains',
};

/** "Brave Goggle, lens" */
function kindOf(format: string | undefined, lens?: boolean): string {
  const label = format && format in FORMAT_LABEL ? t(FORMAT_LABEL[format as ListFormat]) : format;
  return tJoin([label, lens ? t('listKindLens') : null].filter((x): x is string => !!x), 'unit');
}

/** Your lists start folded once there are more than this many. */
const FOLD_AFTER = 5;

let directory: DirectoryEntry[] | undefined;
const busy = new Set<string>();
/** The list whose Suggest changes form is open, and whether it has just opened (to move focus into it once). */
let suggesting: string | undefined;
let justOpened = false;

/** The list a subscribe link opened settings for, until you subscribe or cancel. */
let offer = readSubscribeLink(location.search);

function dropOffer(): void {
  offer = undefined;
  history.replaceState(null, '', location.pathname + location.hash);
}

/** What subscribing to the offered list means: its address, directory entry, id, and name. */
function offered(link: SubscribeLink) {
  const url = toRawUrl(link.url);
  const entry = directory?.find((d) => d.url === url);
  const id = entry?.builtin ? builtinId(entry) : subscriptionId(url);
  return { url, entry, id, name: entry?.name ?? link.name ?? displayName({ url }) };
}

/**
 * Subscribe to a URL. Must be called straight from a click: Firefox only allows
 * permission prompts during the user gesture, so the permission request comes
 * before any other await.
 */
async function subscribe(input: string, entry?: DirectoryEntry, name = entry?.name): Promise<void> {
  const url = toRawUrl(input);
  if (!/^https:\/\//.test(url)) {
    flash('lists', 'error', t('listsNeedHttps'));
    return rerender();
  }
  const origin = originPermissionFor(url);
  if (origin) {
    const granted = await browser.permissions.request({ origins: [origin] }).catch(() => false);
    if (!granted) {
      flash('lists', 'error', t('listsPermissionToDownload', new URL(url).hostname));
      return rerender();
    }
  }
  const id = entry?.builtin ? builtinId(entry) : subscriptionId(url);
  busy.add(id);
  rerender();
  try {
    const download = await downloadList(url);
    const same = (s: Subscription) => s.id === id || s.url === url;
    // The copy first, so the list has its text as soon as it's subscribed.
    const existing = (await getSubscriptions()).find(same);
    await editListCache((cache) => ({ ...cache, [existing?.id ?? id]: freshCopy(download) }));
    await editSubscriptions((subs) =>
      subs.some(same)
        ? subs.map((s) => (same(s) ? { ...s, enabled: true } : s))
        : [...subs, { id, url, enabled: true, addedAt: Date.now(), builtin: entry?.builtin || undefined, name }],
    );
    const { parsed } = download;
    flash('lists', 'ok', t('listsSubscribed', displayName({ url, name }, parsed.meta), tn('listInstructions', parsed.rules.length), tn('popupTagCount', parsed.tags.length)));
    if (offer && offered(offer).url === url) dropOffer();
  } catch (error) {
    // Built-in lists still work from their bundled copy when the download fails.
    if (entry?.builtin) {
      await editSubscriptions((subs) =>
        subs.some((s) => s.id === id) ? subs : [...subs, { id, url, enabled: true, addedAt: Date.now(), builtin: true, name: entry.name }],
      );
      flash('lists', 'ok', t('listsSubscribedBundled', entry.name));
      if (offer && offered(offer).url === url) dropOffer();
    } else {
      flash('lists', 'error', t('listsSubscribeFailed', error instanceof Error ? error.message : String(error)));
    }
  } finally {
    busy.delete(id);
    rerender();
  }
}

export async function renderLists(): Promise<HTMLElement> {
  const [subs, cache] = await Promise.all([getSubscriptions(), listCacheItem.getValue()]);
  directory ??= await fetchDirectory();

  const urlInput = h('input', {
    type: 'url',
    placeholder: 'https://github.com/you/lists/blob/main/my.anubis',
    attrs: { 'aria-label': t('listsUrlLabel') },
  });
  const form = h('form', { class: 'inline-form' }, urlInput, h('button', { class: 'btn primary', type: 'submit' }, t('offerSubscribe')));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (urlInput.value.trim()) void subscribe(urlInput.value.trim());
  });

  if (offer) {
    const { url, id, name } = offered(offer);
    if (!busy.has(id) && subs.some((s) => (s.id === id || s.url === url) && s.enabled)) {
      flash('lists', 'ok', t('offerAlready', name));
      dropOffer();
    }
  }
  const notice = flashed('lists');

  const cards = subs.map((sub) => listCard(sub, listText(sub, cache), cache[sub.id]));
  const discover = listsToDiscover(directory, subs);

  return h(
    'div',
    null,
    pageTitle(
      t('listsHeading'),
      t('listsIntro'),
      h(
        'button',
        {
          class: 'btn',
          type: 'button',
          on: {
            click: async (e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.disabled = true;
              b.lastChild!.textContent = t('listsUpdating');
              await send({ type: 'refresh-all' });
              flash('lists', 'ok', t('listsAllChecked'));
              rerender();
            },
          },
        },
        icon(ICON_REFRESH),
        t('listsUpdateAll'),
      ),
    ),
    offer ? offerPanel(offer, notice) : null,
    foldable(
      'add',
      t('listsAddHeading'),
      null,
      true,
      h('p', { class: 'muted' }, t('listsAddHint'), ' ', helpLink('guide/lists#what-lists-work', t('listsAddHelp'))),
      form,
      offer ? null : notice,
    ),
    // A long list of your own folds away, so the lists to add below stay in reach.
    foldable(
      'yours',
      t('welcomeListsHeading'),
      subs.length,
      subs.length <= FOLD_AFTER,
      flashed('unsubscribed'),
      cards.length ? cards : h('p', { class: 'empty' }, t('listsNone')),
    ),
    discover.length ? moreLists(discover) : null,
    h(
      'p',
      { class: 'muted', style: 'margin-top:26px;font-size:13px' },
      tParts('listsShare', h('a', { href: `${REPO_URL}/blob/main/lists/directory.json`, target: '_blank', rel: 'noopener noreferrer' }, 'lists/directory.json')),
      ' ',
      helpLink('guide/publish-a-list', t('publishHelp')),
    ),
  );
}

/** Directory lists you don't have yet, each with Subscribe. */
function moreLists(discover: DirectoryEntry[]): HTMLElement {
  return foldable(
    'more',
    t('listsMoreHeading'),
    discover.length,
    true,
    h('p', { class: 'muted' }, t('listsMoreIntro')),
    discover.map((d) => {
      const id = d.builtin ? builtinId(d) : subscriptionId(d.url);
      return h(
        'div',
        { class: 'discover-row' },
        h(
          'div',
          { class: 'body' },
          h('b', null, d.name),
          d.lens ? h('span', { class: 'kind', title: t('listLensTitle') }, t('listKindLens')) : null,
          h('p', { attrs: { dir: 'auto' } }, d.description),
        ),
        h(
          'button',
          { class: 'text-btn', type: 'button', disabled: busy.has(id), on: { click: () => void subscribe(d.url, d) } },
          busy.has(id) ? t('offerSubscribing') : t('offerSubscribe'),
        ),
      );
    }),
  );
}

/** "Subscribe to …?", for the list a subscribe link asked for. */
function offerPanel(link: SubscribeLink, notice: HTMLElement | null): HTMLElement {
  const { url, entry, id, name } = offered(link);
  // Lists outside GitHub need a host permission, which the browser asks for on Subscribe.
  const host = originPermissionFor(url) ? new URL(url).hostname : undefined;
  return h(
    'div',
    { class: 'panel offer' },
    h('h3', null, t('offerTitle', name)),
    entry ? h('p', { class: 'muted' }, h('bdi', null, entry.description), h('span', { class: 'kind' }, kindOf(entry.format, entry.lens))) : null,
    h('p', { class: 'address' }, h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, url)),
    // Directory lists have been looked at; a link can come from anyone.
    entry && !host ? null : h('p', { class: 'muted' }, [entry ? null : t('offerTrust'), host ? t('offerPermission', host) : null].filter(Boolean).join(' ')),
    h(
      'div',
      { class: 'inline-form' },
      h(
        'button',
        { class: 'btn primary', type: 'button', disabled: busy.has(id), on: { click: () => void subscribe(url, entry, name) } },
        busy.has(id) ? t('offerSubscribing') : t('offerSubscribe'),
      ),
      h(
        'button',
        {
          class: 'btn',
          type: 'button',
          disabled: busy.has(id),
          on: {
            click: () => {
              dropOffer();
              rerender();
            },
          },
        },
        t('offerCancel'),
      ),
    ),
    notice,
  );
}

function listCard(sub: Subscription, text: string | undefined, cached: CachedList | undefined): HTMLElement {
  const parsed: ParsedList | undefined = text ? parseList(text) : undefined;
  const meta = parsed?.meta ?? {};
  const name = displayName(sub, meta);
  const color = meta.avatar ?? colorForTag(sub.id);

  const toggle = h('input', { type: 'checkbox', checked: sub.enabled, attrs: { 'aria-label': t('listsUse', name) } });
  toggle.addEventListener('change', () => {
    void editSubscriptions((subs) => subs.map((s) => (s.id === sub.id ? { ...s, enabled: toggle.checked } : s)));
  });

  const update = (e: Event) => {
    const b = e.currentTarget as HTMLButtonElement;
    b.disabled = true;
    // A list that came from another browser (through sync or a backup) may not
    // have its host allowed here yet. Ask straight from the click, as Firefox
    // requires; a host already allowed doesn't ask again.
    const origin = originPermissionFor(sub.url);
    const asked = origin ? browser.permissions.request({ origins: [origin] }).catch(() => false) : Promise.resolve(true);
    void asked.then(async (granted) => {
      if (!granted) {
        flash('lists', 'error', t('listPermissionDenied', new URL(sub.url).hostname));
        rerender();
        return;
      }
      const entry = await refreshList(sub);
      if (entry.error) flash('lists', 'error', t('listsUpdateFailed', name, entry.error));
      else flash('lists', 'ok', t('listsUpToDate', name));
      rerender();
    });
  };

  const remove = async () => {
    let at = -1;
    await editSubscriptions((subs) => {
      at = subs.findIndex((s) => s.id === sub.id);
      return subs.filter((s) => s.id !== sub.id);
    });
    await editListCache(({ [sub.id]: _, ...rest }) => rest);
    // Undo puts the list back where it was, with the copy it had.
    flash('unsubscribed', 'ok', t('listsUnsubscribed', name), async () => {
      await editSubscriptions((subs) => (subs.some((s) => s.id === sub.id) ? subs : [...subs.slice(0, Math.max(0, at)), sub, ...subs.slice(Math.max(0, at))]));
      if (cached) await editListCache((cache) => (cache[sub.id] ? cache : { ...cache, [sub.id]: cached }));
    });
  };

  // Kept to what someone choosing whether to keep a list needs: what it does. Suggest changes is a button beside it.
  const links = [meta.homepage ? h('a', { href: meta.homepage, target: '_blank', rel: 'noopener noreferrer' }, t('listsHomepage')) : null].filter(
    (a): a is HTMLAnchorElement => a !== null,
  );
  // Only lists that ask for suggestions with `! issues:` offer them: a list that never did may not want them.
  const tracker = meta.issues;
  const open = !!tracker && suggesting === sub.id;
  const suggest = tracker
    ? h(
        'button',
        {
          class: 'btn small',
          type: 'button',
          attrs: { 'aria-label': t('listsSuggestChangesTo', name), 'aria-expanded': String(open) },
          on: {
            click: () => {
              suggesting = open ? undefined : sub.id;
              justOpened = !open;
              rerender();
            },
          },
        },
        t('listsSuggestChanges'),
      )
    : null;

  return h(
    'div',
    { class: `list-row${sub.enabled ? '' : ' off'}` },
    h('i', { class: 'gem mark', style: `--c: ${color}` }),
    h(
      'div',
      { class: 'body' },
      h('h4', null, name, parsed?.lens ? h('span', { class: 'kind', title: t('listLensTitle') }, kindOf(parsed.format, true)) : null),
      // A list's own words, often English: laid out in their own direction in Arabic or Urdu.
      meta.description ? h('p', { attrs: { dir: 'auto' } }, meta.description) : null,
      parsed ? null : h('div', { class: 'facts' }, t('listsFacts', t('listsNotDownloaded'))),
      links.length ? h('div', { class: 'facts' }, tList('listsLinks', links, 'unit')) : null,
      cached?.error
        ? sub.builtin && !cached.text
          ? h('div', { class: 'facts', style: 'margin-top:6px' }, t('listsUsingBundled', cached.error))
          : h('div', { class: 'err' }, t('listsLastUpdateFailed', cached.error))
        : null,
      parsed?.errors.length
        ? h('div', { class: 'facts', style: 'margin-top:6px' }, tn('listsSkippedLines', parsed.errors.length))
        : null,
    ),
    h(
      'div',
      { class: 'side' },
      suggest,
      h('label', { class: 'switch', title: sub.enabled ? t('listsOn') : t('listsOff') }, toggle, h('span')),
      h('button', { class: 'icon-btn', type: 'button', title: t('listsUpdateNow'), attrs: { 'aria-label': t('listsUpdateOne', name) }, on: { click: update } }, icon(ICON_REFRESH)),
      h('button', { class: 'icon-btn danger', type: 'button', title: t('listsUnsubscribe'), attrs: { 'aria-label': t('listsUnsubscribeOne', name) }, on: { click: remove } }, icon(ICON_TRASH)),
    ),
    open ? suggestForm(tracker, name, parsed) : null,
  );
}

/**
 * Suggest changes: the site, what should change, and why, turned into an issue
 * on the list's tracker with the instruction already written. Nothing is sent:
 * the issue opens in a new tab for the person to check and submit.
 */
function suggestForm(tracker: string, list: string, parsed: ParsedList | undefined): HTMLElement {
  const changes = suggestChoices(parsed);

  const site = h('input', { type: 'text', placeholder: 'go.dev', autocomplete: 'off', spellcheck: false, attrs: { 'aria-label': t('listsSuggestSite') } });
  const what = h(
    'select',
    { attrs: { 'aria-label': t('listsSuggestWhat') } },
    ...changes.map((c, i) => h('option', { value: String(i) }, c.label)),
  );
  const why = h('input', { type: 'text', maxLength: 300 });
  const error = h('p', { class: 'notice error', hidden: true });
  const close = () => {
    suggesting = undefined;
    rerender();
  };

  const form = h(
    'form',
    { class: 'suggest-form' },
    h('div', { class: 'inline-form' }, site, what),
    h('label', { class: 'field' }, h('span', null, t('listsSuggestWhy')), why),
    error,
    h(
      'div',
      { class: 'inline-form' },
      h('button', { class: 'btn small primary', type: 'submit' }, t('listsSuggestOpen')),
      h('button', { class: 'text-btn', type: 'button', on: { click: close } }, t('listsSuggestCancel')),
    ),
    h('p', { class: 'facts' }, t('listsSuggestHint', new URL(tracker).hostname)),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const domain = siteTyped(site, error);
    if (!domain) return;
    const url = changeRequestUrl(tracker, list, domain, changes[Number(what.value)]!.change, why.value);
    if (url) window.open(url, '_blank', 'noopener');
    close();
  });
  if (justOpened) {
    justOpened = false;
    // After the section has replaced the old one.
    setTimeout(() => site.isConnected && site.focus(), 0);
  }
  return form;
}

/** What a list can be asked to change: one of its tags (or adding the site, when it has none), taking the site off, or anything else. */
function suggestChoices(parsed: ParsedList | undefined): { label: string; change: ListChange }[] {
  const tags = parsed?.format === 'anubis' ? parsed.tags.filter((tag) => !tag.generated) : [];
  const additions = tags.length
    ? tags.map((tag) => ({ label: t('listsSuggestTag', tag.label), change: { kind: 'tag', tag: { id: tag.id, label: tag.label } } as const }))
    : [{ label: t('listsSuggestAdd'), change: { kind: 'add' } as const }];
  return [...additions, { label: t('listsSuggestRemove'), change: { kind: 'remove' } }, { label: t('listsSuggestOther'), change: { kind: 'other' } }];
}

/** The site typed into Suggest changes, or undefined after saying what's wrong with it. */
function siteTyped(input: HTMLInputElement, error: HTMLElement): string | undefined {
  const typed = input.value.trim();
  const domain = normalizeDomain(typed);
  if (domain) return domain;
  error.textContent = typed ? t('tagNotSite', typed) : t('tagTypeSite');
  error.hidden = false;
  input.focus();
  return undefined;
}
