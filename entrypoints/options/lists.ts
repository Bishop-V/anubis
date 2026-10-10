import { browser } from '#imports';
import { h, icon } from '@/utils/dom';
import { t, tAgo, tJoin, tList, tn, tParts, type MessageKey } from '@/utils/i18n';
import { ICON_EXTERNAL, ICON_REFRESH, ICON_TRASH } from '@/utils/icons';
import { readSubscribeLink, REPO_URL, type SubscribeLink } from '@/utils/links';
import { colorForTag, parseList, type ListFormat, type ParsedList } from '@/utils/listformat';
import { send } from '@/utils/messages';
import { flash, flashed, rerender } from './flash';
import { helpLink, pageTitle } from './parts';
import { editListCache, listCacheItem, type CachedList, type Subscription } from '@/utils/storage';
import {
  builtinId,
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
} from '@/utils/subscriptions';

const FORMAT_LABEL: Record<ListFormat, MessageKey> = {
  anubis: 'listFormatAnubis',
  goggle: 'listFormatGoggle',
  ublacklist: 'listFormatUblacklist',
  domains: 'listFormatDomains',
};

/** "Brave Goggle, lens" / "Anubis list, built in" */
function kindOf(format: string | undefined, lens?: boolean, builtin?: boolean): string {
  const label = format && format in FORMAT_LABEL ? t(FORMAT_LABEL[format as ListFormat]) : format;
  return tJoin([label, lens ? t('listKindLens') : null, builtin ? t('listKindBuiltin') : null].filter((x): x is string => !!x), 'unit');
}

let directory: DirectoryEntry[] | undefined;
const busy = new Set<string>();

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
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('listsAddHeading')),
      h('p', { class: 'muted' }, t('listsAddHint'), ' ', helpLink('guide/lists#what-lists-work', t('listsAddHelp'))),
      form,
      offer ? null : notice,
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('welcomeListsHeading')),
      flashed('unsubscribed'),
      cards.length ? cards : h('p', { class: 'empty' }, t('listsNone')),
    ),
    discover.length
      ? h(
          'div',
          { class: 'panel' },
          h('h3', null, t('listsMoreHeading')),
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
                h('span', { class: 'kind', title: d.lens ? t('listLensTitle') : undefined }, kindOf(d.format, d.lens)),
                h('p', { attrs: { dir: 'auto' } }, d.description),
              ),
              h(
                'button',
                { class: 'text-btn', type: 'button', disabled: busy.has(id), on: { click: () => void subscribe(d.url, d) } },
                busy.has(id) ? t('offerSubscribing') : t('offerSubscribe'),
              ),
            );
          }),
        )
      : null,
    h(
      'p',
      { class: 'muted', style: 'margin-top:26px;font-size:13px' },
      tParts('listsShare', h('a', { href: `${REPO_URL}/blob/main/lists/directory.json`, target: '_blank', rel: 'noopener noreferrer' }, 'lists/directory.json')),
      ' ',
      helpLink('guide/publish-a-list', t('publishHelp')),
    ),
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

  const facts = [
    parsed ? tn('listInstructions', parsed.rules.length) : t('listsNotDownloaded'),
    parsed?.tags.length ? tn('popupTagCount', parsed.tags.length) : null,
    meta.author ? t('listsBy', meta.author) : null,
    // A list never downloaded already says "not downloaded yet"; "updated never" read badly in most languages.
    cached?.fetchedAt ? t('listsUpdated', tAgo(cached.fetchedAt)) : sub.builtin ? t('listsBundledCopy') : null,
    meta.license ?? null,
  ].filter(Boolean) as string[];
  const links = [
    meta.homepage ? h('a', { href: meta.homepage, target: '_blank', rel: 'noopener noreferrer' }, t('listsHomepage')) : null,
    meta.issues ? h('a', { href: meta.issues, target: '_blank', rel: 'noopener noreferrer' }, t('listsSuggestChanges')) : null,
  ].filter((a): a is HTMLAnchorElement => a !== null);

  return h(
    'div',
    { class: `list-row${sub.enabled ? '' : ' off'}` },
    h('i', { class: 'gem mark', style: `--c: ${color}` }),
    h(
      'div',
      { class: 'body' },
      h(
        'h4',
        null,
        name,
        h(
          'span',
          { class: 'kind', title: parsed?.lens ? t('listLensTitle') : undefined },
          kindOf(parsed?.format, parsed?.lens, sub.builtin),
        ),
      ),
      // A list's own words, often English: laid out in their own direction in Arabic or Urdu.
      meta.description ? h('p', { attrs: { dir: 'auto' } }, meta.description) : null,
      h(
        'div',
        { class: 'facts' },
        t('listsFacts', tJoin(facts, 'unit')),
        links.length ? ' ' : null,
        tList('listsLinks', links, 'unit'),
      ),
      parsed?.tags.length
        ? h(
            'div',
            { class: 'tag-line' },
            parsed.tags.slice(0, 12).map((tag) => h('span', { class: 'tag', style: `--c: ${tag.color}`, title: tag.description ?? tag.id }, h('i', { class: 'gem' }), tag.label)),
          )
        : null,
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
      h('label', { class: 'switch', title: sub.enabled ? t('listsOn') : t('listsOff') }, toggle, h('span')),
      h('button', { class: 'icon-btn', type: 'button', title: t('listsUpdateNow'), attrs: { 'aria-label': t('listsUpdateOne', name) }, on: { click: update } }, icon(ICON_REFRESH)),
      h('a', { class: 'icon-btn', href: sub.url, target: '_blank', rel: 'noopener noreferrer', title: t('listsViewFile'), attrs: { 'aria-label': t('listsViewOne', name) } }, icon(ICON_EXTERNAL)),
      h('button', { class: 'icon-btn danger', type: 'button', title: t('listsUnsubscribe'), attrs: { 'aria-label': t('listsUnsubscribeOne', name) }, on: { click: remove } }, icon(ICON_TRASH)),
    ),
  );
}
