import { createInsertSchema } from "drizzle-zod";
import { property } from "../db/schemas/property.schema";
import { z } from "zod";

export const createPropertyDTO = createInsertSchema(property);

export type CreatePropertyDTO = z.infer<typeof createPropertyDTO>;
