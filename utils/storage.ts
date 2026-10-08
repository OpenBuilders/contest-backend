import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { S3Client } from "bun";
import z from "zod";

const configSchema = z.object({
	STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
	STORAGE_LOCAL_PATH: z.string().optional(),
	STORAGE_S3_BUCKET: z.string().min(1).optional(),
	STORAGE_S3_ENDPOINT: z.url().optional(),
	STORAGE_S3_REGION: z.string().min(1).default("us-east-1"),
	STORAGE_S3_ACCESS_KEY_ID: z.string().min(1).optional(),
	STORAGE_S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
	STORAGE_S3_PREFIX: z.string().default(""),
});

export function createStorage(
	values: Record<string, string | undefined> = process.env,
) {
	const config = configSchema.parse(values);
	const root = resolve(
		config.STORAGE_LOCAL_PATH ?? `${import.meta.dir}/../storage`,
	);
	if (
		config.STORAGE_DRIVER === "s3" &&
		(!config.STORAGE_S3_BUCKET ||
			!config.STORAGE_S3_ACCESS_KEY_ID ||
			!config.STORAGE_S3_SECRET_ACCESS_KEY)
	) {
		throw new Error(
			"S3 storage requires bucket, access key ID and secret access key",
		);
	}
	const client =
		config.STORAGE_DRIVER === "s3"
			? new S3Client({
					bucket: config.STORAGE_S3_BUCKET,
					endpoint: config.STORAGE_S3_ENDPOINT,
					region: config.STORAGE_S3_REGION,
					accessKeyId: config.STORAGE_S3_ACCESS_KEY_ID,
					secretAccessKey: config.STORAGE_S3_SECRET_ACCESS_KEY,
				})
			: undefined;
	const prefix = config.STORAGE_S3_PREFIX.replace(/^\/+|\/+$/g, "");
	function key(name: string) {
		if (!/^(images|covers)\/[a-zA-Z0-9_-]+$/.test(name))
			throw new Error("Invalid storage key");
		return prefix ? `${prefix}/${name}` : name;
	}
	return {
		driver: config.STORAGE_DRIVER,
		async read(name: string): Promise<Buffer | null> {
			const objectKey = key(name);
			if (client) {
				const file = client.file(objectKey);
				if (!(await file.exists())) return null;
				return Buffer.from(await file.arrayBuffer());
			}
			try {
				return await readFile(resolve(root, name));
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
				throw error;
			}
		},
		async write(name: string, data: Buffer, type = "image/webp") {
			const objectKey = key(name);
			if (client) {
				await client.write(objectKey, data, { type });
				return;
			}
			await mkdir(resolve(root, name.split("/")[0]!), { recursive: true });
			await writeFile(resolve(root, name), data);
		},
		async delete(name: string) {
			const objectKey = key(name);
			if (client) await client.delete(objectKey);
			else await rm(resolve(root, name), { force: true });
		},
		photo(name: string) {
			const objectKey = key(name);
			return client
				? client.presign(objectKey, { expiresIn: 3600 })
				: `${values.BOT_API_FILE_PREFIX ?? "file://"}${resolve(root, name)}`;
		},
	};
}

export const storage = createStorage();
