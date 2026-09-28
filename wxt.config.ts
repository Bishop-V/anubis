import { defineConfig } from 'wxt';

// WXT generates manifest.json from this config + the files in entrypoints/.
// Icons in public/icon/{16,32,48,96,128}.png are picked up automatically.
// Docs: https://wxt.dev/guide/essentials/config/manifest
export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'Anubis',
    description: 'Judges your search results and hides the sites you don’t trust.',
    // "storage" lets us save the user's block list.
    permissions: ['storage'],
    // Firefox needs an add-on ID for storage.sync. Change before publishing.
    ...(browser === 'firefox' && {
      browser_specific_settings: { gecko: { id: 'anubis@example.com' } },
    }),
  }),
});
