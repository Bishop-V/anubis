# Syncing between computers

Anubis has no account or server of its own. It saves your things in your browser's sync storage, and your browser copies them to your other computers.

## What syncs

- **Your list**: every site you've ranked or tagged
- **Settings**
- **Tag choices**: what each tag does, and its name and colour
- **Subscriptions**: which lists you're subscribed to

The lists you subscribe to aren't copied between computers. Each computer downloads its own copy, from the same address.

## Turn it on

Anubis can't see whether your browser's sync is on. If a change doesn't show up on your other computer, check these settings there too.

- **Firefox:** sign in to Firefox with your Mozilla account. In Firefox's settings, under **Sync**, make sure **Add-ons** is ticked: that also syncs add-ons' data. Firefox syncs about every 10 minutes. To sync straight away, choose **Sync Now** in the same place.
- **Chrome:** sign in to Chrome with sync on, and keep **Extensions** among the things it syncs (Chrome's settings, under **You and Google**).

## Between Firefox and Chrome

They don't sync with each other: each browser only syncs with other copies of itself. To move to the other browser:

1. Open **Settings → Share and back up** and press **Export backup**.
2. In the other browser, open the same page, press **Restore backup** and choose the file.

That copies everything once. Changes made afterwards stay in the browser you made them in, so export again when you want to bring them across.

If you only change your list in one browser, you can [publish it](./publish-a-list.md) and [subscribe to it](./lists.md) in the other. The other browser picks up each version you publish.

## Limits

- **Size:** sync storage holds about 100 KB for each add-on. Anubis compresses your list before saving it, so about 10,000 sites fit. **Settings → Share and back up → Sync** shows how much room they take. If your list outgrows it, your list is kept on that computer only and Settings says so; settings, tag choices and subscriptions still sync.
- **Firefox for Android** doesn't sync add-on data. On a phone, Anubis keeps everything on the phone.
- **Changing your list on two computers at once:** if both change it before they've synced, the change saved last wins.

## Privacy

What syncs goes through your browser account, like your bookmarks. Anubis never sees it. See [Privacy and permissions](./privacy.md).
