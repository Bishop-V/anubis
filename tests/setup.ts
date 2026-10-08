import { installEnglish } from './english';

// Modules that translate as they load (labels, the personal list's name) need the
// English messages before any test imports them.
installEnglish();
