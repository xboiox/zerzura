'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { userProfileTable } from '@/models/Schema';

async function requireSuperAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const { role } = user.publicMetadata as { role?: string };
  if (role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden');
  }
  return userId;
}

export async function inviteAdmin(formData: FormData): Promise<{ error?: string }> {
  try {
    await requireSuperAdmin();
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unauthorized' };
  }

  const raw = formData.get('email');
  const email = typeof raw === 'string' ? raw.trim() : '';
  if (!email) {
    return { error: 'Email required' };
  }

  try {
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: 'ADMIN' },
    });
  } catch (error) {
    logger.warn(`Failed to invite admin: ${String(error)}`);
    return { error: 'Failed to send invitation. Email may already be registered or invited.' };
  }

  revalidatePath('/admin/users');
  return {};
}

export async function toggleAdminStatus(targetClerkId: string): Promise<{ error?: string }> {
  try {
    await requireSuperAdmin();
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unauthorized' };
  }

  const profile = await db.query.userProfileTable.findFirst({
    where: eq(userProfileTable.clerkId, targetClerkId),
  });

  if (!profile) {
    return { error: 'User not found' };
  }

  await db
    .update(userProfileTable)
    .set({ isActive: !profile.isActive, updatedAt: new Date() })
    .where(eq(userProfileTable.clerkId, targetClerkId));

  revalidatePath('/admin/users');
  return {};
}
