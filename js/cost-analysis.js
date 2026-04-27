/**
 * 工数実績・原価分析ダッシュボード
 * ページID: cost-summary-page（既存DIVを上書き）
 * データソース: t_worktime_kako
 */
(function () {
    'use strict';

    var _chart1 = null; // 棒グラフ: 工事別工数
    var _chart2 = null; // ドーナツ: 直接/間接比率
    var _chart3 = null; // ドーナツ: 間接作業内訳
    var _currentData = [];

    var NW_LABELS = {
        CLNG:'清掃', SAW:'材料準備', MEET:'ミーティング',
        EDU:'指導・教育', MAINT:'設備保全', QC:'品質管理',
        SHIP:'出荷作業', ORDER:'受入・検品', ADMIN:'事務処理', OTHER:'その他'
    };
    var NW_COLORS = {
        CLNG:'#6366f1', SAW:'#f59e0b', MEET:'#3b82f6', EDU:'#10b981',
        MAINT:'#ef4444', QC:'#8b5cf6', SHIP:'#0ea5e9', ORDER:'#f97316',
        ADMIN:'#64748b', OTHER:'#94a3b8'
    };

    function getClient() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }

    function destroyCharts() {
        if (_chart1) { _chart1.destroy(); _chart1 = null; }
        if (_chart2) { _chart2.destroy(); _chart2 = null; }
        if (_chart3) { _chart3.destroy(); _chart3 = null; }
    }

    // ── データ取得 ──────────────────────────────────
    function normalize(r, src) {
        return {
            kojino: r.constructionno,
            zuban:  r.drawingno || null,
            jugyo:  r.workcode,
            scode:  r.staffcode,
            stime:  r.worktime,
            sdate:  r.workdate,
            kakosu: r.qty || null,
            _src:   src
        };
    }

    async function loadData(filters) {
        var client = getClient();
        if (!client) return [];

        function applyFilters(q, dateCol, kojinoCol, scodeCol) {
            if (filters.dateFrom) q = q.gte(dateCol,   filters.dateFrom);
            if (filters.dateTo)   q = q.lte(dateCol,   filters.dateTo);
            if (filters.kojino)   q = q.ilike(kojinoCol, '%' + filters.kojino + '%');
            if (filters.scode)    q = q.eq(scodeCol,   filters.scode);
            return q;
        }

        try {
            var [r1, r2] = await Promise.all([
                applyFilters(
                    client.from('t_worktime_kako').select('constructionno,drawingno,workcode,staffcode,worktime,workdate,qty'),
                    'workdate','constructionno','staffcode'
                ).limit(5000),
                applyFilters(
                    client.from('t_worktime').select('constructionno,workcode,staffcode,worktime,workdate'),
                    'workdate','constructionno','staffcode'
                ).limit(5000)
            ]);
            var rows1 = r1.error ? [] : (r1.data || []).map(function(r){ return normalize(r, 'kako'); });
            var rows2 = r2.error ? [] : (r2.data || []).map(function(r){ return normalize(r, 'wt'); });
            return rows1.concat(rows2);
        } catch (e) { return []; }
    }

    // ── 集計 ───────────────────────────────────────
    function byKojino(rows) {
        var map = {};
        rows.forEach(function (r) {
            var key = r.kojino || '(不明)';
            if (!map[key]) map[key] = { kojino: key, direct: 0, indirect: 0, total: 0 };
            var h = parseFloat(r.stime) || 0;
            if (r.zuban) map[key].direct += h;
            else         map[key].indirect += h;
            map[key].total += h;
        });
        return Object.values(map).sort(function (a, b) { return b.total - a.total; });
    }

    function byZuban(rows, kojino) {
        var map = {};
        rows.filter(function (r) {
            return r.zuban && (!kojino || r.kojino === kojino);
        }).forEach(function (r) {
            var key = r.zuban;
            if (!map[key]) map[key] = { zuban: key, total: 0, cnt: 0 };
            map[key].total += parseFloat(r.stime) || 0;
            map[key].cnt++;
        });
        return Object.values(map).sort(function (a, b) { return b.total - a.total; });
    }

    function byJugyo(rows) {
        var map = {};
        rows.filter(function (r) { return !r.zuban && r.jugyo; }).forEach(function (r) {
            var key = r.jugyo;
            if (!map[key]) map[key] = { jugyo: key, label: NW_LABELS[key] || key, total: 0 };
            map[key].total += parseFloat(r.stime) || 0;
        });
        return Object.values(map).sort(function (a, b) { return b.total - a.total; });
    }

    // ── グラフ描画 ──────────────────────────────────
    function drawBar(agg) {
        var ctx = document.getElementById('ca-bar'); if (!ctx) return;
        if (_chart1) { _chart1.destroy(); _chart1 = null; }
        var top = agg.slice(0, 15);
        _chart1 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top.map(function (d) { return d.kojino; }),
                datasets: [
                    { label: '直接作業 (h)', data: top.map(function (d) { return +d.direct.toFixed(2); }), backgroundColor: 'rgba(99,102,241,0.85)', borderRadius: 5 },
                    { label: '間接作業 (h)', data: top.map(function (d) { return +d.indirect.toFixed(2); }), backgroundColor: 'rgba(245,158,11,0.75)', borderRadius: 5 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top' }, title: { display: true, text: '工事番号別 工数合計（上位15件）' } },
                scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: '時間 (h)' } } },
                onClick: function (evt, els) {
                    if (els && els.length) drillDown(top[els[0].index].kojino);
                }
            }
        });
    }

    function drawPie(rows) {
        var ctx = document.getElementById('ca-pie'); if (!ctx) return;
        if (_chart2) { _chart2.destroy(); _chart2 = null; }
        var direct   = rows.reduce(function (s, r) { return s + (r.zuban  ? parseFloat(r.stime) || 0 : 0); }, 0);
        var indirect = rows.reduce(function (s, r) { return s + (!r.zuban ? parseFloat(r.stime) || 0 : 0); }, 0);
        _chart2 = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['直接作業', '間接作業'],
                datasets: [{ data: [+direct.toFixed(2), +indirect.toFixed(2)], backgroundColor: ['rgba(99,102,241,0.85)', 'rgba(245,158,11,0.75)'], borderWidth: 2 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title: { display: true, text: '直接 / 間接 比率' } } }
        });
    }

    function drawIndirect(agg) {
        var ctx = document.getElementById('ca-indirect'); if (!ctx || !agg.length) return;
        if (_chart3) { _chart3.destroy(); _chart3 = null; }
        _chart3 = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: agg.map(function (d) { return d.label; }),
                datasets: [{ data: agg.map(function (d) { return +d.total.toFixed(2); }), backgroundColor: agg.map(function (d) { return NW_COLORS[d.jugyo] || '#94a3b8'; }), borderWidth: 2 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title: { display: true, text: '間接作業 内訳' } } }
        });
    }

    // ── テーブル描画 ────────────────────────────────
    function renderTable(agg) {
        var tbody = document.getElementById('ca-tbody'); if (!tbody) return;
        if (!agg.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px;">データがありません</td></tr>';
            return;
        }
        tbody.innerHTML = agg.map(function (r) {
            var pct = r.total > 0 ? Math.round(r.direct / r.total * 100) : 0;
            return '<tr style="cursor:pointer;transition:background .1s;" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'" onclick="window._caDrill(\'' + r.kojino + '\')">' +
                '<td style="padding:9px 12px;font-weight:700;color:#6366f1;">' + r.kojino + '</td>' +
                '<td style="padding:9px 12px;text-align:right;">' + r.direct.toFixed(2) + ' h</td>' +
                '<td style="padding:9px 12px;text-align:right;">' + r.indirect.toFixed(2) + ' h</td>' +
                '<td style="padding:9px 12px;text-align:right;font-weight:700;">' + r.total.toFixed(2) + ' h</td>' +
                '<td style="padding:9px 12px;min-width:110px;">' +
                  '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<div style="flex:1;height:7px;background:#f1f5f9;border-radius:99px;overflow:hidden;">' +
                  '<div style="width:' + pct + '%;height:100%;background:#6366f1;border-radius:99px;"></div></div>' +
                  '<span style="font-size:11px;color:#6b7280;min-width:28px;">' + pct + '%</span></div>' +
                '</td></tr>';
        }).join('');
    }

    function renderDrillTable(agg) {
        var tbody = document.getElementById('ca-drill-tbody'); if (!tbody) return;
        if (!agg.length) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px;">直接作業データなし</td></tr>';
            return;
        }
        tbody.innerHTML = agg.slice(0, 50).map(function (r) {
            return '<tr>' +
                '<td style="padding:7px 12px;font-family:monospace;font-size:13px;color:#1e293b;">' + r.zuban + '</td>' +
                '<td style="padding:7px 12px;text-align:right;font-weight:700;">' + r.total.toFixed(2) + ' h</td>' +
                '<td style="padding:7px 12px;text-align:right;color:#6b7280;">' + r.cnt + '件</td>' +
                '</tr>';
        }).join('');
    }

    // ── ドリルダウン ────────────────────────────────
    function drillDown(kojino) {
        var panel = document.getElementById('ca-drill-panel');
        var title = document.getElementById('ca-drill-title');
        if (panel) panel.style.display = 'block';
        if (title) title.textContent = '工事番号: ' + kojino + ' — 図面別工数';
        renderDrillTable(byZuban(_currentData, kojino));
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function closeDrill() {
        var panel = document.getElementById('ca-drill-panel');
        if (panel) panel.style.display = 'none';
    }

    // ── メイン集計 ──────────────────────────────────
    async function runSearch() {
        var filters = {
            dateFrom: (document.getElementById('ca-from') || {}).value || '',
            dateTo:   (document.getElementById('ca-to')   || {}).value || '',
            kojino:   ((document.getElementById('ca-kno') || {}).value || '').trim(),
            scode:    (document.getElementById('ca-scode') || {}).value || ''
        };
        var st = document.getElementById('ca-status');
        if (st) st.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 集計中...';
        var btn = document.getElementById('ca-btn');
        if (btn) btn.disabled = true;
        closeDrill();
        try {
            var rows = await loadData(filters);
            _currentData = rows;
            var aggK = byKojino(rows);
            var aggJ = byJugyo(rows);
            drawBar(aggK);
            drawPie(rows);
            drawIndirect(aggJ);
            renderTable(aggK);
            var totalH = rows.reduce(function (s, r) { return s + (parseFloat(r.stime) || 0); }, 0);
            if (st) st.textContent = rows.length + '件のレコード / 合計 ' + totalH.toFixed(2) + ' h';
        } catch (e) {
            if (st) st.textContent = 'エラー: ' + e.message;
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ── 初期日付（今月） ────────────────────────────
    function thisMonthRange() {
        var d = new Date();
        var y = d.getFullYear(), m = d.getMonth() + 1;
        var mm = String(m).padStart(2, '0');
        var last = new Date(y, m, 0).getDate();
        return { from: y + '-' + mm + '-01', to: y + '-' + mm + '-' + String(last).padStart(2, '0') };
    }

    // ── HTML生成 ────────────────────────────────────
    function buildHTML() {
        var range = thisMonthRange();
        var IS = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;';
        var html = '';

        // ヘッダー
        html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap;">';
        html += '<button class="btn-secondary" onclick="showPage(\'aggregate\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>';
        html += '<h2 style="margin:0;font-size:20px;font-weight:700;"><i class="fas fa-chart-pie" style="color:#6366f1;margin-right:8px;"></i>工数実績ダッシュボード</h2>';
        html += '<span style="font-size:11px;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:3px 10px;border-radius:99px;font-weight:600;">✅ t_worktime_kako</span>';
        html += '<span style="font-size:11px;color:#6b7280;margin-left:auto;">O-sys連携後：外注費・材料費・購入費も追加予定</span>';
        html += '</div>';

        // フィルター
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px 20px;margin-bottom:16px;">';
        html += '<div style="display:grid;grid-template-columns:155px 155px 160px 1fr auto;gap:12px;align-items:end;">';
        html += '<div><label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;">開始日</label><input id="ca-from" type="date" value="' + range.from + '" style="' + IS + '"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;">終了日</label><input id="ca-to" type="date" value="' + range.to + '" style="' + IS + '"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;">工事番号</label><input id="ca-kno" type="text" placeholder="絞り込み（任意）" style="' + IS + '"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;">社員コード</label><select id="ca-scode" style="' + IS + 'background:#fff;"><option value="">全員</option></select></div>';
        html += '<div><button id="ca-btn" onclick="window._caSearch()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;"><i class="fas fa-search"></i> 集計</button></div>';
        html += '</div>';
        html += '<div id="ca-status" style="margin-top:10px;font-size:13px;color:#6b7280;"></div>';
        html += '</div>';

        // グラフ3列
        html += '<div style="display:grid;grid-template-columns:1fr 210px 210px;gap:14px;margin-bottom:16px;">';
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;">';
        html += '<div style="height:260px;"><canvas id="ca-bar"></canvas></div>';
        html += '<p style="font-size:11px;color:#94a3b8;margin:6px 0 0;text-align:center;">棒をクリック → 図面別ドリルダウン</p>';
        html += '</div>';
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;"><div style="height:210px;"><canvas id="ca-pie"></canvas></div></div>';
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;"><div style="height:210px;"><canvas id="ca-indirect"></canvas></div></div>';
        html += '</div>';

        // ドリルダウンパネル
        html += '<div id="ca-drill-panel" style="display:none;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:14px;padding:16px;margin-bottom:16px;">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
        html += '<h3 id="ca-drill-title" style="margin:0;font-size:15px;font-weight:700;color:#1e40af;"></h3>';
        html += '<button onclick="window._caClose()" style="background:transparent;border:none;color:#6b7280;cursor:pointer;font-size:20px;line-height:1;">×</button>';
        html += '</div>';
        html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#dbeafe;">';
        html += '<th style="padding:8px 12px;text-align:left;border-bottom:2px solid #bfdbfe;">図面番号</th>';
        html += '<th style="padding:8px 12px;text-align:right;border-bottom:2px solid #bfdbfe;">工数合計</th>';
        html += '<th style="padding:8px 12px;text-align:right;border-bottom:2px solid #bfdbfe;">入力件数</th>';
        html += '</tr></thead>';
        html += '<tbody id="ca-drill-tbody"></tbody></table></div></div>';

        // メインテーブル
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;">';
        html += '<h3 style="margin:0 0 12px;font-size:15px;font-weight:700;">工事番号別 工数一覧 <span style="font-size:11px;font-weight:400;color:#94a3b8;">行クリックで図面別にドリルダウン</span></h3>';
        html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#f8fafc;">';
        ['工事番号','直接作業 (h)','間接作業 (h)','合計 (h)','直接率'].forEach(function (h) {
            var right = h !== '工事番号' && h !== '直接率';
            html += '<th style="padding:8px 12px;' + (right ? 'text-align:right;' : '') + 'border-bottom:2px solid #e2e8f0;font-weight:600;color:#374151;">' + h + '</th>';
        });
        html += '</tr></thead>';
        html += '<tbody id="ca-tbody"><tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:28px;">「集計」ボタンを押してください</td></tr></tbody>';
        html += '</table></div></div>';

        return html;
    }

    // ── スタッフ読込 ────────────────────────────────
    async function loadStaff() {
        var client = getClient(); if (!client) return;
        try {
            var r = await client.from('t_staffcode').select('staffcode,staffname').order('staffcode');
            var data = r.error ? [] : (r.data || []);
            var sel = document.getElementById('ca-scode'); if (!sel) return;
            sel.innerHTML = '<option value="">全員</option>' +
                data.map(function (s) { return '<option value="' + s.staffcode + '">' + s.staffcode + ' ' + (s.staffname || '') + '</option>'; }).join('');
        } catch (e) {}
    }

    // ── 初期化 ──────────────────────────────────────
    function initCostAnalysisPage() {
        var container = document.getElementById('cost-summary-page');
        if (!container) { console.error('cost-summary-page が見つかりません'); return; }

        destroyCharts();
        _currentData = [];

        // ページ全体をカスタムコンテンツで上書き
        container.className = 'page active';
        container.style.cssText = 'flex-direction:column;padding:0;overflow:hidden;';
        container.innerHTML = '<div style="padding:24px;height:100%;overflow-y:auto;box-sizing:border-box;">' + buildHTML() + '</div>';

        window._caSearch = runSearch;
        window._caDrill  = drillDown;
        window._caClose  = closeDrill;

        loadStaff().then(function () { runSearch(); });
    }

    window.initCostAnalysisPage = initCostAnalysisPage;
})();
