---
outline: false
---

<script setup>
import { withBase } from 'vitepress';
import directory from '../lists/directory.json';

const kinds = { anubis: 'Anubis list', goggle: 'Brave Goggle', ublacklist: 'uBlacklist ruleset', domains: 'Domain list' };
// A subscribe link (see subscribe.md). It needs a full page load for Anubis to
// see it, so the links carry target="_self", which keeps VitePress's router off.
const subscribe = (list) => withBase(`/subscribe?${new URLSearchParams({ url: list.url, name: list.name })}`);
</script>

# Lists directory

Lists Anubis offers under **Settings → Lists → More lists**. With Anubis installed, **Subscribe** here opens its settings with the list filled in.

<table>
  <thead>
    <tr><th>List</th><th>What it does</th><th>Format</th><th><span class="visually-hidden">Subscribe</span></th></tr>
  </thead>
  <tbody>
    <tr v-for="list in directory.lists" :key="list.id">
      <td><a :href="list.homepage ?? list.url" target="_blank" rel="noopener noreferrer">{{ list.name }}</a></td>
      <td>{{ list.description }}<span v-if="list.default"> Subscribed from the start.</span><span v-if="list.lens"> A lens: hides every result it doesn't mention.</span></td>
      <td>{{ kinds[list.format] ?? list.format }}</td>
      <td><a class="subscribe-link" :href="subscribe(list)" target="_self" :aria-label="`Subscribe to ${list.name}`">Subscribe</a></td>
    </tr>
  </tbody>
</table>

## Add your list

Host your list anywhere public (see [Publish a list](./guide/publish-a-list.md)), then open a pull request that adds an entry to [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json):

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

`format` is `anubis`, `goggle`, `ublacklist` or `domains`. Add `"lens": true` for a list that hides everything it doesn't mention. If your list covers the same sites as another in the directory, add `"overlaps": ["their-id"]` to yours, and yours to theirs: someone who has one isn't offered the other.

To link to your list from anywhere else, such as your repository's README, use a [subscribe link](./subscribe.md#make-a-subscribe-link).
