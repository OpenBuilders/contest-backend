import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";

import {
	annotateContestAPI,
	transformContestAPI,
} from "../../transformers/contest";

export const routeGETContest: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.leftJoin("bookmarks", (join) =>
			join
				.onRef("bookmarks.contest_id", "=", "contests.id")
				.on("bookmarks.user_id", "=", user_id),
		)
		.select([
			"contests.id",
			"contests.slug",
			"contests.title",
			"contests.image",
			"contests.theme",
			"contests.date_end",
			"contests.owner_id",
			"contests.prize",
			"contests.anonymous",
			"contests.fee",
			"contests.fee_wallet",
			"contests.description",
			"contests.instruction",
			"contests.results",
			"contests.verified",
			"contests.announced",
			"bookmarks.id as bookmark_id",
		])
		.where("contests.slug", "=", ctx.params.slug)
		.executeTakeFirst();

	if (contest) {
		return {
			status: "success",
			result: {
				contest: await transformContestAPI(contest, undefined, user_id),
				metadata: await annotateContestAPI(contest, user_id),
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};
