// Isolated regression fixture: no real bot or cache requests.
import { mock } from "bun:test";
import { strict as assert } from "node:assert";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorage } from "../utils/storage";

const [driver, scenario] = process.argv.slice(2);
const root = await mkdtemp(join(tmpdir(), "contest-media-"));
const objects = new Map<string, { bytes: Buffer; type: string }>();
const server = Bun.serve({
	port: 0,
	async fetch(request) {
		const key = new URL(request.url).pathname;
		if (request.method === "PUT") {
			objects.set(key, {
				bytes: Buffer.from(await request.arrayBuffer()),
				type: request.headers.get("content-type") ?? "",
			});
			return new Response(null);
		}
		if (request.method === "DELETE") {
			objects.delete(key);
			return new Response(null, { status: 204 });
		}
		const object = objects.get(key);
		return object
			? new Response(object.bytes, { headers: { "Content-Type": object.type } })
			: new Response(null, { status: 404 });
	},
});
const target = createStorage(
	driver === "s3"
		? {
				STORAGE_DRIVER: "s3",
				STORAGE_LOCAL_PATH: join(root, "must-not-exist"),
				STORAGE_S3_BUCKET: "test",
				STORAGE_S3_ENDPOINT: server.url.toString(),
				STORAGE_S3_ACCESS_KEY_ID: "test",
				STORAGE_S3_SECRET_ACCESS_KEY: "test",
			}
		: { STORAGE_LOCAL_PATH: root },
);
let calls = 0;
mock.module("../utils/storage", () => ({ storage: target }));
mock.module("../utils/env", () => ({
	env: {
		COVER_ARCHIVE_CHAT_ID: -1,
		BOT_API_SERVER: "http://local-bot-api",
		BOT_TOKEN: "test",
	},
}));
mock.module("../utils/cache", () => ({
	cache: async (_key: string, create: () => Promise<string | undefined>) =>
		scenario === "cached" ? "existing-id" : create(),
}));
mock.module("nyx-bot-client", () => ({
	sendAnimation: async (params: {
		animation: string;
		bot_api_server: string;
	}) => {
		calls++;
		assert.equal(params.bot_api_server, "http://local-bot-api");
		let bytes: Buffer;
		if (driver === "s3") {
			assert(!params.animation.startsWith("file://"));
			assert(params.animation.includes("X-Amz-Signature="));
			const response = await fetch(params.animation);
			assert.equal(response.headers.get("content-type"), "video/mp4");
			bytes = Buffer.from(await response.arrayBuffer());
		} else {
			assert(params.animation.startsWith(`file://${root}/covers/`));
			bytes = await readFile(params.animation.slice("file://".length));
		}
		assert.deepEqual(
			bytes,
			await readFile(`${import.meta.dir}/../storage/media/intro-540.mp4`),
		);
		if (scenario === "error") throw new Error("Send failed");
		if (scenario === "rejected") return { ok: false };
		return { ok: true, result: { animation: { file_id: "new-id" } } };
	},
}));
try {
	if (scenario === "error")
		await assert.rejects(import("../information/media"), /Send failed/);
	else {
		const { media } = await import("../information/media");
		assert.equal(
			media.welcome.gif.file_id,
			scenario === "cached"
				? "existing-id"
				: scenario === "rejected"
					? undefined
					: "new-id",
		);
	}
	assert.equal(calls, scenario === "cached" ? 0 : 1);
	assert.equal(objects.size, 0);
	if (driver === "s3" || scenario === "cached")
		assert.deepEqual(await readdir(root), []);
	else assert.deepEqual(await readdir(join(root, "covers")), []);
	console.log("Media delivery and cleanup passed");
} finally {
	server.stop(true);
	await rm(root, { recursive: true, force: true });
}
