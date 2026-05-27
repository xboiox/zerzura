import * as z from 'zod';

const optionalUrl = z.url().or(z.literal('')).optional();

export const CompanyValidation = z.object({
  name: z.string().min(1).max(256),
  address: z.string().min(1),
  email: z.email().or(z.literal('')).optional(),
  phone: z.string().max(50).optional(),
  logoUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  whatsappNumber: z.string().max(50).optional(),
  instagramUrl: optionalUrl,
});

export type CompanyFormValues = z.infer<typeof CompanyValidation>;
