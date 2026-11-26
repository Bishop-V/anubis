import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import container from 'markdown-it-container';
import { LEVELS, WEIGH } from '../../docs/.vitepress/theme/demo-icons.ts';
import { WIKI_FOLDERS } from '../../utils/links.ts';

const site = resolve(import.meta.dirname, '..');
const repo = resolve(site, '..');
const docs = join(repo, 'docs');
const source = join(site, 'src/pages/anubis');
const publicDir = join(site, 'public');
const base = '/anubis';
const repository = 'https://github.com/Bishop-V/anubis/blob/main';

function routeFor(file) {
  return '/' + file.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
}

const folders = Object.values(WIKI_FOLDERS);
async function markdownFiles(folder = '', children = []) {
  const files = (await readdir(join(docs, folder)))
    .filter((file) => file.endsWith('.md'))
    .map((file) => join(folder, file));
  for (const child of children) files.push(...await markdownFiles(join(folder, child)));
  return files;
}

const files = [
  ...await markdownFiles('', ['guide', 'experiments']),
  ...(await Promise.all(folders.map((folder) => markdownFiles(folder, ['guide'])))).flat(),
].sort();
const routes = new Map(files.map((file) => [file, routeFor(file)]));
const previousAssets = new Set(await readdir(join(docs, 'img')));
// Match VitePress's heading IDs so links from installed extensions still land.
const idForHeading = (label) => label.normalize('NFKD')
  .replace(/[\u0300-\u036f\u0000-\u001f]/g, '')
  .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/^(\d)/, '_$1')
  .toLowerCase();

function resolveUrl(url, file) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) return url;
  const [path, suffix = ''] = url.split(/([?#].*)/, 2);
  const target = path.startsWith('/') ? resolve(docs, '.' + path) : resolve(docs, file, '..', path);
  const local = relative(docs, target);
  if (routes.has(local)) return base + routes.get(local) + suffix;
  if (local.startsWith('../')) return repository + '/' + relative(repo, target) + suffix;
  return base + '/' + local + suffix;
}

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(anchor, { level: [1, 2, 3, 4, 5, 6], slugify: idForHeading });
for (const kind of ['warning', 'details']) {
  md.use(container, kind, {
    render(tokens, index) {
      if (tokens[index].nesting === -1) return kind === 'details' ? '</details>\n' : '</aside>\n';
      const title = md.utils.escapeHtml(tokens[index].info.trim().slice(kind.length).trim());
      return kind === 'details'
        ? '<details class="callout"><summary>' + (title || 'Details') + '</summary>\n'
        : '<aside class="callout"><p><strong>' + (title || 'Warning') + '</strong></p>\n';
    },
  });
}

// Table headings stay associated with their cells when a wide table scrolls.
md.core.ruler.after('inline', 'wiki_tables', ({ tokens, env }) => {
  let caption = '';
  let inBody = false;
  let row = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open') caption = tokens[i + 1].content;
    if (token.type === 'table_open') {
      token.meta = { caption };
      row = 0;
    }
    if (token.type === 'tbody_open') inBody = true;
    if (token.type === 'tbody_close') inBody = false;
    if (token.type === 'th_open') token.attrSet('scope', 'col');
    if (token.type === 'tr_open' && inBody) {
      const first = tokens[i + 1];
      first.tag = 'th';
      first.attrSet('scope', 'row');
      tokens[i + 3].tag = 'th';
      if (env.file.endsWith('guide/ranking.md')) first.meta = { rank: LEVELS[row]?.[0] };
      row++;
    }
  }
});

md.renderer.rules.table_open = (tokens, index) => {
  const label = md.utils.escapeHtml(tokens[index].meta.caption);
  return '<div class="wiki-table-scroll" role="region" aria-label="' + label + '"><table class="wiki-table">';
};
md.renderer.rules.table_close = () => '</table></div>';
md.renderer.rules.td_open = (tokens, index, options, _env, self) => {
  const token = tokens[index];
  const icon = token.meta?.rank ? '<span class="wiki-rank-icon" aria-hidden="true">' + WEIGH[token.meta.rank] + '</span>' : '';
  return self.renderToken(tokens, index, options) + icon;
};

md.renderer.rules.link_open = (tokens, index, options, { file }, self) => {
  const token = tokens[index];
  const href = token.attrGet('href');
  if (href) token.attrSet('href', resolveUrl(href, file));
  // Native navigation keeps fragment scrolling and the extension handoff intact.
  if (href) token.attrSet('data-external', '');
  return self.renderToken(tokens, index, options);
};

const renderFence = md.renderer.rules.fence;
md.renderer.rules.fence = (...args) => '<div class="wiki-code-frame">' + renderFence(...args) + '</div>';

const renderImage = md.renderer.rules.image;
md.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index];
  const url = resolveUrl(token.attrGet('src'), env.file);
  token.attrSet('src', url);
  token.attrSet('loading', 'lazy');
  const light = renderImage(tokens, index, options, env, self);
  const darkName = url.replace(/^\/anubis\/img\//, '').replace(/\.png$/, '-dark.png');
  if (!previousAssets.has(darkName)) return light;
  token.attrSet('src', base + '/img/' + darkName);
  return '<span class="theme-image"><span class="light-only">' + light + '</span><span class="dark-only">' +
    renderImage(tokens, index, options, env, self) + '</span></span>';
};

function markdownFor(file, content) {
  if (file === 'lists.md') {
    return content.replace(/<script setup>[\s\S]*?<\/script>/, '').replace(/<table>[\s\S]*?<\/table>/, '<!-- anubis:directory -->');
  }
  if (file === 'subscribe.md') {
    return '# Subscribe to a list\n\n<!-- anubis:subscribe -->\n\n' + content.slice(content.indexOf('## Make a subscribe link'));
  }
  return content.replace('<RankDemo />', '<!-- anubis:ranking -->').replace('<HideDemo />', '<!-- anubis:hiding -->');
}

