import { createSchemaFactory } from "drizzle-zod";
import { zodInstance } from "../utils/swagger.utils";
import { chatParticipant } from "../db/schemas/chat.schema";
import { z } from "zod";

const { createInsertSchema } = createSchemaFactory({
  zodInstance,
  coerce: {
    date: true,
  },
});

export const baseChatParticipantDTO = createInsertSchema(chatParticipant, {});

export const chatInputDTO = baseChatParticipantDTO.pick({
  userId: true,
});

export const chatOutputDTO = baseChatParticipantDTO.pick({
  chatId: true,
});

export type ChatInputDTO = z.infer<typeof chatInputDTO>;
