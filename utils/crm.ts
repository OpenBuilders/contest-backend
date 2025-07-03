import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import type { BotPipeline } from "nyx-bot-client";
import { NyxResponse } from "nyx-bot-client";
import type { DBDPXTGCRM, DBSchema } from "../schema";
import { env } from "./env";

const CRMUsers: { [key: number]: number } = {};

export const handlerMessageTGCRM: BotPipeline<"message", DBSchema> = async (
	message,
) => {
	if (message.chat.type === "private" && message.from) {
		CRMUsers[message.from.id] = Math.trunc(Date.now() / 1000);
	}

	return NyxResponse.Ok;
};

setInterval(async () => {
	const botId = env.BOT_TOKEN.split(":")[0];
	if (!botId) return;

	const uids = Object.keys(CRMUsers);
	if (uids.length === 0) return;

	const pool = mysql.createPool({
		host: env.MYSQL_HOST,
		user: env.MYSQL_USER,
		database: "DPXTGCRM",
		password: env.MYSQL_PASS,
		connectionLimit: 2,
	});

	const db = new Kysely<DBDPXTGCRM>({
		dialect: new MysqlDialect({
			pool,
		}),
	});

	pool.execute(`
         CREATE TABLE IF NOT EXISTS DPXTGCRM.${botId} (
            id INT NOT NULL AUTO_INCREMENT,
            user_id VARCHAR(16) NOT NULL,
            date INT NOT NULL,
            last_message_date INT NOT NULL,
            PRIMARY KEY (id)
         ) ENGINE = InnoDB
	    `);

	const userIds = (
		await db
			.selectFrom(botId)
			.select(["user_id"])
			.where("user_id", "in", uids)
			.execute()
	).map((item) => item.user_id);

	for (const id of uids) {
		if (userIds.includes(id)) {
			await db
				.updateTable(botId)
				.set("last_message_date", CRMUsers[id as any]!)
				.where("user_id", "=", id)
				.execute();
		} else {
			await db
				.insertInto(botId)
				.values({
					user_id: id,
					date: CRMUsers[id as any]!,
					last_message_date: CRMUsers[id as any]!,
				})
				.execute();
		}

		delete CRMUsers[id as any];
	}

	db.destroy();
}, 30 * 60_000);
