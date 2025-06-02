import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "../utils/swagger.utils";
import { env } from "../config/env.config";
import "./auth.docs";
import "./user.docs";
import "./property.docs";
import "./chat.docs";

const generator = new OpenApiGeneratorV3(registry.definitions);
export const openApiDoc = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "RealEstate API",
    version: "1.0.0",
    description: "RealEstate API documentation",
  },
  servers: [{ url: `http://localhost:${env.PORT.toString()}` }],
});
