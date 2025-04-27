import { Router } from "express";
import { isAuthenticated } from "../middlewares/authMiddleware";
import * as userController from "../controllers/userController";
import { upload } from "../lib/storage";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidatorMiddleware";
import { updateUserDTO } from "../lib/dtos/user.dto";

const router = Router();

/**
 * @swagger
 * /api/users/me/profile-image:
 *   put:
 *     summary: Update profile image
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
 *         description: Profile image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 */
router.put(
  "/me/profile-image",
  isAuthenticated,
  upload.single("image"),
  userController.updateProfileImage,
);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update user
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
 *         description: User updated successfully
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
 *         description: Invalid or expired token
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

export default router;
