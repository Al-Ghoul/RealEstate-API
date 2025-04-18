import { Router } from "express";
import { isAuthenticated } from "../middlewares/authMiddleware";
import * as userController from "../controllers/userController";
import { upload } from "../lib/storage";

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

export default router;
