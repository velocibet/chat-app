--
-- PostgreSQL database dump
--

-- \restrict ZD8vFebgWGyXcT8NfO8YDstijOHccRHM4Ss6PONgWSm2Tlfv3i4f3gsSxuLwNFz

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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

--
-- Name: friend_request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.friend_request_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);


ALTER TYPE public.friend_request_status OWNER TO postgres;

--
-- Name: message_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_status AS ENUM (
    'sent',
    'delivered',
    'read'
);


ALTER TYPE public.message_status OWNER TO postgres;

--
-- Name: room_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.room_type AS ENUM (
    'dm',
    'group'
);


ALTER TYPE public.room_type OWNER TO postgres;

--
-- Name: room_user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.room_user_role AS ENUM (
    'owner',
    'member'
);


ALTER TYPE public.room_user_role OWNER TO postgres;

--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocks (
    id integer NOT NULL,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blocks OWNER TO postgres;

--
-- Name: blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocks_id_seq OWNER TO postgres;

--
-- Name: blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blocks_id_seq OWNED BY public.blocks.id;


--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verifications (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    token_hash character(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_verifications OWNER TO postgres;

--
-- Name: email_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_verifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_verifications_id_seq OWNER TO postgres;

--
-- Name: email_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_verifications_id_seq OWNED BY public.email_verifications.id;


--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friend_requests (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    status public.friend_request_status DEFAULT 'pending'::public.friend_request_status NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.friend_requests OWNER TO postgres;

--
-- Name: friend_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.friend_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friend_requests_id_seq OWNER TO postgres;

--
-- Name: friend_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.friend_requests_id_seq OWNED BY public.friend_requests.id;


--
-- Name: login_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_logs (
    id bigint NOT NULL,
    username character varying(100) NOT NULL,
    ip character varying(45) NOT NULL,
    agent text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    success boolean DEFAULT true NOT NULL
);


ALTER TABLE public.login_logs OWNER TO postgres;

--
-- Name: login_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.login_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_logs_id_seq OWNER TO postgres;

--
-- Name: login_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.login_logs_id_seq OWNED BY public.login_logs.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isfile smallint DEFAULT 0 NOT NULL,
    room_id bigint NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: room; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room (
    id bigint NOT NULL,
    type public.room_type NOT NULL,
    title text,
    owner_user_id bigint,
    dm_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    room_image_url text,
    deleted_at timestamp without time zone
);


ALTER TABLE public.room OWNER TO postgres;

--
-- Name: room_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_id_seq OWNER TO postgres;

--
-- Name: room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_id_seq OWNED BY public.room.id;


--
-- Name: room_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_user (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role public.room_user_role DEFAULT 'member'::public.room_user_role NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone,
    deleted_at timestamp without time zone,
    hidden boolean DEFAULT false,
    unread_count integer DEFAULT 0
);


ALTER TABLE public.room_user OWNER TO postgres;

--
-- Name: room_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_user_id_seq OWNER TO postgres;

--
-- Name: room_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_user_id_seq OWNED BY public.room_user.id;


--
-- Name: user_push_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_push_tokens (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    token text NOT NULL,
    "deviceType" character varying(50) DEFAULT NULL::character varying,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_push_tokens OWNER TO postgres;

--
-- Name: COLUMN user_push_tokens.token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_push_tokens.token IS 'FCM 디바이스 토큰';


--
-- Name: COLUMN user_push_tokens."deviceType"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_push_tokens."deviceType" IS '기기 종류';


--
-- Name: user_push_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_push_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_push_tokens_id_seq OWNER TO postgres;

--
-- Name: user_push_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_push_tokens_id_seq OWNED BY public.user_push_tokens.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(30) NOT NULL,
    nickname character varying(50),
    password character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    bio character varying(255),
    profile_url_name character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: blocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks ALTER COLUMN id SET DEFAULT nextval('public.blocks_id_seq'::regclass);


--
-- Name: email_verifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications ALTER COLUMN id SET DEFAULT nextval('public.email_verifications_id_seq'::regclass);


--
-- Name: friend_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests ALTER COLUMN id SET DEFAULT nextval('public.friend_requests_id_seq'::regclass);


--
-- Name: login_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_logs ALTER COLUMN id SET DEFAULT nextval('public.login_logs_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: room id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room ALTER COLUMN id SET DEFAULT nextval('public.room_id_seq'::regclass);


--
-- Name: room_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_user ALTER COLUMN id SET DEFAULT nextval('public.room_user_id_seq'::regclass);


--
-- Name: user_push_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_push_tokens ALTER COLUMN id SET DEFAULT nextval('public.user_push_tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);


--
-- Name: login_logs login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: room room_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT room_pkey PRIMARY KEY (id);


--
-- Name: room_user room_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_user
    ADD CONSTRAINT room_user_pkey PRIMARY KEY (id);


--
-- Name: blocks unique_block; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id);


--
-- Name: room unique_dm_hash; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT unique_dm_hash UNIQUE (dm_hash);


--
-- Name: room_user unique_room_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_user
    ADD CONSTRAINT unique_room_user UNIQUE (room_id, user_id);


--
-- Name: user_push_tokens user_push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_push_tokens
    ADD CONSTRAINT user_push_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: friend_requests_unique_pair; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX friend_requests_unique_pair ON public.friend_requests USING btree (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));


--
-- Name: idx_blocks_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_blocks_unique ON public.blocks USING btree (blocker_id, blocked_id);


--
-- Name: idx_login_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_logs_created_at ON public.login_logs USING btree (created_at);


--
-- Name: idx_login_logs_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_logs_ip ON public.login_logs USING btree (ip);


--
-- Name: idx_login_logs_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_logs_username ON public.login_logs USING btree (username);


--
-- Name: idx_room_user_room_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_room_user_room_id ON public.room_user USING btree (room_id);


--
-- Name: idx_room_user_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_room_user_user_id ON public.room_user USING btree (user_id);


--
-- Name: uniq_room_user_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_room_user_active ON public.room_user USING btree (room_id, user_id) WHERE (left_at IS NULL);


--
-- Name: friend_requests trigger_friend_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: user_push_tokens update_user_push_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_push_tokens_updated_at BEFORE UPDATE ON public.user_push_tokens FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: blocks blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: blocks blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests fk_friend_receiver; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT fk_friend_receiver FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests fk_friend_sender; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT fk_friend_sender FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages fk_messages_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_room FOREIGN KEY (room_id) REFERENCES public.room(id) ON DELETE CASCADE;


--
-- Name: messages fk_messages_sender; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: room_user fk_room_user_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_user
    ADD CONSTRAINT fk_room_user_room FOREIGN KEY (room_id) REFERENCES public.room(id) ON DELETE CASCADE;


--
-- Name: user_push_tokens fk_user_push_token; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_push_tokens
    ADD CONSTRAINT fk_user_push_token FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: TABLE blocks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.blocks TO velocibet_user;


--
-- Name: SEQUENCE blocks_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.blocks_id_seq TO velocibet_user;


--
-- Name: TABLE email_verifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_verifications TO velocibet_user;


--
-- Name: SEQUENCE email_verifications_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.email_verifications_id_seq TO velocibet_user;


--
-- Name: TABLE friend_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.friend_requests TO velocibet_user;


--
-- Name: SEQUENCE friend_requests_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.friend_requests_id_seq TO velocibet_user;


--
-- Name: TABLE login_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.login_logs TO velocibet_user;


--
-- Name: SEQUENCE login_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.login_logs_id_seq TO velocibet_user;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO velocibet_user;


--
-- Name: SEQUENCE messages_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.messages_id_seq TO velocibet_user;


--
-- Name: TABLE room; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.room TO velocibet_user;


--
-- Name: SEQUENCE room_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.room_id_seq TO velocibet_user;


--
-- Name: TABLE room_user; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.room_user TO velocibet_user;


--
-- Name: SEQUENCE room_user_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.room_user_id_seq TO velocibet_user;


--
-- Name: TABLE user_push_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_push_tokens TO velocibet_user;


--
-- Name: SEQUENCE user_push_tokens_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_push_tokens_id_seq TO velocibet_user;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO velocibet_user;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO velocibet_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO velocibet_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO velocibet_user;


--
-- PostgreSQL database dump complete
--

-- \unrestrict ZD8vFebgWGyXcT8NfO8YDstijOHccRHM4Ss6PONgWSm2Tlfv3i4f3gsSxuLwNFz

