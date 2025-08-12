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

const validatorContestSubmissionsVote = z.preprocess(
	(data: any) => data,
	z.object({
		type: z.enum(["like", "dislike"]),
	}),
);

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
				.select(["likes", "dislikes"])
				.where("id", "=", ctx.params.id)
				.where("contest_id", "=", contest.id)
				.executeTakeFirst();

			if (submission) {
				const likes = JSON.parse(submission.likes ?? "[]");
				const dislikes = JSON.parse(submission.dislikes ?? "[]");

				const { type } = schema.data;

				let liked = false;
				let disliked = false;

				if (type === "like") {
					const index = likes.indexOf(user_id);

					if (index !== -1) {
						likes.splice(index, 1);
					} else {
						likes.push(user_id);
						liked = true;
					}

					const indexRemove = dislikes.indexOf(user_id);

					if (indexRemove !== -1) {
						dislikes.splice(indexRemove, 1);
					}
				} else if (type === "dislike") {
					const index = dislikes.indexOf(user_id);

					if (index !== -1) {
						dislikes.splice(index, 1);
					} else {
						dislikes.push(user_id);
						disliked = true;
					}

					const indexRemove = likes.indexOf(user_id);

					if (indexRemove !== -1) {
						likes.splice(indexRemove, 1);
					}
				}

				await db
					.updateTable("submissions")
					.set({
						likes: JSON.stringify(likes) as any,
						dislikes: JSON.stringify(dislikes) as any,
					})
					.where("id", "=", ctx.params.id)
					.where("contest_id", "=", contest.id)
					.execute();

				return {
					status: "success",
					result: {
						likes: likes.length,
						dislikes: dislikes.length,
						liked_by_viewer: liked,
						disliked_by_viewer: disliked,
					},
				};
			}
		}
	}

	return {
		status: "failed",
		result: {},
	};
};
