import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Graphite, neutral greys with no gold, everywhere Anubis draws: its own pages
// (assets/theme.css), what it adds to search pages (entrypoints/content/shadow.css),
// written out twice because a shadow root can't see the page's variables, and its logo.

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** The custom properties declared in the first block whose selector list includes `selector`. */
function tokens(css: string, selector: string): Record<string, string> {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error(`No block for ${selector}`);
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]));
}

const theme = read('assets/theme.css');
const shadow = read('entrypoints/content/shadow.css');
const dark = tokens(theme, ":root[data-theme='dark']");
const light = { ...dark, ...tokens(theme, ":root[data-theme='light']") };
const shadowLight = tokens(shadow, ':host {');
const shadowDark = { ...shadowLight, ...tokens(shadow, ":host([data-theme='dark'])") };

// The menu's shadow floats over someone else's page, so it's its own.
const shared = (a: Record<string, string>, b: Record<string, string>) => Object.keys(a).filter((k) => k in b && k !== '--shadow');

const GOLD = /--gold|#d4a637|#e0b54e|#8d6716/i;
const SHEETS = [
  'assets/theme.css',
  'entrypoints/content/shadow.css',
  'entrypoints/content/page.css',
  'entrypoints/popup/style.css',
  'entrypoints/options/style.css',
  'entrypoints/welcome/style.css',
  'docs/.vitepress/theme/brand.css',
  // The logo, its copies, and the images drawn from it.
  'public/anubis.svg',
  'anubis.svg',
  'docs/public/anubis.svg',
  'store/render.mjs',
];

describe('palette', () => {
  it('matches between the extension pages and search pages, in light', () => {
    const keys = shared(shadowLight, light);
    expect(keys.length).toBeGreaterThanOrEqual(8);
    for (const k of keys) expect([k, shadowLight[k]]).toEqual([k, light[k]]);
  });

  it('matches between the extension pages and search pages, in dark', () => {
    for (const k of shared(shadowDark, dark)) expect([k, shadowDark[k]]).toEqual([k, dark[k]]);
  });

  it.each(SHEETS)('%s is drawn in no gold', (path) => {
    expect(read(path).replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(GOLD);
  });

  it('gives the logo and the toolbar badge Graphite', () => {
    const logo = read('public/anubis.svg');
    expect(logo).toContain(`fill="${dark['--text']}"`);
    expect(logo).toContain(`fill="${dark['--bg']}"`);
    for (const copy of ['anubis.svg', 'docs/public/anubis.svg']) expect(read(copy)).toBe(logo);
    expect(read('entrypoints/background.ts')).toContain(`color: '${light['--muted']}'`);
  });
});

describe('red is only for errors and deleting', () => {
  // A ranking is a choice, not an error: a chosen Hide, a hidden note, or a rule that
  // hides is grey. Red (`--danger`) stays for errors and actions that delete something.
  const sheets = [
    'assets/theme.css',
    'entrypoints/content/shadow.css',
    'entrypoints/popup/style.css',
    'entrypoints/options/style.css',
    'entrypoints/welcome/style.css',
    'docs/.vitepress/theme/brand.css',
  ];
  it.each(sheets)('%s draws no Hide in red', (path) => {
    const css = read(path).replace(/\/\*[\s\S]*?\*\//g, '');
    const red = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selector, body]) => /\bhide\b/.test(selector!) && /--(demo-)?danger\b/.test(body!))
      .map(([, selector]) => selector!.trim());
    expect(red).toEqual([]);
  });
});
