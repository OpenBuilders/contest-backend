import { writeFile } from "node:fs/promises";
import { CryptoHasher } from "bun";
import type { Handler } from "elysia";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { limits } from "../../information/limits";
import type { DBSchema } from "../../schema";
import { normalizeImageToWebP } from "../../utils/image";

const validator = z.preprocess(
	(data: any) => {
		data.date = JSON.parse(data.date);
		data.theme = JSON.parse(data.theme);
		data.fee = Number.parseInt(data.fee);
		data.public = data.public === "true";
		data.anonymous = data.anonymous === "true";
		data.category = data.category === "none" ? undefined : data.category;

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
			.max(limits.form.create.description.maxLength)
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
		category: z.string().optional(),
		fee: z
			.number()
			.min(limits.form.create.fee.min)
			.max(limits.form.create.fee.max),
		public: z.boolean(),
		anonymous: z.boolean(),
		image: z.instanceof(File).optional(),
	}),
);

export const routePOSTContestCreate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validator.safeParse(ctx.body);

	if (schema.success) {
		const { data } = schema;

		const slug = CryptoHasher.hash(
			"md5",
			`${Math.random()}-${Date.now()}-${Math.random()}`,
		).toHex();

		const slug_moderator = CryptoHasher.hash(
			"md5",
			`${Math.random()}-${Date.now()}-${Math.random()}`,
		).toHex();

		const value: DBSchema["contests"] = {
			slug: slug,
			slug_moderator: slug_moderator,
			title: data.title,
			description: data.description ?? "",
			category: data.category ?? undefined,
			anonymous: data.anonymous ? 1 : 0,
			date_end: Math.trunc(data.date.end / 1_000),
			fee: data.fee,
			owner_id: user_id,
			prize: data.prize ?? undefined,
			public: data.public ? 1 : 0,
			theme: data.theme,
			moderators: [],
		};

		if (data.image) {
			const fileId = CryptoHasher.hash(
				"md5",
				`${Math.random()}-${Date.now()}-${Math.random()}`,
			).toHex();

			const image = await normalizeImageToWebP(
				Buffer.from(await data.image.arrayBuffer()),
				128,
				128,
			);

			if (image) {
				await writeFile(`${__dirname}/../../storage/images/${fileId}`, image);

				value.image = fileId;
			}
		}

		value.theme = JSON.stringify(value.theme) as any;
		value.moderators = JSON.stringify(value.moderators) as any;

		await db.insertInto("contests").values(value).execute();

		return {
			status: "success",
			result: {
				slug: slug,
			},
		};
	} else {
		return {
			status: "failed",
			result: {},
		};
	}
};
