import type { Handler } from "elysia";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { limits } from "../../information/limits";
import type { DBSchema } from "../../schema";
import { events } from "../../utils/events";

const validator = z.preprocess(
	(data: any) => {
		return data;
	},
	z.object({
		description: z
			.string()
			.min(limits.form.participate.description.minLength)
			.max(limits.form.participate.description.maxLength + 256),
		boc: z.string().optional(),
	}),
);

export const routePOSTContestSubmit: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validator.safeParse(ctx.body);

	if (schema.success) {
		const contest: Pick<DBSchema["contests"], "id"> | undefined = await db
			.selectFrom("contests")
			.select(["id"])
			.where("slug", "=", ctx.params.slug)
			.executeTakeFirst();

		if (contest) {
			const entry = await db
				.selectFrom("submissions")
				.select(["id"])
				.where("contest_id", "=", contest.id)
				.where("user_id", "=", user_id)
				.executeTakeFirst();

			if (!entry) {
				const { data } = schema;

				const value: DBSchema["submissions"] = {
					contest_id: contest.id!,
					submission: JSON.stringify({
						description: data.description,
						boc: data.boc,
					}),
					user_id: user_id,
				};

				// TODO: validate payment

				await db.insertInto("submissions").values(value).execute();

				events.emit("contestSubmitted", {
					contest_id: contest.id!,
					user_id,
				});

				return {
					status: "success",
					result: {},
				};
			}
		}
	}

	return {
		status: "failed",
		result: {},
	};
};
