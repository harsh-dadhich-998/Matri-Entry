BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.app_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_sessions_user_id ON public.app_sessions(user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expiry ON public.app_sessions(expires_at);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matrimonial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE policy_row record; BEGIN
  FOR policy_row IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('users', 'matrimonial_records', 'activity_logs', 'app_sessions')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

REVOKE ALL ON public.users, public.matrimonial_records, public.activity_logs, public.app_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.users, public.matrimonial_records, public.activity_logs, public.app_sessions TO service_role;

DROP TRIGGER IF EXISTS workspace_record_audit ON public.matrimonial_records;
DROP TRIGGER IF EXISTS workspace_user_audit ON public.users;

COMMIT;