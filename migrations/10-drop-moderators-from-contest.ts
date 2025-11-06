import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
      ALTER TABLE public.contests
      DROP COLUMN IF EXISTS moderators;
    `.execute(db);
}

export async function down(_: Kysely<any>) {}
