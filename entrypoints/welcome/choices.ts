import { h } from '@/utils/dom';
import { t, type MessageKey } from '@/utils/i18n';
import type { TagAction } from '@/utils/matcher';
import { getSettings, setTagPref, tagPrefsItem, updateSettings } from '@/utils/storage';
import { switchFor } from './extras';

// "Start with these" on the welcome page: choices people often make first, as switches
// that change the real settings straight away (unlike the examples, which save nothing).
// Each is also in Settings: the first in Remove panels, the others in Tags.

interface Choice {
  label: MessageKey;
  hint: MessageKey;
  isOn: () => Promise<boolean>;
  set: (on: boolean) => Promise<unknown>;
}

/** A tag's choice in Settings → Tags: this action when on, Follow the lists when off. */
const tagChoice = (label: MessageKey, hint: MessageKey, tag: string, action: TagAction): Choice => ({
  label,
  hint,
  isOn: async () => (await tagPrefsItem.getValue())[tag]?.action === action,
  set: (on) => setTagPref(tag, { action: on ? action : undefined }),
});

const CHOICES: Choice[] = [
  {
    label: 'welcomeChoiceAi',
    hint: 'welcomeChoiceAiHint',
    isOn: async () => (await getSettings()).cleanup.ai,
    set: (on) => updateSettings((s) => ({ cleanup: { ...s.cleanup, ai: on } })),
  },
  // Tags from the AI content and Paywalls lists, which new installs subscribe to.
  tagChoice('welcomeChoiceAiSites', 'welcomeChoiceAiSitesHint', 'ai-generated', 'hide'),
  tagChoice('welcomeChoicePaywalls', 'welcomeChoicePaywallsHint', 'paywall', 'lower'),
];

export async function renderChoices(box: HTMLElement): Promise<void> {
  const rows = await Promise.all(
    CHOICES.map(async (c) =>
      h(
        'li',
        null,
        h('span', { class: 'name' }, t(c.label)),
        h('span', { class: 'description' }, t(c.hint)),
        switchFor(t(c.label), await c.isOn(), (on) => void c.set(on)),
      ),
    ),
  );
  box.replaceChildren(h('ul', { class: 'switches' }, rows));
}
