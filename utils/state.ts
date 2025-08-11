import type { RedisClientType } from "redis";
import { env } from "./env";
import { pools } from "./pool";

type UserState = {
	state?: string;
	params?: any;
};

export const getState = async (
	user_id: number,
	context: string,
	redis?: RedisClientType,
): Promise<UserState> => {
	const connection = redis ?? pools.redis;

	const data = await connection.get(
		`${env.BOT_USERNAME}-state-${context}-${user_id}`,
	);

	if (data) {
		try {
			return JSON.parse(data);
		} catch (_) {}
	}

	return {
		state: undefined,
		params: undefined,
	};
};

export const setState = async (
	user_id: number,
	context: string,
	state?: UserState,
	redis?: RedisClientType,
) => {
	const connection = redis ?? pools.redis;

	await connection.set(
		`${env.BOT_USERNAME}-state-${context}-${user_id}`,
		JSON.stringify(state ?? {}),
	);
};
