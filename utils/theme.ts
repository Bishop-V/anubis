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

/** The order the button steps through, from the default. */
const CYCLE: { value: Theme; label: MessageKey; svg: string }[] = [
  { value: 'auto', label: 'themeAuto', svg: ICON_AUTO },
  { value: 'light', label: 'themeLight', svg: ICON_SUN },
  { value: 'dark', label: 'themeDark', svg: ICON_MOON },
];

/** The scheme after `theme` when the button is pressed: Auto, Light, Dark, and round again. */
export function nextTheme(theme: Theme): Theme {
  const at = CYCLE.findIndex((o) => o.value === theme);
  return CYCLE[(at + 1) % CYCLE.length]!.value;
}

/** One button showing the colour scheme's icon; each press moves to the next scheme. */
export function themeButton(current: Theme): HTMLElement {
  const button = h('button', { class: 'icon-btn theme-btn', type: 'button' });
  const show = (theme: Theme) => {
    const o = CYCLE.find((c) => c.value === theme) ?? CYCLE[0]!;
    const label = t('themeButtonTitle', t(o.label));
    button.title = label;
    button.setAttribute('aria-label', label);
    button.replaceChildren(icon(o.svg));
  };
  let theme = current;
  show(theme);
  button.addEventListener('click', () => {
    theme = nextTheme(theme);
    show(theme);
    void updateSettings({ theme });
  });
  return button;
}
