import { t } from './i18n';
import { guide } from './links';

/** A page of the wiki, in the interface's language when the wiki has it (`guide` in links.ts). */
export const wiki = (path = ''): string => guide(path, t('langCode'));
