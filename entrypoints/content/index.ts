import { browser, defineContentScript } from '#imports';
import { engineFor, ENGINE_MATCHES, isMobileAgent } from '@/utils/engines';
import { colorForTag, slugifyTag } from '@/utils/listformat';
import { evaluate, type Verdict } from '@/utils/matcher';
import { send, type Message, type PageStats } from '@/utils/messages';
import { formatSiteLine, getSite, setSiteLevel, toggleSiteTag, upsertTagDef, type PersonalLevel } from '@/utils/personal';
import { loadRuleSet, watchRuleSet, type RuleSet } from '@/utils/ruleset';
import { editPersonal } from '@/utils/storage';
import { suggestionUrl } from '@/utils/subscriptions';
import { findClutter, redirectFor, watchAllTab } from './cleanup';
import { freshState, weighDeeper } from './deeper';
import './page.css';
import { findResults, OWN_TAGS, type FoundResult } from './results';
import {
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
} from './ui';

// Runs on search result pages. Each pass: find the results, weigh each one against
// the personal list and subscriptions, then tag, hide, highlight and rerank them.
export default defineContentScript({
  matches: ENGINE_MATCHES,
  // Start early so results are weighed as they stream in, before they paint.
  runAt: 'document_start',

  async main() {
    // Phones get a different layout from some engines (Firefox for Android).
    const engine = engineFor(location.hostname, isMobileAgent(navigator.userAgent));
    if (!engine) return;

    let rules: RuleSet;
    try {
      rules = await loadRuleSet();
    } catch (error) {
      // storage.sync can fail in some setups; don't let that kill the script.
      console.warn('[anubis] could not load lists', error);
      return;
    }

    // Clean-up that works by sending the page elsewhere: DuckDuckGo's no-AI version,
    // Google's Web tab. Checked again on each pass, as both engines can change the
    // search without reloading.
    const redirected = () => {
      if (!rules.settings.enabled || rules.settings.engines[engine.id] === false) return false;
      const to = redirectFor(engine, new URL(location.href), rules.settings.cleanup, rules.settings.googleWebTab);
      if (!to || to === location.href) return false;
      location.replace(to);
      return true;
    };
    if (redirected()) return;
    if (engine.id === 'google') watchAllTab();

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

      // A new search (Google and DuckDuckGo change the URL without reloading).
      if (deeper.url !== location.href && !deeper.busy) {
        deeper = freshState(engine);
        filter = undefined;
        shown = new Set();
      }

      const results = findResults(engine);
      const more = engine.more;
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
        canGoDeeper:
          !!more && !deeper.done && !deeper.busy && results.length > 0 && (more.kind !== 'click' || !!document.querySelector(more.button)),
        loading: deeper.busy,
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

      // Clean-up: AI answers, video panels and the like. "Show hidden" brings them back too.
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
      stats.tags = [...tagCounts]
        .map(([id, count]) => ({ id, count, label: rules.tags.get(id)?.label ?? id, color: rules.tags.get(id)?.color ?? '#c8962e' }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
      // A filter whose tag left the page (a new search, a list turned off) lapses.
      if (filter && !tagCounts.has(filter)) filter = undefined;
      stats.filter = filter;
      for (const result of results) {
        const out = !!filter && !verdictFor(result).tags.includes(filter);
        result.container.toggleAttribute('data-anubis-filtered', out);
        for (const row of result.extras) row.toggleAttribute('data-anubis-filtered', out);
      }

      rerank(results, scores, rules.settings.rerank && !engine.table);

      if (rules.settings.showSummary && !engine.table) {
        renderSummary(summaryAnchor(results, engine), stats, theme, {
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
        });
      } else renderSummary(undefined, stats, theme, { toggleReveal() {}, settings() {}, deeper() {}, filter() {} });

      // "Look deeper automatically": once per search.
      if (rules.settings.deeper > 0 && stats.canGoDeeper && deeper.pages === 1 && !deeper.auto) {
        deeper.auto = true;
        goDeeper(rules.settings.deeper);
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
      if (engine.table) container.setAttribute('data-anubis-row', '');
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

      const ctx = { tags: rules.tags, prefs: rules.prefs, theme };
      if (rules.settings.showChips) renderChips(result, verdict, ctx, revealed);
      else renderChips(result, { ...verdict, level: 'normal', tags: [] }, ctx, false);

      ensureWeighButton(result, engine, theme, openWeigh);
      renderHiddenBar(result, verdict, theme, rules.tags, verdict.hidden && !revealed && rules.settings.hideStyle === 'collapse' && !engine.table, {
        reveal: () => {
          shown.add(result.url);
          pass();
        },
      });
    };

    const goDeeper = (count: number) => {
      void weighDeeper(engine, deeper, count, schedule);
    };

    // ------------------------------------------------------------ weigh menu

    const openWeigh = (anchor: HTMLElement, result: FoundResult) => {
      if (popoverAnchor() === anchor && !anchor.isConnected) return closePopover();
      const verdict = verdictFor(result);
      const baseline = evaluate({ url: result.url, title: result.title, description: result.description }, rules.lists.filter((l) => !l.personal), rules.prefs);
      const trackers = rules.lists
        .filter((l) => !l.personal && rules.meta[l.id]?.issues)
        .map((l) => ({ name: l.name, issues: rules.meta[l.id]!.issues!, tags: l.tags.map((t) => t.id) }));
      openPopover(
        anchor,
        {
          result,
          verdict,
          baseline,
          personalText: rules.personalText,
          tags: rules.tags,
          trackers,
          theme: pageTheme(rules.settings.theme),
        },
        {
          setLevel: (domain, level: PersonalLevel) => void editPersonal((t) => setSiteLevel(t, domain, level)),
          toggleTag: (domain, tag) => void editPersonal((t) => toggleSiteTag(t, domain, tag)),
          createTag: (domain, label) => {
            const id = slugifyTag(label);
            if (!id) return;
            void editPersonal((t) => {
              const withTag = rules.tags.has(id) ? t : upsertTagDef(t, { id, label, color: colorForTag(id) });
              return toggleSiteTag(withTag, domain, id, true);
            });
          },
          suggest: (tracker, domain) => {
            const entry = getSite(rules.personalText, domain);
            const line = formatSiteLine(domain, entry?.level ?? 'normal', entry?.tags ?? []) ?? `$site=${domain}`;
            return suggestionUrl(
              tracker.issues,
              `Suggest ${domain}`,
              `Suggested instruction for **${tracker.name}**:\n\n\`\`\`\n${line}\n\`\`\`\n\nExample result: ${result.url.split('?')[0]}\n\n_Sent from Anubis._`,
            );
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
      for (const attr of ['data-anubis-result', 'data-anubis-state', 'data-anubis-reveal', 'data-anubis-highlight', 'data-anubis-row', 'data-anubis-filtered']) {
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
      lastResults = [];
      if (lastStats) void send({ type: 'stats', stats: { ...lastStats, total: 0, hidden: 0 } });
      lastStats = undefined;
    };

    // Re-run when the page adds results (infinite scroll, "More results", SPA
    // navigation). Batched to one pass per frame, and the observer is detached
    // while we write so our own elements don't trigger another pass.
    let queued = false;
    const observer = new MutationObserver((mutations) => {
      if (queued) return;
      const relevant = mutations.some((m) =>
        [...m.addedNodes, ...m.removedNodes].some((n) => !(n instanceof HTMLElement && OWN_TAGS.has(n.tagName))),
      );
      if (!relevant) return;
      schedule();
    });
    const observe = () => observer.observe(document.documentElement, { childList: true, subtree: true });
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        observer.disconnect();
        try {
          pass();
        } finally {
          observe();
        }
      });
    }

    pass();
    // One early pass may run before the results exist; the observer catches the rest.
    document.addEventListener('DOMContentLoaded', () => schedule(), { once: true });

    watchRuleSet(async () => {
      rules = await loadRuleSet();
      verdicts = new Map();
      schedule();
      // After the pass, so the menu sees fresh verdicts.
      requestAnimationFrame(refreshOpenPopover);
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
    const ranked = children
      .map((child, index) => ({
        child,
        index,
        key: child.tagName === 'ANUBIS-SUMMARY' ? -Infinity : index - (scores.get(child) ?? 0),
      }))
      // On a tie the higher score wins, so boost=1 really moves a result past its neighbour.
      .sort((a, b) => a.key - b.key || (scores.get(b.child) ?? 0) - (scores.get(a.child) ?? 0) || a.index - b.index);
    ranked.forEach(({ child }, order) => {
      if (child.style.order !== String(order)) child.style.setProperty('order', String(order));
    });
  }
}

/**
 * Where the summary goes: at the top of the results area, above the first result
 * and above any panels (images, videos) before it. The area is the list holding
 * most web results, widened to the engine's boundary (Google's #rso) when it has
 * one. Results that show their address count; videos in a panel don't.
 */
function summaryAnchor(results: FoundResult[], engine: { boundary?: string; displayed?: string }): HTMLElement | undefined {
  const web = results.filter((r) => r.container.querySelector(engine.displayed ?? 'cite'));
  const counts = new Map<HTMLElement, number>();
  for (const r of web.length ? web : results) {
    const parent = r.container.parentElement;
    if (parent) counts.set(parent, (counts.get(parent) ?? 0) + 1);
  }
  let main: HTMLElement | undefined;
  for (const [parent, n] of counts) if (!main || n > counts.get(main)!) main = parent;
  if (!main) return results[0]?.container;
  const area = (engine.boundary && main.closest<HTMLElement>(engine.boundary)) || main;
  for (const child of area.children) {
    if (child instanceof HTMLElement && !/^(ANUBIS-SUMMARY|SCRIPT|STYLE|TEMPLATE|LINK|META)$/.test(child.tagName)) return child;
  }
  return results[0]?.container;
}

/** Light or dark, from the setting or, on "auto", from the page's own background. */
function pageTheme(setting: 'auto' | 'light' | 'dark'): PageTheme {
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
