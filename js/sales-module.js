/**
 * 営業モジュール - 見積依頼 & 見積書作成
 *
 * 見積依頼ページ: estimate-request-page (コンテナ: estimate-request-content)
 * 見積書作成ページ: quotation-page       (コンテナ: quotation-content)
 */
(function () {
    'use strict';

    // ── ユーティリティ ────────────────────────────────
    function getSB() {
        return typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + S2(d.getMonth() + 1) + '-' + S2(d.getDate());
    }

    function S2(n) { return String(n).padStart(2, '0'); }

    function fmtYen(n) {
        return '¥' + (Math.round(n) || 0).toLocaleString('ja-JP');
    }

    function showMsg(id, html, type) {
        var el = document.getElementById(id);
        if (!el) return;
        var bg   = { success: '#dcfce7', error: '#fee2e2', warn: '#fef3c7', info: '#e0e7ff' };
        var text = { success: '#15803d', error: '#b91c1c', warn: '#92400e', info: '#3730a3' };
        el.style.background = bg[type]   || '#f1f5f9';
        el.style.color      = text[type] || '#374151';
        el.innerHTML        = html;
        el.style.display    = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.style.display = 'none'; }, 7000);
    }

    // ════════════════════════════════════════════════════════
    // ① 見積依頼ページ
    // ════════════════════════════════════════════════════════
    window.initEstimateRequestPage = function () {
        var container = document.getElementById('estimate-request-content');
        if (!container) return;

        container.innerHTML = _erHTML();

        // デフォルト日付
        var wk = new Date(); wk.setDate(wk.getDate() + 7);
        var qdEl = document.getElementById('er-quotedate');
        if (qdEl) qdEl.value = wk.getFullYear() + '-' + S2(wk.getMonth() + 1) + '-' + S2(wk.getDate());
    };

    function _erHTML() {
        return `
<style>
/* ── 共通ヘッダーバー ── */
.sm-header{background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#a78bfa 100%);border-radius:20px;padding:28px 32px;color:white;margin-bottom:22px;box-shadow:0 8px 32px rgba(99,102,241,0.35);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
.sm-header-left{display:flex;align-items:center;gap:16px;}
.sm-hicon{width:60px;height:60px;background:rgba(255,255,255,0.22);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 4px 14px rgba(0,0,0,0.18);}
.sm-header h1{font-size:24px;font-weight:900;margin:0 0 5px;letter-spacing:-0.02em;}
.sm-header p{font-size:13px;opacity:.85;margin:0;}
/* K番号バッジ */
.sm-knbadge{background:rgba(255,255,255,0.18);border:2.5px solid rgba(255,255,255,0.45);border-radius:14px;padding:12px 20px;text-align:center;min-width:140px;}
.sm-knbadge .lbl{font-size:11px;opacity:.8;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px;}
.sm-knbadge .val{font-size:24px;font-weight:900;letter-spacing:.06em;font-family:'Courier New',monospace;}
/* ステップ */
.sm-steps{display:flex;background:white;border-radius:16px;padding:16px 20px;margin-bottom:22px;box-shadow:0 4px 16px rgba(99,102,241,0.09);border:1px solid rgba(99,102,241,0.12);}
.sm-step{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;text-align:center;}
.sm-step:not(:last-child)::after{content:'';position:absolute;top:19px;left:50%;width:100%;height:2px;background:#e2e8f0;z-index:0;}
.sm-step-n{width:38px;height:38px;background:#e2e8f0;color:#94a3b8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;position:relative;z-index:1;transition:all .25s;}
.sm-step.active .sm-step-n{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;box-shadow:0 4px 14px rgba(99,102,241,0.45);}
.sm-step.done .sm-step-n{background:linear-gradient(135deg,#22c55e,#16a34a);color:white;}
.sm-step .lbl{font-size:12px;color:#94a3b8;margin-top:7px;font-weight:600;}
.sm-step.active .lbl{color:#6366f1;}
.sm-step.done .lbl{color:#16a34a;}
/* カード */
.sm-card{background:white;border-radius:18px;padding:24px;margin-bottom:20px;box-shadow:0 4px 22px rgba(99,102,241,0.09);border:1px solid rgba(99,102,241,0.11);transition:box-shadow .2s;}
.sm-card:hover{box-shadow:0 8px 34px rgba(99,102,241,0.16);}
.sm-card-t{font-size:15px;font-weight:800;color:#4f46e5;margin:0 0 18px;display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:2px solid #e0e7ff;}
/* フォーム */
.sm-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.sm-grid-3{grid-template-columns:1fr 1fr 1fr;}
.sm-full{grid-column:1/-1;}
.sm-field label{display:block;font-size:11.5px;font-weight:700;color:#64748b;margin-bottom:6px;letter-spacing:.06em;text-transform:uppercase;}
.sm-field label .req{color:#f43f5e;margin-left:2px;}
.sm-inp{width:100%;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;background:#f8fafc;transition:all .2s;box-sizing:border-box;outline:none;}
.sm-inp:focus{border-color:#6366f1;background:white;box-shadow:0 0 0 3px rgba(99,102,241,.15);}
.sm-inp::placeholder{color:#c0ccd9;}
textarea.sm-inp{resize:vertical;min-height:90px;line-height:1.6;}
/* ボタン */
.sm-btn-gen{background:linear-gradient(135deg,#f97316,#fb923c);color:white;border:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .2s;box-shadow:0 4px 14px rgba(249,115,22,.3);}
.sm-btn-gen:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(249,115,22,.42);}
.sm-btn-email{background:linear-gradient(135deg,#06b6d4,#0891b2);color:white;border:none;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .2s;box-shadow:0 4px 14px rgba(6,182,212,.3);}
.sm-btn-email:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(6,182,212,.42);}
.sm-btn-save{background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;border:none;padding:12px 30px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .2s;box-shadow:0 4px 14px rgba(99,102,241,.3);}
.sm-btn-save:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(99,102,241,.42);}
.sm-btn-save:disabled{opacity:.6;cursor:not-allowed;transform:none;}
.sm-btn-back{background:#f1f5f9;color:#475569;border:1.5px solid #cbd5e1;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:background .2s;}
.sm-btn-back:hover{background:#e2e8f0;}
.sm-actions{display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px;}
.sm-msg{padding:12px 16px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:14px;display:none;}
/* K番号入力エリア */
.sm-knum-area{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;}
.sm-knum-ro{font-family:'Courier New',monospace;font-weight:800;font-size:17px;letter-spacing:.1em;background:#f0f4ff;color:#4f46e5;border-color:#c7d2fe;}
.sm-knum-ro:focus{border-color:#6366f1;}
.sm-info{font-size:12px;color:#94a3b8;margin:8px 0 0;display:flex;align-items:center;gap:6px;}
</style>

<!-- ヘッダー -->
<div class="sm-header">
  <div class="sm-header-left">
    <div class="sm-hicon"><i class="fas fa-envelope-open-text" style="font-size:26px;"></i></div>
    <div>
      <h1>見積依頼</h1>
      <p>K番号を採番してメール送付先を登録します</p>
    </div>
  </div>
  <div class="sm-knbadge">
    <div class="lbl">K 番 号</div>
    <div class="val" id="er-knumber-badge">- - -</div>
  </div>
</div>

<!-- ステップ -->
<div class="sm-steps">
  <div class="sm-step active"><div class="sm-step-n">1</div><div class="lbl">見積依頼</div></div>
  <div class="sm-step"><div class="sm-step-n">2</div><div class="lbl">見積書作成</div></div>
  <div class="sm-step"><div class="sm-step-n">3</div><div class="lbl">受注登録</div></div>
</div>

<div id="er-msg" class="sm-msg"></div>

<!-- K番号採番 -->
<div class="sm-card">
  <div class="sm-card-t"><i class="fas fa-hashtag"></i> K番号の採番</div>
  <div class="sm-knum-area">
    <div class="sm-field" style="flex:1;min-width:200px;">
      <label>K番号 <span class="req">*</span></label>
      <input type="text" id="er-knum" class="sm-inp sm-knum-ro" placeholder="K26001" readonly>
    </div>
    <button class="sm-btn-gen" onclick="erGenerateK()">
      <i class="fas fa-magic"></i> K番号を発行する
    </button>
  </div>
  <p class="sm-info"><i class="fas fa-info-circle" style="color:#6366f1;"></i> 採番年＋連番で自動生成されます（例: K26001）</p>
</div>

<!-- 依頼内容 -->
<div class="sm-card">
  <div class="sm-card-t"><i class="fas fa-clipboard-list"></i> 依頼内容</div>
  <div class="sm-grid">
    <div class="sm-field">
      <label>客先名 <span class="req">*</span></label>
      <input type="text" id="er-customer" class="sm-inp" placeholder="○○株式会社">
    </div>
    <div class="sm-field">
      <label>担当者名</label>
      <input type="text" id="er-staff" class="sm-inp" placeholder="山田 太郎">
    </div>
    <div class="sm-field sm-full">
      <label>件名 <span class="req">*</span></label>
      <input type="text" id="er-subject" class="sm-inp" placeholder="〇〇装置 一式 見積依頼">
    </div>
    <div class="sm-field">
      <label>希望納期</label>
      <input type="date" id="er-duedate" class="sm-inp">
    </div>
    <div class="sm-field">
      <label>見積回答希望日</label>
      <input type="date" id="er-quotedate" class="sm-inp">
    </div>
    <div class="sm-field sm-full">
      <label>仕様・依頼内容</label>
      <textarea id="er-spec" class="sm-inp" placeholder="製品の仕様、数量、特記事項などを記入してください..."></textarea>
    </div>
  </div>
</div>

<!-- 送付先 -->
<div class="sm-card">
  <div class="sm-card-t"><i class="fas fa-at"></i> メール送付先</div>
  <div class="sm-grid">
    <div class="sm-field">
      <label>送付先メールアドレス</label>
      <input type="email" id="er-email-to" class="sm-inp" placeholder="supplier@example.com">
    </div>
    <div class="sm-field">
      <label>CC（任意）</label>
      <input type="email" id="er-email-cc" class="sm-inp" placeholder="manager@yourcompany.com">
    </div>
  </div>
</div>

<!-- アクション -->
<div class="sm-actions">
  <button class="sm-btn-back" onclick="showPage('register')"><i class="fas fa-arrow-left"></i> 戻る</button>
  <button class="sm-btn-email" onclick="erSendEmail()"><i class="fas fa-envelope"></i> メールを作成する</button>
  <button class="sm-btn-save" id="er-save-btn" onclick="erSave()"><i class="fas fa-save"></i> 保存して次へ →</button>
</div>
`;
    }

    // K番号採番
    window.erGenerateK = async function () {
        var btn = document.querySelector('.sm-btn-gen');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 採番中...'; }
        try {
            var yr = String(new Date().getFullYear()).slice(-2);
            var prefix = 'K' + yr;
            var maxSeq = 0;
            var sb = getSB();
            if (sb) {
                try {
                    var r = await sb.from('t_acceptorder').select('EstimateNo').ilike('EstimateNo', prefix + '%').order('EstimateNo', { ascending: false }).limit(1);
                    if (r.data && r.data.length > 0 && r.data[0].EstimateNo) {
                        var m = r.data[0].EstimateNo.match(/K\d{2}(\d+)/);
                        if (m) maxSeq = parseInt(m[1]);
                    }
                } catch (e) { /* フォールバック */ }
            }
            var stored = localStorage.getItem('er_kseq_' + yr);
            if (stored && parseInt(stored) > maxSeq) maxSeq = parseInt(stored);
            var next = maxSeq + 1;
            var knum = prefix + String(next).padStart(3, '0');
            localStorage.setItem('er_kseq_' + yr, next);
            document.getElementById('er-knum').value = knum;
            document.getElementById('er-knumber-badge').textContent = knum;
            showMsg('er-msg', '<i class="fas fa-check-circle"></i> K番号 <strong>' + knum + '</strong> を発行しました', 'success');
        } catch (e) {
            showMsg('er-msg', '採番に失敗しました: ' + e.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> K番号を発行する'; }
        }
    };

    // メール作成
    window.erSendEmail = function () {
        var to       = v('er-email-to');
        var cc       = v('er-email-cc');
        var knum     = v('er-knum') || '（未採番）';
        var subject  = v('er-subject');
        var customer = v('er-customer');
        var spec     = v('er-spec');
        var due      = v('er-duedate');
        var qdate    = v('er-quotedate');

        var mailSub = '[' + knum + '] ' + subject + ' 見積依頼';
        var body = '拝啓\n\n下記の通り、見積もりをご依頼申し上げます。\n\n'
            + '【K番号】　' + knum + '\n'
            + '【件名】　　' + subject + '\n'
            + (customer ? '【客先】　　' + customer + '\n' : '')
            + (due       ? '【希望納期】' + due + '\n' : '')
            + (qdate     ? '【回答希望日】' + qdate + '\n' : '')
            + (spec      ? '\n【仕様・依頼内容】\n' + spec + '\n' : '')
            + '\nよろしくお願いいたします。\n\n敬具';

        var uri = 'mailto:' + encodeURIComponent(to);
        var qs  = 'subject=' + encodeURIComponent(mailSub) + '&body=' + encodeURIComponent(body);
        if (cc) qs = 'cc=' + encodeURIComponent(cc) + '&' + qs;
        window.location.href = uri + '?' + qs;
    };

    // 保存
    window.erSave = async function () {
        var knum     = v('er-knum');
        var customer = v('er-customer');
        var subject  = v('er-subject');
        if (!knum)     { showMsg('er-msg', '先にK番号を発行してください', 'error'); return; }
        if (!customer) { showMsg('er-msg', '客先名を入力してください', 'error'); return; }
        if (!subject)  { showMsg('er-msg', '件名を入力してください', 'error'); return; }

        var btn = document.getElementById('er-save-btn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...'; }

        var rec = {
            knum: knum, customer: customer, subject: subject,
            staff: v('er-staff'), duedate: v('er-duedate'),
            quotedate: v('er-quotedate'), spec: v('er-spec'),
            emailTo: v('er-email-to'), savedAt: new Date().toISOString()
        };

        // ローカルに保存
        localStorage.setItem('er_req_' + knum, JSON.stringify(rec));

        // Supabase 試み
        var sb = getSB();
        if (sb) {
            try {
                var dbRec = {
                    EstimateNo: knum, ConstructName: subject, OwnerCode: customer,
                    RegisterDate: todayStr(), DeliveryDate: rec.duedate || null, CancelFlg: false
                };
                await sb.from('t_acceptorder').insert([dbRec]);
            } catch (e) { console.warn('[SM] Supabase保存失敗:', e); }
        }

        window._smEstimateRec = rec;
        showMsg('er-msg', '<i class="fas fa-check-circle"></i> 見積依頼 <strong>' + knum + '</strong> を保存しました。&nbsp;<button onclick="showPage(\'quotation\')" style="margin-left:10px;padding:5px 14px;background:#4f46e5;color:white;border:none;border-radius:5px;cursor:pointer;font-size:13px;font-weight:700;"><i class="fas fa-arrow-right"></i> 見積書作成へ</button>', 'success');

        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> 保存して次へ →'; }
    };

    function v(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }


    // ════════════════════════════════════════════════════════
    // ② 見積書作成ページ
    // ════════════════════════════════════════════════════════
    var _rowId = 0;

    window.initQuotationPage = function () {
        _rowId = 0;
        var container = document.getElementById('quotation-content');
        if (!container) return;
        var imp = window._smEstimateRec || null;
        container.innerHTML = _qtHTML(imp);

        // 有効期限デフォルト 30日後
        var exp = new Date(); exp.setDate(exp.getDate() + 30);
        var el = document.getElementById('qt-expiry');
        if (el) el.value = exp.getFullYear() + '-' + S2(exp.getMonth() + 1) + '-' + S2(exp.getDate());

        // デフォルト3行
        qtAddRow(); qtAddRow(); qtAddRow();
    };

    function _qtHTML(imp) {
        var knum     = imp ? imp.knum : '';
        var customer = imp ? imp.customer : '';
        var subject  = imp ? imp.subject : '';
        var duedate  = imp ? (imp.duedate || '') : '';
        var importBadge = imp
            ? '<div style="background:rgba(255,255,255,.22);border:2.5px solid rgba(255,255,255,.45);border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;"><i class=\'fas fa-link\'></i> ' + imp.knum + ' から引き継ぎ</div>'
            : '';

        return `
<style>
.qt-header{background:linear-gradient(135deg,#10b981 0%,#059669 55%,#047857 100%);border-radius:20px;padding:28px 32px;color:white;margin-bottom:22px;box-shadow:0 8px 32px rgba(16,185,129,.35);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
.qt-header-left{display:flex;align-items:center;gap:16px;}
.qt-hicon{width:60px;height:60px;background:rgba(255,255,255,.22);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:30px;}
.qt-header h1{font-size:24px;font-weight:900;margin:0 0 5px;}
.qt-header p{font-size:13px;opacity:.85;margin:0;}
.qt-card{background:white;border-radius:18px;padding:24px;margin-bottom:20px;box-shadow:0 4px 22px rgba(16,185,129,.09);border:1px solid rgba(16,185,129,.11);}
.qt-card-t{font-size:15px;font-weight:800;color:#059669;margin:0 0 18px;display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:2px solid #d1fae5;}
.qt-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.qt-full{grid-column:1/-1;}
.qt-field label{display:block;font-size:11.5px;font-weight:700;color:#64748b;margin-bottom:6px;letter-spacing:.06em;text-transform:uppercase;}
.qt-inp{width:100%;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;background:#f8fafc;transition:all .2s;box-sizing:border-box;outline:none;}
.qt-inp:focus{border-color:#10b981;background:white;box-shadow:0 0 0 3px rgba(16,185,129,.15);}
.qt-inp::placeholder{color:#c0ccd9;}
textarea.qt-inp{resize:vertical;min-height:80px;}
/* 品目テーブル */
.qt-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.qt-tbl th{background:linear-gradient(135deg,#f0fdf4,#dcfce7);color:#15803d;font-weight:700;padding:10px 12px;text-align:left;border-bottom:2px solid #bbf7d0;white-space:nowrap;}
.qt-tbl td{padding:7px 7px;border-bottom:1px solid #f0fdf4;vertical-align:middle;}
.qt-tbl tr:hover td{background:#f0fdf4;}
.qt-ii{width:100%;padding:7px 9px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:13px;background:white;outline:none;transition:border .2s;box-sizing:border-box;}
.qt-ii:focus{border-color:#10b981;}
.qt-ii.num{text-align:right;}
.qt-btn-add{background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin-top:12px;transition:all .2s;}
.qt-btn-add:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,185,129,.3);}
/* 合計エリア */
.qt-total{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:14px;padding:20px 24px;border:2px solid #bbf7d0;}
.qt-tr{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#374151;padding:5px 0;}
.qt-tr.grand{font-size:22px;font-weight:900;color:#065f46;border-top:2px solid #86efac;margin-top:10px;padding-top:14px;}
.qt-tr .lbl{font-weight:600;}
.qt-tr .val{font-weight:700;font-family:'Courier New',monospace;}
/* アクション */
.qt-actions{display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap;}
.qt-btn-pdf{background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .2s;box-shadow:0 4px 14px rgba(249,115,22,.3);}
.qt-btn-pdf:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(249,115,22,.42);}
.qt-btn-order{background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;border:none;padding:12px 26px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .2s;box-shadow:0 4px 14px rgba(99,102,241,.3);}
.qt-btn-order:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(99,102,241,.42);}
.qt-btn-import{background:linear-gradient(135deg,#e0e7ff,#ede9fe);color:#4f46e5;border:2px solid #c7d2fe;padding:9px 16px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background .2s;}
.qt-btn-import:hover{background:linear-gradient(135deg,#c7d2fe,#ddd6fe);}
.qt-btn-back{background:#f1f5f9;color:#475569;border:1.5px solid #cbd5e1;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;}
.qt-btn-back:hover{background:#e2e8f0;}
.qt-msg{padding:12px 16px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:14px;display:none;}
/* 印刷 */
@media print{
  .sm-steps,.qt-actions,.qt-hicon,.qt-btn-back,.qt-btn-import{display:none!important;}
  .qt-header{background:#059669!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .qt-card{box-shadow:none!important;border:1px solid #e2e8f0!important;}
  body,.main-app,.main-container,main,aside{background:white!important;}
  .left-sidebar,.right-sidebar,.top-header{display:none!important;}
  main{margin:0!important;padding:0!important;}
}
</style>

<!-- ヘッダー -->
<div class="qt-header">
  <div class="qt-header-left">
    <div class="qt-hicon"><i class="fas fa-file-invoice" style="font-size:26px;"></i></div>
    <div>
      <h1>見積書作成</h1>
      <p>品目・金額を入力して見積書を作成します</p>
    </div>
  </div>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
    ${importBadge}
    <button class="qt-btn-import" onclick="qtImport()"><i class="fas fa-file-import"></i> 見積依頼から取り込み</button>
  </div>
</div>

<!-- ステップ -->
<div class="sm-steps" style="box-shadow:0 4px 16px rgba(16,185,129,.09);border:1px solid rgba(16,185,129,.11);">
  <div class="sm-step done"><div class="sm-step-n"><i class="fas fa-check"></i></div><div class="lbl">見積依頼</div></div>
  <div class="sm-step active"><div class="sm-step-n">2</div><div class="lbl">見積書作成</div></div>
  <div class="sm-step"><div class="sm-step-n">3</div><div class="lbl">受注登録</div></div>
</div>

<div id="qt-msg" class="qt-msg"></div>

<!-- ヘッダー情報 -->
<div class="qt-card">
  <div class="qt-card-t"><i class="fas fa-building"></i> 見積書ヘッダー情報</div>
  <div class="qt-grid">
    <div class="qt-field"><label>K番号 / 見積番号</label><input type="text" id="qt-knum" class="qt-inp" value="${knum}" placeholder="K26001"></div>
    <div class="qt-field"><label>見積日</label><input type="date" id="qt-date" class="qt-inp" value="${todayStr()}"></div>
    <div class="qt-field"><label>宛先（客先名）</label><input type="text" id="qt-customer" class="qt-inp" value="${customer}" placeholder="○○株式会社 御中"></div>
    <div class="qt-field"><label>件名</label><input type="text" id="qt-subject" class="qt-inp" value="${subject}" placeholder="〇〇装置 一式 見積書"></div>
    <div class="qt-field"><label>有効期限</label><input type="date" id="qt-expiry" class="qt-inp"></div>
    <div class="qt-field"><label>希望納期</label><input type="text" id="qt-delivery" class="qt-inp" value="${duedate}" placeholder="受注後 ○週間"></div>
    <div class="qt-field"><label>お支払条件</label><input type="text" id="qt-payment" class="qt-inp" placeholder="月末締め 翌月末払い"></div>
    <div class="qt-field"><label>見積担当者</label><input type="text" id="qt-staff" class="qt-inp" placeholder="担当者名"></div>
  </div>
</div>

<!-- 品目明細 -->
<div class="qt-card">
  <div class="qt-card-t"><i class="fas fa-list-ul"></i> 品目明細</div>
  <div style="overflow-x:auto;">
    <table class="qt-tbl">
      <thead><tr>
        <th style="width:36px;">#</th>
        <th style="min-width:220px;">品名・仕様</th>
        <th style="width:72px;">数量</th>
        <th style="width:60px;">単位</th>
        <th style="width:140px;">単価（円）</th>
        <th style="width:150px;">金額（円）</th>
        <th style="width:36px;"></th>
      </tr></thead>
      <tbody id="qt-tbody"></tbody>
    </table>
  </div>
  <button class="qt-btn-add" onclick="qtAddRow()"><i class="fas fa-plus"></i> 行を追加</button>
</div>

<!-- 合計 -->
<div class="qt-card">
  <div class="qt-card-t"><i class="fas fa-calculator"></i> 合計金額</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;">
    <div>
      <div class="qt-field">
        <label>摘要・備考</label>
        <textarea id="qt-remarks" class="qt-inp" rows="5" placeholder="特記事項・備考などを記入してください..."></textarea>
      </div>
    </div>
    <div class="qt-total">
      <div class="qt-tr"><span class="lbl">小計</span><span class="val" id="qt-subtotal">¥0</span></div>
      <div class="qt-tr"><span class="lbl">消費税（10%）</span><span class="val" id="qt-tax">¥0</span></div>
      <div class="qt-tr grand"><span class="lbl">合計金額</span><span class="val" id="qt-total">¥0</span></div>
    </div>
  </div>
</div>

<!-- アクション -->
<div class="qt-actions">
  <button class="qt-btn-back" onclick="showPage('register')"><i class="fas fa-arrow-left"></i> 戻る</button>
  <button class="qt-btn-pdf" onclick="qtPrint()"><i class="fas fa-file-pdf"></i> PDF / 印刷</button>
  <button class="qt-btn-order" onclick="qtGoOrder()"><i class="fas fa-file-invoice-dollar"></i> 受注登録へ進む →</button>
</div>
`;
    }

    // 見積依頼から取り込み（qt-knum フィールドに入力済みの番号を使用）
    window.qtImport = function () {
        var knum = v('qt-knum');
        if (!knum) {
            showMsg('qt-msg', 'K番号欄に番号を入力してから「見積依頼から取り込み」を押してください', 'warn');
            return;
        }
        var stored = localStorage.getItem('er_req_' + knum.trim());
        if (!stored) {
            showMsg('qt-msg', 'K番号 <strong>' + knum.trim() + '</strong> のデータが見つかりません。先に見積依頼ページで保存してください。', 'warn');
            return;
        }
        var d = JSON.parse(stored);
        window._smEstimateRec = d;
        var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
        set('qt-knum', d.knum); set('qt-customer', d.customer); set('qt-subject', d.subject); set('qt-delivery', d.duedate);
        showMsg('qt-msg', '<i class="fas fa-check-circle"></i> K番号 <strong>' + d.knum + '</strong> のデータを取り込みました', 'success');
    };

    // 行追加
    window.qtAddRow = function () {
        var tbody = document.getElementById('qt-tbody');
        if (!tbody) return;
        _rowId++;
        var rid = _rowId;
        var rn  = tbody.rows.length + 1;
        var tr  = document.createElement('tr');
        tr.id   = 'qt-row-' + rid;
        tr.innerHTML =
            '<td style="text-align:center;color:#94a3b8;font-weight:700;font-size:13px;">' + rn + '</td>'
            + '<td><input type="text" class="qt-ii qt-name" placeholder="品名・仕様"></td>'
            + '<td><input type="number" class="qt-ii num qt-qty" value="1" min="0" oninput="qtCalcRow(' + rid + ')"></td>'
            + '<td><input type="text" class="qt-ii qt-unit" value="式"></td>'
            + '<td><input type="number" class="qt-ii num qt-price" value="0" min="0" oninput="qtCalcRow(' + rid + ')"></td>'
            + '<td style="text-align:right;font-weight:700;color:#059669;padding-right:12px;font-size:14px;" id="qt-amt-' + rid + '">¥0</td>'
            + '<td><button onclick="qtRemoveRow(' + rid + ')" style="background:none;border:none;cursor:pointer;color:#f43f5e;font-size:16px;padding:3px;" title="削除"><i class="fas fa-times-circle"></i></button></td>';
        tbody.appendChild(tr);
    };

    window.qtRemoveRow = function (rid) {
        var r = document.getElementById('qt-row-' + rid);
        if (r) r.remove();
        qtCalcTotal();
        document.querySelectorAll('#qt-tbody tr').forEach(function (tr, i) {
            var tc = tr.querySelector('td:first-child');
            if (tc) tc.textContent = i + 1;
        });
    };

    window.qtCalcRow = function (rid) {
        var row = document.getElementById('qt-row-' + rid);
        if (!row) return;
        var qty   = parseFloat((row.querySelector('.qt-qty')   || {}).value || 0) || 0;
        var price = parseFloat((row.querySelector('.qt-price') || {}).value || 0) || 0;
        var amt   = document.getElementById('qt-amt-' + rid);
        if (amt) amt.textContent = fmtYen(qty * price);
        qtCalcTotal();
    };

    window.qtCalcTotal = function () {
        var sub = 0;
        document.querySelectorAll('#qt-tbody tr').forEach(function (row) {
            var qty   = parseFloat((row.querySelector('.qt-qty')   || {}).value || 0) || 0;
            var price = parseFloat((row.querySelector('.qt-price') || {}).value || 0) || 0;
            sub += qty * price;
        });
        var tax   = Math.round(sub * 0.1);
        var total = sub + tax;
        var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
        set('qt-subtotal', fmtYen(sub));
        set('qt-tax',      fmtYen(tax));
        set('qt-total',    fmtYen(total));
    };

    window.qtPrint = function () { window.print(); };

    window.qtGoOrder = function () {
        var knum     = v('qt-knum');
        var customer = v('qt-customer');
        var subject  = v('qt-subject');
        window._smQuotationRec = { knum: knum, customer: customer, subject: subject };
        if (typeof showPage === 'function') showPage('order-registration');
    };

})();
