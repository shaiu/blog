import type { APIRoute } from 'astro';
import { skillMarkdown } from '../lib/skill';

export const GET: APIRoute = () =>
  new Response(skillMarkdown(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
