CREATE TYPE "public"."property_media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "property_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"url" text NOT NULL,
	"type" "property_media_type" NOT NULL,
	"mime_type" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_view" DROP CONSTRAINT "property_view_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_view" ADD CONSTRAINT "property_view_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;