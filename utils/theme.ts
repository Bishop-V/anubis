import { h, icon } from './dom';
import { t, type MessageKey } from './i18n';
import { ICON_AUTO, ICON_MOON, ICON_SUN } from './icons';
import { colorSchemeItem, settingsItem, updateSettings, type Theme } from './storage';

// Theme handling for extension pages (popup, options). On a search page, what sits
// on the page follows the page (pageTheme() in entrypoints/content/index.ts), and
// the result menu, a card like the popup, follows the scheme recorded here.

// Chrome's background service worker has no matchMedia. Asking for light rather
// than dark means a browser that reports neither gets dark.
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : undefined;

/** Light or dark as the browser reports it, and dark when it doesn't say. */
export function browserScheme(): 'light' | 'dark' {
  return media?.matches ? 'light' : 'dark';
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'auto' ? browserScheme() : theme;
}

/** Record light or dark as extension pages see it, now and whenever it changes. */
export function recordColorScheme(): void {
  if (!media) return;
  const save = async () => {
    const scheme = browserScheme();
    if ((await colorSchemeItem.getValue()) !== scheme) await colorSchemeItem.setValue(scheme);
  };
  void save();
  media.addEventListener('change', () => void save());
}

/** Keep <html data-theme> in sync with the setting and, on "auto", with the OS. */
export async function initTheme(onChange?: (theme: Theme) => void): Promise<Theme> {
  let theme = (await settingsItem.getValue())?.theme ?? 'auto';
  const apply = () => {
    document.documentElement.dataset.theme = resolveTheme(theme);
  };
  apply();
  media?.addEventListener('change', apply);
  recordColorScheme();
  settingsItem.watch((next) => {
    theme = next?.theme ?? 'auto';
    apply();
    onChange?.(theme);
  });
  return theme;
}

const OPTIONS: { value: Theme; label: MessageKey; title: MessageKey; svg: string }[] = [
  { value: 'auto', label: 'themeAuto', title: 'themeAutoTitle', svg: ICON_AUTO },
  { value: 'light', label: 'themeLight', title: 'themeLightTitle', svg: ICON_SUN },
  { value: 'dark', label: 'themeDark', title: 'themeDarkTitle', svg: ICON_MOON },
];

/** Auto / Light / Dark segmented control. `compact` shows icons only. */
export function themeSwitcher(current: Theme, compact = false): HTMLElement {
  const seg = h('div', { class: 'seg', attrs: { role: 'group', 'aria-label': t('themeHeading') } });
  const buttons = OPTIONS.map((o) =>
    h(
      'button',
      {
        type: 'button',
        title: t(o.title),
        attrs: { 'aria-pressed': String(o.value === current), 'aria-label': t(o.title) },
        on: {
          click: () => {
            buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(OPTIONS[i]!.value === o.value)));
            void updateSettings({ theme: o.value });
          },
        },
      },
      icon(o.svg),
      compact ? null : t(o.label),
    ),
  );
  seg.append(...buttons);
  return seg;
}
