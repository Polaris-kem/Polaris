/**
 * 部品構成ビューアー
 * ページID: bom-viewer-page / コンテナ: bom-viewer-content
 * データ: t_manufctparts（製作部品）/ t_purchaseparts（購入部品）
 */
(function () {
    'use strict';

    var _chartPie  = null;
    var _chartBar  = null;
    var _manufData = [];
    var _purchData = [];
    var _tab = 'manufct'; // 'manufct' | 'purchase'
    var _drillMachine = null;
    var _drillUnit    = null;

    function getClient() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }

    function destroyCharts() {
        if (_chartPie) { _chartPie.destroy();  _chartPie  = null; }
        if (_chartBar) { _chartBar.destroy();  _chartBar  = null; }
    }

    function showMsg(msg, type) {
        var el = document.getElementById('bv-status');
        if (!el) return;
        var colors = { error: '#ef4444', info: '#6b7280', success: '#22c55e' };
        el.textContent = msg;
        el.style.color = colors[type] || '#6b7280';
    }

    // ── データ取得 ──────────────────────────────────
    async function loadData() {
        var client = getClient();
        if (!client) { showMsg('Supabase未接続', 'error'); return; }

        var kojino = ((document.getElementById('bv-kojino') || {}).value || '').trim();
        if (!kojino) { showMsg('工事番号を入力してください', 'error'); return; }

        var btn = document.getElementById('bv-btn');
        if (btn) btn.disabled = true;
        showMsg('読込中...', 'info');
        _drillMachine = null;
        _drillUnit    = null;

        try {
            var r1 = await client.from('t_manufctparts')
                .select('symbolmachine,symbolunit,drawingno,partno,description,materialcode,qty,qtyspare,qtyunit,weightmaterial,weightfinished')
                .eq('constructionno', kojino)
                .order('symbolmachine').order('symbolunit').order('drawingno');

            var r2 = await client.from('t_purchaseparts')
                .select('symbol_machine,symbol_unit,description,dimension_type,qty,qty_spare,qty_unit,maker,each_price')
                .eq('construction_no', kojino)
                .order('symbol_machine').order('symbol_unit');

            _manufData = r1.error ? [] : (r1.data || []);
            _purchData = r2.error ? [] : (r2.data || []);

            var total = _manufData.length + _purchData.length;
            if (total === 0) {
                showMsg('工事番号「' + kojino + '」のデータが見つかりません', 'error');
            } else {
                showMsg('製作部品 ' + _manufData.length + '件 / 購入部品 ' + _purchData.length + '件', 'success');
            }

            drawCharts();
            renderTable();
        } catch (e) {
            showMsg('エラー: ' + e.message, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ── 集計ヘルパー ────────────────────────────────
    function groupBy(arr, key) {
        var map = {};
        arr.forEach(function (r) {
            var k = r[key] || '(未設定)';
            if (!map[k]) map[k] = [];
            map[k].push(r);
        });
        return map;
    }

    function machineList(data, machineKey) {
        var map = {};
        data.forEach(function (r) {
            var k = r[machineKey] || '(未設定)';
            map[k] = (map[k] || 0) + 1;
        });
        return Object.entries(map).sort(function (a, b) { return b[1] - a[1]; });
    }

    // ── グラフ描画 ──────────────────────────────────
    function drawCharts() {
        destroyCharts();

        // 円グラフ：製作 vs 購入
        var ctx1 = document.getElementById('bv-pie');
        if (ctx1 && (_manufData.length + _purchData.length > 0)) {
            _chartPie = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['製作部品', '購入部品'],
                    datasets: [{
                        data: [_manufData.length, _purchData.length],
                        backgroundColor: ['rgba(99,102,241,0.85)', 'rgba(16,185,129,0.85)'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' }, title: { display: true, text: '製作 / 購入 比率' } }
                }
            });
        }

        // 棒グラフ：機械別部品数
        var ctx2 = document.getElementById('bv-bar');
        if (ctx2) {
            var mList = machineList(_manufData, 'symbolmachine');
            var pList = machineList(_purchData, 'symbol_machine');
            var allMachines = Array.from(new Set(
                mList.map(function (x) { return x[0]; }).concat(pList.map(function (x) { return x[0]; }))
            )).slice(0, 12);
            var mMap = Object.fromEntries(mList);
            var pMap = Object.fromEntries(pList);
            _chartBar = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: allMachines,
                    datasets: [
                        { label: '製作部品', data: allMachines.map(function (m) { return mMap[m] || 0; }), backgroundColor: 'rgba(99,102,241,0.85)', borderRadius: 4 },
                        { label: '購入部品', data: allMachines.map(function (m) { return pMap[m] || 0; }), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' }, title: { display: true, text: '機械別 部品点数' } },
                    scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: '点数' } } },
                    onClick: function (evt, els) {
                        if (els && els.length) {
                            _drillMachine = allMachines[els[0].index];
                            _drillUnit = null;
                            renderTable();
                            updateDrillLabel();
                        }
                    }
                }
            });
        }
    }

    // ── タブ切替 ────────────────────────────────────
    function switchTab(tab) {
        _tab = tab;
        _drillMachine = null;
        _drillUnit    = null;
        ['manufct', 'purchase'].forEach(function (t) {
            var btn = document.getElementById('bv-tab-' + t);
            if (!btn) return;
            var active = t === tab;
            btn.style.borderBottom = active ? '3px solid #6366f1' : '3px solid transparent';
            btn.style.color        = active ? '#6366f1' : '#6b7280';
            btn.style.fontWeight   = active ? '700' : '400';
        });
        updateDrillLabel();
        renderTable();
    }

    function updateDrillLabel() {
        var el = document.getElementById('bv-drill-label');
        if (!el) return;
        var parts = [];
        if (_drillMachine) parts.push('機械: ' + _drillMachine);
        if (_drillUnit)    parts.push('ユニット: ' + _drillUnit);
        el.innerHTML = parts.length
            ? parts.map(function (p) {
                return '<span style="background:#eff6ff;color:#3b82f6;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;">' + p + ' <span onclick="window._bvClearDrill()" style="cursor:pointer;margin-left:4px;">×</span></span>';
              }).join(' ')
            : '';
    }

    function clearDrill() {
        _drillMachine = null;
        _drillUnit    = null;
        updateDrillLabel();
        renderTable();
    }

    // ── テーブル描画 ────────────────────────────────
    function renderTable() {
        var tbody = document.getElementById('bv-tbody');
        var thead = document.getElementById('bv-thead');
        if (!tbody || !thead) return;

        if (_tab === 'manufct') {
            renderManufct(tbody, thead);
        } else {
            renderPurchase(tbody, thead);
        }
    }

    function renderManufct(tbody, thead) {
        thead.innerHTML = '<tr style="background:#f8fafc;">' +
            ['機械','ユニット','図面番号','品番','品名','素材','数量','予備数','単位','素材重量(kg)','仕上重量(kg)'].map(function (h) {
                return '<th style="padding:7px 10px;border-bottom:2px solid #e2e8f0;white-space:nowrap;font-size:12px;">' + h + '</th>';
            }).join('') + '</tr>';

        var data = _manufData;
        if (_drillMachine) data = data.filter(function (r) { return (r.symbolmachine || '(未設定)') === _drillMachine; });
        if (_drillUnit)    data = data.filter(function (r) { return (r.symbolunit    || '(未設定)') === _drillUnit;    });

        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:24px;">データなし</td></tr>';
            return;
        }

        // 機械・ユニット単位でグループ行を挿入
        var byMachine = groupBy(data, 'symbolmachine');
        var rows = '';
        Object.keys(byMachine).sort().forEach(function (machine) {
            var byUnit = groupBy(byMachine[machine], 'symbolunit');
            Object.keys(byUnit).sort().forEach(function (unit) {
                var parts = byUnit[unit];
                rows += '<tr style="background:#f0f9ff;">' +
                    '<td style="padding:5px 10px;font-weight:700;color:#3b82f6;font-size:12px;" colspan="2">' +
                    '<span onclick="window._bvDrill(\'' + machine + '\',\'' + unit + '\')" style="cursor:pointer;">▶ ' + machine + ' / ' + unit + '</span>' +
                    ' <span style="color:#94a3b8;font-weight:400;">（' + parts.length + '点）</span></td>' +
                    '<td colspan="9"></td></tr>';
                parts.forEach(function (r) {
                    rows += '<tr onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'">' +
                        td(r.symbolmachine) + td(r.symbolunit) +
                        td(r.drawingno, 'font-family:monospace;color:#334155;') +
                        td(r.partno) + td(r.description, 'max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;') +
                        td(r.materialcode) +
                        tdR(r.qty) + tdR(r.qtyspare) + td(r.qtyunit) +
                        tdR(r.weightmaterial) + tdR(r.weightfinished) +
                        '</tr>';
                });
            });
        });
        tbody.innerHTML = rows;
    }

    function renderPurchase(tbody, thead) {
        thead.innerHTML = '<tr style="background:#f8fafc;">' +
            ['機械','ユニット','品名','型式','数量','予備数','単位','メーカー'].map(function (h) {
                return '<th style="padding:7px 10px;border-bottom:2px solid #e2e8f0;white-space:nowrap;font-size:12px;">' + h + '</th>';
            }).join('') + '</tr>';

        var data = _purchData;
        if (_drillMachine) data = data.filter(function (r) { return (r.symbol_machine || '(未設定)') === _drillMachine; });
        if (_drillUnit)    data = data.filter(function (r) { return (r.symbol_unit    || '(未設定)') === _drillUnit;    });

        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:24px;">データなし</td></tr>';
            return;
        }

        var byMachine = groupBy(data, 'symbol_machine');
        var rows = '';
        Object.keys(byMachine).sort().forEach(function (machine) {
            var byUnit = groupBy(byMachine[machine], 'symbol_unit');
            Object.keys(byUnit).sort().forEach(function (unit) {
                var parts = byUnit[unit];
                rows += '<tr style="background:#f0fdf4;">' +
                    '<td style="padding:5px 10px;font-weight:700;color:#10b981;font-size:12px;" colspan="2">' +
                    '<span onclick="window._bvDrill(\'' + machine + '\',\'' + unit + '\')" style="cursor:pointer;">▶ ' + machine + ' / ' + unit + '</span>' +
                    ' <span style="color:#94a3b8;font-weight:400;">（' + parts.length + '点）</span></td>' +
                    '<td colspan="6"></td></tr>';
                parts.forEach(function (r) {
                    rows += '<tr onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'">' +
                        td(r.symbol_machine) + td(r.symbol_unit) +
                        td(r.description, 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;') +
                        td(r.dimension_type) +
                        tdR(r.qty) + tdR(r.qty_spare) + td(r.qty_unit) + td(r.maker) +
                        '</tr>';
                });
            });
        });
        tbody.innerHTML = rows;
    }

    function td(v, style) {
        return '<td style="padding:6px 10px;font-size:12px;' + (style || '') + '">' + (v != null && v !== '' ? v : '-') + '</td>';
    }
    function tdR(v) {
        return '<td style="padding:6px 10px;text-align:right;font-size:12px;">' + (v != null && v !== '' ? v : '-') + '</td>';
    }

    function drillTo(machine, unit) {
        _drillMachine = machine;
        _drillUnit    = unit;
        updateDrillLabel();
        renderTable();
    }

    // ── HTML ────────────────────────────────────────
    function buildHTML() {
        var html = '';

        html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap;">';
        html += '<button class="btn-secondary" onclick="showPage(\'aggregate\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>';
        html += '<h2 style="margin:0;font-size:20px;font-weight:700;"><i class="fas fa-sitemap" style="color:#6366f1;margin-right:8px;"></i>部品構成ビューアー</h2>';
        html += '<span style="font-size:11px;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:3px 10px;border-radius:99px;font-weight:600;">✅ 実データ</span>';
        html += '</div>';

        // 検索
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px 20px;margin-bottom:16px;">';
        html += '<div style="display:flex;gap:12px;align-items:flex-end;">';
        html += '<div style="flex:0 0 200px;"><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">工事番号 <span style="color:#ef4444">*</span></label>';
        html += '<input id="bv-kojino" type="text" placeholder="例: 25001" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;" onkeydown="if(event.key===\'Enter\')window._bvLoad()"></div>';
        html += '<button id="bv-btn" onclick="window._bvLoad()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;"><i class="fas fa-search"></i> 検索</button>';
        html += '<span id="bv-status" style="font-size:13px;color:#6b7280;"></span>';
        html += '</div></div>';

        // グラフ2つ
        html += '<div style="display:grid;grid-template-columns:220px 1fr;gap:14px;margin-bottom:16px;">';
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;"><div style="height:200px;"><canvas id="bv-pie"></canvas></div></div>';
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;"><div style="height:200px;"><canvas id="bv-bar"></canvas></div>';
        html += '<p style="font-size:11px;color:#94a3b8;margin:6px 0 0;text-align:center;">棒をクリック → その機械に絞り込み</p>';
        html += '</div></div>';

        // タブ
        html += '<div style="display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:0;">';
        html += '<button id="bv-tab-manufct" onclick="window._bvTab(\'manufct\')" style="padding:10px 24px;border:none;background:transparent;cursor:pointer;font-size:14px;border-bottom:3px solid #6366f1;color:#6366f1;font-weight:700;transition:all .2s;"><i class="fas fa-drafting-compass" style="margin-right:6px;"></i>製作部品</button>';
        html += '<button id="bv-tab-purchase" onclick="window._bvTab(\'purchase\')" style="padding:10px 24px;border:none;background:transparent;cursor:pointer;font-size:14px;border-bottom:3px solid transparent;color:#6b7280;transition:all .2s;"><i class="fas fa-box-open" style="margin-right:6px;"></i>購入部品</button>';
        html += '</div>';

        // ドリルラベル
        html += '<div id="bv-drill-label" style="padding:10px 0 6px;display:flex;gap:8px;flex-wrap:wrap;min-height:28px;"></div>';

        // テーブル
        html += '<div style="background:#fff;border-radius:0 0 14px 14px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow-x:auto;">';
        html += '<table style="width:100%;border-collapse:collapse;">';
        html += '<thead id="bv-thead"></thead>';
        html += '<tbody id="bv-tbody"><tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:32px;">工事番号を入力して検索してください</td></tr></tbody>';
        html += '</table></div>';

        return html;
    }

    // ── 初期化 ──────────────────────────────────────
    function initBomViewerPage() {
        var container = document.getElementById('bom-viewer-content');
        if (!container) { console.error('bom-viewer-content が見つかりません'); return; }

        destroyCharts();
        _manufData = [];
        _purchData = [];
        _tab = 'manufct';
        _drillMachine = null;
        _drillUnit    = null;

        container.innerHTML = buildHTML();

        window._bvLoad      = loadData;
        window._bvTab       = switchTab;
        window._bvDrill     = drillTo;
        window._bvClearDrill = clearDrill;
    }

    window.initBomViewerPage = initBomViewerPage;
})();
