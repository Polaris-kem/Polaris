-- =============================================================================
-- 夜間バッチ 原価集計ロジック（PL/pgSQL）
-- docs/夜間バッチ原価集計ロジック.md に基づく実装
-- 複合キー: constructno + keydate（工事番号 + 受注登録日）
-- 実行: SELECT run_night_batch_cost_aggregation(3000);
-- =============================================================================
--
-- 【実績テーブルに必要なカラム（不足時は ALTER TABLE で追加）】
-- t_purchaseparts: constructno, keydate, totalprice, eachprice, orderqty, currencyrate,
--   cancelflg, deleteflg, betsuSeisakuFlg
-- t_manufctpurchase: constructno, keydate, totalprice, orderdivcode, cancelflg, deleteflg, betsuSeisakuFlg
-- t_expense: constructno, keydate, totalprice, cancelflg, deleteflg, betsuSeisakuFlg
-- t_worktime: constructno, keydate, hours, cancelflg, betsuSeisakuFlg
-- t_worktimekako: constructno, hours, betsuSeisakuFlg（keydate は t_construction と JOIN で取得）
--
-- 本ファイルではスキーマは小文字（constructno, keydate）を前提としています。
-- 実際のテーブルが PascalCase の場合は、該当カラムを "ConstructionNo", "KeyDate" のように二重引用符で囲んでください。

-- ========== 集計結果格納テーブル（存在しない場合のみ作成） ==========

-- 工事番号別原価集計
CREATE TABLE IF NOT EXISTS t_cost_agg_by_construction (
    constructno VARCHAR(50) NOT NULL,
    keydate DATE NOT NULL,
    purchase_cost DECIMAL(18, 2) DEFAULT 0,
    outsourcing_cost DECIMAL(18, 2) DEFAULT 0,
    material_cost DECIMAL(18, 2) DEFAULT 0,
    expense_cost DECIMAL(18, 2) DEFAULT 0,
    labor_cost DECIMAL(18, 2) DEFAULT 0,
    total_cost DECIMAL(18, 2) DEFAULT 0,
    sales_amount DECIMAL(18, 2),
    gross_profit DECIMAL(18, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (constructno, keydate)
);
COMMENT ON TABLE t_cost_agg_by_construction IS '夜間バッチ: 工事番号別原価集計（t_工事番号別原価集計に相当）';

-- 機械別・ユニット別・図面番号別は同一工事内の粒度のため、機械コード・ユニット・図面番号をキーに持つ
CREATE TABLE IF NOT EXISTS t_cost_agg_by_machine (
    constructno VARCHAR(50) NOT NULL,
    keydate DATE NOT NULL,
    machine VARCHAR(50) NOT NULL,
    total_cost DECIMAL(18, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (constructno, keydate, machine)
);
COMMENT ON TABLE t_cost_agg_by_machine IS '夜間バッチ: 機械別原価集計';

CREATE TABLE IF NOT EXISTS t_cost_agg_by_unit (
    constructno VARCHAR(50) NOT NULL,
    keydate DATE NOT NULL,
    machine VARCHAR(50) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    total_cost DECIMAL(18, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (constructno, keydate, machine, unit)
);
COMMENT ON TABLE t_cost_agg_by_unit IS '夜間バッチ: ユニット別原価集計';

CREATE TABLE IF NOT EXISTS t_cost_agg_by_drawing (
    constructno VARCHAR(50) NOT NULL,
    keydate DATE NOT NULL,
    drawingno VARCHAR(50) NOT NULL,
    material_cost DECIMAL(18, 2) DEFAULT 0,
    outsourcing_cost DECIMAL(18, 2) DEFAULT 0,
    total_cost DECIMAL(18, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (constructno, keydate, drawingno)
);
COMMENT ON TABLE t_cost_agg_by_drawing IS '夜間バッチ: 図面番号別原価集計';

-- ========== ① 購入部品費集計 ==========
-- t_purchaseparts: TotalPrice または EachPrice*OrderQty*COALESCE(CurrencyRate,1). CancelFlg/DeleteFlg/BetsuSeisakuFlg で除外
CREATE OR REPLACE FUNCTION fn_agg_purchase_parts()
RETURNS TABLE(constructno VARCHAR(50), keydate DATE, purchase_cost DECIMAL(18, 2))
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pp.constructno,
        pp.keydate::DATE,
        COALESCE(SUM(
            COALESCE(pp.totalprice, (pp.eachprice * COALESCE(pp.orderqty, 0) * COALESCE(pp.currencyrate, 1))
        ), 0)::DECIMAL(18,2)
    FROM t_purchaseparts pp
    WHERE (pp.cancelflg = 0 OR pp.cancelflg IS NULL)
      AND (pp.deleteflg = 0 OR pp.deleteflg IS NULL)
      AND (pp.betsuseisakuflg = 0 OR pp.betsuseisakuflg IS NULL)
    GROUP BY pp.constructno, pp.keydate;
END;
$$;

-- ========== ② 外注加工費・材料費集計 ==========
-- t_manufctpurchase: OrderDivCode で C=外注加工, R=材料 に振り分け
CREATE OR REPLACE FUNCTION fn_agg_manufct_purchase()
RETURNS TABLE(
    constructno VARCHAR(50),
    keydate DATE,
    outsourcing_cost DECIMAL(18, 2),
    material_cost DECIMAL(18, 2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mp.constructno,
        mp.keydate::DATE,
        COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(mp.orderdivcode,''))) LIKE 'C%' OR mp.orderdivcode = 'C' THEN COALESCE(mp.totalprice, 0) ELSE 0 END), 0)::DECIMAL(18,2),
        COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(mp.orderdivcode,''))) LIKE 'R%' OR mp.orderdivcode = 'R' THEN COALESCE(mp.totalprice, 0) ELSE 0 END), 0)::DECIMAL(18,2)
    FROM t_manufctpurchase mp
    WHERE (mp.cancelflg = 0 OR mp.cancelflg IS NULL)
      AND (mp.deleteflg = 0 OR mp.deleteflg IS NULL)
      AND (mp.betsuseisakuflg = 0 OR mp.betsuseisakuflg IS NULL)
    GROUP BY mp.constructno, mp.keydate;
