import type Elysia from "elysia";
import { db } from "../../utils/database";
import { pools } from "../../utils/pool";

export const pluginPools = (app: Elysia) =>
	app
		.derive(async () => {
			const redis = await pools.redis?.acquire();

			return {
				mysql: pools.mysql,
				redis: redis,
				db: db,
			};
		})
		.onAfterHandle(async ({ redis }) => {
			await pools.redis?.release(redis);
		});
