# Job Portal

Platform rekrutmen berbasis web untuk mempertemukan recruiter yang memposting lowongan dengan pelamar yang mencari pekerjaan.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL (local dev / Neon production) + Drizzle ORM
- **Auth:** Clerk
- **File Upload:** Uploadthing
- **Email:** Resend + React Email
- **i18n:** next-intl (ID/EN)
- **Rate Limiting:** Arcjet
- **Deployment:** Vercel

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14 (local) **atau** akun [Neon](https://neon.tech) (production)
- Akun [Clerk](https://clerk.com)
- Akun [Uploadthing](https://uploadthing.com)
- Akun [Resend](https://resend.com)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in all environment variables (lihat seksi Environment Variables)

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Clerk Auth
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Uploadthing
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...

# Resend Email
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Arcjet (rate limiting)
ARCJET_KEY=ajkey_...
```

## Database

```bash
npm run db:generate   # Generate migration dari perubahan schema
npm run db:migrate    # Apply migration ke database
npm run db:studio     # Buka Drizzle Studio (GUI)
npm run db:seed       # Seed data awal (company_profile placeholder)
```

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run linter (oxlint)
npm run lint:fix     # Auto-fix lint errors
npm run check:types  # TypeScript type check
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
```

## Post-Deploy Checklist

Setelah deploy pertama ke Vercel:

1. **Setup Clerk Webhook**
   - Clerk Dashboard → Webhooks → Add Endpoint
   - URL: `https://[domain]/api/webhooks/clerk`
   - Events: `user.created`, `organizationInvitation.accepted`
   - Copy Signing Secret → set sebagai `CLERK_WEBHOOK_SECRET` di Vercel env vars

2. **Konfigurasi Clerk JWT Template** *(wajib — hanya sekali)*
   - Clerk Dashboard → **Configure** → **Sessions** → Edit JWT template
   - Tambahkan: `"metadata": "{{user.public_metadata}}"`
   - Tanpa ini, role tidak terbaca di middleware dan redirect tidak berfungsi

3. **Buat Akun Super Admin**
   - Buka `https://[domain]/sign-up` dan daftar
   - Clerk Dashboard → Users → pilih akun tersebut → Edit Metadata
   - Set: `{ "role": "SUPER_ADMIN" }`
   - Sign out lalu sign in ulang agar JWT diperbarui

3. **Isi Company Profile**
   - Login sebagai super admin → buka `/admin/company`
   - Isi nama perusahaan, logo, deskripsi, dan alamat

4. **Smoke Test**
   - Buat satu lowongan sebagai admin
   - Daftar sebagai pelamar dan apply
   - Verifikasi email notifikasi terkirim

## Documentation

| Dokumen | Deskripsi |
|---|---|
| [prd.md](prd.md) | Product Requirements Document |
| [plan.md](plan.md) | Implementation plan dengan fase dan tasks |
| [docs/architecture.md](docs/architecture.md) | Arsitektur teknis, folder structure, DB schema |
| [docs/decisions.md](docs/decisions.md) | Architecture Decision Records |
| [docs/conventions.md](docs/conventions.md) | Code conventions dan pola yang digunakan |
| [docs/testing.md](docs/testing.md) | Panduan testing |
| [CHANGELOG.md](CHANGELOG.md) | History perubahan |
