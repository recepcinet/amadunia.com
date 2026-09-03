// Rehype plugin for Markdown that comes from lang/ (the amadunia-lang repo).
//
//  1. Drops the leading H1 — the page renders the title itself.
//  2. Drops a leading emphasis-only paragraph that holds no link — a grammar
//     page's "*Status: …*" and a text's subtitle, both rendered by the page
//     itself. A lesson's "*Prerequisite: [Lesson 4](…)*" has a link, so it stays.
//  3. Rewrites relative links between repo files into site routes.
//  4. Marks table columns that hold Amadunia with lang="art-x-amadunia", so
//     the site's one colour rule applies inside the language's own tables.
//  5. Everywhere else — dialogue, practice lines, italics in prose — marks a
//     run of text as Amadunia when the dictionary says so: at least three
//     quarters of its words are settled Amadunia words. Source-language
//     words and rejected candidates fail that test and stay grey.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let lexicon;
function loadLexicon() {
  if (lexicon) return lexicon;
  lexicon = new Set();
  const md = readFileSync(join(process.cwd(), 'lang', 'dictionary', 'dictionary.md'), 'utf8');
  for (const line of md.split('\n')) {
    const m = line.match(/^\|\s*([a-z][a-z-]*)\s*\|/);
    if (m) for (const part of m[1].split('-')) lexicon.add(part);
  }
  return lexicon;
}

// pre/code are not skipped: a text's story block is set as a code block, and the
// dictionary test keeps consonant clusters like `rk` and `mb` grey anyway.
const SKIP = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'script', 'style']);
const SPLIT = /(\s[—–-]\s|—|\(|\)|"|“|”)/;

function isAmadunia(fragment) {
  const words = fragment.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g);
  if (!words) return false;
  const lex = loadLexicon();
  let hit = 0, total = 0;
  for (const w of words) for (const part of w.split('-')) { total += 1; if (lex.has(part)) hit += 1; }
  return total > 0 && hit / total >= 0.75;
}

/** Split a text node into plain text and lang-tagged spans. */
function tagText(node) {
  const pieces = node.value.split(SPLIT);
  if (pieces.length === 1 && !isAmadunia(node.value)) return [node];
  return pieces
    .filter((p) => p !== '')
    .map((p) =>
      isAmadunia(p) && !SPLIT.test(p)
        ? { type: 'element', tagName: 'span', properties: { lang: 'art-x-amadunia' }, children: [{ type: 'text', value: p }] }
        : { type: 'text', value: p },
    );
}

function tagProse(node, tagged = false) {
  if (node.type !== 'element' && node.type !== 'root') return;
  if (node.type === 'element') {
    if (SKIP.has(node.tagName)) return;
    if (node.properties?.lang === 'art-x-amadunia') tagged = true;
  }
  if (tagged) return; // already coloured by an ancestor
  const out = [];
  for (const c of node.children ?? []) {
    if (c.type === 'text') out.push(...tagText(c));
    else { tagProse(c, tagged); out.push(c); }
  }
  node.children = out;
}

const AMADUNIA_HEADERS = new Set([
  'amadunia', 'word', 'singular', 'plural', 'one', 'more than one', 'particle',
  'example', 'past', 'present', 'future', 'letter', 'letters', 'sequence',
  'statement', 'question', 'answer', 'form',
]);

const hasLink = (node) =>
  node.tagName === 'a' || (node.children ?? []).some(hasLink);

const text = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(text).join('');

