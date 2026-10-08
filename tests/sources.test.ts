import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error: the update scripts are plain JavaScript.
import { awesomeSelfhosted, body, devDocs, docsTarget, freeLicences, fromMatchPattern, hugeAi, indieWikis, listSites, projectTarget, render } from '../.github/scripts/sources/convert.mjs';
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

describe('devDocs', () => {
  const files = [
    { path: 'lib/docs/scrapers/react.rb', text: "class React < UrlScraper\n  self.name = 'React'\n  version do\n    self.base_url = 'https://react.dev'\n  end\n  version '18' do\n    self.base_url = 'https://18.react.dev'\n  end\n" },
    { path: 'lib/docs/scrapers/prettier.rb', text: "class Prettier < UrlScraper\n  self.base_url = 'https://prettier.io/docs/'\n" },
    { path: 'lib/docs/scrapers/flask.rb', text: 'class Flask < UrlScraper\n  self.base_url = "https://flask.palletsprojects.com/en/#{self.release}/"\n' },
    { path: 'lib/docs/scrapers/koa.rb', text: "class Koa < UrlScraper\n  self.base_url = 'https://github.com/koajs/koa/blob/v3.0.0/docs'\n" },
    { path: 'lib/docs/scrapers/k8s.rb', text: 'class Kubernetes < UrlScraper\n  self.base_url = "https://v#{version.sub(".", "-")}.docs.kubernetes.io/"\n' },
    { path: 'lib/docs/scrapers/python.rb', text: "class Python < FileScraper\n  self.base_url = 'https://docs.python.org/3.13/library/'\n" },
  ];
  const list = devDocs(files, { commit: 'fed789' });
  const text = render(list);
  const parsed = parseList(text);

  it('tags where each scraper reads its docs, once per site', () => {
    expect(list.rules.map((r: { instruction: string }) => r.instruction).sort()).toEqual([
      '$site=docs.python.org,tag=docs,boost=1',
      '$site=flask.palletsprojects.com,tag=docs,boost=1',
      '$site=react.dev,tag=docs,boost=1',
      '/docs^$site=prettier.io,tag=docs,boost=1',
    ]);
    expect(text).toContain('# DevDocs collects the docs for React here.');
    // Named after the class when the scraper doesn't set a name.
    expect(text).toContain('# DevDocs collects the docs for Prettier here.');
  });

  it('leaves out shared hosts and addresses worked out at run time', () => {
    expect(list.skipped).toHaveLength(2);
  });

  it('reads a docs address as a whole docs site, or as a path on a main site', () => {
    expect(docsTarget('https://docs.deno.com/api/')).toEqual({ site: 'docs.deno.com' });
    expect(docsTarget('https://mariadb.com/kb/en/')).toEqual({ site: 'mariadb.com', path: '/kb^' });
    expect(docsTarget('https://www.tcl-lang.org/man/tcl#{self.version}/')).toEqual({ site: 'tcl-lang.org', path: '/man^' });
    expect(docsTarget('https://sinonjs.org/releases/v#{ver}/')).toEqual({ site: 'sinonjs.org', path: '/releases^' });
    // `#{…}` is a version DevDocs fills in, not the start of a fragment.
    expect(docsTarget('https://date-fns.org/v#{self.release}/docs/')).toEqual({ site: 'date-fns.org' });
    expect(docsTarget('https://downloads.haskell.org/~ghc/#{release}/docs/')).toEqual({ site: 'downloads.haskell.org', path: '/~ghc^' });
    expect(docsTarget('https://developer.mozilla.org/en-US/docs/Web/API')).toEqual({ site: 'developer.mozilla.org' });
    expect(docsTarget('https://underscorejs.org')).toEqual({ site: 'underscorejs.org' });
    expect(docsTarget('https://daringfireball.net/projects/markdown/syntax')).toEqual({ site: 'daringfireball.net', path: '/projects^' });
    expect(docsTarget('http://localhost:8000/docs/')).toBeUndefined();
    expect(docsTarget('https://github.com/d3/')).toBeUndefined();
  });

  it('matches a docs path with or without its trailing slash', () => {
    const compiled = compileList('devdocs', parsed, false, 'Official docs (DevDocs)');
    expect(evaluate({ url: 'https://prettier.io/docs', title: '' }, [compiled]).tags).toEqual(['docs']);
    expect(evaluate({ url: 'https://prettier.io/docs/options', title: '' }, [compiled]).tags).toEqual(['docs']);
    expect(evaluate({ url: 'https://prettier.io/blog/', title: '' }, [compiled]).tags).toEqual([]);
  });

  it('shares the Official docs tag with the bundled list, which keeps none of its sites', () => {
    const official = readFileSync('lists/official-docs.anubis', 'utf8');
    const tag = parseList(official).tags.find((t) => t.id === 'docs');
    expect(parsed.tags).toEqual([tag]);
    // The source replaces the bundled list's entries, so no site is raised twice. When
    // a weekly update brings in a site the bundled list has, remove it from the bundled list.
    const generated = parseList(readFileSync('lists/sources/devdocs.anubis', 'utf8'));
    const bundled = listSites(official);
    for (const rule of generated.rules) {
      const site = rule.site!;
      expect(bundled.filter((k: string) => site === k || site.endsWith(`.${k}`) || k.endsWith(`.${site}`))).toEqual([]);
    }
  });

  it('credits the source and its commit, and parses cleanly', () => {
    expect(parsed.errors).toEqual([]);
    expect(parsed.meta).toMatchObject({ name: 'Official docs (DevDocs)', license: 'MPL-2.0', homepage: 'https://github.com/freeCodeCamp/devdocs' });
    expect(text).toContain('commit fed789');
    expect(text).toContain('https://mozilla.org/MPL/2.0/');
  });
});

