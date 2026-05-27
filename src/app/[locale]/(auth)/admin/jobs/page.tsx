import type { InferSelectModel, SQL } from 'drizzle-orm';
import { and, asc, count, desc, eq, gt, ilike, inArray, lte } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { updateJobStatus } from '@/actions/jobActions';
import { ActionButton } from '@/components/admin/ActionButton';
import { ConfirmPublishButton } from '@/components/admin/ConfirmPublishButton';
import { ToastFromUrl } from '@/components/admin/ToastFromUrl';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationTable, jobTable, jobTypeEnum } from '@/models/Schema';

const PAGE_SIZE = 15;

type View = 'active' | 'draft' | 'expired' | 'inactive';
type SortCol = 'createdAt' | 'deadline' | 'title' | 'type';
type SortDir = 'asc' | 'desc';
type JobType = (typeof jobTypeEnum.enumValues)[number];

function isView(val: unknown): val is View {
  return val === 'active' || val === 'draft' || val === 'expired' || val === 'inactive';
}

function isJobType(val: unknown): val is JobType {
  return val === 'REMOTE' || val === 'ONSITE' || val === 'HYBRID';
}

function isSortCol(val: unknown): val is SortCol {
  return val === 'createdAt' || val === 'deadline' || val === 'title' || val === 'type';
}

function pillClass(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    active
      ? 'border-gray-900 bg-gray-900 text-white'
      : 'border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'
  }`;
}

function getSortColumn(sort: SortCol) {
  if (sort === 'title') {
    return jobTable.title;
  }
  if (sort === 'deadline') {
    return jobTable.deadline;
  }
  if (sort === 'type') {
    return jobTable.jobType;
  }
  return jobTable.createdAt;
}

function buildConditions(
  view: View | undefined,
  validType: JobType | undefined,
  q: string | undefined,
  now: Date,
): SQL[] {
  const conditions: SQL[] = [];
  if (view === 'active') {
    conditions.push(eq(jobTable.status, 'PUBLISHED'), gt(jobTable.deadline, now));
  } else if (view === 'draft') {
    conditions.push(eq(jobTable.status, 'DRAFT'));
  } else if (view === 'expired') {
    conditions.push(eq(jobTable.status, 'PUBLISHED'), lte(jobTable.deadline, now));
  } else if (view === 'inactive') {
    conditions.push(eq(jobTable.status, 'INACTIVE'));
  }
  if (validType) {
    conditions.push(eq(jobTable.jobType, validType));
  }
  if (q) {
    conditions.push(ilike(jobTable.title, `%${q}%`));
  }
  return conditions;
}

type JobRecord = InferSelectModel<typeof jobTable>;

type JobRowLabels = {
  edit: string;
  applicants: string;
  publish: string;
  confirmPublish: string;
  cancelPublish: string;
  draft: string;
  deactivate: string;
  confirmDeactivate: string;
  cancelDeactivate: string;
  reactivate: string;
  expiredBadge: string;
  statusMsg: string;
};

function sortIndicator(col: SortCol, sort: SortCol, dir: SortDir): string {
  if (sort !== col) {
    return ' ↕';
  }
  return dir === 'asc' ? ' ↑' : ' ↓';
}

function getCount(rows: { value: number }[]): number {
  return rows[0]?.value ?? 0;
}

function getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'secondary' {
  if (status === 'PUBLISHED') {
    return 'default';
  }
  if (status === 'INACTIVE') {
    return 'destructive';
  }
  return 'secondary';
}

function renderJobRow(
  job: JobRecord,
  now: Date,
  locale: string,
  labels: JobRowLabels,
  typeLabel: string,
  applicantsCount: number,
) {
  const isExpired = job.deadline < now;
  const publishAction = updateJobStatus.bind(null, job.id, 'PUBLISHED');
  const draftAction = updateJobStatus.bind(null, job.id, 'DRAFT');
  const inactiveAction = updateJobStatus.bind(null, job.id, 'INACTIVE');
  const deadline = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(job.deadline);

  return (
    <TableRow key={job.id}>
      <TableCell className="max-w-xs font-medium text-gray-900">
        <span className="line-clamp-1">{job.title}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{typeLabel}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(job.status)}>{job.status}</Badge>
          {isExpired && job.status === 'PUBLISHED' && (
            <Badge variant="outline">{labels.expiredBadge}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-gray-600">{deadline}</TableCell>
      <TableCell>
        <Link
          href={`/admin/jobs/${job.id}/applicants`}
          className="font-medium text-red-700 hover:underline"
        >
          {applicantsCount}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/jobs/${job.id}/edit`}
            className="rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            {labels.edit}
          </Link>

          {job.status === 'DRAFT' && (
            <ConfirmPublishButton
              action={publishAction}
              label={labels.publish}
              confirmLabel={labels.confirmPublish}
              cancelLabel={labels.cancelPublish}
              successMessage={labels.statusMsg}
              className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
            />
          )}

          {job.status === 'PUBLISHED' && (
            <>
              <ActionButton
                action={draftAction}
                label={labels.draft}
                successMessage={labels.statusMsg}
                className="rounded px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50"
              />
              <ConfirmPublishButton
                action={inactiveAction}
                label={labels.deactivate}
                confirmLabel={labels.confirmDeactivate}
                cancelLabel={labels.cancelDeactivate}
                successMessage={labels.statusMsg}
                className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              />
            </>
          )}

          {job.status === 'INACTIVE' && (
            <ActionButton
              action={draftAction}
              label={labels.reactivate}
              successMessage={labels.statusMsg}
              className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

type AdminJobsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    view?: string;
    type?: string;
    sort?: string;
    dir?: string;
    q?: string;
    page?: string;
  }>;
};

