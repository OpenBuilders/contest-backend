import type { RedisClientPoolType, RedisClientType } from "redis";
import { env } from "./env";
import { pools } from "./pool";

export const cache = async <T>(
	key: string,
	generator: () => T | Promise<T>,
	ttlMillis: number,
	redis?: RedisClientType | RedisClientPoolType,
): Promise<T> => {
	let client: RedisClientType | RedisClientPoolType = redis!;

	if (!client) {
		client = pools.redis as any;
	}

	const cached = await client.get(`${env.BOT_USERNAME}-${key}`);
	if (cached !== null) {
		try {
			return JSON.parse(cached) as T;
		} catch {
			// continue to regenerate on parse error
		}
	}

	const value = await generator();

	try {
		await client.set(`${env.BOT_USERNAME}-${key}`, JSON.stringify(value), {
			PX: ttlMillis,
		});
	} catch {
		// ignore set errors
	}

	return value;
};
