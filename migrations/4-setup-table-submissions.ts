import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
   -- SUBMISSIONS
   CREATE TABLE public.submissions (
     id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     user_id bigint NOT NULL,
     contest_id integer NOT NULL,
     submission jsonb NOT NULL,
     created_at timestamp NOT NULL DEFAULT now()
   );

   CREATE INDEX submissions_user_id_idx ON public.submissions (user_id);
   CREATE INDEX submissions_contest_id_idx ON public.submissions (contest_id);
   `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
     DROP TABLE IF EXISTS
       public.submissions
     CASCADE;
   `.execute(db);
}
