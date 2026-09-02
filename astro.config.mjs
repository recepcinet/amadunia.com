// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeLang from './src/lib/rehype-lang.mjs';

export default defineConfig({
  site: 'https://amadunia.com',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeLang],
  },
  build: {
    format: 'directory',
  },
});
