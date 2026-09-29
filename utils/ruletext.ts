// A list rule broken into its options for display in the result menu, so it wraps
// after a comma instead of inside a word, and each option's name, value, and effect
// can be told apart. Joining every part's key and value, with commas between, gives
// back the rule exactly.

export interface RulePart {
  /** The option's name with its "=" ("$site=", "boost="), or "" for a bare value or flag. */
  key: string;
  value: string;
  /** What the option does to the ranking, when it does something. */
  effect?: 'raise' | 'lower' | 'hide';
}

function effectOf(name: string, value: string | undefined): RulePart['effect'] {
  switch (name.toLowerCase()) {
    case 'boost':
      return value === undefined || Number(value) > 0 ? 'raise' : undefined;
    case 'pin':
      return 'raise';
    case 'downrank':
      return 'lower';
    case 'discard':
      return 'hide';
    default:
      return undefined;
  }
}

export function ruleParts(raw: string): RulePart[] {
  return raw.split(',').map((segment) => {
    const m = /^(\$?)([a-z][\w-]*)(?:(=)(.*))?$/i.exec(segment);
    if (!m) return { key: '', value: segment };
    const [, dollar = '', name = '', eq, value] = m;
    const effect = effectOf(name, eq ? value : undefined);
    const part: RulePart = eq ? { key: `${dollar}${name}=`, value: value ?? '' } : { key: '', value: segment };
    if (effect) part.effect = effect;
    return part;
  });
}
