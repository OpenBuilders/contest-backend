import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
   -- USERS
   CREATE TABLE public.users (
     id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     user_id bigint NOT NULL UNIQUE,
     first_name varchar(64) NOT NULL,
     last_name varchar(64),
     username varchar(64),
     profile_photo text,
     premium boolean NOT NULL DEFAULT false,
     anonymous_profile jsonb NOT NULL,
     language varchar(8) NOT NULL DEFAULT 'en',
     created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX users_user_id_idx ON public.users (user_id);
   `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
     DROP TABLE IF EXISTS
       public.users
     CASCADE;
   `.execute(db);
}
