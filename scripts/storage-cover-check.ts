// Isolated integration fixture invoked by storage.test.ts. No real Telegram or database requests.
import { mock } from "bun:test";
import { strict as assert } from "node:assert";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { createStorage } from "../utils/storage";

const root = await mkdtemp(join(tmpdir(), "contest-cover-"));
const objects = new Map<string, Buffer>();
const server = Bun.serve({
	port: 0,
	async fetch(request) {
		const key = new URL(request.url).pathname;
		if (request.method === "PUT") {
			objects.set(key, Buffer.from(await request.arrayBuffer()));
			return new Response(null);
		}
		if (request.method === "DELETE") {
			objects.delete(key);
			return new Response(null, { status: 204 });
		}
		const bytes = objects.get(key);
		return bytes
			? new Response(request.method === "HEAD" ? null : bytes, {
					headers: { "Content-Length": String(bytes.length) },
				})
			: new Response(null, { status: 404 });
	},
});
let active = createStorage({ STORAGE_LOCAL_PATH: root });
let fail = false;
const photos: string[] = [];
mock.module("../utils/storage", () => ({
	storage: {
		read: (key: string) => active.read(key),
		write: (key: string, bytes: Buffer, type: string) =>
			active.write(key, bytes, type),
		delete: (key: string) => active.delete(key),
		photo: (key: string) => active.photo(key),
	},
}));
mock.module("../utils/env", () => ({ env: { COVER_ARCHIVE_CHAT_ID: -1 } }));
mock.module("../utils/database", () => ({
	db: {
		updateTable: () => ({
			set: () => ({ where: () => ({ execute: async () => {} }) }),
		}),
	},
}));
mock.module("nyx-bot-client", () => ({
	sendPhoto: async (params: { photo: string }) => {
		photos.push(params.photo);
		if (fail) throw new Error("Send failed");
		return { ok: true, result: { photo: [{ file_id: "cached" }] } };
	},
}));
try {
	const { generateContestCoverImage, cacheContestCoverImage } = await import(
		"../utils/cover"
	);
	for (const target of [
		active,
		createStorage({
			STORAGE_DRIVER: "s3",
			STORAGE_S3_BUCKET: "test",
			STORAGE_S3_ENDPOINT: server.url.toString(),
			STORAGE_S3_ACCESS_KEY_ID: "test",
			STORAGE_S3_SECRET_ACCESS_KEY: "test",
		}),
	]) {
		active = target;
		await active.write(
			"images/fixture",
			await sharp({
				create: { width: 256, height: 256, channels: 3, background: "red" },
			})
				.webp()
				.toBuffer(),
		);
		const key = await generateContestCoverImage(
			"Contest",
			undefined,
			undefined,
			"fixture",
		);
		const bytes = await active.read(key);
		assert(bytes);
		const metadata = await sharp(bytes).metadata();
		assert.equal(metadata.width, 1080);
		assert.equal(metadata.height, 640);
		assert.equal(metadata.format, "png");
		await active.delete(key);
		const contest = {
			id: 1,
			title: "Contest",
			image: "fixture",
			theme: {},
			cover_image: null,
		} as any;
		const result = await cacheContestCoverImage(contest);
		assert.equal(result?.file_id, "cached");
		if (target.driver === "s3") {
			assert(photos.at(-1)?.includes("X-Amz-Signature="));
			assert.equal(
				[...objects.keys()].filter((key) => key.includes("/covers/")).length,
				0,
			);
		} else assert(photos.at(-1)?.startsWith("file://"));
		fail = true;
		await assert.rejects(cacheContestCoverImage(contest), /Send failed/);
		fail = false;
		if (target.driver === "s3")
			assert.equal(
				[...objects.keys()].filter((key) => key.includes("/covers/")).length,
				0,
			);
	}
	console.log("Local and S3 cover generation, sending and cleanup passed");
} finally {
	server.stop(true);
	await rm(root, { recursive: true, force: true });
}
