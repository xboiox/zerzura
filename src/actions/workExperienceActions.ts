'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { workExperienceTable } from '@/models/Schema';

const AddWorkExperienceSchema = z.object({
  companyName: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  startMonth: z.coerce.number().int().min(1).max(12),
  startYear: z.coerce.number().int().min(1950).max(new Date().getFullYear()),
  endMonth: z.coerce.number().int().min(1).max(12).optional(),
  endYear: z.coerce.number().int().min(1950).max(new Date().getFullYear()).optional(),
  isCurrent: z.coerce.boolean().optional(),
  description: z.string().max(1000).optional(),
});

export async function addWorkExperience(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const isCurrent = formData.get('isCurrent') === 'true';

  const parsed = AddWorkExperienceSchema.safeParse({
    companyName: formData.get('companyName'),
    position: formData.get('position'),
    startMonth: formData.get('startMonth'),
    startYear: formData.get('startYear'),
    endMonth: isCurrent ? undefined : (formData.get('endMonth') ?? undefined),
    endYear: isCurrent ? undefined : (formData.get('endYear') ?? undefined),
    isCurrent,
    description: formData.get('description') ?? undefined,
  });

  if (!parsed.success) {
    return { error: 'Data tidak valid' };
  }

  await db.insert(workExperienceTable).values({
    clerkId: userId,
    companyName: parsed.data.companyName,
    position: parsed.data.position,
    startMonth: parsed.data.startMonth,
    startYear: parsed.data.startYear,
    endMonth: parsed.data.isCurrent ? null : (parsed.data.endMonth ?? null),
    endYear: parsed.data.isCurrent ? null : (parsed.data.endYear ?? null),
    isCurrent: parsed.data.isCurrent ?? false,
    description:
      parsed.data.description && parsed.data.description.length > 0
        ? parsed.data.description
        : null,
  });

  revalidatePath('/dashboard/user-profile');
  return {};
}

export async function deleteWorkExperience(id: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  await db
    .delete(workExperienceTable)
    .where(and(eq(workExperienceTable.id, id), eq(workExperienceTable.clerkId, userId)));

  revalidatePath('/dashboard/user-profile');
  return {};
}
