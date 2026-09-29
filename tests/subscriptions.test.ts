import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchText } from '@/utils/subscriptions';

const MB = 1024 * 1024;

/** A response that streams `chunks` and counts how many were read. */
function streamed(chunks: number, chunkSize: number, headers: HeadersInit = {}) {
  let pulled = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulled === chunks) return controller.close();
      pulled++;
      controller.enqueue(new Uint8Array(chunkSize).fill(0x61));
    },
  });
  return { response: new Response(body, { headers }), pulled: () => pulled };
}

describe('downloading lists', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads a list', async () => {
    vi.stubGlobal('fetch', async () => new Response('example.com\n'));
    expect(await fetchText('https://example.org/list.txt')).toBe('example.com\n');
  });

  it('refuses a list that says it is over 5 MB without reading it', async () => {
    const { response, pulled } = streamed(10, MB, { 'content-length': String(10 * MB) });
    vi.stubGlobal('fetch', async () => response);
    await expect(fetchText('https://example.org/big.txt')).rejects.toThrow('larger than 5 MB');
    expect(pulled()).toBeLessThanOrEqual(1);
  });

  it('stops reading a list once it passes 5 MB', async () => {
    const { response, pulled } = streamed(100, MB);
    vi.stubGlobal('fetch', async () => response);
    await expect(fetchText('https://example.org/big.txt')).rejects.toThrow('larger than 5 MB');
    expect(pulled()).toBeLessThan(10);
  });

  it('says when it got a web page', async () => {
    vi.stubGlobal('fetch', async () => new Response('<!DOCTYPE html><html></html>'));
    await expect(fetchText('https://example.org/')).rejects.toThrow('web page');
  });
});
