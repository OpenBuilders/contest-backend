import { type BotPipeline, NyxResponse } from "nyx-bot-client";

import type { DBSchema } from "../../../schema";
import { handlerPrivateCommandCreate } from "./commands/create";
import { handlerPrivateCommandDefault } from "./commands/default";
import { handlerPrivateCommandMyContests } from "./commands/my-contests";
import { handlerPrivateCommandStart } from "./commands/start";

const pipelines: BotPipeline<"message", DBSchema>[] = [
	handlerPrivateCommandStart,
	handlerPrivateCommandMyContests,
	handlerPrivateCommandCreate,
	handlerPrivateCommandDefault,
];

export const handlerPrivateCommands: BotPipeline<"message", DBSchema> = async (
	message,
	injections,
) => {
	for (const handler of pipelines) {
		const result = await handler(message, injections);

		if (result === NyxResponse.Finish) {
			return NyxResponse.Finish;
		}
	}

	return NyxResponse.Ok;
};
