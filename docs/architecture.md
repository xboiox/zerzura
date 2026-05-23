# Architecture — Job Portal

## System Overview

```
Browser
  │
  ├── Public Pages (SSR)        → Next.js Server Components → Drizzle → PostgreSQL
  ├── Clerk Auth (sign-in/up)   → Clerk hosted UI → session JWT
  ├── Protected Pages           → Middleware (role check + isActive) → Server Components
  └── Server Actions (mutations)→ Zod validation → Drizzle → PostgreSQL
                                                  └── Resend (email notifications)
                                                  └── Uploadthing (CV files)
                                                  └── Clerk API (admin invitations, email lookup)
```

---

## Folder Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (marketing)/              # Public: Navbar + Footer layout
│   │   │   ├── page.tsx              # /  → homepage
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx          # /jobs → listing
│   │   │   │   └── [id]/page.tsx     # /jobs/[id] → detail
│   │   │   └── layout.tsx
│   │   ├── (auth)/                   # ClerkProvider wrapper
│   │   │   ├── (center)/             # Centered card layout
│   │   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── dashboard/            # Pelamar protected area
│   │   │   │   ├── page.tsx          # Summary lamaran
│   │   │   │   ├── applications/page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── admin/                # Admin + Super Admin
│   │   │   │   ├── page.tsx
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── edit/page.tsx
│   │   │   │   │       └── applicants/page.tsx
│   │   │   │   ├── company/page.tsx  # SUPER_ADMIN only
│   │   │   │   ├── users/page.tsx    # SUPER_ADMIN only
│   │   │   │   └── layout.tsx        # Admin sidebar layout
│   │   │   └── layout.tsx
│   │   └── layout.tsx                # Root locale layout (NextIntlClientProvider)
│   ├── api/
│   │   ├── webhooks/clerk/route.ts   # Clerk webhook: assign role on user.created
│   │   └── uploadthing/route.ts      # Uploadthing file handler
│   └── global-error.tsx
│
├── models/
│   └── Schema.ts                     # All Drizzle table definitions (single file)
│
├── validations/                      # Zod schemas — shared client + server
│   ├── JobValidation.ts
│   ├── ApplicationValidation.ts
│   ├── ProfileValidation.ts
│   └── CompanyValidation.ts
│
├── actions/                          # Next.js Server Actions
│   ├── jobActions.ts
│   ├── applicationActions.ts
│   ├── profileActions.ts
│   ├── userActions.ts
│   └── companyActions.ts
│
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── forms/                        # ApplyForm, JobForm, ProfileForm
│   ├── jobs/                         # JobCard, JobFilters, JobDetail
│   ├── admin/                        # ApplicantTable, StatusUpdater
│   └── LocaleSwitcher.tsx            # Existing, keep
│
├── libs/                             # Library configurations
│   ├── DB.ts                         # Drizzle singleton (existing)
│   ├── Env.ts                        # T3 env validation (extend)
│   ├── Arcjet.ts                     # Rate limiting base (existing)
│   ├── Logger.ts                     # Logtape logger (existing)
│   ├── I18n.ts / I18nRouting.ts      # next-intl (existing)
│   └── Resend.ts                     # Email client
│
├── utils/
│   ├── AppConfig.ts                  # Update: locales → ['id', 'en'], default 'id'
│   └── Helpers.ts                    # Utility functions (existing)
│
├── locales/
│   ├── id.json                       # Indonesian (default) — rename from fr.json
│   └── en.json                       # English
│
└── middleware.ts                     # Clerk auth guard + role redirect + isActive check
```

---

## Database Schema

Lima tabel. Clerk mengelola user accounts; kita hanya menyimpan data aplikasi.

### UserProfile
Menyimpan data extra yang tidak ada di Clerk (profil pelamar, status aktif admin).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Primary key |
| clerkId | varchar | Unique. ID user dari Clerk |
| isActive | boolean | Default true. False = admin dinonaktifkan |
| phone | varchar? | Profil pelamar |
| city | varchar? | Profil pelamar |
| skills | text[] | Profil pelamar |
| defaultCvUrl | varchar? | URL CV default di Uploadthing |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Job
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Primary key |
| title | varchar | |
| description | text | |
| requirements | text | |
| jobType | enum | REMOTE, ONSITE, HYBRID |
| location | varchar | |
| salaryMin | integer? | |
| salaryMax | integer? | |
| deadline | timestamp | Expired = deadline < now() di query |
| status | enum | DRAFT, PUBLISHED, INACTIVE |
| createdByClerkId | varchar | FK → UserProfile.clerkId |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Application
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Primary key |
| jobId | uuid | FK → Job.id |
| applicantClerkId | varchar | FK → UserProfile.clerkId |
| cvUrl | varchar | Snapshot URL saat apply — tidak berubah |
| coverLetter | text | |
| status | enum | PENDING, REVIEWED, ACCEPTED, REJECTED |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**Constraint:** UNIQUE(jobId, applicantClerkId) — satu apply per lowongan per pelamar.

### ApplicationStatusLog
Audit trail setiap perubahan status. Reason nullable (hanya diisi untuk perubahan non-forward).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Primary key |
| applicationId | uuid | FK → Application.id |
| fromStatus | enum | Status sebelumnya |
| toStatus | enum | Status baru |
| reason | text? | Wajib untuk perubahan non-forward (lihat F-05) |
| changedByClerkId | varchar | Admin yang mengubah |
| createdAt | timestamp | |

### CompanyProfile
Singleton — selalu satu baris. Di-upsert, bukan insert.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | integer | Selalu 1 |
| name | varchar | |
| logoUrl | varchar? | |
| description | text | |
| address | text | |
| updatedAt | timestamp | |

---

## Auth Architecture (Clerk)

```
User access /admin/*
  │
  ├── middleware.ts
  │     ├── Clerk auth() → valid session?
  │     │     └── No → redirect /sign-in
  │     ├── auth().sessionClaims.metadata.role
  │     │     └── Not ADMIN/SUPER_ADMIN → redirect /
  │     └── db.query.userProfile (isActive)
  │           └── isActive = false → redirect /
  │
  └── Page renders with guaranteed valid + active admin session

Role assignment flow (admin invitation):
  Super Admin → /admin/users → inviteAdmin() Server Action
    → Clerk Invitation API (POST /invitations)
    → Clerk sends invitation email
    → New admin accepts → creates Clerk account
    → Clerk fires webhook user.created
    → /api/webhooks/clerk → set publicMetadata.role = "ADMIN"
    → Create UserProfile row in DB
```

---

## Data Flow Patterns

**Fetching data (read):**
```
Page (Server Component) → db.query.tableName.findMany() → render
```
No useEffect, no client-side fetch for page data.

**Mutations (write):**
```
Form → Server Action → Zod.parse() → db.insert/update → revalidatePath()
                    └── Error → return { success: false, error }
```

**Filter/search/pagination:**
```
URL search params → searchParams prop (Server Component) → Drizzle where clause
```
State lives in URL — shareable, back-button works, no useState needed.

**Optimistic UI:**
Used only for status update in admin applicant table (`useOptimistic`).
