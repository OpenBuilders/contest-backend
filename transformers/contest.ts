import type { DBSchema } from "../schema";
import { db } from "../utils/database";

type TransformedContest = Partial<DBSchema["contests"]> & {
	role?: "owner" | "moderator" | "participant";
	moderators_count?: number;
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
	} = contest;

	const theme: DBSchema["contests"]["theme"] = contest.theme
		? JSON.parse(contest.theme as any)
		: undefined;

	const verified = verifiedValue ? verifiedValue === 1 : undefined;

	const anonymous = anonymousValue ? anonymousValue === 1 : undefined;

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
	} as TransformedContest;
};

export const annotateContestAPI = async (
	contest: Partial<DBSchema["contests"]>,
	requester_id: number | undefined = undefined,
) => {
	const { id, owner_id } = contest;

	let role: TransformedContest["role"];
	let moderators_count: TransformedContest["moderators_count"];

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
		const result = await db
			.selectFrom("moderators")
			.select(({ fn }) => fn.countAll().as("count"))
			.where("contest_id", "=", id)
			.executeTakeFirst();

		moderators_count = Number(result?.count ?? 0);
	}

	const bookmarked = (contest as any).bookmark_id != null ? true : undefined;

	return {
		role,
		bookmarked,
		moderators_count,
	};
};
