import { and, desc, eq, gt, ilike } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JobCard } from '@/components/jobs/JobCard';
import { Input } from '@/components/ui/input';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { jobTable, jobTypeEnum } from '@/models/Schema';
import { AppConfig } from '@/utils/AppConfig';

type JobType = (typeof jobTypeEnum.enumValues)[number];

function isJobType(val: unknown): val is JobType {
  return val === 'REMOTE' || val === 'ONSITE' || val === 'HYBRID';
}

const PAGE_SIZE = 20;

type JobsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

export async function generateMetadata(props: JobsPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'JobsPage' });
  return {
    title: t('meta_title', { name: AppConfig.name }),
    description: t('meta_description', { name: AppConfig.name }),
  };
}

export default async function JobsPage(props: JobsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const { q, type, page: pageParam } = await props.searchParams;
  const t = await getTranslations({ locale, namespace: 'JobsPage' });
  const tType = await getTranslations({ locale, namespace: 'JobType' });

  const page = Math.max(1, Number(pageParam) || 1);
  const validType = isJobType(type) ? type : undefined;

  const filters = and(
    eq(jobTable.status, 'PUBLISHED'),
    gt(jobTable.deadline, new Date()),
    q ? ilike(jobTable.title, `%${q}%`) : undefined,
    validType ? eq(jobTable.jobType, validType) : undefined,
  );

  // Fetch PAGE_SIZE + 1 to determine if next page exists
  const jobs = await db
    .select()
    .from(jobTable)
    .where(filters)
    .orderBy(desc(jobTable.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const hasNextPage = jobs.length > PAGE_SIZE;
  const displayJobs = hasNextPage ? jobs.slice(0, PAGE_SIZE) : jobs;

  const buildUrl = (params: Record<string, string | undefined>) => {
    const current = new URLSearchParams();
    if (q) {
      current.set('q', q);
    }
    if (validType) {
      current.set('type', validType);
    }
    if (page > 1) {
      current.set('page', String(page));
    }
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) {
        current.delete(k);
      } else {
        current.set(k, v);
      }
    }
    const str = current.toString();
    return str ? `/jobs?${str}` : '/jobs';
  };

  const typeFilters: { label: string; value: string | undefined }[] = [
    { label: t('filter_all_types'), value: undefined },
    ...jobTypeEnum.enumValues.map((v) => ({ label: tType(v), value: v })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">{t('title')}</h1>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <form method="GET" action="" className="flex gap-2 sm:max-w-sm">
          {validType && <input type="hidden" name="type" value={validType} />}
          <Input
            name="q"
            defaultValue={q ?? ''}
            placeholder={t('search_placeholder')}
            className="w-full"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            {t('search_button')}
          </button>
        </form>

        {/* Job type filter */}
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <Link
              key={filter.value ?? 'all'}
              href={buildUrl({ type: filter.value, page: undefined })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                validType === filter.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Results */}
      {displayJobs.length === 0 ? (
        <p className="text-gray-500">{t('no_jobs')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasNextPage) && (
        <div className="mt-10 flex items-center justify-center gap-4">
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
  );
}
