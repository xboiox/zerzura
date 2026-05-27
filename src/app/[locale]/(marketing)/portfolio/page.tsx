import { asc } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LogoMarquee } from '@/components/marketing/LogoMarquee';
import { buttonVariants } from '@/components/ui/button';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { clientLogoTable } from '@/models/Schema';
import { AppConfig } from '@/utils/AppConfig';

type PortfolioPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: PortfolioPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'PortfolioPage' });
  return {
    title: t('meta_title', { name: AppConfig.name }),
    description: t('meta_description'),
  };
}

export default async function PortfolioPage(props: PortfolioPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PortfolioPage' });
  const clientLogos = await db
    .select()
    .from(clientLogoTable)
    .orderBy(asc(clientLogoTable.createdAt));

  const stats = [
    { value: t('stat_placements_value'), label: t('stat_placements_label') },
    { value: t('stat_companies_value'), label: t('stat_companies_label') },
    { value: t('stat_years_value'), label: t('stat_years_label') },
  ];

  const highlights = [
    { title: t('highlight_1_title'), desc: t('highlight_1_desc') },
    { title: t('highlight_2_title'), desc: t('highlight_2_desc') },
    { title: t('highlight_3_title'), desc: t('highlight_3_desc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('hero_title')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">{t('hero_subtitle')}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-bold text-gray-900">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">{t('highlights_title')}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {highlights.map((h) => (
              <div key={h.title} className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-2 font-semibold text-gray-900">{h.title}</h3>
                <p className="text-sm text-gray-600">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Klien Kami */}
      {clientLogos.length > 0 && (
        <section className="border-t border-gray-100 bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="mb-2 text-center text-xs font-semibold tracking-wide text-red-700 uppercase">
              {t('clients_label')}
            </p>
            <h2 className="mb-8 text-center text-xl font-bold text-gray-900">
              {t('clients_title')}
            </h2>
          </div>
          <LogoMarquee logos={clientLogos} />
        </section>
      )}

      {/* CTA */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">{t('cta_title')}</h2>
          <Link href="/jobs" className={buttonVariants({ size: 'lg' })}>
            {t('cta_button')}
          </Link>
        </div>
      </section>
    </div>
  );
}
