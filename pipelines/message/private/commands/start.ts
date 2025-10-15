import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import type { DBSchema } from "../../../../schema";
import { t } from "../../../../utils/i18n";
import { setState } from "../../../../utils/state";

export const handlerPrivateCommandStart: BotPipeline<
	"message",
	DBSchema
> = async (message) => {
	if (message.text?.startsWith("/start")) {
		// await sendMessage({
		// 	chat_id: message.chat.id,
		// 	text: t("en", "general.start.text", {
		// 		title: t("en", "general.name"),
		// 	}),
		// 	reply_parameters: {
		// 		message_id: message.message_id,
		// 		allow_sending_without_reply: true,
		// 	},
		// 	reply_markup: {
		// 		is_persistent: true,
		// 		resize_keyboard: true,
		// 		keyboard: [
		// 			[{ text: t("en", "general.menu.my") }],
		// 			// [{ text: t("en", "general.menu.create") }],
		// 		],
		// 	},
		// });

		setState(message.chat.id, "private", {});
	}

	return NyxResponse.Ok;
};
