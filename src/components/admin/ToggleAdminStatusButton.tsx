'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { toggleAdminStatus } from '@/actions/userActions';

type ToggleAdminStatusButtonProps = {
  clerkId: string;
  isActive: boolean;
};

export function ToggleAdminStatusButton(props: ToggleAdminStatusButtonProps) {
  const t = useTranslations('AdminUsersPage');
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleAdminStatus(props.clerkId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(props.isActive ? t('deactivate_success') : t('activate_success'));
      }
      setConfirming(false);
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? '…' : t('confirm_yes')}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setConfirming(false);
          }}
          className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
        >
          {t('confirm_no')}
        </button>
      </div>
    );
  }

  if (props.isActive) {
    return (
      <button
        type="button"
        onClick={() => {
          setConfirming(true);
        }}
        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        {t('deactivate_button')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setConfirming(true);
      }}
      className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
    >
      {t('activate_button')}
    </button>
  );
}
