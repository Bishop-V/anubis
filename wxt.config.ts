import { defineConfig } from 'wxt';

// WXT generates manifest.json from this config + the files in entrypoints/.
// Icons in public/icon/{16,32,48,96,128}.png are picked up automatically.
// Docs: https://wxt.dev/guide/essentials/config/manifest
export default defineConfig({
  // Default target for every command. Override per-run with `-b chrome`.
  browser: 'firefox',
  manifest: ({ browser, manifestVersion }) => ({
    name: 'Anubis',
    description: 'Weighs your search results: tag, rerank and hide sites, with lists anyone can publish.',
    // "storage" saves your list, settings and downloaded lists. "activeTab" lets the
    // popup read the address of the tab you're on, only when you open it, so you can
    // weigh that site; it shows no install warning.
    permissions: ['storage', 'activeTab'],
    // Lists on raw.githubusercontent.com and gists download without any extra
    // permission (they allow cross-origin reads). Lists hosted anywhere else ask
    // for access to that one host, at the moment you subscribe.
    ...(manifestVersion === 3
      ? { optional_host_permissions: ['https://*/*'] }
      : { optional_permissions: ['https://*/*'] }),
    // Firefox needs an add-on ID for storage.sync. Change before publishing.
    // Anubis sends nothing anywhere, which Firefox asks new add-ons to declare.
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: { id: 'anubis@example.com', data_collection_permissions: { required: ['none'] } },
      },
    }),
  }),
});
