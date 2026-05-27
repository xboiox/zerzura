import * as z from 'zod';
import { jobTypeEnum } from '@/models/Schema';

const optionalSalary = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
  z.number().int().positive().optional(),
);

/** Server-side schema — parses raw FormData strings via coercion/preprocess */
export const JobValidation = z.object({
  title: z.string().min(1).max(256),
  description: z.string().min(1),
  requirements: z.string().min(1),
  jobType: z.enum(jobTypeEnum.enumValues),
  location: z.string().min(1).max(256),
  salaryMin: optionalSalary,
  salaryMax: optionalSalary,
  deadline: z.coerce.date(),
});

/** Client-side schema — all string fields, used with react-hook-form */
export const JobFormSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().min(1),
  requirements: z.string().min(1),
  jobType: z.enum(jobTypeEnum.enumValues),
  location: z.string().min(1).max(256),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  deadline: z.string().min(1),
});

export const JobStatusValidation = z.object({
  jobId: z.uuid(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'INACTIVE']),
});

export type JobFormValues = z.infer<typeof JobFormSchema>;
