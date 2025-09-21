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

export const handlerInlineQueryContestSpecific: BotPipeline<
	"inline_query",
	DBSchema
> = async (inline_query) => {
	const match = inline_query.query.match(/^contest-([a-f0-9]{32})$/);

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

		if (contest) {
			const results: InlineQueryResult[] = [];

			const { title, prize, date_end, fee, description, cover_image, slug } =
				contest;

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
				const cover: typeof cover_image = JSON.parse(cover_image as any);

				results.push({
					id: inline_query.query,
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
					id: inline_query.query,
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

			answerInlineQuery({
				inline_query_id: inline_query.id,
				results: results,
			});

			return NyxResponse.Finish;
		}
	}

	return NyxResponse.Ok;
};
