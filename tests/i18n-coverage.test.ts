import { parse } from '@babel/parser';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Everything the interface says comes from public/_locales/<language>/messages.json,
// so a translation covers all of it. This looks through the code and the static
// pages for text written straight in, which a translation would miss.
//
// Text that stays English on purpose (an issue for a list's maintainers, the start
// of a list file) sits under a comment saying "English on purpose"; words matched on
// search pages, in the engines' languages, under one saying "Not translated".

type Messages = Record<string, { message: string; description?: string }>;
const en: Messages = JSON.parse(readFileSync('public/_locales/en/messages.json', 'utf8'));

function files(dir: string, ext: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(`${dir}/${e.name}`, ext) : e.name.endsWith(ext) ? [`${dir}/${e.name}`] : [],
  );
}
const CODE = [...files('entrypoints', '.ts'), ...files('utils', '.ts')];
const PAGES = files('entrypoints', '.html');

/** Names that are the same in every language: products, engines, and the extension. */
const NAMES = new Set(['Anubis', 'Google', 'Bing', 'Yahoo', 'Yandex', 'Ecosia', 'Kagi', 'Mojeek', 'Startpage', 'Firefox', 'Chrome', 'Edge', 'Opera', 'Safari', 'Android', 'Windows', 'Linux']);

/** Properties whose values are never words for people: classes, styles, types, addresses… */
const NOT_TEXT_PROPS = new Set(['class', 'className', 'style', 'type', 'rel', 'target', 'href', 'src', 'id', 'name', 'value', 'role', 'autocomplete', 'inputmode', 'accept', 'for', 'kind', 'reason', 'action', 'display', 'format', 'source', 'Authorization']);
/** Engine definitions' selectors, and the headings clean-up matches on search pages. */
const PAGE_PROPS = new Set(['item', 'link', 'heading', 'boundary', 'next', 'form', 'button', 'headings', 'prefixes', 'markers']);

/** Calls whose string arguments are names in code, not text: events, selectors, attributes, storage. */
const NOT_TEXT_CALLS = /(^|\.)(t|tn|tList|tParts|addEventListener|removeEventListener|querySelector|querySelectorAll|closest|matches|getAttribute|setAttribute|removeAttribute|hasAttribute|toggleAttribute|getPropertyValue|setProperty|removeProperty|get|has|set|delete|add|remove|toggle|contains|defineItem|getItem|createElement|createElementNS|startsWith|endsWith|includes|indexOf|split|replace|test|exec|match|warn|error|log|info|debug)$/;

type Node = { type: string; [key: string]: unknown };
const isNode = (v: unknown): v is Node => !!v && typeof (v as Node).type === 'string';
const callee = (n: Node): string =>
  n.type === 'Identifier' ? (n.name as string) : n.type === 'MemberExpression' ? `${callee(n.object as Node)}.${(n.property as Node).name ?? '?'}` : '?';

