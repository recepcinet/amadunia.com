// Build-time readers for the parts of lang/ that are not rendered as pages
// but parsed into data: the dictionary table, the alphabet in phonology.md,
// and the status line in the README. Everything here runs at build only.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LANG = join(process.cwd(), 'lang');
export const LANG_REPO = 'https://github.com/recepcinet/amadunia-lang';

export function readLang(rel: string): string {
  return readFileSync(join(LANG, rel), 'utf8');
}

/* ---------- Markdown helpers ---------- */

export function titleOf(body: string): string {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1] : '';
}

/** The "*Status: …*" line, up to its first full stop. */
export function statusOf(body: string): string | undefined {
  const m = body.match(/^\*Status:\s*(.+?)\*\s*$/m);
  if (!m) return undefined;
  return m[1].split(/\.\s|\.$/)[0].trim();
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
  const body = readLang('dictionary/dictionary.md');
  const entries: Entry[] = [];
  let group = '';
  for (const cells of tableRows(body)) {
    const [word, meaning, sources] = cells;
    // A group heading fills only the first cell. Some carry a note after the
    // bold name ("**Prepositions** — before the noun"), so match the opening
    // bold rather than the whole cell.
    if (/^\*\*/.test(word) && !meaning && !sources) {
      group = strip(word).replace(/\s+[—-]\s+.*$/, '');
      continue;
    }
    if (!word) continue;
    entries.push({ word: strip(word), meaning: strip(meaning ?? ''), sources: strip(sources ?? ''), group });
  }
  return entries;
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
  target: number;
  milestones: number[];
  born?: string;
  /** The README's own sentence(s) on what is settled and what is still open. */
  settled?: string;
}

export function readmeStatus(): Status {
  const body = readLang('README.md');
  const target = Number(body.match(/target for A1 is \*\*(\d+) roots\*\*/i)?.[1] ?? 300);
  // "Milestones: 80 roots (survival — reached September 2, 2026) → 180 → 300"
  // — the numbers that matter are outside the parentheses.
  const ms = (body.match(/Milestones:\s*(.+)$/m)?.[1] ?? '').replace(/\([^)]*\)/g, '');
  const milestones = (ms.match(/\d+/g) ?? []).map(Number);
  const born = body.match(/born on \*\*(.+?)\*\*/)?.[1];
  const settled = body
    .match(/^([^\n]*? are settled\.(?:[^\n]*?still being decided\.)?)/m)?.[1]
    ?.replace(/\*/g, '')
    .trim();
  return { target, milestones, born, settled };
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

/** Gaps a text records; a struck-through one has since been closed. */
export function gapsOf(body: string): { total: number; open: number } {
  const items = section(body, /^##\s+What the language could not say\s*$/m)
    .split('\n')
    .filter((l) => /^\s*\d+\.\s+/.test(l));
  return { total: items.length, open: items.filter((l) => !/~~/.test(l)).length };
}

export function newWordsOf(body: string): number {
  const heading = body.match(/^## New words?\s*$/m)?.[0];
  if (!heading) return 0;
  return tableRows(body, heading).filter((r) => r[0]).length;
}

/* ---------- Whole-repository readers: full text and parallel corpus ---------- */

import { readdirSync } from 'node:fs';

export interface LangFile {
  rel: string; // e.g. "grammar/tense.md"
  body: string;
}

/** Every Markdown file the site renders or parses, in a stable order. */
export function allLangFiles(): LangFile[] {
  const files: LangFile[] = [{ rel: 'README.md', body: readLang('README.md') }];
  for (const dir of ['grammar', 'lessons', 'dictionary']) {
    const names = readdirSync(join(LANG, dir))
      .filter((n) => n.endsWith('.md'))
      .sort((a, b) => {
        const na = a.match(/lesson-(\d+)/), nb = b.match(/lesson-(\d+)/);
        return na && nb ? Number(na[1]) - Number(nb[1]) : a.localeCompare(b);
      });
    for (const n of names) files.push({ rel: `${dir}/${n}`, body: readLang(`${dir}/${n}`) });
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
  const push = (am: string, en: string, source: string) => {
    am = clean(am); en = clean(en);
    if (!am || !en || am === '—' || en === '—') return;
    const key = `${am}\t${en}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ am, en, source });
  };

  for (const { rel, body } of allLangFiles()) {
    if (rel === 'README.md' || rel.startsWith('dictionary/')) continue;
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
      if (amIdx === -1 && enIdx === -1 && headers.length === 2 && headers.every((h) => !h) && rel.startsWith('lessons/')) {
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
