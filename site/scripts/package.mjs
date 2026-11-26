import { readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '../dist');
const pages = join(dist, 'anubis');

// SSX 2.3.2 emits its runtime at the output root. The wiki is hosted at
// /anubis/, so keep every public asset alongside the generated route tree.
for (const entry of await readdir(dist)) {
  if (entry === 'anubis' || entry.startsWith('.')) continue;
  await rename(join(dist, entry), join(pages, entry));
}

for (const file of await readdir(pages, { recursive: true })) {
  if (!file.endsWith('index.html')) continue;
  const path = join(pages, file);
  const html = await readFile(path, 'utf8');
  await writeFile(path, html.replace('src="/main.js"', 'src="/anubis/main.js"'));
}
await writeFile(join(dist, 'index.html'), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/anubis/"><a href="/anubis/">Anubis</a>');
