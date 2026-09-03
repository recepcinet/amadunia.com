// /dictionary.csv — served as upstream generates it, so the flashcard import
// and the site are the same file.
import type { APIRoute } from 'astro';
import { readLang } from '../lib/lang';

export const GET: APIRoute = () =>
  new Response(readLang('dictionary/dictionary.csv'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  });
