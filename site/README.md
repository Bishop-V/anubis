# Anubis on Inglorious

This proof of concept builds the English Anubis site with Inglorious SSX, Web, and Store. It uses the wiki’s Markdown, Graphite stylesheet, sample results, and lists catalogue. The VitePress entry point serves the full set of languages.

Use Node 22.12 or newer. From the repository root, run:

```sh
npm --prefix site ci --ignore-scripts
npm --prefix site run build
npm --prefix site run preview
```

Open `http://localhost:3000/anubis/`. The static preview is in `site/dist/`. Preview builds include the English homepage, guides, lists directory, and Subscribe page, and omit locale-prefixed routes.

The site uses Store events for the demos, wiki search, list filtering, and Subscribe link state. Selecting **Subscribe** uses a full navigation to the published Anubis path. The packaged extension recognises that path on `bishop-v.github.io`. The end-to-end check serves the SSX build at that address inside the test browser.

To check the site and generate screenshots, install the root dependencies and run:

```sh
npx playwright-core install chromium
node e2e/ssx.mjs --screenshots
npm run build:chrome
node e2e/run.mjs ssx-subscribe
```

The screenshots are in `site/dist/anubis/screenshots/`. The CI job includes them in the downloadable static preview.
