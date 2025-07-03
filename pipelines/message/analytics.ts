import type { BotPipeline } from "nyx-bot-client";
import { NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../schema";
import { updateAnalyticsCounter } from "../../utils/analytics";

export const handlerMessageAnalytics: BotPipeline<"message", DBSchema> = async (
	message,
) => {
	updateAnalyticsCounter("messages");

	if (message.chat.type === "private") {
		updateAnalyticsCounter("messages_private");
	} else if (message.chat.type === "channel") {
		updateAnalyticsCounter("messages_channel");
	} else if (
		message.chat.type === "group" ||
		message.chat.type === "supergroup"
	) {
		updateAnalyticsCounter("messages_group");
	}

	return NyxResponse.Ok;
};
