// The language itself lives in the amadunia-lang repository, vendored as the
// git submodule at lang/. These collections read its Markdown directly, so
// the site never carries a second copy of the grammar or the lessons.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const doc = z.object({}).passthrough();

export const collections = {
  grammar: defineCollection({ loader: glob({ pattern: '*.md', base: './lang/grammar' }), schema: doc }),
  lessons: defineCollection({ loader: glob({ pattern: 'lesson-*.md', base: './lang/lessons' }), schema: doc }),
};
