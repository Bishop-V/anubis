// Turns other projects' data into Anubis lists. Pure functions, so tests can run
// them on fixtures; update-sources.mjs fetches the data and writes the files.
//
// Each list made here keeps its source's licence and credits it in its name and
// header. Its `! homepage:` is the source's repository, so "Wrong? Report it"
// reaches the people who maintain the data. It sets no `! issues:`: that offers
// "Suggest it to…", which sends Anubis rules, and the sources never asked for those.

/**
 * @typedef {{ instruction: string, comment?: string }} SourceRule
 * @typedef {{ header: string[], rules: SourceRule[], skipped: string[] }} SourceList
 */

/** The `! key: value` header lines, then the explanatory comment lines. */
function header(meta, notes) {
  return [
    ...Object.entries(meta)
      .filter(([, value]) => value)
      .flatMap(([key, value]) => (Array.isArray(value) ? value.map((v) => `! ${key}: ${v}`) : [`! ${key}: ${value}`])),
    '!',
    ...notes.map((line) => (line ? `! ${line}` : '!')),
  ];
}

/** The file's text: header, a blank line, then one rule per line, sorted so weekly diffs stay small. */
export function render(list) {
  const lines = [...list.rules]
    .sort((a, b) => a.instruction.localeCompare(b.instruction))
    .map((r) => (r.comment ? `${r.instruction} # ${r.comment}` : r.instruction));
  return `${[...list.header, '', ...lines].join('\n')}\n`;
}

/** The rules part of a rendered list, to tell a real change from a new upstream commit alone. */
export function body(text) {
  return text.split('\n').filter((line) => line && !line.startsWith('!')).join('\n');
}

/** A host as Anubis's `site=` takes it, or undefined when it isn't one. */
function cleanHost(host) {
  const h = host.toLowerCase().replace(/^\*\./, '').replace(/^www\./, '').replace(/:\d+$/, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) ? h : undefined;
}

/**
 * One uBlacklist match pattern (`*://*.example.com/*`, `*://*.example.com/path/*`)
 * as an Anubis instruction without its options, or a reason it can't be one.
 * A path becomes a pattern matched anywhere in the address, as Goggles do; that's
 * looser than uBlacklist's, which also anchors it at the start of the path. A
 * trailing slash becomes `^`, so `/@name/*` also matches the page `/@name`.
 */
