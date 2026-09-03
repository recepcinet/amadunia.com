// /corpus.tsv — Amadunia ⇄ English sentence pairs from the grammar and the
// lessons. This is the parallel corpus a machine-translation system needs;
// it grows with every lesson. The body is built in lib/lang so the data page
// can measure exactly what is served.
import type { APIRoute } from 'astro';
import { corpusTsv } from '../lib/lang';

export const GET: APIRoute = () =>
  new Response(corpusTsv(), {
    headers: { 'Content-Type': 'text/tab-separated-values; charset=utf-8' },
  });
