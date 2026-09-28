# anubis
Browser extension for filtering search results, and much more.

## Inspirations

**[uBlacklist](https://github.com/iorate/ublacklist)** is the closest existing project and the main influence. The interaction model comes from it: a block icon on each search result, so you curate the list while searching instead of opening settings. Anubis follows the same idea of hiding blocked results in place, with a summary of what was hidden.

uBlacklist was also the reference for how search engines are matched. It no longer hardcodes per-engine selectors — those moved to a declarative ruleset in [ublacklist/builtin](https://github.com/ublacklist/builtin) (`serpinfo/google.yml`, `serpinfo/duckduckgo.yml`), which is updated as the engines change their markup. Reading it made the underlying problem clear: Google's class names (`.vt6azd`, `.MjjYud`, `.yuRUbf`) rotate without warning, so anything matching on them breaks quietly.

Anubis takes a different approach because of that. Rather than tracking class names, it finds results *structurally*: locate the title heading, take the link around it, then walk up to the smallest ancestor still holding a single result. That survives a layout change without an update, at the cost of being less precise than a curated ruleset. The uBlacklist rulesets remain the reference to check against when something does break.

Other influences:

- **[Firefox's `web-ext`](https://github.com/mozilla/web-ext)** does the development loading, via [WXT](https://wxt.dev), which builds Chrome MV3 and Firefox MV2 from one codebase.
- The name and framing come from the Egyptian myth in which Anubis weighs a heart against a feather: sites that fail the weighing are hidden.
