'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

type ConfirmPublishButtonProps = {
  action: () => Promise<void>;
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  successMessage: string;
  className?: string;
};

export function ConfirmPublishButton(props: ConfirmPublishButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await props.action();
      toast.success(props.successMessage);
      setConfirming(false);
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={handleConfirm}
          className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
        >
          {isPending ? '…' : props.confirmLabel}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setConfirming(false);
          }}
          className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
        >
          {props.cancelLabel}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setConfirming(true);
      }}
      className={props.className}
    >
      {props.label}
    </button>
  );
}
