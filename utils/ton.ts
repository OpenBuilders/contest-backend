import { TonClient } from "@ton/ton";
import { env } from "./env";

export const tonClient = new TonClient({
	endpoint: env.TON_CLIENT_ENDPOINT_URL,
	apiKey: env.TON_CLIENT_API_KEY,
});
