(function () {
    'use strict';

    /* ─── 定数 ─── */
    const TABLE = 't_cost_manual';
    const COLS = [
        { key: 'constructno', label: '工事番号', type: 'text' },
        { key: 'outsource',   label: '外注加工費', type: 'number' },
        { key: 'material',    label: '材料費',     type: 'number' },
        { key: 'purchase',    label: '購入部品費',  type: 'number' },
        { key: 'misc',        label: '諸経費',     type: 'number' },
        { key: 'budget',      label: '予算',       type: 'number' },
        { key: 'note',        label: '備考',       type: 'text' },
    ];

    let _rows = [];         // 表示中レコード一覧
    let _editId = null;     // 編集中レコードID

    /* ─── エントリポイント ─── */
    function initCostManualPage() {
        const el = document.getElementById('cost-manual-content');
        if (!el) return;
        el.innerHTML = buildUI();
        _loadList();
    }

    /* ─── UI ─── */
    function buildUI() {
        return `
<div style="max-width:900px;margin:0 auto;">
  <!-- タイトル -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
    <i class="fas fa-file-invoice-dollar" style="font-size:28px;color:#6366f1;"></i>
    <div>
      <h2 style="margin:0;font-size:20px;color:#1e293b;">原価手入力</h2>
      <p style="margin:0;font-size:13px;color:#64748b;">外注加工費・材料費・購入部品費・諸経費・予算を工事番号ごとに登録</p>
    </div>
  </div>

  <!-- 入力フォーム -->
  <div id="cm-form-card" style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:24px;box-shadow:0 1px 4px rgba(0,0,0,.06);">
    <div style="font-weight:600;color:#1e293b;margin-bottom:14px;font-size:15px;" id="cm-form-title">新規登録</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 16px;">
      <div>
        <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">工事番号 *</label>
        <input id="cm-constructno" class="form-input" style="width:100%;" placeholder="例: 25001" />
      </div>
      <div>
        <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">外注加工費（円）</label>
        <input id="cm-outsource" class="form-input" type="number" style="width:100%;" placeholder="0" />
      </div>
      <div>
        <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">材料費（円）</label>
        <input id="cm-material" class="form-input" type="number" style="width:100%;" placeholder="0" />
      </div>
      <div>
        <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">購入部品費（円）</label>
        <input id="cm-purchase" class="form-input" type="number" style="width:100%;" placeholder="0" />
      </div>
      <div>
        <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">諸経費（円）</label>
        <input id="cm-misc" class="form-input" type="number" style="width:100%;" placeholder="0" />
      </div>
      <div>
        <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">予算（円）</label>
        <input id="cm-budget" class="form-input" type="number" style="width:100%;" placeholder="0" />
      </div>
      <div style="grid-column:1/-1;">
        <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">備考</label>
        <input id="cm-note" class="form-input" style="width:100%;" placeholder="任意メモ" />
      </div>
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;">
      <button onclick="window._cmSave()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:9px 20px;font-size:14px;cursor:pointer;font-weight:600;">
        <i class="fas fa-save"></i> 保存
      </button>
      <button onclick="window._cmCancelEdit()" id="cm-cancel-btn" style="display:none;background:#f1f5f9;color:#475569;border:none;border-radius:8px;padding:9px 16px;font-size:14px;cursor:pointer;">
        キャンセル
      </button>
    </div>
  </div>

  <!-- CSV取込 -->
  <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:24px;box-shadow:0 1px 4px rgba(0,0,0,.06);">
    <div style="font-weight:600;color:#1e293b;margin-bottom:10px;font-size:15px;"><i class="fas fa-file-csv" style="color:#10b981;"></i> CSV一括取込</div>
    <p style="font-size:12px;color:#64748b;margin:0 0 10px;">列順: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">工事番号,外注加工費,材料費,購入部品費,諸経費,予算,備考</code>（1行目はヘッダー可）</p>
    <div id="cm-drop-zone"
         style="border:2px dashed #c7d2fe;border-radius:10px;padding:28px;text-align:center;cursor:pointer;transition:background .2s;color:#6366f1;"
         onclick="document.getElementById('cm-csv-input').click()"
         ondragover="event.preventDefault();this.style.background='#eef2ff';"
         ondragleave="this.style.background='';"
         ondrop="window._cmDrop(event)">
      <i class="fas fa-cloud-upload-alt" style="font-size:28px;margin-bottom:8px;"></i>
      <div style="font-size:14px;font-weight:600;">クリックまたはドラッグ＆ドロップ</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:4px;">.csv ファイルを選択</div>
    </div>
    <input type="file" id="cm-csv-input" accept=".csv" style="display:none;" onchange="window._cmFileSelect(event)" />
    <div id="cm-csv-preview" style="margin-top:12px;"></div>
  </div>

  <!-- 一覧 -->
  <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,.06);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div style="font-weight:600;color:#1e293b;font-size:15px;">登録済み一覧</div>
      <input id="cm-search" class="form-input" placeholder="工事番号で絞り込み" style="width:200px;" oninput="window._cmFilter()" />
    </div>
    <div id="cm-list" style="overflow-x:auto;"></div>
  </div>
</div>`;
    }

    /* ─── DB読み込み ─── */
    async function _loadList() {
        const sb = window.supabaseClient;
        if (!sb) return;
        const { data, error } = await sb.from(TABLE).select('*').order('updated_at', { ascending: false });
        if (error) { console.error(error); return; }
        _rows = data || [];
        _renderList(_rows);
    }

    /* ─── 一覧描画 ─── */
    function _renderList(rows) {
        const el = document.getElementById('cm-list');
        if (!el) return;
        if (!rows.length) {
            el.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:24px 0;">登録なし</p>';
            return;
        }
        const fmt = v => (v == null || v === '') ? '—' : Number(v).toLocaleString();
        const rows_html = rows.map(r => `
<tr style="border-bottom:1px solid #f1f5f9;">
  <td style="padding:8px 10px;font-weight:600;color:#1e293b;">${esc(r.constructno)}</td>
  <td style="padding:8px 10px;text-align:right;">${fmt(r.outsource)}</td>
  <td style="padding:8px 10px;text-align:right;">${fmt(r.material)}</td>
  <td style="padding:8px 10px;text-align:right;">${fmt(r.purchase)}</td>
  <td style="padding:8px 10px;text-align:right;">${fmt(r.misc)}</td>
  <td style="padding:8px 10px;text-align:right;">${fmt(r.budget)}</td>
  <td style="padding:8px 10px;color:#64748b;font-size:12px;">${esc(r.note||'')}</td>
  <td style="padding:8px 6px;white-space:nowrap;">
    <button onclick="window._cmEdit(${r.id})" style="background:#eef2ff;color:#6366f1;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;margin-right:4px;">編集</button>
    <button onclick="window._cmDelete(${r.id})" style="background:#fee2e2;color:#ef4444;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;">削除</button>
  </td>
</tr>`).join('');
        el.innerHTML = `
<table style="width:100%;border-collapse:collapse;font-size:13px;">
  <thead>
    <tr style="background:#f8fafc;color:#64748b;font-size:12px;">
      <th style="padding:8px 10px;text-align:left;">工事番号</th>
      <th style="padding:8px 10px;text-align:right;">外注加工費</th>
      <th style="padding:8px 10px;text-align:right;">材料費</th>
      <th style="padding:8px 10px;text-align:right;">購入部品費</th>
      <th style="padding:8px 10px;text-align:right;">諸経費</th>
      <th style="padding:8px 10px;text-align:right;">予算</th>
      <th style="padding:8px 10px;text-align:left;">備考</th>
      <th style="padding:8px 6px;"></th>
    </tr>
  </thead>
  <tbody>${rows_html}</tbody>
</table>`;
    }

    /* ─── 絞り込み ─── */
    window._cmFilter = function () {
        const q = (document.getElementById('cm-search')?.value || '').trim().toLowerCase();
        const filtered = q ? _rows.filter(r => (r.constructno || '').toLowerCase().includes(q)) : _rows;
        _renderList(filtered);
    };

    /* ─── 保存 ─── */
    window._cmSave = async function () {
        const sb = window.supabaseClient;
        if (!sb) { alert('DB未接続'); return; }
        const constructno = (document.getElementById('cm-constructno')?.value || '').trim();
        if (!constructno) { alert('工事番号を入力してください'); return; }
        const rec = {
            constructno,
            outsource: numOrNull('cm-outsource'),
            material:  numOrNull('cm-material'),
            purchase:  numOrNull('cm-purchase'),
            misc:      numOrNull('cm-misc'),
            budget:    numOrNull('cm-budget'),
            note:      (document.getElementById('cm-note')?.value || '').trim() || null,
            updated_at: new Date().toISOString(),
        };
        let error;
        if (_editId) {
            ({ error } = await sb.from(TABLE).update(rec).eq('id', _editId));
        } else {
            ({ error } = await sb.from(TABLE).insert(rec));
        }
        if (error) { alert('保存失敗: ' + error.message); return; }
        _clearForm();
        await _loadList();
    };

    /* ─── 編集 ─── */
    window._cmEdit = function (id) {
        const r = _rows.find(x => x.id === id);
        if (!r) return;
        _editId = id;
        setVal('cm-constructno', r.constructno);
        setVal('cm-outsource', r.outsource ?? '');
        setVal('cm-material',  r.material  ?? '');
        setVal('cm-purchase',  r.purchase  ?? '');
        setVal('cm-misc',      r.misc      ?? '');
        setVal('cm-budget',    r.budget    ?? '');
        setVal('cm-note',      r.note      ?? '');
        const t = document.getElementById('cm-form-title');
        if (t) t.textContent = `編集中: ${r.constructno}`;
        const btn = document.getElementById('cm-cancel-btn');
        if (btn) btn.style.display = '';
        document.getElementById('cm-form-card')?.scrollIntoView({ behavior: 'smooth' });
    };

    /* ─── キャンセル ─── */
    window._cmCancelEdit = function () { _clearForm(); };

    /* ─── 削除 ─── */
    window._cmDelete = async function (id) {
        if (!confirm('このレコードを削除しますか？')) return;
        const sb = window.supabaseClient;
        const { error } = await sb.from(TABLE).delete().eq('id', id);
        if (error) { alert('削除失敗: ' + error.message); return; }
        await _loadList();
    };

    /* ─── CSV: ドロップ ─── */
    window._cmDrop = function (e) {
        e.preventDefault();
        document.getElementById('cm-drop-zone').style.background = '';
        const file = e.dataTransfer.files[0];
        if (file) _parseCSV(file);
    };

    /* ─── CSV: ファイル選択 ─── */
    window._cmFileSelect = function (e) {
        const file = e.target.files[0];
        if (file) _parseCSV(file);
        e.target.value = '';
    };

    /* ─── CSV解析 ─── */
    function _parseCSV(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).filter(l => l.trim());
            if (!lines.length) return;

            // ヘッダー行スキップ判定（1列目が数字でなければヘッダーとみなす）
            let startIdx = 0;
            const firstCell = lines[0].split(',')[0].trim();
            if (isNaN(firstCell) && firstCell !== '') startIdx = 1;

            const parsed = [];
            for (let i = startIdx; i < lines.length; i++) {
                const cols = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                if (!cols[0]) continue;
                parsed.push({
                    constructno: cols[0] || '',
                    outsource:   toNumOrNull(cols[1]),
                    material:    toNumOrNull(cols[2]),
                    purchase:    toNumOrNull(cols[3]),
                    misc:        toNumOrNull(cols[4]),
                    budget:      toNumOrNull(cols[5]),
                    note:        cols[6] || null,
                });
            }
            _showCSVPreview(parsed);
        };
        reader.readAsText(file, 'UTF-8');
    }

    /* ─── CSVプレビュー ─── */
    function _showCSVPreview(rows) {
        const el = document.getElementById('cm-csv-preview');
        if (!el) return;
        if (!rows.length) { el.innerHTML = '<p style="color:#ef4444;">有効な行がありません</p>'; return; }
        const fmt = v => (v == null) ? '—' : Number(v).toLocaleString();
        const trs = rows.map((r, i) => `
<tr style="border-bottom:1px solid #f1f5f9;">
  <td style="padding:5px 8px;">${esc(r.constructno)}</td>
  <td style="padding:5px 8px;text-align:right;">${fmt(r.outsource)}</td>
  <td style="padding:5px 8px;text-align:right;">${fmt(r.material)}</td>
  <td style="padding:5px 8px;text-align:right;">${fmt(r.purchase)}</td>
  <td style="padding:5px 8px;text-align:right;">${fmt(r.misc)}</td>
  <td style="padding:5px 8px;text-align:right;">${fmt(r.budget)}</td>
  <td style="padding:5px 8px;font-size:11px;color:#64748b;">${esc(r.note||'')}</td>
</tr>`).join('');
        el.innerHTML = `
<div style="font-size:13px;color:#1e293b;margin-bottom:8px;font-weight:600;">${rows.length}行 プレビュー</div>
<div style="overflow-x:auto;max-height:220px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;">
<table style="width:100%;border-collapse:collapse;font-size:12px;">
  <thead style="position:sticky;top:0;background:#f8fafc;color:#64748b;">
    <tr>
      <th style="padding:6px 8px;text-align:left;">工事番号</th>
      <th style="padding:6px 8px;text-align:right;">外注加工費</th>
      <th style="padding:6px 8px;text-align:right;">材料費</th>
      <th style="padding:6px 8px;text-align:right;">購入部品費</th>
      <th style="padding:6px 8px;text-align:right;">諸経費</th>
      <th style="padding:6px 8px;text-align:right;">予算</th>
      <th style="padding:6px 8px;text-align:left;">備考</th>
    </tr>
  </thead>
  <tbody>${trs}</tbody>
</table>
</div>
<button onclick="window._cmImport()" style="background:#10b981;color:#fff;border:none;border-radius:8px;padding:9px 20px;font-size:14px;cursor:pointer;font-weight:600;">
  <i class="fas fa-database"></i> ${rows.length}件をインポート
</button>
<button onclick="document.getElementById('cm-csv-preview').innerHTML=''" style="background:#f1f5f9;color:#475569;border:none;border-radius:8px;padding:9px 14px;font-size:14px;cursor:pointer;margin-left:8px;">
  キャンセル
</button>`;

        // プレビューデータをクロージャ外で保持
        el._pendingRows = rows;
    }

    /* ─── CSVインポート実行 ─── */
    window._cmImport = async function () {
        const el = document.getElementById('cm-csv-preview');
        if (!el || !el._pendingRows) return;
        const rows = el._pendingRows;
        const sb = window.supabaseClient;
        if (!sb) { alert('DB未接続'); return; }

        const now = new Date().toISOString();
        const records = rows.map(r => ({ ...r, updated_at: now }));

        // upsert: 工事番号をユニークキーとして上書き
        const { error } = await sb.from(TABLE).upsert(records, { onConflict: 'constructno' });
        if (error) { alert('インポート失敗: ' + error.message); return; }

        el.innerHTML = `<p style="color:#10b981;font-weight:600;"><i class="fas fa-check-circle"></i> ${rows.length}件インポート完了</p>`;
        await _loadList();
    };

    /* ─── ユーティリティ ─── */
    function _clearForm() {
        _editId = null;
        ['cm-constructno','cm-outsource','cm-material','cm-purchase','cm-misc','cm-budget','cm-note']
            .forEach(id => setVal(id, ''));
        const t = document.getElementById('cm-form-title');
        if (t) t.textContent = '新規登録';
        const btn = document.getElementById('cm-cancel-btn');
        if (btn) btn.style.display = 'none';
    }
    function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
    function numOrNull(id) {
        const v = document.getElementById(id)?.value;
        if (v === '' || v == null) return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
    }
    function toNumOrNull(s) {
        if (!s || s.trim() === '') return null;
        const n = Number(s.replace(/[^\d.-]/g, ''));
        return isNaN(n) ? null : n;
    }
    function esc(s) {
        return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /* ─── expose ─── */
    window.initCostManualPage = initCostManualPage;

})();
