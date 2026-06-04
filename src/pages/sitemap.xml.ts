import type { APIRoute } from 'astro';
import { fetchDesigns } from '../lib/sheets';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = process.env.SITE_URL ?? site?.toString() ?? 'https://nhadepthietke.vn';
  const base = siteUrl.replace(/\/$/, '');

  const designs = await fetchDesigns();

  const staticUrls = [
    { loc: base, priority: '1.0', changefreq: 'daily' },
  ];

  const designUrls = designs.map(d => ({
    loc: `${base}/thiet-ke/${d.ma_mau}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const allUrls = [...staticUrls, ...designUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
