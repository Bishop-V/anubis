import { browser } from '#imports';
import type { CleanupKind } from './cleanup';

// Messages between the content script, popup, options page and background.

export interface PageStats {
  engine: string;
  total: number;
  hidden: number;
  pinned: number;
  raised: number;
  lowered: number;
  tagged: number;
  revealed: boolean;
  /** Result pages on this page (1 unless "Load more results" brought more in). */
  pages: number;
  /** "Load more results" can load another page. */
  canGoDeeper: boolean;
  /** A deeper load is running. */
  loading: boolean;
  /** Tags on the page's visible results, most common first. */
  tags: { id: string; label: string; color: string; count: number }[];
  /** Only results with this tag are shown. */
  filter?: string;
  /** Blocks removed by clean-up (AI answers, video panels…), by kind. */
  removed: Partial<Record<CleanupKind, number>>;
}

/** Hidden results plus removed blocks: what "Show hidden" brings back. */
export function hiddenCount(stats: PageStats): number {
  return stats.hidden + Object.values(stats.removed ?? {}).reduce((a, b) => a + (b ?? 0), 0);
}

export type Message =
  | { type: 'stats'; stats: PageStats }
  | { type: 'refresh-stale' }
  | { type: 'refresh-all' }
  | { type: 'open-options'; tab?: string }
  | { type: 'get-page-stats' }
  | { type: 'set-reveal'; on: boolean }
  | { type: 'go-deeper' }
  | { type: 'set-filter'; tag?: string };

export function send<T = unknown>(message: Message): Promise<T | undefined> {
  return browser.runtime.sendMessage(message).catch(() => undefined) as Promise<T | undefined>;
}

export async function sendToActiveTab<T = unknown>(message: Message): Promise<T | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) return undefined;
  try {
    return (await browser.tabs.sendMessage(tab.id, message)) as T;
  } catch {
    // No content script on this tab (not a search page).
    return undefined;
  }
}
