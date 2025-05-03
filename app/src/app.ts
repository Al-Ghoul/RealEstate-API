import express from "express";
import path from "path";
import { env } from "process";
import swaggerJSDoc from "swagger-jsdoc";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = express();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "Express API with Swagger integration",
    },
  },
  apis: [
    path.resolve(
      __dirname,
      env.NODE_ENV === "development" ? "./routes/*.ts" : "./routes/*.js",
    ),
  ],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
const theme = new SwaggerTheme();
const options = {
  customCss:
    theme.getBuffer(SwaggerThemeNameEnum.DARK) +
    ".swagger-ui .topbar { display: none }",
  explorer: false,
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, options));

app.use(
  "/public",
  express.static(process.env.PUBLIC_PATH || path.join(__dirname, "../public/")),
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandlerMiddleware);
