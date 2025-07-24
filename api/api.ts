import cors from "@elysiajs/cors";
import Elysia from "elysia";
import z from "zod";
import { env } from "../utils/env";
import { pluginJWT } from "./plugins/jwt";
import { pluginPools } from "./plugins/pools";
import { routePOSTAuthorize } from "./routes/authorize";
import { routePOSTBotWebhook } from "./routes/bot-webhook";
import { routePOSTContestCreate } from "./routes/contest-create";
import { routeGETContestImage } from "./routes/contest-image";
import { routePOSTContestsMy } from "./routes/contests";
import { routeGETDefault } from "./routes/default";

export const initializeAPI = async () => {
	z.object({
		API_PORT: z.coerce.number(),
	}).parse(import.meta.env);

	const bareRoutes = new Elysia()
		.post("/bot-webhook", routePOSTBotWebhook)
		.get("/images/:name", routeGETContestImage);

	const jwtGuardedRoutes = new Elysia()
		.use(pluginJWT)
		.post("/contests/my", routePOSTContestsMy)
		.post("/contest/create", routePOSTContestCreate);

	const regularRoutes = new Elysia()
		.get("/", routeGETDefault)
		.post("/auth", routePOSTAuthorize);

	const app = new Elysia()
		.use(bareRoutes)
		.use(cors())
		.use(pluginPools)
		.use(jwtGuardedRoutes)
		.use(regularRoutes)
		.onError(() => ({
			status: "failed",
			result: "invalid-method",
		}))
		.listen({
			port: env.API_PORT,
			hostname: env.API_HOST ?? "127.0.0.1",
		});

	return app;
};
