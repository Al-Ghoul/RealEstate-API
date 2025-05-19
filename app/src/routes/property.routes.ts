import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import * as propertyController from "../controllers/property.controller";
import { upload } from "../utils/storage.utils";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  upload.single("thumbnail"),
  propertyController.createProperty,
);

router.get("/", isAuthenticated, propertyController.getProperties);

export default router;
