import { Router } from "express";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidatorMiddleware";
import { createUserDTO } from "../lib/dtos/users.dto";
import {
  loginUserDTO,
  refreshTokenInputDTO,
  requestResetCodeDTO,
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
 *
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
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                   description: The token of the user
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzkwMjJ9
 *                   description: The refresh token of the user
 *                 expiresAt:
 *                   type: string
 *                   format: date
 *                   example: 2023-01-01T00:00:00.000Z
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
router.post(
  "/logout",
  isAuthenticated,
  authController.logoutUser,
);

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
 *        description: Verification code not found
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
export default router;
