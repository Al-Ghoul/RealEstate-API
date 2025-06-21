import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import {
  getUserChatMessages,
  getUserChats,
} from "../controllers/chat.controller";

const router = Router();

router.get("/", isAuthenticated, getUserChats);

router.get("/:id/messages", isAuthenticated, getUserChatMessages);

export default router;
