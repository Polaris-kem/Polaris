/**
 * 非稼働業務管理モジュール
 * ページID: non-work-page / コンテナ: non-work-content
 * テーブル: t_sagyofl
 */
(function () {
    'use strict';

    var _mode = 'nonwork';
    var _selectedCode = '';
    var _staffcodes = [];

    var NONWORK_CODES = [
        { code:'CLNG',  label:'清掃',        icon:'fa-broom',          color:'#6366f1' },
        { code:'SAW',   label:'材料準備',    icon:'fa-boxes',          color:'#f59e0b' },
        { code:'MEET',  label:'ミーティング', icon:'fa-comments',       color:'#3b82f6' },
        { code:'EDU',   label:'指導・教育',  icon:'fa-graduation-cap', color:'#10b981' },
        { code:'MAINT', label:'設備保全',    icon:'fa-tools',          color:'#ef4444' },
        { code:'QC',    label:'品質管理',    icon:'fa-clipboard-check',color:'#8b5cf6' },
        { code:'SHIP',  label:'出荷作業',    icon:'fa-truck',          color:'#0ea5e9' },
        { code:'ORDER', label:'受入・検品',  icon:'fa-boxes',          color:'#f97316' },
        { code:'ADMIN', label:'事務処理',    icon:'fa-file-alt',       color:'#64748b' },
        { code:'OTHER', label:'その他',      icon:'fa-ellipsis-h',     color:'#94a3b8' }
    ];

    var DEPT_CODES = [
        { code:'KO',    label:'加工' },
        { code:'KOU',   label:'工作' },
        { code:'ASSM',  label:'組立' },
        { code:'DENSO', label:'電装' },
        { code:'INSP',  label:'検査' },
        { code:'MISC',  label:'その他' }
    ];

    function getClient() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth()+1).padStart(2,'0') + '-' +
            String(d.getDate()).padStart(2,'0');
    }

    function showMsg(msg, type) {
        var el = document.getElementById('nw-msg');
        if (!el) return;
        var colors = { success:'#22c55e', error:'#ef4444', warn:'#f59e0b', info:'#3b82f6' };
        el.textContent = msg;
        el.style.color = colors[type] || '#374151';
        el.style.display = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(function(){ el.style.display='none'; }, 6000);
    }

    function IS(extra) {
        return 'width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;background:#fff;outline:none;' + (extra||'');
    }

    // ── スタッフ読込 ─────────────────────────────────────
    async function loadStaff() {
        var client = getClient();
        if (!client) return;
        try {
            var r = await client.from('t_staffcode').select('staffcode,staffname').order('staffcode');
            _staffcodes = r.error ? [] : (r.data || []);
        } catch(e) { _staffcodes = []; }
        var opts = '<option value="">-- 選択 --</option>' +
            _staffcodes.map(function(s){
                return '<option value="' + s.staffcode + '">' + s.staffcode + ' - ' + (s.staffname||'') + '</option>';
            }).join('');
        ['nw-staff-a','nw-staff-b'].forEach(function(id){
            var el = document.getElementById(id);
            if (el) el.innerHTML = opts;
        });
    }

    // ── 当日一覧 ─────────────────────────────────────────
    async function loadList() {
        var tbody = document.getElementById('nw-tbody');
        if (!tbody) return;
        var staffId = _mode === 'nonwork' ? 'nw-staff-a' : 'nw-staff-b';
        var dateId  = _mode === 'nonwork' ? 'nw-date-a'  : 'nw-date-b';
        var staff   = (document.getElementById(staffId)||{}).value || '';
        var date    = (document.getElementById(dateId)  ||{}).value || todayStr();
        var client  = getClient();

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:10px;">読込中...</td></tr>';
        if (!client) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ef4444;">Supabase未接続</td></tr>';
            return;
        }
        try {
            var q = client.from('t_sagyofl').select('*').eq('sdate', date).order('upddate',{ascending:false});
            if (staff) q = q.eq('scode', staff);
            var res = await q;
            if (res.error) throw res.error;
            var rows = res.data || [];
            var total = rows.reduce(function(a,r){ return a+(parseFloat(r.stime)||0); }, 0);
            var totEl = document.getElementById('nw-total');
            if (totEl) {
                var over = total > 7.75;
                totEl.innerHTML = '合計: <strong style="color:' + (over?'#ef4444':'#22c55e') + ';">' + total.toFixed(2) + ' h</strong> / 7.75h';
            }
            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:10px;">データなし</td></tr>';
                return;
            }
            tbody.innerHTML = rows.map(function(r) {
                var nwc = NONWORK_CODES.find(function(c){ return c.code === r.jugyo; });
                var chip = nwc
                    ? '<span style="background:' + nwc.color + '20;color:' + nwc.color + ';padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;">' + nwc.label + '</span>'
                    : (r.jugyo || '-');
                var dk = encodeURIComponent(JSON.stringify({kojino:r.kojino,zuban:r.zuban,scode:r.scode,sdate:r.sdate,stime:r.stime}));
                return '<tr>' +
                    '<td style="padding:6px 8px;">' + (r.kojino||'-') + '</td>' +
                    '<td style="padding:6px 8px;">' + chip + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.zuban||'-') + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.scode||'-') + '</td>' +
                    '<td style="padding:6px 8px;text-align:right;font-weight:600;">' + parseFloat(r.stime).toFixed(2) + ' h</td>' +
                    '<td style="text-align:center;padding:6px 4px;">' +
                      '<button onclick="window._nwDel(\'' + dk + '\')" style="background:#fee2e2;color:#ef4444;border:none;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:12px;">削除</button>' +
                    '</td></tr>';
            }).join('');
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="6" style="color:#ef4444;padding:10px;text-align:center;">' + e.message + '</td></tr>';
        }
    }

    // ── 登録（非稼働） ────────────────────────────────────
    async function submitA() {
        var client = getClient();
        if (!client) { showMsg('Supabase未接続','error'); return; }
        var date  = (document.getElementById('nw-date-a') ||{}).value || '';
        var staff = (document.getElementById('nw-staff-a')||{}).value || '';
        var hoursRaw = parseFloat((document.getElementById('nw-hours-a')||{}).value);

        if (!date)         { showMsg('作業日を入力してください','error'); return; }
        if (!staff)        { showMsg('社員コードを選択してください','error'); return; }
        if (!_selectedCode){ showMsg('作業コードを選択してください','error'); return; }
        if (isNaN(hoursRaw)||hoursRaw<=0) { showMsg('時間を入力してください','error'); return; }
        var hours = Math.round(hoursRaw/0.25)*0.25;
        if (hours !== hoursRaw) { showMsg('0.25h（15分）単位で入力してください','error'); return; }

        var btn = document.getElementById('nw-btn-a');
        if (btn) btn.disabled = true;
        try {
            var res = await client.from('t_sagyofl').insert([{
                sdate:date, kojino:_selectedCode, zuban:null,
                jugyo:_selectedCode, scode:staff, stime:hours,
                kakosu:null, input:staff, upddate:new Date().toISOString()
            }]);
            if (res.error) throw res.error;
            showMsg('登録しました（' + hours + ' h）','success');
            document.getElementById('nw-hours-a').value = '';
            await loadList();
        } catch(e) { showMsg('登録失敗: ' + e.message,'error'); }
        finally { if (btn) btn.disabled = false; }
    }

    // ── 登録（模範品） ────────────────────────────────────
    async function submitB() {
        var client = getClient();
        if (!client) { showMsg('Supabase未接続','error'); return; }
        var date   = (document.getElementById('nw-date-b')    ||{}).value || '';
        var staff  = (document.getElementById('nw-staff-b')   ||{}).value || '';
        var kojino = ((document.getElementById('nw-fix-no')   ||{}).value||'').trim();
        var dept   = ((document.getElementById('nw-dept')     ||{}).value||'');
        var wcode  = ((document.getElementById('nw-wcode')    ||{}).value||'').trim();
        var hoursRaw = parseFloat((document.getElementById('nw-hours-b')||{}).value);
        var qty    = (document.getElementById('nw-qty-b')||{}).value;

        if (!date)   { showMsg('作業日を入力してください','error'); return; }
        if (!staff)  { showMsg('社員コードを選択してください','error'); return; }
        if (!kojino) { showMsg('仮番号を入力してください','error'); return; }
        if (isNaN(hoursRaw)||hoursRaw<=0) { showMsg('時間を入力してください','error'); return; }
        var hours = Math.round(hoursRaw/0.25)*0.25;
        if (hours !== hoursRaw) { showMsg('0.25h（15分）単位で入力してください','error'); return; }

        var btn = document.getElementById('nw-btn-b');
        if (btn) btn.disabled = true;
        try {
            var res = await client.from('t_sagyofl').insert([{
                sdate:date, kojino:kojino, zuban:dept||null,
                jugyo:wcode||null, scode:staff, stime:hours,
                kakosu:qty!==''?parseFloat(qty):null,
                input:staff, upddate:new Date().toISOString()
            }]);
            if (res.error) throw res.error;
            showMsg('登録しました（' + hours + ' h）','success');
            document.getElementById('nw-hours-b').value = '';
            if (document.getElementById('nw-qty-b')) document.getElementById('nw-qty-b').value = '';
            await loadList();
        } catch(e) { showMsg('登録失敗: ' + e.message,'error'); }
        finally { if (btn) btn.disabled = false; }
    }

    // ── 削除 ─────────────────────────────────────────────
    async function delRecord(ek) {
        if (!confirm('削除しますか？')) return;
        var client = getClient(); if (!client) return;
        try {
            var k = JSON.parse(decodeURIComponent(ek));
            var q = client.from('t_sagyofl').delete()
                .eq('kojino',k.kojino).eq('sdate',k.sdate)
                .eq('scode',k.scode).eq('stime',k.stime);
            if (k.zuban) q = q.eq('zuban',k.zuban);
            var res = await q;
            if (res.error) throw res.error;
            showMsg('削除しました','success');
            await loadList();
        } catch(e) { showMsg('削除失敗: '+e.message,'error'); }
    }

    // ── モード切替 ────────────────────────────────────────
    function switchMode(m) {
        _mode = m;
        var tabs  = { nonwork:'nw-tab-a', fixture:'nw-tab-b' };
        var panes = { nonwork:'nw-pane-a', fixture:'nw-pane-b' };
        Object.keys(tabs).forEach(function(k) {
            var tab  = document.getElementById(tabs[k]);
            var pane = document.getElementById(panes[k]);
            var act  = k === m;
            if (tab) {
                tab.style.borderBottom = act ? '3px solid #6366f1' : '3px solid transparent';
                tab.style.color        = act ? '#6366f1' : '#6b7280';
                tab.style.fontWeight   = act ? '700' : '400';
            }
            if (pane) pane.style.display = act ? 'block' : 'none';
        });
        loadList();
    }

    // ── 作業コード選択 ────────────────────────────────────
    function selCode(code) {
        _selectedCode = code;
        document.querySelectorAll('.nw-code-btn').forEach(function(btn) {
            var active = btn.dataset.code === code;
            btn.style.boxShadow = active ? '0 0 0 3px rgba(99,102,241,0.4)' : 'none';
            btn.style.opacity   = active ? '1' : '0.6';
            btn.style.transform = active ? 'scale(1.06)' : 'scale(1)';
        });
    }

    // ── HTML生成 ──────────────────────────────────────────
    function buildHTML() {
        var today = todayStr();
        var fy = 'FY' + String(new Date().getFullYear()).slice(2);

        // 作業コードボタン
        var codeBtns = '';
        NONWORK_CODES.forEach(function(c) {
            codeBtns += '<button class="nw-code-btn" data-code="' + c.code + '"' +
                ' onclick="window._nwSelCode(\'' + c.code + '\')"' +
                ' style="display:flex;flex-direction:column;align-items:center;gap:6px;' +
                'padding:14px 10px;background:#fff;border:1.5px solid #e2e8f0;' +
                'border-radius:12px;cursor:pointer;transition:all .15s;opacity:0.6;min-width:78px;">' +
                '<i class="fas ' + c.icon + '" style="font-size:22px;color:' + c.color + ';"></i>' +
                '<span style="font-size:12px;font-weight:600;color:#374151;">' + c.label + '</span>' +
                '<span style="font-size:10px;color:#94a3b8;">' + c.code + '</span>' +
                '</button>';
        });

        // 職種コード
        var deptOpts = '<option value="">-- 選択 --</option>';
        DEPT_CODES.forEach(function(d) {
            deptOpts += '<option value="' + d.code + '">' + d.code + ' - ' + d.label + '</option>';
        });

        var html = '';
        html += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">';
        html += '  <button class="btn-secondary" onclick="showPage(\'search\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>';
        html += '  <h2 style="margin:0;font-size:20px;">非稼働業務管理</h2>';
        html += '  <span style="font-size:12px;color:#6b7280;">図面番号のない作業・模範品加工の工数を記録します</span>';
        html += '</div>';

        // タブ
        html += '<div style="display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:16px;">';
        html += '  <button id="nw-tab-a" onclick="window._nwMode(\'nonwork\')" style="padding:10px 24px;border:none;background:transparent;cursor:pointer;font-size:14px;border-bottom:3px solid #6366f1;color:#6366f1;font-weight:700;transition:all .2s;"><i class="fas fa-broom" style="margin-right:6px;"></i>非稼働作業</button>';
        html += '  <button id="nw-tab-b" onclick="window._nwMode(\'fixture\')" style="padding:10px 24px;border:none;background:transparent;cursor:pointer;font-size:14px;border-bottom:3px solid transparent;color:#6b7280;transition:all .2s;"><i class="fas fa-tools" style="margin-right:6px;"></i>模範品・治具加工</button>';
        html += '</div>';

        // パネルA: 非稼働
        html += '<div id="nw-pane-a" style="display:block;">';
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;margin-bottom:16px;">';
        html += '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">作業日 <span style="color:#ef4444">*</span></label>';
        html += '      <input id="nw-date-a" type="date" value="' + today + '" onchange="window._nwLoad()" style="' + IS() + '"></div>';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">社員コード <span style="color:#ef4444">*</span></label>';
        html += '      <select id="nw-staff-a" onchange="window._nwLoad()" style="' + IS() + '"><option value="">（読込中）</option></select></div>';
        html += '  </div>';
        html += '  <div style="margin-bottom:16px;"><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:10px;">作業コード <span style="color:#ef4444">*</span></label>';
        html += '    <div style="display:flex;flex-wrap:wrap;gap:8px;">' + codeBtns + '</div></div>';
        html += '  <div style="display:grid;grid-template-columns:160px 1fr;gap:14px;align-items:end;">';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">時間 <span style="color:#ef4444">*</span> <span style="font-weight:400;color:#94a3b8;">(0.25単位)</span></label>';
        html += '      <input id="nw-hours-a" type="number" step="0.25" min="0.25" max="7.75" placeholder="例: 1.5" style="' + IS() + '"></div>';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">メモ（任意）</label>';
        html += '      <input id="nw-memo-a" type="text" placeholder="備考など" style="' + IS() + '"></div>';
        html += '  </div>';
        html += '  <div style="margin-top:14px;display:flex;align-items:center;gap:12px;">';
        html += '    <button id="nw-btn-a" onclick="window._nwSubmitA()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-save"></i> 登録</button>';
        html += '    <span id="nw-msg" style="display:none;font-size:13px;font-weight:500;"></span>';
        html += '  </div>';
        html += '</div></div>';

        // パネルB: 模範品
        html += '<div id="nw-pane-b" style="display:none;">';
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;margin-bottom:16px;">';
        html += '  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">作業日 <span style="color:#ef4444">*</span></label>';
        html += '      <input id="nw-date-b" type="date" value="' + today + '" onchange="window._nwLoad()" style="' + IS() + '"></div>';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">社員コード <span style="color:#ef4444">*</span></label>';
        html += '      <select id="nw-staff-b" onchange="window._nwLoad()" style="' + IS() + '"><option value="">（読込中）</option></select></div>';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">仮番号 <span style="color:#ef4444">*</span></label>';
        html += '      <input id="nw-fix-no" type="text" placeholder="例: ' + fy + '" style="' + IS() + '"></div>';
        html += '  </div>';
        html += '  <div style="display:grid;grid-template-columns:1fr 1fr 120px 120px;gap:14px;align-items:end;">';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">職種コード</label>';
        html += '      <select id="nw-dept" style="' + IS() + '">' + deptOpts + '</select></div>';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">作業内容コード</label>';
        html += '      <input id="nw-wcode" type="text" placeholder="例: MACH" style="' + IS() + '"></div>';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">時間 <span style="color:#ef4444">*</span></label>';
        html += '      <input id="nw-hours-b" type="number" step="0.25" min="0.25" max="7.75" placeholder="0.25〜" style="' + IS() + '"></div>';
        html += '    <div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">加工数</label>';
        html += '      <input id="nw-qty-b" type="number" step="1" min="0" placeholder="任意" style="' + IS() + '"></div>';
        html += '  </div>';
        html += '  <div style="margin-top:14px;">';
        html += '    <button id="nw-btn-b" onclick="window._nwSubmitB()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-save"></i> 登録</button>';
        html += '  </div>';
        html += '</div></div>';

        // 当日一覧
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;">';
        html += '  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
        html += '    <h3 style="margin:0;font-size:15px;">当日入力済み一覧</h3>';
        html += '    <div style="display:flex;align-items:center;gap:12px;">';
        html += '      <span id="nw-total" style="font-size:13px;"></span>';
        html += '      <button onclick="window._nwLoad()" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px;"><i class="fas fa-sync-alt"></i> 更新</button>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div style="overflow-x:auto;">';
        html += '    <table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '      <thead><tr style="background:#f8fafc;">';
        html += '        <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;">コード/番号</th>';
        html += '        <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;">作業</th>';
        html += '        <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;">図番/職種</th>';
        html += '        <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;">社員CD</th>';
        html += '        <th style="padding:8px;text-align:right;border-bottom:2px solid #e2e8f0;">時間</th>';
        html += '        <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;">操作</th>';
        html += '      </tr></thead>';
        html += '      <tbody id="nw-tbody"><tr><td colspan="6" style="text-align:center;color:#6b7280;padding:10px;">社員コードを選択してください</td></tr></tbody>';
        html += '    </table>';
        html += '  </div>';
        html += '</div>';

        return html;
    }

    // ── 初期化 ────────────────────────────────────────────
    function initNonWorkPage() {
        var container = document.getElementById('non-work-content');
        if (!container) {
            console.error('non-work-content が見つかりません');
            return;
        }

        container.innerHTML = buildHTML();

        window._nwMode    = switchMode;
        window._nwSelCode = selCode;
        window._nwSubmitA = submitA;
        window._nwSubmitB = submitB;
        window._nwDel     = delRecord;
        window._nwLoad    = loadList;

        loadStaff().then(function(){ loadList(); });
    }

    window.initNonWorkPage = initNonWorkPage;

})();
