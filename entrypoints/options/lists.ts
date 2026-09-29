import { browser } from '#imports';
import { h, icon, plural, timeAgo } from '@/utils/dom';
import { t } from '@/utils/i18n';
import { ICON_EXTERNAL, ICON_REFRESH, ICON_TRASH } from '@/utils/icons';
import { readSubscribeLink, REPO_URL, type SubscribeLink } from '@/utils/links';
import { colorForTag, parseList, type ListFormat, type ParsedList } from '@/utils/listformat';
import { send } from '@/utils/messages';
import { flash, flashed, rerender } from './flash';
import { editListCache, listCacheItem, type CachedList, type Subscription } from '@/utils/storage';
import {
  builtinId,
  displayName,
  downloadList,
  editSubscriptions,
  fetchDirectory,
  getSubscriptions,
  listText,
  originPermissionFor,
  refreshList,
  subscriptionId,
  toRawUrl,
  type DirectoryEntry,
} from '@/utils/subscriptions';

const FORMAT_LABEL: Record<ListFormat, string> = {
  anubis: 'Anubis list',
  goggle: 'Brave Goggle',
  ublacklist: 'uBlacklist ruleset',
  domains: 'domain list',
};

/** "Brave Goggle, lens" / "Anubis list, built in" */
function kindOf(format: string | undefined, lens?: boolean, builtin?: boolean): string {
  return [format ? (FORMAT_LABEL[format as ListFormat] ?? format) : null, lens ? 'lens' : null, builtin ? 'built in' : null]
    .filter(Boolean)
    .join(', ');
}

let directory: DirectoryEntry[] | undefined;
const busy = new Set<string>();

/** The list a subscribe link opened settings for, until you subscribe or cancel. */
let offer = readSubscribeLink(location.search);

function dropOffer(): void {
  offer = undefined;
  history.replaceState(null, '', location.pathname + location.hash);
}