END;
$$;

-- ========== ③ 諸経費集計 ==========
-- t_expense が存在する場合。存在しない場合は CREATE TABLE を先に実行するか、関数内で EXCEPTION でスキップ
CREATE OR REPLACE FUNCTION fn_agg_expense()
RETURNS TABLE(constructno VARCHAR(50), keydate DATE, expense_cost DECIMAL(18, 2))
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 't_expense') THEN
        RETURN;
    END IF;
    RETURN QUERY
    SELECT
        e.constructno,
        e.keydate::DATE,
        COALESCE(SUM(e.totalprice), 0)::DECIMAL(18,2)
    FROM t_expense e
    WHERE (e.cancelflg = 0 OR e.cancelflg IS NULL)
      AND (e.deleteflg = 0 OR e.deleteflg IS NULL)
      AND (e.betsuseisakuflg = 0 OR e.betsuseisakuflg IS NULL)
    GROUP BY e.constructno, e.keydate;
END;
$$;

-- ========== ④ 社内工数（人件費）集計 ==========
-- t_worktime（機械単位）, t_worktimekako（図面単位）。t_worktimekako に keydate が無い場合は t_construction と JOIN
CREATE OR REPLACE FUNCTION fn_agg_labor_cost(p_hourly_rate DECIMAL DEFAULT 3000)
RETURNS TABLE(constructno VARCHAR(50), keydate DATE, labor_cost DECIMAL(18, 2))
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.constructno,
        w.keydate::DATE,
        (COALESCE(SUM(COALESCE(w.hours, 0)), 0) * p_hourly_rate)::DECIMAL(18,2)
    FROM (
        SELECT wt.constructno, wt.keydate, wt.hours
        FROM t_worktime wt
        WHERE (wt.cancelflg = 0 OR wt.cancelflg IS NULL)
          AND (wt.betsuseisakuflg = 0 OR wt.betsuseisakuflg IS NULL)
        UNION ALL
        SELECT wk.constructno, c.keydate, wk.hours
        FROM t_worktimekako wk
        JOIN t_construction c ON c.constructno = wk.constructno
        WHERE (wk.betsuseisakuflg = 0 OR wk.betsuseisakuflg IS NULL)
    ) w
    GROUP BY w.constructno, w.keydate;
