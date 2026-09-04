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

const LANG_REPO = 'https://github.com/recepcinet/amadunia-lang';

// Where each folder's index lives on the site.
const SECTION = {
  '': '/about/',
  grammar: '/grammar/',
  lessons: '/learn/',
  texts: '/texts/',
  dictionary: '/dictionary/',
  writing: '/writing/',
};

// A file whose whole content is folded into another page, so a link to it
// belongs on that page rather than on a route of its own.
const FOLDED = new Set(['dictionary/dictionary.md', 'dictionary/index-english.md']);

/**
 * Resolve an upstream link against the file it appears in, then map the
 * repository path to a site route. Guessing from the last two segments used to
 * send `README.md` beside a1-checklist.md to /about/ and `../check.py` to a
 * 404; resolving first means the answer comes from the real path.
 */
function rewriteHref(href, fromDir = '') {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href;
  const [path, hash = ''] = href.split('#');
  const anchor = hash ? `#${hash}` : '';
  if (!path) return href;

  // Resolve ./ and ../ against the folder the document lives in.
  const parts = fromDir ? fromDir.split('/') : [];
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  const rel = parts.join('/');
  const trailing = path.endsWith('/');

  // A folder link, with or without the slash: grammar/, ../texts/, lessons.
  if (trailing || !rel.includes('.')) {
    const section = SECTION[rel];
    if (section) return `${section}${anchor}`;
  }

  if (rel.endsWith('.md')) {
    const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    const slug = rel.slice(rel.lastIndexOf('/') + 1, -3);
    if (slug === 'README') {
      const section = SECTION[dir];
      if (section) return `${section}${anchor}`;
    } else if (FOLDED.has(rel)) {
      return `/dictionary/${anchor}`;
    } else if (rel === 'phrasebook.md') {
      return `/phrasebook/${anchor}`;
    } else if (rel === 'GUARANTEES.md') {
      return `/guarantees/${anchor}`;
    } else if (dir && SECTION[dir]) {
      return `${SECTION[dir]}${slug}/${anchor}`;
    }
  }

  // Everything else is a repository file with no page: check.py, CONTRIBUTING.md,
  // the generated CSV. Send it to the file it actually is.
  return `${LANG_REPO}/blob/main/${rel}${anchor}`;
}

export default function rehypeLang() {
  return (tree, file) => {
    // Links resolve against the folder the source file lives in.
    const from = String(file?.path ?? '');
    const i = from.indexOf('/lang/');
    const rel = i >= 0 ? from.slice(i + 6) : '';
    const fromDir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    const kids = tree.children ?? [];

    // 1 + 2: drop the H1 and the status line, wherever they sit at top level.
    // The front matter is however many paragraphs open the file before the
    // first heading — grammar pages now lead with where the rule is taught,
    // then their status, and a fixed index would miss the second.
    let leading = true;
    tree.children = kids.filter((n) => {
      if (n.type !== 'element') return true;
      if (n.tagName !== 'h1' && n.tagName !== 'p') leading = false;
      if (!leading) return true;
      if (n.tagName === 'h1') return false;
      const inner = n.children?.filter((c) => !(c.type === 'text' && !c.value.trim()));
      const only = inner?.length === 1 ? inner[0] : undefined;
      // Emphasis with no link is metadata the page renders itself; emphasis
      // with one is navigation, and stays.
      return !(only?.tagName === 'em' && !hasLink(only));
    });

    const walk = (node) => {
      if (node.type !== 'element' && node.type !== 'root') return;
      if (node.tagName === 'a' && node.properties?.href) {
        node.properties.href = rewriteHref(String(node.properties.href), fromDir);
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

  // A digit header means Amadunia only when the whole table is numbered that
  // way — the numerals table in numbers.md. Elsewhere a "4" heads a count.
  const allDigits = headers.every((h) => !h || /^\d+$/.test(h)) && headers.some((h) => /^\d+$/.test(h));
  const cols = headers
    .map((h, i) => (AMADUNIA_HEADERS.has(h) || (allDigits && /^\d+$/.test(h)) ? i : -1))
    .filter((i) => i >= 0);
  // A headerless table names no column, so ask the dictionary cell by cell
  // rather than assuming a position: lessons pair Amadunia with English in
  // that shape, but so does a briefing pairing an English label with a count.
  const byDictionary = !cols.length && headers.every((h) => !h);

  for (const tr of rows.slice(1)) {
    const tds = cells(tr);
    // Group rows in the dictionary style ("**Numbers** | |") are labels, not words.
    if (tds.length && tds.slice(1).every((td) => !text(td).trim())) continue;
    const wanted = byDictionary
      ? tds.map((td, i) => (isAmadunia(text(td)) ? i : -1)).filter((i) => i >= 0)
      : cols;
    for (const i of wanted) if (tds[i]) tds[i].properties = { ...tds[i].properties, lang: 'art-x-amadunia' };
  }
}
