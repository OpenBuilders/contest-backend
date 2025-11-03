import genereicPool from "generic-pool";
import { Pool } from "pg";
import { createClientPool } from "redis";
import { health } from "../api/routes/health";
import { env } from "./env";
import { logger } from "./logger";

export const pools = {
	pg: new Pool({
		host: env.PGSQL_HOST,
		user: env.PGSQL_USER,
		password: env.PGSQL_PASS,
		port: env.PGSQL_PORT,
		database: env.PGSQL_NAME,
		idleTimeoutMillis: 60 * 60_000, // 1 hour
		max: env.POOL_SIZE_PGSQL,
		min: 1,
	}).addListener("error", () => {
		logger.error("PGSQL", "Exiting due to error");
		health.pg = false;
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
	).addListener("error", () => {
		logger.error("REDIS", "Exiting due to error");
		health.redis = false;
	}),
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
