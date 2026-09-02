// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeLang from './src/lib/rehype-lang.mjs';

export default defineConfig({
  site: 'https://amadunia.com',
  integrations: [sitemap()],
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
