import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Firefox sizes a toolbar popup from its content while the popup's window is still
// tiny, so a width that depends on the window shrinks the popup to a sliver (0.2.1).

const css = readFileSync(new URL('../entrypoints/popup/style.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('toolbar popup size', () => {
  it('has a fixed width', () => {
    const body = css.slice(css.indexOf('body {'), css.indexOf('}', css.indexOf('body {')));
    expect(body).toMatch(/\bwidth:\s*\d+px;/);
  });

  it('never sizes by the window', () => {
    expect(css).not.toMatch(/\d(vw|vh|vmin|vmax|dvw|svw|lvw)\b/);
    expect(css).not.toMatch(/@media[^{]*width/);
  });
});
