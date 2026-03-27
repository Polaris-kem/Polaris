-- =============================================================================
-- 加工進捗ビュー（旧 SQL Server dbo.V_加工進捗 互換）
-- =============================================================================
-- 旧定義:
--   SELECT KeyDate, ConstructionNo, SymbolMachine, SymbolUnit, DrawingNo, PartNo,
--          Description, MaterialCode, Qty, QtyUnit, WeightMaterial, WeightFinished,
--          UnitDrawingNo, PrintDate, KanryoDate
--   FROM dbo.T_ManufctParts
--   WHERE LEN(DrawingNo) > 6
--   ORDER BY KanryoDate, DrawingNo, PartNo
--
-- データソースは T_ManufctParts 単体。図面番号が7文字以上のもののみ対象。
-- アプリ側で ORDER BY KanryoDate, DrawingNo, PartNo を適用してください。
-- =============================================================================

-- 列名はすべて小文字で統一（symbolmachine, symbolunit, description, materialcode, qty, qtyunit, weightmaterial, weightfinished, printdate, kanryodate）
-- 工事番号列が constructno のみの場合は、下の constructionno を constructno に書き換えてください。
DROP VIEW IF EXISTS v_加工進捗;
CREATE VIEW v_加工進捗 AS
SELECT
    keydate,
    constructionno,
    symbolmachine,
    symbolunit,
    drawingno,
    partno,
    description,
    materialcode,
    qty,
    qtyunit,
    weightmaterial,
    weightfinished,
    unitdrawingno,
    printdate,
    kanryodate
FROM t_manufctparts
WHERE length(trim(coalesce(drawingno, ''))) > 6;

COMMENT ON VIEW v_加工進捗 IS '加工進捗一覧。旧V_加工進捗互換。列名はすべて小文字。図面番号長>6。';

-- ※ 上記で「列が存在しない」エラーになる列だけ、NULL に差し替えてください。例: partno が無い場合 → NULL::varchar AS partno
