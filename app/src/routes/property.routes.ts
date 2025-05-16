import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import * as propertyController from "../controllers/property.controller";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidator.middleware";
import { createPropertyInputDTO } from "../dtos/property.dto";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  schemaValidatorMiddleware(
    createPropertyInputDTO.omit({ userId: true }).strict(),
  ),
  propertyController.createProperty,
);

router.get("/", isAuthenticated, propertyController.getProperties);

export default router;
