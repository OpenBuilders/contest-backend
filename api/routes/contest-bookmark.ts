import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";

export const routePOSTContestBookmark: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	let bookmarked = false;

	const bookmark = await db
		.selectFrom("bookmarks")
		.select("id")
		.where("user_id", "=", user_id)
		.where("contest_id", "=", ctx.params.id)
		.executeTakeFirst();

	if (bookmark) {
		await db
			.deleteFrom("bookmarks")
			.where("user_id", "=", user_id)
			.where("contest_id", "=", ctx.params.id)
			.executeTakeFirst();

		bookmarked = false;
	} else {
		const contest = await db
			.selectFrom("contests")
			.select(["id"])
			.where("id", "=", ctx.params.id)
			.executeTakeFirst();

		if (contest) {
			await db
				.insertInto("bookmarks")
				.values({
					user_id,
					contest_id: ctx.params.id,
				})
				.execute();

			bookmarked = true;
		}
	}

	return {
		status: "success",
		result: {
			bookmarked,
		},
	};
};
