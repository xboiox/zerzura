'use client';

import { useTranslations } from 'next-intl';
import { useRef, useTransition } from 'react';
import { updateApplicationStatus } from '@/actions/applicationActions';

type ApplicationStatus =
  | 'PENDING'
  | 'REVIEWED'
  | 'INTERVIEWED'
  | 'ASSESSMENT'
  | 'OFFERING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

type StatusUpdateFormProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

const ALL_STATUSES: ApplicationStatus[] = [
  'PENDING',
  'REVIEWED',
  'INTERVIEWED',
  'ASSESSMENT',
  'OFFERING',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
];

export function StatusUpdateForm(props: StatusUpdateFormProps) {
  const t = useTranslations('AdminApplicantsPage');
  const [isPending, startTransition] = useTransition();
  const selectRef = useRef<HTMLSelectElement>(null);

  const statusLabels: Record<ApplicationStatus, string> = {
    PENDING: t('status_pending'),
    REVIEWED: t('status_reviewed'),
    INTERVIEWED: t('status_interviewed'),
    ASSESSMENT: t('status_assessment'),
    OFFERING: t('status_offering'),
    ACCEPTED: t('status_accepted'),
    REJECTED: t('status_rejected'),
    WITHDRAWN: t('status_withdrawn'),
  };

  const handleUpdate = () => {
    const rawValue = selectRef.current?.value;
    const newStatus = ALL_STATUSES.find((s) => s === rawValue);
    if (!newStatus || newStatus === props.currentStatus) {
      return;
    }
    startTransition(async () => {
      await updateApplicationStatus(props.applicationId, newStatus);
    });
  };

  return (
    <span className="flex items-center gap-1">
      <select
        ref={selectRef}
        defaultValue={props.currentStatus}
        disabled={isPending}
        className="rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700 focus:outline-none disabled:opacity-50"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleUpdate}
        disabled={isPending}
        className="rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? '...' : t('update_status')}
      </button>
    </span>
  );
}
