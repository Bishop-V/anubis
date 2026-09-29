# Publish a list

A list is a text file anyone can subscribe to. You don't need a server or an account with Anubis: a public Git repository is the database, and issues and pull requests are how other people contribute.

## 1. Write it

The quickest start is your own list. **Settings → Backup → Download my list** saves every site you've ranked and tagged. Or write one from scratch:

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1
$site=docs.python.org,tag=docs,boost=1
```

Every line after the header is one instruction: which sites, and what to do with them. The [list format](../list-format.md) has the details.

Lists that only tag, and leave ranking to each subscriber, are the friendliest to publish: subscribers can decide in **Settings → Tags** whether your tag raises, highlights or hides.

## 2. Put it online

Create a public repository on GitHub, GitLab or Codeberg, or a gist, and add the file. Any file name works; ending it in `.anubis` helps people recognise it.

## 3. Share the link

People paste the link into **Settings → Lists → Add a list**. A link to the file's page works; Anubis finds the raw file. Lists on GitHub and gists download without asking for any extra permission.

For one click, share a [subscribe link](../subscribe.md#make-a-subscribe-link) instead: it opens Anubis's settings with your list filled in.

## 4. Hear about mistakes, and let people suggest sites

When your list gets a site wrong, subscribers can choose "Wrong? Report it to *your list*" in the menu on that result. It opens a pre-filled issue on your repository's issue tracker, with the rule that matched and the result's address, for them to send. This needs no setting for a list on GitHub, GitLab or Codeberg.

Set `! issues:` to your issue tracker to also let subscribers suggest sites: "Suggest it to *your list*" then appears in the menu on results your list doesn't mention. Reports go to `! issues:` too, so set it if your repository's own issues are turned off. Pull requests work as for any repository.

## 5. Add it to the directory

To have your list offered to everyone under **Settings → Lists → More lists**, open a pull request that adds it to [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json). The [Lists directory](../lists.md) page shows what's there now.
