-- ts_template DB init (local)
-- Assumes database "ts_template" already exists and you are connected to it.
--
-- IMPORTANT: Run migrations as ts_template_admin, otherwise default privileges won't apply

-- Roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ts_template_admin') THEN
        CREATE ROLE ts_template_admin WITH LOGIN PASSWORD 'ts_template_admin_local';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ts_template_app') THEN
        CREATE ROLE ts_template_app WITH LOGIN PASSWORD 'ts_template_app_local';
    END IF;
END $$;

-- Lock down database defaults
REVOKE ALL ON DATABASE ts_template FROM PUBLIC;
GRANT CONNECT ON DATABASE ts_template TO ts_template_admin, ts_template_app;
GRANT CREATE ON DATABASE ts_template TO ts_template_admin;

-- Lock down public schema (allow usage for tooling, but no object creation)
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- App schema (use this for all tables)
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION ts_template_admin;
ALTER SCHEMA app OWNER TO ts_template_admin;

-- Drizzle schema (for migration tracking)
CREATE SCHEMA IF NOT EXISTS drizzle AUTHORIZATION ts_template_admin;
ALTER SCHEMA drizzle OWNER TO ts_template_admin;

-- Schema privileges
GRANT USAGE, CREATE ON SCHEMA app TO ts_template_admin;
GRANT USAGE ON SCHEMA app TO ts_template_app;
GRANT USAGE, CREATE ON SCHEMA drizzle TO ts_template_admin;
REVOKE CREATE ON SCHEMA public FROM ts_template_app;

-- Ensure runtime role can use existing objects (if any)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO ts_template_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO ts_template_app;

-- Default privileges for future objects created by ts_template_admin
ALTER DEFAULT PRIVILEGES FOR ROLE ts_template_admin IN SCHEMA app
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ts_template_app;

ALTER DEFAULT PRIVILEGES FOR ROLE ts_template_admin IN SCHEMA app
    GRANT USAGE, SELECT ON SEQUENCES TO ts_template_app;

ALTER DEFAULT PRIVILEGES FOR ROLE ts_template_admin IN SCHEMA app
    GRANT EXECUTE ON FUNCTIONS TO ts_template_app;

ALTER DEFAULT PRIVILEGES FOR ROLE ts_template_admin IN SCHEMA app
    GRANT USAGE ON TYPES TO ts_template_app;

-- Set search_path for both roles
ALTER ROLE ts_template_app SET search_path = app, pg_catalog;
ALTER ROLE ts_template_admin SET search_path = app, pg_catalog;

-- Operational timeouts for app role (prevent runaway queries and connection exhaustion)
ALTER ROLE ts_template_app SET statement_timeout = '30s';
ALTER ROLE ts_template_app SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE ts_template_app SET lock_timeout = '5s';
