import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

type ServicePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ServicePageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'ServicePage' });
  return {
    title: t('meta_title', { name: AppConfig.name }),
    description: t('meta_description'),
  };
}

export default async function ServicePage(props: ServicePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ServicePage' });

  const cards = [
    { title: t('card_recruitment_title'), desc: t('card_recruitment_desc') },
    { title: t('card_selection_title'), desc: t('card_selection_desc') },
    { title: t('card_career_title'), desc: t('card_career_desc') },
    { title: t('card_placement_title'), desc: t('card_placement_desc') },
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

      {/* Service cards */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {cards.map((card) => (
              <div key={card.title} className="rounded-lg border border-gray-200 bg-white p-8">
                <h2 className="mb-3 text-xl font-semibold text-gray-900">{card.title}</h2>
                <p className="text-gray-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">{t('cta_title')}</h2>
          <p className="mb-6 text-gray-600">{t('cta_subtitle')}</p>
          <Link href="/jobs" className={buttonVariants({ size: 'lg' })}>
            {t('cta_button')}
          </Link>
        </div>
      </section>
    </div>
  );
}
