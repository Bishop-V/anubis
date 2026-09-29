// A tiny element builder for the plain-DOM UIs. Strings become text nodes, so text
// from subscribed lists (tag names, list titles) can never inject markup.

type Child = Node | string | number | null | undefined | false;

interface Props {
  class?: string;
  style?: string;
  title?: string;
  attrs?: Record<string, string | number | boolean | undefined>;
  on?: Partial<{ [K in keyof HTMLElementEventMap]: (e: HTMLElementEventMap[K]) => void }>;
  [prop: string]: unknown;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null = null,
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null) continue;
      if (key === 'class') el.className = value as string;
      else if (key === 'style') el.setAttribute('style', value as string);
      else if (key === 'attrs') {
        for (const [name, v] of Object.entries(value as Record<string, unknown>)) {
          if (v === false || v === undefined) continue;
          el.setAttribute(name, v === true ? '' : String(v));
        }
      } else if (key === 'on') {
        for (const [type, handler] of Object.entries(value as Record<string, EventListener>)) {
          el.addEventListener(type, handler);
        }
      } else (el as unknown as Record<string, unknown>)[key] = value;
    }
  }
  append(el, children);
  return el;
}

export function append(parent: Node, children: (Child | Child[])[]): void {
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

const parsed = new Map<string, Element>();

/**
 * Turn one of the constant SVG strings in utils/icons.ts into an element. Parsed as
 * XML rather than through innerHTML, and cached, so each icon is parsed once.
 */
export function icon(svg: string): Element {
  let el = parsed.get(svg);
  if (!el) {
    el = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
    parsed.set(svg, el);
  }
  return document.importNode(el, true);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "a", "a and b", "a, b and c". */
export function andList(items: string[]): string {
  return items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function timeAgo(ms: number): string {
  if (!ms) return 'never';
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const hr = Math.round(m / 60);
  if (hr < 48) return `${hr} h ago`;
  return `${Math.round(hr / 24)} days ago`;
}
