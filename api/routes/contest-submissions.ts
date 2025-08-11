import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";
import {
	annotateSubmission,
	transformSubmission,
} from "../../transformers/submission";

export const routeGETContestSubmissions: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["contests.id", "contests.owner_id"])
		.where("slug", "=", ctx.params.slug)
		.where((eb) =>
			eb.or([
				eb("contests.owner_id", "=", user_id),
				eb.exists(
					eb
						.selectFrom("moderators")
						.whereRef("moderators.contest_id", "=", "contests.id")
						.where("moderators.user_id", "=", user_id)
						.selectAll(),
				),
			]),
		)
		.executeTakeFirst();

	if (contest) {
		const fields = [
			"users.anonymous_profile",
			"submissions.submission",
			"submissions.id",
			"submissions.likes",
			"submissions.dislikes",
		];

		if (contest.owner_id === user_id) {
			fields.push(
				"users.user_id",
				"users.first_name",
				"users.last_name",
				"users.profile_photo",
			);
		}

		const submissions = await db
			.selectFrom("users")
			.innerJoin("submissions", "users.user_id", "submissions.user_id")
			.where("submissions.contest_id", "=", contest.id)
			.select(fields)
			.orderBy("submissions.id", "desc")
			.execute();

		return {
			status: "success",
			result: {
				submissions: submissions.map((submission) => ({
					submission: transformSubmission(submission),
					metadata: annotateSubmission(submission, user_id),
				})),
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};
