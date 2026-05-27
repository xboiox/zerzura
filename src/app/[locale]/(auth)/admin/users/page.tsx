import { auth, clerkClient } from '@clerk/nextjs/server';
import { count, inArray, not } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { InviteAdminForm } from '@/components/admin/InviteAdminForm';
import { ToggleAdminStatusButton } from '@/components/admin/ToggleAdminStatusButton';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationTable, userProfileTable } from '@/models/Schema';

type AdminUsersPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminUsersPage(props: AdminUsersPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminUsersPage' });

  const { userId } = await auth();

  const client = await clerkClient();

  const { data: allUsers } = await client.users.getUserList({ limit: 100 });
  const adminUsers = allUsers.filter((user) => {
    const { role } = user.publicMetadata as { role?: string };
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  });

  const { data: pendingInvitations } = await client.invitations.getInvitationList({
    status: 'pending',
    limit: 50,
  });

  const adminClerkIds = adminUsers.map((u) => u.id);
  const adminProfiles =
    adminClerkIds.length > 0
      ? await db.query.userProfileTable.findMany({
          where: inArray(userProfileTable.clerkId, adminClerkIds),
        })
      : [];

  const profileByClerkId = new Map(adminProfiles.map((p) => [p.clerkId, p]));

  const applicantProfiles =
    adminClerkIds.length > 0
      ? await db.query.userProfileTable.findMany({
          where: not(inArray(userProfileTable.clerkId, adminClerkIds)),
        })
      : await db.query.userProfileTable.findMany();

  const applicantClerkIds = applicantProfiles.map((p) => p.clerkId);

  const applicationCounts =
    applicantClerkIds.length > 0
      ? await db
          .select({
            applicantClerkId: applicationTable.applicantClerkId,
            total: count(),
          })
          .from(applicationTable)
          .where(inArray(applicationTable.applicantClerkId, applicantClerkIds))
          .groupBy(applicationTable.applicantClerkId)
      : [];

  const countByClerkId = new Map(applicationCounts.map((c) => [c.applicantClerkId, c.total]));

  const applicantClerkData = await Promise.all(
    applicantProfiles.map(async (profile) => {
      try {
        const user = await client.users.getUser(profile.clerkId);
        const nameParts = [user.firstName, user.lastName].filter(Boolean);
        const name =
          nameParts.length > 0
            ? nameParts.join(' ')
            : (user.emailAddresses[0]?.emailAddress ?? profile.clerkId);
        const email = user.emailAddresses[0]?.emailAddress ?? '—';
        return { ...profile, name, email };
      } catch {
        return { ...profile, name: profile.clerkId, email: '—' };
      }
    }),
  );

  const dateFormatter = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {/* Admin users table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{t('admins_title')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">{t('col_name')}</th>
                <th className="px-4 py-3 font-medium text-gray-600">{t('col_email')}</th>
                <th className="px-4 py-3 font-medium text-gray-600">{t('col_role')}</th>
                <th className="px-4 py-3 font-medium text-gray-600">{t('col_status')}</th>
                <th className="px-4 py-3 font-medium text-gray-600">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    {t('no_admins')}
                  </td>
                </tr>
              )}
              {adminUsers.map((user) => {
                const profile = profileByClerkId.get(user.id);
                const { role } = user.publicMetadata as { role?: string };
                const email = user.emailAddresses[0]?.emailAddress ?? '—';
                const nameParts = [user.firstName, user.lastName].filter(Boolean);
                const name = nameParts.length > 0 ? nameParts.join(' ') : email;
                const isActive = profile?.isActive ?? true;
                const isSelf = user.id === userId;
                const isSuperAdminUser = role === 'SUPER_ADMIN';

                return (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
                    <td className="px-4 py-3 text-gray-600">{email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isSuperAdminUser
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isSuperAdminUser ? t('role_super_admin') : t('role_admin')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isActive ? t('status_active') : t('status_inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!isSelf && !isSuperAdminUser && (
                        <ToggleAdminStatusButton clerkId={user.id} isActive={isActive} />
                      )}
                      {isSelf && <span className="text-xs text-gray-400">{t('label_you')}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              {t('pending_invitations_title')}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">{t('col_email')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('col_invited_at')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-700">{inv.emailAddress}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {dateFormatter.format(new Date(inv.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        {t('status_pending')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite form */}
      <InviteAdminForm />

      {/* All registered users */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{t('all_users_title')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">{t('col_name')}</th>
                <th className="px-4 py-3 font-medium text-gray-600">{t('col_email')}</th>
                <th className="px-4 py-3 font-medium text-gray-600">{t('col_applications')}</th>
              </tr>
            </thead>
            <tbody>
              {applicantClerkData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    {t('no_users')}
                  </td>
                </tr>
              )}
              {applicantClerkData.map((user) => (
                <tr key={user.clerkId} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.clerkId}`}
                      className="font-medium text-gray-900 hover:text-red-700 hover:underline"
                    >
                      {user.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {countByClerkId.get(user.clerkId) ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
