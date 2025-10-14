import { type BotPipeline, leaveChat, NyxResponse } from "nyx-bot-client";
import { ValidGroupIDs } from "../../../information/groups";
import type { DBSchema } from "../../../schema";

export const handlerGroupValidate: BotPipeline<"message", DBSchema> = async (
	message,
) => {
	if (ValidGroupIDs.includes(message.chat.id)) {
		return NyxResponse.Ok;
	}

	leaveChat({
		chat_id: message.chat.id,
	});

	return NyxResponse.Finish;
};
