import { browser, defineContentScript } from '#imports';
import { NO_CLEANUP } from '@/utils/cleanup';
import { engineFor, ENGINE_MATCHES, isMobileAgent, sameSearch, type EngineDef } from '@/utils/engines';
import { colorForTag, slugifyTag } from '@/utils/listformat';
import { evaluate, type Verdict } from '@/utils/matcher';
import { send, type Message, type PageStats } from '@/utils/messages';
import {
  changeHolds,
  formatSiteLine,
  getSite,
  recordChange,
  setSiteLevel,
  toggleSiteTag,
  undoChange,
  upsertTagDef,
  type PersonalLevel,
  type SiteChange,
} from '@/utils/personal';
import { loadRuleSet, watchRuleSet, type RuleSet } from '@/utils/ruleset';
import { clampDeeper, colorSchemeItem, editPersonal, type Theme } from '@/utils/storage';
import { reportUrl, suggestionUrl } from '@/utils/subscriptions';
import { changeSentence } from '@/utils/summary';
import { findClutter, mainColumn, redirectFor, watchAllTab, type Clutter } from './cleanup';
import { freshState, nextPageReady, weighDeeper } from './deeper';
import './page.css';
import { findResults, OWN_TAGS, type FoundResult } from './results';
import {
  applyPalette,
  applyTheme,
  closePopover,
  detachResult,
  ensureWeighButton,
  openPopover,
  popoverAnchor,
  removeAllUi,
  renderChips,
  renderHiddenBar,
  renderSummary,
  weighButtonOf,
  type PageTheme,
  type SummaryPlace,
} from './ui';

