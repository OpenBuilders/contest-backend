import type { DBSchema } from "../schema";

type TransformedContest = Partial<DBSchema["contests"]> & {
	role?: "owner" | "moderator" | "participant";
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

export const annotateContestAPI = (
	contest: Partial<DBSchema["contests"]>,
	requester_id: number | undefined = undefined,
) => {
	const { owner_id } = contest;

	let role: TransformedContest["role"];

	if (requester_id) {
		if (requester_id === owner_id) {
			role = "owner";
		}
	}

	const bookmarked = (contest as any).bookmark_id != null ? true : undefined;

	return {
		role,
		bookmarked,
	};
};
