import type { BotPipeline } from "nyx-bot-client";
import { NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { updateAnalyticsCounter } from "../../utils/analytics";

export const handlerCallbackQueryAnalytics: BotPipeline<
	"callback_query",
	DBSchema
> = async () => {
	updateAnalyticsCounter("callback_query");

	return NyxResponse.Ok;
};
