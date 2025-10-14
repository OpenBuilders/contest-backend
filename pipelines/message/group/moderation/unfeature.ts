import { type BotPipeline, NyxResponse, sendMessage } from "nyx-bot-client";
import { gallery } from "../../../../api/routes/contests";
import { getGallery } from "../../../../api/utils/gallery";
import type { DBSchema, GalleryItem } from "../../../../schema";
import { db } from "../../../../utils/database";
import { t } from "../../../../utils/i18n";

export const handlerGroupModerationUnfeature: BotPipeline<
	"message",
	DBSchema
> = async (message) => {
	const match = message.text?.match(/^\/unfeature\s+([a-fA-F0-9]{32})$/i);

	if (match) {
		const slug = match[1]!;

		const contest = await db
			.selectFrom("contests")
			.selectAll()
			.where("slug", "=", slug)
			.executeTakeFirst();

		if (contest) {
			const setting = await db
				.selectFrom("settings")
				.select(["value"])
				.where("meta", "=", "gallery")
				.executeTakeFirst();

			const items: GalleryItem[] = JSON.parse(setting?.value ?? "[]");
			const section = items.find(
				(i) => i.type === "section" && i.id === "public",
			)!;

			section.items = [
				...new Set(section.items.filter((i) => i !== contest.id)),
			];

			await db
				.updateTable("settings")
				.set({
					value: JSON.stringify(items),
				})
				.where("meta", "=", "gallery")
				.execute();

			gallery.splice(0, gallery.length);
			gallery.push(...(await getGallery()));

			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "message.group.moderation.unfeature.text", {
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
