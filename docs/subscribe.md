---
outline: false
aside: false
editLink: false
lastUpdated: false
search: false
---

<script setup>
import { onMounted, ref } from 'vue';

// Where subscribe links lead: /subscribe?url=<list address>&name=<name>. With
// Anubis installed, it opens its settings with the list filled in as this page
// loads (entrypoints/subscribe.content.ts). This page is for everyone else.
const list = ref();
const broken = ref(false);
const here = ref('');
onMounted(() => {
  const params = new URLSearchParams(location.search);
  const url = params.get('url')?.trim();
  here.value = location.href;
  if (url?.startsWith('https://')) {
    list.value = { url, name: params.get('name')?.trim() || decodeURIComponent(url.split('/').pop() || url) };
  } else {
    broken.value = params.has('url');
  }
});
</script>

# Subscribe to a list

<div v-if="list">

This link subscribes you to **{{ list.name }}** in Anubis. The list is at:

<p class="list-address"><a :href="list.url" target="_blank" rel="noopener noreferrer">{{ list.url }}</a></p>

- **With Anubis installed**, the link opens Anubis's settings with the list filled in. Press **Subscribe** there to add it. If settings didn't open, <a :href="here" target="_self">open the link again</a>.
- **Without Anubis**, [install it](./guide/getting-started.md), then open this link again. Or paste the address above into **Settings → Lists → Add a list**.

A list can hide, rank, and tag sites in your results. Only subscribe to lists you trust.

</div>

<p v-else-if="broken">This link doesn't name a list Anubis can subscribe to: the list's address has to start with <code>https://</code>.</p>

<div v-else>

Subscribe links open Anubis's settings with a list filled in. The [lists directory](./lists.md) has one for each list.

</div>

## Make a subscribe link

To let people subscribe to your list in one click, from your repository's README for example, link to this page with your list's address as `url`, and optionally its name as `name`:

```
https://bishop-v.github.io/anubis/subscribe?url=https%3A%2F%2Fraw.githubusercontent.com%2Fyou%2Flists%2Fmain%2Fmy.anubis&name=My%20list
```

Encode both values for a web address (`encodeURIComponent` in JavaScript). The name only shows until Anubis downloads the list; after that, the list's own `! name:` is used.

This is the same form as uBlacklist's subscribe links. To offer a uBlacklist ruleset to Anubis users too, copy its uBlacklist link and change the part before the `?`.
