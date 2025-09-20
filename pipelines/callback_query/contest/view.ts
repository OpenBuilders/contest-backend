import type { BotPipeline, InlineKeyboardButton } from "nyx-bot-client";
import {
	answerCallbackQuery,
	NyxResponse,
	sendMessage,
	sendPhoto,
} from "nyx-bot-client";
import { generateContestCaption } from "../../../helpers/contest";
import type { DBSchema } from "../../../schema";
import { cacheContestCoverImage } from "../../../utils/cover";
import { db } from "../../../utils/database";
import { env } from "../../../utils/env";
import { t } from "../../../utils/i18n";

export const handlerCallbackQueryContestView: BotPipeline<
	"callback_query",
	DBSchema
> = async (callback_query) => {
	const match = callback_query.data?.match(/^contest_([a-f0-9]{32})$/);

	if (match) {
		const [, slug] = match;

		const contest = await db
			.selectFrom("contests")
			.select([
				"id",
				"slug",
				"title",
				"image",
				"description",
				"cover_image",
				"theme",
				"prize",
				"fee",
				"date_end",
			])
			.where("slug", "=", slug ?? "")
			.executeTakeFirst();

		if (!contest) {
			answerCallbackQuery({
				callback_query_id: callback_query.id,
				text: t("en", "callback_query.contest.view.notFound"),
				show_alert: true,
			});
		} else {
			answerCallbackQuery({
				callback_query_id: callback_query.id,
				text: contest.title,
			});

			const { title, prize, date_end, fee, description } = contest;

			const caption = generateContestCaption(
				title,
				prize,
				date_end,
				fee,
				description,
			);

			const keyboard: InlineKeyboardButton[][] = [
				[
					{
						text: t("en", "general.contest.buttons.open"),
						url: `https://t.me/${env.BOT_USERNAME}/${env.MINIAPP_SLUG}?startapp=contest-${contest.slug}`,
					},
				],
				[
					{
						text: t("en", "general.contest.buttons.share"),
						switch_inline_query: `contest-${contest.slug}`,
					},
				],
			];

			if (contest.cover_image) {
				const cover: typeof contest.cover_image = JSON.parse(
					contest.cover_image as any,
				);

				sendPhoto({
					chat_id: callback_query.message!.chat.id,
					photo: cover.file_id,
					caption: caption,
					reply_markup: {
						inline_keyboard: keyboard,
					},
				});
			} else {
				sendMessage({
					chat_id: callback_query.message!.chat.id,
					text: caption,
					reply_markup: {
						inline_keyboard: keyboard,
					},
				});

				cacheContestCoverImage(contest);
			}
		}

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
