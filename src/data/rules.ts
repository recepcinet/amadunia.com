// The grammar at a glance: one line per settled rule, each pointing at the
// page in lang/grammar/ that states it in full. This is a hand-written summary
// of that folder, so assertCoversGrammar() below fails the build if the folder
// gains a settled topic that nothing here links to — the summary cannot drift
// out of date quietly.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
export interface Rule {
  claim: string;
  body: string;
  href: string;
  example?: { form: string; gloss: string };
}

export const rules: Rule[] = [
  {
    claim: 'One letter, one sound',
    body: 'No silent letters, none that change value by position, none that can be read two ways. A word is pronounced exactly as written.',
    href: '/grammar/phonology/',
    example: { form: 'dunia', gloss: 'du-ni-a — world' },
  },
  {
    claim: 'Syllables stay simple',
    body: 'Never more than two consonants in a row. If you can say "banana" and "taksi", you can say anything in Amadunia.',
    href: '/grammar/phonology/',
    example: { form: 'taksi', gloss: 'tak-si — taxi' },
  },
  {
    claim: 'No two words are a single sound apart',
    body: 'The rule that kills most candidates, and between l and r it is absolute: telling beli from beri is the hardest contrast on Earth for well over a billion speakers, and a world language cannot rest a distinction on it. It outranks how widely a word travels — dom replaced ruma, after eighty-four uses, because ruma stood against luma.',
    href: '/grammar/phonology/',
    example: { form: 'ruma → dom', gloss: 'replaced, because luma is light and the pair differs only in l against r.' },
  },
  {
    claim: 'The verb never changes',
    body: 'Time is one particle placed before the verb: suda for the past, saufa for the future. Nothing to conjugate, no agreement with the subject.',
    href: '/grammar/tense/',
    example: { form: 'Mi suda kula pan.', gloss: 'I ate bread.' },
  },
  {
    claim: 'The present is unmarked',
    body: 'The most common tense is the shortest form. Once a time has been set, the particle need not be repeated until the time changes.',
    href: '/grammar/tense/',
    example: { form: 'Mi kula pan.', gloss: 'I eat bread.' },
  },
  {
    claim: 'To make a plural, say the noun twice',
    body: 'Joined by a hyphen. Nothing is added and nothing inside the word changes, so there is nothing that could become irregular.',
    href: '/grammar/plural/',
    example: { form: 'anak-anak', gloss: 'children' },
  },
  {
    claim: 'After a number, the noun stays single',
    body: 'The number has already done the work. The unmarked noun is neutral, not singular; doubling is used only when "more than one" actually matters.',
    href: '/grammar/plural/',
    example: { form: 'tri anak', gloss: 'three children' },
  },
  {
    claim: 'The owner comes right after the thing owned',
    body: 'Nothing is added: no possessive pronouns, no suffix, no "of". The ordinary pronoun or noun takes the slot after the noun, before any adjective, and chains to any depth.',
    href: '/grammar/possession/',
    example: { form: 'dom rafiki mi', gloss: "my friend's house" },
  },
  {
    claim: 'A question is the answer with one word swapped',
    body: 'Yes/no questions are a statement said with a rising tone and written with a question mark. For what, who, where, when, why, how and how many, the question word sits exactly where the answer would. Word order never changes.',
    href: '/grammar/questions/',
    example: { form: 'Yu kan ke?', gloss: 'What do you see? — Yu kan anak. You see a child.' },
  },
  {
    claim: 'Pronouns never change',
    body: 'Not for case, not for gender, not for politeness: mi, yu, ta whether acting or acted on, for anyone. Plural by doubling, like every noun. Two ways to say we — kita with you, mi-mi without you.',
    href: '/grammar/pronouns/',
    example: { form: 'Mi kan ta. Ta kan mi.', gloss: 'I see her. She sees me.' },
  },
  {
    claim: 'Before a noun, es. Before anything else, nothing',
    body: 'Two nouns side by side already mean possession, so "X is a Y" needs the verb es. An adjective or a place word cannot own anything, so it stands alone as the sentence and takes the tense particle directly.',
    href: '/grammar/copula/',
    example: { form: 'Mi es doktor. Ruma kabir.', gloss: 'I am a doctor. The house is big.' },
  },
  {
    claim: 'To deny anything, put no in front of it',
    body: 'The same no you answer questions with, placed immediately before the verb, the adjective, the place word or es. With tense the order is always no, then the particle, then the verb.',
    href: '/grammar/negation/',
    example: { form: 'Mi no suda kula.', gloss: 'I did not eat.' },
  },
  {
    claim: 'One word joins everything: aur',
    body: 'Nouns, adjectives and whole sentences take the same conjunction, because two nouns side by side already mean possession. o is or.',
    href: '/grammar/conjunction/',
    example: { form: 'Angin aur yuki lai.', gloss: 'Wind and snow came.' },
  },
  {
    claim: 'This and that come last',
    body: 'ini and itu follow the noun, after any owner and any adjective. The noun phrase order is fixed and complete: noun, owner, adjective, this or that.',
    href: '/grammar/demonstratives/',
    example: { form: 'dom mi kabir ini', gloss: 'this big house of mine' },
  },
  {
    claim: 'Three small words mark place: in, dari, por',
    body: 'At, from, and to — each before its noun. A verb of motion needs none of them: whatever follows it is the destination.',
    href: '/grammar/place/',
    example: { form: 'Mi lai dari market.', gloss: 'I come from the market.' },
  },
  {
    claim: 'Verbs in a row need nothing between them',
    body: 'Want to, can, must: the verbs simply follow one another. Two nouns side by side already meant possession, which is why es and aur had to exist; two verbs side by side meant nothing, so the language took the slot for free.',
    href: '/grammar/verb-chains/',
    example: { form: 'Mi mau kula pan.', gloss: 'I want to eat bread.' },
  },
  {
    claim: 'Stress falls on the second-to-last syllable, always',
    body: 'Every word, with no exception and nothing to memorise. A vowel pair counts as one syllable, and a hyphen does not join two words into one for this. Until it was settled, two people could read a line of the poem as two different poems.',
    href: '/grammar/stress/',
    example: { form: 'amadunia', gloss: 'a·ma·du·NI·a' },
  },
  {
    claim: 'Every letter has one named sound',
    body: 'The plain five vowels — the commonest system on Earth, shared by Spanish, Japanese, Swahili, Indonesian, Greek, Hausa and Turkish. The values were not chosen: three hundred sourced etymologies already committed the language to them, and this reads them back off the vocabulary.',
    href: '/grammar/pronunciation/',
    example: { form: 'ca, dunia, kita, dom', gloss: 'from Chinese chá, Arabic dunyā, Indonesian kita, Russian dom — every source reads these letters the same way.' },
  },
  {
    claim: 'Comparison is two words, and they never change',
    body: 'lebi more, kurang less, paling most — each in front of the adjective, where cok already stood. Than is dari, which has meant from since Lesson 15, as it does in Arabic, Persian, Turkish, Hindi and Indonesian. No adjective takes an ending, so none can become irregular.',
    href: '/grammar/comparison/',
    example: { form: 'Dom mi lebi kabir dari dom yu.', gloss: 'My house is bigger than your house.' },
  },
  {
    claim: 'There is no word for "that"',
    body: 'A whole sentence simply stands where an object would stand — the slot was empty, so the language took it for nothing, exactly as it did with verb chains. Because, when and if reuse porke, kab and agar, already known as question words.',
    href: '/grammar/subordination/',
    example: { form: 'Mi bil ta suda lai.', gloss: 'I know she came.' },
  },
  {
    claim: 'An adverb is the adjective, unchanged',
    body: 'No suffix, no separate word class. Where English adds -ly, Amadunia adds nothing and lets position do the work.',
    href: '/grammar/adverbs/',
    example: { form: 'Ta anda hayai.', gloss: 'She walks fast.' },
  },
  {
    claim: 'There is no word for "a" and none for "the"',
    body: 'A bare noun is neither definite nor indefinite; the situation decides, as it does in Russian, Turkish, Hindi, Indonesian, Chinese and Swahili. More people learn to speak without articles than with them, and those who have them do not agree on how many.',
    href: '/grammar/definiteness/',
    example: { form: 'Mi kan dom.', gloss: 'I see a house. I see the house. Both, and nothing is added either way.' },
  },
  {
    claim: 'Two roots join for a number or a plural, and for nothing else',
    body: 'Every hyphen in the language is one or the other; not one compound word has ever been formed. Three hundred roots go further than three hundred words because things can be described with what is already there, not because new words can be built out of old ones.',
    href: '/grammar/word-formation/',
    example: { form: 'Mesin ambil foto korpo anak.', gloss: "A machine takes a photo of the child's body — an X-ray, said with no new root and no new word." },
  },
  {
    claim: 'Numbers are built, never irregular',
    body: 'Ten digits, des for ten, sen for a hundred. Larger numbers join smaller ones, largest unit first.',
    href: '/grammar/numbers/',
    example: { form: 'du-des-uan', gloss: '21' },
  },
  {
    claim: 'No conjugation, no gender, no articles',
    body: 'One pronoun for he and she. No word for "a" or "the". Grammar you can learn in a day.',
    href: '/about/',
    example: { form: 'Ta go dom.', gloss: 'She goes home. He goes home.' },
  },
];

/**
 * Every settled topic in lang/grammar/ must be linked from a rule above.
 * Proposals are briefings rather than rules and are listed separately, on
 * /grammar/, so they are exempt.
 */
export function assertCoversGrammar(): void {
  const dir = join(process.cwd(), 'lang', 'grammar');
  const topics = readdirSync(dir)
    .filter((n) => n.endsWith('.md') && n !== 'README.md' && !n.startsWith('proposal-'))
    .map((n) => n.slice(0, -3));
  const linked = new Set(rules.map((r) => r.href.replace(/^\/grammar\/|\/$/g, '')));
  const missing = topics.filter((t) => !linked.has(t));
  if (missing.length) {
    throw new Error(
      `src/data/rules.ts has no rule for ${missing.join(', ')} — lang/grammar/ settled ` +
        `${missing.length === 1 ? 'a topic' : 'topics'} the site's summary does not mention. ` +
        `Add a rule linking to /grammar/<topic>/, and order it in src/pages/grammar/index.astro.`,
    );
  }
}
