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
  const m = body.match(/^## Open questions\s*\n([\s\S]*?)(?=^## |\Z)/m);
  if (!m) return 0;
  return (m[1].match(/^\s*-\s+/gm) ?? []).length;
}

/** Rows of the first Markdown table found after `heading` (or in the whole body). */
function tableRows(body: string, heading?: string): string[][] {
  let src = body;
  if (heading) {
    const i = body.indexOf(heading);
    if (i === -1) return [];
    src = body.slice(i);
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

const strip = (s: string) => s.replace(/\*\*/g, '').replace(/\*/g, '').trim();

export function dictionary(): Entry[] {
  const body = readLang('dictionary/dictionary.md');
  const entries: Entry[] = [];
  let group = '';
  for (const cells of tableRows(body)) {
    const [word, meaning, sources] = cells;
    if (/^\*\*.+\*\*$/.test(word) && !meaning && !sources) {
      group = strip(word);
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
}

export function readmeStatus(): Status {
  const body = readLang('README.md');
  const target = Number(body.match(/target for A1 is \*\*(\d+) roots\*\*/i)?.[1] ?? 300);
  const ms = body.match(/Milestones:\s*(.+)$/m)?.[1] ?? '';
  const milestones = (ms.match(/\d+/g) ?? []).map(Number);
  const born = body.match(/born on \*\*(.+?)\*\*/)?.[1];
  return { target, milestones, born };
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
  return tableRows(body, '## New words').filter((r) => r[0]).length;
}
