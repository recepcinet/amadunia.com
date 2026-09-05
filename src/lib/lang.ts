// Build-time readers for the parts of lang/ that are not rendered as pages
// but parsed into data: the dictionary table, the alphabet in phonology.md,
// and the status line in the README. Everything here runs at build only.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { translate as ruleTranslate } from './translate';

const LANG = join(process.cwd(), 'lang');
export const LANG_REPO = 'https://github.com/recepcinet/amadunia-lang';

/** writing/ is a proposal upstream; guard every use so the site is quiet without it. */
export const hasWriting = existsSync(join(LANG, 'writing'));

export function readLang(rel: string): string {
  return readFileSync(join(LANG, rel), 'utf8');
}

/* ---------- Markdown helpers ---------- */

export function titleOf(body: string): string {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1] : '';
}

/**
 * How a grammar file states its standing, up to its first full stop. Most use
 * "*Status: …*"; word-formation.md opens with a bold "**Settled: …**" instead.
 */
export function statusOf(body: string): string | undefined {
  const m =
    body.match(/^\*Status:\s*(.+?)\*\s*$/m) ??
    body.match(/^\*\*(Settled|Proposed|Draft)\b[:.]?\s*([\s\S]*?)\*\*/m);
  if (!m) return undefined;
  const text = m.length > 2 ? `${m[1].toLowerCase()} — ${m[2]}` : m[1];
  return text.replace(/\s+/g, ' ').split(/\.\s|\.$/)[0].trim();
}

