import {
	answerInlineQuery,
	type BotPipeline,
	NyxResponse,
} from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { isUserFlooding } from "../../utils/flood";
import { t } from "../../utils/i18n";

export const handlerInlineQueryFlood: BotPipeline<
	"inline_query",
	DBSchema
> = async (inline_query) => {
	const flooding = isUserFlooding(
		"inline_query",
		inline_query.from.id,
		12,
		60,
		60,
	);

	if (flooding) {
		answerInlineQuery({
			inline_query_id: inline_query.id,
			results: [
				{
					type: "article",
					id: "flood",
					title: t("en", "general.flood"),
					input_message_content: {
						message_text: t("en", "general.flood"),
					},
				},
			],
		});

		return NyxResponse.Finish;
	} else if (flooding === undefined) {
		answerInlineQuery({
			inline_query_id: inline_query.id,
			results: [],
		});

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
