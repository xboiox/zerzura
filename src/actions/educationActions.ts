'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { educationTable } from '@/models/Schema';

const AddEducationSchema = z.object({
  institution: z.string().min(1).max(200),
  major: z.string().min(1).max(200),
  graduationYear: z.coerce.number().int().min(1950).max(new Date().getFullYear()),
  gpa: z.string().max(20).optional(),
});

export async function addEducation(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const parsed = AddEducationSchema.safeParse({
    institution: formData.get('institution'),
    major: formData.get('major'),
    graduationYear: formData.get('graduationYear'),
    gpa: formData.get('gpa') ?? undefined,
  });

  if (!parsed.success) {
    return { error: 'Data tidak valid' };
  }

  await db.insert(educationTable).values({
    clerkId: userId,
    institution: parsed.data.institution,
    major: parsed.data.major,
    graduationYear: parsed.data.graduationYear,
    gpa: parsed.data.gpa && parsed.data.gpa.length > 0 ? parsed.data.gpa : null,
  });

  revalidatePath('/dashboard/user-profile');
  return {};
}

export async function deleteEducation(id: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  await db
    .delete(educationTable)
    .where(and(eq(educationTable.id, id), eq(educationTable.clerkId, userId)));

  revalidatePath('/dashboard/user-profile');
  return {};
}
