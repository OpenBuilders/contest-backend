import type { Handler } from "elysia";
import { storage } from "../../utils/storage";

export const routeGETContestImage: Handler = async ({ params }) => {
	if (!params.name || !/^[a-zA-Z0-9_-]+$/.test(params.name))
		return { status: "failed", result: "file not found" };
	const file = await storage.read(`images/${params.name}`);

	if (!file) {
		return {
			status: "failed",
			result: "file not found",
		};
	}

	return new Response(file, {
		headers: {
			"Content-Type": "image/webp",
			"Content-Length": file.length.toString(),
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
