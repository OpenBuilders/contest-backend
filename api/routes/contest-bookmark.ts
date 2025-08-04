import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";
import { events } from "../../utils/events";

export const routePOSTContestBookmark: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["id"])
		.where("slug", "=", ctx.params.slug)
		.executeTakeFirst();

	if (contest) {
		let bookmarked = false;

		const bookmark = await db
			.selectFrom("bookmarks")
			.select("id")
			.where("user_id", "=", user_id)
			.where("contest_id", "=", contest.id)
			.executeTakeFirst();

		if (bookmark) {
			await db
				.deleteFrom("bookmarks")
				.where("user_id", "=", user_id)
				.where("contest_id", "=", contest.id)
				.executeTakeFirst();

			bookmarked = false;
		} else {
			await db
				.insertInto("bookmarks")
				.values({
					user_id,
					contest_id: contest.id,
				})
				.execute();

			bookmarked = true;
		}

		events.emit("contestBookmarked", {
			contest_id: contest.id!,
			user_id,
		});

		return {
			status: "success",
			result: {
				bookmarked,
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};
