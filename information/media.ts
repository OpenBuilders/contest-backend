import fs from "node:fs/promises";
import { sendAnimation } from "nyx-bot-client";
import { generateRandomHash } from "../helpers/string";
import { cache } from "../utils/cache";
import { env } from "../utils/env";
import { storage } from "../utils/storage";

export const media = {
	welcome: {
		gif: {
			file_id: await cache(
				"media.welcome.gif",
				async () => {
					const key = `covers/${generateRandomHash()}`;
					await storage.write(
						key,
						await fs.readFile(`${__dirname}/../storage/media/intro-540.mp4`),
						"video/mp4",
					);
					try {
						const result = await sendAnimation({
							animation: storage.photo(key),
							chat_id: env.COVER_ARCHIVE_CHAT_ID,
							bot_api_server: env.BOT_API_SERVER,
							bot_token: env.BOT_TOKEN,
						});
						if (result.ok) return result.result.animation!.file_id;
					} finally {
						await storage.delete(key);
					}

					return undefined;
				},
				1e10,
			),
		},
	},
};
