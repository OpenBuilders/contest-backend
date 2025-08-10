import cors from "@elysiajs/cors";
import Elysia from "elysia";
import z from "zod";
import { env } from "../utils/env";
import { pluginJWT } from "./plugins/jwt";
import { pluginPools } from "./plugins/pools";
import { routePOSTAuthorize } from "./routes/authorize";
import { routePOSTBotWebhook } from "./routes/bot-webhook";
import { routeGETContest } from "./routes/contest";
import { routePOSTContestBookmark } from "./routes/contest-bookmark";
import { routePOSTContestCreate } from "./routes/contest-create";
import { routePOSTContestDelete } from "./routes/contest-delete";
import { routeGETContestImage } from "./routes/contest-image";
import {
	routeGETContestModerators,
	routeGETContestModeratorsInfo,
	routePOSTContestModeratorsJoin,
	routePOSTContestModeratorsRemove,
	routePOSTContestModeratorsRevoke,
} from "./routes/contest-moderators";
import { routePOSTContestSubmit } from "./routes/contest-submit";
import { routeGETContestsMy } from "./routes/contests";
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
		.get("/contests/my", routeGETContestsMy)
		.post("/contest/create", routePOSTContestCreate)
		.get("/contest/:slug", routeGETContest)
		.get("/contest/:slug/moderators", routeGETContestModerators)
		.get("/contest/:slug/moderators/info", routeGETContestModeratorsInfo)
		.post("/contest/:slug/moderators/join", routePOSTContestModeratorsJoin)
		.post("/contest/:slug/moderators/revoke", routePOSTContestModeratorsRevoke)
		.post("/contest/:slug/moderators/remove", routePOSTContestModeratorsRemove)
		.post("/contest/:slug/bookmark", routePOSTContestBookmark)
		.post("/contest/:slug/delete", routePOSTContestDelete)
		.post("/contest/:slug/submit", routePOSTContestSubmit);

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
			development: false,
		});

	return app;
};
