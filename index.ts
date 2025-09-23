import { sendMessage } from "nyx-bot-client";
import client from "nyx-bot-client/nyx-client";
import { initializeAPI } from "./api/api";
import { handlerCallbackQueryAnalytics } from "./pipelines/callback_query/analytics";
import { handlerCallbackQueryContest } from "./pipelines/callback_query/contest";
import { handlerCallbackQueryDefault } from "./pipelines/callback_query/default";
import { handlerCallbackQueryFlood } from "./pipelines/callback_query/flood";
import { handlerInlineQueryAnalytics } from "./pipelines/inline_query/analytics";
import { handlerInlineQueryContest } from "./pipelines/inline_query/contest";
import { handlerInlineQueryFlood } from "./pipelines/inline_query/flood";
import { handlerInlineQueryNotFound } from "./pipelines/inline_query/not-found";
import { handlerMessageAnalytics } from "./pipelines/message/analytics";
import { handlerMessagePrivate } from "./pipelines/message/private";
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
		message: [handlerMessageAnalytics, handlerMessagePrivate],
		callback_query: [
			handlerCallbackQueryAnalytics,
			handlerCallbackQueryFlood,
			handlerCallbackQueryContest,
			handlerCallbackQueryDefault,
		],
		inline_query: [
			handlerInlineQueryAnalytics,
			handlerInlineQueryFlood,
			handlerInlineQueryContest,
			handlerInlineQueryNotFound,
		],
	},
	injections: async () => {
		updateAnalyticsCounter("total");

		return {
			injections: {
				db: db,
				mysql: pools.mysql,
				redis: pools.redis,
			},
			onFinish: async () => {},
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
	redis: {
		host: env.REDIS_HOST,
		port: env.REDIS_PORT,
	},
	benchmark: false,
});

initializeAPI();

initializeEventHandlers();
