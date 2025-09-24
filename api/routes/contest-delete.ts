import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";
import { events } from "../../utils/events";

export const routePOSTContestDelete: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["id", "owner_id"])
		.where("slug", "=", ctx.params.slug)
		.executeTakeFirst();

	if (contest) {
		if (Number.parseInt(contest.owner_id, 10) === user_id) {
			events.emit("contestDelete", {
				contest_id: contest.id!,
				user_id,
			});

			return {
				status: "success",
				result: {},
			};
		}
	}

	return {
		status: "failed",
		result: {},
	};
};
