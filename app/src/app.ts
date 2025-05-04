import express from "express";
import { join, resolve } from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware";
import {
  assignLogId,
  errorLogger,
  accessLogger,
} from "./middlewares/morganLoggerMiddleware";
import { env } from "process";

export const app = express();

if (env.NODE_ENV === "development") {
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "RealEstate API",
        version: "1.0.0",
        description: "RealEstate API documentation",
      },
    },
    apis: [resolve(__dirname, "./routes/*.ts")],
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
}

app.use(errorLogger);
app.use(assignLogId);
app.use(accessLogger);

app.use("/public", express.static(join(process.cwd(), "public")));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandlerMiddleware);