export function fromMatchPattern(pattern) {
  const m = /^(?:\*|https?):\/\/([^/]+)(\/.*)$/.exec(pattern.trim());
  if (!m) return { skip: 'not a match pattern' };
  const site = cleanHost(m[1]);
  if (!site) return { skip: 'host has a wildcard' };
  let path = m[2].replace(/\*+$/, '');
  if (path === '/') return { site };
  if ((path.match(/\*/g) ?? []).length > 2 || /[$|^#]/.test(path)) return { skip: "path Anubis patterns can't express" };
  // `/@name/*` should also match `/@name` itself: `^` is a separator or the end.
  return { site, path: path.replace(/\/$/, '^') };
}

/** `/path$site=x,tag=a,…` from a site, an optional path, and options. */
function instruction(site, path, options) {
  return `${path ?? ''}$site=${site},${options.join(',')}`;
}

/**
 * The uBlacklist rules in a text, each with the section heading (`# // …`) it sits
 * under. Regular expressions and other rules that aren't match patterns are skipped.
 */
function ublacklistRules(text) {
  const out = [];
  const skipped = [];
  let section = '';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      if (/^#\s*\/\//.test(line)) section = line.replace(/^#[\s/]*/, '');
      continue;
    }
    if (line.startsWith('@')) {
      skipped.push(`${line} (an exception)`);
      continue;
    }
    const rule = fromMatchPattern(line);
    if (rule.skip) skipped.push(`${line} (${rule.skip})`);
    else out.push({ ...rule, section });
  }
  return { rules: out, skipped };
}

/** Rules for the same site and path, once: the first wins. */
function dedupe(rules) {
  const seen = new Set();
  return rules.filter((r) => !seen.has(r.instruction) && seen.add(r.instruction));
}

/** Drop path rules whose site already has a whole-site rule with the same options. */
function dropCovered(rules) {
  const whole = new Set(rules.filter((r) => r.instruction.startsWith('$')).map((r) => r.instruction));
  return rules.filter((r) => r.instruction.startsWith('$') || !whole.has(r.instruction.replace(/^[^$]*/, '')));
}

export const HUGE_AI = {
  repository: 'https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist',
  main: 'https://raw.githubusercontent.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist/main/list_uBlacklist.txt',
  nuclear: 'https://raw.githubusercontent.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist/main/list_uBlacklist_nuclear.txt',
};

/**
 * The HUGE AI Blocklist as labels. Its main list (sites mostly made of AI content)
 * becomes `ai-generated`, its "nuclear" list (sites mixing authentic and AI work)
 * `ai-mixed`. The sites its maintainers file under content farms and spam also get
 * `ai-slop`, the shared low-quality tag. Nothing is hidden or moved: subscribers
 * choose what each tag does.
 */
export function hugeAi({ main, nuclear, commit, date }) {
  const a = ublacklistRules(main);
  const b = ublacklistRules(nuclear);
  const farm = (section) => /content farm|spam/i.test(section);
  const rules = dedupe([
    ...a.rules.map((r) => ({
      instruction: instruction(r.site, r.path, farm(r.section) ? ['tag=ai-generated', 'tag=ai-slop'] : ['tag=ai-generated']),
    })),
    ...b.rules.map((r) => ({ instruction: instruction(r.site, r.path, ['tag=ai-mixed']) })),
  ]);
  // A site in both lists keeps the stronger label.
  const generated = new Set(rules.filter((r) => r.instruction.includes('tag=ai-generated')).map((r) => r.instruction.split(',')[0]));
  const kept = rules.filter((r) => !r.instruction.endsWith('tag=ai-mixed') || !generated.has(r.instruction.split(',')[0]));
  return {
    header: header(
      {
        name: 'AI content (HUGE AI Blocklist)',
        description: 'Labels sites the HUGE AI Blocklist lists as made of AI-generated content, or as mixing it with authentic work. Never changes the ranking.',
        author: 'laylavish and the HUGE AI Blocklist contributors',
        homepage: HUGE_AI.repository,
        license: 'CC0-1.0',
        version: date,
        avatar: '#8c6a4f',
        expires: '7 days',
        tag: [
          'ai-generated | AI-generated | #8c6a4f | Mostly made of AI-generated text or images.',
          'ai-mixed | Some AI content | #7f8f3a | Mixes authentic work with AI-generated text or images.',
          'ai-slop | AI slop | #e0664f | Low-quality AI-generated content.',
        ],
      },
      [
        `Made from the HUGE AI Blocklist (${HUGE_AI.repository}),`,
        `commit ${commit}, which its authors dedicate to the public domain under CC0 1.0.`,
        'Its main list becomes "AI-generated", its nuclear list "Some AI content", and',
        'its content farm and spam sections also "AI slop". Regular expressions are left out.',
        '',
        'To add a site or report a mistake, open an issue or pull request on the HUGE AI',
        'Blocklist. Anubis rewrites this file from it every week',
        '(.github/workflows/sources.yml), so edits made here are lost.',
      ],
    ),
    rules: dropCovered(kept),
    skipped: [...a.skipped, ...b.skipped],
  };
}

export const INDIE_WIKIS = {
  repository: 'https://github.com/KevinPayravi/indie-wiki-buddy',
  data: 'https://raw.githubusercontent.com/KevinPayravi/indie-wiki-buddy/main/data/data.json',
};

/** `animalcrossing.fandom.com/de` → site and path, or nothing for an address Anubis can't target. */
function siteAndPath(base) {
  const [host, ...rest] = base.replace(/^https?:\/\//, '').replace(/\/+$/, '').split('/');
  const site = cleanHost(host);
  if (!site) return undefined;
  const path = rest.length ? `/${rest.join('/')}/` : undefined;
  if (path && /[$|^*#\s]/.test(path)) return undefined;
  return { site, path };
}

/**
 * Indie Wiki Buddy's data: wikis on Fandom, Fextralife, and Neoseeker, and the
 * independent wikis their topics have elsewhere. The first are lowered and
 * labelled "Independent wiki elsewhere", with a comment naming where; the
 * independent ones are raised and labelled "Independent wiki".
 */
export function indieWikis(data, { commit, licence }) {
  const rules = [];
  const skipped = [];
  for (const entry of data.sites ?? []) {
    const dest = siteAndPath(entry.destination_base_url ?? '');
    if (!dest) {
      skipped.push(`${entry.id}: destination ${entry.destination_base_url}`);
      continue;
    }
    const where = `${entry.destination_base_url}`.replace(/\/+$/, '');
    const official = entry.tags?.includes('official') ? ', the official wiki' : '';
    rules.push({
      instruction: instruction(dest.site, dest.path, ['tag=independent-wiki', 'boost=3']),
      comment: `${entry.destination}${official}.`,
    });
    for (const origin of entry.origins ?? []) {
      const from = siteAndPath(origin.origin_base_url ?? '');
      if (!from) {
        skipped.push(`${entry.id}: origin ${origin.origin_base_url}`);
        continue;
      }
      rules.push({
        instruction: instruction(from.site, from.path, ['tag=independent-elsewhere', 'downrank=3']),
        comment: `${entry.destination}${official ? `${official},` : ''} is at ${where}.`,
      });
    }
  }
  return {
    header: header(
      {
        name: 'Independent wikis (Indie Wiki Buddy)',
        description: "Raises independent wikis and lowers the Fandom, Fextralife, and Neoseeker wikis they replace, using Indie Wiki Buddy's data.",
        author: 'Kevin Payravi and the Indie Wiki Buddy contributors',
        homepage: INDIE_WIKIS.repository,
        license: 'MIT',
        version: data.generated?.slice(0, 10),
        avatar: '#3a8a67',
        expires: '7 days',
        tag: [
          "independent-wiki | Independent wiki | #3a8a67 | A wiki run by its community or the game's developers, not a commercial wiki host.",
          "independent-elsewhere | Independent wiki elsewhere | #8c6a4f | A wiki on Fandom, Fextralife, or Neoseeker whose topic has an independent wiki. The rule's comment names it.",
        ],
      },
      [
        `Made from Indie Wiki Buddy's data (${INDIE_WIKIS.repository}),`,
        `commit ${commit}, under its MIT licence:`,
        '',
        ...licence.trim().split(/\r?\n/),
        '',
        "To add a wiki or report a mistake, use Indie Wiki Buddy's issue tracker or",
        'pull requests. Anubis rewrites this file from its data every week',
        '(.github/workflows/sources.yml), so edits made here are lost.',
      ],
    ),
    rules: dropCovered(dedupe(rules)),
    skipped,
  };
}

export const DEVDOCS = {
  repository: 'https://github.com/freeCodeCamp/devdocs',
  scrapers: 'lib/docs/scrapers',
};

// Hosts where an address is one project's page on a shared service, not a docs site.
const SHARED_HOSTS = new Set(['github.com', 'raw.githubusercontent.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org', 'sourceforge.net', 'npmjs.com', 'web.archive.org', 'devdocs.io']);
// Hosts whose name says they hold docs, so the whole host is tagged.
const DOCS_HOST = /^(docs?|developer|devdocs|api|learn|reference|manual|man)\.|\.readthedocs\.io$/;
// A first path segment that is a version or a language, under which a host keeps all its docs.
const VERSION_SEGMENT = /^(v?\d.*|latest|stable|current|master|main|dev|next|en|[a-z]{2}-[a-z]{2,4})$|#\{/i;

/**
 * Where a DevDocs scraper reads its docs (`base_url`), as a site and, when the
 * docs are only part of the site, the first segment of their path:
 * `https://docs.deno.com/api/` → docs.deno.com; `https://prettier.io/docs/` →
 * prettier.io, `/docs/`. Nothing for an address on a shared host, or one whose
 * host is worked out when DevDocs runs.
 */
export function docsTarget(url) {
  const m = /^https?:\/\/([^/"'#{}]+)(\/.*)?$/.exec(url);
  if (!m) return undefined;
  const site = cleanHost(m[1]);
  if (!site || !/\.[a-z]{2,}$/.test(site) || SHARED_HOSTS.has(site)) return undefined;
  const segment = (m[2] ?? '/').split('/')[1] ?? '';
  if (!segment || DOCS_HOST.test(site) || VERSION_SEGMENT.test(segment)) return { site };
  if (!/^[\w.-]+$/.test(segment) || /\.\w+$/.test(segment)) return { site };
  return { site, path: `/${segment}/` };
}

/** The sites an Anubis list has `site=` rules for. */
export function listSites(text) {
  return [...new Set([...text.matchAll(/\$site=([^,\s]+)/g)].map((m) => m[1]))];
}

/**
 * DevDocs's scrapers (Ruby files) as Anubis rules tagging "Official docs" and
 * nudging them up, as Anubis's own Official docs list does. Each `base_url` in a
 * scraper, for every version it keeps, becomes a rule; its comment names the docs.
 * Sites the bundled list already has (`known`), or a part or parent of one, are left
 * out: both lists are on by default, and boosts from two lists add up. The bundled
 * list keeps them because installs that chose their own lists before this one
 * existed aren't subscribed to it.
 */
export function devDocs(files, { commit, known = [] }) {
  const overlaps = (site) => known.some((k) => site === k || site.endsWith(`.${k}`) || k.endsWith(`.${site}`));
  const names = new Map();
  const skipped = [];
  for (const { path, text } of files) {
    // DevDocs names docs after their class unless the scraper sets a name.
    const name = /self\.name\s*=\s*['"]([^'"]+)['"]/.exec(text)?.[1] ?? /class\s+(\w+)\s*</.exec(text)?.[1] ?? path.replace(/^.*\//, '').replace(/\.rb$/, '');
    for (const [, url] of text.matchAll(/base_url\s*=\s*['"]([^'"]+)['"]/g)) {
      const target = docsTarget(url);
      if (!target) {
        skipped.push(`${name}: ${url}`);
        continue;
      }
      if (overlaps(target.site)) continue;
      const key = instruction(target.site, target.path, ['tag=docs', 'boost=1']);
      if (!names.has(key)) names.set(key, new Set());
      names.get(key).add(name);
    }
  }
  const rules = [...names].map(([key, docs]) => ({ instruction: key, comment: `DevDocs collects the docs for ${[...docs].sort().join(', ')} here.` }));
  return {
    header: header(
      {
        name: 'Official docs (DevDocs)',
        description: 'Tags the documentation sites DevDocs collects, and nudges them up.',
        author: 'The DevDocs contributors',
        homepage: DEVDOCS.repository,
        license: 'MPL-2.0',
        avatar: '#2f5fae',
        expires: '7 days',
        tag: ['docs | Official docs | #2f5fae | Documentation published by the project or vendor itself.'],
      },
      [
        `Made from DevDocs's scrapers (${DEVDOCS.repository}),`,
        `commit ${commit}, whose code is under the Mozilla Public License 2.0.`,
        "Each rule is an address a scraper reads its docs from. A docs site's whole host",
        "is tagged; docs on a project's main site only under their path (\"/docs/\").",
        'Addresses on GitHub, GitLab, and other shared hosts are left out, and so are',
        "sites Anubis's own Official docs list already tags, so none is raised twice.",
        '',
        'To add docs, open an issue or pull request on DevDocs. Anubis rewrites this',
        'file from it every week (.github/workflows/sources.yml), so edits made here are lost.',
      ],
    ),
    rules: dropNarrower(rules),
    skipped,
  };
}

/**
 * Drop rules another rule with the same options already covers: one on the same
 * site or a parent site, for the whole site or the same path. `v18.angular.dev`
 * goes when `angular.dev` has a rule, `/docs/$site=v3.tailwindcss.com` when
 * `/docs/$site=tailwindcss.com` does.
 */
function dropNarrower(rules) {
  const parsed = rules.map((r) => {
    const [, path, site, options] = /^([^$]*)\$site=([^,]+),(.*)$/.exec(r.instruction);
    return { rule: r, path, site, options };
  });
  const covers = (a, b) =>
    a !== b && a.options === b.options && (!a.path || a.path === b.path) && (b.site === a.site || b.site.endsWith(`.${a.site}`));
  return parsed.filter((b) => !parsed.some((a) => covers(a, b))).map((p) => p.rule);
}
