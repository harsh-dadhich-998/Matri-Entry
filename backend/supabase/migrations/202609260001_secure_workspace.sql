BEGIN;
-- MatriEntry PostgreSQL Schema for Supabase
-- Run this in your Supabase SQL Editor to set up tables and indexes

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    mobile TEXT,
    email TEXT,
    assigned_records INT DEFAULT 100,
    completed_records INT DEFAULT 0,
    pending_records INT DEFAULT 100,
    first_login TEXT,
    expiry_date TIMESTAMPTZ,
    expiry_days INT DEFAULT 25,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Matrimonial Records Table
CREATE TABLE IF NOT EXISTS public.matrimonial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_number INT NOT NULL,
    operator_id TEXT NOT NULL,
    submitted_by_username TEXT NOT NULL,
    submitted_by_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    profile_id TEXT NOT NULL,
    posted_on TEXT,
    full_name TEXT,
    gender TEXT,
    age INT,
    education TEXT,
    education_detail TEXT,
    occupation TEXT,
    annual_income TEXT,
    marital_status TEXT,
    religion TEXT,
    caste TEXT,
    sub_caste TEXT,
    gothram TEXT,
    family_type TEXT,
    mother_tongue TEXT,
    star TEXT,
    raasi_moon_sign TEXT,
    dhosham_manglik TEXT,
    horoscope_match TEXT,
    height TEXT,
    weight TEXT,
    body_type TEXT,
    physical_status TEXT,
    complexion TEXT,
    eating_habit TEXT,
    smoke_habit TEXT,
    drink_habit TEXT,
    citizen_of TEXT,
    country_living_in TEXT,
    home_state TEXT,
    family_value TEXT,
    family_status TEXT,
    mobile_number TEXT,
    about_family TEXT,
    more_description TEXT,
    expectations TEXT,
    additional_notes TEXT,
    submitted_at TIMESTAMPTZ,
    last_updated_on TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    username TEXT,
    action TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'system',
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matrimonial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;


