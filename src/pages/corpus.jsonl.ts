// /corpus.jsonl — the same pairs as corpus.tsv, one JSON object per line.
// JSONL is what translation and language-model pipelines read; the TSV is for
// people and spreadsheets.
import type { APIRoute } from 'astro';
import { corpusJsonl } from '../lib/lang';

export const GET: APIRoute = () =>
  new Response(corpusJsonl(), {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
  });
