'use server';

import { clerkClient, auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { resend } from '@/libs/Resend';
import { applicationStatusLogTable, applicationTable, jobTable } from '@/models/Schema';
import { ApplicationValidation } from '@/validations/ApplicationValidation';

type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';

type AdminEmailAddress = { emailAddress: string; firstName: string | null };

async function getAdminEmails(): Promise<AdminEmailAddress[]> {
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 100 });
  const admins: AdminEmailAddress[] = [];
  for (const user of users) {
    const { role } = user.publicMetadata as { role?: string };
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const email = user.emailAddresses[0]?.emailAddress;
      if (email) {
        admins.push({ emailAddress: email, firstName: user.firstName });
      }
    }
  }
  return admins;
}

async function sendNewApplicationEmail(params: {
  adminEmails: AdminEmailAddress[];
  applicantName: string;
  jobTitle: string;
  jobId: string;
}): Promise<void> {
  if (!params.adminEmails.length) {
    return;
  }
  const subject = `Lamaran baru: ${params.jobTitle}`;
  const html = `
    <p>Halo,</p>
    <p><strong>${params.applicantName}</strong> baru saja melamar untuk posisi <strong>${params.jobTitle}</strong>.</p>
    <p>Lihat detail pelamar di panel admin.</p>
  `;
  await resend.emails.send({
    from: 'no-reply@resend.dev',
    to: params.adminEmails.map((a) => a.emailAddress),
    subject,
    html,
  });
}

export async function applyToJob(formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const parsed = ApplicationValidation.safeParse({
    jobId: formData.get('jobId'),
    cvUrl: formData.get('cvUrl'),
    coverLetter: formData.get('coverLetter'),
  });

  if (!parsed.success) {
    throw new Error('Invalid form data');
  }

  const { jobId, cvUrl, coverLetter } = parsed.data;

  const job = await db.query.jobTable.findFirst({
    where: eq(jobTable.id, jobId),
  });

  if (!job || job.status !== 'PUBLISHED' || job.deadline < new Date()) {
    throw new Error('Job not available');
  }

  await db
    .insert(applicationTable)
    .values({ jobId, applicantClerkId: userId, cvUrl, coverLetter })
    .onConflictDoNothing();

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const nameParts = [user.firstName, user.lastName].filter(Boolean);
    const applicantName =
      nameParts.length > 0
        ? nameParts.join(' ')
        : (user.emailAddresses[0]?.emailAddress ?? 'Pelamar');
    const adminEmails = await getAdminEmails();
    await sendNewApplicationEmail({ adminEmails, applicantName, jobTitle: job.title, jobId });
  } catch (error) {
    logger.warn(`Failed to send application email: ${String(error)}`);
  }

  redirect(`/jobs/${jobId}?applied=1`);
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const client = await clerkClient();
  const adminUser = await client.users.getUser(userId);
  const { role } = adminUser.publicMetadata as { role?: string };
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return { error: 'Forbidden' };
  }

  const application = await db.query.applicationTable.findFirst({
    where: eq(applicationTable.id, applicationId),
  });
  if (!application) {
    return { error: 'Not found' };
  }

  const prevStatus = application.status as ApplicationStatus;
  if (prevStatus === newStatus) {
    return {};
  }

  await db
    .update(applicationTable)
    .set({ status: newStatus, applicantSeen: false, updatedAt: new Date() })
    .where(eq(applicationTable.id, applicationId));

  await db.insert(applicationStatusLogTable).values({
    applicationId,
    fromStatus: prevStatus,
    toStatus: newStatus,
    changedByClerkId: userId,
  });

  try {
    const applicant = await client.users.getUser(application.applicantClerkId);
    const applicantEmail = applicant.emailAddresses[0]?.emailAddress;
    if (applicantEmail && resend) {
      const statusLabel: Record<ApplicationStatus, string> = {
        PENDING: 'Menunggu',
        REVIEWED: 'Ditinjau',
        ACCEPTED: 'Diterima',
        REJECTED: 'Ditolak',
      };
      const job = await db.query.jobTable.findFirst({
        where: eq(jobTable.id, application.jobId),
      });
      await resend.emails.send({
        from: 'no-reply@resend.dev',
        to: applicantEmail,
        subject: `Update status lamaran: ${job?.title ?? 'Lowongan'}`,
        html: `
          <p>Halo,</p>
          <p>Status lamaran kamu untuk posisi <strong>${job?.title ?? 'Lowongan'}</strong> telah diperbarui menjadi <strong>${statusLabel[newStatus]}</strong>.</p>
          <p>Silakan cek dashboard kamu untuk informasi lebih lanjut.</p>
        `,
      });
    }
  } catch (error) {
    logger.warn(`Failed to send status update email: ${String(error)}`);
  }

  revalidatePath(`/admin/jobs/${application.jobId}/applicants`);
  return {};
}

export async function markApplicationsSeen(): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    return;
  }

  await db
    .update(applicationTable)
    .set({ applicantSeen: true })
    .where(
      and(eq(applicationTable.applicantClerkId, userId), eq(applicationTable.applicantSeen, false)),
    );
}

export async function cancelApplication(applicationId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const application = await db.query.applicationTable.findFirst({
    where: and(
      eq(applicationTable.id, applicationId),
      eq(applicationTable.applicantClerkId, userId),
    ),
  });

  if (!application) {
    return { error: 'Not found' };
  }
  if (application.status !== 'PENDING') {
    return { error: 'Cannot cancel' };
  }

  await db.delete(applicationTable).where(eq(applicationTable.id, applicationId));

  revalidatePath('/dashboard');
  return {};
}
