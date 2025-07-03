import { HMAC } from "fast-sha256";
import { env } from "../../utils/env";

const HMAC_KEY = new HMAC(new TextEncoder().encode("WebAppData"))
	.update(new TextEncoder().encode(env.BOT_TOKEN))
	.digest();

export const validateInitDataHash = async (data: string | object) => {
	const initData = typeof data === "string" ? JSON.parse(data) : data;
	if (!initData) return false;

	const { hash } = initData;
	delete initData.hash;

	const initDataString = Object.keys(initData)
		.sort()
		.map(
			(key) =>
				`${key}=${typeof initData[key] === "object" ? JSON.stringify(initData[key], null, 0) : initData[key]}`,
		)
		.join("\n")
		.replace(/\//g, "\\/");

	const result = new HMAC(HMAC_KEY)
		.update(new TextEncoder().encode(initDataString))
		.digest()
		.toHex();

	return result === hash;
};

export const validateInitDataTTL = (data: string | object) => {
	const initData = typeof data === "string" ? JSON.parse(data) : data;
	if (!initData) return false;

	return initData.auth_date >= Math.trunc(Date.now() / 1000) - env.API_AUTH_TTL;
};
