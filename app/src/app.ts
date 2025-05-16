import express from "express";
import { join } from "path";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import { errorHandlerMiddleware } from "./middlewares/errorHandler.middleware";
import {
  assignLogId,
  errorLogger,
  accessLogger,
} from "./middlewares/morganLogger.middleware";
import { env } from "process";
import compression from "compression";
import responseTime from "response-time";
import createLocaleMiddleware from "express-locale";
import { loadAllLocales } from "./i18n/i18n-util.sync";
import propertyRoutes from "./routes/property.routes";
import { openApiDoc } from "./docs";

loadAllLocales();

export const app = express();

if (env.NODE_ENV !== "production") {
  const theme = new SwaggerTheme();
  const options = {
    customCss:
      theme.getBuffer(SwaggerThemeNameEnum.DARK) +
      ".swagger-ui .topbar { display: none }",
    explorer: false,
  };

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDoc, options));
  console.log("✅ Swagger docs available at http://localhost:3000/api-docs");
}

app.use(responseTime());

app.use(compression());

app.use(errorLogger);
app.use(assignLogId);
app.use(accessLogger);

app.use("/public", express.static(join(process.cwd(), "public")));

app.use(express.json());

app.use(
  createLocaleMiddleware({
    priority: ["accept-language", "cookie", "map", "default"],
    default: "en-US",
    map: {
      en: "en-US",
      ar: "ar-EG",
    },
    allowed: ["en", "ar", "en-US", "ar-EG"],
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);

app.use(errorHandlerMiddleware);
