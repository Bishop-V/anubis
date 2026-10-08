// A tiny element builder for the plain-DOM UIs. Strings become text nodes, so text
// from subscribed lists (tag names, list titles) can never inject markup.

import { splitSuffix } from './domain';

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
/** A site's name as text, with the ending it shares with other sites (".org") in a muted span. */
export function siteName(domain: string): (string | HTMLSpanElement)[] {
  const [name, suffix] = splitSuffix(domain);
  return suffix ? [name, h('span', { class: 'suffix' }, suffix)] : [name];
}

export function icon(svg: string): Element {
  let el = parsed.get(svg);
  if (!el) {
    el = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
    parsed.set(svg, el);
  }
  return document.importNode(el, true);
}

/** "a", "a and b", "a, b, and c". */
export function andList(items: string[]): string {
  if (items.length < 3) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
