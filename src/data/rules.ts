// PLACEHOLDER RULES — replace with the real Amadunia grammar.
// The claim of the language is that this list stays short and takes no exceptions.
export interface Rule {
  claim: string;
  body: string;
  example?: { form: string; gloss: string };
}

export const rules: Rule[] = [
  {
    claim: 'One letter, one sound',
    body: 'Spelling and pronunciation never diverge. If you can read a word, you can say it.',
    example: { form: 'dunia', gloss: '/du.ni.a/ — world' },
  },
  {
    claim: 'Stress falls on the second-to-last syllable',
    body: 'No word carries a written accent, because stress is never in doubt.',
    example: { form: 'amadunia', gloss: 'a·ma·du·NI·a' },
  },
  {
    claim: 'Word order is subject, verb, object',
    body: 'Placeholder. Describe the fixed constituent order and what it lets the language leave out.',
    example: { form: 'Mi ama dunia.', gloss: 'I love world — I love the world.' },
  },
  {
    claim: 'Verbs do not conjugate',
    body: 'Placeholder. One form for every person and number; time is carried by a separate particle.',
  },
  {
    claim: 'Nouns do not decline',
    body: 'Placeholder. No gender, no case. Plurality is marked once, in one way.',
  },
  {
    claim: 'Adjectives follow the noun',
    body: 'Placeholder. State the position and whether it ever varies.',
  },
  {
    claim: 'Questions use one particle',
    body: 'Placeholder. No inversion, no auxiliary, no change in word order.',
  },
  {
    claim: 'There are no irregular words',
    body: 'A word that would need its own rule is not admitted into the language.',
  },
];
