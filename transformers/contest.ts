import type { DBSchema } from "../schema";

type TransformedContest = Partial<DBSchema["contests"]> & {
	role?: "owner" | "moderator" | "participant";
};

export const transformContestAPI = (
	contest: TransformedContest,
	requester_id: number | undefined = undefined,
) => {
	const {
		slug,
		title,
		image,
		date_end,
		owner_id,
		prize,
		fee,
		description,
		anonymous: anonymousValue,
		verified: verifiedValue,
	} = contest;

	const theme: DBSchema["contests"]["theme"] = contest.theme
		? JSON.parse(contest.theme as any)
		: undefined;

	let role: TransformedContest["role"];

	if (requester_id) {
		if (requester_id === owner_id) {
			role = "owner";
		}
	}

	const verified = verifiedValue ? verifiedValue === 1 : undefined;

	const anonymous = anonymousValue ? anonymousValue === 1 : undefined;

	return {
		slug,
		title,
		image,
		theme,
		date_end,
		role,
		prize,
		anonymous,
		fee,
		description,
		verified,
	};
};
