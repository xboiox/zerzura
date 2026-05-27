import { clerkClient } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { StatusUpdateForm } from '@/components/admin/StatusUpdateForm';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import {
  applicationStatusLogTable,
  applicationTable,
  jobTable,
  userProfileTable,
} from '@/models/Schema';

type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';

type AdminApplicantProfilePageProps = {
  params: Promise<{ locale: string; id: string; applicationId: string }>;
};

function statusBadgeClass(status: ApplicationStatus): string {
  if (status === 'ACCEPTED') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'REJECTED') {
    return 'bg-red-100 text-red-700';
  }
  if (status === 'REVIEWED') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-600';
}

export default async function AdminApplicantProfilePage(props: AdminApplicantProfilePageProps) {
  const { locale, id, applicationId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminApplicantProfilePage' });

  const application = await db.query.applicationTable.findFirst({
    where: eq(applicationTable.id, applicationId),
  });
  if (!application || application.jobId !== id) {
    notFound();
  }

  const job = await db.query.jobTable.findFirst({ where: eq(jobTable.id, id) });
  if (!job) {
    notFound();
  }

  const [profile, statusLogs, client] = await Promise.all([
    db.query.userProfileTable.findFirst({
      where: eq(userProfileTable.clerkId, application.applicantClerkId),
    }),
    db
      .select()
      .from(applicationStatusLogTable)
      .where(eq(applicationStatusLogTable.applicationId, applicationId))
      .orderBy(desc(applicationStatusLogTable.createdAt)),
    clerkClient(),
  ]);

  let clerkName = application.applicantClerkId;
  let clerkEmail = '—';
  try {
    const user = await client.users.getUser(application.applicantClerkId);
    const nameParts = [user.firstName, user.lastName].filter(Boolean);
    clerkName =
      nameParts.length > 0
        ? nameParts.join(' ')
        : (user.emailAddresses[0]?.emailAddress ?? application.applicantClerkId);
    clerkEmail = user.emailAddresses[0]?.emailAddress ?? '—';
  } catch {
    // keep defaults
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusLabel: Record<ApplicationStatus, string> = {
    PENDING: t('status_pending'),
    REVIEWED: t('status_reviewed'),
    ACCEPTED: t('status_accepted'),
    REJECTED: t('status_rejected'),
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href={`/admin/jobs/${id}/applicants`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t('back_to_applicants')}
        </Link>
      </div>

      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">{clerkName}</h1>
        <p className="text-sm text-gray-500">{clerkEmail}</p>
      </div>

      {/* Personal info */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">{t('personal_info_title')}</h2>
        {profile ? (
          <dl className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-gray-500">{t('phone_label')}</dt>
              <dd className="text-sm text-gray-900">{profile.phone ?? '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-gray-500">{t('city_label')}</dt>
              <dd className="text-sm text-gray-900">{profile.city ?? '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-gray-500">{t('skills_label')}</dt>
              <dd className="text-sm text-gray-900">
                {profile.skills && profile.skills.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">{t('no_profile')}</p>
        )}
      </section>

      {/* Application */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">{t('application_title')}</h2>
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <span className="w-28 shrink-0 text-sm text-gray-500">{t('position_label')}</span>
            <span className="text-sm font-medium text-gray-900">{job.title}</span>
          </div>
          <div className="flex items-start gap-4">
            <span className="w-28 shrink-0 text-sm text-gray-500">{t('status_label')}</span>
            <div className="flex flex-col gap-2">
              <span
                className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(application.status as ApplicationStatus)}`}
              >
                {statusLabel[application.status as ApplicationStatus]}
              </span>
              <StatusUpdateForm
                applicationId={application.id}
                currentStatus={application.status as ApplicationStatus}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-sm text-gray-500">{t('applied_at_label')}</span>
            <span className="text-sm text-gray-900">
              {dateFormatter.format(application.createdAt)}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-sm text-gray-500">{t('cv_label')}</span>
            <a
              href={application.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-red-700 hover:underline"
            >
              {t('download_cv')}
            </a>
          </div>
        </div>
      </section>

      {/* Cover letter */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">{t('cover_letter_title')}</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
            {application.coverLetter}
          </p>
        </div>
      </section>

      {/* Status history */}
      {statusLogs.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-gray-900">{t('history_title')}</h2>
          <ol className="space-y-3">
            {statusLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 size-2 shrink-0 rounded-full bg-gray-400" />
                <div>
                  <span className="font-medium text-gray-900">
                    {statusLabel[log.fromStatus as ApplicationStatus]}
                  </span>
                  {' → '}
                  <span className="font-medium text-gray-900">
                    {statusLabel[log.toStatus as ApplicationStatus]}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {dateFormatter.format(log.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
