import type { BotPipeline } from "nyx-bot-client";
import { answerInlineQuery, NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { t } from "../../utils/i18n";

export const handlerInlineQueryNotFound: BotPipeline<
	"inline_query",
	DBSchema
> = async (inline_query) => {
	answerInlineQuery({
		inline_query_id: inline_query.id,
		is_personal: true,
		results: [
			{
				id: "not-found",
				type: "article",
				title: t("en", "inline_query.notFound.title"),
				input_message_content: {
					message_text: t("en", "inline_query.notFound.description"),
				},
			},
		],
	});

	return NyxResponse.Finish;
};
