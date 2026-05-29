import { auth } from '@clerk/nextjs/server';
import type { FileRouter } from 'uploadthing/next';
import { createUploadthing } from 'uploadthing/next';

const f = createUploadthing();

export const uploadRouter = {
  cvUploader: f({ pdf: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) {
        throw new Error('Unauthorized');
      }
      return { userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),

  avatarUploader: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) {
        throw new Error('Unauthorized');
      }
      return { userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
