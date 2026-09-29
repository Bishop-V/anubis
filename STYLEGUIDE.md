# Anubis style guide

How Anubis looks and reads, on every surface it has: the popup, settings, the welcome page, and the tags, summary and result menu it adds to search pages. Follow this for any change to the interface. `CLAUDE.md` and `CONTRIBUTING.md` give the short version; `docs/experiments.md` records why things are the way they are.

## Principles

1. **Quiet on someone else's page.** On a search page Anubis is a guest. It uses the page's own font, muted text, hairlines and no fills. It never moves, restyles or covers the engine's content.
2. **One flourish.** The result menu's cartouche (the gold oval around the site's name) and balance are the only decoration. The Anubis motif stays in the logo, the summary's mark and the menu; it never names a function.
3. **Plain words over clever ones.** A label says what happens. The same word means the same thing everywhere.
4. **Nothing without a trace.** What Anubis hid, removed or reranked is stated in the summary, and "Show hidden" undoes it for the page.
5. **Gold is for what matters.** The primary action, focus, a choice that's been made, and the cartouche. Nothing else is gold.

## Colour

One palette, defined twice: `assets/theme.css` for extension pages and `entrypoints/content/shadow.css` for search pages. The names and values are the same in both; keep them in step. Never write a hex value outside these two files, `utils/listformat.ts` (tag colours) and the docs theme (`docs/.vitepress/theme/brand.css`), which uses the same values under VitePress's names.

| Token | Dark (brand default) | Light | Use |
| --- | --- | --- | --- |
| `--bg` | `#1b1a16` | `#f2f3f1` | Page background (extension pages only; on search pages the engine owns it) |
| `--raised` | `#23211c` | `#fbfbfa` | Inputs, the result menu's card |
| `--line` | `#35312a` | `#dadcd7` | Hairlines between sections and rows |
| `--line-strong` | `#4a453c` | `#c3c6bf` | Borders of inputs, selects and buttons; a switch that's off |
| `--text` | `#ece6da` | `#1f1e1a` | Body text |
| `--muted` | `#a39b8c` | `#62615b` | Secondary text, section labels, unchosen options, icons at rest |
| `--gold` | `#d4a637` | `#d4a637` | Fills and strokes: primary button, chosen underline, focus ring, cartouche, balance |
| `--gold-ink` | `#e0b54e` | `#8d6716` | Gold text and icons, readable on the background: text buttons, links, Raise and Pin |
| `--on-gold` | `#1b1a16` | `#1b1a16` | Text on a gold fill |
| `--danger` | `#e2735b` | `#b4492f` | Hide, errors, destructive actions |
| `--ok` | `#7fb58f` | `#3a7a52` | Confirmations (settings only) |

- The light scheme is cool museum stone, not cream or paper.
- Use `--gold` for anything filled or stroked and `--gold-ink` for anything read. Gold text in `--gold` fails contrast on light backgrounds.
- Tags carry their own colour (`--c`), from the list or from `TAG_PALETTE` in `utils/listformat.ts`: muted Egyptian pigments (ochres, malachite, Egyptian blue, amethyst, turquoise, papyrus, umber) that sit quietly on light and dark pages.
- Every surface follows the theme setting (Auto, Light, Dark). On search pages, "Auto" follows the page's background for what sits on the page, and the browser's scheme for the result menu, which matches the popup.

## Type

**Families**

