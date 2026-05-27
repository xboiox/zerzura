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
                                                  └── Clerk API (admin lookup, email)
```

---

## Folder Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                # Root — ClerkProvider + NextIntlClientProvider
│   │   ├── (marketing)/              # Public: Navbar + Footer layout
│   │   │   ├── page.tsx              # / → homepage (company profile + 6 recent jobs)
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx          # /jobs → listing (search + filter + pagination)
│   │   │   │   └── [id]/page.tsx     # /jobs/[id] → detail + ApplyForm (authenticated)
│   │   │   ├── services/page.tsx     # /services → konten dari DB
│   │   │   ├── portfolio/page.tsx    # /portfolio → konten dari DB
│   │   │   ├── about/page.tsx        # /about → konten dari DB
│   │   │   └── layout.tsx            # Navbar: logo, links, sign-out (if logged in)
│   │   ├── (auth)/
│   │   │   ├── layout.tsx            # Thin wrapper — setRequestLocale only
│   │   │   ├── (center)/             # Centered card layout untuk sign-in/up
│   │   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── dashboard/            # Pelamar area (auth guard di middleware)
│   │   │   │   ├── page.tsx          # Stat cards + tabel lamaran + history + pagination
│   │   │   │   ├── user-profile/[[...user-profile]]/page.tsx  # ProfileForm + Clerk UserProfile
│   │   │   │   └── layout.tsx        # Sidebar: Dashboard (+ badge notif), My Profile, Browse Jobs
│   │   │   └── admin/                # Admin + Super Admin area
│   │   │       ├── page.tsx          # Dashboard: statistik job
│   │   │       ├── jobs/
│   │   │       │   ├── page.tsx      # Tabel jobs + filter + search + pagination
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── edit/page.tsx
│   │   │       │       └── applicants/
│   │   │       │           ├── page.tsx              # Tabel pelamar + status update + cover letter
│   │   │       │           └── [applicationId]/page.tsx  # Profil lengkap pelamar + history
│   │   │       ├── company/page.tsx
│   │   │       ├── pages/
│   │   │       │   ├── about/page.tsx
│   │   │       │   ├── services/page.tsx
│   │   │       │   └── portfolio/page.tsx
│   │   │       └── layout.tsx        # Admin sidebar
│   ├── api/
│   │   ├── webhooks/clerk/route.ts   # user.created → insert UserProfile
│   │   └── uploadthing/route.ts      # CV file upload handler
│   └── global-error.tsx
│
├── models/
│   └── Schema.ts                     # All Drizzle table definitions (single file)
│
├── validations/                      # Zod schemas — shared client + server
│   ├── JobValidation.ts
│   ├── ApplicationValidation.ts
│   ├── CompanyValidation.ts
│   └── PageContentValidation.ts
│
├── actions/                          # Next.js Server Actions ('use server')
│   ├── jobActions.ts                 # createJob, updateJob, updateJobStatus
│   ├── applicationActions.ts        # applyToJob, updateApplicationStatus, markApplicationsSeen, cancelApplication
│   ├── userProfileActions.ts        # saveUserProfile
│   ├── companyActions.ts            # updateCompanyProfile
│   └── pageActions.ts               # updateAboutContent, updateServicesContent, updatePortfolioContent
│
├── components/
│   ├── ui/                           # shadcn/ui primitives (Button, Badge, Input, etc.)
│   ├── forms/
│   │   ├── ApplyForm.tsx             # CV upload (Uploadthing) + cover letter
│   │   └── ProfileForm.tsx           # Form profil pelamar (telepon, kota, skills)
│   ├── jobs/
│   │   └── JobCard.tsx               # Card lowongan (badge tipe, lokasi, gaji, deadline)
│   ├── about/
│   │   └── OfficeMapSelector.tsx     # Kartu kantor clickable + iframe Google Maps (client)
│   ├── marketing/
│   │   └── LogoMarquee.tsx           # Infinite scroll marquee logo klien (server component)
│   ├── admin/
│   │   ├── AdminNav.tsx              # Sidebar navigation links
│   │   ├── JobForm.tsx               # Form buat/edit lowongan
│   │   ├── ActionButton.tsx          # Generic action button
│   │   ├── ClientLogoForm.tsx        # Form tambah logo klien (URL + nama opsional)
│   │   ├── ConfirmPublishButton.tsx  # Tombol publish dengan inline confirm
│   │   ├── StatusUpdateForm.tsx      # Dropdown update status lamaran pelamar
│   │   ├── CoverLetterToggle.tsx     # Toggle tampil/sembunyikan cover letter
│   │   └── ToastFromUrl.tsx          # Baca ?toast=KEY dari URL, tampilkan toast
│   ├── dashboard/
│   │   ├── CancelApplicationButton.tsx  # Batalkan lamaran dengan inline confirm
│   │   └── MarkApplicationsSeen.tsx     # Client component — mark notif seen on mount
│   └── LocaleSwitcher.tsx
│
├── libs/                             # Library configurations
│   ├── DB.ts                         # Drizzle singleton
│   ├── Env.ts                        # T3 env validation
│   ├── Arcjet.ts                     # Rate limiting base
│   ├── Logger.ts                     # Logtape logger
│   ├── I18n.ts / I18nRouting.ts      # next-intl
│   ├── Resend.ts                     # Resend email client
│   └── Uploadthing.ts + UploadthingClient.ts  # Uploadthing router + client hook
│
├── locales/
│   ├── id.json                       # Indonesian (default)
│   └── en.json                       # English
│
└── proxy.ts                          # Clerk middleware + auth guard + role redirect + Arcjet bot detection
```

