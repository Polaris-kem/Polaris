// 図面番号採番システム（Supabase直接接続版）
//
// === 運用ルール（資料に基づく） ===
// ・必須入力: 工事番号、採番者名、採番日、機種記号の4項目
// ・図面番号(drawingno): 10文字以上、6文字目に「i」「o」は使用不可、重複登録不可
// ・工事チェック: 工事番号がDBに存在し、完了(finisheddateが未入力)であること
// ・図面分類: 8文字目または9文字目で判別
//    部品図: /, a, b, n  ／  組図(ユニット図): u, r, l
// ・自動連番: 9の次はa,b... だが「i」「o」はスキップ
//
// === 使用テーブル・カラム（すべて小文字で紐づけ） ===
// kemmaster: t_saiban(drawingno, description, orderno, material, materialweight, finishedweight,
//   history1～history10, designer, saibandate, keydate),
//   t_machinemarkforsaiban(machinemark, machinename),
//   t_staffcode(staffcode, staffname, loginid, depacode, ...),
//   t_computerdevice(tcpip, staffcode, staffname, depacode, workdepa, loginid, ...)
// kemorder: t_acceptorder(constructno, cancelflg, finisheddate, registerdate, ...)

// t_saiban テーブル名を解決（紐づけはここで統一）
async function getSaibanTableName() {
    const findTable = typeof findTableName === 'function' ? findTableName : (typeof window !== 'undefined' && window.findTableName);
    if (typeof findTable !== 'function') return null;
    return await findTable(['t_saiban', 'T_Saiban', 't_Saiban', 'saiban', 't saiban']);
}

