import { Router } from "express";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidatorMiddleware";
import { createUserDTO } from "../lib/dtos/users";
import * as authController from "../controllers/authController";

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

export default router;
