import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import fs from "fs";
import yaml from "yaml";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RealEstate API",
      version: "1.0.0",
      description: "RealEstate API documentation",
    },
  },
  apis: [path.resolve(__dirname, "./src/routes/*.ts")],
};

const openapiSpecification = swaggerJSDoc(swaggerOptions);

fs.writeFileSync("./openapi-spec.yaml", yaml.stringify(openapiSpecification));
