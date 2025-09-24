import type { Kysely } from "kysely";
import type { Pool } from "pg";
import type { RedisClientType } from "redis";
import type { DBSchema } from "../../schema";

export type JWTInjections = {
	user_id: number;
};

export type PoolInjections = {
	pg: Pool;
	redis: RedisClientType;
	db: Kysely<DBSchema>;
};
