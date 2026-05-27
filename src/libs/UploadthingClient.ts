import { generateReactHelpers } from '@uploadthing/react';
import type { UploadRouter } from './Uploadthing';

export const { useUploadThing } = generateReactHelpers<UploadRouter>();
