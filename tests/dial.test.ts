import { describe, expect, it } from 'vitest';
import { dialGeometry, dialReading, dialSvg, GAUGE_SVG } from '@/utils/dial';

describe('dialReading', () => {
  it('fills up for a raise and down for a lower, further the more places a site moves', () => {
    expect(dialReading('normal')).toEqual({ up: 0, down: 0, full: false });
    expect(dialReading('raise', 5).up).toBeCloseTo(0.5);
    expect(dialReading('lower', -5)).toEqual({ up: 0, down: dialReading('raise', 5).up, full: false });
    expect(dialReading('raise', 10).up).toBeGreaterThan(dialReading('raise', 5).up);
    expect(dialReading('raise', 1000).up).toBeLessThanOrEqual(1);
    // A small move still shows, and a ranking with no score, such as one you just pressed, fills half.
    expect(dialReading('raise', 1).up).toBeGreaterThanOrEqual(0.12);
    expect(dialReading('lower').down).toBe(0.5);
  });

  it('fills all of the scale for a pin, and none of it for a hide', () => {
    expect(dialReading('pin', 3)).toEqual({ up: 0, down: 0, full: true });
    expect(dialReading('hide', -20)).toEqual({ up: 0, down: 0, full: false });
  });
});

describe('dialGeometry', () => {
  it('sizes the ring to the icon, within limits', () => {
    expect(dialGeometry(16).r).toBe(14);
    expect(dialGeometry(4).r).toBe(dialGeometry(12).r);
    expect(dialGeometry(200).r).toBe(dialGeometry(40).r);
    expect(dialGeometry(16).quarter).toBeCloseTo((Math.PI * 14) / 2);
  });

  it('keeps the crown and guards inside the drawing, left of the icon', () => {
    const g = dialGeometry(16);
    expect(g.left).toBeLessThan(-g.guard);
    expect(g.top).toBeLessThan(-g.guard);
    expect(g.bottom).toBeGreaterThan(g.guard);
    expect(g.right).toBeLessThan(16 / 2);
  });
});

describe('the drawings', () => {
  it('have every part the reading and the stylesheet use', () => {
    for (const svg of [dialSvg(dialGeometry(16)), GAUGE_SVG]) {
      for (const part of ['class="crown"', 'class="track"', 'class="fill pin"', 'class="fill up"', 'class="fill down"']) expect(svg).toContain(part);
      expect(svg).toContain('aria-hidden="true"');
    }
    expect(dialSvg(dialGeometry(16), true)).toContain('class="blank"');
    expect(dialSvg(dialGeometry(16))).not.toContain('class="blank"');
  });
});
