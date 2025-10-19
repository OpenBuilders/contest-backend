import { writeFile } from "node:fs/promises";
import { sleep } from "bun";
import type { Handler } from "elysia";
import type { Insertable } from "kysely";
import { sendMessage } from "nyx-bot-client";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { generateRandomHash } from "../../helpers/string";
import { limits } from "../../information/limits";
import type { DBSchema } from "../../schema";
import { db } from "../../utils/database";
import { domPurify } from "../../utils/dompurify";
import { events } from "../../utils/events";
import { verifyTonProof } from "../../utils/hash";
import { t } from "../../utils/i18n";
import { normalizeImageToWebP } from "../../utils/image";
import { pools } from "../../utils/pool";
import { verifyTransaction } from "../../utils/ton";

const validator = z.preprocess(
	(data: any) => {
		data.date = JSON.parse(data.date);
		data.theme = JSON.parse(data.theme);
		data.fee = Number.parseFloat(data.fee);
		data.anonymous = data.anonymous === "true";

		if (data.theme.backdrop && !data.theme.symbol) {
			data.theme.symbol = "symbol-55";
		}

		if (data.ton_proof) {
			data.ton_proof = JSON.parse(data.ton_proof);
		}

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
		instruction: z
			.string()
			.min(limits.form.create.instruction.minLength)
			.max(limits.form.create.instruction.maxLength + 256)
			.optional(),
		prize: z
			.string()
			.min(limits.form.create.prize.minLength)
			.max(limits.form.create.prize.maxLength)
			.optional(),
		date: z.object({
			end: z.number(),
		}),
		theme: z.object({
			backdrop: z.number().optional(),
			symbol: z.string().optional(),
		}),
		fee: z
			.number()
			.refine(
				(val) =>
					val === 0 ||
					(val >= limits.form.create.fee.min &&
						val <= limits.form.create.fee.max),
				{
					message: `Fee must be 0 or between ${limits.form.create.fee.min} and ${limits.form.create.fee.max}`,
				},
			),
		fee_wallet: z
			.string()
			.regex(/^(-?\d+):[0-9a-fA-F]{64}$/)
			.optional(),
		fee_wallet_initState: z.string().optional(),
		anonymous: z.boolean(),
		image: z.instanceof(File).optional(),
		ton_proof: z
			.object({
				name: z.string(),
				proof: z.object({
					timestamp: z.number(),
					domain: z.object({
						lengthBytes: z.number(),
						value: z.string(),
					}),
					payload: z.string(),
					signature: z.string(),
				}),
			})
			.optional(),
		boc: z.string().optional(),
	}),
);

export const routePOSTContestCreate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;
	console.log("DEBUG BACKDROP", "body", ctx.body);
	const schema = validator.safeParse(ctx.body);
	console.log("DEBUG BACKDROP", "schema", schema);

	if (schema.success) {
		const contests = await db
			.selectFrom("contests")
			.select(["id"])
			.where("owner_id", "=", user_id)
			.execute();

		const ton_proof = schema.data.fee_wallet
			? await verifyTonProof(
					schema.data.fee_wallet,
					schema.data.ton_proof?.proof,
					schema.data.fee_wallet_initState ?? "",
				)
			: true;

		if (contests.length <= 64 && ton_proof) {
			const { data } = schema;

			const slug = generateRandomHash();
			const slug_moderator = generateRandomHash();

			const value: Insertable<DBSchema["contests"]> = {
				slug: slug,
				slug_moderator: slug_moderator,
				title: data.title,
				description: domPurify.sanitize(data.description ?? "", {
					ALLOWED_TAGS: limits.form.create.description.allowedTags,
					ALLOWED_ATTR: limits.form.create.description.allowedAttrs,
					ALLOW_ARIA_ATTR: false,
					ALLOW_DATA_ATTR: false,
					KEEP_CONTENT: true,
					IN_PLACE: true,
				}),
				instruction: data.instruction ?? null,
				anonymous: Boolean(data.anonymous),
				date_end: Math.trunc(data.date.end / 1_000),
				fee: data.fee,
				fee_wallet: data.fee_wallet ?? null,
				owner_id: user_id,
				prize: data.prize ?? null,
				theme: JSON.stringify(data.theme),
				verified: false,
				status: 0,
			};

			console.log("DEBUG BACKDROP", "value", value);

			if (data.image) {
				const fileId = generateRandomHash();

				const image = await normalizeImageToWebP(
					Buffer.from(await data.image.arrayBuffer()),
					256,
					256,
				);

				if (image) {
					await writeFile(`${__dirname}/../../storage/images/${fileId}`, image);

					value.image = fileId;
				}
			}

			await db.insertInto("contests").values(value).execute();

			await pools.redis.set(
				`contest-pending-${slug}`,
				JSON.stringify({
					wallet: data.fee_wallet,
					boc: data.boc,
					time: Date.now() / 1_000,
				}),
			);

			// const contest = await db
			// 	.selectFrom("contests")
			// 	.select(["id"])
			// 	.where("slug", "=", slug)
			// 	.executeTakeFirst();

			// events.emit("contestCreated", {
			// 	contest_id: contest!.id!,
			// 	user_id,
			// 	notify: true,
			// });

			return {
				status: "success",
				result: {
					// slug: slug,
				},
			};
		}
	}

	return {
		status: "failed",
		result: {},
	};
};

const contestPaymentsProcessor = setInterval(async () => {
	const now = Date.now() / 1_000;

	for (const key of await pools.redis.keys("contest-pending-*")) {
		const slug = key.replace("contest-pending-", "");
		const params = JSON.parse((await pools.redis.get(key)) ?? "{}");

		const contest = await db
			.selectFrom("contests")
			.select(["id", "owner_id", "title"])
			.where("slug", "=", slug)
			.executeTakeFirst();

		if (contest) {
			if (params.time >= now - 3600) {
				if (await verifyTransaction(params.boc, params.wallet)) {
					await pools.redis.del(key);

					await db
						.updateTable("contests")
						.set({
							status: 1,
						})
						.where("slug", "=", slug)
						.execute();

					events.emit("contestCreated", {
						contest_id: contest.id!,
						user_id: Number.parseInt(contest.owner_id, 10),
						notify: true,
					});
				}

				await sleep(1_000);
			} else {
				await pools.redis.del(key);

				await db.deleteFrom("contests").where("slug", "=", slug).execute();

				sendMessage({
					chat_id: contest.owner_id,
					text: t("en", "notifications.failedCreate.text", {
						name: contest.title,
					}),
				});
			}
		} else {
			await pools.redis.del(key);
		}
	}
}, 10_000);
