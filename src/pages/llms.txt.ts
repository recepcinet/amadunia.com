// /llms.txt — a plain-text summary of the site for AI crawlers, in the
// llmstxt.org convention. Counts come from the data so it cannot go stale.
import type { APIRoute } from 'astro';
import { alphabet, vowels, consonants } from '../data/alphabet';
import { rules } from '../data/rules';
import { Spell, spell } from '../data/spell';

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString() ?? 'https://amadunia.com/';
  const body = `# Amadunia

> A world auxiliary language built from the easiest features of all languages. ${Spell(alphabet.length)} letters, one sound each, and a grammar with no exceptions. The language's own tag is \`art-x-amadunia\` (a constructed language with no ISO code). Its motto is "Mi ama dunia" — "I love the world".

Amadunia takes the easiest feature from every language it can find and leaves the rest behind. A word that would need a rule of its own is not admitted. The alphabet is ${spell(vowels.length)} vowels and ${spell(consonants.length)} consonants written in the Latin script without accents or digraphs; spelling and pronunciation never diverge.

The project is developed in the open under the MIT licence at https://github.com/recepcinet/amadunia.com. Much of the language content on the site is still a draft.

## Pages

- [Alphabet](${base}alphabet/): the ${spell(alphabet.length)} letters with their sounds and example words
- [Grammar](${base}grammar/): the complete grammar as ${spell(rules.length)} rules
- [Dictionary](${base}dictionary/): the word list, searchable
- [Learn](${base}learn/): a short course, lesson by lesson
- [About](${base}about/): why the language exists and what it holds itself to

## Alphabet

${alphabet.map((l) => `${l.glyph} ${l.ipa}`).join(', ')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
