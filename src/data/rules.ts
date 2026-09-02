// The grammar at a glance: one line per settled rule, each pointing at the
// page in lang/grammar/ that states it in full. This is a hand-written
// summary of that folder and has to be updated when it changes.
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
