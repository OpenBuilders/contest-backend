import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
	await sql`
   -- SETTINGS
   CREATE TABLE public.settings (
     id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     meta varchar(32) NOT NULL UNIQUE,
     value text
   );
   `.execute(db);
}

export async function down(db: Kysely<any>) {
	await sql`
     DROP TABLE IF EXISTS
       public.settings
     CASCADE;
   `.execute(db);
}
