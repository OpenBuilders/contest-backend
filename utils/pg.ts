import { Pool } from "pg";
import { env } from "./env";

function createPgPool() {
	const pool = new Pool({
		host: env.PGSQL_HOST,
		user: env.PGSQL_USER,
		password: env.PGSQL_PASS,
		port: env.PGSQL_PORT,
		database: env.PGSQL_NAME,
		idleTimeoutMillis: 60 * 60_000, // 1 hour
		max: env.POOL_SIZE_PGSQL,
		min: 1,
	});

	// Catch and log errors instead of crashing
	pool.on("error", (err) => {
		console.error("[PG] Unexpected error on idle client:", err.message);

		// Optionally, destroy the broken pool and recreate
		if (
			err.message.includes("Connection terminated unexpectedly") ||
			err.message.includes("server closed the connection")
		) {
			console.warn("[PG] Reconnecting due to connection loss...");
			recreatePool();
		}
	});

	return pool;
}

let pg = createPgPool();

function recreatePool() {
	try {
		pg.end().catch(() => {});
	} catch {}
	pg = createPgPool();
	console.log("[PG] Pool recreated successfully.");
}

export { pg };
