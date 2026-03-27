-- ============================================================
-- 全テーブル・ビューに SELECT / INSERT / UPDATE / DELETE を付与
-- Supabase ダッシュボード → SQL Editor で実行してください。
-- ============================================================

-- スキーマの利用権限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 既存の全テーブル・ビューに全操作を付与（public 内のすべて）
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- シーケンス（INSERT 時の SERIAL / nextval 用）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 今後作成するテーブル・ビューにも同じ権限を付与
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- ========== RLS を有効にしたまま「全許可」にする場合 ==========
-- テーブルごとに FOR ALL のポリシーを作成（認証ユーザー）
DO $$
DECLARE
  r RECORD;
  pol_name TEXT := 'Allow all for authenticated';
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      pol_name, r.tablename
    );
    RAISE NOTICE 'Policy created for table: %', r.tablename;
  END LOOP;
END $$;

-- 匿名（anon キー）でも全操作を許可する場合
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
    RAISE NOTICE 'Policy (anon) created for table: %', r.tablename;
  END LOOP;
END $$;

-- ビューは RLS 対象外。上記 GRANT ON ALL TABLES で SELECT 等が付与済み。
-- 以上で「書込み・セレクト・編集・追加」などすべて可能になります。
