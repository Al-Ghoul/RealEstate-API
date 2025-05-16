ALTER TABLE "user_role" DROP CONSTRAINT "user_role_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_role_id_role_id_fk";
--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;