- Interface: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`, set once on `body` in `theme.css`. On search pages, the page's own font, except the result menu, which uses the interface stack.
- Display: `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif` (the `.serif` class). Only for the brand name, page and section titles on extension pages, and a site's name where it's the subject (the cartouche, the popup's site).
- Code: `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`, for list text and code.

**Scale.** Use these sizes and no others.

| Size | Weight | Use |
| --- | --- | --- |
| 34px serif (29px on phones) | 400 | The welcome page's title |
| 30px serif | 400 | A settings section's title |
| 21px serif | 500 | A welcome section's title |
| 19px serif | 500 | The brand name beside the logo |
| 16px serif | 500 | A site's name as the subject: the cartouche, the popup's site |
| 16px | 400 | The welcome page's lead |
| 15px | 600 | A heading inside a settings section, a list's name |
| 14px | 400 | Body text on extension pages (`body`) |
| 13px | 400–600 | Controls (buttons, inputs, choice rows), descriptions, the result menu, the summary |
| 12.5px | 400–600 | Small print: hints, counts, tags on results, list facts, section labels in the popup and menu |

- Weights are 400, 500 and 600. Bold (600) is for the chosen option, names, and primary and text buttons.
- Sentence case everywhere. No ALL-CAPS labels, no letter-spaced eyebrows.
- Counts use `font-variant-numeric: tabular-nums`.
- Body text stops at about 62 characters (`max-width: 62ch`).

## Space and shape

- Spacing comes in steps of 2px: 4, 6, 8, 10, 12, 14, 16, 18, 24 and so on. Items in a wrapping row of tags or links sit 14px apart; buttons in a row 8px.
- Sections are divided by a 1px `--line` hairline and space, never boxed into cards. The popover is the only card.
- Corner radius: **6px** for controls (buttons, inputs, selects); **10px** for the result menu and the pinned result's frame; **999px** (a pill) for the cartouche and switches; **50%** for round icon buttons on search pages and colour swatches. Nothing else is rounded, and the logo carries its own rounded tile, so don't round or frame it.
- Shadows only on the result menu (`--shadow`), which floats over the page.

## Layout

| Surface | Layout |
| --- | --- |
| Popup | 340px wide. Header (logo, status, theme, on/off), then sections under hairlines with a 12.5px muted label, then a footer. |
| Settings | Two columns in 1040px: a 210px navigation column and sections up to 760px. One row per thing you can change. Below 760px, one column with the navigation across the top. |
| Welcome page | The same idea in 1040px: section titles in a 220px column, what to do beside them, lists two across. Below 900px, one column. |
| Search pages | The summary sits above the results, lined up with them. Tags go under each title. The result menu opens under its ⇅ button, 312px wide. |

Every page works at phone width (390px) without scrolling sideways; the `welcome` and `mobile` e2e parts check this.

## Controls

All shared controls are in `assets/theme.css`; the search-page versions in `shadow.css` look the same.

- **Button** (`.btn`): 30px high, 1px `--line-strong` border, transparent, 13px/500. Hover turns the border gold. `.btn.small` is 26px. Use it for actions that stand on their own ("Update all", "Download my list").
- **Primary button** (`.btn.primary`): gold fill, `--on-gold` text, 600. At most one per form: the action the form exists for ("Add", "Subscribe", "Create tag").
- **Text button** (`.text-btn`): no box, `--gold-ink`, 600, underline on hover. For actions inside a sentence or row ("Show hidden", "Undo", "Add tag"); `.danger` for removing.
- **Icon button** (`.icon-btn`): 28px (24px on search pages, where it's round), `--muted`, gold on hover. Only for icons everyone knows: the cog for settings, × to close. Always with `aria-label` and `title`.
- **Input**: 30px, `--raised`, 1px `--line-strong` border, 6px radius, 13px. Focus turns the border gold. Placeholders in `--muted` give an example ("fandom.com"), not an instruction.
- **Select**: the same box as an input, with the one caret: a small `--muted` chevron drawn in CSS, 10px from the right edge. Never the browser's own arrow.
- **Switch** (`.switch`): 30×17px pill, gold when on. For settings that take effect at once; no Save button.
- **Choice row** (`.seg`, `.levels`, the menu's rankings): options as plain words in `--muted`. The chosen one is `--text`, 600, with a 2px underline in gold (in `--danger` for Hide, in the tag's colour for a tag filter).
- **Tag** (`.tag`): a 6px diamond (`.gem`) in the tag's colour, then its name. A hollow diamond is a tag you could add. Tags are never pills or chips with fills.
- **Ranking note** (`.level-note`, `.verdict`): the ranking's icon and name. Pin and Raise in `--gold-ink` (Pin in 600), Hide in `--danger`, Lower and Normal in `--muted`.

## States

- **Hover**: text goes from `--muted` to `--text`, or an outline turns gold. No background fills on hover, except the ⇅ button's faint gold wash on search pages.
- **Focus**: a 2px `--gold` outline, 2px offset, on `:focus-visible` only. Where a native control sits unseen over a styled one (the cartouche's select), the visible element shows the ring (`:has(select:focus-visible)`).
- **Chosen**: the 2px underline above. Don't use fills, checkmarks or bold alone.
- **Disabled or busy**: `opacity: 0.6` and `cursor: progress` on buttons, `--muted` text on text buttons. Say what's happening ("Loading…").
- **Off**: when Anubis is off, the popup's content fades to half and the toolbar icon turns grey.
- **Hidden and removed on search pages**: hidden results leave the page, fold into one muted line with a Show button, or fade, as Settings → Appearance says; the summary counts them. Removed panels that "Show hidden" brings back are marked with a faint dashed outline.

## The result menu

The one place with character. In order:

1. **The cartouche**: the site's name, 16px serif, in a 1.5px gold oval. Where the rule can cover more or less of the site (`en.wikipedia.org` or `wikipedia.org`), a caret follows the name and the native select lies unseen over the whole oval, so the oval is exactly as wide as the name and it stays centred. There's no bar at the end of the oval: at this size it read as a text cursor.
2. **The balance**: the site's pan on the left, the feather's on the right, tilting to the chosen ranking. It swings when the ranking changes, and holds still with reduced motion.
3. **Rankings**: Hide, Lower, Normal, Raise, Pin as a choice row, with a hint underneath that says whose choice it is.
4. **Tags**, **Why** (the rules that matched, and links to report or suggest changes to a list) and a footer, each under a hairline with a 12.5px label.

## Icons

- Inline SVG from `utils/icons.ts`: a 16×16 grid, 1.6px stroke, round caps and joins, `currentColor`. Shown at 13–15px.
- Each ranking has one icon, used everywhere: an eye struck through (Hide), a chevron down (Lower), a feather (Normal), a chevron up (Raise), a pin (Pin).
- The Anubis head is the brand mark: the logo tile on extension pages and in the toolbar, the bare head as the summary's mark on search pages. It's never a button's icon.
- An icon without words only where the meaning is universal (the cog, ×, ⇅ on a result). Everything else gets a word, with or without an icon.

## Motion

- Motion answers an action: the menu opens with a 120ms fade and 3px drop, the balance swings, switches slide.
- Nothing moves on its own. Movement (the menu's drop, the balance, switches) stops under `prefers-reduced-motion`.

## Writing

- Sentence case, plain verbs, no filler: "Load more results", "Hide, rank or tag this site", "Open list settings".
- One word per concept. A site's **ranking** is Hide, Lower, Normal, Raise or Pin. Lists **tag**, **raise**, **lower** and **hide**; clean-up **removes**. People **subscribe** to lists.
- An action keeps its name through the flow: "Pin" in the menu, "Pinned javascript.info." in the summary.
- Errors say what happened and what to do, in the interface's voice. They don't apologise.
- No "·"-joined meta strings, no "→" on links, no exclamation marks.
- All interface text goes in `public/_locales/en/messages.json` and is used through `t()`, `tn()` and `localizePage()`.

## Accessibility

- Text in `--text` and `--muted` meets WCAG AA on its background in both schemes; gold text uses `--gold-ink` for the same reason.
- Every control is reachable by keyboard, in reading order, with the focus ring above. Escape closes the result menu.
- Icon-only buttons have `aria-label` and `title`; groups of choices have `role="group"` and a label; chosen options use `aria-pressed`.
- Icon buttons are at least 24px, and 32px where the pointer is coarse (the ⇅ button on phones).

## Before you merge a change to the interface

- Uses the tokens, sizes and controls above; no new colour, size or radius.
- Looks right in light and dark, at phone width, and (for search pages) on a light and a dark engine page: `npm run e2e` saves screenshots of each to `e2e/shots/`.
- Works from the keyboard, with a visible focus ring.
- Wording follows the list above, and the text is in `messages.json`.
- The guide's screenshots are regenerated (`node e2e/run.mjs docs`) if they show what changed.
