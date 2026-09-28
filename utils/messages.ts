import { browser } from '#imports';

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
  /** Result pages on this page (1 unless "Weigh deeper" brought more in). */
  pages: number;
  /** "Weigh deeper" can load another page. */
  canGoDeeper: boolean;
  /** A deeper load is running. */
  loading: boolean;
}

export type Message =
  | { type: 'stats'; stats: PageStats }
  | { type: 'refresh-stale' }
  | { type: 'refresh-all' }
  | { type: 'open-options'; tab?: string }
  | { type: 'get-page-stats' }
  | { type: 'set-reveal'; on: boolean }
  | { type: 'go-deeper' };

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
