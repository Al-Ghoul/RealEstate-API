CREATE TYPE "public"."property_status" AS ENUM('available', 'rented', 'sold');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'house', 'land', 'coastal', 'commercial');--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "type" "property_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "status" "property_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "area" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "rooms" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "thumbnail_url" text NOT NULL;