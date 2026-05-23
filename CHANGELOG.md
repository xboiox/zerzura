# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planning & Design
- PRD v3.0 final: role-based auth (Clerk), Drizzle ORM, URL-based i18n, 9 fitur MVP
- Architecture document: folder structure, DB schema (5 tabel), auth flow
- Architecture Decision Records (11 ADR)
- Code conventions document
- Implementation plan: 12 fase dengan tasks terurut
- Context document untuk onboarding

### Boilerplate Setup
- Adopted ixartz/Next.js-Boilerplate (Next.js 16, Tailwind CSS v4, TypeScript)
- Stack: Clerk auth, Drizzle ORM + PostgreSQL, next-intl, Arcjet, Logtape
- Base configuration tersedia: DB connection, i18n routing, auth layout, env validation

### Phase 2: Auth & Middleware
- `src/proxy.ts`: tambah proteksi `/admin/*`, role-based redirect (ADMIN/SUPER_ADMIN → `/admin`), block non-admin dari `/admin`, block `isActive = false`
- `src/app/api/webhooks/clerk/route.ts`: handle `user.created` → insert `UserProfile`, verifikasi signature via svix
- `src/types/globals.d.ts`: Clerk `CustomJwtSessionClaims` type augmentation (`role`, `isActive`)
- Install `svix` untuk webhook signature verification
- Fix `locale: string` → `locale: Locale` di semua page/layout (10 file)
- Fix `tsconfig.json`: hapus `.next/dev/types/**/*.ts` dari include
- Clerk JWT template dikonfigurasi: tambah `"metadata": "{{user.public_metadata}}"` agar role tersedia di session claims
- Test passed: sign-up → `/dashboard`, super admin → `/admin`

### Phase 1: Database Schema
- Tulis semua schema di `src/models/Schema.ts`: 5 tabel (userProfile, job, application, applicationStatusLog, companyProfile)
- 3 enum types: `job_type`, `job_status`, `application_status`
- Unique constraint: `application(jobId, applicantClerkId)` — satu apply per lowongan per pelamar
- `companyProfile` singleton dengan `id = 1` (upsert)
- Migration `0000_init-schema.sql` di-generate dan di-apply ke local PostgreSQL
- Seed script `scripts/seed.ts` (`npm run db:seed`) untuk company_profile placeholder

---

## [0.0.1] - 2026-05-22

### Added
- Initial project setup dari Next.js boilerplate
- Project documentation: PRD, architecture, decisions, conventions, plan
