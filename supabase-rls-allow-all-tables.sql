-- ============================================================
-- 全テーブルで RLS を許可する（SELECT / INSERT / UPDATE / DELETE）
-- Supabase ダッシュボード → SQL Editor で実行してください。
-- ============================================================

-- 認証ユーザー（ログイン済み）に全操作を許可
DO $$
DECLARE
  r RECORD;
  pol_name TEXT := 'Allow all for authenticated';
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      pol_name, r.tablename
    );
    RAISE NOTICE 'Policy created for: %', r.tablename;
  END LOOP;
END $$;

-- 匿名アクセス（anon キー・未ログイン）でも登録したい場合は以下も実行
DO $$
DECLARE
  r RECORD;
  pol_name TEXT := 'Allow all for anon';
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      pol_name, r.tablename
    );
    RAISE NOTICE 'Policy (anon) created for: %', r.tablename;
  END LOOP;
END $$;
