import type Elysia from "elysia";
import { db } from "../../utils/database";
import { pools } from "../../utils/pool";

export const pluginPools = (app: Elysia) =>
	app
		.derive(async () => {
			return {
				mysql: pools.mysql,
				redis: pools.redis,
				db: db,
			};
		})
		.onAfterHandle(async () => {});
