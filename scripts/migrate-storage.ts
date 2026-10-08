import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createStorage } from "../utils/storage";

export async function migrateImages(
	source: string,
	target: ReturnType<typeof createStorage>,
	dryRun = false,
	report: (message: string) => void = () => {},
) {
	if (target.driver !== "s3")
		throw new Error("Migration requires STORAGE_DRIVER=s3");
	const entries = await readdir(source, { withFileTypes: true });
	let copied = 0;
	let skipped = 0;
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		if (!entry.isFile() || entry.name.startsWith(".")) continue;
		const key = `images/${entry.name}`;
		const bytes = await readFile(resolve(source, entry.name));
		const existing = await target.read(key);
		if (existing) {
			if (!bytes.equals(existing))
				throw new Error(`Conflicting object: ${key}`);
			skipped++;
			report(`Verified existing ${key}`);
			continue;
		}
		if (!dryRun) {
			await target.write(key, bytes);
			const copiedBytes = await target.read(key);
			if (!copiedBytes || !bytes.equals(copiedBytes))
				throw new Error(`Verification failed: ${key}`);
		}
		copied++;
		report(`${dryRun ? "Would copy" : "Copied and verified"} ${key}`);
	}
	return { copied, skipped, dryRun };
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	const source = args.find((arg) => !arg.startsWith("--"));
	if (args.some((arg) => arg.startsWith("--") && arg !== "--dry-run"))
		throw new Error("Unknown migration option");
	console.log(
		await migrateImages(
			resolve(source ?? `${import.meta.dir}/../storage/images`),
			createStorage(),
			args.includes("--dry-run"),
			console.log,
		),
	);
}
