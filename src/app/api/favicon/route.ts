import { db } from '@/libs/DB';

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#b91c1c"/>
</svg>`;

export async function GET() {
  const fallback = new Response(FALLBACK_SVG, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
  });

  const company = await db.query.companyProfileTable.findFirst({
    columns: { logoUrl: true },
  });

  const logoUrl = company?.logoUrl;
  if (!logoUrl) {
    return fallback;
  }

  const upstream = await fetch(logoUrl);
  if (!upstream.ok) {
    return fallback;
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/png';
  const buffer = await upstream.arrayBuffer();

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
