/**
 * 非稼働業務管理モジュール
 * ページID: non-work-page
 * テーブル: t_sagyofl (worktime-entryと同テーブル)
 *
 * モード A: 非稼働作業（清掃・ミーティング等）… kojino=作業コード, zuban=null
 * モード B: 模範品・治具加工 … kojino=仮番号(FY25等), 作業コードあり
 *
 * 0.25h（15分）単位 / 1日合計 7.75h 超え警告
 */
(function () {
    'use strict';

    var _mode = 'nonwork';        // 'nonwork' | 'fixture'
    var _staffcodes = [];
    var _selectedCode = '';       // 非稼働モードで選択中の作業コード
    var _initialized = false;

    // ── 非稼働作業コード定義 ───────────────────────────
    var NONWORK_CODES = [
        { code: 'CLNG',  label: '清掃',       icon: 'fa-broom',          color: '#6366f1' },
        { code: 'SAW',   label: '材料準備',   icon: 'fa-boxes',          color: '#f59e0b' },
        { code: 'MEET',  label: 'ミーティング', icon: 'fa-comments',     color: '#3b82f6' },
        { code: 'EDU',   label: '指導・教育', icon: 'fa-graduation-cap', color: '#10b981' },
        { code: 'MAINT', label: '設備保全',   icon: 'fa-tools',          color: '#ef4444' },
        { code: 'QC',    label: '品質管理',   icon: 'fa-clipboard-check',color: '#8b5cf6' },
        { code: 'SHIP',  label: '出荷作業',   icon: 'fa-truck',          color: '#0ea5e9' },
        { code: 'ORDER', label: '受入・検品', icon: 'fa-box-open',       color: '#f97316' },
        { code: 'ADMIN', label: '事務処理',   icon: 'fa-file-alt',       color: '#64748b' },
        { code: 'OTHER', label: 'その他',     icon: 'fa-ellipsis-h',     color: '#94a3b8' }
    ];

    // 職種コード（部署別）
    var DEPT_CODES = [
        { code: 'KO',   label: '加工' },
        { code: 'KOU',  label: '工作' },
        { code: 'ASSM', label: '組立' },
        { code: 'DENSO',label: '電装' },
        { code: 'INSP', label: '検査' },
        { code: 'MISC', label: 'その他' }
    ];

    // ── ユーティリティ ──────────────────────────────────
    function sb() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }
    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
    }
    function pad(n) { return String(n).padStart(2,'0'); }
    function fmtH(h) { return parseFloat(h).toFixed(2); }

    function showMsg(msg, type) {
        var el = document.getElementById('nw-message');
        if (!el) return;
        var c = { success:'#22c55e', error:'#ef4444', warn:'#f59e0b', info:'#3b82f6' }[type] || '#64748b';
        el.innerHTML = msg;
        el.style.color = c;
        el.style.display = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(function(){ el.style.display='none'; }, 6000);
    }

    // ── スタッフ読込 ────────────────────────────────────
    async function loadStaff() {
        var client = sb(); if (!client) return;
        try {
            var r = await client.from('t_staffcode').select('staffcode,staffname').order('staffcode');
            _staffcodes = r.error ? [] : (r.data || []);
        } catch(e) { _staffcodes = []; }
        ['nw-staff','nw-staff-b'].forEach(function(id) {
            var sel = document.getElementById(id); if (!sel) return;
            sel.innerHTML = '<option value="">-- 選択 --</option>';
            _staffcodes.forEach(function(s) {
                var o = document.createElement('option');
                o.value = s.staffcode;
                o.textContent = s.staffcode + ' - ' + (s.staffname || '');
                sel.appendChild(o);
            });
        });
    }

    // ── 当日実績読込 ────────────────────────────────────
    async function loadList() {
        var client = sb();
        var tbody = document.getElementById('nw-list-body');
        if (!tbody) return;
        var staffA = (document.getElementById('nw-staff')   ||{}).value || '';
        var staffB = (document.getElementById('nw-staff-b') ||{}).value || '';
        var staff  = _mode === 'nonwork' ? staffA : staffB;
        var date   = (document.getElementById('nw-date-' + (_mode==='nonwork'?'a':'b')) ||{}).value || todayStr();

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
                totEl.innerHTML = '合計: <strong style="color:' + (over?'#ef4444':'#22c55e') + ';">' + fmtH(total) + ' h</strong> / 7.75h';
            }

            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:10px;">データなし</td></tr>';
                return;
            }
            tbody.innerHTML = rows.map(function(r) {
                var label = r.kojino || '-';
                var nwc = NONWORK_CODES.find(function(c){ return c.code === r.jugyo; });
                var chip = nwc
                    ? '<span style="background:' + nwc.color + '20;color:' + nwc.color + ';padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;">' + nwc.label + '</span>'
                    : (r.jugyo || '-');
                var dk = encodeURIComponent(JSON.stringify({kojino:r.kojino,zuban:r.zuban,scode:r.scode,sdate:r.sdate,stime:r.stime}));
                return '<tr>' +
                    '<td style="padding:6px 8px;">' + label + '</td>' +
                    '<td style="padding:6px 8px;">' + chip + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.zuban||'-') + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.scode||'-') + '</td>' +
                    '<td style="padding:6px 8px;text-align:right;font-weight:600;">' + fmtH(r.stime) + ' h</td>' +
                    '<td style="padding:6px 8px;text-align:center;">' +
                      '<button onclick="window._nwDelete(\'' + dk + '\')" style="background:#fee2e2;color:#ef4444;border:none;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:12px;">削除</button>' +
                    '</td></tr>';
            }).join('');
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ef4444;">' + e.message + '</td></tr>';
        }
    }

    // ── 登録（非稼働） ──────────────────────────────────
    async function submitNonWork() {
        var client = sb(); if (!client) { showMsg('Supabase未接続','error'); return; }
        var date  = (document.getElementById('nw-date-a')||{}).value || '';
        var staff = (document.getElementById('nw-staff')  ||{}).value || '';
        var hours = parseFloat((document.getElementById('nw-hours-a')||{}).value);
        var memo  = ((document.getElementById('nw-memo')  ||{}).value||'').trim();

        if (!date)  { showMsg('作業日を入力してください','error'); return; }
        if (!staff) { showMsg('社員コードを選択してください','error'); return; }
        if (!_selectedCode) { showMsg('作業コードを選択してください','error'); return; }
        if (isNaN(hours)||hours<=0) { showMsg('時間を入力してください','error'); return; }
        var rounded = Math.round(hours/0.25)*0.25;
        if (rounded !== hours) { showMsg('0.25h（15分）単位で入力してください','error'); return; }

        // 1日合計チェック
        try {
            var sr = await client.from('t_sagyofl').select('stime').eq('sdate',date).eq('scode',staff);
            if (!sr.error) {
                var cur = (sr.data||[]).reduce(function(a,r){ return a+(parseFloat(r.stime)||0); },0);
                if (cur+hours > 7.75) showMsg('⚠ 合計が7.75hを超えます（現在: '+fmtH(cur)+' h + 今回: '+hours+' h）','warn');
            }
        } catch(_e){}

        var btn = document.getElementById('nw-submit-a');
        if (btn) btn.disabled = true;
        try {
            var payload = {
                sdate:date, kojino:_selectedCode, zuban:null,
                jugyo:_selectedCode, scode:staff, stime:hours,
                input:staff, upddate:new Date().toISOString(),
                kakosu:null
            };
            if (memo) payload.memo = memo;
            var res = await client.from('t_sagyofl').insert([payload]);
            if (res.error) throw res.error;
            showMsg('登録しました（'+hours+' h）','success');
            document.getElementById('nw-hours-a').value = '';
            if (document.getElementById('nw-memo')) document.getElementById('nw-memo').value = '';
            await loadList();
        } catch(e) { showMsg('登録失敗: '+e.message,'error'); }
        finally { if (btn) btn.disabled = false; }
    }

    // ── 登録（模範品・治具） ────────────────────────────
    async function submitFixture() {
        var client = sb(); if (!client) { showMsg('Supabase未接続','error'); return; }
        var date    = (document.getElementById('nw-date-b')    ||{}).value || '';
        var staff   = (document.getElementById('nw-staff-b')   ||{}).value || '';
        var kojino  = ((document.getElementById('nw-fixture-no')||{}).value||'').trim();
        var deptcode= ((document.getElementById('nw-dept-code') ||{}).value||'').trim();
        var workcode= ((document.getElementById('nw-work-code') ||{}).value||'').trim();
        var hours   = parseFloat((document.getElementById('nw-hours-b')||{}).value);
        var qty     = (document.getElementById('nw-qty-b')||{}).value;

        if (!date)   { showMsg('作業日を入力してください','error'); return; }
        if (!staff)  { showMsg('社員コードを選択してください','error'); return; }
        if (!kojino) { showMsg('仮番号を入力してください（例: FY25）','error'); return; }
        if (isNaN(hours)||hours<=0) { showMsg('時間を入力してください','error'); return; }
        var rounded = Math.round(hours/0.25)*0.25;
        if (rounded !== hours) { showMsg('0.25h（15分）単位で入力してください','error'); return; }

        try {
            var sr = await client.from('t_sagyofl').select('stime').eq('sdate',date).eq('scode',staff);
            if (!sr.error) {
                var cur = (sr.data||[]).reduce(function(a,r){ return a+(parseFloat(r.stime)||0); },0);
                if (cur+hours > 7.75) showMsg('⚠ 合計が7.75hを超えます（現在: '+fmtH(cur)+' h + 今回: '+hours+' h）','warn');
            }
        } catch(_e){}

        var btn = document.getElementById('nw-submit-b');
        if (btn) btn.disabled = true;
        try {
            var payload2 = {
                sdate:date, kojino:kojino, zuban:deptcode||null,
                jugyo:workcode||null, scode:staff, stime:hours,
                kakosu:qty!==''?parseFloat(qty):null,
                input:staff, upddate:new Date().toISOString()
            };
            var res2 = await client.from('t_sagyofl').insert([payload2]);
            if (res2.error) throw res2.error;
            showMsg('登録しました（'+hours+' h）','success');
            document.getElementById('nw-hours-b').value = '';
            if (document.getElementById('nw-qty-b')) document.getElementById('nw-qty-b').value = '';
            await loadList();
        } catch(e) { showMsg('登録失敗: '+e.message,'error'); }
        finally { if (btn) btn.disabled = false; }
    }

    // ── 削除 ───────────────────────────────────────────
    async function deleteRecord(encodedKey) {
        if (!confirm('この工数データを削除しますか？')) return;
        var client = sb(); if (!client) return;
        try {
            var key = JSON.parse(decodeURIComponent(encodedKey));
            var q = client.from('t_sagyofl').delete()
                .eq('kojino',key.kojino).eq('sdate',key.sdate)
                .eq('scode',key.scode).eq('stime',key.stime);
            if (key.zuban) q = q.eq('zuban',key.zuban);
            var res = await q;
            if (res.error) throw res.error;
            showMsg('削除しました','success');
            await loadList();
        } catch(e) { showMsg('削除失敗: '+e.message,'error'); }
    }

    // ── モード切替 ──────────────────────────────────────
    function switchMode(mode) {
        _mode = mode;
        ['nonwork','fixture'].forEach(function(m) {
            var tab = document.getElementById('nw-tab-' + m);
            var pane = document.getElementById('nw-pane-' + m);
            var active = m === mode;
            if (tab) {
                tab.style.borderBottom = active ? '3px solid #6366f1' : '3px solid transparent';
                tab.style.color  = active ? '#6366f1' : '#6b7280';
                tab.style.fontWeight = active ? '700' : '400';
            }
            if (pane) pane.style.display = active ? 'block' : 'none';
        });
        loadList();
    }

    // ── 作業コードボタン選択 ─────────────────────────────
    function selectCode(code) {
        _selectedCode = code;
        document.querySelectorAll('.nw-code-btn').forEach(function(btn) {
            var active = btn.dataset.code === code;
            btn.style.transform = active ? 'scale(1.08)' : '';
            btn.style.boxShadow = active ? '0 0 0 3px rgba(99,102,241,0.35)' : '';
            btn.style.opacity   = active ? '1' : '0.65';
        });
    }

    // ── HTML生成 ────────────────────────────────────────
    function buildHTML() {
        var inputStyle = 'width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;background:#fff;';

        // 作業コードボタングリッド
        var codeBtns = NONWORK_CODES.map(function(c) {
            return '<button class="nw-code-btn" data-code="' + c.code + '" onclick="window._nwSelectCode(\'' + c.code + '\')" ' +
                'style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;' +
                'background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;cursor:pointer;' +
                'transition:all .15s;opacity:0.65;min-width:80px;">' +
                '<i class="fas ' + c.icon + '" style="font-size:22px;color:' + c.color + ';"></i>' +
                '<span style="font-size:12px;font-weight:600;color:#374151;">' + c.label + '</span>' +
                '<span style="font-size:10px;color:#94a3b8;">' + c.code + '</span>' +
                '</button>';
        }).join('');

        // 職種コードDD
        var deptOptions = DEPT_CODES.map(function(d) {
            return '<option value="' + d.code + '">' + d.code + ' - ' + d.label + '</option>';
        }).join('');

        var currentYear = new Date().getFullYear();
        var fyDefault = 'FY' + String(currentYear).slice(2);

        return [
        // ヘッダー
        '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">',
        '  <button class="btn-secondary" onclick="showPage(\'search\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>',
        '  <h2 style="margin:0;font-size:20px;">非稼働業務管理</h2>',
        '  <span style="font-size:12px;color:#6b7280;">図面番号のない作業・模範品加工の工数を記録します</span>',
        '</div>',

        // タブ
        '<div style="display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:16px;">',
        '  <button id="nw-tab-nonwork" onclick="window._nwSwitchMode(\'nonwork\')" style="padding:10px 24px;border:none;background:transparent;cursor:pointer;font-size:14px;border-bottom:3px solid #6366f1;color:#6366f1;font-weight:700;transition:all .2s;">',
        '    <i class="fas fa-broom" style="margin-right:6px;"></i>非稼働作業',
        '  </button>',
        '  <button id="nw-tab-fixture" onclick="window._nwSwitchMode(\'fixture\')" style="padding:10px 24px;border:none;background:transparent;cursor:pointer;font-size:14px;border-bottom:3px solid transparent;color:#6b7280;transition:all .2s;">',
        '    <i class="fas fa-tools" style="margin-right:6px;"></i>模範品・治具加工',
        '  </button>',
        '</div>',

        // ── パネルA: 非稼働作業 ──
        '<div id="nw-pane-nonwork">',
        '  <div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;margin-bottom:16px;">',
        '    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">作業日 <span style="color:#ef4444">*</span></label>',
        '        <input id="nw-date-a" type="date" style="' + inputStyle + '" value="' + todayStr() + '" onchange="window._nwLoadList()" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
        '      </div>',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">社員コード <span style="color:#ef4444">*</span></label>',
        '        <select id="nw-staff" style="' + inputStyle + '" onchange="window._nwLoadList()">',
        '          <option value="">（読込中）</option>',
        '        </select>',
        '      </div>',
        '    </div>',

        '    <div style="margin-bottom:16px;">',
        '      <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:10px;">作業コード <span style="color:#ef4444">*</span></label>',
        '      <div style="display:flex;flex-wrap:wrap;gap:8px;">',
              codeBtns,
        '      </div>',
        '    </div>',

        '    <div style="display:grid;grid-template-columns:1fr 2fr;gap:14px;align-items:end;">',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">時間 <span style="color:#ef4444">*</span><span style="color:#94a3b8;font-weight:400;"> (0.25単位)</span></label>',
        '        <input id="nw-hours-a" type="number" step="0.25" min="0.25" max="7.75" placeholder="例: 1.5"',
        '          style="' + inputStyle + '" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
        '      </div>',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">メモ（任意）</label>',
        '        <input id="nw-memo" type="text" placeholder="備考・内容など"',
        '          style="' + inputStyle + '" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
        '      </div>',
        '    </div>',

        '    <div style="margin-top:14px;display:flex;align-items:center;gap:12px;">',
        '      <button id="nw-submit-a" onclick="window._nwSubmitA()" class="btn-primary" style="padding:10px 24px;background:#6366f1;border-color:#6366f1;">',
        '        <i class="fas fa-save"></i> 登録',
        '      </button>',
        '      <span id="nw-message" style="display:none;font-weight:500;font-size:13px;"></span>',
        '    </div>',
        '  </div>',
        '</div>',

        // ── パネルB: 模範品・治具 ──
        '<div id="nw-pane-fixture" style="display:none;">',
        '  <div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;margin-bottom:16px;">',
        '    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">作業日 <span style="color:#ef4444">*</span></label>',
        '        <input id="nw-date-b" type="date" style="' + inputStyle + '" value="' + todayStr() + '" onchange="window._nwLoadList()" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
        '      </div>',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">社員コード <span style="color:#ef4444">*</span></label>',
        '        <select id="nw-staff-b" style="' + inputStyle + '" onchange="window._nwLoadList()">',
        '          <option value="">（読込中）</option>',
        '        </select>',
        '      </div>',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">仮番号 <span style="color:#ef4444">*</span></label>',
        '        <input id="nw-fixture-no" type="text" placeholder="例: ' + fyDefault + '"',
        '          style="' + inputStyle + '" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
        '      </div>',
        '    </div>',
        '    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;align-items:end;">',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">職種コード</label>',
        '        <select id="nw-dept-code" style="' + inputStyle + '"><option value="">-- 選択 --</option>' + deptOptions + '</select>',
        '      </div>',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">作業内容コード</label>',
        '        <input id="nw-work-code" type="text" placeholder="例: MACH"',
        '          style="' + inputStyle + '" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
        '      </div>',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">時間 <span style="color:#ef4444">*</span><span style="color:#94a3b8;font-weight:400;"> (0.25単位)</span></label>',
        '        <input id="nw-hours-b" type="number" step="0.25" min="0.25" max="7.75" placeholder="例: 2.0"',
        '          style="' + inputStyle + '" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
        '      </div>',
        '      <div>',
        '        <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">加工数</label>',
        '        <input id="nw-qty-b" type="number" step="1" min="0" placeholder="任意"',
        '          style="' + inputStyle + '" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
        '      </div>',
        '    </div>',
        '    <div style="margin-top:14px;display:flex;align-items:center;gap:12px;">',
        '      <button id="nw-submit-b" onclick="window._nwSubmitB()" class="btn-primary" style="padding:10px 24px;">',
        '        <i class="fas fa-save"></i> 登録',
        '      </button>',
        '    </div>',
        '  </div>',
        '</div>',

        // ── 当日実績一覧 ──
        '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;">',
        '  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">',
        '    <h3 style="margin:0;font-size:15px;color:#1e293b;">当日入力済み一覧</h3>',
        '    <div style="display:flex;align-items:center;gap:12px;">',
        '      <span id="nw-total" style="font-size:13px;color:#64748b;"></span>',
        '      <button class="btn-secondary" onclick="window._nwLoadList()" style="font-size:12px;padding:5px 12px;"><i class="fas fa-sync-alt"></i> 更新</button>',
        '    </div>',
        '  </div>',
        '  <div style="overflow-x:auto;">',
        '    <table class="data-table" style="width:100%;font-size:13px;">',
        '      <thead><tr>',
        '        <th>コード/番号</th><th>作業</th><th>図番/職種</th>',
        '        <th>社員CD</th><th style="text-align:right;">時間</th><th style="text-align:center;">操作</th>',
        '      </tr></thead>',
        '      <tbody id="nw-list-body">',
        '        <tr><td colspan="6" style="text-align:center;color:#6b7280;padding:10px;">社員コードを選択してください</td></tr>',
        '      </tbody>',
        '    </table>',
        '  </div>',
        '</div>'
        ].join('\n');
    }

    // ── 初期化 ──────────────────────────────────────────
    function initNonWorkPage() {
        var container = document.getElementById('non-work-content');
        if (!container) return;

        if (!_initialized) {
            container.innerHTML = buildHTML();
            _initialized = true;
        }

        window._nwSwitchMode = switchMode;
        window._nwSelectCode = selectCode;
        window._nwSubmitA    = submitNonWork;
        window._nwSubmitB    = submitFixture;
        window._nwDelete     = deleteRecord;
        window._nwLoadList   = loadList;

        loadStaff().then(loadList);
        switchMode('nonwork');
    }

    window.initNonWorkPage = initNonWorkPage;

})();