// Runs on search result pages. Each pass: find the results, weigh each one against
// the personal list and subscriptions, then tag, hide, highlight, and rerank them.
export default defineContentScript({
  matches: ENGINE_MATCHES,
  // Start early so results are weighed as they stream in, before they paint.
  runAt: 'document_start',

  async main(ctx) {
    // Phones get a different layout from some engines (Firefox for Android).
    const engine = engineFor(location.hostname, isMobileAgent(navigator.userAgent));
    if (!engine) return;
    // When the extension reloads or updates while this page is open, Firefox runs
    // the new copy in the same page, and the old copy's summary and tags stay behind.
    clearPreviousCopy();

    let rules: RuleSet;
    try {
      rules = await loadRuleSet();
    } catch (error) {
      // storage.sync can fail in some setups; don't let that kill the script.
      console.warn('[anubis] could not load lists', error);
      return;
    }

    // Clean-up that works by sending the page elsewhere: Google's Web tab. Checked
    // again on each pass, as Google can change the search without reloading.
    const redirected = () => {
      if (!rules.settings.enabled || rules.settings.engines[engine.id] === false) return false;
      const to = redirectFor(engine, new URL(location.href), rules.settings.googleWebTab);
      if (!to || to === location.href) return false;
      location.replace(to);
      return true;
    };
    if (redirected()) return;
    if (engine.id === 'google') watchAllTab();

    // Light or dark as the popup sees it, for the result menu on "auto".
    let scheme = await colorSchemeItem.getValue().catch(() => null);
    const menuTheme = (setting: Theme): PageTheme =>
      setting !== 'auto' ? setting : (scheme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

    let reveal = false;
    // Blocks removed by clean-up in the last pass.
    let removed = new Set<HTMLElement>();
    // Hidden results shown one at a time with their own Show button, by URL. Kept
    // across passes (engines rewrite the page on hover) until the next search.
    let shown = new Set<string>();
    let filter: string | undefined;
    let deeper = freshState(engine);
    let verdicts = new Map<string, Verdict>();
    let lastResults: FoundResult[] = [];
    let lastStats: PageStats | undefined;
    // The last change from the result menu, which the summary offers to undo until the next search.
    let change: SiteChange | undefined;

    const verdictFor = (r: FoundResult) => {
      const key = `${r.url}\n${r.title}`;
      let v = verdicts.get(key);
      if (!v) {
        v = evaluate({ url: r.url, title: r.title, description: r.description }, rules.lists, rules.prefs);
        verdicts.set(key, v);
      }
      return v;
    };

    const pass = () => {
      const active =
        rules.settings.enabled &&
        rules.settings.engines[engine.id] !== false &&
        engine.isResultsPage(new URL(location.href));
      if (!active) {
        if (lastResults.length || document.querySelector('[data-anubis-result]')) reset();
        return;
      }
      if (redirected()) return;

      const theme = pageTheme(rules.settings.theme);
      document.documentElement.dataset.anubisHide = rules.settings.hideStyle;
      applyTheme(theme);
      applyPalette(rules.settings.palette);

      // A new search (Google and DuckDuckGo change the URL without reloading). An
      // engine that only tidies its own address (Google adds tracking details after
      // loading) is still on the same search, with the pages loaded so far.
      if (deeper.url !== location.href && !deeper.busy && sameSearch(deeper.url, location.href)) deeper.url = location.href;
      if (deeper.url !== location.href && !deeper.busy) {
        deeper = freshState(engine);
        filter = undefined;
        reveal = false;
        shown = new Set();
        change = undefined;
      }

      const results = findResults(engine);
      // A page you loaded with the engine's own button counts once its results arrive,
      // so the summary's count and the next Load more results start from the pages here.
      if (deeper.manualFrom !== undefined && !deeper.busy && results.length > deeper.manualFrom) {
        deeper.pages++;
        deeper.manualFrom = undefined;
      }
      const stats: PageStats = {
        engine: engine.name,
        total: results.length,
        hidden: 0,
        pinned: 0,
        raised: 0,
        lowered: 0,
        tagged: 0,
        revealed: reveal,
        pages: deeper.pages,
        canGoDeeper: results.length > 0 && nextPageReady(engine, deeper),
        loading: deeper.busy,
        stopped: deeper.stopped,
        tags: [],
        removed: {},
      };
      const tagCounts = new Map<string, number>();

      // Take Anubis off anything that stopped being a result, e.g. after the engine's
      // own "hide this site" collapsed it or its scripts re-rendered it.
      const live = new Set(results.map((r) => r.container));
      for (const el of document.querySelectorAll<HTMLElement>('[data-anubis-result]')) {
        if (!live.has(el)) forget(el);
      }

      // Clean-up: AI answers, video panels, and the like. "Show hidden" brings them back too.
      const clutter = findClutter(engine, results, rules.settings.cleanup);
      const now = new Set(clutter.map((c) => c.block));
      for (const el of removed) if (!now.has(el)) unremove(el);
      removed = now;
      for (const { block, kind, uncounted } of clutter) {
        if (block.getAttribute('data-anubis-removed') !== kind) block.setAttribute('data-anubis-removed', kind);
        block.toggleAttribute('data-anubis-reveal', reveal);
        if (!uncounted) stats.removed[kind] = (stats.removed[kind] ?? 0) + 1;
      }
      // Results inside a removed panel (the videos in a video panel) went with it.
      const inRemoved = (r: FoundResult) => clutter.some((c) => c.block.contains(r.container));

      const scores = new Map<HTMLElement, number>();
      for (const result of results) {
        const verdict = verdictFor(result);
        applyVerdict(result, verdict, theme);
        scores.set(result.container, verdict.hidden ? 0 : verdict.score);
        if (inRemoved(result)) {
          stats.total--;
          continue;
        }
        if (verdict.hidden) stats.hidden++;
        else if (verdict.level === 'pin') stats.pinned++;
        else if (verdict.level === 'raise') stats.raised++;
        else if (verdict.level === 'lower') stats.lowered++;
        if (verdict.tags.length) stats.tagged++;
        if (!verdict.hidden) {
          for (const id of verdict.tags) if (!rules.prefs[id]?.muted) tagCounts.set(id, (tagCounts.get(id) ?? 0) + 1);
        }
      }
      renderHiddenRuns(results, theme);
      stats.tags = [...tagCounts]
        .map(([id, count]) => ({ id, count, label: rules.tags.get(id)?.label ?? id, color: rules.tags.get(id)?.color ?? colorForTag(id) }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
      // A filter whose tag left the page (a new search, a list turned off) lapses.
      if (filter && !tagCounts.has(filter)) filter = undefined;
      stats.filter = filter;
      for (const result of results) {
        const out = !!filter && !verdictFor(result).tags.includes(filter);
        result.container.toggleAttribute('data-anubis-filtered', out);
        for (const row of result.extras) row.toggleAttribute('data-anubis-filtered', out);
      }

      // Cards sit in a grid, which reranking's flex column would break.
      const cards = results.some((r) => r.card);
      rerank(results, scores, rules.settings.rerank && !engine.table && !cards);
      const pinned = results.filter((r) => verdictFor(r).level === 'pin' && !verdictFor(r).hidden).map((r) => r.container);
      makeRoomForPins(new Set(engine.table || cards ? [] : pinned));

      if (rules.settings.showSummary && !engine.table) {
        const ai = rules.settings.cleanup.ai ? clutter : findClutter(engine, results, { ...NO_CLEANUP, ai: true });
        const changed = change && changeSentence(change, (id) => rules.tags.get(id)?.label ?? id);
        renderSummary(summaryPlace(results, engine, ai), stats, theme, {
          toggleReveal: () => {
            reveal = !reveal;
            if (!reveal) shown.clear();
            pass();
          },
          settings: () => void send({ type: 'open-options' }),
          deeper: () => goDeeper(1),
          filter: (tag) => {
            filter = tag;
            pass();
          },
          undo: () => {
            const undone = change;
            if (!undone) return;
            change = undefined;
            pass();
            editPersonal((t) => undoChange(t, undone)).catch((error: unknown) => {
              change = undone;
              schedule();
              console.warn('[anubis] could not save your list', error);
            });
          },
        }, changed);
      } else renderSummary(undefined, stats, theme, { toggleReveal() {}, settings() {}, deeper() {}, filter() {}, undo() {} });

      // "Load more results automatically": once per search.
      if (clampDeeper(rules.settings.deeper) > 0 && stats.canGoDeeper && deeper.pages === 1 && !deeper.auto) {
        deeper.auto = true;
        goDeeper(clampDeeper(rules.settings.deeper));
      }

      lastResults = results;
      if (JSON.stringify(stats) !== JSON.stringify(lastStats)) {
        lastStats = stats;
        void send({ type: 'stats', stats });
      }
    };

    const applyVerdict = (result: FoundResult, verdict: Verdict, theme: PageTheme) => {
      const { container } = result;
      const revealed = verdict.hidden && (reveal || shown.has(result.url));
      container.setAttribute('data-anubis-result', '');
      const state: string[] = [verdict.level];
      if (verdict.tags.length) state.push('tagged');
      container.setAttribute('data-anubis-state', state.join(' '));
      container.toggleAttribute('data-anubis-reveal', revealed);
      // Table rows and cards are removed when hidden, whatever the style.
      if (engine.table || result.card) container.setAttribute('data-anubis-row', '');
      for (const row of result.extras) {
        row.setAttribute('data-anubis-row', '');
        row.setAttribute('data-anubis-state', verdict.level);
        row.toggleAttribute('data-anubis-reveal', revealed);
      }

      const highlight = verdict.highlight && rules.tags.get(verdict.highlight)?.color;
      if (highlight && !verdict.hidden) {
        container.setAttribute('data-anubis-highlight', verdict.highlight!);
        container.style.setProperty('--anubis-hl', highlight);
      } else if (container.hasAttribute('data-anubis-highlight')) {
        container.removeAttribute('data-anubis-highlight');
        container.style.removeProperty('--anubis-hl');
      }

      const ctx = { tags: rules.tags, prefs: rules.prefs, theme, belowRow: engine.chipsBelowRow };
      if (rules.settings.showChips) renderChips(result, verdict, ctx, revealed);
      else renderChips(result, { ...verdict, level: 'normal', tags: [] }, ctx, false);

      ensureWeighButton(result, verdict.level, engine, theme, openWeigh);
    };

    /**
     * "Collapse" style: one line per run of hidden results in a row, not one per
     * result, so a page full of one site doesn't fill up with lines. The rest of
     * the run is marked data-anubis-grouped and hidden by page.css.
     */
    const renderHiddenRuns = (results: FoundResult[], theme: PageTheme) => {
      const collapsed = (r: FoundResult) => {
        const v = verdictFor(r);
        return v.hidden && !(reveal || shown.has(r.url)) && rules.settings.hideStyle === 'collapse' && !engine.table && !r.card;
      };
      const runs: FoundResult[][] = [];
      let last: FoundResult | undefined;
      for (const result of results) {
        if (!collapsed(result)) {
          last = undefined;
          continue;
        }
        const run = last && nextResultAfter(last.container) === result.container ? runs[runs.length - 1] : undefined;
        if (run) run.push(result);
        else runs.push([result]);
        last = result;
      }
      const lead = new Map<HTMLElement, FoundResult[]>(runs.map((run) => [run[0]!.container, run]));
      const grouped = new Set(runs.flatMap((run) => run.slice(1).map((r) => r.container)));
      for (const result of results) {
        const run = lead.get(result.container);
        result.container.toggleAttribute('data-anubis-grouped', grouped.has(result.container));
        renderHiddenBar(result, verdictFor(result), theme, rules.tags, !!run, {
          reveal: () => {
            for (const r of run ?? [result]) shown.add(r.url);
            pass();
          },
        }, run?.slice(1).map(verdictFor));
      }
    };

    const goDeeper = (count: number) => {
      void weighDeeper(engine, deeper, count, schedule);
    };

    // ------------------------------------------------------------ weigh menu

    // Edits a site from the menu and remembers the change, so the summary can offer
    // to undo it. Recorded inside the edit, as edits run one after another.
    const editSite = (site: string, edit: (text: string) => string) => {
      const prev = change;
      editPersonal((text) => {
        const next = edit(text);
        change = recordChange(change, site, text, next);
        return next;
      }).catch((error: unknown) => {
        change = prev;
        console.warn('[anubis] could not save your list', error);
      });
    };

    const openWeigh = (anchor: HTMLElement, result: FoundResult) => {
      if (popoverAnchor() === anchor && !anchor.isConnected) return closePopover();
      const verdict = verdictFor(result);
      const baseline = evaluate({ url: result.url, title: result.title, description: result.description }, rules.lists.filter((l) => !l.personal), rules.prefs);
      // Suggestions go only to lists that ask for them with `! issues:`; reports go to
      // any list with a tracker, which most have as Git repositories.
      const trackers = rules.lists
        .filter((l) => !l.personal && rules.meta[l.id]?.issues)
        .map((l) => ({ id: l.id, name: l.name, issues: rules.meta[l.id]!.issues!, tags: l.tags.map((t) => t.id) }));
      const reports = rules.lists.flatMap((l) => {
        const reasons = verdict.reasons.filter((r) => r.listId === l.id);
        const href = !l.personal && reasons.length ? reportUrl(rules.trackers[l.id], l.name, result.url, reasons) : undefined;
        return href ? [{ id: l.id, name: l.name, href }] : [];
      });
      openPopover(
        anchor,
        {
          result,
          verdict,
          baseline,
          personalText: rules.personalText,
          tags: rules.tags,
          trackers,
          reports,
          theme: menuTheme(rules.settings.theme),
        },
        {
          setLevel: (domain, level: PersonalLevel) => editSite(domain, (t) => setSiteLevel(t, domain, level)),
          toggleTag: (domain, tag) => editSite(domain, (t) => toggleSiteTag(t, domain, tag)),
          createTag: (domain, label) => {
            const id = slugifyTag(label);
            if (!id) return;
            editSite(domain, (t) => {
              const withTag = rules.tags.has(id) ? t : upsertTagDef(t, { id, label, color: colorForTag(id) });
              return toggleSiteTag(withTag, domain, id, true);
            });
          },
          suggest: (tracker, domain) => {
            const entry = getSite(rules.personalText, domain);
            const line = formatSiteLine(domain, entry?.level ?? 'normal', entry?.tags ?? []) ?? `$site=${domain}`;
            return suggestionUrl(tracker.issues, tracker.name, domain, line, result.url);
          },
          settings: () => void send({ type: 'open-options' }),
        },
      );
    };

    // Re-open the menu after a change so it shows the new state.
    const refreshOpenPopover = () => {
      const anchor = popoverAnchor();
      if (!anchor) return;
      const result = lastResults.find((r) => weighButtonOf(r.container) === anchor || r.container.contains(anchor));
      if (result && anchor.isConnected) openWeigh(anchor, result);
      else closePopover();
    };

    // ------------------------------------------------------------ reranking

    const forget = (el: HTMLElement) => {
      detachResult(el);
      for (const attr of ['data-anubis-result', 'data-anubis-state', 'data-anubis-reveal', 'data-anubis-highlight', 'data-anubis-row', 'data-anubis-filtered', 'data-anubis-grouped']) {
        el.removeAttribute(attr);
      }
      el.style.removeProperty('--anubis-hl');
      el.style.removeProperty('order');
    };

    const unremove = (el: HTMLElement) => {
      el.removeAttribute('data-anubis-removed');
      el.removeAttribute('data-anubis-reveal');
    };

    const reset = () => {
      closePopover();
      removeAllUi();
      removed.forEach(unremove);
      removed = new Set();
      document.querySelectorAll<HTMLElement>('[data-anubis-result], [data-anubis-row]').forEach(forget);
      rerank([], new Map(), false);
      makeRoomForPins(new Set());
      lastResults = [];
      // Nothing hidden or removed any more, so the toolbar's count goes too.
      if (lastStats) void send({ type: 'stats', stats: { ...lastStats, total: 0, hidden: 0, removed: {} } });
      lastStats = undefined;
    };

    // Re-run when the page adds results (infinite scroll, "More results", SPA
    // navigation). Batched to one pass per frame, and the observer is detached
    // while we write so our own elements don't trigger another pass.
    let queuedFrame: number | undefined;
    const observer = new MutationObserver((mutations) => {
      if (queuedFrame !== undefined) return;
      const relevant = mutations.some((m) =>
        [...m.addedNodes, ...m.removedNodes].some((n) => !(n instanceof HTMLElement && OWN_TAGS.has(n.tagName))),
      );
      if (!relevant) return;
      schedule();
    });
    const observe = () => observer.observe(document.documentElement, { childList: true, subtree: true });
    // An old copy that keeps running (Chrome leaves it in open tabs) stops and
    // clears up, so it doesn't redraw its summary beside the new copy's.
    let stopped = false;
    ctx.onInvalidated(() => {
      stopped = true;
      observer.disconnect();
      if (queuedFrame !== undefined) cancelAnimationFrame(queuedFrame);
      queuedFrame = undefined;
      try {
        reset();
      } catch {
        // Telling the toolbar fails once the extension is gone; the page is clear by then.
      }
    });
    function schedule() {
      if (queuedFrame !== undefined || stopped) return;
      queuedFrame = requestAnimationFrame(() => {
        queuedFrame = undefined;
        observer.disconnect();
        try {
          pass();
        } finally {
          observe();
        }
      });
    }

    window.addEventListener('pagehide', () => {
      observer.disconnect();
      if (queuedFrame !== undefined) {
        cancelAnimationFrame(queuedFrame);
        queuedFrame = undefined;
      }
    });
    window.addEventListener('pageshow', (event) => {
      if (!event.persisted || stopped) return;
      observe();
      schedule();
    });

    pass();
    // One early pass may run before the results exist; the observer catches the rest.
    document.addEventListener('DOMContentLoaded', () => schedule(), { once: true });
    // Your own press of the engine's "More results" button (DuckDuckGo's), as opposed to
    // Load more results pressing it, which happens while `deeper.busy` is set.
    document.addEventListener(
      'click',
      (e) => {
        const more = engine.more;
        if (more?.kind !== 'click' || deeper.busy || !(e.target instanceof Element) || !e.target.closest(more.button)) return;
        deeper.manualFrom = lastResults.length;
      },
      true,
    );

    colorSchemeItem.watch((next) => {
      scheme = next;
      refreshOpenPopover();
    });

    watchRuleSet(() => {
      void loadRuleSet()
        .then((nextRules) => {
          rules = nextRules;
          verdicts = new Map();
          // Changed elsewhere since (settings, another tab): there's nothing to undo here.
          if (change && !changeHolds(change, rules.personalText)) change = undefined;
          schedule();
          // After the pass, so the menu sees fresh verdicts.
          requestAnimationFrame(refreshOpenPopover);
        })
        .catch((error: unknown) => console.warn('[anubis] could not reload lists', error));
    });

    // Keep lists fresh; the background decides whether anything is due.
    void send({ type: 'refresh-stale' });

    // Replies go through sendResponse: Chrome ignores a promise returned from the
    // listener, which left the popup without this page's numbers.
    browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
      const message = raw as Message;
      switch (message.type) {
        case 'get-page-stats':
          break;
        case 'set-reveal':
        case 'toggle-reveal':
          reveal = message.type === 'set-reveal' ? message.on : !reveal;
          if (!reveal) shown.clear();
          pass();
          break;
        case 'set-filter':
          filter = message.tag;
          pass();
          break;
        case 'go-deeper':
          goDeeper(1);
          pass();
          break;
        default:
          return;
      }
      sendResponse(lastStats);
    });

    observe();
  },
});

// Reranking moves results with CSS `order` inside a flex column, so the page's own
// scripts (which own these nodes) never see them move. Each boost point moves a
// result up one position; pins go to the top.
function rerank(results: FoundResult[], scores: Map<HTMLElement, number>, enabled: boolean) {
  const parents = new Set<HTMLElement>();
  const containers = new Set<Element>(results.map((r) => r.container));
  for (const r of results) if (r.container.parentElement) parents.add(r.container.parentElement);
  for (const el of document.querySelectorAll<HTMLElement>('[data-anubis-rerank]')) parents.add(el);

  for (const parent of parents) {
    const children = [...parent.children] as HTMLElement[];
    const moves = enabled && children.some((c) => (scores.get(c) ?? 0) !== 0);
    if (!moves) {
      if (parent.hasAttribute('data-anubis-rerank')) {
        parent.removeAttribute('data-anubis-rerank');
        for (const c of children) c.style.removeProperty('order');
      }
      continue;
    }
    if (!parent.hasAttribute('data-anubis-rerank')) parent.setAttribute('data-anubis-rerank', '');
    // What follows the last result (the engine's pager, related searches) stays
    // below them all, however far a result is lowered.
    let lastResult = -1;
    children.forEach((child, index) => {
      if (containers.has(child)) lastResult = index;
    });
    const ranked = children
      .map((child, index) => ({
        child,
        index,
        key: child.tagName === 'ANUBIS-SUMMARY' ? -Infinity : index > lastResult ? Infinity : index - (scores.get(child) ?? 0),
      }))
      // On a tie the higher score wins, so boost=1 really moves a result past its neighbour.
      .sort((a, b) => a.key - b.key || (scores.get(b.child) ?? 0) - (scores.get(a.child) ?? 0) || a.index - b.index);
    ranked.forEach(({ child }, order) => {
      if (child.style.order !== String(order)) child.style.setProperty('order', String(order));
    });
  }
}

// A pinned result's frame is an outline 8px outside it (page.css), which moves
// nothing. Where results sit closer than that, frames cross each other or the next
// result's text: on Google the space between results is a margin inside each one,
// which stays inside once reranking makes the list a flex column, so results touch.
// Push whatever follows a pinned result down until there's room.
const FRAME = 8;
const ROOM = 8;
const ownMarginTop = new WeakMap<HTMLElement, number>();

function makeRoomForPins(pinned: Set<HTMLElement>) {
  const push = new Map<HTMLElement, number>();
  for (const parent of new Set([...pinned].map((el) => el.parentElement))) {
    if (!parent) continue;
    // In the order they're drawn: CSS `order` when reranked, then the page's.
    const shown = [...parent.children]
      .filter((el): el is HTMLElement => el instanceof HTMLElement && el.getClientRects().length > 0)
      .map((el, index) => ({ el, index, order: Number(el.style.order) || 0 }))
      .sort((a, b) => a.order - b.order || a.index - b.index)
      .map(({ el }) => el);
    const adds = /flex|grid/.test(getComputedStyle(parent).display);
    for (let i = 1; i < shown.length; i++) {
      const [above, below] = [shown[i - 1]!, shown[i]!];
      const frames = Number(pinned.has(above)) + Number(pinned.has(below));
      if (!frames || OWN_TAGS.has(below.tagName)) continue;
      const need = frames * FRAME + ROOM;
      const pushed = below.hasAttribute('data-anubis-pin-room');
      const margin = parseFloat(getComputedStyle(below).marginTop) || 0;
      if (!pushed) ownMarginTop.set(below, margin);
      const own = ownMarginTop.get(below) ?? margin;
      const gap = below.getBoundingClientRect().top - above.getBoundingClientRect().bottom;
      // In a flex column the margins add up; in a block they collapse, so the larger counts.
      const want = adds ? Math.round(margin + need - gap) : pushed || gap < need ? need : own;
      if (want > own) push.set(below, want);
    }
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-anubis-pin-room]')) {
    if (push.has(el)) continue;
    el.removeAttribute('data-anubis-pin-room');
    el.style.removeProperty('--anubis-pin-room');
  }
  for (const [el, px] of push) {
    if (el.style.getPropertyValue('--anubis-pin-room') !== `${px}px`) el.style.setProperty('--anubis-pin-room', `${px}px`);
    if (!el.hasAttribute('data-anubis-pin-room')) el.setAttribute('data-anubis-pin-room', '');
  }
}

