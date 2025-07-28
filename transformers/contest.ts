import type { DBSchema } from "../schema";

type TransformedContest = Partial<DBSchema["contests"]> & {
	role?: "owner" | "moderator" | "participant";
};

export const transformContestAPI = (
	contest: TransformedContest,
	requester_id: number | undefined,
) => {
	const { slug, title, image, date_end, owner_id, prize } = contest;

	const theme: DBSchema["contests"]["theme"] = contest.theme
		? JSON.parse(contest.theme as any)
		: undefined;

	let role: TransformedContest["role"];

	if (requester_id) {
		if (requester_id === owner_id) {
			role = "owner";
		}
	}

	return { slug, title, image, theme, date_end, role, prize };
};
