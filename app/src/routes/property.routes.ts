import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import * as propertyController from "../controllers/property.controller";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidator.middleware";
import { createPropertyDTO } from "../dtos/property.dto";

const router = Router();

/**
 * @swagger
 * /api/properties:
 *  post:
 *    summary: Create a new property
 *    tags: [Properties]
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: header
 *        name: Accept-Language
 *        schema:
 *         $ref: '#/components/parameters/Accept-Language'
 *    requestBody:
 *       required: true
 *       content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Property'
 *    responses:
 *     201:
 *       description: Property was created successfully
 *       content:
 *        application/json:
 *          schema:
 *            allOf:
 *              - $ref: '#/components/schemas/GenericResponse'
 *              - type: object
 *            properties:
 *             data:
 *               type: object
 *               allOf:
 *               - $ref: '#/components/schemas/Property'
 *     400:
 *       description: Input validation failed
 *       content:
 *        application/json:
 *         schema:
 *           $ref: '#/components/schemas/GenericResponse'
 *     401:
 *       description: Missing authorization token
 *       content:
 *        application/json:
 *         schema:
 *           $ref: '#/components/schemas/GenericResponse'
 *     403:
 *       description: Invalid, expired or revoked access token
 *       content:
 *        application/json:
 *         schema:
 *           $ref: '#/components/schemas/GenericResponse'
 *     500:
 *       description: Internal server error
 *       content:
 *        application/json:
 *         schema:
 *           $ref: '#/components/schemas/GenericResponse'
 */
router.post(
  "/",
  isAuthenticated,
  schemaValidatorMiddleware(createPropertyDTO.omit({ userId: true }).strict()),
  propertyController.createProperty,
);

export default router;
