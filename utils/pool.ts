import genereicPool from "generic-pool";
import { createClientPool } from "redis";
import { env } from "./env";
import { pg } from "./pg";

export const pools = {
	pg: pg,
	redis: createClientPool(
		{
			socket: {
				host: env.REDIS_HOST,
				port: env.REDIS_PORT,
			},
		},
		{
			minimum: 1,
			maximum: env.POOL_SIZE_REDIS,
			cleanupDelay: 30_000,
		},
	),
	sample: genereicPool.createPool(
		{
			create: async () => {},
			destroy: async () => {},
		},
		{
			min: 1,
			max: 1,
			idleTimeoutMillis: 30_000,
		},
	),
};

await pools.redis.connect();
