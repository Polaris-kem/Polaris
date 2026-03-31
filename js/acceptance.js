/**
 * 検収処理モジュール (t_purchaseparts 実カラム対応版)
 * ページID: acceptance-page
 *
 * t_purchaseparts 主要カラム:
 *   parts_id, construction_no, key_date, description, each_price, total_price,
 *   order_date, delivery_date, order_company_code, purchase_no, purchase_no_a,
 *   nounyu_date, kensyu_date (=検収日), betsu_seisaku_flg, delete_flg,
 *   order_div_code (発注区分: P=購入品 / R=材料 / C=外注 / A=一括)
 */
(function () {
    'use strict';

    var _currentCategory = 'purchase';
    var _allItems = [];
    var _initialized = false;

    // 発注区分フィルター設定
    var CATEGORY_FILTERS = {
        purchase  : ['P', 'A'],      // 購入品・一括
        outsource : ['R', 'C', '']   // 材料・外注・区分なし
    };

    // ── ユーティリティ ──────────────────────────────
    function getSupabase() {
        if (typeof getSupabaseClient === 'function') return getSupabaseClient();
        return null;
    }

    function showMsg(msg, type) {
        var el = document.getElementById('acc-message');
        if (!el) return;
        var colors = { success: '#22c55e', error: '#ef4444', warn: '#f59e0b', info: '#3b82f6' };
        el.innerHTML = msg;
        el.style.color = colors[type] || '#374151';
        el.style.display = 'block';
        clearTimeout(el._timer);
        el._timer = setTimeout(function () { el.style.display = 'none'; }, 6000);
    }

    function setLoading(flag) {
        var btn = document.getElementById('acc-confirm-btn');
        if (!btn) return;
        btn.disabled = flag;
        btn.innerHTML = flag
            ? '<i class="fas fa-spinner fa-spin"></i> 処理中...'
            : '<i class="fas fa-check-circle"></i> 検収確定';
    }

    // 月末日を返す (YYYY-MM-DD)
    function getMonthEnd(dateStr) {
        if (!dateStr) {
            var now = new Date();
            return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        }
        var parts = dateStr.split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]), 0).toISOString().slice(0, 10);
    }

    // 金額のカンマ区切り表示
    function fmt(v) {
        if (v == null || v === '') return '-';
        return Number(v).toLocaleString();
    }

    // ── データ読込 ────────────────────────────────────
    async function loadUnacceptedItems(category) {
        _currentCategory = category || _currentCategory;
        var sb = getSupabase();
        var tbody = document.getElementById('acc-tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#6b7280;padding:16px;"><i class="fas fa-spinner fa-spin"></i> 読込中...</td></tr>';

        if (!sb) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#ef4444;padding:16px;">Supabase 未接続</td></tr>';
            return;
        }

        var filterConstruct = ((document.getElementById('acc-filter-construct') || {}).value || '').trim();
        var filterSupplier  = ((document.getElementById('acc-filter-supplier')  || {}).value || '').trim();
        var filterMonth     = ((document.getElementById('acc-filter-month')     || {}).value || '').trim();

        try {
            // t_purchaseparts の実カラムで SELECT
            var q = sb.from('t_purchaseparts')
                .select([
                    'parts_id', 'construction_no', 'key_date',
                    'description', 'qty', 'each_price', 'total_price', 'seikyu_price',
                    'order_date', 'delivery_date', 'order_company_code', 'temp_company_name',
                    'purchase_no', 'purchase_no_a', 'order_div_code', 'order_div',
                    'nounyu_date', 'kensyu_date', 'delete_flg', 'betsu_seisaku_flg'
                ].join(', '))
                .is('kensyu_date', null)          // 未検収のみ
                .is('delete_flg', null)            // 削除済み除外 (NULLまたはfalse)
                .order('order_date', { ascending: false })
                .limit(300);

            // 発注区分フィルター
            var divCodes = CATEGORY_FILTERS[_currentCategory] || [];
            if (divCodes.length > 0) {
                q = q.in('order_div_code', divCodes);
            }

            if (filterConstruct) q = q.ilike('construction_no', '%' + filterConstruct + '%');
            if (filterSupplier)  q = q.or('order_company_code.ilike.%' + filterSupplier + '%,temp_company_name.ilike.%' + filterSupplier + '%');
            if (filterMonth) {
                var ms = filterMonth + '-01';
                var me = getMonthEnd(filterMonth);
                q = q.gte('order_date', ms).lte('order_date', me);
            }

            var res = await q;
            if (res.error) throw res.error;
            _allItems = res.data || [];
        } catch(e) {
            _allItems = [];
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#ef4444;padding:16px;">' +
                'データ取得エラー: ' + e.message + '</td></tr>';
            return;
        }

        renderTable(_allItems);
        var countEl = document.getElementById('acc-count');
        if (countEl) countEl.textContent = '未検収: ' + _allItems.length + ' 件';
    }

    // ── テーブル描画 ──────────────────────────────────
    function renderTable(items) {
        var tbody = document.getElementById('acc-tbody');
        if (!tbody) return;
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#6b7280;padding:16px;">未検収データなし</td></tr>';
            return;
        }
        tbody.innerHTML = items.map(function(r) {
            var isAccepted = r.kensyu_date != null;
            var rowStyle = isAccepted ? 'background:#f3f4f6;color:#9ca3af;' : '';
            var supplier = r.order_company_code || r.temp_company_name || '-';
            var orderNo  = r.purchase_no || r.purchase_no_a || '-';
            var price    = r.total_price != null ? fmt(r.total_price)
                         : (r.each_price && r.qty ? fmt(r.each_price * r.qty) : '-');
            return '<tr style="' + rowStyle + '">' +
                '<td style="padding:6px 8px;text-align:center;">' +
                (isAccepted
                    ? '<span style="color:#9ca3af;font-size:11px;">検収済</span>'
                    : '<input type="checkbox" class="acc-chk" data-id="' + r.parts_id + '" style="cursor:pointer;">') +
                '</td>' +
                '<td style="padding:6px 8px;">' + orderNo + '</td>' +
                '<td style="padding:6px 8px;">' + (r.construction_no || '-') + '</td>' +
                '<td style="padding:6px 8px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + (r.description || '') + '">' + (r.description || '-') + '</td>' +
                '<td style="padding:6px 8px;text-align:right;">' + (r.qty != null ? r.qty : '-') + '</td>' +
                '<td style="padding:6px 8px;text-align:right;">' + fmt(r.each_price) + '</td>' +
                '<td style="padding:6px 8px;text-align:right;">' + price + '</td>' +
                '<td style="padding:6px 8px;">' + (r.order_date || '-') + '</td>' +
                '<td style="padding:6px 8px;">' + (r.delivery_date || '-') + '</td>' +
                '<td style="padding:6px 8px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + supplier + '">' + supplier + '</td>' +
                '</tr>';
        }).join('');
    }

    // ── 検収確定 ──────────────────────────────────────
    async function confirmAcceptance() {
        var sb = getSupabase();
        if (!sb) { showMsg('Supabase 未接続です', 'error'); return; }

        var checked = Array.from(document.querySelectorAll('.acc-chk:checked'));
        if (checked.length === 0) { showMsg('検収確定する行にチェックを入れてください', 'warn'); return; }

        var cpVal = (document.getElementById('acc-check-price') || {}).value || '';
        var checkPrice = cpVal !== '' ? parseFloat(cpVal) : null;
        var kensyuDate = getMonthEnd(null); // 今月末日

        if (!confirm(checked.length + ' 件を検収確定します。\n検収日（kensyu_date）: ' + kensyuDate +
            (checkPrice != null ? '\n検収金額（seikyu_price）: ¥' + checkPrice.toLocaleString() : '') +
            '\n\nよろしいですか？')) return;

        setLoading(true);
        var ok = 0, ng = 0;

        for (var i = 0; i < checked.length; i++) {
            var partsId = checked[i].dataset.id;
            var payload = { kensyu_date: kensyuDate };
            if (checkPrice != null) payload.seikyu_price = checkPrice;
            try {
                var res = await sb.from('t_purchaseparts').update(payload).eq('parts_id', partsId);
                if (res.error) { ng++; console.error('[acceptance]', res.error.message); }
                else ok++;
            } catch(e) { ng++; }
        }

        setLoading(false);
        showMsg(ng === 0 ? ok + ' 件の検収を確定しました' : '成功: ' + ok + ' 件 / エラー: ' + ng + ' 件',
                ng === 0 ? 'success' : 'warn');

        await loadUnacceptedItems(_currentCategory);
        var pi = document.getElementById('acc-check-price');
        if (pi) pi.value = '';
    }

    // ── タブ切り替え ──────────────────────────────────
    function switchTab(category) {
        _currentCategory = category;
        document.querySelectorAll('.acc-tab').forEach(function(t) {
            var active = t.dataset.category === category;
            t.style.borderBottom = active ? '3px solid #3b82f6' : '3px solid transparent';
            t.style.color        = active ? '#3b82f6' : '#6b7280';
            t.style.fontWeight   = active ? '600' : '400';
        });
        loadUnacceptedItems(category);
    }

    // ── HTML生成 ──────────────────────────────────────
    function buildHTML() {
        return [
            '<div style="display:flex;align-items:center;gap:16px;padding:14px 20px;background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);border-radius:10px;box-shadow:0 4px 14px rgba(37,99,235,0.22);margin-bottom:20px;">',
            '  <button class="btn-secondary" onclick="showPage(\'search\')" style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.35);color:#fff;"><i class="fas fa-arrow-left"></i> 戻る</button>',
            '  <h2 style="margin:0;color:#fff;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.2);"><i class="fas fa-check-circle" style="margin-right:8px;opacity:0.85;"></i>検収処理</h2>',
            '</div>',

            '<div style="display:flex;border-bottom:1px solid #e5e7eb;margin-bottom:20px;">',
            '  <button class="acc-tab" data-category="purchase" onclick="window._accSwitchTab(\'purchase\')" style="padding:10px 20px;border:none;background:transparent;cursor:pointer;border-bottom:3px solid #3b82f6;color:#3b82f6;font-weight:600;font-size:14px;">購入品（P/A番）</button>',
            '  <button class="acc-tab" data-category="outsource" onclick="window._accSwitchTab(\'outsource\')" style="padding:10px 20px;border:none;background:transparent;cursor:pointer;border-bottom:3px solid transparent;color:#6b7280;font-size:14px;">材料・外注（R/C番）</button>',
            '</div>',

            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;margin-bottom:16px;">',
            '  <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;">',
            '    <div><label class="form-label">工事番号</label>',
            '      <input id="acc-filter-construct" type="text" class="form-input" style="width:130px;" placeholder="部分一致"></div>',
            '    <div><label class="form-label">発注先</label>',
            '      <input id="acc-filter-supplier" type="text" class="form-input" style="width:150px;" placeholder="部分一致"></div>',
            '    <div><label class="form-label">発注月</label>',
            '      <input id="acc-filter-month" type="month" class="form-input" style="width:140px;"></div>',
            '    <button class="btn-primary" onclick="loadUnacceptedItems()" style="align-self:flex-end;"><i class="fas fa-search"></i> 絞り込み</button>',
            '    <button class="btn-secondary" onclick="window._accClearFilters()" style="align-self:flex-end;"><i class="fas fa-times"></i> クリア</button>',
            '    <span id="acc-count" style="align-self:flex-end;color:#6b7280;font-size:13px;"></span>',
            '  </div>',
            '</div>',

            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;margin-bottom:16px;">',
            '  <div style="overflow-x:auto;">',
            '    <table class="data-table" style="width:100%;font-size:13px;">',
            '      <thead><tr>',
            '        <th style="padding:8px;width:44px;text-align:center;"><input type="checkbox" id="acc-chk-all" title="全選択" style="cursor:pointer;" onchange="window._accCheckAll(this.checked)"></th>',
            '        <th style="padding:8px;">注文番号</th>',
            '        <th style="padding:8px;">工事番号</th>',
            '        <th style="padding:8px;">品名</th>',
            '        <th style="padding:8px;text-align:right;">数量</th>',
            '        <th style="padding:8px;text-align:right;">発注単価</th>',
            '        <th style="padding:8px;text-align:right;">発注合計</th>',
            '        <th style="padding:8px;">発注日</th>',
            '        <th style="padding:8px;">納期</th>',
            '        <th style="padding:8px;">発注先</th>',
            '      </tr></thead>',
            '      <tbody id="acc-tbody">',
            '        <tr><td colspan="10" style="text-align:center;color:#6b7280;padding:16px;">データ取得中...</td></tr>',
            '      </tbody>',
            '    </table>',
            '  </div>',
            '</div>',

            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;">',
            '  <h3 style="margin:0 0 12px;font-size:15px;"><i class="fas fa-check-circle" style="color:#22c55e;margin-right:6px;"></i>検収確定</h3>',
            '  <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;">',
            '    <div><label class="form-label">検収金額（請求書金額）</label>',
            '      <input id="acc-check-price" type="number" class="form-input" style="width:180px;" placeholder="任意" step="1"></div>',
            '    <div style="font-size:12px;color:#6b7280;align-self:flex-end;line-height:1.8;">',
            '      検収日 → 今月末日（' + getMonthEnd(null) + '）を自動セット',
            '    </div>',
            '    <button id="acc-confirm-btn" class="btn-primary" onclick="confirmAcceptance()" style="align-self:flex-end;background:#22c55e;border-color:#22c55e;">',
            '      <i class="fas fa-check-circle"></i> 検収確定',
            '    </button>',
            '  </div>',
            '  <div id="acc-message" style="display:none;margin-top:10px;font-weight:500;font-size:13px;"></div>',
            '</div>'
        ].join('\n');
    }

    // ── ページ初期化 ──────────────────────────────────
    function initAcceptancePage() {
        var container = document.getElementById('acceptance-content');
        if (!container) return;

        if (!_initialized) {
            container.innerHTML = buildHTML();
            _initialized = true;

            window._accSwitchTab   = switchTab;
            window._accCheckAll    = function(v){ document.querySelectorAll('.acc-chk').forEach(function(el){ el.checked = v; }); };
            window._accClearFilters = function() {
                ['acc-filter-construct','acc-filter-supplier','acc-filter-month'].forEach(function(id){
                    var el = document.getElementById(id); if (el) el.value = '';
                });
                loadUnacceptedItems(_currentCategory);
            };
            window.confirmAcceptance   = confirmAcceptance;
            window.loadUnacceptedItems = loadUnacceptedItems;
        }

        _currentCategory = 'purchase';
        switchTab('purchase');
    }

    window.initAcceptancePage = initAcceptancePage;
    window.getMonthEnd = getMonthEnd;

})();
