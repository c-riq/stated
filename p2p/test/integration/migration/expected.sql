--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.4

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
-- Name: statement_type; Type: TYPE; Schema: public; Owner: sdf
--

CREATE TYPE public.statement_type AS ENUM (
    'statement',
    'dispute_statement_authenticity',
    'response',
    'organisation_verification',
    'person_verification',
    'poll',
    'vote',
    'rating',
    'sign_pdf',
    'bounty',
    'dispute_statement_content',
    'boycott',
    'observation',
    'unsupported'
);


ALTER TYPE public.statement_type OWNER TO sdf;

--
-- Name: verification_method; Type: TYPE; Schema: public; Owner: sdf
--

CREATE TYPE public.verification_method AS ENUM (
    'api',
    'dns'
);


ALTER TYPE public.verification_method OWNER TO sdf;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: hidden_statements; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.hidden_statements (
    id integer NOT NULL,
    type public.statement_type NOT NULL,
    domain character varying(100) NOT NULL,
    author character varying(100) NOT NULL,
    statement character varying(3000) NOT NULL,
    proclaimed_publication_time timestamp without time zone,
    hash_b64 character varying(500) NOT NULL,
    referenced_statement character varying(500),
    tags character varying(1000),
    content character varying(3000) NOT NULL,
    content_hash character varying(500) NOT NULL,
    source_node_id integer,
    first_verification_time timestamp without time zone,
    latest_verification_time timestamp without time zone,
    verification_method public.verification_method,
    derived_entity_created boolean NOT NULL,
    derived_entity_creation_retry_count integer,
    superseded_statement character varying(500)
);


ALTER TABLE public.hidden_statements OWNER TO sdf;

--
-- Name: hidden_statements_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.hidden_statements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hidden_statements_id_seq OWNER TO sdf;

--
-- Name: hidden_statements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.hidden_statements_id_seq OWNED BY public.hidden_statements.id;


--
-- Name: identity_beliefs_and_reputation; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.identity_beliefs_and_reputation (
    id integer NOT NULL,
    domain character varying(100) NOT NULL,
    name character varying(100) NOT NULL,
    name_confidence double precision NOT NULL,
    legal_entity_type character varying(100) NOT NULL,
    legal_entity_type_confidence double precision NOT NULL,
    country character varying(100) NOT NULL,
    country_confidence double precision NOT NULL,
    province character varying(100),
    province_confidence double precision,
    city character varying(100),
    city_confidence double precision,
    reputation double precision,
    reputation_fallback double precision
);


ALTER TABLE public.identity_beliefs_and_reputation OWNER TO sdf;

--
-- Name: identity_beliefs_and_reputation_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.identity_beliefs_and_reputation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.identity_beliefs_and_reputation_id_seq OWNER TO sdf;

--
-- Name: identity_beliefs_and_reputation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.identity_beliefs_and_reputation_id_seq OWNED BY public.identity_beliefs_and_reputation.id;


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO sdf;

--
-- Name: organisation_verifications; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.organisation_verifications (
    id integer NOT NULL,
    statement_hash character varying(500) NOT NULL,
    verifier_domain character varying(100) NOT NULL,
    verified_domain character varying(100),
    foreign_domain character varying(100),
    name character varying(100) NOT NULL,
    legal_entity_type character varying(100) NOT NULL,
    serial_number character varying(100),
    country character varying(100) NOT NULL,
    province character varying(100),
    city character varying(100),
    department character varying(100),
    confidence double precision
);


ALTER TABLE public.organisation_verifications OWNER TO sdf;

--
-- Name: organisation_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.organisation_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organisation_verifications_id_seq OWNER TO sdf;

--
-- Name: organisation_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.organisation_verifications_id_seq OWNED BY public.organisation_verifications.id;


--
-- Name: p2p_nodes; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.p2p_nodes (
    id integer NOT NULL,
    domain character varying(150) NOT NULL,
    ip character varying(150),
    first_seen timestamp without time zone,
    last_seen timestamp without time zone,
    reputation real,
    last_received_statement_id bigint,
    certificate_authority character varying(100),
    fingerprint character varying(100)
);


ALTER TABLE public.p2p_nodes OWNER TO sdf;

--
-- Name: p2p_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.p2p_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.p2p_nodes_id_seq OWNER TO sdf;

--
-- Name: p2p_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.p2p_nodes_id_seq OWNED BY public.p2p_nodes.id;


