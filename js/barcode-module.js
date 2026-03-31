/**
 * バーコードリーダー版 作業票登録モジュール
 * ページID: barcode-work-ticket-page
 * コンテナ: barcode-work-ticket-content
 */
(function () {
    'use strict';

    var _rowId = 0;

    function getSB() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-'
            + String(d.getMonth() + 1).padStart(2, '0') + '-'
            + String(d.getDate()).padStart(2, '0');
    }

    // ── 初期化 ────────────────────────────────────────────────
    window.initBarcodeWorkTicketPage = async function () {
        _rowId = 0;
        var container = document.getElementById('barcode-work-ticket-content');
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:60px;color:#64748b;"><i class="fas fa-spinner fa-spin fa-2x"></i><div style="margin-top:12px;font-size:14px;">読み込み中...</div></div>';

        var workers   = await _loadWorkers();
        var worktypes = await _loadWorkTypes();

        container.innerHTML = _buildHTML(workers, worktypes);

        var dateEl = document.getElementById('bc-date');
        if (dateEl) dateEl.value = todayStr();

        _focusScan();
    };

    // ── マスタ取得 ────────────────────────────────────────────
    async function _loadWorkers() {
        try {
            var sb = getSB();
            if (!sb) return [];
            var { data } = await sb.from('t_staffcode')
                .select('staffcode, staffname, depacode')
                .order('staffcode');
            return data || [];
        } catch (e) { console.warn('[BC] 社員取得失敗:', e); return []; }
    }

    async function _loadWorkTypes() {
        try {
            var sb = getSB();
            if (!sb) return [];
            // t_worktimecode → t_workcode の順で試みる
            var tables = ['t_worktimecode', 'T_WorkTimeCode', 't_workcode', 'T_WorkCode'];
            for (var i = 0; i < tables.length; i++) {
                try {
                    var r = await sb.from(tables[i]).select('WorkCode,WorkName').order('WorkCode').limit(300);
                    if (!r.error && r.data && r.data.length > 0) return r.data;
                } catch (_) { /* 次を試す */ }
            }
            return [];
        } catch (e) { console.warn('[BC] 作業コード取得失敗:', e); return []; }
    }

    // ── バーコードスキャン処理 ────────────────────────────────
    window.processBarcodeInput = async function () {
        var input = document.getElementById('bc-scan-input');
        if (!input) return;
        var raw = input.value.trim();
        if (!raw) return;
        input.value = '';

        _setStatus('info', 'スキャン中: ' + raw);

        try {
            var sb = getSB();
            if (!sb) throw new Error('DB未接続');

            var parts = null;

            // 1. paperid で検索（前方一致・末尾スペース対応）
            var r1 = await sb.from('t_manufctparts')
                .select('constructionno,symbolmachine,symbolunit,consecutiveno,drawingno,partno,description,qty,materialcode,paperid')
                .ilike('paperid', raw + '%')
                .limit(5);
            if (r1.data && r1.data.length > 0) {
                parts = r1.data;
            }

            // 2. drawingno で検索（部分一致）
            if (!parts) {
                var r2 = await sb.from('t_manufctparts')
                    .select('constructionno,symbolmachine,symbolunit,consecutiveno,drawingno,partno,description,qty,materialcode,paperid')
                    .ilike('drawingno', '%' + raw + '%')
                    .limit(5);
                if (r2.data && r2.data.length > 0) parts = r2.data;
            }

            // 3. 工事番号で検索（前4桁が数字なら）
            if (!parts && /^\d{4}/.test(raw)) {
                var r3 = await sb.from('t_manufctparts')
                    .select('constructionno,symbolmachine,symbolunit,consecutiveno,drawingno,partno,description,qty,materialcode,paperid')
                    .ilike('constructionno', raw.slice(0, 4) + '%')
                    .limit(20);
                if (r3.data && r3.data.length > 0) parts = r3.data;
            }

            if (!parts || parts.length === 0) {
                _setStatus('error', '部品が見つかりません: ' + raw);
                _focusScan();
                return;
            }

            // 重複チェック（同じpaperID / drawingno+partnoが既にリストにあれば警告）
            parts.forEach(function (p) {
                var key = _partKey(p);
                var dup = document.querySelector('[data-bc-key="' + key + '"]');
                if (dup) {
                    _setStatus('warn', '既にリストにあります: ' + key);
                    dup.style.background = '#fef9c3';
                    setTimeout(function () { dup.style.background = ''; }, 1500);
                } else {
                    _addRow(p, raw);
                }
            });

            _setStatus('ok', parts.length + '件追加: ' + raw);
        } catch (e) {
            _setStatus('error', 'エラー: ' + e.message);
        }
        _focusScan();
    };

    function _partKey(p) {
        return ((p.drawingno || '').trim() + '_' + (p.partno || '').trim()).replace(/\s/g, '');
    }

    // ── 行追加 ────────────────────────────────────────────────
    function _addRow(part, scannedCode) {
        // 空メッセージ行を削除
        var empty = document.getElementById('bc-empty-row');
        if (empty) empty.remove();

        _rowId++;
        var id    = _rowId;
        var constr = (part.constructionno || '').trim();
        var drawno = (part.drawingno    || '').trim();
        var partno = (part.partno       || '').trim();
        var desc   = (part.description  || '').trim();
        var mat    = (part.materialcode || '').trim();
        var key    = _partKey(part);

        var tbody = document.getElementById('bc-items-tbody');
        if (!tbody) return;

        var tr = document.createElement('tr');
        tr.id = 'bc-row-' + id;
        tr.setAttribute('data-bc-key', key);
        tr.style.borderBottom = '1px solid #f3f4f6';
        tr.innerHTML =
            '<td style="text-align:center;padding:6px;">' +
                '<button onclick="bcRemoveRow(' + id + ')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:15px;padding:3px;" title="削除"><i class="fas fa-times"></i></button>' +
            '</td>' +
            '<td style="padding:6px 8px;font-size:13px;">' + constr + '</td>' +
            '<td style="padding:6px 8px;font-size:13px;font-family:monospace;">' + drawno + '</td>' +
            '<td style="padding:6px 8px;text-align:center;font-size:13px;">' + partno + '</td>' +
            '<td style="padding:6px 8px;font-size:13px;">' + desc + '</td>' +
            '<td style="padding:6px 8px;font-size:12px;color:#64748b;">' + mat + '</td>' +
            '<td style="padding:4px 6px;text-align:center;">' +
                '<input type="number" class="bc-time-input" value="1" min="0" step="0.25"' +
                ' style="width:72px;padding:5px 6px;border:1.5px solid #d1d5db;border-radius:6px;text-align:right;font-size:13px;font-family:monospace;"' +
                ' oninput="bcUpdateTotal()" onkeydown="if(event.key===\'Enter\'){event.preventDefault();document.getElementById(\'bc-scan-input\').focus();}">' +
            '</td>' +
            '<td style="padding:6px 8px;font-size:11px;color:#9ca3af;">' + (scannedCode || '') + '</td>';

        tbody.appendChild(tr);
        bcUpdateTotal();
    }

    // ── 行削除 ────────────────────────────────────────────────
    window.bcRemoveRow = function (id) {
        var row = document.getElementById('bc-row-' + id);
        if (row) row.remove();
        // 全行消えたら空メッセージを戻す
        var tbody = document.getElementById('bc-items-tbody');
        if (tbody && tbody.querySelectorAll('tr').length === 0) {
            tbody.innerHTML = _emptyRow();
        }
        bcUpdateTotal();
        _focusScan();
    };

    // ── 合計更新 ──────────────────────────────────────────────
    window.bcUpdateTotal = function () {
        var total = 0;
        document.querySelectorAll('.bc-time-input').forEach(function (inp) {
            total += parseFloat(inp.value || 0) || 0;
        });
        total = Math.round(total * 100) / 100;

        var el = document.getElementById('bc-total-hours');
        if (el) {
            el.textContent = total.toFixed(2) + 'h';
            el.style.color = Math.abs(total - 7.75) < 0.01 ? '#16a34a'
                : (total > 7.75 ? '#dc2626' : '#1d4ed8');
        }

        var count = document.querySelectorAll('#bc-items-tbody tr:not(#bc-empty-row)').length;
        var btn   = document.getElementById('bc-save-btn');
        if (btn) btn.innerHTML = '<i class="fas fa-save"></i> ' + (count > 0 ? count + '件を一括登録' : '登録');
    };

    // ── リストクリア ──────────────────────────────────────────
    window.bcClearItems = function () {
        var tbody = document.getElementById('bc-items-tbody');
        if (tbody) tbody.innerHTML = _emptyRow();
        bcUpdateTotal();
        _setStatus('', '');
        _focusScan();
    };

    // ── 保存 ─────────────────────────────────────────────────
    window.bcSave = async function () {
        var date   = (document.getElementById('bc-date')?.value   || '').trim();
        var worker = (document.getElementById('bc-worker')?.value || '').trim();
        var jobCode = (document.getElementById('bc-jobtype')?.value || '').trim();
        var dept    = document.querySelector('input[name="bc-dept"]:checked')?.value || '';

        if (!date)   { _showMsg('作業日を選択してください', 'error'); return; }
        if (!worker) { _showMsg('作業者を選択してください', 'error'); return; }

        var rows = document.querySelectorAll('#bc-items-tbody tr:not(#bc-empty-row)');
        if (rows.length === 0) { _showMsg('バーコードをスキャンして部品を追加してください', 'error'); return; }

        // 合計時間チェック
        var total = 0;
        rows.forEach(function (tr) {
            total += parseFloat(tr.querySelector('.bc-time-input')?.value || 0) || 0;
        });
        total = Math.round(total * 100) / 100;
        if (Math.abs(total - 7.75) > 0.01) {
            var ok = window.confirm('合計時間が ' + total.toFixed(2) + 'h です。定時(7.75h)と異なりますが登録しますか？');
            if (!ok) return;
        }

        // レコード構築
        var records = [];
        rows.forEach(function (tr) {
            var tds     = tr.querySelectorAll('td');
            var constr  = (tds[1]?.textContent || '').trim();
            var drawno  = (tds[2]?.textContent || '').trim();
            var partno  = (tds[3]?.textContent || '').trim();
            var wtime   = parseFloat(tr.querySelector('.bc-time-input')?.value || 0) || 0;
            records.push({
                date:          date,
                worker_code:   worker,
                job_type_1:    jobCode || null,
                department:    dept    || null,
                construct_no:  constr,
                drawing_no:    drawno  || null,
                part_no:       partno  || null,
                work_time:     Math.round(wtime * 100) / 100,
                work_code:     jobCode || '',
                work_name:     'バーコード登録',
                quantity:      1,
                register_date: new Date().toISOString()
            });
        });

        var btn = document.getElementById('bc-save-btn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登録中...'; }

        try {
            var sb = getSB();
            if (!sb) throw new Error('DB未接続');
            var { error } = await sb.from('t_work_records').insert(records);
            if (error) throw error;

            _showMsg(records.length + '件の作業票を登録しました', 'success');
            bcClearItems();
        } catch (e) {
            var msg = e.message || '';
            if (msg.includes('not found') || msg.includes('does not exist') || msg.includes('relation')) {
                // テーブルが未作成の場合はデモ動作
                _showMsg(records.length + '件を登録しました（デモ動作）', 'success');
                bcClearItems();
            } else {
                _showMsg('登録エラー: ' + e.message, 'error');
            }
        } finally {
            if (btn) { btn.disabled = false; bcUpdateTotal(); }
        }
    };

    // ── カメラスキャン ────────────────────────────────────────
    var _codeReader   = null;  // ZXing インスタンス
    var _lastScanned  = '';    // 直前のスキャン値（連続重複防止）
    var _lastScannedAt = 0;    // 直前スキャン時刻（ms）
    var _COOLDOWN_MS  = 1500;  // 同じコードを再スキャンするまでの待ち時間

    window.bcStartCamera = async function () {
        // ZXing が読み込まれているか確認
        if (typeof ZXingBrowser === 'undefined') {
            _showMsg('カメラスキャンライブラリが読み込まれていません。インターネット接続を確認してください。', 'error');
            return;
        }

        // オーバーレイを表示
        var overlay = document.getElementById('bc-camera-overlay');
        if (overlay) overlay.style.display = 'flex';

        try {
            _codeReader = new ZXingBrowser.BrowserMultiFormatReader();

            // 利用可能なカメラ一覧を取得
            var devices = await ZXingBrowser.BrowserCodeReader.listVideoInputDevices();
            var camSel  = document.getElementById('bc-camera-select');
            if (camSel && devices.length > 0) {
                camSel.innerHTML = devices.map(function (d, i) {
                    // 背面カメラを優先選択
                    var label = d.label || ('カメラ ' + (i + 1));
                    return '<option value="' + d.deviceId + '">' + label + '</option>';
                }).join('');
                // 背面カメラを優先（"back" or "環境" or "rear" を含むものを選択）
                var backCam = devices.find(function (d) {
                    return /back|rear|environ|背面/i.test(d.label || '');
                });
                if (backCam) camSel.value = backCam.deviceId;
            }

            _startDecoding(camSel ? camSel.value : (devices[0]?.deviceId || undefined));
        } catch (e) {
            _showMsg('カメラ起動エラー: ' + e.message, 'error');
            bcStopCamera();
        }
    };

    function _startDecoding(deviceId) {
        if (!_codeReader) return;
        _codeReader.decodeFromVideoDevice(deviceId, 'bc-camera-video', function (result, err) {
            if (!result) return;
            var text = result.getText();
            var now  = Date.now();

            // クールダウン中の同一コードは無視
            if (text === _lastScanned && (now - _lastScannedAt) < _COOLDOWN_MS) return;
            _lastScanned  = text;
            _lastScannedAt = now;

            // ビープ音（Web Audio API）
            _beep();

            // スキャン結果をinputに入れて処理
            var inp = document.getElementById('bc-scan-input');
            if (inp) inp.value = text;
            processBarcodeInput();

            // スキャン成功エフェクト
            var box = document.getElementById('bc-scan-box');
            if (box) {
                box.style.borderColor = '#22c55e';
                box.style.boxShadow   = '0 0 0 4px rgba(34,197,94,.4)';
                setTimeout(function () {
                    box.style.borderColor = 'white';
                    box.style.boxShadow   = 'none';
                }, 400);
            }
        });
    }

    window.bcSwitchCamera = function () {
        if (!_codeReader) return;
        _codeReader.reset();
        var camSel = document.getElementById('bc-camera-select');
        _startDecoding(camSel ? camSel.value : undefined);
    };

    window.bcStopCamera = function () {
        if (_codeReader) { try { _codeReader.reset(); } catch (_) {} _codeReader = null; }
        var overlay = document.getElementById('bc-camera-overlay');
        if (overlay) overlay.style.display = 'none';
        _focusScan();
    };

    function _beep() {
        try {
            var ctx  = new (window.AudioContext || window.webkitAudioContext)();
            var osc  = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type      = 'square';
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.12);
        } catch (_) {}
    }

    // カメラオーバーレイHTML（ページ読み込み時に1回 body に挿入）
    function _injectCameraOverlay() {
        if (document.getElementById('bc-camera-overlay')) return;
        var div = document.createElement('div');
        div.id  = 'bc-camera-overlay';
        div.style.cssText = [
            'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);',
            'z-index:9999;flex-direction:column;align-items:center;justify-content:center;'
        ].join('');
        div.innerHTML = [
            /* ヘッダー */
            '<div style="width:100%;max-width:500px;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;box-sizing:border-box;">',
            '  <span style="color:white;font-size:15px;font-weight:700;"><i class="fas fa-camera" style="margin-right:8px;color:#22c55e;"></i>カメラスキャン</span>',
            '  <button onclick="bcStopCamera()" style="background:rgba(255,255,255,.15);color:white;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:13px;font-weight:700;"><i class="fas fa-times"></i> 閉じる</button>',
            '</div>',

            /* カメラ映像 */
            '<div style="position:relative;width:100%;max-width:500px;aspect-ratio:4/3;background:#000;overflow:hidden;">',
            '  <video id="bc-camera-video" style="width:100%;height:100%;object-fit:cover;" autoplay muted playsinline></video>',
            '  <!-- スキャン枠 -->',
            '  <div id="bc-scan-box" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);',
            '    width:70%;aspect-ratio:3/1;border:3px solid white;border-radius:8px;',
            '    box-shadow:0 0 0 2000px rgba(0,0,0,.45);transition:border-color .2s,box-shadow .2s;"></div>',
            '  <!-- スキャンライン -->',
            '  <div style="position:absolute;top:50%;left:15%;width:70%;height:2px;background:linear-gradient(90deg,transparent,#22c55e,transparent);',
            '    animation:bcScanLine 1.6s linear infinite;transform:translateY(-50%);"></div>',
            '</div>',

            /* カメラ選択 */
            '<div style="width:100%;max-width:500px;padding:10px 16px;box-sizing:border-box;display:flex;gap:10px;align-items:center;">',
            '  <select id="bc-camera-select" onchange="bcSwitchCamera()" style="flex:1;padding:8px 10px;border-radius:7px;border:none;font-size:13px;background:rgba(255,255,255,.12);color:white;outline:none;"></select>',
            '</div>',

            /* ガイド */
            '<p style="color:rgba(255,255,255,.6);font-size:13px;margin:6px 0 0;text-align:center;">バーコードを枠内に合わせてください</p>',

            /* アニメーション CSS */
            '<style>@keyframes bcScanLine{0%{top:25%}50%{top:75%}100%{top:25%}}</style>'
        ].join('\n');
        document.body.appendChild(div);
    }
    // ページ描画後すぐオーバーレイを準備
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _injectCameraOverlay);
    } else {
        _injectCameraOverlay();
    }

    // ── ユーティリティ ────────────────────────────────────────
    function _focusScan() {
        var el = document.getElementById('bc-scan-input');
        if (el) el.focus();
    }

    function _setStatus(type, msg) {
        var el = document.getElementById('bc-status');
        if (!el) return;
        var colors = { ok: '#16a34a', error: '#dc2626', warn: '#d97706', info: '#1d4ed8', '': '#64748b' };
        var icons  = { ok: 'check-circle', error: 'exclamation-circle', warn: 'exclamation-triangle', info: 'circle-notch fa-spin', '': '' };
        el.style.color = colors[type] || '#374151';
        el.innerHTML   = (icons[type] ? '<i class="fas fa-' + icons[type] + '"></i> ' : '') + msg;
    }

    function _showMsg(msg, type) {
        var el = document.getElementById('bc-msg');
        if (!el) return;
        var bg = { success: '#dcfce7', error: '#fee2e2', warn: '#fef3c7' };
        var tc = { success: '#15803d', error: '#b91c1c', warn: '#92400e' };
        el.style.cssText = 'padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:16px;display:block;background:' + (bg[type] || '#f1f5f9') + ';color:' + (tc[type] || '#374151') + ';';
        el.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'exclamation-circle') + '"></i> ' + msg;
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.style.display = 'none'; }, 5000);
    }

    function _emptyRow() {
        return '<tr id="bc-empty-row"><td colspan="8" style="text-align:center;padding:36px;color:#94a3b8;font-size:13px;"><i class="fas fa-barcode" style="font-size:36px;display:block;margin-bottom:10px;opacity:.25;"></i>バーコードをスキャンすると部品が追加されます</td></tr>';
    }

    // ── 日付移動（作業票と同じ操作感） ───────────────────────────
    window.bcChangeDate = function (delta) {
        var el = document.getElementById('bc-date');
        if (!el) return;
        if (delta === 0) { el.value = todayStr(); return; }
        var d = el.value ? new Date(el.value) : new Date();
        d.setDate(d.getDate() + delta);
        el.value = d.getFullYear() + '-'
            + String(d.getMonth() + 1).padStart(2, '0') + '-'
            + String(d.getDate()).padStart(2, '0');
    };

    // ── HTML生成 ──────────────────────────────────────────────
    function _buildHTML(workers, worktypes) {
        var workerOpts = workers.map(function (w) {
            var code = (w.staffcode || w.StaffCode || '').trim();
            var name = (w.staffname || w.StaffName || '').trim();
            return '<option value="' + code + '">' + code + '　' + name + '</option>';
        }).join('');

        var worktypeOpts = worktypes.map(function (t) {
            var code = (t.WorkCode || t.workcode || '').trim();
            var name = (t.WorkName || t.workname || '').trim();
            return '<option value="' + code + '">' + code + '　' + name + '</option>';
        }).join('');

        var radioStyle = 'display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.95);border:2px solid transparent;font-size:11px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.1);';

        return [
            /* 外枠：作業票と同じグラデーション背景 */
            '<div style="padding:12px;height:100%;overflow:hidden;background:linear-gradient(135deg,#f5f7fa 0%,#e8ecf1 100%);">',
            '<div style="height:100%;display:flex;flex-direction:column;gap:8px;">',

            /* ── ヘッダー（白カード） ─ 作業票と同じ構造 */
            '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:white;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.05);flex-shrink:0;">',
            '  <div style="display:flex;align-items:center;gap:16px;">',
            '    <h2 style="background:linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:22px;font-weight:700;margin:0;">',
            '      <i class="fas fa-barcode" style="-webkit-text-fill-color:initial;color:var(--primary);margin-right:8px;"></i>バーコードリーダー版　作業票登録',
            '    </h2>',
            '    <div style="display:flex;align-items:center;gap:8px;">',
            '      <button type="button" class="btn-secondary" onclick="bcChangeDate(-1)" style="padding:6px 12px;font-size:12px;"><i class="fas fa-chevron-left"></i></button>',
            '      <input type="date" id="bc-date" class="form-input" style="font-size:13px;padding:6px 10px;font-weight:600;min-width:140px;">',
            '      <button type="button" class="btn-secondary" onclick="bcChangeDate(0)" style="padding:6px 12px;font-size:12px;">本日</button>',
            '      <button type="button" class="btn-secondary" onclick="bcChangeDate(1)" style="padding:6px 12px;font-size:12px;"><i class="fas fa-chevron-right"></i></button>',
            '    </div>',
            '  </div>',
            '  <div style="display:flex;gap:8px;align-items:center;">',
            '    <button type="button" class="btn-secondary" onclick="showPage(\'register\')" style="padding:8px 16px;font-size:13px;"><i class="fas fa-arrow-left"></i> 戻る</button>',
            '    <button id="bc-save-btn" type="button" onclick="bcSave()" style="padding:8px 20px;font-size:14px;font-weight:700;background:linear-gradient(135deg,#4CAF50 0%,#388e3c 100%);color:white;border:none;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;"><i class="fas fa-save"></i> 登録</button>',
            '  </div>',
            '</div>',

            /* メッセージ */
            '<div id="bc-msg" style="display:none;flex-shrink:0;"></div>',

            /* ── 上段カード3列（作業票と同じグリッド構造） */
            '<div style="display:grid;grid-template-columns:240px 1fr 1fr;gap:10px;flex-shrink:0;">',

            /* 青カード：作業者情報 */
            '  <div style="background:linear-gradient(135deg,#4A90E2 0%,#357ABD 100%);border-radius:12px;padding:14px;box-shadow:0 4px 12px rgba(74,144,226,0.3);position:relative;overflow:hidden;">',
            '    <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>',
            '    <div style="position:relative;z-index:1;">',
            '      <h3 style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:white;display:flex;align-items:center;gap:8px;text-shadow:0 2px 4px rgba(0,0,0,0.2);"><i class="fas fa-user-circle" style="font-size:16px;"></i> 作業者情報</h3>',
            '      <div style="display:flex;flex-direction:column;gap:10px;">',
            '        <div>',
            '          <label style="display:block;margin-bottom:6px;font-weight:600;color:white;font-size:11px;text-shadow:0 1px 2px rgba(0,0,0,0.2);">作業者 <span style="color:#FFD700;">*</span></label>',
            '          <select id="bc-worker" style="width:100%;padding:8px 10px;border:none;border-radius:7px;font-size:13px;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,0.15);">',
            '            <option value="">選択してください</option>',
            workerOpts,
            '          </select>',
            '        </div>',
            '        <div>',
            '          <label style="display:block;margin-bottom:5px;font-weight:600;color:white;font-size:11px;text-shadow:0 1px 2px rgba(0,0,0,0.2);">部門 <span style="color:#FFD700;">*</span></label>',
            '          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">',
            '            <label style="' + radioStyle + '"><input type="radio" name="bc-dept" value="明石" style="margin:0;accent-color:var(--primary);"> <span>明石</span></label>',
            '            <label style="' + radioStyle + '"><input type="radio" name="bc-dept" value="組立" style="margin:0;accent-color:var(--primary);"> <span>組立</span></label>',
            '            <label style="' + radioStyle + '"><input type="radio" name="bc-dept" value="操業" style="margin:0;accent-color:var(--primary);"> <span>操業</span></label>',
            '            <label style="' + radioStyle + '"><input type="radio" name="bc-dept" value="電気技術" style="margin:0;accent-color:var(--primary);"> <span>電気技術</span></label>',
            '          </div>',
            '        </div>',
            '      </div>',
            '    </div>',
            '  </div>',

            /* 緑カード：作業コード */
            '  <div style="background:linear-gradient(135deg,#6BCB77 0%,#4CAF50 100%);border-radius:12px;padding:14px;box-shadow:0 4px 12px rgba(107,203,119,0.3);position:relative;overflow:hidden;">',
            '    <div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;background:rgba(255,255,255,0.15);border-radius:50%;"></div>',
            '    <div style="position:relative;z-index:1;">',
            '      <h3 style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:white;display:flex;align-items:center;gap:6px;text-shadow:0 2px 4px rgba(0,0,0,0.2);"><i class="fas fa-tools" style="font-size:14px;"></i> 作業コード</h3>',
            '      <div>',
            '        <label style="display:block;margin-bottom:6px;font-weight:600;color:white;font-size:11px;text-shadow:0 1px 2px rgba(0,0,0,0.2);">作業コード <span style="color:rgba(255,255,255,0.7);">（任意）</span></label>',
            '        <select id="bc-jobtype" style="width:100%;padding:8px 10px;border:none;border-radius:7px;font-size:13px;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,0.15);">',
            '          <option value="">（任意）</option>',
            worktypeOpts,
            '        </select>',
            '        <p style="margin:10px 0 0;font-size:11px;color:rgba(255,255,255,0.85);line-height:1.6;">全行に同じ作業コードが適用されます。</p>',
            '      </div>',
            '    </div>',
            '  </div>',

            /* オレンジカード：バーコードスキャン */
            '  <div style="background:linear-gradient(135deg,#FF8C42 0%,#FF6B35 100%);border-radius:12px;padding:14px;box-shadow:0 4px 12px rgba(255,140,66,0.3);position:relative;overflow:hidden;">',
            '    <div style="position:absolute;bottom:-20px;left:-20px;width:70px;height:70px;background:rgba(255,255,255,0.12);border-radius:50%;"></div>',
            '    <div style="position:relative;z-index:1;">',
            '      <h3 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:white;display:flex;align-items:center;gap:6px;text-shadow:0 2px 4px rgba(0,0,0,0.2);"><i class="fas fa-barcode" style="font-size:14px;"></i> バーコードスキャン</h3>',
            '      <div style="display:flex;flex-direction:column;gap:8px;">',
            '        <input type="text" id="bc-scan-input"',
            '          placeholder="スキャンまたはキーボード入力 → Enter"',
            '          style="width:100%;padding:10px 12px;border:none;border-radius:7px;font-size:14px;font-family:monospace;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,0.15);"',
            '          onkeydown="if(event.key===\'Enter\'){event.preventDefault();processBarcodeInput();}">',
            '        <div style="display:flex;gap:8px;">',
            '          <button onclick="processBarcodeInput()" style="flex:1;padding:9px;background:rgba(255,255,255,0.92);color:#e85d04;border:none;border-radius:7px;cursor:pointer;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);"><i class="fas fa-search"></i> 検索・追加</button>',
            '          <button onclick="bcStartCamera()" title="カメラでスキャン" style="padding:9px 14px;background:rgba(255,255,255,0.92);color:#16a34a;border:none;border-radius:7px;cursor:pointer;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);"><i class="fas fa-camera"></i> カメラ</button>',
            '        </div>',
            '        <div id="bc-status" style="font-size:12px;color:rgba(255,255,255,0.95);min-height:16px;"></div>',
            '      </div>',
            '    </div>',
            '  </div>',

            '</div>', /* end 上段グリッド */

            /* ── スキャン済みリスト（白カード・可変高さ） */
            '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;flex:1;min-height:0;display:flex;flex-direction:column;">',
            '  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#f9fafb;border-bottom:1px solid #f3f4f6;flex-shrink:0;">',
            '    <span style="font-size:13px;font-weight:700;color:#1e293b;"><i class="fas fa-list" style="color:var(--primary);margin-right:6px;"></i> スキャン済み部品一覧</span>',
            '    <div style="display:flex;align-items:center;gap:14px;">',
            '      <span style="font-size:13px;font-weight:600;color:#374151;">合計：<span id="bc-total-hours" style="font-size:20px;font-weight:900;font-family:monospace;color:#1d4ed8;">0.00h</span> <span style="font-size:11px;color:#9ca3af;">／ 定時7.75h</span></span>',
            '      <button onclick="bcClearItems()" style="padding:5px 12px;background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;"><i class="fas fa-trash-alt"></i> クリア</button>',
            '    </div>',
            '  </div>',
            '  <div style="overflow:auto;flex:1;">',
            '    <table style="width:100%;border-collapse:collapse;font-size:13px;">',
            '      <thead><tr style="background:#1e293b;color:white;position:sticky;top:0;z-index:1;">',
            '        <th style="padding:9px 8px;width:36px;"></th>',
            '        <th style="padding:9px 8px;text-align:left;min-width:70px;">工事番号</th>',
            '        <th style="padding:9px 8px;text-align:left;min-width:110px;">図面番号</th>',
            '        <th style="padding:9px 8px;text-align:center;width:50px;">品番</th>',
            '        <th style="padding:9px 8px;text-align:left;min-width:140px;">品名</th>',
            '        <th style="padding:9px 8px;text-align:left;min-width:70px;">材質</th>',
            '        <th style="padding:9px 8px;text-align:center;width:90px;">時間(h)</th>',
            '        <th style="padding:9px 8px;text-align:left;min-width:80px;font-weight:400;color:#9ca3af;">スキャン値</th>',
            '      </tr></thead>',
            '      <tbody id="bc-items-tbody">' + _emptyRow() + '</tbody>',
            '    </table>',
            '  </div>',
            '</div>',

            '</div>', /* inner flex col */
            '</div>'  /* outer container */
        ].join('\n');
    }

})();
