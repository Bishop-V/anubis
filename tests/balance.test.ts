import { describe, expect, it } from 'vitest';
import { tiltFor } from '@/utils/balance';

describe('tiltFor', () => {
  it('tips further the more places a site moves, short of a pin or a hide', () => {
    expect(tiltFor('normal')).toBe(0);
    expect(tiltFor('raise', 5)).toBeCloseTo(6);
    expect(tiltFor('raise', 10)).toBeGreaterThan(tiltFor('raise', 5));
    expect(tiltFor('raise', 15)).toBeGreaterThan(tiltFor('raise', 10));
    expect(tiltFor('lower', -10)).toBeCloseTo(-tiltFor('raise', 10));
    expect(tiltFor('raise', 1000)).toBeLessThan(tiltFor('pin', 1000));
    expect(tiltFor('lower', -1000)).toBeGreaterThan(tiltFor('hide'));
    // A ranking with no score, such as one you just pressed, tips by its level.
    expect(tiltFor('raise')).toBe(6);
  });
});
