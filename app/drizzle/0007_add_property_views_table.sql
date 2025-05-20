CREATE TABLE "property_view" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"property_id" integer,
	"viewed_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_view" ADD CONSTRAINT "property_view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_view" ADD CONSTRAINT "property_view_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;