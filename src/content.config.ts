// The language itself lives in the amadunia-lang repository, vendored as the
// git submodule at lang/. These collections read its Markdown directly, so
// the site never carries a second copy of the grammar or the lessons.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { existsSync } from 'node:fs';

const doc = z.object({}).passthrough();

export const collections = {
  grammar: defineCollection({ loader: glob({ pattern: ['*.md', '!README.md'], base: './lang/grammar' }), schema: doc }),
  lessons: defineCollection({ loader: glob({ pattern: 'lesson-*.md', base: './lang/lessons' }), schema: doc }),
  // Prose in lessons/ that is not a lesson: the reading ladder, and whatever
  // joins it. Rendered under /learn/ beside the lessons themselves.
  lessonDocs: defineCollection({
    loader: glob({ pattern: ['*.md', '!lesson-*.md', '!README.md'], base: './lang/lessons' }),
    schema: doc,
  }),
  texts: defineCollection({ loader: glob({ pattern: ['*.md', '!README.md'], base: './lang/texts' }), schema: doc }),
  // Prose in dictionary/ that rewards reading: how the words are distributed,
  // and the briefing for the next three hundred. The word list itself is read
  // as data, and the English index is what the search box already does.
  dictionaryDocs: defineCollection({
    loader: glob({
      pattern: ['*.md', '!README.md', '!dictionary.md', '!index-english.md'],
      base: './lang/dictionary',
    }),
    schema: doc,
  }),
  guarantees: defineCollection({ loader: glob({ pattern: 'GUARANTEES.md', base: './lang' }), schema: doc }),
  phrasebook: defineCollection({ loader: glob({ pattern: 'phrasebook.md', base: './lang' }), schema: doc }),
  // writing/ is a proposal upstream. The collection is empty until it lands on
  // main, and every page that uses it disappears with it.
  writing: defineCollection({
    loader: existsSync('./lang/writing')
      ? glob({ pattern: ['*.md', '!README.md'], base: './lang/writing' })
      : () => [],
    schema: doc,
  }),
};
