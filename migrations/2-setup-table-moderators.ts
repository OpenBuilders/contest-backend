import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
   -- MODERATORS
   CREATE TABLE public.moderators (
     id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     user_id bigint NOT NULL,
     contest_id integer NOT NULL,
     created_at timestamp NOT NULL DEFAULT now()
   );

   CREATE INDEX moderators_user_id_idx ON public.moderators (user_id);
   CREATE INDEX moderators_contest_id_idx ON public.moderators (contest_id);
   `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
     DROP TABLE IF EXISTS
       public.moderators
     CASCADE;
   `.execute(db);
}
