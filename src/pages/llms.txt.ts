// /llms.txt — a plain-text summary of the site for AI crawlers, in the
// llmstxt.org convention. Everything in it is derived from lang/ and the
// site's data, so it cannot go stale.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { alphabet, letters, vowels, consonants, digraphs } from '../data/alphabet';
import { rules } from '../data/rules';
import { Spell, spell } from '../data/spell';
import { dictionary, readmeStatus, titleOf, subtitleOf, statusOf, lessonNumber, splitLessonTitle, LANG_REPO } from '../lib/lang';

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString() ?? 'https://amadunia.com/';
  const words = dictionary();
  const { next } = readmeStatus();
  const grammar = (await getCollection('grammar')).map((e) => ({ id: e.id, title: titleOf(e.body ?? ''), status: statusOf(e.body ?? '') }));
  const texts = await getCollection('texts');
  const lessons = (await getCollection('lessons'))
    .map((e) => ({ id: e.id, n: lessonNumber(e.id), ...splitLessonTitle(titleOf(e.body ?? '')) }))
    .sort((a, b) => a.n - b.n);

  const body = `# Amadunia

> A constructed world auxiliary language built on one principle: take the easiest feature from every language. ${Spell(letters.length)} letters${digraphs.length ? ` plus the digraph ${digraphs.map((d) => d.glyph).join(', ')}` : ''}, one sound each; no conjugation, no gender, no articles; no exceptions. Its motto is "Mi ama dunia" — "I love the world". Language tag: art-x-amadunia (a constructed language with no ISO code).

The alphabet is ${spell(vowels.length)} vowels and ${spell(consonants.length)} consonants in the Latin script without accents or digraphs (c is the sound of chai and church); spelling and pronunciation never diverge, and syllables never have more than two consonants in a row. Vocabulary is drawn from the largest language families of the world for global balance; words already global (hi, ok, taksi, foto) are kept. The dictionary currently has ${words.length} roots; the next target is ${next?.roots ?? 600}${next?.level ? ` for ${next.level}` : ''}.

The language is developed in the open at ${LANG_REPO} (CC BY-SA 4.0). This site renders that repository directly.

## Grammar

${rules.map((r) => `- ${r.claim}. ${r.body}${r.example ? ` Example: "${r.example.form}" — ${r.example.gloss}.` : ''}`).join('\n')}

Topics: ${grammar.map((g) => `[${g.title}](${base}grammar/${g.id}/) (${g.status ?? 'draft'})`).join(', ')}

## Lessons

${lessons.map((l) => `- [${l.label}: ${l.name}](${base}learn/${l.id}/)`).join('\n')}

## Texts

Original writing in Amadunia, using only settled words and settled grammar; each text records what the language could not yet say.

${texts.map((t) => `- [${titleOf(t.body ?? '')}](${base}texts/${t.id}/) — ${subtitleOf(t.body ?? '') ?? ''}`).join('\n')}

## Pages

- [Alphabet](${base}alphabet/)
- [Texts](${base}texts/)
- [Data](${base}data/) — the corpus, the dictionary and the full reference as downloadable files, CC BY-SA 4.0
- [Grammar](${base}grammar/)
- [Dictionary](${base}dictionary/): ${words.length} roots, searchable
- [Learn](${base}learn/)
- [About](${base}about/)

## Alphabet

${alphabet.map((l) => `${l.glyph} ${l.ipa}`).join(', ')}

## Dictionary

${words.map((w) => `${w.word}: ${w.meaning}`).join('; ')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
