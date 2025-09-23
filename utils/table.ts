import NyxTable from "nyx-bot-client/utils/table";
import { createClient } from "redis";
import { env } from "./env";

const redisTables = createClient({
	socket: {
		host: env.REDIS_HOST,
		port: env.REDIS_PORT,
	},
});
await redisTables.connect();

export const tableSample: NyxTable<{
	users: number[];
}> = new NyxTable(
	"sample",
	{
		users: [] as number[],
	},
	redisTables as any,
	{
		persistenceDebounceMillis: 250,
		onInternalUpdate: async (table) => {
			console.log("Internal Update", table);
		},
		onExternalUpdate: async (table) => {
			console.log("External Update", table);
		},
	},
);
