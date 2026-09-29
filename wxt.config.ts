import { defineConfig } from 'wxt';
import { DOCS_URL } from './utils/links';

// WXT generates manifest.json from this config + the files in entrypoints/.
// Icons in public/icon/{16,32,48,96,128}.png are picked up automatically.
// Docs: https://wxt.dev/guide/essentials/config/manifest
export default defineConfig({
  // Default target for every command. Override per-run with `-b chrome`.
  browser: 'firefox',
  // Firefox's add-on reviewers get a zip of the source to rebuild from. Leave out
  // what the build doesn't use: the documentation site (mostly screenshots), the
  // end-to-end harness, the store listing assets, and the Claude skills.
  zip: {
    excludeSources: ['docs/**', 'e2e/**', 'store/**', '.claude/**'],
  },
  manifest: ({ browser, manifestVersion }) => ({
    name: 'Anubis',
    // Text in the manifest comes from public/_locales/<language>/messages.json.
    default_locale: 'en',
    description: '__MSG_extDescription__',
    // The wiki: the browser links to it from the extension's details page.
    homepage_url: DOCS_URL,
    // "storage" saves your list, settings, and downloaded lists. "activeTab" lets the
    // popup read the address of the tab you're on, only when you open it, so you can
    // weigh that site; it shows no install warning.
    permissions: ['storage', 'activeTab'],
    // Lists on raw.githubusercontent.com and gists download without any extra
    // permission (they allow cross-origin reads). Lists hosted anywhere else ask
    // for access to that one host, at the moment you subscribe; so does a WebDAV
    // server, when you connect one to sync between browsers.
    ...(manifestVersion === 3
      ? { optional_host_permissions: ['https://*/*'] }
      : { optional_permissions: ['https://*/*'] }),
    // Keyboard shortcuts, handled in the background script. People change them in
    // chrome://extensions/shortcuts or Firefox's Manage Extension Shortcuts. On a
    // Mac, Option+Shift types letters (Ø, Ó), so the Mac keys use Control instead.
    commands: {
      'toggle-enabled': {
        suggested_key: { default: 'Alt+Shift+O', mac: 'MacCtrl+Shift+O' },
        description: '__MSG_commandToggleEnabled__',
      },
      'toggle-hidden': {
        suggested_key: { default: 'Alt+Shift+H', mac: 'MacCtrl+Shift+H' },
        description: '__MSG_commandToggleHidden__',
      },
    },
    // Firefox needs an add-on ID for storage.sync. It is the add-on's permanent
    // identity, so don't change it once anyone has installed: a new ID reads as a
    // different add-on and orphans the settings stored under the old one.
    // Firefox asks add-ons to declare what they send anywhere. Anubis sends nothing
    // unless you connect a WebDAV server to sync between browsers; then your list
    // (the sites in it: "browsing activity" to Firefox) goes to that server, and
    // Settings asks for consent when you connect.
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: '{9ab93008-4ecd-4923-8a62-d81099997d39}',
          data_collection_permissions: { required: ['none'], optional: ['browsingActivity'] },
        },
      },
    }),
  }),
});