--
-- Name: person_verifications; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.person_verifications (
    id integer NOT NULL,
    statement_hash character varying(500) NOT NULL,
    verifier_domain character varying(100) NOT NULL,
    verified_domain character varying(100),
    foreign_domain character varying(100),
    name character varying(100) NOT NULL,
    birth_country character varying(100) NOT NULL,
    birth_city character varying(100),
    birth_date character varying(100)
);


ALTER TABLE public.person_verifications OWNER TO sdf;

--
-- Name: person_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.person_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.person_verifications_id_seq OWNER TO sdf;

--
-- Name: person_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.person_verifications_id_seq OWNED BY public.person_verifications.id;


--
-- Name: polls; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.polls (
    id integer NOT NULL,
    statement_hash character varying(500) NOT NULL,
    participants_entity_type character varying(500),
    participants_country character varying(500),
    participants_city character varying(500),
    deadline timestamp without time zone
);


ALTER TABLE public.polls OWNER TO sdf;

--
-- Name: polls_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.polls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.polls_id_seq OWNER TO sdf;

--
-- Name: polls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.polls_id_seq OWNED BY public.polls.id;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.ratings (
    id integer NOT NULL,
    statement_hash character varying(500) NOT NULL,
    subject_name character varying(500) NOT NULL,
    subject_reference character varying(500),
    rating integer NOT NULL,
    comment character varying(3000) NOT NULL,
    quality character varying(500),
    qualified boolean DEFAULT false
);


ALTER TABLE public.ratings OWNER TO sdf;

--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ratings_id_seq OWNER TO sdf;

--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: ssl_cert_cache; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.ssl_cert_cache (
    sha256 text NOT NULL,
    host text,
    subject_o text,
    subject_c text,
    subject_st text,
    subject_l text,
    subject_cn text,
    subject_serialnumber text,
    subjectaltname text,
    issuer_o text,
    issuer_c text,
    issuer_cn text,
    valid_from timestamp without time zone,
    valid_to timestamp without time zone,
    first_seen timestamp without time zone,
    last_seen timestamp without time zone,
    _rank integer
);


ALTER TABLE public.ssl_cert_cache OWNER TO sdf;

--
-- Name: statements; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.statements (
    id integer NOT NULL,
    type public.statement_type NOT NULL,
    domain character varying(100) NOT NULL,
    author character varying(100) NOT NULL,
    statement character varying(3000) NOT NULL,
    proclaimed_publication_time timestamp without time zone,
    hash_b64 character varying(500) NOT NULL,
    referenced_statement character varying(500),
    tags character varying(1000),
    content character varying(3000) NOT NULL,
    content_hash character varying(500) NOT NULL,
    source_node_id integer,
    first_verification_time timestamp without time zone,
    latest_verification_time timestamp without time zone,
    verification_method public.verification_method,
    derived_entity_created boolean NOT NULL,
    derived_entity_creation_retry_count integer,
    superseded_statement character varying(500)
);


ALTER TABLE public.statements OWNER TO sdf;

--
-- Name: statement_with_superseding; Type: VIEW; Schema: public; Owner: sdf
--

CREATE VIEW public.statement_with_superseding AS
 SELECT s1.id,
    s1.type,
    s1.domain,
    s1.author,
    s1.statement,
    s1.proclaimed_publication_time,
    s1.hash_b64,
    s1.referenced_statement,
    s1.tags,
    s1.content,
    s1.content_hash,
    s1.source_node_id,
    s1.first_verification_time,
    s1.latest_verification_time,
    s1.verification_method,
    s1.derived_entity_created,
    s1.derived_entity_creation_retry_count,
    s1.superseded_statement,
    s2.hash_b64 AS superseding_statement
   FROM (public.statements s1
     LEFT JOIN public.statements s2 ON ((((s1.hash_b64)::text = (s2.superseded_statement)::text) AND ((s1.domain)::text = (s2.domain)::text) AND ((s1.author)::text = (s2.author)::text))));


ALTER VIEW public.statement_with_superseding OWNER TO sdf;

--
-- Name: statements_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.statements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.statements_id_seq OWNER TO sdf;

--
-- Name: statements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.statements_id_seq OWNED BY public.statements.id;


--
-- Name: unverified_statements; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.unverified_statements (
    id integer NOT NULL,
    statement character varying(3000) NOT NULL,
    author character varying(100) NOT NULL,
    hash_b64 character varying(500) NOT NULL,
    source_node_id integer,
    received_time timestamp without time zone NOT NULL,
    source_verification_method public.verification_method,
    verification_retry_count integer
);


ALTER TABLE public.unverified_statements OWNER TO sdf;

--
-- Name: unverified_statements_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.unverified_statements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unverified_statements_id_seq OWNER TO sdf;

