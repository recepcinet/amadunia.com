// Rehype plugin for Markdown that comes from lang/ (the amadunia-lang repo).
//
//  1. Drops the leading H1 — the page renders the title itself.
//  2. Drops the "*Status: …*" paragraph — the page shows status in its rail.
//  3. Rewrites relative links between repo files into site routes.
//  4. Marks table columns that hold Amadunia with lang="art-x-amadunia", so
//     the site's one colour rule applies inside the language's own tables.

const AMADUNIA_HEADERS = new Set([
  'amadunia', 'word', 'singular', 'plural', 'one', 'more than one', 'particle',
  'example', 'past', 'present', 'future', 'letters', 'sequence',
]);

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

  if (base.endsWith('.md')) {
    const slug = base.slice(0, -3);
    if (slug.startsWith('lesson-')) return `/learn/${slug}/${anchor}`;
    if (slug === 'README') return dir === 'dictionary' ? `/dictionary/${anchor}` : `/about/${anchor}`;
    if (slug === 'dictionary') return `/dictionary/${anchor}`;
    return `/grammar/${slug}/${anchor}`;
  }
  return href;
}

export default function rehypeLang() {
  return (tree) => {
    const kids = tree.children ?? [];

    // 1 + 2: drop the H1 and the status line, wherever they sit at top level.
    tree.children = kids.filter((n, i) => {
      if (n.type !== 'element') return true;
      if (n.tagName === 'h1') return false;
      if (n.tagName === 'p') {
        const inner = n.children?.filter((c) => !(c.type === 'text' && !c.value.trim()));
        if (inner?.length === 1 && inner[0].tagName === 'em' && /^Status:/.test(text(inner[0]))) return false;
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