const makeModule = (page, file) => {
  const importFrom = relative(join(source, file, '..'), join(site, 'src/view.js'));
  return `import { createPage } from ${JSON.stringify(importFrom.startsWith('.') ? importFrom : './' + importFrom)};\n` +
    `const page = ${JSON.stringify(page)};\n` +
    `export const metadata = { title: page.home ? page.title + ' | ' + page.home.titleTemplate : page.title + ' | Anubis', lang: page.lang };\n` +
    `export const ${'Anubis' + file.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').map((part) => part[0].toUpperCase() + part.slice(1)).join('')} = createPage(page);\n`;
};

await rm(join(site, 'src/pages'), { recursive: true, force: true });
await rm(publicDir, { recursive: true, force: true });
await cp(join(docs, 'public'), publicDir, { recursive: true });
await cp(join(docs, 'img'), join(publicDir, 'img'), { recursive: true });
await cp(join(docs, '.vitepress/theme/brand.css'), join(publicDir, 'brand.css'));
await cp(join(repo, 'assets/typography.css'), join(publicDir, 'typography.css'));
await cp(join(site, 'src/site.css'), join(publicDir, 'site.css'));
await cp(join(site, 'src/wiki.css'), join(publicDir, 'wiki.css'));
await cp(join(site, 'src/preferences.js'), join(publicDir, 'preferences.js'));
const fonts = join(site, 'node_modules/@fontsource-variable/inter');
const fontDir = join(publicDir, 'fonts');
const fontCss = (await Promise.all(['wght.css', 'wght-italic.css'].map((file) => readFile(join(fonts, file), 'utf8')))).join('\n');
const fontFiles = new Set([...fontCss.matchAll(/url\(\.\/files\/([^)]+)\)/g)].map((match) => match[1]));
await mkdir(join(fontDir, 'files'), { recursive: true });
await Promise.all([...fontFiles].map((file) => cp(join(fonts, 'files', file), join(fontDir, 'files', file))));
await writeFile(join(fontDir, 'inter.css'), fontCss);

const notices = await readFile(join(repo, 'public/THIRD_PARTY_NOTICES.txt'), 'utf8');
const siteLicenses = [
  ['Inglorious Web, Motion, UI, and I18n', 'https://github.com/IngloriousCoderz/inglorious-forge', '@inglorious/web'],
  ['Lit', 'https://github.com/lit/lit', 'lit-html'],
  ['i18next', 'https://github.com/i18next/i18next', 'i18next'],
  ['Inter', 'https://rsms.me/inter/', '@fontsource-variable/inter'],
];
const licenses = await Promise.all(siteLicenses.map(async ([label, url, pkg]) =>
  '\n' + label + '\n' + url + '\n\n' + await readFile(join(site, 'node_modules', pkg, 'LICENSE'), 'utf8'),
));
await writeFile(join(publicDir, 'THIRD_PARTY_NOTICES.txt'), notices + licenses.join(''));

const search = new Map(['en', ...folders].map((folder) => [folder, []]));
for (const file of files) {
  const { content, data } = matter(await readFile(join(docs, file), 'utf8'));
  const markup = markdownFor(file, content);
  const route = routes.get(file);
  const folder = folders.find((name) => file.startsWith(name + '/')) ?? 'en';
  const [lang] = Intl.getCanonicalLocales(folder);
  const home = data.layout === 'home' ? data : undefined;
  const tokens = md.parse(markup, { file });
  const headings = tokens.flatMap((token, index) => {
    if (token.type !== 'heading_open') return [];
    return [{ id: token.attrGet('id'), label: tokens[index + 1].content, level: Number(token.tag.slice(1)) }];
  });
  const title = data.title || headings[0]?.label || file;
  const first = tokens.findIndex((token) => token.type === 'heading_open' && token.tag === 'h1');
  const heading = first < 0 ? '' : md.renderer.render(tokens.slice(first, first + 3), md.options, { file });
  const bodyTokens = first < 0 ? tokens : [...tokens.slice(0, first), ...tokens.slice(first + 3)];
  const body = md.renderer.render(bodyTokens, md.options, { file });
  if (file !== 'subscribe.md' && data.search !== false) {
    const entries = [{ title, heading: '', url: base + route, text: home?.intro.lead ?? '' }];
    let section = entries[0];
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.type === 'heading_open' && token.tag !== 'h1') {
        section = { title, heading: tokens[index + 1].content, url: base + route + '#' + token.attrGet('id'), text: '' };
        entries.push(section);
      }
      if (token.type === 'inline' && tokens[index - 1]?.type !== 'heading_open') {
        section.text += ' ' + token.children.filter((child) => child.type === 'text' || child.type === 'code_inline').map((child) => child.content).join(' ');
      }
    }
    search.get(folder).push(...entries);
  }
  const output = join(source, file.replace(/\.md$/, '.js'));
  await mkdir(resolve(output, '..'), { recursive: true });
  const parts = body.split(/<!-- anubis:(directory|subscribe|ranking|hiding) -->/);
  await writeFile(output, makeModule({ route, file, title, folder, lang, heading, headings: data.outline === false ? [] : headings.filter(({ level }) => level === 2 || level === 3), parts, home }, file));
}
for (const [folder, index] of search) {
  const name = folder === 'en' ? 'search.json' : 'search-' + folder + '.json';
  await writeFile(join(publicDir, name), JSON.stringify(index));
}
console.log('Prepared ' + files.length + ' pages in ' + search.size + ' languages from the wiki');
