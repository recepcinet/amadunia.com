// /dictionary.json — every settled word, for tools and models.
import type { APIRoute } from 'astro';
import { dictionary, readmeStatus, LANG_REPO } from '../lib/lang';

export const GET: APIRoute = ({ site }) => {
  const entries = dictionary();
  const { target } = readmeStatus();
  const body = {
    language: { name: 'Amadunia', tag: 'art-x-amadunia' },
    roots: entries.length,
    target,
    license: 'CC BY-SA 4.0',
    source: `${LANG_REPO}/blob/main/dictionary/dictionary.md`,
    site: site?.toString(),
    entries: entries.map((e) => ({
      word: e.word,
      meaning: e.meaning,
      group: e.group,
      sources: e.sources === '—' ? null : e.sources,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
