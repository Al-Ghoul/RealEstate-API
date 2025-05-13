import { db } from "../db";
import { property } from "../db/schemas/property.schema";
import type { CreatePropertyDTO } from "../dtos/property.dto";

export async function createProperty(input: Omit<CreatePropertyDTO, "id">) {
  return db.insert(property).values(input).returning();
}