/** What subscribing to the offered list means: its address, directory entry, id and name. */
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
    flash('lists', 'error', 'Lists must be served over https.');
    return rerender();
  }
  const origin = originPermissionFor(url);
  if (origin) {
    const granted = await browser.permissions.request({ origins: [origin] }).catch(() => false);
    if (!granted) {
      flash('lists', 'error', `Anubis needs permission to read ${new URL(url).hostname} to download this list.`);
      return rerender();
    }
  }
  const id = entry?.builtin ? builtinId(entry) : subscriptionId(url);
  busy.add(id);
  rerender();
  try {
    const text = await downloadList(url);
    const same = (s: Subscription) => s.id === id || s.url === url;
    // The copy first, so the list has its text as soon as it's subscribed.
    const existing = (await getSubscriptions()).find(same);
    await editListCache((cache) => ({ ...cache, [existing?.id ?? id]: { text, fetchedAt: Date.now() } }));
    await editSubscriptions((subs) =>
      subs.some(same)
        ? subs.map((s) => (same(s) ? { ...s, enabled: true } : s))
        : [...subs, { id, url, enabled: true, addedAt: Date.now(), builtin: entry?.builtin || undefined, name }],
    );
    const parsed = parseList(text);
    flash('lists', 'ok', `Subscribed to ${displayName({ url, name }, parsed.meta)}: ${plural(parsed.rules.length, 'instruction')}, ${plural(parsed.tags.length, 'tag')}.`);
    if (offer && offered(offer).url === url) dropOffer();
  } catch (error) {
    // Built-in lists still work from their bundled copy when the download fails.
    if (entry?.builtin) {
      await editSubscriptions((subs) =>
        subs.some((s) => s.id === id) ? subs : [...subs, { id, url, enabled: true, addedAt: Date.now(), builtin: true, name: entry.name }],
      );
      flash('lists', 'ok', `Subscribed to ${entry.name} (using the copy bundled with Anubis until it can update).`);
      if (offer && offered(offer).url === url) dropOffer();
    } else {
      flash('lists', 'error', `Couldn’t subscribe: ${error instanceof Error ? error.message : String(error)}`);
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
    attrs: { 'aria-label': 'List URL' },
  });
  const form = h('form', { class: 'inline-form' }, urlInput, h('button', { class: 'btn primary', type: 'submit' }, 'Subscribe'));
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
  const subscribedUrls = new Set(subs.map((s) => s.url));
  const subscribedIds = new Set(subs.map((s) => s.id));
  const discover = directory.filter((d) => !subscribedUrls.has(d.url) && !subscribedIds.has(builtinId(d)));

  return h(
    'div',
    null,
    h(
      'div',
      { class: 'page-title' },
      h(
        'div',
        null,
        h('h2', null, 'Lists'),
        h(
          'p',
          null,
          'Subscribe to lists that tag, rerank or hide sites. Any text file on GitHub, GitLab, Codeberg or a gist works: Anubis lists, Brave Goggles, uBlacklist rulesets and plain domain lists.',
        ),
      ),
      h(
        'div',
        { class: 'toolbar' },
        h(
          'button',
          {
            class: 'btn',
            type: 'button',
            on: {
              click: async (e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.disabled = true;
                b.lastChild!.textContent = 'Updating…';
                await send({ type: 'refresh-all' });
                flash('lists', 'ok', 'All lists checked for updates.');
                rerender();
              },
            },
          },
          icon(ICON_REFRESH),
          'Update all',
        ),
      ),
    ),
    offer ? offerPanel(offer, notice) : null,
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Add a list'),
      h('p', { class: 'muted' }, 'Paste a link to the file. Links to a GitHub page, a gist or a Brave Goggle work too.'),
      form,
      offer ? null : notice,
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Your lists'),
      cards.length ? cards : h('p', { class: 'empty' }, 'No lists yet. Pick some from the ones below.'),
    ),
    discover.length
      ? h(
          'div',
          { class: 'panel' },
          h('h3', null, 'More lists'),
          h('p', { class: 'muted' }, 'From the Anubis directory and the wider community.'),
          discover.map((d) => {
            const id = d.builtin ? builtinId(d) : subscriptionId(d.url);
            return h(
              'div',
              { class: 'discover-row' },
              h(
                'div',
                { class: 'body' },
                h('b', null, d.name),
                h('span', { class: 'kind', title: d.lens ? 'A lens hides results the list doesn’t mention' : undefined }, kindOf(d.format, d.lens)),
                h('p', null, d.description),
              ),
              h(
                'button',
                { class: 'text-btn', type: 'button', disabled: busy.has(id), on: { click: () => void subscribe(d.url, d) } },
                busy.has(id) ? 'Subscribing…' : 'Subscribe',
              ),
            );
          }),
        )
      : null,
    h(
      'p',
      { class: 'muted', style: 'margin-top:26px;font-size:13px' },
      'Made a list worth sharing? Add it to the directory with a pull request to ',
      h('a', { href: `${REPO_URL}/blob/main/lists/directory.json`, target: '_blank', rel: 'noopener noreferrer' }, 'lists/directory.json'),
      '.',
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
    entry ? h('p', { class: 'muted' }, entry.description, h('span', { class: 'kind' }, kindOf(entry.format, entry.lens))) : null,
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

  const toggle = h('input', { type: 'checkbox', checked: sub.enabled, attrs: { 'aria-label': `Use ${name}` } });
  toggle.addEventListener('change', () => {
    void editSubscriptions((subs) => subs.map((s) => (s.id === sub.id ? { ...s, enabled: toggle.checked } : s)));
  });

  const update = async (e: Event) => {
    const b = e.currentTarget as HTMLButtonElement;
    b.disabled = true;
    const entry = await refreshList(sub);
    if (entry.error) flash('lists', 'error', `${name}: ${entry.error}`);
    else flash('lists', 'ok', `${name} is up to date.`);
    rerender();
  };

  const remove = async () => {
    if (!confirm(`Unsubscribe from ${name}?`)) return;
    await editSubscriptions((subs) => subs.filter((s) => s.id !== sub.id));
    await editListCache(({ [sub.id]: _, ...rest }) => rest);
  };

  const facts = [
    parsed ? plural(parsed.rules.length, 'instruction') : 'not downloaded yet',
    parsed?.tags.length ? plural(parsed.tags.length, 'tag') : null,
    meta.author ? `by ${meta.author}` : null,
    sub.builtin && !cached?.fetchedAt ? 'the copy bundled with Anubis' : `updated ${timeAgo(cached?.fetchedAt ?? 0)}`,
    meta.license ?? null,
  ].filter(Boolean) as string[];
  const links = [
    meta.homepage ? h('a', { href: meta.homepage, target: '_blank', rel: 'noopener noreferrer' }, 'homepage') : null,
    meta.issues ? h('a', { href: meta.issues, target: '_blank', rel: 'noopener noreferrer' }, 'suggest changes') : null,
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
          { class: 'kind', title: parsed?.lens ? 'A lens hides results the list doesn’t mention' : undefined },
          kindOf(parsed?.format, parsed?.lens, sub.builtin),
        ),
      ),
      meta.description ? h('p', null, meta.description) : null,
      h(
        'div',
        { class: 'facts' },
        `${facts.join(', ')}.`,
        links.length ? ' ' : null,
        links.flatMap((a, i) => (i ? [', ', a] : [a])),
      ),
      parsed?.tags.length
        ? h(
            'div',
            { class: 'tag-line' },
            parsed.tags.slice(0, 12).map((t) => h('span', { class: 'tag', style: `--c: ${t.color}`, title: t.description ?? t.id }, h('i', { class: 'gem' }), t.label)),
          )
        : null,
      cached?.error
        ? sub.builtin && !cached.text
          ? h('div', { class: 'facts', style: 'margin-top:6px' }, `Using the copy bundled with Anubis until it can update (${cached.error}).`)
          : h('div', { class: 'err' }, `The last update failed: ${cached.error}.`)
        : null,
      parsed?.errors.length
        ? h('div', { class: 'facts', style: 'margin-top:6px' }, `${plural(parsed.errors.length, 'line')} skipped: Anubis can’t read that syntax yet.`)
        : null,
    ),
    h(
      'div',
      { class: 'side' },
      h('label', { class: 'switch', title: sub.enabled ? 'On' : 'Off' }, toggle, h('span')),
      h('button', { class: 'icon-btn', type: 'button', title: 'Update now', attrs: { 'aria-label': `Update ${name}` }, on: { click: update } }, icon(ICON_REFRESH)),
      h('a', { class: 'icon-btn', href: sub.url, target: '_blank', rel: 'noopener noreferrer', title: 'View the file', attrs: { 'aria-label': `View ${name}` } }, icon(ICON_EXTERNAL)),
      h('button', { class: 'icon-btn danger', type: 'button', title: 'Unsubscribe', attrs: { 'aria-label': `Unsubscribe from ${name}` }, on: { click: remove } }, icon(ICON_TRASH)),
    ),
  );
}
