import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
    ALTER TABLE public.votes
    ALTER COLUMN vote TYPE smallint
    USING CASE
      WHEN vote = B'0' THEN 0
      WHEN vote = B'1' THEN 1
      ELSE NULL
    END;
  `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
    ALTER TABLE public.votes
    ALTER COLUMN vote TYPE bit(1)
    USING CASE
      WHEN vote = 0 THEN B'0'
      WHEN vote = 1 THEN B'1'
      ELSE B'0'
    END;
  `.execute(db);
}
