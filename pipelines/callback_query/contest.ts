import type { BotPipeline } from "nyx-bot-client";
import { NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { handlerCallbackQueryContestView } from "./contest/view";

const pipelines: BotPipeline<"callback_query", DBSchema>[] = [
	handlerCallbackQueryContestView,
];

export const handlerCallbackQueryContest: BotPipeline<
	"callback_query",
	DBSchema
> = async (callback_query, injections) => {
	for (const handler of pipelines) {
		const result = await handler(callback_query, injections);

		if (result === NyxResponse.Finish) {
			return NyxResponse.Finish;
		}
	}

	return NyxResponse.Ok;
};
