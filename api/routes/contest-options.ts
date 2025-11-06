import { rm, writeFile } from "node:fs/promises";
import type { Handler } from "elysia";
import type { Updateable } from "kysely";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { generateRandomHash } from "../../helpers/string";
import { limits } from "../../information/limits";
import type { DBSchema } from "../../schema";
import { transformContestAPI } from "../../transformers/contest";
import { domPurify } from "../../utils/dompurify";
import { events } from "../../utils/events";
import { normalizeImageToWebP } from "../../utils/image";

export const routeGETContestOptions: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select([
			"slug",
			"title",
			"prize",
			"fee",
			"description",
			"instruction",
			"fee_wallet",
			"theme",
			"date_end",
			"image",
			"anonymous",
		])
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
		data.date = JSON.parse(data.date);
		data.theme = JSON.parse(data.theme);
		data.fee = Number.parseFloat(data.fee);
		data.anonymous = data.anonymous === "true";

		if (data.theme.backdrop && !data.theme.symbol) {
			data.theme.symbol = "symbol-55";
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
		anonymous: z.boolean(),
		image: z.instanceof(File).optional(),
	}),
);

export const routePOSTContestOptionsUpdate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorContestOptionsUpdate.safeParse(ctx.body);

	if (schema.success) {
		const contest = await db
			.selectFrom("contests")
			.select(["id", "image"])
			.where("slug", "=", ctx.params.slug)
			.where("owner_id", "=", user_id)
			.executeTakeFirst();

		if (contest) {
			const { data } = schema;

			const value: Updateable<DBSchema["contests"]> = {
				title: data.title,
				description: domPurify.sanitize(data.description ?? "", {
					ALLOWED_TAGS: limits.form.create.description.allowedTags,
					ALLOWED_ATTR: limits.form.create.description.allowedAttrs,
					ALLOW_ARIA_ATTR: false,
					ALLOW_DATA_ATTR: false,
					KEEP_CONTENT: true,
					IN_PLACE: true,
				}),
				instruction: data.instruction ?? "",
				fee: data.fee,
				prize: data.prize ?? undefined,
				anonymous: Boolean(data.anonymous),
				date_end: Math.trunc(data.date.end / 1_000),
				theme: JSON.stringify(data.theme),
			};

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

				if (contest.image) {
					try {
						await rm(`${__dirname}/../../storage/images/${contest.image}`);
					} catch (_) {}
				}
			}

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
