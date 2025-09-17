import type { Handler } from "elysia";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { limits } from "../../information/limits";
import type { DBSchema } from "../../schema";
import { transformContestAPI } from "../../transformers/contest";
import { domPurify } from "../../utils/dompurify";
import { events } from "../../utils/events";

export const routeGETContestOptions: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["title", "prize", "fee", "description"])
		.where("slug", "=", ctx.params.slug)
		.where("owner_id", "=", user_id)
		.executeTakeFirst();

	if (contest) {
		return {
			status: "success",
			result: {
				contest: await transformContestAPI(contest),
			},
		};
	}

	return {
		status: "failed",
		result: {},
	};
};

const validatorContestOptionsUpdate = z.preprocess(
	(data: any) => {
		data.fee = Number.parseInt(data.fee, 10);
		return data;
	},
	z.object({
		title: z
			.string()
			.min(limits.form.create.title.minLength)
			.max(limits.form.create.title.maxLength),
		description: z
			.string()
			.min(limits.form.create.description.minLength)
			.max(limits.form.create.description.maxLength + 256)
			.optional(),
		prize: z
			.string()
			.min(limits.form.create.prize.minLength)
			.max(limits.form.create.prize.maxLength)
			.optional(),
		fee: z
			.number()
			.min(limits.form.create.fee.min)
			.max(limits.form.create.fee.max),
	}),
);

export const routePOSTContestOptionsUpdate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorContestOptionsUpdate.safeParse(ctx.body);

	if (schema.success) {
		const contest = await db
			.selectFrom("contests")
			.select(["id"])
			.where("slug", "=", ctx.params.slug)
			.where("owner_id", "=", user_id)
			.executeTakeFirst();

		if (contest) {
			const { data } = schema;

			const value: Partial<DBSchema["contests"]> = {
				title: data.title,
				description: domPurify.sanitize(data.description ?? "", {
					ALLOWED_TAGS: limits.form.create.description.allowedTags,
					ALLOWED_ATTR: limits.form.create.description.allowedAttrs,
					ALLOW_ARIA_ATTR: false,
					ALLOW_DATA_ATTR: false,
					KEEP_CONTENT: true,
				}),
				fee: data.fee,
				prize: data.prize ?? undefined,
			};

			await db
				.updateTable("contests")
				.set(value)
				.where("slug", "=", ctx.params.slug)
				.where("owner_id", "=", user_id)
				.execute();

			events.emit("contestUpdated", {
				contest_id: contest!.id!,
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
