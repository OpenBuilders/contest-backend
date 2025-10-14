import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import type { DBSchema } from "../../../../schema";
import { db } from "../../../../utils/database";
import { t } from "../../../../utils/i18n";

export const handlerGroupModerationVerify: BotPipeline<
	"message",
	DBSchema
> = async (message) => {
	const match = message.text?.match(/^\/verify\s+([a-fA-F0-9]{32})$/i);

	if (match) {
		const slug = match[1]!;

		const contest = await db
			.selectFrom("contests")
			.selectAll()
			.where("slug", "=", slug)
			.executeTakeFirst();

		if (contest) {
			await db
				.updateTable("contests")
				.set({
					verified: true,
				})
				.execute();

			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "message.group.moderation.verify.text", {
					contest: slug,
				}),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		} else {
			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "message.group.moderation.notFound.text", {
					contest: slug,
				}),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		}

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