/**
 * Where the summary goes: at the top of the results area, above the first result
 * and above any panels (images, videos) before it. The area is the list holding
 * most web results, widened to the engine's boundary (Google's #rso) when it has
 * one. Results that show their address count; videos in a panel don't.
 */
function summaryAnchor(results: FoundResult[], engine: EngineDef): { before?: HTMLElement; area?: HTMLElement; column?: HTMLElement } {
  const main = mainColumn(results, engine).list;
  if (!main) return { before: results[0]?.container };
  const area = (engine.boundary && main.closest<HTMLElement>(engine.boundary)) || main;
  // Results in a grid (DuckDuckGo's Videos and Images tabs): inside it, the summary
  // would take a cell, so it goes before the grid.
  if (/grid/.test(getComputedStyle(area).display) && area.parentElement) return { before: area, area, column: main };
  for (const child of area.children) {
    if (child instanceof HTMLElement && !/^(ANUBIS-SUMMARY|SCRIPT|STYLE|TEMPLATE|LINK|META)$/.test(child.tagName)) return { before: child, area, column: main };
  }
  return { before: results[0]?.container, area, column: main };
}

/**
 * Above an AI answer that comes before the results area (Google can put its AI
 * Overview above the results column), so what Anubis did is the first thing on
 * the page and "Show hidden" doesn't push it down. Otherwise at the top of the
 * results area, which is also the fallback if the page lays the first place out
 * somewhere else.
 */
