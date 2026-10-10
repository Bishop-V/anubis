import { browser } from '#imports';
import type { CleanupKind } from './cleanup';
import type { SubscribeLink } from './links';

// Messages between the content script, popup, options page, and background.

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
  /** Why the last "Load more results" stopped before bringing in a page. */
  stopped?: DeeperStop;
  /** Tags on the page's visible results, most common first. */
  tags: { id: string; label: string; color: string; count: number }[];
  /** Only results with this tag are shown. */
  filter?: string;
  /** Blocks removed by clean-up (AI answers, video panels…), by kind. */
  removed: Partial<Record<CleanupKind, number>>;
}

/**
 * Why "Load more results" didn't bring in a page: the engine sent a page without
 * results (often a robot check), only results already here, asked to slow down,
 * refused, took too long, or the request failed. `url` is the page it tried.
 */
export interface DeeperStop {
  reason: 'empty' | 'repeat' | 'busy' | 'refused' | 'slow' | 'failed';
  page: number;
  url?: string;
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
  /** From the subscribe page: open settings with this list filled in. `back`: the tab has a page to go back to. */
  | { type: 'open-subscribe'; link: SubscribeLink; back: boolean }
  | { type: 'get-page-stats' }
  | { type: 'set-reveal'; on: boolean }
  | { type: 'toggle-reveal' }
  | { type: 'go-deeper' }
  | { type: 'set-filter'; tag?: string }
  /** From settings: sync with the WebDAV server now. Replies with its `SyncStatus`. */
  | { type: 'sync-server' }
  /** From settings: re-encrypt the sync file under a new passphrase. Replies with its `SyncStatus`. */
  | { type: 'change-passphrase'; passphrase: string };

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
