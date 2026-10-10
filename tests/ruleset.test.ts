import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { loadRuleSet } from '@/utils/ruleset';
import { listCacheItem, subscriptionsItem } from '@/utils/storage';

beforeEach(() => fakeBrowser.reset());

describe('rule set', () => {
  const sub = { id: 'test', url: 'https://example.org/test.anubis', enabled: true, addedAt: 0 };

  it('compiles a subscribed list again only when its text changes', async () => {
    await subscriptionsItem.setValue([sub]);
    await listCacheItem.setValue({ test: { text: '! name: Test\n$site=a.com$hide', fetchedAt: 1 } });
    const first = (await loadRuleSet()).lists.find((l) => l.id === 'test')!;
    expect(first.name).toBe('Test');
    // A change elsewhere, like the personal list, reuses it.
    expect((await loadRuleSet()).lists.find((l) => l.id === 'test')).toBe(first);

    await listCacheItem.setValue({ test: { text: '! name: Test 2\n$site=a.com$hide', fetchedAt: 2 } });
    const second = (await loadRuleSet()).lists.find((l) => l.id === 'test')!;
    expect(second).not.toBe(first);
    expect(second.name).toBe('Test 2');
  });

  it('drops a list that was turned off', async () => {
    await subscriptionsItem.setValue([sub]);
    await listCacheItem.setValue({ test: { text: '$site=a.com$hide', fetchedAt: 1 } });
    expect((await loadRuleSet()).lists.some((l) => l.id === 'test')).toBe(true);
    await subscriptionsItem.setValue([{ ...sub, enabled: false }]);
    expect((await loadRuleSet()).lists.some((l) => l.id === 'test')).toBe(false);
  });
});
