import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OfficeMapSelector } from '@/components/about/OfficeMapSelector';
import { buttonVariants } from '@/components/ui/button';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: AboutPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'AboutPage' });
  return {
    title: t('meta_title', { name: AppConfig.name }),
    description: t('meta_description', { name: AppConfig.name }),
  };
}

export default async function AboutPage(props: AboutPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AboutPage' });
  const [company, content] = await Promise.all([
    db.query.companyProfileTable.findFirst(),
    db.query.aboutContentTable.findFirst(),
  ]);

  const values = [
    { title: t('value_integrity_title'), desc: t('value_integrity_desc') },
    { title: t('value_excellence_title'), desc: t('value_excellence_desc') },
    { title: t('value_collaboration_title'), desc: t('value_collaboration_desc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('hero_title')}
          </h1>
          <div className="mt-4 max-w-2xl">
            <p className="text-lg text-gray-600">{t('hero_description')}</p>
            {company?.address && <p className="mt-2 text-sm text-gray-400">{company.address}</p>}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900">{t('vision_title')}</h2>
              <p className="text-gray-600">{t('vision_text')}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900">{t('mission_title')}</h2>
              <p className="text-gray-600">{t('mission_text')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">{t('values_title')}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {values.map((v) => (
              <div key={v.title}>
                <h3 className="mb-2 font-semibold text-gray-900">{v.title}</h3>
                <p className="text-sm text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lokasi */}
      {content?.office1Name && (
        <section className="py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">{t('contact_title')}</h2>
            <OfficeMapSelector
              offices={[
                {
                  name: content.office1Name,
                  address: content.office1Address ?? '',
                  mapUrl: content.office1MapUrl ?? '',
                },
                {
                  name: content.office2Name ?? '',
                  address: content.office2Address ?? '',
                  mapUrl: content.office2MapUrl ?? '',
                },
                {
                  name: content.office3Name ?? '',
                  address: content.office3Address ?? '',
                  mapUrl: content.office3MapUrl ?? '',
                },
              ].filter((o) => o.name && o.mapUrl)}
            />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <Link href="/jobs" className={buttonVariants({ size: 'lg' })}>
            {t('cta_button')}
          </Link>
        </div>
      </section>
    </div>
  );
}