/** Bullets under "## Open questions". */
export function openQuestionsOf(body: string): number {
  const i = body.search(/^## Open questions\s*$/m);
  if (i === -1) return 0;
  let section = body.slice(i).split('\n').slice(1).join('\n');
  const next = section.search(/^## /m);
  if (next !== -1) section = section.slice(0, next);
  // A struck-through bullet ("~~Pronouns~~ — settled") is a closed question.
  return section.split('\n').filter((l) => /^\s*-\s+/.test(l) && !/^\s*-\s+~~/.test(l)).length;
}

/** Rows of the first Markdown table found after `heading` (or in the whole body). */
function tableRows(body: string, heading?: string): string[][] {
  let src = body;
  if (heading) {
    const i = body.indexOf(heading);
    if (i === -1) return [];
    src = body.slice(i + heading.length);
    const next = src.search(/\n##? /); // stay inside this section
    if (next !== -1) src = src.slice(0, next);
  }
  const rows: string[][] = [];
  let inTable = false;
  for (const line of src.split('\n')) {
    const isRow = /^\s*\|/.test(line);
    if (isRow) {
      inTable = true;
      const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // the |---|---| line
      rows.push(cells);
    } else if (inTable) {
      break;
    }
  }
  return rows.slice(1); // drop the header row
}

/**
 * Every table in a section, not just the first. A lesson's "New words" can hold
 * two — the words it teaches, then "Also introduced here" for the ones its
 * sentences reach for — and reading only the first left eight roots looking as
 * though no lesson taught them.
 */
function lessonWords(body: string, heading: string): string[] {
  const i = body.indexOf(heading);
  if (i === -1) return [];
  let src = body.slice(i + heading.length);
  const next = src.search(/\n##? /);
  if (next !== -1) src = src.slice(0, next);

  // A section holds more than one table — the words a lesson teaches, then
  // "Also introduced here" for the ones its sentences reach for — and a table
  // may lay two word columns side by side to save height, as Lesson 20 does.
  // Take every column its own header calls Word.
  const words: string[] = [];
  let cols: number[] | null = null;
  for (const line of src.split('\n')) {
    if (!/^\s*\|/.test(line)) { cols = null; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c) || !c)) continue;
    if (cols === null) {
      cols = cells.map((c, k) => (c.toLowerCase() === 'word' ? k : -1)).filter((k) => k >= 0);
      if (!cols.length) cols = [0];
      continue;
    }
    for (const k of cols) {
      const w = strip(cells[k] ?? '');
      if (/^[a-z-]+$/.test(w)) words.push(w);
    }
  }
  return words;
}

/* ---------- Dictionary ---------- */

export interface Entry {
  word: string;
  meaning: string;
  sources: string;
  group: string;
}

/** Plain text from a table cell: no emphasis markers, no "— see [file](path)" cross-references, links reduced to their label. */
const strip = (s: string) =>
  s
    .replace(/\s*[—;-]\s*see \[[^\]]+\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();

export function dictionary(): Entry[] {
  // dictionary.json is generated upstream from dictionary.md and check.py fails
  // if the two disagree, so it is a better source than parsing the table here.
  const raw = JSON.parse(readLang('dictionary/dictionary.json')) as {
    words: { word: string; meaning: string; group: string; sources: string }[];
  };
  return raw.words.map((w) => ({ ...w, sources: w.sources || '—' }));
}

export function dictionaryGroups(): { name: string; entries: Entry[] }[] {
  const out: { name: string; entries: Entry[] }[] = [];
  for (const e of dictionary()) {
    let g = out.find((x) => x.name === e.group);
    if (!g) out.push((g = { name: e.group, entries: [] }));
    g.entries.push(e);
  }
  return out;
}

/**
 * Split a run of prose into Amadunia and English pieces, by the same test the
 * Markdown pipeline uses: a fragment is Amadunia when at least three quarters
 * of its words are settled roots. For markup the site builds by hand, so the
 * colour rule holds there too.
 */
export function markAmadunia(text: string): { text: string; am: boolean }[] {
  const lex = new Set(dictionary().flatMap((e) => e.word.split('-')));
  const isAm = (s: string) => {
    const words = s.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g);
    if (!words) return false;
    const parts = words.flatMap((w) => w.split('-'));
    return parts.filter((w) => lex.has(w)).length / parts.length >= 0.75;
  };

  const out: { text: string; am: boolean }[] = [];
  const push = (text: string, am: boolean) => {
    if (!text) return;
    const last = out.at(-1);
    if (last && last.am === am) last.text += text;
    else out.push({ text, am });
  };

  // Emphasis is the author's own mark for a word in the language, and it is the
  // only signal when Amadunia sits inside an English clause with no punctuation
  // between them. Outside it, fall back to splitting on punctuation.
  for (const [i, chunk] of text.split(/\*([^*\n]+)\*/g).entries()) {
    if (i % 2 === 1) { push(chunk, isAm(chunk)); continue; }
    for (const piece of chunk.split(/(\s[—–-]\s|[;,]\s|["“”])/)) {
      if (piece === '') continue;
      push(piece, isAm(piece) && !/^(\s[—–-]\s|[;,]\s|["“”])$/.test(piece));
    }
  }
  return out;
}

/**
 * Gaps the writing has found: words a text or the phrasebook reached for and
 * did not have, with the sentence that stopped. Recorded in the dictionary's
 * own README, so the site does not have to keep its own list.
 */
export interface Wanted {
  word: string;
  foundBy: string;
  foundByHref?: string;
  sentence: string;
}

export function wantedWords(): Wanted[] {
  const body = readLang('dictionary/README.md');
  const rows = tableRows(body, '## Words the writing has asked for');
  return rows
    .filter((r) => r[0] && r[2])
    .map((r) => {
      const link = r[1]?.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const id = link?.[2].match(/([^/]+)\.md$/)?.[1];
      // The list is mostly texts, but a gap can be found by a lesson or the
      // phrasebook, and one was found by a question nobody wrote down at all.
      const href = !id
        ? undefined
        : id === 'phrasebook'
          ? '/phrasebook/'
          : id.startsWith('lesson-')
            ? `/learn/${id}/`
            : `/texts/${id}/`;
      const sentence = (r[2] ?? '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').trim();
      return { word: strip(r[0]), foundBy: link ? link[1] : strip(r[1] ?? ''), foundByHref: href, sentence };
    });
}

/**
 * English → Amadunia, as upstream derives it from the dictionary. One English
 * word can name more than one root; the dictionary says which is which.
 */
export function englishIndex(): { en: string; am: string[] }[] {
  const rows = tableRows(readLang('dictionary/index-english.md'));
  return rows
    .map((r) => ({ en: strip(r[0] ?? '').toLowerCase(), am: strip(r[1] ?? '').split(/[,;]\s*/).filter(Boolean) }))
    .filter((r) => r.en && r.am.length);
}

/**
 * Word class for every root, read off the headings dictionary.md already groups
 * by. "Actions" and a gloss beginning "to " are the verb test; the rest name
 * themselves. Qualities and ideas holds both adjectives and abstract nouns, so
 * that one group is split by whether the gloss reads as a thing.
 */
export function posIndex(): Record<string, string> {
  const GROUP: Record<string, string> = {
    Actions: 'V', 'Question words': 'Q', Prepositions: 'P', 'Grammar particles': 'G',
    Numbers: 'NUM', 'This and that': 'DEM', Place: 'LOC', Colours: 'ADJ',
  };
  // Abstract nouns inside "Qualities and ideas", which otherwise reads adjective.
  const IDEAS = new Set([
    'amani', 'arte', 'bahaya', 'golos', 'grupo', 'habari', 'historia', 'ide', 'kalima',
    'kultura', 'legis', 'lingua', 'luma', 'masal', 'mimpi', 'natura', 'numero',
    'problema', 'safari', 'sansi', 'sukut', 'surat', 'uhuru', 'umid', 'umur', 'yalan',
    'tempo', 'korku', 'gusa', 'sabar',
  ]);
  const out: Record<string, string> = {};
  for (const { word, meaning, group } of dictionary()) {
    out[word] =
      meaning.startsWith('to ') || meaning.startsWith('can,') || meaning.startsWith('must,')
        ? 'V'
        : (GROUP[group] ??
          (group === 'Qualities and ideas' ? (IDEAS.has(word) ? 'N' : 'ADJ') : 'N'));
  }
  return out;
}

/**
 * The digits, taken from the dictionary rather than written out again. A root
 * glossed with nothing but digits is a number and is worth what it says —
 * upstream's own rule, adopted here after it found the same values living in
 * four places at once. This was the fifth: the translator had them typed out.
 */
export function numerals(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of dictionary()) {
    if (/^\d+$/.test(e.meaning.trim())) out[e.meaning.trim()] = e.word;
  }
  return out;
}

/**
 * Eleven digits and bases plus mila. If the dictionary ever glosses a root "7"
 * by accident it joins the arithmetic silently, so the shape is stated.
 */
export function assertNumerals(): void {
  const n = numerals();
  const want = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '100', '1000'];
  const missing = want.filter((v) => !(v in n));
  const extra = Object.keys(n).filter((v) => !want.includes(v));
  if (missing.length || extra.length) {
    throw new Error(
      `The number system changed shape. Expected ${want.length} roots glossed as digits; ` +
        (missing.length ? `missing ${missing.join(', ')}. ` : '') +
        (extra.length ? `unexpected ${extra.join(', ')}. ` : '') +
        `Check dictionary.md against grammar/numbers.md.`,
    );
  }
}

/**
 * Names the writing actually uses: a capitalised word inside an Amadunia
 * sentence that is not one of the roots. Today that is Amadunia itself. Read
 * off the corpus so the list cannot be a guess, and so a name the language
 * starts using arrives here on its own.
 */
export function corpusNames(): string[] {
  const roots = new Set(dictionary().map((e) => e.word));
  const out = new Set<string>();
  for (const p of corpus()) {
    for (const w of p.am.match(/[A-Z][A-Za-z]*/g) ?? []) {
      if (!roots.has(w.toLowerCase())) out.add(w);
    }
  }
  return [...out].sort();
}

/** The lexicon the rule translator reads: English key to root, root to class. */
export function lexicon(): {
  en: Record<string, string>;
  pos: Record<string, string>;
  num: Record<string, string>;
  names: string[];
} {
  const en: Record<string, string> = {};
  for (const row of englishIndex()) if (!(row.en in en)) en[row.en] = row.am[0];
  return { en, pos: posIndex(), num: numerals(), names: corpusNames() };
}

/**
 * How many rule pages, lessons and texts there are, counted off the folders.
 * A dataset description is read by machines and nobody proofreads it, which is
 * exactly where a hand-typed number goes stale unseen.
 */
export function materialCounts(): { rules: number; lessons: number; texts: number } {
  const md = (dir: string, keep: (n: string) => boolean) =>
    readdirSync(join(LANG, dir)).filter((n) => n.endsWith('.md') && keep(n)).length;
  return {
    rules: md('grammar', (n) => n !== 'README.md' && !n.startsWith('proposal-')),
    lessons: md('lessons', (n) => /^lesson-\d+/.test(n)),
    texts: md('texts', (n) => /^(text|story)-\d+/.test(n)),
  };
}

/* ---------- Per-root facts, all counted rather than restated ---------- */

/** Which lesson first teaches each root, read off the lessons' own tables. */
export function taughtIn(): Record<string, { id: string; n: number }> {
  const out: Record<string, { id: string; n: number }> = {};
  const names = readdirSync(join(LANG, 'lessons'))
    .filter((n) => /^lesson-\d+/.test(n))
    .sort((a, b) => lessonNumber(a) - lessonNumber(b));
  for (const name of names) {
    const id = name.replace(/\.md$/, '');
    for (const w of lessonWords(readLang(`lessons/${name}`), '## New words')) {
      if (!(w in out)) out[w] = { id, n: lessonNumber(name) };
    }
  }
  return out;
}

/**
 * The frequency table frequency.md publishes, quoted rather than recomputed.
 * Upstream counts every word inside an Amadunia sentence across the lessons,
 * texts and phrasebook — 5321 words. This site cannot reproduce that from the
 * corpus, which holds only the sentences that carry an English gloss, so where
 * upstream has a number this uses upstream's.
 */
export function frequencyTable(): Record<string, { uses: number; share: string; rank: number }> {
  const rows = tableRows(readLang('dictionary/frequency.md'), '## The forty commonest');
  const out: Record<string, { uses: number; share: string; rank: number }> = {};
  for (const r of rows) {
    const rank = Number(strip(r[0] ?? ''));
    const word = strip(r[1] ?? '');
    const uses = Number(strip(r[3] ?? ''));
    const share = strip(r[4] ?? '');
    if (word && Number.isFinite(rank) && Number.isFinite(uses)) out[word] = { uses, share, rank };
  }
  return out;
}

/**
 * A different measure, and labelled as one: how many of the glossed sentence
 * pairs use a root. The corpus is what this site publishes and what the
 * translator is scored against, so it is the number a reader here can check.
 */
export function pairsUsing(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of corpus()) {
    const seen = new Set<string>();
    for (const w of p.am.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g) ?? []) {
      const parts = w.split('-');
      // A doubled noun is one root in its plural form, not two words.
      const root = parts.length === 2 && parts[0] === parts[1] ? parts[0] : w;
      for (const piece of root.split('-')) seen.add(piece);
    }
    for (const piece of seen) counts[piece] = (counts[piece] ?? 0) + 1;
  }
  return counts;
}

/** Every corpus sentence that uses a root, newest material last. */
export function sentencesUsing(root: string, limit = 12): Pair[] {
  const re = new RegExp(`(^|[^a-z-])${root}(-${root})?([^a-z-]|$)`, 'i');
  return corpus()
    .filter((p) => re.test(p.am))
    .sort((a, b) => a.am.split(/\s+/).length - b.am.split(/\s+/).length)
    .slice(0, limit);
}

/** The English words the index sends to a root — what a writer would look up. */
export function englishFor(root: string): string[] {
  return englishIndex()
    .filter((r) => r.am.includes(root))
    .map((r) => r.en);
}

/* ---------- Alphabet, as phonology.md states it ---------- */

export interface Inventory {
  vowels: string[];
  consonants: string[];
  digraphs: string[];
}

export function phonologyInventory(): Inventory {
  const body = readLang('grammar/phonology.md');
  const inv: Inventory = { vowels: [], consonants: [], digraphs: [] };
  for (const [label, letters] of tableRows(body, '## Alphabet')) {
    const l = strip(label).toLowerCase();
    const list = strip(letters).split(/\s+/)[0] === letters.trim().split(/\s+/)[0]
      ? letters.replace(/\*/g, '').split(/—|-\s/)[0].trim().split(/\s+/)
      : [];
    if (l.startsWith('vowel')) inv.vowels = list;
    else if (l.startsWith('consonant')) inv.consonants = list;
    else if (l.startsWith('digraph')) inv.digraphs = list;
  }
  return inv;
}

/* ---------- README status ---------- */

export interface Status {
  born?: string;
  /** Milestones already passed, e.g. [80, 180, 300]. */
  passed: number[];
  /** The next vocabulary target and the level it buys, e.g. { roots: 600, level: 'A2' }. */
  next?: { roots: number; level?: string };
  /** The README's own headline claim about the grammar. */
  grammar?: string;
}

/**
 * The Status section of the language README. Its wording is rewritten often —
 * three of these fields broke silently on 2026-09-03 — so each is read from the
 * shape of the sentence rather than its exact words, and every one is optional.
 */
export function readmeStatus(): Status {
  const body = readLang('README.md');
  const status = section(body, /^##\s+Status\s*$/m) || body;

  const born = status.match(/born on \*\*(.+?)\*\*/)?.[1];

  const passed = (status.match(/Milestones[^.\n]*?:([^.\n]*)/i)?.[1].match(/\d+/g) ?? []).map(Number);

  // The README is hard-wrapped, so every gap here has to tolerate a newline.
  const nextLine = status.match(/Next is\s+(?:([\w-]+),?\s*)?at\s+around\s+(\d+)/i);
  const next = nextLine ? { roots: Number(nextLine[2]), level: nextLine[1] } : undefined;

  // The bolded claim, e.g. "The grammar needed for A2 is complete."
  const grammar = status
    .match(/\*\*(The grammar[^*]+?)\*\*/)?.[1]
    ?.replace(/\s+/g, ' ')
    .trim();

  return { born, passed, next, grammar };
}

/**
 * Which open questions the writing has actually reached for: upstream's own
 * count of pages that tried to say something and stopped. Its README states
 * plainly that this table is hand-kept and not machine-checked, so the site
 * carries that caveat with it rather than presenting it as measured fact.
 */
export interface Demand {
  question: string;
  pages: number;
  sources: { label: string; href?: string }[];
  /** Struck through upstream once the question has been answered. */
  settled: boolean;
}

export function questionDemand(): { asOf?: string; rows: Demand[]; settled: number } {
  const body = readLang('grammar/README.md');
  const heading = '### What the writing has actually asked for';
  if (!body.includes(heading)) return { rows: [] };
  const asOf = body.slice(body.indexOf(heading)).match(/Counted ([^.]+)\./)?.[1];

  const rows = tableRows(body, heading)
    .filter((r) => r[0] && r[1] !== undefined)
    .map((r) => {
      const cell = r[1];
      const pages = Number(cell.match(/\d+/)?.[0] ?? 0);
      const sources = [...cell.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => {
        const id = m[2].match(/([^/]+)\.md$/)?.[1];
        const href = !id
          ? undefined
          : id === 'phrasebook'
            ? '/phrasebook/'
            : /^(story|text)-/.test(id)
              ? `/texts/${id}/`
              : /^lesson-/.test(id)
                ? `/learn/${id}/`
                : `/grammar/${id}/`;
        return { label: strip(m[1]), href };
      });
      const settled = /~~/.test(r[0]);
      return { question: strip(r[0]).replace(/~~/g, ''), pages, sources, settled };
    });
  return { asOf, rows: rows.filter((r) => !r.settled), settled: rows.filter((r) => r.settled).length };
}

/** The headline counts GUARANTEES.md states about itself. */
export function guaranteeCounts(): { guarantees?: number; groups?: number } {
  const m = readLang('GUARANTEES.md').match(
    /\*\*(\d+) guarantees\*\*[\s\S]{0,40}?\*\*(\d+) groups\*\*/,
  );
  return m ? { guarantees: Number(m[1]), groups: Number(m[2]) } : {};
}

/* ---------- Texts ---------- */

/** The italic line under a text's title: its English rendering. */
export function subtitleOf(body: string): string | undefined {
  const after = body.replace(/^#\s+.+$/m, '');
  return after.match(/^\*([^*\n]+)\*\s*$/m)?.[1]?.trim();
}

/** The body of one "## Heading" section, up to the next heading of any level. */
function section(body: string, heading: RegExp): string {
  const m = body.match(heading);
  if (!m || m.index === undefined) return '';
  const rest = body.slice(m.index + m[0].length);
  const next = rest.search(/^#{1,3} /m);
  return next === -1 ? rest : rest.slice(0, next);
}

/** "34 of 113" from a text's "## Roots used" section. */
export function rootsUsedOf(body: string): { used: number; of: number } | undefined {
  // "34 of 113" and "34 roots, of the 113 that existed when this was written".
  const n = section(body, /^##\s+Roots used\s*$/m).match(/(\d+)\b[^.]*?\bof\b[^.]*?(\d+)/);
  return n ? { used: Number(n[1]), of: Number(n[2]) } : undefined;
}

/**
 * Gaps a text records; a struck-through one has since been closed. The heading
 * and the shape both vary — five wordings, and either a numbered list or a run
 * of paragraphs each opening in bold.
 */
export function gapsOf(body: string): { total: number; open: number } {
  const heading = /^##\s+(?:Gaps\s*$|What (?:the language|this text)[^\n]*could not[^\n]*$)/m;
  const items = section(body, heading)
    .split('\n')
    .filter((l) => /^\s*\d+\.\s+/.test(l) || /^\*\*/.test(l));
  return { total: items.length, open: items.filter((l) => !/~~/.test(l)).length };
}

/**
 * The claims texts/README.md makes about the collection, each a paragraph
 * opening in bold. Quoted rather than restated, so they cannot drift from what
 * upstream says or from what its checker enforces.
 */
export function textsClaims(): { lead: string; rest: string }[] {
  const body = readLang('texts/README.md');
  const out: { lead: string; rest: string }[] = [];
  for (const para of body.split(/\n\s*\n/)) {
    const m = para.match(/^\*\*([^*]+)\*\*([\s\S]*)$/);
    if (!m) continue;
    const clean = (t: string) =>
      t
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Emphasis markers, not text. The colour on an Amadunia word here comes
        // from the dictionary, not from upstream's italics, so dropping them
        // loses nothing and printing them would show a reader an asterisk.
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    out.push({ lead: clean(m[1]), rest: clean(m[2]) });
  }
  return out;
}

/** "story-2-safari-por-pahar" and "text-5-uan" both order by their number. */
/**
 * How many texts exercise each settled rule, from the table check.py generates
 * in texts/README.md. The claim above it says "this table", so the page that
 * quotes the claim has to carry the table with it.
 */
export function rulesExercised(): { rule: string; texts: number }[] {
  const body = readLang('texts/README.md');
  const i = body.indexOf('<!-- generated -->');
  const j = body.indexOf('<!-- end generated -->');
  if (i === -1 || j === -1) return [];
  return body
    .slice(i, j)
    .split('\n')
    .map((line) => line.match(/^\|\s*([a-z ]+?)\s*\|\s*(\d+)\s*\|$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ rule: m[1], texts: Number(m[2]) }));
}

export function textNumber(id: string): number {
  return Number(id.match(/^(?:story|text)-(\d+)/)?.[1] ?? 0);
}

/** What each text is, as its own index calls it: a story, a poem, a dialogue. */
export function textKinds(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of tableRows(readLang('texts/README.md'))) {
    const id = row[0]?.match(/\(([^)]+)\.md\)/)?.[1];
    const kind = row[2]?.split('—').pop()?.trim();
    if (id && kind) out[id] = kind.replace(/^an? /, '').split(',')[0].trim();
  }
  return out;
}

/**
 * The reading ladder's own headline figures: what share of the texts a learner
 * knows after the first lesson, and the earliest lesson after which any text
 * becomes readable. Parsed from its tables so they cannot drift from the page.
 */
export function readingLadder(): {
  firstLessonShare?: string;
  earliest?: number;
  earliestText?: string;
  nextEarliest?: number;
} {
  let body: string;
  try {
    body = readLang('lessons/reading-ladder.md');
  } catch {
    return {};
  }
  const firstLessonShare = tableRows(body, '## After each lesson')[0]?.[1]?.trim();
  const opens = tableRows(body, '## When each text opens')
    .map((r) => ({ text: strip(r[0] ?? ''), after: Number(r[1]) }))
    .filter((r) => r.text && Number.isFinite(r.after))
    .sort((a, b) => a.after - b.after);
  const next = opens.find((o) => o.after > (opens[0]?.after ?? 0));
  return {
    firstLessonShare,
    earliest: opens[0]?.after,
    earliestText: opens[0]?.text,
    nextEarliest: next?.after,
  };
}

/* ---------- Lessons ---------- */

export function lessonNumber(id: string): number {
  return Number(id.match(/lesson-(\d+)/)?.[1] ?? 0);
}

/** "Lesson 1 — Greetings" → { label: "Lesson 1", name: "Greetings" } */
export function splitLessonTitle(title: string): { label: string; name: string } {
  const [label, ...rest] = title.split(/\s+—\s+/);
  return { label: label.trim(), name: rest.join(' — ').trim() || label.trim() };
}

export function newWordsOf(body: string): number {
  const heading = body.match(/^## New words?\s*$/m)?.[0];
  if (!heading) return 0;
  return tableRows(body, heading).filter((r) => r[0]).length;
}

/** Byte size of a file the site serves, for the dataset listing. */
export function langFileSize(rel: string): number {
  return Buffer.byteLength(readLang(rel), 'utf8');
}

/* ---------- Downloadable bodies -------------------------------------------
 * Built here rather than in the routes, so the data page can measure exactly
 * what the routes will serve. A contentSize in the dataset markup is a factual
 * claim and cannot be an estimate. */

export function corpusTsv(): string {
  const rows = corpus().map((p) => `${p.am}\t${p.en}\t${p.source}`);
  return ['amadunia\tenglish\tsource', ...rows].join('\n') + '\n';
}

export function corpusJsonl(): string {
  return (
    corpus()
      .map((p) => JSON.stringify({ am: p.am, en: p.en, source: p.source }))
      .join('\n') + '\n'
  );
}

/**
 * How often the rules reproduce the sentence a person actually wrote. Measured
 * against every pair in the corpus on every build, so the figure the page
 * quotes is the figure this code scores today — not one written down once.
 */
export function translationAccuracy() {
  const lex = lexicon() as never;
  const pairs = corpus();
  const by: Record<string, { ok: number; n: number }> = {};
  const len: Record<string, { ok: number; n: number }> = {};
  let exact = 0;
  for (const p of pairs) {
    const hit = ruleTranslate(lex, p.en).trim() === p.am.trim();
    if (hit) exact++;
    const k = p.source.split('/')[0].replace(/\.md$/, '');
    const words = p.am.split(/\s+/).length;
    const b = words <= 3 ? 'short' : words <= 6 ? 'medium' : 'long';
    (by[k] ??= { ok: 0, n: 0 }).n++; if (hit) by[k].ok++;
    (len[b] ??= { ok: 0, n: 0 }).n++; if (hit) len[b].ok++;
  }
  return { exact, total: pairs.length, pct: Math.round((1000 * exact) / pairs.length) / 10, by, len };
}

/**
 * The rules reproduced 61.9% of the corpus when they were written. A large drop
 * means an upstream change broke a rule rather than merely moved a number, and
 * the build should say so rather than quietly publish a worse tool.
 */
export function assertTranslatorWorks(): void {
  const { pct, exact, total } = translationAccuracy();
  if (pct < 55) {
    throw new Error(
      `The rule translator reproduces only ${exact} of ${total} corpus sentences (${pct}%). ` +
        `It scored 61.9% when written; below 55% something is broken, not merely changed. ` +
        `Check src/lib/translate.ts against the grammar pages that moved.`,
    );
  }
}

/** The whole language as one plain-text document, as /llms-full.txt serves it. */
export function fullReference(base: string): string {
  const head = `# Amadunia — complete reference

Source: ${LANG_REPO} (CC BY-SA 4.0). Rendered at ${base}. Summary: ${base}llms.txt. Machine-readable: ${base}dictionary.json, ${base}corpus.tsv.
Language tag: art-x-amadunia. Grey/fuchsia on the site marks English/Amadunia; here, Amadunia words are the ones in the left columns and in italics.

`;
  const parts = allLangFiles().map(
    ({ rel, body }) => `<!-- ${rel} — ${LANG_REPO}/blob/main/${rel} -->\n\n${body.trim()}\n`,
  );
  return head + parts.join('\n\n---\n\n');
}

/** The dictionary payload as /dictionary.json serves it. */
export function dictionaryJson(site: string, nextTarget: number | null): string {
  const entries = dictionary();
  return JSON.stringify(
    {
      language: { name: 'Amadunia', tag: 'art-x-amadunia' },
      roots: entries.length,
      next_target: nextTarget,
      license: 'CC BY-SA 4.0',
      source: `${LANG_REPO}/blob/main/dictionary/dictionary.md`,
      site,
      entries: entries.map((e) => ({
        word: e.word,
        meaning: e.meaning,
        group: e.group,
        sources: e.sources === '—' ? null : e.sources,
      })),
    },
    null,
    2,
  );
}

/**
 * The English index as one document. Serialised here so the page that reports
 * its size and the route that serves it cannot disagree about a single byte.
 */
export function englishIndexJson(site: string): string {
  const entries = englishIndex();
  return JSON.stringify(
    {
      language: { name: 'Amadunia', tag: 'art-x-amadunia' },
      direction: 'en -> art-x-amadunia',
      entries_count: entries.length,
      note: 'Derived from the dictionary. One English word may name more than one root; the dictionary entry says which is which. Verbs are keyed as "to speak".',
      license: 'CC BY-SA 4.0',
      source: `${LANG_REPO}/blob/main/dictionary/index-english.md`,
      site,
      pos_note:
        'Word class per root, read off the headings in dictionary.md. N noun, V verb, ADJ adjective, Q question word, P preposition, LOC place word, NUM number, DEM demonstrative, G particle.',
      pos: posIndex(),
      numerals: numerals(),
      names: corpusNames(),
      entries,
    },
    null,
    2,
  );
}

export function bytes(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

/* ---------- Whole-repository readers: full text and parallel corpus ---------- */


export interface LangFile {
  rel: string; // e.g. "grammar/tense.md"
  body: string;
}

/**
 * Every Markdown file of the language, in reading order: the front page, the
 * grammar, the lessons, the texts, the phrasebook, the dictionary. This feeds
 * both /llms-full.txt and the corpus, so a folder missing here is a folder
 * missing from both — texts were, for a fortnight, which made the full
 * reference incomplete and left the corpus with no sentence from any text.
 */
export function allLangFiles(): LangFile[] {
  const ordinal = (n: string) => Number(n.match(/(?:lesson|story|text)-(\d+)/)?.[1] ?? NaN);
  const files: LangFile[] = [{ rel: 'README.md', body: readLang('README.md') }];

  for (const dir of ['grammar', 'lessons', 'texts', 'dictionary']) {
    const names = readdirSync(join(LANG, dir))
      .filter((n) => n.endsWith('.md'))
      .sort((a, b) => {
        const na = ordinal(a), nb = ordinal(b);
        return Number.isNaN(na) || Number.isNaN(nb) ? a.localeCompare(b) : na - nb;
      });
    for (const n of names) files.push({ rel: `${dir}/${n}`, body: readLang(`${dir}/${n}`) });
    if (dir === 'texts') files.push({ rel: 'phrasebook.md', body: readLang('phrasebook.md') });
  }
  return files;
}

export interface Pair {
  am: string;
  en: string;
  source: string; // file the pair came from
}

const clean = (s: string) =>
  s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();

/**
 * Amadunia–English sentence pairs, pulled from every table whose columns are
 * "Amadunia | English" (or a headerless two-column table in a lesson) and from
 * every practice line of the form "1. Mi kan anak. — *I see a child.*".
 */
export function corpus(): Pair[] {
  const pairs: Pair[] = [];
  const seen = new Set<string>();
  const roots = new Set(dictionary().map((e) => e.word));
  // Is the left cell actually Amadunia? A headerless two-column table is
  // usually a translation, but Lesson 23 summarises the grammar in one —
  // "Adjectives | after the noun" — and that is not a sentence pair.
  const isAmadunia = (text: string) => {
    const words = text.match(/[A-Za-z]+(?:-[A-Za-z]+)*/g) ?? [];
    const isRoot = (w: string) =>
      w.toLowerCase().split('-').every((piece) => roots.has(piece));
    // A capitalised word the dictionary does not hold is a name — Sol, Luma,
    // Amadunia itself — and a name is neither Amadunia nor English, so it
    // votes for neither side.
    const judged = words.filter((w) => isRoot(w) || !/^[A-Z]/.test(w));
    if (!judged.length) return false;
    return judged.filter(isRoot).length / judged.length >= 0.6;
  };

  const push = (am: string, en: string, source: string) => {
    am = clean(am); en = clean(en);
    if (!am || !en || am === '—' || en === '—') return;
    if (!isAmadunia(am)) return;
    // An em dash on the English side alone opens a note, not a translation:
    // "My head is hot. — the nearest the language gets to my head hurts".
    // Where both sides carry one it is dialogue or punctuation, and stays.
    if (!am.includes(' — ') && en.includes(' — ')) en = en.split(' — ')[0].trim();
    if (!en) return;
    const key = `${am}\t${en}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ am, en, source });
  };

  for (const { rel, body } of allLangFiles()) {
    // The dictionary is a word list, and a folder's README is prose about a
    // collection; neither pairs a sentence with its translation.
    if (rel.endsWith('README.md') || rel.startsWith('dictionary/')) continue;
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Practice lines: "3. Doktor bil. — *The doctor knows.*"
      const m = line.match(/^\s*\d+\.\s+(.+?)\s+—\s+\*(.+?)\*/);
      if (m) { push(m[1], m[2], rel); continue; }
      // Table header rows
      if (!/^\s*\|/.test(line) || !/^\s*\|/.test(lines[i + 1] ?? '') || !/-{2,}/.test(lines[i + 1])) continue;
      const headers = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim().toLowerCase());
      let amIdx = headers.indexOf('amadunia'), enIdx = headers.indexOf('english');
      // A headerless two-column table pairs Amadunia with English wherever the
      // language is taught or used — the phrasebook and the texts do it too.
      if (amIdx === -1 && enIdx === -1 && headers.length === 2 && headers.every((h) => !h) && !rel.startsWith('grammar/')) {
        amIdx = 0; enIdx = 1;
      }
      if (amIdx === -1 || enIdx === -1) continue;
      for (let j = i + 2; j < lines.length && /^\s*\|/.test(lines[j]); j++) {
        const cells = lines[j].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        push(cells[amIdx] ?? '', cells[enIdx] ?? '', rel);
      }
    }
  }
  return pairs;
}
