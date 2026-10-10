# Lists

Lists that ship with Anubis, and the directory of lists it offers in **Settings → Lists**.

| File | What it does |
| --- | --- |
| [`official-docs.anubis`](official-docs.anubis) | Tags first-party documentation DevDocs doesn't cover (Go, Swift, Ruby, cloud and platform docs) and raises it slightly. |
| [`discussions.anubis`](discussions.anubis) | Tags forums, Q&A sites and issue threads. |
| [`reference.anubis`](reference.anubis) | Tags encyclopedias, archives and research papers. |
| [`paywalls.anubis`](paywalls.anubis) | Labels sites that usually paywall their articles. Never changes the ranking. |
| [`foss-tools.anubis`](foss-tools.anubis) | Tags selected FOSS tools and provides reusable FOSS and AI slop tags. |
| [`sources/ai-content.anubis`](sources/ai-content.anubis) | Labels AI-generated sites, made from the [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist). |
| [`sources/independent-wikis.anubis`](sources/independent-wikis.anubis) | Raises independent wikis and lowers the Fandom wikis they replace, made from [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy)'s data. |
| [`sources/devdocs.anubis`](sources/devdocs.anubis) | Tags the documentation sites [DevDocs](https://github.com/freeCodeCamp/devdocs) collects, including MDN and most language and framework docs. |
| [`sources/self-hosted-foss.anubis`](sources/self-hosted-foss.anubis) | Labels the websites of free programs [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) lists as FOSS. |
| [`directory.json`](directory.json) | The lists shown under "More lists", including community lists hosted elsewhere. |

The five `.anubis` lists at the top level are bundled into the extension, so they work offline, and Anubis checks GitHub for newer versions of them and of this directory.

## Lists made from other projects

The lists in [`sources/`](sources) are made from other projects' data by a weekly job (`.github/workflows/sources.yml`), which opens a pull request when the data changes. They aren't bundled: Anubis downloads them from here. Each keeps its source's licence, names its source, and links to it. Where a source covers what one of Anubis's own lists does, the source's data replaces the hand-made entries.

Don't edit these files: the next update overwrites them. To add or remove a site, contribute to the project the list names; its change arrives here with the next update.

The format is described in [docs/list-format.md](../docs/list-format.md).

## Contributing

- **Add a site to a list:** for a list in [`sources/`](sources), contribute to the project it's made from. For the others, open a pull request that adds a line, or use "Suggest it to…" in the menu on a search result, which opens a pre-filled issue. Add a short trailing `#` comment to every new site rule that adds a tag, explaining why the site fits.
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

  `format` is one of `anubis`, `goggle`, `ublacklist` or `domains`. Add `"lens": true` if the list hides everything it doesn't mention. If your list covers the same sites as another in the directory, add `"overlaps": ["their-id"]` to yours, and yours to theirs: someone who has one isn't offered the other.

Please keep lists factual and neutral in their labels: describe what a result is ("Paywalled", "Discussion", "Official docs") rather than what you think of it, and let people choose in their settings whether to raise, lower or hide what a tag marks. A tag sits under a result's title as a description of it, so name it the way you'd describe the result: "Paywalled", not "Paywall". `npm test` checks that every list here parses cleanly.
