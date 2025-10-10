import { sleep } from "bun";
import type { Handler } from "elysia";
import type { Insertable } from "kysely";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { limits } from "../../information/limits";
import type { DBSchema } from "../../schema";
import { events } from "../../utils/events";
import { verifyTransaction } from "../../utils/ton";

const validator = z.preprocess(
	(data: any) => {
		return data;
	},
	z.object({
		description: z
			.string()
			.min(limits.form.participate.description.minLength)
			.max(limits.form.participate.description.maxLength + 256),
		wallet: z.string().optional(),
		boc: z.string().optional(),
	}),
);

export const routePOSTContestSubmit: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validator.safeParse(ctx.body);

	if (schema.success) {
		const contest: Pick<DBSchema["contests"], "id" | "fee"> | undefined =
			await db
				.selectFrom("contests")
				.select(["id", "fee"])
				.where("slug", "=", ctx.params.slug)
				.executeTakeFirst();

		if (contest) {
			let payment_valid = true;

			if (contest.fee > 0) {
				payment_valid = false;
				let tries = 0;

				do {
					await sleep(5_000);
					payment_valid = await verifyTransaction(
						schema.data.boc ?? "",
						schema.data.wallet ?? "",
					);
					tries++;
				} while (!payment_valid && tries <= 10);
			}

			const entry = await db
				.selectFrom("submissions")
				.select(["id"])
				.where("contest_id", "=", contest.id)
				.where("user_id", "=", user_id)
				.executeTakeFirst();

			if (!entry && payment_valid) {
				const { data } = schema;

				const value: Insertable<DBSchema["submissions"]> = {
					contest_id: contest.id as any,
					submission: JSON.stringify({
						description: data.description,
						boc: data.boc,
					}),
					user_id: user_id as any,
				};

				await db.insertInto("submissions").values(value).execute();

				events.emit("contestSubmitted", {
					contest_id: contest.id as any,
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
