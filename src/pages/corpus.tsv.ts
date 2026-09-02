// /corpus.tsv — Amadunia ⇄ English sentence pairs from the grammar and the
// lessons. This is the parallel corpus a machine-translation system needs;
// it grows with every lesson.
import type { APIRoute } from 'astro';
import { corpus } from '../lib/lang';

export const GET: APIRoute = () => {
  const rows = corpus().map((p) => `${p.am}\t${p.en}\t${p.source}`);
  const body = ['amadunia\tenglish\tsource', ...rows].join('\n') + '\n';
  return new Response(body, { headers: { 'Content-Type': 'text/tab-separated-values; charset=utf-8' } });
};
