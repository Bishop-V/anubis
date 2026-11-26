# Anubis on Inglorious

This proof of concept builds Anubis’s public site with Inglorious SSX, Web, and Store. It shares the wiki’s Markdown, Graphite stylesheet, sample results, and lists catalogue with VitePress. Inglorious I18n translates the navigation and search interface. Search, appearance, and language are in the header’s menu. Inglorious UI provides the wiki search and list filter fields, and Inglorious Motion animates the demo cursor’s clicks, and result rows slide from their old positions when their order changes.

Use Node 22.12 or newer. From the repository root, run:

```sh
npm --prefix site ci --ignore-scripts
npm --prefix site run build
npm --prefix site run preview
```

Open `http://localhost:3000/anubis/`. The static preview is in `site/dist/`. The homepage and guides are available in English, German, Vietnamese, Simplified Chinese, and Traditional Chinese. The lists directory, Subscribe page, and contributor pages follow the existing English URLs.

The site uses Store events for the demos, wiki search, list filtering, and Subscribe link state. Selecting **Subscribe** uses a full navigation to the published Anubis path. The packaged extension recognises that path on `bishop-v.github.io`. The end-to-end check serves the SSX build at that address inside the test browser.

To check the site and generate screenshots, install the root dependencies and run:

```sh
npx playwright-core install chromium
node e2e/ssx.mjs --screenshots
npm run build:chrome
node e2e/run.mjs ssx-subscribe
```

The screenshots are in `site/dist/anubis/screenshots/`. The **SSX preview** job includes them in the `anubis-ssx-preview` artifact. It runs for pushes to `inglorious-trial` and for pull requests. You can also choose **CI → Run workflow** in GitHub Actions and enable screenshots.
