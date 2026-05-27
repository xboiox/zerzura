'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

type ActionButtonProps = {
  action: () => Promise<void>;
  label: string;
  successMessage: string;
  className?: string;
};

export function ActionButton(props: ActionButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await props.action();
          toast.success(props.successMessage);
        });
      }}
      className={props.className}
    >
      {isPending ? '…' : props.label}
    </button>
  );
}
