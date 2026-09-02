// The alphabet as the site presents it: each letter with a sound value and
// an example drawn from the settled dictionary. The letter list itself is
// owned by lang/grammar/phonology.md — assertMatchesPhonology() fails the
// build if this file and that one ever disagree. The IPA values and the
// "as in" hints are the site's reading of "one letter, one sound" and are
// not (yet) stated in phonology.md.
import { phonologyInventory } from '../lib/lang';

export interface Letter {
  glyph: string;
  ipa: string;
  as_in: string;
  example: string;
  gloss: string;
  digraph?: boolean;
}

export const vowels: Letter[] = [
  { glyph: 'a', ipa: '/a/', as_in: 'father', example: 'ama', gloss: 'to love' },
  { glyph: 'e', ipa: '/e/', as_in: 'bed', example: 'des', gloss: 'ten' },
  { glyph: 'i', ipa: '/i/', as_in: 'machine', example: 'mi', gloss: 'I' },
  { glyph: 'o', ipa: '/o/', as_in: 'more', example: 'sol', gloss: 'sun' },
  { glyph: 'u', ipa: '/u/', as_in: 'flute', example: 'dunia', gloss: 'world' },
];

export const consonants: Letter[] = [
  { glyph: 'b', ipa: '/b/', as_in: 'boat', example: 'bai', gloss: 'goodbye' },
  { glyph: 'c', ipa: '/tʃ/', as_in: 'church, chai', example: 'ca', gloss: 'tea' },
  { glyph: 'd', ipa: '/d/', as_in: 'day', example: 'din', gloss: 'day' },
  { glyph: 'f', ipa: '/f/', as_in: 'find', example: 'fai', gloss: 'five' },
  { glyph: 'g', ipa: '/g/', as_in: 'good', example: 'go', gloss: 'to go' },
  { glyph: 'h', ipa: '/h/', as_in: 'house', example: 'hao', gloss: 'good' },
  { glyph: 'k', ipa: '/k/', as_in: 'kite', example: 'kita', gloss: 'we' },
  { glyph: 'l', ipa: '/l/', as_in: 'lake', example: 'luma', gloss: 'light' },
  { glyph: 'm', ipa: '/m/', as_in: 'moon', example: 'mama', gloss: 'mother' },
  { glyph: 'n', ipa: '/n/', as_in: 'name', example: 'nama', gloss: 'name' },
  { glyph: 'p', ipa: '/p/', as_in: 'pen', example: 'pan', gloss: 'bread' },
  { glyph: 'r', ipa: '/r/', as_in: 'Spanish pero', example: 'rafiki', gloss: 'friend' },
  { glyph: 's', ipa: '/s/', as_in: 'sun', example: 'salam', gloss: 'peace' },
  { glyph: 't', ipa: '/t/', as_in: 'time', example: 'tri', gloss: 'three' },
  { glyph: 'y', ipa: '/j/', as_in: 'yes', example: 'ya', gloss: 'yes' },
];

// None since 2026-09-02: ch became c. Kept as a list so the pages stay correct if one returns.
export const digraphs: Letter[] = [];

export const letters: Letter[] = [...vowels, ...consonants].sort((a, b) => a.glyph.localeCompare(b.glyph));

/** Letters plus any digraphs, in one line: what the strip on the page shows. */
export const alphabet: Letter[] = [...letters, ...digraphs];

export function assertMatchesPhonology(): void {
  const inv = phonologyInventory();
  const same = (a: string[], b: string[]) => a.slice().sort().join(' ') === b.slice().sort().join(' ');
  const mismatch: string[] = [];
  if (!same(inv.vowels, vowels.map((l) => l.glyph))) mismatch.push(`vowels: phonology says "${inv.vowels.join(' ')}"`);
  if (!same(inv.consonants, consonants.map((l) => l.glyph))) mismatch.push(`consonants: phonology says "${inv.consonants.join(' ')}"`);
  if (!same(inv.digraphs, digraphs.map((l) => l.glyph))) mismatch.push(`digraphs: phonology says "${inv.digraphs.join(' ')}"`);
  if (mismatch.length) {
    throw new Error(
      `src/data/alphabet.ts disagrees with lang/grammar/phonology.md — ${mismatch.join('; ')}. Update alphabet.ts.`,
    );
  }
}