describe('awesomeSelfhosted', () => {
  const free = freeLicences('- identifier: AGPL-3.0\n  name: GNU Affero General Public License 3.0\n\n- identifier: MIT\n  name: MIT License\n');
  const entry = (name: string, url: string, licences: string[]) => ({
    path: `software/${name.toLowerCase()}.yml`,
    text: [`name: ${name}`, `website_url: ${url}`, 'description: Something.', 'licenses:', ...licences.map((l) => `  - ${l}`), 'platforms:', '  - Docker', ''].join('\n'),
  });
  const files = [
    entry('Nextcloud', 'https://nextcloud.com/', ['AGPL-3.0']),
    entry('Blocky', 'https://0xerr0r.github.io/blocky/latest/', ['MIT']),
    entry('Confluence', 'https://www.atlassian.com/software/confluence', ['⊘ Proprietary']),
    entry('Mixed', 'https://mixed.example.org/', ['MIT', 'BUSL-1.1']),
    entry('Repo only', 'https://github.com/someone/project', ['MIT']),
    { path: 'software/quoted.yml', text: "name: 'Quoted'\nwebsite_url: \"https://quoted.example.net/app/\"\nlicenses:\n  - MIT\n" },
  ];
  const list = awesomeSelfhosted(files, { commit: 'aa11', free });
  const text = render(list);
  const parsed = parseList(text);

  it('labels the websites of free programs only', () => {
    expect(list.rules.map((r: { instruction: string }) => r.instruction).sort()).toEqual([
      '$site=nextcloud.com,tag=foss',
      '/app^$site=quoted.example.net,tag=foss',
      '/blocky^$site=0xerr0r.github.io,tag=foss',
    ]);
    expect(text).toContain('$site=nextcloud.com,tag=foss # awesome-selfhosted lists Nextcloud (AGPL-3.0).');
    // A website on a shared host is counted as left out; a non-free program isn't wanted at all.
    expect(list.skipped).toEqual(['Repo only: https://github.com/someone/project']);
  });

  it("keeps a program's own page on a company's site", () => {
    expect(projectTarget('https://www.atlassian.com/software/confluence')).toEqual({ site: 'atlassian.com', path: '/software/confluence^' });
    expect(projectTarget('https://docs.inventree.org/en/latest/')).toEqual({ site: 'docs.inventree.org' });
    expect(projectTarget('https://example.com/~me/')).toEqual({ site: 'example.com', path: '/~me^' });
  });

  it('shares the FOSS tag with the FOSS tools list, never moves anything, and carries the licence', () => {
    const foss = parseList(readFileSync('lists/foss-tools.anubis', 'utf8')).tags.find((t) => t.id === 'foss');
    expect(parsed.tags).toEqual([foss]);
    expect(parsed.errors).toEqual([]);
    expect(parsed.meta).toMatchObject({ license: 'CC-BY-SA-3.0', homepage: 'https://github.com/awesome-selfhosted/awesome-selfhosted-data' });
    expect(text).toContain('commit aa11');
    expect(text).toContain('https://creativecommons.org/licenses/by-sa/3.0/');
    const generated = parseList(readFileSync('lists/sources/self-hosted-foss.anubis', 'utf8'));
    for (const rule of generated.rules) expect({ boost: rule.boost, discard: rule.discard }).toEqual({ boost: 0, discard: false });
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
