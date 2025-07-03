import type { BotPipeline } from "nyx-bot-client";
import { answerCallbackQuery, NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";

export const handlerCallbackQueryDefault: BotPipeline<
	"callback_query",
	DBSchema
> = async (callback_query) => {
	answerCallbackQuery({
		callback_query_id: callback_query.id,
		text: "Silence is gold",
	});

	return NyxResponse.Ok;
};
