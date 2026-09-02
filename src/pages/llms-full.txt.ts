// /llms-full.txt — the whole language as one plain-text document, for AI
// crawlers that want everything rather than the summary in /llms.txt.
import type { APIRoute } from 'astro';
import { allLangFiles, LANG_REPO } from '../lib/lang';

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString() ?? 'https://amadunia.com/';
  const parts = allLangFiles().map(
    ({ rel, body }) => `<!-- ${rel} — ${LANG_REPO}/blob/main/${rel} -->\n\n${body.trim()}\n`,
  );
  const head = `# Amadunia — complete reference

Source: ${LANG_REPO} (CC BY-SA 4.0). Rendered at ${base}. Summary: ${base}llms.txt. Machine-readable: ${base}dictionary.json, ${base}corpus.tsv.
Language tag: art-x-amadunia. Grey/fuchsia on the site marks English/Amadunia; here, Amadunia words are the ones in the left columns and in italics.

`;
  return new Response(head + parts.join('\n\n---\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
