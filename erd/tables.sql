CREATE EXTENSION pgcrypto;


-- EMITEN

CREATE TABLE public.t_emiten
(
    emitenid uuid NOT NULL DEFAULT gen_random_uuid(),
    emitencode character varying NOT NULL,
    emitenname character varying NOT NULL,
    emitenyahoocode character varying NOT NULL,
    created timestamp NOT NULL DEFAULT now(),
    createby character varying,
    updated timestamp,
    updateby character varying,
    deleteflag integer NOT NULL DEFAULT 0,
    PRIMARY KEY (emitenid)
)

TABLESPACE pg_default;

ALTER TABLE public.t_emiten
    OWNER to katasaham;





-- USER

CREATE TABLE public.t_user
(
    userid uuid NOT NULL DEFAULT gen_random_uuid(),
    username character varying(50) NOT NULL,
    password character varying(200) NOT NULL,
    isactive int not null default 0, -- 0 disabled, 1 enabled
    isadmin int not null default 0, -- 0 not admin (show role), 990 admin
    isapprove int not null default 0, -- 0 not approved, 1 approved
    npk character varying(10) not null default (''),
    name character varying not null,
    secretkey character varying(200) not null, -- secret key for encode decode
    created timestamp NOT NULL DEFAULT now(),
    createby character varying,
    updated timestamp,
    updateby character varying,
    deleteflag integer NOT NULL DEFAULT 0,
    PRIMARY KEY (userid)
)

TABLESPACE pg_default;

ALTER TABLE public.t_user
    OWNER to katasaham;
