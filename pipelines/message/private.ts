import { type BotPipeline, NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { handlerPrivateCommands } from "./private/commands";
import { handlerPrivateDefault } from "./private/default";
import { handlerPrivateFlood } from "./private/flood";
import { handlerPrivateStates } from "./private/state";

const pipelines: BotPipeline<"message", DBSchema>[] = [
	handlerPrivateFlood,
	handlerPrivateCommands,
	handlerPrivateStates,
	handlerPrivateDefault,
];

export const handlerMessagePrivate: BotPipeline<"message", DBSchema> = async (
	message,
	injections,
) => {
	console.log("update_received_pv", message);

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
