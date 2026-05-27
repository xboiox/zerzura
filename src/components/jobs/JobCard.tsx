import { getLocale, getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/libs/I18nNavigation';

type JobCardProps = {
  job: {
    id: string;
    title: string;
    jobType: 'REMOTE' | 'ONSITE' | 'HYBRID';
    location: string;
    salaryMin: number | null;
    salaryMax: number | null;
    deadline: Date;
  };
};

const JOB_TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  REMOTE: 'default',
  HYBRID: 'secondary',
  ONSITE: 'outline',
};

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeadline(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export async function JobCard(props: JobCardProps) {
  const locale = await getLocale();
  const t = await getTranslations('JobCard');
  const tType = await getTranslations('JobType');

  const { job } = props;
  const isExpired = job.deadline < new Date();

  const salaryText = (() => {
    if (job.salaryMin && job.salaryMax) {
      return `${formatIDR(job.salaryMin)} – ${formatIDR(job.salaryMax)}`;
    }
    if (job.salaryMin) {
      return `${formatIDR(job.salaryMin)}+`;
    }
    return null;
  })();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/jobs/${job.id}`}
          className="text-base font-semibold text-gray-900 hover:text-red-700"
        >
          {job.title}
        </Link>
        {isExpired && (
          <Badge variant="destructive" className="shrink-0">
            {t('expired')}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={JOB_TYPE_VARIANT[job.jobType] ?? 'default'}>{tType(job.jobType)}</Badge>
        <span className="text-sm text-gray-500">{job.location}</span>
      </div>

      {salaryText && <p className="text-sm font-medium text-gray-700">{salaryText}</p>}

      <div className="mt-auto flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">
          {t('deadline_label')}
          {': '}
          {formatDeadline(job.deadline, locale)}
        </p>
        <Link href={`/jobs/${job.id}`} className="text-xs font-medium text-red-700 hover:underline">
          {t('detail_link')}
        </Link>
      </div>
    </div>
  );
}
