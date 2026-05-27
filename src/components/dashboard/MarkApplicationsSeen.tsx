'use client';

import { useEffect } from 'react';
import { markApplicationsSeen } from '@/actions/applicationActions';

export function MarkApplicationsSeen() {
  useEffect(() => {
    void markApplicationsSeen();
  }, []);

  return null;
}
