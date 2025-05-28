import {
  sql,
  and,
  gte,
  lte,
  SQL,
  desc,
  gt,
  lt,
  count,
  or,
  eq,
} from "drizzle-orm";
import { db } from "../db";
import { property } from "../db/schemas/property.schema";
import type {
  CreatePropertyInputDTO,
  CreatePropertyMediaInputDTO,
  PropertyQueryParams,
} from "../dtos/property.dto";
import { first } from "lodash-es";
import { propertyView } from "../db/schemas/propertyView.schema";
import { propertyMedia } from "../db/schemas/propertyMedia.schema";

export async function createProperty(
  input: CreatePropertyInputDTO & {
    userId: User["id"];
    thumbnailURL: Property["thumbnailURL"];
  },
) {
  return first(
    await db
      .insert(property)
      .values({
        ...input,
        location: sql`ST_SetSRID(ST_MakePoint(${input.location.x}, ${input.location.y}), 4326)`,
      })
      .returning(),
  );
}

export async function getProperties(input: PropertyQueryParams) {
  const {
    searchTerm,
    minPrice,
    maxPrice,
    longitude,
    latitude,
    radius,
    sortBy,
    order,
    limit,
    cursor,
    cursorCreatedAt,
    area,
    type,
    rooms,
    status,
  } = input;
  let query = db.select().from(property);

  const filters: SQL[] = [];

  if (searchTerm) {
    filters.push(
      sql`(
      setweight(to_tsvector('english', ${property.title}), 'A') ||
      setweight(to_tsvector('english', ${property.description}), 'B')
      @@ plainto_tsquery('english', ${searchTerm})
    )`,
    );
  }

  if (minPrice !== undefined && maxPrice !== undefined)
    filters.push(
      // @ts-ignore
      and(gte(property.price, minPrice), lte(property.price, maxPrice)),
    );

  if (
    longitude !== undefined &&
    latitude !== undefined &&
    radius !== undefined
  ) {
    filters.push(
      sql`ST_DWithin(
        location::geography, 
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude})::geography, 4326), 
        ${radius * 1000}
    )`,
    );
  }

  if (
    sortBy === "price" ||
    (minPrice !== undefined && maxPrice !== undefined)
  ) {
    // @ts-ignore
    query = query.orderBy(
      order === "asc" ? property.price : desc(property.price),
    );
  } else {
    // @ts-ignore
    query = query.orderBy(
      order === "asc" ? property.createdAt : desc(property.createdAt),
    );
  }

  if (cursor > 0 && cursorCreatedAt !== undefined) {
    filters.push(
      // @ts-ignore
      order === "asc"
        ? or(
            gt(property.createdAt, cursorCreatedAt),
            and(
              eq(property.createdAt, cursorCreatedAt),
              gt(property.id, cursor),
            ),
          )
        : or(
            lt(property.createdAt, cursorCreatedAt),
            and(
              eq(property.createdAt, cursorCreatedAt),
              lt(property.id, cursor),
            ),
          ),
    );
  }

  if (area !== undefined) filters.push(eq(property.area, area));

  if (type !== undefined) filters.push(eq(property.type, type));

  if (rooms !== undefined) filters.push(eq(property.rooms, rooms));

  if (status !== undefined) filters.push(eq(property.status, status));

  filters.push(eq(property.isPublished, true));

  const propertiesQuery = async (filters: SQL[]) =>
    query.where(and(...filters)).limit(limit + 1);
  const results = await propertiesQuery(filters);
  return results;
}

export async function getTotalProperties() {
  return (await db.select({ count: count() }).from(property))[0].count;
}

export async function getPropertyById(id: Property["id"]) {
  return first(await db.select().from(property).where(eq(property.id, id)));
}

export async function updatePropertyById(
  input: CreatePropertyInputDTO & {
    id: Property["id"];
    userId: User["id"];
    thumbnailURL?: Property["thumbnailURL"];
  },
) {
  return first(
    await db
      .update(property)
      .set({
        ...input,
        location: sql`ST_SetSRID(ST_MakePoint(${input.location.x}, ${input.location.y}), 4326)`,
      })
      .where(and(eq(property.id, input.id), eq(property.userId, input.userId)))
      .returning(),
  );
}

export async function addNewView(
  propertyId: Property["id"],
  userId: User["id"],
) {
  return first(
    await db.insert(propertyView).values({ propertyId, userId }).returning(),
  );
}

export async function addPropertyMedia(input: CreatePropertyMediaInputDTO[]) {
  return await db.insert(propertyMedia).values(input).returning();
}

export async function getPropertyMedia(propertyId: Property["id"]) {
  return await db
    .select()
    .from(propertyMedia)
    .where(eq(propertyMedia.propertyId, propertyId));
}

export async function deletePropertyMedia(
  propertyId: Property["id"],
  mediaId: PropertyMedia["id"],
) {
  return await db
    .delete(propertyMedia)
    .where(
      and(
        eq(propertyMedia.propertyId, propertyId),
        eq(propertyMedia.id, mediaId),
      ),
    )
    .returning();
}

export async function getMediaCount(propertyId: Property["id"]) {
  return (
    await db
      .select({ count: count() })
      .from(propertyMedia)
      .where(eq(propertyMedia.propertyId, propertyId))
  )[0].count;
}

export async function deletePropertyById(
  propertyId: Property["id"],
  userId: User["id"],
) {
  return first(
    await db
      .delete(property)
      .where(and(eq(property.id, propertyId), eq(property.userId, userId)))
      .returning(),
  );
}
