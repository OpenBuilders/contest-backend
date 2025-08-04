import { sendMessage } from "nyx-bot-client";
import client from "nyx-bot-client/nyx-client";
import { initializeAPI } from "./api/api";
import { handlerCallbackQueryAnalytics } from "./pipelines/callback_query/analytics";
import { handlerCallbackQueryDefault } from "./pipelines/callback_query/default";
import { handlerCallbackQueryFlood } from "./pipelines/callback_query/flood";
import { handlerInlineQueryAnalytics } from "./pipelines/inline_query/analytics";
import { handlerInlineQueryDefault } from "./pipelines/inline_query/default";
import { handlerInlineQueryFlood } from "./pipelines/inline_query/flood";
import { handlerMessageAnalytics } from "./pipelines/message/analytics";
import { handlerMessageDefault } from "./pipelines/message/default";
import { handlerMessageFlood } from "./pipelines/message/flood";
import { updateAnalyticsCounter } from "./utils/analytics";
import { db } from "./utils/database";
import { env } from "./utils/env";
import { initializeEventHandlers } from "./utils/handlers";
import { pools } from "./utils/pool";

client.initialize({
	botConfig: {
		admin_id: env.BOT_ADMIN_ID,
		api: env.BOT_API_SERVER,
		token: env.BOT_TOKEN,
		username: env.BOT_USERNAME,
	},
	pipelines: {
		message: [
			handlerMessageAnalytics,
			handlerMessageFlood,
			handlerMessageDefault,
		],
		callback_query: [
			handlerCallbackQueryAnalytics,
			handlerCallbackQueryFlood,
			handlerCallbackQueryDefault,
		],
		inline_query: [
			handlerInlineQueryAnalytics,
			handlerInlineQueryFlood,
			handlerInlineQueryDefault,
		],
	},
	injections: async () => {
		updateAnalyticsCounter("total");
		const redis = await pools.redis?.acquire();

		return {
			injections: {
				db: db,
				mysql: pools.mysql,
				redis: redis as any,
			},
			onFinish: async () => {
				await pools.redis?.release(redis);
			},
		};
	},
	onStartup: async () => {
		if (env.BOT_ADMIN_ID) {
			sendMessage({
				chat_id: env.BOT_ADMIN_ID,
				text: "Bot started",
				disable_notification: true,
			});
		}
	},
	onShutdown: async () => {
		if (env.BOT_ADMIN_ID) {
			await sendMessage({
				chat_id: env.BOT_ADMIN_ID,
				text: "Bot shutdown",
				disable_notification: true,
			});
		}
	},
	benchmark: false,
});

initializeAPI();

initializeEventHandlers();
