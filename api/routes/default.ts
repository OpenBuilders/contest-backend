import type { Handler } from "elysia";

export const routeGETDefault: Handler = async () => {
	return {
		status: "success",
		result: "silence is gold",
	};
};
