/**
 * 工数実績ダッシュボード
 * ページID: cost-summary-page
 * データソース: t_worktime_kako + t_worktime
 */
(function () {
    'use strict';

    var _chart1 = null;
    var _chart2 = null;
    var _currentData = [];
    var _staffMap = {}; // staffcode → staffname

    var WORK_COLORS = [
        '#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444',
        '#8b5cf6','#0ea5e9','#f97316','#64748b','#14b8a6'
    ];

    function getClient() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }
    function destroyCharts() {
        if (_chart1) { _chart1.destroy(); _chart1 = null; }
        if (_chart2) { _chart2.destroy(); _chart2 = null; }
    }

    // ── データ取得 ──────────────────────────────────
    function normalize(r, src) {
        return {
            kojino: (r.constructionno || '').trim(),
            zuban:  r.drawingno || null,
            jugyo:  (r.workcode || '').trim(),
            scode:  (r.staffcode || '').trim(),
            stime:  parseFloat(r.worktime) || 0,
            sdate:  r.workdate,
            _src:   src
        };
    }

    async function loadData(filters) {
        var client = getClient();
        if (!client) return [];
        function applyF(q, dc, kc, sc) {
            if (filters.dateFrom) q = q.gte(dc, filters.dateFrom);
            if (filters.dateTo)   q = q.lte(dc, filters.dateTo);
            if (filters.kojino)   q = q.ilike(kc, '%' + filters.kojino + '%');
            if (filters.scode)    q = q.eq(sc, filters.scode);
            return q;
        }
        try {
            var [r1, r2] = await Promise.all([
                applyF(client.from('t_worktime_kako').select('constructionno,drawingno,workcode,staffcode,worktime,workdate'),
                    'workdate','constructionno','staffcode').limit(5000),
                applyF(client.from('t_worktime').select('constructionno,workcode,staffcode,worktime,workdate'),
                    'workdate','constructionno','staffcode').limit(5000)
            ]);
            var d1 = r1.error ? [] : (r1.data||[]).map(function(r){ return normalize(r,'kako'); });
            var d2 = r2.error ? [] : (r2.data||[]).map(function(r){ return normalize(r,'wt'); });
            return d1.concat(d2);
        } catch(e) { return []; }
    }

    // ── 集計 ───────────────────────────────────────
    function byKojino(rows) {
        var map = {};
        rows.forEach(function(r) {
            var k = r.kojino || '不明';
            if (!map[k]) map[k] = { kojino:k, machining:0, support:0, total:0 };
            if (r.zuban) map[k].machining += r.stime;
            else         map[k].support   += r.stime;
            map[k].total += r.stime;
        });
        return Object.values(map).sort(function(a,b){ return b.total-a.total; });
    }

    function byStaff(rows) {
        var map = {};
        rows.forEach(function(r) {
            var k = r.scode || '不明';
            if (!map[k]) map[k] = { scode:k, name: _staffMap[k]||k, total:0, machining:0, support:0, projects:{} };
            map[k].total += r.stime;
            if (r.zuban) map[k].machining += r.stime;
            else         map[k].support   += r.stime;
            if (r.kojino) map[k].projects[r.kojino] = (map[k].projects[r.kojino]||0) + r.stime;
        });
        return Object.values(map).sort(function(a,b){ return b.total-a.total; });
    }

    function byZuban(rows, kojino) {
        var map = {};
        rows.filter(function(r){ return r.zuban && (!kojino||r.kojino===kojino); })
            .forEach(function(r) {
                var k = r.zuban;
                if (!map[k]) map[k] = { zuban:k, total:0, cnt:0 };
                map[k].total += r.stime; map[k].cnt++;
            });
        return Object.values(map).sort(function(a,b){ return b.total-a.total; });
    }

    // ── グラフ ──────────────────────────────────────
    function drawBar(agg) {
        var ctx = document.getElementById('ca-bar'); if (!ctx) return;
        if (_chart1) { _chart1.destroy(); _chart1 = null; }
        var top = agg.slice(0,15);
        _chart1 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top.map(function(d){ return d.kojino; }),
                datasets: [
                    { label:'加工作業(h)', data: top.map(function(d){ return +d.machining.toFixed(2); }), backgroundColor:'rgba(99,102,241,0.85)', borderRadius:4 },
                    { label:'補助作業(h)', data: top.map(function(d){ return +d.support.toFixed(2); }),   backgroundColor:'rgba(245,158,11,0.75)',  borderRadius:4 }
                ]
            },
            options: {
                responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{ position:'top' }, title:{ display:true, text:'工事番号別 工数（上位15件）' } },
                scales:{ x:{ stacked:true }, y:{ stacked:true, title:{ display:true, text:'時間(h)' } } },
                onClick: function(evt,els){ if(els&&els.length) drillDown(top[els[0].index].kojino); }
            }
        });
    }

    function drawPie(rows) {
        var ctx = document.getElementById('ca-pie'); if (!ctx) return;
        if (_chart2) { _chart2.destroy(); _chart2 = null; }
        var machining = rows.reduce(function(s,r){ return s+(r.zuban?r.stime:0); },0);
        var support   = rows.reduce(function(s,r){ return s+(!r.zuban?r.stime:0); },0);
        _chart2 = new Chart(ctx, {
            type:'doughnut',
            data:{
                labels:['加工作業','補助作業'],
                datasets:[{ data:[+machining.toFixed(2),+support.toFixed(2)],
                    backgroundColor:['rgba(99,102,241,0.85)','rgba(245,158,11,0.75)'], borderWidth:2 }]
            },
            options:{ responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{ position:'bottom' }, title:{ display:true, text:'作業種別 内訳' } } }
        });
    }

    // ── サマリーカード ──────────────────────────────
    function renderSummaryCards(rows, aggK, aggS) {
        var el = document.getElementById('ca-summary-cards'); if (!el) return;
        var totalH  = rows.reduce(function(s,r){ return s+r.stime; },0);
        var machH   = rows.reduce(function(s,r){ return s+(r.zuban?r.stime:0); },0);
        var pct     = totalH>0 ? Math.round(machH/totalH*100) : 0;
        var cards = [
            { icon:'fa-clock', color:'#6366f1', label:'総工数', value: totalH.toFixed(1)+' h', sub: rows.length+'件' },
            { icon:'fa-users', color:'#10b981', label:'作業人数', value: aggS.length+'名', sub: '社員' },
            { icon:'fa-briefcase', color:'#3b82f6', label:'対象工事数', value: aggK.length+'件', sub: '工事番号' },
            { icon:'fa-wrench', color:'#f59e0b', label:'加工比率', value: pct+'%', sub: '補助 '+(100-pct)+'%' }
        ];
        el.innerHTML = cards.map(function(c) {
            return '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 6px rgba(0,0,0,.08);padding:16px 20px;display:flex;align-items:center;gap:14px;">' +
                '<div style="width:44px;height:44px;border-radius:12px;background:' + c.color + '1a;display:flex;align-items:center;justify-content:center;">' +
                '<i class="fas ' + c.icon + '" style="color:' + c.color + ';font-size:18px;"></i></div>' +
                '<div><div style="font-size:22px;font-weight:800;color:#1e293b;line-height:1.1;">' + c.value + '</div>' +
                '<div style="font-size:12px;color:#64748b;margin-top:2px;">' + c.label + ' <span style="color:#94a3b8;">/ ' + c.sub + '</span></div></div>' +
                '</div>';
        }).join('');
    }

    // ── 社員カード（誰が何をしているか） ──────────────
    function renderStaffCards(aggS) {
        var el = document.getElementById('ca-staff-cards'); if (!el) return;
        if (!aggS.length) {
            el.innerHTML = '<div style="color:#94a3b8;padding:16px;">データなし</div>';
            return;
        }
        el.innerHTML = aggS.map(function(s, i) {
            var pct   = s.total>0 ? Math.round(s.machining/s.total*100) : 0;
            var color = WORK_COLORS[i % WORK_COLORS.length];
            // 担当工事番号（上位5件）
            var projects = Object.entries(s.projects)
                .sort(function(a,b){ return b[1]-a[1]; })
                .slice(0,5);
            var badges = projects.map(function(p) {
                return '<span style="display:inline-block;background:#eff6ff;color:#3b82f6;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;margin:2px 3px 2px 0;">' +
                    p[0] + '<span style="color:#94a3b8;font-weight:400;"> ' + p[1].toFixed(1)+'h</span></span>';
            }).join('');
            return '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 6px rgba(0,0,0,.08);padding:16px;min-width:200px;">' +
                // ヘッダー
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
                '<div style="width:36px;height:36px;border-radius:50%;background:' + color + '22;display:flex;align-items:center;justify-content:center;">' +
                '<i class="fas fa-user" style="color:' + color + ';font-size:15px;"></i></div>' +
                '<div><div style="font-weight:700;font-size:14px;color:#1e293b;">' + (s.name || s.scode) + '</div>' +
                '<div style="font-size:11px;color:#94a3b8;">' + s.scode + '</div></div>' +
                '<div style="margin-left:auto;font-size:18px;font-weight:800;color:' + color + ';">' + s.total.toFixed(1) + '<span style="font-size:11px;font-weight:400;color:#94a3b8;"> h</span></div>' +
                '</div>' +
                // 加工/補助バー
                '<div style="margin-bottom:8px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:3px;">' +
                '<span>加工作業 ' + pct + '%</span><span>補助作業 ' + (100-pct) + '%</span></div>' +
                '<div style="height:8px;background:#fef3c7;border-radius:99px;overflow:hidden;">' +
                '<div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:99px;"></div></div>' +
                '</div>' +
                // 担当工事
                '<div style="font-size:11px;color:#64748b;margin-bottom:4px;">担当工事番号</div>' +
                '<div>' + (badges || '<span style="color:#94a3b8;font-size:11px;">なし</span>') + '</div>' +
                '</div>';
        }).join('');
    }

    // ── 工事別テーブル ──────────────────────────────
    function renderTable(agg) {
        var tbody = document.getElementById('ca-tbody'); if (!tbody) return;
        if (!agg.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px;">データなし</td></tr>';
            return;
        }
        tbody.innerHTML = agg.map(function(r) {
            var pct = r.total>0 ? Math.round(r.machining/r.total*100) : 0;
            return '<tr style="cursor:pointer;" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'" onclick="window._caDrill(\'' + r.kojino + '\')">' +
                '<td style="padding:8px 10px;font-weight:700;color:#6366f1;width:70px;">' + r.kojino + '</td>' +
                '<td style="padding:8px 10px;text-align:right;width:90px;">' + r.machining.toFixed(1) + ' h</td>' +
                '<td style="padding:8px 10px;text-align:right;width:90px;">' + r.support.toFixed(1) + ' h</td>' +
                '<td style="padding:8px 10px;text-align:right;font-weight:700;width:80px;">' + r.total.toFixed(1) + ' h</td>' +
                '<td style="padding:8px 10px;min-width:100px;">' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                '<div style="flex:1;height:7px;background:#f1f5f9;border-radius:99px;overflow:hidden;">' +
                '<div style="width:' + pct + '%;height:100%;background:#6366f1;border-radius:99px;"></div></div>' +
                '<span style="font-size:11px;color:#6b7280;min-width:28px;">' + pct + '%</span></div>' +
                '</td></tr>';
        }).join('');
    }

    function renderDrillTable(agg, kojino) {
        var panel = document.getElementById('ca-drill-panel');
        var title = document.getElementById('ca-drill-title');
        if (panel) panel.style.display = 'block';
        if (title) title.textContent = '工事番号 ' + kojino + ' — 図面別工数';
        var tbody = document.getElementById('ca-drill-tbody'); if (!tbody) return;
        if (!agg.length) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px;">加工作業データなし</td></tr>';
            return;
        }
        tbody.innerHTML = agg.slice(0,50).map(function(r) {
            return '<tr><td style="padding:7px 10px;font-family:monospace;font-size:13px;">' + r.zuban + '</td>' +
                '<td style="padding:7px 10px;text-align:right;font-weight:700;">' + r.total.toFixed(1) + ' h</td>' +
                '<td style="padding:7px 10px;text-align:right;color:#6b7280;">' + r.cnt + '件</td></tr>';
        }).join('');
        if (panel) panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    function drillDown(kojino) {
        renderDrillTable(byZuban(_currentData, kojino), kojino);
    }
    function closeDrill() {
        var p = document.getElementById('ca-drill-panel');
        if (p) p.style.display = 'none';
    }

    // ── メイン集計 ──────────────────────────────────
    async function runSearch() {
        var filters = {
            dateFrom: (document.getElementById('ca-from')||{}).value||'',
            dateTo:   (document.getElementById('ca-to')  ||{}).value||'',
            kojino:   ((document.getElementById('ca-kno') ||{}).value||'').trim(),
            scode:    (document.getElementById('ca-scode')||{}).value||''
        };
        var st  = document.getElementById('ca-status');
        var btn = document.getElementById('ca-btn');
        if (st)  st.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 集計中...';
        if (btn) btn.disabled = true;
        closeDrill();
        try {
            var rows = await loadData(filters);
            _currentData = rows;
            var aggK = byKojino(rows);
            var aggS = byStaff(rows);
            renderSummaryCards(rows, aggK, aggS);
            renderStaffCards(aggS);
            drawBar(aggK);
            drawPie(rows);
            renderTable(aggK);
            var totalH = rows.reduce(function(s,r){ return s+r.stime; },0);
            if (st) st.textContent = rows.length + '件 / 合計 ' + totalH.toFixed(1) + ' h';
        } catch(e) {
            if (st) st.textContent = 'エラー: ' + e.message;
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function thisMonthRange() {
        var d = new Date(), y = d.getFullYear(), m = d.getMonth()+1;
        var mm = String(m).padStart(2,'0');
        var last = new Date(y,m,0).getDate();
        return { from: y+'-'+mm+'-01', to: y+'-'+mm+'-'+String(last).padStart(2,'0') };
    }

    // ── HTML ────────────────────────────────────────
    function buildHTML() {
        var range = thisMonthRange();
        var IS = 'box-sizing:border-box;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;';
        var html = '';

        // ヘッダー
        html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">';
        html += '<button class="btn-secondary" onclick="showPage(\'aggregate\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>';
        html += '<h2 style="margin:0;font-size:18px;font-weight:700;"><i class="fas fa-chart-pie" style="color:#6366f1;margin-right:8px;"></i>工数実績ダッシュボード</h2>';
        html += '<span style="font-size:11px;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:2px 8px;border-radius:99px;">✅ t_worktime_kako + t_worktime</span>';
        html += '</div>';

        // フィルター
        html += '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:14px 18px;margin-bottom:14px;">';
        html += '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">';
        html += '<div><label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:3px;">開始日</label><input id="ca-from" type="date" value="'+range.from+'" style="'+IS+'width:140px;"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:3px;">終了日</label><input id="ca-to" type="date" value="'+range.to+'" style="'+IS+'width:140px;"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:3px;">工事番号</label><input id="ca-kno" type="text" placeholder="4桁で絞り込み" style="'+IS+'width:120px;"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:3px;">社員</label><select id="ca-scode" style="'+IS+'width:160px;background:#fff;"><option value="">全員</option></select></div>';
        html += '<button id="ca-btn" onclick="window._caSearch()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:14px;font-weight:600;cursor:pointer;"><i class="fas fa-search"></i> 集計</button>';
        html += '</div>';
        html += '<div id="ca-status" style="margin-top:8px;font-size:12px;color:#94a3b8;"></div>';
        html += '</div>';

        // サマリーカード
        html += '<div id="ca-summary-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:14px;"></div>';

        // 誰が何をしているか
        html += '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;margin-bottom:14px;">';
        html += '<h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#374151;"><i class="fas fa-users" style="color:#10b981;margin-right:6px;"></i>誰が何をしているか</h3>';
        html += '<div id="ca-staff-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;"></div>';
        html += '</div>';

        // グラフ
        html += '<div style="display:grid;grid-template-columns:1fr 220px;gap:12px;margin-bottom:14px;">';
        html += '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:14px;">';
        html += '<div style="height:240px;"><canvas id="ca-bar"></canvas></div>';
        html += '<p style="font-size:11px;color:#94a3b8;margin:4px 0 0;text-align:center;">棒をクリック → 図面別ドリルダウン</p>';
        html += '</div>';
        html += '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:14px;">';
        html += '<div style="height:220px;"><canvas id="ca-pie"></canvas></div>';
        html += '</div>';
        html += '</div>';

        // ドリルダウン
        html += '<div id="ca-drill-panel" style="display:none;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:14px;margin-bottom:14px;">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
        html += '<h3 id="ca-drill-title" style="margin:0;font-size:14px;font-weight:700;color:#1e40af;"></h3>';
        html += '<button onclick="window._caClose()" style="background:transparent;border:none;color:#6b7280;cursor:pointer;font-size:18px;">×</button>';
        html += '</div>';
        html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#dbeafe;"><th style="padding:7px 10px;text-align:left;">図面番号</th><th style="padding:7px 10px;text-align:right;">工数</th><th style="padding:7px 10px;text-align:right;">件数</th></tr></thead>';
        html += '<tbody id="ca-drill-tbody"></tbody></table></div></div>';

        // 工事番号テーブル
        html += '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:14px;">';
        html += '<h3 style="margin:0 0 10px;font-size:14px;font-weight:700;">工事番号別 工数一覧 <span style="font-size:11px;font-weight:400;color:#94a3b8;">行クリック → 図面別詳細</span></h3>';
        html += '<div style="overflow-x:auto;"><table style="width:auto;min-width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#f8fafc;">';
        [['工事番号','70px'],['加工作業(h)','90px'],['補助作業(h)','90px'],['合計(h)','80px'],['加工比率','110px']].forEach(function(h) {
            var right = h[0] !== '工事番号' && h[0] !== '加工比率';
            html += '<th style="padding:8px 10px;width:'+h[1]+';'+(right?'text-align:right;':'')+'border-bottom:2px solid #e2e8f0;font-weight:600;color:#374151;white-space:nowrap;">'+h[0]+'</th>';
        });
        html += '</tr></thead><tbody id="ca-tbody"><tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px;">「集計」ボタンを押してください</td></tr></tbody></table></div></div>';

        return html;
    }

    // ── スタッフ読込 ────────────────────────────────
    async function loadStaff() {
        var client = getClient(); if (!client) return;
        try {
            var r = await client.from('t_staffcode').select('staffcode,staffname').order('staffcode');
            var data = r.error ? [] : (r.data||[]);
            _staffMap = {};
            data.forEach(function(s){ _staffMap[s.staffcode] = s.staffname||s.staffcode; });
            var sel = document.getElementById('ca-scode'); if (!sel) return;
            sel.innerHTML = '<option value="">全員</option>' +
                data.map(function(s){ return '<option value="'+s.staffcode+'">'+s.staffcode+' '+( s.staffname||'')+'</option>'; }).join('');
        } catch(e) {}
    }

    // ── 初期化 ──────────────────────────────────────
    function initCostAnalysisPage() {
        var container = document.getElementById('cost-summary-page');
        if (!container) return;
        destroyCharts();
        _currentData = [];
        container.className = 'page active';
        container.style.cssText = 'flex-direction:column;padding:0;overflow:hidden;';
        container.innerHTML = '<div style="padding:20px;height:100%;overflow-y:auto;box-sizing:border-box;">' + buildHTML() + '</div>';
        window._caSearch = runSearch;
        window._caDrill  = drillDown;
        window._caClose  = closeDrill;
        loadStaff().then(function(){ runSearch(); });
    }

    window.initCostAnalysisPage = initCostAnalysisPage;
})();
