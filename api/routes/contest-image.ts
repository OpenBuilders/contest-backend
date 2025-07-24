import type { Handler } from "elysia";

export const routeGETContestImage: Handler = async ({ params }) => {
	const filePath = `${__dirname}/../../storage/images/${params.name}`;
	const file = Bun.file(filePath);

	if (!(await file.exists())) {
		return {
			status: "failed",
			result: "file not found",
		};
	}

	return new Response(file.stream(), {
		headers: {
			"Content-Type": "image/webp",
			"Content-Length": file.size.toString(),
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
