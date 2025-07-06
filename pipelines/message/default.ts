import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { t } from "../../utils/i18n";

export const handlerMessageDefault: BotPipeline<"message", DBSchema> = async (
	message,
) => {
	sendMessage({
		chat_id: message.chat!.id!,
		text: t("en", "general.greet", {
			name: message.from!.first_name,
		}),
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "⭕️",
						callback_data: "greet",
					},
				],
			],
		},
	});

	return NyxResponse.Ok;
};
