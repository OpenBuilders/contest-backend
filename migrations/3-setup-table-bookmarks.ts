import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
   -- BOOKMARKS
   CREATE TABLE public.bookmarks (
     id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     user_id bigint NOT NULL,
     contest_id integer NOT NULL,
     created_at timestamp NOT NULL DEFAULT now()
   );

   CREATE INDEX bookmarks_user_id_idx ON public.bookmarks (user_id);
   CREATE INDEX bookmarks_contest_id_idx ON public.bookmarks (contest_id);
   `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
     DROP TABLE IF EXISTS
       public.bookmarks
     CASCADE;
   `.execute(db);
}
