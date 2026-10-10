// For tests/i18n-coverage.test.ts: text written straight in, and names in code that aren't text.
declare const h: (...args: unknown[]) => unknown;
declare const t: (key: string, ...subs: unknown[]) => string;
declare const count: number;

export const button = h('button', { class: 'btn primary', type: 'button' }, 'Save your list');
export const done = h('span', null, 'Done');
export const summary = `Sites you ranked: ${count}`;
export const translated = h('p', null, t('sitesIntro'));
export const key = (e: { key: string }) => e.key === 'Escape';
export const selector = (el: Element) => el.closest('.result h3');
// English on purpose: sent to a list's maintainers.
export const report = 'Wrong rule for this site';
