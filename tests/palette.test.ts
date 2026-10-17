import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The popup and settings (assets/theme.css) are drawn in the brand palette. Search pages
// (entrypoints/content/shadow.css) are drawn in Graphite, neutral greys with no gold, so
// nothing Anubis adds there outshines the results.

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
const shadowLight = tokens(shadow, ':host {');
const shadowDark = tokens(shadow, ":host([data-theme='dark'])");

describe('palette', () => {
  it('draws nothing in gold on search pages', () => {
    const css = shadow.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/--gold|#d4a637|#e0b54e|#8d6716/i);
  });

  it('gives search pages every colour in light and dark', () => {
    const colours = Object.keys(shadowLight).filter((k) => !['--tab', '--on-tab'].includes(k));
    expect(colours.length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(shadowDark).sort()).toEqual(colours.sort());
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
