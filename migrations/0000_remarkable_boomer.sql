CREATE TYPE "public"."application_status" AS ENUM('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('DRAFT', 'PUBLISHED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('REMOTE', 'ONSITE', 'HYBRID');--> statement-breakpoint
CREATE TABLE "application_status_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status" NOT NULL,
	"to_status" "application_status" NOT NULL,
	"reason" text,
	"changed_by_clerk_id" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"applicant_clerk_id" varchar(256) NOT NULL,
	"cv_url" varchar(512) NOT NULL,
	"cover_letter" text NOT NULL,
	"status" "application_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "application_job_id_applicant_clerk_id_unique" UNIQUE("job_id","applicant_clerk_id")
);
--> statement-breakpoint
CREATE TABLE "company_profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" varchar(256) NOT NULL,
	"logo_url" varchar(512),
	"description" text NOT NULL,
	"address" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"requirements" text NOT NULL,
	"job_type" "job_type" NOT NULL,
	"location" varchar(256) NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"deadline" timestamp NOT NULL,
	"status" "job_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by_clerk_id" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(256) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"phone" varchar(50),
	"city" varchar(100),
	"skills" text[],
	"default_cv_url" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "application_status_log" ADD CONSTRAINT "application_status_log_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE no action ON UPDATE no action;