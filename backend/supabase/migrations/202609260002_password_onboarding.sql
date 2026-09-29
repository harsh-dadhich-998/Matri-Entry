BEGIN;
-- Check current server-controlled Auth metadata, not an editable profile or stale JWT.
CREATE OR REPLACE FUNCTION private.password_ready() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = (SELECT auth.uid())
 AND coalesce(a.raw_app_meta_data->>'must_change_password','false') = 'false'
 AND coalesce(a.raw_app_meta_data->>'credentials_version','') = coalesce(auth.jwt()->'app_metadata'->>'credentials_version',''));
$$;
REVOKE ALL ON FUNCTION private.password_ready() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.password_ready() TO authenticated;
CREATE OR REPLACE FUNCTION private.has_access() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT private.password_ready() AND EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND status = 'active' AND (expiry_date IS NULL OR expiry_date > now()));
$$;
CREATE OR REPLACE FUNCTION private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT private.password_ready() AND EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin' AND status = 'active' AND (expiry_date IS NULL OR expiry_date > now()));
$$;
CREATE OR REPLACE FUNCTION private.can_use_slot(owner_id text, slot integer) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT private.password_ready() AND EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND id::text = owner_id AND role = 'operator' AND status = 'active' AND (expiry_date IS NULL OR expiry_date > now()) AND slot BETWEEN 1 AND assigned_records);
$$;
COMMIT;
