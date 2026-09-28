# Anubis

A Chrome/Firefox extension that hides unwanted sites from search results. The mascot is Anubis, the Egyptian god who weighed hearts against a feather: sites "fail the weighing" and get hidden.

This project values documented experimentation, so record what was tried and what failed, not just what shipped.

## Dev environment

- The toolchain comes from the Nix flake. Run the tools through `nix develop`; never suggest global installs.

## Stack

- [WXT](https://wxt.dev) 0.21 with Vite and TypeScript. There's no UI framework yet; the popup is plain DOM.
- It builds as Chrome MV3 and Firefox MV2 from one codebase.
- Storage uses WXT's `storage` (`#imports`). The block list is `sync:blockedSites`.

## Commands

Firefox is the default target (`browser: 'firefox'` in `wxt.config.ts`). The `:chrome` variants override it.

- `npm run dev` / `npm run dev:chrome`: opens a browser with the extension loaded and reloads it on save
- `npm run build` / `npm run build:chrome`: production build into `.output/`
- `npm run compile`: type-check. Run it after every change.
- `npm run zip` / `npm run zip:chrome`: package for the store

## Layout

- `wxt.config.ts`: manifest settings (name, permissions, Firefox ID)
- `entrypoints/content.ts`: runs on Google (.com, .ca) and DuckDuckGo result pages, hides blocked results, and adds a hover "Block site" button to each result. The per-engine selectors are constants above `findResults()`. They're fragile: when blocking silently stops working, diff them against uBlacklist's ruleset at <https://github.com/ublacklist/builtin> (`serpinfo/google.yml`, `serpinfo/duckduckgo.yml`), which tracks these layouts continuously.
- `entrypoints/popup/`: the toolbar popup for adding and removing blocked domains
- `utils/blocklist.ts`: the storage item, domain normalization, and subdomain matching
- `public/`: the logo (`anubis.svg`) and toolbar icons (`icon/{16,32,48,96,128}.png`). WXT detects these automatically.

## Conventions

- Keep the brand colours: background `#1b1a16`, gold `#d4a637`.
- Ask for as few permissions as possible. Only add a permission the feature actually needs.
- No automated tests yet. Verify changes by type-checking, building both browsers, and loading the extension.

## Roadmap ideas

- A "show hidden results" toggle instead of hiding results completely
- More engines (Bing, Brave, Kagi)
- Community filter lists: subscribe to a hosted list of domains, like uBlacklist subscriptions
- An options page for large lists, with import and export
