import { type BotPipeline, NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { handlerGroupModeration } from "./group/moderation";
import { handlerGroupValidate } from "./group/validate";

const pipelines: BotPipeline<"message", DBSchema>[] = [
	handlerGroupValidate,
	handlerGroupModeration,
];

export const handlerMessageGroups: BotPipeline<"message", DBSchema> = async (
	message,
	injections,
) => {
	if (message.chat.type === "group" || message.chat.type === "supergroup") {
		for (const handler of pipelines) {
			const result = await handler(message, injections);

			if (result === NyxResponse.Finish) {
				return NyxResponse.Finish;
			}
		}
	}

	return NyxResponse.Ok;
};