--
-- Name: unverified_statements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.unverified_statements_id_seq OWNED BY public.unverified_statements.id;


--
-- Name: verification_log; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.verification_log (
    id integer NOT NULL,
    statement_hash character varying(500) NOT NULL,
    t timestamp without time zone NOT NULL,
    api boolean NOT NULL,
    dns boolean NOT NULL,
    txt boolean NOT NULL
);


ALTER TABLE public.verification_log OWNER TO sdf;

--
-- Name: verification_log_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.verification_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verification_log_id_seq OWNER TO sdf;

--
-- Name: verification_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.verification_log_id_seq OWNED BY public.verification_log.id;


--
-- Name: votes; Type: TABLE; Schema: public; Owner: sdf
--

CREATE TABLE public.votes (
    id integer NOT NULL,
    statement_hash character varying(500) NOT NULL,
    poll_hash character varying(500) NOT NULL,
    option character varying(500) NOT NULL,
    domain character varying(100) NOT NULL,
    qualified boolean
);


ALTER TABLE public.votes OWNER TO sdf;

--
-- Name: votes_id_seq; Type: SEQUENCE; Schema: public; Owner: sdf
--

CREATE SEQUENCE public.votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.votes_id_seq OWNER TO sdf;

--
-- Name: votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sdf
--

ALTER SEQUENCE public.votes_id_seq OWNED BY public.votes.id;


--
-- Name: hidden_statements id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.hidden_statements ALTER COLUMN id SET DEFAULT nextval('public.hidden_statements_id_seq'::regclass);


--
-- Name: identity_beliefs_and_reputation id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.identity_beliefs_and_reputation ALTER COLUMN id SET DEFAULT nextval('public.identity_beliefs_and_reputation_id_seq'::regclass);


--
-- Name: organisation_verifications id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.organisation_verifications ALTER COLUMN id SET DEFAULT nextval('public.organisation_verifications_id_seq'::regclass);


--
-- Name: p2p_nodes id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.p2p_nodes ALTER COLUMN id SET DEFAULT nextval('public.p2p_nodes_id_seq'::regclass);


--
-- Name: person_verifications id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.person_verifications ALTER COLUMN id SET DEFAULT nextval('public.person_verifications_id_seq'::regclass);


--
-- Name: polls id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.polls ALTER COLUMN id SET DEFAULT nextval('public.polls_id_seq'::regclass);


--
-- Name: ratings id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: statements id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.statements ALTER COLUMN id SET DEFAULT nextval('public.statements_id_seq'::regclass);


--
-- Name: unverified_statements id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.unverified_statements ALTER COLUMN id SET DEFAULT nextval('public.unverified_statements_id_seq'::regclass);


--
-- Name: verification_log id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.verification_log ALTER COLUMN id SET DEFAULT nextval('public.verification_log_id_seq'::regclass);


--
-- Name: votes id; Type: DEFAULT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.votes ALTER COLUMN id SET DEFAULT nextval('public.votes_id_seq'::regclass);


--
-- Data for Name: hidden_statements; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.hidden_statements (id, type, domain, author, statement, proclaimed_publication_time, hash_b64, referenced_statement, tags, content, content_hash, source_node_id, first_verification_time, latest_verification_time, verification_method, derived_entity_created, derived_entity_creation_retry_count, superseded_statement) FROM stdin;
\.


--
-- Data for Name: identity_beliefs_and_reputation; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.identity_beliefs_and_reputation (id, domain, name, name_confidence, legal_entity_type, legal_entity_type_confidence, country, country_confidence, province, province_confidence, city, city_confidence, reputation, reputation_fallback) FROM stdin;
1	rixdata.net	Rix Data NL B.V.	1	corporation	1	NL	1	\N	\N	Amsterdam	1	1	\N
\.


--
-- Data for Name: organisation_verifications; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.organisation_verifications (id, statement_hash, verifier_domain, verified_domain, foreign_domain, name, legal_entity_type, serial_number, country, province, city, department, confidence) FROM stdin;
53070	PAqLRdXkY5UymL4u6gWIPxqrR9jf5oeStLEnOPkzozE	rixdata.net	usbank.com	\N	U.S. Bancorp	corporation	41-0255900	United States of America (the)	Minnesota	Minneapolis	\N	\N
\.


--
-- Data for Name: p2p_nodes; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.p2p_nodes (id, domain, ip, first_seen, last_seen, reputation, last_received_statement_id, certificate_authority, fingerprint) FROM stdin;
32	stated.3.rixdata.net	34.197.238.43	2023-05-18 21:47:41.334961	2023-07-20 08:02:02.844655	\N	145	http://r3.o.lencr.org	C6:08:08:0A:3B:61:7C:50:AF:AE:25:58:09:04:31:B5:7D:CD:8D:42
\.


