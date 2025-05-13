/**
 * @swagger
 * components:
 *  securitySchemes:
 *    bearerAuth:
 *      type: http
 *      scheme: bearer
 *      bearerFormat: JWT
 *  parameters:
 *    Accept-Language:
 *      type: string
 *      enum: [en, ar, en-US, ar-EG]
 *      description: The language of the request
 */

/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          readOnly: true
 *          format: uuid
 *          description: The user ID
 *        email:
 *           type: string
 *        emailVerified:
 *          readOnly: true
 *          type: string
 *          format: date-time
 *          default: null
 *        createdAt:
 *           readOnly: true
 *           type: string
 *           format: date-time
 *        updatedAt:
 *          readOnly: true
 *          type: string
 *          format: date-time
 *    Profile:
 *      type: object
 *      properties:
 *        firstName:
 *         type: string
 *         description: The first name of the user
 *        lastName:
 *          type: string
 *          description: The last name of the user
 *        bio:
 *          type: string
 *          description: The bio of the user
 *        image:
 *          type: string
 *          description: The image URI of the user
 *        imageBlurHash:
 *          type: string
 *          description: The image's blur hash
 *        createdAt:
 *           readOnly: true
 *           type: string
 *           format: date-time
 *        updatedAt:
 *          readOnly: true
 *          type: string
 *          format: date-time
 *    GenericResponse:
 *      type: object
 *      properties:
 *        status:
 *          type: string
 *          description: The status of the response
 *          title: The status of the response
 *        statusCode:
 *          type: number
 *          description: The status code of the response
 *          title: The status code of the response
 *        message:
 *          type: string
 *          description: The error message
 *          title: The error message
 *        details:
 *          type: string
 *          description: The error details
 *          title: The error details
 *        errors:
 *          title: The error messages
 *          type: array
 *          items:
 *            type: object
 *            properties:
 *              path:
 *                type: string
 *                description: The path of the error
 *                title: The path of the error
 *              message:
 *                type: string
 *                description: The error message
 *                title: The error message
 *    Account:
 *      type: object
 *      properties:
 *        userId:
 *          type: string
 *          description: The id of the user
 *          title: The id of the user
 *        provider:
 *          type: string
 *          enum: [google, facebook]
 *          description: The provider of the account
 *          title: The provider of the account
 *        providerAccountId:
 *          type: string
 *          description: The id of the account
 *          title: The id of the account
 *    Property:
 *      type: object
 *      properties:
 *        id:
 *          type: number
 *          readOnly: true
 *          description: The property ID
 *        title:
 *          type: string
 *          description: The title of the property
 *        description:
 *          type: string
 *          description: The description of the property
 *        price:
 *          type: number
 *          description: The price of the property
 *        latitude:
 *          type: number
 *          description: The latitude of the property
 *        longitude:
 *          type: number
 *          description: The longitude of the property
 */
