CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TABLE "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(256) NOT NULL,
	"institution" varchar(200) NOT NULL,
	"major" varchar(200) NOT NULL,
	"graduation_year" integer NOT NULL,
	"gpa" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(256) NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"position" varchar(200) NOT NULL,
	"start_month" integer NOT NULL,
	"start_year" integer NOT NULL,
	"end_month" integer,
	"end_year" integer,
	"is_current" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "full_name" varchar(100);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "avatar_url" varchar(512);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "facebook_url" varchar(512);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "instagram_url" varchar(512);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "linkedin_url" varchar(512);--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "github_url" varchar(512);