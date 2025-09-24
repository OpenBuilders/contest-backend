import Fuse from "fuse.js";
import type {
	BotPipeline,
	InlineKeyboardButton,
	InlineQueryResult,
} from "nyx-bot-client";
import { answerInlineQuery, NyxResponse } from "nyx-bot-client";
import { generateContestCaption } from "../../../helpers/contest";
import { miniAppInternalURL } from "../../../information/general";
import type { DBSchema } from "../../../schema";
import { db } from "../../../utils/database";
import { env } from "../../../utils/env";
import { t } from "../../../utils/i18n";

export const handlerInlineQueryContestSearch: BotPipeline<
	"inline_query",
	DBSchema
> = async (inline_query) => {
	const user_id = inline_query.from.id;

	const contests = await db
		.selectFrom("contests")
		.leftJoin("bookmarks", (join) =>
			join
				.onRef("bookmarks.contest_id", "=", "contests.id")
				.on("bookmarks.user_id", "=", user_id),
		)
		.select([
			"contests.id",
			"contests.slug",
			"contests.title",
			"contests.theme",
			"contests.fee",
			"contests.cover_image",
			"contests.description",
			"contests.date_end",
			"contests.prize",
		])
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

	const fuse = new Fuse(contests, {
		keys: ["title", "slug", "description", "prize"],
	});

	const items =
		inline_query.query.length > 0 ? fuse.search(inline_query.query) : contests;

	if (items.length > 0) {
		const results: InlineQueryResult[] = [];

		const offset = Number.parseInt(inline_query.offset || "0", 10);

		for (const contest of items.slice(offset, offset + 50)) {
			const { title, prize, date_end, fee, description, cover_image, slug } =
				`item` in contest ? contest.item : contest;

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
						url: `${miniAppInternalURL}?startapp=contest-${slug}`,
					},
				],
			];

			if (cover_image) {
				const cover = cover_image;

				results.push({
					id: `contest-${slug}`,
					type: "photo",
					photo_file_id: cover.file_id,
					caption: caption,
					parse_mode: "HTML",
					title: title,
					reply_markup: {
						inline_keyboard: keyboard,
					},
				});
			} else {
				results.push({
					id: `contest-${slug}`,
					type: "article",
					input_message_content: {
						message_text: caption,
						parse_mode: "HTML",
					},
					title: title,
					reply_markup: {
						inline_keyboard: keyboard,
					},
				});
			}
		}

		answerInlineQuery({
			inline_query_id: inline_query.id,
			results: results,
			is_personal: true,
			next_offset: items.length.toString(),
		});

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
