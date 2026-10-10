// Results brought over by Load more results for engines that set `restyle`: see EngineDef.

const GENERATED = /^css-/;

/**
 * Where each element sits in a result, by the engine's own class names and its
 * place among siblings that have none: `RESULT/DIV.upper/SPAN.#1`. Two results with
 * the same layout give the same keys, whatever their generated classes are.
 */
export function styleKeys(root: Element): Map<Element, string> {
  const keys = new Map<Element, string>();
  const walk = (el: Element, prefix: string) => {
    const unnamed = new Map<string, number>();
    for (const child of el.children) {
      const named = [...child.classList].filter((c) => !GENERATED.test(c)).join('.');
      let name = `${child.tagName}.${named}`;
      if (!named) {
        const index = unnamed.get(child.tagName) ?? 0;
        unnamed.set(child.tagName, index + 1);
        name += `#${index}`;
      }
      const key = `${prefix}/${name}`;
      keys.set(child, key);
      walk(child, key);
    }
  };
  keys.set(root, 'RESULT');
  walk(root, 'RESULT');
  return keys;
}

/** The generated classes of each kind of element, from results that were on the page to begin with. */
export function styleBook(containers: HTMLElement[]): Map<string, string[]> {
  const book = new Map<string, string[]>();
  for (const container of containers) {
    if (container.hasAttribute('data-anubis-page')) continue;
    for (const [el, key] of styleKeys(container)) {
      const generated = [...el.classList].filter((c) => GENERATED.test(c));
      if (generated.length && !book.has(key)) book.set(key, generated);
    }
  }
  return book;
}

/** Give a fetched result the generated classes of the same elements in the results already here. */
export function restyle(node: HTMLElement, book: Map<string, string[]> | undefined): void {
  if (!book?.size) return;
  for (const [el, key] of styleKeys(node)) {
    const own = book.get(key);
    if (!own) continue;
    for (const c of [...el.classList]) if (GENERATED.test(c)) el.classList.remove(c);
    el.classList.add(...own);
  }
}
