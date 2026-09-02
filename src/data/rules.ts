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
    example: { form: 'ruma rafiki mi', gloss: "my friend's house" },
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
    example: { form: 'Ta go ruma.', gloss: 'She goes home. He goes home.' },
  },
];
