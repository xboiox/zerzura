'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { userProfileTable } from '@/models/Schema';

const ProfileSchema = z.object({
  phone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  skills: z.string().max(1000).optional(),
});

export async function saveUserProfile(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const parsed = ProfileSchema.safeParse({
    phone: formData.get('phone') ?? undefined,
    city: formData.get('city') ?? undefined,
    skills: formData.get('skills') ?? undefined,
  });

  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  const skillsArray = parsed.data.skills
    ? parsed.data.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  await db
    .insert(userProfileTable)
    .values({
      clerkId: userId,
      phone: parsed.data.phone ?? null,
      city: parsed.data.city ?? null,
      skills: skillsArray,
    })
    .onConflictDoUpdate({
      target: userProfileTable.clerkId,
      set: {
        phone: parsed.data.phone ?? null,
        city: parsed.data.city ?? null,
        skills: skillsArray,
        updatedAt: new Date(),
      },
    });

  revalidatePath('/dashboard/user-profile');
  return {};
}
