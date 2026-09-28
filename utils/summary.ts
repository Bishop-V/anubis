import type { PageStats } from './messages';

function andList(parts: string[]): string {
  return parts.length < 2 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** "Anubis pinned 1, raised 2 and hid 2 of 9 results." Shared by the page and the popup. */
export function summarySentence(stats: PageStats): string {
  if (stats.filter) {
    const tag = stats.tags.find((t) => t.id === stats.filter);
    const n = tag?.count ?? 0;
    return `Showing only “${tag?.label ?? stats.filter}”: ${n} of ${stats.total} result${stats.total === 1 ? '' : 's'}.`;
  }
  const parts: string[] = [];
  if (stats.pinned) parts.push(`pinned ${stats.pinned}`);
  if (stats.raised) parts.push(`raised ${stats.raised}`);
  if (stats.lowered) parts.push(`lowered ${stats.lowered}`);
  if (stats.hidden) parts.push(`hid ${stats.hidden}`);
  const of = `${stats.total} result${stats.total === 1 ? '' : 's'}${stats.pages > 1 ? ` from ${stats.pages} pages` : ''}`;
  return parts.length ? `Anubis ${andList(parts)} of ${of}.` : `Anubis weighed ${of}.`;
}
