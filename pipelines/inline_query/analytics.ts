import type { BotPipeline } from "nyx-bot-client";
import { NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { updateAnalyticsCounter } from "../../utils/analytics";

export const handlerInlineQueryAnalytics: BotPipeline<
	"inline_query",
	DBSchema
> = async () => {
	updateAnalyticsCounter("inline_query");

	return NyxResponse.Ok;
};
