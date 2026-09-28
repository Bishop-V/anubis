import { defineConfig } from 'vitepress';

// The documentation site, built from the Markdown in docs/ with VitePress and
// published to GitHub Pages by .github/workflows/docs.yml. The pages read fine on
// GitHub too, so keep links relative between pages.

const repo = 'https://github.com/Bishop-V/anubis';
// GitHub Pages serves a project site under /<repo>/. DOCS_BASE overrides it, for a
// custom domain ("/") or a fork.
const base = process.env.DOCS_BASE ?? '/anubis/';

export default defineConfig({
  title: 'Anubis',
  description: 'A browser extension that hides, ranks and tags search results, with lists anyone can publish.',
  lang: 'en',
  base,
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}anubis.svg` }]],
  themeConfig: {
    logo: '/anubis.svg',
    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: 'Lists', link: '/lists' },
      { text: 'List format', link: '/list-format' },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Using Anubis',
        items: [
          { text: 'Ranking sites', link: '/guide/ranking' },
          { text: 'Tags', link: '/guide/tags' },
          { text: 'Subscribing to lists', link: '/guide/lists' },
          { text: 'Cleaning up pages', link: '/guide/clean-up' },
          { text: 'Loading more results', link: '/guide/more-results' },
          { text: 'Moving from other tools', link: '/guide/import-and-backup' },
        ],
      },
      {
        text: 'Publishing lists',
        items: [
          { text: 'Publish a list', link: '/guide/publish-a-list' },
          { text: 'List format', link: '/list-format' },
          { text: 'Lists directory', link: '/lists' },
        ],
      },
      {
        text: 'About',
        items: [
          { text: 'Search engines', link: '/guide/search-engines' },
          { text: 'Privacy and permissions', link: '/guide/privacy' },
          { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          { text: 'Experiments and decisions', link: '/experiments' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: repo }],
    editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Edit this page on GitHub' },
    search: { provider: 'local' },
    outline: { level: [2, 3], label: 'On this page' },
    footer: { message: 'Released under the GNU GPL v3.' },
  },
  vite: {
    // The lists page reads lists/directory.json from outside docs/.
    server: { fs: { allow: ['..'] } },
  },
});
