import genereicPool from "generic-pool";
import { createPool } from "mysql2";
import { createClient } from "redis";
import { env } from "./env";

export const pools = {
	mysql: createPool({
		host: env.MYSQL_HOST,
		user: env.MYSQL_USER,
		database: env.MYSQL_NAME,
		password: env.MYSQL_PASS,
		connectionLimit: env.POOL_SIZE_MYSQL,
		maxIdle: 1,
		idleTimeout: 60 * 60_000,
	}),
	redis: genereicPool.createPool(
		{
			create: async () => {
				const client = createClient();
				await client.connect();
				return client;
			},
			destroy: async (client) => {
				client.destroy();
			},
			validate: async (client) => {
				try {
					await client.ping();
					return true;
				} catch {
					return false;
				}
			},
		},
		{
			min: 1,
			max: env.POOL_SIZE_REDIS,
			idleTimeoutMillis: 30_000,
		},
	),
};
