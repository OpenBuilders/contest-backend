import { sendMessage } from "nyx-bot-client";
import { miniAppInternalURL } from "../information/general";
import { db } from "../utils/database";
import type { Events } from "../utils/events";
import { t } from "../utils/i18n";

export const handleModeratorJoined = async (
	data: Events["moderatorJoined"],
) => {
	const { contest_id, user_id } = data;

	const contest = await db
		.selectFrom("contests")
		.select(["owner_id", "title", "slug"])
		.where("id", "=", contest_id)
		.executeTakeFirst();

	if (!contest) return;

	const moderator = await db
		.selectFrom("users")
		.select(["first_name", "last_name", "language", "username"])
		.where("user_id", "=", user_id as any)
		.executeTakeFirst();

	if (!moderator) return;

	const contest_url = `${miniAppInternalURL}?startapp=contest-${contest.slug}`;

	// Notify the owner
	await sendMessage({
		chat_id: contest.owner_id,
		text: t("en", "notifications.moderator.joined.owner.text", {
			contest_name: contest.title,
			contest_url: contest_url,
			name: [moderator.first_name, moderator.last_name]
				.filter(Boolean)
				.join(" "),
		}),
		link_preview_options: {
			is_disabled: true,
		},
	});
};

export const handleModeratorRemoved = (_: Events["moderatorRemoved"]) => {};

export const handleModeratorsRevoked = (
	_: Events["moderatorsLinkRevoked"],
) => {};
