import { type BotPipeline, NyxResponse, sendAnimation } from "nyx-bot-client";
import { media } from "../../../../information/media";
import type { DBSchema } from "../../../../schema";
import { env } from "../../../../utils/env";
import { t } from "../../../../utils/i18n";

export const handlerPrivateCommandDefault: BotPipeline<
	"message",
	DBSchema
> = async (message) => {
	sendAnimation({
		animation: media.welcome.gif.file_id,
		chat_id: message.chat!.id!,
		caption: t("en", "general.welcome.text", {
			name: [message.from?.first_name, message.from?.last_name]
				.filter(Boolean)
				.join(" "),
			title: t("en", "general.name"),
		}),
		reply_parameters: {
			message_id: message.message_id,
			allow_sending_without_reply: true,
		},
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: t("en", "general.welcome.button"),
						web_app: {
							url: env.MINIAPP_URL,
						},
					},
				],
			],
		},
	});

	return NyxResponse.Ok;
};
