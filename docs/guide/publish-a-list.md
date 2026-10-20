# Publish a list

A list is a text file in a public repository. Issues and pull requests are how people contribute.

## 1. Write it

Start from **Settings → Backup → Download my list**, or write one:

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

Give each tagged site a `#` comment saying why. Lists that only tag are friendliest: subscribers choose what tags do. Reuse [existing tag ids](../list-format.md#tags) where they fit, and never change one once published. See the [list format](../list-format.md).

## 2. Put it online

Add it to a public repository on GitHub, GitLab, or Codeberg, or a gist. A name ending `.anubis` helps.

## 3. Share the link

People paste it into **Settings → Lists → Add a list**, or use a one-click [subscribe link](../subscribe.md#make-a-subscribe-link).

## 4. Hear about mistakes, and let people suggest sites

Set `! issues:` to your tracker, and subscribers get a **Suggest changes** button that opens a filled-in issue there.

## 5. Add it to the directory

Open a pull request adding it to [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json). See the [Lists directory](../lists.md).
