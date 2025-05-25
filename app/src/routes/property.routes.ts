import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import * as propertyController from "../controllers/property.controller";
import { imageStorage, propertyMediaStorage } from "../utils/storage.utils";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  imageStorage.single("thumbnail"),
  propertyController.createProperty,
);

router.get("/", isAuthenticated, propertyController.getProperties);

router.get("/:id", isAuthenticated, propertyController.getProperty);

router.patch(
  "/:id",
  isAuthenticated,
  imageStorage.single("thumbnail"),
  propertyController.updateProperty,
);

router.post(
  "/:id/media",
  isAuthenticated,
  propertyMediaStorage.array("media"),
  propertyController.addPropertyMedia,
);

router.get("/:id/media", isAuthenticated, propertyController.getPropertyMedia);

router.delete(
  "/:id/media/:mediaId",
  isAuthenticated,
  propertyController.deletePropertyMedia,
);

router.delete("/:id", isAuthenticated, propertyController.deleteProperty);

export default router;
