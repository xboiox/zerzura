CREATE TABLE "about_content" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"vision" text NOT NULL,
	"mission" text NOT NULL,
	"integrity_title" varchar(256) NOT NULL,
	"integrity_desc" text NOT NULL,
	"excellence_title" varchar(256) NOT NULL,
	"excellence_desc" text NOT NULL,
	"collaboration_title" varchar(256) NOT NULL,
	"collaboration_desc" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_content" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"hero_subtitle" varchar(512) NOT NULL,
	"stat1_value" varchar(50) NOT NULL,
	"stat1_label" varchar(256) NOT NULL,
	"stat2_value" varchar(50) NOT NULL,
	"stat2_label" varchar(256) NOT NULL,
	"stat3_value" varchar(50) NOT NULL,
	"stat3_label" varchar(256) NOT NULL,
	"highlight1_title" varchar(256) NOT NULL,
	"highlight1_desc" text NOT NULL,
	"highlight2_title" varchar(256) NOT NULL,
	"highlight2_desc" text NOT NULL,
	"highlight3_title" varchar(256) NOT NULL,
	"highlight3_desc" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services_content" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"hero_subtitle" varchar(512) NOT NULL,
	"card1_title" varchar(256) NOT NULL,
	"card1_desc" text NOT NULL,
	"card2_title" varchar(256) NOT NULL,
	"card2_desc" text NOT NULL,
	"card3_title" varchar(256) NOT NULL,
	"card3_desc" text NOT NULL,
	"card4_title" varchar(256) NOT NULL,
	"card4_desc" text NOT NULL,
	"cta_title" varchar(256) NOT NULL,
	"cta_subtitle" varchar(512) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
