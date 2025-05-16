import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import * as userController from "../controllers/user.controller";
import { upload } from "../utils/storage.utils";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidator.middleware";
import { updateUserDTO, updateUserProfileDTO } from "../dtos/user.dto";

const router = Router();

router.get("/me", isAuthenticated, userController.getCurrentUser);

router.patch(
  "/me",
  isAuthenticated,
  schemaValidatorMiddleware(updateUserDTO),
  userController.updateCurrentUser,
);

router.get(
  "/me/profile",
  isAuthenticated,
  userController.getCurrentUserProfile,
);

router.patch(
  "/me/profile",
  isAuthenticated,
  schemaValidatorMiddleware(updateUserProfileDTO),
  userController.updateCurrentUserProfile,
);

router.put(
  "/me/profile/image",
  isAuthenticated,
  upload.single("image"),
  userController.updateCurrentUserProfileImage,
);

export default router;
