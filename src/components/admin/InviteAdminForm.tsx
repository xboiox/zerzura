'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { inviteAdmin } from '@/actions/userActions';

export function InviteAdminForm() {
  const t = useTranslations('AdminUsersPage');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await inviteAdmin(formData);
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(t('invite_success'));
        formRef.current?.reset();
      }
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{t('invite_title')}</h2>
      <form ref={formRef} action={handleSubmit} className="flex items-start gap-3">
        <div className="flex-1">
          <input
            name="email"
            type="email"
            required
            aria-label={t('invite_email_placeholder')}
            placeholder={t('invite_email_placeholder')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          {isPending ? t('invite_submitting') : t('invite_button')}
        </button>
      </form>
    </div>
  );
}
