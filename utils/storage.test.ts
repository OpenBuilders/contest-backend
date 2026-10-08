import { afterAll, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { routeGETContestImage } from "../api/routes/contest-image";
import { migrateImages } from "../scripts/migrate-storage";
import { createStorage, storage } from "./storage";

const root = await mkdtemp(join(tmpdir(), "contest-storage-"));
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
		if (!object) return new Response(null, { status: 404 });
		return new Response(request.method === "HEAD" ? null : object.bytes, {
			headers: {
				"Content-Length": String(object.bytes.length),
				"Content-Type": object.type,
			},
		});
	},
});
const bucket = createStorage({
	STORAGE_DRIVER: "s3",
	STORAGE_S3_ENDPOINT: server.url.toString(),
	STORAGE_S3_BUCKET: "test",
	STORAGE_S3_ACCESS_KEY_ID: "test",
	STORAGE_S3_SECRET_ACCESS_KEY: "test",
	STORAGE_S3_PREFIX: "contests",
});
afterAll(async () => {
	server.stop(true);
	await rm(root, { recursive: true, force: true });
});

test("local storage preserves bytes, paths, missing reads and deletion", async () => {
	const local = createStorage({ STORAGE_LOCAL_PATH: root });
	expect(await local.read("images/missing")).toBeNull();
	await local.write("images/old", Buffer.from("legacy"));
	expect(await local.read("images/old")).toEqual(Buffer.from("legacy"));
	expect(local.photo("images/old")).toBe(`file://${root}/images/old`);
	await local.delete("images/old");
	expect(await local.read("images/old")).toBeNull();
});
test("bucket supports upload, read, cover URL and delete without a local directory", async () => {
	await bucket.write("images/new", Buffer.from("webp"));
	expect(await bucket.read("images/new")).toEqual(Buffer.from("webp"));
	await bucket.write("covers/cover", Buffer.from("png"), "image/png");
	expect(objects.get("/test/contests/covers/cover")?.type).toBe("image/png");
	expect(bucket.photo("covers/cover")).toContain("X-Amz-Signature=");
	await bucket.delete("images/new");
	expect(await bucket.read("images/new")).toBeNull();
});
test("migration dry run, verified copy, retry, conflict and source preservation", async () => {
	await writeFile(join(root, "legacy"), "original");
	expect((await migrateImages(root, bucket, true)).copied).toBe(1);
	expect(await bucket.read("images/legacy")).toBeNull();
	expect((await migrateImages(root, bucket)).copied).toBe(1);
	expect((await migrateImages(root, bucket)).skipped).toBe(1);
	expect(await readFile(join(root, "legacy"), "utf8")).toBe("original");
	await bucket.write("images/legacy", Buffer.from("different"));
	await expect(migrateImages(root, bucket)).rejects.toThrow(
		"Conflicting object",
	);
});
test("invalid keys and incomplete configuration fail", async () => {
	expect(() => createStorage({ STORAGE_DRIVER: "s3" })).toThrow();
	for (const key of ["images/../secret", "images/a/b", "images/", "other/a"]) {
		await expect(bucket.read(key)).rejects.toThrow("Invalid storage key");
		await expect(bucket.write(key, Buffer.from("x"))).rejects.toThrow(
			"Invalid storage key",
		);
		await expect(bucket.delete(key)).rejects.toThrow("Invalid storage key");
	}
});

test("image endpoint preserves bytes, content headers and missing response", async () => {
	const id = `test-${Date.now()}`;
	const bytes = Buffer.from("image-bytes");
	await storage.write(`images/${id}`, bytes);
	try {
		const response = (await routeGETContestImage({
			params: { name: id },
		} as any)) as Response;
		expect(response.headers.get("Content-Type")).toBe("image/webp");
		expect(response.headers.get("Content-Length")).toBe(String(bytes.length));
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=31536000, immutable",
		);
		expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
		expect(
			await routeGETContestImage({ params: { name: "../secret" } } as any),
		).toEqual({ status: "failed", result: "file not found" });
	} finally {
		await storage.delete(`images/${id}`);
	}
	expect(await routeGETContestImage({ params: { name: id } } as any)).toEqual({
		status: "failed",
		result: "file not found",
	});
});
test("provider errors propagate instead of masquerading as missing objects", async () => {
	const failing = Bun.serve({
		port: 0,
		fetch: () => new Response(null, { status: 403 }),
	});
	try {
		const target = createStorage({
			STORAGE_DRIVER: "s3",
			STORAGE_S3_BUCKET: "test",
			STORAGE_S3_ENDPOINT: failing.url.toString(),
			STORAGE_S3_ACCESS_KEY_ID: "test",
			STORAGE_S3_SECRET_ACCESS_KEY: "test",
		});
		await expect(target.read("images/a")).rejects.toThrow();
		await expect(target.write("images/a", Buffer.from("a"))).rejects.toThrow();
	} finally {
		failing.stop(true);
	}
});
test("migration fails on corrupted writes and can resume", async () => {
	const source = await mkdtemp(join(tmpdir(), "contest-migration-"));
	try {
		await writeFile(join(source, "retry"), "expected");
		const corrupt = {
			...bucket,
			write: async (key: string) => {
				await bucket.write(key, Buffer.from("corrupt"));
			},
		};
		await expect(migrateImages(source, corrupt)).rejects.toThrow(
			"Verification failed",
		);
		expect(await readFile(join(source, "retry"), "utf8")).toBe("expected");
		await bucket.delete("images/retry");
		expect((await migrateImages(source, bucket)).copied).toBe(1);
		expect((await migrateImages(source, bucket)).skipped).toBe(1);
	} finally {
		await rm(source, { recursive: true, force: true });
	}
});

test("cover rendering and Telegram delivery work with both drivers", async () => {
	const proc = Bun.spawn(
		[
			process.execPath,
			"run",
			`${import.meta.dir}/../scripts/storage-cover-check.ts`,
		],
		{ stdout: "pipe", stderr: "pipe" },
	);
	const [output, errors, code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	expect(code, errors).toBe(0);
	expect(output).toContain("cleanup passed");
}, 30000);
