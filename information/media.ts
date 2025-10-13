import fs from "node:fs/promises";
import { resolve } from "node:path";
import { sendAnimation } from "nyx-bot-client";
import { cache } from "../utils/cache";
import { env } from "../utils/env";

export const media = {
	welcome: {
		gif: {
			file_id: await cache(
				"media.welcome.gif",
				async () => {
					const src = resolve(`${__dirname}/../storage/media/intro-540.mp4`);
					const dst = resolve(`${__dirname}/../storage/covers/intro-540.mp4`);

					if (!(await fs.exists(dst))) {
						await fs.copyFile(src, dst);
					}

					const result = await sendAnimation({
						animation: `${env.BOT_API_FILE_PREFIX}${dst}`,
						chat_id: env.COVER_ARCHIVE_CHAT_ID,
						bot_api_server: env.BOT_API_SERVER,
						bot_token: env.BOT_TOKEN,
					});

					if (result.ok) {
						return result.result.animation!.file_id;
					}

					return undefined;
				},
				1e10,
			),
		},
	},
};
