# Syncing between computers

Your sites, settings, tag choices, and subscriptions sync through your browser on their own. To sync between Firefox and Chrome, connect a WebDAV server. Subscribed lists aren't copied; each browser downloads its own.

## Browser sync

On by default, through your browser account:

- **Firefox:** sign in, and tick **Add-ons** under **Sync** in Firefox's settings.
- **Chrome:** sign in with sync on, and keep **Extensions** synced.

It only reaches the same browser on other computers. Firefox for Android doesn't sync add-on data.

## Between browsers

Connect each browser to the same WebDAV storage. Anubis keeps one file there, `anubis-sync.json`.

### Get an address and a password

You need the service's WebDAV address, your user name, and an app password.

| Service | Address | App password |
| --- | --- | --- |
| **Koofr** (10 GB free) | `https://app.koofr.net/dav/Koofr` | **Preferences → Password → App passwords**. The user name is your email. |
| **InfiniCLOUD** (20 GB free) | On your account page, under **Apps Connection** | Same page. |
| **Nextcloud** | `https://your-server/remote.php/dav/files/your-user-name/` | **Settings → Security → Devices & sessions**. |

Any WebDAV server over `https://` works.

### Connect

<!-- Maintainer: this generated screenshot comes from the mock Settings page. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark image and its description together. -->

![Settings, Sync](../img/options-sync.png)

1. In **Settings → Sync → Between browsers**, enter the address, user name, and password.
2. Keep **Encrypt the sync file end to end** on, and choose a passphrase of at least 12 characters. Use the same one in every browser.
3. Press **Connect**, and allow the browser's prompts.
4. Repeat in your other browser.

The file is encrypted with AES-256-GCM, so the server can't read it. A forgotten passphrase can't be recovered, but each browser keeps its own data.

### Change the passphrase

Use **Change encryption passphrase** in **Settings → Sync**, then enter the new one in every other browser.

### When it syncs

A few seconds after a change, when the browser starts, and when you search, at most every 5 minutes. **Sync now** syncs straight away.

Changes from both browsers are merged. If both change the same thing, the last to sync wins.

### Disconnect

**Disconnect** stops syncing in that browser. Your data stays, and so does the server file.

## Limits

- Browser sync holds about 10,000 sites. Beyond that, your sites stay on that computer; WebDAV has no limit.
- A list hosted outside GitHub needs permission in each browser: press its ↻ in **Settings → Lists**.
- To move just once, [export a backup](./import-and-backup.md#back-up) and restore it.

## Privacy

Browser sync goes through your browser account. A WebDAV server receives the sync file and your login. The passphrase is never sent. See [Privacy and permissions](./privacy.md).
