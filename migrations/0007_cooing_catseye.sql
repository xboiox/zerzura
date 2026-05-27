ALTER TYPE "public"."application_status" ADD VALUE 'INTERVIEWED' BEFORE 'ACCEPTED';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'ASSESSMENT' BEFORE 'ACCEPTED';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'OFFERING' BEFORE 'ACCEPTED';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'WITHDRAWN';