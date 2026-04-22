/**
 * 会社カレンダー Excelインポートモジュール
 * 対応フォーマット:
 *   A) 日付リスト列 (YYYY/MM/DD が並んでいる列)
 *   B) 視覚的カレンダー (年月ヘッダー + 日付数字のグリッド)
 *      ※ Bの場合: 「会社休日」「休」「休日」等のキーワードを持つ行/列に
 *        対応する日付を休日として取り込む
 */
(function () {
    'use strict';

    var _detectedDates = []; // { dateStr: 'YYYY/MM/DD', selected: true }

    // ── 日付パターン ──────────────────────────────────
    var DATE_PATTERNS = [
        /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,   // YYYY/MM/DD or YYYY-MM-DD
        /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,           // YYYY年MM月DD日
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/     // MM/DD/YYYY
    ];

    function parseDate(val) {
        if (!val) return null;
        // Excel Dateオブジェクト
        if (val instanceof Date && !isNaN(val)) {
            return fmtDate(val);
        }
        var s = String(val).trim();
        // パターンA: YYYY/MM/DD系
        var m;
        m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (m) return pad4(m[1]) + '/' + pad2(m[2]) + '/' + pad2(m[3]);
        m = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (m) return pad4(m[1]) + '/' + pad2(m[2]) + '/' + pad2(m[3]);
        m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (m) return pad4(m[3]) + '/' + pad2(m[1]) + '/' + pad2(m[2]);
        return null;
    }

    function fmtDate(d) {
        return d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate());
    }
    function pad2(n) { return String(n).padStart(2, '0'); }
    function pad4(n) { return String(n).padStart(4, '0'); }

    // ── Excelスキャン ─────────────────────────────────
    function scanWorkbook(wb) {
        var found = {};

        wb.SheetNames.forEach(function (name) {
            var ws = wb.Sheets[name];
            var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true, cellDates: true });

            // ── 方式A: 日付リスト列を検索 ──
            rows.forEach(function (row) {
                row.forEach(function (cell) {
                    var d = parseDate(cell);
                    if (d && isReasonableDate(d)) found[d] = true;
                });
            });

            // ── 方式B: 視覚的カレンダー (年月+日数字) ──
            // 年と月を含む行を探す
            var yearMonthMap = buildYearMonthMap(rows);
            if (yearMonthMap.length > 0) {
                yearMonthMap.forEach(function (ym) {
                    // ym.year, ym.month, ym.colStart, ym.rowStart
                    // その直下のグリッドで1-31の数字セルを日付に変換
                    extractGridDates(rows, ym, found);
                });
            }
        });

        return Object.keys(found).sort();
    }

    function isReasonableDate(d) {
        var year = parseInt(d.slice(0, 4));
        return year >= 2020 && year <= 2035;
    }

    // 「YYYY年」「YYYY/MM」「X月」等を含む行を探して年月マップを作る
    function buildYearMonthMap(rows) {
        var result = [];
        var currentYear = new Date().getFullYear();

        rows.forEach(function (row, ri) {
            row.forEach(function (cell, ci) {
                var s = String(cell).trim();
                // 「2025年」「令和7年」のような年表記
                var ymatch = s.match(/(\d{4})\s*年/);
                if (ymatch) currentYear = parseInt(ymatch[1]);
                // 「4月」「4 月」のような月表記
                var mmatch = s.match(/^(\d{1,2})\s*月$/);
                if (mmatch) {
                    result.push({
                        year: currentYear,
                        month: parseInt(mmatch[1]),
                        rowStart: ri,
                        colStart: ci
                    });
                }
            });
        });
        return result;
    }

    // 視覚的カレンダーのグリッドから日付を抽出
    function extractGridDates(rows, ym, found) {
        // 月ヘッダー行から5行以内に1-31の数字があれば日付とみなす
        var maxRow = Math.min(ym.rowStart + 10, rows.length);
        for (var ri = ym.rowStart; ri < maxRow; ri++) {
            var row = rows[ri] || [];
            for (var ci = 0; ci < row.length; ci++) {
                var v = row[ci];
                if (v === '' || v === null || v === undefined) continue;
                var n = parseInt(String(v).trim());
                if (n >= 1 && n <= 31 && String(v).trim() === String(n)) {
                    // 有効な日付かチェック
                    try {
                        var d = new Date(ym.year, ym.month - 1, n);
                        if (d.getMonth() === ym.month - 1) {
                            var ds = fmtDate(d);
                            if (isReasonableDate(ds)) found[ds] = true;
                        }
                    } catch (e) {}
                }
            }
        }
    }

    // ── UI: プレビュー描画 ────────────────────────────
    function renderPreview(dates) {
        _detectedDates = dates.map(function (d) { return { dateStr: d, selected: true }; });
        var container = document.getElementById('cal-excel-preview');
        if (!container) return;

        if (dates.length === 0) {
            container.innerHTML = '<p style="color:#ef4444;font-size:13px;padding:8px;">日付が見つかりませんでした。<br>ファイル形式を確認してください。</p>';
            return;
        }

        // 月別グループ
        var byMonth = {};
        dates.forEach(function (d) {
            var key = d.slice(0, 7); // YYYY/MM
            if (!byMonth[key]) byMonth[key] = [];
            byMonth[key].push(d);
        });

        var html = '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">' + dates.length + '件の日付を検出しました。インポートする日付を確認してください。</div>';
        html += '<div style="max-height:220px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">';

        Object.keys(byMonth).sort().forEach(function (key) {
            var parts = key.split('/');
            html += '<div style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">';
            html += '<div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px;">' + parseInt(parts[0]) + '年 ' + parseInt(parts[1]) + '月</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
            byMonth[key].forEach(function (d) {
                var day = parseInt(d.slice(8));
                var weekDay = ['日','月','火','水','木','金','土'][new Date(d.replace(/\//g,'-')).getDay()];
                var color = (weekDay === '日') ? '#ef4444' : (weekDay === '土') ? '#3b82f6' : '#1e293b';
                html += '<label style="display:flex;align-items:center;gap:3px;cursor:pointer;padding:3px 6px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;">' +
                    '<input type="checkbox" data-date="' + d + '" checked style="margin:0;">' +
                    '<span style="font-size:12px;color:' + color + ';">' + day + '日(' + weekDay + ')</span>' +
                    '</label>';
            });
            html += '</div></div>';
        });
        html += '</div>';
        html += '<div style="display:flex;gap:8px;margin-top:12px;">';
        html += '<button onclick="window._calExcelImport()" class="btn-primary" style="flex:1;padding:9px;"><i class="fas fa-calendar-check"></i> 選択した日付を登録</button>';
        html += '<button onclick="window._calExcelSelectAll(true)" class="btn-secondary" style="padding:9px 12px;">全選択</button>';
        html += '<button onclick="window._calExcelSelectAll(false)" class="btn-secondary" style="padding:9px 12px;">全解除</button>';
        html += '</div>';

        container.innerHTML = html;

        document.getElementById('cal-excel-import-btn') && (document.getElementById('cal-excel-import-btn').style.display = 'none');
    }

    // ── インポート実行 ────────────────────────────────
    function doImport() {
        var checkboxes = document.querySelectorAll('#cal-excel-preview input[type=checkbox]:checked');
        var newDates = [];
        checkboxes.forEach(function (cb) { newDates.push(cb.dataset.date); });

        if (newDates.length === 0) {
            alert('日付が選択されていません。');
            return;
        }

        // 既存と合体
        var existing = (companyCalendarEvents || []).map(function (e) { return e.date; });
        var added = 0;
        newDates.forEach(function (d) {
            if (existing.indexOf(d) === -1) {
                companyCalendarEvents.push({ date: d, title: '会社休日', type: 'company-holiday' });
                added++;
            }
        });

        if (typeof saveCompanyCalendarEvents === 'function') saveCompanyCalendarEvents();
        if (typeof loadCompanyCalendarEdit === 'function') loadCompanyCalendarEdit();
        if (typeof renderCalendar === 'function') renderCalendar();

        var container = document.getElementById('cal-excel-preview');
        if (container) {
            container.innerHTML = '<div style="padding:14px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;font-size:13px;font-weight:600;color:#16a34a;">' +
                '✅ ' + added + '件を登録しました（重複 ' + (newDates.length - added) + '件はスキップ）</div>';
        }
    }

    // ── ファイル処理 ──────────────────────────────────
    function handleFile(file) {
        if (!file) return;
        var nameEl = document.getElementById('cal-excel-filename');
        if (nameEl) nameEl.textContent = file.name;
        var preview = document.getElementById('cal-excel-preview');
        if (preview) preview.innerHTML = '<p style="color:#3b82f6;font-size:13px;padding:8px;"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</p>';

        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var wb = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
                var dates = scanWorkbook(wb);
                renderPreview(dates);
            } catch (err) {
                var p = document.getElementById('cal-excel-preview');
                if (p) p.innerHTML = '<p style="color:#ef4444;font-size:13px;padding:8px;">読み込みエラー: ' + err.message + '</p>';
            }
        };
        reader.readAsBinaryString(file);
    }

    // ── 初期化 ────────────────────────────────────────
    function init() {
        var dropArea = document.getElementById('cal-excel-drop');
        var fileInput = document.getElementById('cal-excel-file');
        if (!dropArea || !fileInput) return;

        dropArea.addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', function () { handleFile(fileInput.files[0]); });
        dropArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            dropArea.style.borderColor = '#2563eb';
            dropArea.style.background = '#eff6ff';
        });
        dropArea.addEventListener('dragleave', function () {
            dropArea.style.borderColor = '#93c5fd';
            dropArea.style.background = '#f0f7ff';
        });
        dropArea.addEventListener('drop', function (e) {
            e.preventDefault();
            dropArea.style.borderColor = '#93c5fd';
            dropArea.style.background = '#f0f7ff';
            handleFile(e.dataTransfer.files[0]);
        });

        window._calExcelImport = doImport;
        window._calExcelSelectAll = function (v) {
            document.querySelectorAll('#cal-excel-preview input[type=checkbox]').forEach(function (cb) { cb.checked = v; });
        };
    }

    window.initCalendarExcelImport = init;
})();
