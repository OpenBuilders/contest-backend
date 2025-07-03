import type { Handler } from "elysia";
import { createSigner } from "fast-jwt";
import { env } from "../../utils/env";
import { validateInitDataHash, validateInitDataTTL } from "../utils/tma";

const jwtSigner = createSigner({
	key: env.API_JWT_SECRET ?? "",
	expiresIn: `${env.API_AUTH_TTL}s`,
});

export const routePOSTAuthorize: Handler = async (ctx) => {
	const initData = JSON.parse((ctx.body as any).initDataUnsafe ?? "");

	if (initData) {
		initData.user = JSON.parse(initData.user);
		const validInitData = await validateInitDataHash(initData);

		if (validInitData && validateInitDataTTL(initData)) {
			return {
				status: "success",
				result: {
					token: jwtSigner({
						user_id: initData.user.id,
					}),
				},
			};
		}
	}

	return {
		status: "failed",
		result: "invalid-init-data",
	};
};
