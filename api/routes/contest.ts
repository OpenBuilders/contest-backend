import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";
import type { DBSchema } from "../../schema";
import { transformContestAPI } from "../../transformers/contest";

export const routePOSTContest: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest: Partial<DBSchema["contests"]> | undefined = await db
		.selectFrom("contests")
		.select([
			"slug",
			"title",
			"image",
			"theme",
			"date_end",
			"owner_id",
			"prize",
			"anonymous",
			"fee",
			"description",
		])
		.where("slug", "=", ctx.params.slug)
		.executeTakeFirst();

	if (contest) {
		return {
			status: "success",
			result: {
				contest: transformContestAPI(contest, user_id),
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};
