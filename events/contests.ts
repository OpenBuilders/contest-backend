import { sleep } from "bun";
import {
	type InlineKeyboardButton,
	sendMessage,
	sendPhoto,
} from "nyx-bot-client";
import { generateContestCaption } from "../helpers/contest";
import { miniAppInternalURL } from "../information/general";
import { cacheContestCoverImage } from "../utils/cover";
import { db } from "../utils/database";
import type { Events } from "../utils/events";
import { t } from "../utils/i18n";

export const handleContestCreated = async (data: Events["contestCreated"]) => {
	const { contest_id, notify } = data;

	const contest = await db
		.selectFrom("contests")
		.selectAll()
		.where("id", "=", contest_id)
		.executeTakeFirst();

	if (!contest) return;

	const cover = await cacheContestCoverImage(contest);

	if (notify) {
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
					url: `${miniAppInternalURL}?startapp=contest-${contest.slug}`,
				},
			],
			[
				{
					text: t("en", "general.contest.buttons.share"),
					switch_inline_query: `contest-${contest.slug}`,
				},
			],
		];

		if (cover) {
			sendPhoto({
				chat_id: contest.owner_id,
				photo: cover.file_id!,
				caption: caption,
				reply_markup: {
					inline_keyboard: keyboard,
				},
			});
		} else {
			sendMessage({
				chat_id: contest.owner_id,
				text: caption,
				reply_markup: {
					inline_keyboard: keyboard,
				},
			});
		}
	}
};

export const handleContestUpdated = async (data: Events["contestUpdated"]) => {
	const { contest_id } = data;

	const contest = await db
		.selectFrom("contests")
		.select(["id", "title", "image", "theme", "cover_image"])
		.where("id", "=", contest_id)
		.executeTakeFirst();

	if (!contest) return;
	await cacheContestCoverImage(contest);
};

export const handleContestBeforeDelete = async (
	data: Events["contestBeforeDelete"],
) => {
	const { contest_id } = data;

	await db
		.deleteFrom("moderators")
		.where("contest_id", "=", contest_id)
		.execute();

	await db
		.deleteFrom("bookmarks")
		.where("contest_id", "=", contest_id)
		.execute();

	await db
		.deleteFrom("submissions")
		.where("contest_id", "=", contest_id)
		.execute();
};

export const handleContestDeleted = async (
	data: Events["contestDeleted"],
) => {};

export const handleContestBookmarked = (
	data: Events["contestBookmarked"],
) => {};

export const handleContestSubmitted = async (
	data: Events["contestSubmitted"],
) => {
	const { contest_id, user_id } = data;

	const contest = await db
		.selectFrom("contests")
		.select(["owner_id", "title", "slug"])
		.where("id", "=", contest_id)
		.executeTakeFirst();

	if (!contest) return;

	const participant = await db
		.selectFrom("users")
		.select(["first_name", "last_name", "language", "username"])
		.where("user_id", "=", user_id)
		.executeTakeFirst();

	if (!participant) return;

	const submission = await db
		.selectFrom("submissions")
		.select(["id", "submission"])
		.where("contest_id", "=", contest_id)
		.where("user_id", "=", user_id)
		.executeTakeFirst();

	if (!submission) return;

	const moderators = await db
		.selectFrom("moderators")
		.select(["user_id"])
		.where("contest_id", "=", contest_id)
		.execute();

	const contest_url = `${miniAppInternalURL}?startapp=contest-${contest.slug}`;
	const submission_url = `${miniAppInternalURL}?startapp=submission-${contest.slug}-${submission.id}`;

	// Notify the participant
	await sendMessage({
		chat_id: user_id,
		text: t(
			(participant.language ?? "en") as any,
			"notifications.submitted.user.text",
			{
				contest_name: contest.title,
				contest_url: contest_url,
			},
		),
		link_preview_options: {
			is_disabled: true,
		},
		// reply_markup: {
		// 	inline_keyboard: [
		// 		[
		// 			{
		// 				text: t("en", "notifications.submitted.user.buttons.view"),
		// 				url: submission_url,
		// 			},
		// 		],
		// 	],
		// },
	});

	// Notify the owner
	await sendMessage({
		chat_id: contest.owner_id,
		text: t("en", "notifications.submitted.owner.text", {
			contest_name: contest.title,
			contest_url: contest_url,
			info: [
				[
					"👤",
					`<a href="tg://user?id=${user_id}">${[participant.first_name, participant.last_name].filter(Boolean).join(" ")}</a>`,
				].join(" "),
				["🆔", participant.username ? `@${participant.username}` : "∅"].join(
					" ",
				),
				["🪪", user_id].join(" "),
			].join("\n"),
		}),
		link_preview_options: {
			is_disabled: true,
		},
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: t("en", "notifications.submitted.owner.buttons.view"),
						url: submission_url,
					},
				],
			],
		},
	});

	// Notify the moderators
	for (const moderator of moderators) {
		await sendMessage({
			chat_id: moderator.user_id,
			text: t("en", "notifications.submitted.moderator.text", {
				contest_name: contest.title,
				contest_url: contest_url,
			}),
			link_preview_options: {
				is_disabled: true,
			},
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: t("en", "notifications.submitted.moderator.buttons.view"),
							url: submission_url,
						},
					],
				],
			},
		});

		await sleep(250);
	}
};

export const handleContestAnnounced = async (
	data: Events["contestAnnounced"],
) => {
	const { contest_id } = data;

	const contest = await db
		.selectFrom("contests")
		.select(["owner_id", "title", "slug"])
		.where("id", "=", contest_id)
		.executeTakeFirst();

	if (!contest) return;

	const participants = await db
		.selectFrom("submissions")
		.select(["user_id"])
		.where("contest_id", "=", contest_id)
		.execute();

	const moderators = await db
		.selectFrom("moderators")
		.select(["user_id"])
		.where("contest_id", "=", contest_id)
		.execute();

	const contest_url = `${miniAppInternalURL}?startapp=contest-${contest.slug}`;

	const user_ids = [
		...new Set([
			contest.owner_id,
			...moderators.flatMap((i) => i.user_id),
			...participants.flatMap((i) => i.user_id),
		]),
	];

	for (const user_id of user_ids) {
		await sendMessage({
			chat_id: user_id,
			text: t("en", "notifications.results.participants.text", {
				contest_name: contest.title,
				contest_url: contest_url,
			}),
			link_preview_options: {
				is_disabled: true,
			},
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: t("en", "notifications.results.participants.buttons.view"),
							url: contest_url,
						},
					],
				],
			},
		});

		await sleep(250);
	}
};
