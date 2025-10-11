import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
   -- VOTES
   CREATE TABLE public.votes (
     id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     user_id bigint NOT NULL,
     submission_id bigint,
     vote bit(1),
     created_at timestamp NOT NULL DEFAULT now()
   );

   CREATE INDEX votes_user_id_idx ON public.votes (user_id);
   `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
     DROP TABLE IF EXISTS
       public.votes
     CASCADE;
   `.execute(db);
}
