ALTER TABLE "property" ADD COLUMN "location" geometry(point) NOT NULL;--> statement-breakpoint
CREATE INDEX "search_index" ON "property" USING gin ((
          setweight(to_tsvector('english', "title"), 'A') ||
          setweight(to_tsvector('english', "description"), 'B')
      ));--> statement-breakpoint
CREATE INDEX "location_idx" ON "property" USING gist ("location");--> statement-breakpoint
CREATE INDEX "price_idx" ON "property" USING btree ("price");--> statement-breakpoint
ALTER TABLE "property" DROP COLUMN "latitude";--> statement-breakpoint
ALTER TABLE "property" DROP COLUMN "longitude";--> statement-breakpoint
ALTER TABLE "property" ADD CONSTRAINT "property_title_unique" UNIQUE("title");