---

## Database Schema

9 tabel. Clerk mengelola user accounts; kita hanya menyimpan data aplikasi.

### UserProfile
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Primary key |
| clerkId | varchar | Unique. ID user dari Clerk |
| isActive | boolean | Default true. False = admin dinonaktifkan |
| phone | varchar? | Profil pelamar |
| city | varchar? | Profil pelamar |
| skills | text[] | Profil pelamar |
| defaultCvUrl | varchar? | URL CV default (reserved, belum digunakan) |
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
| deadline | timestamp | Expired = `deadline < now()` di query |
| status | enum | DRAFT, PUBLISHED, INACTIVE |
| createdByClerkId | varchar | |
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
| applicantSeen | boolean | Default true. Set ke false saat admin update status. Badge notifikasi di sidebar pelamar. |
| createdAt | timestamp | |
| updatedAt | timestamp | Update saat status berubah |

**Constraint:** `UNIQUE(jobId, applicantClerkId)` — satu apply per lowongan per pelamar.

### ApplicationStatusLog
Audit trail setiap perubahan status. Diisi oleh `updateApplicationStatus` action.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Primary key |
| applicationId | uuid | FK → Application.id |
| fromStatus | enum | Status sebelumnya |
| toStatus | enum | Status baru |
| reason | text? | Opsional |
| changedByClerkId | varchar | Admin yang mengubah |
| createdAt | timestamp | |

### CompanyProfile
Singleton (`id = 1`). Kolom: `name`, `logoUrl?`, `description`, `address`, `email?`, `phone?`, `linkedinUrl?`, `whatsappNumber?`, `instagramUrl?`, `updatedAt`.

### AboutContent
Singleton (`id = 1`). Visi, misi, 3 nilai, dan hingga 3 kantor masing-masing dengan `name`, `address`, `mapUrl?`, plus `mapEmbedUrl?` sebagai fallback global.

### ServicesContent / PortfolioContent
Singleton (`id = 1`). Di-upsert, bukan insert.

### ClientLogo
Bukan singleton — bisa unlimited rows. Kolom: `id uuid`, `logoUrl varchar(512)`, `altText varchar(256)?`, `createdAt timestamp`. Di-manage via `/admin/pages/portfolio`.

---

## Auth Architecture (Clerk)

```
Semua request → proxy.ts → clerkMiddleware() (selalu berjalan)
  │
  ├── Route publik (/jobs, /, /jobs/[id], /services, /portfolio, /about, dll.)
  │     └── handleI18nRouting() → Page renders
  │           auth() tersedia tapi nullable — digunakan untuk:
  │             • Navbar: tampil "Dashboard" / "Sign out" atau "Masuk/Daftar"
  │             • /jobs/[id]: ApplyForm vs "Masuk untuk Melamar"
  │             • /jobs/[id]: cek apakah sudah apply
  │
  └── Protected route (/admin/*, /dashboard/*)
        ├── auth.protect() → No session? → redirect /sign-in
        ├── sessionClaims.metadata.role + isActive dari JWT
        │     ├── isActive = false → redirect /
        │     ├── /admin/* + bukan ADMIN/SUPER_ADMIN → redirect /
        │     └── /dashboard/* + isAdminRole → redirect /admin
        └── Page renders (session dijamin valid + aktif)

Role assignment (admin invitation):
  Super Admin → /admin/users → inviteAdmin() [belum selesai]
    → Clerk Invitation API → Clerk sends invitation email
    → New admin accepts → Clerk fires webhook user.created
    → /api/webhooks/clerk → set publicMetadata.role = "ADMIN" + create UserProfile
```

**Penting:** ClerkProvider ada di `src/app/[locale]/layout.tsx` (root layout), bukan di `(auth)/layout.tsx`. Ini diperlukan agar `SignOutButton` dan komponen Clerk lain bisa digunakan di semua halaman termasuk halaman marketing.

---

## Data Flow Patterns

**Fetching data (read):**
```
Page (Server Component) → db.query.tableName.findMany() → render
```
Tidak ada `useEffect`, tidak ada client-side fetch untuk page data.

**Mutations (write):**
```
Form/Button → Server Action → Zod.parse() → db.insert/update → revalidatePath()
                           └── Auth check: auth() → userId required
                           └── Role check: publicMetadata.role untuk admin actions
```

**Filter/search/pagination:**
```
URL search params → searchParams prop (Server Component) → Drizzle where clause
```
State hidup di URL — shareable, back-button berfungsi, tidak perlu `useState`.

**Notifikasi in-app (applicantSeen):**
```
Admin updateApplicationStatus → set applicantSeen = false → kirim email ke pelamar
  ↓
DashboardLayout (server) → query count applicantSeen = false → badge di sidebar
  ↓
DashboardPage loads → MarkApplicationsSeen (client component) → useEffect fires
  → markApplicationsSeen() action → set applicantSeen = true
  ↓
Next navigation → layout re-render → badge hilang
```

**Email notification flow:**
```
applyToJob → getAdminEmails (Clerk API) → resend.emails.send (ke semua admin)
updateApplicationStatus → getUser (Clerk API) → resend.emails.send (ke pelamar)
```
Kedua email dibungkus try-catch — kegagalan kirim email tidak menggagalkan operasi utama.
