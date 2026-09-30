# Lists

Lists that ship with Anubis, and the directory of lists it offers in **Settings → Lists**.

| File | What it does |
| --- | --- |
| [`official-docs.anubis`](official-docs.anubis) | Tags first-party documentation (MDN, language and framework docs) and raises it slightly. |
| [`discussions.anubis`](discussions.anubis) | Tags forums, Q&A sites and issue threads. |
| [`reference.anubis`](reference.anubis) | Tags encyclopedias, archives and research papers. |
| [`paywalls.anubis`](paywalls.anubis) | Labels sites that usually paywall their articles. Never changes the ranking. |
| [`directory.json`](directory.json) | The lists shown under "More lists", including community lists hosted elsewhere. |

The four `.anubis` lists are bundled into the extension, so they work offline, and Anubis checks GitHub for newer versions of them and of this directory.

The format is described in [docs/list-format.md](../docs/list-format.md).

## Contributing

- **Add a site to a list:** open a pull request that adds a line, or use "Suggest it to…" in the menu on a search result, which opens a pre-filled issue.
- **Report a site a list gets wrong:** use "Wrong? Report it to…" under **Why** in the menu on that result, which opens a pre-filled issue with the rule that matched.
- **Add a list to the directory:** host your list anywhere public and add an entry to `directory.json`:

  ```json
  {
    "id": "short-unique-id",
    "name": "What people will see",
    "description": "One sentence on what it does.",
    "url": "https://raw.githubusercontent.com/you/repo/main/your.anubis",
    "homepage": "https://github.com/you/repo",
    "format": "anubis"
  }
  ```

  `format` is one of `anubis`, `goggle`, `ublacklist` or `domains`. Add `"lens": true` if the list hides everything it doesn't mention.

Please keep lists factual and neutral in their labels: describe what a result is ("Paywalled", "Discussion", "Official docs") rather than what you think of it, and let people choose in their settings whether to raise, lower or hide what a tag marks. A tag sits under a result's title as a description of it, so name it the way you'd describe the result: "Paywalled", not "Paywall". `npm test` checks that every list here parses cleanly.
