import { Router } from "express";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidatorMiddleware";
import { createUserDTO } from "../lib/dtos/user.dto";
import { loginUserDTO, refreshTokenInputDTO } from "../lib/dtos/auth.dto";
import * as authController from "../controllers/authController";
import { isAuthenticated } from "../middlewares/authMiddleware";
import {
  linkAccountDTO,
  loginWithFacebookDTO,
  loginWithGoogleDTO,
} from "../lib/dtos/account.dto";
import {
  changePasswordDTO,
  passwordResetDTO,
  setPasswordDTO,
} from "../lib/dtos/password.dto";
import { verifyUserDTO } from "../lib/dtos/verify.dto";
import { requestResetCodeDTO } from "../lib/dtos/reset.dto";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new user
 *     tags: [Auth]
 *     responses:
 *       400:
 *         description: Input validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       409:
 *         description: Email already used
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/GenericResponse'
 *       500:
 *         description: Internal server error or Unidentified database error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       201:
 *         description: User was created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GenericResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                      $ref: '#/components/schemas/User'
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
 *         description: Login was successful
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
 *         description: Input validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       403:
 *         description: This user is associated with a social login
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
  "/login",
  schemaValidatorMiddleware(loginUserDTO),
  authController.loginUser,
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh current user's tokens
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
 *         description: Tokens were refreshed successfully
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
 *         description: Input validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       401:
 *        description: Invalid refresh token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       403:
 *        description: Refresh token is blacklisted
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
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
 * /api/auth/me/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth | Me]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout was successful
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
 *        description: Token has been revoked or Invalid Token
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
router.post("/me/logout", isAuthenticated, authController.logoutUser);

/**
 * @swagger
 * /api/auth/me/request-email-verification-code:
 *   post:
 *     summary: Request verification code for current user
 *     tags: [Auth | Me]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *      200:
 *        description: Verification code was sent successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Input validation failed or verification code already sent
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
 *        description: Token has been revoked, Invalid Token or User does not have an email
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: User not found or already verified
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error or Verification code could not be sent
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/me/request-email-verification-code",
  isAuthenticated,
  authController.requestEmailVerificationCode,
);

/**
 * @swagger
 * /api/auth/me/verify:
 *   post:
 *     summary: Verify current user
 *     tags: [Auth | Me]
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
 *        description: User was verified successfully
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
 *        description: Token has been revoked or Invalid Token
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
  "/me/verify",
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
 *        description: Password reset code was sent successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      403:
 *        description: User does not have an email
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Input validation failed or Reset code already sent
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
 *               password:
 *                 type: string
 *                 example: 12345678
 *                 description: The new password
 *                 required: true
 *               confirmPassword:
 *                 type: string
 *                 example: 12345678
 *                 description: The confirmation of new password
 *                 required: true
 *     responses:
 *      200:
 *        description: Password was reset successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Input validation failed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: Reset code expired or invalid
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
 * /api/auth/me/change-password:
 *  post:
 *    summary: Change current user's password
 *    tags: [Auth | Me]
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
 *              password:
 *                type: string
 *                example: 12345678
 *                description: The new password
 *                required: true
 *              confirmPassword:
 *                type: string
 *                example: 12345678
 *                description: The confirmation of the new password
 *                required: true
 *    responses:
 *      200:
 *        description: Password was changed successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Input validation failed or Password is incorrect
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
 *        description: Token has been revoked, Invalid Token or User has no password
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: User was not found
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
  "/me/change-password",
  isAuthenticated,
  schemaValidatorMiddleware(changePasswordDTO),
  authController.changePassword,
);

/**
 * @swagger
 * /api/auth/me/set-password:
 *   post:
 *     summary: Set current user's password
 *     tags: [Auth | Me]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             password:
 *               type: string
 *               example: 12345678
 *               description: The new password
 *               required: true
 *             confirmPassword:
 *               type: string
 *               example: 12345678
 *               description: The confirmation new password
 *               required: true
 *     responses:
 *       200:
 *         description: Password was set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       400:
 *         description: Input validation failed
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
 *         description: Token has been revoked or Invalid Token
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
  "/me/set-password",
  isAuthenticated,
  schemaValidatorMiddleware(setPasswordDTO),
  authController.setPassword,
);

/**
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     summary: Login or Register with Facebook
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
 *         description: User has logged in successfully
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
 *         description: User was created and logged in successfully
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
 *        description: Input validation failed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       409:
 *        description: The associated email is already in use
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       500:
 *        description: Internal server error or Unidentified database error
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
 *     summary: Login or Register with Google
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
 *         description: User has logged in successfully
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
 *         description: User was created and logged in successfully
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
 *        description: Input validation failed
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       409:
 *        description: The associated email is already in use
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *       500:
 *        description: Internal server error or Unidentified database error
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
 * /api/auth/me/accounts/link:
 *   post:
 *     summary: Link an account to the current user
 *     tags: [Auth | Accounts]
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
 *      201:
 *        description: Account was linked successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Input validation failed or Account could not be linked
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
 *        description: Token has been revoked or Invalid Token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: User was not found
 *        content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/GenericResponse'
 *      409:
 *        description: The associated email is already in use
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      500:
 *        description: Internal server error or Unidentified database error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/me/accounts/link",
  isAuthenticated,
  schemaValidatorMiddleware(linkAccountDTO),
  authController.linkAccount,
);

/**
 * @swagger
 * /api/auth/me/accounts/unlink/{provider}:
 *   delete:
 *     summary: Unlink current user's selected provider's account
 *     tags: [Auth | Accounts]
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
 *        description: Account was unlinked successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      400:
 *        description: Input validation failed or User has no password
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
 *        description: Token has been revoked or Invalid Token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GenericResponse'
 *      404:
 *        description: User was not found or Account was not found
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
  "/me/accounts/unlink/:provider",
  isAuthenticated,
  authController.unlinkAccount,
);

/**
 * @swagger
 * /api/auth/me/accounts:
 *   get:
 *     summary: Get current user's accounts
 *     tags: [Auth | Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accounts were retrieved successfully
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
 *        description: Token has been revoked or Invalid Token
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
router.get("/me/accounts", isAuthenticated, authController.getAccounts);

export default router;
