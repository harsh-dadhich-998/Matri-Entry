-- Run after 202609270001_custom_server_auth.sql in a test project.
-- Checks that only the private Node API role can access workspace tables.
DO $$
DECLARE
    target_role TEXT;
    target_table TEXT;
    tables TEXT[] := ARRAY['public.users', 'public.matrimonial_records', 'public.activity_logs', 'public.app_sessions'];
BEGIN
    FOREACH target_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        FOREACH target_table IN ARRAY tables LOOP
            IF has_table_privilege(target_role, target_table, 'SELECT')
                OR has_table_privilege(target_role, target_table, 'INSERT')
                OR has_table_privilege(target_role, target_table, 'UPDATE')
                OR has_table_privilege(target_role, target_table, 'DELETE') THEN
                RAISE EXCEPTION 'Browser role % still has privileges on %', target_role, target_table;
            END IF;
        END LOOP;
    END LOOP;

    FOREACH target_table IN ARRAY tables LOOP
        IF NOT has_table_privilege('service_role', target_table, 'SELECT')
            OR NOT has_table_privilege('service_role', target_table, 'INSERT')
            OR NOT has_table_privilege('service_role', target_table, 'UPDATE')
            OR NOT has_table_privilege('service_role', target_table, 'DELETE') THEN
            RAISE EXCEPTION 'Server role is missing access on %', target_table;
        END IF;
    END LOOP;

    IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = ANY(ARRAY['users','matrimonial_records','activity_logs','app_sessions'])
            AND c.relrowsecurity) <> 4 THEN
        RAISE EXCEPTION 'RLS must remain enabled on all workspace tables';
    END IF;
END $$;
