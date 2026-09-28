// Where Anubis sends people for help and source. No browser APIs here:
// wxt.config.ts imports this for the manifest's homepage.

export const REPO_URL = 'https://github.com/Bishop-V/anubis';
export const DOCS_URL = 'https://bishop-v.github.io/anubis/';

/** A page of the user guide, e.g. `guide('guide/lists')`. */
export const guide = (path = ''): string => `${DOCS_URL}${path}`;
