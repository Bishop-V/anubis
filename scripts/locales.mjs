#!/usr/bin/env node
// Translations, and which of them are still in step with English.
//
// English is public/_locales/en/messages.json. Each other language is
// locales/<lang>/messages.json, in the same format, beside locales/<lang>/sources.json:
// the English text each message was translated from. The build ships a language's
// messages only while their English is unchanged (wxt.config.ts calls freshMessages);
// a message whose English has changed since is stale, and shows in English until it's
// translated again, so nobody reads an old meaning.
//
//   node scripts/locales.mjs status          what each language has, and what's stale
//   node scripts/locales.mjs record <lang>   mark <lang>'s messages as translated from today's English
//   node scripts/locales.mjs record <lang> <key>…   only those messages

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ENGLISH = join(ROOT, 'public/_locales/en/messages.json');
const LOCALES = join(ROOT, 'locales');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** English's messages, by key. */
export function english() {
  return readJson(ENGLISH);
}

/** The languages with a translation, by folder name (de, pt_BR). */
export function languages() {
  if (!existsSync(LOCALES)) return [];
  return readdirSync(LOCALES, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(LOCALES, e.name, 'messages.json')))
    .map((e) => e.name)
    .sort();
}

/** The English message a key is translated from: plural forms English lacks (_few, _many…) come from its _other. */
export function sourceKey(key, en) {
  if (en[key]) return key;
  const other = key.replace(/_(zero|two|few|many)$/, '_other');
  return other !== key && en[other] ? other : undefined;
}

/** A language's messages and the English they came from. */
export function translation(lang) {
  const dir = join(LOCALES, lang);
  const sources = existsSync(join(dir, 'sources.json')) ? readJson(join(dir, 'sources.json')) : {};
  return { messages: readJson(join(dir, 'messages.json')), sources };
}

/** Each message of the language, and whether it's fresh, stale (English changed), unrecorded, or not an English key. */
export function check(lang, en = english()) {
  const { messages, sources } = translation(lang);
  const out = { fresh: [], stale: [], unrecorded: [], unknown: [] };
  for (const key of Object.keys(messages)) {
    const from = sourceKey(key, en);
    if (!from) out.unknown.push(key);
    else if (!(key in sources)) out.unrecorded.push(key);
    else if (sources[key] !== en[from].message) out.stale.push(key);
    else out.fresh.push(key);
  }
  return out;
}

/** The messages.json the build ships for a language: only messages whose English hasn't changed since they were translated. */
export function freshMessages(lang, en = english()) {
  const { messages } = translation(lang);
  const fresh = new Set(check(lang, en).fresh);
  return Object.fromEntries(Object.entries(messages).filter(([key]) => fresh.has(key)).map(([key, { message }]) => [key, { message }]));
}

/** Mark messages (all, or `keys`) as translated from today's English. */
export function record(lang, keys) {
  const en = english();
  const { messages, sources } = translation(lang);
  for (const key of keys?.length ? keys : Object.keys(messages)) {
    const from = sourceKey(key, en);
    if (!messages[key]) throw new Error(`${lang} has no message ${key}`);
    if (!from) throw new Error(`${key} isn't an English key`);
    sources[key] = en[from].message;
  }
  const sorted = Object.fromEntries(Object.keys(messages).filter((k) => k in sources).map((k) => [k, sources[k]]));
  writeFileSync(join(LOCALES, lang, 'sources.json'), `${JSON.stringify(sorted, null, 2)}\n`);
}

function status() {
  const en = english();
  const total = Object.keys(en).length;
  for (const lang of languages()) {
    const c = check(lang, en);
    const missing = Object.keys(en).filter((k) => !translation(lang).messages[k]).length;
    console.log(`${lang}: ${c.fresh.length} of ${total} shipped, ${c.stale.length} stale, ${missing} missing${c.unrecorded.length ? `, ${c.unrecorded.length} unrecorded` : ''}${c.unknown.length ? `, ${c.unknown.length} not in English` : ''}`);
    for (const key of c.stale) console.log(`  stale: ${key}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, lang, ...keys] = process.argv.slice(2);
  if (command === 'status') status();
  else if (command === 'record' && lang) record(lang, keys);
  else {
    console.error('Usage: node scripts/locales.mjs status | record <lang> [key…]');
    process.exit(1);
  }
}
