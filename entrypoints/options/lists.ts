import { browser } from '#imports';
import { h, icon, plural, timeAgo } from '@/utils/dom';
import { ICON_EXTERNAL, ICON_REFRESH, ICON_TRASH } from '@/utils/icons';
import { colorForTag, parseList, type ListFormat, type ParsedList } from '@/utils/listformat';
import { send } from '@/utils/messages';
import { getSubscriptions, saveSubscriptions } from '@/utils/ruleset';
import { listCacheItem, type Subscription } from '@/utils/storage';
import {
  builtinId,
  displayName,
  downloadList,
  fetchDirectory,
  listText,
  originPermissionFor,
  refreshList,
  subscriptionId,
  toRawUrl,
  type DirectoryEntry,
} from '@/utils/subscriptions';

const FORMAT_LABEL: Record<ListFormat, string> = {
  anubis: 'Anubis',
  goggle: 'Goggle',
  ublacklist: 'uBlacklist',
  domains: 'Domains',
};

let directory: DirectoryEntry[] | undefined;
let flash: { kind: 'ok' | 'error'; text: string } | undefined;
const busy = new Set<string>();

const rerender = (): void => {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

/**
 * Subscribe to a URL. Must be called straight from a click: Firefox only allows
 * permission prompts during the user gesture, so the permission request comes
 * before any other await.
 */
async function subscribe(input: string, entry?: DirectoryEntry): Promise<void> {
  const url = toRawUrl(input);
  if (!/^https:\/\//.test(url)) {
    flash = { kind: 'error', text: 'Lists must be served over https.' };
    return rerender();
  }
  const origin = originPermissionFor(url);
  if (origin) {
    const granted = await browser.permissions.request({ origins: [origin] }).catch(() => false);
    if (!granted) {
      flash = { kind: 'error', text: `Anubis needs permission to read ${new URL(url).hostname} to download this list.` };
      return rerender();
    }
  }
  const id = entry?.builtin ? builtinId(entry) : subscriptionId(url);
  busy.add(id);
  rerender();
  try {
    const text = await downloadList(url);
    const subs = await getSubscriptions();
    const existing = subs.find((s) => s.id === id || s.url === url);
    const next: Subscription[] = existing
      ? subs.map((s) => (s === existing ? { ...s, enabled: true } : s))
      : [...subs, { id, url, enabled: true, addedAt: Date.now(), builtin: entry?.builtin || undefined, name: entry?.name }];
    const cache = await listCacheItem.getValue();
    await listCacheItem.setValue({ ...cache, [existing?.id ?? id]: { text, fetchedAt: Date.now() } });
    await saveSubscriptions(next);
    const parsed = parseList(text);
    flash = { kind: 'ok', text: `Subscribed to ${displayName({ url, name: entry?.name }, parsed.meta)}: ${plural(parsed.rules.length, 'instruction')}, ${plural(parsed.tags.length, 'tag')}.` };
  } catch (error) {
    // Built-in lists still work from their bundled copy when the download fails.
    if (entry?.builtin) {
      const subs = await getSubscriptions();
      if (!subs.some((s) => s.id === id)) {
        await saveSubscriptions([...subs, { id, url, enabled: true, addedAt: Date.now(), builtin: true, name: entry.name }]);
      }
      flash = { kind: 'ok', text: `Subscribed to ${entry.name} (using the copy bundled with Anubis until it can update).` };
    } else {
      flash = { kind: 'error', text: `Couldn’t subscribe: ${error instanceof Error ? error.message : String(error)}` };
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

  const notice = flash ? h('div', { class: `notice ${flash.kind}` }, flash.text) : null;
  flash = undefined;

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
                flash = { kind: 'ok', text: 'All lists checked for updates.' };
                rerender();
              },
            },
          },
          icon(ICON_REFRESH),
          'Update all',
        ),
      ),
    ),
    h('div', { class: 'panel' }, h('h3', null, 'Add a list'), h('p', { class: 'muted' }, 'Paste a link to the file. GitHub, gist and Brave Goggle links are converted to the raw file for you.'), form, notice),
    cards.length ? cards : h('div', { class: 'empty' }, 'No lists yet. Pick some from Discover below.'),
    discover.length ? h('div', { class: 'section-label' }, 'Discover') : null,
    discover.length
      ? h(
          'div',
          { class: 'discover' },
          discover.map((d) => {
            const id = d.builtin ? builtinId(d) : subscriptionId(d.url);
            return h(
              'div',
              { class: 'item' },
              h(
                'h4',
                null,
                d.name,
                d.format ? h('span', { class: 'badge' }, FORMAT_LABEL[d.format as ListFormat] ?? d.format) : null,
                d.lens ? h('span', { class: 'badge lens', title: 'Hides results the list doesn’t mention' }, 'Lens') : null,
              ),
              h('p', null, d.description),
              h(
                'button',
                { class: 'btn small primary', type: 'button', disabled: busy.has(id), on: { click: () => void subscribe(d.url, d) } },
                busy.has(id) ? 'Subscribing…' : 'Subscribe',
              ),
            );
          }),
        )
      : null,
    h(
      'p',
      { class: 'muted', style: 'margin-top:22px;font-size:12.5px' },
      'Made a list worth sharing? Add it to the directory with a pull request to ',
      h('a', { href: 'https://github.com/Bishop-V/anubis/blob/main/lists/directory.json', target: '_blank', rel: 'noopener noreferrer' }, 'lists/directory.json'),
      '.',
    ),
  );
}

