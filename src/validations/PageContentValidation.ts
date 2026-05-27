import * as z from 'zod';

export const OfficeLocationsValidation = z.object({
  office1Name: z.string().max(256).optional(),
  office1Address: z.string().optional(),
  office1MapUrl: z.url().or(z.literal('')).optional(),
  office2Name: z.string().max(256).optional(),
  office2Address: z.string().optional(),
  office2MapUrl: z.url().or(z.literal('')).optional(),
  office3Name: z.string().max(256).optional(),
  office3Address: z.string().optional(),
  office3MapUrl: z.url().or(z.literal('')).optional(),
});
