import z from "zod";

const envScheme = z.object({
	BOT_TOKEN: z.string().nonempty(),
	BOT_USERNAME: z.string().nonempty(),
	BOT_ADMIN_ID: z.coerce.number().optional(),
	BOT_API_SERVER: z.string().optional(),

	POOL_SIZE_REDIS: z.coerce.number().optional(),
	POOL_SIZE_PGSQL: z.coerce.number().optional(),

	PGSQL_USER: z.string().nonempty().optional(),
	PGSQL_NAME: z.string().nonempty().optional(),
	PGSQL_PASS: z.string().nonempty().optional(),
	PGSQL_HOST: z.string().nonempty().optional(),
	PGSQL_PORT: z.coerce.number().default(5432),

	REDIS_HOST: z.string().nonempty().default("127.0.0.1"),
	REDIS_PORT: z.coerce.number().default(6379),

	API_HOST: z.string().nonempty().default("127.0.0.1"),
	API_PORT: z.coerce.number().optional(),
	API_AUTH_TTL: z.coerce.number().default(3600),
	API_JWT_SECRET: z.string().nonempty().optional(),
	API_VERSION: z.string().nonempty().default("0.0.0"),

	WEBHOOK_SECRET: z.string().nonempty().optional(),
	WEBHOOK_URL: z.url(),

	MINIAPP_URL: z.url(),
	MINIAPP_SLUG: z.string().nonempty(),

	COVER_ARCHIVE_CHAT_ID: z.coerce.number().negative(),
	MASTER_WALLET: z.string().nonempty().optional(),

	TON_CLIENT_ENDPOINT_URL: z.string().nonempty(),
	TON_CLIENT_API_KEY: z.string().nonempty().optional(),
});

export const env: z.infer<typeof envScheme> = envScheme.parse(import.meta.env);
