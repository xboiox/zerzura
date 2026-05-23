# Project Context — Job Portal

Dokumen ini adalah referensi cepat untuk memulai sesi development atau onboarding.

---

## Apa Ini

Job portal web app untuk satu perusahaan. Dua fungsi utama:
1. **Admin** posting dan mengelola lowongan kerja
2. **Pelamar** mencari dan melamar pekerjaan, memantau status lamaran

## Status Saat Ini

**Fase:** Baru mulai
**Selesai:** —
**Next step:** Phase 0 di [plan.md](../plan.md) — Project Setup & Configuration

## Tiga Role

| Role | Cara Buat | Kemampuan |
|---|---|---|
| `SUPER_ADMIN` | Manual via Clerk dashboard (post-deploy) | Semua + kelola admin + edit company profile |
| `ADMIN` | Diundang oleh super admin via Clerk Invitation API | Post job + review applicants + update status |
| `USER` | Register sendiri via `/sign-up` | Browse + apply + pantau status |

Role disimpan di Clerk `publicMetadata.role`. Default (tidak ada value) = USER.

## Database: 5 Tabel

```
UserProfile          → data extra user (profil pelamar, isActive admin)
Job                  → lowongan (DRAFT/PUBLISHED/INACTIVE)
Application          → lamaran + CV snapshot URL
ApplicationStatusLog → audit trail setiap perubahan status
CompanyProfile       → singleton: konten homepage
```

Skema lengkap: [docs/architecture.md](architecture.md)

## Keputusan Kunci

| Topik | Keputusan |
|---|---|
| Auth | Clerk (bukan NextAuth) — boilerplate sudah include |
| ORM | Drizzle (bukan Prisma) — boilerplate sudah include |
| i18n | URL-based (`/` = ID, `/en/` = EN), bukan cookie |
| Expired jobs | Query filter `deadline > now()`, bukan cron job |
| Admin emails | Query Clerk API saat diperlukan, tidak disimpan di DB |
| CV storage | URL snapshot di tabel Application — file tidak pernah dihapus |
| Admin deaktivasi | `isActive` field di DB, dicek di middleware |

Detail semua keputusan: [docs/decisions.md](decisions.md)

## File Penting

| File | Fungsi |
|---|---|
| `src/models/Schema.ts` | Semua Drizzle table definitions |
| `src/libs/Env.ts` | Semua environment variable definitions |
| `src/utils/AppConfig.ts` | Config app (locales, nama, dll) |
| `middleware.ts` | Auth guard + role redirect + isActive check |
| `src/app/api/webhooks/clerk/route.ts` | Role assignment saat user baru dibuat |

## Konvensi Singkat

- Komponen: PascalCase (`JobCard.tsx`)
- Actions: camelCase (`jobActions.ts`)
- Validations: PascalCase + Validation suffix (`JobValidation.ts`)
- Jangan `console.log` — gunakan `logger` dari `src/libs/Logger.ts`
- Server Component by default, `'use client'` hanya jika butuh interaktivitas

Konvensi lengkap: [docs/conventions.md](conventions.md)

## Links Dokumen

| | |
|---|---|
| PRD | [prd.md](../prd.md) |
| Implementation Plan | [plan.md](../plan.md) |
| Architecture | [docs/architecture.md](architecture.md) |
| Decisions | [docs/decisions.md](decisions.md) |
| Conventions | [docs/conventions.md](conventions.md) |
| Testing | [docs/testing.md](testing.md) |
| Changelog | [CHANGELOG.md](../CHANGELOG.md) |
