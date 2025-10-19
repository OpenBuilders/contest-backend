import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
    ALTER TABLE public.submissions
    ADD COLUMN status smallint NOT NULL DEFAULT 0
    CHECK (status IN (0, 1));
  `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
    ALTER TABLE public.submissions
    DROP COLUMN IF EXISTS status;
  `.execute(db);
}