export default async function AdminJobsPage(props: AdminJobsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const {
    view: rawView,
    type: rawType,
    sort: rawSort,
    dir: rawDir,
    q,
    page: pageParam,
  } = await props.searchParams;

  const t = await getTranslations({ locale, namespace: 'AdminJobsPage' });
  const tType = await getTranslations({ locale, namespace: 'JobType' });
  const tToast = await getTranslations({ locale, namespace: 'ToastMessages' });

  const view = isView(rawView) ? rawView : undefined;
  const validType = isJobType(rawType) ? rawType : undefined;
  const sort: SortCol = isSortCol(rawSort) ? rawSort : 'createdAt';
  const dir: SortDir = rawDir === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(pageParam) || 1);
  const hasFilters = [view, validType, q].some(Boolean);

  const now = new Date();
  const conditions = buildConditions(view, validType, q, now);
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderFn = dir === 'asc' ? asc : desc;

  const [totalResult, rawJobs] = await Promise.all([
    db.select({ value: count() }).from(jobTable).where(where),
    db
      .select()
      .from(jobTable)
      .where(where)
      .orderBy(orderFn(getSortColumn(sort)))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
  ]);

  const total = getCount(totalResult);
  const hasNextPage = rawJobs.length > PAGE_SIZE;
  const jobs = rawJobs.slice(0, PAGE_SIZE);

  const jobIds = jobs.map((j) => j.id);
  const applicantCountRows =
    jobIds.length > 0
      ? await db
          .select({ jobId: applicationTable.jobId, total: count() })
          .from(applicationTable)
          .where(inArray(applicationTable.jobId, jobIds))
          .groupBy(applicationTable.jobId)
      : [];
  const applicantCountByJobId = new Map(applicantCountRows.map((r) => [r.jobId, r.total]));

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const current = new URLSearchParams();
    if (view) {
      current.set('view', view);
    }
    if (validType) {
      current.set('type', validType);
    }
    if (sort !== 'createdAt') {
      current.set('sort', sort);
    }
    if (dir !== 'desc') {
      current.set('dir', dir);
    }
    if (q) {
      current.set('q', q);
    }
    if (page > 1) {
      current.set('page', String(page));
    }
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) {
        current.delete(k);
      } else {
        current.set(k, v);
      }
    }
    const str = current.toString();
    return str ? `/admin/jobs?${str}` : '/admin/jobs';
  };

  const sortLink = (col: SortCol) =>
    sort === col
      ? buildUrl({ sort: col, dir: dir === 'asc' ? 'desc' : 'asc', page: undefined })
      : buildUrl({ sort: col, dir: 'desc', page: undefined });

  const rowLabels: JobRowLabels = {
    edit: t('edit_button'),
    applicants: t('applicants_button'),
    publish: t('publish_button'),
    confirmPublish: t('confirm_publish'),
    cancelPublish: t('confirm_publish_cancel'),
    draft: t('draft_button'),
    deactivate: t('deactivate_button'),
    confirmDeactivate: t('confirm_deactivate'),
    cancelDeactivate: t('confirm_deactivate_cancel'),
    reactivate: t('reactivate_button'),
    expiredBadge: t('badge_expired'),
    statusMsg: tToast('status_updated'),
  };

  const viewFilters: { key: string; label: string; value: View | undefined }[] = [
    { key: 'all', label: t('filter_all'), value: undefined },
    { key: 'active', label: t('filter_active'), value: 'active' },
    { key: 'draft', label: t('filter_draft'), value: 'draft' },
    { key: 'expired', label: t('filter_expired'), value: 'expired' },
    { key: 'inactive', label: t('filter_inactive'), value: 'inactive' },
  ];

  const typeFilters: { key: string; label: string; value: JobType | undefined }[] = [
    { key: 'all-types', label: t('filter_type_all'), value: undefined },
    ...jobTypeEnum.enumValues.map((v) => ({ key: v, label: tType(v), value: v })),
  ];

  return (
    <>
      <ToastFromUrl />
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <Link
            href="/admin/jobs/new"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            {t('add_job_button')}
          </Link>
        </div>

        {/* Search */}
        <form method="GET" action="" className="mb-4 flex gap-2 sm:max-w-sm">
          {view && <input type="hidden" name="view" value={view} />}
          {validType && <input type="hidden" name="type" value={validType} />}
          {sort !== 'createdAt' && <input type="hidden" name="sort" value={sort} />}
          {dir !== 'desc' && <input type="hidden" name="dir" value={dir} />}
          <input
            name="q"
            defaultValue={q}
            placeholder={t('search_placeholder')}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            {t('search_button')}
          </button>
        </form>

        {/* Filter pills */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {viewFilters.map((f) => (
            <Link
              key={f.key}
              href={buildUrl({ view: f.value, q: undefined, page: undefined })}
              className={pillClass(view === f.value)}
            >
              {f.label}
            </Link>
          ))}

          <span className="mx-1 text-gray-300">|</span>

          {typeFilters.map((f) => (
            <Link
              key={f.key}
              href={buildUrl({ type: f.value, page: undefined })}
              className={pillClass(validType === f.value)}
            >
              {f.label}
            </Link>
          ))}

          {hasFilters && (
            <Link
              href="/admin/jobs"
              className="ml-2 text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline"
            >
              {t('filter_reset')}
            </Link>
          )}
        </div>

        {/* Results count */}
        <p className="mb-4 text-sm text-gray-500">{t('results_label', { count: total })}</p>

        {/* Table */}
        {jobs.length === 0 ? (
          <p className="text-gray-500">{t('no_jobs')}</p>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Link
                      href={sortLink('title')}
                      className="inline-flex items-center hover:text-gray-900"
                    >
                      {t('table_title')}
                      <span className="text-gray-400">{sortIndicator('title', sort, dir)}</span>
                    </Link>
                  </TableHead>
                  <TableHead>
                    <Link
                      href={sortLink('type')}
                      className="inline-flex items-center hover:text-gray-900"
                    >
                      {t('table_type')}
                      <span className="text-gray-400">{sortIndicator('type', sort, dir)}</span>
                    </Link>
                  </TableHead>
                  <TableHead>{t('table_status')}</TableHead>
                  <TableHead>
                    <Link
                      href={sortLink('deadline')}
                      className="inline-flex items-center hover:text-gray-900"
                    >
                      {t('table_deadline')}
                      <span className="text-gray-400">{sortIndicator('deadline', sort, dir)}</span>
                    </Link>
                  </TableHead>
                  <TableHead>{t('table_applicants')}</TableHead>
                  <TableHead>{t('table_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) =>
                  renderJobRow(
                    job,
                    now,
                    locale,
                    rowLabels,
                    tType(job.jobType),
                    applicantCountByJobId.get(job.id) ?? 0,
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {(page > 1 || hasNextPage) && (
          <div className="mt-6 flex items-center justify-center gap-4">
            {page > 1 && (
              <Link
                href={buildUrl({ page: page > 2 ? String(page - 1) : undefined })}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('prev_page')}
              </Link>
            )}
            {hasNextPage && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('next_page')}
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
