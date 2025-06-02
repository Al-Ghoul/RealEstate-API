import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { chatInputDTO } from "../dtos/chat.dto";
import { schemaValidatorMiddleware } from "../middlewares/schemaValidator.middleware";
import { createChat } from "../controllers/chat.controller";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  schemaValidatorMiddleware(chatInputDTO),
  createChat,
);

export default router;