END;
$$;

-- ========== メイン: 夜間バッチ 原価集計 実行 ==========
CREATE OR REPLACE FUNCTION run_night_batch_cost_aggregation(p_hourly_rate DECIMAL DEFAULT 3000)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 工事番号別集計テーブルを一旦クリア（全件再計算）
    TRUNCATE TABLE t_cost_agg_by_construction;

    -- ① 購入部品費
    INSERT INTO t_cost_agg_by_construction (constructno, keydate, purchase_cost, updated_at)
    SELECT a.constructno, a.keydate, a.purchase_cost, NOW()
    FROM fn_agg_purchase_parts() a
    ON CONFLICT (constructno, keydate) DO UPDATE SET
        purchase_cost = EXCLUDED.purchase_cost,
        updated_at = NOW();

    -- ② 外注加工費・材料費（存在しないキーは新規INSERT、存在する場合は加算）
    INSERT INTO t_cost_agg_by_construction (constructno, keydate, outsourcing_cost, material_cost, updated_at)
    SELECT m.constructno, m.keydate, m.outsourcing_cost, m.material_cost, NOW()
    FROM fn_agg_manufct_purchase() m
    ON CONFLICT (constructno, keydate) DO UPDATE SET
        outsourcing_cost = t_cost_agg_by_construction.outsourcing_cost + EXCLUDED.outsourcing_cost,
        material_cost = t_cost_agg_by_construction.material_cost + EXCLUDED.material_cost,
        updated_at = NOW();

    -- ③ 諸経費（t_expense が存在する場合のみ）
    INSERT INTO t_cost_agg_by_construction (constructno, keydate, expense_cost, updated_at)
    SELECT e.constructno, e.keydate, e.expense_cost, NOW()
    FROM fn_agg_expense() e
    ON CONFLICT (constructno, keydate) DO UPDATE SET
        expense_cost = t_cost_agg_by_construction.expense_cost + EXCLUDED.expense_cost,
        updated_at = NOW();

    -- ④ 社内工数（人件費）
    INSERT INTO t_cost_agg_by_construction (constructno, keydate, labor_cost, updated_at)
    SELECT l.constructno, l.keydate, l.labor_cost, NOW()
    FROM fn_agg_labor_cost(p_hourly_rate) l
    ON CONFLICT (constructno, keydate) DO UPDATE SET
        labor_cost = t_cost_agg_by_construction.labor_cost + EXCLUDED.labor_cost,
        updated_at = NOW();

    -- total_cost を再計算
    UPDATE t_cost_agg_by_construction
    SET total_cost = COALESCE(purchase_cost, 0) + COALESCE(outsourcing_cost, 0) + COALESCE(material_cost, 0) + COALESCE(expense_cost, 0) + COALESCE(labor_cost, 0),
        updated_at = NOW();

    -- 売上・粗利は t_acceptorder と JOIN して更新（任意）
    UPDATE t_cost_agg_by_construction c
    SET sales_amount = a.orderprice,
        gross_profit = a.orderprice - c.total_cost,
        updated_at = NOW()
    FROM t_acceptorder a
    WHERE a.constructno = c.constructno
      AND (a.registerdate = c.keydate OR (a.registerdate IS NULL AND c.keydate IS NULL));
END;
$$;

COMMENT ON FUNCTION run_night_batch_cost_aggregation(DECIMAL) IS '夜間バッチ: 工事番号+KeyDate単位で原価を集計し t_cost_agg_by_construction に格納。p_hourly_rate は人件費の時給単価。';

-- ========== 実行例 ==========
-- SELECT run_night_batch_cost_aggregation(3000);
-- 結果確認: SELECT * FROM t_cost_agg_by_construction ORDER BY constructno, keydate;
