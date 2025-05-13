import { z } from "zod";
import type { Locales } from "../i18n/i18n-types";
import L from "../i18n/i18n-node";

export function configureZodI18n(locale: Locales) {
  const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
    console.log(issue);
    switch (issue.code) {
      case z.ZodIssueCode.custom:
        if (issue.path[0] === "confirmPassword") {
          return { message: L[locale].PASSWORDS_DO_NOT_MATCH() };
        }
        break;

      case z.ZodIssueCode.invalid_type:
        if (issue.path[0] === "code") {
          return { message: L[locale].CODE_IS_REQUIRED() };
        } /*else if (issue.path[0] === "price") {
          
        }*/ else if (issue.path[0] === "role") {
          return {
            message: L[locale].EXPECTED_X_RECEIVED_Y({
              expected: issue.expected,
              received: issue.received,
            }),
          };
        } else {
          return { message: L[locale].FIELD_IS_REQUIED() };
        }

      case z.ZodIssueCode.invalid_enum_value:
        if (issue.path[0] === "role") {
          return {
            message: L[locale].EXPECTED_X_RECEIVED_Y({
              expected:
                locale === "en"
                  ? issue.options.join(" or ")
                  : issue.options.join(" أو "),
              received: issue.received,
            }),
          };
        }
        break;

      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") {
          return { message: L[locale].INVALID_EMAIL() };
        } else if (issue.validation === "regex" && issue.path[0] === "code") {
          return { message: L[locale].INVALID_CODE() };
        }
        break;

      case z.ZodIssueCode.too_big:
        if (issue.path[0] === "firstName") {
          return {
            message: L[locale].FIRST_NAME_TOO_LONG({
              max: Number(issue.maximum),
            }),
          };
        }

        if (issue.path[0] === "lastName") {
          return {
            message: L[locale].LAST_NAME_TOO_LONG({
              max: Number(issue.maximum),
            }),
          };
        }
        break;

      case z.ZodIssueCode.too_small:
        if (issue.path[0] === "firstName") {
          return {
            message: L[locale].FIRST_NAME_TOO_SHORT({
              min: Number(issue.minimum),
            }),
          };
        }

        if (issue.path[0] === "lastName") {
          return {
            message: L[locale].LAST_NAME_TOO_SHORT({
              min: Number(issue.minimum),
            }),
          };
        }

        if (
          issue.path[0] === "password" ||
          issue.path[0] === "confirmPassword" ||
          issue.path[0] === "currentPassword"
        ) {
          return {
            message: L[locale].PASSWORD_TOO_SHORT({
              min: Number(issue.minimum),
            }),
          };
        }
        break;

      default:
        return { message: ctx.defaultError };
    }

    return { message: ctx.defaultError };
  };
  z.setErrorMap(customErrorMap);
}
