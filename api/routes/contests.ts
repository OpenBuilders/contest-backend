import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";
import type { DBSchema } from "../../schema";
import { transformContestAPI } from "../../transformers/contest";

export const routePOSTContestsMy: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	// TODO: Moderator, Participant
	const contests: Partial<DBSchema["contests"]>[] = await db
		.selectFrom("contests")
		.select(["slug", "title", "image", "theme", "date_end"])
		.where("owner_id", "=", user_id)
		.orderBy('id', 'desc')
		.execute();

	return {
		status: "success",
		result: {
			contests: contests.map(transformContestAPI),
		},
	};
};