function rewriteHref(href) {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href;
  const [path, hash = ''] = href.split('#');
  const anchor = hash ? `#${hash}` : '';
  const base = path.split('/').pop() ?? '';
  const dir = path.includes('/') ? path.split('/').slice(-2, -1)[0] : '';

  if (/^\.\.\/grammar\/?$/.test(path)) return `/grammar/${anchor}`;
  if (/^\.\.\/lessons\/?$/.test(path)) return `/learn/${anchor}`;
  if (/^\.\.\/dictionary\/?$/.test(path)) return `/dictionary/${anchor}`;

  // A folder's README is its index; the site's equivalent is that section.
  const SECTION = { grammar: '/grammar/', lessons: '/learn/', texts: '/texts/', dictionary: '/dictionary/', writing: '/writing/' };

  if (base.endsWith('.md')) {
    const slug = base.slice(0, -3);
    if (slug === 'README') return `${SECTION[dir] ?? '/about/'}${anchor}`;
    if (slug.startsWith('lesson-')) return `/learn/${slug}/${anchor}`;
    if (slug.startsWith('story-') || slug.startsWith('text-')) return `/texts/${slug}/${anchor}`;
    if (slug === 'dictionary' || slug === 'index-english' || slug === 'balance') return `/dictionary/${anchor}`;
    if (slug === 'phrasebook') return `/phrasebook/${anchor}`;
    if (dir === 'writing') return `/writing/${slug}/${anchor}`;
    return `/grammar/${slug}/${anchor}`;
  }
  return href;
}

export default function rehypeLang() {
  return (tree) => {
    const kids = tree.children ?? [];

    // 1 + 2: drop the H1 and the status line, wherever they sit at top level.
    // Count elements, not nodes: mdast leaves newline text nodes between them.
    let seen = 0;
    tree.children = kids.filter((n) => {
      if (n.type !== 'element') return true;
      const nth = seen++;
      if (n.tagName === 'h1') return false;
      if (n.tagName === 'p' && nth <= 1) {
        const inner = n.children?.filter((c) => !(c.type === 'text' && !c.value.trim()));
        const only = inner?.length === 1 ? inner[0] : undefined;
        if (only?.tagName === 'em' && !hasLink(only)) return false;
      }
      return true;
    });

    const walk = (node) => {
      if (node.type !== 'element' && node.type !== 'root') return;
      if (node.tagName === 'a' && node.properties?.href) {
        node.properties.href = rewriteHref(String(node.properties.href));
      }
      if (node.tagName === 'table') tagTable(node);
      for (const c of node.children ?? []) walk(c);
    };
    walk(tree);
    const before = JSON.stringify(tree).length;
    let lexSize = -1, err = '';
    try { lexSize = loadLexicon().size; } catch (e) { err = String(e); }
    tagProse(tree);
    const spans = JSON.stringify(tree).split('"art-x-amadunia"').length - 1;
    if (process.env.REHYPE_DEBUG) console.error(`[rehype-lang] cwd=${process.cwd()} lex=${lexSize} ${err} spans=${spans} textTypes=${[...new Set((tree.children||[]).flatMap(c => (c.children||[]).map(x => x.type)))].join(',')} rootTypes=${[...new Set((tree.children||[]).map(c => c.type))].join(',')} delta=${JSON.stringify(tree).length - before}`);
  };
}

function tagTable(table) {
  const rows = [];
  for (const section of table.children ?? []) {
    if (section.type !== 'element') continue;
    for (const tr of section.children ?? []) if (tr.tagName === 'tr') rows.push(tr);
  }
  if (!rows.length) return;
  const cells = (tr) => (tr.children ?? []).filter((c) => c.type === 'element');
  const headers = cells(rows[0]).map((th) => text(th).trim().toLowerCase());

  let cols = headers
    .map((h, i) => (AMADUNIA_HEADERS.has(h) || /^\d+$/.test(h) ? i : -1))
    .filter((i) => i >= 0);
  if (!cols.length && headers.every((h) => !h)) cols = [0]; // headerless: first column is the language

  for (const tr of rows.slice(1)) {
    const tds = cells(tr);
    // Group rows in the dictionary style ("**Numbers** | |") are labels, not words.
    if (tds.length && tds.slice(1).every((td) => !text(td).trim())) continue;
    for (const i of cols) if (tds[i]) tds[i].properties = { ...tds[i].properties, lang: 'art-x-amadunia' };
  }
}
