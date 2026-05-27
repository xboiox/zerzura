'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { clientLogoTable } from '@/models/Schema';

const REVALIDATE_PATHS = ['/', '/portfolio', '/admin/pages/portfolio'] as const;

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function addClientLogo(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const raw = formData.get('logoUrl');
  const rawAlt = formData.get('altText');

  const logoUrl = typeof raw === 'string' ? raw.trim() : '';
  const altText = typeof rawAlt === 'string' ? rawAlt.trim() : '';

  const parsed = z.url().safeParse(logoUrl);
  if (!parsed.success) {
    return { error: 'URL tidak valid' };
  }

  await db.insert(clientLogoTable).values({
    logoUrl,
    altText: altText.length ? altText : null,
  });

  revalidateAll();
  return {};
}

export async function deleteClientLogo(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    return;
  }

  await db.delete(clientLogoTable).where(eq(clientLogoTable.id, id));
  revalidateAll();
}
