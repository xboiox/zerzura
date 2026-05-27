import * as z from 'zod';

export const ApplicationValidation = z.object({
  jobId: z.uuid(),
  cvUrl: z.url(),
  coverLetter: z.string().min(50).max(2000),
});
