import { type BotPipeline, NyxResponse } from "nyx-bot-client";
import type { DBSchema } from "../../../schema";
import { env } from "../../../utils/env";
import { handlerGroupModerationFeature } from "./moderation/feature";
import { handlerGroupModerationUnfeature } from "./moderation/unfeature";
import { handlerGroupModerationUnverify } from "./moderation/unverify";
import { handlerGroupModerationVerify } from "./moderation/verify";

const pipelines: BotPipeline<"message", DBSchema>[] = [
	handlerGroupModerationVerify,
	handlerGroupModerationUnverify,
	handlerGroupModerationFeature,
	handlerGroupModerationUnfeature,
];

export const handlerGroupModeration: BotPipeline<"message", DBSchema> = async (
	message,
	injections,
) => {
	if (message.chat.id === env.MODERATION_CHAT_ID) {
		for (const handler of pipelines) {
			const result = await handler(message, injections);

			if (result === NyxResponse.Finish) {
				return NyxResponse.Finish;
			}
		}

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};
