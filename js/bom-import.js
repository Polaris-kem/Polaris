/**
 * BOMインポートモジュール
 * ページID: bom-import-page
 *
 * 対象テーブル:
 *   製作部品 → t_manufctparts  (CAD出力の工事企画表)
 *     キー: constructionno, symbolmachine, symbolunit, drawingno, partno
 *   購入部品 → t_purchaseparts (購入部品表)
 *     キー: construction_no, symbol_machine, symbol_unit, consecutive_no（インポート後付与）
 *
 * 運用ルール:
 *   - Excelの8行目からデータ読込（設定変更可）
 *   - プレビュー最下行に納期を入力 → 全行に一括コピー
 *   - 登録後はキー項目編集不可
 */
(function () {
    'use strict';

    var _currentType = 'manufct';   // 'manufct' | 'purchase'
    var _previewRows = [];
    var _headerStartRow = 8;
    var _initialized = false;
    var _workbook = null;

    // ── Excelカラム定義 ──────────────────────────────
    var MANUFCT_COLS = [
        // ── キー項目 ──
        { key: 'symbolmachine',  label: '機械',          excelCol: 0,  required: false },
        { key: 'symbolunit',     label: 'ユニット',       excelCol: 1,  required: false },
        { key: 'drawingno',      label: '図面番号',       excelCol: 2,  required: true  },
        { key: 'partno',         label: '品番',           excelCol: 3,  required: false },
        // ── 詳細項目 ──
        { key: 'description',    label: '品名',           excelCol: 4,  required: false },
        { key: 'materialcode',   label: '素材（材質）',   excelCol: 5,  required: false },
        { key: 'qty',            label: '数量',           excelCol: 6,  required: false },
        { key: 'qtyspare',       label: '予備数',         excelCol: 7,  required: false },
        { key: 'qtyunit',        label: '単位',           excelCol: 8,  required: false },
        { key: 'weightmaterial', label: '素材重量',       excelCol: 9,  required: false },
        { key: 'weightfinished', label: '仕上重量',       excelCol: 10, required: false },
        { key: 'article',        label: '記事',           excelCol: 11, required: false },
        { key: 'comment',        label: '備考',           excelCol: 12, required: false },
        { key: 'unitdrawingno',  label: '組図/風船番号',  excelCol: 13, required: false },
        { key: 'designer',       label: '設計者',         excelCol: 14, required: false },
        { key: 'printdate',      label: '印刷日',         excelCol: 15, required: false },
        { key: 'deliverydate',   label: '納期',           excelCol: 16, required: false, batchCopy: true }
    ];

    var PURCHASE_COLS = [
        // ── キー項目（通番はインポート後に自動付与） ──
        { key: 'symbol_machine',  label: '機械',          excelCol: 0,  required: false },
        { key: 'symbol_unit',     label: 'ユニット',       excelCol: 1,  required: false },
        // ── 詳細項目 ──
        { key: 'description',     label: '品名',           excelCol: 2,  required: true  },
        { key: 'dimension_type',  label: '型式',           excelCol: 3,  required: false },
        { key: 'qty',             label: '数量',           excelCol: 4,  required: false },
        { key: 'qty_spare',       label: '予備数',         excelCol: 5,  required: false },
        { key: 'qty_unit',        label: '単位',           excelCol: 6,  required: false },
        { key: 'maker',           label: 'メーカー',       excelCol: 7,  required: false },
        { key: 'each_price',      label: '単価',           excelCol: 8,  required: false },
        { key: 'article',         label: '記事',           excelCol: 9,  required: false },
        { key: 'remarks',         label: '備考',           excelCol: 10, required: false },
        { key: 'unit_drawing_no', label: '組図/風船番号',  excelCol: 11, required: false },
        { key: 'designer',        label: '設計者',         excelCol: 12, required: false },
        { key: 'print_date',      label: '印刷日',         excelCol: 13, required: false },
        { key: 'flg_purchase',    label: '締結品以外',     excelCol: 14, required: false },
        { key: 'flg_bolt',        label: '締結品',         excelCol: 15, required: false },
        { key: 'delivery_date',   label: '納期',           excelCol: 16, required: false, batchCopy: true }
    ];

    function getCols() { return _currentType === 'manufct' ? MANUFCT_COLS : PURCHASE_COLS; }

    // ── ユーティリティ ──────────────────────────────
    function getSupabase() {
        if (typeof getSupabaseClient === 'function') return getSupabaseClient();
        return null;
    }

    function showMsg(msg, type) {
        var el = document.getElementById('bom-message');
        if (!el) return;
        var colors = { success: '#22c55e', error: '#ef4444', warn: '#f59e0b', info: '#3b82f6' };
        el.innerHTML = msg;
        el.style.color = colors[type] || '#374151';
        el.style.display = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(function(){ el.style.display='none'; }, 8000);
    }

    function colLetter(idx) {
        var s = ''; idx++;
        while (idx > 0) { idx--; s = String.fromCharCode(65 + (idx % 26)) + s; idx = Math.floor(idx / 26); }
        return s;
    }

    function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Excelパース ──────────────────────────────────
    function handleExcelFile(file) {
        if (!file) return;
        if (typeof XLSX === 'undefined') {
            showMsg('SheetJSが読み込まれていません。ページをリロードしてください。', 'error');
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                _workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
                parseAndPreview();
                var fn = document.getElementById('bom-file-name');
                if (fn) fn.textContent = file.name;
            } catch(err) {
                showMsg('Excelの読み込みに失敗しました: ' + err.message, 'error');
            }
        };
        reader.readAsBinaryString(file);
    }

    function parseAndPreview() {
        if (!_workbook) return;
        var sheetName = _workbook.SheetNames[0];
        var sheet = _workbook.Sheets[sheetName];
        var jsonData = XLSX.utils.sheet_to_json(sheet, { header:1, defval:'', raw:false });
        var startRow = _headerStartRow - 1;
        _previewRows = jsonData.slice(startRow).filter(function(r) {
            return r.some(function(c){ return String(c).trim() !== ''; });
        });
        showMsg(_previewRows.length + ' 行を読み込みました（' + sheetName + ' シート、' + _headerStartRow + '行目〜）', 'success');
        renderPreview();
    }

    // ── プレビュー描画 ──────────────────────────────
    function renderPreview() {
        var container = document.getElementById('bom-preview-area');
        if (!container) return;
        var cols = getCols();
        var rows = _previewRows;

        if (!rows || rows.length === 0) {
            container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:24px;">ファイルを選択するとプレビューが表示されます</p>';
            var btn = document.getElementById('bom-import-btn');
            if (btn) btn.disabled = true;
            return;
        }

        var batchCols = cols.filter(function(c){ return c.batchCopy; });
        var html = '<div style="overflow-x:auto;">';
        html += '<table class="data-table" style="font-size:12px;width:100%;">';
        html += '<thead><tr><th style="padding:6px;min-width:36px;">行</th>';
        cols.forEach(function(c) {
            html += '<th style="padding:6px;white-space:nowrap;">' + c.label +
                (c.required ? ' <span style="color:#ef4444">*</span>' : '') +
                (c.batchCopy ? ' <span title="最下行入力で全行コピー" style="color:#3b82f6;cursor:help;">🔁</span>' : '') +
                '</th>';
        });
        html += '</tr></thead><tbody>';

        rows.forEach(function(row, ri) {
            var isLast = (ri === rows.length - 1);
            var bg = ri % 2 === 0 ? 'background:#fafafa;' : '';
            if (isLast) bg = 'background:#eff6ff;';
            html += '<tr style="' + bg + '">';
            html += '<td style="padding:4px 8px;text-align:center;color:#9ca3af;">' + (ri + 1) + '</td>';
            cols.forEach(function(c) {
                var v = String(c.excelCol >= 0 && row[c.excelCol] != null ? row[c.excelCol] : '').trim();
                if (isLast && c.batchCopy) {
                    html += '<td style="padding:4px;">' +
                        '<input type="text" value="' + escHtml(v) + '" ' +
                        'data-batchkey="' + c.key + '" ' +
                        'oninput="window._bomOnBatchInput(\'' + c.key + '\', this.value)" ' +
                        'style="width:100%;min-width:90px;padding:3px 6px;border:2px solid #3b82f6;border-radius:4px;font-size:12px;">' +
                        '</td>';
                } else {
                    html += '<td style="padding:4px 8px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escHtml(v) + '">' + escHtml(v) + '</td>';
                }
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';

        if (batchCols.length > 0) {
            html += '<p style="font-size:12px;color:#3b82f6;margin-top:8px;padding:8px;background:#eff6ff;border-radius:6px;">' +
                '🔁 <strong>' + batchCols.map(function(c){return c.label;}).join('・') + '</strong>は、' +
                '青背景の最下行（' + rows.length + '行目）に入力すると<strong>全行に自動コピー</strong>されます。</p>';
        }

        container.innerHTML = html;
        var btn = document.getElementById('bom-import-btn');
        if (btn) btn.disabled = false;
    }

    // ── 最下行の一括コピー ───────────────────────────
    function onBatchInput(batchKey, value) {
        var cols = getCols();
        var col = cols.find(function(c){ return c.key === batchKey; });
        if (!col || col.excelCol < 0) return;
        _previewRows.forEach(function(row) { row[col.excelCol] = value; });
        renderPreview();
        showMsg('「' + col.label + '」を全 ' + _previewRows.length + ' 行にコピーしました', 'info');
    }

    // ── インポート（DB登録）───────────────────────────
    async function runBomImport() {
        var sb = getSupabase();
        if (!sb) { showMsg('Supabase 未接続です', 'error'); return; }
        if (!_previewRows || _previewRows.length === 0) {
            showMsg('インポートするデータがありません', 'warn'); return;
        }

        var constructno = ((document.getElementById('bom-constructno') || {}).value || '').trim();
        var keydate     = ((document.getElementById('bom-keydate')     || {}).value || '').trim();
        if (!constructno) { showMsg('工事番号を入力してください', 'error'); return; }

        var cols = getCols();
        var table = _currentType === 'manufct' ? 't_manufctparts' : 't_purchaseparts';
        var today = new Date().toISOString().slice(0, 10);

        var records = _previewRows.map(function(row) {
            var obj = {};
            cols.forEach(function(c) {
                if (c.excelCol < 0) return;
                var v = String(row[c.excelCol] || '').trim();
                obj[c.key] = v === '' ? null : v;
            });
            if (_currentType === 'manufct') {
                obj.constructionno = constructno;
                if (keydate) obj.keydate = keydate;
                obj.dateinput  = obj.dateinput  || today;
                obj.dateupdate = today;
                obj.importdate = today;
            } else {
                obj.construction_no = constructno;
                if (keydate) obj.key_date = keydate;
                obj.date_input  = obj.date_input  || today;
                obj.date_update = today;
                obj.import_date = today;
            }
            return obj;
        });

        // 必須項目が空の行をスキップ
        var requiredKey = _currentType === 'manufct' ? 'drawingno' : 'description';
        var validRecords = records.filter(function(r){ return r[requiredKey]; });
        var skipped = records.length - validRecords.length;

        if (validRecords.length === 0) {
            showMsg('有効なデータ行がありません（必須項目「' + (requiredKey === 'drawingno' ? '図面番号' : '品名') + '」が空）', 'warn');
            return;
        }

        if (!confirm(validRecords.length + ' 件を ' + table + ' に登録します。\n工事番号: ' + constructno + '\nよろしいですか？')) return;

        var btn = document.getElementById('bom-import-btn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登録中...'; }

        var ok = 0, ng = 0, ngMsg = [];
        var batchSize = 50;
        for (var i = 0; i < validRecords.length; i += batchSize) {
            var batch = validRecords.slice(i, i + batchSize);
            try {
                var res = await sb.from(table).insert(batch);
                if (res.error) { ng += batch.length; ngMsg.push(res.error.message); }
                else ok += batch.length;
            } catch(e) { ng += batch.length; ngMsg.push(e.message); }
        }

        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-import"></i> DBへ登録'; }

        var resultEl = document.getElementById('bom-result');
        if (resultEl) {
            resultEl.style.display = 'block';
            resultEl.innerHTML = '<div style="padding:14px;background:' + (ng===0?'#f0fdf4':'#fffbeb') + ';border-radius:8px;border:1px solid ' + (ng===0?'#bbf7d0':'#fde68a') + ';">' +
                '<strong style="font-size:15px;">' + (ng===0 ? '✅ 登録完了' : '⚠️ 一部エラー') + '</strong><br>' +
                '<span style="font-size:13px;">登録: <strong>' + ok + '件</strong> / 空行スキップ: ' + skipped + '件' +
                (ng > 0 ? ' / エラー: ' + ng + '件<br><span style="color:#ef4444;font-size:12px;">' + (ngMsg[0]||'') + '</span>' : '') +
                '</span></div>';
        }
        showMsg(ng === 0 ? ok + ' 件を登録しました' : '成功: ' + ok + ' 件 / エラー: ' + ng + ' 件', ng===0?'success':'warn');
    }

    // ── カラムマッピングUI ───────────────────────────
    function renderColMapping() {
        var container = document.getElementById('bom-col-mapping');
        if (!container) return;
        var cols = getCols();
        var html = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">';
        cols.forEach(function(c) {
            var sel = '<select onchange="window._bomColChange(\'' + c.key + '\', parseInt(this.value))" style="flex:1;min-width:0;font-size:12px;padding:2px 4px;border:1px solid #d1d5db;border-radius:4px;">';
            sel += '<option value="-1">-</option>';
            for (var i = 0; i < 26; i++) {
                sel += '<option value="' + i + '"' + (i === c.excelCol ? ' selected' : '') + '>' + colLetter(i) + '列</option>';
            }
            sel += '</select>';
            html += '<div style="display:flex;align-items:center;gap:4px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:5px 8px;overflow:hidden;">' +
                '<span style="font-size:11px;font-weight:600;white-space:nowrap;min-width:72px;max-width:72px;overflow:hidden;text-overflow:ellipsis;" title="' + c.label + '">' + c.label + '</span>' +
                '<span style="font-size:10px;color:#9ca3af;flex-shrink:0;">→</span>' +
                sel + '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    // ── タブ切り替え ──────────────────────────────────
    function switchType(type) {
        _currentType = type;
        _previewRows = [];
        _workbook = null;
        document.querySelectorAll('.bom-tab').forEach(function(t) {
            var active = t.dataset.type === type;
            t.style.borderBottom = active ? '3px solid #3b82f6' : '3px solid transparent';
            t.style.color        = active ? '#3b82f6' : '#6b7280';
            t.style.fontWeight   = active ? '700' : '400';
        });
        var fn = document.getElementById('bom-file-name');  if (fn) fn.textContent = '';
        var fi = document.getElementById('bom-file-input'); if (fi) fi.value = '';
        var res= document.getElementById('bom-result');     if (res) res.style.display = 'none';
        renderColMapping();
        renderPreview();
    }

    // ── HTML生成 ──────────────────────────────────────
    function buildHTML() {
        return [
            '<div class="page-title" style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">',
            '  <button class="btn-secondary" onclick="showPage(\'search\')" style="display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i> 戻る</button>',
            '  <h2 style="margin:0;">BOMインポート</h2>',
            '  <span style="font-size:12px;color:#6b7280;">工事企画表・購入部品表をDBに取り込みます</span>',
            '</div>',

            // タブ
            '<div style="display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:12px;">',
            '  <button class="bom-tab" data-type="manufct" onclick="window._bomSwitchType(\'manufct\')" style="padding:8px 24px;border:none;background:transparent;cursor:pointer;border-bottom:3px solid #3b82f6;color:#3b82f6;font-weight:700;font-size:14px;">製作部品（工事企画表）</button>',
            '  <button class="bom-tab" data-type="purchase" onclick="window._bomSwitchType(\'purchase\')" style="padding:8px 24px;border:none;background:transparent;cursor:pointer;border-bottom:3px solid transparent;color:#6b7280;font-size:14px;">購入部品（購入部品表）</button>',
            '</div>',

            // Step 1
            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px 24px;margin-bottom:12px;">',
            '  <h3 style="margin:0 0 16px;font-size:15px;color:#374151;">',
            '    <span style="background:#3b82f6;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:12px;font-weight:700;">1</span>',
            '    工事情報 &amp; Excelファイル選択',
            '  </h3>',
            '  <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:16px;align-items:end;margin-bottom:16px;">',
            '    <div>',
            '      <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px;">工事番号 <span style="color:#ef4444">*</span></label>',
            '      <input id="bom-constructno" type="text" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s;background:#fff;" placeholder="例: 1001" onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
            '    </div>',
            '    <div>',
            '      <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px;">受注登録日（KeyDate）</label>',
            '      <input id="bom-keydate" type="date" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s;background:#fff;" onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
            '    </div>',
            '    <div>',
            '      <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px;">データ開始行</label>',
            '      <input id="bom-start-row" type="number" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s;background:#fff;" value="' + _headerStartRow + '" min="1" max="50" onchange="window._bomChangeStartRow(parseInt(this.value))" onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e2e8f0\'">',
            '    </div>',
            '    <div id="bom-drop-area" style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed #93c5fd;border-radius:12px;padding:20px 32px;cursor:pointer;background:#f0f7ff;transition:all .2s;min-width:220px;">',
            '      <i class="fas fa-file-excel" style="font-size:32px;color:#22c55e;margin-bottom:8px;"></i>',
            '      <span style="font-size:13px;font-weight:700;color:#374151;">クリック / ドロップ</span>',
            '      <span style="font-size:11px;color:#6b7280;margin-top:3px;">.xlsx / .xls</span>',
            '      <div id="bom-file-name" style="margin-top:6px;font-size:11px;color:#3b82f6;font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;"></div>',
            '      <input id="bom-file-input" type="file" accept=".xlsx,.xls" style="display:none;" onchange="window._bomOnFile(this.files[0])">',
            '    </div>',
            '  </div>',
            '</div>',

            // Step 2: カラムマッピング（折りたたみ）
            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:12px;">',
            '  <div onclick="window._bomToggleMapping()" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;cursor:pointer;user-select:none;">',
            '    <div style="display:flex;align-items:center;gap:8px;">',
            '      <span style="background:#94a3b8;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">2</span>',
            '      <span style="font-size:14px;color:#6b7280;">列の対応設定（通常は変更不要）</span>',
            '    </div>',
            '    <i id="bom-mapping-chevron" class="fas fa-chevron-down" style="color:#94a3b8;font-size:13px;transition:transform .2s;"></i>',
            '  </div>',
            '  <div id="bom-mapping-body" style="display:none;padding:0 16px 14px;">',
            '    <div id="bom-col-mapping"></div>',
            '    <button class="btn-secondary" onclick="window._bomReparse()" style="margin-top:10px;font-size:12px;padding:5px 12px;"><i class="fas fa-sync-alt"></i> この設定でプレビュー更新</button>',
            '  </div>',
            '</div>',

            // Step 3: プレビュー
            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;margin-bottom:12px;">',
            '  <h3 style="margin:0 0 10px;font-size:15px;color:#374151;">',
            '    <span style="background:#3b82f6;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:12px;font-weight:700;">3</span>',
            '    プレビュー確認',
            '  </h3>',
            '  <div id="bom-preview-area"><p style="color:#6b7280;text-align:center;padding:16px;">ファイルを選択するとここにプレビューが表示されます</p></div>',
            '</div>',

            // Step 4: 登録
            '<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px;margin-bottom:16px;">',
            '  <h3 style="margin:0 0 8px;font-size:15px;color:#374151;">',
            '    <span style="background:#22c55e;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:12px;font-weight:700;">4</span>',
            '    DBへ登録',
            '  </h3>',
            '  <p style="font-size:12px;color:#6b7280;margin-bottom:10px;">⚠ 登録後、工事番号・機械・ユニット・図面番号・品番は変更できません（キー情報）。</p>',
            '  <button id="bom-import-btn" class="btn-primary" onclick="window._bomRunImport()" disabled style="background:#22c55e;border-color:#22c55e;display:flex;align-items:center;gap:8px;font-size:14px;padding:10px 20px;">',
            '    <i class="fas fa-file-import"></i> DBへ登録',
            '  </button>',
            '  <div id="bom-result" style="display:none;margin-top:12px;"></div>',
            '  <div id="bom-message" style="display:none;margin-top:10px;font-weight:500;font-size:13px;"></div>',
            '</div>'
        ].join('\n');
    }

    // ── ページ初期化 ──────────────────────────────────
    function initBomImportPage() {
        var container = document.getElementById('bom-import-content');
        if (!container) return;

        if (!_initialized) {
            container.innerHTML = buildHTML();
            _initialized = true;

            // ドラッグ&ドロップ
            var dropArea = document.getElementById('bom-drop-area');
            if (dropArea) {
                dropArea.addEventListener('click', function(e){
                    if (e.target.id !== 'bom-file-input') document.getElementById('bom-file-input').click();
                });
                dropArea.addEventListener('dragover', function(e){ e.preventDefault(); dropArea.style.borderColor='#3b82f6'; dropArea.style.background='#eff6ff'; });
                dropArea.addEventListener('dragleave', function(){ dropArea.style.borderColor='#d1d5db'; dropArea.style.background='#fafafa'; });
                dropArea.addEventListener('drop', function(e){
                    e.preventDefault(); dropArea.style.borderColor='#d1d5db'; dropArea.style.background='#fafafa';
                    var f = e.dataTransfer.files[0];
                    if (f) handleExcelFile(f);
                });
            }

            window._bomOnFile        = handleExcelFile;
            window._bomSwitchType    = switchType;
            window._bomOnBatchInput  = onBatchInput;
            window._bomToggleMapping = function() {
                var body = document.getElementById('bom-mapping-body');
                var icon = document.getElementById('bom-mapping-chevron');
                if (!body) return;
                var open = body.style.display === 'none';
                body.style.display = open ? 'block' : 'none';
                if (icon) icon.style.transform = open ? 'rotate(180deg)' : '';
            };
            window._bomColChange     = function(key, colIdx) {
                var cols = getCols();
                var c = cols.find(function(x){ return x.key === key; });
                if (c) c.excelCol = colIdx;
            };
            window._bomChangeStartRow = function(n) { if (n >= 1) _headerStartRow = n; };
            window._bomReparse = parseAndPreview;
            window._bomRunImport = runBomImport;
        }

        // 状態リセット
        _currentType = 'manufct'; _previewRows = []; _workbook = null;
        document.querySelectorAll('.bom-tab').forEach(function(t) {
            var active = t.dataset.type === 'manufct';
            t.style.borderBottom = active ? '3px solid #3b82f6' : '3px solid transparent';
            t.style.color        = active ? '#3b82f6' : '#6b7280';
            t.style.fontWeight   = active ? '700' : '400';
        });
        ['bom-file-name','bom-file-input'].forEach(function(id){
            var el=document.getElementById(id); if(el) el.value=''; if(el&&id==='bom-file-name') el.textContent='';
        });
        var res = document.getElementById('bom-result'); if (res) res.style.display='none';
        renderColMapping();
        renderPreview();
    }

    window.initBomImportPage = initBomImportPage;

})();
