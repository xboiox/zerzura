import { auth } from '@clerk/nextjs/server';
import { desc, eq, inArray } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import React from 'react';
import { CancelApplicationButton } from '@/components/dashboard/CancelApplicationButton';
import { MarkApplicationsSeen } from '@/components/dashboard/MarkApplicationsSeen';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationStatusLogTable, applicationTable, jobTable } from '@/models/Schema';

type ApplicationStatus =
  | 'PENDING'
  | 'REVIEWED'
  | 'INTERVIEWED'
  | 'ASSESSMENT'
  | 'OFFERING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';
type StatusFilter = ApplicationStatus | undefined;

const PAGE_SIZE = 10;

function statusBadgeClass(status: string): string {
  if (status === 'ACCEPTED') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'REJECTED' || status === 'WITHDRAWN') {
    return 'bg-red-100 text-red-700';
  }
  if (status === 'OFFERING' || status === 'INTERVIEWED' || status === 'ASSESSMENT') {
    return 'bg-blue-100 text-blue-700';
  }
  if (status === 'REVIEWED') {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-gray-100 text-gray-600';
}

function isValidStatus(val: unknown): val is ApplicationStatus {
  return (
    val === 'PENDING' ||
    val === 'REVIEWED' ||
    val === 'INTERVIEWED' ||
    val === 'ASSESSMENT' ||
    val === 'OFFERING' ||
    val === 'ACCEPTED' ||
    val === 'REJECTED' ||
    val === 'WITHDRAWN'
  );
}

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function DashboardPage(props: DashboardPageProps) {
  const { locale } = await props.params;
  const { status: rawStatus, page: rawPage } = await props.searchParams;
  setRequestLocale(locale);

  const { userId } = await auth();
  const t = await getTranslations({ locale, namespace: 'DashboardPage' });

  const activeFilter: StatusFilter = isValidStatus(rawStatus) ? rawStatus : undefined;
  const currentPage = Math.max(1, Number.isNaN(Number(rawPage)) ? 1 : Number(rawPage));

  const allApplications = userId
    ? await db
        .select({
          id: applicationTable.id,
          status: applicationTable.status,
          createdAt: applicationTable.createdAt,
          cvUrl: applicationTable.cvUrl,
          jobId: jobTable.id,
          jobTitle: jobTable.title,
          jobLocation: jobTable.location,
        })
        .from(applicationTable)
        .innerJoin(jobTable, eq(applicationTable.jobId, jobTable.id))
        .where(eq(applicationTable.applicantClerkId, userId))
        .orderBy(desc(applicationTable.createdAt))
    : [];

  const filtered = activeFilter
    ? allApplications.filter((a) => a.status === activeFilter)
    : allApplications;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const applications = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const applicationIds = applications.map((a) => a.id);
  const statusLogs =
    applicationIds.length > 0
      ? await db
          .select()
          .from(applicationStatusLogTable)
          .where(inArray(applicationStatusLogTable.applicationId, applicationIds))
          .orderBy(desc(applicationStatusLogTable.createdAt))
      : [];

  const logsByApplication = new Map<string, typeof statusLogs>();
  for (const log of statusLogs) {
    const existing = logsByApplication.get(log.applicationId) ?? [];
    logsByApplication.set(log.applicationId, [...existing, log]);
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const logDateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const total = allApplications.length;
  const pending = allApplications.filter((a) => a.status === 'PENDING').length;
  const accepted = allApplications.filter((a) => a.status === 'ACCEPTED').length;

  const statCards = [
    { label: t('stat_total'), value: total, filter: undefined, color: 'text-gray-900' },
    {
      label: t('stat_pending'),
      value: pending,
      filter: 'PENDING' as const,
      color: 'text-amber-600',
    },
    {
      label: t('stat_accepted'),
      value: accepted,
      filter: 'ACCEPTED' as const,
      color: 'text-green-600',
    },
  ];

  const statusLabel: Record<string, string> = {
    PENDING: t('status_pending'),
    REVIEWED: t('status_reviewed'),
    INTERVIEWED: t('status_interviewed'),
    ASSESSMENT: t('status_assessment'),
    OFFERING: t('status_offering'),
    ACCEPTED: t('status_accepted'),
    REJECTED: t('status_rejected'),
    WITHDRAWN: t('status_withdrawn'),
  };

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (activeFilter) {
      params.set('status', activeFilter);
    }
    if (page > 1) {
      params.set('page', String(page));
    }
    const qs = params.toString();
    return `/dashboard${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="py-8">
      <MarkApplicationsSeen />
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="mb-8 text-sm text-gray-500">{t('subtitle')}</p>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4 sm:max-w-lg">
        {statCards.map((card) => {
          const href = card.filter ? `/dashboard?status=${card.filter}` : '/dashboard';
          const isActive = activeFilter === card.filter;
          return (
            <Link
              key={card.label}
              href={href}
              className={`rounded-lg border p-4 text-center transition-colors hover:bg-gray-50 ${
                isActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'
              }`}
            >
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Applications list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          {activeFilter
            ? (
                {
                  PENDING: t('filter_label_pending'),
                  REVIEWED: t('filter_label_reviewed'),
                  INTERVIEWED: t('filter_label_reviewed'),
                  ASSESSMENT: t('filter_label_reviewed'),
                  OFFERING: t('filter_label_reviewed'),
                  ACCEPTED: t('filter_label_accepted'),
                  REJECTED: t('filter_label_rejected'),
                  WITHDRAWN: t('filter_label_rejected'),
                } as Record<ApplicationStatus, string>
              )[activeFilter]
            : t('applications_title')}
        </h2>
        <div className="flex items-center gap-4">
          {activeFilter && (
            <Link
              href="/dashboard"
              className="text-xs text-gray-500 hover:text-gray-900 hover:underline"
            >
              {t('clear_filter')}
            </Link>
          )}
          <Link href="/jobs" className="text-sm font-medium text-red-700 hover:underline">
            {t('browse_jobs_link')}
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="mb-4 text-sm text-gray-500">
            {activeFilter ? t('no_filtered_applications') : t('no_applications')}
          </p>
          {!activeFilter && (
            <Link
              href="/jobs"
              className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              {t('browse_jobs_button')}
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">{t('col_job')}</th>
                  <th className="px-4 py-3">{t('col_status')}</th>
                  <th className="px-4 py-3">{t('col_date')}</th>
                  <th className="px-4 py-3">{t('col_cv')}</th>
                  <th aria-label="actions" className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => {
                  const logs = logsByApplication.get(app.id) ?? [];
                  return (
                    <React.Fragment key={app.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/jobs/${app.jobId}`}
                            className="font-medium text-gray-900 hover:text-red-700 hover:underline"
                          >
                            {app.jobTitle}
                          </Link>
                          <p className="text-xs text-gray-500">{app.jobLocation}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(app.status)}`}
                          >
                            {statusLabel[app.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {dateFormatter.format(app.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={app.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-700 hover:underline"
                          >
                            {t('cv_link')}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          {app.status === 'PENDING' && (
                            <CancelApplicationButton applicationId={app.id} />
                          )}
                        </td>
                      </tr>
                      {logs.length > 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="px-4 py-2">
                            <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase">
                              {t('history_title')}
                            </p>
                            <ol className="flex flex-wrap gap-x-4 gap-y-1">
                              {logs.map((log) => (
                                <li
                                  key={log.id}
                                  className="flex items-center gap-1 text-xs text-gray-600"
                                >
                                  <span>{statusLabel[log.fromStatus]}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-medium">{statusLabel[log.toStatus]}</span>
                                  <span className="ml-1 text-gray-400">
                                    {logDateFormatter.format(log.createdAt)}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {t('page_info', { current: safePage, total: totalPages })}
              </span>
              <div className="flex gap-2">
                {safePage > 1 && (
                  <Link
                    href={pageHref(safePage - 1)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    {t('page_prev')}
                  </Link>
                )}
                {safePage < totalPages && (
                  <Link
                    href={pageHref(safePage + 1)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    {t('page_next')}
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
