import { Kysely, MysqlDialect } from "kysely";
import type { DBSchema } from "../schema";
import { pools } from "./pool";

export const db = new Kysely<DBSchema>({
	dialect: new MysqlDialect({
		pool: pools.mysql,
	}),
});
