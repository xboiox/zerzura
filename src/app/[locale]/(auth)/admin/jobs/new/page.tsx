import { setRequestLocale } from 'next-intl/server';
import { JobForm } from '@/components/admin/JobForm';

type AdminJobsNewPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminJobsNewPage(props: AdminJobsNewPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <JobForm mode="create" />;
}
