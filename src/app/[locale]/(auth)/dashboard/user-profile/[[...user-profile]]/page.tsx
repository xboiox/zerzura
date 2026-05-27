import { UserProfile } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { db } from '@/libs/DB';
import { userProfileTable } from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';

export default async function UserProfilePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'UserProfilePage' });

  const [clerkUser, dbProfile] = await Promise.all([
    currentUser(),
    (async () => {
      const user = await currentUser();
      if (!user) {
        return null;
      }
      return await db.query.userProfileTable.findFirst({
        where: eq(userProfileTable.clerkId, user.id),
      });
    })(),
  ]);

  if (!clerkUser) {
    return null;
  }

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.id;
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? '—';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {/* Personal info */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        {/* Clerk user header */}
        <div className="mb-6 flex items-center gap-4">
          {clerkUser.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clerkUser.imageUrl}
              alt={fullName}
              width={56}
              height={56}
              className="size-14 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-base font-semibold text-gray-900">{fullName}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('personal_info_title')}
        </h2>

        <ProfileForm
          phone={dbProfile?.phone ?? null}
          city={dbProfile?.city ?? null}
          skills={dbProfile?.skills ?? []}
        />
      </section>

      {/* Clerk account management */}
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('account_title')}
        </h2>
        <div className="lg:-ml-4">
          <UserProfile path={getI18nPath('/dashboard/user-profile', locale)} />
        </div>
      </section>
    </div>
  );
}
