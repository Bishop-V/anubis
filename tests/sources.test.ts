import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error: the update scripts are plain JavaScript.
import { body, fromMatchPattern, hugeAi, indieWikis, render } from '../.github/scripts/sources/convert.mjs';
import { parseList } from '@/utils/listformat';
import { compileList, evaluate } from '@/utils/matcher';
import { BUNDLED_DIRECTORY, defaultSubscriptions, reportTracker, subscriptionId } from '@/utils/subscriptions';

const MIT = 'MIT License\n\nCopyright (c) 2026 Someone\n\nPermission is hereby granted, free of charge: to deal in the Software.';

const MAIN = `# A greeting from the maintainer
#//// Sites hosting nothing but AI generated content
# Sites that have .ai domain extension
*://*.forkful.ai/*
*://*.example.com/*
# Block list of AI "artists"/orgs (youtube)
*://*.youtube.com/@someone/*
# // AI content farms/spam
*://*.farm.net/*
# // Non-Conflicting Regular Expressions
/pinterest.+\\/someone/
*://*.artbreeder/*
`;
const NUCLEAR = `# //// Going NUCLEAR!!!
*://*.deviantart.com/*
*://*.example.com/*
*://*.reddit.com/r/AIArt/*
`;

describe('lists made from other projects', () => {
  const files = readdirSync('lists/sources').filter((f) => f.endsWith('.anubis'));

  it.each(files)('%s parses cleanly, credits its source, and sends reports there', (file) => {
    const list = parseList(readFileSync(`lists/sources/${file}`, 'utf8'));
    expect(list.errors).toEqual([]);
    expect(list.format).toBe('anubis');
    expect(list.meta.name).toBeTruthy();
    expect(list.meta.author).toBeTruthy();
    expect(list.meta.license).toBeTruthy();
    // Additions and mistakes go to the project the data comes from, not to Anubis.
    expect(list.meta.homepage).toMatch(/^https:\/\/github\.com\//);
    expect(list.meta.homepage).not.toContain('Bishop-V/anubis');
    // No `! issues:`: that would offer "Suggest it to…", which the sources never asked for.
    // Reports of mistakes still reach them, through the homepage's repository.
    expect(list.meta.issues).toBeUndefined();
    expect(reportTracker('https://raw.githubusercontent.com/Bishop-V/anubis/main/lists/sources/x', list.meta)).toBe(`${list.meta.homepage}/issues`);
    expect(list.rules.length).toBeGreaterThan(100);
    for (const tag of list.tags) expect(tag.label).not.toBe(tag.id);
    for (const rule of list.rules) expect(rule.tags.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is in the directory, on by default, with its source as the homepage', (file) => {
    const id = file.replace(/\.anubis$/, '');
    const list = parseList(readFileSync(`lists/sources/${file}`, 'utf8'));
    expect(BUNDLED_DIRECTORY.find((e) => e.id === id)).toMatchObject({
      url: `https://raw.githubusercontent.com/Bishop-V/anubis/main/lists/sources/${file}`,
      homepage: list.meta.homepage,
      default: true,
    });
  });

  it('only labels AI content, never moving or hiding it', () => {
    const list = parseList(readFileSync('lists/sources/ai-content.anubis', 'utf8'));
    for (const rule of list.rules) expect({ boost: rule.boost, discard: rule.discard }).toEqual({ boost: 0, discard: false });
  });
});

describe('default subscriptions', () => {
  it('subscribes to lists that are not bundled by their address, without calling them bundled', () => {
    const subs = defaultSubscriptions();
    const entry = BUNDLED_DIRECTORY.find((e) => e.id === 'ai-content')!;
    expect(subs.find((s) => s.url === entry.url)).toMatchObject({ id: subscriptionId(entry.url), enabled: true });
    expect(subs.find((s) => s.url === entry.url)).not.toHaveProperty('builtin');
    expect(subs.find((s) => s.id === 'builtin:paywalls')).toMatchObject({ builtin: true });
  });
});

describe('fromMatchPattern', () => {
  it('turns whole sites and paths into Anubis instructions', () => {
    expect(fromMatchPattern('*://*.example.com/*')).toEqual({ site: 'example.com' });
    expect(fromMatchPattern('*://www.example.com/*')).toEqual({ site: 'example.com' });
    // A trailing slash also matches the page itself: /@name as well as /@name/videos.
    expect(fromMatchPattern('*://*.youtube.com/@name/*')).toEqual({ site: 'youtube.com', path: '/@name^' });
    expect(fromMatchPattern('*://*.example.com/a*b/*')).toEqual({ site: 'example.com', path: '/a*b^' });
  });

  it('skips what Anubis instructions cannot express', () => {
    expect(fromMatchPattern('/regex/')).toHaveProperty('skip');
    expect(fromMatchPattern('*://*.artbreeder/*')).toHaveProperty('skip');
    expect(fromMatchPattern('*://*.example.com/a$b/*')).toHaveProperty('skip');
  });
});

describe('hugeAi', () => {
  const list = hugeAi({ main: MAIN, nuclear: NUCLEAR, commit: 'abc123', date: '2026-10-08' });
  const text = render(list);
  const parsed = parseList(text);

  it('labels the main list AI-generated, the nuclear list Some AI content, and content farms AI slop', () => {
    expect(list.rules.map((r: { instruction: string }) => r.instruction).sort()).toEqual([
      '$site=deviantart.com,tag=ai-mixed',
      '$site=example.com,tag=ai-generated',
      '$site=farm.net,tag=ai-generated,tag=ai-slop',
      '$site=forkful.ai,tag=ai-generated',
      '/@someone^$site=youtube.com,tag=ai-generated',
      '/r/AIArt^$site=reddit.com,tag=ai-mixed',
    ]);
    expect(parsed.tags.map((t) => [t.id, t.label])).toEqual([
      ['ai-generated', 'AI-generated'],
      ['ai-mixed', 'Some AI content'],
      ['ai-slop', 'AI slop'],
    ]);
  });

  it('shares the AI slop tag with the FOSS tools list', () => {
    const foss = parseList(readFileSync('lists/foss-tools.anubis', 'utf8')).tags.find((t) => t.id === 'ai-slop');
    expect(parsed.tags.find((t) => t.id === 'ai-slop')).toEqual(foss);
  });

  it('counts what it left out', () => {
    expect(list.skipped).toHaveLength(2);
  });

  it('credits the source and its commit, and parses cleanly', () => {
    expect(parsed.errors).toEqual([]);
    expect(parsed.meta).toMatchObject({ license: 'CC0-1.0', version: '2026-10-08', expiresHours: 168 });
    expect(text).toContain('commit abc123');
    expect(text).toContain('https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist');
  });

  it('matches a channel page with or without a trailing path', () => {
    const compiled = compileList('ai', parsed, false, 'AI content (HUGE AI Blocklist)');
    expect(evaluate({ url: 'https://www.youtube.com/@someone', title: '' }, [compiled]).tags).toContain('ai-generated');
    expect(evaluate({ url: 'https://www.youtube.com/@someone/videos', title: '' }, [compiled]).tags).toContain('ai-generated');
    expect(evaluate({ url: 'https://www.youtube.com/@someoneelse', title: '' }, [compiled]).tags).toEqual([]);
  });
});

describe('indieWikis', () => {
  const data = {
    commit: 'def456',
    generated: '2026-09-25T16:06:57+00:00',
    sites: [
      {
        id: 'en-minecraft',
        origins: [{ origin_base_url: 'minecraft.fandom.com' }],
        destination: 'Minecraft Wiki',
        destination_base_url: 'minecraft.wiki',
        tags: ['official'],
      },
      {
        id: 'de-animalcrossing',
        origins: [{ origin_base_url: 'animalcrossing.fandom.com/de' }],
        destination: 'Animal Crossing Wiki',
        destination_base_url: 'animalcrossingwiki.de',
      },
      {
        id: 'de-ark',
        origins: [{ origin_base_url: 'ark.fandom.com/de' }],
        destination: 'ARK Wiki',
        destination_base_url: 'ark.wiki.gg/de',
      },
      {
        id: 'en-ark',
        origins: [{ origin_base_url: 'ark.fandom.com' }, { origin_base_url: 'ark.fextralife.com' }],
        destination: 'ARK Wiki',
        destination_base_url: 'ark.wiki.gg',
      },
    ],
  };
  const list = indieWikis(data, { commit: 'def456', licence: MIT });
  const text = render(list);
  const parsed = parseList(text);

  it('lowers the wikis that have an independent one, saying where, and raises the independent ones', () => {
    expect(text).toContain('$site=minecraft.fandom.com,tag=independent-elsewhere,downrank=3 # Minecraft Wiki, the official wiki, is at minecraft.wiki.');
    expect(text).toContain('$site=minecraft.wiki,tag=independent-wiki,boost=3 # Minecraft Wiki, the official wiki.');
    expect(text).toContain('/de/$site=animalcrossing.fandom.com,tag=independent-elsewhere,downrank=3 # Animal Crossing Wiki is at animalcrossingwiki.de.');
    expect(text).toContain('$site=ark.fextralife.com,tag=independent-elsewhere,downrank=3');
    // ark.fandom.com and ark.wiki.gg are weighed as a whole, so their /de/ rules would only repeat that.
    expect(text).not.toContain('/de/$site=ark.');
  });

  it('carries the licence and parses cleanly, without reading the licence as settings', () => {
    expect(parsed.errors).toEqual([]);
    expect(text).toContain('! Copyright (c) 2026 Someone');
    expect(parsed.meta).toMatchObject({
      name: 'Independent wikis (Indie Wiki Buddy)',
      license: 'MIT',
      version: '2026-09-25',
      homepage: 'https://github.com/KevinPayravi/indie-wiki-buddy',
    });
  });

  it('moves a Fandom result below its independent wiki', () => {
    const compiled = compileList('wikis', parsed, false, 'Independent wikis (Indie Wiki Buddy)');
    const fandom = evaluate({ url: 'https://minecraft.fandom.com/wiki/Creeper', title: '' }, [compiled]);
    const independent = evaluate({ url: 'https://minecraft.wiki/w/Creeper', title: '' }, [compiled]);
    expect(fandom).toMatchObject({ score: -3, tags: ['independent-elsewhere'] });
    expect(independent).toMatchObject({ score: 3, tags: ['independent-wiki'] });
  });
});

describe('render and body', () => {
  it('sorts rules, so a weekly diff shows only what changed', () => {
    const text = render({ header: ['! name: x'], rules: [{ instruction: '$site=b.com,tag=t' }, { instruction: '$site=a.com,tag=t', comment: 'Why.' }], skipped: [] });
    expect(text).toBe('! name: x\n\n$site=a.com,tag=t # Why.\n$site=b.com,tag=t\n');
    expect(body(text)).toBe('$site=a.com,tag=t # Why.\n$site=b.com,tag=t');
    expect(body(text.replace('! name: x', '! name: x\n! version: new'))).toBe(body(text));
  });
});
