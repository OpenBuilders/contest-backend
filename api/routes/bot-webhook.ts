import type { Handler } from "elysia";
import client from "nyx-bot-client/nyx-client";
import { env } from "../../utils/env";

export const routePOSTBotWebhook: Handler = async (ctx) => {
	if (
		env.WEBHOOK_SECRET === undefined ||
		ctx.headers["x-telegram-bot-api-secret-token"] === env.WEBHOOK_SECRET
	) {
		client.handleUpdateRequest(ctx.body as object);

		return ctx.status(200);
	}

	return {
		status: "failed",
		result: "invalid webhook secret",
	};
};
