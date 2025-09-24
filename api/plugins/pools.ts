import type Elysia from "elysia";
import { db } from "../../utils/database";
import { pools } from "../../utils/pool";

export const pluginPools = (app: Elysia) =>
	app
		.derive(async () => {
			return {
				pg: pools.pg,
				redis: pools.redis,
				db: db,
			};
		})
		.onAfterHandle(async () => {});
