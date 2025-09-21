import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import type { DBSchema } from "../../../../schema";
import { t } from "../../../../utils/i18n";
import { getState, setState } from "../../../../utils/state";

export const handlerPrivateCommandSkip: BotPipeline<
	"message",
	DBSchema
> = async (message) => {
	if (message.text?.startsWith("/skip")) {
		const { state, params } = await getState(message.chat.id, "private");

		if (state === "create") {
			if (params.step === "description") {
				params.step = "photo";

				setState(message.chat.id, "private", {
					state,
					params,
				});

				sendMessage({
					chat_id: message.chat.id,
					text: t("en", "general.create.photo.text"),
					reply_parameters: {
						message_id: message.message_id,
						allow_sending_without_reply: true,
					},
				});

				return NyxResponse.Finish;
			}

			if (params.step === "photo") {
				params.step = "date";

				setState(message.chat.id, "private", {
					state,
					params,
				});

				sendMessage({
					chat_id: message.chat.id,
					text: t("en", "general.create.date.text"),
					reply_parameters: {
						message_id: message.message_id,
						allow_sending_without_reply: true,
					},
				});

				return NyxResponse.Finish;
			}
		}
	}

	return NyxResponse.Ok;
};
