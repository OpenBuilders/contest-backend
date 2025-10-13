import { logOut, setWebhook } from "nyx-bot-client";
import { env } from "./utils/env";

export const initializeWebhook = async () => {
	await logOut({
		bot_api_server: env.BOT_API_SERVER,
		bot_token: env.BOT_TOKEN,
	});

	return setWebhook({
		url: env.WEBHOOK_URL,
		bot_api_server: env.BOT_API_SERVER,
		bot_token: env.BOT_TOKEN,
		secret_token: env.WEBHOOK_SECRET,
	});
};
