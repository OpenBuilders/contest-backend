import type { DBSchema } from "../schema";

export const transformContestAPI = (contest: Partial<DBSchema["contests"]>) => {
	const { slug, title, image, date_end } = contest;

	const theme: DBSchema["contests"]["theme"] = contest.theme
		? JSON.parse(contest.theme as any)
		: undefined;

	return { slug, title, image, theme, date_end };
};