-- Replace the prototype policies rather than leaving permissive policies active.
DO $$ DECLARE policy_row record; BEGIN
 FOR policy_row IN SELECT schemaname, tablename, policyname FROM pg_policies
 WHERE schemaname = 'public' AND tablename IN ('users', 'matrimonial_records', 'activity_logs') LOOP
  EXECUTE format('DROP POLICY %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
 END LOOP;
END $$;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
CREATE OR REPLACE FUNCTION private.has_access() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND status = 'active' AND (expiry_date IS NULL OR expiry_date > now()));
$$;
CREATE OR REPLACE FUNCTION private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin' AND status = 'active' AND (expiry_date IS NULL OR expiry_date > now()));
$$;
CREATE OR REPLACE FUNCTION private.can_use_slot(owner_id text, slot integer) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND id::text = owner_id AND role = 'operator' AND status = 'active' AND (expiry_date IS NULL OR expiry_date > now()) AND slot BETWEEN 1 AND assigned_records);
$$;
REVOKE ALL ON FUNCTION private.has_access(), private.is_admin(), private.can_use_slot(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_access(), private.is_admin(), private.can_use_slot(text, integer) TO authenticated;

REVOKE ALL ON public.users, public.matrimonial_records, public.activity_logs FROM anon, authenticated;
GRANT SELECT ON public.users, public.matrimonial_records, public.activity_logs TO authenticated;
GRANT UPDATE (name, mobile, assigned_records, expiry_date, status) ON public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.matrimonial_records TO authenticated;
CREATE POLICY workspace_users_read ON public.users FOR SELECT TO authenticated USING (private.is_admin() OR (id = (SELECT auth.uid()) AND private.has_access()));
CREATE POLICY workspace_users_update ON public.users FOR UPDATE TO authenticated USING (private.is_admin() AND role = 'operator') WITH CHECK (private.is_admin() AND role = 'operator');
CREATE POLICY workspace_records_read ON public.matrimonial_records FOR SELECT TO authenticated USING (private.is_admin() OR (operator_id = (SELECT auth.uid())::text AND private.has_access()));
CREATE POLICY workspace_records_insert ON public.matrimonial_records FOR INSERT TO authenticated WITH CHECK (private.is_admin() OR private.can_use_slot(operator_id, slot_number));
CREATE POLICY workspace_records_update ON public.matrimonial_records FOR UPDATE TO authenticated USING (private.is_admin() OR private.can_use_slot(operator_id, slot_number)) WITH CHECK (private.is_admin() OR private.can_use_slot(operator_id, slot_number));
CREATE POLICY workspace_records_delete ON public.matrimonial_records FOR DELETE TO authenticated USING (private.is_admin());
CREATE POLICY workspace_logs_read ON public.activity_logs FOR SELECT TO authenticated USING (private.is_admin() OR (user_id = (SELECT auth.uid())::text AND private.has_access()));

ALTER TABLE public.users ALTER COLUMN assigned_records SET DEFAULT 0;
ALTER TABLE public.users ALTER COLUMN pending_records SET DEFAULT 0;
ALTER TABLE public.users ADD CONSTRAINT workspace_assignment_bounds CHECK (assigned_records BETWEEN 0 AND 10000);
ALTER TABLE public.users ADD CONSTRAINT workspace_role CHECK (role IN ('admin','operator'));
ALTER TABLE public.users ADD CONSTRAINT workspace_status CHECK (status IN ('active','inactive','expired'));
ALTER TABLE public.matrimonial_records ADD CONSTRAINT workspace_record_status CHECK (status IN ('Draft','Submitted'));
ALTER TABLE public.matrimonial_records ADD CONSTRAINT workspace_slot_positive CHECK (slot_number > 0);
ALTER TABLE public.matrimonial_records ADD CONSTRAINT workspace_submission_fields CHECK (status <> 'Submitted' OR (length(trim(coalesce(full_name,''))) > 0 AND length(trim(coalesce(profile_id,''))) > 0));
CREATE UNIQUE INDEX IF NOT EXISTS workspace_operator_slot ON public.matrimonial_records(operator_id, slot_number);
CREATE INDEX IF NOT EXISTS workspace_log_time ON public.activity_logs(timestamp DESC);

-- Authorship and audit events come from the authenticated session, never form input.
CREATE OR REPLACE FUNCTION private.prepare_record() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE owner_row public.users; BEGIN
 SELECT * INTO owner_row FROM public.users WHERE id::text = NEW.operator_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Record owner does not exist'; END IF;
 IF TG_OP = 'UPDATE' AND (NEW.operator_id <> OLD.operator_id OR NEW.slot_number <> OLD.slot_number OR NEW.id <> OLD.id) THEN RAISE EXCEPTION 'Record ownership cannot change'; END IF;
 NEW.submitted_by_username := owner_row.username;
 NEW.submitted_by_name := owner_row.name;
 NEW.last_updated_on := now();
 IF TG_OP = 'INSERT' THEN NEW.created_at := now(); ELSE NEW.created_at := OLD.created_at; END IF;
 IF NEW.status = 'Submitted' THEN
   IF TG_OP = 'UPDATE' THEN NEW.submitted_at := coalesce(OLD.submitted_at, now()); ELSE NEW.submitted_at := now(); END IF;
 ELSE NEW.submitted_at := NULL; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER workspace_prepare_record BEFORE INSERT OR UPDATE ON public.matrimonial_records FOR EACH ROW EXECUTE FUNCTION private.prepare_record();
CREATE OR REPLACE FUNCTION private.audit_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_name text; BEGIN
 SELECT username INTO actor_name FROM public.users WHERE id = auth.uid();
 INSERT INTO public.activity_logs (user_id, username, action, description, type)
 VALUES (auth.uid()::text, coalesce(actor_name, 'System'), TG_OP || ' ' || TG_TABLE_NAME,
 CASE WHEN TG_TABLE_NAME = 'users' THEN 'Operator account changed' ELSE 'Matrimonial record changed' END,
 CASE WHEN TG_TABLE_NAME = 'users' THEN 'user_management' ELSE 'submission' END);
 RETURN NULL;
END $$;
CREATE TRIGGER workspace_record_audit AFTER INSERT OR UPDATE OR DELETE ON public.matrimonial_records FOR EACH ROW EXECUTE FUNCTION private.audit_change();
CREATE TRIGGER workspace_user_audit AFTER INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION private.audit_change();
REVOKE ALL ON FUNCTION private.prepare_record(), private.audit_change() FROM PUBLIC;

COMMIT;
