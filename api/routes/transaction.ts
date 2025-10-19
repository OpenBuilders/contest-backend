import { beginCell } from "@ton/ton";
import type { Handler } from "elysia";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { generateRandomHash } from "../../helpers/string";
import { limits } from "../../information/limits";
import { generateUserIDHash, verifyTonProof } from "../../utils/hash";

const validatorContestTransactionCreate = z.preprocess(
	(data: any) => {
		if (data.ton_proof) {
			data.ton_proof = JSON.parse(data.ton_proof);
		}

		return data;
	},
	z.object({
		description: z
			.string()
			.min(limits.form.participate.description.minLength)
			.max(limits.form.participate.description.maxLength + 256),
		wallet: z.string().regex(/^(-?\d+):[0-9a-fA-F]{64}$/),
		wallet_initState: z.string(),
		ton_proof: z.object({
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
		}),
	}),
);

export const routePOSTContestTransactionCreate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorContestTransactionCreate.safeParse(ctx.body);

	if (schema.success) {
		const contest = await db
			.selectFrom("contests")
			.select(["id", "slug"])
			.where("slug", "=", ctx.params.slug)
			.executeTakeFirst();

		const ton_proof = await verifyTonProof(
			schema.data.wallet,
			schema.data.ton_proof?.proof,
			schema.data.wallet_initState ?? "",
		);

		if (contest && ton_proof) {
			const body = {
				master: beginCell()
					.storeUint(0, 32)
					.storeStringTail(
						`contest-${contest.slug}-${generateUserIDHash(user_id)}`,
					)
					.endCell(),
				target: beginCell()
					.storeUint(0, 32)
					.storeStringTail(
						`contest-${contest.slug}-${generateUserIDHash(user_id)}`,
					)
					.endCell(),
			};

			return {
				status: "success",
				result: {
					payload: {
						master: body.master.toBoc().toString("base64"),
						target: body.target.toBoc().toString("base64"),
					},
				},
			};
		}
	}

	return {
		status: "failed",
		result: {},
	};
};

const validatorPrecontestTransactionCreate = z.preprocess(
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
		anonymous: z.boolean(),
		fee_wallet: z.string().regex(/^(-?\d+):[0-9a-fA-F]{64}$/),
		fee_wallet_initState: z.string(),
		ton_proof: z.object({
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
		}),
	}),
);

export const routePOSTPrecontestTransactionCreate: Handler = async (ctx) => {
	const { user_id }: JWTInjections & PoolInjections = ctx as any;

	const schema = validatorPrecontestTransactionCreate.safeParse(ctx.body);

	if (schema.success) {
		const ton_proof = await verifyTonProof(
			schema.data.fee_wallet,
			schema.data.ton_proof?.proof,
			schema.data.fee_wallet_initState ?? "",
		);

		if (ton_proof) {
			const hash = generateRandomHash();

			const body = {
				master: beginCell()
					.storeUint(0, 32)
					.storeStringTail(`contest-${hash}-${generateUserIDHash(user_id)}`)
					.endCell(),
			};

			return {
				status: "success",
				result: {
					payload: {
						master: body.master.toBoc().toString("base64"),
					},
				},
			};
		}
	}

	return {
		status: "failed",
		result: {},
	};
};

export const routeGETContestTonProofPayloadCreate: Handler = async (ctx) => {
	const { user_id }: JWTInjections & PoolInjections = ctx as any;

	return {
		status: "success",
		result: {
			payload: generateUserIDHash(user_id),
		},
	};
};
