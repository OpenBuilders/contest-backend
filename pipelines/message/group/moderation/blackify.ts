import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import type { DBSchema } from "../../../../schema";
import { db } from "../../../../utils/database";
import { t } from "../../../../utils/i18n";

export const handlerGroupModerationBlackify: BotPipeline<
	"message",
	DBSchema
> = async (message) => {
	const match = message.text?.match(/^\/blackify\s+([a-fA-F0-9]{32})$/i);

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
					theme: JSON.stringify({
						backdrop: 0,
						symbol: (contest.theme as any).symbol ?? "symbol-55",
					}),
				})
				.where("slug", "=", slug)
				.execute();

			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "message.group.moderation.blackify.text", {
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
