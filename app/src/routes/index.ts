/**
 * @swagger
 * components:
 *  securitySchemes:
 *    bearerAuth: 
 *      type: http
 *      scheme: bearer
 *      bearerFormat: JWT
 */

/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      properties:
 *        firstName:
 *          type: string
 *        lastName:
 *           type: string
 *        email:
 *           type: string
 *        emailVerified:
 *          type: string
 *          format: date-time
 *          default: null
 *        createdAt:
 *           type: string
 *           format: date-time
 *        updatedAt:
 *          type: string
 *          format: date-time
 *    GenericResponse:
 *      type: object
 *      properties:
 *        status:
 *          type: string
 *          description: The status of the response
 *          required: true
 *          title: The status of the response
 *        statusCode:
 *          type: number
 *          description: The status code of the response
 *          required: true
 *          title: The status code of the response
 *        message:
 *          type: string
 *          description: The error message
 *          required: false
 *          title: The error message
 *        details:
 *          type: string
 *          description: The error details
 *          required: false
 *          title: The error details
 *        errors:
 *          required: false
 *          title: The error messages
 *          type: array
 *          items:
 *            type: object
 *            properties:
 *              path:
 *                type: string
 *                description: The path of the error
 *                required: true
 *                title: The path of the error
 *              message:
 *                type: string
 *                description: The error message
 *                required: true
 *                title: The error message
 */
