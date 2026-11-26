import { statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const builtSite = fileURLToPath(new URL('../site/dist/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

export function builtResource(pathname) {
  let path = resolve(builtSite, '.' + decodeURIComponent(pathname));
  // Resolve only paths in the built preview tree.
  const base = resolve(builtSite);
  if (path !== base && !path.startsWith(base + sep)) return;
  const stats = statSync(path, { throwIfNoEntry: false });
  if (stats?.isDirectory()) path = resolve(path, 'index.html');
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) return;
  return { path, contentType: types[extname(path)] ?? 'application/octet-stream' };
}
