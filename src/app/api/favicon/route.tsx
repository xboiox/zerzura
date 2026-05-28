import { ImageResponse } from 'next/og';
import { db } from '@/libs/DB';

export async function GET() {
  const company = await db.query.companyProfileTable.findFirst({
    columns: { logoUrl: true },
  });

  const logoUrl = company?.logoUrl;

  if (!logoUrl) {
    return new ImageResponse(
      <div style={{ width: 32, height: 32, background: '#b91c1c', borderRadius: 4 }} />,
      { width: 32, height: 32 },
    );
  }

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: ImageResponse requires plain img, not next/image */}
      <img src={logoUrl} width={32} height={32} style={{ objectFit: 'contain' }} alt="" />
    </div>,
    { width: 32, height: 32 },
  );
}