--
-- Data for Name: person_verifications; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.person_verifications (id, statement_hash, verifier_domain, verified_domain, foreign_domain, name, birth_country, birth_city, birth_date) FROM stdin;
\.


--
-- Data for Name: polls; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.polls (id, statement_hash, participants_entity_type, participants_country, participants_city, deadline) FROM stdin;
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.ratings (id, statement_hash, subject_name, subject_reference, rating, comment, quality, qualified) FROM stdin;
\.


--
-- Data for Name: ssl_cert_cache; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.ssl_cert_cache (sha256, host, subject_o, subject_c, subject_st, subject_l, subject_cn, subject_serialnumber, subjectaltname, issuer_o, issuer_c, issuer_cn, valid_from, valid_to, first_seen, last_seen, _rank) FROM stdin;
\.


--
-- Data for Name: statements; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.statements (id, type, domain, author, statement, proclaimed_publication_time, hash_b64, referenced_statement, tags, content, content_hash, source_node_id, first_verification_time, latest_verification_time, verification_method, derived_entity_created, derived_entity_creation_retry_count, superseded_statement) FROM stdin;
4853	organisation_verification	rixdata.net	Rix Data NL B.V.	Publishing domain: rixdata.net\nAuthor: Rix Data NL B.V.\nTime: Wed Jun 28 2023 16:04:14 GMT+0200 (Central European Summer Time)\nStatement content: \n\tType: Organisation verification\n\tDescription: We verified the following information about an organisation.\n\tName: U.S. Bancorp\n\tCountry: United States of America (the)\n\tLegal entity: corporation\n\tOwner of the domain: usbank.com\n\tProvince or state: Minnesota\n\tBusiness register number: 41-0255900\n\tCity: Minneapolis\n\tEmployee count: 10,000-100,000\n\tReliability policy: https://stated.rixdata.net/statements/rXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE\n\tConfidence: 0.9\n	2023-06-28 14:04:14	PAqLRdXkY5UymL4u6gWIPxqrR9jf5oeStLEnOPkzozE	\N	\N	\n\tType: Organisation verification\n\tDescription: We verified the following information about an organisation.\n\tName: U.S. Bancorp\n\tCountry: United States of America (the)\n\tLegal entity: corporation\n\tOwner of the domain: usbank.com\n\tProvince or state: Minnesota\n\tBusiness register number: 41-0255900\n\tCity: Minneapolis\n\tEmployee count: 10,000-100,000\n\tReliability policy: https://stated.rixdata.net/statements/rXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE\n\tConfidence: 0.9\n	s2t1m7D4gsG8xf6AuQ2yiv8xp2uKjzgMZBfcx7avs3c	1	2023-06-28 14:04:16.812896	2023-06-28 14:04:16.812896	api	t	0	\N
\.


--
-- Data for Name: unverified_statements; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.unverified_statements (id, statement, author, hash_b64, source_node_id, received_time, source_verification_method, verification_retry_count) FROM stdin;
\.


--
-- Data for Name: verification_log; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.verification_log (id, statement_hash, t, api, dns, txt) FROM stdin;
\.


--
-- Data for Name: votes; Type: TABLE DATA; Schema: public; Owner: sdf
--

COPY public.votes (id, statement_hash, poll_hash, option, domain, qualified) FROM stdin;
\.


--
-- Name: hidden_statements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.hidden_statements_id_seq', 1, false);


--
-- Name: identity_beliefs_and_reputation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.identity_beliefs_and_reputation_id_seq', 1, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--




--
-- Name: organisation_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.organisation_verifications_id_seq', 1, false);


--
-- Name: p2p_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.p2p_nodes_id_seq', 1, false);


--
-- Name: person_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.person_verifications_id_seq', 1, false);


--
-- Name: polls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.polls_id_seq', 1, false);


--
-- Name: ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.ratings_id_seq', 1, false);


--
-- Name: statements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.statements_id_seq', 1, false);


--
-- Name: unverified_statements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.unverified_statements_id_seq', 1, false);


--
-- Name: verification_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.verification_log_id_seq', 1, false);


--
-- Name: votes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sdf
--

SELECT pg_catalog.setval('public.votes_id_seq', 1, false);


--
-- Name: hidden_statements hidden_statements_hash_b64_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.hidden_statements
    ADD CONSTRAINT hidden_statements_hash_b64_key UNIQUE (hash_b64);


