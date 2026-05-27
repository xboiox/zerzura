'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

type ToastKey = 'job_created' | 'job_updated' | 'company_saved' | 'status_updated';

function isToastKey(val: string | null): val is ToastKey {
  return (
    val === 'job_created' ||
    val === 'job_updated' ||
    val === 'company_saved' ||
    val === 'status_updated'
  );
}

export function ToastFromUrl() {
  const t = useTranslations('ToastMessages');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const key = searchParams.get('toast');
    if (!isToastKey(key)) {
      return;
    }

    toast.success(t(key));

    const params = new URLSearchParams(searchParams.toString());
    params.delete('toast');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [searchParams, pathname, router, t]);

  return null;
}
