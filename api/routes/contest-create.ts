import { writeFile } from "node:fs/promises";
import type { Handler } from "elysia";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { generateRandomHash } from "../../helpers/string";
import { limits } from "../../information/limits";
import type { DBSchema } from "../../schema";
import { domPurify } from "../../utils/dompurify";
import { events } from "../../utils/events";
import { normalizeImageToWebP } from "../../utils/image";

const validator = z.preprocess(
	(data: any) => {
		data.date = JSON.parse(data.date);
		data.theme = JSON.parse(data.theme);
		data.fee = Number.parseInt(data.fee, 10);
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
			.max(limits.form.create.instruction.maxLength)
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
			.min(limits.form.create.fee.min)
			.max(limits.form.create.fee.max),
		fee_wallet: z
			.string()
			.regex(/^(-?\d+):[0-9a-fA-F]{64}$/)
			.optional(),
		anonymous: z.boolean(),
		image: z.instanceof(File).optional(),
	}),
);

export const routePOSTContestCreate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validator.safeParse(ctx.body);

	if (schema.success) {
		const contests = await db
			.selectFrom("contests")
			.select(["id"])
			.where("owner_id", "=", user_id)
			.execute();

		if (contests.length <= 64) {
			const { data } = schema;

			const slug = generateRandomHash();
			const slug_moderator = generateRandomHash();

			const value: DBSchema["contests"] = {
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
				instruction: data.instruction,
				anonymous: data.anonymous ? 1 : 0,
				date_end: Math.trunc(data.date.end / 1_000),
				fee: data.fee,
				fee_wallet: data.fee_wallet,
				owner_id: user_id,
				prize: data.prize ?? undefined,
				theme: data.theme,
				moderators: [],
				verified: 0,
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
			}

			value.theme = JSON.stringify(value.theme) as any;
			value.moderators = JSON.stringify(value.moderators) as any;

			await db.insertInto("contests").values(value).execute();

			const contest = await db
				.selectFrom("contests")
				.select(["id"])
				.where("slug", "=", slug)
				.executeTakeFirst();

			events.emit("contestCreated", {
				contest_id: contest!.id!,
				user_id,
				notify: true,
			});

			return {
				status: "success",
				result: {
					slug: slug,
				},
			};
		}
	}

	return {
		status: "failed",
		result: {},
	};
};
