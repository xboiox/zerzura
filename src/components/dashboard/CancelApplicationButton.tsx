'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { cancelApplication } from '@/actions/applicationActions';

type CancelApplicationButtonProps = {
  applicationId: string;
};

export function CancelApplicationButton(props: CancelApplicationButtonProps) {
  const t = useTranslations('DashboardPage');
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      await cancelApplication(props.applicationId);
    });
  };

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-gray-600">{t('confirm_cancel')}</span>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {t('cancel_confirm_yes')}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
          }}
          disabled={isPending}
          className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          {t('cancel_confirm_no')}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setConfirming(true);
      }}
      className="text-xs font-medium text-red-600 hover:text-red-800"
    >
      {t('cancel_application')}
    </button>
  );
}
