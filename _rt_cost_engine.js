
// ════════════════════════════════════════════════════════════════
// 原価集計 リアルタイム版 (夜間バッチテーブル不要)
// Source: t_acceptorder / t_purchaseparts / t_sagyofl
// ════════════════════════════════════════════════════════════════

// ── リアルタイムデータ取得 ────────────────────────────────────
async function _csRtFetch(q, filters) {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const setStatus = (msg) => {
        const el = document.getElementById('cs-status');
        if (el) el.innerHTML = msg;
    };

    // 1. t_acceptorder から工事番号・受注金額・工事名を取得
    setStatus('<i class="fas fa-spinner fa-spin"></i> 工事番号を検索中...');
    let acceptOrders = [];
    let constructNos = [];
    try {
        let aoQ = sb.from('t_acceptorder')
            .select('constructno,constructionname,customername,OrderPrice,orderprice,Uriagekin,uriagekin')
            .limit(300);
        if (q) {
            const qe = q.replace(/'/g, "''");
            aoQ = aoQ.or(
                `constructno.ilike.%${qe}%,constructionname.ilike.%${qe}%,customername.ilike.%${qe}%`
            );
        }
        if (filters && filters.constructno) {
            aoQ = aoQ.eq('constructno', filters.constructno);
        }
        const { data } = await aoQ;
        acceptOrders = data || [];
        constructNos = [...new Set(acceptOrders.map(r => r.constructno).filter(Boolean))];
    } catch (e) {
        console.warn('[原価集計] t_acceptorder 取得失敗:', e);
    }

    // クエリが工事番号そのものの場合に直接も試す
    if (constructNos.length === 0 && q && (!filters || !filters.constructno)) {
        constructNos = [q];
    }
    if (constructNos.length === 0) {
        return { purchaseParts: [], worktime: [], acceptOrders: [] };
    }

    // 2. t_purchaseparts から発注部品を取得（キャンセル除外）
    setStatus(`<i class="fas fa-spinner fa-spin"></i> 発注部品データを取得中 (${constructNos.length}件の工事)...`);
    let purchaseParts = [];
    try {
        const cns = constructNos.slice(0, 50);
        const { data } = await sb.from('t_purchaseparts')
            .select('construction_no,symbol_machine,symbol_unit,consecutive_no,description,order_div,each_price,qty,cancel_flg,betsu_seisaku_flg')
            .in('construction_no', cns)
            .limit(20000);
        purchaseParts = (data || []).filter(r => !r.cancel_flg);
    } catch (e) {
        console.warn('[原価集計] t_purchaseparts 取得失敗:', e);
    }

    // 3. t_sagyofl から作業時間を取得
    setStatus('<i class="fas fa-spinner fa-spin"></i> 作業時間データを取得中...');
    let worktime = [];
    try {
        const cns = constructNos.slice(0, 50);
        const { data } = await sb.from('t_sagyofl')
            .select('kojino,zuban,stime,scode,jugyo')
            .in('kojino', cns)
            .limit(10000);
        worktime = data || [];
    } catch (e) {
        console.warn('[原価集計] t_sagyofl 取得失敗:', e);
    }

    return { purchaseParts, worktime, acceptOrders };
}

// ── リアルタイム集計エンジン ──────────────────────────────────
function _csAggregate(rawData, level, filters) {
    if (!rawData) return [];
    const { purchaseParts = [], worktime = [], acceptOrders = [] } = rawData;

    // 受注情報マップ (constructno → row)
    const aoMap = {};
    acceptOrders.forEach(ao => { if (ao.constructno) aoMap[ao.constructno] = ao; });

    // ドリルダウンフィルタ適用
    let parts = purchaseParts;
    let wt    = worktime;
    if (filters && filters.constructno) {
        parts = parts.filter(r => r.construction_no === filters.constructno);
        wt    = wt.filter(r => r.kojino === filters.constructno);
    }
    if (filters && filters.machine) {
        parts = parts.filter(r => (r.symbol_machine || '') === filters.machine);
    }
    if (filters && filters.unit) {
        parts = parts.filter(r => (r.symbol_unit || '') === filters.unit);
    }

    // グループキー生成
    const makeKey = (r) => {
        const cn = r.construction_no || '';
        const mc = r.symbol_machine  || '';
        const uc = r.symbol_unit     || '';
        const dr = r.consecutive_no  || '';
        if (level === 'construct') return cn;
        if (level === 'machine')   return `${cn}||${mc}`;
        if (level === 'unit')      return `${cn}||${mc}||${uc}`;
        return `${cn}||${mc}||${uc}||${dr}`;
    };

    const groups = {};
    parts.forEach(r => {
        const key = makeKey(r);
        if (!groups[key]) {
            const ao = aoMap[r.construction_no] || {};
            groups[key] = {
                constructno:        r.construction_no || '',
                machine:            r.symbol_machine  || '',
                unit:               r.symbol_unit     || '',
                drawingno:          r.consecutive_no  || '',
                name:               r.description     || '',
                _constructionname:  ao.constructionname || '',
                _customername:      ao.customername    || '',
                sales:    Number(ao.OrderPrice || ao.orderprice || ao.Uriagekin || ao.uriagekin || 0),
                purchased: 0, outsource: 0, material: 0, misc: 0, internal: 0
            };
        }
        const cost = Number(r.each_price || 0) * Number(r.qty || 1);
        const div  = String(r.order_div || '').toUpperCase().trim();
        if      (div === 'P' || div === 'A') groups[key].purchased += cost;
        else if (div === 'C')                groups[key].outsource += cost;
        else if (div === 'R')                groups[key].material  += cost;
        else                                 groups[key].misc      += cost;
    });

    // 工数合算（工事番号レベルのみ）
    if (level === 'construct') {
        wt.forEach(r => {
            const cn = r.kojino || '';
            if (groups[cn]) groups[cn].internal += Number(r.stime || 0);
        });
    }

    return Object.values(groups).sort((a, b) =>
        String(a.constructno).localeCompare(String(b.constructno))
    );
}

// ── runCostSummarySearch オーバーライド ──────────────────────
async function runCostSummarySearch() {
    const st = window._cs;
    if (!st) return;

    const qEl = document.getElementById('cs-query');
    st.query = (qEl && qEl.value != null) ? qEl.value.trim() : (st.query || '');
    if (!st.filters) st.filters = { constructno: '', machine: '', unit: '' };

    const status = document.getElementById('cs-status');

    try {
        st.rawData = await _csRtFetch(st.query, st.filters);
    } catch (e) {
        if (status) status.textContent = 'データ取得エラー: ' + (e.message || e);
        return;
    }

    Object.keys(COST_SUMMARY_LEVELS).forEach(lv => {
        st.results[lv] = _csAggregate(st.rawData, lv, st.filters);
    });

    updateCostSummaryCounts();
    renderCostSummaryBreadcrumb();
    renderCostSummaryTable(st.level || 'construct');

    const cnt   = (st.results[st.level] || []).length;
    const ppCnt = (st.rawData && st.rawData.purchaseParts) ? st.rawData.purchaseParts.length : 0;
    const wtCnt = (st.rawData && st.rawData.worktime)      ? st.rawData.worktime.length      : 0;
    if (status) status.textContent =
        (st.query ? `「${st.query}」` : '') +
        `${cnt}件 ／ 発注部品:${ppCnt}件, 作業時間:${wtCnt}件`;
}

// ── renderCostSummaryTable オーバーライド（工事名サブ表示付き） ──
function renderCostSummaryTable(level) {
    const st = window._cs;
    if (!st) return;
    const rows  = st.results[level] || [];
    const tbody = document.getElementById('cs-tbody');
    const thead = document.getElementById('cs-thead');
    if (!tbody || !thead) return;

    const isConstruct = (level === 'construct');
    thead.innerHTML = `
        <tr>
            <th>${escapeHtml(COST_SUMMARY_LEVELS[level].label)}</th>
            <th style="text-align:right;">売上</th>
            <th style="text-align:right;">原価合計</th>
            <th style="text-align:right;">利益</th>
            <th style="text-align:right;">利益率</th>
            <th style="text-align:right;">購入</th>
            <th style="text-align:right;">外注</th>
            <th style="text-align:right;">材料</th>
            <th style="text-align:right;">諸経費</th>
            <th style="text-align:right;">${isConstruct ? '工数(h)' : '社内'}</th>
        </tr>
    `;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="cs-empty">該当データはありません</td></tr>';
        return;
    }

    const drillTo = COST_SUMMARY_LEVELS[level].drillTo;
    tbody.innerHTML = rows.slice(0, 300).map((r, idx) => {
        const key       = buildCostKey(level, r);
        const costs     = buildCostCells(r);
        const costTotal = costs.purchased + costs.outsource + costs.material + costs.misc;
        const profit    = costs.sales ? (costs.sales - costTotal) : 0;
        const pRate     = costs.sales ? (profit / costs.sales * 100) : 0;
        const subLine   = (isConstruct && r._constructionname)
            ? `<br><small style="color:#93c5fd;font-size:10px;font-weight:400;">${escapeHtml(r._constructionname)}</small>`
            : '';
        const cls = drillTo ? 'cs-row cs-row-clickable' : 'cs-row';
        return `
            <tr class="${cls}" data-level="${level}" data-index="${idx}" ${drillTo ? 'title="クリックで下位へ"' : ''}>
                <td class="cs-key">${escapeHtml(String(key))}${subLine}</td>
                <td class="cs-num">${csMoney(costs.sales)}</td>
                <td class="cs-num">${csMoney(costTotal)}</td>
                <td class="cs-num ${profit < 0 ? 'cs-neg' : ''}">${costs.sales ? csMoney(profit) : ''}</td>
                <td class="cs-num ${pRate < 0 ? 'cs-neg' : ''}">${costs.sales ? csPct(pRate) : ''}</td>
                <td class="cs-num">${csMoney(costs.purchased)}</td>
                <td class="cs-num">${csMoney(costs.outsource)}</td>
                <td class="cs-num">${csMoney(costs.material)}</td>
                <td class="cs-num">${csMoney(costs.misc)}</td>
                <td class="cs-num">${isConstruct ? r.internal.toFixed(1) : ''}</td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.cs-row-clickable').forEach(tr => {
        tr.onclick = () => {
            const lv  = tr.getAttribute('data-level');
            const i   = Number(tr.getAttribute('data-index'));
            const row = (st.results[lv] || [])[i];
            if (row) drillDownCostSummary(lv, row);
        };
    });
}

// ── drillDownCostSummary オーバーライド（rawData再利用） ──────
function drillDownCostSummary(level, row) {
    const st = window._cs;
    if (!st) return;
    const next = COST_SUMMARY_LEVELS[level] ? COST_SUMMARY_LEVELS[level].drillTo : null;
    if (!next) return;

    if (level === 'construct') {
        st.filters.constructno = String(row.constructno || '').trim();
        st.filters.machine = '';
        st.filters.unit = '';
    } else if (level === 'machine') {
        st.filters.constructno = String(row.constructno || st.filters.constructno || '').trim();
        st.filters.machine = String(row.machine || '').trim();
        st.filters.unit = '';
    } else if (level === 'unit') {
        st.filters.constructno = String(row.constructno || st.filters.constructno || '').trim();
        st.filters.machine = String(row.machine || st.filters.machine || '').trim();
        st.filters.unit = String(row.unit || '').trim();
    }

    // rawDataが既にある場合は再フェッチ不要 → 再集計のみ
    Object.keys(COST_SUMMARY_LEVELS).forEach(lv => {
        st.results[lv] = _csAggregate(st.rawData, lv, st.filters);
    });

    updateCostSummaryCounts();
    renderCostSummaryBreadcrumb();
    setCostSummaryLevel(next);

    const status = document.getElementById('cs-status');
    if (status) status.textContent =
        st.filters.constructno +
        (st.filters.machine ? ' / ' + st.filters.machine : '') +
        (st.filters.unit    ? ' / ' + st.filters.unit    : '');
}

console.log('[Polaris] リアルタイム原価集計エンジン 読み込み完了');
