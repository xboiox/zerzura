import { asc } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { deleteClientLogo } from '@/actions/clientLogoActions';
import { updateCompanyProfile } from '@/actions/companyActions';
import { updateOfficeLocations } from '@/actions/pageActions';
import { ClientLogoForm } from '@/components/admin/ClientLogoForm';
import { ToastFromUrl } from '@/components/admin/ToastFromUrl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/libs/DB';
import { clientLogoTable } from '@/models/Schema';

type AdminCompanyPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCompanyPage(props: AdminCompanyPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminCompanyPage' });

  const [company, aboutContent, logos] = await Promise.all([
    db.query.companyProfileTable.findFirst(),
    db.query.aboutContentTable.findFirst(),
    db.select().from(clientLogoTable).orderBy(asc(clientLogoTable.createdAt)),
  ]);

  return (
    <>
      <ToastFromUrl />
      <div className="max-w-2xl space-y-10">
        <div>
          <h1 className="mb-8 text-2xl font-bold text-gray-900">{t('title')}</h1>

          <form
            action={updateCompanyProfile}
            className="space-y-5 rounded-lg border border-gray-200 bg-white p-6"
          >
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('name_label')}
              </label>
              <Input
                name="name"
                defaultValue={company?.name ?? ''}
                placeholder={t('name_placeholder')}
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('address_label')}
              </label>
              <Input
                name="address"
                defaultValue={company?.address ?? ''}
                placeholder={t('address_placeholder')}
                required
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('logo_url_label')}
              </label>
              <Input
                name="logoUrl"
                type="url"
                defaultValue={company?.logoUrl ?? ''}
                placeholder={t('logo_url_placeholder')}
              />
            </div>

            <hr className="border-gray-200" />

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('email_label')}
              </label>
              <Input
                name="email"
                type="email"
                defaultValue={company?.email ?? ''}
                placeholder={t('email_placeholder')}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('phone_label')}
              </label>
              <Input
                name="phone"
                defaultValue={company?.phone ?? ''}
                placeholder={t('phone_placeholder')}
              />
            </div>

            <hr className="border-gray-200" />

            {/* LinkedIn */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('linkedin_url_label')}
              </label>
              <Input
                name="linkedinUrl"
                type="url"
                defaultValue={company?.linkedinUrl ?? ''}
                placeholder="https://linkedin.com/company/..."
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('whatsapp_label')}
              </label>
              <Input
                name="whatsappNumber"
                defaultValue={company?.whatsappNumber ?? ''}
                placeholder={t('whatsapp_placeholder')}
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('instagram_url_label')}
              </label>
              <Input
                name="instagramUrl"
                type="url"
                defaultValue={company?.instagramUrl ?? ''}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                {t('submit_button')}
              </button>
            </div>
          </form>
        </div>

        {/* Office Locations */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('offices_section_title')}</h2>

          <form
            action={updateOfficeLocations}
            className="space-y-5 rounded-lg border border-gray-200 bg-white p-6"
          >
            {(
              [
                {
                  nameKey: 'office1Name' as const,
                  addrKey: 'office1Address' as const,
                  mapKey: 'office1MapUrl' as const,
                  nameLabel: t('office1_name_label'),
                  namePlaceholder: t('office1_name_placeholder'),
                  addrLabel: t('office1_address_label'),
                },
                {
                  nameKey: 'office2Name' as const,
                  addrKey: 'office2Address' as const,
                  mapKey: 'office2MapUrl' as const,
                  nameLabel: t('office2_name_label'),
                  namePlaceholder: t('office2_name_placeholder'),
                  addrLabel: t('office2_address_label'),
                },
                {
                  nameKey: 'office3Name' as const,
                  addrKey: 'office3Address' as const,
                  mapKey: 'office3MapUrl' as const,
                  nameLabel: t('office3_name_label'),
                  namePlaceholder: t('office3_name_placeholder'),
                  addrLabel: t('office3_address_label'),
                },
              ] as const
            ).map((office) => (
              <div
                key={office.nameKey}
                className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {office.nameLabel}
                  </label>
                  <Input
                    name={office.nameKey}
                    defaultValue={aboutContent?.[office.nameKey] ?? ''}
                    placeholder={office.namePlaceholder}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {office.addrLabel}
                  </label>
                  <Textarea
                    name={office.addrKey}
                    rows={2}
                    defaultValue={aboutContent?.[office.addrKey] ?? ''}
                    placeholder="Jl. ..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {t('offices_map_url_label')}
                  </label>
                  <Input
                    name={office.mapKey}
                    type="url"
                    defaultValue={aboutContent?.[office.mapKey] ?? ''}
                    placeholder={t('offices_map_url_placeholder')}
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                {t('offices_submit_button')}
              </button>
            </div>
          </form>
        </div>

        {/* Client & Partner Network */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('clients_section_title')}</h2>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <ClientLogoForm
              urlLabel={t('client_url_label')}
              urlPlaceholder={t('client_url_placeholder')}
              nameLabel={t('client_name_label')}
              namePlaceholder={t('client_name_placeholder')}
              addButton={t('client_add_button')}
              addingLabel={t('client_adding_label')}
            />

            <div className="mt-6">
              {logos.length === 0 ? (
                <p className="text-sm text-gray-400">{t('client_no_logos')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {logos.map((logo) => (
                    <div
                      key={logo.id}
                      className="group relative flex flex-col items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4"
                    >
                      <img
                        src={logo.logoUrl}
                        alt={logo.altText ?? ''}
                        className="h-10 w-auto max-w-full object-contain"
                      />
                      {logo.altText && (
                        <p className="w-full truncate text-center text-xs text-gray-500">
                          {logo.altText}
                        </p>
                      )}
                      <form action={deleteClientLogo.bind(null, logo.id)}>
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:text-red-800 hover:underline"
                        >
                          {t('client_delete_button')}
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
