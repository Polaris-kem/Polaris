/**
 * 工数入力モジュール  (t_sagyofl 対応版)
 * ページID: worktime-entry-page
 *
 * t_sagyofl 実カラム:
 *   kojino=工事番号, zuban=図番, hinban=品番, jugyo=作業コード,
 *   scode=社員コード, kakosu=加工数, stime=時間, sdate=作業日,
 *   input=入力者, upddate=更新日, chkflg=チェックフラグ
 */
(function () {
    'use strict';

    var _projects  = [];   // t_acceptorder
    var _drawings  = [];   // t_manufctparts
    var _workcodes = [];   // t_workcode
    var _staffcodes = [];  // t_staffcode
    var _initialized = false;

    // ── ユーティリティ ──────────────────────────────
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

    // ── マスタ読込 ──────────────────────────────────
    async function loadWorkcodes() {
        var sb = getSupabase(); if (!sb) return;
        try {
            var r = await sb.from('t_workcode').select('workcode, workname').order('workcode');
            _workcodes = r.error ? [] : (r.data || []);
        } catch(e) { _workcodes = []; }
        var sel = document.getElementById('wte-workcode');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- 選択してください --</option>';
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
            var r = await sb.from('t_staffcode').select('staffcode, staffname').order('staffcode');
            _staffcodes = r.error ? [] : (r.data || []);
        } catch(e) { _staffcodes = []; }
        var sel = document.getElementById('wte-staff');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- 選択してください --</option>';
        _staffcodes.forEach(function(r) {
            var o = document.createElement('option');
            o.value = r.staffcode;
            o.textContent = r.staffcode + ' - ' + (r.staffname || '');
            sel.appendChild(o);
        });
    }

    async function loadProjects() {
        var sb = getSupabase(); if (!sb) return;
        try {
            var r = await sb.from('t_acceptorder')
                .select('constructno, registerdate, constructname')
                .order('constructno', { ascending: false })
                .limit(500);
            _projects = r.error ? [] : (r.data || []);
        } catch(e) { _projects = []; }
        var dl = document.getElementById('wte-constructno-list');
        if (!dl) return;
        dl.innerHTML = '';
        _projects.forEach(function(r) {
            var o = document.createElement('option');
            o.value = r.constructno;
            o.label = r.constructname || '';
            dl.appendChild(o);
        });
    }

    async function loadDrawings(constructno) {
        var sb = getSupabase();
        var sel = document.getElementById('wte-drawingno');
        if (!sel) return;
        _drawings = [];
        if (!constructno || !sb) {
            sel.innerHTML = '<option value="">（工事番号を入力してください）</option>';
            return;
        }
        sel.innerHTML = '<option value="">（読込中...）</option>';
        try {
            // t_manufctparts は constructionno (末尾にno)
            var r = await sb.from('t_manufctparts')
                .select('drawingno, description')
                .eq('constructionno', constructno)
                .order('drawingno').limit(300);
            _drawings = r.error ? [] : (r.data || []);
        } catch(e) { _drawings = []; }
        sel.innerHTML = '<option value="">-- 選択してください --</option>';
        _drawings.forEach(function(r) {
            var o = document.createElement('option');
            o.value = r.drawingno;
            o.textContent = r.drawingno + (r.description ? ' - ' + r.description : '');
            sel.appendChild(o);
        });
        var oth = document.createElement('option');
        oth.value = '__other__'; oth.textContent = '（直接入力）';
        sel.appendChild(oth);
    }

    // ── 当日実績の表示 ────────────────────────────────
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
            // t_sagyofl の実カラムで検索
            var q = sb.from('t_sagyofl').select('*').eq('sdate', workDate).order('upddate', { ascending: false });
            if (staffcode) q = q.eq('scode', staffcode);
            var res = await q;
            if (res.error) throw res.error;
            var rows = res.data || [];

            var total = rows.reduce(function(acc, r) { return acc + (parseFloat(r.stime) || 0); }, 0);
            var totalEl = document.getElementById('wte-total-hours');
            if (totalEl) {
                var limit = (window.ERPConstants || {}).WORK_HOURS_PER_DAY || 7.75;
                totalEl.textContent = '合計: ' + total.toFixed(2) + ' 時間';
                totalEl.style.color = total > limit ? '#ef4444' : '#22c55e';
            }

            if (rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;padding:12px;">データなし</td></tr>';
                return;
            }
            tbody.innerHTML = rows.map(function(r) {
                // 削除キー: kojino+zuban+scode+sdate+stime の組み合わせ
                var delKey = encodeURIComponent(JSON.stringify({ kojino: r.kojino, zuban: r.zuban, scode: r.scode, sdate: r.sdate, stime: r.stime }));
                return '<tr>' +
                    '<td style="padding:6px 8px;">' + (r.kojino || '-') + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.zuban || '-') + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.jugyo || '-') + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.scode || '-') + '</td>' +
                    '<td style="padding:6px 8px;text-align:right;">' + (r.stime || 0) + '</td>' +
                    '<td style="padding:6px 8px;">' + (r.kakosu != null ? r.kakosu : '-') + '</td>' +
                    '<td style="padding:6px 8px;text-align:center;">' +
                    '<button onclick="deleteWorktime(\'' + delKey + '\')" style="background:#ef4444;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:12px;">削除</button>' +
                    '</td></tr>';
            }).join('');
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444;">' + e.message + '</td></tr>';
        }
    }

    // ── 登録処理 ──────────────────────────────────────
    async function submitWorktime() {
        var sb = getSupabase();
        if (!sb) { showMsg('Supabase 未接続です', 'error'); return; }

        var workDate   = (document.getElementById('wte-date')         || {}).value || '';
        var constructno= ((document.getElementById('wte-constructno')  || {}).value || '').trim();
        var drawingSel = (document.getElementById('wte-drawingno')     || {}).value || '';
        var drawingTxt = ((document.getElementById('wte-drawingno-text')|| {}).value || '').trim();
        var workcode   = (document.getElementById('wte-workcode')      || {}).value || '';
        var staffcode  = (document.getElementById('wte-staff')         || {}).value || '';
        var hoursRaw   = parseFloat((document.getElementById('wte-hours') || {}).value);
        var qty        = (document.getElementById('wte-qty')           || {}).value;

        var drawingno = (drawingSel === '__other__' || drawingSel === '') ? drawingTxt : drawingSel;

        if (!workDate)   { showMsg('作業日を入力してください', 'error'); return; }
        if (!constructno){ showMsg('工事番号を入力してください', 'error'); return; }
        if (!staffcode)  { showMsg('社員コードを選択してください', 'error'); return; }
        if (isNaN(hoursRaw)){ showMsg('時間を入力してください', 'error'); return; }

        var ERPConst  = window.ERPConstants || {};
        var roundFn   = ERPConst.roundToWorkUnit || function(h){ return Math.round(h/0.25)*0.25; };
        var validateFn= ERPConst.validateWorkTimeHours || function(h){
            if (h <= 0) return { valid: false, message: '0より大きい値を入力してください' };
            if (Math.round(h/0.25)*0.25 !== h) return { valid: false, message: '0.25時間（15分）単位で入力してください' };
            return { valid: true };
        };

        var hours = roundFn(hoursRaw);
        var vr = validateFn(hours);
        if (!vr.valid) { showMsg(vr.message, 'error'); return; }

        // 1日合計チェック
        try {
            var sumRes = await sb.from('t_sagyofl').select('stime').eq('sdate', workDate).eq('scode', staffcode);
            if (!sumRes.error) {
                var cur = (sumRes.data || []).reduce(function(a,r){ return a+(parseFloat(r.stime)||0); }, 0);
                var lim = ERPConst.WORK_HOURS_PER_DAY || 7.75;
                if (cur + hours > lim) {
                    showMsg('⚠ 1日合計が ' + lim + ' 時間を超えます（現在: ' + cur.toFixed(2) + ' h + 今回: ' + hours + ' h）', 'warn');
                }
            }
        } catch(_e) {}

        setLoading(true);
        try {
            var payload = {
                sdate  : workDate,
                kojino : constructno,
                zuban  : drawingno || null,
                jugyo  : workcode  || null,
                scode  : staffcode,
                stime  : hours,
                kakosu : qty !== '' ? parseFloat(qty) : null,
                input  : staffcode,
                upddate: new Date().toISOString()
            };

            var res = await sb.from('t_sagyofl').insert([payload]);
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

    // ── 削除処理 ──────────────────────────────────────
    async function deleteWorktime(encodedKey) {
        if (!confirm('この工数データを削除しますか？')) return;
        var sb = getSupabase();
        if (!sb) { showMsg('Supabase 未接続です', 'error'); return; }
        try {
            var key = JSON.parse(decodeURIComponent(encodedKey));
            var q = sb.from('t_sagyofl').delete()
                .eq('kojino', key.kojino)
                .eq('sdate',  key.sdate)
                .eq('scode',  key.scode)
                .eq('stime',  key.stime);
            if (key.zuban) q = q.eq('zuban', key.zuban);
            var res = await q;
            if (res.error) throw res.error;
            showMsg('削除しました', 'success');
            await loadTodayWorktimes();
        } catch(e) {
            showMsg('削除失敗: ' + e.message, 'error');
        }
    }

    // ── HTML生成 ──────────────────────────────────────
    function buildHTML() {
        return [
            '<div class="page-title" style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">',
            '  <button class="btn-secondary" onclick="showPage(\'search\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>',
            '  <h2 style="margin:0;">工数入力</h2>',
            '</div>',

            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:24px;margin-bottom:24px;">',
            '  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">',

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
            '</div>',

            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:24px;">',
            '  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">',
            '    <h3 style="margin:0;font-size:16px;">当日入力済み一覧</h3>',
            '    <div style="display:flex;align-items:center;gap:12px;">',
            '      <span id="wte-total-hours" style="font-weight:600;color:#22c55e;"></span>',
            '      <button class="btn-secondary" onclick="loadTodayWorktimes()" style="font-size:13px;padding:6px 12px;"><i class="fas fa-sync-alt"></i> 更新</button>',
            '    </div>',
            '  </div>',
            '  <div style="overflow-x:auto;">',
            '    <table class="data-table" style="width:100%;font-size:13px;">',
            '      <thead><tr>',
            '        <th>工事番号</th><th>図番</th><th>作業CD</th><th>社員CD</th>',
            '        <th style="text-align:right;">時間</th><th>加工数</th><th style="text-align:center;">操作</th>',
            '      </tr></thead>',
            '      <tbody id="wte-list-body">',
            '        <tr><td colspan="7" style="text-align:center;color:#6b7280;padding:12px;">社員コードを選択してください</td></tr>',
            '      </tbody>',
            '    </table>',
            '  </div>',
            '</div>'
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
            window.submitWorktime    = submitWorktime;
            window.deleteWorktime    = deleteWorktime;
            window.loadTodayWorktimes = loadTodayWorktimes;
        }

        Promise.all([loadWorkcodes(), loadStaff(), loadProjects()]).then(function() {
            loadTodayWorktimes();
        });
    }

    window.initWorktimeEntryPage = initWorktimeEntryPage;

})();
