import { type Handler, status } from "elysia";

export const health = {
	pg: true,
	redis: true,
};

export const routeGETHealth: Handler = async () => {
	if (Object.values(health).every(Boolean)) {
		return {
			status: "success",
		};
	}

	return status(503);
};
