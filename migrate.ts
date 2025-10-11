import { promises as fs } from "node:fs";
import * as path from "node:path";
import { FileMigrationProvider, Migrator } from "kysely";
import { db } from "./utils/database";

export const runMigrations = async () => {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(__dirname, "migrations/"),
		}),
		allowUnorderedMigrations: true,
	});

	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(`migration "${it.migrationName}" was executed successfully`);
		} else if (it.status === "Error") {
			console.error(`failed to execute migration "${it.migrationName}"`);
		}
	});

	if (error) {
		console.error("failed to migrate");
		console.error(error);
	}
};
