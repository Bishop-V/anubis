# Accessibility

Guidelines for keeping Anubis usable with a screen reader and from the keyboard. They aren't a gate a change has to pass; they're what to keep in mind while making it, and what to check before calling it done. Where the code doesn't meet them yet, the gap is listed at the end rather than hidden.

Anubis works in two places, and they need different care:

- **Its own pages**: the popup, settings and the welcome page. Anubis owns these completely.
- **Search pages**: someone else's page, which a person may already be navigating with a screen reader or the keyboard. Anubis adds to it and hides parts of it. The first rule there is to leave the page no harder to use than it was.

## Screen readers

**Hide things the same way for everyone.** A result or panel that is hidden on screen is hidden with `display: none` (`entrypoints/content/page.css`), which also takes it out of what a screen reader reads, and "Show hidden" brings both back. Don't hide something visually while leaving it readable, or the other way round. The exception is on purpose: lowered results and the Dim style only fade, so they stay readable, and the chip under the title ("Lowered", "Hidden") says what happened in words.

**Reading order is the page's order.** Reranking moves results with CSS `order` and never moves the nodes (see Pitfalls in `CLAUDE.md`). Screen readers and Tab follow the DOM, so they meet results in the engine's order, not the reranked one. This can't be fixed without moving nodes the engine owns; keep it in mind, and don't make anything depend on the visual order being the reading order.

**Everything Anubis adds is read aloud, on every result.** The shadow roots keep the page's CSS out, not screen readers: the chips, the ⚖ button and the hidden-result line are read between each title and its snippet. Keep them short, and don't add text to a result that a sighted person wouldn't need either.

**A control has to make sense on its own.** Screen reader users often jump from button to button or pull up a list of them. A button repeated on every result should say which result it's for, and a text button's label should stand without the sentence around it.

**Don't put information only in a tooltip.** `title` isn't reliably read, and can't be reached by keyboard at all. The chips' tooltips (which list gave the verdict) are a convenience; the same reasons are in the result menu's Why section, which is where that information has to be.

**Say what changed.** After an action whose result appears somewhere else on the page, put the message in an element with `role="status"` so it's announced without moving focus. Settings does this for its notices (`entrypoints/options/flash.ts`). Use `status` (polite), not `alert`: nothing Anubis says is urgent.

**Icons are decoration unless they're the only content.** Icons from `utils/icons.ts` carry `aria-hidden="true"` and `focusable="false"`, and so does the menu's balance. A button whose only content is an icon gets an `aria-label` and a matching `title`.

**State goes in attributes, not only in colour or shape.** Chosen options in a row of choices use `aria-pressed`, the rows use `role="group"` with a label, the settings navigation marks its page with `aria-current`, and the ⚖ button keeps `aria-expanded` in step with the menu. Follow the same patterns for new controls instead of inventing new ones.

**Leave the engine's own structure alone.** Clean-up removes content blocks (AI answers, video panels), never the page's navigation, search form or landmarks (`NOT_A_BLOCK` in `entrypoints/content/cleanup.ts`). Keep it that way when adding a clean-up kind or an engine.

**Labels are interface text.** An `aria-label` is read to people just like visible text, so it goes in `messages.json` and through `t()` like the rest (static HTML uses `data-i18n-aria-label`). Many labels are still hard-coded English; move them when you touch the code around them.

## Keyboard

**Everything the pointer can do, the keyboard can do.** Use real `<button>`, `<a href>`, `<input>` and `<select>` elements: they get Tab, Enter and Space for free. A `div` with a click handler gets none of that. Hover-only behaviour needs a focus equivalent: the ⚖ button brightens on `:focus-within` as well as `:hover`.

**Focus is always visible.** The focus ring is the 2px gold outline on `:focus-visible` (`assets/theme.css`, `shadow.css`). Never remove an outline without replacing it, and where a native control sits invisibly over a styled one (the cartouche's site picker), draw the ring on what can be seen.

**Focus goes somewhere sensible, and comes back.** When a control opens something, focus moves into it; when it closes, focus returns to what opened it. The result menu is the model: it opens with focus on the chosen ranking, Escape closes it and puts focus back on the ⚖ button, and Enter in the new tag field adds the tag.

**Re-rendering mustn't drop focus.** Replacing the focused element sends focus back to the top of the page, and a keyboard or screen reader user loses their place. The result menu and the summary survive their own re-renders by giving controls a `data-focus-key` and focusing the same key in the new content (`openPopover` and `render` in `entrypoints/content/ui.ts`); when that control is gone (Undo), focus goes to the first one. Do the same, or update the existing nodes, wherever a click re-renders the thing that was clicked.

**Shortcuts are the browser's, and people can change them.** The two shortcuts (Alt+Shift+O for on and off, Alt+Shift+H for Show hidden) are `commands` in `wxt.config.ts`: suggested keys that people can reassign, and that the browser leaves empty if another extension has them. So:

- Don't listen for keys on search pages. Engines have their own (DuckDuckGo's j and k), and screen readers use single letters to move around a page; a key Anubis takes is a key someone else loses.
- Name keys by what the browser reports (`commands.getAll()`, as the popup's tooltips do), never by the suggested defaults.
- A shortcut is a way to reach a feature that already has a button, never the only way. Chrome allows four suggested keys per extension, so save them for things people do from anywhere, often.
- Mac shortcuts use Control, because Option+Shift types characters and would take them from text fields (`docs/experiments.md`, Keyboard shortcuts).

## Everything else

- **Motion**: animations sit inside `@media (prefers-reduced-motion: no-preference)`, so they stop for people who've asked for less motion. New ones go there too.
- **Contrast and size**: `STYLEGUIDE.md` has the colour tokens that meet WCAG AA in both schemes, and the minimum button sizes. Stay within them.
- **Zoom and text size**: layouts should hold at 200% zoom and with a larger default font, without text being cut off.

## Checking a change

- Put the mouse away and do the thing with Tab, Shift+Tab, Enter, Space and Escape. Watch where focus goes after each step.
- Listen to it once. NVDA with Firefox on Windows, Orca on Linux, or VoiceOver with Chrome on a Mac are all free. On a search page, move through a few results and hear what Anubis adds to each.
- Look at the accessibility tree: Firefox's Accessibility panel in DevTools, or Chrome's Accessibility pane in Elements. It shows each control's name, role and state, and it can see inside the closed shadow roots.
- If something was tried and didn't work, note it in `docs/experiments.md` like any other experiment.

## Known gaps

What the code does today that falls short of the above, found while writing this (2026-09-29). Fix them as the code around them changes, and move each to `docs/experiments.md` once it's tried.

- **Reranked order isn't the reading order**, as above. Needs an idea that doesn't move the engine's nodes.
- **The popup drops focus.** It replaces its content after a click (`renderHere()` in `entrypoints/popup/main.ts` for "This site"), so the button that was pressed disappears with focus on it. The summary had the same gap; it now keeps focus with `data-focus-key`, as the result menu does.
- **Tab from the result menu's last control goes to the end of the page,** since the menu is added at the end of the page, rather than back to the result.
- **Tag reasons are tooltip-only on the chips.** Covered in the menu's Why section, but that's one step further away.
