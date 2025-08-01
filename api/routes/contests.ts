import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";

import {
	annotateContestAPI,
	transformContestAPI,
} from "../../transformers/contest";

export const routeGETContestsMy: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contests = await db
		.selectFrom("contests")
		.leftJoin("bookmarks", (join) =>
			join
				.onRef("bookmarks.contest_id", "=", "contests.id")
				.on("bookmarks.user_id", "=", user_id),
		)
		.select([
			"contests.slug",
			"contests.title",
			"contests.image",
			"contests.theme",
			"contests.date_end",
			"contests.owner_id",
			"contests.prize",
			"contests.verified",
			"bookmarks.id as bookmark_id",
		])
		.where("contests.owner_id", "=", user_id)
		.orderBy("contests.id", "desc")
		.execute();

	return {
		status: "success",
		result: {
			contests: contests.map((contest) => ({
				contest: transformContestAPI(contest),
				metadata: annotateContestAPI(contest, user_id),
			})),
		},
	};
};
