import { Router } from "express";
import { isAuthenticated } from "../middlewares/authMiddleware";
import * as userController from "../controllers/userController";
import { upload } from "../lib/storage";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidatorMiddleware";
import { updateUserDTO, updateUserProfileDTO } from "../lib/dtos/user.dto";

const router = Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *      200:
 *        description: User was retrieved successfully
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
 *        description: Invalid, expired or revoked access token
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
router.get("/me", isAuthenticated, userController.getCurrentUser);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current user's data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       401:
 *         description: Missing authorization token
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       403:
 *         description: Invalid, expired or revoked access token
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 */
router.patch(
  "/me",
  isAuthenticated,
  schemaValidatorMiddleware(updateUserDTO),
  userController.updateCurrentUser,
);

/**
 * @swagger
 * /api/users/me/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *              allOf:
 *                - $ref: '#/components/schemas/GenericResponse'
 *                - type: object
 *              properties:
 *                data:
 *                  type: object
 *                  allOf:
 *                    - $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Missing authorization token
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       403:
 *         description: Invalid, expired or revoked access token
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 */
router.get(
  "/me/profile",
  isAuthenticated,
  userController.getCurrentUserProfile,
);

/**
 * @swagger
 * /api/users/me/profile:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User profile was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *              allOf:
 *                - $ref: '#/components/schemas/GenericResponse'
 *                - type: object
 *              properties:
 *                data:
 *                  type: object
 *                  allOf:
 *                    - $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Input validation failed
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       401:
 *         description: Missing authorization token
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       403:
 *         description: Invalid, expired or revoked access token
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 */
router.patch(
  "/me/profile",
  isAuthenticated,
  schemaValidatorMiddleware(updateUserProfileDTO),
  userController.updateCurrentUserProfile,
);

/**
 * @swagger
 * /api/users/me/profile/image:
 *   put:
 *     summary: Update current user profile's image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The profile image file
 *     responses:
 *       200:
 *         description: Profile image was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *              allOf:
 *                - $ref: '#/components/schemas/GenericResponse'
 *                - type: object
 *              properties:
 *                data:
 *                  type: object
 *                  properties:
 *                    blurHash:
 *                      type: string
 *       400:
 *         description: No image provided, Invalid mime type or Unable to upload image
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       401:
 *         description: Missing authorization token
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       403:
 *         description: Invalid, expired or revoked access token
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *          application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericResponse'
 */
router.put(
  "/me/profile/image",
  isAuthenticated,
  upload.single("image"),
  userController.updateCurrentUserProfileImage,
);

export default router;
