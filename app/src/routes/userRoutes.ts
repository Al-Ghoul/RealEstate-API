import { Router } from "express";
import { isAuthenticated } from "../middlewares/authMiddleware";
import * as userController from "../controllers/userController";
import { upload } from "../lib/storage";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidatorMiddleware";
import { updateUserDTO, updateUserProfileDTO } from "../lib/dtos/user.dto";

const router = Router();

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
 *                 required: true
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
 *         description: No image provided
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
 *         description: Token has been revoked or Invalid Token
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
  userController.updateProfileImage,
);

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
 *         description: Token has been revoked or Invalid Token
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
  userController.updateUser,
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
 *         description: Token has been revoked or Invalid Token
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
  userController.updateUserProfile,
);

export default router;
