import { beginCell } from "@ton/ton";
import type { Handler } from "elysia";
import z from "zod";
import type { JWTInjections, PoolInjections } from "../../api";
import { generateUserIDHash, verifyTonProof } from "../../utils/hash";

const validator = z.preprocess(
	(data: any) => {
		if (data.ton_proof) {
			data.ton_proof = JSON.parse(data.ton_proof);
		}

		return data;
	},
	z.object({
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

	const schema = validator.safeParse(ctx.body);

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

export const routeGETContestTonProofPayloadCreate: Handler = async (ctx) => {
	const { user_id }: JWTInjections & PoolInjections = ctx as any;

	return {
		status: "success",
		result: {
			payload: generateUserIDHash(user_id),
		},
	};
};
