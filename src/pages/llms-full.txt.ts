// /llms-full.txt — the whole language as one plain-text document, for AI
// crawlers that want everything rather than the summary in /llms.txt. The body
// is built in lib/lang so the data page can measure exactly what is served.
import type { APIRoute } from 'astro';
import { fullReference } from '../lib/lang';

export const GET: APIRoute = ({ site }) =>
  new Response(fullReference(site?.toString() ?? 'https://amadunia.com/'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
