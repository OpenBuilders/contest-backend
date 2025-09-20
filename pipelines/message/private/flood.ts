import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import type { DBSchema } from "../../../schema";
import { isUserFlooding } from "../../../utils/flood";
import { t } from "../../../utils/i18n";

export const handlerPrivateFlood: BotPipeline<"message", DBSchema> = async (
	message,
) => {
	const flooding = isUserFlooding(
		message.chat.type,
		message.from!.id,
		12,
		60,
		60,
	);

	if (flooding) {
		sendMessage({
			chat_id: message.chat.id,
			text: t("en", "general.flood"),
		});

		return NyxResponse.Finish;
	} else if (flooding === undefined) {
		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
