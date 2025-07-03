import type Elysia from "elysia";
import { t } from "elysia";
import { createVerifier } from "fast-jwt";
import { env } from "../../utils/env";

const jwtVerifier = createVerifier({
	key: env.API_JWT_SECRET ?? "",
});

export const pluginJWT = (app: Elysia) =>
	app
		.guard({
			headers: t.Object({
				authorization: t.String({
					pattern: "^Bearer .+$",
				}),
			}),
		})
		.derive(({ headers }) => {
			const token = headers.authorization!.replace("Bearer ", "");
			try {
				const jwt = jwtVerifier(token);

				if (jwt?.user_id && jwt.exp >= Math.floor(Date.now() / 1000)) {
					return {
						user_id: jwt.user_id,
					};
				}
			} catch {}

			return {
				user_id: undefined,
			};
		})
		.onBeforeHandle(({ user_id }) => {
			if (!user_id) {
				return {
					status: "failed",
					result: "invalid-jwt-token",
				};
			}
		});
