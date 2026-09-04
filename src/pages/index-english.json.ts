import type { APIRoute } from 'astro';
import { englishIndexJson } from '../lib/lang';

export const GET: APIRoute = ({ site }) =>
  new Response(englishIndexJson(site?.toString() ?? 'https://amadunia.com/'), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
