// Sample results and steps shared by both documentation builds.
export type Tag = { name: string; color: string };
export type ScrollResult = {
  id: string;
  site: string;
  url: string;
  icon: [bg: string, fg: string, letter: string];
  title: string;
  snippet: string;
  tag?: Tag;
  hidden?: boolean;
  pinned?: boolean;
  raised?: boolean;
  lowered?: boolean;
};
// A panel between the results: `lines` are what it lists, `meta` a line of small
// print for each (a source, a length, a count).
export type ScrollBlock = { id: string; kind: 'ai' | 'news' | 'questions' | 'videos' | 'discussions' | 'images'; heading: string; lines: string[]; meta?: string[] };
export type ScrollItem = ScrollResult | ScrollBlock;

export const REFERENCE: Tag = { name: 'Reference', color: '#2b9aa0' };
export const PAYWALL: Tag = { name: 'Paywalled', color: '#b5452e' };

export const SCROLL_ITEMS: ScrollItem[] = [
  {
    id: 'ai',
    kind: 'ai',
    heading: 'AI overview',
    lines: ['Anubis is the jackal-headed god of the dead in ancient Egyptian religion, linked with mummification and the protection of tombs. He was said to weigh the hearts of the dead against a feather.'],
    meta: ['Wikipedia', 'Britannica', '+4 sites'],
  },
  { id: 'wiki', site: 'Wikipedia', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', tag: REFERENCE, pinned: true },
  {
    id: 'news',
    kind: 'news',
    heading: 'Top stories',
    lines: ['Jackal mummies found in a Saqqara catacomb', 'Museum reopens its gallery of Anubis statues', 'What the weighing of the heart tells us'],
    meta: ['Heritage Daily', 'The Museum Post', 'Ancient Review'],
  },
  { id: 'fandom', site: 'Fandom', url: 'mythology.fandom.com › wiki › Anubis', icon: ['#fa005a', '#ffffff', 'F'], title: 'Anubis | Mythology Wiki | Fandom', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.', hidden: true },
  {
    id: 'questions',
    kind: 'questions',
    heading: 'People also ask',
    lines: ['Is Anubis good or evil?', 'Why does Anubis have a jackal head?', 'Who is the wife of Anubis?', 'What is Anubis the god of?'],
  },
  { id: 'videos', kind: 'videos', heading: 'Videos', lines: ['Anubis explained', 'Tomb of Anubis', 'The weighing of the heart'], meta: ['6:14', '12:03', '3:47'] },
  { id: 'brit', site: 'Britannica', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', tag: REFERENCE },
  {
    id: 'discussions',
    kind: 'discussions',
    heading: 'Discussions and forums',
    lines: ['Why is Anubis always shown as a jackal?', 'Best books on Anubis and the afterlife?'],
    meta: ['Egyptology forum, 38 replies', 'History questions, 12 replies'],
  },
  { id: 'nyt', site: 'The New York Times', url: 'www.nytimes.com › 2026 › 03', icon: ['#ffffff', '#000000', 'T'], title: 'Archaeologists Find a Shrine to Anubis', snippet: 'A newly excavated site near Saqqara suggests Anubis was worshipped there for centuries.', tag: PAYWALL, lowered: true },
  { id: 'images', kind: 'images', heading: 'Images', lines: ['', '', '', '', '', ''] },
  { id: 'whe', site: 'World History Encyclopedia', url: 'www.worldhistory.org › Anubis', icon: ['#8b1c1c', '#ffffff', 'W'], title: 'Anubis - World History Encyclopedia', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.', tag: REFERENCE, raised: true },
];

// After the ranking step: pinned first, then raised, lowered last. The hidden site
// has left the page by then, so its place doesn't matter.
export const SCROLL_RANKED = ['wiki', 'whe', 'fandom', 'brit', 'nyt'];

// In the order the extension names them (CLEANUP in utils/cleanup.ts).
const REMOVED = 'an AI answer, a video panel, a question list, a discussions panel, a news panel, and an image panel';
export const SCROLL_SUMMARY = [
  '',
  '',
  `Anubis removed ${REMOVED}.`,
  `Anubis hid 1 of 5 results. It also removed ${REMOVED}.`,
  `Anubis pinned 1, raised 1, lowered 1, and hid 1 of 5 results. It also removed ${REMOVED}.`,
  `Anubis pinned 1, raised 1, lowered 1, and hid 1 of 5 results. It also removed ${REMOVED}.`,
];

// The steps after the heading; the heading is step 1, the page before Anubis.
// The same in a few words, as the extension says it on phones (shortSummary), with
// Details for the rest.
export const SCROLL_SHORT = [
  '',
  '',
  'Anubis cleaned up the page.',
  'Anubis changed 1 of 5 results and cleaned up the page.',
  'Anubis changed 4 of 5 results and cleaned up the page.',
  'Anubis changed 4 of 5 results and cleaned up the page.',
];

export const SCROLL_STEPS: { title: string; text: string }[] = [
  { title: 'Clutter out', text: 'Anubis strips AI answers, question lists, and the panels in between. You pick which.' },
  { title: 'Done with a site?', text: 'Hide it from the button beside any result. It’s gone from every search after that, and Show hidden brings it back.' },
  { title: 'Your sites first', text: 'Pin or raise the sites you trust. Lower the ones you put up with. The button by each one shows where it stands.' },
  { title: 'Know before you click', text: 'Tags from lists mark reference sites, paywalls, and more. The summary says what changed, and Show hidden undoes it.' },
];

export type HideResult = { id: string; site: string; url: string; icon: [string, string, string]; title: string; snippet: string; chip?: 'tag' | 'raised' };
export const HIDE_RESULTS: HideResult[] = [
  { id: 'wiki', site: 'Wikipedia', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', chip: 'tag' },
  { id: 'fandom', site: 'Fandom', url: 'mythology.fandom.com › wiki › Anubis', icon: ['#fa005a', '#ffffff', 'F'], title: 'Anubis | Mythology Wiki | Fandom', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.' },
  { id: 'whe', site: 'World History Encyclopedia', url: 'www.worldhistory.org › Anubis', icon: ['#8b1c1c', '#ffffff', 'W'], title: 'Anubis - World History Encyclopedia', snippet: 'Anubis is the Egyptian god of mummification and the afterlife, and guardian of the scales.', chip: 'raised' },
  { id: 'brit', site: 'Britannica', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', chip: 'tag' },
];

export type RankResult = { id: string; site: string; host: string; url: string; icon: [string, string, string]; title: string; snippet: string; tag?: [string, string] };
export const RANK_RESULTS: RankResult[] = [
  { id: 'wiki', site: 'Wikipedia', host: 'wikipedia.org', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', tag: ['Reference', '#2b9aa0'] },
  { id: 'pinterest', site: 'Pinterest', host: 'pinterest.com', url: 'www.pinterest.com › ideas › anubis', icon: ['#e60023', '#ffffff', 'P'], title: '500+ Anubis ideas | Egyptian art, Anubis, Egypt', snippet: 'Find and save ideas about Anubis on Pinterest.' },
  { id: 'brit', site: 'Britannica', host: 'britannica.com', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', tag: ['Reference', '#2b9aa0'] },
  { id: 'met', site: 'The Met', host: 'metmuseum.org', url: 'www.metmuseum.org › art › collection', icon: ['#e4002b', '#ffffff', 'M'], title: 'Statuette of Anubis | The Metropolitan Museum of Art', snippet: 'Wood statuette of the jackal-headed god, from the Ptolemaic Period.' },
];

/** The two changes the pointer makes, in turn. */
export const RANK_STEPS: { id: string; level: 'pin' | 'lower'; said: string }[] = [
  { id: 'met', level: 'pin', said: 'Pinned metmuseum.org.' },
  { id: 'pinterest', level: 'lower', said: 'Lowered pinterest.com.' },
];

