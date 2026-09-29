import { describeRemoved } from './cleanup';
import { t, tJoin, tn, type MessageKey } from './i18n';
import type { PageStats } from './messages';
import type { PersonalLevel, SiteChange } from './personal';

/**
 * "Anubis pinned 1, raised 2, and hid 2 of 9 results. It also removed an AI
 * answer." Shared by the page and the popup.
 */
export function summarySentence(stats: PageStats): string {
  const { total, pages } = stats;
  if (stats.filter) {
    const tag = stats.tags.find((t) => t.id === stats.filter);
    return tn('summaryFiltered', total, tag?.label ?? stats.filter, tag?.count ?? 0);
  }
  const parts: string[] = [];
  if (stats.pinned) parts.push(t('summaryPinned', stats.pinned));
  if (stats.raised) parts.push(t('summaryRaised', stats.raised));
  if (stats.lowered) parts.push(t('summaryLowered', stats.lowered));
  if (stats.hidden) parts.push(t('summaryHid', stats.hidden));
  const removed = describeRemoved(stats.removed ?? {});
  if (parts.length) {
    const of = pages > 1 ? tn('summaryResultsPages', total, pages) : tn('summaryResults', total);
    const acted = t('summaryActed', tJoin(parts), of);
    return removed ? `${acted} ${t('summaryAlsoRemoved', removed)}` : acted;
  }
  if (removed) return t('summaryRemovedOnly', removed);
  return pages > 1 && total > 1 ? t('summaryUnchangedPages', total, pages) : tn('summaryUnchanged', total);
}

/**
 * The summary in a few words, for phones, where the full sentence runs to several
 * lines: "Anubis changed 4 of 9 results and cleaned up the page." Details shows the
 * full sentence. Undefined when the full sentence is no longer ("Anubis hid 1 of 9
 * results.", only one tag's results shown, or nothing changed): it's said in full.
 */
export function shortSummary(stats: PageStats): string | undefined {
  if (stats.filter) return undefined;
  const { total, pages } = stats;
  const changed = stats.pinned + stats.raised + stats.lowered + stats.hidden;
  const removed = !!describeRemoved(stats.removed ?? {});
  if (!changed && !removed) return undefined;
  const of = pages > 1 ? tn('summaryResultsPages', total, pages) : tn('summaryResults', total);
  const short = !changed ? t('summaryShortRemoved') : t(removed ? 'summaryShortActedRemoved' : 'summaryShortActed', changed, of);
  return short.length < summarySentence(stats).length ? short : undefined;
}

/**
 * What a change from the result menu did, for the summary's undo line: "Hid
 * fandom.com.", "Tagged fandom.com “AI slop”." `label` names a tag by its id.
 */
export function changeSentence(change: SiteChange, label: (id: string) => string): string {
  const { site, before, after } = change;
  const added = after.tags.filter((id) => !before.tags.includes(id));
  const dropped = before.tags.filter((id) => !after.tags.includes(id));
  const retagged = added.length + dropped.length;
  if (before.level !== after.level && !retagged) return t(LEVEL_CHANGED[after.level], site);
  if (before.level === after.level && retagged === 1) {
    return added.length ? t('summaryChangedTagOn', site, label(added[0]!)) : t('summaryChangedTagOff', site, label(dropped[0]!));
  }
  return t('summaryChangedSite', site);
}

const LEVEL_CHANGED = {
  hide: 'summaryChangedHide',
  lower: 'summaryChangedLower',
  normal: 'summaryChangedNormal',
  allow: 'summaryChangedAllow',
  raise: 'summaryChangedRaise',
  pin: 'summaryChangedPin',
} as const satisfies Record<PersonalLevel, MessageKey>;
