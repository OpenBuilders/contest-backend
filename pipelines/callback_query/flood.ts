import {
	answerCallbackQuery,
	type BotPipeline,
	NyxResponse,
} from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { isUserFlooding } from "../../utils/flood";
import { t } from "../../utils/i18n";

export const handlerCallbackQueryFlood: BotPipeline<
	"callback_query",
	DBSchema
> = async (callback_query) => {
	const flooding = isUserFlooding(
		"callback_query",
		callback_query.from.id,
		12,
		60,
		60,
	);

	if (flooding) {
		answerCallbackQuery({
			callback_query_id: callback_query.id,
			text: t("en", "general.flood"),
			cache_time: 300,
			show_alert: true,
		});

		return NyxResponse.Finish;
	} else if (flooding === undefined) {
		answerCallbackQuery({
			callback_query_id: callback_query.id,
		});

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
