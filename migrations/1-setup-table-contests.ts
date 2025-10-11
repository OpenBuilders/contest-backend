import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
   -- CONTESTS
   CREATE TABLE public.contests (
     id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     slug varchar(32) NOT NULL UNIQUE,
     slug_moderator varchar(32) NOT NULL UNIQUE,
     owner_id bigint NOT NULL,
     moderators text,
     title varchar(48) NOT NULL,
     description text NOT NULL,
     instruction text,
     fee double precision NOT NULL,
     fee_wallet text,
     prize varchar(48),
     theme jsonb,
     anonymous boolean NOT NULL,
     verified boolean NOT NULL DEFAULT false,
     announced boolean NOT NULL DEFAULT false,
     image text,
     cover_image jsonb,
     results jsonb NOT NULL DEFAULT '[]'::jsonb,
     date_end integer NOT NULL,
     created_at timestamp NOT NULL DEFAULT now()
   );
   `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
     DROP TABLE IF EXISTS
       public.contests
     CASCADE;
   `.execute(db);
}
