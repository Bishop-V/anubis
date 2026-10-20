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

The five top-level lists ship inside the extension and update from GitHub.

## Lists made from other projects

[`sources/`](sources) is rebuilt weekly from other projects' data (`.github/workflows/sources.yml`), keeping their licences and credits. Don't edit these files; change the source project instead. The format is in [docs/list-format.md](../docs/list-format.md).

## Contributing

- **Add or fix a site:** a pull request, or **Suggest changes** beside the list in **Settings → Lists**. Give each new tagged site a short `#` comment saying why.
- **Add a list to the directory:** host it publicly and add an entry to `directory.json`:

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

  `format` is `anubis`, `goggle`, `ublacklist`, or `domains`. Add `"lens": true` if it hides everything it doesn't list, and `"overlaps": ["their-id"]` (on both) if it covers another list's sites.

Name tags for what a result is ("Paywalled", not "Paywall" or "Bad"), and leave ranking to subscribers. `npm test` checks every list parses.
