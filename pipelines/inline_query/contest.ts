import type { BotPipeline } from "nyx-bot-client";
import { NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { handlerInlineQueryContestSearch } from "./contest/search";
import { handlerInlineQueryContestSpecific } from "./contest/specific";

const pipelines: BotPipeline<"inline_query", DBSchema>[] = [
	handlerInlineQueryContestSpecific,
	handlerInlineQueryContestSearch,
];

export const handlerInlineQueryContest: BotPipeline<
	"inline_query",
	DBSchema
> = async (inline_query, injections) => {
	for (const handler of pipelines) {
		const result = await handler(inline_query, injections);

		if (result === NyxResponse.Finish) {
			return NyxResponse.Finish;
		}
	}

	return NyxResponse.Ok;
};
