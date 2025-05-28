ALTER TABLE "property_view" DROP CONSTRAINT "property_view_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "property_view" ADD CONSTRAINT "property_view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;