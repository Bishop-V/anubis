type Messages = Record<string, { message: string; description?: string }>;
export function english(): Messages;
export function languages(): string[];
export function sourceKey(key: string, en: Messages): string | undefined;
export function translation(lang: string): { messages: Messages; sources: Record<string, string> };
export function check(lang: string, en?: Messages): { fresh: string[]; stale: string[]; unrecorded: string[]; unknown: string[] };
export function freshMessages(lang: string, en?: Messages): Record<string, { message: string }>;
export function record(lang: string, keys?: string[]): void;
