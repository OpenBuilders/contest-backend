import type { DBSchema, Placement } from "../schema";
import { db } from "../utils/database";
import { transformUserAPI } from "./user";

type TransformedContest = Partial<DBSchema["contests"]> & {
	role?: "owner" | "moderator" | "participant";
	moderators_count?: number;
	submissions_count?: number;
};

export const transformContestAPI = async (
	contest: Partial<DBSchema["contests"]>,
	anonymous?: boolean,
	requester_id: number | undefined = undefined,
) => {
	const {
		id,
		slug,
		title,
		image,
		date_end,
		prize,
		fee,
		fee_wallet,
		description,
		instruction,
		anonymous: anonymousValue,
		verified: verifiedValue,
		announced: announcedValue,
		results: resultsValue,
	} = contest;

	const theme: DBSchema["contests"]["theme"] = contest.theme
		? JSON.parse(contest.theme as any)
		: undefined;

	const verified = verifiedValue ? verifiedValue === 1 : undefined;

	anonymous = anonymous ?? (anonymousValue ? anonymousValue === 1 : undefined);

	const announced = announcedValue ? announcedValue === 1 : undefined;

	const results =
		resultsValue && announced
			? await populateContestResults(
					JSON.parse(resultsValue as any),
					Boolean(anonymous),
					requester_id,
				)
			: undefined;

	return {
		id,
		slug,
		title,
		image,
		theme,
		date_end,
		prize,
		anonymous,
		fee,
		fee_wallet,
		description,
		instruction,
		verified,
		announced,
		results,
	} as TransformedContest;
};

export const annotateContestAPI = async (
	contest: Partial<DBSchema["contests"]>,
	requester_id: number | undefined = undefined,
) => {
	const { id, owner_id } = contest;

	let role: TransformedContest["role"];
	let moderators_count: TransformedContest["moderators_count"];
	let submissions_count: TransformedContest["submissions_count"];

	if (requester_id) {
		if (requester_id === owner_id) {
			role = "owner";
		} else {
			const participant = await db
				.selectFrom("submissions")
				.select(["id"])
				.where("user_id", "=", requester_id)
				.where("contest_id", "=", id!)
				.executeTakeFirst();

			if (participant) {
				role = "participant";
			}

			const moderator = await db
				.selectFrom("moderators")
				.select(["id"])
				.where("user_id", "=", requester_id)
				.where("contest_id", "=", id!)
				.executeTakeFirst();

			if (moderator) {
				role = "moderator";
			}
		}
	}

	if (role === "owner" && id) {
		const result_moderators = await db
			.selectFrom("moderators")
			.select(({ fn }) => fn.countAll().as("count"))
			.where("contest_id", "=", id)
			.executeTakeFirst();

		moderators_count = Number(result_moderators?.count ?? 0);
	}

	if (id) {
		const result_submissions = await db
			.selectFrom("submissions")
			.select(({ fn }) => fn.countAll().as("count"))
			.where("contest_id", "=", id)
			.executeTakeFirst();

		submissions_count = Number(result_submissions?.count ?? 0);
	}

	const bookmarked = (contest as any).bookmark_id != null ? true : undefined;

	return {
		role,
		bookmarked,
		moderators_count,
		submissions_count,
	};
};

const populateContestResults = async (
	placements: Placement[],
	anonymous?: boolean,
	requester_id: number | undefined = undefined,
) => {
	if (placements.length === 0) return [];

	let submission_ids: number[] = [];

	if (
		placements.every((item) =>
			item.submissions.every((i) => typeof i === "number"),
		)
	) {
		submission_ids = [...new Set(placements.flatMap((i) => i.submissions))];
	}

	const submissions = await db
		.selectFrom("submissions")
		.select(["user_id", "id"])
		.where("id", "in", submission_ids.length > 0 ? submission_ids : [-1])
		.execute();

	const user_ids = [...new Set(submissions.flatMap((i) => i.user_id))];
	const users = (
		await db
			.selectFrom("users")
			.select([
				"anonymous_profile",
				"first_name",
				"last_name",
				"profile_photo",
				"user_id",
				"language",
			])
			.where("user_id", "in", user_ids.length > 0 ? user_ids : [-1])
			.execute()
	).map((i) => transformUserAPI(i as any));

	const results = placements.map((placement) => {
		const { name, prize } = placement;

		return {
			name,
			prize,
			submissions: placement.submissions
				.map((submission_id) => {
					const submission = submissions.find((i) => i.id === submission_id);
					if (!submission) return submission_id;

					const user = users.find((i) => i.user_id === submission.user_id);
					if (!user) return undefined;

					const self = user.user_id === requester_id;

					const {
						anonymous_profile,
						first_name,
						last_name,
						profile_photo,
						user_id,
					} = user;

					if (anonymous === false) {
						return {
							anonymous_profile,
							first_name,
							last_name,
							profile_photo,
							user_id,
							self,
						};
					}

					return {
						anonymous_profile,
						self,
					};
				})
				.filter(Boolean),
		};
	});

	return results;
};