/** Whether a string reads as words for people rather than a name in code. */
function looksLikeText(text: string): boolean {
  const plain = text.replace(/\u0000/g, ' ').trim();
  if (!/[A-Za-z]{2}/.test(plain) || NAMES.has(plain)) return false;
  // Selectors, styles, markup, addresses, file names, keys like "local:x" or "sync:y".
  if (/[{};<>=]|^[.#[:@/(]|\w\(|^https?:|--|^[\w-]+:[\w-]|^[\w-]+(\.[\w-]+)+$|^[\w.-]+\/[\w./-]*$/.test(plain)) return false;
  // A capitalised word ("Gold", "Remove"), or two words or more.
  return /^[A-Z][a-z’']+[.!?…]?$/.test(plain) || /[A-Za-z’'][.,:!?…]?\s+[A-Za-z“‘(]/.test(plain);
}

interface Found {
  file: string;
  line: number;
  text: string;
}

function hardCoded(file: string): Found[] {
  const source = readFileSync(file, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });
  const found: Found[] = [];
  const onPurpose = (n: Node) => ((n.leadingComments as { value: string }[] | undefined) ?? []).some((c) => /English on purpose|Not translated/i.test(c.value));
  const visit = (n: Node, parents: Node[]) => {
    if (n.type === 'ImportDeclaration' || n.type === 'ExportAllDeclaration' || (n.type.startsWith('TS') && !['TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(n.type))) return;
    if (onPurpose(n)) return;
    let text: string | undefined;
    if (n.type === 'StringLiteral') text = n.value as string;
    else if (n.type === 'TemplateLiteral') text = (n.quasis as { value: { cooked: string } }[]).map((q) => q.value.cooked).join('\u0000');
    if (text !== undefined && looksLikeText(text) && !inCodeContext(n, parents)) {
      found.push({ file, line: (n.loc as { start: { line: number } }).start.line, text: text.replace(/\u0000/g, '${…}') });
    }
    for (const [key, value] of Object.entries(n)) {
      if (key === 'loc' || key.endsWith('Comments')) continue;
      for (const child of Array.isArray(value) ? value : [value]) if (isNode(child)) visit(child, [...parents, n]);
    }
  };
  visit(ast.program as unknown as Node, []);
  return found;
}

/** Where a string is a name in code: a property's key, a comparison, a call that takes names. */
function inCodeContext(n: Node, parents: Node[]): boolean {
  let child = n;
  for (let i = parents.length - 1; i >= 0; i--) {
    const p = parents[i]!;
    if (p.type === 'ObjectProperty') {
      if (p.key === child) return true;
      const key = String((p.key as Node).name ?? (p.key as Node).value);
      return NOT_TEXT_PROPS.has(key) || PAGE_PROPS.has(key);
    }
    // A method called on the string itself: 'a b c'.split(' ').
    if (p.type === 'MemberExpression') return p.object === child;
    if (p.type === 'BinaryExpression' || p.type === 'SwitchCase') return true;
    if (p.type === 'CallExpression' || p.type === 'NewExpression') return NOT_TEXT_CALLS.test(callee(p.callee as Node)) || callee(p.callee as Node) === 'RegExp';
    if (p.type === 'ConditionalExpression' || p.type === 'LogicalExpression' || p.type === 'ArrayExpression' || p.type === 'TSAsExpression') {
      child = p;
      continue;
    }
    return false;
  }
  return false;
}

describe('interface text', () => {
  it('comes from messages in the code', () => {
    expect(CODE.flatMap(hardCoded).map((f) => `${f.file}:${f.line} ${f.text}`)).toEqual([]);
  });

  it('notices text written straight into the code', () => {
    const sample = 'tests/fixtures/hard-coded.ts';
    expect(hardCoded(sample).map((f) => f.text)).toEqual(['Save your list', 'Done', 'Sites you ranked: ${…}']);
  });

  it('comes from messages on the static pages', () => {
    const missing: string[] = [];
    for (const file of PAGES) {
      const html = readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '');
      // An element's own text needs data-i18n; Anubis's name needs nothing.
      for (const m of html.matchAll(/<([a-z][\w-]*)([^>]*)>([^<]*)</g)) {
        const [, , attrs, text] = m;
        if (looksLikeText(text!.trim()) && !/data-i18n="/.test(attrs!)) missing.push(`${file}: ${text!.trim()}`);
      }
      for (const m of html.matchAll(/<[a-z][\w-]*([^>]*)>/g)) {
        for (const a of m[1]!.matchAll(/\s(title|aria-label|placeholder|alt)="([^"]*)"/g)) {
          if (looksLikeText(a[2]!) && !new RegExp(`data-i18n-${a[1]}="`).test(m[1]!)) missing.push(`${file}: ${a[1]}="${a[2]}"`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('messages for translators', () => {
  it('describe where each message shows, so it can be translated without guessing', () => {
    // Plural forms after the first share its description.
    const bare = Object.entries(en).filter(([key, m]) => !m.description && !/_(other|zero|two|few|many)$/.test(key));
    expect(bare.map(([key]) => key)).toEqual([]);
  });

  it('are all in use', () => {
    const sources = [...CODE, ...PAGES, 'wxt.config.ts'].map((f) => readFileSync(f, 'utf8')).join('\n');
    const unused = Object.keys(en)
      .map((key) => key.replace(/_(one|other|zero|two|few|many)$/, ''))
      .filter((key, i, all) => all.indexOf(key) === i && key !== 'langCode')
      .filter((key) => !sources.includes(`'${key}'`) && !sources.includes(`"${key}"`) && !sources.includes(`__MSG_${key}__`));
    expect(unused).toEqual([]);
  });

  it('only use $ for placeholders', () => {
    // The browsers read "$name" as a named placeholder; a literal dollar sign is "$$".
    const bad = Object.entries(en).filter(([, m]) => /\$(?![\d$])/.test(m.message.replace(/\$\$/g, '')));
    expect(bad.map(([key]) => key)).toEqual([]);
  });
});

describe('browser dialogs', () => {
  it('are never used: a browser can be told to stop showing them, and confirm() then always answers no', () => {
    const code = (file: string) => readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    const calls = CODE.flatMap((file) => [...code(file).matchAll(/(?<![\w.])(?:window\.)?(confirm|alert|prompt)\(/g)].map((m) => `${file}: ${m[1]}()`));
    expect(calls).toEqual([]);
  });
});
