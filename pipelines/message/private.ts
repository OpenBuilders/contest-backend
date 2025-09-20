import { type BotPipeline, NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { handlerPrivateCommands } from "./private/commands";
import { handlerPrivateFlood } from "./private/flood";

const pipelines: BotPipeline<"message", DBSchema>[] = [
	handlerPrivateFlood,
	handlerPrivateCommands,
];

export const handlerMessagePrivate: BotPipeline<"message", DBSchema> = async (
	message,
	injections,
) => {
	if (message.chat.type === "private") {
		for (const handler of pipelines) {
			const result = await handler(message, injections);

			if (result === NyxResponse.Finish) {
				return NyxResponse.Finish;
			}
		}
	}

	return NyxResponse.Ok;
};
