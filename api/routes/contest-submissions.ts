import type { Handler } from "elysia";
import z from "zod";
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
			"submissions.created_at",
		];

		if (Number.parseInt(contest.owner_id, 10) === user_id) {
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
				submissions: await Promise.all(
					submissions.map(async (submission) => ({
						submission: await transformSubmission(submission),
						metadata: await annotateSubmission(submission, user_id),
					})),
				),
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};

const validatorContestSubmissionsVote = z.preprocess(
	(data: any) => data,
	z.object({
		type: z.enum(["like", "dislike", "raise"]),
	}),
);

const VoteID = {
	like: 1,
	dislike: 0,
	raise: 2,
};

export const routePOSTContestSubmissionsVote: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorContestSubmissionsVote.safeParse(ctx.body);

	if (schema.success) {
		const contest = await db
			.selectFrom("contests")
			.select(["contests.id"])
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
			const submission = await db
				.selectFrom("submissions")
				.select(["id"])
				.where("id", "=", ctx.params.id)
				.where("contest_id", "=", contest.id)
				.executeTakeFirst();

			if (submission) {
				const { type } = schema.data;
				const vote_id = VoteID[type];

				const vote = await db
					.selectFrom("votes")
					.select(["vote"])
					.where("user_id", "=", user_id)
					.where("submission_id", "=", submission.id)
					.executeTakeFirst();

				if (vote) {
					await db
						.deleteFrom("votes")
						.where("user_id", "=", user_id)
						.where("submission_id", "=", submission.id)
						.execute();

					if (Number.parseInt(vote.vote as any, 10) === vote_id) {
						return await routeGETContestSubmissions(ctx);
					}
				}
				await db
					.insertInto("votes")
					.values({
						user_id,
						submission_id: submission.id,
						vote: vote_id,
					})
					.execute();

				return await routeGETContestSubmissions(ctx);
			}
		}
	}

	return {
		status: "failed",
		result: {},
	};
};
