import { Kysely, PostgresDialect } from "kysely";
import type { DBSchema } from "../schema";
import { pools } from "./pool";

export const db = new Kysely<DBSchema>({
	dialect: new PostgresDialect({
		pool: pools.pg,
	}),
});
