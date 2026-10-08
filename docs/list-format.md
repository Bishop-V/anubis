# The Anubis list format

An Anubis list is a plain text file. It uses the [Brave Goggles](https://github.com/brave/goggles-quickstart) syntax and adds tags, so any public Goggle already works as an Anubis list, and an Anubis list reads like a Goggle with labels.

Lists live wherever text files can: a GitHub or GitLab repository, a gist, Codeberg. There is no Anubis server. People subscribe by pasting the file's link into **Settings → Lists**, and propose changes the way they would to any repository: an issue or a pull request.

Your own list, the one the button on each result edits, is stored in this format too, so publishing it is a matter of downloading it and putting it online.

## A small example

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! author: Anubis contributors
! homepage: https://github.com/Bishop-V/anubis/tree/main/lists
! issues: https://github.com/Bishop-V/anubis/issues
! license: CC0-1.0
! avatar: #2f5fae
! expires: 7 days
! tag: docs | Official docs | #2f5fae | Documentation published by the project or vendor itself.

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
/docs/$site=nodejs.org,tag=docs # Node.js publishes its documentation here.
```

## Header

Lines starting with `!` are comments. A comment of the form `! key: value` is metadata:

| Key | Meaning |
| --- | --- |
| `name` | The list's name, shown in settings and in the menu on each result. |
| `description` | One or two sentences on what the list is for. |
| `author` | Who maintains it. |
| `homepage` | Where to read more. |
| `issues` | An issue tracker. When set, the menu on each result offers "Suggest it to *this list*", which opens a pre-filled issue, and reports of mistakes ("Wrong? Report it to *this list*") go there. Without it, reports go to the issue tracker of the repository in `homepage`, or else of the one the list is published from. GitHub, GitLab, and Codeberg trackers are supported. |
| `license` | The license of the list's contents. CC0-1.0 is a good default for lists meant to be shared. |
| `avatar` | A hex colour for the list. |
| `expires` | How often Anubis should check for updates, as `N hours` or `N days`. The default is a day. |
| `tag` | Defines a tag. See below. May appear many times. |

`public` and `transferred_to` from Goggles are accepted and ignored.

When adding a tagged site rule to an Anubis list, put an explanation after `#` saying why the site fits. It is kept as a comment, not read as an instruction.

## Tags

```
! tag: id | Label | #colour | Description
```

- **id**: lowercase letters, digits, and hyphens, up to 32 characters. Lists that use the same id share the tag: if two lists both tag sites `ai-slop`, a subscriber sees one "AI slop" tag fed by both. Agreeing on ids is how communities build a shared vocabulary.
- **Label**: what people see under results.
- **Colour**: a hex colour. Optional; Anubis picks one from the id otherwise.
- **Description**: optional, shown on hover and in settings.

Only the id is required: `! tag: ai-slop` works. A tag used by an instruction but never defined gets a plain definition.

Lists label; subscribers decide. In **Settings → Tags** each person chooses what a tag does for them: follow the list's instructions, only show the label, highlight results, or raise, lower, or hide them. A list that tags without ranking (`$site=x.com,tag=paywall`) is the friendliest kind to publish.

## Instructions

One per line:

```
pattern$option,option=value,…
```

The pattern is optional when `site=` is given. Everything after the last `$` is options.

### Patterns (Goggles syntax)

A pattern is matched anywhere in the result's URL, case-insensitively.

| Character | Meaning |
| --- | --- |
| `*` | Any run of characters. At most two per instruction. |
| `^` | A separator (anything but a letter, digit, `.`, `_`, `%` or `-`) or the end of the URL. At most two per instruction. |
| `|` at the start | The URL must start with the pattern. |
| `|` at the end | The URL must end with the pattern. |

`/blog/$site=medium.com` matches Medium URLs containing `/blog/`. `|https://en.` matches English Wikipedia and anything else under `https://en.`.

### Options

| Option | Meaning |
| --- | --- |
| `site=example.com` | Only this domain and its subdomains. Goggles also allow a bare suffix like `site=rs`. |
| `boost` or `boost=N` | Raise matching results by N positions (1 to 10, default 1). |
| `downrank` or `downrank=N` | Lower them by N positions. |
| `discard` | Hide them. |
| `tag=id` | Tag them. Repeat for several tags: `tag=docs,tag=reference`. |
| `pin` | Put them first. Honoured in your own list; a subscribed list's `pin` counts as `boost=10`. |
| `allow` | Keep them at normal, overriding other lists. Mostly useful in your own list. |
| `inurl` | Match the pattern against the URL (the default). |
| `intitle` | Match the pattern against the result's title. |
| `indescription` / `incontent` | Match against the result's snippet. |

An instruction with no action and no tag boosts by 1, as in Goggles. An instruction with only tags leaves the ranking alone.

An Anubis rule can end with a comment after whitespace and `#`. For example, `$site=example.com,tag=docs # The project publishes its documentation here.` The comment explains why the site fits the tag and is ignored when Anubis reads the rule.

### Lenses

A line with nothing but `$discard` turns the list into a lens: every result the list doesn't mention is hidden. Brave's "Tech blogs" and "Hacker News" Goggles work this way. Anubis marks lenses in settings so nobody subscribes to one by surprise.

## How lists combine

For each result:

1. **Your tag choices.** If you chose "Hide" for a tag, results carrying it are hidden, whichever list tagged them. Tags you set to "Raise" or "Lower" add up, five places each: two raises and a lower make one raise. Each tag counts once, however many lists give it, and a rule carrying a tag you chose for leaves the ranking to your choice instead of its own `boost` or `downrank`.
2. **Your own list.** A site you pinned, raised, lowered, or kept at normal ignores what your subscriptions say, and its ranking adds to your tag choices: raised with a tag set to "Lower", it stays in place. A tag set to "Hide" still hides it. A site you hid stays hidden. The most specific entry wins, so `good.fandom.com` can be raised while `fandom.com` is hidden.
3. **Subscribed lists.** Used only for sites you haven't ranked yourself. Within one list, Goggles precedence applies: `discard` beats `boost`, which beats `downrank`. Across lists, boosts and downranks add up, and any list's `discard` hides the result.

Reranking moves results within the page you're on (and within extra pages brought in with **Load more results**): each boost point moves a result up one place.

## Other formats Anubis reads

Anubis detects the format of each file, so existing lists work without changes.

- **Brave Goggles**: everything above except tags, `pin` and `allow`.
- **uBlacklist rulesets**: match patterns (`*://*.example.com/*`), regular expressions (`/example\.(net|org)/`; one that repeats a repeated group, like `/(a+)+/`, is skipped, since it can freeze search pages), unblock rules (`@…`, treated as `allow`) and highlight rules (`@1…`, turned into a `highlight-1` tag). YAML front matter supplies the name. Expression rules such as `title *= "x"` and `@if(…)` guards are skipped and counted in settings.
- **Plain domain lists**: one domain per line, hidden. Hosts-file lines (`0.0.0.0 example.com`) work too.

## Publishing a list

1. Write the file, or download your own from **Settings → Backup**.
2. Put it in a public repository or gist. Any file extension works; `.anubis` helps people recognise it.
3. Share the link. GitHub page links, gist links, and `search.brave.com/goggles?goggles_id=…` links are all converted to the raw file automatically.
4. Set `! issues:` so people can suggest additions from the menu on each result.
5. To have it listed in **Settings → Lists** for everyone, add an entry to [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json) in a pull request.
