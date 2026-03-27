/**
 * Polaris 生産管理システム - 設計指針に基づく6モジュールの共通ロジック
 * docs/生産管理システム設計指針.md を参照
 */
(function (global) {
    'use strict';

    // ----- 1. 受注・プロジェクト管理 -----
    const PAYMENT_PHASES = [
        { key: 'contract', label: '契約時' },
        { key: 'middle', label: '中間' },
        { key: 'verification', label: '検証' },
        { key: 'complete', label: '完納' }
    ];

    function getPaymentPhaseFields(row) {
        return {
            contract: row?.payment_contract_date ?? row?.PaymentContractDate ?? row?.契約時入金日,
            middle: row?.payment_middle_date ?? row?.PaymentMiddleDate ?? row?.中間入金日,
            verification: row?.payment_verification_date ?? row?.PaymentVerificationDate ?? row?.検証入金日,
            complete: row?.payment_complete_date ?? row?.PaymentCompleteDate ?? row?.完納入金日
        };
    }

    function getNextPaymentPhase(row) {
        const d = getPaymentPhaseFields(row);
        if (!d.contract) return { phase: 'contract', label: '契約時' };
        if (!d.middle) return { phase: 'middle', label: '中間' };
        if (!d.verification) return { phase: 'verification', label: '検証' };
        if (!d.complete) return { phase: 'complete', label: '完納' };
        return { phase: null, label: '完了' };
    }

    function getPaymentPhaseSummary(row) {
        const d = getPaymentPhaseFields(row);
        const unpaid = [];
        if (!d.contract) unpaid.push('契約時');
        if (!d.middle) unpaid.push('中間');
        if (!d.verification) unpaid.push('検証');
        if (!d.complete) unpaid.push('完納');
        const next = getNextPaymentPhase(row);
        return { nextPhase: next.label, unpaidPhases: unpaid, nextKey: next.phase };
    }

    // ----- 2. 製造・進捗 ステータス色（設計指針と用語・番号体系に統一） -----
    const STATUS_COLORS = {
        design: { bg: '#dbeafe', border: '#93c5fd', label: '設計' },   // 水色
        urgent: { bg: '#fee2e2', border: '#fca5a5', label: '緊急' },   // 赤
        progress: { bg: '#fef9c3', border: '#fde047', label: '未完了' }, // 黄
        complete: { bg: '#f3e8ff', border: '#c4b5fd', label: '完了' }   // 紫
    };

    function getStatusFromRow(row, tableName) {
        if (!row) return null;
        const status = row.status ?? row.Status ?? row.ステータス ?? row.progress_status ?? row.ProgressStatus;
        const urgent = row.urgent ?? row.Urgent ?? row.緊急;
        if (urgent === true || urgent === 1 || String(urgent).toLowerCase() === 'true') return 'urgent';
        if (status != null && status !== '') {
            const s = String(status).toLowerCase();
            if (s.includes('完') || s.includes('complete') || s.includes('済')) return 'complete';
            if (s.includes('設計') || s.includes('design')) return 'design';
            if (s.includes('未') || s.includes('progress') || s.includes('進行')) return 'progress';
        }
        return null;
    }

    function getStatusColor(row, tableName) {
        const key = getStatusFromRow(row, tableName);
        if (!key || !STATUS_COLORS[key]) return null;
        return STATUS_COLORS[key];
    }

    function getStatusStyle(row, tableName) {
        const c = getStatusColor(row, tableName);
        if (!c) return '';
        return 'background:' + c.bg + '; border-left:4px solid ' + c.border + ';';
    }

    // ----- 3. 外注購買 端数計算 -----
    const ROUNDING = { round: 'round', floor: 'floor', ceil: 'ceil' };

    function applyRoundingByVendor(amount, method) {
        const m = (method || '').toLowerCase();
        const n = Number(amount);
        if (isNaN(n)) return amount;
        if (m === 'floor' || m === '切り捨て') return Math.floor(n);
        if (m === 'ceil' || m === '切り上げ') return Math.ceil(n);
        return Math.round(n);
    }

    // ----- 4. 在庫・余剰 照合 -----
    async function checkSurplusForItem(supabase, key) {
        if (!supabase || !key) return { hasSurplus: false, count: 0, items: [] };
        const k = String(key).trim();
        if (!k) return { hasSurplus: false, count: 0, items: [] };
        try {
            const { data, error } = await supabase.from('t_surplus').select('*')
                .or('inventoryno.ilike.%' + k + '%,surplusno.ilike.%' + k + '%,constructno.ilike.%' + k + '%')
                .limit(50);
            if (error) return { hasSurplus: false, count: 0, items: [] };
            const items = data || [];
            return { hasSurplus: items.length > 0, count: items.length, items };
        } catch (e) {
            return { hasSurplus: false, count: 0, items: [] };
        }
    }

    function getSurplusMatchKeys(row) {
        const keys = [];
        const a = row?.inventoryno ?? row?.InventoryNo ?? row?.図面番号 ?? row?.drawingno ?? row?.DrawingNo;
        const b = row?.surplusno ?? row?.SurplusNo ?? row?.品番;
        const c = row?.constructno ?? row?.ConstructNo ?? row?.工事番号;
        if (a) keys.push(String(a).trim());
        if (b) keys.push(String(b).trim());
        if (c) keys.push(String(c).trim());
        return keys.filter(Boolean);
    }

    // ----- 5. 図面 期間（過去3年） -----
    function getDefaultDateRangeYears(years) {
        const end = new Date();
        const start = new Date();
        start.setFullYear(start.getFullYear() - (years || 3));
        return { start, end };
    }

    // ----- 6. UI/UX 検索条件の保存 -----
    const SAVED_SEARCH_STORAGE_KEY = 'polaris_saved_searches';

    function getSavedSearches() {
        try {
            const raw = localStorage.getItem(SAVED_SEARCH_STORAGE_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveSearchCondition(name, condition) {
        const list = getSavedSearches();
        const id = 'id_' + Date.now();
        list.push({ id, name, condition, createdAt: new Date().toISOString() });
        if (list.length > 30) list.splice(0, list.length - 30);
        try {
            localStorage.setItem(SAVED_SEARCH_STORAGE_KEY, JSON.stringify(list));
            return id;
        } catch (e) {
            return null;
        }
    }

    function loadSearchCondition(id) {
        const list = getSavedSearches();
        return list.find(function (x) { return x.id === id; }) || null;
    }

    function applySearchCondition(id) {
        const item = loadSearchCondition(id);
        return item ? item.condition : null;
    }

    // ----- 公開API -----
    global.PolarisProduction = {
        PAYMENT_PHASES,
        STATUS_COLORS,
        ROUNDING,
        getPaymentPhaseFields,
        getNextPaymentPhase,
        getPaymentPhaseSummary,
        getStatusFromRow,
        getStatusColor,
        getStatusStyle,
        applyRoundingByVendor,
        checkSurplusForItem,
        getSurplusMatchKeys,
        getDefaultDateRangeYears,
        getSavedSearches,
        saveSearchCondition,
        loadSearchCondition,
        applySearchCondition
    };
})(typeof window !== 'undefined' ? window : this);
