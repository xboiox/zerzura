import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const jobTypeEnum = pgEnum('job_type', ['REMOTE', 'ONSITE', 'HYBRID']);
export const jobStatusEnum = pgEnum('job_status', ['DRAFT', 'PUBLISHED', 'INACTIVE']);
export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE']);
export const applicationStatusEnum = pgEnum('application_status', [
  'PENDING',
  'REVIEWED',
  'INTERVIEWED',
  'ASSESSMENT',
  'OFFERING',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
]);

export const userProfileTable = pgTable('user_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 256 }).notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  fullName: varchar('full_name', { length: 100 }),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  gender: genderEnum('gender'),
  phone: varchar('phone', { length: 50 }),
  city: varchar('city', { length: 100 }),
  skills: text('skills').array(),
  facebookUrl: varchar('facebook_url', { length: 512 }),
  instagramUrl: varchar('instagram_url', { length: 512 }),
  linkedinUrl: varchar('linkedin_url', { length: 512 }),
  githubUrl: varchar('github_url', { length: 512 }),
  defaultCvUrl: varchar('default_cv_url', { length: 512 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const jobTable = pgTable('job', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description').notNull(),
  requirements: text('requirements').notNull(),
  jobType: jobTypeEnum('job_type').notNull(),
  location: varchar('location', { length: 256 }).notNull(),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  deadline: timestamp('deadline').notNull(),
  status: jobStatusEnum('status').notNull().default('DRAFT'),
  createdByClerkId: varchar('created_by_clerk_id', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const applicationTable = pgTable(
  'application',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobTable.id),
    applicantClerkId: varchar('applicant_clerk_id', { length: 256 }).notNull(),
    cvUrl: varchar('cv_url', { length: 512 }).notNull(),
    coverLetter: text('cover_letter').notNull(),
    status: applicationStatusEnum('status').notNull().default('PENDING'),
    applicantSeen: boolean('applicant_seen').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique('application_job_id_applicant_clerk_id_unique').on(t.jobId, t.applicantClerkId)],
);

export const applicationStatusLogTable = pgTable('application_status_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applicationTable.id),
  fromStatus: applicationStatusEnum('from_status').notNull(),
  toStatus: applicationStatusEnum('to_status').notNull(),
  reason: text('reason'),
  changedByClerkId: varchar('changed_by_clerk_id', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const companyProfileTable = pgTable('company_profile', {
  id: integer('id').primaryKey().default(1),
  name: varchar('name', { length: 256 }).notNull(),
  logoUrl: varchar('logo_url', { length: 512 }),
  description: text('description').notNull(),
  address: text('address').notNull(),
  email: varchar('email', { length: 256 }),
  phone: varchar('phone', { length: 50 }),
  linkedinUrl: varchar('linkedin_url', { length: 512 }),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  instagramUrl: varchar('instagram_url', { length: 512 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const aboutContentTable = pgTable('about_content', {
  id: integer('id').primaryKey().default(1),
  vision: text('vision').notNull(),
  mission: text('mission').notNull(),
  integrityTitle: varchar('integrity_title', { length: 256 }).notNull(),
  integrityDesc: text('integrity_desc').notNull(),
  excellenceTitle: varchar('excellence_title', { length: 256 }).notNull(),
  excellenceDesc: text('excellence_desc').notNull(),
  collaborationTitle: varchar('collaboration_title', { length: 256 }).notNull(),
  collaborationDesc: text('collaboration_desc').notNull(),
  office1Name: varchar('office1_name', { length: 256 }),
  office1Address: text('office1_address'),
  office1MapUrl: varchar('office1_map_url', { length: 1024 }),
  office2Name: varchar('office2_name', { length: 256 }),
  office2Address: text('office2_address'),
  office2MapUrl: varchar('office2_map_url', { length: 1024 }),
  office3Name: varchar('office3_name', { length: 256 }),
  office3Address: text('office3_address'),
  office3MapUrl: varchar('office3_map_url', { length: 1024 }),
  mapEmbedUrl: varchar('map_embed_url', { length: 1024 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const servicesContentTable = pgTable('services_content', {
  id: integer('id').primaryKey().default(1),
  heroSubtitle: varchar('hero_subtitle', { length: 512 }).notNull(),
  card1Title: varchar('card1_title', { length: 256 }).notNull(),
  card1Desc: text('card1_desc').notNull(),
  card2Title: varchar('card2_title', { length: 256 }).notNull(),
  card2Desc: text('card2_desc').notNull(),
  card3Title: varchar('card3_title', { length: 256 }).notNull(),
  card3Desc: text('card3_desc').notNull(),
  card4Title: varchar('card4_title', { length: 256 }).notNull(),
  card4Desc: text('card4_desc').notNull(),
  ctaTitle: varchar('cta_title', { length: 256 }).notNull(),
  ctaSubtitle: varchar('cta_subtitle', { length: 512 }).notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const clientLogoTable = pgTable('client_logo', {
  id: uuid('id').primaryKey().defaultRandom(),
  logoUrl: varchar('logo_url', { length: 512 }).notNull(),
  altText: varchar('alt_text', { length: 256 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const educationTable = pgTable('education', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 256 }).notNull(),
  institution: varchar('institution', { length: 200 }).notNull(),
  major: varchar('major', { length: 200 }).notNull(),
  graduationYear: integer('graduation_year').notNull(),
  gpa: varchar('gpa', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workExperienceTable = pgTable('work_experience', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 256 }).notNull(),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  position: varchar('position', { length: 200 }).notNull(),
  startMonth: integer('start_month').notNull(),
  startYear: integer('start_year').notNull(),
  endMonth: integer('end_month'),
  endYear: integer('end_year'),
  isCurrent: boolean('is_current').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const portfolioContentTable = pgTable('portfolio_content', {
  id: integer('id').primaryKey().default(1),
  heroSubtitle: varchar('hero_subtitle', { length: 512 }).notNull(),
  stat1Value: varchar('stat1_value', { length: 50 }).notNull(),
  stat1Label: varchar('stat1_label', { length: 256 }).notNull(),
  stat2Value: varchar('stat2_value', { length: 50 }).notNull(),
  stat2Label: varchar('stat2_label', { length: 256 }).notNull(),
  stat3Value: varchar('stat3_value', { length: 50 }).notNull(),
  stat3Label: varchar('stat3_label', { length: 256 }).notNull(),
  highlight1Title: varchar('highlight1_title', { length: 256 }).notNull(),
  highlight1Desc: text('highlight1_desc').notNull(),
  highlight2Title: varchar('highlight2_title', { length: 256 }).notNull(),
  highlight2Desc: text('highlight2_desc').notNull(),
  highlight3Title: varchar('highlight3_title', { length: 256 }).notNull(),
  highlight3Desc: text('highlight3_desc').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
