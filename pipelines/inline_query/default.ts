import {
	answerInlineQuery,
	type BotPipeline,
	NyxResponse,
} from "nyx-bot-client";
import type { DBSchema } from "../../schema";

export const handlerInlineQueryDefault: BotPipeline<
	"inline_query",
	DBSchema
> = async (inline_query) => {
	answerInlineQuery({
		inline_query_id: inline_query.id,
		results: [
			{
				type: "article",
				id: "sample",
				title: "Sample",
				input_message_content: {
					message_text: "Sample",
				},
			},
		],
	});

	return NyxResponse.Ok;
};