function listCard(sub: Subscription, text: string | undefined, cached: { fetchedAt: number; error?: string } | undefined): HTMLElement {
  const parsed: ParsedList | undefined = text ? parseList(text) : undefined;
  const meta = parsed?.meta ?? {};
  const name = displayName(sub, meta);
  const color = meta.avatar ?? colorForTag(sub.id);

  const toggle = h('input', { type: 'checkbox', checked: sub.enabled, attrs: { 'aria-label': `Use ${name}` } });
  toggle.addEventListener('change', async () => {
    const subs = await getSubscriptions();
    await saveSubscriptions(subs.map((s) => (s.id === sub.id ? { ...s, enabled: toggle.checked } : s)));
  });

  const update = async (e: Event) => {
    const b = e.currentTarget as HTMLButtonElement;
    b.disabled = true;
    const entry = await refreshList(sub);
    flash = entry.error ? { kind: 'error', text: `${name}: ${entry.error}` } : { kind: 'ok', text: `${name} is up to date.` };
    rerender();
  };

  const remove = async () => {
    if (!confirm(`Unsubscribe from ${name}?`)) return;
    const subs = await getSubscriptions();
    await saveSubscriptions(subs.filter((s) => s.id !== sub.id));
    const cache = await listCacheItem.getValue();
    delete cache[sub.id];
    await listCacheItem.setValue(cache);
  };

  const facts = [
    parsed ? plural(parsed.rules.length, 'instruction') : 'Not downloaded yet',
    parsed?.tags.length ? plural(parsed.tags.length, 'tag') : null,
    meta.author ? `by ${meta.author}` : null,
    sub.builtin && !cached?.fetchedAt ? 'bundled copy' : `updated ${timeAgo(cached?.fetchedAt ?? 0)}`,
    meta.license ?? null,
  ].filter(Boolean) as string[];

  return h(
    'div',
    { class: `list-card${sub.enabled ? '' : ' off'}` },
    h('div', { class: 'avatar', style: `--c: ${color}` }, name.slice(0, 1).toUpperCase()),
    h(
      'div',
      null,
      h(
        'h4',
        null,
        name,
        parsed ? h('span', { class: 'badge' }, FORMAT_LABEL[parsed.format]) : null,
        parsed?.lens ? h('span', { class: 'badge lens', title: 'Hides results the list doesn’t mention' }, 'Lens') : null,
        sub.builtin ? h('span', { class: 'badge' }, 'Built in') : null,
      ),
      meta.description ? h('p', null, meta.description) : null,
      h(
        'div',
        { class: 'facts' },
        facts.map((f) => h('span', null, f)),
        meta.homepage ? h('a', { href: meta.homepage, target: '_blank', rel: 'noopener noreferrer' }, 'Homepage') : null,
        meta.issues ? h('a', { href: meta.issues, target: '_blank', rel: 'noopener noreferrer' }, 'Suggest changes') : null,
      ),
      parsed?.tags.length
        ? h(
            'div',
            { class: 'tag-row' },
            parsed.tags.slice(0, 12).map((t) => h('span', { class: 'chip', style: `--c: ${t.color}`, title: t.description ?? t.id }, h('i', { class: 'dot' }), t.label)),
          )
        : null,
      cached?.error ? h('div', { class: 'err' }, `Last update failed: ${cached.error}`) : null,
      parsed?.errors.length
        ? h('div', { class: 'muted', style: 'margin-top:6px;font-size:12px' }, `${plural(parsed.errors.length, 'line')} skipped (unsupported or invalid).`)
        : null,
    ),
    h(
      'div',
      { class: 'side' },
      h('label', { class: 'switch', title: sub.enabled ? 'On' : 'Off' }, toggle, h('span')),
      h(
        'div',
        { class: 'buttons' },
        h('button', { class: 'icon-btn', type: 'button', title: 'Update now', attrs: { 'aria-label': `Update ${name}` }, on: { click: update } }, icon(ICON_REFRESH)),
        h('a', { class: 'icon-btn', href: sub.url, target: '_blank', rel: 'noopener noreferrer', title: 'View source', attrs: { 'aria-label': `View ${name} source` } }, icon(ICON_EXTERNAL)),
        h('button', { class: 'icon-btn danger', type: 'button', title: 'Unsubscribe', attrs: { 'aria-label': `Unsubscribe from ${name}` }, on: { click: remove } }, icon(ICON_TRASH)),
      ),
    ),
  );
}
