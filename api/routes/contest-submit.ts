import { sleep } from "bun";
import type { Handler } from "elysia";
import type { Insertable } from "kysely";
import { sendMessage } from "nyx-bot-client";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { limits } from "../../information/limits";
import type { DBSchema } from "../../schema";
import { db } from "../../utils/database";
import { events } from "../../utils/events";
import { t } from "../../utils/i18n";
import { pools } from "../../utils/pool";
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
			const entry = await db
				.selectFrom("submissions")
				.select(["id"])
				.where("contest_id", "=", contest.id)
				.where("user_id", "=", user_id)
				.executeTakeFirst();

			if (!entry) {
				const { data } = schema;

				const value: Insertable<DBSchema["submissions"]> = {
					contest_id: contest.id as any,
					submission: JSON.stringify({
						description: data.description,
						boc: data.boc,
					}),
					user_id: user_id as any,
					status: contest.fee > 0 ? 0 : 1,
				};

				await db.insertInto("submissions").values(value).execute();

				if (value.status === 0) {
					const entry = await db
						.selectFrom("submissions")
						.select(["id"])
						.where("contest_id", "=", contest.id)
						.where("user_id", "=", user_id)
						.executeTakeFirst();

					await pools.redis.set(
						`submission-pending-${entry?.id}`,
						JSON.stringify({
							wallet: data.wallet,
							boc: data.boc,
							time: Date.now() / 1_000,
						}),
					);

					return {
						status: "success",
						result: {
							processed: false,
						},
					};
				} else {
					events.emit("contestSubmitted", {
						contest_id: contest.id as any,
						user_id,
					});

					return {
						status: "success",
						result: {
							processed: true,
						},
					};
				}
			}
		}
	}

	return {
		status: "failed",
		result: {},
	};
};

const submissionPaymentsProcessor = setInterval(async () => {
	const now = Date.now() / 1_000;

	for (const key of await pools.redis.keys("submission-pending-*")) {
		const id = key.replace("submission-pending-", "");
		const params = JSON.parse((await pools.redis.get(key)) ?? "{}");

		const submission = await db
			.selectFrom("submissions")
			.selectAll()
			.where("id", "=", Number.parseInt(id, 10))
			.executeTakeFirst();

		if (submission) {
			if (params.time >= now - 3600) {
				if (await verifyTransaction(params.boc, params.wallet)) {
					await pools.redis.del(key);

					await db
						.updateTable("submissions")
						.set({
							status: 1,
						})
						.where("id", "=", Number.parseInt(id, 10))
						.execute();

					events.emit("contestSubmitted", {
						contest_id: submission.contest_id,
						user_id: Number.parseInt(submission.user_id, 10),
					});
				}

				await sleep(1_000);
			} else {
				await pools.redis.del(key);

				await db
					.deleteFrom("submissions")
					.where("id", "=", Number.parseInt(id, 10))
					.execute();

				const contest = await db
					.selectFrom("contests")
					.select(["title"])
					.where("id", "=", submission.contest_id)
					.executeTakeFirst();

				sendMessage({
					chat_id: submission.user_id,
					text: t("en", "notifications.failedSubmit.text", {
						name: contest?.title ?? "Unknown",
					}),
				});
			}
		} else {
			await pools.redis.del(key);
		}
	}
}, 10_000);
