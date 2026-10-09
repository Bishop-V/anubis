import { h } from './dom';
import { gap, t } from './i18n';
import { guide } from './links';

// Every language but English is a machine translation, not checked by people who
// speak it. Anubis's own pages say so wherever they show one (docs/guide/translate.md).

/** Whether the interface is in a machine translation: any language but English, for now. */
export function machineTranslated(): boolean {
  return t('langCode') !== 'en';
}

/**
 * A note that the interface is machine translated and to use it with caution, with a
 * link to correct it. `short` for the toolbar popup. Nothing in English.
 */
export function machineTranslationNote(short = false): HTMLElement | null {
  if (!machineTranslated()) return null;
  return h(
    'aside',
    { class: `machine-note${short ? ' short' : ''}`, attrs: { role: 'note' } },
    h('b', null, t('machineTranslatedTitle')),
    gap(),
    short ? t('machineTranslatedShort') : t('machineTranslatedNote'),
    gap(),
    h('a', { href: guide('guide/translate'), target: '_blank', rel: 'noopener noreferrer' }, t('machineTranslatedHelp')),
  );
}
