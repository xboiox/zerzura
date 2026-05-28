import { and, asc, desc, gt, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JobCard } from '@/components/jobs/JobCard';
import { GlobeHeroSection } from '@/components/marketing/GlobeHeroSection';
import { LogosSlider } from '@/components/marketing/LogosSlider';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { clientLogoTable, jobTable } from '@/models/Schema';
import { AppConfig } from '@/utils/AppConfig';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: HomePageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });
  return {
    title: t('meta_title', { name: AppConfig.name }),
    description: t('meta_description', { name: AppConfig.name }),
  };
}

export default async function IndexPage(props: HomePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'HomePage' });
  const tService = await getTranslations({ locale, namespace: 'ServicePage' });

  const [company, clientLogos, recentJobs] = await Promise.all([
    db.query.companyProfileTable.findFirst(),
    db.select().from(clientLogoTable).orderBy(asc(clientLogoTable.createdAt)),
    db
      .select()
      .from(jobTable)
      .where(and(eq(jobTable.status, 'PUBLISHED'), gt(jobTable.deadline, new Date())))
      .orderBy(desc(jobTable.createdAt))
      .limit(6),
  ]);

  const aboutFocusPoints = [t('about_focus_1'), t('about_focus_2'), t('about_focus_3')];

  const services = [
    { title: tService('card_recruitment_title'), desc: tService('card_recruitment_desc') },
    { title: tService('card_selection_title'), desc: tService('card_selection_desc') },
    { title: tService('card_career_title'), desc: tService('card_career_desc') },
    { title: tService('card_placement_title'), desc: tService('card_placement_desc') },
  ];

  return (
    <div>
      <GlobeHeroSection
        companyName={company?.name ?? AppConfig.name}
        tagline={t('tagline')}
        ctaJobsLabel={t('view_all_jobs')}
        ctaContactLabel={t('cta_contact')}
      />

      {/* Klien Kami */}
      {clientLogos.length > 0 && (
        <section className="border-b border-gray-100 bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="mb-2 text-center text-xs font-semibold tracking-wide text-red-700 uppercase">
              {t('clients_label')}
            </p>
            <h2 className="mb-8 text-center text-xl font-bold text-gray-900">
              {t('clients_title')}
            </h2>
          </div>
          <LogosSlider logos={clientLogos} />
        </section>
      )}

      {/* Tentang Kami */}
      {company && (
        <section className="bg-gray-50 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="mb-2 text-sm font-semibold tracking-wide text-red-700 uppercase">
                  {t('about_preview_title')}
                </p>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">{company.name}</h2>
                <p className="mb-6 text-gray-600">{t('about_description')}</p>
                <ul className="space-y-3">
                  {aboutFocusPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-red-700" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link href="/about" className="text-sm font-medium text-red-700 hover:underline">
                    {t('about_read_more')} →
                  </Link>
                </div>
              </div>
              <div className="rounded-xl bg-red-700 p-8 text-white">
                <p className="mb-4 text-lg leading-relaxed font-medium italic">
                  &ldquo;{t('tagline')}&rdquo;
                </p>
                <p className="text-sm text-red-200">{company.name}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Layanan */}
      <section className="border-b border-gray-100 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t('services_preview_title')}</h2>
            <Link href="/services" className="text-sm font-medium text-red-700 hover:underline">
              {t('services_read_more')}
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 font-semibold text-gray-900">{service.title}</h3>
                <p className="text-sm text-gray-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lowongan Terbaru */}
      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t('recent_jobs_title')}</h2>
            <Link href="/jobs" className="text-sm font-medium text-red-700 hover:underline">
              {t('view_all_jobs')}
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <p className="text-gray-500">{t('no_jobs')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
