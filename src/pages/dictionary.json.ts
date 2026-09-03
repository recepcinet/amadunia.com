// /dictionary.json — every settled word, for tools and models. The body is
// built in lib/lang so the data page can measure exactly what is served.
import type { APIRoute } from 'astro';
import { dictionaryJson, readmeStatus } from '../lib/lang';

export const GET: APIRoute = ({ site }) =>
  new Response(
    dictionaryJson(site?.toString() ?? 'https://amadunia.com/', readmeStatus().next?.roots ?? null),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
