// Inline SVG icons, so no image files or extra requests are needed. All use
// currentColor and a 16×16 grid.

const svg = (body: string, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;

/** The Anubis head from public/anubis.svg, filled. */
export const ICON_ANUBIS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="26 14 82 108" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M39.5 19 L55 48 L101 63 Q105 66 100.5 70 L79 72.5 Q63 76 62 88 L62 97 L32 97 Z"/><path fill="currentColor" d="M31 105 L63 105 L65 118 L30 118 Z"/><ellipse cx="67" cy="58" rx="4.2" ry="2.7" transform="rotate(18 67 58)" fill="var(--anubis-eye, #1b1a16)"/></svg>`;

export const ICON_HIDE = svg(
  '<path d="M2 8s2.2-4.5 6-4.5c1.3 0 2.4.5 3.3 1.1M14 8s-2.2 4.5-6 4.5c-1.3 0-2.4-.5-3.3-1.1"/><path d="M2.5 13.5l11-11"/>',
);
export const ICON_LOWER = svg('<path d="M4 6.5l4 4 4-4"/>');
export const ICON_RAISE = svg('<path d="M4 9.5l4-4 4 4"/>');
/** Ma'at's feather: the neutral weight. */
export const ICON_FEATHER = svg('<path d="M13 3C7.5 3.5 4.5 7 4 13"/><path d="M13 3c.3 4.5-2.8 8-7.2 8.6M7.5 8.5l3-.5M6 11l3.5-.4"/>');
export const ICON_PIN = svg('<path d="M9.8 2.2l4 4-1.6.5-2.6 2.6.3 3.1-1.2 1.2L5.4 10.3 2.2 13.8M5.4 10.3L2.3 7.2l1.2-1.2 3.1.3 2.6-2.6z"/>');
export const ICON_CLOSE = svg('<path d="M4 4l8 8M12 4l-8 8"/>');
export const ICON_EXTERNAL = svg('<path d="M9 3h4v4M13 3L7.5 8.5M11.5 9.5V13H3V4.5h3.5"/>');
/**
 * Settings: a toothed cog, so it can't be read as a sun. Lucide's "settings" icon
 * (lucide.dev), on its own 24-unit grid.
 *
 * Copyright (c) 2026 Lucide Icons and Contributors. ISC License: permission to use,
 * copy, modify, and/or distribute this software for any purpose with or without fee
 * is hereby granted, provided that the above copyright notice and this permission
 * notice appear in all copies. The full notice, with its warranty disclaimer, is in
 * public/THIRD_PARTY_NOTICES.txt, which ships with the extension.
 */
export const ICON_GEAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;

/** The button on each result: move this site up or down (or out). */
export const ICON_RANK = svg('<path d="M5 13V3M2.5 5.5L5 3l2.5 2.5M11 3v10M8.5 10.5L11 13l2.5-2.5"/>');
export const ICON_SUN = svg(
  '<circle cx="8" cy="8" r="2.8"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/>',
);
export const ICON_MOON = svg('<path d="M13.2 10.2A5.5 5.5 0 015.8 2.8a5.5 5.5 0 107.4 7.4z"/>');
export const ICON_AUTO = svg('<circle cx="8" cy="8" r="5.5"/><path d="M8 2.5v11" /><path d="M8 2.5a5.5 5.5 0 010 11z" fill="currentColor"/>');
export const ICON_REFRESH = svg('<path d="M13 3.5v3h-3"/><path d="M12.6 6.5A5 5 0 103 9.5"/>');
export const ICON_TRASH = svg('<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/>');

export const ICON_SHARE = svg('<path d="M8 10V2.5M5 5.5l3-3 3 3"/><path d="M3.5 9v4h9V9"/>');
export const ICON_DOWNLOAD = svg('<path d="M8 2.5V10M5 7l3 3 3-3"/><path d="M3.5 10.5V13h9v-2.5"/>');
export const ICON_EDIT = svg('<path d="M10.5 2.8l2.7 2.7-7.4 7.4H3.1v-2.7z"/>');

export const LEVEL_ICONS = {
  hide: ICON_HIDE,
  lower: ICON_LOWER,
  normal: ICON_FEATHER,
  raise: ICON_RAISE,
  pin: ICON_PIN,
} as const;

export const LEVEL_LABELS = {
  hide: 'Hide',
  lower: 'Lower',
  normal: 'Normal',
  raise: 'Raise',
  pin: 'Pin',
} as const;

/** Short past-tense labels for verdict chips. */
export const LEVEL_CHIPS = {
  hide: 'Hidden',
  lower: 'Lowered',
  normal: '',
  raise: 'Raised',
  pin: 'Pinned',
} as const;
