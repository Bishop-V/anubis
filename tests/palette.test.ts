import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The popup and settings (assets/theme.css) and the result menu on search pages
// (entrypoints/content/shadow.css) share one palette, written out twice because a
// shadow root can't see the page's variables. This keeps the two copies in step.

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
// Light overrides dark in theme.css; gold itself is the same in both.
const light = { ...dark, ...tokens(theme, ":root[data-theme='light']") };
const shadowLight = tokens(shadow, ':host {');
const shadowDark = { ...shadowLight, ...tokens(shadow, ":host([data-theme='dark'])") };

// Tokens only one side needs: the page background and on-gold text belong to the
// extension's own pages; the menu's shadow floats over someone else's page.
const shared = (a: Record<string, string>, b: Record<string, string>) =>
  Object.keys(a).filter((k) => k in b && k !== '--shadow');

describe('palette', () => {
  it('matches between the extension pages and the result menu, in light', () => {
    const keys = shared(shadowLight, light);
    expect(keys.length).toBeGreaterThanOrEqual(8);
    for (const k of keys) expect([k, shadowLight[k]]).toEqual([k, light[k]]);
  });

  it('matches between the extension pages and the result menu, in dark', () => {
    for (const k of shared(shadowDark, dark)) expect([k, shadowDark[k]]).toEqual([k, dark[k]]);
  });

  it('gives the toolbar badge the brand gold on the brand background', () => {
    const background = read('entrypoints/background.ts');
    expect(background).toContain(`color: '${dark['--gold']}'`);
    expect(background).toContain(`color: '${dark['--bg']}'`);
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
