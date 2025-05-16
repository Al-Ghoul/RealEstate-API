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
  PropertyQueryParams,
} from "../dtos/property.dto";

export async function createProperty(
  input: Omit<CreatePropertyInputDTO, "id">,
) {
  return db
    .insert(property)
    .values({
      ...input,
      location: sql`ST_SetSRID(ST_MakePoint(${input.location.x}, ${input.location.y}), 4326)`,
    })
    .returning();
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

  const propertiesQuery = async (filters: SQL[]) =>
    query.where(and(...filters)).limit(limit + 1);
  const results = await propertiesQuery(filters);
  return results;
}

export async function getTotalProperties() {
  return (await db.select({ count: count() }).from(property))[0].count;
}
