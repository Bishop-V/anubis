# Low-level audit

**Date:** 2026-10-01  
**Scope:** Rule parsing and evaluation, personal-list editing and merging, storage and sync, and search-result discovery and URL resolution.

## Findings

No reproducible defect was confirmed in the reviewed code. In particular, the audit did not establish a failure in rule precedence, list merging, or personal-list persistence. The existing unit suite passed during the audit (22 files, 211 tests).

## Follow-up risks, not confirmed bugs

- **Search-result URL resolution** (`entrypoints/content/results.ts`, `resolveUrl`): for same-engine links, several query keys (`uddg`, `url`, `q`, `u`, `imgurl`) can be interpreted as the destination. This accommodates engine redirect formats, but a same-origin link using one of those keys for another purpose could be weighed as a different site. No supported-engine case demonstrating misclassification was reproduced.
- **Engine DOM assumptions** (`utils/engines.ts`, `entrypoints/content/results.ts`): result and panel discovery depends on engine selectors and structural heuristics. Markup drift can cause missed or over-broad detection; this is an ongoing compatibility risk, not evidence of a current defect. Confirm any reported layout issue against a real page and add a fixture before changing selectors.
- **Sync settling** (`utils/storage.ts`, `readPersonal`): while remote chunks do not match their checksum, reads use the last good local copy and mark it unsettled. This is deliberate data-preserving behavior. The review did not reproduce a stale value persisting after sync settles.

These items are recorded as verification targets only; they should not be treated as confirmed bugs without a reproducible case.
