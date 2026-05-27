'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { jobTable } from '@/models/Schema';
import { JobStatusValidation, JobValidation } from '@/validations/JobValidation';

export async function createJob(formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const parsed = JobValidation.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    requirements: formData.get('requirements'),
    jobType: formData.get('jobType'),
    location: formData.get('location'),
    salaryMin: formData.get('salaryMin'),
    salaryMax: formData.get('salaryMax'),
    deadline: formData.get('deadline'),
  });

  if (!parsed.success) {
    throw new Error('Invalid form data');
  }

  await db.insert(jobTable).values({
    ...parsed.data,
    status: 'DRAFT',
    createdByClerkId: userId,
  });

  revalidatePath('/admin/jobs');
  redirect('/admin/jobs?toast=job_created');
}

export async function updateJob(jobId: string, formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const parsed = JobValidation.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    requirements: formData.get('requirements'),
    jobType: formData.get('jobType'),
    location: formData.get('location'),
    salaryMin: formData.get('salaryMin'),
    salaryMax: formData.get('salaryMax'),
    deadline: formData.get('deadline'),
  });

  if (!parsed.success) {
    throw new Error('Invalid form data');
  }

  await db
    .update(jobTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(jobTable.id, jobId));

  revalidatePath('/admin/jobs');
  redirect('/admin/jobs?toast=job_updated');
}

export async function updateJobStatus(
  jobId: string,
  status: 'DRAFT' | 'PUBLISHED' | 'INACTIVE',
): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const parsed = JobStatusValidation.safeParse({ jobId, status });
  if (!parsed.success) {
    return;
  }

  await db
    .update(jobTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(jobTable.id, parsed.data.jobId));

  revalidatePath('/admin/jobs');
  revalidatePath('/');
}