function summaryPlace(results: FoundResult[], engine: EngineDef, clutter: Clutter[]): SummaryPlace | undefined {
  const { before, area, column } = summaryAnchor(results, engine);
  if (!before) return undefined;
  const ai = clutter
    .filter((c) => c.kind === 'ai' && !c.uncounted)
    .map((c) => c.block)
    .filter((b) => b.isConnected && !b.contains(before) && before.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING && !b.closest('aside, [role="complementary"], #rhs'))
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const titles = results.slice(0, 5).map((r) => r.titleBlock);
  return ai[0] ? { before: ai[0], area, column, titles, fallback: before } : { before, area, column, titles };
}

/** The next result in the page after this one, skipping Anubis's own elements and blocks clean-up removed. */
function nextResultAfter(container: HTMLElement): HTMLElement | undefined {
  let next = container.nextElementSibling;
  while (next instanceof HTMLElement && (OWN_TAGS.has(next.tagName) || next.hasAttribute('data-anubis-removed'))) next = next.nextElementSibling;
  return next instanceof HTMLElement && next.hasAttribute('data-anubis-result') ? next : undefined;
}

/**
 * Light or dark for what sits on the page (the summary, tags, hidden-result lines),
 * from the setting or, on "auto", from the page's own background, so it stays
 * readable. The result menu is a card of its own and matches the popup instead.
 */
function pageTheme(setting: Theme): PageTheme {
  if (setting !== 'auto') return setting;
  for (const el of [document.body, document.documentElement]) {
    if (!el) continue;
    const rgb = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (!rgb || rgb.length < 3 || rgb[3] === 0) continue;
    const [r = 0, g = 0, b = 0] = rgb;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 ? 'dark' : 'light';
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Anubis's elements and attributes left on the page by an earlier copy of the extension. */
function clearPreviousCopy(): void {
  removeAllUi();
  for (const el of document.querySelectorAll<HTMLElement>('[data-anubis-result], [data-anubis-row], [data-anubis-removed], [data-anubis-rerank], [data-anubis-pin-room]')) {
    for (const name of el.getAttributeNames()) if (name.startsWith('data-anubis-')) el.removeAttribute(name);
  }
}

