import genereicPool from "generic-pool";
import { createPool } from "mysql2";
import { createClientPool } from "redis";
import { env } from "./env";

export const pools = {
	mysql: createPool({
		host: env.MYSQL_HOST,
		user: env.MYSQL_USER,
		database: env.MYSQL_NAME,
		password: env.MYSQL_PASS,
		port: env.MYSQL_PORT,
		connectionLimit: env.POOL_SIZE_MYSQL,
		maxIdle: 1,
		idleTimeout: 60 * 60_000,
	}),
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
