import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
    ALTER TABLE public.votes
    ADD COLUMN comment text;
  `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
    ALTER TABLE public.votes
    DROP COLUMN IF EXISTS comment;
  `.execute(db);
}
