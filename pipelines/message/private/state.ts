import { type BotPipeline, NyxResponse } from "nyx-bot-client";

import type { DBSchema } from "../../../schema";
import { handlerPrivateStateCreate } from "./states/create";

const pipelines: BotPipeline<"message", DBSchema>[] = [
	handlerPrivateStateCreate,
];

export const handlerPrivateStates: BotPipeline<"message", DBSchema> = async (
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
