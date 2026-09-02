// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeLang from './src/lib/rehype-lang.mjs';
import { readdirSync } from 'node:fs';

// Lesson files were padded to two digits on 2026-09-03 (lesson-1-… → lesson-01-…),
// which moved nine URLs that search engines had already indexed. Keep the old
// paths alive, derived from the files themselves so a future rename is covered.
const lessonRedirects = Object.fromEntries(
  readdirSync('./lang/lessons')
    .filter((n) => /^lesson-0\d-.+\.md$/.test(n))
    .map((n) => n.replace(/\.md$/, ''))
    .map((id) => [`/learn/${id.replace(/^lesson-0/, 'lesson-')}/`, `/learn/${id}/`]),
);

export default defineConfig({
  site: 'https://amadunia.com',
  integrations: [sitemap()],
  redirects: lessonRedirects,
  markdown: {
    // Nothing in lang/ is code. The one fenced block is a story, and Shiki
    // would paint it in a dark editor theme.
    syntaxHighlight: false,
    rehypePlugins: [rehypeLang],
  },
  build: {
    format: 'directory',
  },
});
