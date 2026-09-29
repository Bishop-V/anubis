import { describeRemoved } from './cleanup';
import { andList } from './dom';
import type { PageStats } from './messages';

/**
 * "Anubis pinned 1, raised 2 and hid 2 of 9 results, and removed an AI answer."
 * Shared by the page and the popup.
 */
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
  const removed = describeRemoved(stats.removed ?? {});
  if (parts.length) return `Anubis ${andList(parts)} of ${of}${removed ? `, and removed ${removed}` : ''}.`;
  if (removed) return `Anubis removed ${removed}.`;
  return stats.total === 1 ? 'Anubis left this result as it was.' : `Anubis left all ${of} as they were.`;
}
