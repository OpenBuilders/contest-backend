import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import type { DBSchema } from "../../../../schema";
import { t } from "../../../../utils/i18n";
import { setState } from "../../../../utils/state";

export const handlerPrivateCommandCreate: BotPipeline<
	"message",
	DBSchema
> = async (message, injections) => {
	if (message.text === t("en", "general.menu.create")) {
		sendMessage({
			chat_id: message.chat.id,
			text: t("en", "general.create.title.text"),
			reply_parameters: {
				message_id: message.message_id,
				allow_sending_without_reply: true,
			},
		});

		setState(
			message.chat.id,
			"private",
			{
				state: "create",
			},
			injections?.redis,
		);

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