--
-- Name: hidden_statements hidden_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.hidden_statements
    ADD CONSTRAINT hidden_statements_pkey PRIMARY KEY (id);


--
-- Name: identity_beliefs_and_reputation identity_beliefs_and_reputation_no_domain_name_duplicates; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.identity_beliefs_and_reputation
    ADD CONSTRAINT identity_beliefs_and_reputation_no_domain_name_duplicates UNIQUE (domain, name);


--
-- Name: identity_beliefs_and_reputation identity_beliefs_and_reputation_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.identity_beliefs_and_reputation
    ADD CONSTRAINT identity_beliefs_and_reputation_pkey PRIMARY KEY (id);


--
-- Name: statements no_domain_author_content_duplicates; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT no_domain_author_content_duplicates UNIQUE (domain, author, content_hash);


--
-- Name: hidden_statements no_hidden_domain_author_content_duplicates; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.hidden_statements
    ADD CONSTRAINT no_hidden_domain_author_content_duplicates UNIQUE (domain, author, content_hash);


--
-- Name: verification_log no_statement_time_duplicates; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.verification_log
    ADD CONSTRAINT no_statement_time_duplicates UNIQUE (statement_hash, t);


--
-- Name: organisation_verifications organisation_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.organisation_verifications
    ADD CONSTRAINT organisation_verifications_pkey PRIMARY KEY (id);


--
-- Name: organisation_verifications organisation_verifications_statement_hash_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.organisation_verifications
    ADD CONSTRAINT organisation_verifications_statement_hash_key UNIQUE (statement_hash);


--
-- Name: p2p_nodes p2p_nodes_domain_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.p2p_nodes
    ADD CONSTRAINT p2p_nodes_domain_key UNIQUE (domain);


--
-- Name: p2p_nodes p2p_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.p2p_nodes
    ADD CONSTRAINT p2p_nodes_pkey PRIMARY KEY (id);


--
-- Name: person_verifications person_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.person_verifications
    ADD CONSTRAINT person_verifications_pkey PRIMARY KEY (id);


--
-- Name: person_verifications person_verifications_statement_hash_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.person_verifications
    ADD CONSTRAINT person_verifications_statement_hash_key UNIQUE (statement_hash);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (id);


--
-- Name: polls polls_statement_hash_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_statement_hash_key UNIQUE (statement_hash);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_statement_hash_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_statement_hash_key UNIQUE (statement_hash);


--
-- Name: ssl_cert_cache ssl_cert_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.ssl_cert_cache
    ADD CONSTRAINT ssl_cert_cache_pkey PRIMARY KEY (sha256);


--
-- Name: statements statements_hash_b64_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_hash_b64_key UNIQUE (hash_b64);


--
-- Name: statements statements_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_pkey PRIMARY KEY (id);


--
-- Name: unverified_statements unverified_statements_hash_b64_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.unverified_statements
    ADD CONSTRAINT unverified_statements_hash_b64_key UNIQUE (hash_b64);


--
-- Name: unverified_statements unverified_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.unverified_statements
    ADD CONSTRAINT unverified_statements_pkey PRIMARY KEY (id);


--
-- Name: verification_log verification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.verification_log
    ADD CONSTRAINT verification_log_pkey PRIMARY KEY (id);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: votes votes_statement_hash_key; Type: CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_statement_hash_key UNIQUE (statement_hash);


--
-- Name: organisation_verifications organisation_verifications_statement_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.organisation_verifications
    ADD CONSTRAINT organisation_verifications_statement_hash_fkey FOREIGN KEY (statement_hash) REFERENCES public.statements(hash_b64) ON DELETE CASCADE;


--
-- Name: person_verifications person_verifications_statement_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.person_verifications
    ADD CONSTRAINT person_verifications_statement_hash_fkey FOREIGN KEY (statement_hash) REFERENCES public.statements(hash_b64) ON DELETE CASCADE;


--
-- Name: polls polls_statement_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_statement_hash_fkey FOREIGN KEY (statement_hash) REFERENCES public.statements(hash_b64) ON DELETE CASCADE;


--
-- Name: ratings ratings_statement_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_statement_hash_fkey FOREIGN KEY (statement_hash) REFERENCES public.statements(hash_b64) ON DELETE CASCADE;


--
-- Name: verification_log verification_log_statement_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.verification_log
    ADD CONSTRAINT verification_log_statement_hash_fkey FOREIGN KEY (statement_hash) REFERENCES public.statements(hash_b64) ON DELETE CASCADE;


--
-- Name: votes votes_statement_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sdf
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_statement_hash_fkey FOREIGN KEY (statement_hash) REFERENCES public.statements(hash_b64) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

