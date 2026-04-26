/**
 * 工数入力モジュール (t_worktime_kako 対応版)
 * ページID: worktime-entry-page
 *
 * t_worktime_kako カラム:
 *   keydate, constructionno, symbolmachine, symbolunit, drawingno,
 *   partno, staffcode, workcode, qty, worktime, workdate,
 *   dateinput, chkflg, registercode, kakemochiflg, mujinflg, ip_address
 */
(function () {
    'use strict';

    var _projects   = [];
    var _workcodes  = [];
    var _staffcodes = [];
    var _machines   = [];
    var _initialized = false;
    var _currentTab = 0;

    function getSupabase() {
        if (typeof getSupabaseClient === 'function') return getSupabaseClient();
        return null;
    }
    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }
    function thisMonthFrom() {
        var d = new Date(); d.setDate(1);
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-01';
    }
    function showMsg(msg, type) {
        var el = document.getElementById('wte-message');
        if (!el) return;
        var color = { success: '#22c55e', error: '#ef4444', warn: '#f59e0b' }[type] || '#6b7280';
        el.textContent = msg;
        el.style.color = color;
        el.style.display = 'block';
        clearTimeout(el._timer);
        el._timer = setTimeout(function () { el.style.display = 'none'; }, 6000);
    }
    function setLoading(flag) {
        var btn = document.getElementById('wte-submit-btn');
        if (btn) btn.disabled = flag;
        var ind = document.getElementById('wte-loading');
        if (ind) ind.style.display = flag ? 'inline' : 'none';
    }

    // ── タブ切替 ──────────────────────────────────────
    function showTab(n) {
        _currentTab = n;
        document.getElementById('wte-input-tab').style.display = n === 0 ? 'block' : 'none';
        document.getElementById('wte-dash-tab').style.display  = n === 1 ? 'block' : 'none';
        document.getElementById('wte-tab-input').classList.toggle('active', n === 0);
        document.getElementById('wte-tab-dash').classList.toggle('active',  n === 1);
        if (n === 1) loadDashboard();
    }
    window.wteShowTab = showTab;

    // ── マスタ読込 ──────────────────────────────────
    async function loadWorkcodes() {
        var sb = getSupabase(); if (!sb) return;
        try {
            var r = await sb.from('t_workcode').select('workcode,workname').order('workcode');
            _workcodes = r.error ? [] : (r.data || []);
        } catch(e) { _workcodes = []; }
        var sel = document.getElementById('wte-workcode');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- 選択 --</option>';
        _workcodes.forEach(function(r) {
            var o = document.createElement('option');
            o.value = r.workcode;
            o.textContent = r.workcode + ' - ' + (r.workname || '');
            sel.appendChild(o);
        });
    }

    async function loadStaff() {
        var sb = getSupabase(); if (!sb) return;
        try {
            var r = await sb.from('t_staffcode').select('staffcode,staffname').order('staffcode');
            _staffcodes = r.error ? [] : (r.data || []);
        } catch(e) { _staffcodes = []; }
        ['wte-staff','wte-dash-staff'].forEach(function(id) {
            var sel = document.getElementById(id);
            if (!sel) return;
            sel.innerHTML = '<option value="">（全員）</option>';
            _staffcodes.forEach(function(r) {
                var o = document.createElement('option');
                o.value = r.staffcode;
                o.textContent = r.staffcode + ' - ' + (r.staffname || '');
                sel.appendChild(o);
            });
        });
    }

    async function loadProjects() {
        var sb = getSupabase(); if (!sb) return;
        try {
            var r = await sb.from('t_acceptorder')
                .select('constructno,registerdate,constructname')
                .order('constructno', { ascending: false }).limit(500);
            _projects = r.error ? [] : (r.data || []);
        } catch(e) { _projects = []; }
        var dl = document.getElementById('wte-constructno-list');
        if (!dl) return;
        dl.innerHTML = '';
        _projects.forEach(function(r) {
            var o = document.createElement('option');
            o.value = r.constructno; o.label = r.constructname || '';
            dl.appendChild(o);
        });
    }

    async function loadMachines() {
        var sb = getSupabase(); if (!sb) return;
        try {
            var r = await sb.from('t_symbolmachine').select('symbolmachine,machinename').order('symbolmachine');
            _machines = r.error ? [] : (r.data || []);
        } catch(e) { _machines = []; }
        var sel = document.getElementById('wte-machine');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- 選択（任意）--</option>';
        _machines.forEach(function(r) {
            var o = document.createElement('option');
            o.value = r.symbolmachine;
            o.textContent = r.symbolmachine + (r.machinename ? ' - ' + r.machinename : '');
            sel.appendChild(o);
        });
    }

    async function loadDrawings(constructno) {
        var sb = getSupabase();
        var sel = document.getElementById('wte-drawingno');
        if (!sel) return;
        if (!constructno || !sb) {
            sel.innerHTML = '<option value="">（工事番号を入力してください）</option>';
            return;
        }
        sel.innerHTML = '<option value="">（読込中...）</option>';
        try {
            var r = await sb.from('t_manufctparts')
                .select('drawingno,description').eq('constructionno', constructno)
                .order('drawingno').limit(300);
            var rows = r.error ? [] : (r.data || []);
            sel.innerHTML = '<option value="">-- 選択 --</option>';
            rows.forEach(function(r) {
                var o = document.createElement('option');
                o.value = r.drawingno;
                o.textContent = r.drawingno + (r.description ? ' - ' + r.description : '');
                sel.appendChild(o);
            });
        } catch(e) {
            sel.innerHTML = '<option value="">（取得失敗）</option>';
        }
        var oth = document.createElement('option');
        oth.value = '__other__'; oth.textContent = '（直接入力）';
        sel.appendChild(oth);
    }

    // ── 当日実績一覧 ──────────────────────────────────
    async function loadTodayWorktimes() {
        var sb = getSupabase();
        var tbody = document.getElementById('wte-list-body');
        if (!tbody) return;
        var staffcode = (document.getElementById('wte-staff') || {}).value || '';
        var workDate  = (document.getElementById('wte-date')  || {}).value || todayStr();

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;padding:12px;">読込中...</td></tr>';
        if (!sb) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444;">Supabase 未接続</td></tr>';
            return;
        }
        try {
            var q = sb.from('t_worktime_kako').select('*').eq('workdate', workDate).order('dateinput', { ascending: false });
            if (staffcode) q = q.eq('staffcode', staffcode);
            var res = await q;
            if (res.error) throw res.error;
            var rows = res.data || [];

            var total = rows.reduce(function(acc, r) { return acc + (parseFloat(r.worktime) || 0); }, 0);
            var totalEl = document.getElementById('wte-total-hours');
            if (totalEl) {
                var limit = 7.75;
                totalEl.textContent = '合計: ' + total.toFixed(2) + ' 時間';
                totalEl.style.color = total > limit ? '#ef4444' : '#22c55e';
            }

            if (rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;padding:12px;">データなし</td></tr>';
                return;
            }
            tbody.innerHTML = rows.map(function(r) {
                var delKey = encodeURIComponent(JSON.stringify({
                    constructionno: r.constructionno, workdate: r.workdate,
                    staffcode: r.staffcode, worktime: r.worktime
                }));
                return '<tr>' +
                    '<td style="padding:6px 8px;">' + (r.constructionno || '-') + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.drawingno || '-') + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.workcode || '-') + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.staffcode || '-') + '</td>' +
                    '<td style="padding:6px 8px;text-align:right;">' + (r.worktime || 0) + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.qty != null ? r.qty : '-') + '</td>' +
                    '<td style="padding:6px 8px;text-align:center;">' +
                    '<button onclick="wteDelete(\'' + delKey + '\')" style="background:#ef4444;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:12px;">削除</button>' +
                    '</td></tr>';
            }).join('');
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444;">' + e.message + '</td></tr>';
        }
    }
    window.loadTodayWorktimes = loadTodayWorktimes;

    // ── 登録処理 ──────────────────────────────────────
    async function submitWorktime() {
        var sb = getSupabase();
        if (!sb) { showMsg('Supabase 未接続です', 'error'); return; }

        var workDate     = (document.getElementById('wte-date')          || {}).value || '';
        var constructno  = ((document.getElementById('wte-constructno')  || {}).value || '').trim();
        var drawingSel   = (document.getElementById('wte-drawingno')     || {}).value || '';
        var drawingTxt   = ((document.getElementById('wte-drawingno-text')|| {}).value || '').trim();
        var workcode     = (document.getElementById('wte-workcode')      || {}).value || '';
        var staffcode    = (document.getElementById('wte-staff')         || {}).value || '';
        var machine      = (document.getElementById('wte-machine')       || {}).value || '';
        var hoursRaw     = parseFloat((document.getElementById('wte-hours') || {}).value);
        var qty          = (document.getElementById('wte-qty')           || {}).value;

        var drawingno = (drawingSel === '__other__' || drawingSel === '') ? drawingTxt : drawingSel;

        if (!workDate)    { showMsg('作業日を入力してください', 'error'); return; }
        if (!constructno) { showMsg('工事番号を入力してください', 'error'); return; }
        if (!staffcode)   { showMsg('社員コードを選択してください', 'error'); return; }
        if (isNaN(hoursRaw)) { showMsg('時間を入力してください', 'error'); return; }

        var hours = Math.round(hoursRaw / 0.25) * 0.25;
        if (hours <= 0) { showMsg('0より大きい値を入力してください', 'error'); return; }

        // 1日合計チェック
        try {
            var sumRes = await sb.from('t_worktime_kako').select('worktime').eq('workdate', workDate).eq('staffcode', staffcode);
            if (!sumRes.error) {
                var cur = (sumRes.data || []).reduce(function(a,r){ return a+(parseFloat(r.worktime)||0); }, 0);
                if (cur + hours > 7.75) {
                    showMsg('⚠ 1日合計が7.75時間を超えます（現在: ' + cur.toFixed(2) + ' h + 今回: ' + hours + ' h）', 'warn');
                }
            }
        } catch(_e) {}

        setLoading(true);
        try {
            var payload = {
                constructionno : constructno,
                drawingno      : drawingno || null,
                workcode       : workcode  || null,
                staffcode      : staffcode,
                symbolmachine  : machine   || null,
                qty            : qty !== '' ? parseInt(qty, 10) : null,
                worktime       : hours,
                workdate       : workDate,
                dateinput      : todayStr(),
                chkflg         : 0
            };

            // keydate を t_acceptorder から取得
            try {
                var ao = await sb.from('t_acceptorder').select('registerdate').eq('constructno', constructno).limit(1).single();
                if (!ao.error && ao.data) payload.keydate = ao.data.registerdate;
            } catch(_e) {}

            var res = await sb.from('t_worktime_kako').insert([payload]);
            if (res.error) throw res.error;

            showMsg('登録しました（' + hours + ' 時間）', 'success');
            document.getElementById('wte-hours').value = '';
            if (document.getElementById('wte-qty')) document.getElementById('wte-qty').value = '';
            await loadTodayWorktimes();
        } catch(e) {
            showMsg('登録失敗: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    }
    window.submitWorktime = submitWorktime;

    // ── 削除処理 ──────────────────────────────────────
    async function deleteWorktime(encodedKey) {
        if (!confirm('この工数データを削除しますか？')) return;
        var sb = getSupabase();
        if (!sb) { showMsg('Supabase 未接続です', 'error'); return; }
        try {
            var key = JSON.parse(decodeURIComponent(encodedKey));
            var res = await sb.from('t_worktime_kako').delete()
                .eq('constructionno', key.constructionno)
                .eq('workdate',       key.workdate)
                .eq('staffcode',      key.staffcode)
                .eq('worktime',       key.worktime);
            if (res.error) throw res.error;
            showMsg('削除しました', 'success');
            await loadTodayWorktimes();
        } catch(e) {
            showMsg('削除失敗: ' + e.message, 'error');
        }
    }
    window.wteDelete = deleteWorktime;

    // ── ダッシュボード ────────────────────────────────
    async function loadDashboard() {
        var sb = getSupabase();
        var tbody = document.getElementById('wte-dash-body');
        var summEl = document.getElementById('wte-dash-summary');
        if (!tbody) return;

        var dateFrom    = (document.getElementById('wte-dash-from')   || {}).value || thisMonthFrom();
        var dateTo      = (document.getElementById('wte-dash-to')     || {}).value || todayStr();
        var staffFilter = (document.getElementById('wte-dash-staff')  || {}).value || '';
        var constrFilter= ((document.getElementById('wte-dash-constructno') || {}).value || '').trim();
        var groupBy     = (document.getElementById('wte-dash-group')  || {}).value || 'staffcode';

        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:16px;">読込中...</td></tr>';
        if (summEl) summEl.textContent = '';
        if (!sb) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ef4444;">Supabase 未接続</td></tr>';
            return;
        }
        try {
            var q = sb.from('t_worktime_kako').select('*')
                .gte('workdate', dateFrom)
                .lte('workdate', dateTo);
            if (staffFilter)  q = q.eq('staffcode', staffFilter);
            if (constrFilter) q = q.eq('constructionno', constrFilter);
            q = q.limit(10000);
            var res = await q;
            if (res.error) throw res.error;
            var rows = res.data || [];

            // 集計
            var map = {};
            rows.forEach(function(r) {
                var key = groupBy === 'constructionno' ? (r.constructionno || '-') : (r.staffcode || '-');
                if (!map[key]) map[key] = { key: key, hours: 0, qty: 0, days: {}, cnt: 0 };
                map[key].hours += parseFloat(r.worktime) || 0;
                map[key].qty   += parseInt(r.qty, 10) || 0;
                if (r.workdate) map[key].days[r.workdate] = 1;
                map[key].cnt++;
            });

            var sorted = Object.values(map).sort(function(a,b){ return b.hours - a.hours; });
            var totalH = rows.reduce(function(s,r){ return s+(parseFloat(r.worktime)||0); }, 0);
            var totalQ = rows.reduce(function(s,r){ return s+(parseInt(r.qty,10)||0); }, 0);

            if (summEl) {
                summEl.innerHTML =
                    '<span style="margin-right:20px;"><b>' + rows.length + '</b> 件</span>' +
                    '<span style="margin-right:20px;">合計工数: <b style="color:#3b82f6;">' + totalH.toFixed(2) + '</b> h</span>' +
                    '<span>合計加工数: <b>' + totalQ + '</b></span>';
            }

            if (sorted.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:16px;">データなし</td></tr>';
                return;
            }

            // 名前マップ
            var nameMap = {};
            if (groupBy === 'staffcode') {
                _staffcodes.forEach(function(s){ nameMap[s.staffcode] = s.staffname || ''; });
            }

            tbody.innerHTML = sorted.map(function(row) {
                var name = nameMap[row.key] || '';
                var days = Object.keys(row.days).length;
                var avg  = days > 0 ? (row.hours / days).toFixed(2) : '-';
                return '<tr>' +
                    '<td style="padding:6px 10px;">' + row.key + '</td>' +
                    '<td style="padding:6px 10px;">' + name + '</td>' +
                    '<td style="padding:6px 10px;text-align:right;"><b>' + row.hours.toFixed(2) + '</b></td>' +
                    '<td style="padding:6px 10px;text-align:right;">' + avg + '</td>' +
                    '<td style="padding:6px 10px;text-align:right;">' + (row.qty || '-') + '</td>' +
                    '</tr>';
            }).join('');
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ef4444;">' + e.message + '</td></tr>';
        }
    }
    window.wteDashLoad = loadDashboard;

    // ── HTML生成 ──────────────────────────────────────
    function buildHTML() {
        var tabStyle = 'padding:8px 20px;border:none;border-radius:8px 8px 0 0;cursor:pointer;font-size:14px;font-weight:600;background:#e2e8f0;color:#64748b;';
        var tabActiveStyle = 'background:#3b82f6;color:#fff;';

        return [
            '<div class="page-title" style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">',
            '  <button class="btn-secondary" onclick="showPage(\'search\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>',
            '  <h2 style="margin:0;">工数入力・実績ダッシュボード</h2>',
            '</div>',

            // タブ
            '<div style="display:flex;gap:4px;margin-bottom:0;">',
            '  <button id="wte-tab-input" onclick="wteShowTab(0)" style="' + tabStyle + tabActiveStyle + '"><i class="fas fa-pencil-alt"></i> 工数入力</button>',
            '  <button id="wte-tab-dash"  onclick="wteShowTab(1)" style="' + tabStyle + '"><i class="fas fa-chart-bar"></i> 工数実績ダッシュボード</button>',
            '</div>',

            // ── 入力タブ ──
            '<div id="wte-input-tab" style="background:#fff;border-radius:0 12px 12px 12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:24px;margin-bottom:24px;">',

            '  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;">',

            '    <div><label class="form-label">作業日 <span style="color:#ef4444">*</span></label>',
            '      <input id="wte-date" type="date" class="form-input" style="width:100%;box-sizing:border-box;" value="' + todayStr() + '" onchange="loadTodayWorktimes()">',
            '    </div>',

            '    <div><label class="form-label">社員コード <span style="color:#ef4444">*</span></label>',
            '      <select id="wte-staff" class="form-input" style="width:100%;box-sizing:border-box;" onchange="loadTodayWorktimes()">',
            '        <option value="">（読込中）</option>',
            '      </select>',
            '    </div>',

            '    <div><label class="form-label">工事番号 <span style="color:#ef4444">*</span></label>',
            '      <input id="wte-constructno" type="text" class="form-input" style="width:100%;box-sizing:border-box;" list="wte-constructno-list" placeholder="例: 1001" oninput="window._wteDebounce(this.value)">',
            '      <datalist id="wte-constructno-list"></datalist>',
            '    </div>',

            '    <div><label class="form-label">図面番号</label>',
            '      <select id="wte-drawingno" class="form-input" style="width:100%;box-sizing:border-box;" onchange="window._wteOnDrawingSelect(this.value)">',
            '        <option value="">（工事番号を入力）</option>',
            '      </select>',
            '      <input id="wte-drawingno-text" type="text" class="form-input" style="width:100%;box-sizing:border-box;margin-top:6px;display:none;" placeholder="図面番号を直接入力">',
            '    </div>',

            '    <div><label class="form-label">作業コード</label>',
            '      <select id="wte-workcode" class="form-input" style="width:100%;box-sizing:border-box;">',
            '        <option value="">（読込中）</option>',
            '      </select>',
            '    </div>',

            '    <div><label class="form-label">機械記号</label>',
            '      <select id="wte-machine" class="form-input" style="width:100%;box-sizing:border-box;">',
            '        <option value="">（読込中）</option>',
            '      </select>',
            '    </div>',

            '    <div><label class="form-label">時間 <span style="color:#ef4444">*</span> <small style="color:#6b7280;">（0.25単位）</small></label>',
            '      <input id="wte-hours" type="number" class="form-input" style="width:100%;box-sizing:border-box;" step="0.25" min="0.25" max="24" placeholder="例: 2.5">',
            '    </div>',

            '    <div><label class="form-label">加工数</label>',
            '      <input id="wte-qty" type="number" class="form-input" style="width:100%;box-sizing:border-box;" step="1" min="0" placeholder="任意">',
            '    </div>',

            '  </div>',
            '  <div style="margin-top:16px;display:flex;align-items:center;gap:12px;">',
            '    <button id="wte-submit-btn" class="btn-primary" onclick="submitWorktime()" style="display:flex;align-items:center;gap:6px;">',
            '      <i class="fas fa-save"></i> 登録',
            '      <span id="wte-loading" style="display:none;margin-left:6px;"><i class="fas fa-spinner fa-spin"></i></span>',
            '    </button>',
            '    <span id="wte-message" style="display:none;font-weight:500;"></span>',
            '  </div>',

            '  <div style="margin-top:24px;">',
            '    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">',
            '      <h3 style="margin:0;font-size:15px;">当日入力済み一覧</h3>',
            '      <div style="display:flex;align-items:center;gap:12px;">',
            '        <span id="wte-total-hours" style="font-weight:600;color:#22c55e;"></span>',
            '        <button class="btn-secondary" onclick="loadTodayWorktimes()" style="font-size:13px;padding:6px 12px;"><i class="fas fa-sync-alt"></i> 更新</button>',
            '      </div>',
            '    </div>',
            '    <div style="overflow-x:auto;">',
            '      <table class="data-table" style="width:100%;font-size:13px;">',
            '        <thead><tr>',
            '          <th>工事番号</th><th>図番</th><th>作業CD</th><th>社員CD</th>',
            '          <th style="text-align:right;">時間</th><th>加工数</th><th style="text-align:center;">操作</th>',
            '        </tr></thead>',
            '        <tbody id="wte-list-body">',
            '          <tr><td colspan="7" style="text-align:center;color:#6b7280;padding:12px;">社員コードを選択してください</td></tr>',
            '        </tbody>',
            '      </table>',
            '    </div>',
            '  </div>',
            '</div>',  // end wte-input-tab

            // ── ダッシュボードタブ ──
            '<div id="wte-dash-tab" style="display:none;background:#fff;border-radius:0 12px 12px 12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:24px;">',

            '  <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:16px;">',
            '    <div><label class="form-label" style="font-size:12px;">開始日</label>',
            '      <input id="wte-dash-from" type="date" class="form-input" style="width:140px;" value="' + thisMonthFrom() + '"></div>',
            '    <div><label class="form-label" style="font-size:12px;">終了日</label>',
            '      <input id="wte-dash-to" type="date" class="form-input" style="width:140px;" value="' + todayStr() + '"></div>',
            '    <div><label class="form-label" style="font-size:12px;">社員</label>',
            '      <select id="wte-dash-staff" class="form-input" style="width:180px;"><option value="">（全員）</option></select></div>',
            '    <div><label class="form-label" style="font-size:12px;">工事番号</label>',
            '      <input id="wte-dash-constructno" type="text" class="form-input" style="width:120px;" placeholder="絞り込み"></div>',
            '    <div><label class="form-label" style="font-size:12px;">集計軸</label>',
            '      <select id="wte-dash-group" class="form-input" style="width:150px;">',
            '        <option value="staffcode">社員別</option>',
            '        <option value="constructionno">工事番号別</option>',
            '      </select></div>',
            '    <button class="btn-primary" onclick="wteDashLoad()" style="padding:8px 18px;"><i class="fas fa-search"></i> 集計</button>',
            '  </div>',

            '  <div id="wte-dash-summary" style="margin-bottom:12px;font-size:14px;color:#475569;"></div>',

            '  <div style="overflow-x:auto;">',
            '    <table class="data-table" style="width:100%;font-size:13px;">',
            '      <thead><tr>',
            '        <th>コード</th><th>名前</th><th style="text-align:right;">合計工数(h)</th>',
            '        <th style="text-align:right;">1日平均(h)</th><th style="text-align:right;">合計加工数</th>',
            '      </tr></thead>',
            '      <tbody id="wte-dash-body">',
            '        <tr><td colspan="5" style="text-align:center;color:#6b7280;padding:16px;">「集計」ボタンを押してください</td></tr>',
            '      </tbody>',
            '    </table>',
            '  </div>',
            '</div>'  // end wte-dash-tab
        ].join('\n');
    }

    // ── ページ初期化 ──────────────────────────────────
    function initWorktimeEntryPage() {
        var container = document.getElementById('worktime-entry-content');
        if (!container) return;

        if (!_initialized) {
            container.innerHTML = buildHTML();
            _initialized = true;

            var _timer = null;
            window._wteDebounce = function(val) {
                clearTimeout(_timer);
                _timer = setTimeout(function(){ loadDrawings(val.trim()); }, 400);
            };
            window._wteOnDrawingSelect = function(val) {
                var t = document.getElementById('wte-drawingno-text');
                if (t) t.style.display = val === '__other__' ? 'block' : 'none';
            };
        }

        Promise.all([loadWorkcodes(), loadStaff(), loadProjects(), loadMachines()]).then(function() {
            loadTodayWorktimes();
        });
    }

    window.initWorktimeEntryPage = initWorktimeEntryPage;
})();
