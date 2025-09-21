import { beginCell } from "@ton/ton";
import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";

export const routePOSTContestTransactionCreate: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contest = await db
		.selectFrom("contests")
		.select(["id", "slug"])
		.where("slug", "=", ctx.params.slug)
		.executeTakeFirst();

	if (contest) {
		const body = {
			master: beginCell()
				.storeUint(0, 32)
				.storeStringTail(`contest-${contest.slug}-${user_id}`)
				.endCell(),
			target: beginCell()
				.storeUint(0, 32)
				.storeStringTail(`contest-${contest.slug}-${user_id}`)
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

	return {
		status: "failed",
		result: {},
	};
};
