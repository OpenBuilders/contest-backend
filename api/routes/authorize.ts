import type { Handler } from "elysia";
import { createSigner } from "fast-jwt";
import type { PoolInjections } from "../../api";
import dictionary_default from "../../i18n/en";
import type { DBSchema } from "../../schema";
import { transformUserAPI } from "../../transformers/user";
import { env } from "../../utils/env";
import { getRandomItemFromArray } from "../../utils/general";
import { getRandomIntInclusive } from "../../utils/number";
import { validateInitDataHash, validateInitDataTTL } from "../utils/tma";

const jwtSigner = createSigner({
	key: env.API_JWT_SECRET ?? "",
	expiresIn: `${env.API_AUTH_TTL}s`,
});

const anonymous_aliases = {
	adjectives: Object.keys(dictionary_default.aliases.adjectives),
	animals: Object.keys(dictionary_default.aliases.animals),
};

export const routePOSTAuthorize: Handler = async (ctx) => {
	const initData = JSON.parse((ctx.body as any).initDataUnsafe ?? "");

	if (initData) {
		initData.user =
			typeof initData.user === "string"
				? JSON.parse(initData.user)
				: initData.user;
		const validInitData = await validateInitDataHash(initData);

		if (validInitData && validateInitDataTTL(initData)) {
			const { db }: PoolInjections = ctx as any;

			let user: DBSchema["users"] | undefined;

			do {
				user = (await db
					.selectFrom("users")
					.selectAll()
					.where("user_id", "=", initData.user.id)
					.executeTakeFirst()) as DBSchema["users"];

				if (user) {
					const volatileParams = {
						first_name: initData.user.first_name,
						last_name: initData.user.last_name,
						profile_photo: initData.user.photo_url,
						premium: initData.user.is_premium ? 1 : 0,
					};

					if (
						JSON.stringify(volatileParams) !==
						JSON.stringify({
							first_name: user!.first_name,
							last_name: user!.last_name,
							profile_photo: user!.profile_photo,
							premium: user!.premium!,
						})
					) {
						for (const key in volatileParams) {
							// @ts-ignore
							user[key] = volatileParams[key];
						}

						setTimeout(async () => {
							await db
								.updateTable("users")
								.set({
									first_name: initData.user.first_name,
									last_name: initData.user.last_name,
									profile_photo: initData.user.photo_url,
									premium: initData.user.is_premium ? 1 : 0,
								})
								.where("user_id", "=", initData.user.id)
								.execute();
						});
					}
				} else {
					await db
						.insertInto("users")
						.values({
							user_id: initData.user.id,
							first_name: initData.user.first_name,
							last_name: initData.user.last_name,
							anonymous_profile: JSON.stringify([
								getRandomIntInclusive(0, 6),
								getRandomItemFromArray(anonymous_aliases.adjectives)!,
								getRandomItemFromArray(anonymous_aliases.animals)!,
							]) as any,
							language: "en",
							profile_photo: initData.user.photo_url,
							premium: initData.user.is_premium ? 1 : 0,
						})
						.execute();
				}
			} while (!user);

			return {
				status: "success",
				result: {
					token: jwtSigner({
						user_id: initData.user.id,
					}),
					user: transformUserAPI(user),
					version: env.API_VERSION,
				},
			};
		}
	}

	return {
		status: "failed",
		result: "invalid-init-data",
	};
};