// 図面番号採番ページの初期化
async function initializeDrawingNumberPage() {
    console.log('図面番号採番ページを初期化します');
    
    setupDrawingTypeButtons();
    await loadDesigners();
    await loadMachineMarksFromSaiban();
    setupMachineCodeComboOnClick();
    
    const saibanDateInput = document.getElementById('saiban-date-input');
    if (saibanDateInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        saibanDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    await loadDrawingList();
}

// 図面種類：部品図／組立図をボタンで選択（従来の図番台帳登録と同じUI）
function setupDrawingTypeButtons() {
    const hiddenInput = document.getElementById('drawing-type-select');
    const buttons = document.querySelectorAll('.drawing-number-type-btn');
    if (!hiddenInput || !buttons.length) return;
    buttons.forEach(btn => {
        btn.addEventListener('click', function () {
            const value = this.getAttribute('data-type') || '';
            hiddenInput.value = value;
            buttons.forEach(b => {
                const pressed = b === this;
                b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
                b.classList.toggle('selected', pressed);
            });
        });
    });
}

// 機種記号コンボ：クリック時に t_machinemarkforsaiban から一覧を読み込み、手入力は大文字変換＋DB存在チェック
function setupMachineCodeComboOnClick() {
    const inputEl = document.getElementById('machine-code-input');
    const datalistEl = document.getElementById('machine-mark-datalist');
    const nameEl = document.getElementById('machine-name-display');
    if (!inputEl || !datalistEl) return;
    
    window._machineMarkNameMap = window._machineMarkNameMap || {};
    
    inputEl.addEventListener('input', function () {
        this.value = this.value.toUpperCase();
        const name = window._machineMarkNameMap[this.value.trim()];
        if (nameEl) nameEl.textContent = name || '';
        if (window._drawingListInputTimer) clearTimeout(window._drawingListInputTimer);
        window._drawingListInputTimer = setTimeout(function () { loadDrawingList(); }, 400);
    });
    
    inputEl.addEventListener('blur', async function () {
        const v = this.value.trim().toUpperCase();
        if (v) this.value = v;
        if (!v) {
            if (nameEl) nameEl.textContent = '';
            await loadDrawingList();
            return;
        }
        if (window._machineMarkNameMap[v]) {
            if (nameEl) nameEl.textContent = window._machineMarkNameMap[v] || '';
        } else {
            const exists = await checkMachineCodeExists(v);
            if (nameEl) nameEl.textContent = exists ? '（DBに登録済み）' : '（DBに未登録の記号です）';
            if (!exists && nameEl) nameEl.style.color = 'var(--error, #dc2626)';
            else if (nameEl) nameEl.style.color = '';
        }
        await loadDrawingList();
    });
}

// クリック時に呼ばれる：t_machinemarkforsaiban から全件取得し datalist と機種名マップを更新
async function loadMachineMarksFromSaiban() {
    const inputEl = document.getElementById('machine-code-input');
    const datalistEl = document.getElementById('machine-mark-datalist');
    const nameEl = document.getElementById('machine-name-display');
    if (!datalistEl) return;
    const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : (window.getSupabaseClient && window.getSupabaseClient());
    if (!supabase) {
        console.warn('loadMachineMarksFromSaiban: Supabase未接続');
        return;
    }
    try {
        const findTable = typeof findTableName === 'function' ? findTableName : window.findTableName;
        const tableName = typeof findTable === 'function'
            ? await findTable(['t_machinemarkforsaiban', 'T_MachineMarkForSaiban', 't machinemarkforsaiban'])
            : null;
        if (!tableName) {
            console.warn('t_machinemarkforsaiban が見つかりません');
            return;
        }
        
        const { data, error } = await supabase
            .from(tableName)
            .select('machinemark, machinename')
            .order('machinemark');
        
        let rows = data;
        if (error || !rows || rows.length === 0) {
            const alt = await supabase.from(tableName).select('*').order('machinemark');
            rows = alt.error ? null : alt.data;
        }
        
        datalistEl.innerHTML = '';
        window._machineMarkNameMap = {};
        
        if (rows && rows.length > 0) {
            rows.forEach(row => {
                const mark = (row.machinemark || row.MachineMark || '').toString().trim().toUpperCase();
                const name = (row.machinename || row.MachineName || '').toString().trim();
                if (mark) {
                    const opt = document.createElement('option');
                    opt.value = mark;
                    opt.textContent = name ? `${mark} - ${name}` : mark;
                    datalistEl.appendChild(opt);
                    window._machineMarkNameMap[mark] = name;
                }
            });
            console.log('機種記号を t_machinemarkforsaiban から読み込みました（クリック時）:', rows.length, '件');
        }
        
        if (inputEl && inputEl.value.trim()) {
            const v = inputEl.value.trim().toUpperCase();
            const name = window._machineMarkNameMap[v];
            if (nameEl) nameEl.textContent = name || '';
        }
    } catch (err) {
        console.error('機種記号リストの読み込みエラー:', err);
    }
}

// 採番者リストを読み込む（t_computerdevice のみから取得。DepaCode='325'または'320'を表示）
async function loadDesigners() {
    const designerSelect = document.getElementById('designer-select');
    if (!designerSelect) return;
    const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : (window.getSupabaseClient && window.getSupabaseClient());
    if (!supabase) {
        designerSelect.innerHTML = '<option value="">DB未接続</option>';
        return;
    }
    designerSelect.innerHTML = '<option value="">読み込み中...</option>';
    
    try {
        const findTable = typeof findTableName === 'function' ? findTableName : window.findTableName;
        const tableName = typeof findTable === 'function'
            ? await findTable(['t_computerdevice', 'T_ComputerDevice', 't computerdevice', 'computerdevice'])
            : null;
        if (!tableName) {
            console.warn('t_computerdevice テーブルが見つかりません');
            designerSelect.innerHTML = '<option value="">t_computerdevice が見つかりません</option>';
            return;
        }

        let result = await supabase.from(tableName).select('*').or('depacode.eq.325,depacode.eq.320');
        if (result.error && result.data === null) {
            result = await supabase.from(tableName).select('*').or('DepaCode.eq.325,DepaCode.eq.320');
        }
        const data = result.error ? null : result.data;

        if (!data || data.length === 0) {
            console.warn('採番者が見つかりませんでした（depacode 325/320）');
            designerSelect.innerHTML = '<option value="">採番者が見つかりません</option>';
            return;
        }
        
        designerSelect.innerHTML = '<option value="">選択してください</option>';
        
        data.forEach(staff => {
            const staffName = staff.staffname || staff.StaffName || staff.staffName || staff.staff_name || '';
            if (staffName) {
                const option = document.createElement('option');
                const userName = staffName.split('　')[0] || staffName.split(' ')[0] || staffName;
                option.value = userName;
                option.textContent = staffName;
                designerSelect.appendChild(option);
            }
        });
        
        console.log(`採番者を t_computerdevice から ${data.length} 名読み込みました`);
    } catch (error) {
        console.error('採番者リストの読み込みエラー:', error);
        designerSelect.innerHTML = '<option value="">読み込みエラー</option>';
    }
}

// 図面一覧を読み込む
async function loadDrawingList() {
    const tbody = document.getElementById('drawing-list-page');
    if (!tbody) return;
    const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : (window.getSupabaseClient && window.getSupabaseClient());
    if (!supabase) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 24px; color: var(--text-tertiary);">データベースに接続されていません。ページを再読み込みしてください。</td></tr>';
        return;
    }
    try {
        const tableName = await getSaibanTableName();
        if (!tableName) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                        <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                        <span style="font-size: 13px;">t_saiban テーブルが見つかりません</span>
                    </td>
                </tr>
            `;
            return;
        }
        // 機種記号で絞り込み（入力されていればその機種の図面のみ表示）
        const machineCodeInput = document.getElementById('machine-code-input');
        const machineCode = machineCodeInput ? (machineCodeInput.value || '').trim().toUpperCase().replace(/\s*-\s*.*$/, '') : '';
        const filterBadge = document.getElementById('drawing-list-filter-badge');
        if (filterBadge) filterBadge.textContent = machineCode ? `「${machineCode}」で絞り込み` : '';
        // カラム名がDBで大文字混じり(drawingNo等)の可能性があるため、まず全件取得してクライアントで絞る
        let result = await supabase.from(tableName).select('*').limit(500);
        if (result.error) {
            result = await supabase.from(tableName).select('drawingno, description, saibandate, orderno').limit(500);
        }
        let data = result.error ? null : result.data;
        if (data && data.length > 0 && machineCode) {
            const getDrawingNo = (d) => (d.drawingno || d.DrawingNo || d.drawingNo || d.drawing_no || '').toString().trim().toUpperCase();
            data = data.filter(d => getDrawingNo(d).startsWith(machineCode));
        }
        if (data && data.length > 0) {
            const orderKey = data[0].saibandate != null ? 'saibandate' : (data[0].SaibanDate != null ? 'SaibanDate' : 'saibandate');
            data.sort((a, b) => {
                const da = a[orderKey] || a.saibandate || a.SaibanDate || '';
                const db = b[orderKey] || b.saibandate || b.SaibanDate || '';
                return new Date(db) - new Date(da);
            });
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                        <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                        <span style="font-size: 13px;">図面データはありません</span>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(drawing => {
            const drawingNo = drawing.drawingno || drawing.DrawingNo || drawing.drawingNo || drawing.drawing_no || '';
            const description = drawing.description || drawing.Description || '';
            const saibanDate = drawing.saibandate || drawing.SaibanDate || drawing.saibanDate || drawing.saiban_date || '';
            const dateStr = saibanDate ? new Date(saibanDate).toLocaleDateString('ja-JP') : '';
            
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.onclick = () => {
                document.getElementById('base-drawing-no-input').value = drawingNo;
            };
            row.innerHTML = `
                <td style="padding: 8px 10px; text-align: center; font-size: 12px; font-family: monospace;">${escapeHtml(drawingNo)}</td>
                <td style="padding: 8px 10px; text-align: left; font-size: 12px;">${escapeHtml(description)}</td>
                <td style="padding: 8px 10px; text-align: center; font-size: 12px;">${escapeHtml(dateStr)}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('図面一覧の読み込みエラー:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: var(--error);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                    <span style="font-size: 13px;">読み込みエラー: ${error.message}</span>
                </td>
            </tr>
        `;
    }
}

// 最初の図面番号を自動生成
async function generateFirstDrawingNumber() {
    const drawingType = document.getElementById('drawing-type-select').value;
    let machineCode = document.getElementById('machine-code-input').value.trim().toUpperCase();
    if (machineCode.indexOf(' - ') !== -1) machineCode = machineCode.split(' - ')[0].trim();
    const baseDrawingNoInput = document.getElementById('base-drawing-no-input');
    
    if (!drawingType || !machineCode) {
        showDrawingNumberError('図面種類と機種記号を入力してください');
        return;
    }
    
    try {
        // 既存の図面番号を検索して、次の番号を生成
        const nextDrawingNo = await findNextDrawingNumber(machineCode, drawingType);
        if (nextDrawingNo) {
            baseDrawingNoInput.value = nextDrawingNo;
            showDrawingNumberSuccess(`基準図面番号を設定しました: ${nextDrawingNo}（登録は「図面番号を採番して登録」ボタンで実行）`);
        } else {
            const firstDrawingNo = generateInitialDrawingNumber(machineCode, drawingType);
            baseDrawingNoInput.value = firstDrawingNo;
            showDrawingNumberSuccess(`基準図面番号を設定しました: ${firstDrawingNo}（登録は「図面番号を採番して登録」ボタンで実行）`);
        }
    } catch (error) {
        console.error('図面番号生成エラー:', error);
        showDrawingNumberError('図面番号の生成中にエラーが発生しました: ' + error.message);
    }
}

// 行から図面番号を取得（DBのカラム名のゆれに対応）
function getDrawingNoFromRow(d) {
    return (d.drawingno || d.DrawingNo || d.drawingNo || d.drawing_no || '').toString().trim().toUpperCase();
}

// 次の図面番号を検索
async function findNextDrawingNumber(machineCode, drawingType) {
    try {
        const tableName = await getSaibanTableName();
        if (!tableName) return null;
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : (window.getSupabaseClient && window.getSupabaseClient());
        if (!supabase) return null;
        
        let maxDrawingNo = null;
        
        // 機種記号で始まる図面番号だけを取得（FL 選択時は FL* のみ。他機種の YM 等が混ざらないよう必ず機種で絞る）
        const code = (machineCode || '').toString().toUpperCase();
        let rawRows = [];
        let result = await supabase.from(tableName).select('*').ilike('drawingno', code + '%').limit(500);
        if (result.error) {
            const fallback = await supabase.from(tableName).select('*').limit(500);
            rawRows = (fallback.data || []).map(d => ({ drawingno: getDrawingNoFromRow(d) })).filter(d => d.drawingno && d.drawingno.length >= 9);
            rawRows = rawRows.filter(d => d.drawingno.toUpperCase().startsWith(code));
        } else {
            rawRows = (result.data || []).map(d => ({ drawingno: getDrawingNoFromRow(d) })).filter(d => d.drawingno && d.drawingno.length >= 9);
        }
        const data = rawRows;
        if (data.length === 0) return null;
        
        const filtered = data.filter(d => {
            const drawingNo = d.drawingno;
            const char8 = drawingNo.charAt(7).toUpperCase();
            const char9 = drawingNo.charAt(8).toUpperCase();
            if (drawingType === 'parts') {
                return char8 === '/' || char8 === 'A' || char8 === 'B' || char8 === 'N' ||
                       char9 === '/' || char9 === 'A' || char9 === 'B' || char9 === 'N';
            } else if (drawingType === 'unit') {
                return char8 === 'U' || char8 === 'R' || char8 === 'L' ||
                       char9 === 'U' || char9 === 'R' || char9 === 'L';
            }
            return false;
        });
        
        // 同じ種類の図面が既にある場合：その最大の次を返す
        if (filtered.length > 0) {
            const sorted = [...filtered].sort((a, b) => (a.drawingno < b.drawingno ? 1 : a.drawingno > b.drawingno ? -1 : 0));
            maxDrawingNo = sorted[0].drawingno;
        }
        
        // 同じ種類が1件もなくても、同じ機種の「最後の図面番号」を基準に次を出す（MU001001U01 にしない）
        if (!maxDrawingNo && data.length > 0) {
            const allSorted = data.map(d => d.drawingno).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
            const lastNo = allSorted[0];
            if (lastNo && lastNo.length >= 10) {
                const next = incrementDrawingNumberForGeneration(lastNo, 'parts');
                if (next) {
                    const s = next.toUpperCase();
                    if (s.length >= 9) {
                        const suffix = drawingType === 'unit' ? 'U01' : 'N01';
                        return s.substring(0, 7) + suffix;
                    }
                }
            }
        }
        
        if (maxDrawingNo) {
            return incrementDrawingNumberForGeneration(maxDrawingNo, drawingType);
        }
        
        return null;
    } catch (error) {
        console.error('次の図面番号検索エラー:', error);
        throw error;
    }
}

// 最初の図面番号を生成（既存の図面がない場合）
function generateInitialDrawingNumber(machineCode, drawingType) {
    // 機種記号（2桁）+ サイズ/ユニット（3桁: 001）+ 部品番号（3桁: 001）+ 図面種類（2桁）
    // 既存DB形式に合わせる: 部品図 N01、組図 U01（例: MU51569N01, MU51570U01）
    
    const sizeUnit = '001'; // デフォルトのサイズ/ユニット
    const partNo = '001';   // デフォルトの部品番号
    
    let typeSuffix = '';
    if (drawingType === 'parts') {
        typeSuffix = 'N01'; // 部品図（既存の MU51569N01 形式に合わせる）
    } else if (drawingType === 'unit') {
        typeSuffix = 'U01'; // 組図
    }
    
    return machineCode + sizeUnit + partNo + typeSuffix;
}

// 図面番号をインクリメント（生成用）
// 既存形式: MU51569N01(5桁数字), FL56120/01(5桁数字), FL5W046U01/FL5P438N01(数字1+英字1+3桁数字), MU001001N01(3+3桁)
// 部品図は常に N01、組図は U01 に統一
function incrementDrawingNumberForGeneration(drawingNo, drawingType) {
    const s = (drawingNo || '').toString().toUpperCase();
    const typeSuffix = drawingType === 'unit' ? 'U01' : 'N01';
    if (s.length < 10) {
        return generateInitialDrawingNumber(s.substring(0, 2), drawingType);
    }
    // 形式1: 3-7桁目が5桁の数字（FL56120, MU51569 など）
    const fiveDigit = s.substring(2, 7);
    if (/^\d{5}$/.test(fiveDigit)) {
        const num = parseInt(fiveDigit, 10) + 1;
        return s.substring(0, 2) + String(num).padStart(5, '0') + typeSuffix;
    }
    // 形式2: FL5W046U01, FL5P438N01 など（3桁目=数字1、4桁目=英字1、5-7桁目=数字3）
    if (s.length >= 10 && /\d/.test(s.charAt(2)) && /[A-Z]/.test(s.charAt(3)) && /^\d{3}$/.test(s.substring(4, 7))) {
        const num = parseInt(s.substring(4, 7), 10) + 1;
        return s.substring(0, 4) + String(num).padStart(3, '0') + typeSuffix;
    }
    // 形式3: MU001001N01 など（3-5桁目が3桁、6-8桁目が3桁）
    const threeDigit = s.substring(3, 6);
    if (/^\d{3}$/.test(threeDigit)) {
        const partNum = parseInt(threeDigit, 10) + 1;
        if (partNum >= 800 && drawingType === 'parts') {
            const sizeUnit = parseInt(s.substring(2, 5), 10) || 1;
            return s.substring(0, 2) + String(sizeUnit + 1).padStart(3, '0') + '001' + typeSuffix;
        }
        return s.substring(0, 3) + String(partNum).padStart(3, '0') + typeSuffix;
    }
    return generateInitialDrawingNumber(s.substring(0, 2), drawingType);
}

// 図面番号採番の実行（VB.NETのロジックを完全再現）
async function getDrawingNumberPage() {
    console.log('図面番号採番を実行します');
    
    // エラーメッセージを非表示
    hideDrawingNumberMessage();
    
    // 必須項目の取得（機種記号は "M - コイルカー" 形式のとき先頭の記号のみ使用）
    const drawingType = document.getElementById('drawing-type-select').value;
    let machineCode = document.getElementById('machine-code-input').value.trim().toUpperCase();
    if (machineCode.indexOf(' - ') !== -1) machineCode = machineCode.split(' - ')[0].trim();
    const orderNo = document.getElementById('order-no-input').value.trim().toUpperCase();
    const designer = document.getElementById('designer-select').value.trim();
    const saibanDate = document.getElementById('saiban-date-input').value;
    let baseDrawingNo = document.getElementById('base-drawing-no-input').value.trim().toUpperCase();
    const drawingCount = parseInt(document.getElementById('drawing-count-input').value) || 1;
    const description = document.getElementById('description-input').value.trim();
    
    // 必須項目チェック（基準図面番号は任意）
    if (!drawingType || !machineCode || !orderNo || !designer || !saibanDate) {
        showDrawingNumberError('すべての必須項目を入力してください');
        return;
    }
    
    // 基準図面番号が入力されていない場合、自動生成
    if (!baseDrawingNo || baseDrawingNo.length < 10) {
        try {
            const generatedNo = await findNextDrawingNumber(machineCode, drawingType);
            if (generatedNo) {
                baseDrawingNo = generatedNo;
                document.getElementById('base-drawing-no-input').value = baseDrawingNo;
            } else {
                baseDrawingNo = generateInitialDrawingNumber(machineCode, drawingType);
                document.getElementById('base-drawing-no-input').value = baseDrawingNo;
            }
        } catch (error) {
            console.error('図面番号自動生成エラー:', error);
            showDrawingNumberError('図面番号の自動生成に失敗しました。基準図面番号を手動で入力してください。');
            return;
        }
    }
    
    // 図面番号の桁数チェック（10桁以上）
    if (baseDrawingNo.length < 10) {
        showDrawingNumberError('図面番号は10桁以上である必要があります');
        return;
    }
    
    // 図面番号の6桁目に「I」や「O」が含まれていないかチェック（VB.NETのTxt_Drawing_Validatedロジック）
    if (baseDrawingNo.length >= 6) {
        const sixthChar = baseDrawingNo.charAt(5).toUpperCase();
        if (sixthChar === 'I' || sixthChar === 'O') {
            showDrawingNumberError('図面番号の6桁目に「I」や「O」は使用できません');
            return;
        }
    }
    
    // 機種記号の存在確認
    try {
        const machineCodeExists = await checkMachineCodeExists(machineCode);
        if (!machineCodeExists) {
            showDrawingNumberError('機種記号がデータベースに存在しません');
            return;
        }
    } catch (error) {
        console.error('機種記号の確認エラー:', error);
        showDrawingNumberError('機種記号の確認中にエラーが発生しました: ' + error.message);
        return;
    }
    
    // 工事番号の確認（最初の4桁が存在し、工事完了でないこと）
    try {
        const orderNoValid = await checkOrderNoValid(orderNo);
        if (!orderNoValid.valid) {
            showDrawingNumberError(orderNoValid.message || '工事番号が無効です');
            return;
        }
    } catch (error) {
        console.error('工事番号の確認エラー:', error);
        showDrawingNumberError('工事番号の確認中にエラーが発生しました: ' + error.message);
        return;
    }
    
    // 図面の種類を判定（8桁目または9桁目）
    const drawingTypeCheck = getDrawingType(baseDrawingNo);
    if (!drawingTypeCheck) {
        showDrawingNumberError('図面番号の8桁目または9桁目が無効です（部品図: /,A,B,N / 組図: U,R,L）');
        return;
    }
    
    // 選択された図面種類と一致するか確認
    if ((drawingType === 'parts' && drawingTypeCheck !== 'parts') || 
        (drawingType === 'unit' && drawingTypeCheck !== 'assembly')) {
        showDrawingNumberError('選択した図面種類と図面番号の種類が一致しません');
        return;
    }
    
    // 基準図面番号の重複チェック
    const isDuplicate = await checkDrawingNoDuplicate(baseDrawingNo);
    if (isDuplicate) {
        showDrawingNumberError('この図面番号は既に使用されています');
        return;
    }
    
    // 連続採番処理（VB.NETのロジックを完全再現）
    try {
        const results = await processDrawingNumberRegistrationVB(
            orderNo,
            machineCode,
            designer,
            saibanDate,
            baseDrawingNo,
            drawingCount,
            drawingTypeCheck,
            description
        );
        
        if (results.success) {
            const resultText = results.drawingNumbers && results.drawingNumbers.length > 0 
                ? results.drawingNumbers.join(', ') 
                : baseDrawingNo;
            document.getElementById('drawing-number-result-page').value = resultText;
            
            const skippedMsg = results.skipped && results.skipped.length > 0 
                ? `（${results.skipped.length}件スキップ: ${results.skipped.join(', ')}）` 
                : '';
            showDrawingNumberSuccess(`図面番号 ${results.count} 件を登録しました${skippedMsg}`);
            
            // 図面一覧を更新
            await loadDrawingList();
        } else {
            showDrawingNumberError(results.message || '図面番号の登録に失敗しました');
        }
    } catch (error) {
        console.error('図面番号登録エラー:', error);
        showDrawingNumberError('図面番号の登録中にエラーが発生しました: ' + error.message);
    }
}

// 機種記号の存在確認（t_machinemarkforsaiban。値は "M - コイルカー" の場合は "M" に正規化してから呼ぶこと）
async function checkMachineCodeExists(machineCode) {
    let code = (machineCode || '').toString().trim().toUpperCase();
    if (code.indexOf(' - ') !== -1) code = code.split(' - ')[0].trim();
    if (!code) return false;
    try {
        const tableNames = ['t_machinemarkforsaiban', 'T_MachineMarkForSaiban', 't_machinecode', 't_machine_code'];
        for (const tableName of tableNames) {
            try {
                let res = await getSupabaseClient().from(tableName).select('*').eq('machinemark', code).limit(1);
                if (!res.error && res.data && res.data.length > 0) return true;
                res = await getSupabaseClient().from(tableName).select('*').eq('machinename', code).limit(1);
                if (!res.error && res.data && res.data.length > 0) return true;
                res = await getSupabaseClient().from(tableName).select('*').eq('MachineMark', code).limit(1);
                if (!res.error && res.data && res.data.length > 0) return true;
            } catch (e) { /* 次のテーブルを試す */ }
        }
        return false;
    } catch (error) {
        console.error('機種記号確認エラー:', error);
        return false;
    }
}

// 工事番号の有効性確認（t_acceptorder: 存在し、finisheddate未入力＝未完了であること）
async function checkOrderNoValid(orderNo) {
    if (!orderNo || orderNo.length < 4) {
        return { valid: false, message: '工事番号が短すぎます' };
    }
    const first4Digits = orderNo.substring(0, 4);
    try {
        const tableNames = ['t_acceptorder', 'T_AcceptOrder', 't_accept_order', 'orders'];
        for (const tableName of tableNames) {
            try {
                // 工事が存在し、完了(finisheddateが入力済み)でないこと
                const { data, error } = await getSupabaseClient()
                    .from(tableName)
                    .select('*')
                    .ilike('constructno', first4Digits + '%')
                    .is('finisheddate', null)
                    .limit(5);
                if (error) continue;
                const exact = (data || []).find(o => {
                    const cn = (o.constructno || o.ConstructNo || o.orderNo || '').toString();
                    return cn.startsWith(first4Digits) || cn.indexOf(orderNo) === 0;
                }) || (data && data[0]);
                if (exact) {
                    const cancelFlg = exact.cancelflg ?? exact.CancelFlg ?? exact.cancel_flg;
                    if (cancelFlg === true || cancelFlg === 1) {
                        return { valid: false, message: 'この工事はキャンセルされています' };
                    }
                    const regDate = exact.registerdate || exact.RegisterDate || exact.register_date;
                    return { valid: true, registerDate: regDate };
                }
            } catch (e) { /* 次のテーブルを試す */ }
        }
        return { valid: false, message: '工事番号が存在しないか、既に完了済みです' };
    } catch (error) {
        console.error('工事番号確認エラー:', error);
        return { valid: false, message: '工事番号の確認中にエラーが発生しました' };
    }
}

// 図面の種類を判定（VB.NETのロジック）
function getDrawingType(drawingNo) {
    if (drawingNo.length < 9) return null;
    
    const char8 = drawingNo.charAt(7).toUpperCase();
    const char9 = drawingNo.charAt(8).toUpperCase();
    
    // 部品図: /, A, B, N
    if (char8 === '/' || char8 === 'A' || char8 === 'B' || char8 === 'N') {
        return 'parts';
    }
    if (char9 === '/' || char9 === 'A' || char9 === 'B' || char9 === 'N') {
        return 'parts';
    }
    
    // 組図/ユニット図: U, R, L
    if (char8 === 'U' || char8 === 'R' || char8 === 'L') {
        return 'assembly';
    }
    if (char9 === 'U' || char9 === 'R' || char9 === 'L') {
        return 'assembly';
    }
    
    return null;
}

// VB.NETのFrm_PartsSaiban.Btn_Find_Clickロジックを完全再現
async function processDrawingNumberRegistrationVB(orderNo, machineCode, designer, saibanDate, baseDrawingNo, count, drawingType, description) {
    const drawingNumbers = [];
    const skipped = [];
    let successCount = 0;
    let prevDrawing = baseDrawingNo;
    
    // 工事番号からRegisterDateを取得（KeyDateとして使用）
    const orderInfo = await checkOrderNoValid(orderNo);
    const keyDate = orderInfo.registerDate || new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < count; i++) {
        let newDrawing = '';
        
        // VB.NETのロジック: If IsNumeric(PrevDrawing.Substring(5, 1)) = False Then
        const char5 = prevDrawing.charAt(4); // 5桁目（0-indexedなので4）
        const isNumericChar5 = /[0-9]/.test(char5);
        
        if (!isNumericChar5) {
            // 5桁目が数字でない場合（文字の場合）
            // VB.NET: If CInt(TxtDrawing.Substring(6, 1)) + i >= 10 Then
            const char6 = parseInt(prevDrawing.charAt(5)); // 6桁目
            if (!isNaN(char6) && char6 + i >= 10) {
                // 繰り上がり処理
                let currentChr = String.fromCharCode(prevDrawing.charCodeAt(4) + Math.floor((char6 + i) / 10));
                let kuriageFlg = false;
                
                if (currentChr === '[') {
                    currentChr = 'A';
                    kuriageFlg = true;
                } else if (currentChr === 'O') {
                    currentChr = String.fromCharCode(currentChr.charCodeAt(0) + 1);
                } else if (currentChr === 'I') {
                    currentChr = String.fromCharCode(currentChr.charCodeAt(0) + 1);
                }
                
                const amari = (char6 + i) % 10;
                
                if (kuriageFlg) {
                    const char4 = parseInt(prevDrawing.charAt(3));
                    newDrawing = prevDrawing.substring(0, 3) + (char4 + 1).toString() + currentChr + amari.toString() + prevDrawing.substring(7);
                } else {
                    newDrawing = prevDrawing.substring(0, 5) + currentChr + amari.toString() + prevDrawing.substring(7);
                }
            } else {
                // 通常のインクリメント
                newDrawing = prevDrawing.substring(0, 6) + (char6 + i).toString() + prevDrawing.substring(7);
            }
        } else {
            // 5桁目が数字の場合
            // VB.NET: If CInt(TxtDrawing.Substring(4, 3)) + i >= 1000 Then
            const partNum = parseInt(prevDrawing.substring(3, 6)); // 4-6桁目（3桁の数値）
            
            if (partNum + i >= 1000) {
                // 1000に達した場合の処理
                let currentChr = '';
                let kuriageFlg = false;
                
                if (/[0-9]/.test(prevDrawing.charAt(4))) {
                    // 5桁目が数字の場合
                    currentChr = 'A';
                    const amari = (parseInt(prevDrawing.charAt(5)) + i) % 10;
                    if (prevDrawing.charAt(3) === '9') {
                        newDrawing = prevDrawing.substring(0, 3) + '1' + currentChr + amari.toString() + prevDrawing.substring(7);
                    } else {
                        newDrawing = prevDrawing.substring(0, 5) + currentChr + amari.toString() + prevDrawing.substring(7);
                    }
                } else {
                    // 5桁目が文字の場合
                    if (prevDrawing.charAt(5) === '9') {
                        currentChr = String.fromCharCode(prevDrawing.charCodeAt(4) + 1);
                    } else {
                        currentChr = prevDrawing.charAt(4);
                    }
                    
                    if (currentChr === '[') {
                        currentChr = 'A';
                        kuriageFlg = true;
                    } else if (currentChr === 'O') {
                        currentChr = String.fromCharCode(currentChr.charCodeAt(0) + 1);
                    } else if (currentChr === 'I') {
                        currentChr = String.fromCharCode(currentChr.charCodeAt(0) + 1);
                    }
                    
                    const amari = (parseInt(prevDrawing.charAt(5)) + i) % 10;
                    if (kuriageFlg) {
                        const char4 = parseInt(prevDrawing.charAt(3));
                        newDrawing = prevDrawing.substring(0, 3) + (char4 + 1).toString() + currentChr + amari.toString() + prevDrawing.substring(7);
                    } else {
                        newDrawing = prevDrawing.substring(0, 5) + currentChr + amari.toString() + prevDrawing.substring(7);
                    }
                }
            } else if (partNum + i === 800 && drawingType === 'parts') {
                // 部品図の場合、800に達したらループを抜ける
                break;
            } else {
                // 通常のインクリメント（3桁の数値として）
                const newPartNum = partNum + i;
                newDrawing = prevDrawing.substring(0, 3) + newPartNum.toString().padStart(3, '0') + prevDrawing.substring(6);
            }
        }
        
        // 重複チェック
        const isDuplicate = await checkDrawingNoDuplicate(newDrawing);
        if (isDuplicate) {
            console.warn(`図面番号 ${newDrawing} は既に使用されています`);
            skipped.push(newDrawing);
            continue;
        }
        
        // 図面データの登録
        try {
            const saibanDateISO = new Date(saibanDate).toISOString();
            
            // 資料に基づく小文字カラムで登録
            const drawingData = {
                drawingno: newDrawing,
                description: description || null,
                orderno: orderNo,
                material: null,
                materialweight: null,
                finishedweight: null,
                designer: designer,
                saibandate: saibanDateISO,
                keydate: keyDate,
                history1: null,
                history2: null,
                history3: null,
                history4: null,
                history5: null,
                history6: null,
                history7: null,
                history8: null,
                history9: null,
                history10: null
            };
            
            const saibanTable = await getSaibanTableName();
            if (!saibanTable) {
                console.error('t_saiban テーブルが見つかりません');
                skipped.push(newDrawing);
            } else {
                const { error } = await getSupabaseClient()
                    .from(saibanTable)
                    .insert([drawingData]);
                if (!error) {
                    successCount++;
                    drawingNumbers.push(newDrawing);
                    prevDrawing = newDrawing;
                } else {
                    console.error('t_saiban への登録エラー:', error);
                    skipped.push(newDrawing);
                }
            }
        } catch (error) {
            console.error(`図面番号 ${newDrawing} の登録エラー:`, error);
            skipped.push(newDrawing);
        }
    }
    
    return {
        success: successCount > 0,
        count: successCount,
        drawingNumbers: drawingNumbers,
        skipped: skipped,
        message: successCount === count ? 'すべての図面番号を登録しました' : `${successCount}件の図面番号を登録しました（${count - successCount}件失敗）`
    };
}

// 図面番号の重複チェック（t_saiban.drawingno で確認・小文字）
async function checkDrawingNoDuplicate(drawingNo) {
    try {
        const tableName = await getSaibanTableName();
        if (!tableName) return false;
        const { data, error } = await getSupabaseClient()
            .from(tableName)
            .select('drawingno')
            .eq('drawingno', drawingNo)
            .limit(1);
        return !error && data && data.length > 0;
    } catch (error) {
        console.error('図面番号重複チェックエラー:', error);
        throw error;
    }
}

// コピー機能
function copyDrawingNumberPage() {
    const resultInput = document.getElementById('drawing-number-result-page');
    if (resultInput && resultInput.value) {
        resultInput.select();
        document.execCommand('copy');
        showMessage('図面番号をクリップボードにコピーしました', 'success');
    }
}

// エラーメッセージ表示
function showDrawingNumberError(message) {
    const errorDiv = document.getElementById('drawing-number-errors-page');
    const errorMessage = document.getElementById('drawing-number-error-message-page');
    const successDiv = document.getElementById('drawing-number-success-page');
    
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.style.display = 'block';
        if (successDiv) successDiv.style.display = 'none';
        
        // スクロールしてエラーメッセージを表示
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 成功メッセージ表示
function showDrawingNumberSuccess(message) {
    const successDiv = document.getElementById('drawing-number-success-page');
    const successMessage = document.getElementById('drawing-number-success-message-page');
    const errorDiv = document.getElementById('drawing-number-errors-page');
    
    if (successDiv && successMessage) {
        successMessage.textContent = message;
        successDiv.style.display = 'block';
        if (errorDiv) errorDiv.style.display = 'none';
        
        // スクロールして成功メッセージを表示
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// メッセージ非表示
function hideDrawingNumberMessage() {
    const errorDiv = document.getElementById('drawing-number-errors-page');
    const successDiv = document.getElementById('drawing-number-success-page');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

// エスケープ関数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// グローバルに公開
window.initializeDrawingNumberPage = initializeDrawingNumberPage;
window.getDrawingNumberPage = getDrawingNumberPage;
window.copyDrawingNumberPage = copyDrawingNumberPage;
window.loadDrawingList = loadDrawingList;
window.generateFirstDrawingNumber = generateFirstDrawingNumber;
