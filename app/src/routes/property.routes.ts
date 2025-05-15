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

/**
 * @swagger
 * /api/properties:
 *  get:
 *    summary: Get all properties
 *    tags: [Properties]
 *    parameters:
 *      - in: query
 *        name: limit
 *        schema:
 *          type: integer
 *        required: false
 *        description: Limit the number of properties returned
 *      - in: query
 *        name: searchTerm
 *        schema:
 *          type: string
 *        required: false
 *        description: Search properties by name or description
 *      - in: query
 *        name: minPrice
 *        schema:
 *          type: number
 *        required: false
 *        description: Filter properties by minimum price
 *      - in: query
 *        name: maxPrice
 *        schema:
 *          type: number
 *        required: false
 *        description: Filter properties by maximum price
 *      - in: query
 *        name: longitude
 *        schema:
 *          type: number
 *        required: false
 *        description: Filter properties by longitude
 *      - in: query
 *        name: latitude
 *        schema:
 *          type: number
 *        required: false
 *        description: Filter properties by latitude
 *      - in: query
 *        name: radius
 *        schema:
 *          type: number
 *        required: false
 *        description: Filter properties by radius
 *      - in: query
 *        name: sortBy
 *        schema:
 *          type: string
 *          enum: [price, created_at]
 *        required: false
 *        description: Sort properties by price or created_at
 *      - in: query
 *        name: order
 *        schema:
 *          type: string
 *          enum: [asc, desc]
 *        required: false
 *        description: Sort properties in ascending or descending order
 *      - in: query
 *        name: cursor
 *        schema:
 *          type: number
 *        required: false
 *        description: Cursor 'id', to query after a specific property
 *      - in: query
 *        name: cursorCreatedAt
 *        schema:
 *          type: string
 *          format: date-time
 *        required: false
 *        description: Cursor 'created_at', to query after a specific property
 *    responses:
 *      200:
 *        description: Properties were retrieved successfully
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
router.get("/", isAuthenticated, propertyController.getProperties);

export default router;
