--
-- PostgreSQL database dump
--

\restrict THnfCcZCuzxojkJG4M3LikfAfp2UzqVVBOJWS5tqx42mCRvZm3H1sSIqSWHY4yX

-- Dumped from database version 17.6 (Ubuntu 17.6-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: contonest_user
--

CREATE TABLE public.bookmarks (
    id integer NOT NULL,
    user_id bigint NOT NULL,
    contest_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bookmarks OWNER TO contonest_user;

--
-- Name: bookmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: contonest_user
--

ALTER TABLE public.bookmarks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.bookmarks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contests; Type: TABLE; Schema: public; Owner: contonest_user
--

CREATE TABLE public.contests (
    id integer NOT NULL,
    slug character varying(32) NOT NULL,
    slug_moderator character varying(32) NOT NULL,
    owner_id bigint NOT NULL,
    moderators text,
    title character varying(48) NOT NULL,
    description text NOT NULL,
    instruction text,
    fee double precision NOT NULL,
    fee_wallet text,
    prize character varying(48),
    theme jsonb,
    anonymous boolean NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    announced boolean DEFAULT false NOT NULL,
    image text,
    cover_image jsonb,
    results jsonb DEFAULT '[]'::jsonb NOT NULL,
    date_end integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contests OWNER TO contonest_user;

--
-- Name: contests_id_seq; Type: SEQUENCE; Schema: public; Owner: contonest_user
--

ALTER TABLE public.contests ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.contests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: moderators; Type: TABLE; Schema: public; Owner: contonest_user
--

CREATE TABLE public.moderators (
    id integer NOT NULL,
    user_id bigint NOT NULL,
    contest_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.moderators OWNER TO contonest_user;

--
-- Name: moderators_id_seq; Type: SEQUENCE; Schema: public; Owner: contonest_user
--

ALTER TABLE public.moderators ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.moderators_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: contonest_user
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    meta character varying(32) NOT NULL,
    value text
);


ALTER TABLE public.settings OWNER TO contonest_user;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: contonest_user
--

ALTER TABLE public.settings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: contonest_user
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    user_id bigint NOT NULL,
    contest_id integer NOT NULL,
    submission jsonb NOT NULL,
    likes jsonb DEFAULT '[]'::jsonb NOT NULL,
    dislikes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.submissions OWNER TO contonest_user;

--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: contonest_user
--

ALTER TABLE public.submissions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.submissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: contonest_user
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    first_name character varying(64) NOT NULL,
    last_name character varying(64),
    username character varying(64),
    profile_photo text,
    premium boolean DEFAULT false NOT NULL,
    anonymous_profile jsonb NOT NULL,
    language character varying(8) DEFAULT 'en'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO contonest_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: contonest_user
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO contonest_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: contonest_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: contests contests_pkey; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_pkey PRIMARY KEY (id);


--
-- Name: contests contests_slug_key; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_slug_key UNIQUE (slug);


--
-- Name: contests contests_slug_moderator_key; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_slug_moderator_key UNIQUE (slug_moderator);


--
-- Name: users idx_user_id; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT idx_user_id UNIQUE (user_id);


--
-- Name: moderators moderators_pkey; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.moderators
    ADD CONSTRAINT moderators_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bookmarks_contest_id_idx; Type: INDEX; Schema: public; Owner: contonest_user
--

CREATE INDEX bookmarks_contest_id_idx ON public.bookmarks USING btree (contest_id);


--
-- Name: bookmarks_user_id_idx; Type: INDEX; Schema: public; Owner: contonest_user
--

CREATE INDEX bookmarks_user_id_idx ON public.bookmarks USING btree (user_id);


--
-- Name: moderators_contest_id_idx; Type: INDEX; Schema: public; Owner: contonest_user
--

CREATE INDEX moderators_contest_id_idx ON public.moderators USING btree (contest_id);


--
-- Name: moderators_user_id_idx; Type: INDEX; Schema: public; Owner: contonest_user
--

CREATE INDEX moderators_user_id_idx ON public.moderators USING btree (user_id);


--
-- Name: settings_meta_key; Type: INDEX; Schema: public; Owner: contonest_user
--

CREATE UNIQUE INDEX settings_meta_key ON public.settings USING btree (meta);


--
-- Name: submissions_contest_id_idx; Type: INDEX; Schema: public; Owner: contonest_user
--

CREATE INDEX submissions_contest_id_idx ON public.submissions USING btree (contest_id);


--
-- Name: submissions_user_id_idx; Type: INDEX; Schema: public; Owner: contonest_user
--

CREATE INDEX submissions_user_id_idx ON public.submissions USING btree (user_id);


--
-- Name: users_user_id_idx; Type: INDEX; Schema: public; Owner: contonest_user
--

CREATE INDEX users_user_id_idx ON public.users USING btree (user_id);


--
-- Name: bookmarks bookmarks_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


--
-- Name: bookmarks bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: contests contests_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(user_id) ON DELETE RESTRICT;


--
-- Name: moderators moderators_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.moderators
    ADD CONSTRAINT moderators_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


--
-- Name: moderators moderators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.moderators
    ADD CONSTRAINT moderators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: submissions submissions_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contonest_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict THnfCcZCuzxojkJG4M3LikfAfp2UzqVVBOJWS5tqx42mCRvZm3H1sSIqSWHY4yX

