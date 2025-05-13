import { type Request, type Response } from "express";
import { assertAuthenticated } from "../utils/assertions.utils";
import type { Locales } from "../i18n/i18n-types";
import * as propertyService from "../services/property.service";
import L from "../i18n/i18n-node";

export async function createProperty(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;

  if (!req.user.roles.includes("agent") && !req.user.roles.includes("admin")) {
    res.status(403).json({
      status: "error",
      statusCode: 403,
      message: L[lang].ACCESS_DENIED(),
      details: L[lang].ACCESS_DENIED_DETAILS(),
    });
    return;
  }

  try {
    const property = await propertyService.createProperty({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: L[lang].PROPERTY_CREATED_SUCCESSFULLY(),
      data: property,
    });
  } catch {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: L[lang].INTERNAL_SERVER_ERROR(),
    });
  }
}
