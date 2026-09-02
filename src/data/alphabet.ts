// PLACEHOLDER INVENTORY — replace with the real Amadunia alphabet.
// One letter, one sound. The count on the site is derived from this list.
export interface Letter {
  glyph: string;
  ipa: string;
  as_in: string;
  example: string;
  gloss: string;
}

export const vowels: Letter[] = [
  { glyph: 'a', ipa: '/a/', as_in: 'father', example: 'ama', gloss: 'to love' },
  { glyph: 'e', ipa: '/e/', as_in: 'bed', example: 'ele', gloss: 'placeholder' },
  { glyph: 'i', ipa: '/i/', as_in: 'machine', example: 'mi', gloss: 'I' },
  { glyph: 'o', ipa: '/o/', as_in: 'more', example: 'olo', gloss: 'placeholder' },
  { glyph: 'u', ipa: '/u/', as_in: 'flute', example: 'dunia', gloss: 'world' },
];

export const consonants: Letter[] = [
  { glyph: 'b', ipa: '/b/', as_in: 'boat', example: 'baba', gloss: 'placeholder' },
  { glyph: 'd', ipa: '/d/', as_in: 'day', example: 'dunia', gloss: 'world' },
  { glyph: 'f', ipa: '/f/', as_in: 'find', example: 'fofo', gloss: 'placeholder' },
  { glyph: 'g', ipa: '/g/', as_in: 'good', example: 'gogo', gloss: 'placeholder' },
  { glyph: 'h', ipa: '/h/', as_in: 'house', example: 'haha', gloss: 'placeholder' },
  { glyph: 'j', ipa: '/j/', as_in: 'yes', example: 'jaja', gloss: 'placeholder' },
  { glyph: 'k', ipa: '/k/', as_in: 'kite', example: 'kaka', gloss: 'placeholder' },
  { glyph: 'l', ipa: '/l/', as_in: 'lake', example: 'lala', gloss: 'placeholder' },
  { glyph: 'm', ipa: '/m/', as_in: 'moon', example: 'mi', gloss: 'I' },
  { glyph: 'n', ipa: '/n/', as_in: 'name', example: 'nana', gloss: 'placeholder' },
  { glyph: 'p', ipa: '/p/', as_in: 'pen', example: 'papa', gloss: 'placeholder' },
  { glyph: 's', ipa: '/s/', as_in: 'sun', example: 'sasa', gloss: 'placeholder' },
  { glyph: 't', ipa: '/t/', as_in: 'time', example: 'tata', gloss: 'placeholder' },
];

export const alphabet: Letter[] = [...vowels, ...consonants].sort((a, b) =>
  a.glyph.localeCompare(b.glyph),
);
