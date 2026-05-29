'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { userProfileTable } from '@/models/Schema';

const ProfileSchema = z.object({
  fullName: z.string().max(100).optional(),
  avatarUrl: z.string().max(512).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  phone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  skills: z.string().max(1000).optional(),
  facebookUrl: z.string().max(512).optional().or(z.literal('')),
  instagramUrl: z.string().max(512).optional().or(z.literal('')),
  linkedinUrl: z.string().max(512).optional().or(z.literal('')),
  githubUrl: z.string().max(512).optional().or(z.literal('')),
});

function toNull(val: string | undefined): string | null {
  return val && val.length > 0 ? val : null;
}

export async function saveUserProfile(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const parsed = ProfileSchema.safeParse({
    fullName: formData.get('fullName') ?? undefined,
    avatarUrl: formData.get('avatarUrl') ?? undefined,
    gender: formData.get('gender') ?? undefined,
    phone: formData.get('phone') ?? undefined,
    city: formData.get('city') ?? undefined,
    skills: formData.get('skills') ?? undefined,
    facebookUrl: formData.get('facebookUrl') ?? undefined,
    instagramUrl: formData.get('instagramUrl') ?? undefined,
    linkedinUrl: formData.get('linkedinUrl') ?? undefined,
    githubUrl: formData.get('githubUrl') ?? undefined,
  });

  if (!parsed.success) {
    return { error: 'Data tidak valid' };
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
      fullName: toNull(parsed.data.fullName),
      avatarUrl: toNull(parsed.data.avatarUrl),
      gender: parsed.data.gender ?? null,
      phone: toNull(parsed.data.phone),
      city: toNull(parsed.data.city),
      skills: skillsArray,
      facebookUrl: toNull(parsed.data.facebookUrl),
      instagramUrl: toNull(parsed.data.instagramUrl),
      linkedinUrl: toNull(parsed.data.linkedinUrl),
      githubUrl: toNull(parsed.data.githubUrl),
    })
    .onConflictDoUpdate({
      target: userProfileTable.clerkId,
      set: {
        fullName: toNull(parsed.data.fullName),
        avatarUrl: toNull(parsed.data.avatarUrl),
        gender: parsed.data.gender ?? null,
        phone: toNull(parsed.data.phone),
        city: toNull(parsed.data.city),
        skills: skillsArray,
        facebookUrl: toNull(parsed.data.facebookUrl),
        instagramUrl: toNull(parsed.data.instagramUrl),
        linkedinUrl: toNull(parsed.data.linkedinUrl),
        githubUrl: toNull(parsed.data.githubUrl),
        updatedAt: new Date(),
      },
    });

  revalidatePath('/dashboard/user-profile');
  return {};
}
