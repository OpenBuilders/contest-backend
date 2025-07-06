import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";

export const routePOSTContestsMy: Handler = (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	// TODO: Owner, Moderator, Participant
	const contests = [];

	return {
		status: "success",
		result: {
			contests: contests,
		},
	};
};
