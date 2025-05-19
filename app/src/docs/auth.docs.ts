import {
  codeInputDTO,
  loginUserInputDTO,
  loginWithFacebookDTO,
  loginWithGoogleDTO,
  refreshTokenInputDTO,
  changePasswordInputDTO,
  passwordResetInputDTO,
  setPasswordInputDTO,
} from "../dtos/auth.dto";
import L from "../i18n/i18n-node";
import { registry } from "../utils/swagger.utils";
import {
  acceptLanguageHeader,
  baseSuccessResponseSchema,
  createSuccessResponseSchema,
  GenericResponseSchema,
  ValidationErrorResponseSchema,
} from "../dtos";
import { z } from "zod";
import { baseUserDTO, createUserInputDTO } from "../dtos/user.dto";
import {
  accountSchema,
  linkAccountDTO,
  unlinkAccountInputDTO,
} from "../dtos/account.dto";

const lang = "en";

export const bearerAuth = registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
);

registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  tags: ["Auth"],
  description: "Create a new user",
  summary: "Create a new user",
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: createUserInputDTO,
        },
      },
    },
  },
  responses: {
    201: {
      description: L[lang].REIGSTER_SUCCESS(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            baseUserDTO.omit({ password: true }),
          ),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    409: {
      description: L[lang].EMAIL_ALREADY_USED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  description: "Login a user",
  summary: "Login a user",
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: loginUserInputDTO,
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].LOGIN_SUCCESS(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({
              accessToken: z.string().jwt(),
              refreshToken: z.string().jwt(),
            }),
          ),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].INVALID_CREDENTIALS(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: L[lang].USER_CAN_ONLY_LOGIN_WITH_LINKED_ACCOUNT(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/refresh",
  tags: ["Auth"],
  description: "Refresh user's tokens",
  summary: "Refresh user's tokens",
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: refreshTokenInputDTO,
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].TOKENS_REFRESHED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
            }),
          ),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].INVALID_REFRESH_TOKEN(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: L[lang].REVOKED_ACCESS_TOKEN(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/request-password-reset",
  tags: ["Auth"],
  description: "Request password reset code",
  summary: "Request password reset code",
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: baseUserDTO.pick({ email: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].PASSWORD_RESET_CODE_SENT_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    400: {
      description: `${L[lang].INPUT_VALIDATION_ERROR()}, ${L[
        lang
      ].USER_DOES_NOT_HAVE_AN_EMAIL()} or ${L[
        lang
      ].PASSWORD_RESET_CODE_ALREADY_SENT()}`,
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    503: {
      description: L[lang].PASSWORD_RESET_CODE_COULD_NOT_BE_SENT(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/password-reset",
  tags: ["Auth"],
  description: "Reset user password",
  summary: "Reset user password",
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: passwordResetInputDTO,
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].PASSWORD_RESET_CODE_SENT_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    400: {
      description: L[lang].INVALID_OR_EXPIRED_PASSWORD_RESET_CODE(),
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/facebook",
  tags: ["Auth"],
  description: "Login or register user with Facebook",
  summary: "Login or register user with Facebook",
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: loginWithFacebookDTO,
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].LOGIN_SUCCESS(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
            }),
          ),
        },
      },
    },
    201: {
      description: L[lang].USER_CREATED_AND_LOGGED_IN_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
            }),
          ),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    409: {
      description: L[lang].EMAIL_ALREADY_USED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/google",
  tags: ["Auth"],
  description: "Login or register user with Google",
  summary: "Login or register user with Google",
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: loginWithGoogleDTO,
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].LOGIN_SUCCESS(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
            }),
          ),
        },
      },
    },
    201: {
      description: L[lang].USER_CREATED_AND_LOGGED_IN_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
            }),
          ),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    409: {
      description: L[lang].EMAIL_ALREADY_USED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/me/logout",
  tags: ["Auth | Me"],
  description: "Logout current user",
  summary: "Logout current user",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
  },
  responses: {
    200: {
      description: L[lang].LOGOUT_SUCCESS(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/me/request-email-verification-code",
  tags: ["Auth | Me"],
  description: "Logout current user",
  summary: "Logout current user",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
  },
  responses: {
    200: {
      description: L[lang].VERIFICATION_CODE_SENT_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    400: {
      description: `${L[lang].USER_DOES_NOT_HAVE_AN_EMAIL()} or ${L[
        lang
      ].VERIFICATION_CODE_ALREADY_SENT()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    409: {
      description: L[lang].CAN_NOT_SEND_VERIFICATION_CODE(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    503: {
      description: L[lang].VERIFICATION_CODE_COULD_NOT_BE_SENT(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/me/verify",
  tags: ["Auth | Me"],
  description: "Verify current user",
  summary: "Verify current user",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: codeInputDTO,
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].USER_VERIFICATION_SUCCESS(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    422: {
      description: L[lang].INVALID_OR_EXPIRED_VERIFICATION_CODE(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/me/change-password",
  tags: ["Auth | Me"],
  description: "Change current user's password",
  summary: "Change current user's password",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: changePasswordInputDTO,
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].PASSWORD_CHANGE_SUCCESS(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    400: {
      description: `${L[lang].INPUT_VALIDATION_ERROR()} or ${L[
        lang
      ].PASSWORD_INCORRECT()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()}, ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()} or ${L[lang].PASSWORD_NOT_SET()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/me/set-password",
  tags: ["Auth | Me"],
  description: "Set current user's password",
  summary: "Set current user's password",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: setPasswordInputDTO,
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].PASSWORD_SET_SUCCESS(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    409: {
      description: L[lang].PASSWORD_ALREADY_SET(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/me/accounts/link",
  tags: ["Auth | Accounts"],
  description: "Link an account to the current user",
  summary: "Link an account to the current user",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: linkAccountDTO,
        },
      },
    },
  },
  responses: {
    201: {
      description: L[lang].ACCOUNT_LINK_SUCCESS(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    400: {
      description: `${L[lang].INPUT_VALIDATION_ERROR()} or ${L[
        lang
      ].ACCOUNT_COULD_NOT_BE_LINKED()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    409: {
      description: L[lang].EMAIL_ALREADY_USED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/auth/me/accounts/unlink/{provider}",
  tags: ["Auth | Accounts"],
  description: "Unlink current user's selected provider's account",
  summary: "Unlink current user's selected provider's account",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: unlinkAccountInputDTO,
  },
  responses: {
    200: {
      description: L[lang].ACCOUNT_UNLINK_SUCCESS(),
      content: {
        "application/json": {
          schema: baseSuccessResponseSchema,
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()}, ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()} or ${L[lang].PASSWORD_NOT_SET()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    404: {
      description: L[lang].ACCOUNT_NOT_FOUND(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/me/accounts",
  tags: ["Auth | Accounts"],
  description: "Get current user's accounts",
  summary: "Get current user's accounts",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
  },
  responses: {
    200: {
      description: L[lang].ACCOUNTS_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(accountSchema)),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});
