CREATE TABLE "client_logo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logo_url" varchar(512) NOT NULL,
	"alt_text" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL
);
