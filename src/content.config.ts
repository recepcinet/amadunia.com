// The language itself lives in the amadunia-lang repository, vendored as the
// git submodule at lang/. These collections read its Markdown directly, so
// the site never carries a second copy of the grammar or the lessons.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { existsSync } from 'node:fs';

const doc = z.object({}).passthrough();

export const collections = {
  grammar: defineCollection({ loader: glob({ pattern: '*.md', base: './lang/grammar' }), schema: doc }),
  lessons: defineCollection({ loader: glob({ pattern: 'lesson-*.md', base: './lang/lessons' }), schema: doc }),
  texts: defineCollection({ loader: glob({ pattern: 'story-*.md', base: './lang/texts' }), schema: doc }),
  // writing/ is a proposal upstream. The collection is empty until it lands on
  // main, and every page that uses it disappears with it.
  writing: defineCollection({
    loader: existsSync('./lang/writing')
      ? glob({ pattern: ['*.md', '!README.md'], base: './lang/writing' })
      : () => [],
    schema: doc,
  }),
};
