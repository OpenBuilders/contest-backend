import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import type { DBSchema } from "../../../../schema";
import { arrayChunk } from "../../../../utils/array";
import { db } from "../../../../utils/database";
import { t } from "../../../../utils/i18n";

export const handlerPrivateCommandMyContests: BotPipeline<
	"message",
	DBSchema
> = async (message) => {
	if (message.text === t("en", "general.menu.my")) {
		const user_id = message.from?.id ?? -1;

		const contests = await db
			.selectFrom("contests")
			.leftJoin("bookmarks", (join) =>
				join
					.onRef("bookmarks.contest_id", "=", "contests.id")
					.on("bookmarks.user_id", "=", user_id),
			)
			.select(["contests.id", "contests.slug", "contests.title"])
			.where((eb) =>
				eb.or([
					eb("contests.owner_id", "=", user_id),
					eb.exists(
						eb
							.selectFrom("moderators")
							.whereRef("moderators.contest_id", "=", "contests.id")
							.where("moderators.user_id", "=", user_id)
							.selectAll(),
					),
					eb.exists(
						eb
							.selectFrom("submissions")
							.whereRef("submissions.contest_id", "=", "contests.id")
							.where("submissions.user_id", "=", user_id)
							.selectAll(),
					),
					eb.exists(
						eb
							.selectFrom("bookmarks")
							.whereRef("bookmarks.contest_id", "=", "contests.id")
							.where("bookmarks.user_id", "=", user_id)
							.selectAll(),
					),
				]),
			)
			.orderBy("contests.id", "desc")
			.execute();

		if (contests.length === 0) {
			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.myContests.empty"),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		} else {
			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.myContests.list"),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
				reply_markup: {
					inline_keyboard: arrayChunk(
						contests.slice(0, 50).map((contest) => ({
							text: `${contest.title}`,
							callback_data: `contest_${contest.slug}`,
						})),
						2,
					),
				},
			});
		}

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
