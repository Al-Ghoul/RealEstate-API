ALTER TABLE "public"."property" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."property_status";--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('AVAILABLE', 'RENTED', 'SOLD');--> statement-breakpoint
ALTER TABLE "public"."property" ALTER COLUMN "status" SET DATA TYPE "public"."property_status" USING "status"::"public"."property_status";--> statement-breakpoint
ALTER TABLE "public"."property" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."property_type";--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('APARTMENT', 'HOUSE', 'LAND', 'COASTAL', 'COMMERCIAL');--> statement-breakpoint
ALTER TABLE "public"."property" ALTER COLUMN "type" SET DATA TYPE "public"."property_type" USING "type"::"public"."property_type";--> statement-breakpoint
ALTER TABLE "public"."property_media" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."property_media_type";--> statement-breakpoint
CREATE TYPE "public"."property_media_type" AS ENUM('IMAGE', 'VIDEO');--> statement-breakpoint
ALTER TABLE "public"."property_media" ALTER COLUMN "type" SET DATA TYPE "public"."property_media_type" USING "type"::"public"."property_media_type";--> statement-breakpoint
ALTER TABLE "public"."role" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."role_type";--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('AGENT', 'CLIENT', 'ADMIN');--> statement-breakpoint
ALTER TABLE "public"."role" ALTER COLUMN "name" SET DATA TYPE "public"."role_type" USING "name"::"public"."role_type";