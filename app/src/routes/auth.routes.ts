import { Router } from "express";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidator.middleware";
import { createUserInputDTO } from "../dtos/user.dto";
import {
  loginUserInputDTO,
  loginWithFacebookDTO,
  loginWithGoogleDTO,
  refreshTokenInputDTO,
  requestResetCodeDTO,
  changePasswordInputDTO,
  passwordResetInputDTO,
  setPasswordInputDTO,
  codeInputDTO,
} from "../dtos/auth.dto";
import * as authController from "../controllers/auth.controller";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { linkAccountDTO } from "../dtos/account.dto";

const router = Router();

router.post(
  "/register",
  schemaValidatorMiddleware(createUserInputDTO),
  authController.registerUser,
);

router.post(
  "/login",
  schemaValidatorMiddleware(loginUserInputDTO),
  authController.loginUser,
);

router.post(
  "/refresh",
  schemaValidatorMiddleware(refreshTokenInputDTO),
  authController.refreshUserToken,
);

router.post("/me/logout", isAuthenticated, authController.logoutUser);

router.post(
  "/me/request-email-verification-code",
  isAuthenticated,
  authController.requestEmailVerificationCode,
);

router.post(
  "/me/verify",
  isAuthenticated,
  schemaValidatorMiddleware(codeInputDTO),
  authController.verifyUser,
);

router.post(
  "/request-password-reset",
  schemaValidatorMiddleware(requestResetCodeDTO),
  authController.requestPasswordReset,
);

router.post(
  "/password-reset",
  schemaValidatorMiddleware(passwordResetInputDTO),
  authController.resetUserPassword,
);

router.post(
  "/me/change-password",
  isAuthenticated,
  schemaValidatorMiddleware(changePasswordInputDTO),
  authController.changePassword,
);

router.post(
  "/me/set-password",
  isAuthenticated,
  schemaValidatorMiddleware(setPasswordInputDTO),
  authController.setPassword,
);

router.post(
  "/facebook",
  schemaValidatorMiddleware(loginWithFacebookDTO),
  authController.loginWithFacebook,
);

router.post(
  "/google",
  schemaValidatorMiddleware(loginWithGoogleDTO),
  authController.loginWithGoogle,
);

router.post(
  "/me/accounts/link",
  isAuthenticated,
  schemaValidatorMiddleware(linkAccountDTO),
  authController.linkAccount,
);

router.delete(
  "/me/accounts/unlink/:provider",
  isAuthenticated,
  authController.unlinkAccount,
);

router.get("/me/accounts", isAuthenticated, authController.getAccounts);

export default router;
