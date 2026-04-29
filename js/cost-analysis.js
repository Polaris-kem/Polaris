/**
 * 工数実績ダッシュボード
 * ページID: cost-summary-page
 * データソース: t_worktime_kako + t_worktime
 */
(function () {
    'use strict';

    var _chart1 = null;
    var _currentData = [];
    var _staffMap = {};   // staffcode → staffname
    var _staffList = [];  // [{code, name}]

    var PALETTE = [
        '#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444',
        '#8b5cf6','#0ea5e9','#f97316','#14b8a6','#ec4899',
        '#84cc16','#a855f7','#06b6d4','#fb923c','#22d3ee'
    ];

    function getClient() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }
    function destroyCharts() {
        if (_chart1) { _chart1.destroy(); _chart1 = null; }
    }

    // ── データ取得 ──────────────────────────────────
    function normalize(r) {
        return {
            kojino : (r.constructionno || '').trim(),
            zuban  : r.drawingno || null,
            workcode: (r.workcode   || '').trim(),
            scode  : (r.staffcode  || '').trim(),
            stime  : parseFloat(r.worktime) || 0,
            sdate  : r.workdate
        };
    }

    async function loadData(filters) {
        var client = getClient(); if (!client) return [];
        function applyF(q, dc, kc, sc) {
            if (filters.dateFrom) q = q.gte(dc, filters.dateFrom);
            if (filters.dateTo)   q = q.lte(dc, filters.dateTo);
            if (filters.kojino)   q = q.ilike(kc, '%'+filters.kojino+'%');
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
            var d1 = r1.error ? [] : (r1.data||[]).map(normalize);
            var d2 = r2.error ? [] : (r2.data||[]).map(normalize);
            return d1.concat(d2);
        } catch(e) { return []; }
    }

    // ── 集計 ───────────────────────────────────────
    function byKojino(rows) {
        var map = {};
        rows.forEach(function(r) {
            var k = r.kojino || '不明';
            if (!map[k]) map[k] = { kojino:k, total:0, days:{}, scodes:{} };
            map[k].total += r.stime;
            if (r.sdate) map[k].days[r.sdate] = 1;
            if (r.scode) map[k].scodes[r.scode] = 1;
        });
        return Object.values(map).sort(function(a,b){ return b.total-a.total; });
    }

    function byStaff(rows) {
        var map = {};
        rows.forEach(function(r) {
            var k = r.scode || '不明';
            if (!map[k]) map[k] = { scode:k, name:(_staffMap[k]||k), total:0, days:{}, projects:{}, workcodes:{} };
            map[k].total += r.stime;
            if (r.sdate)     map[k].days[r.sdate] = 1;
            if (r.kojino)    map[k].projects[r.kojino] = (map[k].projects[r.kojino]||0) + r.stime;
            if (r.workcode)  map[k].workcodes[r.workcode] = (map[k].workcodes[r.workcode]||0) + r.stime;
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
            type:'bar',
            data:{
                labels: top.map(function(d){ return d.kojino; }),
                datasets:[{
                    label:'工数(h)',
                    data: top.map(function(d){ return +d.total.toFixed(2); }),
                    backgroundColor: top.map(function(_,i){ return PALETTE[i%PALETTE.length]+'cc'; }),
                    borderRadius:6, borderSkipped:false
                }]
            },
            options:{
                responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{ display:false }, title:{ display:true, text:'工事番号別 総工数（上位15件）', color:'#1e293b', font:{ size:13, weight:'bold' } } },
                scales:{
                    x:{ grid:{ display:false }, ticks:{ color:'#475569', font:{ weight:'700' } } },
                    y:{ grid:{ color:'#f1f5f9' }, ticks:{ color:'#64748b' }, title:{ display:true, text:'時間(h)', color:'#94a3b8' } }
                },
                onClick: function(evt,els){ if(els&&els.length) drillDown(top[els[0].index].kojino); }
            }
        });
    }

    // ── サマリーカード ──────────────────────────────
    function renderSummaryCards(rows, aggK, aggS) {
        var el = document.getElementById('ca-summary-cards'); if (!el) return;
        var totalH = rows.reduce(function(s,r){ return s+r.stime; },0);
        var days   = {};
        rows.forEach(function(r){ if(r.sdate) days[r.sdate]=1; });
        var dayCount = Object.keys(days).length;

        var cards = [
            { icon:'fa-clock',    bg:'linear-gradient(135deg,#6366f1,#818cf8)', label:'総工数',     value: totalH.toFixed(1)+' h',  sub: dayCount+'日分のデータ' },
            { icon:'fa-users',    bg:'linear-gradient(135deg,#10b981,#34d399)', label:'作業人数',   value: aggS.length+' 名',        sub: 'アクティブ社員' },
            { icon:'fa-briefcase',bg:'linear-gradient(135deg,#f59e0b,#fbbf24)', label:'工事件数',   value: aggK.length+' 件',        sub: '対象工事番号' },
            { icon:'fa-chart-line',bg:'linear-gradient(135deg,#ef4444,#f87171)',label:'1日平均',    value: dayCount>0?(totalH/dayCount).toFixed(1)+' h':'- h', sub: '全体平均工数/日' }
        ];
        el.innerHTML = cards.map(function(c) {
            return '<div style="background:'+c.bg+';border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:14px;box-shadow:0 4px 15px rgba(0,0,0,.15);">' +
                '<div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                '<i class="fas '+c.icon+'" style="color:#fff;font-size:20px;"></i></div>' +
                '<div><div style="font-size:26px;font-weight:900;color:#fff;line-height:1.1;letter-spacing:-0.5px;">'+c.value+'</div>' +
                '<div style="font-size:12px;color:rgba(255,255,255,.85);margin-top:2px;font-weight:600;">'+c.label+'</div>' +
                '<div style="font-size:11px;color:rgba(255,255,255,.65);">'+c.sub+'</div></div>' +
                '</div>';
        }).join('');
    }

    // ── 社員カード ────────────────────────────────
    function renderStaffCards(aggS) {
        var el = document.getElementById('ca-staff-cards'); if (!el) return;
        if (!aggS.length) {
            el.innerHTML = '<div style="color:#94a3b8;padding:20px;text-align:center;"><i class="fas fa-search" style="font-size:24px;margin-bottom:8px;display:block;"></i>「集計」ボタンを押してデータを表示</div>';
            return;
        }
        var maxH = aggS[0].total;
        el.innerHTML = aggS.map(function(s, i) {
            var color = PALETTE[i % PALETTE.length];
            var pct   = maxH > 0 ? Math.round(s.total / maxH * 100) : 0;
            var days  = Object.keys(s.days).length;
            var avgH  = days > 0 ? (s.total/days).toFixed(1) : '-';
            var projects = Object.entries(s.projects).sort(function(a,b){ return b[1]-a[1]; }).slice(0,4);
            var topWork  = Object.entries(s.workcodes).sort(function(a,b){ return b[1]-a[1]; }).slice(0,2);

            return '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:18px;border-top:4px solid '+color+';transition:transform .2s,box-shadow .2s;cursor:pointer;" onclick="window._caStaffDrill(\''+s.scode+'\')" title="クリックで詳細表示" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,.14)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 2px 12px rgba(0,0,0,.08)\'">' +
                // ヘッダー
                '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                '<div style="width:40px;height:40px;border-radius:50%;background:'+color+'1a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                '<i class="fas fa-user" style="color:'+color+';font-size:16px;"></i></div>' +
                '<div><div style="font-weight:800;font-size:15px;color:#1e293b;">'+(s.name||s.scode)+'</div>' +
                '<div style="font-size:11px;color:#94a3b8;">'+(s.name!==s.scode?s.scode:'')+'</div></div></div>' +
                '<div style="text-align:right;"><div style="font-size:24px;font-weight:900;color:'+color+';line-height:1;">'+s.total.toFixed(1)+'</div><div style="font-size:10px;color:#94a3b8;font-weight:600;">時間</div></div>' +
                '</div>' +
                // 進捗バー
                '<div style="margin-bottom:10px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:4px;">' +
                '<span>工数シェア</span><span>1日平均 '+avgH+' h</span></div>' +
                '<div style="height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden;">' +
                '<div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,'+color+','+color+'88);border-radius:99px;transition:width .6s ease;"></div></div>' +
                '</div>' +
                // 担当工事
                '<div style="margin-bottom:8px;">' +
                '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">担当工事</div>' +
                '<div>'+projects.map(function(p){
                    return '<span style="display:inline-flex;align-items:center;gap:3px;background:'+color+'12;color:'+color+';border-radius:6px;padding:3px 8px;font-size:12px;font-weight:700;margin:2px 3px 2px 0;">' +
                        p[0]+'<span style="font-weight:400;opacity:.7;font-size:11px;">'+p[1].toFixed(1)+'h</span></span>';
                }).join('')+(projects.length===0?'<span style="color:#94a3b8;font-size:12px;">なし</span>':'')+
                '</div></div>' +
                // 作業コード
                (topWork.length>0?'<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">主な作業</div>'+
                '<div>'+topWork.map(function(w){
                    return '<span style="display:inline-block;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;border-radius:5px;padding:2px 7px;font-size:11px;margin:1px 2px 1px 0;">'+w[0]+'</span>';
                }).join('')+'</div>':'') +
                '</div>';
        }).join('');
    }

    // ── 工事別テーブル ──────────────────────────────
    function renderTable(agg) {
        var tbody = document.getElementById('ca-tbody'); if (!tbody) return;
        if (!agg.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:32px;"><i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;"></i>データがありません</td></tr>';
            return;
        }
        var max = agg[0].total;
        tbody.innerHTML = agg.map(function(r, i) {
            var color = PALETTE[i % PALETTE.length];
            var pct = max>0 ? Math.round(r.total/max*100) : 0;
            var members = Object.keys(r.scodes).length;
            var days = Object.keys(r.days).length;
            return '<tr style="cursor:pointer;" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'" onclick="window._caDrill(\''+r.kojino+'\')">'+
                '<td style="padding:10px 12px;width:70px;">'+
                '<span style="font-weight:800;font-size:14px;color:'+color+';background:'+color+'12;padding:4px 10px;border-radius:8px;">'+r.kojino+'</span></td>'+
                '<td style="padding:10px 12px;">'+
                '<div style="display:flex;align-items:center;gap:8px;">'+
                '<div style="flex:1;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;max-width:120px;">'+
                '<div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,'+color+','+color+'88);border-radius:99px;"></div></div>'+
                '<span style="font-weight:800;font-size:15px;color:#1e293b;min-width:50px;">'+r.total.toFixed(1)+' h</span>'+
                '</div></td>'+
                '<td style="padding:10px 12px;color:#64748b;font-size:13px;">'+members+'名</td>'+
                '<td style="padding:10px 12px;color:#64748b;font-size:13px;">'+days+'日</td>'+
                '</tr>';
        }).join('');
    }

    // ── ドリルダウン ────────────────────────────────
    function drillDown(kojino) {
        var panel = document.getElementById('ca-drill-panel');
        var title = document.getElementById('ca-drill-title');
        if (panel) panel.style.display = 'block';
        if (title) title.textContent = '工事番号 '+kojino+' — 図面別詳細';
        var agg = byZuban(_currentData, kojino);
        var tbody = document.getElementById('ca-drill-tbody'); if (!tbody) return;
        if (!agg.length) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px;">図面番号データなし</td></tr>';
        } else {
            tbody.innerHTML = agg.slice(0,50).map(function(r) {
                return '<tr><td style="padding:8px 12px;font-family:monospace;font-weight:700;color:#6366f1;">'+r.zuban+'</td>'+
                    '<td style="padding:8px 12px;text-align:right;font-weight:800;color:#1e293b;">'+r.total.toFixed(1)+' h</td>'+
                    '<td style="padding:8px 12px;text-align:right;color:#94a3b8;">'+r.cnt+'件</td></tr>';
            }).join('');
        }
        if (panel) panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }
    function closeDrill() {
        var p = document.getElementById('ca-drill-panel'); if (p) p.style.display='none';
    }

    // ── 集計実行 ──────────────────────────────────
    async function runSearch() {
        // 社員: inputから staffcode を取得
        var scodeInput = (document.getElementById('ca-scode-input')||{}).value||'';
        var scode = '';
        if (scodeInput) {
            // 名前またはコードで検索
            var found = _staffList.find(function(s){
                return s.code === scodeInput.trim() || s.name.indexOf(scodeInput.trim()) >= 0;
            });
            scode = found ? found.code : scodeInput.trim();
        }

        var filters = {
            dateFrom: (document.getElementById('ca-from')||{}).value||'',
            dateTo:   (document.getElementById('ca-to')  ||{}).value||'',
            kojino:   ((document.getElementById('ca-kno') ||{}).value||'').trim(),
            scode:    scode
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
            renderTable(aggK);
            var totalH = rows.reduce(function(s,r){ return s+r.stime; },0);
            if (st) st.innerHTML = '<span style="color:#10b981;font-weight:700;">✓</span> '+rows.length+'件 / 合計 <b>'+totalH.toFixed(1)+'h</b>';
        } catch(e) {
            if (st) st.innerHTML = '<span style="color:#ef4444;">エラー: '+e.message+'</span>';
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ── スタッフ読込 ────────────────────────────────
    async function loadStaff() {
        var client = getClient(); if (!client) return;
        try {
            var r = await client.from('t_staffcode').select('staffcode,staffname').order('staffcode');
            var data = r.error ? [] : (r.data||[]);
            _staffMap = {};
            _staffList = [];
            data.forEach(function(s) {
                var code = (s.staffcode||'').trim();
                var name = (s.staffname||'').trim();
                _staffMap[code] = name;
                _staffList.push({ code:code, name:name });
            });
            // datalist に追加
            var dl = document.getElementById('ca-staff-list'); if (!dl) return;
            dl.innerHTML = _staffList.map(function(s) {
                return '<option value="'+s.code+'">'+s.name+'</option>';
            }).join('');
        } catch(e) {}
    }

    function thisMonthRange() {
        var d = new Date(), y = d.getFullYear(), m = d.getMonth()+1;
        var mm = String(m).padStart(2,'0');
        var last = new Date(y,m,0).getDate();
        return { from:y+'-'+mm+'-01', to:y+'-'+mm+'-'+String(last).padStart(2,'0') };
    }

    // ── HTML ────────────────────────────────────────
    function buildHTML() {
        var range = thisMonthRange();
        var IS = 'box-sizing:border-box;padding:9px 12px;border:2px solid #e2e8f0;border-radius:10px;font-size:13px;outline:none;transition:border-color .2s;background:#fff;';
        var html = '';

        // ヘッダー（標準ページタイトル形式）
        html += '<div class="page-title"><h2><i class="fas fa-chart-pie"></i> 工数実績ダッシュボード</h2></div>';

        // フィルター
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);padding:16px 20px;margin-bottom:16px;border:1px solid #f1f5f9;">';
        html += '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">';
        html += '<div><label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">開始日</label><input id="ca-from" type="date" value="'+range.from+'" style="'+IS+'width:145px;" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">終了日</label><input id="ca-to" type="date" value="'+range.to+'" style="'+IS+'width:145px;" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">工事番号</label><input id="ca-kno" type="text" placeholder="4桁入力" style="'+IS+'width:110px;" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'"></div>';
        html += '<div><label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">社員（名前 or コード）</label>';
        html += '<input id="ca-scode-input" list="ca-staff-list" type="text" placeholder="例: 中野　亮二 または 064001" style="'+IS+'width:220px;" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">';
        html += '<datalist id="ca-staff-list"></datalist></div>';
        html += '<button id="ca-btn" onclick="window._caSearch()" style="background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,.4);transition:all .2s;white-space:nowrap;" onmouseover="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 16px rgba(99,102,241,.5)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 4px 12px rgba(99,102,241,.4)\'"><i class="fas fa-chart-bar"></i> 集計する</button>';
        html += '</div>';
        html += '<div id="ca-status" style="margin-top:10px;font-size:13px;color:#94a3b8;min-height:18px;"></div>';
        html += '</div>';

        // サマリーカード
        html += '<div id="ca-summary-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:16px;">';
        html += '<div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:16px;padding:18px;display:flex;align-items:center;gap:12px;border:2px dashed #e2e8f0;"><i class="fas fa-mouse-pointer" style="color:#cbd5e1;font-size:20px;"></i><span style="color:#94a3b8;font-size:13px;">「集計する」ボタンを押してください</span></div>';
        html += '</div>';

        // 社員カード
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);padding:18px;margin-bottom:16px;border:1px solid #f1f5f9;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">';
        html += '<div style="width:32px;height:32px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-users" style="color:#fff;font-size:13px;"></i></div>';
        html += '<h3 style="margin:0;font-size:15px;font-weight:800;color:#1e293b;">誰が何をしているか</h3>';
        html += '<span style="font-size:11px;color:#94a3b8;margin-left:4px;">/ 社員別 工数カード</span>';
        html += '</div>';
        html += '<div id="ca-staff-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;">';
        html += '<div style="color:#94a3b8;padding:20px;text-align:center;background:#f8fafc;border-radius:12px;border:2px dashed #e2e8f0;"><i class="fas fa-search" style="font-size:24px;margin-bottom:8px;display:block;opacity:.4;"></i>「集計する」ボタンを押してデータを表示</div>';
        html += '</div></div>';

        // グラフ
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);padding:18px;margin-bottom:16px;border:1px solid #f1f5f9;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">';
        html += '<div style="width:32px;height:32px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-chart-bar" style="color:#fff;font-size:13px;"></i></div>';
        html += '<h3 style="margin:0;font-size:15px;font-weight:800;color:#1e293b;">工事番号別 工数グラフ</h3>';
        html += '<span style="font-size:11px;color:#94a3b8;margin-left:4px;">/ 棒をクリック→図面別詳細</span>';
        html += '</div>';
        html += '<div style="height:250px;"><canvas id="ca-bar"></canvas></div></div>';

        // ドリルダウン
        html += '<div id="ca-drill-panel" style="display:none;background:linear-gradient(135deg,#eff6ff,#f8faff);border:2px solid #bfdbfe;border-radius:14px;padding:16px;margin-bottom:16px;">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
        html += '<h3 id="ca-drill-title" style="margin:0;font-size:14px;font-weight:800;color:#1e40af;"></h3>';
        html += '<button onclick="window._caClose()" style="background:#dbeafe;color:#1d4ed8;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:700;">✕ 閉じる</button>';
        html += '</div>';
        html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#dbeafe;"><th style="padding:8px 12px;text-align:left;border-radius:6px 0 0 6px;font-weight:700;color:#1e40af;">図面番号</th><th style="padding:8px 12px;text-align:right;font-weight:700;color:#1e40af;">工数合計</th><th style="padding:8px 12px;text-align:right;border-radius:0 6px 6px 0;font-weight:700;color:#1e40af;">件数</th></tr></thead>';
        html += '<tbody id="ca-drill-tbody"></tbody></table></div></div>';

        // 工事番号テーブル
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);padding:18px;border:1px solid #f1f5f9;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">';
        html += '<div style="width:32px;height:32px;background:linear-gradient(135deg,#f59e0b,#fbbf24);border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-list" style="color:#fff;font-size:13px;"></i></div>';
        html += '<h3 style="margin:0;font-size:15px;font-weight:800;color:#1e293b;">工事番号別 工数一覧</h3>';
        html += '<span style="font-size:11px;color:#94a3b8;margin-left:4px;">/ 行クリック→図面別詳細</span>';
        html += '</div>';
        html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#f8fafc;">';
        html += '<th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;border-bottom:2px solid #e2e8f0;width:80px;">工事番号</th>';
        html += '<th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;border-bottom:2px solid #e2e8f0;">工数</th>';
        html += '<th style="padding:10px 12px;text-align:right;font-weight:700;color:#475569;border-bottom:2px solid #e2e8f0;width:70px;">人数</th>';
        html += '<th style="padding:10px 12px;text-align:right;font-weight:700;color:#475569;border-bottom:2px solid #e2e8f0;width:70px;">日数</th>';
        html += '</tr></thead>';
        html += '<tbody id="ca-tbody"><tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:32px;"><i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4;"></i>「集計する」ボタンを押してください</td></tr></tbody>';
        html += '</table></div></div>';

        return html;
    }

    // ── 初期化 ──────────────────────────────────────
    function initCostAnalysisPage() {
        var container = document.getElementById('cost-summary-page'); if (!container) return;
        destroyCharts(); _currentData = [];
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
