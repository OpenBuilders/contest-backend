import type { DBSchema } from "../schema";
import { db } from "../utils/database";

type TransformedContest = Partial<DBSchema["contests"]> & {
	role?: "owner" | "moderator" | "participant";
	moderators_count?: number;
	submissions_count?: number;
};

export const transformContestAPI = (contest: Partial<DBSchema["contests"]>) => {
	const {
		id,
		slug,
		title,
		image,
		date_end,
		prize,
		fee,
		description,
		anonymous: anonymousValue,
		verified: verifiedValue,
		announced: announcedValue,
	} = contest;

	const theme: DBSchema["contests"]["theme"] = contest.theme
		? JSON.parse(contest.theme as any)
		: undefined;

	const verified = verifiedValue ? verifiedValue === 1 : undefined;

	const anonymous = anonymousValue ? anonymousValue === 1 : undefined;

	const announced = announcedValue ? announcedValue === 1 : undefined;

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
		description,
		verified,
		announced,
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
