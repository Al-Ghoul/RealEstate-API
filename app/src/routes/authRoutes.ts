import { Router } from "express";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidatorMiddleware";
import { createUserDTO } from "../lib/dtos/users.dto";
import {
  changePasswordDTO,
  linkAccountDTO,
  loginUserDTO,
  loginWithFacebookDTO,
  loginWithGoogleDTO,
  passwordResetDTO,
  refreshTokenInputDTO,
  requestResetCodeDTO,
  setPasswordDTO,
  unlinkAccountDTO,
  verifyUserDTO,
} from "../lib/dtos/auth.dto";
import * as authController from "../controllers/authController";
import { isAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new user
 *     tags: [Auth]
 *     responses:
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       409:
 *         description: The user already exists
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/GenericResponse'
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       201:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GenericResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: 9YsD0@example.com
 *                 description: The email of the user
 *                 required: true
 *                 pattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
 *                 maxLength: 255
 *                 minLength: 2
 *                 title: The email of the user
 *               password:
 *                 type: string
 *                 example: password
 *                 description: The password of the user
 *                 required: true
 *                 pattern: ^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$
 *                 maxLength: 255
 *                 minLength: 8
 *                 title: The password of the user
 *               confirmPassword:
 *                 type: string
 *                 example: password
 *                 description: The password of the user
 *                 required: true
 *               firstName:
 *                 type: string
 *                 example: John
 *                 description: The first name of the user
 *                 pattern: ^[a-zA-Z]+$
 *                 maxLength: 255
 *                 minLength: 2
 *                 title: The first name of the user
 *               lastName:
 *                 type: string
 *                 example: Doe
 *                 description: The last name of the user
 *                 pattern: ^[a-zA-Z]+$
 *                 maxLength: 255
 *                 minLength: 2
 *                 title: The last name of the user
 */
router.post(
  "/register",
  schemaValidatorMiddleware(createUserDTO),
  authController.registerUser,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: 9YsD0@example.com
 *                 description: The email of the user
 *                 required: false
 *                 pattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
 *                 maxLength: 255
 *                 minLength: 2
 *                 title: The email of the user
 *               password:
 *                 type: string
 *                 example: password
 *                 description: The password of the user
 *                 required: true
 *                 pattern: ^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$
 *                 maxLength: 255
 *                 minLength: 8
 *                 title: The password of the user
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GenericResponse'
 *                 - type: object
 *               properties:
 *                data:
 *                 type: object
 *                 properties:
 *                  accessToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The token of the user
 *                  refreshToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The refresh token of the user
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/login",
  schemaValidatorMiddleware(loginUserDTO),
  authController.loginUser,
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh a user token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *     responses:
 *       200:
 *         description: Refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GenericResponse'
 *                 - type: object
 *               properties:
 *                data:
 *                 type: object
 *                 properties:
 *                  accessToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The token of the user
 *                  refreshToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The refresh token of the user
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/refresh",
  schemaValidatorMiddleware(refreshTokenInputDTO),
  authController.refreshUserToken,
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/GenericResponse'
 *       401:
 *         description: Missing authorization token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       403:
 *         description: Invalid or expired token
 *         content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post("/logout", isAuthenticated, authController.logoutUser);

/**
 * @swagger
 * /api/auth/request-email-verification-code:
 *   post:
 *     summary: Request verification code
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *      200:
 *        description: Verification code sent
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Bad request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      401:
 *        description: Missing authorization token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      403:
 *        description: Invalid or expired token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: User not found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/request-email-verification-code",
  isAuthenticated,
  authController.requestEmailVerificationCode,
);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify user
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: 123456
 *                 description: The verification code
 *                 required: true
 *     responses:
 *      200:
 *        description: User verified
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      401:
 *        description: Missing authorization token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      403:
 *        description: Invalid or expired token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: Invalid or expired verification code
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/verify",
  isAuthenticated,
  schemaValidatorMiddleware(verifyUserDTO),
  authController.verifyUser,
);

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request password reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 required: false
 *                 example: 6bVJt@example.com
 *                 description: The email of the user
 *     responses:
 *      200:
 *        description: Verification code sent
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Bad request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: User not found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/request-password-reset",
  schemaValidatorMiddleware(requestResetCodeDTO),
  authController.requestPasswordReset,
);

/**
 * @swagger
 * /api/auth/password-reset:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: 123456
 *                 description: The verification code
 *                 required: true
 *               newPassword:
 *                 type: string
 *                 example: 12345678
 *                 description: The new password
 *                 required: true
 *               confirmPassword:
 *                 type: string
 *                 example: 12345678
 *                 description: The new password
 *                 required: true
 *     responses:
 *      200:
 *        description: Password reset successful
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Bad request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: Invalid or expired reset code
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/password-reset",
  schemaValidatorMiddleware(passwordResetDTO),
  authController.resetUserPassword,
);

/**
 * @swagger
 * /api/auth/change-password:
 *  post:
 *    summary: Change user password
 *    tags: [Auth]
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              currentPassword:
 *                type: string
 *                example: 12345678
 *                description: The current password
 *                required: true
 *              newPassword:
 *                type: string
 *                example: 12345678
 *                description: The new password
 *                required: true
 *              confirmPassword:
 *                type: string
 *                example: 12345678
 *                description: The new password
 *                required: true
 *    responses:
 *      200:
 *        description: Password changed successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Current password is incorrect or passwords do not match
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      401:
 *        description: Missing authorization token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      403:
 *        description: Invalid or expired token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/change-password",
  isAuthenticated,
  schemaValidatorMiddleware(changePasswordDTO),
  authController.changePassword,
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *      200:
 *        description: Logged in user
 *        content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/GenericResponse'
 *               - type: object
 *             properties:
 *              data:
 *                type: object
 *                allOf:
 *                - $ref: '#/components/schemas/User'
 *                properties:
 *                  hasPassword:
 *                    type: boolean
 *                    example: true
 *                    description: Whether the user has a password
 *      401:
 *        description: Missing authorization header
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      403:
 *        description: Invalid authorization header
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.get("/me", isAuthenticated, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     summary: Login with Facebook
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GenericResponse'
 *                 - type: object
 *               properties:
 *                data:
 *                 type: object
 *                 properties:
 *                  accessToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The token of the user
 *                  refreshToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The refresh token of the user
 *       201:
 *         description: User created and logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GenericResponse'
 *                 - type: object
 *               properties:
 *                data:
 *                 type: object
 *                 properties:
 *                  accessToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The token of the user
 *                  refreshToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The refresh token of the user
 *       400:
 *        description: Bad request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       409:
 *        description: The associated email already exists
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/facebook",
  schemaValidatorMiddleware(loginWithFacebookDTO),
  authController.loginWithFacebook,
);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Login with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GenericResponse'
 *                 - type: object
 *               properties:
 *                data:
 *                 type: object
 *                 properties:
 *                  accessToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The token of the user
 *                  refreshToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The refresh token of the user
 *       201:
 *         description: User created and logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GenericResponse'
 *                 - type: object
 *               properties:
 *                data:
 *                 type: object
 *                 properties:
 *                  accessToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The token of the user
 *                  refreshToken:
 *                    type: string
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                    description: The refresh token of the user
 *       400:
 *        description: Bad request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       409:
 *        description: The associated email already exists
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/google",
  schemaValidatorMiddleware(loginWithGoogleDTO),
  authController.loginWithGoogle,
);

/**
 * @swagger
 * /api/auth/accounts/link:
 *   post:
 *     summary: Link user account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: The access token of the account to link
 *                 required: true
 *               provider:
 *                 type: string
 *                 description: The provider of the account to link
 *                 required: true
 *                 enum: [google, facebook]
 *     responses:
 *      200:
 *        description: User account linked
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Bad request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      401:
 *        description: Missing authorization token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      403:
 *        description: Invalid or expired token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      409:
 *        description: The associated email or provider already exists
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/accounts/link",
  isAuthenticated,
  schemaValidatorMiddleware(linkAccountDTO),
  authController.linkAccount,
);

/**
 * @swagger
 * /api/auth/accounts/unlink:
 *   delete:
 *     summary: Unlink user account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: provider
 *        schema:
 *          type: string
 *          enum: [google, facebook]
 *        required: true
 *     responses:
 *      200:
 *        description: User account unlinked
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Bad request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      401:
 *        description: Missing authorization token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      403:
 *        description: Invalid or expired token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.delete(
  "/accounts/unlink/:provider",
  isAuthenticated,
  authController.unlinkAccount,
);

/**
 * @swagger
 * /api/auth/set-password:
 *   post:
 *     summary: Set user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             newPassword:
 *               type: string
 *               example: 12345678
 *               description: The new password of the user
 *               required: true
 *             confirmPassword:
 *               type: string
 *               example: 12345678
 *               description: The new password of the user
 *               required: true
 *     responses:
 *       200:
 *         description: Password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       401:
 *         description: Missing authorization token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       403:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       500:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/set-password",
  isAuthenticated,
  schemaValidatorMiddleware(setPasswordDTO),
  authController.setPassword,
);

/**
 * @swagger
 * /api/auth/accounts:
 *   get:
 *     summary: Get user accounts
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User accounts retrieved successfully
 *         content:
 *           application/json:
 *            schema:
 *              allOf:
 *                - $ref: '#/components/schemas/GenericResponse'
 *                - type: object
 *                  properties:
 *                    data:
 *                      type: array
 *                      items:
 *                        type: object
 *                        $ref: '#/components/schemas/Account'
 *       401:
 *        description: Missing authorization token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       403:
 *        description: Invalid or expired token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.get("/accounts", isAuthenticated, authController.getAccounts);

export default router;
