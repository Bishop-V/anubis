import { describe, expect, it } from 'vitest';
import { ruleParts } from '@/utils/ruletext';

const join = (raw: string) =>
  ruleParts(raw)
    .map((p) => p.key + p.value)
    .join(',');

describe('rule parts for the result menu', () => {
  it('splits a rule into its options, each with its name and value', () => {
    expect(ruleParts('$site=javascript.info,boost=5,tag=tutorial')).toEqual([
      { key: '$site=', value: 'javascript.info' },
      { key: 'boost=', value: '5', effect: 'raise' },
      { key: 'tag=', value: 'tutorial' },
    ]);
  });

  it('marks what an option does to the ranking', () => {
    expect(ruleParts('$boost,site=a.org')[0]).toEqual({ key: '', value: '$boost', effect: 'raise' });
    expect(ruleParts('$pin,site=a.org')[0]!.effect).toBe('raise');
    expect(ruleParts('$downrank=2,site=a.org')[0]!.effect).toBe('lower');
    expect(ruleParts('$discard,site=a.org')[0]!.effect).toBe('hide');
    expect(ruleParts('$boost=0,site=a.org')[0]!.effect).toBeUndefined();
  });

  it('gives back the rule exactly, whatever its format', () => {
    for (const raw of [
      '$site=javascript.info,boost=5,tag=tutorial',
      '*://*.example.com/*',
      '/^https?:\\/\\/(www\\.)?a{1,3}\\.com/',
      'example.com',
      '$discard,site=pinterest.com',
      ',,',
    ]) {
      expect(join(raw)).toBe(raw);
    }
  });
});
