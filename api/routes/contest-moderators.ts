import type { Handler } from "elysia";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { generateRandomHash } from "../../helpers/string";
import { transformContestAPI } from "../../transformers/contest";
import { events } from "../../utils/events";

export const routeGETContestModerators: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["id", "slug_moderator", "title"])
		.where("slug", "=", ctx.params.slug)
		.where("owner_id", "=", user_id)
		.executeTakeFirst();

	if (contest) {
		const moderators = await db
			.selectFrom("users")
			.innerJoin("moderators", "users.user_id", "moderators.user_id")
			.where("moderators.contest_id", "=", contest.id)
			.select([
				"users.user_id",
				"users.first_name",
				"users.last_name",
				"users.profile_photo",
			])
			.execute();

		return {
			status: "success",
			result: {
				title: contest.title,
				slug_moderator: contest.slug_moderator,
				moderators: moderators,
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};

export const routeGETContestModeratorsInfo: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["title", "image", "theme", "verified", "slug", "id"])
		.where("slug_moderator", "=", ctx.params.slug)
		.where("owner_id", "!=", user_id)
		.executeTakeFirst();

	if (contest) {
		const moderator = await db
			.selectFrom("moderators")
			.select(["id"])
			.where("user_id", "=", user_id)
			.where("contest_id", "=", contest.id)
			.executeTakeFirst();

		if (!moderator) {
			return {
				status: "success",
				result: {
					contest: await transformContestAPI(contest),
				},
			};
		}
	}

	return {
		status: "failed",
		result: {},
	};
};

export const routePOSTContestModeratorsJoin: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["id"])
		.where("slug_moderator", "=", ctx.params.slug)
		.where("owner_id", "!=", user_id)
		.executeTakeFirst();

	if (contest) {
		const moderator = await db
			.selectFrom("moderators")
			.select(["id"])
			.where("user_id", "=", user_id)
			.where("contest_id", "=", contest.id)
			.executeTakeFirst();

		if (!moderator) {
			await db
				.insertInto("moderators")
				.values({
					user_id: user_id,
					contest_id: contest.id,
				})
				.execute();

			events.emit("moderatorJoined", {
				contest_id: contest.id,
				user_id: user_id,
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

export const routePOSTContestModeratorsRevoke: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["id"])
		.where("slug", "=", ctx.params.slug)
		.where("owner_id", "=", user_id)
		.executeTakeFirst();

	if (contest) {
		const slug_moderator = generateRandomHash();

		await db
			.updateTable("contests")
			.set({
				slug_moderator,
			})
			.where("id", "=", contest.id)
			.execute();

		events.emit("moderatorsLinkRevoked", {
			contest_id: contest.id,
			user_id: user_id,
		});

		return {
			status: "success",
			result: {
				slug_moderator,
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};

const validatorModeratorsRemove = z.preprocess(
	(data: any) => data,
	z.object({
		user_id: z.coerce.number(),
	}),
);

export const routePOSTContestModeratorsRemove: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorModeratorsRemove.safeParse(ctx.body);

	if (schema.success) {
		const contest = await db
			.selectFrom("contests")
			.select(["id"])
			.where("slug", "=", ctx.params.slug)
			.where("owner_id", "=", user_id)
			.executeTakeFirst();

		if (contest) {
			await db
				.deleteFrom("moderators")
				.where("contest_id", "=", contest.id)
				.where("user_id", "=", schema.data.user_id)
				.execute();

			events.emit("moderatorRemoved", {
				contest_id: contest.id,
				user_id: schema.data.user_id,
			});

			return await routeGETContestModerators(ctx);
		}
	}

	return {
		status: "failed",
		result: {},
	};
};
