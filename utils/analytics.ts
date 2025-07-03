import { createClient } from "redis";
import { env } from "./env";

type Analytics = {
	startup_time: number;
	requests: {
		total: number;
		messages: number;
		messages_private: number;
		messages_group: number;
		messages_channel: number;
		callback_query: number;
		inline_query: number;
	};
};

export const analytics: Analytics = {
	startup_time: Math.trunc(Date.now() / 1000),
	requests: {
		total: 0,
		messages: 0,
		messages_private: 0,
		messages_group: 0,
		messages_channel: 0,
		callback_query: 0,
		inline_query: 0,
	},
};

export const updateAnalyticsCounter = (index: keyof Analytics["requests"]) => {
	analytics.requests[index]++;
};

setInterval(async () => {
	const redis = createClient();
	await redis.connect();

	const stats = {
		uptime: Math.trunc(Date.now() / 1000) - analytics.startup_time,
		memory: process.memoryUsage(),
		requests: analytics.requests,
	};

	await redis.publish(
		"nyx-analytics",
		JSON.stringify({
			client: env.BOT_USERNAME,
			stats,
		}),
	);

	redis.destroy();
}, 5 * 60_000);
