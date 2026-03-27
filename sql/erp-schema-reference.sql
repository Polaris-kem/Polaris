-- ERP基幹システム スキーマ参照（開発者向け）
-- docs/新システム開発者向け仕様.md に基づく拡張テーブル・ビュー案
-- 既存の supabase-table-schemas.sql に含まれる t_acceptorder, t_staffcode 等は省略。
-- テーブル名はすべて小文字。

-- ========== マスタ（参照用・必要に応じて作成） ==========
-- t_companycode, t_staffcode は既存または別ファイルで定義済み想定。

-- t_workcode: 職種の定義コード
CREATE TABLE IF NOT EXISTS t_workcode (
    id BIGSERIAL PRIMARY KEY,
    workcode VARCHAR(50) NOT NULL,
    workname VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- t_worktimecode: 作業内容の定義コード
CREATE TABLE IF NOT EXISTS t_worktimecode (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== 業務プロセス用テーブル ==========

-- t_construction: 工事基本情報（受注元と納入先の紐付け）
CREATE TABLE IF NOT EXISTS t_construction (
    id BIGSERIAL PRIMARY KEY,
    constructno VARCHAR(50) NOT NULL,
    keydate DATE,
    registerdate DATE,
    ownercode VARCHAR(50),
    usercode VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_t_construction_constructno_keydate ON t_construction(constructno, keydate);

-- t_manufctparts: 製作部品の進捗ステータス管理
CREATE TABLE IF NOT EXISTS t_manufctparts (
    id BIGSERIAL PRIMARY KEY,
    constructno VARCHAR(50),
    keydate DATE,
    drawingno VARCHAR(50),
    completion_planned_date DATE,
    completion_date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_t_manufctparts_constructno ON t_manufctparts(constructno);
CREATE INDEX IF NOT EXISTS idx_t_manufctparts_drawingno ON t_manufctparts(drawingno);

-- t_purchaseparts: 購入部品の発注・検収実績
CREATE TABLE IF NOT EXISTS t_purchaseparts (
    id BIGSERIAL PRIMARY KEY,
    constructno VARCHAR(50),
    keydate DATE,
    order_no VARCHAR(50),
    drawingno VARCHAR(50),
    received_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_t_purchaseparts_constructno ON t_purchaseparts(constructno);

-- t_manufctpurchase: 外注加工および材料の発注・検収実績
CREATE TABLE IF NOT EXISTS t_manufctpurchase (
    id BIGSERIAL PRIMARY KEY,
    constructno VARCHAR(50),
    keydate DATE,
    order_no VARCHAR(50),
    received_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_t_manufctpurchase_constructno ON t_manufctpurchase(constructno);

-- t_worktime: 社内工数実績（機械単位または図面単位）
CREATE TABLE IF NOT EXISTS t_worktime (
    id BIGSERIAL PRIMARY KEY,
    constructno VARCHAR(50),
    keydate DATE,
    drawingno VARCHAR(50),
    work_date DATE,
    hours DECIMAL(10, 2),
    staffcode VARCHAR(50),
    workcode VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_t_worktime_constructno ON t_worktime(constructno);
CREATE INDEX IF NOT EXISTS idx_t_worktime_work_date ON t_worktime(work_date);

-- t_worktimekako: 社内工数実績（加工部門用）
CREATE TABLE IF NOT EXISTS t_worktimekako (
    id BIGSERIAL PRIMARY KEY,
    constructno VARCHAR(50),
    drawingno VARCHAR(50),
    work_date DATE,
    hours DECIMAL(10, 2),
    staffcode VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_t_worktimekako_drawingno ON t_worktimekako(drawingno);

-- ========== 集計ビュー（夜間バッチ結果の参照用・実体はバッチが書き込むテーブルでも可） ==========

-- v_加工進捗: 部品単位の現在の状態（ビューまたはマテリアライズドビュー）
-- 実装時は t_manufctparts 等を JOIN した SELECT で定義
/*
CREATE OR REPLACE VIEW v_加工進捗 AS
SELECT
    m.constructno,
    m.keydate,
    m.drawingno,
    m.completion_planned_date,
    m.completion_date,
    m.status
FROM t_manufctparts m;
*/

-- v_工事番号別原価集計: 夜間バッチで計算された原価・粗利
-- 実装時は集計テーブルを参照するビューまたはマテリアライズドビュー
/*
CREATE TABLE IF NOT EXISTS t_工事番号別原価集計 (
    constructno VARCHAR(50),
    keydate DATE,
    total_cost DECIMAL(18, 2),
    gross_profit DECIMAL(18, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE OR REPLACE VIEW v_工事番号別原価集計 AS SELECT * FROM t_工事番号別原価集計;
*/

-- コメント
COMMENT ON TABLE t_construction IS '工事基本情報（受注元・納入先紐付け）';
COMMENT ON TABLE t_manufctparts IS '製作部品進捗';
COMMENT ON TABLE t_purchaseparts IS '購入部品発注・検収';
COMMENT ON TABLE t_manufctpurchase IS '外注加工・材料発注・検収';
COMMENT ON TABLE t_worktime IS '社内工数実績（1日7.75h・単位0.25h）';
COMMENT ON TABLE t_worktimekako IS '社内工数実績（加工・図面単位）';
