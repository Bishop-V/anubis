import { describe, expect, it } from 'vitest';
import { engineFor, isMobileAgent } from '@/utils/engines';

describe('engines', () => {
  it('tells phones from computers by their user agent', () => {
    expect(isMobileAgent('Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0')).toBe(true);
    expect(isMobileAgent('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36')).toBe(true);
    // Tablets get the computer layout.
    expect(isMobileAgent('Mozilla/5.0 (Android 15; Tablet; rv:143.0) Gecko/143.0 Firefox/143.0')).toBe(false);
    expect(isMobileAgent('Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0')).toBe(false);
  });

  it('applies the phone layout only on phones', () => {
    const desktop = engineFor('www.google.com')!;
    const phone = engineFor('www.google.com', true)!;
    expect(desktop.heading).toBe('h3');
    expect(phone.heading).toContain('[role="heading"][aria-level="3"]');
    expect(phone.id).toBe('google');
    expect(desktop.more).toBeDefined();
    expect(phone.more).toBeUndefined();
    // Engines without a phone layout are the same either way.
    expect(engineFor('duckduckgo.com', true)).toBe(engineFor('duckduckgo.com'));
  });
});
