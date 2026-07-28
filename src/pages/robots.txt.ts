import { SITE } from '../lib/site';

export function GET() {
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      `Sitemap: ${SITE.origin}/sitemap-index.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
}
