(function () {
    'use strict';

    const TABLE = 't_expense';

    // purchaseno の頭文字で原価区分を判定
    const COST_DIV = {
        'C': '外注加工費',
        'R': '材料費',
        'P': '購入部品費',
        'E': '諸経費',
    };

    // CSVヘッダー → DBカラム マッピング（大文字小文字無視）
    const HEADER_MAP = {
        'keydate': 'keydate',
        'constructionno': 'constructionno',
        '工事番号': 'constructionno',
        'symbolmachine': 'symbolmachine',
        'symbolunit': 'symbolunit',
        'consecutiveno': 'consecutiveno',
        'description': 'description',
        '品名': 'description',
        'dimensiontype': 'dimensiontype',
        'comment': 'comment',
        'datasource': 'datasource',
        'qty': 'qty',
        '数量': 'qty',
        'orderqtyint': 'orderqtyint',
        'qtyunit': 'qtyunit',
        'orderqtyunit': 'orderqtyunit',
        'eachprice': 'eachprice',
        '単価': 'eachprice',
        'totalprice': 'totalprice',
        '合計金額': 'totalprice',
        'purchaseno': 'purchaseno',
        '発注番号': 'purchaseno',
        'orderdiv': 'orderdiv',
        'ordercompanycode': 'ordercompanycode',
        '発注先': 'ordercompanycode',
        'outputdate': 'outputdate',
        'deliverydate': 'deliverydate',
        '納期': 'deliverydate',
        'nounyudate': 'nounyudate',
        'kensyudate': 'kensyudate',
        'taxfreeflg': 'taxfreeflg',
        'importtaxflg': 'importtaxflg',
        'deptcode': 'deptcode',
        'orderdone': 'orderdone',
        'orderpc': 'orderpc',
        'kamoku': 'kamoku',
        '勘定科目': 'kamoku',
        'uchiwake': 'uchiwake',
        '内訳': 'uchiwake',
        'dateinput': 'dateinput',
        'dateupdate': 'dateupdate',
        'reissuetimes': 'reissuetimes',
        'reorderreason': 'reorderreason',
        'selectflg': 'selectflg',
        'cancelflg': 'cancelflg',
        'deleteflg': 'deleteflg',
        'outputperson': 'outputperson',
        'repeatflg': 'repeatflg',
        'accepttestflg': 'accepttestflg',
        'maker': 'maker',
        'category': 'category',
        'orderdivname': 'orderdivname',
        'selectperson': 'selectperson',
        'registercode': 'registercode',
        'purchasenoa': 'purchasenoa',
        'oldpurchaseno': 'oldpurchaseno',
        'orderdate': 'orderdate',
        'orderperson': 'orderperson',
        'inputperson': 'inputperson',
        'orderqty': 'orderqty',
        'designer': 'designer',
        'includetaxflg': 'includetaxflg',
        'paperid': 'paperid',
        'partsbudget': 'partsbudget',
        '予算': 'partsbudget',
        'pendingflg': 'pendingflg',
        'zaikonum': 'zaikonum',
        'tempcompanyname': 'tempcompanyname',
        'dealingdocmitsumori': 'dealingdocmitsumori',
        'dealingdocseikyu': 'dealingdocseikyu',
        'dealingdocchuumon': 'dealingdocchuumon',
        'dealingdocnouhin': 'dealingdocnouhin',
        'fromamarihin': 'fromamarihin',
        'fromkeihiapp': 'fromkeihiapp',
        'seikyuprice': 'seikyuprice',
        'secondtaxflg': 'secondtaxflg',
        'currency': 'currency',
        'foreigneachprice': 'foreigneachprice',
        'currencyrate': 'currencyrate',
        'foreigntotalprice': 'foreigntotalprice',
        'inquiryid': 'inquiryid',
        'mitsumoridate': 'mitsumoridate',
    };

    let _searchRows = [];

    /* ─── エントリポイント ─── */
    function initCostManualPage() {
        const el = document.getElementById('cost-manual-content');
        if (!el) return;
        el.innerHTML = buildUI();
        _loadSummary();
    }

    /* ─── UI ─── */
    function buildUI() {
        return `
<div style="max-width:960px;margin:0 auto;">
  <!-- タイトル -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
    <i class="fas fa-file-invoice-dollar" style="font-size:28px;color:#6366f1;"></i>
    <div>
      <h2 style="margin:0;font-size:20px;color:#1e293b;">発注・経費データ管理</h2>
      <p style="margin:0;font-size:13px;color:#64748b;">CSVインポート・工事番号別原価集計（外注C / 材料R / 購入P / 経費E）</p>
    </div>
  </div>

  <!-- CSV取込 -->
  <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.06);">
    <div style="font-weight:600;color:#1e293b;margin-bottom:8px;font-size:15px;"><i class="fas fa-file-csv" style="color:#10b981;"></i> CSV一括インポート</div>
    <p style="font-size:12px;color:#64748b;margin:0 0 10px;">
      1行目はヘッダー行として扱います。列名はDBカラム名または日本語（工事番号・発注番号・品名・単価・合計金額 など）に対応。<br>
      <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">purchaseno</code> の頭文字で区分判定（C=外注 / R=材料 / P=購入 / E=経費）
    </p>
    <div id="cm-drop-zone"
         style="border:2px dashed #c7d2fe;border-radius:10px;padding:28px;text-align:center;cursor:pointer;transition:background .2s;color:#6366f1;"
         onclick="document.getElementById('cm-csv-input').click()"
         ondragover="event.preventDefault();this.style.background='#eef2ff';"
         ondragleave="this.style.background='';"
         ondrop="window._cmDrop(event)">
      <i class="fas fa-cloud-upload-alt" style="font-size:28px;margin-bottom:8px;"></i>
      <div style="font-size:14px;font-weight:600;">クリックまたはドラッグ＆ドロップ</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:4px;">.csv ファイルを選択（UTF-8 または Shift-JIS）</div>
    </div>
    <input type="file" id="cm-csv-input" accept=".csv" style="display:none;" onchange="window._cmFileSelect(event)" />
    <div id="cm-csv-preview" style="margin-top:12px;"></div>
  </div>

  <!-- 検索 -->
  <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.06);">
    <div style="font-weight:600;color:#1e293b;margin-bottom:12px;font-size:15px;">工事番号別 原価集計</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input id="cm-q-constructno" class="form-input" placeholder="工事番号" style="width:160px;" />
      <select id="cm-q-div" class="form-input" style="width:140px;">
        <option value="">全区分</option>
        <option value="C">C: 外注加工費</option>
        <option value="R">R: 材料費</option>
        <option value="P">P: 購入部品費</option>
        <option value="E">E: 諸経費</option>
      </select>
      <button onclick="window._cmSearch()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:14px;cursor:pointer;font-weight:600;">
        <i class="fas fa-search"></i> 検索
      </button>
      <button onclick="window._cmClear()" style="background:#f1f5f9;color:#475569;border:none;border-radius:8px;padding:9px 14px;font-size:14px;cursor:pointer;">
        クリア
      </button>
    </div>
    <div id="cm-result" style="margin-top:16px;"></div>
  </div>

  <!-- 件数サマリー -->
  <div id="cm-summary-cards" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;"></div>
</div>`;
    }

    /* ─── サマリー読み込み ─── */
    async function _loadSummary() {
        const sb = window.supabaseClient;
        if (!sb) return;
        // 各区分の合計金額
        const { data, error } = await sb.from(TABLE)
            .select('purchaseno, totalprice')
            .eq('deleteflg', false)
            .eq('cancelflg', false);
        if (error || !data) return;

        const totals = { C: 0, R: 0, P: 0, E: 0, other: 0 };
        data.forEach(r => {
            const div = (r.purchaseno || '').charAt(0).toUpperCase();
            const amt = Number(r.totalprice) || 0;
            if (totals[div] !== undefined) totals[div] += amt;
            else totals[other] += amt;
        });

        const el = document.getElementById('cm-summary-cards');
        if (!el) return;
        const cards = [
            { div: 'C', label: '外注加工費', color: '#6366f1', icon: 'fa-tools' },
            { div: 'R', label: '材料費',     color: '#10b981', icon: 'fa-boxes' },
            { div: 'P', label: '購入部品費', color: '#f59e0b', icon: 'fa-cogs' },
            { div: 'E', label: '諸経費',     color: '#ef4444', icon: 'fa-receipt' },
        ];
        el.innerHTML = cards.map(c => `
<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px 18px;box-shadow:0 1px 4px rgba(0,0,0,.05);">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <div style="width:32px;height:32px;border-radius:8px;background:${c.color}22;display:flex;align-items:center;justify-content:center;">
      <i class="fas ${c.icon}" style="color:${c.color};font-size:14px;"></i>
    </div>
    <div style="font-size:12px;color:#64748b;">${c.label}</div>
  </div>
  <div style="font-size:18px;font-weight:700;color:#1e293b;">¥${Math.round(totals[c.div]).toLocaleString()}</div>
</div>`).join('');
    }

    /* ─── 検索 ─── */
    window._cmSearch = async function () {
        const sb = window.supabaseClient;
        if (!sb) return;
        const constructno = (document.getElementById('cm-q-constructno')?.value || '').trim();
        const div = document.getElementById('cm-q-div')?.value || '';

        const el = document.getElementById('cm-result');
        if (el) el.innerHTML = '<p style="color:#94a3b8;">読み込み中...</p>';

        let q = sb.from(TABLE).select('constructionno, purchaseno, description, qty, eachprice, totalprice, ordercompanycode, deliverydate, kamoku, uchiwake')
            .eq('deleteflg', false)
            .eq('cancelflg', false)
            .order('constructionno')
            .limit(500);

        if (constructno) q = q.ilike('constructionno', `%${constructno}%`);
        if (div) q = q.ilike('purchaseno', `${div}%`);

        const { data, error } = await q;
        if (error) { if (el) el.innerHTML = `<p style="color:#ef4444;">${error.message}</p>`; return; }
        _searchRows = data || [];
        _renderResult(_searchRows);
    };

    window._cmClear = function () {
        document.getElementById('cm-q-constructno').value = '';
        document.getElementById('cm-q-div').value = '';
        document.getElementById('cm-result').innerHTML = '';
    };

    /* ─── 結果描画 ─── */
    function _renderResult(rows) {
        const el = document.getElementById('cm-result');
        if (!el) return;
        if (!rows.length) { el.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">該当データなし</p>'; return; }
        const fmt = v => (v == null || v === '') ? '—' : Number(v).toLocaleString();
        const divLabel = pno => {
            const d = (pno || '').charAt(0).toUpperCase();
            return COST_DIV[d] ? `<span style="background:${divColor(d)};color:#fff;border-radius:4px;padding:1px 7px;font-size:11px;">${d}</span>` : (pno || '');
        };
        const divColor = d => ({ C: '#6366f1', R: '#10b981', P: '#f59e0b', E: '#ef4444' }[d] || '#94a3b8');

        // 工事番号ごとにグループ集計も表示
        const grouped = {};
        rows.forEach(r => {
            const k = r.constructionno || '?';
            if (!grouped[k]) grouped[k] = { C: 0, R: 0, P: 0, E: 0 };
            const d = (r.purchaseno || '').charAt(0).toUpperCase();
            if (grouped[k][d] !== undefined) grouped[k][d] += Number(r.totalprice) || 0;
        });

        const summaryRows = Object.entries(grouped).map(([no, t]) => `
<tr style="border-bottom:1px solid #f1f5f9;background:#fafbff;">
  <td style="padding:7px 10px;font-weight:700;color:#1e293b;">${esc(no)}</td>
  <td style="padding:7px 10px;text-align:right;color:#6366f1;">¥${Math.round(t.C).toLocaleString()}</td>
  <td style="padding:7px 10px;text-align:right;color:#10b981;">¥${Math.round(t.R).toLocaleString()}</td>
  <td style="padding:7px 10px;text-align:right;color:#f59e0b;">¥${Math.round(t.P).toLocaleString()}</td>
  <td style="padding:7px 10px;text-align:right;color:#ef4444;">¥${Math.round(t.E).toLocaleString()}</td>
  <td style="padding:7px 10px;text-align:right;font-weight:700;">¥${Math.round(t.C+t.R+t.P+t.E).toLocaleString()}</td>
</tr>`).join('');

        const detailRows = rows.map(r => `
<tr style="border-bottom:1px solid #f8fafc;">
  <td style="padding:6px 8px;color:#475569;font-size:12px;">${esc(r.constructionno||'')}</td>
  <td style="padding:6px 8px;">${divLabel(r.purchaseno)}</td>
  <td style="padding:6px 8px;font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.description||'')}</td>
  <td style="padding:6px 8px;text-align:right;font-size:12px;">${fmt(r.qty)}</td>
  <td style="padding:6px 8px;text-align:right;font-size:12px;">${fmt(r.eachprice)}</td>
  <td style="padding:6px 8px;text-align:right;font-size:12px;font-weight:600;">¥${fmt(r.totalprice)}</td>
  <td style="padding:6px 8px;font-size:11px;color:#64748b;">${esc(r.ordercompanycode||'')}</td>
</tr>`).join('');

        el.innerHTML = `
<div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:8px;">${rows.length}件</div>

<!-- 工事番号別集計 -->
<div style="margin-bottom:16px;overflow-x:auto;border:1px solid #e2e8f0;border-radius:10px;">
<table style="width:100%;border-collapse:collapse;font-size:13px;">
  <thead style="background:#f8fafc;color:#64748b;font-size:12px;">
    <tr>
      <th style="padding:8px 10px;text-align:left;">工事番号</th>
      <th style="padding:8px 10px;text-align:right;color:#6366f1;">外注加工費</th>
      <th style="padding:8px 10px;text-align:right;color:#10b981;">材料費</th>
      <th style="padding:8px 10px;text-align:right;color:#f59e0b;">購入部品費</th>
      <th style="padding:8px 10px;text-align:right;color:#ef4444;">諸経費</th>
      <th style="padding:8px 10px;text-align:right;">合計</th>
    </tr>
  </thead>
  <tbody>${summaryRows}</tbody>
</table>
</div>

<!-- 明細 -->
<details style="cursor:pointer;">
  <summary style="font-size:13px;color:#6366f1;font-weight:600;margin-bottom:8px;user-select:none;">明細を表示</summary>
  <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:10px;margin-top:8px;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead style="background:#f8fafc;color:#64748b;font-size:12px;">
      <tr>
        <th style="padding:6px 8px;text-align:left;">工事番号</th>
        <th style="padding:6px 8px;text-align:left;">区分</th>
        <th style="padding:6px 8px;text-align:left;">品名</th>
        <th style="padding:6px 8px;text-align:right;">数量</th>
        <th style="padding:6px 8px;text-align:right;">単価</th>
        <th style="padding:6px 8px;text-align:right;">合計</th>
        <th style="padding:6px 8px;text-align:left;">発注先</th>
      </tr>
    </thead>
    <tbody>${detailRows}</tbody>
  </table>
  </div>
</details>`;
    }

    /* ─── CSV: ドロップ ─── */
    window._cmDrop = function (e) {
        e.preventDefault();
        document.getElementById('cm-drop-zone').style.background = '';
        const file = e.dataTransfer.files[0];
        if (file) _readFile(file);
    };

    window._cmFileSelect = function (e) {
        const file = e.target.files[0];
        if (file) _readFile(file);
        e.target.value = '';
    };

    /* ─── ファイル読み込み（UTF-8 → Shift-JIS フォールバック） ─── */
    function _readFile(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            let text = e.target.result;
            // 文字化けチェック（日本語が壊れていたらSJISで再読）
            if (text.includes('�')) {
                const r2 = new FileReader();
                r2.onload = function (e2) { _parseCSV(e2.target.result); };
                r2.readAsText(file, 'Shift-JIS');
            } else {
                _parseCSV(text);
            }
        };
        reader.readAsText(file, 'UTF-8');
    }

    /* ─── CSV解析 ─── */
    function _parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { showMsg('cm-csv-preview', '有効な行がありません', 'error'); return; }

        // ヘッダー解析
        const headers = parseCSVLine(lines[0]).map(h => h.trim());
        const colMap = headers.map(h => HEADER_MAP[h.toLowerCase()] || HEADER_MAP[h] || null);

        const BOOL_COLS = new Set(['taxfreeflg','importtaxflg','orderdone','selectflg','cancelflg','deleteflg','repeatflg','accepttestflg','includetaxflg','pendingflg','dealingdocmitsumori','dealingdocseikyu','dealingdocchuumon','dealingdocnouhin','fromamarihin','fromkeihiapp','secondtaxflg']);
        const NUM_COLS = new Set(['qty','orderqtyint','eachprice','totalprice','reissuetimes','orderqty','partsbudget','zaikonum','seikyuprice','foreigneachprice','currencyrate','foreigntotalprice']);
        const DATE_COLS = new Set(['keydate','outputdate','deliverydate','nounyudate','kensyudate','orderdate','mitsumoridate']);

        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const cells = parseCSVLine(lines[i]);
            const rec = {};
            colMap.forEach((dbCol, ci) => {
                if (!dbCol) return;
                let v = (cells[ci] || '').trim();
                if (v === '') { rec[dbCol] = null; return; }
                if (BOOL_COLS.has(dbCol)) { rec[dbCol] = (v === '1' || v.toLowerCase() === 'true'); return; }
                if (NUM_COLS.has(dbCol)) { const n = Number(v.replace(/[^\d.-]/g, '')); rec[dbCol] = isNaN(n) ? null : n; return; }
                if (DATE_COLS.has(dbCol)) { rec[dbCol] = v || null; return; }
                rec[dbCol] = v;
            });
            if (rec.constructionno || rec.purchaseno) records.push(rec);
        }

        _showCSVPreview(records);
    }

    /* ─── CSVプレビュー ─── */
    function _showCSVPreview(rows) {
        const el = document.getElementById('cm-csv-preview');
        if (!el) return;
        if (!rows.length) { showMsg('cm-csv-preview', '有効な行がありません', 'error'); return; }
        const fmt = v => (v == null) ? '—' : typeof v === 'number' ? v.toLocaleString() : v;

        const preview = rows.slice(0, 10).map(r => `
<tr style="border-bottom:1px solid #f1f5f9;font-size:12px;">
  <td style="padding:4px 8px;">${esc(r.constructionno||'')}</td>
  <td style="padding:4px 8px;">${esc(r.purchaseno||'')}</td>
  <td style="padding:4px 8px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.description||'')}</td>
  <td style="padding:4px 8px;text-align:right;">${fmt(r.totalprice)}</td>
  <td style="padding:4px 8px;">${esc(r.kamoku||'')}</td>
</tr>`).join('');

        el.innerHTML = `
<div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:6px;">${rows.length}行 読み込み（先頭10行プレビュー）</div>
<div style="overflow-x:auto;max-height:200px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;">
<table style="width:100%;border-collapse:collapse;">
  <thead style="background:#f8fafc;color:#64748b;font-size:11px;position:sticky;top:0;">
    <tr>
      <th style="padding:5px 8px;text-align:left;">工事番号</th>
      <th style="padding:5px 8px;text-align:left;">発注番号</th>
      <th style="padding:5px 8px;text-align:left;">品名</th>
      <th style="padding:5px 8px;text-align:right;">合計金額</th>
      <th style="padding:5px 8px;text-align:left;">科目</th>
    </tr>
  </thead>
  <tbody>${preview}</tbody>
</table>
</div>
<button onclick="window._cmImport()" style="background:#10b981;color:#fff;border:none;border-radius:8px;padding:9px 20px;font-size:14px;cursor:pointer;font-weight:600;">
  <i class="fas fa-database"></i> ${rows.length}件をインポート
</button>
<button onclick="document.getElementById('cm-csv-preview').innerHTML=''" style="background:#f1f5f9;color:#475569;border:none;border-radius:8px;padding:9px 14px;font-size:14px;cursor:pointer;margin-left:8px;">
  キャンセル
</button>`;

        el._pendingRows = rows;
    }

    /* ─── インポート実行 ─── */
    window._cmImport = async function () {
        const el = document.getElementById('cm-csv-preview');
        if (!el || !el._pendingRows) return;
        const rows = el._pendingRows;
        const sb = window.supabaseClient;
        if (!sb) { alert('DB未接続'); return; }

        // バッチ分割（Supabaseは一度に1000件まで推奨）
        const BATCH = 500;
        let inserted = 0;
        for (let i = 0; i < rows.length; i += BATCH) {
            const batch = rows.slice(i, i + BATCH);
            const { error } = await sb.from(TABLE).insert(batch);
            if (error) { alert(`インポートエラー (${i}行目〜): ${error.message}`); return; }
            inserted += batch.length;
        }

        el.innerHTML = `<p style="color:#10b981;font-weight:600;"><i class="fas fa-check-circle"></i> ${inserted}件インポート完了</p>`;
        _loadSummary();
    };

    /* ─── ユーティリティ ─── */
    function parseCSVLine(line) {
        const result = [];
        let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { inQ = !inQ; continue; }
            if (c === ',' && !inQ) { result.push(cur); cur = ''; continue; }
            cur += c;
        }
        result.push(cur);
        return result;
    }

    function showMsg(id, msg, type) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<p style="color:${type === 'error' ? '#ef4444' : '#10b981'};">${msg}</p>`;
    }

    function esc(s) {
        return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    window.initCostManualPage = initCostManualPage;

})();
