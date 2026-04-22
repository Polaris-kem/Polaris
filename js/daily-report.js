/**
 * 日報入力モジュール（直接作業＋間接作業 統合）
 * ページID: work-ticket-page / コンテナ: work-ticket-page-content
 * 保存先: t_sagyofl
 *   直接作業: zuban あり（図面番号）
 *   間接作業: zuban null、jugyo = CLNG/MEET 等
 */
(function () {
    'use strict';

    var _rows = [];
    var _nextId = 1;
    var _staffcodes = [];
    var _workcodes = [];

    var NONWORK_CODES = [
        { code: 'CLNG',  label: '清掃',         icon: 'fa-broom',          color: '#6366f1' },
        { code: 'SAW',   label: '材料準備',      icon: 'fa-boxes',          color: '#f59e0b' },
        { code: 'MEET',  label: 'ミーティング',  icon: 'fa-comments',       color: '#3b82f6' },
        { code: 'EDU',   label: '指導・教育',    icon: 'fa-graduation-cap', color: '#10b981' },
        { code: 'MAINT', label: '設備保全',      icon: 'fa-tools',          color: '#ef4444' },
        { code: 'QC',    label: '品質管理',      icon: 'fa-clipboard-check',color: '#8b5cf6' },
        { code: 'SHIP',  label: '出荷作業',      icon: 'fa-truck',          color: '#0ea5e9' },
        { code: 'ORDER', label: '受入・検品',    icon: 'fa-box-open',       color: '#f97316' },
        { code: 'ADMIN', label: '事務処理',      icon: 'fa-file-alt',       color: '#64748b' },
        { code: 'OTHER', label: 'その他',        icon: 'fa-ellipsis-h',     color: '#94a3b8' }
    ];

    function getClient() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }
    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    function pad(n) { return String(n).padStart(2, '0'); }

    function getTotal() {
        return _rows.reduce(function (s, r) { return s + (parseFloat(r.stime) || 0); }, 0);
    }

    function updateTotal() {
        var total = getTotal();
        var pct = Math.min(total / 7.75 * 100, 100);
        var color = total > 7.75 ? '#ef4444' : total >= 7.74 ? '#22c55e' : '#6366f1';
        var el = document.getElementById('dr-total');
        var bar = document.getElementById('dr-bar');
        if (el) el.innerHTML =
            '<span style="font-size:17px;font-weight:700;color:' + color + ';">' + total.toFixed(2) + '</span>' +
            '<span style="color:#94a3b8;font-size:13px;"> / 7.75 h</span>';
        if (bar) { bar.style.width = pct + '%'; bar.style.background = color; }
    }

    function showMsg(msg, type) {
        var el = document.getElementById('dr-msg');
        if (!el) return;
        el.textContent = msg;
        el.style.color = { success: '#22c55e', error: '#ef4444', warn: '#f59e0b' }[type] || '#374151';
        el.style.display = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.style.display = 'none'; }, 6000);
    }

    // ── マスタ読込 ─────────────────────────────────────
    async function loadMasters() {
        var client = getClient();
        if (!client) return;
        try {
            var sr = await client.from('t_staffcode').select('staffcode,staffname').order('staffcode');
            _staffcodes = sr.error ? [] : (sr.data || []);
        } catch (e) { _staffcodes = []; }
        try {
            var wr = await client.from('t_workcode').select('workcode,workname').order('workcode');
            _workcodes = wr.error ? [] : (wr.data || []);
        } catch (e) { _workcodes = []; }

        var staffOpts = '<option value="">-- 選択 --</option>' +
            _staffcodes.map(function (s) {
                return '<option value="' + s.staffcode + '">' + s.staffcode + ' ' + (s.staffname || '') + '</option>';
            }).join('');
        var staffEl = document.getElementById('dr-staff');
        if (staffEl) staffEl.innerHTML = staffOpts;

        var dl = document.getElementById('dr-wc-list');
        if (dl) dl.innerHTML = _workcodes.map(function (w) {
            return '<option value="' + w.workcode + '">' + (w.workname || '') + '</option>';
        }).join('');
    }

    // ── 行管理 ────────────────────────────────────────
    function addRow(type) {
        var id = _nextId++;
        _rows.push({ id: id, type: type || 'direct', kojino: '', zuban: '', jugyo: '', kakosu: '', stime: '' });
        renderRows();
        updateTotal();
        setTimeout(function () {
            var rowEl = document.getElementById('dr-row-' + id);
            if (rowEl) { var inp = rowEl.querySelector('input'); if (inp) inp.focus(); }
        }, 60);
    }

    function removeRow(id) {
        _rows = _rows.filter(function (r) { return r.id !== id; });
        renderRows();
        updateTotal();
    }

    function setField(id, field, value) {
        var row = _rows.find(function (r) { return r.id === id; });
        if (row) row[field] = value;
        if (field === 'stime') updateTotal();
    }

    function setJugyo(id, code) {
        var row = _rows.find(function (r) { return r.id === id; });
        if (!row) return;
        row.jugyo = code;
        var rowEl = document.getElementById('dr-row-' + id);
        if (!rowEl) return;
        rowEl.querySelectorAll('.dr-nw-btn').forEach(function (btn) {
            var active = btn.dataset.code === code;
            btn.style.opacity = active ? '1' : '0.45';
            btn.style.boxShadow = active ? '0 0 0 2.5px currentColor' : 'none';
            btn.style.transform = active ? 'scale(1.05)' : 'scale(1)';
        });
        var lbl = rowEl.querySelector('.dr-jugyo-lbl');
        if (lbl) lbl.textContent = '選択中: ' + code;
    }

    // ── 行レンダリング ────────────────────────────────
    function renderRow(row) {
        var direct = row.type === 'direct';
        var id = row.id;
        var badgeColor = direct ? '#6366f1' : '#f59e0b';
        var badgeLabel = direct ? '直接作業' : '間接作業';
        var IS = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;';

        var fields = '';
        if (direct) {
            fields += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 88px 80px;gap:10px;">';

            fields += '<div><label style="font-size:11px;font-weight:600;color:#6b7280;display:block;margin-bottom:4px;">工事番号 <span style="color:#ef4444">*</span></label>' +
                '<input type="text" value="' + row.kojino + '" placeholder="例: 25001" oninput="window._drSet(' + id + ',\'kojino\',this.value)" style="' + IS + '"></div>';

            fields += '<div><label style="font-size:11px;font-weight:600;color:#6b7280;display:block;margin-bottom:4px;">図面番号 <span style="color:#ef4444">*</span></label>' +
                '<input type="text" value="' + row.zuban + '" placeholder="例: A-001" oninput="window._drSet(' + id + ',\'zuban\',this.value)" style="' + IS + '"></div>';

            fields += '<div><label style="font-size:11px;font-weight:600;color:#6b7280;display:block;margin-bottom:4px;">作業コード</label>' +
                '<input type="text" value="' + row.jugyo + '" placeholder="例: MACH" list="dr-wc-list" oninput="window._drSet(' + id + ',\'jugyo\',this.value)" style="' + IS + '"></div>';

            fields += '<div><label style="font-size:11px;font-weight:600;color:#6b7280;display:block;margin-bottom:4px;">加工数</label>' +
                '<input type="number" value="' + row.kakosu + '" min="0" placeholder="個" oninput="window._drSet(' + id + ',\'kakosu\',this.value)" style="' + IS + '"></div>';

            fields += '<div><label style="font-size:11px;font-weight:600;color:#6b7280;display:block;margin-bottom:4px;">時間 <span style="color:#ef4444">*</span></label>' +
                '<input type="number" value="' + row.stime + '" step="0.25" min="0.25" max="7.75" placeholder="h" oninput="window._drSet(' + id + ',\'stime\',this.value)" style="' + IS + '"></div>';

            fields += '</div>';
        } else {
            // 間接作業: 非稼働コードボタン + 時間
            fields += '<div style="margin-bottom:10px;"><label style="font-size:11px;font-weight:600;color:#6b7280;display:block;margin-bottom:8px;">作業種別 <span style="color:#ef4444">*</span></label>';
            fields += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
            NONWORK_CODES.forEach(function (c) {
                var active = row.jugyo === c.code;
                fields += '<button class="dr-nw-btn" data-code="' + c.code + '" onclick="window._drJugyo(' + id + ',\'' + c.code + '\')"' +
                    ' style="display:flex;align-items:center;gap:5px;padding:5px 11px;border:1.5px solid ' + c.color + ';border-radius:8px;' +
                    'cursor:pointer;font-size:12px;font-weight:600;background:#fff;color:' + c.color + ';' +
                    'opacity:' + (active ? '1' : '0.45') + ';' +
                    'box-shadow:' + (active ? '0 0 0 2.5px ' + c.color : 'none') + ';' +
                    'transform:' + (active ? 'scale(1.05)' : 'scale(1)') + ';transition:all .15s;">' +
                    '<i class="fas ' + c.icon + '"></i>' + c.label + '</button>';
            });
            fields += '</div></div>';

            fields += '<div style="display:grid;grid-template-columns:100px 1fr;gap:12px;align-items:center;">';
            fields += '<div><label style="font-size:11px;font-weight:600;color:#6b7280;display:block;margin-bottom:4px;">時間 <span style="color:#ef4444">*</span></label>' +
                '<input type="number" value="' + row.stime + '" step="0.25" min="0.25" max="7.75" placeholder="h" oninput="window._drSet(' + id + ',\'stime\',this.value)"' +
                ' style="' + IS + '"></div>';
            fields += '<div class="dr-jugyo-lbl" style="font-size:12px;color:#6b7280;margin-top:18px;">' +
                (row.jugyo ? '選択中: ' + row.jugyo : 'コードを選択してください') + '</div>';
            fields += '</div>';
        }

        return '<div id="dr-row-' + id + '" style="background:#fff;border-radius:12px;border:1.5px solid #e2e8f0;padding:16px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
            '<span style="background:' + badgeColor + '20;color:' + badgeColor + ';padding:3px 11px;border-radius:99px;font-size:11px;font-weight:700;">' +
            (direct ? '<i class="fas fa-drafting-compass" style="margin-right:4px;"></i>' : '<i class="fas fa-broom" style="margin-right:4px;"></i>') +
            badgeLabel + '</span>' +
            '<button onclick="window._drRemove(' + id + ')" title="削除" style="background:#fee2e2;color:#ef4444;border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px;line-height:1;">' +
            '<i class="fas fa-times"></i></button>' +
            '</div>' + fields + '</div>';
    }

    function renderRows() {
        var container = document.getElementById('dr-rows');
        if (!container) return;
        if (_rows.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:32px;color:#94a3b8;font-size:14px;">' +
                '<i class="fas fa-plus-circle" style="font-size:28px;display:block;margin-bottom:10px;"></i>' +
                '下のボタンで作業行を追加してください</div>';
            return;
        }
        container.innerHTML = _rows.map(renderRow).join('');
    }

    // ── 保存 ─────────────────────────────────────────
    async function save() {
        var client = getClient();
        if (!client) { showMsg('Supabase未接続', 'error'); return; }

        var staff = (document.getElementById('dr-staff') || {}).value || '';
        var date  = (document.getElementById('dr-date')  || {}).value || '';

        if (!staff) { showMsg('社員コードを選択してください', 'error'); return; }
        if (!date)  { showMsg('作業日を選択してください', 'error'); return; }
        if (_rows.length === 0) { showMsg('作業行がありません', 'error'); return; }

        for (var i = 0; i < _rows.length; i++) {
            var row = _rows[i];
            var h = parseFloat(row.stime);
            if (!row.stime || isNaN(h) || h <= 0) {
                showMsg((i + 1) + '行目: 時間を入力してください', 'error'); return;
            }
            if (Math.abs(Math.round(h / 0.25) * 0.25 - h) > 0.001) {
                showMsg((i + 1) + '行目: 0.25h（15分）単位で入力してください', 'error'); return;
            }
            if (row.type === 'direct') {
                if (!row.kojino) { showMsg((i + 1) + '行目: 工事番号を入力してください', 'error'); return; }
                if (!row.zuban)  { showMsg((i + 1) + '行目: 図面番号を入力してください', 'error'); return; }
            } else {
                if (!row.jugyo) { showMsg((i + 1) + '行目: 作業種別を選択してください', 'error'); return; }
            }
        }

        var total = getTotal();
        if (Math.abs(total - 7.75) > 0.001) {
            if (!confirm('合計 ' + total.toFixed(2) + 'h です（定時 7.75h）。このまま登録しますか？')) return;
        }

        var btn = document.getElementById('dr-save-btn');
        if (btn) btn.disabled = true;
        try {
            var now = new Date().toISOString();
            var records = _rows.map(function (row) {
                if (row.type === 'direct') {
                    return {
                        sdate: date, scode: staff,
                        kojino: row.kojino,
                        zuban: row.zuban,
                        jugyo: row.jugyo || null,
                        kakosu: row.kakosu !== '' ? parseFloat(row.kakosu) : null,
                        stime: parseFloat(row.stime),
                        input: staff, upddate: now, chkflg: null
                    };
                } else {
                    return {
                        sdate: date, scode: staff,
                        kojino: null,
                        zuban: null,
                        jugyo: row.jugyo,
                        kakosu: null,
                        stime: parseFloat(row.stime),
                        input: staff, upddate: now, chkflg: null
                    };
                }
            });

            var res = await client.from('t_sagyofl').insert(records);
            if (res.error) throw res.error;

            showMsg(_rows.length + '件を登録しました ✅', 'success');
            _rows = [];
            _nextId = 1;
            renderRows();
            updateTotal();
            addRow('direct');
        } catch (e) {
            showMsg('登録失敗: ' + e.message, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ── HTML生成 ──────────────────────────────────────
    function buildHTML() {
        var today = todayStr();
        var html = '';

        // ヘッダー
        html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap;">';
        html += '<button class="btn-secondary" onclick="showPage(\'register\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>';
        html += '<h2 style="margin:0;font-size:20px;font-weight:700;"><i class="fas fa-clipboard-list" style="color:#6366f1;margin-right:8px;"></i>日報入力（作業票）</h2>';
        html += '<span style="font-size:12px;color:#6b7280;">直接作業（図面あり）と間接作業（図面なし）を1画面で入力できます</span>';
        html += '</div>';

        // 作業者・日付・合計
        html += '<div style="background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px 20px;margin-bottom:16px;">';
        html += '<div style="display:grid;grid-template-columns:170px 260px 1fr;gap:16px;align-items:end;">';

        html += '<div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">作業日 <span style="color:#ef4444">*</span></label>' +
            '<input id="dr-date" type="date" value="' + today + '" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;"></div>';

        html += '<div><label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:5px;">作業者 <span style="color:#ef4444">*</span></label>' +
            '<select id="dr-staff" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;background:#fff;"><option value="">（読込中）</option></select></div>';

        // 合計バー
        html += '<div>';
        html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">';
        html += '<span style="font-size:12px;font-weight:600;color:#6b7280;">工数合計</span>';
        html += '<div id="dr-total" style="font-size:17px;font-weight:700;color:#6366f1;">0.00 <span style="color:#94a3b8;font-size:13px;font-weight:400;">/ 7.75 h</span></div>';
        html += '</div>';
        html += '<div style="height:10px;background:#f1f5f9;border-radius:99px;overflow:hidden;">';
        html += '<div id="dr-bar" style="height:100%;width:0%;background:#6366f1;border-radius:99px;transition:width .3s,background .3s;"></div>';
        html += '</div></div>';

        html += '</div></div>';

        // 行エリア
        html += '<div id="dr-rows" style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;"></div>';

        // 行追加ボタン
        html += '<div style="display:flex;gap:10px;margin-bottom:20px;">';
        html += '<button onclick="window._drAdd(\'direct\')" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:#6366f115;color:#6366f1;border:2px dashed #6366f1;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;">' +
            '<i class="fas fa-plus"></i><i class="fas fa-drafting-compass"></i> 直接作業を追加</button>';
        html += '<button onclick="window._drAdd(\'indirect\')" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:#f59e0b15;color:#f59e0b;border:2px dashed #f59e0b;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;">' +
            '<i class="fas fa-plus"></i><i class="fas fa-broom"></i> 間接作業を追加</button>';
        html += '</div>';

        // 登録ボタン
        html += '<div style="display:flex;align-items:center;gap:16px;">';
        html += '<button id="dr-save-btn" onclick="window._drSave()" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:10px;padding:13px 36px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(99,102,241,.35);">' +
            '<i class="fas fa-save"></i> 日報を登録する</button>';
        html += '<span id="dr-msg" style="display:none;font-size:13px;font-weight:600;"></span>';
        html += '</div>';

        // 作業コードサジェスト
        html += '<datalist id="dr-wc-list"></datalist>';

        return html;
    }

    // ── 初期化 ────────────────────────────────────────
    function initDailyReportPage() {
        var container = document.getElementById('work-ticket-page-content');
        if (!container) { console.error('work-ticket-page-content が見つかりません'); return; }

        _rows = [];
        _nextId = 1;
        container.innerHTML = buildHTML();

        window._drAdd    = addRow;
        window._drRemove = removeRow;
        window._drSet    = setField;
        window._drJugyo  = setJugyo;
        window._drSave   = save;

        loadMasters().then(function () {
            addRow('direct');
        });
    }

    window.initDailyReportPage = initDailyReportPage;

})();
