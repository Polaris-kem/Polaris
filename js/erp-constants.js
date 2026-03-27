/**
 * ERP基幹システム - ビジネスルール定数とKeyDateロジック
 * docs/新システム開発者向け仕様.md に準拠
 */
(function (global) {
    'use strict';

    // ----- 工数入力ルール -----
    var WORK_HOURS_PER_DAY = 7.75;
    var WORK_TIME_UNIT = 0.25;

    function validateWorkTimeHours(hours) {
        if (hours == null || isNaN(parseFloat(hours))) return { valid: false, message: '数値を入力してください' };
        var h = parseFloat(hours);
        if (h < 0 || h > WORK_HOURS_PER_DAY) return { valid: false, message: '1日は0〜' + WORK_HOURS_PER_DAY + '時間で入力してください' };
        var remainder = (h / WORK_TIME_UNIT) % 1;
        if (Math.abs(remainder) > 0.001 && Math.abs(remainder - 1) > 0.001) return { valid: false, message: '入力単位は' + WORK_TIME_UNIT + '時間（15分）です' };
        return { valid: true };
    }

    function roundToWorkUnit(hours) {
        var h = parseFloat(hours);
        if (isNaN(h)) return 0;
        var steps = Math.round(h / WORK_TIME_UNIT);
        return Math.min(steps * WORK_TIME_UNIT, WORK_HOURS_PER_DAY);
    }

    // ----- 発注管理の区分（注文番号プレフィックス） -----
    var ORDER_NUMBER_PREFIXES = {
        P: { label: '購入部品', description: '個別注文番号' },
        R: { label: '材料', description: '個別注文番号' },
        C: { label: '外注加工', description: '個別注文番号' },
        A: { label: '一括', description: '一括注文番号' }
    };

    function getOrderPrefixInfo(prefix) {
        return ORDER_NUMBER_PREFIXES[prefix] || null;
    }

    // ----- 工事番号 + KeyDate（受注登録日）の複合キー -----
    function getKeyDate(row) {
        return row && (row.keydate ?? row.KeyDate ?? row.registerdate ?? row.RegisterDate ?? null);
    }

    function getConstructNo(row) {
        return row && (row.constructno ?? row.ConstructNo ?? null);
    }

    function getCompositeKey(row) {
        var no = getConstructNo(row);
        var key = getKeyDate(row);
        if (no == null) return null;
        var keyStr = key != null ? (typeof key === 'string' ? key : (key.toISOString ? key.toISOString().slice(0, 10) : String(key))) : '';
        return { constructno: no, keydate: keyStr, composite: no + '\0' + keyStr };
    }

    function buildCompositeKey(constructno, keydate) {
        if (constructno == null) return null;
        var k = keydate != null ? (typeof keydate === 'string' ? keydate : (keydate.toISOString ? keydate.toISOString().slice(0, 10) : String(keydate))) : '';
        return constructno + '\0' + k;
    }

    global.ERPConstants = {
        WORK_HOURS_PER_DAY: WORK_HOURS_PER_DAY,
        WORK_TIME_UNIT: WORK_TIME_UNIT,
        ORDER_NUMBER_PREFIXES: ORDER_NUMBER_PREFIXES,
        validateWorkTimeHours: validateWorkTimeHours,
        roundToWorkUnit: roundToWorkUnit,
        getOrderPrefixInfo: getOrderPrefixInfo,
        getKeyDate: getKeyDate,
        getConstructNo: getConstructNo,
        getCompositeKey: getCompositeKey,
        buildCompositeKey: buildCompositeKey
    };
})(typeof window !== 'undefined' ? window : this);
