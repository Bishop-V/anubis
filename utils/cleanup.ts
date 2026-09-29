// Clean-up: parts of search pages that aren't results (AI answers, video and news
// panels, question lists) and that people may want gone on every search.
//
// Blocks are recognised by their visible heading ("AI Overview", "Videos",
// "People also ask"), which engines change far less often than class names, plus
// a few selectors where a heading isn't enough. Keep this file free of browser
// APIs: the options page and the content script both use it.

import { tJoin, tn, type PluralKey } from './i18n';

export type CleanupKind = 'ai' | 'videos' | 'questions' | 'discussions' | 'news' | 'images' | 'related' | 'elsewhere';

export type Cleanup = Record<CleanupKind, boolean>;

export const NO_CLEANUP: Cleanup = { ai: false, videos: false, questions: false, discussions: false, news: false, images: false, related: false, elsewhere: false };

export interface CleanupDef {
  id: CleanupKind;
  label: string;
  hint: string;
  /** Heading texts, matched whole and ignoring case. English first, then common translations. */
  headings: string[];
  /** Heading texts that start with these, e.g. "Images for anubis". */
  prefixes?: string[];
  /** Other text only this kind of block has, matched at its start, like an AI disclaimer. */
  markers?: string[];
}

export const CLEANUP: CleanupDef[] = [
  {
    id: 'ai',
    label: 'AI answers',
    hint: 'Google’s AI Overview and AI Mode tab, DuckDuckGo’s AI-assisted answers and Duck.ai, and Brave’s AI answers.',
    headings: [
      'AI Overview',
      'AI Overviews',
      'Search Assist',
      'AI-assisted answer',
      'Copilot',
      'Copilot Search',
      'Copilot Answer',
      'AI Answer',
      'Answer with AI',
      'Aperçu IA',
      'Aperçus IA',
      'Übersicht mit KI',
      'Resumen creado con IA',
      'Visión general creada por IA',
      'Visão geral criada por IA',
      'Panoramica creata con l’IA',
      'Overzicht met AI',
    ],
    markers: ['AI responses may include mistakes', 'AI-generated answer', 'Generated with AI'],
  },
  {
    id: 'videos',
    label: 'Video panels',
    hint: 'Video and short-video panels between the results.',
    headings: ['Videos', 'Short videos', 'Vidéos', 'Vidéos courtes', 'Kurze Videos', 'Vídeos', 'Vídeos cortos', 'Video', 'Video brevi'],
  },
  {
    id: 'questions',
    label: 'People also ask',
    hint: 'Lists of other people’s questions with expandable answers.',
    headings: [
      'People also ask',
      'Related questions',
      'Others want to know',
      'Autres questions posées',
      'Ähnliche Fragen',
      'Andere Nutzer fragen auch',
      'Más preguntas',
      'Otras preguntas de los usuarios',
      'As pessoas também perguntam',
      'Altre domande',
      'Mensen vragen ook',
    ],
  },
  {
    id: 'discussions',
    label: 'Discussion panels',
    hint: 'Panels of forum threads between the results, like Google’s “Discussions and forums”. Forum pages among the results stay.',
    headings: ['Discussions and forums', 'Discussions'],
  },
  {
    id: 'news',
    label: 'Top stories',
    hint: 'News panels between the results.',
    headings: ['Top stories', 'News', 'Latest news', 'À la une', 'Schlagzeilen', 'Noticias destacadas', 'Principais notícias', 'Notizie principali', 'Topverhalen'],
  },
  {
    id: 'images',
    label: 'Image rows',
    hint: 'Rows of images between the results. The Images tab still works.',
    headings: ['Images', 'Bilder', 'Imágenes', 'Imagens', 'Immagini', 'Afbeeldingen'],
    prefixes: ['Images for ', 'Images de ', 'Bilder zu ', 'Imágenes de '],
  },
  {
    id: 'related',
    label: 'Related searches',
    hint: 'Lists of other searches, usually at the bottom of the page.',
    headings: [
      'Related searches',
      'Related queries',
      'People also search for',
      'Recherches associées',
      'Ähnliche Suchanfragen',
      'Búsquedas relacionadas',
      'Pesquisas relacionadas',
      'Ricerche correlate',
      'Gerelateerde zoekopdrachten',
    ],
    prefixes: ['Searches related to '],
  },
  {
    id: 'elsewhere',
    label: 'Other search engines',
    hint: 'Rows of buttons that repeat your search on another engine, like Brave’s “Find elsewhere”.',
    headings: ['Find elsewhere', 'Search elsewhere'],
  },
];

/**
 * Tabs, links, and buttons that open an engine's AI chat: Google's AI Mode,
 * DuckDuckGo's Duck.ai. They go with AI answers but aren't counted, since they
 * aren't content. Found by their whole text, title, or label, or by selectors
 * from EasyList's AI list where there may be no label.
 */
export const AI_ENTRY_POINTS: Record<string, { labels: RegExp; selector?: string }> = {
  google: { labels: /^AI Mode$/i },
  duckduckgo: {
    labels: /^((Ask )?Duck\.ai|Search Assist)$/i,
    selector: 'a[href*="ia=chat"], [data-testid="aichat-button"], [data-ssg-id="ai-searchbox-chat-submit"], [data-ssg-id="ask-duck-ai-submit"]',
  },
};

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();

const EXACT = new Map<string, CleanupKind>();
for (const def of CLEANUP) for (const text of def.headings) EXACT.set(normalize(text), def.id);

/** Which kind of block a heading with this text starts, if any. */
export function cleanupKindFor(text: string): CleanupKind | undefined {
  const t = normalize(text);
  if (!t || t.length > 80) return undefined;
  const exact = EXACT.get(t);
  if (exact) return exact;
  for (const def of CLEANUP) if (def.prefixes?.some((p) => t.startsWith(normalize(p)))) return def.id;
  return undefined;
}

const MARKERS: [string, CleanupKind][] = CLEANUP.flatMap((def) => (def.markers ?? []).map((m): [string, CleanupKind] => [normalize(m), def.id]));

/** Which kind of block a piece of text inside it gives away, like an AI disclaimer. */
export function cleanupMarkerFor(text: string): CleanupKind | undefined {
  const t = normalize(text);
  if (!t || t.length > 200) return undefined;
  return MARKERS.find(([m]) => t.startsWith(m))?.[1];
}

/** For the summary: "an AI answer", "2 video panels". */
const REMOVED = {
  ai: 'summaryRemovedAi',
  videos: 'summaryRemovedVideos',
  questions: 'summaryRemovedQuestions',
  discussions: 'summaryRemovedDiscussions',
  news: 'summaryRemovedNews',
  images: 'summaryRemovedImages',
  related: 'summaryRemovedRelated',
  elsewhere: 'summaryRemovedElsewhere',
} as const satisfies Record<CleanupKind, PluralKey>;

/** "an AI answer and 2 video panels", or '' when nothing was removed. */
export function describeRemoved(removed: Partial<Record<CleanupKind, number>>): string {
  const parts = CLEANUP.filter((def) => removed[def.id]).map((def) => tn(REMOVED[def.id], removed[def.id]!));
  return parts.length ? tJoin(parts) : '';
}
