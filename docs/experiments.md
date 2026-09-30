# Experiments and decisions

What was tried while building Anubis, what failed, and what is still unverified. The notes are split by topic into the files below.

To find a note, search for its heading or a keyword (`grep -rn "Reranking" docs/experiments/`) and read only that section. Add a new note at the top of the matching section, or as a new dated section at the top of the file for its topic, without reading the whole file.

## [Live pages](./experiments/live-pages.md)

What was checked on real search pages, and what is still unverified.

- Still unverified against live pages
- Reported from live pages: the summary, forum results, and more panels (2026-09-29)

## [Engines](./experiments/engines.md)

Keeping engine definitions current, and engine bugs found while testing.

- Keeping platform and engine maintenance current (2026-09-29)
- Keeping engine definitions in sync (2026-09-29)
- Engine watch
- Bugs found while testing
- Google in Firefox: flipped tags, missing buttons, misplaced summary

## [Search pages](./experiments/search-pages.md)

What Anubis draws and changes on search pages.

- Show hidden after a new search, and tag choices from files (2026-09-29)
- Result selector indicators (2026-09-29)
- Screen readers and focus on search pages (2026-09-29)
- Keyboard shortcuts
- Phone layouts (Firefox for Android)
- Clean up pages
- Hidden results: removed by default
- Reranking
- Load more results (more than one page of results)
- Shadow DOM UI
- Undo (2026-09-29)
- Filtering by tag

## [Storage, sync, and lists](./experiments/storage-and-lists.md)

Where things are stored, sync between browsers, and subscribing to lists.

- Passphrase changes that race or lose their answer (2026-09-29)
- WebDAV passphrase changes and recovery (2026-09-29)
- End-to-end WebDAV encryption (2026-09-29)
- Reporting mistakes to lists
- Storage
- Subscriptions and permissions
- Importing from other tools

## [Design and wording](./experiments/design.md)

The look, the wording, and Anubis's own pages.

- Finishing touches (2026-09-29)
- Patterns from Dark Reader (2026-09-29)
- Settings on narrow screens (2026-09-29)
- Welcome page
- Translation
- Wording, icons, and the motif
- Toolbar icon when off
- Design

## [Documentation site](./experiments/docs-site.md)

The documentation site and its screenshots.

- Documentation site

## [Tooling and releases](./experiments/tooling.md)

Builds, tests, the end-to-end run, stores, and releases.

- Finding Chromium for the end-to-end run (2026-09-29)
- Firefox first, and one command before a release (2026-09-29)
- Store privacy disclosure (2026-09-29)
- Final runtime and listing review (2026-09-29)
- Full end-to-end run stability (2026-09-29)
- Declared Node.js minimum (2026-09-29)
- Asserted end-to-end checks (2026-09-29)
- Store listings
- Tooling
