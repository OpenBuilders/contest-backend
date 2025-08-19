import type { Handler } from "elysia";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { limits } from "../../information/limits";
import type { Placement } from "../../schema";
import {
	annotateSubmission,
	transformSubmission,
} from "../../transformers/submission";
import { events } from "../../utils/events";
import { randomLong } from "../../utils/number";

export const routeGETContestResults: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["id", "results", "owner_id", "announced"])
		.where("slug", "=", ctx.params.slug)
		.where("owner_id", "=", user_id)
		.executeTakeFirst();

	if (contest) {
		const placements = JSON.parse(contest.results);

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
				placements: placements,
				submissions: submissions.map((submission) => ({
					submission: transformSubmission(submission),
					metadata: annotateSubmission(submission, user_id),
				})),
				announced: Boolean(contest.announced),
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};

const validatorContestPlacementCreate = z.preprocess(
	(data: any) => {
		data.submissions = JSON.parse(data.submissions);

		return data;
	},
	z.object({
		name: z
			.string()
			.min(limits.form.placement.name.minLength)
			.max(limits.form.placement.name.maxLength),
		prize: z
			.string()
			.min(limits.form.placement.prize.minLength)
			.max(limits.form.placement.prize.maxLength)
			.optional(),
		submissions: z.array(z.number()),
	}),
);

export const routePOSTContestPlacementCreate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorContestPlacementCreate.safeParse(ctx.body);

	if (schema.success) {
		const contest = await db
			.selectFrom("contests")
			.select(["results"])
			.where("slug", "=", ctx.params.slug)
			.where("owner_id", "=", user_id)
			.executeTakeFirst();

		if (contest) {
			const { data } = schema;

			const results = JSON.parse(contest.results);
			results.push({
				id: randomLong(),
				name: data.name,
				prize: data.prize,
				submissions: data.submissions,
			});

			await db
				.updateTable("contests")
				.set({
					results: JSON.stringify(results),
				})
				.where("slug", "=", ctx.params.slug)
				.where("owner_id", "=", user_id)
				.execute();

			return routeGETContestResults(ctx);
		}
	}

	return {
		status: "failed",
		result: {},
	};
};

const validatorContestPlacementOrder = z.preprocess(
	(data: any) => {
		if (typeof data === "object") {
			const placements = JSON.parse(data.placements ?? "[]");

			data.placements = placements;
		}

		return data;
	},
	z.object({
		placements: z.array(
			z.object({
				id: z.number(),
				name: z
					.string()
					.min(limits.form.placement.name.minLength)
					.max(limits.form.placement.name.maxLength),
				prize: z
					.string()
					.min(limits.form.placement.prize.minLength)
					.max(limits.form.placement.prize.maxLength)
					.optional(),
				submissions: z.array(z.number()),
			}),
		),
	}),
);

export const routePOSTContestPlacementOrder: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorContestPlacementOrder.safeParse(ctx.body);

	if (schema.success) {
		const {
			data: { placements: results },
		} = schema;

		await db
			.updateTable("contests")
			.set({
				results: JSON.stringify(results),
			})
			.where("slug", "=", ctx.params.slug)
			.where("owner_id", "=", user_id)
			.execute();

		return routeGETContestResults(ctx);
	}

	return {
		status: "failed",
		result: {},
	};
};

const validatorContestPlacementUpdate = z.preprocess(
	(data: any) => {
		data.submissions = JSON.parse(data.submissions);

		return data;
	},
	z.object({
		id: z.coerce.number(),
		name: z
			.string()
			.min(limits.form.placement.name.minLength)
			.max(limits.form.placement.name.maxLength),
		prize: z
			.string()
			.min(limits.form.placement.prize.minLength)
			.max(limits.form.placement.prize.maxLength)
			.optional(),
		submissions: z.array(z.number()),
	}),
);

export const routePOSTContestPlacementUpdate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorContestPlacementUpdate.safeParse(ctx.body);

	if (schema.success) {
		const contest = await db
			.selectFrom("contests")
			.select(["results"])
			.where("slug", "=", ctx.params.slug)
			.where("owner_id", "=", user_id)
			.executeTakeFirst();

		if (contest) {
			const { data } = schema;

			const results: Placement[] = JSON.parse(contest.results as any);
			const submission_index = results.findIndex(
				(i) => i.id === data.id && i.id === Number.parseInt(ctx.params.id!),
			);

			if (submission_index > -1) {
				results[submission_index] = data;

				await db
					.updateTable("contests")
					.set({
						results: JSON.stringify(results),
					})
					.where("slug", "=", ctx.params.slug)
					.where("owner_id", "=", user_id)
					.execute();

				return routeGETContestResults(ctx);
			}
		}
	}

	return {
		status: "failed",
		result: {},
	};
};

export const routePOSTContestPlacementDelete: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["results"])
		.where("slug", "=", ctx.params.slug)
		.where("owner_id", "=", user_id)
		.executeTakeFirst();

	if (contest) {
		const results: Placement[] = JSON.parse(contest.results as any);
		const submission_index = results.findIndex(
			(i) => i.id === Number.parseInt(ctx.params.id!),
		);

		if (submission_index > -1) {
			results.splice(submission_index, 1);

			await db
				.updateTable("contests")
				.set({
					results: JSON.stringify(results),
				})
				.where("slug", "=", ctx.params.slug)
				.where("owner_id", "=", user_id)
				.execute();

			return routeGETContestResults(ctx);
		}
	}

	return {
		status: "failed",
		result: {},
	};
};

export const routePOSTContestResultsAnnounce: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["id", "announced"])
		.where("slug", "=", ctx.params.slug)
		.where("owner_id", "=", user_id)
		.executeTakeFirst();

	if (contest && !contest.announced) {
		await db
			.updateTable("contests")
			.set({
				announced: 1,
			})
			.where("slug", "=", ctx.params.slug)
			.where("owner_id", "=", user_id)
			.executeTakeFirst();

		events.emit("contestAnnounced", {
			contest_id: contest.id,
			user_id,
		});

		return {
			status: "success",
			result: {},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};
