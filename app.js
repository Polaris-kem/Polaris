// Polaris: 業務・用語・画面対応は docs/ を参照（業務コンテキスト.md, 用語・番号体系.md, 画面と業務の対応.md）
// Supabaseクライアントの初期化
// グローバル変数としてsupabaseを定義（重複宣言を防ぐ）
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = null;
}
// supabaseクライアントを取得する関数（重複宣言を防ぐ）
function getSupabaseClient() {
    return window.supabaseClient;
}
let availableTables = [];
let currentTable = null;
let tableData = [];
let filteredData = [];
let selectedRows = new Set();
let currentPage = 1;
let itemsPerPage = 10000;
let todos = [];
let todoNotificationCheckInterval = null;
let currentTodoFilter = 'all';

// テーブル名の日本語マッピング
const TABLE_NAME_MAP = {
    'machines': '機械コード',
    'machine_codes': '機械コード',
    'MachineCode': '機械コード',
    'machineCode': '機械コード',
    'machine_code': '機械コード',
    'items': '商品管理',
    'products': '商品管理',
    'orders': '注文管理',
    'customers': '顧客管理',
    'suppliers': '仕入先管理',
    'projects': 'プロジェクト管理',
    'employees': '社員管理',
    'users': 'ユーザー管理',
    't_acceptorder': '受注管理',
    't_construction': '工事管理',
    't_staffcode': '社員管理',
    't_workcode': '作業コード管理',
    't_worktime': '作業実績管理',
    't_companycode': '会社コード管理',
    't_workdepartment': '部署・職種管理',
    // テーブル名は英語のまま表示するため、マッピングを削除
};

// カラム名の日本語マッピング（一般的なカラム名）
const COLUMN_NAME_MAP = {
    'id': 'ID',
    'name': '名前',
    'title': 'タイトル',
    'description': '部品名',
    'created_at': '作成日時',
    'updated_at': '更新日時',
    'createdAt': '作成日時',
    'updatedAt': '更新日時',
    'date': '日付',
    'time': '時間',
    'datetime': '日時',
    'email': 'メールアドレス',
    'phone': '電話番号',
    'address': '住所',
    'status': 'ステータス',
    'type': '種類',
    'category': 'カテゴリ',
    'price': '価格',
    'quantity': '数量',
    'amount': '金額',
    'total': '合計',
    'code': 'コード',
    'number': '番号',
    'no': '番号',
    'num': '番号',
    'user_id': 'ユーザーID',
    'userId': 'ユーザーID',
    'user_name': 'ユーザー名',
    'userName': 'ユーザー名',
    'username': 'ユーザー名',
    'password': 'パスワード',
    'department': '部署',
    'is_admin': '管理者',
    'isAdmin': '管理者',
    'active': '有効',
    'enabled': '有効',
    'disabled': '無効',
    'deleted': '削除済み',
    'deleted_at': '削除日時',
    'deletedAt': '削除日時',
    'memo': 'メモ',
    'note': '備考',
    'notes': '備考',
    'comment': 'コメント',
    'comments': 'コメント',
    'file': 'ファイル',
    'files': 'ファイル',
    'image': '画像',
    'images': '画像',
    'url': 'URL',
    'link': 'リンク',
    'order': '順序',
    'sort': '並び順',
    'priority': '優先度',
    'due_date': '期限',
    'dueDate': '期限',
    'start_date': '開始日',
    'startDate': '開始日',
    'end_date': '終了日',
    'endDate': '終了日',
    'completed': '完了',
    'completed_at': '完了日時',
    'completedAt': '完了日時',
    'unit_code': 'ユニットコード',
    'unitCode': 'ユニットコード',
    'Unit Code': 'ユニットコード',
    'unit_name': 'ユニット名',
    'unitName': 'ユニット名',
    'Unit Name': 'ユニット名',
    'unit_name_en': 'ユニット名（英語）',
    'unitNameEn': 'ユニット名（英語）',
    'Unit Name En': 'ユニット名（英語）',
    // t saibanテーブルのカラム名
    'drawing_no': '図面番号',
    'drawingNo': '図面番号',
    'Drawing No': '図面番号',
    'drawing_number': '図面番号',
    'product_name': '品名',
    'productName': '品名',
    '品名': '品名',
    'order_no': '工事番号',
    'orderNo': '工事番号',
    'Order No': '工事番号',
    'order_number': '工事番号',
    'material': '材質',
    'Material': '材質',
    'material_weight': '素材重量',
    'materialWeight': '素材重量',
    'Material Weight': '素材重量',
    'finished_weight': '仕上げ重量',
    'finishedWeight': '仕上げ重量',
    'Finished Weight': '仕上げ重量',
    'designer': '設計者',
    'Designer': '設計者',
    'saiban_date': '採番日',
    'saibanDate': '採番日',
    'Saiban Date': '採番日',
    // t machinecodeテーブルのカラム名
    'machine_code': '機械ｺｰﾄﾞ',
    'machineCode': '機械ｺｰﾄﾞ',
    'MachineCode': '機械ｺｰﾄﾞ',
    'Machine Code': '機械ｺｰﾄﾞ',
    'machine_mark': '機械ｺｰﾄﾞ',
    'machineMark': '機械ｺｰﾄﾞ',
    'MachineMark': '機械ｺｰﾄﾞ',
    'Machine Mark': '機械ｺｰﾄﾞ',
    'machine_mark_code': '機械ｺｰﾄﾞ',
    'machineMarkCode': '機械ｺｰﾄﾞ',
    'MachineMarkCode': '機械ｺｰﾄﾞ',
    'Machine Mark Code': '機械ｺｰﾄﾞ',
    'machine_name': '機械名称',
    'machineName': '機械名称',
    'MachineName': '機械名称',
    'Machine Name': '機械名称',
    'machinename': '機械名称',
    'Machinename': '機械名称',
    'machine_name_eng': '機械名称(英語)',
    'machineNameEng': '機械名称(英語)',
    'MachineNameEng': '機械名称(英語)',
    'Machine Name Eng': '機械名称(英語)',
    // t Accept Orderテーブルのカラム名
    'construct_no': '工事番号',
    'constructno': '工事番号',
    'constructNo': '工事番号',
    'Construct No': '工事番号',
    'register_date': '登録日',
    'registerdate': '登録日',
    'registerDate': '登録日',
    'Register Date': '登録日',
    'construct_name': '工事名称',
    'constructname': '工事名称',
    'constructName': '工事名称',
    'Construct Name': '工事名称',
    'eigyo_manno': '営業担当者',
    'eigyomanno': '営業担当者',
    'eigyoManno': '営業担当者',
    'Eigyo Manno': '営業担当者',
    'owner_code': '受注元',
    'ownercode': '受注元',
    'ownerCode': '受注元',
    'Owner Code': '受注元',
    'user_code': '納品先',
    'usercode': '納品先',
    'userCode': '納品先',
    'User Code': '納品先',
    'order_price': '受注金額',
    'orderprice': '受注金額',
    'orderPrice': '受注金額',
    'Order Price': '受注金額',
    'order_date': '受注日',
    'orderdate': '受注日',
    'orderDate': '受注日',
    'Order Date': '受注日',
    'delivery_date': '納期',
    'deliverydate': '納期',
    'deliveryDate': '納期',
    'Delivery Date': '納期',
    'dealing_doc_mitsumori': '見積書',
    'dealingdocmitsumori': '見積書',
    'dealingDocMitsumori': '見積書',
    'dealing_doc_chuumon': '注文書',
    'dealingdocchuumon': '注文書',
    'dealingDocChuumon': '注文書',
    'Dealing Doc Chuumon': '電子注文書',
    'dealing_doc_seikyu': '電子請求書',
    'dealingDocSeikyu': '電子請求書',
    'Dealing Doc Seikyu': '電子請求書',
    // T_StaffCodeテーブルのカラム名
    'RegiNo': '登録番号',
    'regiNo': '登録番号',
    'Regino': '登録番号',
    'regino': '登録番号',
    'regi_no': '登録番号',
    'StaffCode': '社員番号',
    'staffCode': '社員番号',
    'Staffcode': '社員番号',
    'staffcode': '社員番号',
    'staff_code': '社員番号',
    'StaffName': '氏名',
    'staffName': '氏名',
    'Staffname': '氏名',
    'staffname': '氏名',
    'staff_name': '氏名',
    'Reading': 'フリガナ',
    'reading': 'フリガナ',
    'DepaCode': '部署コード',
    'depaCode': '部署コード',
    'Depacode': '部署コード',
    'depacode': '部署コード',
    'depa_code': '部署コード',
    'SubDepaCode': 'サブ部署コード',
    'subDepaCode': 'サブ部署コード',
    'Subdepacode': 'サブ部署コード',
    'subdepacode': 'サブ部署コード',
    'sub_depa_code': 'サブ部署コード',
    'OldDepaCode': '旧部署コード',
    'oldDepaCode': '旧部署コード',
    'Olddepacode': '旧部署コード',
    'olddepacode': '旧部署コード',
    'old_depa_code': '旧部署コード',
    'WorkDepa': '勤務地/勤務部署',
    'workDepa': '勤務地/勤務部署',
    'Workdepa': '勤務地/勤務部署',
    'workdepa': '勤務地/勤務部署',
    'work_depa': '勤務地/勤務部署',
    'TcpIp': 'IPアドレス',
    'tcpIp': 'IPアドレス',
    'Tcpip': 'IPアドレス',
    'tcpip': 'IPアドレス',
    'tcp_ip': 'IPアドレス',
    'LoginID': 'ログインID',
    'loginID': 'ログインID',
    'Loginid': 'ログインID',
    'loginid': 'ログインID',
    'login_id': 'ログインID',
    'LoginPassword': 'パスワード',
    'loginPassword': 'パスワード',
    'Loginpassword': 'パスワード',
    'loginpassword': 'パスワード',
    'login_password': 'パスワード',
    'StaffCross': 'スタッフ区分等',
    'staffCross': 'スタッフ区分等',
    'Staffcross': 'スタッフ区分等',
    'staffcross': 'スタッフ区分等',
    'staff_cross': 'スタッフ区分等',
    'MailAddress': 'メールアドレス',
    'mailAddress': 'メールアドレス',
    'Mailaddress': 'メールアドレス',
    'mailaddress': 'メールアドレス',
    'mail_address': 'メールアドレス',
    'SQLusername': 'SQLユーザ名',
    'sqlUsername': 'SQLユーザ名',
    'Sqlusername': 'SQLユーザ名',
    'sqlusername': 'SQLユーザ名',
    'sql_username': 'SQLユーザ名',
    'SQLusergroup': 'SQLグループ',
    'sqlUsergroup': 'SQLグループ',
    'Sqlusergroup': 'SQLグループ',
    'sqlusergroup': 'SQLグループ',
    'sql_usergroup': 'SQLグループ',
    'TelNo': '電話番号',
    'telNo': '電話番号',
    'Telno': '電話番号',
    'telno': '電話番号',
    'tel_no': '電話番号',
    'FaxNo': 'FAX番号',
    'faxNo': 'FAX番号',
    'Faxno': 'FAX番号',
    'faxno': 'FAX番号',
    'fax_no': 'FAX番号',
    'InternalTelNo': '内線番号',
    'internalTelNo': '内線番号',
    'Internaltelno': '内線番号',
    'internaltelno': '内線番号',
    'internal_tel_no': '内線番号',
    'CellPhone': '携帯電話',
    'cellPhone': '携帯電話',
    'Cellphone': '携帯電話',
    'cellphone': '携帯電話',
    'cell_phone': '携帯電話',
    'Position': '役職',
    'position': '役職',
    'YukyuZan': '有給残日数',
    'yukyuZan': '有給残日数',
    'yukyu_zan': '有給残日数',
    'YukyuZanDate': '有給残更新日',
    'yukyuZanDate': '有給残更新日',
    'yukyu_zan_date': '有給残更新日',
    'NuyusyaDate': '入社年月日',
    'nuyusyaDate': '入社年月日',
    'nuyusya_date': '入社年月日',
    'DaikyuZan': '代休残',
    'daikyuZan': '代休残',
    'daikyu_zan': '代休残',
    'DaikyuZanDate': '代休残更新日',
    'daikyuZanDate': '代休残更新日',
    'daikyu_zan_date': '代休残更新日',
    'FurikyuZan': '振休残',
    'furikyuZan': '振休残',
    'furikyu_zan': '振休残',
    'FurikyuZanDate': '振休残更新日',
    'furikyuZanDate': '振休残更新日',
    'furikyu_zan_date': '振休残更新日',
    'HankyuCount': '半休消化回数',
    'hankyuCount': '半休消化回数',
    'hankyu_count': '半休消化回数',
    'HankyuCountDate': '半休カウント日',
    'hankyuCountDate': '半休カウント日',
    'hankyu_count_date': '半休カウント日',
    'FixedSalary': '固定給/基本給等',
    'fixedSalary': '固定給/基本給等',
    'fixed_salary': '固定給/基本給等',
    'SubAccount': 'サブアカウント',
    'subAccount': 'サブアカウント',
    'sub_account': 'サブアカウント',
    'HankyuWarningMailFor9': '半休警告メール(9回)',
    'hankyuWarningMailFor9': '半休警告メール(9回)',
    'hankyu_warning_mail_for9': '半休警告メール(9回)',
    'HankyuWarningMailFor10': '半休警告メール(10回)',
    'hankyuWarningMailFor10': '半休警告メール(10回)',
    'hankyu_warning_mail_for10': '半休警告メール(10回)',
    // T_CompanyCodeテーブルのカラム名
    'CompanyCode': '会社コード',
    'companyCode': '会社コード',
    'company_code': '会社コード',
    'UrikakeCode': '売掛コード',
    'urikakeCode': '売掛コード',
    'urikake_code': '売掛コード',
    'KaikakeCode': '買掛コード',
    'kaikakeCode': '買掛コード',
    'kaikake_code': '買掛コード',
    'CompanyName': '会社名',
    'companyName': '会社名',
    'company_name': '会社名',
    'ShortName': '略称',
    'shortName': '略称',
    'short_name': '略称',
    'Reading': 'フリガナ',
    'reading': 'フリガナ',
    'ReadingRegister': '登録用フリガナ',
    'readingRegister': '登録用フリガナ',
    'reading_register': '登録用フリガナ',
    'Nationality': '国籍',
    'nationality': '国籍',
    'PostalCode': '郵便番号',
    'postalCode': '郵便番号',
    'postal_code': '郵便番号',
    'Address1': '住所1',
    'address1': '住所1',
    'address_1': '住所1',
    'Address2': '住所2',
    'address2': '住所2',
    'address_2': '住所2',
    'TEL': '電話番号',
    'tel': '電話番号',
    'FAX': 'FAX番号',
    'fax': 'FAX番号',
    'ClassCustomer': '得意先区分',
    'classCustomer': '得意先区分',
    'class_customer': '得意先区分',
    'ClassSupply': '仕入先区分',
    'classSupply': '仕入先区分',
    'class_supply': '仕入先区分',
    'ClassProcess': '外注先区分',
    'classProcess': '外注先区分',
    'class_process': '外注先区分',
    'ClassGeneAffair': '総務区分',
    'classGeneAffair': '総務区分',
    'class_gene_affair': '総務区分',
    'ClassOther': 'その他区分',
    'classOther': 'その他区分',
    'class_other': 'その他区分',
    'AccountCode': '勘定科目コード',
    'accountCode': '勘定科目コード',
    'account_code': '勘定科目コード',
    'Spare1': '予備1',
    'spare1': '予備1',
    'spare_1': '予備1',
    'Spare2': '予備2',
    'spare2': '予備2',
    'spare_2': '予備2',
    'CompanyCross': '会社区分',
    'companyCross': '会社区分',
    'company_cross': '会社区分',
    'Tantou': '担当者名',
    'tantou': '担当者名',
    'Department': '部署名',
    'department': '部署名',
    'Bank': '銀行名',
    'bank': '銀行名',
    'TransFee1': '振込手数料1',
    'transFee1': '振込手数料1',
    'trans_fee1': '振込手数料1',
    'TransFee2': '振込手数料2',
    'transFee2': '振込手数料2',
    'trans_fee2': '振込手数料2',
    'TransFee3': '振込手数料3',
    'transFee3': '振込手数料3',
    'trans_fee3': '振込手数料3',
    'TransFee4': '振込手数料4',
    'transFee4': '振込手数料4',
    'trans_fee4': '振込手数料4',
    'Payment': '支払条件',
    'payment': '支払条件',
    'ClassForKeiri': '経理用区分',
    'classForKeiri': '経理用区分',
    'class_for_keiri': '経理用区分',
    'MailAddress': 'メールアドレス',
    'mailAddress': 'メールアドレス',
    'mail_address': 'メールアドレス',
    'KaigaiGaichuFlg': '海外外注フラグ',
    'kaigaiGaichuFlg': '海外外注フラグ',
    'kaigai_gaichu_flg': '海外外注フラグ',
    'BearTransFeeFlg': '手数料負担フラグ',
    'bearTransFeeFlg': '手数料負担フラグ',
    'bear_trans_fee_flg': '手数料負担フラグ',
    'DealingDocMitsumoriFlg': '見積書発行フラグ',
    'dealingDocMitsumoriFlg': '見積書発行フラグ',
    'dealing_doc_mitsumori_flg': '見積書発行フラグ',
    'DealingDocSeikyuFlg': '請求書発行フラグ',
    'dealingDocSeikyuFlg': '請求書発行フラグ',
    'dealing_doc_seikyu_flg': '請求書発行フラグ',
    'DealingDocChumonFlg': '注文書発行フラグ',
    'dealingDocChumonFlg': '注文書発行フラグ',
    'dealing_doc_chumon_flg': '注文書発行フラグ',
    'DealingDocNouhinFlg': '納品書発行フラグ',
    'dealingDocNouhinFlg': '納品書発行フラグ',
    'dealing_doc_nouhin_flg': '納品書発行フラグ',
    'DealingDocRyousyuFlg': '領収書発行フラグ',
    'dealingDocRyousyuFlg': '領収書発行フラグ',
    'dealing_doc_ryousyu_flg': '領収書発行フラグ',
    'DealingDocKensyuFlg': '検収書発行フラグ',
    'dealingDocKensyuFlg': '検収書発行フラグ',
    'dealing_doc_kensyu_flg': '検収書発行フラグ',
    'TaxCarryUpDown': '端数処理',
    'taxCarryUpDown': '端数処理',
    'tax_carry_up_down': '端数処理',
    'TaxCalcWay': '税計算方法',
    'taxCalcWay': '税計算方法',
    'tax_calc_way': '税計算方法',
    'TaxDecimalCalc': '消費税小数処理',
    'taxDecimalCalc': '消費税小数処理',
    'tax_decimal_calc': '消費税小数処理',
    'MailAddress2': 'メールアドレス2',
    'mailAddress2': 'メールアドレス2',
    'mail_address2': 'メールアドレス2',
    'MailAddress3': 'メールアドレス3',
    'mailAddress3': 'メールアドレス3',
    'mail_address3': 'メールアドレス3'
};

// カラム名を日本語に変換する関数
function getColumnDisplayName(columnName) {
    if (!columnName) return columnName;
    
    // 完全一致でマッピングを確認
    if (COLUMN_NAME_MAP[columnName]) {
        return COLUMN_NAME_MAP[columnName];
    }
    
    // 大文字小文字を区別しない検索（複数のパターンを試す）
    const variations = [
        columnName,                                    // 元のまま
        columnName.toLowerCase(),                      // すべて小文字
        columnName.toUpperCase(),                     // すべて大文字
        columnName.charAt(0).toUpperCase() + columnName.slice(1).toLowerCase(), // 最初だけ大文字
        columnName.replace(/([A-Z])/g, '_$1').toLowerCase(), // カメルケースをスネークケースに
        columnName.replace(/_/g, ''),                 // アンダースコアを削除
        columnName.replace(/_/g, '').charAt(0).toUpperCase() + columnName.replace(/_/g, '').slice(1).toLowerCase() // アンダースコア削除後、最初だけ大文字
    ];
    
    for (const variation of variations) {
        if (COLUMN_NAME_MAP[variation]) {
            return COLUMN_NAME_MAP[variation];
        }
    }
    
    // スネークケースを変換（例: user_name -> ユーザー名）
    const snakeCase = columnName.toLowerCase();
    if (COLUMN_NAME_MAP[snakeCase]) {
        return COLUMN_NAME_MAP[snakeCase];
    }
    
    // スペースを含む形式を変換（例: Unit Code -> unit_code）
    const spaceToUnderscore = columnName.replace(/\s+/g, '_').toLowerCase();
    if (COLUMN_NAME_MAP[spaceToUnderscore]) {
        return COLUMN_NAME_MAP[spaceToUnderscore];
    }
    
    // カメルケースを変換（例: userName -> ユーザー名）
    const camelCase = columnName.charAt(0).toLowerCase() + columnName.slice(1);
    if (COLUMN_NAME_MAP[camelCase]) {
        return COLUMN_NAME_MAP[camelCase];
    }
    
    // 部分一致で検索（大文字小文字を区別しない）
    const colLower = columnName.toLowerCase();
    for (const [key, value] of Object.entries(COLUMN_NAME_MAP)) {
        if (key.toLowerCase() === colLower) {
            return value;
        }
    }
    
    // アンダースコアをスペースに変換して読みやすくする
    let displayName = columnName
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim();
    
    // 各単語の最初の文字を大文字に
    displayName = displayName.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    
    return displayName || columnName;
}

// テーブル名を日本語に変換する関数
function getTableDisplayName(tableName) {
    return tableName;
}

// セッション取得
function getPolarisSession() {
    try { return JSON.parse(localStorage.getItem('polaris_session') || 'null'); }
    catch(e) { return null; }
}

// ログイン状態の確認
function checkLoginStatus() {
    const session = getPolarisSession();
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    if (session && session.staffcode) {
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        // ヘッダーにユーザー名表示
        const nameEl = document.getElementById('login-user-name');
        if (nameEl) nameEl.textContent = session.staffname || session.loginid;
        if (typeof updateSidebarUserDisplay === 'function') updateSidebarUserDisplay();
        if (typeof renderAllCustomLinks === 'function') renderAllCustomLinks();
        return true;
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        // Enterキーでログイン
        setTimeout(() => {
            const pw = document.getElementById('login-password');
            if (pw) pw.onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };
            const id = document.getElementById('login-id');
            if (id) id.onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('login-password')?.focus(); };
        }, 100);
        return false;
    }
}

// ログイン実行
async function doLogin() {
    const loginId = (document.getElementById('login-id')?.value || '').trim();
    const password = (document.getElementById('login-password')?.value || '').trim();
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    if (!loginId || !password) {
        if (errEl) { errEl.textContent = 'ログインIDとパスワードを入力してください'; errEl.style.display = ''; }
        return;
    }
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 確認中...'; }
    try {
        const sb = window.supabaseClient;
        if (!sb) throw new Error('DB未接続');
        const { data, error } = await sb.rpc('polaris_login', { p_loginid: loginId, p_password: password });
        if (error) throw error;
        if (!data || data.length === 0) {
            if (errEl) { errEl.textContent = 'ログインIDまたはパスワードが正しくありません'; errEl.style.display = ''; }
            return;
        }
        const user = data[0];
        localStorage.setItem('polaris_session', JSON.stringify({
            staffcode: user.out_staffcode,
            staffname: user.out_staffname,
            depacode:  user.out_depacode,
            position:  user.out_position,
            loginid:   user.out_loginid
        }));
        checkLoginStatus();
    } catch(e) {
        if (errEl) { errEl.textContent = 'エラー: ' + e.message; errEl.style.display = ''; }
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ログイン'; }
    }
}

// ログアウト
function doLogout() {
    if (!confirm('ログアウトしますか？')) return;
    localStorage.removeItem('polaris_session');
    checkLoginStatus();
}

// パスワードをハッシュ化（簡易版 - 本番環境ではbcryptなどを使用）
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36) + password.length.toString(36);
}

// ユーザー認証情報を取得
function getUserCredentials() {
    const stored = localStorage.getItem('userCredentials');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// ユーザー認証情報を保存
function saveUserCredentials(username, passwordHash) {
    const credentials = {
        username: username,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('userCredentials', JSON.stringify(credentials));
}

// 初回ログイン設定を確認
function isFirstLogin() {
    const credentials = getUserCredentials();
    return !credentials || !credentials.passwordHash;
}

// ログイン処理
function handleLogin(username, password, remember) {
    if (!username || !password) {
        return false;
    }
    
    // ユーザー管理のユーザーリストを確認
    loadUsers();
    
    // ユーザー管理に登録されている場合は、そちらで認証
    let user = users.find(u => u.loginId === username);
    
    if (user) {
        // 既存ユーザーの認証
        const inputHash = hashPassword(password);
        // パスワードハッシュが空の場合は、初回ログインとして扱う
        if (!user.passwordHash || user.passwordHash === '') {
            // パスワードハッシュが空の場合は、入力されたパスワードを設定
            user.passwordHash = inputHash;
            saveUsers();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', user.pcName || user.loginId);
            localStorage.setItem('loginId', user.loginId);
            if (remember) {
                localStorage.setItem('rememberLogin', 'true');
            }
            checkLoginStatus();
            return true;
        } else if (user.passwordHash === inputHash) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', user.pcName || user.loginId);
            localStorage.setItem('loginId', user.loginId);
            if (remember) {
                localStorage.setItem('rememberLogin', 'true');
            }
            checkLoginStatus();
            return true;
        }
        // パスワードが間違っている場合は認証失敗
        return false;
    } else {
        // ユーザー管理に登録されていない場合は自動的に追加
        const passwordHash = hashPassword(password);
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
        const newUser = {
            id: newId,
            pcName: username, // 初期値はログインIDと同じ
            loginId: username,
            passwordHash: passwordHash,
            department: '', // 部署は後で設定
            isAdmin: false, // 管理者フラグは後で設定
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers();
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('loginId', username);
        if (remember) {
            localStorage.setItem('rememberLogin', 'true');
        }
        checkLoginStatus();
        return true;
    }
}

// 個人設定（ログインごと。localStorage に userSettings_{loginId} で保存）
function getCurrentLoginId() {
    return localStorage.getItem('loginId') || localStorage.getItem('username') || 'default';
}
function getUserSettings() {
    const loginId = getCurrentLoginId();
    const key = 'userSettings_' + loginId;
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch (e) {
        return {};
    }
}
function saveUserSettings(settings) {
    const loginId = getCurrentLoginId();
    const key = 'userSettings_' + loginId;
    localStorage.setItem(key, JSON.stringify(settings));
    updateSidebarUserDisplay();
    renderAllCustomLinks();
}

// ====== カスタムリンク管理 ======

// 管理者チェック
function isCurrentUserAdmin() {
    var loginId = getCurrentLoginId();
    if (typeof loadUsers === 'function') loadUsers();
    if (typeof users === 'undefined' || !Array.isArray(users)) return false;
    var user = users.find(function(u) { return u.loginId === loginId; });
    return user ? user.isAdmin === true : false;
}

// 全体リンクの取得・保存（localStorageキャッシュ + Supabase永続化）
function getGlobalCustomLinks() {
    try { return JSON.parse(localStorage.getItem('globalCustomLinks') || '[]'); }
    catch(e) { return []; }
}
function saveGlobalCustomLinks(list) {
    localStorage.setItem('globalCustomLinks', JSON.stringify(list));
    renderAllCustomLinks();
    // Supabaseにも保存（非同期・バックグラウンド）
    _saveGlobalLinksToSupabase(list);
}
async function _saveGlobalLinksToSupabase(list) {
    const sb = window.supabaseClient;
    if (!sb) return;
    try {
        await sb.from('t_custom_links').delete().eq('link_type', 'global');
        if (list.length > 0) {
            await sb.from('t_custom_links').insert(list.map((item, i) => ({
                link_type: 'global',
                label: item.label || item.url,
                url: item.url,
                fa_icon: item.faIcon || null,
                img_data: item.imgData || null,
                same_tab: item.sameTab !== false,
                depts: item.depts || [],
                sort_order: i,
                updated_at: new Date().toISOString()
            })));
        }
    } catch(e) { console.warn('リンクSupabase保存エラー:', e); }
}
async function _loadGlobalLinksFromSupabase() {
    const sb = window.supabaseClient;
    if (!sb) return;
    try {
        const { data } = await sb.from('t_custom_links').select('*')
            .eq('link_type', 'global').order('sort_order');
        if (data && data.length > 0) {
            const links = data.map(r => ({
                label: r.label, url: r.url, faIcon: r.fa_icon,
                imgData: r.img_data, sameTab: r.same_tab, depts: r.depts || []
            }));
            localStorage.setItem('globalCustomLinks', JSON.stringify(links));
            renderAllCustomLinks();
        }
    } catch(e) { console.warn('リンクSupabase読み込みエラー:', e); }
}

// URLからアイコン自動推測
function guessIconFromUrl(url, label) {
    var s = ((url || '') + ' ' + (label || '')).toLowerCase();
    if (/youtube/.test(s)) return 'fa-play-circle';
    if (/github/.test(s)) return 'fa-code-branch';
    if (/drive\.google/.test(s)) return 'fa-cloud';
    if (/onedrive|sharepoint/.test(s)) return 'fa-cloud';
    if (/docs\.google/.test(s)) return 'fa-file-word';
    if (/sheets\.google/.test(s)) return 'fa-file-excel';
    if (/slides\.google/.test(s)) return 'fa-file-powerpoint';
    if (/excel|\.xlsx/.test(s)) return 'fa-file-excel';
    if (/word|\.docx/.test(s)) return 'fa-file-word';
    if (/\.pdf/.test(s)) return 'fa-file-pdf';
    if (/mail|outlook|gmail/.test(s)) return 'fa-envelope';
    if (/zoom|meet\.google/.test(s)) return 'fa-video';
    if (/teams/.test(s)) return 'fa-users';
    if (/slack/.test(s)) return 'fa-comments';
    if (/maps?\.google/.test(s)) return 'fa-map-marker-alt';
    if (/calendar/.test(s)) return 'fa-calendar-alt';
    if (/chat|line\.me/.test(s)) return 'fa-comment';
    if (/wiki/.test(s)) return 'fa-book';
    if (/report|レポート|報告/.test(s)) return 'fa-chart-bar';
    if (/manual|マニュアル/.test(s)) return 'fa-book-open';
    if (/注文|発注/.test(s)) return 'fa-shopping-cart';
    if (/在庫|stock/.test(s)) return 'fa-boxes';
    if (/社内|intranet/.test(s)) return 'fa-building';
    if (/map|地図/.test(s)) return 'fa-map';
    return 'fa-external-link-alt';
}

// カスタムリンクボタンのDOM要素生成
function buildCustomLinkBtn(item) {
    var a = document.createElement('a');
    a.href = item.url || '#';
    if (item.url && item.sameTab === false) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.className = 'dept-hub-btn';
    a.style.textDecoration = 'none';
    var iconHtml;
    if (item.imgData) {
        iconHtml = '<img src="' + escapeHtml(item.imgData) + '" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" alt="">';
    } else {
        var fa = item.faIcon || guessIconFromUrl(item.url, item.label);
        iconHtml = '<i class="fas ' + escapeHtml(fa) + '"></i>';
    }
    a.innerHTML = iconHtml + '<span>' + escapeHtml(item.label || item.url || 'リンク') + '</span>';
    return a;
}

// 全ページにカスタムリンクを描画
function renderAllCustomLinks() {
    var s = getUserSettings();
    var personal = Array.isArray(s.customLinks) ? s.customLinks :
                   (Array.isArray(s.customQuickActions) ? s.customQuickActions : []);
    var global = getGlobalCustomLinks();

    // ホームダッシュボード
    var homeCard = document.getElementById('dashboard-custom-links');
    var homeGrid = document.getElementById('custom-links-grid');
    if (homeGrid) {
        homeGrid.innerHTML = '';
        var homeItems = personal.concat(
            global.filter(function(it) { return it.depts && it.depts.indexOf('home') !== -1; })
        );
        if (homeCard) homeCard.style.display = homeItems.length > 0 ? '' : 'none';
        homeItems.forEach(function(it) { homeGrid.appendChild(buildCustomLinkBtn(it)); });
    }

    // 各ハブページ（既存グリッドに直接追加）
    var deptPageMap = {
        sales:'sales-hub-page', design:'design-hub-page', ops:'ops-hub-page',
        mfg:'mfg-hub-page', akashi:'akashi-hub-page', assy:'assy-hub-page', general:'general-hub-page'
    };
    Object.keys(deptPageMap).forEach(function(dept) {
        var page = document.getElementById(deptPageMap[dept]);
        if (!page) return;
        var grid = page.querySelector('.dept-hub-grid');
        if (!grid) return;
        // 前回追加したカスタムボタンを削除
        grid.querySelectorAll('.cl-custom-btn').forEach(function(el) { el.remove(); });
        var items = global.filter(function(it) { return it.depts && it.depts.indexOf(dept) !== -1; });
        items.forEach(function(it) {
            var btn = buildCustomLinkBtn(it);
            btn.classList.add('cl-custom-btn');
            grid.appendChild(btn);
        });
    });
}

// ====== カスタムリンクフォーム ======

var ICON_CANDIDATES_ALL = [
    // 🏭 製造・工場
    'fa-industry','fa-cogs','fa-tools','fa-wrench','fa-hammer',
    'fa-screwdriver','fa-hard-hat','fa-drafting-compass','fa-ruler-combined','fa-ruler',
    'fa-toolbox','fa-oil-can','fa-burn','fa-bolt','fa-tachometer-alt',
    'fa-thermometer-half','fa-cut','fa-warehouse','fa-pallet','fa-boxes',
    'fa-box','fa-truck','fa-truck-loading','fa-dolly','fa-flask',
    // 💼 事務・ビジネス
    'fa-briefcase','fa-building','fa-sitemap','fa-user-tie','fa-users',
    'fa-handshake','fa-file-signature','fa-file-contract','fa-file-invoice','fa-receipt',
    'fa-stamp','fa-calculator','fa-coins','fa-money-bill-wave','fa-cash-register',
    'fa-pen-alt','fa-pencil-alt','fa-highlighter','fa-paperclip','fa-inbox',
    'fa-print','fa-fax','fa-calendar-check','fa-clipboard-check','fa-tasks',
    'fa-chart-bar','fa-chart-line','fa-chart-pie','fa-table','fa-clipboard-list',
    // 📄 書類・ファイル
    'fa-file-alt','fa-file-excel','fa-file-word','fa-file-pdf','fa-file-powerpoint',
    'fa-folder','fa-folder-open','fa-archive','fa-paste','fa-copy',
    // 💻 パソコン・IT
    'fa-laptop','fa-desktop','fa-tablet-alt','fa-mobile-alt','fa-keyboard',
    'fa-server','fa-database','fa-network-wired','fa-wifi','fa-microchip',
    'fa-memory','fa-hdd','fa-cloud','fa-cloud-upload-alt','fa-cloud-download-alt',
    'fa-download','fa-upload','fa-sync-alt','fa-code','fa-code-branch',
    'fa-terminal','fa-shield-alt','fa-lock','fa-key','fa-qrcode','fa-barcode',
    // 📬 コミュニケーション
    'fa-envelope','fa-envelope-open','fa-paper-plane','fa-comments','fa-comment-alt',
    'fa-phone','fa-headset','fa-video','fa-bell','fa-at',
    // 🌐 その他
    'fa-globe','fa-external-link-alt','fa-link','fa-home','fa-map-marker-alt',
    'fa-search','fa-star','fa-bookmark','fa-calendar-alt','fa-clock',
    'fa-cog','fa-lightbulb','fa-flag','fa-check-square','fa-exclamation-triangle'
];

function getIconCandidates(url, label, selected) {
    var guessed = guessIconFromUrl(url, label);
    var pool = [guessed];
    for (var i = 0; i < ICON_CANDIDATES_ALL.length; i++) {
        if (ICON_CANDIDATES_ALL[i] !== guessed) pool.push(ICON_CANDIDATES_ALL[i]);
    }
    if (selected && pool.indexOf(selected) === -1) {
        pool = [selected].concat(pool.slice(0, pool.length - 1));
    } else if (selected && pool[0] !== selected) {
        pool.splice(pool.indexOf(selected), 1);
        pool.unshift(selected);
    }
    return pool;
}

var DEPT_LIST = [
    { key:'home', label:'ホーム' },
    { key:'sales', label:'営業部' },
    { key:'design', label:'製造設計部' },
    { key:'ops', label:'操業部' },
    { key:'mfg', label:'製造管理部' },
    { key:'akashi', label:'明石製造部' },
    { key:'assy', label:'組立部' },
    { key:'general', label:'総務部' }
];

// 個人/全体共通のリンク行を生成
function buildClRow(item, isGlobal) {
    item = item || {};
    var rowId = 'clrow_' + Math.random().toString(36).slice(2, 8);
    var row = document.createElement('div');
    row.className = 'cl-row';

    // ドラッグハンドル
    var dragHandle = document.createElement('div');
    dragHandle.className = 'cl-drag-handle';
    dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    dragHandle.title = 'ドラッグして並び替え';
    dragHandle.addEventListener('mousedown', function() { row.draggable = true; });
    row.addEventListener('dragend', function() {
        row.draggable = false;
        row.classList.remove('cl-dragging');
        if (row.parentNode) {
            row.parentNode.querySelectorAll('.cl-row').forEach(function(r) { r.classList.remove('cl-drag-over'); });
        }
    });
    row.addEventListener('dragstart', function(e) {
        window._clDragSrc = row;
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('cl-dragging');
    });
    row.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (window._clDragSrc && window._clDragSrc !== row) row.classList.add('cl-drag-over');
    });
    row.addEventListener('dragleave', function() { row.classList.remove('cl-drag-over'); });
    row.addEventListener('drop', function(e) {
        e.preventDefault();
        row.classList.remove('cl-drag-over');
        var src = window._clDragSrc;
        if (src && src !== row && row.parentNode) {
            var siblings = Array.from(row.parentNode.querySelectorAll('.cl-row'));
            if (siblings.indexOf(src) < siblings.indexOf(row)) {
                row.parentNode.insertBefore(src, row.nextSibling);
            } else {
                row.parentNode.insertBefore(src, row);
            }
        }
    });
    row.appendChild(dragHandle);

    // プレビュー
    var initFa = item.faIcon || guessIconFromUrl(item.url, item.label);
    var previewBtn = document.createElement('a');
    previewBtn.className = 'dept-hub-btn cl-preview-mini';
    previewBtn.href = '#';
    previewBtn.onclick = function(e) { e.preventDefault(); };
    previewBtn.innerHTML = item.imgData
        ? '<img class="cl-prev-icon" src="' + escapeHtml(item.imgData) + '" style="width:36px;height:36px;border-radius:8px;object-fit:cover;" alt=""><span>' + escapeHtml(item.label || 'リンク名') + '</span>'
        : '<i class="fas ' + escapeHtml(initFa) + ' cl-prev-icon"></i><span>' + escapeHtml(item.label || 'リンク名') + '</span>';
    row.appendChild(previewBtn);

    // フォームエリア
    var formDiv = document.createElement('div');
    formDiv.className = 'cl-form';

    // 1行目: 表示名 + URL
    var line1 = document.createElement('div');
    line1.className = 'cl-line1';
    var labelInput = document.createElement('input');
    labelInput.type = 'text'; labelInput.className = 'form-input cl-f-label'; labelInput.placeholder = '表示名'; labelInput.value = item.label || '';
    var urlInput = document.createElement('input');
    urlInput.type = 'text'; urlInput.className = 'form-input cl-f-url'; urlInput.placeholder = 'https://...'; urlInput.value = item.url || '';
    line1.appendChild(labelInput); line1.appendChild(urlInput);
    formDiv.appendChild(line1);

    // アイコン候補ピッカー
    var pickerWrap = document.createElement('div');
    pickerWrap.className = 'cl-icon-picker';
    var pickerLbl = document.createElement('span');
    pickerLbl.className = 'cl-picker-label'; pickerLbl.textContent = 'アイコン';
    pickerWrap.appendChild(pickerLbl);
    var candidatesDiv = document.createElement('div');
    candidatesDiv.className = 'cl-icon-candidates';
    pickerWrap.appendChild(candidatesDiv);

    // 画像サムネイル
    var imgThumb = document.createElement('img');
    imgThumb.className = 'cl-img-thumb-small';
    if (item.imgData) { imgThumb.src = item.imgData; imgThumb.style.display = ''; } else { imgThumb.style.display = 'none'; }
    pickerWrap.appendChild(imgThumb);
    formDiv.appendChild(pickerWrap);

    var hasImg = !!item.imgData;

    function updatePreview() {
        var lbl = labelInput.value.trim(), url = urlInput.value.trim();
        var spanEl = previewBtn.querySelector('span');
        if (spanEl) spanEl.textContent = lbl || url || 'リンク名';
        var iconEl = previewBtn.querySelector('.cl-prev-icon');
        if (hasImg && imgThumb.src && imgThumb.src.startsWith('data:')) {
            var newTag = '<img class="cl-prev-icon" src="' + escapeHtml(imgThumb.src) + '" style="width:36px;height:36px;border-radius:8px;object-fit:cover;" alt="">';
            if (iconEl) { iconEl.outerHTML = newTag; } else { previewBtn.insertAdjacentHTML('afterbegin', newTag); }
        } else {
            var selR = candidatesDiv.querySelector('input[type=radio]:checked');
            var fa = selR ? selR.value : guessIconFromUrl(url, lbl);
            if (iconEl && iconEl.tagName === 'I') { iconEl.className = 'fas ' + fa + ' cl-prev-icon'; }
            else if (iconEl) { iconEl.outerHTML = '<i class="fas ' + fa + ' cl-prev-icon"></i>'; }
            else { previewBtn.insertAdjacentHTML('afterbegin', '<i class="fas ' + fa + ' cl-prev-icon"></i>'); }
        }
    }

    function rebuildCandidates(url, label, selFa, useImg) {
        candidatesDiv.innerHTML = '';
        var cands = getIconCandidates(url, label, selFa);
        var grp = rowId + '_icon';
        cands.forEach(function(fa) {
            var lbl = document.createElement('label');
            lbl.className = 'cl-icon-opt'; lbl.title = fa.replace('fa-', '');
            var radio = document.createElement('input');
            radio.type = 'radio'; radio.name = grp; radio.value = fa; radio.hidden = true;
            if (!useImg && fa === (selFa || cands[0])) { radio.checked = true; lbl.classList.add('selected'); }
            var icon = document.createElement('i');
            icon.className = 'fas ' + fa;
            lbl.appendChild(radio);
            lbl.appendChild(icon);
            lbl.addEventListener('click', function() {
                hasImg = false; imgThumb.style.display = 'none';
                radio.checked = true;
                candidatesDiv.querySelectorAll('.cl-icon-opt').forEach(function(x) { x.classList.remove('selected'); });
                lbl.classList.add('selected');
                updatePreview();
            });
            candidatesDiv.appendChild(lbl);
        });
        // 画像ボタン
        var imgLbl = document.createElement('label');
        imgLbl.className = 'cl-icon-opt cl-icon-img-opt' + (useImg ? ' selected' : '');
        imgLbl.title = '画像をアップロード';
        var imgFile = document.createElement('input');
        imgFile.type = 'file'; imgFile.accept = 'image/*';
        imgFile.style.cssText = 'display:none;position:absolute;';
        imgFile.addEventListener('change', function() {
            var f = imgFile.files[0]; if (!f) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                imgThumb.src = e.target.result; imgThumb.style.display = '';
                hasImg = true;
                candidatesDiv.querySelectorAll('.cl-icon-opt').forEach(function(x) { x.classList.remove('selected'); });
                imgLbl.classList.add('selected');
                updatePreview();
            };
            reader.readAsDataURL(f);
        });
        var imgIcon = document.createElement('i');
        imgIcon.className = 'fas fa-image';
        var imgTxt = document.createElement('span');
        imgTxt.textContent = '画像';
        imgTxt.style.cssText = 'font-size:9px;display:block;margin-top:2px;line-height:1;';
        imgLbl.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;width:44px;height:40px;font-size:14px;cursor:pointer;';
        imgLbl.appendChild(imgFile);
        imgLbl.appendChild(imgIcon);
        imgLbl.appendChild(imgTxt);
        if (useImg) imgLbl.classList.add('selected');
        candidatesDiv.appendChild(imgLbl);
    }

    rebuildCandidates(item.url, item.label, item.faIcon || null, hasImg);

    // 同じタブで開くオプション
    var sameTabLine = document.createElement('div');
    sameTabLine.className = 'cl-dept-line';
    var sameTabLbl = document.createElement('label'); sameTabLbl.className = 'cl-dept-check';
    var sameTabCb = document.createElement('input'); sameTabCb.type = 'checkbox'; sameTabCb.className = 'cl-same-tab-cb'; sameTabCb.checked = item.sameTab !== false;
    sameTabLbl.appendChild(sameTabCb); sameTabLbl.appendChild(document.createTextNode('同じタブで開く（ブラウザの戻るボタンで戻れます）'));
    sameTabLine.appendChild(sameTabLbl);
    formDiv.appendChild(sameTabLine);

    // 部署チェック（全体のみ）
    if (isGlobal) {
        var deptLine = document.createElement('div');
        deptLine.className = 'cl-dept-line';
        var deptLbl = document.createElement('span');
        deptLbl.className = 'cl-dept-label'; deptLbl.textContent = '表示場所';
        deptLine.appendChild(deptLbl);
        var depts = Array.isArray(item.depts) ? item.depts : ['home'];
        DEPT_LIST.forEach(function(d) {
            var lbl = document.createElement('label'); lbl.className = 'cl-dept-check';
            var cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'cl-dept-cb'; cb.value = d.key; cb.checked = depts.indexOf(d.key) !== -1;
            lbl.appendChild(cb); lbl.appendChild(document.createTextNode(d.label));
            deptLine.appendChild(lbl);
        });
        formDiv.appendChild(deptLine);
    }

    row.appendChild(formDiv);

    // 削除ボタン
    var delBtn = document.createElement('button');
    delBtn.type = 'button'; delBtn.className = 'cl-del-btn'; delBtn.innerHTML = '<i class="fas fa-trash"></i>'; delBtn.title = '削除';
    delBtn.addEventListener('click', function() { row.remove(); });
    row.appendChild(delBtn);

    // イベント
    labelInput.addEventListener('input', updatePreview);
    urlInput.addEventListener('input', function() {
        var selR = candidatesDiv.querySelector('input[type=radio]:checked');
        rebuildCandidates(urlInput.value.trim(), labelInput.value.trim(), selR ? selR.value : null, hasImg);
        updatePreview();
    });

    return row;
}

// フォームにリンク一覧を読み込む
function loadCustomLinksIntoForms() {
    // 個人
    var personalContainer = document.getElementById('settings-custom-urls');
    if (personalContainer) {
        personalContainer.innerHTML = '';
        var s = getUserSettings();
        var list = Array.isArray(s.customLinks) ? s.customLinks :
                   (Array.isArray(s.customQuickActions) ? s.customQuickActions : []);
        list.forEach(function(it) { personalContainer.appendChild(buildClRow(it, false)); });
    }
    // 全体
    var globalContainer = document.getElementById('settings-global-custom-urls');
    if (globalContainer) {
        globalContainer.innerHTML = '';
        getGlobalCustomLinks().forEach(function(it) { globalContainer.appendChild(buildClRow(it, true)); });
    }
    // 全体リンクは全員が編集可能
    var adminSection = document.getElementById('global-custom-links-admin');
    var noAdminNote = document.getElementById('global-links-no-admin');
    if (adminSection) adminSection.style.display = '';
    if (noAdminNote) noAdminNote.style.display = 'none';
}

// 設定フォームのイベント初期化
function initCustomUrlAddButton() {
    var personalBtn = document.getElementById('settings-add-custom-url');
    if (personalBtn) personalBtn.addEventListener('click', function() {
        var container = document.getElementById('settings-custom-urls');
        if (container) container.appendChild(buildClRow({}, false));
    });
    var globalBtn = document.getElementById('settings-add-global-url');
    if (globalBtn) globalBtn.addEventListener('click', function() {
        var container = document.getElementById('settings-global-custom-urls');
        if (container) container.appendChild(buildClRow({}, true));
    });
}

// フォームから読み取ってリンク一覧を生成
function collectClRows(container) {
    var list = [];
    if (!container) return list;
    container.querySelectorAll('.cl-row').forEach(function(row) {
        var url = ((row.querySelector('.cl-f-url') || {}).value || '').trim();
        if (!url) return;
        var label = ((row.querySelector('.cl-f-label') || {}).value || '').trim();
        var selR = row.querySelector('input[type=radio]:checked');
        var fa = selR ? selR.value : null;
        var thumb = row.querySelector('.cl-img-thumb-small');
        var imgData = (thumb && thumb.style.display !== 'none' && thumb.src && thumb.src.startsWith('data:')) ? thumb.src : null;
        var sameTabCb = row.querySelector('.cl-same-tab-cb');
        var item = { label: label || url, url: url, faIcon: imgData ? null : fa, imgData: imgData || null, sameTab: sameTabCb ? sameTabCb.checked : false };
        var depCbs = row.querySelectorAll('.cl-dept-cb');
        if (depCbs.length > 0) {
            var depts = []; depCbs.forEach(function(cb) { if (cb.checked) depts.push(cb.value); });
            item.depts = depts;
        }
        list.push(item);
    });
    return list;
}

// 個人設定フォームから保存
function saveUserSettingsFromForm() {
    var displayNameEl = document.getElementById('settings-display-name');
    var notifyTasksEl = document.getElementById('settings-notify-tasks');
    var customLinks = collectClRows(document.getElementById('settings-custom-urls'));
    var settings = {
        displayName: displayNameEl ? displayNameEl.value.trim() : '',
        notifyTasks: notifyTasksEl ? notifyTasksEl.checked : false,
        customLinks: customLinks
    };
    saveUserSettings(settings);
    saveGlobalLinksFromForm(true); // 全体リンクも同時保存
}

// 全体設定フォームから保存
function saveGlobalLinksFromForm(silent) {
    var list = collectClRows(document.getElementById('settings-global-custom-urls'));
    saveGlobalCustomLinks(list);
    if (!silent) showMessage('全体リンクを保存しました', 'success');
}

// 設定ページ表示時に呼ぶ（showPage('settings')から）
function loadUserSettingsIntoForm() {
    var s = getUserSettings();
    var displayNameEl = document.getElementById('settings-display-name');
    var notifyTasksEl = document.getElementById('settings-notify-tasks');
    if (displayNameEl) displayNameEl.value = s.displayName || '';
    if (notifyTasksEl) notifyTasksEl.checked = !!s.notifyTasks;
    loadCustomLinksIntoForms();
}
// 設定タブ切替
function switchSettingsTab(tab) {
    // 全体タブから離れる前に自動保存
    var globalPane = document.getElementById('settings-tab-global');
    if (globalPane && globalPane.style.display !== 'none' && tab !== 'global') {
        saveGlobalLinksFromForm(true); // silent=true でメッセージなし
    }
    var tabs = ['personal', 'global'];
    tabs.forEach(function(t) {
        var pane = document.getElementById('settings-tab-' + t);
        var btn = document.getElementById('tab-btn-' + t);
        if (!pane || !btn) return;
        var isActive = (t === tab);
        pane.style.display = isActive ? '' : 'none';
        btn.classList.toggle('active', isActive);
    });
}
// カスタムリンクをダッシュボードに描画
function renderCustomLinks() {
    var card = document.getElementById('dashboard-custom-links');
    var grid = document.getElementById('custom-links-grid');
    if (!card || !grid) return;
    var s = getUserSettings();
    var list = s.customQuickActions;
    if (!Array.isArray(list) || list.length === 0) {
        card.style.display = 'none';
        return;
    }
    card.style.display = '';
    grid.innerHTML = '';
    list.forEach(function(item) {
        if (!item || !item.url) return;
        var a = document.createElement('a');
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'dept-hub-btn';
        a.style.textDecoration = 'none';
        a.innerHTML = '<i class="fas fa-external-link-alt"></i><span>' + escapeHtml(item.label || item.url) + '</span>';
        grid.appendChild(a);
    });
}
function updateSidebarUserDisplay() {
    const s = getUserSettings();
    var name = s.displayName || localStorage.getItem('username') || 'ログインユーザー';
    const footerP = document.getElementById('sidebar-login-user');
    if (footerP) footerP.textContent = 'ログインユーザー: ' + name;
}
function updateDashboardWelcome() {
    const now = new Date();
    const h = now.getHours();
    const greeting = h < 12 ? 'おはようございます' : h < 18 ? 'こんにちは' : 'お疲れ様です';
    const days = ['日','月','火','水','木','金','土'];
    const dateStr = now.getFullYear() + '年' + (now.getMonth()+1) + '月' + now.getDate() + '日（' + days[now.getDay()] + '）';
    const gEl = document.getElementById('dashboard-greeting');
    const dEl = document.getElementById('dashboard-today-date');
    if (gEl) gEl.textContent = greeting;
    if (dEl) dEl.textContent = dateStr;
}
function applyUserSettingsToDashboard() {
    const s = getUserSettings();
    const qa = document.getElementById('dashboard-quick-actions');
    if (qa) {
        qa.style.display = s.showQuickActions !== false ? '' : 'none';
        if (typeof renderQuickActions === 'function') renderQuickActions();
        updateDashboardWelcome();
    }
}

// ユーザー管理
let users = [];

// ユーザーを読み込み
function loadUsers() {
    const stored = localStorage.getItem('users');
    if (stored) {
        try {
            users = JSON.parse(stored);
        } catch (e) {
            console.error('ユーザーの読み込みエラー:', e);
            users = [];
        }
    } else {
        users = [];
    }
    return users;
}

// ユーザーを保存
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

// ユーザー一覧を表示
function renderUserList() {
    const userListEl = document.getElementById('user-list');
    if (!userListEl) return;
    
    loadUsers();
    userListEl.innerHTML = '';
    
    if (users.length === 0) {
        userListEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">ユーザーが登録されていません</div>';
        return;
    }
    
    users.forEach((user, index) => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-item-content">
                <div class="user-item-info">
                    <div class="user-item-name">
                        ${escapeHtml(user.pcName || user.loginId)}
                        ${user.isAdmin ? '<span style="margin-left: 8px; color: var(--primary); font-size: 12px;"><i class="fas fa-crown"></i> 管理者</span>' : ''}
                    </div>
                    <div class="user-item-id">
                        ID: ${escapeHtml(user.loginId)} | 部署: ${escapeHtml(user.department || '未設定')}
                    </div>
                </div>
                <div class="user-item-actions">
                    <button class="btn-secondary btn-small" onclick="editUser(${user.id})" title="編集">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger btn-small" onclick="deleteUser(${user.id})" title="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        userListEl.appendChild(userItem);
    });
}

// ユーザーフォームモーダルを開く
function openUserFormModal(userId = null) {
    const modal = document.getElementById('user-form-modal');
    const titleEl = document.getElementById('user-form-title');
    const form = document.getElementById('user-form');
    const pcNameEl = document.getElementById('user-pc-name');
    const loginIdEl = document.getElementById('user-login-id');
    const passwordEl = document.getElementById('user-password');
    const passwordConfirmEl = document.getElementById('user-password-confirm');
    const departmentEl = document.getElementById('user-department');
    const isAdminEl = document.getElementById('user-is-admin');
    const editIdEl = document.getElementById('user-edit-id');
    
    if (!modal || !form) return;
    
    if (userId) {
        // 編集モード
        const user = users.find(u => u.id === userId);
        if (user) {
            titleEl.textContent = 'ユーザーを編集';
            pcNameEl.value = user.pcName || '';
            loginIdEl.value = user.loginId || '';
            passwordEl.value = '';
            passwordConfirmEl.value = '';
            if (departmentEl) departmentEl.value = user.department || '';
            if (isAdminEl) isAdminEl.checked = user.isAdmin === true;
            editIdEl.value = userId;
            // パスワードフィールドを任意にする
            passwordEl.removeAttribute('required');
            passwordConfirmEl.removeAttribute('required');
            const passwordRequired = document.getElementById('password-required');
            const passwordConfirmRequired = document.getElementById('password-confirm-required');
            if (passwordRequired) passwordRequired.style.display = 'none';
            if (passwordConfirmRequired) passwordConfirmRequired.style.display = 'none';
        }
    } else {
        // 新規追加モード
        titleEl.textContent = 'ユーザーを追加';
        form.reset();
        editIdEl.value = '';
        // パスワードフィールドを必須にする
        passwordEl.setAttribute('required', 'required');
        passwordConfirmEl.setAttribute('required', 'required');
        const passwordRequired = document.getElementById('password-required');
        const passwordConfirmRequired = document.getElementById('password-confirm-required');
        if (passwordRequired) passwordRequired.style.display = 'inline';
        if (passwordConfirmRequired) passwordConfirmRequired.style.display = 'inline';
    }
    
    modal.style.display = 'flex';
}

// ユーザーフォームモーダルを閉じる
function closeUserFormModal() {
    const modal = document.getElementById('user-form-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ユーザーを保存
function saveUser() {
    const pcName = document.getElementById('user-pc-name').value.trim();
    const loginId = document.getElementById('user-login-id').value.trim();
    const password = document.getElementById('user-password').value.trim();
    const passwordConfirm = document.getElementById('user-password-confirm').value.trim();
    const department = document.getElementById('user-department')?.value.trim() || '';
    const isAdmin = document.getElementById('user-is-admin')?.checked || false;
    const editId = document.getElementById('user-edit-id').value;
    
    if (!pcName || !loginId) {
        alert('パソコン名とログインIDを入力してください');
        return;
    }
    
    // 部署は任意（後で設定可能）
    
    // 新規追加時はパスワード必須
    if (!editId) {
        if (!password || !passwordConfirm) {
            alert('パスワードを入力してください');
            return;
        }
        if (password.length < 4) {
            alert('パスワードは4文字以上で入力してください');
            return;
        }
        if (password !== passwordConfirm) {
            alert('パスワードが一致しません');
            return;
        }
    } else {
        // 編集時はパスワードが入力されている場合のみ変更
        if (password || passwordConfirm) {
            if (password.length < 4) {
                alert('パスワードは4文字以上で入力してください');
                return;
            }
            if (password !== passwordConfirm) {
                alert('パスワードが一致しません');
                return;
            }
        }
    }
    
    loadUsers();
    
    if (editId) {
        // 編集
        const index = users.findIndex(u => u.id === parseInt(editId));
        if (index !== -1) {
            users[index].pcName = pcName;
            users[index].loginId = loginId;
            users[index].department = department;
            users[index].isAdmin = isAdmin;
            // パスワードが入力されている場合のみ更新
            if (password) {
                users[index].passwordHash = hashPassword(password);
            }
            users[index].updatedAt = new Date().toISOString();
        }
    } else {
        // 新規追加
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
        users.push({
            id: newId,
            pcName: pcName,
            loginId: loginId,
            passwordHash: hashPassword(password),
            department: department,
            isAdmin: isAdmin,
            createdAt: new Date().toISOString()
        });
    }
    
    saveUsers();
    renderUserList();
    closeUserFormModal();
    
    if (typeof showMessage === 'function') {
        showMessage(editId ? 'ユーザーを更新しました' : 'ユーザーを追加しました', 'success');
    } else {
        alert(editId ? 'ユーザーを更新しました' : 'ユーザーを追加しました');
    }
}

// ユーザーを編集
function editUser(userId) {
    openUserFormModal(userId);
}

// ユーザーを削除
function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (typeof showDeleteConfirm === 'function') {
        showDeleteConfirm(
            'ユーザーを削除',
            `「${user.pcName || user.loginId}」を削除しますか？\nこの操作は取り消せません。`,
            () => {
                users = users.filter(u => u.id !== userId);
                saveUsers();
                renderUserList();
                if (typeof showMessage === 'function') {
                    showMessage('ユーザーを削除しました', 'success');
                }
            }
        );
    } else {
        if (confirm(`「${user.pcName || user.loginId}」を削除しますか？`)) {
            users = users.filter(u => u.id !== userId);
            saveUsers();
            renderUserList();
        }
    }
}

// ユーザーIDでログイン認証
function authenticateUser(loginId, password) {
    loadUsers();
    const user = users.find(u => u.loginId === loginId);
    if (!user) {
        return false;
    }
    
    const inputHash = hashPassword(password);
    return user.passwordHash === inputHash;
}

// ログアウト処理（後方互換）
function handleLogout() { doLogout(); }

// ログアウト確認モーダルを表示
function showLogoutConfirm() {
    const modal = document.getElementById('logout-confirm-modal');
    if (!modal) {
        // フォールバック
        if (confirm('ログアウトしますか？')) {
            handleLogout();
        }
        return;
    }
    
    const cancelBtn = document.getElementById('logout-confirm-cancel');
    const okBtn = document.getElementById('logout-confirm-ok');
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        const newCancelBtnEl = document.getElementById('logout-confirm-cancel');
        if (newCancelBtnEl) {
            newCancelBtnEl.onclick = function() {
                modal.style.display = 'none';
            };
        }
    }
    
    if (okBtn) {
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        const newOkBtnEl = document.getElementById('logout-confirm-ok');
        if (newOkBtnEl) {
            newOkBtnEl.onclick = function() {
                modal.style.display = 'none';
                handleLogout();
            };
        }
    }
    
    modal.style.display = 'flex';
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded: アプリケーション初期化を開始します');
    
    // 作業票登録ページの初期化
    initializeWorkTicketPage();
    
    // ログイン状態を確認（常にログイン済みとして扱う）
    checkLoginStatus();
    
    // アプリケーションを初期化
    try {
        await initializeApp();
        console.log('アプリケーション初期化が完了しました');
    } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
        showMessage('アプリケーションの初期化に失敗しました: ' + (error.message || '不明なエラー'), 'error');
    }
});

// アプリケーション初期化関数
async function initializeApp() {
    try {
        // ユーザーを読み込み
        loadUsers();
        
        console.log('initializeApp: 初期化を開始します');
        
        // Supabaseクライアントの初期化（先に実行）
        // window.supabaseはCDNから読み込まれるため、少し待つ
        let retryCount = 0;
        const maxRetries = 20;
        const initSupabase = async () => {
            return new Promise((resolve, reject) => {
                const checkSupabase = () => {
                    if (typeof window.supabase !== 'undefined' && window.supabase) {
                        console.log('Supabaseクライアントを初期化します...');
                        if (!window.supabaseClient) {
                            try {
                                const client = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
                                window.supabaseClient = client;
                                console.log('Supabaseクライアントの初期化が完了しました');
                                resolve();
                            } catch (error) {
                                console.error('Supabaseクライアントの初期化に失敗しました:', error);
                                showMessage('Supabaseクライアントの初期化に失敗しました: ' + error.message, 'error');
                                reject(error);
                            }
                        } else {
                            console.log('既存のSupabaseクライアントを使用します');
                            resolve();
                        }
                    } else {
                        retryCount++;
                        if (retryCount < maxRetries) {
                            setTimeout(checkSupabase, 100);
                        } else {
                            console.error('Supabaseライブラリが読み込まれていません');
                            const container = document.getElementById('table-list-content');
                            if (container) {
                                container.innerHTML = '<p class="info">Supabaseライブラリの読み込みに失敗しました。ページをリロードしてください。</p>';
                            }
                            showMessage('Supabaseライブラリの読み込みに失敗しました。ページをリロードしてください。', 'error');
                            reject(new Error('Supabaseライブラリが読み込まれていません'));
                        }
                    }
                };
                checkSupabase();
            });
        };
        
        try {
            await initSupabase();
        } catch (error) {
            console.error('Supabase初期化エラー:', error);
            return;
        }
        
        // テーブル一覧はバックグラウンドで読み込む（起動をブロックしない）
        loadTables();
        // 全体リンクをSupabaseから復元（localStorageが空の場合に上書き）
        _loadGlobalLinksFromSupabase();
        
        // KPIカードのイベントリスナーを設定
        setupKPICards();
        
        // 掲示板の読み込み
        loadBulletins();
        
        // task.jsの読み込みを待ってからイベントリスナーを設定
        const setupTaskFormListener = () => {
            const taskForm = document.getElementById('task-form');
            if (taskForm && typeof window.saveTask === 'function') {
                // 既存のイベントリスナーを削除
                const newForm = taskForm.cloneNode(true);
                taskForm.parentNode.replaceChild(newForm, taskForm);
                
                document.getElementById('task-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('タスクフォームの送信イベントが発生しました');
                    
                    if (typeof window.saveTask === 'function') {
                        window.saveTask();
                    } else {
                        console.error('saveTask関数が見つかりません');
                        alert('saveTask関数が見つかりません。ページをリロードしてください。');
                    }
                });
                console.log('タスクフォームのイベントリスナーを設定しました');
                return true;
            }
            return false;
        };
        
        // task.jsの読み込みを待つ（最大5秒）
        let attempts = 0;
        const maxAttempts = 50; // 5秒間（100ms × 50回）
        const checkInterval = setInterval(() => {
            attempts++;
            if (setupTaskFormListener() || attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (attempts >= maxAttempts && typeof window.saveTask !== 'function') {
                    console.warn('saveTask関数の読み込みを待ちましたが、見つかりませんでした');
                }
            }
        }, 100);
        
        setupEventListeners();
        if (typeof refreshPolarisSavedSearchSelect === 'function') refreshPolarisSavedSearchSelect();
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
        
        // 初期表示はダッシュボードページ（先に表示）
        showPage('dashboard');
        if (typeof updateSidebarUserDisplay === 'function') updateSidebarUserDisplay();
        if (typeof applyUserSettingsToDashboard === 'function') applyUserSettingsToDashboard();
        
        // タスクの読み込み
        setTimeout(() => {
            if (typeof loadTasks === 'function') {
                loadTasks();
            }
        }, 500);
        
        // テーブル検索のイベントリスナー
        const searchInput = document.getElementById('table-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                updateTableList();
            });
            searchInput.addEventListener('keyup', (e) => {
                updateTableList();
            });
        } else {
            console.warn('table-search-input要素が見つかりません');
        }
    } catch (error) {
        showMessage('エラー: ' + error.message, 'error');
    }
}

// 現在時刻の更新
function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = `現在時刻: ${timeStr}`;
}

// イベントリスナーの設定
function setupEventListeners() {
    // 個人設定フォーム
    const userSettingsForm = document.getElementById('user-settings-form');
    if (userSettingsForm) {
        userSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof saveUserSettingsFromForm === 'function') saveUserSettingsFromForm();
            showMessage('個人設定を保存しました', 'success');
            showPage('dashboard');
        });
    }
    if (typeof initCustomUrlAddButton === 'function') initCustomUrlAddButton();
    // メニューアイテム
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const menuBtn = e.currentTarget;
            const page = menuBtn.dataset.page;
            showPage(page);
        });
    });
    
    // ヘッダーボタンのイベントリスナー
    const headerBtns = document.querySelectorAll('.header-btn');
    headerBtns.forEach(btn => {
        const btnText = btn.textContent.trim();
        if (btnText === '設定') {
            btn.addEventListener('click', function() {
                openSettingsModal();
            });
        }
    });

    // 検索実行
    const executeSearchBtn = document.getElementById('execute-search');
    if (executeSearchBtn) {
        executeSearchBtn.addEventListener('click', () => {
        applyFilters();
    });
    }

    // 検索クリア
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
        clearFilters();
    });
    }

    // 全体検索のEnterキー対応
    const globalSearchInput = document.getElementById('filter-global-search');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    // テーブル一覧画面の検索入力Enterキー対応
    const listTableSearchInput = document.getElementById('list-table-search');
    if (listTableSearchInput) {
        listTableSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchAllTablesData();
            }
        });
        
        listTableSearchInput.addEventListener('input', () => {
            filterListTableSelection();
            const clearBtn = document.getElementById('clear-global-search-btn');
            if (clearBtn) {
                clearBtn.style.display = listTableSearchInput.value ? 'block' : 'none';
            }
        });
    }

    // 検索条件の保存・復元（生産管理設計指針 UI/UX）
    const polarisSaveSearchBtn = document.getElementById('polaris-save-search-btn');
    const polarisSavedSearchSelect = document.getElementById('polaris-saved-search-select');
    if (polarisSaveSearchBtn && typeof window.PolarisProduction !== 'undefined') {
        polarisSaveSearchBtn.addEventListener('click', function () {
            const name = prompt('この検索条件の名前を入力してください');
            if (name == null || !name.trim()) return;
            const searchInput = document.getElementById('list-table-search');
            const condition = {
                tableName: currentTable || '',
                searchText: searchInput ? searchInput.value : ''
            };
            window.PolarisProduction.saveSearchCondition(name.trim(), condition);
            if (typeof refreshPolarisSavedSearchSelect === 'function') refreshPolarisSavedSearchSelect();
            if (typeof showMessage === 'function') showMessage('検索条件を保存しました', 'success');
        });
    }
    if (polarisSavedSearchSelect && typeof window.PolarisProduction !== 'undefined') {
        polarisSavedSearchSelect.addEventListener('change', function () {
            const id = this.value;
            if (!id) return;
            const item = window.PolarisProduction.loadSearchCondition(id);
            if (!item || !item.condition) return;
            const c = item.condition;
            const searchInput = document.getElementById('list-table-search');
            if (searchInput && c.searchText != null) searchInput.value = c.searchText;
            if (c.tableName && typeof selectListTable === 'function') {
                selectListTable(c.tableName);
            } else {
                filterListTableSelection();
            }
            this.value = '';
        });
    }

    // 日付検索のEnterキー対応
    const dateStartInput = document.getElementById('filter-date-start');
    const dateEndInput = document.getElementById('filter-date-end');
    [dateStartInput, dateEndInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    applyFilters();
                }
            });
        }
    });

    // カラム選択プルダウンの変更イベント対応
    const columnSelect = document.getElementById('filter-column-select');
    if (columnSelect) {
        columnSelect.addEventListener('change', () => {
            const selectedColumn = columnSelect.value;
            const globalSearchInput = document.getElementById('filter-global-search');
            const dateRangeContainer = document.getElementById('filter-date-range');
            
            if (!selectedColumn) {
                // 全体検索の場合
                globalSearchInput.style.display = 'block';
                dateRangeContainer.style.display = 'none';
                return;
            }
            
            // 選択されたカラムが日付系かどうか判定
            const colLower = selectedColumn.toLowerCase();
            const displayName = getColumnDisplayName(selectedColumn);
            const isDateColumn = colLower.includes('date') || colLower.includes('time') || 
                               displayName.includes('日') || displayName.includes('時');
            
            if (isDateColumn) {
                globalSearchInput.style.display = 'none';
                dateRangeContainer.style.display = 'flex';
            } else {
                globalSearchInput.style.display = 'block';
                dateRangeContainer.style.display = 'none';
            }
        });
    }

    // 新規登録
    const newRegisterBtn = document.getElementById('new-register');
    if (newRegisterBtn) {
        newRegisterBtn.addEventListener('click', () => {
        openRegisterModal('新規登録', null);
    });
    }

    // テーブルデータ更新
    const refreshTableBtn = document.getElementById('refresh-table');
    if (refreshTableBtn) {
        refreshTableBtn.addEventListener('click', () => {
            if (currentTable) {
                loadTableData(currentTable);
                if (typeof showMessage === 'function') {
                    showMessage('テーブルデータを更新しました', 'success');
                }
            }
        });
    }

    // 余剰在庫と照合（生産管理設計指針 在庫・余剰品活用）
    const polarisSurplusCheckBtn = document.getElementById('polaris-surplus-check-btn');
    if (polarisSurplusCheckBtn && typeof window.PolarisProduction !== 'undefined') {
        polarisSurplusCheckBtn.addEventListener('click', function () {
            if (typeof runPolarisSurplusCheck === 'function') runPolarisSurplusCheck();
        });
    }

    // ページネーション
    const firstPageBtn = document.getElementById('first-page');
    if (firstPageBtn) {
        firstPageBtn.addEventListener('click', () => {
        currentPage = 1;
        displayTable();
    });
    }

    const prevPageBtn = document.getElementById('prev-page');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTable();
        }
    });
    }

    const nextPageBtn = document.getElementById('next-page');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            displayTable();
        }
    });
    }

    const lastPageBtn = document.getElementById('last-page');
    if (lastPageBtn) {
        lastPageBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / itemsPerPage);
        currentPage = maxPage;
        displayTable();
    });
    }

    // CSV出力
    const csvExportBtn = document.getElementById('csv-export');
    if (csvExportBtn) {
        csvExportBtn.addEventListener('click', () => {
        exportToCSV();
    });
    }

    // CSVインポート
    const csvImportBtn = document.getElementById('csv-import');
    if (csvImportBtn) {
        csvImportBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('csv-file-input');
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    const csvFileInput = document.getElementById('csv-file-input');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await importFromCSV(file);
        }
        // 同じファイルを再度選択できるようにリセット
        e.target.value = '';
    });
    }

    // 登録ボタン
    document.querySelectorAll('.register-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = btn.dataset.type || e.target.closest('.register-btn')?.dataset.type;
            // 以下は onclick でページ表示するためモーダルを開かない
            if (type === 'construct-number' || type === 'work-ticket' || type === 'drawing-number' || type === 'accept-order' || type === 'accept-order-search' || type === 'misc-purchase' || type === 'misc-delivery' || type === 'shipping' || type === 'outsource-delivery' || type === 'parts-delivery' || type === 'surplus-register' || type === 'surplus-search' || type === 'project-shipping' || type === 'estimate-request' || type === 'quotation' || type === 'barcode-work-ticket') {
                return;
            } else {
                e.preventDefault();
                e.stopPropagation();
                openRegisterModal(type, null);
            }
        });
    });

    // モーダル
    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    const cancelRegisterBtn = document.getElementById('cancel-register');
    if (cancelRegisterBtn) {
        cancelRegisterBtn.addEventListener('click', closeModal);
    }
    
    // 詳細モーダル
    const detailModalCloseBtn = document.getElementById('detail-modal-close');
    if (detailModalCloseBtn) {
        detailModalCloseBtn.addEventListener('click', closeDetailModal);
    }
    
    const closeDetailBtn = document.getElementById('close-detail-modal');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeDetailModal);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveRecord();
    });
    }

    // 削除確認モーダル
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    // 全選択/全解除ボタン
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            selectAllRows();
        });
    }
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => {
            deselectAllRows();
        });
    }

    // 通知アイコンボタン
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationCloseBtn = document.getElementById('notification-close-btn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('通知ボタンがクリックされました');
            toggleNotificationDropdown();
        });
    } else {
        console.error('通知ボタンが見つかりません');
    }
    
    if (notificationCloseBtn) {
        notificationCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeNotificationDropdown();
        });
    }

    // 通知ドロップダウン外をクリックで閉じる
    document.addEventListener('click', (e) => {
        if (notificationDropdown && !notificationDropdown.contains(e.target) && 
            notificationBtn && !notificationBtn.contains(e.target)) {
            closeNotificationDropdown();
        }
    });

    // タブボタンのイベントリスナー
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabContainer = e.target.closest('.card-header-with-tabs');
            if (tabContainer) {
                tabContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                // タブ切り替え時の処理をここに追加可能
            }
        });
    });

    // 掲示板追加ボタン
    const addBulletinBtn = document.getElementById('add-bulletin-btn');
    if (addBulletinBtn) {
        addBulletinBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 親要素のクリックイベントを防ぐ
            if (typeof openBulletinModal === 'function') {
                openBulletinModal();
            } else {
                console.error('openBulletinModal関数が見つかりません');
            }
        });
    }
    
    // 掲示板ページの追加ボタン
    const addBulletinBtnFull = document.getElementById('add-bulletin-btn-full');
    if (addBulletinBtnFull) {
        addBulletinBtnFull.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof openBulletinModal === 'function') {
                openBulletinModal();
            } else {
                console.error('openBulletinModal関数が見つかりません');
            }
        });
    }
    
    // ダッシュボードのTodo追加ボタン
    const addTodoDashboardBtn = document.getElementById('add-todo-dashboard-btn');
    if (addTodoDashboardBtn) {
        addTodoDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 複数の方法でopenTodoModalを呼び出す
            if (typeof window.openTodoModal === 'function') {
                window.openTodoModal();
            } else if (typeof openTodoModal === 'function') {
                openTodoModal();
            } else {
                // 直接モーダルを表示するフォールバック
                const modal = document.getElementById('todo-modal');
                if (modal) {
                    modal.removeAttribute('style');
                    modal.style.display = 'flex';
                    modal.style.zIndex = '10000';
                    modal.style.position = 'fixed';
                    modal.style.top = '0';
                    modal.style.left = '0';
                    modal.style.right = '0';
                    modal.style.bottom = '0';
                }
            }
        });
    } else {
        console.warn('add-todo-dashboard-btn要素が見つかりません');
    }
    
    // 今日の予定追加ボタン
    const addTodayEventBtn = document.getElementById('add-today-event-btn');
    if (addTodayEventBtn) {
        addTodayEventBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const date = today.getDate();
            
            if (typeof openCalendarEventFormModal === 'function') {
                openCalendarEventFormModal(year, month, date);
            } else if (typeof window.openCalendarEventFormModal === 'function') {
                window.openCalendarEventFormModal(year, month, date);
            } else {
                console.error('openCalendarEventFormModal関数が見つかりません');
            }
        });
    }

    // ダッシュボードのTodoフィルターボタン
    setTimeout(() => {
        document.querySelectorAll('.todo-dashboard-filter .filter-btn-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.todo-dashboard-filter .filter-btn-small').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (typeof updateDashboardTodos === 'function') {
                    updateDashboardTodos();
                }
            });
        });
    }, 100);

}

// ── モバイルサイドバー開閉 ──────────────────────────────────
function toggleMobileSidebar() {
    var sidebar = document.querySelector('.left-sidebar');
    var overlay = document.getElementById('mobile-sidebar-overlay');
    var btn     = document.getElementById('mobile-menu-btn');
    if (!sidebar) return;
    var isOpen = sidebar.classList.contains('mobile-open');
    if (isOpen) {
        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.style.display = 'none';
        if (btn) btn.innerHTML = '<i class="fas fa-bars"></i>';
    } else {
        sidebar.classList.add('mobile-open');
        if (overlay) overlay.style.display = 'block';
        if (btn) btn.innerHTML = '<i class="fas fa-times"></i>';
    }
}
function closeMobileSidebar() {
    var sidebar = document.querySelector('.left-sidebar');
    var overlay = document.getElementById('mobile-sidebar-overlay');
    var btn     = document.getElementById('mobile-menu-btn');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.style.display = 'none';
    if (btn) btn.innerHTML = '<i class="fas fa-bars"></i>';
}
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar  = closeMobileSidebar;

// ページ表示切り替え
function toggleDept(deptId) {
    const group = document.getElementById(deptId);
    if (!group) return;
    const isOpen = group.classList.contains('open');
    // 全部閉じる
    document.querySelectorAll('.dept-group.open').forEach(g => g.classList.remove('open'));
    if (!isOpen) group.classList.add('open');
}

function showPage(pageName) {
    console.log('showPage関数が呼ばれました:', pageName);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    // モバイルではページ遷移時にサイドバーを閉じる
    closeMobileSidebar();

    const pageEl = document.getElementById(`${pageName}-page`);
    const menuEl = document.querySelector(`[data-page="${pageName}"]`);
    
    if (pageEl) {
        pageEl.classList.add('active');
    } else {
        console.error(`${pageName}-page要素が見つかりません`);
    }
    
    if (menuEl) {
        menuEl.classList.add('active');
    } else {
        // 納入予定カレンダー・加工進捗・機械の加工進捗は検索から開くため、検索をアクティブに
        if (pageName === 'delivery-calendar' || pageName === 'processing-progress' || pageName === 'machine-progress' || pageName === 'cost-summary' || pageName === 'worktime-entry' || pageName === 'bom-import' || pageName === 'acceptance' || pageName === 'bom-viewer' || pageName === 'cost-manual') {
            const searchMenu = document.querySelector('[data-page="search"]');
            if (searchMenu) searchMenu.classList.add('active');
        } else if (pageName === 'estimate-request' || pageName === 'quotation' || pageName === 'barcode-work-ticket') {
            const regMenu = document.querySelector('[data-page="register"]');
            if (regMenu) regMenu.classList.add('active');
        } else {
            console.warn(`[data-page="${pageName}"]要素が見つかりません`);
        }
    }

    if (pageName === 'work-ticket') {
        setTimeout(function() {
            if (typeof initDailyReportPage === 'function') initDailyReportPage();
        }, 100);
    } else if (pageName === 'construct-number') {
        // 工事番号採番ページを開いた時の初期化
        console.log('工事番号採番ページを表示します');
        setTimeout(() => {
            console.log('initializeConstructNumberPageを呼び出します');
            initializeConstructNumberPage();
        }, 100);
    } else if (pageName === 'drawing-number') {
        // 図面番号採番ページを開いた時の初期化
        console.log('図面番号採番ページを表示します');
        setTimeout(() => {
            initializeDrawingNumberPage();
        }, 100);
    } else if (pageName === 'order-registration') {
        setTimeout(() => { initOrderRegistrationPage(); }, 100);
    } else if (pageName === 'accept-order-list') {
        if (typeof window.closeCustomTableModal === 'function') window.closeCustomTableModal();
        const customModal = document.getElementById('custom-table-modal');
        if (customModal) customModal.style.display = 'none';
        setTimeout(() => { initAcceptOrderListPage(); }, 100);
    } else if (pageName === 'misc-purchase') {
        setTimeout(() => { initMiscPurchasePage(); }, 100);
    } else if (pageName === 'misc-delivery') {
        setTimeout(() => { initMiscDeliveryPage(); }, 100);
    } else if (pageName === 'shipping') {
        setTimeout(() => { initShippingPage(); }, 100);
    } else if (pageName === 'outsource-delivery') {
        setTimeout(() => { initOutsourceDeliveryPage(); }, 100);
    } else if (pageName === 'parts-delivery') {
        setTimeout(() => { initPartsDeliveryPage(); }, 100);
    } else if (pageName === 'surplus-register') {
        setTimeout(() => { initSurplusRegisterPage(); }, 100);
    } else if (pageName === 'surplus-search') {
        setTimeout(() => { initSurplusSearchPage(); }, 100);
    } else if (pageName === 'project-shipping') {
        setTimeout(() => { initProjectShippingPage(); }, 100);
    } else if (pageName === 'processing-progress') {
        console.log('加工進捗ページを表示します');
        setTimeout(() => { initializeProcessingProgressPage(); }, 100);
    } else if (pageName === 'delivery-calendar') {
        setTimeout(() => { initDeliveryCalendarPage(); }, 100);
    } else if (pageName === 'machine-progress') {
        setTimeout(() => { if (typeof initMachineProgressPage === 'function') initMachineProgressPage(); }, 100);
    } else if (pageName === 'cost-summary') {
        setTimeout(function() { if (typeof initCostAnalysisPage === 'function') initCostAnalysisPage(); }, 100);
    } else if (pageName === 'dashboard') {
        applyUserSettingsToDashboard();
        // 少し遅延してからupdateDashboardを呼ぶ（DOMが確実に更新されるまで待つ）
        setTimeout(() => {
            updateDashboard();
            setTimeout(() => {
                if (typeof goToToday === 'function') goToToday();
            }, 200);
        }, 100);
    } else if (pageName === 'worktime-entry') {
        setTimeout(() => { if (typeof initWorktimeEntryPage === 'function') initWorktimeEntryPage(); }, 100);
    } else if (pageName === 'non-work') {
        setTimeout(() => { if (typeof initNonWorkPage === 'function') initNonWorkPage(); }, 100);
    } else if (pageName === 'bom-import') {
        setTimeout(() => { if (typeof initBomImportPage === 'function') initBomImportPage(); }, 100);
    } else if (pageName === 'bom-viewer') {
        setTimeout(function() { if (typeof initBomViewerPage === 'function') initBomViewerPage(); }, 100);
    } else if (pageName === 'cost-manual') {
        setTimeout(function() { if (typeof initCostManualPage === 'function') initCostManualPage(); }, 100);
    } else if (pageName === 'acceptance') {
        setTimeout(() => { if (typeof initAcceptancePage === 'function') initAcceptancePage(); }, 100);
    } else if (pageName === 'estimate-request') {
        setTimeout(() => { if (typeof initEstimateRequestPage === 'function') initEstimateRequestPage(); }, 100);
    } else if (pageName === 'quotation') {
        setTimeout(() => { if (typeof initQuotationPage === 'function') initQuotationPage(); }, 100);
    } else if (pageName === 'barcode-work-ticket') {
        setTimeout(() => { if (typeof initBarcodeWorkTicketPage === 'function') initBarcodeWorkTicketPage(); }, 100);
    } else if (pageName === 'bulletin') {
        // 掲示板ページを開いた時の初期化
        setTimeout(() => {
            renderBulletinsFull();
        }, 100);
    } else if (pageName === 'settings') {
        if (typeof loadUserSettingsIntoForm === 'function') loadUserSettingsIntoForm();
    } else if (pageName === 'todo') {
        if (typeof renderTodos === 'function') {
            renderTodos();
        }
    } else if (pageName === 'list') {
        // サイドバーの「一覧表示」をクリックした時は、常にテーブル選択画面を表示する
        showTableSelection();
        if (typeof refreshPolarisSavedSearchSelect === 'function') refreshPolarisSavedSearchSelect();
    }
}

// =========================
// 原価集計（夜間バッチ集計テーブル参照）
// =========================
const COST_SUMMARY_LEVELS = {
    construct: {
        label: '工事番号別',
        drillTo: 'machine',
        tableCandidates: [
            't_工事番号別原価集計', 'T_工事番号別原価集計', 'T_工事番号別原価集計 ',
            't_koujibangou_genka', 't_construct_cost_summary', 't_cost_by_construct',
            't_costsummary_construct', 't_cost_summary_construct'
        ],
        searchCols: ['constructno', 'construct_no', 'koujibangou', '工事番号', 'projectname', 'project_name', '工事名', 'name', 'drawingname', 'drawing_name']
    },
    machine: {
        label: '機械別',
        drillTo: 'unit',
        tableCandidates: [
            't_機械別原価集計', 'T_機械別原価集計',
            't_machine_cost_summary', 't_cost_by_machine',
            't_costsummary_machine', 't_cost_summary_machine'
        ],
        searchCols: ['constructno', 'construct_no', 'koujibangou', '工事番号', 'machine', 'machinecode', 'machine_code', '機械', 'machinename', 'machine_name']
    },
    unit: {
        label: 'ユニット別',
        drillTo: 'drawing',
        tableCandidates: [
            't_ユニット別原価集計', 'T_ユニット別原価集計',
            't_unit_cost_summary', 't_cost_by_unit',
            't_costsummary_unit', 't_cost_summary_unit'
        ],
        searchCols: ['constructno', 'construct_no', 'koujibangou', '工事番号', 'machine', 'machinecode', 'machine_code', '機械', 'unit', 'unitcode', 'unit_code', 'ユニット', 'unitname', 'unit_name']
    },
    drawing: {
        label: '名称・図面別',
        drillTo: null,
        tableCandidates: [
            't_図面番号別原価集計', 'T_図面番号別原価集計',
            't_drawing_cost_summary', 't_cost_by_drawing',
            't_costsummary_drawing', 't_cost_summary_drawing',
            't_cost_by_part', 't_part_cost_summary'
        ],
        searchCols: [
            'constructno', 'construct_no', 'koujibangou', '工事番号',
            'machine', 'machinecode', 'machine_code', '機械',
            'unit', 'unitcode', 'unit_code', 'ユニット',
            'drawingno', 'drawing_no', 'drawing', '図面番号', 'zumennumber', 'zumennno',
            'name', 'itemname', 'partname', 'part_name', '品名', '名称'
        ]
    }
};

function initCostSummaryPage() {
    window._cs = window._cs || {
        inited: false,
        level: 'construct',
        query: '',
        filters: { constructno: '', machine: '', unit: '' },
        results: { construct: [], machine: [], unit: [], drawing: [] },
        tables: { construct: null, machine: null, unit: null, drawing: null },
        colsByTable: {}
    };

    const st = window._cs;
    if (!st.inited) {
        const queryEl = document.getElementById('cs-query');
        const searchBtn = document.getElementById('cs-search-btn');
        const clearBtn = document.getElementById('cs-clear-btn');
        const tabs = document.getElementById('cs-tabs');

        if (searchBtn) searchBtn.onclick = () => runCostSummarySearch();
        if (clearBtn) clearBtn.onclick = () => clearCostSummary();
        if (queryEl) {
            queryEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    runCostSummarySearch();
                }
            });
        }
        if (tabs) {
            tabs.querySelectorAll('.cs-tab').forEach(btn => {
                btn.onclick = () => setCostSummaryLevel(btn.getAttribute('data-level') || 'construct');
            });
        }

        st.inited = true;
    }

    // 初回表示は何もしない（検索待ち）
    setCostSummaryLevel(st.level || 'construct');
    renderCostSummaryBreadcrumb();
}

function clearCostSummary() {
    const st = window._cs;
    if (!st) return;
    st.query = '';
    st.filters = { constructno: '', machine: '', unit: '' };
    st.results = { construct: [], machine: [], unit: [], drawing: [] };
    const q = document.getElementById('cs-query');
    if (q) q.value = '';
    updateCostSummaryCounts();
    renderCostSummaryBreadcrumb();
    renderCostSummaryTable(st.level || 'construct');
    const tbody = document.getElementById('cs-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="cs-empty">検索条件を入力して「検索」を押してください</td></tr>';
    const status = document.getElementById('cs-status');
    if (status) status.textContent = '';
}

function setCostSummaryLevel(level) {
    const st = window._cs;
    if (!st) return;
    if (!COST_SUMMARY_LEVELS[level]) level = 'construct';
    st.level = level;

    const tabs = document.getElementById('cs-tabs');
    if (tabs) {
        tabs.querySelectorAll('.cs-tab').forEach(btn => {
            const lv = btn.getAttribute('data-level');
            const active = (lv === level);
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    const title = document.getElementById('cs-table-title');
    if (title) title.textContent = COST_SUMMARY_LEVELS[level].label;

    renderCostSummaryTable(level);
}

async function runCostSummarySearch() {
    const st = window._cs;
    if (!st) return;
    const qEl = document.getElementById('cs-query');
    st.query = (qEl && qEl.value != null) ? qEl.value.trim() : (st.query || '');

    const status = document.getElementById('cs-status');
    if (status) status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 検索中...';

    const levels = Object.keys(COST_SUMMARY_LEVELS);
    const results = await Promise.all(levels.map(lv => queryCostSummaryLevel(lv, st.query, st.filters)));
    levels.forEach((lv, idx) => { st.results[lv] = results[idx] || []; });

    updateCostSummaryCounts();
    renderCostSummaryBreadcrumb();
    renderCostSummaryTable(st.level || 'construct');

    if (status) status.textContent = `${st.query ? `「${st.query}」` : '条件'}：${(st.results[st.level] || []).length} 件`;
}

function updateCostSummaryCounts() {
    const st = window._cs;
    if (!st) return;
    const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = String(n || 0); };
    set('cs-count-construct', (st.results.construct || []).length);
    set('cs-count-machine', (st.results.machine || []).length);
    set('cs-count-unit', (st.results.unit || []).length);
    set('cs-count-drawing', (st.results.drawing || []).length);
}

function renderCostSummaryBreadcrumb() {
    const st = window._cs;
    const el = document.getElementById('cs-breadcrumb');
    if (!st || !el) return;

    const chips = [];
    if (st.filters.constructno) chips.push({ key: 'constructno', label: `工事番号: ${escapeHtml(st.filters.constructno)}` });
    if (st.filters.machine) chips.push({ key: 'machine', label: `機械: ${escapeHtml(st.filters.machine)}` });
    if (st.filters.unit) chips.push({ key: 'unit', label: `ユニット: ${escapeHtml(st.filters.unit)}` });

    if (chips.length === 0) {
        el.innerHTML = '';
        return;
    }

    el.innerHTML = chips.map(c => `
        <span class="cs-chip" data-key="${c.key}">
            ${c.label}
            <button type="button" class="cs-chip-x" title="解除" aria-label="解除">×</button>
        </span>
    `).join('');

    el.querySelectorAll('.cs-chip').forEach(chip => {
        const key = chip.getAttribute('data-key');
        const x = chip.querySelector('.cs-chip-x');
        if (!x) return;
        x.onclick = () => {
            if (key === 'constructno') st.filters.constructno = '';
            if (key === 'machine') st.filters.machine = '';
            if (key === 'unit') st.filters.unit = '';
            runCostSummarySearch();
        };
    });
}

async function queryCostSummaryLevel(level, q, filters) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return [];
        const cfg = COST_SUMMARY_LEVELS[level];
        if (!cfg) return [];

        const st = window._cs;
        if (!st.tables[level]) {
            st.tables[level] = await findTableName(cfg.tableCandidates);
        }
        const table = st.tables[level];
        if (!table) return [];

        const cols = await ensureCostSummaryColumns(table);
        const colSet = cols ? new Set(cols) : null;

        let query = supabase.from(table).select('*');

        // ドリルダウン用フィルタ（存在する列だけ適用）
        if (filters && colSet) {
            if (filters.constructno && hasAnyCol(colSet, ['constructno', 'construct_no', 'koujibangou', '工事番号'])) {
                query = query.eq(pickExistingCol(colSet, ['constructno', 'construct_no', 'koujibangou', '工事番号']), filters.constructno);
            }
            if (filters.machine && hasAnyCol(colSet, ['machine', 'machinecode', 'machine_code', '機械'])) {
                query = query.eq(pickExistingCol(colSet, ['machine', 'machinecode', 'machine_code', '機械']), filters.machine);
            }
            if (filters.unit && hasAnyCol(colSet, ['unit', 'unitcode', 'unit_code', 'ユニット'])) {
                query = query.eq(pickExistingCol(colSet, ['unit', 'unitcode', 'unit_code', 'ユニット']), filters.unit);
            }
        }

        const qq = (q || '').trim();
        if (qq) {
            const candidates = cfg.searchCols || [];
            const existing = (colSet ? candidates.filter(c => colSet.has(c)) : candidates);
            const ors = existing
                .filter(Boolean)
                .map(c => `${c}.ilike.%${escapeForIlike(qq)}%`)
                .join(',');
            if (ors) query = query.or(ors);
        }

        const { data, error } = await query.limit(200);
        if (error) {
            // 列名不一致などでor/eqが失敗した場合のフォールバック：クライアント側で絞り込み
            const { data: all } = await supabase.from(table).select('*').limit(200);
            return filterCostSummaryClient(all || [], qq);
        }
        return filterCostSummaryClient(data || [], qq);
    } catch (e) {
        return [];
    }
}

function filterCostSummaryClient(rows, q) {
    const qq = (q || '').trim();
    if (!qq) return rows || [];
    const needle = qq.toLowerCase();
    return (rows || []).filter(r => {
        try {
            const blob = Object.values(r || {}).join(' ').toLowerCase();
            return blob.includes(needle);
        } catch (_) {
            return false;
        }
    });
}

async function ensureCostSummaryColumns(table) {
    const st = window._cs;
    if (!st) return null;
    if (st.colsByTable[table]) return st.colsByTable[table];
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return null;
        const { data } = await supabase.from(table).select('*').limit(1);
        const cols = (data && data[0]) ? Object.keys(data[0]) : null;
        st.colsByTable[table] = cols;
        return cols;
    } catch (e) {
        st.colsByTable[table] = null;
        return null;
    }
}

function hasAnyCol(colSet, cols) {
    return cols.some(c => colSet.has(c));
}

function pickExistingCol(colSet, cols) {
    for (const c of cols) if (colSet.has(c)) return c;
    return cols[0];
}

function escapeForIlike(s) {
    // PostgRESTのor()で使うので、最低限 % を逃がす（' は使わない）
    return String(s).replace(/%/g, '\\%');
}

function csGet(row, ...keys) {
    for (const k of keys) {
        if (!k) continue;
        if (row && Object.prototype.hasOwnProperty.call(row, k) && row[k] != null && row[k] !== '') return row[k];
    }
    return '';
}

function csNum(row, ...keys) {
    const v = csGet(row, ...keys);
    if (v == null || v === '') return 0;
    const n = Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function csMoney(n) {
    if (n == null) return '';
    const nn = Number(n);
    if (!Number.isFinite(nn)) return '';
    return nn.toLocaleString('ja-JP');
}

function csPct(n) {
    const nn = Number(n);
    if (!Number.isFinite(nn)) return '';
    return nn.toFixed(1) + '%';
}

function buildCostCells(row) {
    const sales = csNum(row, 'sales', 'uriage', '売上', 'amount', 'orderamount', '受注金額', 'receivable', '売掛金');
    const purchased = csNum(row, 'purchased', 'purchase', 'purchasedparts', 'purchased_parts', '購入', '購入部品費', 'purchaseparts', '購買費');
    const outsource = csNum(row, 'outsource', 'outsourcing', '外注', '外注加工費', 'subcontract', 'subcontract_cost');
    const material = csNum(row, 'material', '材料', '材料費', 'rawmaterial', 'raw_material');
    const misc = csNum(row, 'misc', '諸経費', 'overhead', 'expenses', 'expense');
    const internal = csNum(row, 'internal', '社内', '社内加工費', 'labor', '工数費', 'inhouse');

    const costTotal = csNum(row, 'costtotal', 'cost_total', '原価合計', 'totalcost', 'total_cost') || (purchased + outsource + material + misc + internal);
    const profit = csNum(row, 'profit', '利益', 'grossprofit', 'gross_profit') || (sales ? (sales - costTotal) : 0);
    const profitRate = csNum(row, 'profitrate', 'profit_rate', '利益率', 'margin', 'margin_rate') || (sales ? (profit / sales) * 100 : 0);

    return { sales, costTotal, profit, profitRate, purchased, outsource, material, misc, internal };
}

function buildCostKey(level, row) {
    const c = csGet(row, 'constructno', 'construct_no', 'koujibangou', '工事番号');
    const m = csGet(row, 'machine', 'machinecode', 'machine_code', '機械');
    const u = csGet(row, 'unit', 'unitcode', 'unit_code', 'ユニット');
    const d = csGet(row, 'drawingno', 'drawing_no', 'drawing', '図面番号');
    const name = csGet(row, 'name', 'itemname', 'partname', 'part_name', '品名', '名称');

    if (level === 'construct') return c || '(工事番号不明)';
    if (level === 'machine') return [c, m].filter(Boolean).join(' / ') || '(キー不明)';
    if (level === 'unit') return [c, m, u].filter(Boolean).join(' / ') || '(キー不明)';
    return [c, m, u, d || name].filter(Boolean).join(' / ') || '(キー不明)';
}

function renderCostSummaryTable(level) {
    const st = window._cs;
    if (!st) return;
    const rows = st.results[level] || [];
    const tbody = document.getElementById('cs-tbody');
    const thead = document.getElementById('cs-thead');
    if (!tbody || !thead) return;

    thead.innerHTML = `
        <tr>
            <th>${escapeHtml(COST_SUMMARY_LEVELS[level].label)}キー</th>
            <th style="text-align:right;">売上</th>
            <th style="text-align:right;">原価合計</th>
            <th style="text-align:right;">利益</th>
            <th style="text-align:right;">利益率</th>
            <th style="text-align:right;">購入</th>
            <th style="text-align:right;">外注</th>
            <th style="text-align:right;">材料</th>
            <th style="text-align:right;">諸経費</th>
            <th style="text-align:right;">社内</th>
        </tr>
    `;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="cs-empty">該当データはありません</td></tr>';
        return;
    }

    const drillTo = COST_SUMMARY_LEVELS[level].drillTo;
    tbody.innerHTML = rows.slice(0, 200).map((r, idx) => {
        const key = buildCostKey(level, r);
        const costs = buildCostCells(r);
        const clickable = !!drillTo;
        const cls = clickable ? 'cs-row cs-row-clickable' : 'cs-row';
        return `
            <tr class="${cls}" data-level="${level}" data-index="${idx}" ${clickable ? 'title="クリックで下位へ"' : ''}>
                <td class="cs-key">${escapeHtml(String(key))}</td>
                <td class="cs-num">${csMoney(costs.sales)}</td>
                <td class="cs-num">${csMoney(costs.costTotal)}</td>
                <td class="cs-num ${costs.profit < 0 ? 'cs-neg' : ''}">${csMoney(costs.profit)}</td>
                <td class="cs-num">${csPct(costs.profitRate)}</td>
                <td class="cs-num">${csMoney(costs.purchased)}</td>
                <td class="cs-num">${csMoney(costs.outsource)}</td>
                <td class="cs-num">${csMoney(costs.material)}</td>
                <td class="cs-num">${csMoney(costs.misc)}</td>
                <td class="cs-num">${csMoney(costs.internal)}</td>
            </tr>
        `;
    }).join('');

    // 行クリック（ドリルダウン）
    tbody.querySelectorAll('.cs-row-clickable').forEach(tr => {
        tr.onclick = () => {
            const lv = tr.getAttribute('data-level');
            const i = Number(tr.getAttribute('data-index'));
            const row = (st.results[lv] || [])[i];
            if (!row) return;
            drillDownCostSummary(lv, row);
        };
    });
}

function drillDownCostSummary(level, row) {
    const st = window._cs;
    if (!st) return;
    const next = COST_SUMMARY_LEVELS[level] ? COST_SUMMARY_LEVELS[level].drillTo : null;
    if (!next) return;

    if (level === 'construct') {
        st.filters.constructno = String(csGet(row, 'constructno', 'construct_no', 'koujibangou', '工事番号') || '').trim();
        st.filters.machine = '';
        st.filters.unit = '';
    } else if (level === 'machine') {
        st.filters.constructno = String(csGet(row, 'constructno', 'construct_no', 'koujibangou', '工事番号') || st.filters.constructno || '').trim();
        st.filters.machine = String(csGet(row, 'machine', 'machinecode', 'machine_code', '機械') || '').trim();
        st.filters.unit = '';
    } else if (level === 'unit') {
        st.filters.constructno = String(csGet(row, 'constructno', 'construct_no', 'koujibangou', '工事番号') || st.filters.constructno || '').trim();
        st.filters.machine = String(csGet(row, 'machine', 'machinecode', 'machine_code', '機械') || st.filters.machine || '').trim();
        st.filters.unit = String(csGet(row, 'unit', 'unitcode', 'unit_code', 'ユニット') || '').trim();
    }

    setCostSummaryLevel(next);
    runCostSummarySearch();
}

// テーブル選択画面を表示
function showTableSelection() {
    const selectionSection = document.getElementById('table-selection-section');
    const dataSection = document.getElementById('table-data-section');
    const backBtn = document.getElementById('list-page-back-btn');
    const titleEl = document.getElementById('current-table-title');
    
    if (selectionSection) selectionSection.style.display = 'flex';
    if (dataSection) dataSection.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (titleEl) titleEl.textContent = 'テーブル一覧';
    
    renderTableGrid();
}

// テーブルグリッドを描画
function renderTableGrid() {
    const grid = document.getElementById('list-table-grid');
    const countEl = document.getElementById('list-table-count');
    if (!grid) return;
    
    grid.innerHTML = '';
    if (countEl) countEl.textContent = availableTables.length;
    
    availableTables.forEach(table => {
        const displayName = getTableDisplayName(table);
        const card = document.createElement('div');
        card.className = 'dashboard-card';
        card.style.cssText = 'padding: 20px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 12px; border: 1px solid #e2e8f0;';
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                    <i class="fas fa-table"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 700; color: var(--text-primary); font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayName}</div>
                    <div style="font-size: 11px; color: var(--text-tertiary); font-family: monospace;">${table}</div>
                </div>
            </div>
        `;
        
        card.onmouseover = () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = 'var(--shadow-lg)';
            card.style.borderColor = 'var(--primary-light)';
        };
        card.onmouseout = () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'var(--shadow-sm)';
            card.style.borderColor = '#e2e8f0';
        };
        
        card.onclick = () => selectListTable(table);
        grid.appendChild(card);
    });
}

// テーブルを選択してデータ表示
function selectListTable(tableName) {
    currentTable = tableName;
    const selectionSection = document.getElementById('table-selection-section');
    const dataSection = document.getElementById('table-data-section');
    const backBtn = document.getElementById('list-page-back-btn');
    const titleEl = document.getElementById('current-table-title');
    
    if (selectionSection) selectionSection.style.display = 'none';
    if (dataSection) dataSection.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'block';
    if (titleEl) titleEl.textContent = getTableDisplayName(tableName) + ' - 一覧表示';
    
    loadTableData(tableName);
}

// テーブル選択のフィルタリング
function filterListTableSelection() {
    const searchTerm = document.getElementById('list-table-search').value.toLowerCase();
    const grid = document.getElementById('list-table-grid');
    const resultsArea = document.getElementById('global-search-results');
    const gridTitle = document.getElementById('table-grid-title');
    
    if (!grid) return;
    
    // 検索語が空の場合は結果エリアを隠す
    if (!searchTerm) {
        if (resultsArea) resultsArea.style.display = 'none';
        if (gridTitle) gridTitle.style.display = 'block';
    }
    
    const cards = grid.children;
    for (let card of cards) {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    }
}

function refreshPolarisSavedSearchSelect() {
    const sel = document.getElementById('polaris-saved-search-select');
    if (!sel || typeof window.PolarisProduction === 'undefined') return;
    const list = window.PolarisProduction.getSavedSearches();
    sel.innerHTML = '<option value="">保存した条件で復元</option>';
    list.forEach(function (item) {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item.name + (item.condition && item.condition.tableName ? ' (' + item.condition.tableName + ')' : '');
        sel.appendChild(opt);
    });
}

function updatePolarisSurplusCheckButtonVisibility() {
    const btn = document.getElementById('polaris-surplus-check-btn');
    if (!btn) return;
    if (!tableData || tableData.length === 0) {
        btn.style.display = 'none';
        return;
    }
    var columns = Object.keys(tableData[0]);
    var surplusKeys = ['inventoryno', 'surplusno', 'constructno', 'drawingno', 'drawing', 'partno', 'partname', '図面番号', '品番', '工事番号'];
    var hasRelevant = columns.some(function (col) {
        var lower = col.toLowerCase();
        return surplusKeys.some(function (k) { return lower === k.toLowerCase() || lower.indexOf(k) !== -1; });
    });
    if (!hasRelevant) {
        hasRelevant = columns.some(function (col) {
            return col === 'InventoryNo' || col === 'SurplusNo' || col === 'ConstructNo' || col === 'DrawingNo' || col === 'PartNo';
        });
    }
    btn.style.display = hasRelevant ? '' : 'none';
}

async function runPolarisSurplusCheck() {
    if (typeof window.PolarisProduction === 'undefined') return;
    if (!currentTable || !filteredData || filteredData.length === 0) {
        if (typeof showMessage === 'function') showMessage('テーブルを選択し、データを表示してから実行してください', 'warning');
        return;
    }
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    if (typeof showMessage === 'function') showMessage('余剰在庫を照合しています...', 'info');
    try {
        const { data: surplusRows, error } = await sb.from('t_surplus').select('inventoryno,surplusno,constructno').limit(2000);
        if (error) throw error;
        const keySet = new Set();
        (surplusRows || []).forEach(function (r) {
            if (r.inventoryno) keySet.add(String(r.inventoryno).trim());
            if (r.surplusno) keySet.add(String(r.surplusno).trim());
            if (r.constructno) keySet.add(String(r.constructno).trim());
        });
        const start = (currentPage - 1) * itemsPerPage;
        const pageData = filteredData.slice(start, start + itemsPerPage);
        const rows = tbody.querySelectorAll('tr');
        let matchCount = 0;
        pageData.forEach(function (row, i) {
            const keys = window.PolarisProduction.getSurplusMatchKeys(row);
            const has = keys.some(function (k) { return keySet.has(k); });
            const tr = rows[i];
            if (tr) {
                if (has) {
                    tr.classList.add('polaris-surplus-match');
                    tr.title = '余剰在庫に一致する可能性あり: ' + keys.filter(function (k) { return keySet.has(k); }).join(', ');
                    matchCount++;
                } else {
                    tr.classList.remove('polaris-surplus-match');
                    tr.removeAttribute('title');
                }
            }
        });
        if (typeof showMessage === 'function') showMessage('照合完了。このページで' + matchCount + '件が在庫ありの可能性があります。', matchCount > 0 ? 'success' : 'info');
    } catch (e) {
        console.warn('余剰在庫チェック:', e);
        if (typeof showMessage === 'function') showMessage('余剰在庫の照合に失敗しました: ' + (e.message || e), 'error');
    }
}

// 全テーブルのデータを横断検索
async function searchAllTablesData() {
    const searchTerm = document.getElementById('list-table-search').value.trim();
    if (!searchTerm) {
        showMessage('検索キーワードを入力してください', 'warning');
        return;
    }

    // 検索開始時に流れ星を降らせる
    createShootingStars(false);

    const statusEl = document.getElementById('global-search-status');
    const progressEl = document.getElementById('global-search-progress');
    const resultsArea = document.getElementById('global-search-results');
    const resultsList = document.getElementById('global-search-results-list');
    const resultCountEl = document.getElementById('global-search-result-count');
    const gridTitle = document.getElementById('table-grid-title');

    if (statusEl) statusEl.style.display = 'block';
    if (resultsArea) resultsArea.style.display = 'flex';
    if (resultsList) resultsList.innerHTML = '';
    if (gridTitle) gridTitle.style.display = 'none';

    let totalHits = 0;
    const supabase = getSupabaseClient();
    const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0);

    console.log('検索開始:', searchTerm, '対象テーブル数:', availableTables.length);

            // 各単語について、いずれかのカラムに含まれているか（OR）を、単語ごとにANDで繋ぐ
            const searchPromises = availableTables.map(async (table) => {
                try {
                    // カラム一覧を取得するために最初の1件を取得
                    const { data: sampleData, error: sampleError } = await supabase.from(table).select('*').limit(1);
                    if (sampleError) {
                        console.warn(`テーブル ${table} のカラム取得に失敗:`, sampleError);
                        return null;
                    }
                    if (!sampleData || sampleData.length === 0) return null;

                    const columns = Object.keys(sampleData[0]);
                    let query = supabase.from(table).select('*');
                    
                    // 各単語について、いずれかのカラムに含まれているか（OR）を、単語ごとにANDで繋ぐ
                    for (const word of searchWords) {
                        const wordOrConditions = [];
                        const wordNum = parseFloat(word);
                        const isNumeric = !isNaN(wordNum) && /^\d+$/.test(word);
                        
                        columns.forEach(col => {
                            // 全てのカラムに対して、まずは文字列としての ilike 検索を試みる
                            wordOrConditions.push(`"${col}".ilike.%${word}%`);
                            
                            // キーワードが数字の場合は、数値としての完全一致も OR に含める
                            if (isNumeric) {
                                wordOrConditions.push(`"${col}".eq.${wordNum}`);
                            }
                        });
                        
                        if (wordOrConditions.length > 0) {
                            query = query.or(wordOrConditions.join(','));
                        }
                    }
                    
                    const { data: hits, error: searchError } = await query.limit(10);
                    if (searchError) {
                        console.warn(`テーブル ${table} の検索中にエラー:`, searchError);
                        return null;
                    }

                    if (hits && hits.length > 0) {
                        return {
                            table: table,
                            displayName: getTableDisplayName(table),
                            hits: hits
                        };
                    }
                } catch (e) {
                    console.error(`テーブル ${table} の処理中に例外発生:`, e);
                }
                return null;
            });

            // バッチ処理で実行（一度に大量のリクエストを送らないようにする）
            const batchSize = 5;
            const results = [];
            for (let i = 0; i < searchPromises.length; i += batchSize) {
                const batch = searchPromises.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch);
                results.push(...batchResults);
                
                // 進行状況を更新
                const progress = Math.round(((i + batch.length) / availableTables.length) * 100);
                if (progressEl) progressEl.style.width = `${progress}%`;
            }
    
    // 結果を表示
    results.filter(r => r !== null).forEach(result => {
        const { table, displayName, hits } = result;
        totalHits += hits.length;
        if (resultCountEl) resultCountEl.textContent = `${totalHits}件ヒット`;

        // 結果カードを作成
        const tableResult = document.createElement('div');
        tableResult.className = 'dashboard-card';
        tableResult.style.cssText = 'padding: 12px 16px; border-left: 4px solid var(--primary); background: #f8fafc; margin-bottom: 8px;';
        
        let hitsHtml = hits.map(hit => {
            // ヒットした行の内容を表示（検索語が含まれる項目を強調）
            const matchedEntries = Object.entries(hit)
                .filter(([k, v]) => {
                    if (!v) return false;
                    const valStr = String(v).toLowerCase();
                    return searchWords.some(word => valStr.includes(word.toLowerCase()));
                });

            const summary = matchedEntries
                .map(([k, v]) => {
                    let valDisplay = String(v);
                    searchWords.forEach(word => {
                        const reg = new RegExp(`(${word})`, 'gi');
                        valDisplay = valDisplay.replace(reg, '<mark style="background: #fef08a; padding: 0 2px; border-radius: 2px;">$1</mark>');
                    });
                    return `<span style="color: var(--text-tertiary); font-size: 10px;">${k}:</span> <span style="font-size: 12px;">${valDisplay}</span>`;
                })
                .join(' | ');
            
            return `<div style="padding: 6px 0; border-bottom: 1px solid #edf2f7; line-height: 1.4;">${summary}</div>`;
        }).join('');

        tableResult.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; height: 38px;">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                    <i class="fas fa-table" style="color: var(--primary); font-size: 12px;"></i>
                    <div style="font-weight: 800; color: var(--text-primary); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${displayName} 
                        <span style="font-size: 10px; font-weight: 400; color: var(--text-tertiary); margin-left: 4px; font-family: monospace;">${table}</span>
                    </div>
                    <span style="font-size: 10px; background: var(--primary); color: white; padding: 1px 6px; border-radius: 8px;">${hits.length}</span>
                </div>
                <button class="btn-primary" onclick="selectListTable('${table}')" style="padding: 0 12px; height: 28px; font-size: 11px; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-external-link-alt" style="font-size: 10px;"></i> 開く
                </button>
            </div>
            <div style="max-height: 150px; overflow-y: auto; padding-right: 4px;">${hitsHtml}</div>
        `;
        resultsList.appendChild(tableResult);
    });

    if (statusEl) statusEl.style.display = 'none';
    if (totalHits === 0) {
        resultsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-tertiary); font-size: 13px;">データの中身に一致するものは見つかりませんでした。</div>';
    }
    
    // テーブル一覧もフィルタリング（テーブル名でのヒットも残す）
    filterListTableSelection();
}

// 検索内容をクリア
function clearGlobalSearch() {
    const searchInput = document.getElementById('list-table-search');
    const resultsArea = document.getElementById('global-search-results');
    const gridTitle = document.getElementById('table-grid-title');
    const clearBtn = document.getElementById('clear-global-search-btn');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        filterListTableSelection();
    }
    if (resultsArea) resultsArea.style.display = 'none';
    if (gridTitle) gridTitle.style.display = 'block';
    if (clearBtn) clearBtn.style.display = 'none';
}

// グローバルに公開
window.showTableSelection = showTableSelection;
window.selectListTable = selectListTable;
window.filterListTableSelection = filterListTableSelection;
window.searchAllTablesData = searchAllTablesData;
window.clearGlobalSearch = clearGlobalSearch;


// ダッシュボードの更新
async function updateDashboard() {
    console.log('updateDashboard関数が呼ばれました');


    // KPIカードの更新（削除済み）
    
    // グラフの更新
    updateCharts();

    // 通知の更新
    updateNotifications();

    // カレンダーの更新
    console.log('カレンダーを更新します');
    if (typeof loadCalendarEvents === 'function') {
    loadCalendarEvents();
    } else {
        console.warn('loadCalendarEvents関数が見つかりません');
    }
    if (typeof loadCompanyCalendarEvents === 'function') {
        loadCompanyCalendarEvents();
    } else {
        console.warn('loadCompanyCalendarEvents関数が見つかりません');
    }
    
    // カレンダーの表示を確実に更新（少し遅延して複数回試行）
    let calendarUpdateAttempts = 0;
    const maxCalendarAttempts = 3;
    const updateCalendarWithRetry = () => {
        calendarUpdateAttempts++;
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYearEl = document.getElementById('calendar-month-year');
        const weekdayHeader = document.getElementById('calendar-weekday-header');
        
        console.log('カレンダー要素の確認（試行', calendarUpdateAttempts, '）:', {
            calendarGrid: !!calendarGrid,
            monthYearEl: !!monthYearEl,
            weekdayHeader: !!weekdayHeader,
            dashboardPage: !!document.getElementById('dashboard-page'),
            calendarCard: !!document.querySelector('.calendar-card')
        });
        
        if (calendarGrid && monthYearEl) {
            // goToToday()を使って確実にカレンダーを初期化
            if (typeof goToToday === 'function') {
                console.log('goToToday()を呼び出してカレンダーを初期化します（試行回数:', calendarUpdateAttempts, '）');
                goToToday();
            } else if (typeof updateCalendar === 'function') {
    updateCalendar();
                console.log('カレンダーを更新しました（試行回数:', calendarUpdateAttempts, '）');
            } else {
                console.error('updateCalendar関数とgoToToday関数の両方が見つかりません');
            }
        } else if (calendarUpdateAttempts < maxCalendarAttempts) {
            setTimeout(updateCalendarWithRetry, 200);
        } else {
            console.error('カレンダー要素が見つかりません（最大試行回数に達しました）', {
                calendarGrid: !!calendarGrid,
                monthYearEl: !!monthYearEl,
                weekdayHeader: !!weekdayHeader,
                dashboardPage: !!document.getElementById('dashboard-page'),
                calendarCard: !!document.querySelector('.calendar-card')
            });
            // 最後の試みとして、goToToday()またはupdateCalendar()を呼び出す
            if (typeof goToToday === 'function') {
                console.log('最後の試みとしてgoToToday()を呼び出します');
                goToToday();
            } else if (typeof updateCalendar === 'function') {
                console.log('最後の試みとしてupdateCalendarを呼び出します');
                updateCalendar();
            }
        }
    };
    
    // 即座に1回試行
    updateCalendarWithRetry();
    
    if (typeof updateCompanyCalendarList === 'function') {
    updateCompanyCalendarList();
    } else {
        console.warn('updateCompanyCalendarList関数が見つかりません');
    }

    // Todoリストの更新
    console.log('Todoリストを更新します');
    setTimeout(() => {
        if (typeof updateDashboardTodos === 'function') {
    updateDashboardTodos();
            console.log('Todoリストを更新しました');
        } else {
            console.error('updateDashboardTodos関数が見つかりません');
        }
    }, 200);
    
    // 右サイドバーの更新
    updateTodayEvents();
    updateDueTasks();
    
    // 会社カレンダーフォームのイベントリスナー
    const companyCalendarForm = document.getElementById('company-calendar-form');
    if (companyCalendarForm) {
        companyCalendarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const datesInput = document.getElementById('company-calendar-dates').value.trim();
            
            if (!datesInput) {
                alert('日付を入力してください');
                return;
            }
            
            // スペースまたは改行で分割して日付を取得
            const dateStrings = datesInput.split(/\s+/).map(s => s.trim()).filter(s => s.length > 0);
            const dates = [];
            
            // 日付をパース（YYYY/MM/DD形式またはYYYY-MM-DD形式に対応）
            dateStrings.forEach(dateInput => {
                let dateStr = '';
                // YYYY/MM/DD形式をYYYY-MM-DD形式に変換
                if (dateInput.includes('/')) {
                    const parts = dateInput.split('/');
                    if (parts.length === 3) {
                        dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                } else if (dateInput.includes('-')) {
                    dateStr = dateInput;
                }
                
                if (dateStr) {
                    // 日付の妥当性をチェック
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        dates.push(dateStr);
                    }
                }
            });
            
            if (dates.length === 0) {
                alert('有効な日付が見つかりませんでした。YYYY/MM/DD形式で入力してください。');
                return;
            }
            
            // 既に登録されている日付をチェック
            const existingDates = [];
            const newDates = [];
            
            dates.forEach(date => {
                const dateExists = companyCalendarEvents.some(event => {
                    const eventDate = new Date(event.date).toISOString().split('T')[0];
                    return eventDate === date;
                });
                
                if (dateExists) {
                    existingDates.push(date);
                } else {
                    newDates.push(date);
                }
            });
            
            // 新しい日付を追加
            let addedCount = 0;
            newDates.forEach(date => {
                companyCalendarEvents.push({
                    date: date,
                    title: '会社休日',
                    type: 'holiday',
                    description: '',
                    yearly: false
                });
                addedCount++;
            });
            
            if (addedCount > 0) {
                saveCompanyCalendarEvents();
                updateCompanyCalendarList();
                updateCalendar();
                
                let message = `${addedCount}件の会社カレンダーを登録しました`;
                if (existingDates.length > 0) {
                    message += `\n（${existingDates.length}件は既に登録済みでした）`;
                }
                showMessage(message, 'success');
            } else {
                alert('すべての日付が既に登録されています');
            }
            
            // フォームをリセット
            document.getElementById('company-calendar-dates').value = '';
        });
    }

    // 最近使用したテーブル（最初の5つ）
    const recentContainer = document.getElementById('recent-tables');
    if (!recentContainer) {
        console.warn('recent-tables要素が見つかりません');
        return;
    }
    recentContainer.innerHTML = '';
    const recentTables = availableTables.slice(0, 5);
    recentTables.forEach(table => {
        const item = document.createElement('div');
        item.className = 'recent-table-item';
        const displayName = getTableDisplayName(table);
        item.textContent = displayName;
        item.addEventListener('click', () => {
            currentTable = table;
            loadTableData(table);
            showPage('list');
        });
        recentContainer.appendChild(item);
    });
}

// KPIカードのイベントリスナーを設定
function setupKPICards() {
    // 保存された値を読み込んで表示
    loadKPICards();
}

// KPIモーダルを開く
function openKPIModal(kpiType) {
    const modal = document.getElementById('kpi-modal');
    const titleEl = document.getElementById('kpi-modal-title');
    const labelEl = document.getElementById('kpi-form-label');
    const inputEl = document.getElementById('kpi-form-input');
    const noteEl = document.getElementById('kpi-form-note');
    
    if (!modal) return;
    
    // KPIタイプに応じてタイトルとラベルを設定
    const kpiConfig = {
        'production': { title: '生産量', label: '生産量', key: 'production' },
        'operating-rate': { title: '稼働率', label: '稼働率 (%)', key: 'operating-rate' },
        'delivery-rate': { title: '納期遵守率', label: '納期遵守率 (%)', key: 'delivery-rate' }
    };
    
    const config = kpiConfig[kpiType];
    if (!config) return;
    
    // 現在の値を読み込む
    const currentValue = localStorage.getItem(`kpi-${config.key}`) || '';
    
    titleEl.textContent = config.title;
    labelEl.textContent = config.label;
    inputEl.value = currentValue;
    inputEl.setAttribute('data-kpi-type', kpiType);
    inputEl.setAttribute('data-kpi-key', config.key);
    
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    // フォーカスを設定
    setTimeout(() => {
        inputEl.focus();
    }, 100);
}

// KPIモーダルを閉じる
function closeKPIModal() {
    const modal = document.getElementById('kpi-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// KPIを保存
function saveKPI() {
    const inputEl = document.getElementById('kpi-form-input');
    if (!inputEl) return;
    
    const kpiType = inputEl.getAttribute('data-kpi-type');
    const kpiKey = inputEl.getAttribute('data-kpi-key');
    const value = inputEl.value.trim();
    
    if (!kpiKey) return;
    
    // localStorageに保存
    if (value) {
        localStorage.setItem(`kpi-${kpiKey}`, value);
    } else {
        localStorage.removeItem(`kpi-${kpiKey}`);
    }
    
    // 表示を更新
    updateKPIDisplay(kpiKey, value);
    
    // モーダルを閉じる
    closeKPIModal();
}

// KPI表示を更新
function updateKPIDisplay(kpiKey, value) {
    const displayEl = document.getElementById(`kpi-${kpiKey}-display`);
    if (displayEl) {
        displayEl.textContent = value || '-';
    }
}

// KPIカードの更新（自動入力しない）
function updateKPICards(totalRecords) {
    // KPIカードはユーザーが手動で入力するため、自動更新しない
    // localStorageから保存された値を読み込む
    loadKPICards();
}

// KPIカードの値をlocalStorageから読み込む
function loadKPICards() {
    const kpiKeys = ['production', 'operating-rate', 'delivery-rate'];
    
    kpiKeys.forEach(key => {
        const savedValue = localStorage.getItem(`kpi-${key}`);
        updateKPIDisplay(key, savedValue);
    });
}

// グローバルに公開
window.openKPIModal = openKPIModal;
window.closeKPIModal = closeKPIModal;
window.saveKPI = saveKPI;

// 掲示板の管理
let bulletins = [];
// グローバルに公開（通知機能で使用）
window.bulletins = bulletins;

// 掲示板を読み込む
function loadBulletins() {
    const saved = localStorage.getItem('bulletins');
    if (saved) {
        try {
            bulletins = JSON.parse(saved);
            // 既存の掲示板にcreatedAtがない場合は追加（IDを基準に）
            bulletins.forEach(bulletin => {
                if (!bulletin.createdAt) {
                    // IDを基準に作成時刻を推定（古いものほど過去の時刻）
                    const baseTime = new Date('2024-01-01').getTime();
                    bulletin.createdAt = new Date(baseTime + (bulletin.id || 0) * 1000).toISOString();
                }
            });
        } catch (e) {
            bulletins = [];
        }
    } else {
        bulletins = [];
    }
    // グローバルに公開（通知機能で使用）
    window.bulletins = bulletins;
    renderBulletins();
    renderBulletinsFull(); // フルページ版も更新
    // 通知を更新
    if (typeof updateNotifications === 'function') {
        updateNotifications();
    }
}

// 掲示板を保存
function saveBulletins() {
    localStorage.setItem('bulletins', JSON.stringify(bulletins));
    // グローバルに公開（通知機能で使用）
    window.bulletins = bulletins;
    renderBulletins();
    renderBulletinsFull(); // フルページ版も更新
    // 通知を更新（少し遅延して確実に更新）
    setTimeout(() => {
        if (typeof updateNotifications === 'function') {
            updateNotifications();
        }
        if (typeof updateNotificationsWithTodos === 'function') {
            updateNotificationsWithTodos();
        }
    }, 100);
}

// 掲示板を表示（フルページ版）
function renderBulletinsFull() {
    const listEl = document.getElementById('bulletin-list-full');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (bulletins.length === 0) {
        listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">掲示板がありません</div>';
        return;
    }
    
    // 作成時刻とIDでソート（新しい順、同じ時刻の場合はIDの大きい順）
    const sortedBulletins = [...bulletins].sort((a, b) => {
        // まず作成時刻で比較
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
        if (timeB !== timeA) {
            return timeB - timeA; // 新しい順
        }
        // 作成時刻が同じ場合はIDで比較
        return (b.id || 0) - (a.id || 0);
    });
    
    sortedBulletins.forEach((bulletin, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'bulletin-item';
        itemEl.onclick = () => showBulletinDetail(bulletin.id);
        
        const date = new Date(bulletin.date);
        const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        
        let filesHtml = '';
        if (bulletin.files && bulletin.files.length > 0) {
            filesHtml = `<div class="bulletin-files">
                ${bulletin.files.map((file, fileIndex) => {
                    const fileIcon = getFileIcon(file.type || file.name);
                    return `
                    <a href="#" class="bulletin-file-link" onclick="event.stopPropagation(); viewBulletinFile(${bulletin.id}, ${fileIndex}); return false;" title="表示: ${escapeHtml(file.name)}">
                        <i class="${fileIcon}"></i> ${escapeHtml(file.name)}
                    </a>
                `;
                }).join('')}
            </div>`;
        }
        
        itemEl.innerHTML = `
            <div class="bulletin-item-content">
                <span class="bulletin-date">${dateStr}</span>
                <span class="bulletin-dot">●</span>
                <span class="bulletin-text">${escapeHtml(bulletin.text)}</span>
            </div>
            <div class="bulletin-item-right">
                ${filesHtml}
                <button class="bulletin-action-btn delete" onclick="event.stopPropagation(); deleteBulletin(${bulletin.id})" title="削除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        listEl.appendChild(itemEl);
    });
}

// 掲示板を表示
// 掲示板を表示（ホーム：最新1件のみプレビュー）
function renderBulletins() {
    const listEl = document.getElementById('bulletin-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (bulletins.length === 0) {
        listEl.innerHTML = '<div class="bulletin-preview-empty"><i class="fas fa-inbox"></i> 投稿がありません</div>';
        return;
    }

    // 新しい順にソート
    const sortedBulletins = [...bulletins].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
    });

    // 最新1件のみ表示
    const latest = sortedBulletins[0];
    const date = new Date(latest.date);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    const total = bulletins.length;
    const moreText = total > 1 ? `<span class="bulletin-preview-more">他 ${total - 1} 件</span>` : '';

    listEl.innerHTML = `
        <div class="bulletin-preview-row">
            <span class="bulletin-preview-date">${dateStr}</span>
            <span class="bulletin-preview-text">${escapeHtml(latest.text)}</span>
            ${moreText}
            <i class="fas fa-chevron-right bulletin-preview-arrow"></i>
        </div>
    `;
}

// 掲示板モーダルを開く
function openBulletinModal(bulletinId = null) {
    console.log('openBulletinModal called with:', bulletinId);
    const modal = document.getElementById('bulletin-modal');
    const titleEl = document.getElementById('bulletin-modal-title');
    const dateEl = document.getElementById('bulletin-date');
    const textEl = document.getElementById('bulletin-text');
    const fileEl = document.getElementById('bulletin-file');
    const fileListEl = document.getElementById('bulletin-file-list');
    const editIdEl = document.getElementById('bulletin-edit-id');
    
    if (!modal) return;
    
    // ファイルリストをクリア
    if (fileListEl) fileListEl.innerHTML = '';
    if (fileEl) fileEl.value = '';
    
    if (bulletinId) {
        // 編集モード
        const bulletin = bulletins.find(b => b.id === bulletinId);
        if (bulletin) {
            titleEl.textContent = '掲示板を編集';
            dateEl.value = bulletin.date;
            textEl.value = bulletin.text;
            editIdEl.value = bulletinId;
            
            // 既存の添付ファイルを表示
            if (bulletin.files && bulletin.files.length > 0 && fileListEl) {
                bulletin.files.forEach((file, index) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'bulletin-file-item';
                    fileItem.innerHTML = `
                        <i class="fas fa-file"></i>
                        <span>${escapeHtml(file.name)}</span>
                        <button type="button" class="bulletin-file-remove" onclick="removeBulletinFile(${bulletinId}, ${index})" title="削除">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    fileListEl.appendChild(fileItem);
                });
            }
        }
    } else {
        // 新規追加モード
        titleEl.textContent = '掲示板を追加';
        dateEl.value = new Date().toISOString().split('T')[0];
        textEl.value = '';
        editIdEl.value = '';
    }
    
    // ファイル選択時の処理
    if (fileEl) {
        fileEl.onchange = function(e) {
            handleBulletinFileSelect(e, fileListEl);
        };
    }
    
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    setTimeout(() => {
        textEl.focus();
    }, 100);
}

// ファイル選択時の処理
let selectedFiles = [];

function handleBulletinFileSelect(event, fileListEl) {
    const files = Array.from(event.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    files.forEach(file => {
        if (file.size > maxSize) {
            alert(`ファイル「${file.name}」は5MBを超えています。`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result // Base64エンコードされたデータ
            };
            
            selectedFiles.push(fileData);
            
            // ファイルリストに追加
            if (fileListEl) {
                const fileItem = document.createElement('div');
                fileItem.className = 'bulletin-file-item new';
                fileItem.innerHTML = `
                    <i class="fas fa-file"></i>
                    <span>${escapeHtml(file.name)}</span>
                    <button type="button" class="bulletin-file-remove" onclick="removeSelectedFile(${selectedFiles.length - 1})" title="削除">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                fileListEl.appendChild(fileItem);
            }
        };
        reader.readAsDataURL(file);
    });
}

// 選択中のファイルを削除
function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    const fileListEl = document.getElementById('bulletin-file-list');
    if (fileListEl) {
        const items = fileListEl.querySelectorAll('.bulletin-file-item.new');
        if (items[index]) {
            items[index].remove();
        }
    }
}

// 既存の添付ファイルを削除
function removeBulletinFile(bulletinId, fileIndex) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin || !bulletin.files) return;
    
    bulletin.files.splice(fileIndex, 1);
    saveBulletins();
    openBulletinModal(bulletinId); // モーダルを再表示
}

// 掲示板モーダルを閉じる
function closeBulletinModal() {
    const modal = document.getElementById('bulletin-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // 選択ファイルをクリア
    selectedFiles = [];
    const fileEl = document.getElementById('bulletin-file');
    const fileListEl = document.getElementById('bulletin-file-list');
    if (fileEl) fileEl.value = '';
    if (fileListEl) fileListEl.innerHTML = '';
}

// 掲示板を編集
// 掲示板の通知を追加（この関数は現在使用されていませんが、互換性のため残しています）
function addBulletinNotification(bulletinId) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin) return;
    
    const key = getReadBulletinsKey();
    const readBulletins = JSON.parse(localStorage.getItem(key) || '[]');
    if (!readBulletins.includes(bulletinId)) {
        // 既読リストに追加しない（通知を表示するため）
    }
}

// ユーザーごとの既読状態を取得するキーを生成
function getReadBulletinsKey() {
    const loginId = localStorage.getItem('loginId') || 'guest';
    return `readBulletins_${loginId}`;
}

// 掲示板の通知を既読にする
function markBulletinAsRead(bulletinId) {
    const key = getReadBulletinsKey();
    const readBulletins = JSON.parse(localStorage.getItem(key) || '[]');
    if (!readBulletins.includes(bulletinId)) {
        readBulletins.push(bulletinId);
        localStorage.setItem(key, JSON.stringify(readBulletins));
        console.log(`ユーザー ${localStorage.getItem('loginId') || 'guest'} が掲示板 ${bulletinId} を既読にしました`);
        // 通知を更新
        if (typeof updateNotifications === 'function') {
            updateNotifications();
        }
        // todo.jsの関数も呼ぶ
        if (typeof markBulletinNotificationAsRead === 'function') {
            markBulletinNotificationAsRead(bulletinId);
        }
    }
}

// 掲示板の詳細を表示
function showBulletinDetail(bulletinId) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin) return;
    
    // 通知を既読にする
    markBulletinAsRead(bulletinId);
    
    const modal = document.getElementById('bulletin-detail-modal');
    const dateEl = document.getElementById('bulletin-detail-date');
    const textEl = document.getElementById('bulletin-detail-text');
    const filesContainer = document.getElementById('bulletin-detail-files-container');
    const filesList = document.getElementById('bulletin-detail-files');
    const editBtn = document.getElementById('bulletin-detail-edit-btn');
    
    if (!modal || !dateEl || !textEl || !filesList || !editBtn) return;
    
    // 日付を表示
    const date = new Date(bulletin.date);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    dateEl.textContent = dateStr;
    
    // 内容を表示
    textEl.textContent = bulletin.text || '';
    
    // 添付ファイルを表示
    if (bulletin.files && bulletin.files.length > 0) {
        filesContainer.style.display = 'block';
        filesList.innerHTML = '';
        bulletin.files.forEach((file, fileIndex) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'bulletin-detail-file-item';
            fileItem.style.cssText = 'padding: 10px 12px; margin-bottom: 8px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 6px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s;';
            fileItem.onmouseover = function() { this.style.background = 'var(--bg-tertiary)'; };
            fileItem.onmouseout = function() { this.style.background = 'var(--bg-secondary)'; };
            
            const fileIcon = getFileIcon(file.type || file.name);
            fileItem.innerHTML = `
                <i class="${fileIcon}" style="font-size: 18px; color: var(--primary);"></i>
                <span style="flex: 1; font-size: 14px; color: var(--text-primary);">${escapeHtml(file.name)}</span>
                <i class="fas fa-external-link-alt" style="font-size: 12px; color: var(--text-secondary);"></i>
            `;
            fileItem.onclick = function(e) {
                e.stopPropagation();
                viewBulletinFile(bulletinId, fileIndex);
            };
            filesList.appendChild(fileItem);
        });
    } else {
        filesContainer.style.display = 'none';
    }
    
    // 編集ボタンのイベント
    editBtn.onclick = function() {
        closeBulletinDetailModal();
        setTimeout(() => {
            editBulletin(bulletinId);
        }, 100);
    };
    
    // モーダルを表示
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
}

// 掲示板詳細モーダルを閉じる
function closeBulletinDetailModal() {
    const modal = document.getElementById('bulletin-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function editBulletin(bulletinId) {
    openBulletinModal(bulletinId);
}

// 掲示板を保存
function saveBulletin() {
    const dateEl = document.getElementById('bulletin-date');
    const textEl = document.getElementById('bulletin-text');
    const editIdEl = document.getElementById('bulletin-edit-id');
    
    if (!dateEl || !textEl) return;
    
    const date = dateEl.value;
    const text = textEl.value.trim();
    
    if (!date || !text) {
        alert('日付と内容を入力してください');
        return;
    }
    
    const editId = editIdEl.value;
    
    if (editId) {
        // 編集
        const index = bulletins.findIndex(b => b.id === parseInt(editId));
        if (index !== -1) {
            bulletins[index].date = date;
            bulletins[index].text = text;
            
            // 新しいファイルを追加
            if (selectedFiles.length > 0) {
                if (!bulletins[index].files) {
                    bulletins[index].files = [];
                }
                bulletins[index].files.push(...selectedFiles);
            }
        }
    } else {
        // 新規追加
        const newId = bulletins.length > 0 ? Math.max(...bulletins.map(b => b.id)) + 1 : 1;
        const now = new Date();
        bulletins.push({
            id: newId,
            date: date,
            text: text,
            files: selectedFiles.length > 0 ? [...selectedFiles] : [],
            createdAt: now.toISOString() // 作成時刻を追加
        });
        console.log('新しい掲示板を追加しました:', newId, bulletins[bulletins.length - 1]);
    }
    
    selectedFiles = []; // 選択ファイルをクリア
    saveBulletins();
    closeBulletinModal();
    
    // 通知を更新（少し遅延して確実に更新）
    setTimeout(() => {
        console.log('掲示板保存後の通知更新');
        console.log('window.bulletins:', window.bulletins);
        console.log('bulletins:', bulletins);
        // window.bulletinsを確実に更新
        window.bulletins = bulletins;
        // まずupdateNotificationsを呼ぶ（これがupdateNotificationsWithTodosを呼ぶ）
        if (typeof updateNotifications === 'function') {
            updateNotifications();
        }
        // 念のため直接updateNotificationsWithTodosも呼ぶ
        if (typeof updateNotificationsWithTodos === 'function') {
            updateNotificationsWithTodos();
        }
    }, 500);
}

// 掲示板を削除
function deleteBulletin(bulletinId) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin) return;
    
    const bulletinText = bulletin.text || '掲示板';
    const date = new Date(bulletin.date);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    
    if (typeof showDeleteConfirm === 'function') {
        showDeleteConfirm(
            '掲示板を削除',
            `${dateStr}の掲示板「${bulletinText}」を削除しますか？\nこの操作は取り消せません。`,
            () => {
                bulletins = bulletins.filter(b => b.id !== bulletinId);
                saveBulletins();
                if (typeof showMessage === 'function') {
                    showMessage('掲示板を削除しました', 'success');
                } else {
                    alert('掲示板を削除しました');
                }
            }
        );
    } else {
        // フォールバック
        if (confirm(`${dateStr}の掲示板「${bulletinText}」を削除しますか？`)) {
            bulletins = bulletins.filter(b => b.id !== bulletinId);
            saveBulletins();
            if (typeof showMessage === 'function') {
                showMessage('掲示板を削除しました', 'success');
            } else {
                alert('掲示板を削除しました');
            }
        }
    }
}

// ファイルアイコンを取得
function getFileIcon(fileTypeOrName) {
    const type = fileTypeOrName.toLowerCase();
    const name = fileTypeOrName.toLowerCase();
    
    // 画像ファイル
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name)) {
        return 'fas fa-image';
    }
    // PDFファイル
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
        return 'fas fa-file-pdf';
    }
    // テキストファイル
    if (type.startsWith('text/') || /\.(txt|md|csv|json|xml|html|css|js)$/i.test(name)) {
        return 'fas fa-file-alt';
    }
    // Wordファイル
    if (type.includes('word') || /\.(doc|docx)$/i.test(name)) {
        return 'fas fa-file-word';
    }
    // Excelファイル
    if (type.includes('excel') || type.includes('spreadsheet') || /\.(xls|xlsx)$/i.test(name)) {
        return 'fas fa-file-excel';
    }
    // 動画ファイル
    if (type.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(name)) {
        return 'fas fa-file-video';
    }
    // 音声ファイル
    if (type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(name)) {
        return 'fas fa-file-audio';
    }
    // その他
    return 'fas fa-file';
}

// ファイルタイプを判別
function getFileType(file) {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    
    // 画像ファイル
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name)) {
        return 'image';
    }
    // PDFファイル
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
        return 'pdf';
    }
    // テキストファイル
    if (type.startsWith('text/') || /\.(txt|md|csv|json|xml|html|css|js)$/i.test(name)) {
        return 'text';
    }
    // その他（ダウンロードのみ）
    return 'other';
}

// 添付ファイルを表示
function viewBulletinFile(bulletinId, fileIndex) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin || !bulletin.files || !bulletin.files[fileIndex]) return;
    
    const file = bulletin.files[fileIndex];
    const fileType = getFileType(file);
    
    const modal = document.getElementById('file-viewer-modal');
    if (!modal) {
        // モーダルが存在しない場合はダウンロード
        downloadBulletinFile(bulletinId, fileIndex);
        return;
    }
    
    const titleEl = document.getElementById('file-viewer-title');
    const contentEl = document.getElementById('file-viewer-content');
    const downloadBtn = document.getElementById('file-viewer-download');
    
    if (titleEl) titleEl.textContent = file.name;
    
    // コンテンツをクリア
    if (contentEl) contentEl.innerHTML = '';
    
    // ダウンロードボタンの設定
    if (downloadBtn) {
        downloadBtn.onclick = () => downloadBulletinFile(bulletinId, fileIndex);
    }
    
    // ファイルタイプに応じて表示
    if (fileType === 'image') {
        // 画像を表示
        const img = document.createElement('img');
        img.src = file.data;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '70vh';
        img.style.objectFit = 'contain';
        img.style.margin = '0 auto';
        img.style.display = 'block';
        if (contentEl) contentEl.appendChild(img);
    } else if (fileType === 'pdf') {
        // PDFを表示
        const iframe = document.createElement('iframe');
        iframe.src = file.data;
        iframe.style.width = '100%';
        iframe.style.height = '70vh';
        iframe.style.border = 'none';
        if (contentEl) contentEl.appendChild(iframe);
    } else if (fileType === 'text') {
        // テキストを表示
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        pre.style.maxHeight = '70vh';
        pre.style.overflow = 'auto';
        pre.style.padding = '16px';
        pre.style.background = 'var(--bg-secondary)';
        pre.style.borderRadius = '8px';
        pre.style.margin = '0';
        
        // Base64からテキストをデコード
        try {
            const base64Data = file.data.split(',')[1] || file.data;
            const text = atob(base64Data);
            pre.textContent = text;
        } catch (e) {
            pre.textContent = 'テキストの読み込みに失敗しました';
        }
        
        if (contentEl) contentEl.appendChild(pre);
    } else {
        // その他のファイルはダウンロードのみ
        downloadBulletinFile(bulletinId, fileIndex);
        return;
    }
    
    modal.style.display = 'flex';
    modal.style.zIndex = '10001';
}

// ファイルビューアモーダルを閉じる
function closeFileViewerModal() {
    const modal = document.getElementById('file-viewer-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 添付ファイルをダウンロード
function downloadBulletinFile(bulletinId, fileIndex) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin || !bulletin.files || !bulletin.files[fileIndex]) return;
    
    const file = bulletin.files[fileIndex];
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// グローバルに公開
window.openBulletinModal = openBulletinModal;
window.closeBulletinModal = closeBulletinModal;
window.saveBulletin = saveBulletin;
window.editBulletin = editBulletin;
window.showBulletinDetail = showBulletinDetail;
window.closeBulletinDetailModal = closeBulletinDetailModal;
window.deleteBulletin = deleteBulletin;
window.removeSelectedFile = removeSelectedFile;
window.removeBulletinFile = removeBulletinFile;
window.viewBulletinFile = viewBulletinFile;
window.closeFileViewerModal = closeFileViewerModal;
window.getFileIcon = getFileIcon;
window.downloadBulletinFile = downloadBulletinFile;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openSettingsPage = openSettingsPage;
window.closeSettingsPage = closeSettingsPage;
window.openUserFormModal = openUserFormModal;
window.closeUserFormModal = closeUserFormModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.renderUserList = renderUserList;
window.closeSettingsModal = closeSettingsModal;

// 通知の更新（Todoを含む）
function updateNotifications() {
    if (typeof updateNotificationsWithTodos === 'function') {
        updateNotificationsWithTodos();
    } else {
        // フォールバック（todo.jsが読み込まれていない場合）
        const notifications = [];
        
        // 通知バッジを更新
        const unreadCount = notifications.filter(n => n.unread).length;
        const badge = document.getElementById('header-notification-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // 通知ドロップダウンの内容を更新
        const dropdownBody = document.getElementById('notification-dropdown-body');
        if (dropdownBody) {
            dropdownBody.innerHTML = '';
            if (notifications.length === 0) {
                dropdownBody.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">通知はありません</div>';
            } else {
                notifications.forEach(notification => {
                    const item = document.createElement('div');
                    item.className = `notification-dropdown-item ${notification.unread ? 'unread' : ''}`;
                    
                    let iconClass = 'info';
                    let icon = 'fa-info-circle';
                    if (notification.type === 'warning') {
                        iconClass = 'warning';
                        icon = 'fa-exclamation-triangle';
                    } else if (notification.type === 'danger') {
                        iconClass = 'danger';
                        icon = 'fa-exclamation-circle';
                    }
                    
                    item.innerHTML = `
                        <div class="notification-dropdown-item-icon ${iconClass}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="notification-dropdown-item-content">
                            <div class="notification-dropdown-item-title">${notification.title}</div>
                            <div class="notification-dropdown-item-time">${notification.time}</div>
                        </div>
                    `;
                    
                    dropdownBody.appendChild(item);
                });
            }
        }
    }
}

// 通知ドロップダウンの開閉
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) {
        console.error('通知ドロップダウンが見つかりません');
        return;
    }
    
    const isVisible = dropdown.style.display !== 'none' && dropdown.style.display !== '';
    console.log('通知ドロップダウンの状態:', isVisible ? '表示中' : '非表示');
    
    if (!isVisible) {
        // ドロップダウンを開く前に通知を更新
        updateNotifications();
        dropdown.style.display = 'flex';
        console.log('通知ドロップダウンを開きました');
    } else {
        dropdown.style.display = 'none';
        console.log('通知ドロップダウンを閉じました');
    }
}

function closeNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// グラフの更新
let productionChart = null;
let operatingRateChart = null;
let defectRateChart = null;

function updateCharts() {
    // グラフは削除されました
}

// カレンダー表示用の変数
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();
let calendarEvents = []; // カレンダーの予定
let companyCalendarEvents = []; // 会社カレンダーの予定（休日・イベント）

// 今日の予定を右サイドバーに表示
function updateTodayEvents() {
    const todayEventsList = document.getElementById('today-events-list');
    if (!todayEventsList) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const todayEvents = calendarEvents.filter(event => {
        if (!event || !event.date) return false;
        
        // 日付を文字列として比較
        let eventDateStr = event.date;
        
        // Dateオブジェクトの場合は文字列に変換
        if (eventDateStr instanceof Date || (typeof eventDateStr === 'string' && eventDateStr.includes('T'))) {
            const d = new Date(eventDateStr);
            eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else if (typeof eventDateStr === 'string' && eventDateStr.includes('/')) {
            // YYYY/MM/DD形式の場合はYYYY-MM-DDに変換
            const parts = eventDateStr.split('/');
            if (parts.length === 3) {
                eventDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        }
        
        // 今日の予定でない場合は除外
        if (eventDateStr !== todayStr) return false;
        
        // 時間がない予定は表示する
        if (!event.time || event.time.trim() === '') return true;
        
        // 時間をパース（HH:MM形式を想定）
        const timeParts = event.time.trim().split(':');
        if (timeParts.length < 2) return true; // 形式が不正な場合は表示
        
        const eventHour = parseInt(timeParts[0], 10);
        const eventMinute = parseInt(timeParts[1], 10);
        
        if (isNaN(eventHour) || isNaN(eventMinute)) return true; // パース失敗時は表示
        
        // 現在時刻と比較（予定時間から30分後までは表示）
        const eventTimeInMinutes = eventHour * 60 + eventMinute;
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const eventEndTimeInMinutes = eventTimeInMinutes + 30; // 予定時間から30分後
        
        return currentTimeInMinutes <= eventEndTimeInMinutes;
    });
    
    // 時間順にソート
    todayEvents.sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        
        // 時間がない場合は最後に
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        // 時間を比較（HH:MM形式を想定）
        const [hourA, minuteA] = timeA.split(':').map(Number);
        const [hourB, minuteB] = timeB.split(':').map(Number);
        
        if (hourA !== hourB) {
            return hourA - hourB;
        }
        return (minuteA || 0) - (minuteB || 0);
    });
    
    todayEventsList.innerHTML = '';
    
    if (todayEvents.length === 0) {
        todayEventsList.innerHTML = '<div class="sidebar-empty">予定はありません</div>';
        return;
    }
    
    todayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'sidebar-event-item';
        eventItem.innerHTML = `
            <div class="sidebar-event-time">${event.time || ''}</div>
            <div class="sidebar-event-content">
                <div class="sidebar-event-title">${escapeHtml(event.title || '')}</div>
                ${event.description ? `<div class="sidebar-event-description">${escapeHtml(event.description)}</div>` : ''}
            </div>
        `;
        todayEventsList.appendChild(eventItem);
    });
}

// 期限のタスクを右サイドバーに表示
function updateDueTasks() {
    const dueTasksList = document.getElementById('due-tasks-list');
    if (!dueTasksList) return;
    
    if (typeof window.tasks === 'undefined' || !Array.isArray(window.tasks)) {
        dueTasksList.innerHTML = '<div class="sidebar-empty">期限のタスクはありません</div>';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueTasks = window.tasks.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        // 期限が今日以前のタスクを表示（期限切れも含む）
        return dueDate.getTime() <= today.getTime();
    });
    
    // 期限が近い順（期限切れ→今日の期限）にソート
    dueTasks.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        return dateA.getTime() - dateB.getTime();
    });
    
    dueTasksList.innerHTML = '';
    
    if (dueTasks.length === 0) {
        dueTasksList.innerHTML = '<div class="sidebar-empty">期限のタスクはありません</div>';
        return;
    }
    
    dueTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'sidebar-task-item';
        taskItem.style.display = 'flex';
        taskItem.style.alignItems = 'flex-start';
        taskItem.style.gap = '8px';
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate.getTime() < today.getTime();
        const isDueToday = dueDate.getTime() === today.getTime();
        
        if (isOverdue) {
            taskItem.style.borderLeft = '3px solid var(--error)';
            taskItem.style.background = 'rgba(184, 154, 154, 0.1)';
        } else if (isDueToday) {
            taskItem.style.borderLeft = '3px solid var(--warning)';
        }
        
        const priorityIcons = {
            low: '<i class="fas fa-circle" style="color: #2ecc71; font-size: 10px;"></i>',
            medium: '<i class="fas fa-circle" style="color: #f1c40f; font-size: 10px;"></i>',
            high: '<i class="fas fa-circle" style="color: #e74c3c; font-size: 10px;"></i>'
        };
        const priorityLabels = {
            low: '低',
            medium: '中',
            high: '高'
        };
        
        const dueDateStr = `${dueDate.getFullYear()}/${String(dueDate.getMonth() + 1).padStart(2, '0')}/${String(dueDate.getDate()).padStart(2, '0')}`;
        const dueDateLabel = isOverdue ? `<i class="fas fa-exclamation-triangle"></i> 期限切れ: ${dueDateStr}` : (isDueToday ? `<i class="fas fa-clock"></i> 今日が期限: ${dueDateStr}` : `<i class="fas fa-calendar-alt"></i> 期限: ${dueDateStr}`);
        
        taskItem.innerHTML = `
            <div class="sidebar-task-priority priority-${task.priority || 'medium'}">
                ${priorityIcons[task.priority || 'medium']} ${priorityLabels[task.priority || 'medium']}
            </div>
            <div class="sidebar-task-content" style="flex: 1;">
                <div class="sidebar-task-title">${escapeHtml(task.title || '')}</div>
                <div style="font-size: 11px; color: ${isOverdue ? 'var(--error)' : 'var(--text-secondary)'}; margin-top: 4px;">${dueDateLabel}</div>
                ${task.description ? `<div class="sidebar-task-description">${escapeHtml(task.description)}</div>` : ''}
            </div>
            <div class="sidebar-task-actions" style="display: flex; gap: 4px; margin-left: 8px;">
                <button class="task-action-btn delete" onclick="event.stopPropagation(); if (typeof window.deleteTask === 'function') { window.deleteTask(${task.id}); }" title="削除" style="padding: 4px 8px; font-size: 12px; background: var(--error); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        taskItem.onclick = () => {
            if (typeof window.editTask === 'function') {
                window.editTask(task.id);
            }
        };
        dueTasksList.appendChild(taskItem);
    });
}

// カレンダーの更新
function updateCalendar() {
    console.log('updateCalendar関数が呼ばれました');
    
    // 予定を確実に読み込む
    if (typeof loadCalendarEvents === 'function') {
        loadCalendarEvents();
    }
    
    // 会社カレンダーを確実に読み込む
    if (typeof loadCompanyCalendarEvents === 'function') {
        loadCompanyCalendarEvents();
    }
    
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearEl = document.getElementById('calendar-month-year');
    
    console.log('カレンダー要素の確認:', {
        calendarGrid: !!calendarGrid,
        monthYearEl: !!monthYearEl
    });
    
    if (!calendarGrid || !monthYearEl) {
        console.error('カレンダー要素が見つかりません', {
            calendarGrid: !!calendarGrid,
            monthYearEl: !!monthYearEl
        });
        // 要素が見つからない場合は少し待ってから再試行
        setTimeout(() => {
            console.log('カレンダー要素を再確認します');
            const retryGrid = document.getElementById('calendar-grid');
            const retryMonthYear = document.getElementById('calendar-month-year');
            if (retryGrid && retryMonthYear) {
                console.log('カレンダー要素が見つかりました。再描画します');
                updateCalendar();
            } else {
                console.error('カレンダー要素が見つかりません（再試行後）');
            }
        }, 500);
        return;
    }

    const now = new Date();
    const year = currentCalendarYear;
    const month = currentCalendarMonth;
    
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    monthYearEl.textContent = `${year}年${monthNames[month]}`;

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weekdayHeader = document.getElementById('calendar-weekday-header');
    calendarGrid.innerHTML = '';
    
    // 曜日ヘッダー
    if (weekdayHeader) {
        weekdayHeader.innerHTML = '';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day calendar-weekday';
        dayHeader.textContent = day;
            weekdayHeader.appendChild(dayHeader);
    });
    }

    // カレンダー日付（6週分 = 42日）
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const dayMonth = currentDate.getMonth();
        const dayDate = currentDate.getDate();
        const dayYear = currentDate.getFullYear();
        const dayOfWeek = currentDate.getDay(); // 0=日曜日, 6=土曜日
        
        if (dayMonth !== month) {
            dayEl.classList.add('other-month');
        }
        
        // 曜日に応じたクラスを追加
        if (dayOfWeek === 0) {
            dayEl.classList.add('sunday');
        } else if (dayOfWeek === 6) {
            dayEl.classList.add('saturday');
        }
        
        // 今日の日付をハイライト
        if (dayYear === now.getFullYear() && dayMonth === now.getMonth() && dayDate === now.getDate()) {
            dayEl.classList.add('today');
        }
        
        // 休日判定（土日または会社カレンダーの休日）
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isCompanyHoliday = companyCalendarEvents.some(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(dayYear, dayMonth, dayDate);
            checkDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === checkDate.getTime() &&
                   (event.type === 'holiday' || !event.type);
        });
        
        if (isWeekend || isCompanyHoliday) {
            dayEl.classList.add('holiday');
        }
        
        // 日付を先に追加（予定の下に表示されるように）
        const dateText = document.createElement('div');
        dateText.className = 'calendar-date-number';
        dateText.textContent = dayDate;
        dayEl.appendChild(dateText);
        
        // 予定がある日をマーク（個人予定のみ、会社カレンダーの休日は除外）
        const hasPersonalEvent = hasEventOnDate(dayYear, dayMonth, dayDate);
        // 会社カレンダーの休日は除外（休日マークだけで表示）
        const hasCompanyEvent = hasCompanyEventOnDate(dayYear, dayMonth, dayDate) && !isCompanyHoliday;
        
        if (hasPersonalEvent || hasCompanyEvent) {
            dayEl.classList.add('has-event');
            
            // その日の予定を取得（個人予定）
            const dateStr = `${dayYear}-${String(dayMonth + 1).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`;
            const dayEvents = calendarEvents.filter(event => {
                if (!event || !event.date) return false;
                
                // 日付を文字列として比較
                let eventDateStr = event.date;
                
                // Dateオブジェクトの場合は文字列に変換
                if (eventDateStr instanceof Date || (typeof eventDateStr === 'string' && eventDateStr.includes('T'))) {
                    const d = new Date(eventDateStr);
                    eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } else if (typeof eventDateStr === 'string' && eventDateStr.includes('/')) {
                    // YYYY/MM/DD形式の場合はYYYY-MM-DDに変換
                    const parts = eventDateStr.split('/');
                    if (parts.length === 3) {
                        eventDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }
                
                return eventDateStr === dateStr;
            });
            
            // その日の会社カレンダー予定を取得（休日を除く）
            const dayCompanyEvents = companyCalendarEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getFullYear() === dayYear && 
                       eventDate.getMonth() === dayMonth && 
                       eventDate.getDate() === dayDate &&
                       event.type !== 'holiday';
            });
            
            // 個人予定を表示（日付の下に）
            if (dayEvents.length > 0) {
                const eventTitle = document.createElement('div');
                eventTitle.className = 'calendar-event-title';
                eventTitle.textContent = dayEvents[0].title;
                dayEl.appendChild(eventTitle);
            }
            
            // 予定が複数ある場合はバッジを表示
            const totalEvents = dayEvents.length + dayCompanyEvents.length;
            if (totalEvents > 1) {
                const badge = document.createElement('div');
                badge.className = 'calendar-event-badge';
                badge.textContent = `+${totalEvents - 1}`;
                dayEl.appendChild(badge);
            }
        }
        
        // 予定入力フィールドを追加
        const eventInputContainer = document.createElement('div');
        eventInputContainer.className = 'calendar-event-input-container';
        eventInputContainer.style.cssText = 'margin-top: 4px; display: none; width: 100%;';
        
        const eventInput = document.createElement('input');
        eventInput.type = 'text';
        eventInput.className = 'calendar-event-input';
        eventInput.placeholder = '予定を入力...';
        eventInput.style.cssText = 'width: 100%; padding: 2px 4px; font-size: 10px; border: 1px solid var(--border-light); border-radius: 3px; background: var(--bg-primary); color: var(--text-primary); box-sizing: border-box;';
        
        eventInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const title = eventInput.value.trim();
                if (title) {
                    // 予定を保存
                    calendarEvents.push({
                        date: `${dayYear}-${String(dayMonth + 1).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`,
                        title: title,
                        time: '',
                        description: ''
                    });
                    saveCalendarEvents();
                    updateCalendar();
                    updateTodayEvents();
                    eventInput.value = '';
                    eventInputContainer.style.display = 'none';
                }
            } else if (e.key === 'Escape') {
                eventInput.value = '';
                eventInputContainer.style.display = 'none';
            }
        });
        
        eventInput.addEventListener('blur', () => {
            // 少し遅延してから非表示にする（Enterキーで保存する時間を確保）
            setTimeout(() => {
                if (eventInput.value.trim() === '') {
                    eventInputContainer.style.display = 'none';
                }
            }, 200);
        });
        
        eventInputContainer.appendChild(eventInput);
        dayEl.appendChild(eventInputContainer);
        
        // 日付をクリックして予定を追加/表示
        dayEl.addEventListener('click', (e) => {
            if (!dayEl.classList.contains('other-month') && !dayEl.classList.contains('calendar-weekday')) {
                // 予定入力フィールドが表示されていない場合のみモーダルを開く
                if (eventInputContainer.style.display === 'none' || eventInputContainer.style.display === '') {
                    // 日付をクリックしたら直接予定入力フォームを開く
                    openCalendarEventFormModal(dayYear, dayMonth, dayDate);
                }
            }
        });
        
        // 日付セルをダブルクリックで予定入力フィールドを表示
        dayEl.addEventListener('dblclick', (e) => {
            if (!dayEl.classList.contains('other-month') && !dayEl.classList.contains('calendar-weekday')) {
                e.preventDefault();
                e.stopPropagation();
                eventInputContainer.style.display = 'block';
                setTimeout(() => {
                    eventInput.focus();
                }, 10);
            }
        });
        
        // 休日マークを追加
        if (isCompanyHoliday) {
            // 会社カレンダーの休日は「休」と表示
            const holidayMark = document.createElement('div');
            holidayMark.className = 'holiday-mark company-holiday-mark';
            holidayMark.textContent = '休';
            holidayMark.title = '会社休日';
            dayEl.appendChild(holidayMark);
        }
        
        calendarGrid.appendChild(dayEl);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // カレンダー更新後にグリッドの高さを調整
    if (typeof window.adjustCalendarGridAfterUpdate === 'function') {
        setTimeout(() => {
            window.adjustCalendarGridAfterUpdate();
        }, 100);
    }
    
    // 今日の予定を右サイドバーに表示
    updateTodayEvents();
}

// 指定した日付に予定があるかチェック
function hasEventOnDate(year, month, date) {
    // 日付をYYYY-MM-DD形式の文字列に変換
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    return calendarEvents.some(event => {
        if (!event || !event.date) return false;
        
        // 日付を文字列として比較
        let eventDateStr = event.date;
        
        // Dateオブジェクトの場合は文字列に変換
        if (eventDateStr instanceof Date || (typeof eventDateStr === 'string' && eventDateStr.includes('T'))) {
            const d = new Date(eventDateStr);
            eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else if (typeof eventDateStr === 'string' && eventDateStr.includes('/')) {
            // YYYY/MM/DD形式の場合はYYYY-MM-DDに変換
            const parts = eventDateStr.split('/');
            if (parts.length === 3) {
                eventDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        }
        
        return eventDateStr === dateStr;
    });
}

// 指定した日付に会社カレンダー予定があるかチェック
function hasCompanyEventOnDate(year, month, date) {
    const checkDate = new Date(year, month, date);
    checkDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(checkDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    return companyCalendarEvents.some(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= checkDate && eventDate < nextDate;
    });
}

// カレンダー予定を読み込み
function loadCalendarEvents() {
    console.log('loadCalendarEvents関数が呼ばれました');
    const saved = localStorage.getItem('calendar_events');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 日付文字列を正規化（YYYY-MM-DD形式に統一）
            calendarEvents = parsed.map(event => {
                let dateStr = event.date;
                // Dateオブジェクトの場合は文字列に変換
                if (dateStr instanceof Date || (typeof dateStr === 'string' && dateStr.includes('T'))) {
                    const d = new Date(dateStr);
                    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } else if (typeof dateStr === 'string' && dateStr.includes('/')) {
                    // YYYY/MM/DD形式の場合はYYYY-MM-DDに変換
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }
                return {
                ...event,
                    date: dateStr
                };
            });
            console.log('予定を読み込みました:', calendarEvents.length, '件');
        } catch (e) {
            console.error('予定の読み込みエラー:', e);
            calendarEvents = [];
        }
    } else {
        calendarEvents = [];
        console.log('保存された予定がありません');
    }
    
    // グローバルに公開（通知機能で使用）
    if (typeof window !== 'undefined') {
        window.calendarEvents = calendarEvents;
    }
    
    // 会社カレンダーも読み込む
    if (typeof loadCompanyCalendarEvents === 'function') {
    loadCompanyCalendarEvents();
    }
    
    // カレンダー通知チェックを開始（通知許可がある場合）
    if (typeof startCalendarNotificationCheck === 'function' && Notification.permission === 'granted') {
        startCalendarNotificationCheck();
    }
    
    // updateCalendarはupdateDashboardから呼ばれるので、ここでは呼ばない（重複を避ける）
    // updateCalendar();
}

// 会社カレンダーの読み込み
function loadCompanyCalendarEvents() {
    const saved = localStorage.getItem('company_calendar_events');
    if (saved) {
        try {
            companyCalendarEvents = JSON.parse(saved);
            companyCalendarEvents = companyCalendarEvents.map(event => ({
                ...event,
                date: new Date(event.date).toISOString().split('T')[0]
            }));
            // 毎年繰り返す予定を処理
            processYearlyEvents();
        } catch (e) {
            console.error('会社カレンダーの読み込みエラー:', e);
            companyCalendarEvents = [];
        }
    } else {
        companyCalendarEvents = [];
    }
}

// 毎年繰り返す予定を処理
function processYearlyEvents() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    companyCalendarEvents.forEach(event => {
        if (event.yearly) {
            const eventDate = new Date(event.date);
            const eventMonth = eventDate.getMonth();
            const eventDay = eventDate.getDate();
            
            // 今年の日付が存在するかチェック
            const thisYearDate = new Date(currentYear, eventMonth, eventDay);
            const dateStr = thisYearDate.toISOString().split('T')[0];
            const existsThisYear = companyCalendarEvents.some(e => {
                const eDate = new Date(e.date);
                return eDate.getFullYear() === currentYear && 
                       eDate.getMonth() === eventMonth && 
                       eDate.getDate() === eventDay;
            });
            
            // 今年の日付が存在しない場合は追加
            if (!existsThisYear && eventDate.getFullYear() < currentYear) {
                companyCalendarEvents.push({
                    ...event,
                    date: dateStr,
                    yearly: true,
                    originalDate: event.date
                });
            }
        }
    });
    
    saveCompanyCalendarEvents();
}

// 会社カレンダーの保存
function saveCompanyCalendarEvents() {
    try {
        localStorage.setItem('company_calendar_events', JSON.stringify(companyCalendarEvents));
    } catch (e) {
        console.error('会社カレンダーの保存エラー:', e);
    }
}

// カレンダー予定を保存
function saveCalendarEvents() {
    try {
        localStorage.setItem('calendar_events', JSON.stringify(calendarEvents));
        // グローバル変数も更新（通知機能で使用）
        if (typeof window !== 'undefined') {
            window.calendarEvents = calendarEvents;
        }
    } catch (e) {
        console.error('予定の保存エラー:', e);
    }
}

// 予定モーダルを開く
function openCalendarEventModal(year, month, date) {
    const selectedDate = new Date(year, month, date);
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(date).padStart(2, '0')}`;
    
    // その日の予定を取得
    const dayEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && 
               eventDate.getMonth() === month && 
               eventDate.getDate() === date;
    });
    
    const modal = document.getElementById('calendar-event-modal');
    const modalTitle = document.getElementById('calendar-event-modal-title');
    const eventList = document.getElementById('calendar-event-list');
    const addEventBtn = document.getElementById('calendar-add-event-btn');
    
    modalTitle.textContent = dateStr + ' の予定';
    eventList.innerHTML = '';
    
    if (dayEvents.length === 0) {
        eventList.innerHTML = '<div class="no-events">予定はありません</div>';
    } else {
        dayEvents.forEach((event, index) => {
            const eventItem = document.createElement('div');
            eventItem.className = 'calendar-event-item';
            eventItem.innerHTML = `
                <div class="event-content">
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    ${event.time ? `<div class="event-time">${escapeHtml(event.time)}</div>` : ''}
                    ${event.description ? `<div class="event-description">${escapeHtml(event.description)}</div>` : ''}
                </div>
                <div class="event-actions">
                    <button class="event-edit-btn" onclick="editCalendarEvent('${year}-${month}-${date}', ${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="event-delete-btn" onclick="deleteCalendarEvent('${year}-${month}-${date}', ${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            eventList.appendChild(eventItem);
        });
    }
    
    addEventBtn.onclick = () => {
        openCalendarEventFormModal(year, month, date);
        closeCalendarEventModal();
    };
    
    modal.style.display = 'flex';
}

// 予定モーダルを閉じる
function closeCalendarEventModal() {
    const modal = document.getElementById('calendar-event-modal');
    modal.style.display = 'none';
}

// 予定追加/編集フォームモーダルを開く
function openCalendarEventFormModal(year, month, date, eventIndex = null) {
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(date).padStart(2, '0')}`;
    
    const formModal = document.getElementById('calendar-event-form-modal');
    if (!formModal) {
        console.error('calendar-event-form-modal要素が見つかりません');
        alert('予定フォームを開けませんでした。ページをリロードしてください。');
        return;
    }
    
    const formTitle = document.getElementById('calendar-event-form-title');
    const eventForm = document.getElementById('calendar-event-form');
    const eventDateInput = document.getElementById('calendar-event-date');
    const eventTitleInput = document.getElementById('calendar-event-title');
    const eventTimeInput = document.getElementById('calendar-event-time');
    const eventDescriptionInput = document.getElementById('calendar-event-description');
    const eventsContent = document.getElementById('calendar-event-form-events-content');
    
    if (!formTitle || !eventForm || !eventDateInput || !eventTitleInput || !eventTimeInput || !eventDescriptionInput) {
        console.error('フォーム要素が見つかりません');
        alert('予定フォームを開けませんでした。ページをリロードしてください。');
        return;
    }
    
    formTitle.innerHTML = eventIndex === null ? `予定を追加 - ${dateStr}` : `予定を編集 - ${dateStr}`;
    eventDateInput.value = dateStr;
    
    // その日の予定を取得して表示
    let dayEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && 
               eventDate.getMonth() === month && 
               eventDate.getDate() === date;
    });
    
    // バッジ件数を更新
    const countBadge = document.getElementById('calendar-event-count-badge');
    if (countBadge) {
        countBadge.textContent = `${dayEvents.length}件`;
    }
    
    // 時間順にソート（時間がない予定は最後に）
    dayEvents.sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        
        // 時間がない予定は最後に
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        // 時間を比較（HH:MM形式を想定）
        const parseTime = (timeStr) => {
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                const hours = parseInt(parts[0], 10) || 0;
                const minutes = parseInt(parts[1], 10) || 0;
                return hours * 60 + minutes;
            }
            return 0;
        };
        
        return parseTime(timeA) - parseTime(timeB);
    });
    
    if (eventsContent) {
        eventsContent.innerHTML = '';
        if (dayEvents.length === 0) {
            eventsContent.innerHTML = `
                <div class="sidebar-empty" style="padding: 60px 20px; text-align: center;">
                    <i class="fas fa-calendar-day" style="font-size: 48px; opacity: 0.1; margin-bottom: 16px; display: block; color: #6366f1;"></i>
                    <div style="font-size: 15px; font-weight: 600; color: #94a3b8;">この日の予定はまだありません</div>
                    <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">右側のフォームから新しい予定を登録できます</div>
                </div>
            `;
        } else {
            dayEvents.forEach((event, index) => {
                const eventItem = document.createElement('div');
                eventItem.className = 'calendar-event-form-event-item';
                eventItem.style.cssText = 'padding: 16px; margin-bottom: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; justify-content: space-between; align-items: flex-start; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);';
                eventItem.onmouseover = function() { 
                    this.style.borderColor = '#6366f1'; 
                    this.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)';
                    this.style.transform = 'translateY(-2px)';
                };
                eventItem.onmouseout = function() { 
                    this.style.borderColor = '#e2e8f0'; 
                    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                    this.style.transform = 'translateY(0)';
                };
                eventItem.innerHTML = `
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%;"></span>
                            ${escapeHtml(event.title || '')}
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                            ${event.time ? `<div style="font-size: 12px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px;"><i class="far fa-clock"></i> ${escapeHtml(event.time)}</div>` : ''}
                            ${event.notification !== false ? `<div style="font-size: 11px; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px;"><i class="fas fa-bell"></i> 通知ON</div>` : ''}
                        </div>
                        ${event.description ? `<div style="font-size: 13px; color: #475569; margin-top: 8px; line-height: 1.5; background: #f8fafc; padding: 8px 10px; border-radius: 6px; border-left: 3px solid #e2e8f0;">${escapeHtml(event.description)}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: 12px;">
                        <button onclick="event.stopPropagation(); editCalendarEventFromForm('${year}-${month}-${date}', ${index})" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #64748b; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0e7ff'; this.style.color='#6366f1'" onmouseout="this.style.background='#f1f5f9'; this.style.color='#64748b'" title="編集"><i class="fas fa-edit"></i></button>
                        <button onclick="event.stopPropagation(); deleteCalendarEventFromForm('${year}-${month}-${date}', ${index})" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #64748b; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.color='#ef4444'" onmouseout="this.style.background='#f1f5f9'; this.style.color='#64748b'" title="削除"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
                eventsContent.appendChild(eventItem);
            });
        }
    }
    
    // 通知チェックボックスを取得
    const eventNotificationInput = document.getElementById('calendar-event-notification');
    
    // フォームをリセット
    eventTitleInput.value = '';
    eventTimeInput.value = '';
    eventDescriptionInput.value = '';
    if (eventNotificationInput) {
        eventNotificationInput.checked = false;
    }
    
    // 編集モードの場合
    if (eventIndex !== null) {
        const actualEvent = dayEvents[eventIndex];
        if (actualEvent) {
            eventTitleInput.value = actualEvent.title || '';
            eventTimeInput.value = actualEvent.time || '';
            eventDescriptionInput.value = actualEvent.description || '';
            if (eventNotificationInput) {
                eventNotificationInput.checked = actualEvent.notification !== false; // デフォルトはtrue
            }
        }
        eventForm.setAttribute('data-event-index', eventIndex);
    } else {
        eventForm.removeAttribute('data-event-index');
        // 新規作成時は通知をデフォルトで有効にする
        if (eventNotificationInput) {
            eventNotificationInput.checked = true;
        }
    }
    
    // フォームのsubmitイベントを設定
    eventForm.onsubmit = function(e) {
        e.preventDefault();
        e.stopPropagation();
        // フォームから日付を読み取る
        const dateValue = eventDateInput.value;
        if (dateValue) {
            const [y, m, d] = dateValue.split('/').map(Number);
            saveCalendarEvent(y, m - 1, d, eventIndex);
        } else {
            // フォールバック: 引数から取得
        saveCalendarEvent(year, month, date, eventIndex);
        }
        return false;
    };
    
    // フォームに日付情報を保存（フォールバック用）
    eventForm.setAttribute('data-year', year);
    eventForm.setAttribute('data-month', month);
    eventForm.setAttribute('data-date', date);
    
    // モーダルを表示
    formModal.style.display = 'flex';
    formModal.style.zIndex = '10000';
    
    // フォーカスをタイトル入力に設定
    setTimeout(() => {
        eventTitleInput.focus();
    }, 100);
}

// 予定フォームモーダルを閉じる
function closeCalendarEventFormModal() {
    const formModal = document.getElementById('calendar-event-form-modal');
    if (formModal) {
    formModal.style.display = 'none';
    }
}

// 予定を保存
function saveCalendarEvent(year, month, date, eventIndex) {
    const title = document.getElementById('calendar-event-title').value.trim();
    const time = document.getElementById('calendar-event-time').value.trim();
    const description = document.getElementById('calendar-event-description').value.trim();
    const notificationInput = document.getElementById('calendar-event-notification');
    const notification = notificationInput ? notificationInput.checked : false;
    const eventDateInput = document.getElementById('calendar-event-date');
    
    if (!title) {
        alert('タイトルを入力してください');
        return;
    }
    
    // フォームから日付を読み取る（優先）
    let eventYear = year;
    let eventMonth = month;
    let eventDate = date;
    
    if (eventDateInput && eventDateInput.value) {
        const dateValue = eventDateInput.value;
        const dateParts = dateValue.split('/');
        if (dateParts.length === 3) {
            eventYear = parseInt(dateParts[0], 10);
            eventMonth = parseInt(dateParts[1], 10) - 1; // 月は0ベース
            eventDate = parseInt(dateParts[2], 10);
            console.log('フォームから日付を読み取り:', eventYear, eventMonth, eventDate);
        }
    } else {
        console.log('フォームの日付が空、引数から取得:', year, month, date);
    }
    
    // 日付を文字列形式（YYYY-MM-DD）で保存（タイムゾーン問題を避けるため）
    const eventDateObj = new Date(eventYear, eventMonth, eventDate);
    const eventDateISO = `${eventYear}-${String(eventMonth + 1).padStart(2, '0')}-${String(eventDate).padStart(2, '0')}`;
    console.log('保存する日付:', eventDateISO, '元の日付:', eventYear, eventMonth, eventDate);
    
    if (eventIndex !== null) {
        // 編集
        let dayEvents = calendarEvents.filter(e => {
            const eDate = new Date(e.date);
            return eDate.getFullYear() === eventYear && 
                   eDate.getMonth() === eventMonth && 
                   eDate.getDate() === eventDate;
        });
        
        // 時間順にソート（表示と同じ順序にする）
        dayEvents.sort((a, b) => {
            const timeA = a.time || '';
            const timeB = b.time || '';
            
            if (!timeA && !timeB) return 0;
            if (!timeA) return 1;
            if (!timeB) return -1;
            
            const parseTime = (timeStr) => {
                const parts = timeStr.split(':');
                if (parts.length >= 2) {
                    const hours = parseInt(parts[0], 10) || 0;
                    const minutes = parseInt(parts[1], 10) || 0;
                    return hours * 60 + minutes;
                }
                return 0;
            };
            
            return parseTime(timeA) - parseTime(timeB);
        });
        
        if (eventIndex >= 0 && eventIndex < dayEvents.length) {
            const targetEvent = dayEvents[eventIndex];
            // 元の配列から該当する予定を見つけて更新
            const actualIndex = calendarEvents.findIndex(e => e === targetEvent);
            if (actualIndex !== -1) {
                calendarEvents[actualIndex] = {
                    date: eventDateISO,
                    title,
                    time,
                    description,
                    notification: notification
                };
            }
        }
    } else {
        // 新規追加
        calendarEvents.push({
            date: eventDateISO,
            title,
            time,
            description,
            notification: notification
        });
    }
    
    saveCalendarEvents();
    updateCalendar();
    updateTodayEvents();
    
    // フォームモーダルが開いている場合は、予定一覧を更新
    const formModal = document.getElementById('calendar-event-form-modal');
    if (formModal && formModal.style.display === 'flex') {
        // フォームモーダルを再描画して予定一覧を更新
        const eventDateInput = document.getElementById('calendar-event-date');
        if (eventDateInput && eventDateInput.value) {
            const dateValue = eventDateInput.value;
            const dateParts = dateValue.split('/');
            if (dateParts.length === 3) {
                const y = parseInt(dateParts[0], 10);
                const m = parseInt(dateParts[1], 10) - 1;
                const d = parseInt(dateParts[2], 10);
                const form = document.getElementById('calendar-event-form');
                const eventIndex = form ? form.getAttribute('data-event-index') : null;
                openCalendarEventFormModal(y, m, d, eventIndex ? parseInt(eventIndex) : null);
            }
        }
    } else {
    closeCalendarEventFormModal();
    }
}

// フォームモーダルから予定を編集
function editCalendarEventFromForm(dateStr, eventIndex) {
    const [year, month, date] = dateStr.split('-').map(Number);
    openCalendarEventFormModal(year, month, date, eventIndex);
}

// フォームモーダルから予定を削除
function deleteCalendarEventFromForm(dateStr, eventIndex) {
    const [year, month, date] = dateStr.split('-').map(Number);
    
    let dayEvents = calendarEvents.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getFullYear() === year && 
               eDate.getMonth() === month && 
               eDate.getDate() === date;
    });
    
    // 時間順にソート（表示と同じ順序にする）
    dayEvents.sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        const parseTime = (timeStr) => {
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                const hours = parseInt(parts[0], 10) || 0;
                const minutes = parseInt(parts[1], 10) || 0;
                return hours * 60 + minutes;
            }
            return 0;
        };
        
        return parseTime(timeA) - parseTime(timeB);
    });
    
    if (eventIndex >= 0 && eventIndex < dayEvents.length) {
        const targetEvent = dayEvents[eventIndex];
        const eventTitle = targetEvent.title || '予定';
        
        if (typeof showDeleteConfirm === 'function') {
            showDeleteConfirm(
                '予定を削除',
                `「${eventTitle}」を削除しますか？\nこの操作は取り消せません。`,
                () => {
                    calendarEvents = calendarEvents.filter(e => e !== targetEvent);
                    saveCalendarEvents();
                    updateCalendar();
                    updateTodayEvents();
                    
                    // フォームモーダルが開いている場合は、予定一覧を更新
                    const formModal = document.getElementById('calendar-event-form-modal');
                    if (formModal && formModal.style.display === 'flex') {
                        const eventDateInput = document.getElementById('calendar-event-date');
                        if (eventDateInput && eventDateInput.value) {
                            const dateValue = eventDateInput.value;
                            const dateParts = dateValue.split('/');
                            if (dateParts.length === 3) {
                                const y = parseInt(dateParts[0], 10);
                                const m = parseInt(dateParts[1], 10) - 1;
                                const d = parseInt(dateParts[2], 10);
                                openCalendarEventFormModal(y, m, d, null);
                            }
                        }
                    }
                }
            );
        } else {
            if (confirm(`「${eventTitle}」を削除しますか？`)) {
                calendarEvents = calendarEvents.filter(e => e !== targetEvent);
                saveCalendarEvents();
                updateCalendar();
                updateTodayEvents();
                
                // フォームモーダルが開いている場合は、予定一覧を更新
                const formModal = document.getElementById('calendar-event-form-modal');
                if (formModal && formModal.style.display === 'flex') {
                    const eventDateInput = document.getElementById('calendar-event-date');
                    if (eventDateInput && eventDateInput.value) {
                        const dateValue = eventDateInput.value;
                        const dateParts = dateValue.split('/');
                        if (dateParts.length === 3) {
                            const y = parseInt(dateParts[0], 10);
                            const m = parseInt(dateParts[1], 10) - 1;
                            const d = parseInt(dateParts[2], 10);
                            openCalendarEventFormModal(y, m, d, null);
                        }
                    }
                }
            }
        }
    }
}

// 予定を編集
function editCalendarEvent(dateStr, eventIndex) {
    const [year, month, date] = dateStr.split('-').map(Number);
    openCalendarEventFormModal(year, month, date, eventIndex);
}

// 予定を削除
function deleteCalendarEvent(dateStr, eventIndex) {
    if (!confirm('この予定を削除しますか？')) return;
    
    const [year, month, date] = dateStr.split('-').map(Number);
    const dayEvents = calendarEvents.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getFullYear() === year && 
               eDate.getMonth() === month && 
               eDate.getDate() === date;
    });
    
    if (dayEvents.length === 0 || eventIndex >= dayEvents.length) return;
    
    const targetEvent = dayEvents[eventIndex];
    const eventTitle = targetEvent.title || '予定';
    
    showDeleteConfirm(
        '予定を削除',
        `「${eventTitle}」を削除しますか？\nこの操作は取り消せません。`,
        () => {
            calendarEvents = calendarEvents.filter(e => e !== targetEvent);
            saveCalendarEvents();
            updateCalendar();
            updateTodayEvents();
            closeCalendarEventModal();
        }
    );
}

// 削除確認モーダルを表示
function showDeleteConfirm(title, message, onConfirm) {
    const modal = document.getElementById('delete-confirm-modal');
    const titleEl = document.getElementById('delete-confirm-title');
    const messageEl = document.getElementById('delete-confirm-message');
    
    if (!modal) {
        // フォールバック: 標準のconfirmを使用
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    
    // 既存のイベントリスナーを削除して新しいものを設定
    const cancelBtn = document.getElementById('delete-confirm-cancel');
    const okBtn = document.getElementById('delete-confirm-ok');
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        const newCancelBtnEl = document.getElementById('delete-confirm-cancel');
        if (newCancelBtnEl) {
            newCancelBtnEl.onclick = function() {
                modal.style.display = 'none';
            };
        }
    }
    
    if (okBtn) {
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        const newOkBtnEl = document.getElementById('delete-confirm-ok');
        if (newOkBtnEl) {
            newOkBtnEl.onclick = function() {
            modal.style.display = 'none';
            onConfirm();
        };
        }
    }
    
    modal.style.display = 'flex';
}

// カレンダーの月を変更
function changeCalendarMonth(delta) {
    currentCalendarMonth += delta;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    updateCalendar();
}

// 今日の日付に戻る
function goToToday() {
    const now = new Date();
    currentCalendarYear = now.getFullYear();
    currentCalendarMonth = now.getMonth();
    updateCalendar();
}

// カレンダーの年を変更
function changeCalendarYear(delta) {
    currentCalendarYear += delta;
    updateCalendar();
}

// カレンダーの月を指定数だけ変更
function changeCalendarMonths(delta) {
    currentCalendarMonth += delta;
    while (currentCalendarMonth < 0) {
        currentCalendarMonth += 12;
        currentCalendarYear--;
    }
    while (currentCalendarMonth > 11) {
        currentCalendarMonth -= 12;
        currentCalendarYear++;
    }
    updateCalendar();
}

// 設定モーダルを開く（目次）
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        console.error('設定モーダルが見つかりません');
        alert('設定モーダルが見つかりません。ページをリロードしてください。');
        return;
    }
    modal.style.display = 'flex';
}

// 設定ページを開く
function openSettingsPage(page) {
    const settingsModal = document.getElementById('settings-modal');
    let targetModal = null;
    
    if (page === 'permission-settings') {
        targetModal = document.getElementById('permission-settings-modal');
        if (targetModal) {
            loadPermissionSettings();
        }
    } else if (page === 'user-management') {
        targetModal = document.getElementById('user-management-modal');
        if (targetModal) {
            renderUserList();
        }
    } else if (page === 'company-calendar') {
        targetModal = document.getElementById('company-calendar-modal');
        if (targetModal) {
            loadCompanyCalendarEdit();
            setTimeout(function() {
                if (typeof initCalendarExcelImport === 'function') initCalendarExcelImport();
            }, 100);
        }
    } else if (page === 'notification-settings') {
        targetModal = document.getElementById('notification-settings-modal');
        if (targetModal) {
            updateNotificationPermissionStatus();
        }
    }
    
    if (settingsModal) settingsModal.style.display = 'none';
    if (targetModal) targetModal.style.display = 'flex';
}

// 設定ページを閉じる
function closeSettingsPage(page) {
    const settingsModal = document.getElementById('settings-modal');
    let targetModal = null;
    
    if (page === 'permission-settings') {
        targetModal = document.getElementById('permission-settings-modal');
    } else if (page === 'user-management') {
        targetModal = document.getElementById('user-management-modal');
    } else if (page === 'company-calendar') {
        targetModal = document.getElementById('company-calendar-modal');
    } else if (page === 'notification-settings') {
        targetModal = document.getElementById('notification-settings-modal');
    }
    
    if (targetModal) targetModal.style.display = 'none';
    if (settingsModal) settingsModal.style.display = 'flex';
}

// 権限設定を読み込む
function loadPermissionSettings() {
    const permissionSettings = JSON.parse(localStorage.getItem('permission_settings') || '{}');
    const allowAllUsersCheckbox = document.getElementById('permission-allow-all-users');
    
    if (allowAllUsersCheckbox) {
        // 設定が存在する場合はそれを使用、ない場合はデフォルトでtrue（全員使用可能）
        allowAllUsersCheckbox.checked = permissionSettings.hasOwnProperty('allowAllUsers') 
            ? permissionSettings.allowAllUsers 
            : true;
    }
}

// 権限設定を保存
function savePermissionSettings() {
    const allowAllUsersCheckbox = document.getElementById('permission-allow-all-users');
    
    if (!allowAllUsersCheckbox) {
        showMessage('権限設定の保存に失敗しました', 'error');
        return;
    }
    
    const permissionSettings = {
        allowAllUsers: allowAllUsersCheckbox.checked
    };
    
    localStorage.setItem('permission_settings', JSON.stringify(permissionSettings));
    showMessage('権限設定を保存しました', 'success');
    closeSettingsPage('permission-settings');
}


// 通知許可状態を更新
function updateNotificationPermissionStatus() {
    const statusText = document.getElementById('permission-status-text');
    const requestBtn = document.getElementById('request-permission-btn');
    
    if (!('Notification' in window)) {
        if (statusText) {
            statusText.textContent = 'このブラウザは通知機能をサポートしていません';
            statusText.style.color = 'var(--error)';
        }
        if (requestBtn) {
            requestBtn.disabled = true;
            requestBtn.style.opacity = '0.5';
        }
        return;
    }
    
    const permission = Notification.permission;
    
    if (statusText) {
        if (permission === 'granted') {
            statusText.textContent = '✅ 通知が許可されています';
            statusText.style.color = 'var(--success)';
        } else if (permission === 'denied') {
            statusText.textContent = '❌ 通知が拒否されています。ブラウザの設定から許可してください。';
            statusText.style.color = 'var(--error)';
        } else {
            statusText.textContent = '⚠️ 通知許可が必要です';
            statusText.style.color = 'var(--warning)';
        }
    }
    
    if (requestBtn) {
        if (permission === 'granted') {
            requestBtn.disabled = true;
            requestBtn.style.opacity = '0.5';
            requestBtn.textContent = '通知許可済み';
        } else {
            requestBtn.disabled = false;
            requestBtn.style.opacity = '1';
            requestBtn.innerHTML = '<i class="fas fa-bell"></i> 通知許可を取得';
        }
    }
}

// 設定モーダルを閉じる
function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 会社カレンダーリストを更新
function updateCompanyCalendarList() {
    loadCompanyCalendarEdit();
}

// 会社カレンダー編集エリアに日付を読み込む
function loadCompanyCalendarEdit() {
    const textarea = document.getElementById('company-calendar-edit-list');
    if (!textarea) return;
    
    if (companyCalendarEvents.length === 0) {
        textarea.value = '';
        return;
    }
    
    // 日付順にソート
    const sortedEvents = [...companyCalendarEvents].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    // 日付をテキストエリアに表示（YYYY/MM/DD形式、スペース区切り）
    const dateStrings = sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        return `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
    });
    
    textarea.value = dateStrings.join(' ');
}

// 会社カレンダー編集を保存
function saveCompanyCalendarEdit() {
    const textarea = document.getElementById('company-calendar-edit-list');
    if (!textarea) return;
    
    const datesInput = textarea.value.trim();
    
    if (!datesInput) {
        // 空の場合はすべて削除
        companyCalendarEvents = [];
        saveCompanyCalendarEvents();
        updateCalendar();
        return;
    }
    
    // スペースまたは改行で分割して日付を取得
    const dateStrings = datesInput.split(/\s+/).map(s => s.trim()).filter(s => s.length > 0);
    const dates = [];
    
    // 日付をパース（YYYY/MM/DD形式またはYYYY-MM-DD形式に対応）
    dateStrings.forEach(dateInput => {
        let dateStr = '';
        // YYYY/MM/DD形式をYYYY-MM-DD形式に変換
        if (dateInput.includes('/')) {
            const parts = dateInput.split('/');
            if (parts.length === 3) {
                dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        } else if (dateInput.includes('-')) {
            dateStr = dateInput;
        }
        
        if (dateStr) {
            // 日付の妥当性をチェック
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                dates.push(dateStr);
            }
        }
    });
    
    if (dates.length === 0) {
        alert('有効な日付が見つかりませんでした。YYYY/MM/DD形式またはYYYY-MM-DD形式で入力してください。');
        return;
    }
    
    // 重複を削除
    const uniqueDates = [...new Set(dates)];
    
    // 会社カレンダーイベントを更新
    companyCalendarEvents = uniqueDates.map(date => ({
        date: date,
        title: '会社休日',
        type: 'holiday'
    }));
    
    saveCompanyCalendarEvents();
    updateCalendar();
    
    // テキストエリアを更新
    loadCompanyCalendarEdit();
}

// 会社カレンダーをCSV出力
function exportCompanyCalendarToCSV() {
    if (companyCalendarEvents.length === 0) {
        alert('出力する会社カレンダーがありません。');
        return;
    }
    
    // 日付順にソート
    const sortedEvents = [...companyCalendarEvents].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    // CSVヘッダー
    const csvHeader = '日付,タイトル,種類\n';
    
    // CSVデータ行を生成
    const csvRows = sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        const dateStr = `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
        const title = event.title || '会社休日';
        const type = event.type === 'holiday' ? '休日' : (event.type || '休日');
        return `${dateStr},${title},${type}`;
    });
    
    // CSV全体を結合
    const csvContent = csvHeader + csvRows.join('\n');
    
    // BOMを追加してExcelで正しく開けるようにする
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // ファイル名を生成（現在の日付を含む）
    const now = new Date();
    const fileName = `会社カレンダー_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;
    link.setAttribute('download', fileName);
    
    // リンクをクリックしてダウンロード
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // URLを解放
    URL.revokeObjectURL(url);
}


// 会社カレンダーを編集
function editCompanyCalendarEvent(index) {
    if (index < 0 || index >= companyCalendarEvents.length) return;
    
    const event = companyCalendarEvents[index];
    const eventDate = new Date(event.date);
    const currentDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
    
    const newDateStr = prompt('日付を変更してください（YYYY-MM-DD形式）:', currentDateStr);
    if (!newDateStr) return;
    
    // 日付の妥当性をチェック
    const newDate = new Date(newDateStr);
    if (isNaN(newDate.getTime())) {
        alert('有効な日付を入力してください。');
        return;
    }
    
    // 既に登録されている日付かチェック
    const dateExists = companyCalendarEvents.some((e, i) => {
        if (i === index) return false;
        const eDate = new Date(e.date);
        return eDate.getTime() === newDate.getTime();
    });
    
    if (dateExists) {
        alert('この日付は既に登録されています。');
        return;
    }
    
    companyCalendarEvents[index].date = newDateStr;
    saveCompanyCalendarEvents();
    updateCompanyCalendarList();
    updateCalendar();
}

// 会社カレンダーイベントを削除
function deleteCompanyCalendarEvent(index) {
    if (index < 0 || index >= companyCalendarEvents.length) return;
    
    const event = companyCalendarEvents[index];
    const eventDate = new Date(event.date);
    const dateStr = `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
    
    showDeleteConfirm(
        '会社カレンダーを削除',
        `${dateStr}を削除しますか？\nこの操作は取り消せません。`,
        () => {
            companyCalendarEvents.splice(index, 1);
            saveCompanyCalendarEvents();
            updateCompanyCalendarList();
            updateCalendar();
        }
    );
}

// HTMLエスケープ関数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// イベントリストの更新（Todoの通知時刻を表示）
function updateEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;

    // Todoから通知時刻があるものを取得
    const todos = typeof loadTodos === 'function' ? loadTodos() : [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 通知時刻がある未完了のTodoを取得し、日付順にソート
    const events = todos
        .filter(todo => !todo.completed && todo.notificationTime)
        .map(todo => {
            const notificationDate = new Date(todo.notificationTime);
            return {
                date: notificationDate,
                time: notificationDate,
                description: todo.title
            };
        })
        .filter(event => event.date >= today) // 今日以降のもののみ
        .sort((a, b) => a.date - b.date)
        .slice(0, 5) // 最新5件
        .map(event => {
            const date = event.date;
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
            const dayName = dayNames[date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'pm' : 'am';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            
            return {
                date: `${dayName} ${month}/${day}`,
                time: `${displayHours}:${displayMinutes} ${ampm}`,
                description: event.description
            };
        });

    eventsList.innerHTML = '';
    if (events.length === 0) {
        eventsList.innerHTML = '<div class="event-item" style="text-align: center; color: var(--text-tertiary); padding: 20px;">通知予定のTodoがありません</div>';
        return;
    }

    events.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.innerHTML = `
            <div class="event-date">${event.date}</div>
            <div class="event-time">${event.time}</div>
            <div class="event-description">${event.description}</div>
        `;
        eventsList.appendChild(eventItem);
    });
}

// 進捗インジケーターの更新
function updateProgressIndicators() {
    const progressContainer = document.getElementById('progress-indicators');
    if (!progressContainer) return;

    const progressData = [
        { number: '01', value: 25, color: 'blue', description: 'Lorem ipsum dolor sit amet' },
        { number: '02', value: 58, color: 'green', description: 'Lorem ipsum dolor sit amet' },
        { number: '03', value: 15, color: 'red', description: 'Lorem ipsum dolor sit amet' },
        { number: '04', value: 100, color: 'green', description: 'Lorem ipsum dolor sit amet' }
    ];

    progressContainer.innerHTML = '';
    progressData.forEach(item => {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (item.value / 100) * circumference;
        
        progressItem.innerHTML = `
            <div class="progress-circle-wrapper">
                <svg class="progress-circle" width="120" height="120">
                    <circle class="progress-circle-bg" cx="60" cy="60" r="${radius}" />
                    <circle class="progress-circle-fill ${item.color}" 
                            cx="60" cy="60" r="${radius}" 
                            stroke-dasharray="${circumference}" 
                            stroke-dashoffset="${offset}" />
                </svg>
                <div class="progress-circle-value">${item.value}%</div>
            </div>
            <div class="progress-item-number">${item.number}</div>
            <div class="progress-item-description">${item.description}</div>
        `;
        progressContainer.appendChild(progressItem);
    });
}

// アクティビティグラフの更新
// updateActivityCharts関数は削除されました（アクティビティグラフが不要のため）

// テーブル一覧の読み込み
async function loadTables() {
    const container = document.getElementById('table-list-content');
    const CACHE_KEY = 'polaris_tables_cache';

    // 既知テーブルを即座に表示（ネットワーク不要）
    const KNOWN_TABLES = [
        't_acceptorder','t_accountcode','t_companycode','t_computerdevice',
        't_constructionnumber','t_currencycode','t_departmentcode','t_expense',
        't_machinecode','t_machinemarkforsaiban','t_machineunitcode','t_manufctparts',
        't_materialcode','t_moneyreceipt','t_processcode','t_purchase','t_purchaseparts',
        't_sagyofl','t_saiban','t_staffcode','t_symbolmachine','t_symbolunit',
        't_unitcode','t_workcode','t_workdepartment','t_custom_links',
        't_worktime','t_worktime_kako'
    ];
    // キャッシュがあればそちらを優先（追加テーブルを含む可能性）
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            const c = JSON.parse(cached);
            availableTables = [...new Set([...KNOWN_TABLES, ...c])].sort();
        } catch(e) { availableTables = [...KNOWN_TABLES]; }
    } else {
        availableTables = [...KNOWN_TABLES];
    }
    updateTableList();

    try {
        // Supabaseクライアントが初期化されているか確認
        if (!getSupabaseClient()) {
            if (container) {
                container.innerHTML = '<p class="info">Supabaseクライアントの初期化に失敗しました</p>';
            }
            return;
        }

        // OpenAPI取得結果で追加テーブルを補完（既存をクリアしない）
        
        // REST APIからOpenAPI仕様を取得してテーブル一覧を取得
        try {
            const response = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/`, {
                headers: {
                    'apikey': window.SUPABASE_CONFIG.key,
                    'Authorization': `Bearer ${window.SUPABASE_CONFIG.key}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.paths) {
                    const tables = [];
                    for (const path in data.paths) {
                        if (path.startsWith('/') && !path.startsWith('/rpc') && !path.startsWith('/$')) {
                            const tableName = path.slice(1).split('?')[0];
                            if (tableName && !tables.includes(tableName)) {
                                tables.push(tableName);
                            }
                        }
                    }
                    // 既存の既知テーブルとマージ
                    availableTables.forEach(t => { if (!tables.includes(t)) tables.push(t); });
                    availableTables = tables.sort();
                    localStorage.setItem(CACHE_KEY, JSON.stringify(availableTables));
                    console.log('取得したテーブル:', availableTables);
                }
            } else {
                console.warn('REST APIからのテーブル取得に失敗しました。代替方法を試行します。');
            }
        } catch (fetchErr) {
            console.warn('REST APIからのテーブル取得でエラーが発生しました:', fetchErr);
        }

        // テーブルが見つからない場合は、information_schemaから取得を試みる
        if (availableTables.length === 0) {
            console.log('REST APIからの取得に失敗。information_schemaを確認します...');
            try {
                const { data: schemaData, error: schemaError } = await getSupabaseClient()
                    .from('information_schema.tables')
                    .select('table_name')
                    .eq('table_schema', 'public')
                    .eq('table_type', 'BASE TABLE');
                if (!schemaError && schemaData && schemaData.length > 0) {
                    availableTables = schemaData.map(r => r.table_name).sort();
                    console.log('information_schemaから取得:', availableTables);
                }
            } catch(e) {
                console.warn('information_schema取得エラー:', e);
            }
        }

        // それでも見つからない場合は既知のテーブル名を試す
        if (availableTables.length === 0) {
            console.log('既知のテーブル名を確認します...');
            const commonTables = [
                't_acceptorder', 't_accountcode', 't_companycode', 't_computerdevice',
                't_constructionnumber', 't_currencycode', 't_departmentcode', 't_expense',
                't_machinecode', 't_machinemarkforsaiban', 't_machineunitcode', 't_manufctparts',
                't_materialcode', 't_moneyreceipt', 't_processcode', 't_purchase', 't_purchaseparts',
                't_sagyofl', 't_saiban', 't_staffcode', 't_symbolmachine', 't_symbolunit',
                't_unitcode', 't_workcode', 't_workdepartment'
            ];
            for (const tableName of commonTables) {
                try {
                    const { error } = await getSupabaseClient().from(tableName).select('*').limit(1);
                    if (!error) {
                        availableTables.push(tableName);
                        console.log('テーブルが見つかりました:', tableName);
                    }
                } catch (e) {
                    // エラーは無視して続行
                }
            }
            availableTables.sort();
        }

        console.log('最終的なテーブル一覧:', availableTables);
        console.log('テーブル数:', availableTables.length);
        
        // コンテナを確実に更新（必ず実行）
        if (!container) {
            console.error('table-list-content要素が見つかりません');
            return;
        }
        
        // テーブル一覧を更新
        if (availableTables.length > 0) {
            try {
                updateTableList();
                console.log('updateTableList()を実行しました');
            } catch (error) {
                console.error('updateTableList()エラー:', error);
                container.innerHTML = '<p class="info">テーブル一覧の更新に失敗しました: ' + (error.message || '不明なエラー') + '</p>';
            }
            
            // 確実に更新されたか確認（「読み込み中...」が残っていないか）
            setTimeout(() => {
                const currentContainer = document.getElementById('table-list-content');
                if (currentContainer && (currentContainer.innerHTML.includes('読み込み中') || currentContainer.innerHTML.trim() === '')) {
                    console.warn('コンテナがまだ「読み込み中」または空です。強制的に更新します。');
                    console.log('現在のコンテナ内容:', currentContainer.innerHTML);
                    updateTableList();
                }
            }, 200);
        } else {
            // テーブルが見つからない場合
            console.warn('テーブルが見つかりませんでした');
            container.innerHTML = '<p class="info">テーブルが見つかりません。Supabaseの設定を確認してください。</p>';
            showMessage('テーブルが見つかりませんでした', 'warning');
        }
        
        // 自動テーブルロードなし（ユーザーがクリックして選択）
    } catch (error) {
        console.error('テーブル読み込みエラー:', error);
        const container = document.getElementById('table-list-content');
        if (container) {
            container.innerHTML = '<p class="info">テーブル読み込みエラー: ' + (error.message || '不明なエラー') + '</p>';
        }
        showMessage('テーブル一覧の取得に失敗しました: ' + (error.message || '不明なエラー'), 'error');
    }
}

// テーブル一覧の更新
let filteredTables = [];

function updateTableList() {
    const container = document.getElementById('table-list-content');
    const searchInput = document.getElementById('table-search-input');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    if (!container) {
        console.error('table-list-content要素が見つかりません');
        return;
    }
    
    // availableTablesが空の場合は何もしない（loadTablesで処理済み）
    if (availableTables.length === 0) {
        return;
    }

    // あいまい検索フィルター（大文字小文字を区別しない、部分一致）
    if (searchTerm === '') {
        filteredTables = [...availableTables];
    } else {
        const searchLower = searchTerm.toLowerCase().trim();
        
        filteredTables = availableTables.filter(table => {
            const displayName = getTableDisplayName(table);
            
            // テーブル名と表示名の両方を検索対象にする
            const tableLower = table.toLowerCase();
            const displayLower = displayName.toLowerCase();
            
            // 部分一致で検索（スペースを除去したバージョンも検索対象に含める）
            const tableNoSpaces = tableLower.replace(/\s+/g, '');
            const displayNoSpaces = displayLower.replace(/\s+/g, '');
            
            // 検索語が含まれているかチェック（複数のパターンでマッチング）
            // より確実な検索のため、すべてのバリエーションをチェック
            const searchPatterns = [
                tableLower,
                displayLower,
                tableNoSpaces,
                displayNoSpaces
            ];
            
            // いずれかのパターンに検索語が含まれているかチェック
            const matches = searchPatterns.some(pattern => pattern.includes(searchLower));
            
            return matches;
        });
    }

    // コンテナを確実にクリア
    container.innerHTML = '';
    
    if (filteredTables.length === 0) {
        container.innerHTML = '<p class="info">該当するテーブルがありません</p>';
        return;
    }

    // テーブルリストを生成
    filteredTables.forEach(table => {
        const item = document.createElement('div');
        item.className = 'table-list-item';
        const displayName = getTableDisplayName(table);
        item.textContent = displayName;
        item.addEventListener('click', () => {
            currentTable = table;
            document.querySelectorAll('.table-list-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            showPage('list');
            selectListTable(table);
        });
        if (table === currentTable) {
            item.classList.add('active');
        }
        container.appendChild(item);
    });
    
    // 確実に更新されたことを確認
    if (container.innerHTML.trim() === '') {
        console.error('updateTableList: コンテナが空のままです');
        container.innerHTML = '<p class="info">テーブル一覧の表示に失敗しました</p>';
    }
}


// テーブルデータの読み込み
async function loadTableData(tableName) {
    if (!tableName) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('loadTableData: Supabaseクライアントが初期化されていません');
        showMessage('データベースに接続されていません。ページを再読み込みしてください。', 'error');
        return;
    }

    console.log('テーブルデータの読み込みを開始:', tableName);
    
    try {
        // テーブル名にスペースが含まれる場合は、そのまま使用（Supabaseは引用符で自動処理）
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(10000);

        if (error) {
            console.error('Supabaseエラー:', error);
            console.error('エラー詳細:', error.message, error.details, error.hint);
            throw error;
        }

        console.log('データ取得成功:', {
            tableName: tableName,
            dataCount: data ? data.length : 0,
            totalCount: count
        });

        tableData = data || [];
        filteredData = [...tableData];
        currentPage = 1;
        selectedRows.clear();
        
        if (tableData.length === 0) {
            console.warn('テーブルは存在しますが、データが0件です:', tableName);
            showMessage('テーブル「' + getTableDisplayName(tableName) + '」にはデータがありません', 'info');
        }
        
        updateTableTitle(tableName);
        updateSearchFields(tableData);
        displayTable();
        updateSelectionInfo();
        updatePolarisSurplusCheckButtonVisibility();
    } catch (error) {
        console.error('テーブルデータ読み込みエラー:', error);
        const errorMessage = error.message || '不明なエラー';
        const errorDetails = error.details ? ' (' + error.details + ')' : '';
        showMessage('データの取得に失敗しました: ' + errorMessage + errorDetails, 'error');
        
        // テーブルが存在しない場合のメッセージ
        if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
            showMessage('テーブル「' + tableName + '」が見つかりません。テーブル名を確認してください。', 'error');
        }
    }
}

// グローバルに公開
window.loadTableData = loadTableData;

// 検索フィールドの更新（テーブルのカラムに基づいてプルダウンを生成）
function updateSearchFields(data) {
    const select = document.getElementById('filter-column-select');
    if (!select) {
        console.error('filter-column-select要素が見つかりません');
        return;
    }
    
    // 既存のオプションをクリア（「すべての項目を検索」以外）
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    if (!data || data.length === 0) {
        return;
    }

    const columns = Object.keys(data[0]);
    const excludedCols = ['id', 'created_at', 'updated_at', 'deleted_at'];
    const searchColumns = columns.filter(col => !excludedCols.includes(col.toLowerCase()));

    // カラムをそのままの順番で追加（ソートしない）
    searchColumns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        // 改行タグなどを削除してテキストのみを表示
        let displayName = getColumnDisplayName(col);
        displayName = displayName.replace(/<br\s*\/?>/gi, ' ');
        option.textContent = displayName;
        select.appendChild(option);
    });
}

// テーブルタイトルの更新
function updateTableTitle(tableName) {
    const displayName = getTableDisplayName(tableName);
    document.getElementById('current-table-title').textContent = `${displayName} - 一覧表示`;
}

// テーブルの表示
function displayTable() {
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');

    if (filteredData.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px;">データがありません</td></tr>';
        updatePaginationInfo();
        return;
    }

    const columns = Object.keys(filteredData[0]);
    const start = 0;
    const end = filteredData.length;
    const pageData = filteredData;

    // ヘッダー
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    
    // 選択列
    const selectTh = document.createElement('th');
    selectTh.className = 'select-column';
    selectTh.style.cssText = 'width: 60px !important; min-width: 60px !important; max-width: 60px !important; box-sizing: border-box; font-size: 13px; font-weight: 700; padding: 12px 2px;';
    selectTh.textContent = '選択';
    headerRow.appendChild(selectTh);
    
    // 詳細列
    const detailTh = document.createElement('th');
    detailTh.style.cssText = 'width: 100px !important; min-width: 100px !important; max-width: 100px !important; box-sizing: border-box; font-size: 13px; font-weight: 700; padding: 12px 2px;';
    detailTh.textContent = '詳細';
    headerRow.appendChild(detailTh);
    
    // データ列
    columns.forEach(col => {
        const th = document.createElement('th');
        const displayName = getColumnDisplayName(col);
        th.textContent = displayName;
        
        let extraStyle = '';
        const colLower = col.toLowerCase();
        const dispLower = displayName.toLowerCase();

        // 幅を狭くする項目の判定
        const isNarrow = 
            colLower.includes('constructno') || colLower.includes('工事番号') ||
            colLower.includes('eigyo') || colLower.includes('営業') ||
            colLower.includes('owner') || colLower.includes('受注元') ||
            colLower.includes('user') || colLower.includes('納品先') ||
            colLower.includes('mitsumori') || colLower.includes('見積書') ||
            colLower.includes('chuumon') || colLower.includes('注文書') ||
            colLower.includes('seikyu') || colLower.includes('請求書') ||
            colLower.includes('doc');

        if (isNarrow) {
            extraStyle = 'max-width: 100px; min-width: 80px; overflow: hidden; text-overflow: ellipsis;';
        } else if (colLower.includes('constructname') || colLower.includes('工事名称')) {
            extraStyle = 'max-width: 200px; min-width: 150px; overflow: hidden; text-overflow: ellipsis;';
        } else {
            extraStyle = 'min-width: 100px;';
        }
        
        th.style.cssText = `box-sizing: border-box; font-size: 13px; font-weight: 700; padding: 12px 8px; white-space: nowrap; ${extraStyle}`;
        headerRow.appendChild(th);
    });
    
    // 操作列（右端）
    const actionTh = document.createElement('th');
    actionTh.style.cssText = 'width: 220px !important; min-width: 220px !important; max-width: 220px !important; box-sizing: border-box; font-size: 13px; font-weight: 700; padding: 12px 4px;';
    actionTh.textContent = '操作';
    headerRow.appendChild(actionTh);
    
    thead.appendChild(headerRow);

    // ボディ
    tbody.innerHTML = '';
    pageData.forEach((row, index) => {
        const tr = document.createElement('tr');
        const globalIndex = start + index;
        
        // 選択チェックボックス
        const selectCell = document.createElement('td');
        selectCell.className = 'select-column';
        selectCell.style.cssText = 'width: 60px !important; min-width: 60px !important; max-width: 60px !important; padding: 8px; text-align: center; box-sizing: border-box;';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.width = '20px';
        checkbox.style.height = '20px';
        checkbox.style.cursor = 'pointer';
        checkbox.checked = selectedRows.has(globalIndex);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedRows.add(globalIndex);
            } else {
                selectedRows.delete(globalIndex);
            }
            updateSelectionInfo();
            tr.classList.toggle('selected', e.target.checked);
        });
        selectCell.appendChild(checkbox);
        tr.appendChild(selectCell);

        // 詳細ボタン
        const detailCell = document.createElement('td');
        detailCell.style.cssText = 'padding: 8px; width: 100px !important; min-width: 100px !important; max-width: 100px !important; box-sizing: border-box; text-align: center;';
        
        const detailBtn = document.createElement('button');
        detailBtn.className = 'action-btn action-btn-detail';
        detailBtn.style.padding = '8px 16px';
        detailBtn.style.fontSize = '14px';
        detailBtn.style.minWidth = '80px';
        detailBtn.textContent = '詳細';
        detailBtn.addEventListener('click', () => {
            openRegisterModal('詳細', row);
        });
        detailCell.appendChild(detailBtn);
        tr.appendChild(detailCell);

        // データセル
        columns.forEach(col => {
            const td = document.createElement('td');
            let cellValue = row[col] !== null && row[col] !== undefined ? row[col] : '';
            const colLower = col.toLowerCase();
            const displayName = getColumnDisplayName(col);
            
            // 受注金額の場合はカンマ区切りでフォーマット
            if ((colLower.includes('order_price') || colLower.includes('orderprice') || colLower.includes('受注金額')) && cellValue !== '') {
                const numValue = parseFloat(cellValue);
                if (!isNaN(numValue)) {
                    cellValue = numValue.toLocaleString('ja-JP');
                }
            }
            
            // 幅を狭くする項目の判定
            let extraStyle = '';
            const isNarrow = 
                colLower.includes('constructno') || colLower.includes('工事番号') ||
                colLower.includes('eigyo') || colLower.includes('営業') ||
                colLower.includes('owner') || colLower.includes('受注元') ||
                colLower.includes('user') || colLower.includes('納品先') ||
                colLower.includes('mitsumori') || colLower.includes('見積書') ||
                colLower.includes('chuumon') || colLower.includes('注文書') ||
                colLower.includes('seikyu') || colLower.includes('請求書') ||
                colLower.includes('doc');

            if (isNarrow) {
                extraStyle = 'max-width: 100px; overflow: hidden; text-overflow: ellipsis;';
                td.title = cellValue;
            } else if (colLower.includes('constructname') || colLower.includes('工事名称')) {
                extraStyle = 'max-width: 250px; overflow: hidden; text-overflow: ellipsis;';
                td.title = cellValue;
            }
            
            td.style.cssText = `box-sizing: border-box; font-size: 14px; padding: 12px 10px; white-space: nowrap !important; ${extraStyle}`;
            td.textContent = cellValue;
            tr.appendChild(td);
        });

        // 操作ボタン（削除・複製・編集）
        const actionCell = document.createElement('td');
        actionCell.className = 'action-buttons-cell';
        actionCell.style.cssText = 'width: 220px; min-width: 220px; max-width: 220px; box-sizing: border-box; vertical-align: middle; padding: 8px; display: flex; gap: 8px; justify-content: center;';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn action-btn-delete';
        deleteBtn.style.flex = '0 0 38px';
        deleteBtn.style.height = '38px';
        deleteBtn.title = '削除';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRow(row);
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn action-btn-edit';
        editBtn.style.padding = '8px 12px';
        editBtn.style.fontSize = '13px';
        editBtn.style.height = '38px';
        editBtn.textContent = '編集';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openRegisterModal('編集', row);
        });

        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'action-btn action-btn-duplicate';
        duplicateBtn.style.padding = '8px 12px';
        duplicateBtn.style.fontSize = '13px';
        duplicateBtn.style.height = '38px';
        duplicateBtn.textContent = '複製';
        duplicateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const duplicateData = { ...row };
            if (duplicateData.id !== undefined) delete duplicateData.id;
            if (duplicateData.created_at !== undefined) delete duplicateData.created_at;
            if (duplicateData.updated_at !== undefined) delete duplicateData.updated_at;
            if (duplicateData.deleted_at !== undefined) delete duplicateData.deleted_at;
            openRegisterModal('複製', duplicateData);
        });
        
        actionCell.appendChild(deleteBtn);
        actionCell.appendChild(editBtn);
        actionCell.appendChild(duplicateBtn);
        tr.appendChild(actionCell);

        if (selectedRows.has(globalIndex)) {
            tr.classList.add('selected');
        }

        if (typeof window.PolarisProduction !== 'undefined' && currentTable) {
            const style = window.PolarisProduction.getStatusStyle(row, currentTable);
            if (style) {
                tr.setAttribute('style', (tr.getAttribute('style') || '') + ';' + style);
                tr._polarisStatusColor = true;
            }
        }

        tbody.appendChild(tr);
    });

    updatePaginationInfo();
}

// ページネーション情報の更新
function updatePaginationInfo() {
    const total = filteredData.length;
    const all = tableData.length;
    
    const pageInfoEl = document.getElementById('page-info');
    if (pageInfoEl) {
        pageInfoEl.innerHTML = `<span style="color: #60a5fa; font-weight: 700;">${total}</span> <span style="opacity: 0.5; font-size: 0.9em;">/ ${all}</span>`;
    }
}

// 日付文字列をパースする（YYYY/MM/DD, YYYY-MM-DD, YYYYMMDD 対応）
function parseDateString(dateStr) {
    if (!dateStr) return null;
    
    // 数字のみの場合 (YYYYMMDD)
    if (/^\d{8}$/.test(dateStr)) {
        const y = parseInt(dateStr.substring(0, 4));
        const m = parseInt(dateStr.substring(4, 6)) - 1;
        const d = parseInt(dateStr.substring(6, 8));
        return new Date(y, m, d);
    }
    
    // 区切り文字がある場合
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    
    return null;
}

// フィルターの適用
function applyFilters() {
    const globalSearch = document.getElementById('filter-global-search').value.trim();
    const columnSelect = document.getElementById('filter-column-select');
    const selectedColumn = columnSelect ? columnSelect.value : '';
    
    const dateStartStr = document.getElementById('filter-date-start').value.trim();
    const dateEndStr = document.getElementById('filter-date-end').value.trim();
    
    const dateStart = parseDateString(dateStartStr);
    const dateEnd = parseDateString(dateEndStr);

    filteredData = tableData.filter(row => {
        // カラムが選択されていない場合は全体検索（キーワード検索のみ）
        if (!selectedColumn) {
            if (!globalSearch) return true;
            const searchLower = globalSearch.toLowerCase();
            for (const key in row) {
                const value = String(row[key] || '').toLowerCase();
                if (value.includes(searchLower)) return true;
            }
            return false;
        }

        // 選択されたカラムが日付系かどうか判定
        const colLower = selectedColumn.toLowerCase();
        const displayName = getColumnDisplayName(selectedColumn);
        const isDateColumn = colLower.includes('date') || colLower.includes('time') || 
                           displayName.includes('日') || displayName.includes('時');

        if (isDateColumn) {
            // 日付範囲検索
            const cellValue = row[selectedColumn];
            
            // 検索条件がどちらも空なら、データが空でも表示する
            if (!dateStartStr && !dateEndStr) return true;
            
            // 検索条件があるのにデータが空なら非表示
            if (!cellValue) return false;
            
            const cellDate = new Date(cellValue);
            if (isNaN(cellDate.getTime())) return true; // 有効な日付でない場合は除外しない
            
            // 比較用に時刻を 00:00:00 に統一
            const compareDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
            
            if (dateStart) {
                if (compareDate < dateStart) return false;
            }
            
            if (dateEnd) {
                if (compareDate > dateEnd) return false;
            }
            
            return true;
        } else {
            // 通常のキーワード検索
            if (!globalSearch) return true;
            const searchLower = globalSearch.toLowerCase();
            const cellValue = String(row[selectedColumn] || '').toLowerCase();
            return cellValue.includes(searchLower);
        }
    });

    currentPage = 1;
    selectedRows.clear();
    displayTable();
    updateSelectionInfo();
}

// フィルターのクリア
function clearFilters() {
    document.getElementById('filter-global-search').value = '';
    const dateStartInput = document.getElementById('filter-date-start');
    const dateEndInput = document.getElementById('filter-date-end');
    if (dateStartInput) dateStartInput.value = '';
    if (dateEndInput) dateEndInput.value = '';
    
    const columnSelect = document.getElementById('filter-column-select');
    if (columnSelect) {
        columnSelect.value = '';
    }
    
    // 表示状態をリセット
    document.getElementById('filter-global-search').style.display = 'block';
    const dateRangeContainer = document.getElementById('filter-date-range');
    if (dateRangeContainer) dateRangeContainer.style.display = 'none';
    
    filteredData = [...tableData];
    currentPage = 1;
    selectedRows.clear();
    displayTable();
    updateSelectionInfo();
}

// 全選択（フィルタリングされたすべての行を選択）
function selectAllRows() {
    // フィルタリングされたすべての行を選択
    for (let i = 0; i < filteredData.length; i++) {
        selectedRows.add(i);
    }
    displayTable();
    updateSelectionInfo();
}

// 選択解除
function deselectAllRows() {
    selectedRows.clear();
    displayTable();
    updateSelectionInfo();
}

// 選択情報の更新
function updateSelectionInfo() {
    const count = selectedRows.size;
    const selectionCountEl = document.getElementById('selection-count');
    const selectionGroup = document.querySelector('.selection-group');
    
    if (selectionCountEl) {
        selectionCountEl.innerHTML = `<i class="fas fa-check-circle" style="color: ${count > 0 ? '#10b981' : '#cbd5e1'};"></i> 選択: <strong>${count}</strong>`;
    }
    
    if (selectionGroup) {
        if (count > 0) {
            selectionGroup.style.borderColor = '#10b981';
            selectionGroup.style.background = '#f0fdf4';
        } else {
            selectionGroup.style.borderColor = '#e2e8f0';
            selectionGroup.style.background = '#ffffff';
        }
    }
}

// 削除対象の行を保持
let deleteTargetRow = null;

// 行の削除
function deleteRow(row) {
    deleteTargetRow = row;
    showDeleteConfirm('削除の確認', 'この操作は取り消せません。本当に削除しますか？', confirmDelete);
}

// 削除の確定
async function confirmDelete() {
    if (!deleteTargetRow) return;

    try {
        const id = deleteTargetRow.id;
        if (!id) {
            showMessage('IDが存在しないため削除できません', 'error');
            closeDeleteModal();
            return;
        }

        const { error } = await getSupabaseClient()
            .from(currentTable)
            .delete()
            .eq('id', id);

        if (error) throw error;

        showMessage('データを削除しました', 'success');
        closeDeleteModal();
        await loadTableData(currentTable);
    } catch (error) {
        showMessage('削除に失敗しました: ' + error.message, 'error');
        closeDeleteModal();
    }
}

// 削除モーダルを閉じる
function closeDeleteModal() {
    const modal = document.getElementById('delete-confirm-modal');
    modal.style.display = 'none';
    deleteTargetRow = null;
}

// 行の複製（旧関数 - 現在は使用していません。複製ボタンはモーダルを開く方式に変更）
// この関数は削除しても問題ありませんが、互換性のため残しています
async function duplicateRow(row) {
    // 複製ボタンは新規登録モーダルを開く方式に変更されました
    // この関数は直接Supabaseに挿入する方式でしたが、エラーが発生しやすいため
    // モーダルで確認・編集してから登録する方式に変更しました
    const duplicateData = { ...row };
    if (duplicateData.id !== undefined) delete duplicateData.id;
    if (duplicateData.created_at !== undefined) delete duplicateData.created_at;
    if (duplicateData.updated_at !== undefined) delete duplicateData.updated_at;
    if (duplicateData.deleted_at !== undefined) delete duplicateData.deleted_at;
    openRegisterModal('複製', duplicateData);
}

// CSV出力（現在のテーブルデータを出力）
function exportToCSV() {
    if (!currentTable) {
        showMessage('テーブルを選択してください', 'warning');
        return;
    }

    if (filteredData.length === 0) {
        showMessage('出力するデータがありません', 'warning');
        return;
    }
    
    const columns = Object.keys(filteredData[0]);
    const tableDisplayName = getTableDisplayName(currentTable);
    
    // CSVデータの生成
    const csv = [
        columns.join(','),
        ...filteredData.map(row => 
            columns.map(col => {
                const value = row[col] !== null && row[col] !== undefined ? row[col] : '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `${tableDisplayName}_${dateStr}.csv`;
    link.click();
    showMessage(`${tableDisplayName}のCSVファイルをダウンロードしました`, 'success');
}

// CSVインポート
async function importFromCSV(file) {
    if (!currentTable) {
        showMessage('テーブルを選択してください', 'warning');
        return;
    }

    try {
        showMessage('CSVファイルを読み込み中...', 'info');
        
        // ファイルを読み込む
        const text = await file.text();
        
        // BOMを除去（UTF-8 BOM対応）
        const csvText = text.replace(/^\uFEFF/, '');
        
        // CSVをパース
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            showMessage('CSVファイルにデータがありません', 'error');
            return;
        }

        // ヘッダー行を取得
        const headers = parseCSVLine(lines[0]);
        if (headers.length === 0) {
            showMessage('CSVファイルのヘッダーが無効です', 'error');
            return;
        }

        // データ行をパース
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;
            
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index] || '';
                // 空文字列はnullに変換
                row[header] = value.trim() === '' ? null : value.trim();
            });
            rows.push(row);
        }

        if (rows.length === 0) {
            showMessage('インポートするデータがありません', 'warning');
            return;
        }

        // 確認ダイアログ
        if (!confirm(`${rows.length}件のデータをインポートしますか？\n既存のデータは上書きされません。`)) {
            return;
        }

        showMessage(`${rows.length}件のデータをインポート中...`, 'info');

        // Supabaseに一括挿入
        // 大量データの場合はバッチ処理
        const batchSize = 100;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            const { data, error } = await getSupabaseClient()
                .from(currentTable)
                .insert(batch)
                .select();

            if (error) {
                console.error('インポートエラー:', error);
                errorCount += batch.length;
                // エラーが発生しても続行
            } else {
                successCount += data ? data.length : batch.length;
            }
        }

        if (errorCount > 0) {
            showMessage(`${successCount}件のインポートに成功しました。${errorCount}件でエラーが発生しました。`, 'warning');
        } else {
            showMessage(`${successCount}件のデータをインポートしました`, 'success');
        }

        // テーブルデータを再読み込み
        await loadTableData(currentTable);

    } catch (error) {
        console.error('CSVインポートエラー:', error);
        showMessage('CSVインポートに失敗しました: ' + (error.message || '不明なエラー'), 'error');
    }
}

// CSV行をパース（クォート対応）
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // エスケープされたクォート
                current += '"';
                i++; // 次の文字をスキップ
            } else {
                // クォートの開始/終了
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // カンマで区切る
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // 最後のフィールドを追加
    result.push(current);

    return result;
}

// 詳細表示モーダルを開く
// テーブル名を正規化する関数
function normalizeTableName(tableName) {
    if (!tableName) return '';
    return tableName.toLowerCase().replace(/[\s_]/g, '');
}

// 正規化されたテーブル名でTABLE_MODAL_CONFIGSを検索
function findTableConfig(tableName) {
    if (!tableName || !window.TABLE_MODAL_CONFIGS) return null;
    
    // まず完全一致を試す
    if (window.TABLE_MODAL_CONFIGS[tableName]) {
        return window.TABLE_MODAL_CONFIGS[tableName];
    }
    
    // 小文字で試す
    const lowerTable = tableName.toLowerCase();
    if (window.TABLE_MODAL_CONFIGS[lowerTable]) {
        return window.TABLE_MODAL_CONFIGS[lowerTable];
    }
    
    // 正規化して検索
    const normalized = normalizeTableName(tableName);
    
    for (const key in window.TABLE_MODAL_CONFIGS) {
        if (normalizeTableName(key) === normalized) {
            return window.TABLE_MODAL_CONFIGS[key];
        }
    }
    
    return null;
}

// Supabaseの.from()に渡すテーブル名を取得（スペースなしのキーを優先）
function getTableNameForSupabase(tableName) {
    if (!tableName || !window.TABLE_MODAL_CONFIGS) return tableName;
    const norm = normalizeTableName(tableName);
    let foundWithSpace = null;
    for (const key in window.TABLE_MODAL_CONFIGS) {
        if (normalizeTableName(key) !== norm) continue;
        if (key.indexOf(' ') === -1) return key;
        if (!foundWithSpace) foundWithSpace = key;
    }
    return foundWithSpace || tableName;
}

// テーブルのカラム一覧を取得（既存行のキーまたは Supabase から1件取得）
async function getTableColumnsAsync(tableName, existingData) {
    if (existingData && typeof existingData === 'object' && Object.keys(existingData).length > 0) {
        return Object.keys(existingData);
    }
    const supabase = getSupabaseClient();
    if (!supabase || !tableName) return [];
    const nameForDb = getTableNameForSupabase(tableName);
    try {
        const { data, error } = await supabase.from(nameForDb).select('*').limit(1);
        if (error || !data || data.length === 0) return [];
        return Object.keys(data[0]);
    } catch (e) {
        console.warn('getTableColumnsAsync:', e);
        return [];
    }
}

// カラム名とサンプル値から入力タイプを推定
function inferFieldType(colName, value) {
    const col = (colName || '').toLowerCase();
    if (/date|time|日付|日時/.test(col)) return 'date';
    if (/mail|email|メール/.test(col)) return 'email';
    if (/tel|phone|fax|電話|fax/.test(col)) return 'tel';
    if (/price|amount|kingaku|金額|数|code.*num|numeric/.test(col) || col.endsWith('price') || col.endsWith('amount')) return 'number';
    if (value != null && value !== '') {
        if (typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value))) return 'number';
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    }
    return 'text';
}

// 実際のカラム一覧からモーダル用 config を生成（全テーブルでカラムと入力項目を一致させる）
function buildConfigFromColumns(tableName, columns, sampleRow) {
    const base = findTableConfig(tableName) || {};
    const displayName = base.displayName || getTableDisplayName(tableName);
    const color = base.color || { primary: '#6366f1', secondary: '#4f46e5', light: '#e0e7ff' };
    const layout = base.layout || 'double';
    const defaultSvg = `<svg width="80" height="80" viewBox="0 0 100 100" fill="none"><rect x="20" y="25" width="60" height="50" rx="4" fill="${color.primary}" opacity="0.2"/><rect x="28" y="35" width="44" height="6" rx="2" fill="${color.primary}"/><rect x="28" y="48" width="30" height="6" rx="2" fill="${color.primary}" opacity="0.7"/></svg>`;
    const longTextCols = /name|address|memo|note|名称|住所|メモ|備考|内容|説明|remark|comment|description|詳細/i;
    const fields = columns.map(col => {
        const type = inferFieldType(col, sampleRow && sampleRow[col]);
        const isLong = longTextCols.test(col) || type === 'textarea';
        return {
            name: col,
            label: (typeof getColumnDisplayName === 'function' ? getColumnDisplayName(col) : col).replace(/<br\s*\/?>/gi, ' '),
            type,
            width: isLong ? 'full' : undefined
        };
    });
    return {
        displayName,
        color,
        layout,
        svg: base.svg || defaultSvg,
        sections: [{ title: '項目', icon: 'fa-list', color: color.primary, fields }]
    };
}

function openDetailModal(data) {
    if (!data) {
        console.error('openDetailModal: data is null or undefined');
        return;
    }
    
    // カスタムモーダル設定があるかチェック
    const config = findTableConfig(currentTable);
    if (config) {
        if (typeof window.openCustomTableModal === 'function') {
            return window.openCustomTableModal(currentTable, data, 'view');
        }
    }
    
    // t_staffcodeの場合は専用のプロフィールモーダルを使用
    const normalizedTable = normalizeTableName(currentTable || '');
    if (normalizedTable === 'tstaffcode' || normalizedTable === 'staffcode') {
        if (typeof window.openStaffProfileModal === 'function') {
            return window.openStaffProfileModal(data, 'view');
        }
    }
    
    // デフォルトの詳細モーダルを開く
    const modal = document.getElementById('detail-modal');
    const titleEl = document.getElementById('detail-modal-title');
    const container = document.getElementById('detail-modal-content');
    
    if (!modal) {
        console.error('detail-modal element not found!');
        return;
    }
    
    titleEl.textContent = '詳細';
    modal.style.display = 'flex';
    container.innerHTML = '';
    console.log('======================================');
    
    if (!currentTable) {
        showMessage('テーブルを選択してください', 'warning');
        return;
    }

    // カスタムフォーム定義を確認
    const formConfig = typeof getFormConfig === 'function' ? getFormConfig(currentTable) : null;
    const columns = formConfig && formConfig.fields 
        ? formConfig.fields.map(f => f.name)
        : Object.keys(data).filter(key => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(key.toLowerCase()));

    columns.forEach(col => {
        const field = document.createElement('div');
        field.className = 'form-field form-field-half';
        
        const label = document.createElement('label');
        let displayName = getColumnDisplayName(col);
        // 詳細モーダルでは改行タグを削除
        displayName = displayName.replace(/<br\s*\/?>/gi, '');
        label.textContent = displayName;
        field.appendChild(label);
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'detail-value';
        valueDiv.style.cssText = 'padding: 14px 18px; border: 2px solid var(--border-light); border-radius: 12px; background: #f8fafc; font-size: 15px; min-height: 48px; line-height: 1.5; color: var(--text-primary);';
        
        let cellValue = data[col] !== null && data[col] !== undefined ? String(data[col]) : '';
        
        // 受注金額の場合はカンマ区切りでフォーマット
        const colLower = col.toLowerCase();
        if ((colLower.includes('order_price') || colLower.includes('orderprice') || colLower.includes('受注金額')) && cellValue !== '') {
            const numValue = parseFloat(cellValue);
            if (!isNaN(numValue)) {
                cellValue = numValue.toLocaleString('ja-JP');
            }
        }
        
        valueDiv.textContent = cellValue || '-';
        field.appendChild(valueDiv);
        container.appendChild(field);
    });

    // 編集ボタンのイベント
    const editBtn = document.getElementById('edit-from-detail-modal');
    if (editBtn) {
        editBtn.onclick = () => {
            closeDetailModal();
            setTimeout(() => {
                openRegisterModal('編集', data);
            }, 100);
        };
    }
}

// 詳細モーダルを閉じる
function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 登録・編集モーダルを開く
function openRegisterModal(title, data) {
    console.log('=== openRegisterModal ===');
    console.log('title:', title);
    console.log('currentTable:', currentTable);
    
    // カスタムモーダル設定があるかチェック
    const config = findTableConfig(currentTable);
    
    if (config) {
        let mode = 'new';
        if (title === '編集' || title === '詳細') mode = 'edit';
        else if (title === '複製') mode = 'duplicate';
        
        console.log('→ Opening custom table modal in mode:', mode);
        if (typeof window.openCustomTableModal === 'function') {
            return window.openCustomTableModal(currentTable, data || {}, mode);
        }
    }
    
    // t_staffcodeで設定がない場合（念のため）
    const normalizedTable = normalizeTableName(currentTable || '');
    if ((normalizedTable === 'tstaffcode' || normalizedTable === 'staffcode') && title !== '新規登録') {
        if (typeof window.openStaffProfileModal === 'function') {
            return window.openStaffProfileModal(data || {}, 'edit');
        }
    }
    
    // デフォルトの登録・編集モーダルを開く
    console.log('→ Opening default register modal');
    document.getElementById('modal-title').textContent = title;
    const modal = document.getElementById('register-modal');
    modal.style.display = 'flex';
    
    if (!currentTable) {
        showMessage('テーブルを選択してください', 'warning');
        return;
    }

    // フォームフィールドの生成
    const container = document.getElementById('register-form-fields');
    container.innerHTML = '';

    // 作業票登録の場合は専用レイアウトを使用
    const isWorkTicket = title === '作業票の登録' || title === '作業票登録' || 
                        (data && data.workTicketType) || 
                        (currentTable && currentTable.toLowerCase().includes('work') && currentTable.toLowerCase().includes('ticket'));
    
    if (isWorkTicket) {
        generateWorkTicketForm(container, data);
    } else {
        // カスタムフォーム定義を確認
        const formConfig = typeof getFormConfig === 'function' ? getFormConfig(currentTable) : null;
        
        if (formConfig && formConfig.fields) {
            // カスタムフォーム定義を使用
            generateCustomFormFields(container, formConfig.fields, data);
        } else {
            // デフォルト動作：テーブルのカラムから自動生成
            generateDefaultFormFields(container, data);
        }
    }

    // 編集モードかどうかを判定（dataにidがある場合は編集）
    // フォーム生成後にボタンテキストを設定（少し遅延して確実に設定）
    setTimeout(() => {
        const submitButton = document.querySelector('#register-form button[type="submit"]');
        if (data && data.id !== undefined) {
            document.getElementById('register-form').dataset.editId = data.id;
            if (submitButton) {
                submitButton.textContent = '更新';
            }
        } else {
            delete document.getElementById('register-form').dataset.editId;
            if (submitButton) {
                submitButton.textContent = '登録';
            }
        }
    }, 50);
}

// 作業票登録ページを初期化
// 作業票登録ページを初期化
function initializeWorkTicketPage() {
    const container = document.getElementById('work-ticket-form-container');
    if (container) {
        generateWorkTicketFormPage(container);
    }
}

// 作業票登録フォームを生成（ページ版）
function generateWorkTicketFormPage(container) {
    const today = new Date().toISOString().split('T')[0];
    
    container.style.cssText = 'padding: 12px; height: 100%; overflow: hidden; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);';
    container.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; gap: 8px;">
        <!-- ヘッダー -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #2563eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(37,99,235,0.18); flex-shrink: 0;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <h2 style="color: #fff; font-size: 20px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        <i class="fas fa-clipboard-list" style="margin-right: 8px; color: rgba(255,255,255,0.85);"></i>作業票登録
                    </h2>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button type="button" class="btn-secondary" onclick="changeWorkTicketDate(-1)" style="padding: 6px 12px; font-size: 12px; background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.35); color: #fff;">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <input type="date" id="work-ticket-date" value="${today}" class="form-input" style="font-size: 13px; padding: 6px 10px; font-weight: 600; min-width: 140px;">
                        <button type="button" class="btn-secondary" onclick="changeWorkTicketDate(0)" style="padding: 6px 12px; font-size: 12px; background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.35); color: #fff;">本日</button>
                        <button type="button" class="btn-secondary" onclick="changeWorkTicketDate(1)" style="padding: 6px 12px; font-size: 12px; background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.35); color: #fff;">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                </div>
            </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button type="button" class="btn-secondary" onclick="showPage('register')" style="padding: 8px 16px; font-size: 13px; background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.35); color: #fff;">
                        <i class="fas fa-arrow-left"></i> 戻る
                    </button>
                    <button type="button" class="btn-primary" onclick="saveWorkTicket()" style="padding: 8px 20px; font-size: 14px; font-weight: 700; background: linear-gradient(135deg, #4CAF50 0%, #388e3c 100%);">
                        <i class="fas fa-save"></i> 登録
                    </button>
        </div>
                </div>

            <!-- メインフォーム -->
            <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-height: 0;">
                <!-- 上段：基本情報（横並び） -->
                <div style="display: grid; grid-template-columns: 240px 2fr 1.5fr; gap: 10px; flex-shrink: 0;">
                    <!-- 作業者情報 -->
                    <div style="background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); border-radius: 12px; padding: 14px; box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                        <div style="position: relative; z-index: 1;">
                            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                <i class="fas fa-user-circle" style="font-size: 16px;"></i> 作業者情報
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <div>
                                    <label style="display: block; margin-bottom: 6px; font-weight: 600; color: white; font-size: 11px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                        作業者 <span style="color: #FFD700;">*</span>
                                    </label>
                                    <select name="worker" id="work-ticket-worker" class="form-input" required style="font-size: 13px; padding: 8px 10px; width: 100%; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);" onchange="onWorkerChange(this.value)">
                            <option value="">読み込み中...</option>
                        </select>
                    </div>
                                <div style="display: flex; gap: 8px;">
                                    <div style="flex: 1;">
                                        <label style="display: block; margin-bottom: 6px; font-weight: 600; color: white; font-size: 11px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            所属部署
                                        </label>
                                        <input type="text" id="work-ticket-worker-depa" class="form-input" style="font-size: 12px; padding: 8px; width: 100%; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);" readonly>
                                    </div>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 6px; font-weight: 600; color: white; font-size: 11px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                        入力モード (部門) <span style="color: #FFD700;">*</span>
                                    </label>
                                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.95); border: 2px solid transparent; transition: all 0.2s; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.borderColor='#FFD700'; this.style.boxShadow='0 3px 6px rgba(0,0,0,0.15)'" onmouseout="this.style.borderColor='transparent'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                                        <input type="radio" name="department" value="明石" checked style="margin: 0; accent-color: var(--primary);" onchange="updateWorkTicketValidation()">
                                        <span>明石</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.95); border: 2px solid transparent; transition: all 0.2s; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.borderColor='#FFD700'; this.style.boxShadow='0 3px 6px rgba(0,0,0,0.15)'" onmouseout="this.style.borderColor='transparent'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                                        <input type="radio" name="department" value="組立" style="margin: 0; accent-color: var(--primary);" onchange="updateWorkTicketValidation()">
                                        <span>組立</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.95); border: 2px solid transparent; transition: all 0.2s; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.borderColor='#FFD700'; this.style.boxShadow='0 3px 6px rgba(0,0,0,0.15)'" onmouseout="this.style.borderColor='transparent'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                                        <input type="radio" name="department" value="操業" style="margin: 0; accent-color: var(--primary);" onchange="updateWorkTicketValidation()">
                                        <span>操業</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.95); border: 2px solid transparent; transition: all 0.2s; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.borderColor='#FFD700'; this.style.boxShadow='0 3px 6px rgba(0,0,0,0.15)'" onmouseout="this.style.borderColor='transparent'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                                        <input type="radio" name="department" value="電気技術" style="margin: 0; accent-color: var(--primary);" onchange="updateWorkTicketValidation()">
                                        <span>電気技術</span>
                                    </label>
                                </div>
                    </div>
                        </div>
                    </div>
                    </div>

                    <!-- 職種・オプション + 工事図面情報（横並び） -->
                    <div style="display: grid; grid-template-columns: 1.1fr 1.3fr; gap: 10px;">
                        <!-- 職種・オプション -->
                        <div style="background: linear-gradient(135deg, #6BCB77 0%, #4CAF50 100%); border-radius: 12px; padding: 12px; box-shadow: 0 4px 12px rgba(107, 203, 119, 0.3); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -15px; right: -15px; width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 50%;"></div>
                            <div style="position: relative; z-index: 1;">
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: white; display: flex; align-items: center; gap: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                    <i class="fas fa-tools" style="font-size: 14px;"></i> 職種・オプション
                                </h3>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <div>
                                        <label style="display: block; margin-bottom: 4px; font-weight: 600; color: white; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">職種 <span style="color: #fecaca;">*</span></label>
                                        <select name="job_type_1" id="work-ticket-job-type-1" class="form-input" required style="width: 100%; font-size: 12px; padding: 6px 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); color: #333; background: white;">
                                            <option value="">選択</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="display: block; margin-bottom: 4px; font-weight: 600; color: white; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">オプション</label>
                                        <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px;">
                                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.95); border: 2px solid transparent; transition: all 0.2s; font-size: 12px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                <input type="checkbox" name="no_drawing" id="work-ticket-no-drawing" value="1" style="margin: 0; accent-color: #4CAF50;">
                                                <span style="white-space: nowrap;">図面なし</span>
                                            </label>
                                            <div style="display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.95); padding: 6px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                <div style="display: flex; gap: 10px; justify-content: center;">
                                                    <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #2e7d32; cursor: pointer;">
                                                        <input type="checkbox" id="work-ticket-sv-check" value="SV" style="margin: 0; accent-color: #4CAF50;"> SV
                                                    </label>
                                                    <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #2e7d32; cursor: pointer;">
                                                        <input type="checkbox" id="work-ticket-mt-check" value="MT" style="margin: 0; accent-color: #4CAF50;"> MT
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 工事番号・図面情報 -->
                        <div style="background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); border-radius: 12px; padding: 12px; box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3); position: relative; overflow: hidden;">
                            <div style="position: absolute; bottom: -20px; left: -20px; width: 70px; height: 70px; background: rgba(255,255,255,0.12); border-radius: 50%;"></div>
                            <div style="position: relative; z-index: 1;">
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: white; display: flex; align-items: center; gap: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                    <i class="fas fa-hashtag" style="font-size: 14px;"></i> 工事・図面情報
                                </h3>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <!-- 工事番号＋機械＋ユニット 1行 -->
                                    <div>
                                        <!-- 行1：工事番号 -->
                                        <label style="display: block; margin-bottom: 4px; font-weight: 600; color: white; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">工事番号 <span style="color: #FFD700;">*</span></label>
                                        <input type="text" name="construct_no" id="work-ticket-construct-no" class="form-input" placeholder="工事番号" required maxlength="6" style="width: 80px; font-size: 12px; padding: 6px 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); text-align: center; font-family: inherit; color: #334155; box-sizing: border-box;">
                                        <!-- 日付（巡）選択 -->
                                        <div id="wt-keydate-anchor" style="display:none; margin-top:6px;"></div>
                                        <!-- 行2：機械＋ユニット -->
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
                                            <div>
                                                <select name="machine_type" id="work-ticket-machine-type" class="form-input" style="width: 100%; font-size: 12px; padding: 6px 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); font-family: inherit; color: #334155;">
                                                    <option value="">機械</option>
                                                </select>
                                                <div id="wt-machine-name-display" style="font-size: 10px; color: rgba(255,255,255,0.9); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                                            </div>
                                            <div>
                                                <select name="unit" id="work-ticket-unit-select" class="form-input" style="width: 100%; font-size: 12px; padding: 6px 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); font-family: inherit; color: #334155;">
                                                    <option value="">ユニット</option>
                                                </select>
                                                <div id="wt-unit-name-display" style="font-size: 10px; color: rgba(255,255,255,0.9); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- 図面番号＋品番 -->
                                    <div style="display: flex; gap: 8px; width: 100%;">
                                        <div style="flex: 1; min-width: 0;">
                                            <label style="display: block; margin-bottom: 4px; font-weight: 600; color: white; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">図面番号</label>
                                            <input type="text" name="drawing_no" id="work-ticket-drawing-no" class="form-input" placeholder="図面番号" style="width: 100%; box-sizing: border-box; font-size: 12px; padding: 6px 8px; font-family: inherit; color: #334155; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                                        </div>
                                        <div style="width: 60px; flex-shrink: 0;">
                                            <label style="display: block; margin-bottom: 4px; font-weight: 600; color: white; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">品番</label>
                                            <input type="text" name="part_no" id="work-ticket-part-no" class="form-input" placeholder="品番" style="width: 100%; box-sizing: border-box; font-size: 12px; padding: 6px 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 受注情報 + アクションボタン -->
                    <div id="wt-order-info-section" style="display: flex; flex-direction: column; gap: 10px;">
                        <!-- 受注情報（自動取得） -->
                        <div style="background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%); border-radius: 12px; padding: 14px; box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3); position: relative; overflow: hidden; flex: 1;">
                            <div style="position: absolute; top: -10px; right: -10px; width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                            <div style="position: relative; z-index: 1;">
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                    <i class="fas fa-clipboard-check" style="font-size: 16px;"></i> 受注情報
                                </h3>
                                <p style="margin: 0 0 10px 0; font-size: 9px; color: rgba(255,255,255,0.9); line-height: 1.3; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                    <i class="fas fa-magic" style="margin-right: 4px;"></i>工事番号入力で自動取得
                                </p>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <div style="width: 100%;">
                                        <label style="display: block; margin-bottom: 4px; font-weight: 600; color: white; font-size: 11px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">工事名</label>
                                        <input type="text" name="project_name" id="work-ticket-project-name" class="form-input" placeholder="工事名" readonly style="width: 100%; box-sizing: border-box; font-size: 11px; padding: 8px 10px; background: rgba(255,255,255,0.95); border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                                    </div>
                                    <div style="width: 100%;">
                                        <label style="display: block; margin-bottom: 4px; font-weight: 600; color: white; font-size: 11px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">注文元</label>
                                        <input type="text" name="order_from" id="work-ticket-order-from" class="form-input" placeholder="注文元" readonly style="width: 100%; box-sizing: border-box; font-size: 11px; padding: 8px 10px; background: rgba(255,255,255,0.95); border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                                    </div>
                                    <div style="width: 100%;">
                                        <label style="display: block; margin-bottom: 4px; font-weight: 600; color: white; font-size: 11px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">納品先</label>
                                        <input type="text" name="delivery_to" id="work-ticket-delivery-to" class="form-input" placeholder="納品先" readonly style="width: 100%; box-sizing: border-box; font-size: 11px; padding: 8px 10px; background: rgba(255,255,255,0.95); border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                                    </div>
                                </div>
            </div>
        </div>

                        <!-- アクションボタン -->
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn-secondary" onclick="clearWorkTicketForm()" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); color: white; border: none; box-shadow: 0 3px 8px rgba(0,0,0,0.2); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 12px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 8px rgba(0,0,0,0.2)'">
                                <i class="fas fa-eraser"></i> クリア
                            </button>
                            <button type="button" class="btn-primary" onclick="addWorkTicketItem()" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); color: white; border: none; box-shadow: 0 3px 8px rgba(74, 144, 226, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 5px 15px rgba(74, 144, 226, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 8px rgba(74, 144, 226, 0.4)'">
                                <i class="fas fa-plus-circle"></i> 作業追加
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 下段：作業リストテーブル -->
                <div style="display: flex; flex-direction: column; gap: 8px; overflow: hidden; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border-radius: 12px; padding: 12px; border: 3px solid #4A90E2; box-shadow: 0 6px 20px rgba(74, 144, 226, 0.25); flex: 1; min-height: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; padding-bottom: 8px; border-bottom: 2px solid #4A90E2;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-list-check" style="font-size: 18px; color: #4A90E2;"></i> 作業リスト
                            </h3>
                            <div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%); border-radius: 8px; border: 2px solid rgba(74, 144, 226, 0.3);">
                                <i class="fas fa-clock" style="color: var(--primary); font-size: 14px;"></i>
                                <label style="font-weight: 700; color: var(--primary); font-size: 12px;">合計:</label>
                                <input type="text" name="total" id="work-ticket-total" value="0" readonly style="font-size: 18px; font-weight: 700; color: var(--primary); padding: 4px 10px; border: 2px solid var(--primary); border-radius: 6px; text-align: right; min-width: 70px; background: white; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                                <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">時間</span>
                            </div>
                        </div>
                        <button type="button" class="btn-primary" onclick="saveWorkTicket()" style="padding: 10px 24px; font-size: 14px; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #4CAF50 0%, #388e3c 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 18px rgba(76, 175, 80, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.4)'">
                            <i class="fas fa-save"></i> 登録
                        </button>
                    </div>
                    <div style="overflow: visible; flex: 1; min-height: 0;">
                        <table class="data-table" style="width: 100%; font-size: 15px; border-collapse: collapse; table-layout: fixed;">
                            <thead style="position: sticky; top: 0; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); z-index: 10; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                                <tr>
                                <th style="width: 40px; padding: 10px 4px; text-align: center !important; font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); border-bottom: 2px solid rgba(255,255,255,0.3);">削除</th>
                                <th style="width: 50px; padding: 10px 6px; text-align: center !important; font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); border-bottom: 2px solid rgba(255,255,255,0.3);">工事番号</th>
                                <th style="width: 100px; padding: 10px 6px; text-align: center !important; font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); border-bottom: 2px solid rgba(255,255,255,0.3);">図面/職種</th>
                                <th style="width: 40px; padding: 10px 6px; text-align: center !important; font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); border-bottom: 2px solid rgba(255,255,255,0.3);">品番</th>
                                <th style="width: 150px; padding: 10px 6px; text-align: center !important; font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); border-bottom: 2px solid rgba(255,255,255,0.3);">作業内容</th>
                                <th style="width: 35px; padding: 10px 2px; text-align: center !important; font-size: 10px; font-weight: 700; color: white; border-bottom: 2px solid rgba(255,255,255,0.3);">掛持</th>
                                <th style="width: 35px; padding: 10px 2px; text-align: center !important; font-size: 10px; font-weight: 700; color: white; border-bottom: 2px solid rgba(255,255,255,0.3);">無人</th>
                                <th style="width: 35px; padding: 10px 2px; text-align: center !important; font-size: 10px; font-weight: 700; color: white; border-bottom: 2px solid rgba(255,255,255,0.3);">緊急</th>
                                <th style="width: 35px; padding: 10px 2px; text-align: center !important; font-size: 10px; font-weight: 700; color: white; border-bottom: 2px solid rgba(255,255,255,0.3);">別製</th>
                                <th style="width: 35px; padding: 10px 2px; text-align: center !important; font-size: 10px; font-weight: 700; color: white; border-bottom: 2px solid rgba(255,255,255,0.3);">指導</th>
                                <th style="width: 60px; padding: 10px 6px; text-align: center !important; font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); border-bottom: 2px solid rgba(255,255,255,0.3);">ｺｰﾄﾞ</th>
                                <th style="width: 50px; padding: 10px 6px; text-align: center !important; font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); border-bottom: 2px solid rgba(255,255,255,0.3);">数量</th>
                                <th style="width: 60px; padding: 10px 6px; text-align: center !important; font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); border-bottom: 2px solid rgba(255,255,255,0.3);">時間</th>
                                </tr>
                            </thead>
                <tbody id="work-ticket-items-list">
                    <tr>
                        <td colspan="13" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                                            <i class="fas fa-clipboard-list" style="font-size: 48px; opacity: 0.2; color: var(--primary);"></i>
                                            <div>
                                                <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">作業項目がありません</span>
                                                <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">上記のフォームから作業を追加してください</div>
                                            </div>
                                        </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
                </div>
            </div>
        </div>
    `;
    
    // 職種の選択肢を読み込む
    setTimeout(() => loadJobTypesForWorkTicket(), 100);
    
    // 作業内容の選択肢を読み込む
    setTimeout(() => loadWorkNamesForWorkTicket(), 200);
    
    // 作業者の選択肢を読み込む
    setTimeout(() => loadWorkersForWorkTicket(), 300);
    
    // 機械コードの選択肢を読み込む
    setTimeout(() => loadMachineCodesForWorkTicket(), 350);
    
    // ユニットコードの選択肢を読み込む
    setTimeout(() => loadUnitCodesForWorkTicket(), 400);
    
    // 工事番号入力時に受注情報を自動取得
    setTimeout(() => {
        const constructNoInput = document.getElementById('work-ticket-construct-no');
        if (constructNoInput) {
            constructNoInput.addEventListener('blur', async (event) => {
                const constructNo = event.target.value.trim();
                if (constructNo) {
                    await fetchWorkTicketOrderInfo(constructNo);
                    await loadMachinesFromManufctParts(constructNo);
                }
            });
        }
    }, 500);
}

// 工事番号からt_symbolmachineの機械を取得してドロップダウンに設定
async function loadMachinesFromManufctParts(constructNo) {
    const sb = getSupabaseClient();
    if (!sb) return;
    const { data, error } = await sb.from('t_symbolmachine')
        .select('symbolmachine, machinename')
        .ilike('constructionno', constructNo + '%')
        .limit(200);
    if (error || !data) return;

    const seen = new Set();
    const machines = [];
    data.forEach(r => {
        const code = (r.symbolmachine || '').trim();
        if (code && !seen.has(code)) { seen.add(code); machines.push({ code, name: (r.machinename || '').trim() }); }
    });
    machines.sort((a, b) => a.code.localeCompare(b.code));

    const sel = document.getElementById('work-ticket-machine-type');
    if (!sel) return;
    sel.innerHTML = '<option value="">機械</option>';
    machines.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.code;
        opt.textContent = m.code;
        sel.appendChild(opt);
    });

    // 機械選択時: ユニット絞り込み＋名前表示
    const machNameDiv = document.getElementById('wt-machine-name-display');
    sel.onchange = () => {
        const selectedMachine = machines.find(m => m.code === sel.value);
        if (machNameDiv) machNameDiv.textContent = selectedMachine ? selectedMachine.name : '';
        loadUnitsFromManufctParts(constructNo, sel.value);
    };

    // 機械が1件だけなら自動選択
    if (machines.length === 1) {
        sel.value = machines[0].code;
        if (machNameDiv) machNameDiv.textContent = machines[0].name;
        await loadUnitsFromManufctParts(constructNo, machines[0].code);
    }
}

// 工事番号+機械からt_symbolunitのユニットを取得
async function loadUnitsFromManufctParts(constructNo, machine) {
    const sb = getSupabaseClient();
    if (!sb) return;
    let query = sb.from('t_symbolunit')
        .select('symbolunit, unitname')
        .ilike('constructionno', constructNo + '%')
        .limit(200);
    if (machine) query = query.ilike('symbolmachine', machine + '%');
    const { data, error } = await query;
    if (error || !data) return;

    const seen = new Set();
    const units = [];
    data.forEach(r => {
        const code = (r.symbolunit || '').trim();
        if (code && !seen.has(code)) { seen.add(code); units.push({ code, name: (r.unitname || '').trim() }); }
    });
    units.sort((a, b) => a.code.localeCompare(b.code));

    const sel = document.getElementById('work-ticket-unit-select');
    if (!sel) return;
    const unitNameDiv = document.getElementById('wt-unit-name-display');
    sel.innerHTML = '<option value="">ユニット</option>';
    units.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.code;
        opt.textContent = u.code;  // コードのみ表示
        sel.appendChild(opt);
    });
    // ユニット選択時に名前を下に表示
    sel.onchange = () => {
        const selectedUnit = units.find(u => u.code === sel.value);
        if (unitNameDiv) unitNameDiv.textContent = selectedUnit ? selectedUnit.name : '';
    };
}

// 工事番号のkeydateを取得してチェックボックス表示
async function loadKeydatesFromManufctParts(constructNo) {
    const sb = getSupabaseClient();
    if (!sb) return;
    const { data, error } = await sb.from('t_manufctparts')
        .select('keydate')
        .ilike('constructionno', constructNo + '%')
        .limit(500);
    if (error || !data) return;

    const dates = [...new Set(data.map(r => r.keydate).filter(Boolean))].sort();
    const anchor = document.getElementById('wt-keydate-anchor');
    if (!anchor) return;

    if (dates.length <= 1) { anchor.style.display = 'none'; anchor.innerHTML = ''; return; }
    anchor.style.display = 'block';

    // ボタン式ラジオ選択（1つだけ選ぶ）
    const btnId = (d) => 'wt-date-btn-' + d.replace(/[^0-9]/g, '');
    anchor.innerHTML = '<div style="padding:7px 9px;background:rgba(255,255,255,0.9);border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.12);">' +
        '<div style="font-size:10px;font-weight:700;color:#7c3aed;margin-bottom:5px;"><i class="fas fa-redo-alt" style="margin-right:3px;"></i>巡を選択（' + dates.length + '巡あり）</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:4px;">' +
        dates.map((d, i) => `<button type="button" id="${btnId(d)}" data-keydate="${d}"
            onclick="wtSelectKeydate('${d}')"
            style="font-size:11px;padding:4px 8px;border-radius:5px;border:2px solid #7c3aed;cursor:pointer;font-weight:600;transition:all 0.15s;
            background:${i === 0 ? '#7c3aed' : 'white'};color:${i === 0 ? 'white' : '#7c3aed'};"
            >${d}</button>`).join('') +
        '</div></div>';

    // hidden input に選択中の日付を保持
    let hiddenInput = document.getElementById('wt-selected-keydate');
    if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'wt-selected-keydate';
        hiddenInput.name = 'keydate';
        anchor.appendChild(hiddenInput);
    }
    hiddenInput.value = dates[0];
}

// t_acceptorderの受注登録日ボタンを表示
function showWtOrderDateButtons(allRecords, dates) {
    const anchor = document.getElementById('wt-keydate-anchor');
    if (!anchor) return;
    window._wtAllOrderRecords = allRecords; // 後から参照できるよう保存

    anchor.style.display = 'block';
    anchor.innerHTML = '<div style="padding:6px 8px;background:rgba(255,255,255,0.9);border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.12);">' +
        '<div style="font-size:10px;font-weight:700;color:#7c3aed;margin-bottom:4px;"><i class="fas fa-redo-alt" style="margin-right:3px;"></i>巡を選択（' + dates.length + '巡）</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;max-height:80px;overflow-y:auto;">' +
        dates.map((d, i) => `<button type="button" data-keydate="${d}"
            onclick="wtSelectKeydate('${d}')"
            style="font-size:10px;padding:3px 4px;border-radius:4px;border:1.5px solid #7c3aed;cursor:pointer;font-weight:600;
            background:${i === 0 ? '#7c3aed' : 'white'};color:${i === 0 ? 'white' : '#7c3aed'};white-space:nowrap;"
            >${d}</button>`).join('') +
        '</div></div>';

    // hidden input に選択中の日付を保持
    let hidden = document.getElementById('wt-selected-keydate');
    if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden'; hidden.id = 'wt-selected-keydate'; hidden.name = 'keydate';
        anchor.appendChild(hidden);
    }
    hidden.value = dates[0];
}

// 巡（日付）ボタン選択 → 受注情報を該当レコードで更新
function wtSelectKeydate(date) {
    const anchor = document.getElementById('wt-keydate-anchor');
    if (!anchor) return;
    // ボタン色をリセット→選択ハイライト
    anchor.querySelectorAll('button[data-keydate]').forEach(btn => {
        btn.style.background = 'white'; btn.style.color = '#7c3aed';
    });
    const sel = anchor.querySelector(`button[data-keydate="${date}"]`);
    if (sel) { sel.style.background = '#7c3aed'; sel.style.color = 'white'; }
    const hidden = document.getElementById('wt-selected-keydate');
    if (hidden) hidden.value = date;

    // 選択された日付のレコードでフォームを更新
    const records = window._wtAllOrderRecords;
    if (!records) return;
    const rec = records.find(r => r.registerdate === date) || records[0];
    if (!rec) return;
    const pn = document.getElementById('work-ticket-project-name');
    const of = document.getElementById('work-ticket-order-from');
    const dt = document.getElementById('work-ticket-delivery-to');
    if (pn) pn.value = rec.constructname || '';
    // 注文元・納品先はコードのままになる場合あり（会社名はfetchWorkTicketOrderInfoで解決済み）
}

// 作業票登録用：工事番号から受注情報を取得
async function fetchWorkTicketOrderInfo(constructNo) {
    if (!constructNo) {
        return null;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('Supabaseクライアントが初期化されていません');
        return null;
    }

    let orderInfo = null;

    try {
        const acceptOrderTable = await findTableName(['t_acceptorder', 'T_AcceptOrder', 'acceptorder', 't acceptorder']);
        if (acceptOrderTable) {
            // t_acceptorder から最新1件を取得
            let { data: acceptOrderData, error: acceptOrderError } = await supabase
                .from(acceptOrderTable)
                .select('constructno, constructname, ownercode, usercode, registerdate, orderdate, deliverydate')
                .eq('constructno', constructNo)
                .order('registerdate', { ascending: false })
                .limit(1);

            if (acceptOrderData && acceptOrderData.length > 0) {
                orderInfo = acceptOrderData[0];
                // カラム名はすべて小文字
                orderInfo.ProjectName = orderInfo.constructname || ''; // マッピング
                
                const companyTable = await findTableName(['t_companycode', 'T_CompanyCode', 'companycode', 't companycode']);
                
                // ownercodeから会社名を取得（受注元）
                if (orderInfo.ownercode && companyTable) {
                    const ownerCodeValue = String(orderInfo.ownercode).trim();
                    const { data: ownerCompanyData } = await supabase
                        .from(companyTable)
                        .select('companyname')
                        .eq('companycode', ownerCodeValue)
                        .limit(1);
                    if (ownerCompanyData && ownerCompanyData.length > 0) {
                        orderInfo.Client = ownerCompanyData[0].companyname || '';
                    }
                }
                
                // usercodeから会社名を取得（納品先）
                if (orderInfo.usercode && !orderInfo.DeliveryDestination && companyTable) {
                    const userCodeValue = String(orderInfo.usercode).trim();
                    const { data: userCompanyData } = await supabase
                        .from(companyTable)
                        .select('companyname')
                        .eq('companycode', userCodeValue)
                        .limit(1);
                    if (userCompanyData && userCompanyData.length > 0) {
                        orderInfo.DeliveryDestination = userCompanyData[0].companyname || '';
                    }
                }
            }
        }

        if (!orderInfo) {
            // 2. T_Construction から完全一致で検索
            const constructionTable = await findTableName(['t_construction', 'T_Construction', 'construction', 't construction']);
            if (constructionTable) {
                let { data: constructionData } = await supabase
                    .from(constructionTable)
                    .select('OrderNo, ConstructionName, CustomerCode, DeliveryDestination, SalesRepresentative, FactoryShipmentDate, RegisterDate')
                    .eq('OrderNo', constructNo)
                    .limit(1);

                if (constructionData && constructionData.length > 0) {
                    orderInfo = constructionData[0];
                    
                    const companyTable = await findTableName(['t_companycode', 'T_CompanyCode', 'companycode', 't companycode']);
                    
                    // customercodeからcompanynameを取得
                    if (orderInfo.CustomerCode && companyTable) {
                        const { data: companyData } = await supabase
                            .from(companyTable)
                            .select('companyname')
                            .eq('companycode', orderInfo.CustomerCode)
                            .limit(1);
                        if (companyData && companyData.length > 0) {
                            orderInfo.Client = companyData[0].companyname || '';
                        }
                    }
                }
            }
        }

        if (orderInfo) {
            console.log('取得した受注情報:', orderInfo);
            // フォームに自動入力（ポップアップは表示しない）
            const projectNameInput = document.getElementById('work-ticket-project-name');
            const orderFromInput = document.getElementById('work-ticket-order-from');
            const deliveryToInput = document.getElementById('work-ticket-delivery-to');
            
            const projectName = orderInfo.ProjectName || orderInfo.ConstructionName || '';
            const client = orderInfo.Client || '';
            const deliveryDest = orderInfo.DeliveryDestination || '';
            
            console.log('フォームに設定する値:', { projectName, client, deliveryDest });
            
            if (projectNameInput) {
                projectNameInput.value = projectName;
                console.log('工事名を設定:', projectName);
            }
            if (orderFromInput) {
                orderFromInput.value = client;
                console.log('注文元を設定:', client);
            }
            if (deliveryToInput) {
                deliveryToInput.value = deliveryDest;
                console.log('納品先を設定:', deliveryDest);
            }
        } else {
            // 受注情報が見つからない場合もポップアップは表示しない（以前の動作に戻す）
            console.warn('この工事番号に対応する受注情報が見つかりませんでした:', constructNo);
        }

    } catch (error) {
        console.error('受注情報取得エラー:', error);
        // エラー時もポップアップは表示しない（以前の動作に戻す）
    }
    return orderInfo;
}

// テーブル名を探すヘルパー関数
// テーブル名キャッシュ（セッション中は再問い合わせしない）
const _tableNameCache = {};

async function findTableName(variations) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    // キャッシュキー：候補リストを結合した文字列
    const cacheKey = variations.join('|');
    if (_tableNameCache[cacheKey] !== undefined) {
        return _tableNameCache[cacheKey];
    }

    // 全候補を並列チェック（順序付きで最初に成功したものを使う）
    // ※ select('id') はidカラムが無いテーブルでエラーになるため、HEADリクエスト(count only)を使用
    const results = await Promise.all(
        variations.map(async (name) => {
            try {
                const { error } = await supabase.from(name).select('*', { count: 'exact', head: true });
                return error ? null : name;
            } catch (e) {
                return null;
            }
        })
    );

    // variationsの順で最初に見つかったものを採用
    let found = null;
    for (let i = 0; i < variations.length; i++) {
        if (results[i] !== null) { found = results[i]; break; }
    }

    _tableNameCache[cacheKey] = found;
    return found;
}
window.findTableName = findTableName;

// 機械コードの選択肢を読み込む
async function loadMachineCodesForWorkTicket() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const foundTable = await findTableName(['t_machinecode', 'T_MachineCode', 'machinecode', 't machine code']);
        if (!foundTable) {
            console.error('t_machinecodeテーブルが見つかりません');
            return;
        }

        const { data, error } = await supabase
            .from(foundTable)
            .select('machinecode, machinename')
            .order('machinecode', { ascending: true });

        if (error) {
            console.error('機械コードの取得に失敗:', error);
            return;
        }

        // work-ticket-machine-typeはt_symbolmachineから工事番号で絞り込んで表示するため、ここでは設定しない
    } catch (e) {
        console.error('loadMachineCodesForWorkTicket error:', e);
    }
}

// ユニットコードの選択肢を読み込む
async function loadUnitCodesForWorkTicket() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const foundTable = await findTableName(['t_unitcode', 'T_UnitCode', 'unitcode', 't unit code']);
        if (!foundTable) {
            console.error('t_unitcodeテーブルが見つかりません');
            return;
        }

        const { data, error } = await supabase
            .from(foundTable)
            .select('*')
            .order('unitcode', { ascending: true });

        if (error) {
            console.error('ユニットコードの取得に失敗:', error);
            return;
        }

        // work-ticket-unit-selectはt_symbolunitから工事番号+機械で絞り込んで表示するため、ここでは設定しない
    } catch (e) {
        console.error('loadUnitCodesForWorkTicket error:', e);
    }
}

// 職種の選択肢を読み込む（t_workdepartmentからWorkDepaを取得）
// 職種の選択肢を読み込む（t_workdepartmentから取得）
async function loadJobTypesForWorkTicket() {
    console.log('--- loadJobTypesForWorkTicket 開始 ---');
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabaseクライアントが初期化されていません');
            setDefaultJobTypes();
            return;
        }
        
        const foundTable = await findTableName(['t_workdepartment', 'T_WorkDepartment', 'workdepartment', 't workdepartment']);
        console.log('t_workdepartment テーブル名:', foundTable);

        if (!foundTable) {
            console.error('t_workdepartmentテーブルが見つかりません');
            setDefaultJobTypes();
            return;
        }

        // 全職種を取得（初期表示用）
        const { data, error } = await supabase
            .from(foundTable)
            .select('*');
        
        if (error || !data) {
            console.error('職種データの取得失敗:', error);
            setDefaultJobTypes();
            return;
        }
        
        console.log('t_workdepartment 全データ取得結果:', data.length, '件');
        
        const jobType1Select = document.getElementById('work-ticket-job-type-1');
        if (jobType1Select) {
            jobType1Select.innerHTML = '<option value="">選択</option>';
            const jobTypes = new Set();
            data.forEach(item => {
                // workdepa (職種名) を取得
                const value = item.workdepa || item.WorkDepa || item.work_depa || item.SelectWorkCode || item.selectworkcode;
                if (value) jobTypes.add(String(value).trim());
            });
            
            const sortedJobTypes = Array.from(jobTypes).sort();
            sortedJobTypes.forEach(jobType => {
                const option = document.createElement('option');
                option.value = jobType;
                option.textContent = jobType;
                jobType1Select.appendChild(option);
            });
            
            console.log('職種リストを読み込みました:', sortedJobTypes.length, '件');
        }
    } catch (err) {
        console.error('loadJobTypesForWorkTicket error:', err);
        setDefaultJobTypes();
    }
}

// 作業内容の選択肢を読み込む（t_worktimecodeとt_workcodeから取得）
async function loadWorkNamesForWorkTicket() {
    console.log('--- loadWorkNamesForWorkTicket 開始 ---');
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // 1. t_worktimecode (詳細作業) を取得
        const workTimeCodeTable = await findTableName(['t_worktimecode', 'T_WorkTimeCode', 'worktimecode', 't worktimecode']);
        console.log('t_worktimecode テーブル名:', workTimeCodeTable);
        let detailWorkItems = [];
        if (workTimeCodeTable) {
            const { data, error } = await supabase.from(workTimeCodeTable).select('*');
            if (!error && data) {
                console.log('t_worktimecode データ取得:', data.length, '件');
                detailWorkItems = data.map(item => ({
                    WorkCode: (item.WorkCode || item.workcode || '').toString().trim(),
                    WorkName: (item.WorkName || item.workname || '').toString().trim(),
                    WorkGroup: (item.WorkGroup || item.workgroup || item.JobName || item.jobname || '詳細作業').toString().trim(),
                    Kakemochi: item.Kakemochi === true || item.Kakemochi === 1 || item.Kakemochi === '1',
                    Mujin: item.Mujin === true || item.Mujin === 1 || item.Mujin === '1'
                }));
            } else {
                console.warn('t_worktimecode データ取得失敗または空:', error);
            }
        }

        // 2. t_workcode (大枠職種) を取得
        const workCodeTable = await findTableName(['t_workcode', 'T_WorkCode', 'workcode', 't workcode']);
        console.log('t_workcode テーブル名:', workCodeTable);
        let generalWorkItems = [];
        if (workCodeTable) {
            const { data, error } = await supabase.from(workCodeTable).select('*');
            if (!error && data) {
                console.log('t_workcode データ取得:', data.length, '件');
                generalWorkItems = data.map(item => ({
                    WorkCode: (item.WorkCode || item.workcode || '').toString().trim(),
                    WorkName: (item.WorkName || item.workname || '').toString().trim(),
                    WorkGroup: (item.WorkGroup || item.workgroup || '基本職種').toString().trim(),
                    Kakemochi: item.Kakemochi === true || item.Kakemochi === 1 || item.Kakemochi === '1',
                    Mujin: item.Mujin === true || item.Mujin === 1 || item.Mujin === '1'
                }));
            } else {
                console.warn('t_workcode データ取得失敗または空:', error);
            }
        }

        // 3. マージ（重複排除）
        const allItems = [...detailWorkItems, ...generalWorkItems];
        const seen = new Set();
        window.workCodeMaster = allItems.filter(item => {
            if (!item.WorkName) return false;
            const key = item.WorkCode + '|' + item.WorkName;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // グループと名称でソート
        window.workCodeMaster.sort((a, b) => {
            if (a.WorkGroup !== b.WorkGroup) return a.WorkGroup.localeCompare(b.WorkGroup, 'ja');
            return a.WorkName.localeCompare(b.WorkName, 'ja');
        });

        if (window.workCodeMaster.length === 0) {
            console.warn('作業コードマスタが空です。デモデータを使用します。');
            window.workCodeMaster = [
                { WorkCode: 'ELA', WorkName: '普通旋盤', WorkGroup: '加工', Kakemochi: false, Mujin: false },
                { WorkCode: 'CLNG', WorkName: '清掃', WorkGroup: 'その他', Kakemochi: false, Mujin: false },
                { WorkCode: 'MEET', WorkName: '社内会議', WorkGroup: 'その他', Kakemochi: false, Mujin: false },
                { WorkCode: 'ASSM1', WorkName: '組立', WorkGroup: '組立', Kakemochi: false, Mujin: false }
            ];
        }

        console.log('作業コードマスタを最終的に読み込みました:', window.workCodeMaster.length, '件');
    } catch (e) {
        console.error('loadWorkNamesForWorkTicket error:', e);
    }
}

// 部署選択に応じて職種をフィルタリング
function setupDepartmentJobTypeFilter() {
    const departmentRadios = document.querySelectorAll('input[name="department"]');
    departmentRadios.forEach(radio => {
        radio.addEventListener('change', async () => {
            await updateJobTypesByDepartment(radio.value);
        });
    });
    
    // 初期状態でも更新
    const selectedDept = document.querySelector('input[name="department"]:checked');
    if (selectedDept) {
        updateJobTypesByDepartment(selectedDept.value);
    }
}

// 部署に応じて職種を更新
async function updateJobTypesByDepartment(department) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return;
        }
        
        // t_workdepartmentから部署に対応する作業コードを取得
        const { data: deptData, error: deptError } = await supabase
            .from('t_workdepartment')
            .select('selectworkcode')
            .eq('department', department);
        
        if (deptError || !deptData || deptData.length === 0) {
            // 部署マスタにデータがない場合は、t_workcodeから全データを使用
            await loadAllJobTypes();
            return;
        }
        
        // 部署に対応する作業コードを取得
        const allowedWorkCodes = deptData.map(item => item.selectworkcode).filter(Boolean);
        
        // t_workcodeから該当する作業コードを取得
        const { data: workcodeData, error: workcodeError } = await supabase
            .from('t_workcode')
            .select('workcode, workname')
            .in('workcode', allowedWorkCodes)
            .order('workcode');
        
        if (workcodeError || !workcodeData) {
            await loadAllJobTypes();
            return;
        }
        
        // 職種1の選択肢を更新
        const jobType1Select = document.getElementById('work-ticket-job-type-1');
        if (jobType1Select) {
            const currentValue = jobType1Select.value;
            jobType1Select.innerHTML = '<option value="">選択</option>';
            
            const jobTypes = new Set();
            workcodeData.forEach(item => {
                if (item.workcode) {
                    const jobType = item.workcode.substring(0, 4).toUpperCase();
                    if (jobType && jobType.length >= 2) {
                        jobTypes.add(jobType);
                    }
                }
            });
            
            Array.from(jobTypes).sort().forEach(jobType => {
                const option = document.createElement('option');
                option.value = jobType;
                option.textContent = jobType;
                if (jobType === currentValue) {
                    option.selected = true;
                }
                jobType1Select.appendChild(option);
            });
            
            // 職種1が選択されていれば職種2も自動更新
            if (jobType1Select.value) {
                await updateJobType2Options();
            }
        }
        
    } catch (err) {
        console.warn('部署に応じた職種更新中にエラーが発生しました:', err);
    }
}

// 全職種を読み込む（部署マスタにデータがない場合）
async function loadAllJobTypes() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return;
        }
        
        const { data: workcodeData, error } = await supabase
            .from('t_workcode')
            .select('workcode, workname')
            .order('workcode');
        
        if (error || !workcodeData) {
            return;
        }
        
        const jobType1Select = document.getElementById('work-ticket-job-type-1');
        if (jobType1Select) {
            const currentValue = jobType1Select.value;
            jobType1Select.innerHTML = '<option value="">選択</option>';
            
            const jobTypes = new Set();
            workcodeData.forEach(item => {
                if (item.workcode) {
                    const jobType = item.workcode.substring(0, 4).toUpperCase();
                    if (jobType && jobType.length >= 2) {
                        jobTypes.add(jobType);
                    }
                }
            });
            
            Array.from(jobTypes).sort().forEach(jobType => {
                const option = document.createElement('option');
                option.value = jobType;
                option.textContent = jobType;
                if (jobType === currentValue) {
                    option.selected = true;
                }
                jobType1Select.appendChild(option);
            });
        }
        
        await updateJobType2Options();
    } catch (err) {
        console.warn('全職種読み込み中にエラーが発生しました:', err);
    }
}

// 職種2の選択肢を設定（職種1の変更を監視）
function setupJobType2Options() {
    const jobType1Select = document.getElementById('work-ticket-job-type-1');
    if (jobType1Select) {
        // 既存のイベントリスナーを削除（重複を防ぐ）
        const newSelect = jobType1Select.cloneNode(true);
        jobType1Select.parentNode.replaceChild(newSelect, jobType1Select);
        
        // 新しいイベントリスナーを追加
        const updatedSelect = document.getElementById('work-ticket-job-type-1');
        if (updatedSelect) {
            updatedSelect.addEventListener('change', async (event) => {
                console.log('職種1が変更されました:', event.target.value);
                await updateJobType2Options();
            });
            
            // inputイベントも監視（一部のブラウザでchangeが発火しない場合に備える）
            updatedSelect.addEventListener('input', async (event) => {
                console.log('職種1が入力されました:', event.target.value);
                await updateJobType2Options();
            });
        }
    }
}

// 職種1の選択に応じて職種2の選択肢を更新（t_workdepartmentのWorkUnitから取得）
async function updateJobType2Options() {
    try {
        const jobType1Select = document.getElementById('work-ticket-job-type-1');
        const jobType2Select = document.getElementById('work-ticket-job-type-2');
        
        if (!jobType1Select || !jobType2Select) {
            return;
        }
        
        const selectedJobType1 = jobType1Select.value;
        console.log('選択された職種1:', selectedJobType1);
        
        if (!selectedJobType1) {
            console.log('職種1が選択されていないため、職種2をクリアします');
            jobType2Select.innerHTML = '<option value="">選択</option>';
            return;
        }
        
        console.log('職種2の更新を開始します...');
        const supabase = getSupabaseClient();
        if (!supabase) {
            return;
        }
        
        // まず全カラムを取得してWorkUnitカラム名を確認
        const { data: sampleData, error: sampleError } = await supabase
            .from('t_workdepartment')
            .select('*')
            .limit(1);
        
        if (sampleError) {
            console.error('t_workdepartmentテーブルへのアクセスエラー:', sampleError);
            jobType2Select.innerHTML = '<option value="">選択</option>';
            return;
        }
        
        // WorkUnitカラム名のバリエーションを試す
        let workUnitColumn = null;
        const columnVariations = ['workunit', 'WorkUnit', 'work_unit', 'workunitcode', 'work_unit_code'];
        
        if (sampleData && sampleData.length > 0) {
            const keys = Object.keys(sampleData[0]);
            console.log('t_workdepartmentの利用可能なカラム:', keys);
            
            // 完全一致を試す
            for (const colName of columnVariations) {
                if (keys.includes(colName)) {
                    workUnitColumn = colName;
                    break;
                }
            }
            
            // 部分一致を試す
            if (!workUnitColumn) {
                workUnitColumn = keys.find(key => 
                    key.toLowerCase().includes('workunit') || 
                    key.toLowerCase().includes('unit')
                );
            }
        }
        
        if (!workUnitColumn) {
            console.error('WorkUnitカラムが見つかりません');
            jobType2Select.innerHTML = '<option value="">選択</option>';
            return;
        }
        
        console.log('使用するWorkUnitカラム名:', workUnitColumn);
        
        // WorkDepaカラム名も確認
        let workDepaColumn = null;
        const depaColumnVariations = ['workdepa', 'WorkDepa', 'work_depa', 'workdepacode'];
        
        if (sampleData && sampleData.length > 0) {
            const keys = Object.keys(sampleData[0]);
            for (const colName of depaColumnVariations) {
                if (keys.includes(colName)) {
                    workDepaColumn = colName;
                    break;
                }
            }
            if (!workDepaColumn) {
                workDepaColumn = keys.find(key => 
                    key.toLowerCase().includes('workdepa') || 
                    key.toLowerCase().includes('depa')
                );
            }
        }
        
        if (!workDepaColumn) {
            console.error('WorkDepaカラムが見つかりません');
            jobType2Select.innerHTML = '<option value="">選択</option>';
            return;
        }
        
        // 選択された職種1（WorkDepa）に対応するWorkUnitを取得
        const { data: workdeptData, error } = await supabase
            .from('t_workdepartment')
            .select(`${workDepaColumn}, ${workUnitColumn}`)
            .eq(workDepaColumn, selectedJobType1)
            .order(workUnitColumn);
        
        if (error) {
            console.error('WorkUnitデータの取得エラー:', error);
            jobType2Select.innerHTML = '<option value="">選択</option>';
            return;
        }
        
        if (!workdeptData || workdeptData.length === 0) {
            console.warn('選択された職種1に対応するWorkUnitデータがありません');
            jobType2Select.innerHTML = '<option value="">選択</option>';
            return;
        }
        
        console.log('取得したWorkUnitデータ:', workdeptData);
        
        const currentValue = jobType2Select.value;
        jobType2Select.innerHTML = '<option value="">選択</option>';
        
        // 重複を避けてWorkUnitを取得
        const workUnits = new Set();
        workdeptData.forEach(item => {
            const workUnit = item[workUnitColumn];
            if (workUnit && workUnit !== null && workUnit !== '') {
                workUnits.add(String(workUnit));
            }
        });
        
        console.log('抽出したWorkUnit:', Array.from(workUnits));
        
        // WorkUnitをソートして追加
        if (workUnits.size === 0) {
            console.warn('職種1に対応するWorkUnitが見つかりませんでした');
            jobType2Select.innerHTML = '<option value="">選択</option>';
        } else {
            Array.from(workUnits).sort().forEach(workUnit => {
                const option = document.createElement('option');
                option.value = workUnit;
                option.textContent = workUnit;
                if (workUnit === currentValue) {
                    option.selected = true;
                }
                jobType2Select.appendChild(option);
            });
            console.log('職種2の選択肢を更新しました。件数:', workUnits.size);
        }
        
    } catch (err) {
        console.error('職種2の選択肢更新中にエラーが発生しました:', err);
    }
}

// 作業者の選択肢を読み込む
async function loadWorkersForWorkTicket() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabaseクライアントが初期化されていません');
            setDefaultWorkers();
            return;
        }
        
        const workerSelect = document.getElementById('work-ticket-worker');
        if (!workerSelect) return;
        
        workerSelect.innerHTML = '<option value="">読み込み中...</option>';
        
        // 社員管理（t_staffcode）から作業者を取得
        const staffTable = await findTableName(['t_staffcode', 'T_StaffCode', 'staffcode', 't staffcode']);
        if (!staffTable) {
            console.error('t_staffcodeテーブルが見つかりません。t_computerdeviceを試行します。');
            // フォールバック
            const computerDeviceTable = await findTableName(['t_computerdevice', 'T_ComputerDevice', 'computerdevice', 't computerdevice']);
            if (!computerDeviceTable) {
                setDefaultWorkers();
                return;
            }
            const { data } = await supabase.from(computerDeviceTable).select('*');
            populateWorkerSelect(data, workerSelect);
            return;
        }

        // t_staffcode から全件取得
        const { data, error } = await supabase
            .from(staffTable)
            .select('*');
        
        if (error || !data) {
            console.error('社員データの読み込みエラー:', error);
            setDefaultWorkers();
            return;
        }
        
        populateWorkerSelect(data, workerSelect);
        
    } catch (err) {
        console.error('作業者データの読み込み中にエラーが発生しました:', err);
        setDefaultWorkers();
    }
}

// 作業者プルダウンを生成する共通処理
function populateWorkerSelect(data, workerSelect) {
    workerSelect.innerHTML = '<option value="">選択してください</option>';
    let addedCount = 0;
    
    // 重複を避けるためのセット
    const seenCodes = new Set();

    data.forEach(item => {
        // staffcode, StaffCode, staff_code などのバリエーションをチェック
        const staffCode = String(item.staffcode || item.StaffCode || item.staff_code || item.Staffcode || '').trim();
        const staffName = String(item.staffname || item.StaffName || item.staff_name || item.StaffName || staffCode).trim();
        // depacode, DepaCode, departmentcode などのバリエーションをチェック
        const depaCode = String(item.depacode || item.DepaCode || item.departmentcode || item.DeptCode || item.Depacode || '').trim();
        
        if (staffCode && !seenCodes.has(staffCode)) {
            const option = document.createElement('option');
            option.value = staffCode;
            option.textContent = staffName || staffCode;
            // 部署コードを属性として保持しておく
            option.setAttribute('data-depacode', depaCode);
            workerSelect.appendChild(option);
            seenCodes.add(staffCode);
            addedCount++;
        }
    });
    
    if (addedCount === 0) {
        setDefaultWorkers();
    } else {
        console.log(`作業者リストを読み込みました: ${addedCount}件`);
    }
}

// 作業者が変更された時の処理
async function onWorkerChange(staffCode) {
    console.log('--- onWorkerChange 開始 --- staffCode:', staffCode);
    if (!staffCode) return;

    const workerSelect = document.getElementById('work-ticket-worker');
    if (!workerSelect) {
        console.error('work-ticket-worker 要素が見つかりません');
        return;
    }
    
    const selectedOption = workerSelect.options[workerSelect.selectedIndex];
    // t_computerdevice から取得した depacode (data-depacode 属性に格納済み)
    const depaCode = selectedOption.getAttribute('data-depacode');

    console.log('t_computerdevice由来の depaCode:', depaCode);

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabaseクライアントが取得できません');
            return;
        }

        const depaInput = document.getElementById('work-ticket-worker-depa');
        const jobType1Select = document.getElementById('work-ticket-job-type-1');

        // 1. まず t_staffcode から詳細情報を取得（staffcodeで検索）
        const staffCodeTable = await findTableName(['t_staffcode', 'T_StaffCode', 'staffcode', 't staffcode']);
        console.log('Using staff table:', staffCodeTable);
        
        let finalDepaCode = depaCode;
        if (staffCodeTable) {
            // カラム名の存在確認を兼ねて、全カラムではなく特定のカラムを指定して試行
            // ログのエラー「column t_staffcode.staffcode does not exist」に対応
            const { data: staffData, error: staffError } = await supabase
                .from(staffCodeTable)
                .select('*');
            
            if (staffError) {
                console.error('t_staffcode 取得エラー:', staffError);
            }

            if (staffData && staffData.length > 0) {
                // staffcode カラムの名前が StaffCode や staff_code の可能性があるため、
                // 取得したデータから動的に一致するものを探す
                const targetStaff = staffData.find(s => 
                    String(s.staffcode || s.StaffCode || s.staff_code || '').trim() === String(staffCode).trim()
                );

                if (targetStaff) {
                    console.log('t_staffcode から対象者を発見:', targetStaff);
                    const sDepa = targetStaff.depacode || targetStaff.DepaCode || targetStaff.departmentcode || targetStaff.DeptCode || '';
                    if (sDepa) {
                        finalDepaCode = String(sDepa).trim();
                        console.log('finalDepaCodeをt_staffcode由来に更新:', finalDepaCode);
                    }
                } else {
                    console.warn('t_staffcode 内に一致する staffcode が見つかりませんでした:', staffCode);
                }
            }
        }

        if (finalDepaCode) {
            // 2. t_departmentcode から部署名を取得
            const deptCodeTable = await findTableName(['t_departmentcode', 'T_DepartmentCode', 'departmentcode', 't departmentcode']);
            console.log('t_departmentcode テーブル名:', deptCodeTable);
            
            if (deptCodeTable) {
                const cleanDepaCode = String(finalDepaCode).trim();
                // カラム名のバリエーションに対応 (departmentname, depaname, departmentcode, depacode)
                let { data: deptNameData } = await supabase
                    .from(deptCodeTable)
                    .select('*');

                if (deptNameData && deptNameData.length > 0) {
                    // JavaScript側で柔軟に検索
                    const targetDept = deptNameData.find(d => 
                        String(d.departmentcode || d.Departmentcode || d.depacode || d.Depacode || '').trim() === cleanDepaCode
                    );

                    if (targetDept) {
                        const depaName = targetDept.departmentname || targetDept.DepartmentName || targetDept.depaname || targetDept.Depaname || '';
                        if (depaInput) {
                            depaInput.value = depaName;
                            console.log('t_departmentcode から部署名をセット:', depaName);
                        }
                    } else {
                        // 見つからない場合は数値のまま
                        if (depaInput) depaInput.value = cleanDepaCode;
                    }
                } else {
                    if (depaInput) depaInput.value = cleanDepaCode;
                }
            }

            // 3. t_workdepartment から職種情報を取得
            const workDeptTable = await findTableName(['t_workdepartment', 'T_WorkDepartment', 'workdepartment', 't workdepartment']);
            console.log('t_workdepartment テーブル名:', workDeptTable);
            
            if (workDeptTable) {
                const cleanDepaCode = String(finalDepaCode).trim();
                
                // 全件取得してJS側で柔軟にフィルタリング（カラム名不明確なため）
                let { data: allWorkDepts, error: workDeptError } = await supabase
                    .from(workDeptTable)
                    .select('*');

                console.log('t_workdepartment 全データ:', allWorkDepts);

                if (allWorkDepts && allWorkDepts.length > 0) {
                    // 1. 部署コードで絞り込み
                    let filteredDepts = allWorkDepts.filter(d => {
                        const dCode = String(d.departmentcode || d.Departmentcode || d.DeptCode || d.depacode || d.Depacode || d.department || '').trim();
                        return dCode === cleanDepaCode;
                    });

                    // 2. 部署コードでヒットしない場合、部署名で絞り込みを試行
                    if (filteredDepts.length === 0 && depaInput && depaInput.value) {
                        const currentDepaName = depaInput.value.trim();
                        filteredDepts = allWorkDepts.filter(d => {
                            const dName = String(d.departmentname || d.DepartmentName || d.depaname || d.Depaname || d.DeptName || d.department || '').trim();
                            return dName === currentDepaName || dName.includes(currentDepaName) || currentDepaName.includes(dName);
                        });
                    }

                    console.log('絞り込み後の職種データ:', filteredDepts);

                    // 職種プルダウンを一旦クリア
                    if (jobType1Select) {
                        jobType1Select.innerHTML = '<option value="">選択</option>';
                    }

                    if (filteredDepts.length > 0) {
                        const firstDept = filteredDepts[0];
                        
                        // 部署名が未設定ならセット
                        if (depaInput && (!depaInput.value || /^\d+$/.test(depaInput.value))) {
                            const depaName = firstDept.DeptName || firstDept.departmentname || firstDept.depaname || firstDept.DepartmentName || '';
                            if (depaName) depaInput.value = depaName;
                        }
                        
                        // 職種 (workdepa) を取得
                        const jobName = firstDept.workdepa || firstDept.WorkDepa || firstDept.work_depa || firstDept.SelectWorkCode || firstDept.selectworkcode || '';
                        
                        // 職種プルダウンの選択肢を更新
                        if (jobType1Select) {
                            jobType1Select.innerHTML = '<option value="">選択</option>';
                            const jobTypes = new Set();
                            filteredDepts.forEach(d => {
                                const jt = d.workdepa || d.WorkDepa || d.work_depa || d.SelectWorkCode || d.selectworkcode;
                                if (jt) jobTypes.add(String(jt).trim());
                            });
                            
                            const jobTypesArray = Array.from(jobTypes).sort();
                            jobTypesArray.forEach(jt => {
                                const option = document.createElement('option');
                                option.value = jt;
                                option.textContent = jt;
                                jobType1Select.appendChild(option);
                            });

                            // 職種が1つだけ決まっている場合のみ選択、複数ある場合は空白のまま
                            if (jobTypesArray.length === 1) {
                                jobType1Select.value = jobTypesArray[0];
                            }
                        }
                    } else {
                        console.warn('該当する部署の職種が見つかりませんでした:', cleanDepaCode);
                        // 絞り込みに失敗した場合は、全件表示に戻すか空にするか検討が必要だが、
                        // ユーザーの要望は「絞り込み」なので、一旦空（選択のみ）にする
                    }
                }
            }
        } else {
            console.warn('depaCode が取得できていません');
        }
    } catch (e) {
        console.error('onWorkerChange error:', e);
    }
}

// デフォルトの作業者選択肢を設定
function setDefaultWorkers() {
    const workerSelect = document.getElementById('work-ticket-worker');
    if (workerSelect) {
        workerSelect.innerHTML = `
            <option value="">選択してください</option>
            <option value="総務">総務</option>
            <option value="品質保証部">品質保証部</option>
            <option value="管理部">管理部</option>
            <option value="操業部">操業部</option>
            <option value="電気技術部">電気技術部</option>
            <option value="製造管理部">製造管理部</option>
            <option value="明石製造部">明石製造部</option>
        `;
    }
}

// 作業コードから作業名を自動取得
async function fetchWorkNameByWorkCode(inputElement) {
    const workCode = inputElement.value.trim();
    if (!workCode) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabaseクライアントが初期化されていません');
            return;
        }
        
        // 1. t_workcodeから作業コードに対応する作業名を取得
        const workCodeTable = await findTableName(['t_workcode', 'T_WorkCode', 'workcode', 't workcode']);
        let workName = '';
        
        if (workCodeTable) {
            const { data, error } = await supabase
                .from(workCodeTable)
                .select('WorkName')
                .eq('WorkCode', workCode)
                .limit(1);
            
            if (!error && data && data.length > 0) {
                workName = data[0].workname || data[0].WorkName || '';
            }
        }

        // 2. 見つからない場合、t_worktimecodeから取得を試みる
        if (!workName) {
            const workTimeCodeTable = await findTableName(['t_worktimecode', 'T_WorkTimeCode', 'worktimecode', 't worktimecode']);
            if (workTimeCodeTable) {
                const { data, error } = await supabase
                    .from(workTimeCodeTable)
                    .select('WorkName')
                    .eq('WorkCode', workCode)
                    .limit(1);
                
                if (!error && data && data.length > 0) {
                    workName = data[0].workname || data[0].WorkName || '';
                }
            }
        }
        
        if (workName) {
            // 同じ行の作業名入力欄を更新
            const row = inputElement.closest('tr');
            if (row) {
                const workNameInput = row.querySelector('.work-name-input');
                if (workNameInput) {
                    workNameInput.value = workName;
                }
            }
        }
    } catch (err) {
        console.warn('作業名取得中にエラーが発生しました:', err);
    }
}

// デフォルトの職種選択肢を設定
function setDefaultJobTypes() {
    const defaultJobTypes = [
        '組立', '溶接', '機械加工', '板金', '塗装', '検査', 'その他'
    ];
    
    const jobType1Select = document.getElementById('work-ticket-job-type-1');
    const jobType2Select = document.getElementById('work-ticket-job-type-2');
    
    if (jobType1Select) {
        defaultJobTypes.forEach(job => {
            const option = document.createElement('option');
            option.value = job;
            option.textContent = job;
            jobType1Select.appendChild(option);
        });
    }
    
    if (jobType2Select) {
        defaultJobTypes.forEach(job => {
            const option = document.createElement('option');
            option.value = job;
            option.textContent = job;
            jobType2Select.appendChild(option);
        });
    }
}

// 作業票登録フォームを生成（モーダル版 - 既存の関数を保持）
function generateWorkTicketForm(container, data) {
    const today = new Date().toISOString().split('T')[0];
    const todayFormatted = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    
    container.className = 'work-ticket-form';
    container.innerHTML = `
        <!-- ヘッダー -->
        <div class="work-ticket-header">
            <div class="work-ticket-header-left">
                <div class="work-ticket-date-controls">
                    <button type="button" onclick="changeWorkTicketDate(-1)"><i class="fas fa-chevron-left"></i> 一日戻る</button>
                    <input type="date" id="work-ticket-date" value="${today}" style="padding: 10px 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 10px; background: rgba(255,255,255,0.2); color: white; font-size: 15px; font-weight: 600; cursor: pointer; backdrop-filter: blur(10px);">
                    <button type="button" onclick="changeWorkTicketDate(0)">本日</button>
                    <button type="button" onclick="changeWorkTicketDate(1)">一日進む <i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="work-ticket-header-right">
                <button type="button" class="btn-secondary" style="background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">更新・削除へ</button>
                <button type="submit" class="btn-primary" style="background: rgba(255,107,107,0.9); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 10px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" onmouseover="this.style.background='rgba(255,107,107,1)'" onmouseout="this.style.background='rgba(255,107,107,0.9)'">登録</button>
            </div>
        </div>

        <!-- メインコンテンツ -->
        <div class="work-ticket-main-content">
            <!-- 左：作業詳細 -->
            <div class="work-ticket-section">
                <div class="work-ticket-section-title">
                    <i class="fas fa-tools"></i>
                    作業詳細
                </div>
                <div class="work-ticket-section-fields">
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-user"></i> 作業者</label>
                        <select name="worker" class="form-input">
                            <option value="総務">総務</option>
                            <option value="品質保証部">品質保証部</option>
                            <option value="管理部">管理部</option>
                            <option value="操業部">操業部</option>
                            <option value="電気技術部">電気技術部</option>
                            <option value="製造管理部">製造管理部</option>
                            <option value="明石製造部">明石製造部</option>
                        </select>
                    </div>
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-building"></i> 部署・役割</label>
                        <div class="work-ticket-radio-group">
                            <label class="work-ticket-radio-item">
                                <input type="radio" name="department" value="品質保証部・管理部・操業部・電気技術部・製造管理部・明石製造部">
                                <span>品質保証部・管理部・操業部・電気技術部・製造管理部・明石製造部</span>
                            </label>
                            <label class="work-ticket-radio-item">
                                <input type="radio" name="department" value="明石" checked>
                                <span>明石</span>
                            </label>
                            <label class="work-ticket-radio-item">
                                <input type="radio" name="department" value="組立">
                                <span>組立</span>
                            </label>
                            <label class="work-ticket-radio-item">
                                <input type="radio" name="department" value="操業">
                                <span>操業</span>
                            </label>
                            <label class="work-ticket-radio-item">
                                <input type="radio" name="department" value="電気技術">
                                <span>電気技術</span>
                            </label>
                        </div>
                    </div>
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-check-square"></i> オプション</label>
                        <div class="work-ticket-checkbox-group">
                            <label class="work-ticket-checkbox-item">
                                <input type="checkbox" name="no_drawing" value="1">
                                <span>図面番号がない作業</span>
                            </label>
                            <label class="work-ticket-checkbox-item">
                                <input type="checkbox" name="svsv_mtmt" value="1">
                                <span>SVSVまたはMTMT</span>
                            </label>
                        </div>
                    </div>
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-briefcase"></i> 職種</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <select name="job_type_1" class="form-input">
                                <option value="">選択してください</option>
                            </select>
                            <select name="job_type_2" class="form-input">
                                <option value="">選択してください</option>
                            </select>
                        </div>
                    </div>
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-hashtag"></i> 工事番号</label>
                        <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center;">
                            <input type="text" name="construct_no" class="form-input" placeholder="工事番号">
                            <select name="machine_type" class="form-input" style="min-width: 100px;">
                                <option value="機械">機械</option>
                            </select>
                            <input type="text" name="unit" class="form-input" placeholder="ユニット">
                        </div>
                    </div>
                    <div class="work-ticket-field-group">
                        <label class="work-ticket-checkbox-item" style="margin: 0;">
                            <input type="checkbox" name="register_with_unit" value="1">
                            <span>ユニット記号で登録(組立部のみ)</span>
                        </label>
                    </div>
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-file-alt"></i> 図面番号</label>
                        <input type="text" name="drawing_no" class="form-input" placeholder="図面番号">
                    </div>
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-barcode"></i> 品番</label>
                        <input type="text" name="part_no" class="form-input" placeholder="品番">
                    </div>
                    <div class="work-ticket-action-buttons">
                        <button type="button" class="btn-clear" onclick="clearWorkTicketForm()">
                            <i class="fas fa-eraser"></i> 入力クリア
                        </button>
                        <button type="button" class="btn-add" onclick="addWorkTicketItem()">
                            <i class="fas fa-plus"></i> 作業追加
                        </button>
                    </div>
                </div>
            </div>

            <!-- 右：受注情報 -->
            <div class="work-ticket-section">
                <div class="work-ticket-section-title">
                    <i class="fas fa-clipboard-list"></i>
                    受注情報
                </div>
                <div class="work-ticket-section-fields">
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-project-diagram"></i> 工事名</label>
                        <input type="text" name="project_name" class="form-input" placeholder="工事名">
                    </div>
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-building"></i> 注文元</label>
                        <input type="text" name="order_from" class="form-input" placeholder="注文元">
                    </div>
                    <div class="work-ticket-field-group">
                        <label><i class="fas fa-truck"></i> 納品先</label>
                        <input type="text" name="delivery_to" class="form-input" placeholder="納品先">
                    </div>
                </div>
            </div>
        </div>

        <!-- 作業リストテーブル -->
        <div class="work-ticket-list-table">
            <table>
                <thead>
                    <tr>
                        <th>削除</th>
                        <th>工事番号</th>
                        <th>図面番号/職種</th>
                        <th>品番</th>
                        <th>作業コード</th>
                        <th>掛持</th>
                        <th>無人</th>
                        <th>緊急</th>
                        <th>別製作</th>
                        <th>指導</th>
                        <th>作業名</th>
                        <th>数量</th>
                        <th>作業時間</th>
                    </tr>
                </thead>
                <tbody id="work-ticket-items-list">
                    <tr>
                        <td colspan="13" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                            作業項目がありません
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- フッター -->
        <div class="work-ticket-footer">
            <div class="work-ticket-total">
                <label>合計</label>
                <input type="text" name="total" value="0" readonly>
            </div>
        </div>
    `;
}

// 作業票の日付を変更
function changeWorkTicketDate(days) {
    const dateInput = document.getElementById('work-ticket-date');
    if (!dateInput) return;
    
    const currentDate = new Date(dateInput.value || new Date());
    if (days === 0) {
        currentDate.setTime(Date.now());
    } else {
        currentDate.setDate(currentDate.getDate() + days);
    }
    
    dateInput.value = currentDate.toISOString().split('T')[0];
}

// 作業票フォームをクリア
// 入力フォームをクリア
function clearWorkTicketForm() {
    if (!confirm('入力内容をすべてクリアしてもよろしいですか？')) {
        return;
    }

    // 基本情報のクリア
    const basicInputs = [
        'work-ticket-construct-no',
        'work-ticket-drawing-no',
        'work-ticket-part-no',
        'work-ticket-project-name',
        'work-ticket-order-from',
        'work-ticket-delivery-to',
        'work-ticket-worker-depa',
        'work-ticket-worker-job'
    ];
    
    basicInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // セレクトボックスのクリア
    const selects = [
        'work-ticket-worker',
        'work-ticket-job-type-1',
        'work-ticket-machine-type',
        'work-ticket-unit-select'
    ];
    
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });

    // チェックボックスのクリア
    const checkboxes = [
        'work-ticket-no-drawing',
        'work-ticket-sv-check',
        'work-ticket-mt-check',
        'work-ticket-register-with-unit'
    ];
    
    checkboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });

    // 作業リストのクリア
    const list = document.getElementById('work-ticket-items-list');
    if (list) {
        list.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        <i class="fas fa-clipboard-list" style="font-size: 48px; opacity: 0.2; color: var(--primary);"></i>
                        <div>
                            <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">作業項目がありません</span>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">上記のフォームから作業を追加してください</div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    // 合計時間のクリア
    const totalEl = document.getElementById('work-ticket-total');
    if (totalEl) totalEl.value = '0';

    showMessage('入力をクリアしました');
}

// 作業項目を追加
function addWorkTicketItem() {
    const list = document.getElementById('work-ticket-items-list');
    if (!list) return;
    
    // 最初の空のメッセージを削除
    if (list.querySelector('tr td[colspan]')) {
        list.innerHTML = '';
    }
    
    // フォームから値を取得
    const constructNo = document.getElementById('work-ticket-construct-no')?.value || '';
    const drawingNo = document.getElementById('work-ticket-drawing-no')?.value || '';
    const partNo = document.getElementById('work-ticket-part-no')?.value || '';
    const jobType1 = document.getElementById('work-ticket-job-type-1')?.value || '';
    
    // SV/MTチェックボックスの状態を取得
    const isSV = document.getElementById('work-ticket-sv-check')?.checked;
    const isMT = document.getElementById('work-ticket-mt-check')?.checked;
    let svMt = '';
    if (isSV && isMT) svMt = 'SV/MT';
    else if (isSV) svMt = 'SV';
    else if (isMT) svMt = 'MT';
    
    const drawingJob = drawingNo + (jobType1 ? '/' + jobType1 : '') + (svMt ? '(' + svMt + ')' : '');
    
    const row = document.createElement('tr');
    
    // 作業内容のセレクトボックスを生成
    let workNameOptions = '<option value="">選択してください</option>';
    if (window.workCodeMaster) {
        let currentGroup = '';
        window.workCodeMaster.forEach(item => {
            const group = (item.WorkGroup || 'その他').trim();
            if (group !== currentGroup) {
                if (currentGroup !== '') workNameOptions += '</optgroup>';
                workNameOptions += `<optgroup label="${group}">`;
                currentGroup = group;
            }
            workNameOptions += `<option value="${item.WorkName.trim()}" data-code="${item.WorkCode.trim()}" data-kakemochi="${item.Kakemochi}" data-mujin="${item.Mujin}">${item.WorkName.trim()}</option>`;
        });
        if (currentGroup !== '') workNameOptions += '</optgroup>';
    }
    workNameOptions += '<option value="OTHER" data-code="">その他（直接入力）</option>';

    row.innerHTML = `
        <td><button type="button" class="btn-danger btn-small" onclick="removeWorkTicketItem(this)" style="padding: 4px 8px; font-size: 11px;"><i class="fas fa-trash"></i></button></td>
        <td style="width: 50px;"><input type="text" name="items[][construct_no]" class="form-input" value="${constructNo}" style="padding: 4px; font-size: 12px; width: 100%; border: none; background: transparent; text-align: center;" readonly></td>
        <td><input type="text" name="items[][drawing_job]" class="form-input" value="${drawingJob}" style="padding: 4px; font-size: 12px; width: 100%; border: none; background: transparent;" readonly></td>
        <td style="width: 40px;"><input type="text" name="items[][part_no]" class="form-input" value="${partNo}" style="padding: 4px; font-size: 12px; width: 100%; border: none; background: transparent; text-align: center;" readonly></td>
        <td style="position: relative; overflow: visible;">
            <div class="work-name-container" style="position: relative; width: 100%;">
                <input type="text" class="form-input work-name-search-input" placeholder="作業内容を入力/検索..." style="padding: 4px 8px; font-size: 12px; width: 100%; box-sizing: border-box;" oninput="filterWorkNames(this)" onfocus="showWorkNameDropdown(this)" onblur="hideWorkNameDropdown(this)">
                <input type="hidden" name="items[][work_name]" class="work-name-hidden-input">
                <div class="work-name-dropdown" style="display: none; position: absolute; top: 100%; left: 0; width: 100%; max-height: 250px; overflow-y: auto; background: white; border: 1px solid #4A90E2; border-radius: 4px; z-index: 9999; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                    ${window.workCodeMaster ? window.workCodeMaster.map(item => `
                        <div class="work-name-option" 
                             style="padding: 8px 12px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #eee; color: #333;" 
                             onmousedown="selectWorkName(this, '${item.WorkName.replace(/'/g, "\\'")}', '${item.WorkCode}', ${item.Kakemochi}, ${item.Mujin})"
                             onmouseover="this.style.background='#e3f2fd'" 
                             onmouseout="this.style.background='white'">
                            <div style="font-weight: 700; color: #1a73e8;">${item.WorkName}</div>
                            <div style="font-size: 11px; color: #666; display: flex; justify-content: space-between;">
                                <span>${item.WorkGroup || ''}</span>
                                <span style="font-family: monospace; background: #f1f3f4; padding: 0 4px; border-radius: 2px;">${item.WorkCode}</span>
                            </div>
                        </div>
                    `).join('') : ''}
                    <div class="work-name-option" 
                         style="padding: 8px 12px; font-size: 13px; cursor: pointer; background: #fffde7; border-top: 2px solid #ffd54f;" 
                         onmousedown="selectWorkName(this, 'OTHER', '', false, false)">
                        <div style="font-weight: 700; color: #f57f17;">その他（直接入力）</div>
                    </div>
                </div>
            </div>
        </td>
        <td style="text-align: center; width: 35px;"><input type="checkbox" name="items[][holding]" class="kakemochi-check" style="width: 18px; height: 18px; cursor: pointer;"></td>
        <td style="text-align: center; width: 35px;"><input type="checkbox" name="items[][unmanned]" class="mujin-check" style="width: 18px; height: 18px; cursor: pointer;"></td>
        <td style="text-align: center; width: 35px;"><input type="checkbox" name="items[][urgent]" style="width: 18px; height: 18px; cursor: pointer;"></td>
        <td style="text-align: center; width: 35px;"><input type="checkbox" name="items[][separate]" style="width: 18px; height: 18px; cursor: pointer;"></td>
        <td style="text-align: center; width: 35px;"><input type="checkbox" name="items[][guidance]" style="width: 18px; height: 18px; cursor: pointer;"></td>
        <td style="width: 60px;"><input type="text" name="items[][work_code]" class="form-input work-code-input" style="padding: 4px; font-size: 12px; font-family: monospace; width: 100%; border: none; background: rgba(0,0,0,0.05); text-align: center;" readonly></td>
        <td style="width: 50px;"><input type="number" name="items[][quantity]" class="form-input" style="padding: 4px; font-size: 12px; width: 100%; text-align: right;" min="0" value="1"></td>
        <td style="width: 60px;"><input type="number" name="items[][work_time]" class="form-input" style="padding: 4px; font-size: 14px; width: 100%; text-align: right; font-weight: 700; color: var(--primary);" min="0" step="0.25" onchange="updateWorkTicketTotal()"></td>
    `;
    list.appendChild(row);
    
    // フォームの一部をクリア（工事番号、図面番号、品番以外）
    // 必要に応じて調整
}

// 作業項目を削除
function removeWorkTicketItem(button) {
    const row = button.closest('tr');
    if (row) {
        row.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            row.remove();
            const list = document.getElementById('work-ticket-items-list');
            if (list && list.children.length === 0) {
                list.innerHTML = `
                    <tr>
                        <td colspan="13" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                            作業項目がありません
                        </td>
                    </tr>
                `;
            }
            updateWorkTicketTotal();
        }, 300);
    }
}

// 作業内容選択時の自動入力
function onWorkNameChange(select) {
    const row = select.closest('tr');
    const workCodeInput = row.querySelector('.work-code-input');
    const kakemochiCheck = row.querySelector('.kakemochi-check');
    const mujinCheck = row.querySelector('.mujin-check');
    const selectedOption = select.options[select.selectedIndex];
    
    const workCode = selectedOption.getAttribute('data-code');
    const isKakemochi = selectedOption.getAttribute('data-kakemochi') === 'true';
    const isMujin = selectedOption.getAttribute('data-mujin') === 'true';
    
    if (select.value === 'OTHER') {
        workCodeInput.value = '';
        workCodeInput.readOnly = false;
        workCodeInput.focus();
    } else {
        workCodeInput.value = workCode || '';
        workCodeInput.readOnly = true;
        
        // フラグの自動セット
        if (kakemochiCheck) kakemochiCheck.checked = isKakemochi;
        if (mujinCheck) mujinCheck.checked = isMujin;
    }
}

// 作業票の合計を更新
function updateWorkTicketTotal() {
    const list = document.getElementById('work-ticket-items-list');
    const totalInputs = document.querySelectorAll('[id="work-ticket-total"]');
    if (!list || totalInputs.length === 0) return;
    
    let total = 0;
    const rows = list.querySelectorAll('tr');
    rows.forEach(row => {
        const timeInput = row.querySelector('input[name*="[work_time]"]');
        if (timeInput && timeInput.value) {
            total += parseFloat(timeInput.value) || 0;
        }
    });
    
    const totalVal = Math.round(total * 100) / 100;
    totalInputs.forEach(input => {
        input.value = totalVal.toFixed(2);
        
        // 労働時間との乖離チェック
        if (totalVal === 7.75) {
            input.style.backgroundColor = '#f0fdf4'; // 緑
            input.style.borderColor = '#22c55e';
            input.style.color = '#166534';
        } else if (totalVal > 0) {
            input.style.backgroundColor = '#fff7ed'; // オレンジ
            input.style.borderColor = '#f97316';
            input.style.color = '#9a3412';
        } else {
            input.style.backgroundColor = 'white';
            input.style.borderColor = 'var(--primary)';
            input.style.color = 'var(--primary)';
        }
    });
}

// 作業内容のあいまい検索・ドロップダウン制御
function showWorkNameDropdown(input) {
    const dropdown = input.parentElement.querySelector('.work-name-dropdown');
    if (dropdown) dropdown.style.display = 'block';
}

function hideWorkNameDropdown(input) {
    const dropdown = input.parentElement.querySelector('.work-name-dropdown');
    // mousedownイベントが先に走るように少し遅延させる
    if (dropdown) setTimeout(() => { dropdown.style.display = 'none'; }, 200);
}

function filterWorkNames(input) {
    const filter = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.work-name-dropdown');
    const options = dropdown.querySelectorAll('.work-name-option');
    
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(filter)) {
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    });
}

function selectWorkName(option, name, code, kakemochi, mujin) {
    const container = option.closest('.work-name-container');
    const searchInput = container.querySelector('.work-name-search-input');
    const hiddenInput = container.querySelector('.work-name-hidden-input');
    const row = container.closest('tr');
    const workCodeInput = row.querySelector('.work-code-input');
    const kakemochiCheck = row.querySelector('.kakemochi-check');
    const mujinCheck = row.querySelector('.mujin-check');

    if (name === 'OTHER') {
        searchInput.value = '';
        searchInput.placeholder = '直接入力してください...';
        hiddenInput.value = 'OTHER';
        workCodeInput.value = '';
        workCodeInput.readOnly = false;
        workCodeInput.focus();
        if (kakemochiCheck) kakemochiCheck.checked = false;
        if (mujinCheck) mujinCheck.checked = false;
    } else {
        searchInput.value = name;
        hiddenInput.value = name;
        workCodeInput.value = code || '';
        workCodeInput.readOnly = true;
        if (kakemochiCheck) kakemochiCheck.checked = !!kakemochi;
        if (mujinCheck) mujinCheck.checked = !!mujin;
    }
    
    const dropdown = container.querySelector('.work-name-dropdown');
    if (dropdown) dropdown.style.display = 'none';
}

// 加工進捗ページの初期化
async function initializeProcessingProgressPage() {
    console.log('initializeProcessingProgressPage 開始');
    try {
        // 初期表示時は全件ロードしない（工事番号入力後に絞り込み）
        // Enterキーで検索
        const runSearch = () => searchProcessingProgress();
        ['pp-filter-construct-no', 'pp-filter-drawing-no', 'pp-filter-part-no', 'pp-filter-keydate'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });
        });

        // 工事番号変更時：機械プルダウンを絞り込み
        let ppConstructTimer = null;
        const constructNoEl = document.getElementById('pp-filter-construct-no');
        if (constructNoEl) {
            constructNoEl.addEventListener('input', () => {
                clearTimeout(ppConstructTimer);
                ppConstructTimer = setTimeout(async () => {
                    const cn = constructNoEl.value.trim();
                    await loadPPFilterOptions(cn, '');
                }, 400);
            });
        }

        // 機械変更時：ユニットプルダウンを絞り込み
        const machineEl = document.getElementById('pp-filter-machine');
        if (machineEl) {
            machineEl.addEventListener('change', async () => {
                const cn = (document.getElementById('pp-filter-construct-no') || {}).value || '';
                await loadPPFilterOptions(cn.trim(), machineEl.value, true);
            });
        }

        console.log('加工進捗ページの初期化完了');
    } catch (e) {
        console.error('initializeProcessingProgressPage error:', e);
    }
}

// 加工進捗フィルターの選択肢をロード（工事番号・機械で絞り込み対応）
async function loadPPFilterOptions(constructNo, machine, unitOnly) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // 機械・keydate プルダウン更新（unitOnly=trueのときはスキップ）
        if (!unitOnly) {
            let mQuery = supabase.from('t_manufctparts').select('symbolmachine, keydate').limit(2000);
            if (constructNo) mQuery = mQuery.ilike('constructionno', `%${constructNo}%`);
            const { data: mRows } = await mQuery;
            const rows = mRows || [];

            // 機械プルダウン
            const machines = [...new Set(rows.map(r => (r.symbolmachine || '').trim()).filter(Boolean))].sort();
            const machineSelect = document.getElementById('pp-filter-machine');
            if (machineSelect) {
                const prevVal = machineSelect.value;
                machineSelect.innerHTML = '<option value="">すべて</option>';
                machines.forEach(code => {
                    const option = document.createElement('option');
                    option.value = code;
                    option.textContent = code;
                    machineSelect.appendChild(option);
                });
                if (prevVal && machines.includes(prevVal)) machineSelect.value = prevVal;
            }

            // 受注登録日（keydate）プルダウン：工事番号が入力されたときのみ有効
            const keydateSelect = document.getElementById('pp-filter-keydate');
            if (keydateSelect) {
                if (!constructNo) {
                    keydateSelect.innerHTML = '<option value="">― 工事番号を入力 ―</option>';
                } else {
                    const keydates = [...new Set(rows.map(r => (r.keydate || '').trim()).filter(Boolean))]
                        .sort((a, b) => b.localeCompare(a)); // 新しい順
                    const prevKd = keydateSelect.value;
                    keydateSelect.innerHTML = '';
                    keydates.forEach(kd => {
                        const option = document.createElement('option');
                        option.value = kd;
                        option.textContent = kd.replace(/-/g, '/');
                        keydateSelect.appendChild(option);
                    });
                    // 以前の選択値があれば復元、なければ最新（先頭）を自動選択
                    if (prevKd && keydates.includes(prevKd)) {
                        keydateSelect.value = prevKd;
                    } else if (keydates.length > 0) {
                        keydateSelect.value = keydates[0]; // 最新を自動選択
                    }
                }
            }
        }

        // ユニットプルダウン更新
        let uQuery = supabase.from('t_manufctparts').select('symbolunit').limit(2000);
        if (constructNo) uQuery = uQuery.ilike('constructionno', `%${constructNo}%`);
        if (machine) uQuery = uQuery.ilike('symbolmachine', `${machine}%`);
        const { data: uRows } = await uQuery;
        const units = [...new Set((uRows || []).map(r => (r.symbolunit || '').trim()).filter(Boolean))].sort();
        const unitSelect = document.getElementById('pp-filter-unit');
        if (unitSelect) {
            const prevUnit = unitSelect.value;
            unitSelect.innerHTML = '<option value="">すべて</option>';
            units.forEach(code => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = code;
                unitSelect.appendChild(option);
            });
            if (prevUnit && units.includes(prevUnit)) unitSelect.value = prevUnit;
        }
    } catch (e) {
        console.warn('loadPPFilterOptions error:', e);
    }
}

// 加工進捗: 行オブジェクトからキー候補で値を取得（PascalCase/snake_case 両対応）
function ppVal(row) {
    const keys = Array.from(arguments).slice(1);
    for (const k of keys) {
        if (row == null) return '';
        const v = row[k];
        if (v !== undefined && v !== null && v !== '') return String(v);
    }
    return '';
}

// 加工進捗の検索（v_加工進捗 → t_manufctparts → t_zumendata_manufct の順で取得）
async function searchProcessingProgress() {
    console.log('searchProcessingProgress 開始');
    const tbody = document.getElementById('pp-main-table-body');
    if (!tbody) return;

    tbody.innerHTML = (typeof bearLoadingRow === 'function') ? bearLoadingRow(22, '検索中...') : '<tr><td colspan="22" style="text-align:center;padding:40px;">🐻‍❄️ 検索中...</td></tr>';

    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const constructNo = document.getElementById('pp-filter-construct-no').value.trim();
        const machine = document.getElementById('pp-filter-machine').value;
        const unit = document.getElementById('pp-filter-unit').value;
        const drawingNo = document.getElementById('pp-filter-drawing-no').value.trim();
        const partNo = (document.getElementById('pp-filter-part-no')?.value || '').trim();
        const keydateVal = (document.getElementById('pp-filter-keydate')?.value || '').trim();
        const status = document.querySelector('input[name="pp-status"]:checked').value;

        // データ取得元: t_manufctparts を優先（確実に読めるように）、次に v_加工進捗
        const mainTable = await findTableName([
            't_manufctparts', 'T_ManufctParts', 'manufctparts',
            'v_加工進捗', 'v_kakou_shinchoku',
            't_zumendata_manufct', 'T_ZumenData_Manufct', 'zumendata_manufct'
        ]);
        if (!mainTable) {
            tbody.innerHTML = '<tr><td colspan="22" style="text-align: center; padding: 20px; color: #ef4444;">テーブル／ビューが見つかりません（v_加工進捗, t_manufctparts, t_zumendata_manufct のいずれかを用意してください）</td></tr>';
            return;
        }

        // 絞り込み（末尾スペース対応: machine/unit は ilike で前方一致）
        let query = supabase.from(mainTable).select('*');
        if (constructNo) query = query.ilike('constructionno', `%${constructNo}%`);
        if (machine) query = query.ilike('symbolmachine', `${machine}%`);
        if (unit) query = query.ilike('symbolunit', `${unit}%`);
        if (drawingNo) query = query.ilike('drawingno', `%${drawingNo}%`);
        if (partNo) query = query.ilike('partno', `%${partNo}%`);
        if (keydateVal) query = query.eq('keydate', keydateVal);

        let rawData = null;
        let error = null;
        ({ data: rawData, error } = await query.limit(1000));
        if (error && (error.message || '').indexOf('construct') >= 0) {
            query = supabase.from(mainTable).select('*');
            if (constructNo) query = query.ilike('constructno', `%${constructNo}%`);
            if (machine) query = query.ilike('symbolmachine', `${machine}%`);
            if (unit) query = query.ilike('symbolunit', `${unit}%`);
            if (drawingNo) query = query.ilike('drawingno', `%${drawingNo}%`);
            if (partNo) query = query.ilike('partno', `%${partNo}%`);
            if (keydateVal) query = query.eq('keydate', keydateVal);
            const res = await query.limit(1000);
            rawData = res.data;
            error = res.error;
        }

        if (error) {
            console.error('searchProcessingProgress API error:', error);
            tbody.innerHTML = '<tr><td colspan="22" style="text-align: center; padding: 20px; color: #dc2626;">データ取得エラー: ' + (error.message || String(error)) + '</td></tr>';
            const countEl = document.getElementById('pp-result-count');
            if (countEl) countEl.textContent = '—';
            return;
        }

        let data = rawData || [];
        // 図面番号が7文字超のものは優先表示のため残す（6文字以下も表示する）
        // data = data.filter(r => (ppVal(r, 'drawingno') || '').trim().length > 6);
        // 加工状況フィルタ（完了日の有無で判定）
        if (status === 'completed') {
            data = data.filter(r => ppVal(r, 'kanryodate', 'completion_date', 'complete_date'));
        } else if (status === 'pending') {
            data = data.filter(r => !ppVal(r, 'kanryodate', 'completion_date', 'complete_date'));
        }
        // 旧V_加工進捗の並び: kanryodate → drawingno → partno
        data.sort((a, b) => {
            const kA = ppVal(a, 'kanryodate', 'completion_date', 'complete_date');
            const kB = ppVal(b, 'kanryodate', 'completion_date', 'complete_date');
            if (kA !== kB) return (kA || '').localeCompare(kB || '', undefined, { numeric: true });
            const dA = ppVal(a, 'drawingno');
            const dB = ppVal(b, 'drawingno');
            if (dA !== dB) return (dA || '').localeCompare(dB || '', undefined, { numeric: true });
            const pA = ppVal(a, 'partno');
            const pB = ppVal(b, 'partno');
            return (pA || '').localeCompare(pB || '', undefined, { numeric: true });
        });

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="22" style="text-align: center; padding: 40px; color: #94a3b8;">該当するデータが見つかりませんでした</td></tr>';
            const countEl = document.getElementById('pp-result-count');
            if (countEl) countEl.textContent = '0件';
            return;
        }

        // t_purchaseparts を一括取得し consecutive_no + construction_no + machine + unit でマップ化
        let _osMap = {};
        try {
            if (data.length > 0) {
                const constructNos = [...new Set(data.map(r => (ppVal(r, 'constructionno', 'constructno') || '').trim()).filter(Boolean))];
                if (constructNos.length > 0) {
                    const { data: osRows } = await supabase.from('t_purchaseparts')
                        .select('construction_no,symbol_machine,symbol_unit,consecutive_no,purchase_no,purchase_no_a,description,order_div,arrange_div,order_company_code,temp_company_name,order_date,delivery_date,update_nouki,nounyu_date,cancel_flg,each_price,qty')
                        .in('construction_no', constructNos).limit(5000);
                    if (osRows && osRows.length > 0) {
                        // 会社名を一括取得
                        const companyCodes = [...new Set(osRows.map(o => o.order_company_code).filter(Boolean))];
                        let companyMap = {};
                        if (companyCodes.length > 0) {
                            const { data: cc } = await supabase.from('t_companycode').select('companycode,companyname,shortname').in('companycode', companyCodes);
                            (cc || []).forEach(c => { companyMap[c.companycode] = c.shortname || c.companyname || ''; });
                        }
                        osRows.forEach(o => {
                            o._companyName = companyMap[o.order_company_code] || o.temp_company_name || '';
                            // キー：工事番号 + 機械 + ユニット + 通番（t_manufctparts.consecutiveno と対応）
                            const k = (o.construction_no || '').trim() + '___'
                                    + (o.symbol_machine || '').trim() + '___'
                                    + (o.symbol_unit || '').trim() + '___'
                                    + (o.consecutive_no || '').trim();
                            if (!_osMap[k]) _osMap[k] = [];
                            _osMap[k].push(o);
                        });
                    }
                }
            }
        } catch (e) { console.warn('[PP] 発注データ一括取得失敗:', e); }
        // グローバルに保存（印刷プレビュー・行選択で使用）
        window._ppOutsourceMap = _osMap;
        window._ppLastSearchData = data;
        window._ppLastConstructNo = constructNo;

        const countEl = document.getElementById('pp-result-count');
        if (countEl) countEl.textContent = `${data.length}件`;

        const fmtDate = (v) => { const s = String(v || ''); if (s.length >= 10) return s.slice(0, 10).replace(/-/g, '/'); return s; };

        tbody.innerHTML = '';
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.onclick = () => selectPPRow(tr, row);

            const hasKanryo = !!ppVal(row, 'kanryodate');
            const processSt = (ppVal(row, 'processstatus') || '').trim();
            const planCode  = (ppVal(row, 'plancode') || '').trim();
            const isCanceled = !!(row.cancelflg || processSt.includes('取消'));

            // 行背景色：DBのprocessstatusとplancodeを優先
            let bgColor = '';
            if (isCanceled)                                bgColor = '#e2e8f0'; // 取消
            else if (processSt === '加工完了' || hasKanryo) bgColor = '#e0f2fe'; // 加工完了
            else if (processSt === '加工中')                bgColor = '#cffafe'; // 加工中
            else if (processSt.includes('外注'))            bgColor = '#fef9c3'; // 外注関連
            else if (processSt.includes('材料') && processSt.includes('未')) bgColor = '#fee2e2'; // 材料未納
            else if (processSt.includes('材料'))            bgColor = '#ffedd5'; // 材料手配済
            tr.style.background = bgColor;

            // 外注・購入発注の件数（consecutive_no でリンク）
            const osKey = (ppVal(row, 'constructionno', 'constructno') || '').trim() + '___'
                        + (ppVal(row, 'symbolmachine') || '').trim() + '___'
                        + (ppVal(row, 'symbolunit') || '').trim() + '___'
                        + (ppVal(row, 'consecutiveno') || '').trim();
            const osItems = _osMap[osKey] || [];
            const osUndelivered = osItems.filter(o => !o.nounyu_date).length;
            const osDelivered   = osItems.filter(o =>  o.nounyu_date).length;
            let osCell = '';
            if (osItems.length > 0) {
                if (osUndelivered > 0)
                    osCell = `<span style="color:#d97706;font-weight:700;">${osUndelivered}件未</span>`;
                else
                    osCell = `<span style="color:#16a34a;font-weight:700;">${osDelivered}件納</span>`;
            }

            // plancode 表示：社内加工は空、外注は plancode 値をそのまま
            const planDisp = planCode || (processSt.includes('外注') ? '外注' : '社内');

            // processstatus バッジクラス
            const stLabel = processSt || (hasKanryo ? '加工完了' : '');
            let stBadgeClass = 'default';
            if (stLabel.includes('完了')) stBadgeClass = 'done';
            else if (stLabel.includes('加工中')) stBadgeClass = 'working';
            else if (stLabel.includes('未') || stLabel.includes('外注')) stBadgeClass = 'waiting';
            const stBadge = stLabel
                ? `<span class="pp-status-badge ${stBadgeClass}">${stLabel}</span>`
                : '';

            const shikyuBadge = row.shikyuflg
                ? `<span style="font-size:11px;font-weight:700;color:#b45309;background:#fef3c7;padding:2px 5px;border-radius:4px;">支給</span>`
                : '';

            const planBadge = planDisp
                ? `<span style="font-size:11px;font-weight:600;color:${planCode && planCode !== '社内' ? '#1d4ed8' : '#475569'};background:${planCode && planCode !== '社内' ? '#dbeafe' : '#f1f5f9'};padding:2px 6px;border-radius:4px;">${planDisp}</span>`
                : '';

            tr.innerHTML = `
                <td style="text-align: center;"><input type="checkbox" value="${index}"></td>
                <td style="font-weight:600;">${(ppVal(row, 'constructionno', 'constructno') || '').trim()}</td>
                <td>${(ppVal(row, 'symbolmachine') || '').trim()}</td>
                <td>${(ppVal(row, 'symbolunit') || '').trim()}</td>
                <td style="text-align:center;">${planBadge}</td>
                <td style="text-align:center;">${shikyuBadge}</td>
                <td style="font-family:monospace;font-size:12px;">${(ppVal(row, 'drawingno') || '').trim()}</td>
                <td style="text-align:center;">${(ppVal(row, 'partno') || '').trim()}</td>
                <td style="font-weight:500;">${ppVal(row, 'description')}</td>
                <td>${ppVal(row, 'materialcode')}</td>
                <td style="text-align:right;">${ppVal(row, 'qty')}</td>
                <td style="text-align:right;">${ppVal(row, 'spareqty')}</td>
                <td>${ppVal(row, 'qtyunit')}</td>
                <td style="text-align:right;">${ppVal(row, 'weightmaterial')}</td>
                <td style="text-align:right;">${ppVal(row, 'weightfinished')}</td>
                <td>${fmtDate(ppVal(row, 'printdate'))}</td>
                <td></td>
                <td></td>
                <td>${osCell}</td>
                <td></td>
                <td>${fmtDate(ppVal(row, 'kanryodate'))}</td>
                <td>${stBadge}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error('searchProcessingProgress error:', e);
        tbody.innerHTML = `<tr><td colspan="22" style="text-align: center; padding: 20px; color: #ef4444;">エラーが発生しました: ${e.message}</td></tr>`;
        const countEl = document.getElementById('pp-result-count');
        if (countEl) countEl.textContent = '—';
    }
}

// 行選択時の処理
async function selectPPRow(tr, row) {
    const tbody = tr.parentElement;
    tbody.querySelectorAll('tr').forEach(r => { r.style.outline = 'none'; r.removeAttribute('data-pp-selected'); });
    tr.style.outline = '2px solid var(--primary)';
    tr.style.outlineOffset = '-2px';
    tr.setAttribute('data-pp-selected', 'true');

    const drawingNo     = (ppVal(row, 'drawingno') || '').trim();
    const partNo        = (ppVal(row, 'partno') || '').trim();
    const constructNo   = (ppVal(row, 'constructionno', 'constructno') || '').trim();
    const machine       = (ppVal(row, 'symbolmachine') || '').trim();
    const unit          = (ppVal(row, 'symbolunit') || '').trim();
    const consecutiveNo = (ppVal(row, 'consecutiveno') || '').trim();

    await loadPPSubTables(drawingNo, partNo, constructNo, machine, unit, consecutiveNo);
}

// サブテーブル（加工作業、発注データ）のロード
async function loadPPSubTables(drawingNo, partNo, constructNo, machine, unit, consecutiveNo) {
    const workTbody     = document.getElementById('pp-work-table-body');
    const materialTbody = document.getElementById('pp-material-table-body');
    const outsourceTbody= document.getElementById('pp-outsource-table-body');

    const loadingRow = (cols) => `<tr><td colspan="${cols}" style="text-align:center;padding:14px;font-size:20px;">🐻‍❄️</td></tr>`;
    workTbody.innerHTML      = loadingRow(6);
    materialTbody.innerHTML  = loadingRow(8);
    outsourceTbody.innerHTML = loadingRow(9);

    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const sv  = (o, ...ks) => { for (const k of ks) { const v = o[k]; if (v !== undefined && v !== null && v !== '') return String(v); } return ''; };
        const sd  = (o, ...ks) => { const s = sv(o, ...ks); return s.length >= 10 ? s.slice(0,10).replace(/-/g,'/') : s; };
        const none = (cols, msg) => `<tr><td colspan="${cols}" style="text-align:center;padding:10px;color:#94a3b8;">${msg||'データなし'}</td></tr>`;

        // ── 1. 加工作業履歴（t_worktimekako）
        const workTable = await findTableName(['t_worktimekako', 'T_WorkTimeKako', 't_sagyofl', 't_worktime']);
        if (workTable) {
            const { data: wData } = await supabase.from(workTable).select('*')
                .eq('drawingno', drawingNo).eq('partno', partNo).limit(200);
            workTbody.innerHTML = '';
            if (wData && wData.length > 0) {
                wData.forEach(w => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${sd(w,'WorkDate','workdate','work_date')}</td>
                        <td>${sv(w,'WorkCode','workcode','work_code')}</td>
                        <td>${sv(w,'WorkName','workname','work_name')}</td>
                        <td>${sv(w,'Quantity','quantity')}</td>
                        <td>${sv(w,'WorkTime','worktime','work_time')}</td>
                        <td>${sv(w,'StaffName','staffname','staff_name')}</td>
                    `;
                    workTbody.appendChild(tr);
                });
            } else {
                workTbody.innerHTML = none(6);
            }
        } else {
            workTbody.innerHTML = none(6, '工数テーブル未作成');
        }

        // ── 2 & 3. t_purchaseparts から発注データ取得
        //    consecutiveNo（通番）で該当部品の発注を特定
        if (!constructNo) {
            materialTbody.innerHTML  = none(8);
            outsourceTbody.innerHTML = none(9);
            return;
        }

        // 既にグローバルにキャッシュがあれば再利用
        const cachedMap = window._ppOutsourceMap || {};
        const cacheKey = constructNo.trim() + '___' + (machine||'').trim() + '___' + (unit||'').trim() + '___' + (consecutiveNo||'').trim();
        let ppRows = cachedMap[cacheKey] || null;

        if (!ppRows) {
            // キャッシュにない場合は都度クエリ（検索ではなく行選択時）
            let q = supabase.from('t_purchaseparts')
                .select('purchase_no,purchase_no_a,consecutive_no,description,order_div,arrange_div,order_company_code,temp_company_name,order_date,delivery_date,update_nouki,nounyu_date,cancel_flg,qty,each_price')
                .eq('construction_no', constructNo.trim());
            if (machine) q = q.ilike('symbol_machine', machine.trim() + '%');
            if (unit)    q = q.ilike('symbol_unit',    unit.trim()    + '%');
            if (consecutiveNo) q = q.eq('consecutive_no', consecutiveNo.trim());
            const { data: pd } = await q.limit(500);
            ppRows = pd || [];
            // 会社名マップ
            const codes = [...new Set(ppRows.map(o => o.order_company_code).filter(Boolean))];
            if (codes.length > 0) {
                const { data: cc } = await supabase.from('t_companycode').select('companycode,shortname,companyname').in('companycode', codes);
                const cm = {}; (cc||[]).forEach(c => { cm[c.companycode] = c.shortname||c.companyname||''; });
                ppRows.forEach(o => { o._companyName = cm[o.order_company_code] || o.temp_company_name || ''; });
            } else {
                ppRows.forEach(o => { o._companyName = o.temp_company_name || ''; });
            }
        }

        // 材料テーブル（arrange_div が '材料' 系 or 全件）
        materialTbody.innerHTML = '';
        if (ppRows.length > 0) {
            ppRows.forEach(m => {
                const effDate = m.update_nouki || m.delivery_date;
                const isDelivered = !!m.nounyu_date;
                const tr = document.createElement('tr');
                tr.style.background = isDelivered ? '#f0fdf4' : (!m.order_date ? '#fef9c3' : '');
                tr.innerHTML = `
                    <td>${sv(m,'purchase_no')}</td>
                    <td>${sv(m,'description')}</td>
                    <td style="font-size:11px;">${sv(m,'order_div','arrange_div')}</td>
                    <td>${m._companyName||''}</td>
                    <td>${sd(m,'order_date')}</td>
                    <td>${sd(null,'_',effDate)|| (effDate?String(effDate).slice(0,10).replace(/-/g,'/'):'')}</td>
                    <td>${sd(m,'nounyu_date')}</td>
                    <td>${sv(m,'consecutive_no')}</td>
                `;
                materialTbody.appendChild(tr);
            });
        } else {
            materialTbody.innerHTML = none(8);
        }

        // 外注テーブル（仕様：発注日・納期・更新納期・納入日・返却日・再納入日・検収日）
        outsourceTbody.innerHTML = '';
        if (ppRows.length > 0) {
            ppRows.forEach(o => {
                const effDate = o.update_nouki || o.delivery_date;
                const isDelivered = !!o.nounyu_date;
                const tr = document.createElement('tr');
                tr.style.background = isDelivered ? '#f0fdf4' : '';
                tr.innerHTML = `
                    <td>${sv(o,'purchase_no')}</td>
                    <td>${sv(o,'description')}</td>
                    <td style="text-align:right;">${sv(o,'qty')}</td>
                    <td>${o._companyName||''}</td>
                    <td>${sd(o,'order_date')}</td>
                    <td>${sd(o,'delivery_date')}</td>
                    <td style="${o.update_nouki?'color:#d97706;font-weight:600;':''}">${o.update_nouki?String(o.update_nouki).slice(0,10).replace(/-/g,'/'):'—'}</td>
                    <td style="${isDelivered?'color:#16a34a;font-weight:600;':''}">${sd(o,'nounyu_date')||'—'}</td>
                    <td></td>
                `;
                outsourceTbody.appendChild(tr);
            });
        } else {
            outsourceTbody.innerHTML = none(9);
        }

    } catch (e) {
        console.error('loadPPSubTables error:', e);
    }
}

// 検索クリア
function clearPPSearch() {
    document.getElementById('pp-filter-construct-no').value = '';
    document.getElementById('pp-filter-machine').value = '';
    document.getElementById('pp-filter-unit').value = '';
    document.getElementById('pp-filter-drawing-no').value = '';
    const partNoEl = document.getElementById('pp-filter-part-no');
    const keydateEl = document.getElementById('pp-filter-keydate');
    if (partNoEl) partNoEl.value = '';
    if (keydateEl) {
        keydateEl.innerHTML = '<option value="">― 工事番号を入力 ―</option>';
    }
    document.querySelector('input[name="pp-status"][value="all"]').checked = true;
    const countEl = document.getElementById('pp-result-count');
    if (countEl) countEl.textContent = '—';
    document.getElementById('pp-main-table-body').innerHTML = '<tr><td colspan="22" class="pp-empty-msg">条件を入力して「検索」を押すか、そのまま検索で一覧を表示します（Enterでも検索）</td></tr>';
    document.getElementById('pp-work-table-body').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #cbd5e1;">行を選択してください</td></tr>';
    document.getElementById('pp-material-table-body').innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #cbd5e1;">行を選択してください</td></tr>';
    document.getElementById('pp-outsource-table-body').innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #cbd5e1;">行を選択してください</td></tr>';
}

// ── 加工進捗一覧 印刷プレビュー ──────────────────────────────
async function printProcessingProgress() {
    const data = window._ppLastSearchData || [];
    if (data.length === 0) {
        alert('先に検索ボタンで一覧を表示してから印刷プレビューを開いてください。');
        return;
    }

    const constructNo = window._ppLastConstructNo || '';
    const osMap = window._ppOutsourceMap || {};
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

    // 機械・ユニット取得
    const machineEl = document.getElementById('pp-filter-machine');
    const unitEl = document.getElementById('pp-filter-unit');
    const machine = machineEl ? machineEl.value : '';
    const unit = unitEl ? unitEl.value : '';
    const kojiLabel = constructNo + (machine ? machine : '') + (unit ? unit : '');

    // MM/DD 形式変換
    function mmdd(v) {
        const s = String(v || '');
        const m = s.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
        if (m) return m[2] + '/' + m[3];
        if (s.length === 5 && s.includes('/')) return s;
        return s.slice(0, 5) || '';
    }
    function os(o, ...keys) { for (const k of keys) { const v = o[k]; if (v !== undefined && v !== null && v !== '') return String(v); } return ''; }

    // 行生成
    let rows = '';
    data.forEach(row => {
        const drawingNo = ppVal(row, 'drawingno');
        const partNo    = ppVal(row, 'partno');
        const name      = ppVal(row, 'description', 'partname');
        const qty       = ppVal(row, 'qty', 'quantity');
        const material  = ppVal(row, 'materialcode', 'material');
        const naikoInfo = ppVal(row, 'internal_info', 'naikojokyo') || '';
        const kanryo    = ppVal(row, 'kanryodate', 'completion_date', 'complete_date');
        const fmtKanryo = kanryo ? String(kanryo).slice(0, 10).replace(/-/g, '/') : '';

        // 外注テキスト生成（t_purchaseparts: construction_no + symbol_machine + symbol_unit キー）
        const osKey  = (ppVal(row, 'constructionno', 'constructno') || '').trim() + '___' + (ppVal(row, 'symbolmachine') || '').trim() + '___' + (ppVal(row, 'symbolunit') || '').trim();
        const osList = osMap[osKey] || [];
        let osLines  = osList.map(o => {
            const sup    = o._companyName || os(o, 'temp_company_name', 'order_company_code');
            const oDate  = mmdd(os(o, 'order_date'));
            const nouki  = mmdd(os(o, 'delivery_date'));
            const nouny  = mmdd(os(o, 'nounyu_date'));
            const kname  = os(o, 'description', 'order_div');
            const parts  = [];
            if (sup)   parts.push(sup + ':');
            if (oDate) parts.push('発注 ' + oDate);
            if (nouki) parts.push('納期 ' + nouki);
            if (nouny) parts.push('納入 ' + nouny);
            if (kname) parts.push(kname);
            return parts.join(' ');
        }).filter(Boolean);

        // 外注情報がない場合、t_manufctparts のカラムから補完
        if (osLines.length === 0) {
            const rawOsInfo = ppVal(row, 'outsource_info', 'gaichuu_info', 'gaichuuinfo');
            if (rawOsInfo) osLines = [rawOsInfo];
        }

        const osHtml = osLines.map(l => `<div style="border-bottom:1px dotted #ccc;padding:1px 0;min-height:14px;">${l}</div>`).join('') || '<div style="min-height:14px;"></div>';

        rows += `<tr>
            <td class="c-henko">----</td>
            <td class="c-draw">${drawingNo}</td>
            <td class="c-pno">${partNo}</td>
            <td class="c-name">${name}</td>
            <td class="c-qty">${qty}</td>
            <td class="c-mat">${material}</td>
            <td class="c-naiko">${naikoInfo}</td>
            <td class="c-os">${osHtml}</td>
            <td class="c-biko">${ppVal(row, 'biko', 'note', 'memo', '備考') || ''}</td>
            <td class="c-kanryo">${fmtKanryo}</td>
        </tr>`;
    });

    const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<title>加工進捗一覧 ${kojiLabel}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'MS Gothic','ＭＳ ゴシック','Meiryo',sans-serif;font-size:9pt;background:white;padding:8mm 10mm;}
.ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.ph-koji{border:2px solid #000;padding:3px 14px;font-size:13pt;font-weight:bold;letter-spacing:0.05em;}
.ph-title{font-size:15pt;font-weight:bold;}
.ph-date{font-size:9pt;}
table{width:100%;border-collapse:collapse;font-size:8.5pt;}
th{background:#e8e8e8;border:1px solid #666;padding:3px 4px;text-align:center;font-weight:bold;white-space:nowrap;font-size:8pt;}
td{border:1px solid #999;padding:2px 3px;vertical-align:top;}
.c-henko{width:28px;color:#777;font-size:7pt;text-align:center;}
.c-draw{min-width:76px;font-size:8.5pt;white-space:nowrap;}
.c-pno{width:26px;text-align:center;}
.c-name{min-width:68px;}
.c-qty{width:34px;text-align:center;}
.c-mat{width:62px;font-size:8pt;}
.c-naiko{width:68px;font-size:8pt;color:#1a3a6b;}
.c-os{min-width:220px;font-size:8pt;color:#1a3a6b;line-height:1.5;}
.c-biko{min-width:48px;}
.c-kanryo{width:62px;text-align:center;}
tfoot td{border:none;text-align:center;padding-top:4px;font-size:8pt;color:#666;}
@media print{
    body{padding:5mm 8mm;}
    @page{size:A4 landscape;margin:8mm;}
    .no-print{display:none!important;}
}
</style></head><body>
<div class="no-print" style="text-align:right;margin-bottom:6px;">
    <button onclick="window.print()" style="padding:6px 18px;background:#1d4ed8;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:bold;">🖨 印刷する</button>
    <button onclick="window.close()" style="padding:6px 14px;background:#64748b;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;margin-left:8px;">✕ 閉じる</button>
</div>
<div class="ph">
    <div class="ph-koji">${kojiLabel}</div>
    <div class="ph-title">加工進捗一覧</div>
    <div class="ph-date">印刷日&nbsp;&nbsp;${today}</div>
</div>
<table>
<thead><tr>
    <th>変更</th><th>図面番号</th><th>品<br>番</th><th>品名</th><th>製作<br>数</th>
    <th>材&nbsp;&nbsp;料</th><th>社内加工</th><th style="min-width:220px;">外&nbsp;&nbsp;注</th><th>備考</th><th>加工完了日</th>
</tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="10">${data.length} 件</td></tr></tfoot>
</table>
</body></html>`;

    const win = window.open('', '_blank', 'width=1200,height=750,scrollbars=yes');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        alert('ポップアップがブロックされています。ブラウザのポップアップ許可設定を確認してください。');
    }
}
function printSelectedParts() {
    // チェックされた行のみを印刷プレビューに出力
    const checked = document.querySelectorAll('#pp-main-table-body input[type="checkbox"]:checked');
    if (checked.length === 0) {
        const msg = document.getElementById('pp-result-count');
        if (msg) {
            const orig = msg.textContent;
            msg.textContent = '⚠ 行を選択してください';
            msg.style.color = '#dc2626';
            setTimeout(() => { msg.textContent = orig; msg.style.color = ''; }, 2500);
        }
        return;
    }
    const allData = window._ppLastSearchData || [];
    const selectedData = Array.from(checked).map(cb => allData[parseInt(cb.value)]).filter(Boolean);
    const orig = window._ppLastSearchData;
    window._ppLastSearchData = selectedData;
    printProcessingProgress();
    window._ppLastSearchData = orig;
}

// グローバルに公開
window.initializeProcessingProgressPage = initializeProcessingProgressPage;
window.searchProcessingProgress = searchProcessingProgress;
window.clearPPSearch = clearPPSearch;
window.printProcessingProgress = printProcessingProgress;
window.printSelectedParts = printSelectedParts;
window.selectPPRow = selectPPRow;

// ========== 機械の加工進捗状況 ==========
function initMachineProgressPage() {
    var calcBtn = document.getElementById('mp-calc-btn');
    if (calcBtn) calcBtn.onclick = runMachineProgressCalc;
    var orderDate = document.getElementById('mp-order-date');
    if (orderDate && !orderDate.value) orderDate.value = new Date().toISOString().slice(0, 10);
    document.querySelectorAll('.mp-filter-btn').forEach(function(btn) {
        btn.onclick = function() { setMachineProgressFilter(btn.getAttribute('data-filter')); };
    });
    loadMachineProgressMachineOptions();
}

function loadMachineProgressMachineOptions() {
    var supabase = getSupabaseClient();
    if (!supabase) return;
    findTableName(['t_machinecode', 'T_MachineCode', 'machinecode']).then(function(machineTable) {
        if (!machineTable) return;
        supabase.from(machineTable).select('machinecode, machinename').order('machinecode').then(function(_ref) {
            var data = _ref.data;
            var select = document.getElementById('mp-machine');
            if (!select || !data) return;
            select.innerHTML = '<option value="">—</option>';
            data.forEach(function(m) {
                var code = (m.machinecode != null ? m.machinecode : m.MachineCode || '').toString().trim();
                var name = (m.machinename != null ? m.machinename : m.MachineName || '').toString().trim();
                var option = document.createElement('option');
                option.value = code;
                option.textContent = code ? (name ? code + ' : ' + name : code) : name || '(未設定)';
                select.appendChild(option);
            });
        });
    });
}

function setMachineProgressFilter(filter) {
    console.log('機械進捗フィルター:', filter);
}

function runMachineProgressCalc() {
    var constructNo = document.getElementById('mp-construct-no');
    var tbody = document.getElementById('machine-progress-tbody');
    if (!tbody) return;
    var no = (constructNo && constructNo.value) ? constructNo.value.trim() : '';
    if (!no) {
        tbody.innerHTML = '<tr><td colspan="8" class="mp-empty">工事番号を入力し「計算」を押してください</td></tr>';
        return;
    }
    tbody.innerHTML = '<tr><td colspan="8" class="mp-empty"><i class="fas fa-spinner fa-spin"></i> 取得中...</td></tr>';
    loadMachineProgressData(no).then(function(rows) {
        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="mp-empty">該当データはありません</td></tr>';
            return;
        }
        var html = '';
        rows.forEach(function(r) {
            html += '<tr><td>' + escapeHtml(r.unit || '') + '</td><td>' + (r.drawCount != null ? r.drawCount : '') + '</td><td>' + (r.unprocessed != null ? r.unprocessed : '') + '</td><td>' + (r.inProgress != null ? r.inProgress : '') + '</td><td>' + (r.complete != null ? r.complete : '') + '</td><td>' + (r.outsourcePartial != null ? r.outsourcePartial : '') + '</td><td>' + (r.outsourceFull != null ? r.outsourceFull : '') + '</td><td>' + (r.percent != null ? r.percent + '%' : '') + '</td></tr>';
        });
        tbody.innerHTML = html;
    }).catch(function() {
        tbody.innerHTML = '<tr><td colspan="8" class="mp-empty">取得に失敗しました</td></tr>';
    });
    loadMachineProgressHeader(no);
}

function loadMachineProgressHeader(constructNo) {
    var supabase = getSupabaseClient();
    if (!supabase) return;
    var tbl = 't_acceptorder';
    var col = 'constructno';
    supabase.from(tbl).select('orderdate, constructno, machine, customername, deliveryto, salesperson, projectname, shipdate').eq(col, constructNo).limit(1).maybeSingle().then(function(_ref) {
        var data = _ref.data;
        var err = _ref.error;
        if (err || !data) return;
        var orderDate = document.getElementById('mp-order-date');
        if (orderDate) orderDate.value = (data.orderdate || data.OrderDate || '').toString().slice(0, 10);
        var machine = document.getElementById('mp-machine');
        if (machine) { machine.value = data.machine || data.Machine || ''; }
        var client = document.getElementById('mp-client');
        if (client) client.value = data.customername || data.customer_name || data.CustomerName || '';
        var delivery = document.getElementById('mp-delivery-to');
        if (delivery) delivery.value = data.deliveryto || data.delivery_to || data.DeliveryTo || '';
        var sales = document.getElementById('mp-sales');
        if (sales) sales.value = data.salesperson || data.sales_person || data.SalesPerson || '';
        var project = document.getElementById('mp-project-name');
        if (project) project.value = data.projectname || data.project_name || data.ProjectName || '';
        var ship = document.getElementById('mp-ship-date');
        if (ship) ship.value = (data.shipdate || data.ShipDate || '').toString().slice(0, 10);
    });
}

async function loadMachineProgressData(constructNo) {
    var supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
        var tbl = await findTableName(['t_manufctparts', 't_zumendata_manufct', 'v_加工進捗']);
        if (!tbl) return [];
        var _ref2 = await supabase.from(tbl).select('unit, constructno').eq('constructno', constructNo);
        var data = _ref2.data || [];
        var byUnit = {};
        data.forEach(function(r) {
            var u = (r.unit || r.Unit || '').toString().trim() || '—';
            if (!byUnit[u]) byUnit[u] = { unit: u, drawCount: 0, unprocessed: 0, inProgress: 0, complete: 0, outsourcePartial: 0, outsourceFull: 0, percent: '0.00' };
            byUnit[u].drawCount += 1;
            byUnit[u].complete += 1;
        });
        return Object.keys(byUnit).sort().map(function(k) {
            var o = byUnit[k];
            o.percent = o.drawCount ? ((o.complete / o.drawCount) * 100).toFixed(2) : '0.00';
            return o;
        });
    } catch (e) { return []; }
}

// ========== 納入予定カレンダー ==========
let deliveryCalYear = new Date().getFullYear();
let deliveryCalMonth = new Date().getMonth() + 1;
let deliveryCalCategory = 'purchased';
let deliveryCalCountByDate = {}; // { "YYYY-MM-DD": number }

function initDeliveryCalendarPage() {
    const now = new Date();
    deliveryCalYear = now.getFullYear();
    deliveryCalMonth = now.getMonth() + 1;
    deliveryCalCategory = 'purchased';
    document.querySelectorAll('.delivery-cal-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector('.delivery-cal-tab[data-category="purchased"]');
    if (activeTab) activeTab.classList.add('active');
    document.getElementById('delivery-cal-undelivered-only').checked = true;
    var calPage = document.getElementById('delivery-calendar-page');
    if (calPage) calPage.setAttribute('data-category', 'purchased');

    document.getElementById('delivery-cal-prev').onclick = () => { deliveryCalMonth--; if (deliveryCalMonth < 1) { deliveryCalMonth = 12; deliveryCalYear--; } renderDeliveryCalendar(); };
    document.getElementById('delivery-cal-next').onclick = () => { deliveryCalMonth++; if (deliveryCalMonth > 12) { deliveryCalMonth = 1; deliveryCalYear++; } renderDeliveryCalendar(); };
    document.querySelectorAll('.delivery-cal-tab').forEach(t => {
        t.onclick = () => {
            document.querySelectorAll('.delivery-cal-tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            deliveryCalCategory = t.getAttribute('data-category');
            if (calPage) calPage.setAttribute('data-category', deliveryCalCategory || 'purchased');
            renderDeliveryCalendar();
        };
    });
    document.getElementById('delivery-cal-undelivered-only').addEventListener('change', () => renderDeliveryCalendar());

    renderDeliveryCalendar();
}

function renderDeliveryCalendar() {
    const yearMonthEl = document.getElementById('delivery-cal-year-month');
    if (yearMonthEl) yearMonthEl.textContent = `${deliveryCalYear} 年 ${deliveryCalMonth} 月`;

    const undeliveredOnly = document.getElementById('delivery-cal-undelivered-only')?.checked !== false;
    loadDeliveryCalendarData(deliveryCalYear, deliveryCalMonth, deliveryCalCategory, undeliveredOnly).then(countByDate => {
        deliveryCalCountByDate = countByDate || {};
        const tbody = document.getElementById('delivery-cal-body');
        if (!tbody) return;

        const first = new Date(deliveryCalYear, deliveryCalMonth - 1, 1);
        const last = new Date(deliveryCalYear, deliveryCalMonth, 0);
        const startDow = first.getDay();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';
        for (let row = 0; row < 5; row++) {
            html += '<tr>';
            for (let col = 0; col < 7; col++) {
                const dayOffset = 1 - startDow + row * 7 + col;
                const d = new Date(deliveryCalYear, deliveryCalMonth - 1, dayOffset);
                const y = d.getFullYear(), m = d.getMonth() + 1, date = d.getDate();
                const key = `${y}-${String(m).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                const count = deliveryCalCountByDate[key] || 0;
                const isOtherMonth = d.getMonth() !== deliveryCalMonth - 1;
                const isToday = d.getTime() === today.getTime();
                const isWeekend = col === 0 || col === 6;
                const cls = [isOtherMonth ? 'other-month' : '', isToday ? 'today' : '', isWeekend ? 'weekend' : ''].filter(Boolean).join(' ');
                const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                html += `<td class="${cls}" data-date="${dateStr}"><span class="cal-date">${date}</span><span class="cal-count">${count}</span></td>`;
            }
            html += '</tr>';
        }
        tbody.innerHTML = html;
        attachDeliveryCalCellClick();
        scrollCalendarToToday();
    });
}

function scrollCalendarToToday() {
    requestAnimationFrame(function() {
        var wrap = document.querySelector('.delivery-cal-grid-wrap');
        if (!wrap) return;
        var todayTd = document.querySelector('#delivery-cal-grid td.today');
        if (!todayTd) return;
        var tr = todayTd.closest('tr');
        if (!tr) return;
        var table = document.getElementById('delivery-cal-grid');
        var theadH = table && table.tHead ? table.tHead.offsetHeight : 0;
        var trTop = tr.offsetTop;
        /* 今日の行がヘッダー直下～やや上に来る位置（ヘッダーに重ならず、下にも寄りすぎない） */
        wrap.scrollTop = Math.max(0, theadH + trTop - 24);
    });
}

function attachDeliveryCalCellClick() {
    const grid = document.getElementById('delivery-cal-grid');
    if (!grid) return;
    grid.removeEventListener('click', onDeliveryCalGridClick);
    grid.addEventListener('click', onDeliveryCalGridClick);
}
function onDeliveryCalGridClick(e) {
    const td = e.target.closest('td');
    if (!td || !td.dataset.date) return;
    openDeliveryDetailModal(td.dataset.date);
}

let deliveryDetailCurrentDate = '';
let deliveryDetailCurrentCategory = 'purchased';

function openDeliveryDetailModal(dateStr) {
    deliveryDetailCurrentDate = dateStr;
    deliveryDetailCurrentCategory = deliveryCalCategory || 'purchased';
    const modal = document.getElementById('delivery-detail-modal');
    const dateEl = document.getElementById('delivery-detail-date');
    if (dateEl) dateEl.textContent = dateStr.replace(/-/g, '/');
    if (modal) modal.style.display = 'flex';
    document.querySelectorAll('#delivery-detail-tabs .delivery-detail-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-category') === deliveryDetailCurrentCategory);
    });
    renderDeliveryDetailTable();
    document.querySelectorAll('#delivery-detail-tabs .delivery-detail-tab').forEach(t => {
        t.onclick = () => {
            deliveryDetailCurrentCategory = t.getAttribute('data-category');
            document.querySelectorAll('#delivery-detail-tabs .delivery-detail-tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            renderDeliveryDetailTable();
        };
    });
}

function closeDeliveryDetailModal() {
    const modal = document.getElementById('delivery-detail-modal');
    if (modal) modal.style.display = 'none';
}

function renderDeliveryDetailTable() {
    const tbody = document.getElementById('delivery-detail-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:24px;color:#64748b;">読み込み中...</td></tr>';
    loadDeliveryDetailData(deliveryDetailCurrentDate, deliveryDetailCurrentCategory).then(rows => {
        tbody.innerHTML = '';
        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:24px;color:#64748b;">該当データはありません</td></tr>';
            return;
        }
        // 小文字・キャメルケース両対応のゲッター
        const get = (r, ...keys) => {
            for (const k of keys) {
                let v = r[k];
                if (v === undefined && typeof k === 'string') {
                    const low = k.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
                    v = r[low] ?? r[k.replace(/_/g, '')] ?? r[k.toLowerCase()];
                }
                if (v !== undefined && v !== null && v !== '') return String(v);
            }
            return '';
        };
        // 有効納期（update_nouki優先）
        const getEffDate = (r) => {
            const upd = get(r, 'update_nouki', 'updatenouki', 'deliveryupdatedate');
            return upd || get(r, 'delivery_date', 'deliverydate');
        };
        rows.forEach((r, i) => {
            const tr = document.createElement('tr');
            if (i === 0) tr.classList.add('selected');
            const updatenouki = get(r, 'update_nouki', 'updatenouki', 'deliveryupdatedate');
            const deliverydate = get(r, 'delivery_date', 'deliverydate');
            // 更新納期セル（更新があれば強調）
            const updCell = updatenouki
                ? `<td style="color:#d97706;font-weight:600;">${escapeHtml(updatenouki)}</td>`
                : `<td style="color:#94a3b8;">—</td>`;
            // 発注先名（t_companycode から取得済み）
            const supplierName = r._supplierName ||
                get(r, 'supplier', 'Supplier', 'suppliername', 'companyname', 'order_to');
            tr.innerHTML =
                '<td>' + escapeHtml(get(r, 'purchase_no', 'orderno', 'order_no')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'purchase_no_a', 'batchorderno', 'batch_order_no')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'construction_no', 'constructno', 'construct_no')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'symbol_machine', 'symbolmachine', 'machine')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'symbol_unit', 'symbolunit', 'unit')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'consecutive_no', 'consecutiveno', 'tsuuban')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'description', 'partname', 'product_name', 'itemname')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'dimension_type', 'dimension', 'spec', 'model')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'qty', 'quantity', 'order_qty')) + '</td>' +
                '<td>' + escapeHtml(get(r, 'qty_unit', 'unitname', 'unit_name')) + '</td>' +
                '<td>' + escapeHtml(deliverydate) + '</td>' +
                updCell +
                '<td>' + escapeHtml(get(r, 'order_person', 'orderer', 'staffcode')) + '</td>' +
                '<td>' + escapeHtml(supplierName) + '</td>' +
                '<td>' + escapeHtml(get(r, 'comment', 'Comment', 'remarks', '備考')) + '</td>';
            tr.addEventListener('click', () => { tbody.querySelectorAll('tr').forEach(x => x.classList.remove('selected')); tr.classList.add('selected'); });
            tbody.appendChild(tr);
        });
    });
}

async function loadDeliveryDetailData(dateStr, category) {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
        let tbl = null;
        if (category === 'purchased') {
            tbl = await findTableName(['t_purchaseparts']);
        } else if (category === 'outsource' || category === 'material') {
            tbl = await findTableName(['t_purchase', 't_manufctpurchase']);
        } else if (category === 'misc') {
            tbl = await findTableName(['t_expense', 't_misc']);
        }
        if (!tbl) return [];

        // update_nouki優先：有効納期 = dateStr のレコードを取得
        // (delivery_date=dateStr AND update_nouki IS NULL) OR update_nouki=dateStr
        let { data, error } = await supabase.from(tbl).select('*')
            .or(`and(delivery_date.eq.${dateStr},update_nouki.is.null),update_nouki.eq.${dateStr}`);
        if (error || !data || data.length === 0) {
            // フォールバック: delivery_date で単純一致
            const { data: d2 } = await supabase.from(tbl).select('*').eq('delivery_date', dateStr);
            data = d2 || [];
        }
        if (!data || data.length === 0) return [];

        // 発注先名を t_companycode から取得
        const companyCodes = [...new Set(data.map(r =>
            r.order_company_code || r.suppliercode || r.companycode || r.supplier_code || r.vendercode || r.vendorcode
        ).filter(Boolean))];
        let companyMap = {};
        if (companyCodes.length > 0) {
            const compTbl = await findTableName(['t_companycode']);
            if (compTbl) {
                const { data: companies } = await supabase.from(compTbl)
                    .select('companycode,shortname')
                    .in('companycode', companyCodes);
                (companies || []).forEach(c => {
                    companyMap[c.companycode] = c.shortname || '';
                });
            }
        }
        // 各行に発注先名を付与
        return data.map(r => ({
            ...r,
            _supplierName: companyMap[r.order_company_code || r.suppliercode || r.companycode || r.supplier_code || r.vendercode || r.vendorcode] || ''
        }));
    } catch (e) {
        console.warn('loadDeliveryDetailData error:', e);
    }
    return [];
}
window.closeDeliveryDetailModal = closeDeliveryDetailModal;
window.openDeliveryDetailModal = openDeliveryDetailModal;
function buildDeliveryPrintWindow(autoprint) {
    const dateEl = document.getElementById('delivery-detail-date');
    const dateText = dateEl ? dateEl.textContent.trim() : '';
    const activeTab = document.querySelector('#delivery-detail-tabs .delivery-detail-tab.active');
    const categoryText = activeTab ? activeTab.textContent.trim() : '';
    const thead = document.querySelector('#delivery-detail-modal thead');
    const tbody = document.getElementById('delivery-detail-tbody');
    if (!thead || !tbody) return;

    const theadHtml = thead.outerHTML;
    const tbodyHtml = tbody.outerHTML;

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>納入予定詳細 ${dateText}</title>
<style>
  body { font-family: 'Meiryo', 'メイリオ', sans-serif; font-size: 11px; margin: 12px; color: #1e293b; }
  h2 { font-size: 14px; margin: 0 0 4px 0; }
  p { margin: 0 0 8px 0; font-size: 11px; color: #475569; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { background: #1e293b; color: #fff; padding: 5px 6px; font-size: 10px; text-align: left; border: 1px solid #334155; white-space: nowrap; }
  td { padding: 4px 6px; border: 1px solid #cbd5e1; vertical-align: top; word-break: break-all; }
  tr:nth-child(even) td { background: #f8fafc; }
  tr.selected td { background: #fff !important; }
  @page { size: A4 landscape; margin: 10mm; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h2>納入予定詳細　${dateText}　${categoryText}</h2>
<p>印刷日時: ${new Date().toLocaleString('ja-JP')}</p>
<table><${theadHtml}<${tbodyHtml}</table>
${autoprint ? '<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}};<\/script>' : ''}
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=700');
    if (win) {
        win.document.write(html);
        win.document.close();
    }
}
window.printDeliveryDetailPreview = function() { buildDeliveryPrintWindow(false); };
window.printDeliveryDetail = function() { buildDeliveryPrintWindow(true); };

async function loadDeliveryCalendarData(year, month, category, undeliveredOnly) {
    const countByDate = {};
    const supabase = getSupabaseClient();
    if (!supabase) return countByDate;

    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // update_nouki優先で有効納期を返す（なければdelivery_date）
    const toKey = (d) => d ? String(d).slice(0, 10) : '';
    const getEffectiveDate = (r) => {
        const upd = r.update_nouki || r.updatenouki || r.deliveryupdatedate;
        const del = r.delivery_date || r.deliverydate;
        return toKey(upd || del);
    };

    // delivery_date または update_nouki が月内にあるレコードを取得し、有効納期で集計
    const buildCalQuery = async (tblName, nounyuCol) => {
        // update_nouki IS NULL → delivery_date が月内、または update_nouki が月内
        let q = supabase.from(tblName)
            .select(`delivery_date,update_nouki,${nounyuCol}`)
            .or(`and(delivery_date.gte.${monthStart},delivery_date.lte.${monthEnd},update_nouki.is.null),and(update_nouki.gte.${monthStart},update_nouki.lte.${monthEnd})`);
        if (undeliveredOnly) q = q.is(nounyuCol, null);
        const { data, error } = await q;
        if (error) {
            // OR構文が効かない場合のフォールバック（delivery_date範囲のみ）
            let q2 = supabase.from(tblName).select(`delivery_date,update_nouki,${nounyuCol}`)
                .gte('delivery_date', monthStart).lte('delivery_date', monthEnd);
            if (undeliveredOnly) q2 = q2.is(nounyuCol, null);
            const { data: d2 } = await q2;
            return d2 || [];
        }
        return data || [];
    };

    try {
        let rows = [];
        if (category === 'purchased') {
            const tbl = await findTableName(['t_purchaseparts']);
            if (tbl) rows = await buildCalQuery(tbl, 'nounyu_date');
        } else if (category === 'outsource' || category === 'material') {
            const tbl = await findTableName(['t_purchase', 't_manufctpurchase']);
            if (tbl) rows = await buildCalQuery(tbl, 'nounyu_date');
        } else if (category === 'misc') {
            const tbl = await findTableName(['t_expense', 't_misc']);
            if (tbl) rows = await buildCalQuery(tbl, 'nounyu_date');
        }
        rows.forEach(r => {
            const k = getEffectiveDate(r);
            if (k >= monthStart && k <= monthEnd) {
                countByDate[k] = (countByDate[k] || 0) + 1;
            }
        });
    } catch (e) {
        console.warn('loadDeliveryCalendarData error:', e);
    }
    return countByDate;
}

// 作業票を保存
// 作業票の部門別バリデーションと表示切り替え
function updateWorkTicketValidation() {
    const department = document.querySelector('input[name="department"]:checked')?.value;
    const drawingNoLabel = document.querySelector('label[for="work-ticket-drawing-no"]') || 
                          document.getElementById('work-ticket-drawing-no')?.previousElementSibling;
    const drawingNoInput = document.getElementById('work-ticket-drawing-no');
    
    if (department === '明石') {
        // 加工部門：図面番号を強調（必須扱い）
        if (drawingNoLabel) drawingNoLabel.innerHTML = '図面番号 <span style="color: #FFD700;">*</span>';
        if (drawingNoInput) drawingNoInput.placeholder = '図面単位で入力 (必須)';
    } else {
        // 設計・組立等：工事番号単位
        if (drawingNoLabel) drawingNoLabel.innerHTML = '図面番号';
        if (drawingNoInput) drawingNoInput.placeholder = '図面番号 (任意)';
    }
}

// 既存のsaveWorkTicketを仕様に合わせてアップグレード
async function saveWorkTicket() {
    const dateInput = document.getElementById('work-ticket-date');
    const workerInput = document.getElementById('work-ticket-worker');
    const department = document.querySelector('input[name="department"]:checked')?.value;
    const constructNoInput = document.getElementById('work-ticket-construct-no');
    const drawingNoInput = document.getElementById('work-ticket-drawing-no');
    
    const jobType1Input = document.getElementById('work-ticket-job-type-1');
    // 基本バリデーション
    if (!workerInput?.value) { showMessage('作業者を選択してください', 'warning'); return; }
    if (!jobType1Input?.value) { showMessage('職種を選択してください', 'warning'); if (jobType1Input) jobType1Input.focus(); return; }
    if (!constructNoInput?.value) { showMessage('工事番号を入力してください', 'warning'); return; }
    
    // 加工部門の場合は図面番号を必須にする
    if (department === '明石' && !drawingNoInput?.value) {
        showMessage('加工部門は図面番号の入力が必須です', 'warning');
        drawingNoInput.focus();
        return;
    }

    const items = [];
    const list = document.getElementById('work-ticket-items-list');
    if (list) {
        const rows = list.querySelectorAll('tr');
        rows.forEach((row) => {
            const workCode = row.querySelector('.work-code-input')?.value;
            const workName = row.querySelector('.work-name-hidden-input')?.value;
            const quantity = parseFloat(row.querySelector('input[name*="[quantity]"]')?.value) || 0;
            const workTime = parseFloat(row.querySelector('input[name*="[work_time]"]')?.value) || 0;
            
            if (workCode || workName || workTime > 0) {
                items.push({
                    work_code: workCode || '',
                    work_name: workName || '',
                    quantity: quantity,
                    work_time: Math.round(workTime * 10) / 10 // 小数点1桁に丸める
                });
            }
        });
    }
    
    if (items.length === 0) {
        showMessage('作業内容を入力してください', 'warning');
        return;
    }

    // 工数合計のチェック（7.75hとの比較）
    const totalHours = items.reduce((sum, item) => sum + item.work_time, 0);
    if (totalHours !== 7.75) {
        const confirmMsg = `工数合計が ${totalHours}h です。定時(7.75h)と異なりますが、このまま登録しますか？`;
        if (!confirm(confirmMsg)) {
            return;
        }
    }

    const baseData = {
        date: dateInput?.value,
        worker_code: workerInput?.value,
        job_type_1: jobType1Input?.value || null,
        department: department,
        construct_no: constructNoInput?.value,
        drawing_no: drawingNoInput?.value || null,
        part_no: document.getElementById('work-ticket-part-no')?.value || null,
        register_date: new Date().toISOString()
    };

    try {
        // 各項目を保存（t_work_recordsテーブルを想定）
        const recordsToInsert = items.map(item => ({
            ...baseData,
            ...item
        }));

        const { error } = await getSupabaseClient()
            .from('t_work_records') // 実際のテーブル名に合わせて調整
            .insert(recordsToInsert);

        if (error) throw error;

        showMessage(`${items.length} 件の作業票を登録しました`, 'success');
        clearWorkTicketForm();
        
    // 登録成功時に流れ星を降らせる
    createShootingStars(true);
} catch (error) {
        console.error('作業票保存エラー:', error);
        // テーブルがない場合はシミュレーション
        if (error.message.includes('not found')) {
            console.log('保存データ(シミュレーション):', baseData, items);
            showMessage('登録が完了しました（デモモード）', 'success');
            clearWorkTicketForm();
        } else {
            showMessage('保存に失敗しました: ' + error.message, 'error');
        }
    }
}

// グローバルに公開
window.updateWorkTicketValidation = updateWorkTicketValidation;
window.saveWorkTicket = saveWorkTicket;

// 登録ページ タブ切り替え
function switchRegTab(btn) {
    const group = btn.getAttribute('data-group');
    document.querySelectorAll('.reg-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.reg-group').forEach(g => { g.style.display = 'none'; });
    btn.classList.add('active');
    const panel = document.querySelector(`.reg-group[data-group="${group}"]`);
    if (panel) panel.style.display = 'block';
}
window.switchRegTab = switchRegTab;


// カスタムフォームフィールドを生成
function generateCustomFormFields(container, fields, data) {
    fields.forEach(fieldConfig => {
        const field = document.createElement('div');
        const widthClass = fieldConfig.width === 'full' ? 'form-field-full' : 
                         fieldConfig.width === 'third' ? 'form-field-third' : 'form-field-half';
        field.className = `form-field ${widthClass}`;
        
        const value = data && data[fieldConfig.name] !== undefined && data[fieldConfig.name] !== null 
            ? String(data[fieldConfig.name]) : '';
        const escapedValue = value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        let fieldHTML = '';
        
        if (fieldConfig.label) {
            fieldHTML += `<label>${fieldConfig.label}${fieldConfig.required ? ' <span class="required">*</span>' : ''}</label>`;
        }
        
        switch (fieldConfig.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'number':
                fieldHTML += `<div style="display: flex; gap: 8px; align-items: center;">`;
                fieldHTML += `<input type="${fieldConfig.type}" name="${fieldConfig.name}" value="${escapedValue}" 
                    class="form-input" ${fieldConfig.required ? 'required' : ''} 
                    ${fieldConfig.pattern ? `pattern="${fieldConfig.pattern}"` : ''} 
                    ${fieldConfig.placeholder ? `placeholder="${fieldConfig.placeholder}"` : ''} 
                    style="${fieldConfig.button ? 'flex: 1;' : ''}">`;
                if (fieldConfig.button) {
                    fieldHTML += `<button type="button" class="btn-secondary btn-small" onclick="${fieldConfig.button.onclick}()" style="white-space: nowrap;">${fieldConfig.button.label}</button>`;
                }
                fieldHTML += `</div>`;
                if (fieldConfig.note) {
                    fieldHTML += `<span class="field-note">${fieldConfig.note}</span>`;
                }
                break;
                
            case 'textarea':
                fieldHTML += `<textarea name="${fieldConfig.name}" class="form-input" rows="${fieldConfig.rows || 3}" 
                    ${fieldConfig.required ? 'required' : ''}>${escapedValue}</textarea>`;
                break;
                
            case 'select':
                fieldHTML += `<select name="${fieldConfig.name}" class="form-input" ${fieldConfig.required ? 'required' : ''}>`;
                if (fieldConfig.placeholder) {
                    fieldHTML += `<option value="">${fieldConfig.placeholder}</option>`;
                }
                fieldConfig.options.forEach(option => {
                    const selected = value === option.value ? 'selected' : '';
                    fieldHTML += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                });
                fieldHTML += `</select>`;
                break;
                
            case 'checkbox-group':
                fieldHTML += `<div class="checkbox-group">`;
                const currentValues = value ? value.split(',').map(v => v.trim()) : [];
                fieldConfig.options.forEach(option => {
                    const checked = currentValues.includes(option.value) ? 'checked' : '';
                    fieldHTML += `
                        <label class="checkbox-label">
                            <input type="checkbox" name="${fieldConfig.name}[]" value="${option.value}" ${checked}>
                            <span>${option.label}</span>
                        </label>
                    `;
                });
                fieldHTML += `</div>`;
                break;
                
            case 'radio-group':
                fieldHTML += `<div class="radio-group">`;
                fieldConfig.options.forEach(option => {
                    const checked = value === option.value ? 'checked' : '';
                    fieldHTML += `
                        <label class="radio-label">
                            <input type="radio" name="${fieldConfig.name}" value="${option.value}" ${checked} ${fieldConfig.required ? 'required' : ''}>
                            <span>${option.label}</span>
                        </label>
                    `;
                });
                fieldHTML += `</div>`;
                break;
                
            default:
                fieldHTML += `<input type="text" name="${fieldConfig.name}" value="${escapedValue}" class="form-input">`;
        }
        
        field.innerHTML = fieldHTML;
        container.appendChild(field);
        
        // 工事番号台の選択時に工事番号を自動生成
        if (fieldConfig.name === '工事番号台') {
            const selectElement = field.querySelector('select');
            if (selectElement) {
                // changeイベントで自動採番
                selectElement.addEventListener('change', function() {
                    if (this.value) {
                        generateNextConstructNumber(this.value);
                    }
                });
                
                // 初期値が設定されている場合も自動採番
                if (selectElement.value) {
                    setTimeout(() => {
                        generateNextConstructNumber(selectElement.value);
                    }, 100);
                }
            }
        }
    });
    
    // フォーム生成後にイベントリスナーを設定
    setTimeout(() => {
        setupConstructNumberAutoGeneration();
    }, 100);
}

// 工事番号の自動生成を設定
function setupConstructNumberAutoGeneration() {
    const constructNoSelect = document.querySelector('select[name="工事番号台"]');
    const constructNoInput = document.querySelector('input[name="Construct No"]');
    
    if (constructNoSelect && constructNoInput) {
        // changeイベントで自動採番
        constructNoSelect.addEventListener('change', function() {
            if (this.value) {
                generateNextConstructNumber(this.value);
            }
        });
        
        // 初期値が設定されている場合も自動採番
        if (constructNoSelect.value) {
            setTimeout(() => {
                generateNextConstructNumber(constructNoSelect.value);
            }, 100);
        }
    }
}

// 次の工事番号を生成
async function generateNextConstructNumber(koujibangou) {
    if (!koujibangou || koujibangou.trim() === '') return;
    
    // 工事番号入力欄を取得
    const constructNoInput = document.querySelector('input[name="Construct No"]');
    if (!constructNoInput) return;
    
    try {
        // 工事番号台からプレフィックスを抽出（例：「1000番台」→「10」）
        let prefix = '';
        let prefix1 = '';
        
        if (koujibangou.includes('番台')) {
            const match = koujibangou.match(/^(\d+|[A-Z]\d+|[A-Z])(\d+)?番台/);
            if (match) {
                if (match[1].length === 1 && /[A-Z]/.test(match[1])) {
                    // S, T, Z, Dなどの1文字アルファベット
                    prefix1 = match[1];
                    prefix = ''; // 1文字アルファベットの場合はprefixをクリア
                } else if (match[1].length >= 2) {
                    // 数字またはアルファベット+数字
                    // 1文字目がアルファベットの場合は1文字プレフィックスとして扱う
                    if (/^[A-Z]$/.test(match[1].substring(0, 1))) {
                        prefix1 = match[1].substring(0, 1);
                        prefix = '';
                    } else {
                        prefix = match[1].substring(0, 2);
                        prefix1 = match[1].substring(0, 1);
                    }
                }
            }
        } else {
            // 番台が含まれていない場合
            // 1文字目がアルファベットの場合は1文字プレフィックスとして扱う
            if (koujibangou.length >= 1 && /^[A-Z]$/.test(koujibangou.substring(0, 1))) {
                prefix1 = koujibangou.substring(0, 1);
                prefix = '';
            } else {
                prefix = koujibangou.substring(0, 2);
                prefix1 = koujibangou.substring(0, 1);
            }
        }
        
        let maxNumber = null;
        
        // テーブル名を確認（t Accept Orderテーブルを想定）
        const tableName = currentTable || 't Accept Order';
        
        // 工事番号カラム名を推測（複数の可能性を試す）
        const possibleColumns = ['Construct No', 'construct_no', 'Order No', 'order_no', '工事番号'];
        let constructNoColumn = null;
        
        // まずカラム名を確認
        if (tableData && tableData.length > 0) {
            const columns = Object.keys(tableData[0]);
            constructNoColumn = possibleColumns.find(col => columns.includes(col));
        }
        
        if (!constructNoColumn) {
            constructNoColumn = 'Construct No'; // デフォルト
        }
        
        // データベースから該当する工事番号の最大値を取得
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabaseクライアントが初期化されていません');
        }
        const { data, error } = supabase ? await supabase
            .from(tableName)
            .select(constructNoColumn)
            .not(constructNoColumn, 'is', null)
            .limit(10000) : { data: null, error: new Error('Supabaseクライアントが初期化されていません') };
        
        if (error) {
            console.error('工事番号取得エラー(Supabase):', error);
            // Supabaseエラー時でも処理を続行し、使用済み番号一覧を確認するようにする
        }
        
        // 使用済み番号を取得
        const usedNumbers = await getUsedConstructNumbers();
        
        // 選択された工事番号台に該当する最大値を探す（データベース + 使用済み番号）
        const allNumbers = [];
        
        // データベースから取得した番号を追加
        if (data && data.length > 0) {
            data.forEach(row => {
                const value = row[constructNoColumn];
                if (!value) return;
                const strValue = String(value).trim();
                
                // プレフィックスでマッチング
                if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                    // 1文字アルファベット（S, T, Z, D）
                    if (strValue.startsWith(prefix1)) {
                        allNumbers.push(strValue);
                    }
                } else if (prefix) {
                    // 2文字プレフィックス
                    if (strValue.startsWith(prefix)) {
                        allNumbers.push(strValue);
                    }
                }
            });
        }
        
        // 使用済み番号を追加
        usedNumbers.forEach(usedItem => {
            const usedNum = typeof usedItem === 'string' ? usedItem : usedItem.number;
            const strValue = String(usedNum).trim();
            if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                if (strValue.startsWith(prefix1) && !allNumbers.includes(strValue)) {
                    allNumbers.push(strValue);
                }
            } else if (prefix) {
                if (strValue.startsWith(prefix) && !allNumbers.includes(strValue)) {
                    allNumbers.push(strValue);
                }
            }
        });
        
        // 最大値を計算（VB.NETのロジックに従って、使用済み番号を含めた最大値を見つける）
        if (allNumbers.length > 0) {
            console.log('工事番号採番(フォーム) - 対象番号一覧:', allNumbers);
            
            // 各番号から数値部分を抽出して比較用のオブジェクトを作成
            const numberPairs = allNumbers.map(num => {
                const strValue = String(num).trim();
                let numPart = '';
                let numValue = 0;
                
                if (/^\d+$/.test(strValue)) {
                    // 数字のみの番号（例：1001, 2001）
                    numPart = strValue;
                    numValue = parseInt(strValue, 10);
                } else {
                    // アルファベットを含む番号（例：3B01, 3C01, S001）
                    if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                        // 1文字アルファベット（S, T, Z, D）
                        numPart = strValue.substring(1);
                    } else if (prefix && prefix.length === 2) {
                        // 2文字プレフィックス（3B, 3C, 4Bなど）
                        numPart = strValue.substring(2);
                    }
                    
                    if (numPart && /^\d+$/.test(numPart)) {
                        numValue = parseInt(numPart, 10);
                    } else {
                        // 数値部分が抽出できない場合は、文字列として扱う
                        numValue = 0;
                    }
                }
                
                return {
                    original: strValue,
                    numPart: numPart,
                    numValue: numValue
                };
            });
            
            // 数値部分でソートして最大値を見つける
            numberPairs.sort((a, b) => {
                if (a.numValue !== b.numValue) {
                    return b.numValue - a.numValue; // 降順
                }
                // 数値が同じ場合は文字列として比較
                return b.original.localeCompare(a.original);
            });
            
            // 最大値の元の番号を取得
            maxNumber = numberPairs[0].original;
            console.log('工事番号採番(フォーム) - 最大値:', maxNumber, 'プレフィックス:', prefix || prefix1);
        } else {
            console.log('工事番号採番(フォーム) - 対象番号なし、デフォルト値を使用');
        }
        
        // 次の番号を生成（VB.NETのロジック: retに最大値を渡して+1）
        const nextNumber = calculateNextConstructNumber(koujibangou, maxNumber);
        console.log('工事番号採番(フォーム) - 生成された次の番号:', nextNumber);
        if (nextNumber) {
            constructNoInput.value = nextNumber;
        }
    } catch (error) {
        console.error('工事番号生成エラー:', error);
        // エラーの場合でもデフォルト値を設定
        const nextNumber = calculateNextConstructNumber(koujibangou, null);
        if (nextNumber) {
            constructNoInput.value = nextNumber;
        }
    }
}

// 次の工事番号を計算（VB.NETのロジックをJavaScriptに変換）
function calculateNextConstructNumber(koujibangou, ret) {
    if (!koujibangou) return null;
    
    // 工事番号台から最初の2文字または1文字を抽出
    // 例：「1000番台」→「10」、「3B00番台」→「3B」、「S000番台」→「S」
    let prefix = '';
    let prefix1 = '';
    
    // 「番台」を削除してから処理
    let koujiValue = koujibangou.replace('番台', '').trim();
    
    // 1文字目がアルファベットの場合は1文字プレフィックスとして扱う
    if (koujiValue.length >= 1 && /^[A-Z]$/.test(koujiValue.substring(0, 1))) {
        // S, T, Z, Dなどの1文字アルファベット
        prefix1 = koujiValue.substring(0, 1);
        prefix = ''; // 1文字アルファベットの場合はprefixをクリア
    } else if (koujiValue.length >= 2) {
        // 2文字以上の場合は2文字プレフィックスとして扱う
        prefix = koujiValue.substring(0, 2);
        prefix1 = koujiValue.substring(0, 1);
    } else if (koujiValue.length === 1) {
        prefix1 = koujiValue;
    }
    
    // retがnullまたはundefinedの場合はデフォルト値を返す
    if (!ret || ret === null || ret === undefined || ret === '') {
        if (prefix === '10') return '1001';
        if (prefix === '29') return '2901';
        if (prefix === '20') return '2001';
        if (prefix === '3A') return '3A01';
        if (prefix === '3B') return '3B01';
        if (prefix === '3C') return '3C01';
        if (prefix === '3V') return '3V01';
        if (prefix === '3P') return '3P01';
        if (prefix === '3T') return '3T01';
        if (prefix === '39') return '3901';
        if (prefix === '30') return '3001';
        if (prefix === '4A') return '4A01';
        if (prefix === '4B') return '4B01';
        if (prefix === '4C') return '4C01';
        if (prefix === '4V') return '4V01';
        if (prefix === '4P') return '4P01';
        if (prefix === '4T') return '4T01';
        if (prefix === '49') return '4901';
        if (prefix === '40') return '4001';
        if (prefix === '5A') return '5A01';
        if (prefix === '5B') return '5B01';
        if (prefix === '5E') return '5E01';
        if (prefix === '50') return '5001';
        if (prefix === '60') return '6001';
        if (prefix === '70') return '7001';
        if (prefix === '7P') return '7P01';
        if (prefix === '8A') return '8A01';
        if (prefix === '8B') return '8B01';
        if (prefix === '8E') return '8E01';
        if (prefix === '80') return '8001';
        if (prefix === '90') return '9001';
        if (prefix1 === 'S') return 'S001';
        if (prefix1 === 'T') return 'T001';
        if (prefix1 === 'Z') return 'Z001';
        if (prefix1 === 'D') return 'D001';
        return null;
    }
    
    const retStr = String(ret).trim();
    console.log('calculateNextConstructNumber - 入力:', { koujibangou, ret: retStr, prefix, prefix1 });
    
    // retStrが空の場合はデフォルト値を返す
    if (!retStr || retStr === '') {
        if (prefix === '10') return '1001';
        if (prefix === '29') return '2901';
        if (prefix === '20') return '2001';
        if (prefix === '3A') return '3A01';
        if (prefix === '3B') return '3B01';
        if (prefix === '3C') return '3C01';
        if (prefix === '3V') return '3V01';
        if (prefix === '3P') return '3P01';
        if (prefix === '3T') return '3T01';
        if (prefix === '39') return '3901';
        if (prefix === '30') return '3001';
        if (prefix === '4A') return '4A01';
        if (prefix === '4B') return '4B01';
        if (prefix === '4C') return '4C01';
        if (prefix === '4V') return '4V01';
        if (prefix === '4P') return '4P01';
        if (prefix === '4T') return '4T01';
        if (prefix === '49') return '4901';
        if (prefix === '40') return '4001';
        if (prefix === '5A') return '5A01';
        if (prefix === '5B') return '5B01';
        if (prefix === '5E') return '5E01';
        if (prefix === '50') return '5001';
        if (prefix === '60') return '6001';
        if (prefix === '70') return '7001';
        if (prefix === '7P') return '7P01';
        if (prefix === '8A') return '8A01';
        if (prefix === '8B') return '8B01';
        if (prefix === '8E') return '8E01';
        if (prefix === '80') return '8001';
        if (prefix === '90') return '9001';
        if (prefix1 === 'S') return 'S001';
        if (prefix1 === 'T') return 'T001';
        if (prefix1 === 'Z') return 'Z001';
        if (prefix1 === 'D') return 'D001';
        return null;
    }
    
    // VB.NETのロジックに従って処理
    if (prefix === '10') {
        if (retStr === '1999') {
            return '1001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '29') {
        if (retStr === '2999') {
            return '2901';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '20') {
        if (retStr === '2899') {
            return '2001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '3A') {
        if (retStr === '3A99') {
            return '3A01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3A' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3B') {
        if (retStr === '3B99') {
            return '3B01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3B' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3C') {
        if (retStr === '3C99') {
            return '3C01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3C' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3V') {
        if (retStr === '3V99') {
            return '3V01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3V' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3P') {
        if (retStr === '3P99') {
            return '3P01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3P' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3T') {
        if (retStr === '3T99') {
            return '3T01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3T' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '39') {
        if (retStr === '3999') {
            return '3901';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '30') {
        if (retStr === '3899') {
            return '3001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '4A') {
        if (retStr === '4A99') {
            return '4A01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4A' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '4B') {
        if (retStr === '4B99') {
            return '4B01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4B' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '4C') {
        if (retStr === '4C99') {
            console.log('calculateNextConstructNumber(4C) - 上限値に達したためリセット');
            return '4C01';
        } else {
            // VB.NETのロジック: ret.Substring(2, 2)で後ろ2桁を取得して+1
            const numPart = retStr.substring(2, 4); // "01"など
            const num = parseInt(numPart, 10) + 1;
            const result = '4C' + String(num).padStart(2, '0');
            console.log('calculateNextConstructNumber(4C) - 入力:', retStr, '数値部分:', numPart, '結果:', result);
            return result;
        }
    }
    else if (prefix === '4V') {
        if (retStr === '4V99') {
            return '4V01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4V' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '4P') {
        if (retStr === '4P99') {
            return '4P01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4P' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '4T') {
        if (retStr === '4T99') {
            return '4T01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4T' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '49') {
        if (retStr === '4999') {
            return '4901';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '40') {
        if (retStr === '4899') {
            return '4001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '5A') {
        if (retStr === '5A99') {
            return '5A01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '5A' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '5B') {
        if (retStr === '5B99') {
            return '5B01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '5B' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '5E') {
        if (retStr === '5E99') {
            return '5E01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '5E' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '50') {
        if (retStr === '5999') {
            return '5001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '60') {
        if (retStr === '6999') {
            return '6001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '70') {
        if (retStr === '7999') {
            return '7001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '7P') {
        if (retStr === '7P99') {
            return '7P01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '7P' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '8A') {
        if (retStr === '8A99') {
            return '8A01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '8A' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '8B') {
        if (retStr === '8B99') {
            return '8B01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '8B' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '8E') {
        if (retStr === '8E99') {
            return '8E01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '8E' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '80') {
        if (retStr === '8999') {
            return '8001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '90') {
        if (retStr === '9999') {
            return '9001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix1 === 'S') {
        if (retStr === 'S999') {
            return 'S001';
        } else {
            // 1文字目から3文字を取得（数字部分）
            const numPart = retStr.substring(1, 4);
            if (!numPart || numPart === '') {
                return 'S001';
            }
            const num = parseInt(numPart, 10);
            if (isNaN(num)) {
                return 'S001';
            }
            return 'S' + String(num + 1).padStart(3, '0');
        }
    }
    else if (prefix1 === 'T') {
        if (retStr === 'T999') {
            return 'T001';
        } else {
            const numPart = retStr.substring(1, 4);
            if (!numPart || numPart === '') {
                return 'T001';
            }
            const num = parseInt(numPart, 10);
            if (isNaN(num)) {
                return 'T001';
            }
            return 'T' + String(num + 1).padStart(3, '0');
        }
    }
    else if (prefix1 === 'Z') {
        if (retStr === 'Z999') {
            return 'Z001';
        } else {
            const numPart = retStr.substring(1, 4);
            if (!numPart || numPart === '') {
                return 'Z001';
            }
            const num = parseInt(numPart, 10);
            if (isNaN(num)) {
                return 'Z001';
            }
            return 'Z' + String(num + 1).padStart(3, '0');
        }
    }
    else if (prefix1 === 'D') {
        if (retStr === 'D999') {
            console.log('calculateNextConstructNumber(D) - 上限値に達したためリセット');
            return 'D001';
        } else {
            // 1文字目から3文字を取得（数字部分）
            const numPart = retStr.substring(1, 4);
            if (!numPart || numPart === '') {
                return 'D001';
            }
            const num = parseInt(numPart, 10);
            if (isNaN(num)) {
                return 'D001';
            }
            const result = 'D' + String(num + 1).padStart(3, '0');
            console.log('calculateNextConstructNumber(D) - 入力:', retStr, '数値部分:', numPart, '結果:', result);
            return result;
        }
    }
    
    return null;
}

// デフォルトフォームフィールドを生成（既存の動作）
function generateDefaultFormFields(container, data) {
    if (tableData.length > 0) {
        const columns = Object.keys(tableData[0]);
        const excludedCols = ['id', 'created_at', 'updated_at', 'deleted_at'];
        const formColumns = columns.filter(col => !excludedCols.includes(col.toLowerCase()));

        // フィールド数に応じてグリッド列数を変更
        if (formColumns.length > 15) {
            container.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else if (formColumns.length > 8) {
            container.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            // フィールドが少ない場合は1列にする（それぞれ分ける）
            container.style.gridTemplateColumns = '1fr';
        }

        formColumns.forEach(col => {
            const field = document.createElement('div');
            
            // 重要そうなフィールドや長いフィールドは全幅にする
            const colLower = col.toLowerCase();
            const isFullWidth = colLower.includes('memo') || colLower.includes('note') || 
                               colLower.includes('description') || colLower.includes('詳細') || 
                               colLower.includes('address') || colLower.includes('住所') ||
                               colLower.includes('name') && !colLower.includes('staff');
            
            field.className = isFullWidth ? 'form-field form-field-full' : 'form-field';
            if (isFullWidth) {
                field.style.gridColumn = '1 / -1';
            }
            const value = data && data[col] !== undefined && data[col] !== null ? String(data[col]) : '';
            const escapedValue = value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            
            // カラム名を日本語に変換
            const displayName = typeof getColumnDisplayName === 'function' ? getColumnDisplayName(col) : col;
            
            // フィールドタイプを判定
            let inputType = 'text';
            let inputHTML = '';
            
            // カラム名からタイプを推測
            if (colLower.includes('date') || colLower.includes('日')) {
                inputType = 'date';
                inputHTML = `<input type="date" name="${col}" value="${escapedValue}" class="form-input">`;
            } else if (colLower.includes('price') || colLower.includes('amount') || colLower.includes('金額') || 
                       colLower.includes('quantity') || colLower.includes('数量') ||
                       colLower.includes('weight') || colLower.includes('重量') ||
                       colLower.includes('code') && !colLower.includes('name')) {
                inputType = 'number';
                inputHTML = `<input type="number" name="${col}" value="${escapedValue}" class="form-input" step="any">`;
            } else if (colLower.includes('email') || colLower.includes('メール')) {
                inputType = 'email';
                inputHTML = `<input type="email" name="${col}" value="${escapedValue}" class="form-input">`;
            } else if (colLower.includes('tel') || colLower.includes('phone') || colLower.includes('電話') || colLower.includes('fax')) {
                inputType = 'tel';
                inputHTML = `<input type="tel" name="${col}" value="${escapedValue}" class="form-input">`;
            } else if (colLower.includes('url') || colLower.includes('link')) {
                inputType = 'url';
                inputHTML = `<input type="url" name="${col}" value="${escapedValue}" class="form-input">`;
            } else if (colLower.includes('memo') || colLower.includes('note') || colLower.includes('備考') || colLower.includes('メモ') || 
                       colLower.includes('description') || colLower.includes('説明') || colLower.includes('詳細')) {
                inputHTML = `<textarea name="${col}" class="form-input" rows="3">${escapedValue}</textarea>`;
            } else {
                inputHTML = `<input type="text" name="${col}" value="${escapedValue}" class="form-input">`;
            }
            
            field.innerHTML = `
                <label>${displayName}</label>
                ${inputHTML}
            `;
            container.appendChild(field);
        });
    }
}

// モーダルを閉じる
function closeModal() {
    const modal = document.getElementById('register-modal');
    modal.style.display = 'none';
    document.getElementById('register-form').reset();
}

// レコードの保存
async function saveRecord() {
    if (!currentTable) {
        showMessage('テーブルが選択されていません', 'error');
        return;
    }

    const form = document.getElementById('register-form');
    const formData = new FormData(form);
    const data = {};
    const editId = form.dataset.editId;
    
    // 確認ダイアログを表示
    const action = editId ? '更新' : '登録';
    const confirmed = await showConfirmDialog(`${action}しますか？`, action);
    if (!confirmed) {
        return;
    }

    // フォームのすべての入力フィールドからデータを取得
    const inputs = form.querySelectorAll('input[name], select[name], textarea[name]');
    const processedFields = new Set();
    
    inputs.forEach(input => {
        const key = input.name.replace('[]', ''); // チェックボックスの[]を削除
        
        // 更新時はIDフィールドをスキップ
        if (editId && (key.toLowerCase() === 'id' || key === 'ID' || key === 'id')) {
            return;
        }
        
        if (processedFields.has(key)) {
            return; // 既に処理済みのフィールドはスキップ
        }
        
        // チェックボックスグループの処理
        if (input.type === 'checkbox' && input.name.endsWith('[]')) {
            const checkboxes = form.querySelectorAll(`input[name="${input.name}"]:checked`);
            const values = Array.from(checkboxes).map(cb => cb.value);
            data[key] = values.length > 0 ? values.join(',') : null;
            processedFields.add(key);
            return;
        }
        
        // 通常のフィールドの処理
        if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) {
                data[key] = input.value;
            } else if (input.type === 'radio') {
                // ラジオボタンで未選択の場合はスキップ
                return;
            } else {
                // チェックボックスで未選択の場合はnull
                data[key] = null;
            }
        } else {
        const value = input.value;
        // required属性を削除して必須チェックを無効化
        input.removeAttribute('required');
        if (value !== null && value !== undefined) {
            // 空文字列の場合はnullに変換（データベースの制約に対応）
            data[key] = value.trim() === '' ? null : value.trim();
        }
        }
        processedFields.add(key);
    });

    // データが空でも登録を許可（すべてのフィールドが空でもOK）
    // ただし、テーブルに必須項目がある場合はデータベース側でエラーになる可能性がある
    
    // 更新時はIDを確実に除外（IDは更新対象外）
    if (editId) {
        delete data.id;
        delete data['id'];
        delete data['ID'];
        delete data['Id'];
        // すべてのキーをチェックしてID関連を除外
        Object.keys(data).forEach(key => {
            if (key.toLowerCase() === 'id') {
                delete data[key];
            }
        });
    }

    try {
        if (editId) {
            // 更新 - IDを確実に除外
            const updateData = { ...data };
            delete updateData.id;
            delete updateData['id'];
            delete updateData['ID'];
            delete updateData['Id'];
            Object.keys(updateData).forEach(key => {
                if (key.toLowerCase() === 'id') {
                    delete updateData[key];
                }
            });
            
            console.log('更新データ（ID除外後）:', updateData);
            console.log('編集ID:', editId);
            
            // 更新
            const { data: updatedData, error } = await getSupabaseClient()
                .from(currentTable)
                .update(updateData)
                .eq('id', editId)
                .select();
            
            if (error) {
                console.error('更新エラー詳細:', error);
                console.error('更新しようとしたデータ:', updateData);
                let errorMessage = 'データの更新に失敗しました';
                if (error.message) {
                    errorMessage += ': ' + error.message;
                }
                if (error.details) {
                    errorMessage += ' (' + error.details + ')';
                }
                if (error.hint) {
                    errorMessage += ' - ' + error.hint;
                }
                showMessage(errorMessage, 'error');
                return;
            }
            showMessage('データを更新しました', 'success');
            // 更新の場合はモーダルを閉じる
            closeModal();
        } else {
            // 新規登録
            const { data: insertedData, error } = await getSupabaseClient()
                .from(currentTable)
                .insert(data)
                .select();
            
            if (error) {
                console.error('登録エラー詳細:', error);
                console.error('登録しようとしたデータ:', data);
                let errorMessage = 'データの登録に失敗しました';
                if (error.message) {
                    errorMessage += ': ' + error.message;
                }
                if (error.details) {
                    errorMessage += ' (' + error.details + ')';
                }
                if (error.hint) {
                    errorMessage += ' - ' + error.hint;
                }
                // よくあるエラーの原因を追加で表示
                if (error.code === '23505') {
                    errorMessage += '\n（重複エラー: 既に存在する値が含まれています）';
                } else if (error.code === '23502') {
                    errorMessage += '\n（必須項目エラー: 必須項目が入力されていません）';
                } else if (error.code === '23503') {
                    errorMessage += '\n（外部キーエラー: 参照先が存在しません）';
                } else if (error.code === '22P02' || error.code === '42804') {
                    errorMessage += '\n（データ型エラー: データ型が一致しません）';
                }
                showMessage(errorMessage, 'error');
                return;
            }
            showMessage('データを登録しました', 'success');
            
            // 工事番号が登録された場合はt_constructionnumberテーブルにも登録
            const constructNo = data['Construct No'] || data['construct_no'] || data['工事番号'];
            if (constructNo) {
                // t_constructionnumberテーブルに登録
                const today = new Date().toISOString().split('T')[0];
                const orderDate = data['Order Date'] || data['Register Date'] || data['受注登録日'] || today;
                
                // 日付形式を変換（YYYY-MM-DD形式に）
                let formattedDate = orderDate;
                if (orderDate && typeof orderDate === 'string') {
                    // YYYY/MM/DD形式をYYYY-MM-DDに変換
                    formattedDate = orderDate.replace(/\//g, '-');
                    // 既にYYYY-MM-DD形式の場合はそのまま
                    if (!/^\d{4}-\d{2}-\d{2}/.test(formattedDate)) {
                        formattedDate = today; // 変換できない場合は今日の日付を使用
                    }
                }
                
                try {
                    const supabase = getSupabaseClient();
                    if (supabase) {
                        const { error: insertError } = await supabase
                            .from('t_constructionnumber')
                            .insert({
                                constructno: constructNo,
                                orderdate: formattedDate
                            });
                        
                        if (!insertError) {
                            console.log('t_constructionnumberに登録しました:', constructNo, formattedDate);
                        } else if (insertError.code === '23505') {
                            // 重複エラーの場合は無視
                            console.log('工事番号は既にt_constructionnumberに登録されています:', constructNo);
                        } else {
                            console.error('t_constructionnumberへの登録に失敗しました:', insertError);
                            showMessage(`工事番号「${constructNo}」のt_constructionnumberへの登録に失敗しました: ${insertError.message || '不明なエラー'}`, 'warning');
                        }
                    }
                } catch (error) {
                    console.warn('t_constructionnumberへの登録でエラーが発生しました:', error);
                }
                
                // 使用済みリストに追加（既存の処理）
                await saveUsedConstructNumberOnRegister(constructNo);
                // モーダルが開いている場合は一覧を更新
                const modal = document.getElementById('construct-number-modal');
                if (modal && modal.style.display === 'flex') {
                    const selectElement = document.getElementById('construct-number-select');
                    await loadUsedConstructNumbersListInline(selectElement ? selectElement.value : null);
                }
                
                // モニターを自動更新
                if (typeof loadConstructionNumberStatusPage === 'function') {
                    setTimeout(() => {
                        loadConstructionNumberStatusPage();
                    }, 500);
                }
            }
            
            // フォームをリセット（モーダルは閉じない）
            form.reset();
            // 編集IDをクリア
            delete form.dataset.editId;
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = '登録';
            }
        }

        await loadTableData(currentTable);
    } catch (error) {
        console.error('保存処理エラー:', error);
        showMessage('保存に失敗しました: ' + (error.message || '不明なエラー'), 'error');
    }
}

// メッセージ表示
function showMessage(message, type = 'info') {
    const area = document.getElementById('message-area');
    if (!area) {
        // message-areaが存在しない場合はalertで表示
        alert(message);
        return;
    }
    
    const msg = document.createElement('div');
    msg.className = `message message-${type}`;
    msg.style.cssText = 'pointer-events: auto; z-index: 20001 !important; position: relative;';
    
    // エラーメッセージの場合は改行を保持
    if (type === 'error') {
        const lines = message.split('\n');
        if (lines.length > 1) {
            msg.innerHTML = lines.map(line => `<div style="margin-bottom: 4px;">${escapeHtml(line)}</div>`).join('');
        } else {
            msg.textContent = message;
        }
    } else {
        msg.textContent = message;
    }
    
    area.appendChild(msg);
    
    // エラーメッセージの場合は表示時間を長くする
    const displayTime = type === 'error' ? 8000 : 3000;
    
    setTimeout(() => {
        msg.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => msg.remove(), 300);
    }, displayTime);
    
    // エラーメッセージの場合はスクロールして表示
    if (type === 'error') {
        setTimeout(() => {
            msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    // 成功メッセージの場合、流れ星エフェクトを表示
    if (type === 'success') {
        createShootingStars(true);
    }
}

// キラリと光るエフェクトの生成
function createShootingStars(isBigJob = false) {
    const container = document.createElement('div');
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 99999;';
    document.body.appendChild(container);

    const createSparkle = (x, y, scale = 1, delay = 0) => {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                top: ${y}px;
                left: ${x}px;
                width: 2px;
                height: 2px;
                background: white;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 30px 15px white, 0 0 60px 30px rgba(165, 180, 252, 0.8);
            `;
            
            // 十字の光（より鋭く、長く）
            const hLine = document.createElement('div');
            hLine.style.cssText = `position: absolute; top: 50%; left: 50%; width: ${300 * scale}px; height: 2px; background: linear-gradient(to right, transparent, white, transparent); transform: translate(-50%, -50%);`;
            const vLine = document.createElement('div');
            vLine.style.cssText = `position: absolute; top: 50%; left: 50%; width: 2px; height: ${300 * scale}px; background: linear-gradient(to bottom, transparent, white, transparent); transform: translate(-50%, -50%);`;
            
            // 斜めの光を追加
            const d1Line = document.createElement('div');
            d1Line.style.cssText = `position: absolute; top: 50%; left: 50%; width: ${200 * scale}px; height: 1px; background: linear-gradient(to right, transparent, white, transparent); transform: translate(-50%, -50%) rotate(45deg);`;
            const d2Line = document.createElement('div');
            d2Line.style.cssText = `position: absolute; top: 50%; left: 50%; width: ${200 * scale}px; height: 1px; background: linear-gradient(to right, transparent, white, transparent); transform: translate(-50%, -50%) rotate(-45deg);`;

            sparkle.appendChild(hLine);
            sparkle.appendChild(vLine);
            sparkle.appendChild(d1Line);
            sparkle.appendChild(d2Line);
            container.appendChild(sparkle);

            sparkle.animate([
                { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
                { transform: `translate(-50%, -50%) scale(${scale}) rotate(90deg)`, opacity: 1, offset: 0.3 },
                { transform: `translate(-50%, -50%) scale(${scale * 1.5}) rotate(180deg)`, opacity: 0 }
            ], {
                duration: 500,
                easing: 'ease-out'
            }).onfinish = () => sparkle.remove();
        }, delay);
    };

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 派手にキラーん！
    // 中心で特大の輝き
    createSparkle(centerX, centerY, isBigJob ? 2.5 : 1.8, 0);
    
    // 周囲にランダムな輝きを散らす
    const count = isBigJob ? 12 : 5;
    for (let i = 0; i < count; i++) {
        const x = centerX + (Math.random() - 0.5) * 400;
        const y = centerY + (Math.random() - 0.5) * 400;
        const scale = 0.5 + Math.random();
        const delay = Math.random() * 300;
        createSparkle(x, y, scale, delay);
    }

    if (isBigJob) {
        // 大きな仕事の時だけメッセージ
        setTimeout(() => {
            const catchMsg = document.createElement('div');
            catchMsg.innerHTML = '<div style="font-family: \'Outfit\', sans-serif; font-weight: 900; font-size: 60px; color: white; text-shadow: 0 0 30px rgba(255,255,255,1), 0 0 60px rgba(99,102,241,0.8); letter-spacing: 8px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));">Registration complete</div>';
            catchMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.5); opacity: 0; pointer-events: none; z-index: 100000; transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);';
            document.body.appendChild(catchMsg);

            requestAnimationFrame(() => {
                catchMsg.style.opacity = '1';
                catchMsg.style.transform = 'translate(-50%, -50%) scale(1)';
            });

            setTimeout(() => {
                catchMsg.style.opacity = '0';
                catchMsg.style.transform = 'translate(-50%, -50%) scale(1.5)';
                setTimeout(() => {
                    catchMsg.remove();
                    container.remove();
                }, 500);
            }, 1500);
        }, 200);
    } else {
        setTimeout(() => container.remove(), 1500);
    }
}

// HTMLエスケープ関数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 確認ダイアログを表示
function showConfirmDialog(message, action = '実行') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-dialog-modal');
        const titleEl = document.getElementById('confirm-dialog-title');
        const messageEl = document.getElementById('confirm-dialog-message');
        const okBtn = document.getElementById('confirm-dialog-ok');
        const cancelBtn = document.getElementById('confirm-dialog-cancel');
        
        if (!modal || !titleEl || !messageEl || !okBtn || !cancelBtn) {
            // フォールバック: 標準のconfirmを使用
            resolve(confirm(message));
            return;
        }
        
        titleEl.textContent = `${action}の確認`;
        messageEl.textContent = message;
        okBtn.textContent = action;
        
        // z-indexを確実に設定（register-modalより上に表示）
        modal.style.zIndex = '50000';
        modal.style.setProperty('z-index', '50000', 'important');
        modal.style.display = 'flex';
        
        // register-modalのz-indexを一時的に下げる
        const registerModal = document.getElementById('register-modal');
        if (registerModal && registerModal.style.display !== 'none') {
            registerModal.style.zIndex = '1000';
        }
        
        // イベントリスナーを一度だけ設定
        const handleOk = () => {
            modal.style.display = 'none';
            // register-modalのz-indexを元に戻す
            const registerModal = document.getElementById('register-modal');
            if (registerModal && registerModal.style.display !== 'none') {
                registerModal.style.zIndex = '10000';
            }
            resolve(true);
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = () => {
            modal.style.display = 'none';
            // register-modalのz-indexを元に戻す
            const registerModal = document.getElementById('register-modal');
            if (registerModal && registerModal.style.display !== 'none') {
                registerModal.style.zIndex = '10000';
            }
            resolve(false);
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        // 既存のイベントリスナーを削除してから追加
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        document.getElementById('confirm-dialog-ok').addEventListener('click', handleOk);
        document.getElementById('confirm-dialog-cancel').addEventListener('click', handleCancel);
    });
}

// 工事番号取得モーダルを開く
async function openConstructNumberModal() {
    const modal = document.getElementById('construct-number-modal');
    modal.style.display = 'flex';
    
    // フォームをリセット
    document.getElementById('construct-number-form').reset();
    document.getElementById('construct-number-result').value = '';
    document.getElementById('apply-construct-number-btn').style.display = 'none';
    
    // 現在の登録フォームから工事番号台の値を取得して設定
    const currentKoujibangouSelect = document.querySelector('select[name="工事番号台"]');
    const selectElement = document.getElementById('construct-number-select');
    if (currentKoujibangouSelect && currentKoujibangouSelect.value) {
        selectElement.value = currentKoujibangouSelect.value;
    }
    
    // 工事番号台の変更イベントを設定
    selectElement.onchange = async function() {
        const selectedValue = this.value;
        await loadUsedConstructNumbersListInline(selectedValue || null);
    };
    
    // 使用済み一覧を読み込む（初期値でフィルタリング）
    await loadUsedConstructNumbersListInline(selectElement.value || null);
}

// 工事番号取得モーダルを閉じる
function closeConstructNumberModal() {
    const modal = document.getElementById('construct-number-modal');
    modal.style.display = 'none';
}

// モニター自動更新のインターバルID
let monitorAutoRefreshInterval = null;

// 工事番号採番ページを初期化
async function initializeConstructNumberPage() {
    console.log('initializeConstructNumberPage: 初期化を開始します');
    const selectElement = document.getElementById('construct-number-select-page');
    const resultInput = document.getElementById('construct-number-result-page');
    const form = document.getElementById('construct-number-form-page');
    
    if (!selectElement) {
        console.error('construct-number-select-page要素が見つかりません');
    }
    if (!resultInput) {
        console.error('construct-number-result-page要素が見つかりません');
    }
    if (!form) {
        console.error('construct-number-form-page要素が見つかりません');
    }
    
    if (!selectElement || !resultInput || !form) {
        console.error('工事番号採番ページの要素が見つかりません。ページが正しく読み込まれていない可能性があります。');
        return;
    }
    
    console.log('工事番号採番ページの要素が見つかりました');
    
    // フォームをリセット
    form.reset();
    resultInput.value = '';
    
    // モーダルが表示されていないことを確認（念のため）
    const confirmModal = document.getElementById('construct-number-confirm-modal');
    if (confirmModal) {
        confirmModal.classList.remove('modal-active');
        confirmModal.style.display = 'none';
    }
    
    // 現在の登録フォームから工事番号台の値を取得して設定
    const currentKoujibangouSelect = document.querySelector('select[name="工事番号台"]');
    if (currentKoujibangouSelect && currentKoujibangouSelect.value) {
        selectElement.value = currentKoujibangouSelect.value;
    }
    
    // 工事番号台の変更イベントを設定
    selectElement.onchange = async function() {
        const selectedValue = this.value;
        await loadUsedConstructNumbersListPage(selectedValue || null);
        // モニターも更新
        await loadConstructionNumberStatusPage();
    };
    
    // 使用済み一覧を読み込む（初期値でフィルタリング）
    await loadUsedConstructNumbersListPage(selectElement.value || null);
    
    // 使用状況一覧を読み込む
    await loadConstructionNumberStatusPage();
    
    // モニターの自動更新を開始（30秒ごと）
    if (monitorAutoRefreshInterval) {
        clearInterval(monitorAutoRefreshInterval);
    }
    monitorAutoRefreshInterval = setInterval(async () => {
        console.log('モニターを自動更新します...');
        await loadConstructionNumberStatusPage();
    }, 30000); // 30秒ごとに更新
    
    console.log('initializeConstructNumberPage: 初期化が完了しました（自動更新開始）');
}

// 工事番号を取得（ページ版）
async function getConstructNumberPage() {
    const selectElement = document.getElementById('construct-number-select-page');
    const resultInput = document.getElementById('construct-number-result-page');
    const submitBtn = document.querySelector('#construct-number-form-page button[type="submit"]');
    
    if (!selectElement || !selectElement.value) {
        showMessage('工事番号台を選択してください', 'warning');
        return;
    }
    
    // 連続取得対応：処理中はボタンを無効化
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 取得中...';
        
        try {
            // 工事番号を生成
            const koujibangou = selectElement.value;
            await generateNextConstructNumberForPage(koujibangou);
            
            // 結果を表示
            const resultValue = resultInput.value;
            if (resultValue) {
                // 工事番号が取得されたら自動的に確認ポップアップを表示
                setTimeout(() => {
                    applyConstructNumberPage();
                }, 300);
            } else {
                showMessage('工事番号の取得に失敗しました', 'error');
            }
        } catch (error) {
            console.error('工事番号取得エラー:', error);
            showMessage('工事番号の取得に失敗しました', 'error');
        } finally {
            // 処理完了後にボタンを再度有効化
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.innerHTML = originalText;
        }
    } else {
        // ボタンが見つからない場合のフォールバック
        try {
            const koujibangou = selectElement.value;
            await generateNextConstructNumberForPage(koujibangou);
            
            const resultValue = resultInput.value;
            if (resultValue) {
                setTimeout(() => {
                    applyConstructNumberPage();
                }, 300);
            } else {
                showMessage('工事番号の取得に失敗しました', 'error');
            }
        } catch (error) {
            console.error('工事番号取得エラー:', error);
            showMessage('工事番号の取得に失敗しました', 'error');
        }
    }
}

// 次の工事番号を生成（ページ版）
async function generateNextConstructNumberForPage(koujibangou) {
    const resultInput = document.getElementById('construct-number-result-page');
    if (!resultInput) return;
    
    // プレフィックスを抽出（「番台」を削除）
    let prefix = koujibangou.replace('番台', '').trim();
    
    // 2000番台、2900番台、5000番台など4文字数字の場合は、ルールマスタのプレフィックスをそのまま使用
    // ただし、実際の検索では「20」で始まる番号も考慮する必要がある
    // ルールマスタのプレフィックスを確認して使用
    let rulePrefix = prefix;
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showMessage('Supabaseクライアントが初期化されていません', 'error');
            return;
        }

        // ルールマスタから該当するプレフィックスを取得
        if (/^\d{4}$/.test(prefix)) {
            // 4文字の数字（2000, 2900, 5000など）の場合
            // ルールマスタには「2000」として登録されているのでそのまま使用
            rulePrefix = prefix;
        } else if (/^\d{2}$/.test(prefix)) {
            // 2文字の数字（10, 20, 30など）の場合
            rulePrefix = prefix;
        }
        // その他（3C, 3Bなど）はそのまま使用

        // 新しい関数を使用して次の番号を取得
        const { data, error } = await supabase.rpc('get_next_construction_number', {
            p_prefix: rulePrefix
        });

        if (error) {
            // エラー時は既存のロジックにフォールバック
            console.warn('新しい関数でエラー、既存ロジックにフォールバック:', error);
    const selectElement = document.getElementById('construct-number-select-page');
    await generateNextConstructNumberForModal(koujibangou, resultInput, selectElement);
            return;
        }

        if (data && data.length > 0) {
            const info = data[0];
            resultInput.value = info.next_number || '';
        } else {
            // データがない場合は既存のロジックにフォールバック
            const selectElement = document.getElementById('construct-number-select-page');
            await generateNextConstructNumberForModal(koujibangou, resultInput, selectElement);
        }
    } catch (error) {
        console.error('次の番号取得エラー:', error);
        // エラー時は既存のロジックにフォールバック
        const selectElement = document.getElementById('construct-number-select-page');
        await generateNextConstructNumberForModal(koujibangou, resultInput, selectElement);
    }
}

// 詳細情報表示関数は削除（不要になったため）

// 使用状況一覧を読み込む（ページ版）
async function loadConstructionNumberStatusPage() {
    const container = document.getElementById('cn-status-cards-container');
    if (!container) {
        console.error('cn-status-cards-container要素が見つかりません');
        return;
    }

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5; display: block; color: #EF4444;"></i>
                    <p style="font-size: 14px; margin: 0;">Supabaseクライアントが初期化されていません</p>
                </div>
            `;
            return;
        }

        // ビューから取得を試みる（タイムアウト付き）
        let data = null;
        let error = null;
        
        try {
            // タイムアウトを設定（3秒）
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('タイムアウト')), 3000)
            );
            
            const queryPromise = supabase
                .from('V_ConstructionNumberStatus')
                .select('*')
                .order('SortOrder', { ascending: true });
            
            const result = await Promise.race([queryPromise, timeoutPromise]);
            data = result.data;
            error = result.error;
        } catch (e) {
            console.warn('V_ConstructionNumberStatusビューへのアクセスに失敗しました。直接テーブルから取得します...', e);
            error = e;
        }
        
        // ビューが使えない場合、直接テーブルからデータを取得
        // 常に直接テーブルから取得するように変更（t_constructionnumberを確実に参照）
        console.log('直接テーブルからデータを取得します（t_constructionnumberを確実に参照）...');
        data = await loadConstructionNumberStatusFromTables();

        // 選択された番台を取得
        const selectElement = document.getElementById('construct-number-select-page');
        const selectedPrefix = selectElement ? selectElement.value : null;
        selectedPrefixForMonitor = selectedPrefix;

        // 選択された番台でフィルタリング（完全一致のみ）
        if (selectedPrefix && selectedPrefix !== '' && data) {
            console.log('フィルタリング前のデータ数:', data.length);
            console.log('選択されたプレフィックス:', selectedPrefix);
            
            const filteredData = data.filter(status => {
                const statusPrefix = status.Prefix || status.PrefixName || '';
                // 完全一致のみ
                const matches = statusPrefix === selectedPrefix;
                
                if (matches) {
                    console.log('マッチ:', statusPrefix, '←', selectedPrefix);
                }
                
                return matches;
            });
            
            console.log('フィルタリング後のデータ数:', filteredData.length);
            data = filteredData;
        }

        // フィルタリングされている場合はコンテナのスタイルを変更（大きく表示）
        const container = document.getElementById('cn-status-cards-container');
        if (container) {
            if (selectedPrefix && selectedPrefix !== '' && data && data.length > 0) {
                // フィルタリング時は1列にして大きく表示
                container.style.gridTemplateColumns = '1fr';
                container.style.maxWidth = '100%';
            } else {
                // 通常時は3列固定
                container.style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
        }

        // データを表示
        displayConstructionNumberStatusPage(data || [], selectedPrefix);
    } catch (error) {
        console.error('使用状況読み込みエラー:', error);
        if (container) {
            const errorMessage = error.message || '不明なエラー';
            const errorCode = error.code || 'N/A';
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5; display: block; color: #EF4444;"></i>
                    <p style="font-size: 14px; color: #EF4444; font-weight: 600; margin: 0 0 8px 0;">読み込みエラー</p>
                    <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0;">${escapeHtml(errorMessage)}</p>
                    <p style="font-size: 11px; color: #9ca3af; margin: 0 0 12px 0;">エラーコード: ${errorCode}</p>
                    <button type="button" class="btn-secondary btn-small" onclick="loadConstructionNumberStatusPage()" 
                            style="padding: 6px 12px; font-size: 11px;">
                        <i class="fas fa-redo"></i> 再試行
                    </button>
                </div>
            `;
        }
    }
}

// ビューが使えない場合、直接テーブルから使用状況を取得（M_ConstructionNumberRuleなし）
async function loadConstructionNumberStatusFromTables() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabaseクライアントが初期化されていません');
        }

        // 並列でデータを取得
        const [ordersResult, constructNumbersResult] = await Promise.allSettled([
            supabase
                .from('t_acceptorder')
                .select('ConstructNo, OrderDate, CancelFlg')
                .or('CancelFlg.is.null,CancelFlg.eq.false'),
            supabase
                .from('t_constructionnumber')
                .select('constructno, orderdate')
        ]);

        const orders = ordersResult.status === 'fulfilled' && !ordersResult.value.error 
            ? ordersResult.value.data || [] 
            : [];
        // カラム名を正規化
        const constructNumbersRaw = constructNumbersResult.status === 'fulfilled' && !constructNumbersResult.value.error 
            ? constructNumbersResult.value.data || [] 
            : [];
        const constructNumbers = constructNumbersRaw.map(item => ({
            ConstructNo: item.constructno || '',
            OrderDate: item.orderdate || null
        }));

        // 詳細なログを出力
        console.log('=== 工事番号運用モニター データ取得結果 ===');
        console.log('t_acceptorder:', {
            status: ordersResult.status,
            error: ordersResult.status === 'rejected' ? ordersResult.reason : (ordersResult.value?.error || null),
            count: orders.length,
            sample: orders.slice(0, 3).map(o => o.ConstructNo)
        });
        console.log('t_constructionnumber:', {
            status: constructNumbersResult.status,
            error: constructNumbersResult.status === 'rejected' ? constructNumbersResult.reason : (constructNumbersResult.value?.error || null),
            count: constructNumbers.length,
            sample: constructNumbers.slice(0, 3).map(c => c.ConstructNo)
        });

        if (ordersResult.status === 'rejected' || (ordersResult.status === 'fulfilled' && ordersResult.value.error)) {
            console.warn('t_acceptorder取得エラー（無視して続行）:', ordersResult.status === 'rejected' ? ordersResult.reason : ordersResult.value.error);
        }
        if (constructNumbersResult.status === 'rejected' || (constructNumbersResult.status === 'fulfilled' && constructNumbersResult.value.error)) {
            console.error('t_constructionnumber取得エラー:', constructNumbersResult.status === 'rejected' ? constructNumbersResult.reason : constructNumbersResult.value.error);
        }

        // すべての工事番号を結合（重複除去）- 最適化
        // t_constructionnumberを優先して、t_acceptorderとマージ
        const seen = new Map(); // ConstructNo -> { ConstructNo, OrderDate, source }
        const allNumbers = [];
        
        // まず、t_constructionnumberから追加（優先）
        for (const item of constructNumbers) {
            const constructNo = String(item.ConstructNo || '').trim();
            if (constructNo && !seen.has(constructNo)) {
                seen.set(constructNo, { 
                    ConstructNo: constructNo, 
                    OrderDate: item.OrderDate,
                    source: 't_constructionnumber'
                });
            }
        }
        
        // 次に、t_acceptorderから追加（t_constructionnumberにないもののみ）
        for (const item of orders) {
            const constructNo = String(item.ConstructNo || '').trim();
            if (constructNo && !seen.has(constructNo)) {
                seen.set(constructNo, { 
                    ConstructNo: constructNo, 
                    OrderDate: item.OrderDate,
                    source: 't_acceptorder'
                });
            }
        }
        
        // Mapから配列に変換
        allNumbers.push(...Array.from(seen.values()));
        
        // デバッグログ
        console.log(`工事番号運用モニター: t_constructionnumberから${constructNumbers.length}件、t_acceptorderから${orders.length}件取得`);
        console.log(`工事番号運用モニター: 合計${allNumbers.length}件のユニークな工事番号を処理`);
        const fromTable = allNumbers.filter(n => n.source === 't_constructionnumber').length;
        const fromOrder = allNumbers.filter(n => n.source === 't_acceptorder').length;
        console.log(`工事番号運用モニター: t_constructionnumber由来${fromTable}件、t_acceptorder由来${fromOrder}件`);
        
        // サンプルデータを表示
        if (allNumbers.length > 0) {
            console.log('処理対象の工事番号サンプル（最初の10件）:', allNumbers.slice(0, 10).map(n => ({
                ConstructNo: n.ConstructNo,
                OrderDate: n.OrderDate,
                source: n.source
            })));
        } else {
            console.warn('警告: 処理対象の工事番号が0件です。t_constructionnumberテーブルにデータが存在するか確認してください。');
        }

        // 定義されているすべてのプレフィックスと範囲（キャッシュされたマップから取得）
        const prefixDefinitions = getConstructNumberRangeMap();
        
        // 実際に使用されているプレフィックスを抽出（最適化：Mapを使用）
        const prefixMap = new Map();
        
        // 各工事番号を一度だけ処理（O(n*m)からO(n)に改善）
        for (const constructNoItem of allNumbers) {
            const constructNo = String(constructNoItem.ConstructNo || '').trim();
            if (!constructNo) continue;
            
            // source情報を削除（表示には不要）
            const orderDate = constructNoItem.OrderDate;
            
            // 各プレフィックス定義をチェック（早期終了で最適化）
            for (const [prefixKey, rangeInfo] of Object.entries(prefixDefinitions)) {
                let matches = false;
                
                if (rangeInfo.pattern) {
                    // パターンベース（S, Z, D, 3Aなど）
                    if (constructNo.startsWith(rangeInfo.pattern)) {
                        const numPart = constructNo.substring(rangeInfo.pattern.length);
                        const num = parseInt(numPart, 10);
                        if (!isNaN(num) && num >= rangeInfo.min && num <= rangeInfo.max) {
                            matches = true;
                        }
                    }
                } else {
                    // 数値範囲（2000番台など）
                    const num = parseInt(constructNo, 10);
                    if (!isNaN(num) && num >= rangeInfo.min && num <= rangeInfo.max) {
                        // 1000番台の場合は、純粋な数値のみ（文字列の長さもチェック）、1001-1999の範囲
                        if (prefixKey === '1000番台') {
                            if (constructNo.length <= 4 && num >= 1001 && num <= 1999) {
                                matches = true;
                            }
                        } else {
                            matches = true;
                        }
                    }
                }
                
                if (matches) {
                    if (!prefixMap.has(prefixKey)) {
                        prefixMap.set(prefixKey, {
                            prefix: prefixKey,
                            prefixName: prefixKey,
                            rangeInfo: rangeInfo,
                            numbers: []
                        });
                    }
                    prefixMap.get(prefixKey).numbers.push({
                        ConstructNo: constructNo,
                        OrderDate: orderDate
                    });
                    break; // マッチしたら次の工事番号へ（1つの番号は1つのプレフィックスにのみ属する）
                }
            }
        }

        // プレフィックスマッチングのデバッグ
        console.log(`プレフィックス定義数: ${Object.keys(prefixDefinitions).length}`);
        console.log(`プレフィックスマップのエントリ数: ${prefixMap.size}`);
        if (prefixMap.size > 0) {
            console.log('マッチしたプレフィックス:', Array.from(prefixMap.keys()));
            prefixMap.forEach((data, key) => {
                console.log(`  ${key}: ${data.numbers.length}件の工事番号`);
            });
        } else {
            console.warn('警告: どのプレフィックスにもマッチしませんでした。工事番号の形式を確認してください。');
        }

        // 定義されているすべてのプレフィックスに対して使用状況を計算（使用されていない番台も含める）
        const statusList = [];
        
        // 定義されているすべてのプレフィックスをループ
        for (const [prefixKey, rangeInfo] of Object.entries(prefixDefinitions)) {
            // 使用されている番台かどうかを確認
            const prefixData = prefixMap.get(prefixKey);
            
            let uniqueNumbers = [];
            let latestNumber = '---';
            let latestOrderDate = null;
            
            if (prefixData && prefixData.numbers && prefixData.numbers.length > 0) {
                // 重複除去（ConstructNoで）
                const uniqueNumbersMap = new Map();
                for (const item of prefixData.numbers) {
                    if (!uniqueNumbersMap.has(item.ConstructNo)) {
                        uniqueNumbersMap.set(item.ConstructNo, item);
                    }
                }
                uniqueNumbers = Array.from(uniqueNumbersMap.values());
                
                // 最新の番号を取得
                if (uniqueNumbers.length > 0) {
                    // 数値としてソートして最大値を取得
                    const numericNumbers = uniqueNumbers
                        .map(item => {
                            let num;
                            if (rangeInfo.pattern) {
                                const numPart = item.ConstructNo.substring(rangeInfo.pattern.length);
                                num = parseInt(numPart, 10);
                            } else {
                                num = parseInt(item.ConstructNo, 10);
                            }
                            return { num, constructNo: item.ConstructNo, orderDate: item.OrderDate };
                        })
                        .filter(item => !isNaN(item.num))
                        .sort((a, b) => b.num - a.num);
                    
                    if (numericNumbers.length > 0) {
                        latestNumber = numericNumbers[0].constructNo;
                        latestOrderDate = numericNumbers[0].orderDate;
                    }
                }
            }

            // 使用数を計算
            const activeCount = uniqueNumbers.length;
            
            // 範囲を計算
            const minValue = rangeInfo.min || 0;
            const maxValue = rangeInfo.max || 0;
            const totalRange = maxValue - minValue + 1;
            
            // 使用率を計算
            const usageRate = totalRange > 0 ? (activeCount / totalRange) * 100 : 0;

            // 世代（何巡目）を計算（最大値に達した回数をカウント）
            let generation = 1;
            if (uniqueNumbers.length > 0 && maxValue > 0) {
                // 最大値に達しているかチェック
                const maxNum = uniqueNumbers
                    .map(item => {
                        let num;
                        if (rangeInfo.pattern) {
                            const numPart = item.ConstructNo.substring(rangeInfo.pattern.length);
                            num = parseInt(numPart, 10);
                        } else {
                            num = parseInt(item.ConstructNo, 10);
                        }
                        return num;
                    })
                    .filter(n => !isNaN(n))
                    .sort((a, b) => b - a)[0];
                
                if (maxNum >= maxValue) {
                    // 最大値に達している場合、巡回回数を計算
                    // 簡易計算: 使用数が範囲を超えている場合、巡回していると判断
                    generation = Math.floor(activeCount / totalRange) + 1;
                }
            }

            statusList.push({
                RuleID: prefixKey,
                Prefix: prefixKey,
                PrefixName: prefixKey,
                Description: rangeInfo.description || '',
                MinValue: minValue,
                MaxValue: maxValue,
                CurrentValue: latestNumber,
                CycleYears: null,
                CurrentGeneration: generation,
                LastCycleDate: null,
                ActiveCount: activeCount,
                CompletedCount: 0,
                TotalUsed: activeCount,
                UsageRate: usageRate,
                LatestNumber: latestNumber,
                LatestOrderDate: latestOrderDate,
                CycleStatus: usageRate > 95 ? 'まもなく巡回' : (usageRate > 80 ? '注意' : '正常'),
                Color: '#3B82F6',
                SortOrder: prefixKey,
                Active: true
            });
        }

        // SortOrderでソート（定義順に）
        const sortOrder = ['1000番台', '2000番台', '2900番台', '3000番台', '3A00番台', '3B00番台', '3C00番台', '3P00番台', '3T00番台', 
                          '4000番台', '4A00番台', '4B00番台', '4C00番台', '4P00番台', '4T00番台',
                          '5000番台', '5A00番台', '5B00番台', '5E00番台',
                          '6000番台', '7000番台', '7P00番台', '8000番台', '8A00番台', '8B00番台', '8E00番台', '9000番台',
                          'S000番台', 'Z000番台', 'D000番台'];
        
        statusList.sort((a, b) => {
            const indexA = sortOrder.indexOf(a.Prefix);
            const indexB = sortOrder.indexOf(b.Prefix);
            if (indexA === -1 && indexB === -1) return a.Prefix.localeCompare(b.Prefix);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        return statusList;
    } catch (error) {
        console.error('テーブルから使用状況を取得する際にエラーが発生しました:', error);
        throw error;
    }
}

// 使用状況を表示（ページ版）- カード形式のダッシュボード
function displayConstructionNumberStatusPage(statusList, selectedPrefix = null) {
    const container = document.getElementById('cn-status-cards-container');
    if (!container) {
        console.error('cn-status-cards-container要素が見つかりません');
        return;
    }

    if (!statusList || statusList.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-inbox" style="font-size: 24px; margin-bottom: 12px; opacity: 0.3; display: block; color: var(--text-tertiary);"></i>
                <p style="color: var(--text-tertiary); font-size: 14px; margin: 0;">データがありません</p>
            </div>
        `;
        return;
    }

    // 選択された番台がある場合は、その番台の説明を取得
    let selectedDescription = '';
    let selectedCategoryColor = '#3B82F6';
    if (selectedPrefix) {
        const rangeInfo = getConstructNumberRange(selectedPrefix);
        if (rangeInfo) {
            selectedDescription = rangeInfo.description || '';
            selectedCategoryColor = rangeInfo.categoryColor || '#3B82F6';
        }
    }

    // 選択された番台がある場合は説明を表示
    let headerHtml = '';
    if (selectedPrefix && selectedDescription) {
        headerHtml = `
            <div style="grid-column: 1/-1; background: ${selectedCategoryColor}15; border-left: 4px solid ${selectedCategoryColor}; border-radius: 4px; padding: 12px 16px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 12px; color: ${selectedCategoryColor}; font-weight: 700; background: ${selectedCategoryColor}; color: white; padding: 4px 8px; border-radius: 4px;">
                        ${escapeHtml(selectedPrefix.replace('番台', ''))}
                    </div>
                    <div style="font-size: 13px; color: #374151; font-weight: 600; line-height: 1.5;">
                        ${escapeHtml(selectedDescription)}
                    </div>
                </div>
            </div>
        `;
    }

    // 3列×11行のグリッドレイアウトで表示
    container.innerHTML = headerHtml + statusList.map((status, index) => {
        const usageRate = parseFloat(status.UsageRate || 0);
        
        // PDFの分類に基づいた色を取得
        const rangeInfo = getConstructNumberRange(status.Prefix || status.PrefixName || '');
        const categoryColor = rangeInfo ? (rangeInfo.categoryColor || '#3B82F6') : '#3B82F6';
        
        // 使用率に応じた色判定（カテゴリ色をベースに）
        let color = categoryColor;
        let statusLabel = '良好';
        let bgLight = categoryColor + '15';
        
        if (usageRate > 95) {
            color = '#EF4444'; // 赤（危険）
            statusLabel = 'まもなく巡回';
            bgLight = '#fef2f2';
        } else if (usageRate > 80) {
            color = '#F59E0B'; // 黄（注意）
            statusLabel = '注意';
            bgLight = '#fffbeb';
        } else {
            // 使用率が低い場合はカテゴリ色を使用
            color = categoryColor;
            bgLight = categoryColor + '15';
        }

        // プレフィックス名を取得（「番台」を削除して表示）
        let prefixDisplay = status.PrefixName || status.Prefix || '';
        if (prefixDisplay.includes('番台')) {
            prefixDisplay = prefixDisplay.replace('番台', '');
        }

        // 最新の番号を取得
        const latestNumber = status.LatestNumber || status.CurrentValue || '---';
        
        // 使用済み数と範囲上限を取得
        const activeCount = status.ActiveCount || 0;
        const maxValue = status.MaxValue || status.MaxRange || 0;
        const minValue = status.MinValue || status.MinRange || 0;
        const totalRange = maxValue - minValue + 1;
        const remaining = Math.max(0, totalRange - activeCount);
        
        // 説明文を取得
        const description = status.Description || '';

        // 世代（何巡目）を取得
        const generation = status.CurrentGeneration || 1;
        const generationText = `${generation}巡目`;

        // 3列×11行の細長いカード形式
        // インデックスに基づいて背景色を交互に変更
        const cellBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        
        // アイコンを選択（使用率に応じて）
        let icon = 'fa-check-circle';
        let iconColor = color;
        if (usageRate > 95) {
            icon = 'fa-exclamation-triangle';
            iconColor = '#EF4444';
        } else if (usageRate > 80) {
            icon = 'fa-exclamation-circle';
            iconColor = '#F59E0B';
        } else if (usageRate > 50) {
            icon = 'fa-info-circle';
            iconColor = categoryColor;
        } else {
            icon = 'fa-check-circle';
            iconColor = categoryColor;
        }
        
        return `
            <div class="status-card" onclick="selectPrefixPage('${status.Prefix || ''}')" 
                 style="background: linear-gradient(135deg, ${cellBg} 0%, ${cellBg === '#ffffff' ? '#f8f9fa' : '#ffffff'} 100%); 
                        border: 1px solid #e5e7eb; border-left: 3px solid ${color}; border-radius: 8px; padding: 8px 12px; 
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; overflow: hidden; 
                        display: flex; flex-direction: row; align-items: center; gap: 10px; min-height: 48px; 
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);"
                 onmouseover="this.style.background='linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)'; this.style.borderLeftColor='${color}'; this.style.borderLeftWidth='4px'; this.style.boxShadow='0 3px 8px rgba(59,130,246,0.12), 0 1px 3px rgba(0,0,0,0.08)'; this.style.transform='translateX(2px) scale(1.005)';"
                 onmouseout="this.style.background='linear-gradient(135deg, ${cellBg} 0%, ${cellBg === '#ffffff' ? '#f8f9fa' : '#ffffff'} 100%)'; this.style.borderLeftColor='${color}'; this.style.borderLeftWidth='3px'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'; this.style.transform='translateX(0) scale(1)';"
                 title="${escapeHtml(description)}">
                
                <!-- 左側: アイコンとプレフィックス -->
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; min-width: 70px;">
                    <div style="font-size: 14px; color: ${iconColor}; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: ${iconColor}15; border-radius: 6px;">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 1px;">
                        <div style="font-size: 11px; color: #374151; font-weight: 700; line-height: 1.1;">
                            ${escapeHtml(prefixDisplay)}
                        </div>
                        <div style="font-size: 8px; color: #fff; background: ${color}; padding: 1px 4px; border-radius: 3px; font-weight: 700; white-space: nowrap; display: inline-block; line-height: 1.2;">
                            ${generationText}
                        </div>
                    </div>
                </div>
                
                <!-- 中央: 最新番号（強調） -->
                <div style="flex: 0 0 85px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="font-size: 9px; color: #6b7280; font-weight: 600; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.1;">
                        最新
                    </div>
                    <div style="font-size: 16px; font-weight: 900; color: ${color}; font-family: 'JetBrains Mono', 'Courier New', monospace; line-height: 1.1; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                        ${escapeHtml(String(latestNumber))}
                    </div>
                </div>
                
                <!-- プログレスバー（横長） -->
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; justify-content: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; height: 10px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 5px; overflow: hidden; position: relative; border: 1px solid #e5e7eb; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                            <div style="width: ${Math.min(usageRate, 100)}%; height: 100%; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); border-radius: 5px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0,0,0,0.15); position: relative; overflow: hidden;">
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%); animation: shimmer 2s infinite;"></div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: ${color}; font-weight: 700; width: 42px; text-align: right; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; line-height: 1.1;">
                            ${usageRate.toFixed(1)}%
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 9px; color: #64748b; line-height: 1.1;">
                        <span style="display: flex; align-items: center; gap: 3px;">
                            <i class="fas fa-check" style="color: ${color}; font-size: 7px;"></i>
                            <strong style="color: ${color}; font-weight: 800;">${activeCount}</strong>/${totalRange}
                        </span>
                        <span style="color: #cbd5e1;">|</span>
                        <span style="display: flex; align-items: center; gap: 3px;">
                            <i class="fas fa-hourglass-half" style="color: #94a3b8; font-size: 7px;"></i>
                            残<strong style="color: ${color}; font-weight: 800;">${remaining}</strong>
                        </span>
                    </div>
                </div>
            </div>
            <style>
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            </style>
        `;
    }).join('');
}

// プレフィックスを選択（ページ版）
function selectPrefixPage(prefix) {
    const select = document.getElementById('construct-number-select-page');
    if (select) {
        // プレフィックスに一致するオプションを探す
        const options = select.options;
        for (let i = 0; i < options.length; i++) {
            const optionValue = options[i].value.replace('番台', '').trim();
            if (optionValue === prefix || optionValue.startsWith(prefix)) {
                select.value = options[i].value;
                // 工事番号を取得
                getConstructNumberPage();
                break;
            }
        }
    }
}

// 使用状況一覧を更新（ページ版）
function refreshConstructionNumberStatusPage() {
    loadConstructionNumberStatusPage();
}

// 工事番号確認モーダルを結果表示用に書き換える関数
function showConstructionNumberResultModal(constructNumber, isSuccess, message) {
    const confirmModal = document.getElementById('construct-number-confirm-modal');
    const confirmMessage = document.getElementById('construct-number-confirm-message');
    const confirmValue = document.getElementById('construct-number-confirm-value');
    const modalHeader = confirmModal?.querySelector('.modal-header h2');
    const okBtn = document.getElementById('construct-number-confirm-ok');
    const cancelBtn = document.getElementById('construct-number-confirm-cancel');
    
    if (!confirmModal || !confirmMessage || !confirmValue || !modalHeader || !okBtn) {
        console.error('モーダル要素が見つかりません');
        return;
    }
    
    // ヘッダータイトルを変更
    if (isSuccess) {
        modalHeader.textContent = '登録完了';
    } else {
        modalHeader.textContent = '登録失敗';
    }
    
    // メッセージを変更
    confirmMessage.textContent = message;
    
    // 工事番号の表示を変更
    if (isSuccess && constructNumber) {
        confirmValue.textContent = constructNumber;
        confirmValue.style.display = 'block';
    } else {
        confirmValue.style.display = 'none';
    }
    
    // キャンセルボタンを非表示
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    // OKボタンを更新
    okBtn.innerHTML = 'OK';
    okBtn.disabled = false;
    
    // 既存のイベントリスナーを削除してから追加
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    // OKボタンのイベントリスナーを設定
    newOkBtn.addEventListener('click', () => {
        confirmModal.classList.remove('modal-active');
        confirmModal.style.display = 'none';
        confirmModal.style.visibility = 'hidden';
        confirmModal.style.opacity = '0';
        confirmModal.style.pointerEvents = 'none';
        
        // モーダルを元の状態に戻す
        modalHeader.textContent = '工事番号確認';
        confirmMessage.textContent = '以下の工事番号を使用しますか？';
        confirmValue.style.display = 'block';
        const cancelBtnRestore = document.getElementById('construct-number-confirm-cancel');
        if (cancelBtnRestore) {
            cancelBtnRestore.style.display = 'block';
        }
        const okBtnRestore = document.getElementById('construct-number-confirm-ok');
        if (okBtnRestore) {
            okBtnRestore.innerHTML = '<i class="fas fa-check"></i> 使用する';
        }
    });
    
    // モーダルを表示
    confirmModal.removeAttribute('hidden');
    confirmModal.classList.add('modal-active');
    confirmModal.style.setProperty('display', 'flex', 'important');
    confirmModal.style.setProperty('visibility', 'visible', 'important');
    confirmModal.style.setProperty('opacity', '1', 'important');
    confirmModal.style.setProperty('pointer-events', 'auto', 'important');
    confirmModal.style.setProperty('z-index', '30000', 'important');
}

// 取得した工事番号を登録フォームに適用（ページ版）
function applyConstructNumberPage() {
    // 工事番号採番ページが表示されているか確認
    const constructNumberPage = document.getElementById('construct-number-page');
    if (!constructNumberPage || !constructNumberPage.classList.contains('active')) {
        console.warn('工事番号採番ページが表示されていないため、モーダルを表示しません');
        return;
    }
    
    const resultInput = document.getElementById('construct-number-result-page');
    
    if (!resultInput || !resultInput.value || resultInput.value.trim() === '') {
        showMessage('工事番号が取得されていません', 'warning');
        return;
    }
    
    // カスタム確認モーダルを表示
    const constructNumber = resultInput.value.trim();
    if (!constructNumber) {
        return;
    }
    
    const confirmModal = document.getElementById('construct-number-confirm-modal');
    const confirmValue = document.getElementById('construct-number-confirm-value');
    
    if (confirmModal && confirmValue) {
        // モーダルが既に表示されている場合は何もしない
        if (confirmModal.style.display === 'flex' || confirmModal.style.display === '') {
            return;
        }
        
        // 再度、工事番号採番ページが表示されているか確認
        const currentConstructNumberPage = document.getElementById('construct-number-page');
        if (!currentConstructNumberPage || !currentConstructNumberPage.classList.contains('active')) {
            console.warn('工事番号採番ページが表示されていないため、モーダルを表示しません');
            return;
        }
        
        // ダッシュボードページが表示されていないことを最終確認
        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage && dashboardPage.classList.contains('active')) {
            console.warn('ダッシュボードページが表示されているため、モーダルを表示しません');
            return;
        }
        
        // ダッシュボードページが表示されていないことを最終確認（もう一度）
        const finalDashboardCheck = document.getElementById('dashboard-page');
        if (finalDashboardCheck && finalDashboardCheck.classList.contains('active')) {
            console.warn('ダッシュボードページが表示されているため、モーダルを表示しません（最終確認）');
            return;
        }
        
        confirmValue.textContent = constructNumber;
        confirmModal.removeAttribute('hidden');
        confirmModal.classList.add('modal-active');
        confirmModal.style.setProperty('display', 'flex', 'important');
        confirmModal.style.setProperty('visibility', 'visible', 'important');
        confirmModal.style.setProperty('opacity', '1', 'important');
        confirmModal.style.setProperty('pointer-events', 'auto', 'important');
        confirmModal.style.setProperty('z-index', '30000', 'important');
        
        // イベントリスナーを設定（既存のものを削除してから追加）
        const okBtn = document.getElementById('construct-number-confirm-ok');
        const cancelBtn = document.getElementById('construct-number-confirm-cancel');
        
        // 既存のイベントリスナーを削除
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // 新しいイベントリスナーを追加
        newOkBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // ボタンを無効化して二重クリックを防止
            newOkBtn.disabled = true;
            newOkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登録中...';
            
            try {
                const modalSelect = document.getElementById('construct-number-select-page');
                
                // この時点で使用済みとして記録（T_ConstructionNumberテーブルに保存）
                const today = new Date().toISOString().split('T')[0];
                console.log('工事番号を登録します:', constructNumber, today);
                const saved = await saveUsedConstructNumberToTable(constructNumber, today);
                
                if (saved) {
                    console.log('✓ 工事番号を登録しました:', constructNumber);
                    
                    // モーダルを閉じる
                    confirmModal.classList.remove('modal-active');
                    confirmModal.style.display = 'none';
                    confirmModal.style.visibility = 'hidden';
                    confirmModal.style.opacity = '0';
                    confirmModal.style.pointerEvents = 'none';
                    
                    // 使用済み一覧を更新
                    if (modalSelect && modalSelect.value) {
                        await loadUsedConstructNumbersListPage(modalSelect.value || null);
                    } else {
                        await loadUsedConstructNumbersListPage(null);
                    }
                    
                    // モニター（使用状況一覧）も更新
                    await loadConstructionNumberStatusPage();
                    
                    console.log('一覧を更新しました');
                    
                    // 結果入力欄をクリア（次の番号取得に備える）
                    const resultInput = document.getElementById('construct-number-result-page');
                    if (resultInput) {
                        resultInput.value = '';
                    }
                    
                    // 成功メッセージを表示
                    showMessage(`工事番号「${constructNumber}」を登録しました`, 'success');
                } else {
                    console.error('✗ 工事番号の登録に失敗しました:', constructNumber);
                    // エラーメッセージを表示
                    showMessage(`工事番号「${constructNumber}」の登録に失敗しました`, 'error');
                }
            } catch (error) {
                console.error('工事番号登録エラー:', error);
                console.error('エラー詳細:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                
                // エラーメッセージを表示
                showMessage('工事番号の登録に失敗しました: ' + (error.message || '不明なエラー'), 'error');
            } finally {
                // ボタンを再度有効化
                newOkBtn.disabled = false;
                newOkBtn.innerHTML = '<i class="fas fa-check"></i> 使用する';
            }
            
            return false;
        });
        
        newCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            confirmModal.classList.remove('modal-active');
            confirmModal.style.display = 'none';
            return false;
        });
    } else {
        // フォールバック：標準のconfirmを使用
        if (confirm(`工事番号「${constructNumber}」を使用しますか？`)) {
            const constructNoInput = document.querySelector('input[name="Construct No"]');
            const koujibangouSelect = document.querySelector('select[name="工事番号台"]');
            const modalSelect = document.getElementById('construct-number-select-page');
            
            if (constructNoInput) {
                constructNoInput.value = constructNumber;
            }
            
            if (koujibangouSelect && modalSelect && modalSelect.value) {
                koujibangouSelect.value = modalSelect.value;
            }
            
            showMessage(`工事番号「${constructNumber}」を適用しました`, 'success');
        }
    }
}

// T_ConstructionNumberテーブルに工事番号を保存
async function saveUsedConstructNumberToTable(constructNumber, orderDate) {
    if (!constructNumber || !orderDate) {
        console.error('工事番号またはオーダーデートが指定されていません');
        return false;
    }

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabaseクライアントが初期化されていません');
            return false;
        }

        console.log('工事番号登録を開始:', constructNumber, orderDate);

        // 重複チェック
        console.log('重複チェックを実行します...');
        const { data: existingData, error: checkError } = await supabase
            .from('t_constructionnumber')
            .select('constructno')
            .eq('constructno', constructNumber)
            .limit(1);
        
        if (checkError) {
            console.error('重複チェックエラー:', checkError);
            console.error('重複チェックエラー詳細:', {
                message: checkError.message,
                code: checkError.code,
                details: checkError.details,
                hint: checkError.hint
            });
        } else if (existingData && existingData.length > 0) {
            console.log('工事番号は既に登録されています:', constructNumber);
            return true;
        }
        
        // データを挿入
        console.log('データを挿入します:', { constructno: constructNumber, orderdate: orderDate });
        const { data: insertData, error: insertError } = await supabase
            .from('t_constructionnumber')
            .insert({
                constructno: constructNumber,
                orderdate: orderDate
            })
            .select();
        
        console.log('挿入結果:', JSON.stringify({ data: insertData, error: insertError }, null, 2));
        
        if (insertError) {
            // 重複エラーの場合は成功として扱う
            if (insertError.code === '23505') {
                console.log('工事番号は既に登録されています（重複エラー）:', constructNumber);
                return true;
            }
            
            console.error('t_constructionnumberへの登録に失敗しました:', JSON.stringify(insertError, null, 2));
            console.error('エラー詳細:', JSON.stringify({
                message: insertError.message,
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint,
                status: insertError.status,
                statusText: insertError.statusText
            }, null, 2));
            return false;
        }
        
        console.log('工事番号をt_constructionnumberに保存しました:', constructNumber, orderDate);
        return true;
    } catch (error) {
        console.error('工事番号保存エラー:', error);
        return false;
    }
}

// 使用済み工事番号一覧を読み込む（ページ表示用）
// T_ConstructionNumberテーブルから取得
async function loadUsedConstructNumbersListPage(filterPrefix = null) {
    const tbody = document.getElementById('used-construct-numbers-list-page');
    if (!tbody) return;
    
    try {
        const supabase = getSupabaseClient();
        
        if (!supabase) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                        <span style="font-size: 13px;">Supabaseクライアントが初期化されていません</span>
                    </td>
                </tr>
            `;
            return;
        }

        // T_ConstructionNumberテーブルから取得
        let query = supabase
            .from('t_constructionnumber')
            .select('constructno, orderdate')
            .order('orderdate', { ascending: false })
            .order('constructno', { ascending: true });
    
    // フィルタリング：工事番号台が選択されている場合
    if (filterPrefix) {
        const koujiValue = filterPrefix.replace('番台', '').trim();
        
            // 数字のみの場合は適切なプレフィックスでフィルタリング
            if (/^\d+$/.test(koujiValue)) {
                // 2000番台の場合、「20」で始まる番号を取得（後で2001～2899の範囲でフィルタ）
                if (koujiValue === '2000') {
                    query = query.like('ConstructNo', '2%');
                } else if (koujiValue === '3000') {
                    // 3000番台の場合、「3」で始まる番号を取得（後で3001～3999の範囲でフィルタ）
                    query = query.like('ConstructNo', '3%');
                } else if (koujiValue === '4000') {
                    // 4000番台の場合、「4」で始まる番号を取得（後で4001～4999の範囲でフィルタ）
                    query = query.like('ConstructNo', '4%');
                } else if (koujiValue === '5000') {
                    // 5000番台の場合、「5」で始まる番号を取得（後で5001～5999の範囲でフィルタ）
                    query = query.like('ConstructNo', '5%');
                } else if (koujiValue.length >= 4) {
                    // その他の4文字以上の数字は最初の4文字でフィルタ
                    query = query.like('ConstructNo', `${koujiValue.substring(0, 4)}%`);
                } else if (koujiValue.length >= 2) {
                    // 2-3文字の場合は最初の2文字でフィルタ（例：10番台 → 10で始まる）
                    query = query.like('ConstructNo', `${koujiValue.substring(0, 2)}%`);
                }
            } else if (koujiValue.length >= 1 && /^[A-Z]$/.test(koujiValue.substring(0, 1))) {
                // 1文字のアルファベット（S, T, Z, Dなど）
                query = query.like('ConstructNo', `${koujiValue.substring(0, 1)}%`);
            } else if (koujiValue.length >= 2) {
                // 2文字以上のアルファベット+数字（3B, 3C, 4Cなど）
                query = query.like('ConstructNo', `${koujiValue.substring(0, 2)}%`);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('工事番号一覧取得エラー:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                        <span style="font-size: 13px;">データの取得に失敗しました</span>
                    </td>
                </tr>
            `;
            return;
        }

        // カラム名を正規化
        let usedNumbers = (data || []).map(item => ({
            ConstructNo: item.constructno || '',
            OrderDate: item.orderdate || ''
        }));
    
    // 範囲フィルタリング（2000番台 = 2001～2899など）
    if (filterPrefix) {
        const koujiValue = filterPrefix.replace('番台', '').trim();
        if (/^\d+$/.test(koujiValue)) {
            if (koujiValue === '2000') {
                // 2000番台：2001～2899の範囲
                usedNumbers = usedNumbers.filter(item => {
                    const num = parseInt(item.ConstructNo);
                    return !isNaN(num) && num >= 2001 && num <= 2899;
                });
            } else if (koujiValue === '3000') {
                // 3000番台：3001～3999の範囲
                usedNumbers = usedNumbers.filter(item => {
                    const num = parseInt(item.ConstructNo);
                    return !isNaN(num) && num >= 3001 && num <= 3999;
                });
            } else if (koujiValue === '4000') {
                // 4000番台：4001～4999の範囲
                usedNumbers = usedNumbers.filter(item => {
                    const num = parseInt(item.ConstructNo);
                    return !isNaN(num) && num >= 4001 && num <= 4999;
                });
            } else if (koujiValue === '5000') {
                // 5000番台：5001～5999の範囲
                usedNumbers = usedNumbers.filter(item => {
                    const num = parseInt(item.ConstructNo);
                    return !isNaN(num) && num >= 5001 && num <= 5999;
                });
            }
        }
    }
    
    // ボタンの表示（権限チェックなし）
    const clearBtn = document.getElementById('clear-used-btn-page');
    if (clearBtn) clearBtn.style.display = 'inline-block';
    
    // 使用件数を表示（非表示）
    const countDisplay = document.getElementById('used-count-display-page');
    if (countDisplay) {
        countDisplay.innerHTML = '';
    }
    
    if (usedNumbers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                    <span style="font-size: 13px;">${filterPrefix ? '該当する運用中工事番号はありません' : '運用中工事番号はありません'}</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // 工事番号でソート（連番順）
    const sorted = usedNumbers.sort((a, b) => {
            const numA = String(a.ConstructNo || '').trim();
            const numB = String(b.ConstructNo || '').trim();
        // 数値部分と文字列部分を分離して比較
        const extractParts = (str) => {
            const match = str.match(/^([A-Z]*)(\d+)$/);
            if (match) {
                return { prefix: match[1] || '', number: parseInt(match[2], 10) };
            }
            return { prefix: str, number: 0 };
        };
            const partsA = extractParts(numA);
            const partsB = extractParts(numB);
        
        // プレフィックスで比較
        if (partsA.prefix !== partsB.prefix) {
            return partsA.prefix.localeCompare(partsB.prefix);
        }
        // 数値で比較
        return partsA.number - partsB.number;
    });
    
        tbody.innerHTML = sorted.map((item) => {
            const num = item.ConstructNo || '';
            const date = item.OrderDate ? new Date(item.OrderDate).toLocaleDateString('ja-JP') : '';
        
        return `
            <tr style="border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''">
                <td style="padding: 8px 10px; font-weight: 600; font-size: 11px; color: var(--text-primary); word-break: break-all; text-align: center;">
                    <span style="display: inline-flex; align-items: center; gap: 4px; justify-content: center;">
                        <span style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; white-space: nowrap;">${num}</span>
                    </span>
                </td>
                <td style="padding: 8px 10px; text-align: center; font-size: 10px; color: var(--text-secondary); white-space: nowrap;">
                    ${date ? `<span style="font-size: 10px;">${date}</span>` : '<span style="color: var(--text-tertiary); font-size: 10px;">-</span>'}
                </td>
            </tr>
        `;
    }).join('');
    } catch (error) {
        console.error('工事番号一覧読み込みエラー:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="2" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <span style="font-size: 13px;">エラーが発生しました</span>
                </td>
            </tr>
        `;
    }
}

// 工事番号をコピー（ページ版）
function copyConstructNumberPage() {
    const resultInput = document.getElementById('construct-number-result-page');
    if (!resultInput || !resultInput.value) {
        showMessage('コピーする工事番号がありません', 'warning');
        return;
    }
    
    resultInput.select();
    document.execCommand('copy');
    showMessage('工事番号をクリップボードにコピーしました', 'success');
}

// 工事番号一覧を表示するヘルパー関数
function displayConstructNumbers(tbody, data, filterPrefix, isLocalOnly = false) {
    let usedNumbers = data.map(item => ({
        ConstructNo: item.ConstructNo || '',
        OrderDate: item.OrderDate || ''
    }));
    
    // フィルタリング
    if (filterPrefix) {
        const koujiValue = filterPrefix.replace('番台', '').trim();
        if (/^\d+$/.test(koujiValue)) {
            if (koujiValue === '2000') {
                usedNumbers = usedNumbers.filter(item => {
                    const num = parseInt(item.ConstructNo);
                    return !isNaN(num) && num >= 2001 && num <= 2899;
                });
            } else if (koujiValue === '3000') {
                usedNumbers = usedNumbers.filter(item => {
                    const num = parseInt(item.ConstructNo);
                    return !isNaN(num) && num >= 3001 && num <= 3999;
                });
            } else if (koujiValue === '1000') {
                usedNumbers = usedNumbers.filter(item => {
                    const num = parseInt(item.ConstructNo);
                    return !isNaN(num) && num >= 1001 && num <= 1999;
                });
            }
        }
    }
    
    if (usedNumbers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                    <span style="font-size: 13px;">${filterPrefix ? '該当する運用中工事番号はありません' : '運用中工事番号はありません'}</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // ソート
    usedNumbers.sort((a, b) => {
        const numA = parseInt(a.ConstructNo) || 0;
        const numB = parseInt(b.ConstructNo) || 0;
        return numA - numB;
    });
    
    // 表示
    tbody.innerHTML = usedNumbers.map(item => `
        <tr>
            <td style="padding: 8px 12px; font-weight: 600;">${escapeHtml(String(item.ConstructNo))}</td>
            <td style="padding: 8px 12px; color: var(--text-secondary);">${item.OrderDate || '-'}</td>
        </tr>
    `).join('');
    
    if (isLocalOnly) {
        console.log('ローカルストレージのデータを表示しました:', usedNumbers.length, '件');
    }
}

// グローバルに公開
window.getConstructNumberPage = getConstructNumberPage;
window.applyConstructNumberPage = applyConstructNumberPage;
window.copyConstructNumberPage = copyConstructNumberPage;
window.editAllUsedConstructNumbers = editAllUsedConstructNumbers;
window.removeUsedConstructNumberFromEdit = removeUsedConstructNumberFromEdit;
window.saveAllUsedConstructNumbers = saveAllUsedConstructNumbers;
window.selectPrefixPage = selectPrefixPage;
window.refreshConstructionNumberStatusPage = refreshConstructionNumberStatusPage;
window.exportUsedConstructNumbers = exportUsedConstructNumbers;
window.importUsedConstructNumbersCSV = importUsedConstructNumbersCSV;

// プレフィックスから範囲情報を取得する関数
// 範囲定義のマップ（キャッシュ用）
// PDFの分類に基づいて色分け
// VB.NETコードに基づいて正確な範囲を設定
const CONSTRUCT_NUMBER_RANGES = {
    '1000番台': { min: 1001, max: 1999, description: '営業手配(メーカーから客先へ直送／社内手配なし)', categoryColor: '#9CA3AF' }, // グレー（営業手配）1001-1999
    '2000番台': { min: 2001, max: 2899, description: '受注金額2000万円以上', categoryColor: '#F97316' }, // オレンジ（高額受注）2001-2899
    '2900番台': { min: 2901, max: 2999, description: '受注間近で受注金額2000万円以上', categoryColor: '#F59E0B' }, // アンバー（未受注品）2901-2999
    '3000番台': { min: 3001, max: 3899, description: '通常の組立品', categoryColor: '#3B82F6' }, // 青（組立品）3001-3899
    '3A00番台': { min: 3001, max: 3099, pattern: '3A', description: '2000番の出荷前の追加受注（組立品と単品部品）', categoryColor: '#3B82F6' },
    '3B00番台': { min: 3001, max: 3099, pattern: '3B', description: '2000番の出荷後・検収前の追加受注（組立品と単品部品）', categoryColor: '#3B82F6' },
    '3C00番台': { min: 3001, max: 3099, pattern: '3C', description: '簡単な組立品(一部分/図面変更なし)', categoryColor: '#3B82F6' },
    '3P00番台': { min: 3001, max: 3099, pattern: '3P', description: '図面変更・仕様変更する部品', categoryColor: '#3B82F6' },
    '3T00番台': { min: 3001, max: 3099, pattern: '3T', description: 'オーバーホール等の点検(ダイセット以外)', categoryColor: '#3B82F6' },
    '3V00番台': { min: 3001, max: 3099, pattern: '3V', description: 'SVのみ', categoryColor: '#3B82F6' },
    '3K00番台': { min: 3001, max: 3099, pattern: '3K', description: '現地工事に使用する部品', categoryColor: '#3B82F6' },
    '4000番台': { min: 4001, max: 4899, description: '通常の組立品', categoryColor: '#3B82F6' }, // 青（組立品）4001-4899
    '4A00番台': { min: 4001, max: 4099, pattern: '4A', description: '2000番の出荷前の追加受注（組立品と単品部品）', categoryColor: '#3B82F6' },
    '4B00番台': { min: 4001, max: 4099, pattern: '4B', description: '2000番の出荷後・検収前の追加受注（組立品と単品部品）', categoryColor: '#3B82F6' },
    '4C00番台': { min: 4001, max: 4099, pattern: '4C', description: '簡単な組立品(一部分/図面変更なし)', categoryColor: '#3B82F6' },
    '4P00番台': { min: 4001, max: 4099, pattern: '4P', description: '図面変更・仕様変更する部品', categoryColor: '#3B82F6' },
    '4T00番台': { min: 4001, max: 4099, pattern: '4T', description: 'オーバーホール等の点検(ダイセット以外)', categoryColor: '#3B82F6' },
    '4V00番台': { min: 4001, max: 4099, pattern: '4V', description: 'SVのみ', categoryColor: '#3B82F6' },
    '5000番台': { min: 5001, max: 5999, description: '上記以外の単品部品', categoryColor: '#10B981' }, // 緑（単品部品）5001-5999
    '5A00番台': { min: 5001, max: 5099, pattern: '5A', description: '2000番の出荷前の追加受注（単品部品のみ）', categoryColor: '#10B981' },
    '5B00番台': { min: 5001, max: 5099, pattern: '5B', description: '2000番の出荷後・検収前の追加受注（単品部品のみ）', categoryColor: '#10B981' },
    '5E00番台': { min: 5001, max: 5099, pattern: '5E', description: '仕様内の新造管サイズ追加の部品・新規治具', categoryColor: '#10B981' },
    '6000番台': { min: 6001, max: 6999, description: '未定義', categoryColor: '#8B5CF6' }, // 紫 6001-6999
    '7000番台': { min: 7001, max: 7999, description: '出荷後無償手配（上記以外）', categoryColor: '#EC4899' }, // ピンク（出荷後無償）7001-7999
    '7P00番台': { min: 7001, max: 7099, pattern: '7P', description: '出荷後無償手配（パーツ課から出荷する単品部品）', categoryColor: '#EC4899' },
    '8000番台': { min: 8001, max: 8999, description: '上記以外の単品部品', categoryColor: '#10B981' }, // 緑（単品部品）8001-8999
    '8A00番台': { min: 8001, max: 8099, pattern: '8A', description: '2000番の出荷前の追加受注（単品部品のみ）', categoryColor: '#10B981' },
    '8B00番台': { min: 8001, max: 8099, pattern: '8B', description: '2000番の出荷後・検収前の追加受注（単品部品のみ）', categoryColor: '#10B981' },
    '8E00番台': { min: 8001, max: 8099, pattern: '8E', description: '仕様内の新造管サイズ追加の部品・新規治具', categoryColor: '#10B981' },
    '9000番台': { min: 9001, max: 9999, description: '試作品、テスト用設備、将来の受注のための先行設計', categoryColor: '#FCD34D' }, // 黄（試作品）9001-9999
    'S000番台': { min: 1, max: 999, pattern: 'S', description: '先行手配(製造管理部が手配。後で正規工番に振替える。)', categoryColor: '#06B6D4' }, // シアン（先行手配）S001-S999
    'Z000番台': { min: 1, max: 999, pattern: 'Z', description: '出荷後無償手配→有償に変更', categoryColor: '#EF4444' }, // 赤（有償変更）Z001-Z999
    'D000番台': { min: 1, max: 999, pattern: 'D', description: 'ダイセット（オーバーホール、一部組立品）', categoryColor: '#92400E' } // 茶（ダイセット）D001-D999
};

function getConstructNumberRange(prefix) {
    return CONSTRUCT_NUMBER_RANGES[prefix] || null;
}

// 範囲定義のマップを取得（グローバルに公開）
function getConstructNumberRangeMap() {
    return CONSTRUCT_NUMBER_RANGES;
}

// グローバルに公開
window.getConstructNumberRangeMap = getConstructNumberRangeMap;

// 工事番号採番の修正版関数
async function getConstructNumber() {
    const selectElement = document.getElementById('construct-number-select');
    const resultInput = document.getElementById('construct-number-result');
    const applyBtn = document.getElementById('apply-construct-number-btn');
    const selectedPrefix = selectElement.value;
    
    if (!selectedPrefix) {
        showMessage('工事番号台を選択してください', 'error');
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showMessage('Supabaseクライアントが初期化されていません', 'error');
            return;
        }
        
        // プレフィックスから範囲情報を取得
        const rangeInfo = getConstructNumberRange(selectedPrefix);
        if (!rangeInfo) {
            showMessage('選択された番台の範囲情報が見つかりません', 'error');
            return;
        }
        
        console.log('Range info:', rangeInfo); // デバッグ用
        
        let newNumber;
        let newNumberStr;
        
        // パターンの有無で処理を分岐
        if (rangeInfo.pattern) {
            // ========================================
            // パターンがある場合（S, Z, D, 3A, 4B等）
            // ========================================
            
            // T_ConstructionNumberから取得（複数のカラム名を試行）
            let patternData1 = [];
            let patternError1 = null;
            
            let result1 = await supabase
                .from('t_constructionnumber')
                .select('constructno')
                .like('constructno', rangeInfo.pattern + '%')
                .order('constructno', { ascending: false });
            
            if (!result1.error && result1.data) {
                // カラム名を正規化
                patternData1 = result1.data.map(item => ({ ConstructNo: item.constructno }));
            } else {
                patternError1 = result1.error;
            }
            
            if (patternError1) {
                console.error('T_ConstructionNumber取得エラー:', patternError1);
            }
            
            // t_AcceptOrderから取得（CancelFlgがfalseのもののみ）
            let patternData2 = [];
            const tableNames = ['t_acceptorder'];
            for (const tableName of tableNames) {
                try {
                    const { data: data2, error: error2 } = await supabase
                        .from(tableName)
                        .select('ConstructNo, CancelFlg')
                        .like('ConstructNo', rangeInfo.pattern + '%');
                    
                    if (!error2 && data2) {
                        patternData2 = data2.filter(item => !item.CancelFlg && item.ConstructNo);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // 両方のデータを結合して重複を除去
            const allPatternData = [...(patternData1 || []), ...patternData2];
            const uniquePatternData = [];
            const seen = new Set();
            for (const item of allPatternData) {
                const constructNo = item.ConstructNo || item.ConstructNo;
                if (constructNo && !seen.has(constructNo)) {
                    seen.add(constructNo);
                    uniquePatternData.push({ ConstructNo: constructNo });
                }
            }
            
            console.log('Pattern data:', uniquePatternData); // デバッグ用
            
            // パターンに一致する番号をフィルタリングして数値部分を抽出
            const existingNumbers = uniquePatternData
                .map(item => {
                    if (!item.ConstructNo.startsWith(rangeInfo.pattern)) return null;
                    const numPart = item.ConstructNo.substring(rangeInfo.pattern.length);
                    const num = parseInt(numPart);
                    return !isNaN(num) && num >= rangeInfo.min && num <= rangeInfo.max ? num : null;
                })
                .filter(n => n !== null);
            
            console.log('Existing numbers (pattern):', existingNumbers); // デバッグ用
            
            // 巡回（サイクル）方式：最大値 + 1 を次の番号にする
            // 途中の歯抜け（空き番号）は無視し、常に最新の続きを出す
            if (existingNumbers.length > 0) {
                const maxNumber = Math.max(...existingNumbers);
                console.log('Pattern - Max number found:', maxNumber); // デバッグ用
                newNumber = maxNumber + 1;
                console.log('Pattern - Max number + 1 =', newNumber); // デバッグ用
                
                // 範囲を超えた場合のみ最小値に戻る（巡回）
                if (newNumber > rangeInfo.max) {
                    newNumber = rangeInfo.min;
                    showMessage(`範囲の上限を超えたため、${rangeInfo.min}から巡回します`, 'info');
                }
            } else {
                // 既存の番号がない場合は最小値から開始
                newNumber = rangeInfo.min;
            }
            
            // パターン + 番号で文字列を生成
            const numDigits = rangeInfo.max.toString().length;
            newNumberStr = rangeInfo.pattern + newNumber.toString().padStart(numDigits, '0');
            
        } else {
            // ========================================
            // 数値範囲の場合（1000番台、2000番台等）
            // ========================================
            
            // T_ConstructionNumberから全工事番号を取得
            const { data: allData1Raw, error: fetchError1 } = await supabase
                .from('t_constructionnumber')
                .select('constructno')
                .order('constructno', { ascending: false });
            
            // カラム名を正規化
            const allData1 = (allData1Raw || []).map(item => ({ ConstructNo: item.constructno }));
            
            if (fetchError1) {
                console.error('T_ConstructionNumber取得エラー:', fetchError1);
            }
            
            console.log('T_ConstructionNumberから取得:', allData1.length, '件'); // デバッグ用
            if (allData1.length > 0) {
                console.log('T_ConstructionNumberのサンプル（最初の10件）:', allData1.slice(0, 10).map(item => item.ConstructNo)); // デバッグ用
            }
            
            // t_AcceptOrderから取得（CancelFlgがfalseのもののみ）
            let allData2 = [];
            const tableNames = ['t_acceptorder'];
            for (const tableName of tableNames) {
                try {
                    const { data: data2, error: error2 } = await supabase
                        .from(tableName)
                        .select('ConstructNo, CancelFlg');
                    
                    if (!error2 && data2) {
                        // CancelFlgがfalseまたはnullのもののみをフィルタリング
                        const validItems = data2.filter(item => {
                            const cancelFlg = item.CancelFlg;
                            return (cancelFlg === false || cancelFlg === null || cancelFlg === undefined) && item.ConstructNo;
                        });
                        allData2 = validItems.map(item => ({ ConstructNo: item.ConstructNo }));
                        console.log(`t_AcceptOrderから取得: ${allData2.length}件 (テーブル: ${tableName})`); // デバッグ用
                        console.log(`t_AcceptOrderのサンプル:`, allData2.slice(0, 5).map(item => item.ConstructNo)); // デバッグ用
                        break;
                    } else if (error2) {
                        console.warn(`${tableName}からの取得エラー:`, error2);
                    }
                } catch (e) {
                    console.warn(`${tableName}からの取得で例外:`, e);
                    continue;
                }
            }
            
            console.log('T_ConstructionNumberから取得:', allData1 ? allData1.length : 0, '件'); // デバッグ用
            console.log('t_AcceptOrderから取得:', allData2.length, '件'); // デバッグ用
            
            // 両方のデータを結合して重複を除去
            const allData = [...(allData1 || []), ...allData2];
            const uniqueData = [];
            const seen = new Set();
            for (const item of allData) {
                const constructNo = item.ConstructNo;
                if (constructNo && !seen.has(constructNo)) {
                    seen.add(constructNo);
                    uniqueData.push({ ConstructNo: constructNo });
                }
            }
            
            console.log('結合後のユニークデータ数:', uniqueData.length); // デバッグ用
            console.log('結合後のデータ（最初の20件）:', uniqueData.slice(0, 20).map(item => item.ConstructNo)); // デバッグ用
            
            // 選択されたプレフィックスの範囲を確認（デバッグ用）
            console.log(`選択されたプレフィックス: ${selectedPrefix}, 範囲: ${rangeInfo.min}～${rangeInfo.max}`); // デバッグ用
            
            // 選択された範囲のデータを特に確認（フィルタリング前）
            const rangeDataBefore = uniqueData.filter(item => {
                const num = parseInt(item.ConstructNo, 10);
                return !isNaN(num) && num >= rangeInfo.min && num <= rangeInfo.max;
            });
            console.log(`${selectedPrefix}（${rangeInfo.min}～${rangeInfo.max}）のデータ（フィルタリング前）:`, rangeDataBefore.map(item => item.ConstructNo)); // デバッグ用
            if (rangeDataBefore.length > 0) {
                const maxInRange = Math.max(...rangeDataBefore.map(item => parseInt(item.ConstructNo, 10)));
                console.log(`${selectedPrefix}の最大値（フィルタリング前）:`, maxInRange); // デバッグ用
            } else {
                console.log(`${selectedPrefix}の範囲内にデータがありません。最小値 ${rangeInfo.min} から開始します。`); // デバッグ用
            }
            
            // 数値としてパースし、範囲内のものだけをフィルタリング
            // 巡回方式：最大値を探すため、範囲内のすべての数値を抽出
            const existingNumbers = uniqueData
                .map(item => {
                    const constructNo = String(item.ConstructNo || '').trim();
                    if (!constructNo) return null;
                    
                    // 数値としてパース（10進数として扱う）
                    const num = parseInt(constructNo, 10);
                    if (isNaN(num)) {
                        return null;
                    }
                    
                    // 範囲チェック（選択されたプレフィックスの範囲内かどうか）
                    // 厳密に範囲内かどうかをチェック
                    if (num >= rangeInfo.min && num <= rangeInfo.max) {
                        // 1000番台の場合は、数値が正確に1000～1999の範囲内にあることを確認
                        // 他のプレフィックス（例：S1016、3A1016など）が誤って含まれないように
                        if (selectedPrefix === '1000番台') {
                            // 1000番台は純粋な数値のみ（文字列の長さもチェック）、1001-1999の範囲
                            if (constructNo.length <= 4 && num >= 1001 && num <= 1999) {
                                console.log(`[${selectedPrefix}] 範囲内の数値として認識: ${constructNo} (${num})`); // デバッグ用
                                return num;
                            } else {
                                console.log(`[${selectedPrefix}] 範囲外として除外: ${constructNo} (${num}) - 長さ: ${constructNo.length}`); // デバッグ用
                                return null;
                            }
                        } else {
                            console.log(`[${selectedPrefix}] 範囲内の数値として認識: ${constructNo} (${num})`); // デバッグ用
                            return num;
                        }
                    } else {
                        // 範囲外の場合は無視
                        return null;
                    }
                })
                .filter(n => n !== null && typeof n === 'number');
            
            console.log(`[${selectedPrefix}] 範囲内の数値（最終）:`, existingNumbers.sort((a, b) => a - b)); // デバッグ用（ソート済み）
            console.log(`[${selectedPrefix}] 範囲: ${rangeInfo.min} - ${rangeInfo.max}`); // デバッグ用
            
            // 巡回（サイクル）方式：最大値 + 1 を次の番号にする
            // 途中の歯抜け（空き番号）は無視し、常に最新の続きを出す
            if (existingNumbers.length > 0) {
                const maxNumber = Math.max(...existingNumbers);
                console.log(`[${selectedPrefix}] 最大値: ${maxNumber}`); // デバッグ用
                console.log(`[${selectedPrefix}] 最大値 + 1 = ${maxNumber + 1}`); // デバッグ用
                console.log(`[${selectedPrefix}] 範囲内の全数値:`, existingNumbers); // デバッグ用（全数値を表示）
                
                // 最大値が範囲内にあることを確認
                if (maxNumber < rangeInfo.min || maxNumber > rangeInfo.max) {
                    console.warn(`[${selectedPrefix}] 警告: 最大値 ${maxNumber} が範囲外です。最小値 ${rangeInfo.min} から開始します。`);
                    newNumber = rangeInfo.min;
                } else {
                    newNumber = maxNumber + 1;
                    
                    // 範囲を超えた場合のみ最小値に戻る（巡回）
                    // VB.NETコードに基づく巡回ロジック
                    if (newNumber > rangeInfo.max) {
                        // 各番台の巡回開始番号を設定
                        if (selectedPrefix === '1000番台' && maxNumber >= 1999) {
                            newNumber = 1001;
                        } else if (selectedPrefix === '2000番台' && maxNumber >= 2899) {
                            newNumber = 2001;
                        } else if (selectedPrefix === '2900番台' && maxNumber >= 2999) {
                            newNumber = 2901;
                        } else if (selectedPrefix === '3000番台' && maxNumber >= 3899) {
                            newNumber = 3001;
                        } else if (selectedPrefix === '4000番台' && maxNumber >= 4899) {
                            newNumber = 4001;
                        } else if (selectedPrefix === '5000番台' && maxNumber >= 5999) {
                            newNumber = 5001;
                        } else if (selectedPrefix === '6000番台' && maxNumber >= 6999) {
                            newNumber = 6001;
                        } else if (selectedPrefix === '7000番台' && maxNumber >= 7999) {
                            newNumber = 7001;
                        } else if (selectedPrefix === '8000番台' && maxNumber >= 8999) {
                            newNumber = 8001;
                        } else if (selectedPrefix === '9000番台' && maxNumber >= 9999) {
                            newNumber = 9001;
                        } else {
                            newNumber = rangeInfo.min;
                        }
                        showMessage(`範囲の上限を超えたため、${newNumber}から巡回します`, 'info');
                    }
                }
            } else {
                // 既存の番号がない場合は最小値から開始
                console.log(`[${selectedPrefix}] 範囲内にデータがありません。最小値 ${rangeInfo.min} から開始します。`); // デバッグ用
                newNumber = rangeInfo.min;
            }
            
            console.log(`[${selectedPrefix}] 生成される番号: ${newNumber}`); // デバッグ用
            
            // 数値のみの文字列
            newNumberStr = newNumber.toString();
        }
        
        console.log('Generated number:', newNumberStr); // デバッグ用
        
        // 生成された番号が既に使用されていないか確認
        // T_ConstructionNumberとt_AcceptOrderの両方をチェック
        let isUsed = false;
        
        // T_ConstructionNumberをチェック
        const { data: checkData1, error: checkError1 } = await supabase
            .from('t_constructionnumber')
            .select('constructno')
            .eq('constructno', newNumberStr)
            .limit(1);
        
        if (!checkError1 && checkData1 && checkData1.length > 0) {
            isUsed = true;
        }
        
        // t_AcceptOrderをチェック（CancelFlgがfalseのもののみ）
        if (!isUsed) {
            for (const tableName of ['t_acceptorder']) {
                try {
                    const { data: checkData2, error: checkError2 } = await supabase
                        .from(tableName)
                        .select('ConstructNo, CancelFlg')
                        .eq('ConstructNo', newNumberStr)
                        .limit(1);
                    
                    if (!checkError2 && checkData2 && checkData2.length > 0) {
                        const validOrder = checkData2.find(item => !item.CancelFlg);
                        if (validOrder) {
                            isUsed = true;
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        }
        
        if (isUsed) {
            showMessage(`番号 ${newNumberStr} は既に使用されています。再度お試しください。`, 'error');
            return;
        }
        
        // 結果を表示
        if (resultInput) {
            resultInput.value = newNumberStr;
        }
        
        // データベースに保存（orderdateは今日の日付）
        const today = new Date().toISOString().split('T')[0];
        const { error: insertError } = await supabase
            .from('t_constructionnumber')
            .insert([{
                constructno: newNumberStr,
                orderdate: today
            }]);
        
        if (insertError) {
            console.error('Insert error:', insertError);
            // 重複エラーの場合は無視
            if (insertError.code !== '23505') {
                showMessage('データベースへの保存に失敗しました', 'error');
                return;
            }
        }
        
        // 「取得しました」メッセージは表示しない（確認モーダルで確認するため）
        // showMessage(`工事番号 ${newNumberStr} を取得しました`, 'success');
        
        // 使用済み一覧を更新
        if (typeof loadUsedConstructNumbersListInline === 'function') {
            await loadUsedConstructNumbersListInline(selectedPrefix);
        }
        
        // モーダルの場合は適用ボタンを表示（ページ版では自動的に確認モーダルを表示するため、ここでは呼び出さない）
        if (applyBtn) {
            applyBtn.style.display = 'inline-block';
            // ページ版では自動的に確認ポップアップを表示するため、ここでは呼び出さない
            // setTimeout(() => {
            //     if (typeof applyConstructNumber === 'function') {
            //         applyConstructNumber();
            //     }
            // }, 300);
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('エラーが発生しました: ' + (error.message || '不明なエラー'), 'error');
    }
}

// 使用済み工事番号を取得
async function getUsedConstructNumbers() {
    try {
        // ローカルストレージから使用済み番号を取得
        const usedNumbersJson = localStorage.getItem('used_construct_numbers');
        if (usedNumbersJson) {
            const data = JSON.parse(usedNumbersJson);
            // 旧形式（文字列配列）の場合は新形式に変換
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
                return data.map(num => ({
                    number: num,
                    date: new Date().toISOString().split('T')[0],
                    type: '採番'
                }));
            }
            return data;
        }
        return [];
    } catch (error) {
        console.error('使用済み番号取得エラー:', error);
        return [];
    }
}

// 使用済み工事番号を保存（採番時）
async function saveUsedConstructNumber(constructNumber, date = null) {
    try {
        const usedNumbers = await getUsedConstructNumbers();
        const today = date || new Date().toISOString().split('T')[0];
        
        // 既に存在するか確認
        const exists = usedNumbers.some(item => {
            const num = typeof item === 'string' ? item : item.number;
            return num === constructNumber;
        });
        
        if (!exists) {
            usedNumbers.push({
                number: constructNumber,
                date: today,
                type: '採番'
            });
            localStorage.setItem('used_construct_numbers', JSON.stringify(usedNumbers));
        }
    } catch (error) {
        console.error('使用済み番号保存エラー:', error);
    }
}

// 使用済み工事番号を保存（登録時）
async function saveUsedConstructNumberOnRegister(constructNumber) {
    try {
        const usedNumbers = await getUsedConstructNumbers();
        const today = new Date().toISOString().split('T')[0];
        
        // 既に存在するか確認
        const existingIndex = usedNumbers.findIndex(item => {
            const num = typeof item === 'string' ? item : item.number;
            return num === constructNumber;
        });
        
        if (existingIndex >= 0) {
            // 既に存在する場合は、登録済みに更新
            usedNumbers[existingIndex] = {
                number: constructNumber,
                date: usedNumbers[existingIndex].date || today,
                registerDate: today,
                type: '登録済み'
            };
        } else {
            // 存在しない場合は新規追加
            usedNumbers.push({
                number: constructNumber,
                date: today,
                registerDate: today,
                type: '登録済み'
            });
        }
        
        localStorage.setItem('used_construct_numbers', JSON.stringify(usedNumbers));
    } catch (error) {
        console.error('使用済み番号保存エラー:', error);
    }
}

// モーダル用の工事番号生成関数
async function generateNextConstructNumberForModal(koujibangou, resultInputElement = null, selectElement = null) {
    if (!koujibangou || koujibangou.trim() === '') return;
    
    const resultInput = resultInputElement || document.getElementById('construct-number-result');
    if (!resultInput) return;
    
    try {
        // 工事番号台からプレフィックスを抽出
        let prefix = '';
        let prefix1 = '';
        
        // 「番台」を削除してから処理
        let koujiValue = koujibangou.replace('番台', '').trim();
        
        // 1文字目がアルファベットの場合は1文字プレフィックスとして扱う
        if (koujiValue.length >= 1 && /^[A-Z]$/.test(koujiValue.substring(0, 1))) {
            // S, T, Z, Dなどの1文字アルファベット
            prefix1 = koujiValue.substring(0, 1);
            prefix = ''; // 1文字アルファベットの場合はprefixをクリア
        } else if (koujiValue.length >= 2) {
            // 2文字以上の場合は2文字プレフィックスとして扱う
            prefix = koujiValue.substring(0, 2);
            prefix1 = koujiValue.substring(0, 1);
        } else if (koujiValue.length === 1) {
            prefix1 = koujiValue;
        }
        
        // テーブル名を確認（古いロジックは削除）
        const tableName = currentTable || 't Accept Order';
        
        // 工事番号カラム名を推測
        const possibleColumns = ['Construct No', 'construct_no', 'Order No', 'order_no', '工事番号'];
        let constructNoColumn = null;
        
        if (tableData && tableData.length > 0) {
            const columns = Object.keys(tableData[0]);
            constructNoColumn = possibleColumns.find(col => columns.includes(col));
        }
        
        if (!constructNoColumn) {
            constructNoColumn = 'Construct No';
        }
        
        // 範囲情報を取得（getConstructNumberRangeを使用）
        const rangeInfo = getConstructNumberRange(koujibangou);
        if (!rangeInfo) {
            console.error(`範囲情報が見つかりません: ${koujibangou}`);
            showMessage(`範囲情報が見つかりません: ${koujibangou}`, 'error');
            return;
        }
        
        console.log(`[${koujibangou}] 範囲情報:`, rangeInfo);
        
        // t_constructionnumberとt_acceptorderから直接取得（範囲チェック付き）
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabaseクライアントが初期化されていません');
            showMessage('Supabaseクライアントが初期化されていません', 'error');
            return;
        }
        
        // t_constructionnumberから取得
        let data1 = [];
        
        const { data: result1, error: error1 } = await supabase
            .from('t_constructionnumber')
            .select('constructno');
        
        if (!error1 && result1) {
            // カラム名を正規化
            data1 = result1.map(item => ({ ConstructNo: item.constructno }));
        } else if (error1) {
            console.warn('t_constructionnumber取得エラー:', error1);
        }
        
        console.log(`[${koujibangou}] t_constructionnumberから取得: ${data1.length}件`);
        if (data1.length > 0) {
            console.log(`[${koujibangou}] t_constructionnumberのサンプル:`, data1.slice(0, 10).map(item => item.ConstructNo));
        }
        
        // t_acceptorderから取得（CancelFlgがfalseのもののみ）
        let data2 = [];
        try {
            const { data: orders, error: error2 } = await supabase
                .from('t_acceptorder')
                .select('ConstructNo, CancelFlg')
                .or('CancelFlg.is.null,CancelFlg.eq.false');
            
            if (!error2 && orders) {
                data2 = orders.map(item => ({ ConstructNo: item.ConstructNo }));
            }
        } catch (e) {
            console.warn('t_acceptorder取得エラー:', e);
        }
        
        console.log(`[${koujibangou}] t_acceptorderから取得: ${data2.length}件`);
        
        // すべての工事番号を結合（重複除去）
        const allData = [...(data1 || []), ...data2];
        const uniqueData = [];
        const seen = new Set();
        for (const item of allData) {
            const constructNo = String(item.ConstructNo || '').trim();
            if (constructNo && !seen.has(constructNo)) {
                seen.add(constructNo);
                uniqueData.push({ ConstructNo: constructNo });
            }
        }
        
        console.log(`[${koujibangou}] 結合後のユニークデータ数: ${uniqueData.length}件`);
        if (uniqueData.length > 0) {
            console.log(`[${koujibangou}] 結合後のデータサンプル:`, uniqueData.slice(0, 20).map(item => item.ConstructNo));
        }
        
        // 範囲内の番号のみをフィルタリング
        // どの工事番号台であっても、登録されている工事番号の最大値+1を取得する
        const allNumbers = [];
        
        for (const item of uniqueData) {
            const constructNo = String(item.ConstructNo || '').trim();
            if (!constructNo) continue;
            
            let matches = false;
            
            if (rangeInfo.pattern) {
                // パターンベース（S, Z, D, 3Aなど）
                if (constructNo.startsWith(rangeInfo.pattern)) {
                    const numPart = constructNo.substring(rangeInfo.pattern.length);
                    const num = parseInt(numPart, 10);
                    if (!isNaN(num) && num >= rangeInfo.min && num <= rangeInfo.max) {
                        matches = true;
                    }
                }
            } else {
                // 数値範囲（1000番台、2000番台など）
                const num = parseInt(constructNo, 10);
                if (!isNaN(num)) {
                    // 1000番台の場合は、純粋な数値のみ（文字列の長さもチェック）、1001-1999の範囲
                    if (koujibangou === '1000番台') {
                        // 1000番台は1001-1999の範囲、かつ4文字以下の数値のみ
                        if (constructNo.length <= 4 && num >= 1001 && num <= 1999) {
                            matches = true;
                        }
                    } else {
                        // その他の番台は、範囲内であればOK
                        if (num >= rangeInfo.min && num <= rangeInfo.max) {
                            matches = true;
                        }
                    }
                }
            }
            
            if (matches && !allNumbers.includes(constructNo)) {
                allNumbers.push(constructNo);
                console.log(`[${koujibangou}] 範囲内の番号として追加: ${constructNo}`);
            }
        }
        
        // デバッグ: フィルタリング後の番号一覧を表示
        console.log(`[${koujibangou}] フィルタリング後の番号一覧:`, allNumbers.sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a.localeCompare(b);
        }));
        
        console.log(`[${koujibangou}] 範囲内の番号一覧:`, allNumbers);
        console.log(`[${koujibangou}] 範囲内の番号数:`, allNumbers.length);
        
        // 巡回方式：範囲内の最大値 + 1 を次の番号にする
        console.log(`[${koujibangou}] 範囲内の番号一覧:`, allNumbers);
        
        let maxNumber = null;
        let nextNumber = null;
        
        if (allNumbers.length > 0) {
            // 範囲内の番号から最大値を取得
            const numericNumbers = allNumbers
                .map(constructNo => {
                    let num;
                    if (rangeInfo.pattern) {
                        const numPart = constructNo.substring(rangeInfo.pattern.length);
                        num = parseInt(numPart, 10);
                    } else {
                        num = parseInt(constructNo, 10);
                    }
                    return { num, constructNo };
                })
                .filter(item => !isNaN(item.num))
                .sort((a, b) => b.num - a.num);
            
            if (numericNumbers.length > 0) {
                maxNumber = numericNumbers[0].constructNo;
                const maxNum = numericNumbers[0].num;
                console.log(`[${koujibangou}] 最大値: ${maxNumber} (数値: ${maxNum})`);
                
                // 最大値 + 1 を計算
                let newNum = maxNum + 1;
                
                // 範囲を超えた場合のみ最小値に戻る（巡回）
                if (newNum > rangeInfo.max) {
                    newNum = rangeInfo.min;
                    console.log(`[${koujibangou}] 範囲の上限を超えたため、最小値 ${rangeInfo.min} から巡回します`);
                }
                
                // 次の番号を生成
                if (rangeInfo.pattern) {
                    const numDigits = rangeInfo.max.toString().length;
                    nextNumber = rangeInfo.pattern + newNum.toString().padStart(numDigits, '0');
                } else {
                    nextNumber = newNum.toString();
                }
            }
        } else {
            // 範囲内にデータがない場合は最小値から開始
            console.log(`[${koujibangou}] 範囲内にデータがありません。最小値 ${rangeInfo.min} から開始します。`);
            
            if (rangeInfo.pattern) {
                const numDigits = rangeInfo.max.toString().length;
                nextNumber = rangeInfo.pattern + rangeInfo.min.toString().padStart(numDigits, '0');
            } else {
                nextNumber = rangeInfo.min.toString();
            }
        }
        
        console.log(`[${koujibangou}] 生成される次の番号: ${nextNumber}`);
        
        if (nextNumber) {
            resultInput.value = nextNumber;
        } else {
            console.error(`[${koujibangou}] 次の番号の生成に失敗しました`);
            showMessage('工事番号の生成に失敗しました。工事番号台を確認してください。', 'error');
        }
    } catch (error) {
        console.error('工事番号生成エラー:', error);
        const nextNumber = calculateNextConstructNumber(koujibangou, null);
        if (nextNumber) {
            resultInput.value = nextNumber;
        } else {
            showMessage('工事番号の生成に失敗しました。', 'error');
        }
    }
}

// 取得した工事番号を登録フォームに適用
function applyConstructNumber() {
    // 工事番号採番モーダルが開いているか確認
    const constructNumberModal = document.getElementById('construct-number-modal');
    if (!constructNumberModal || constructNumberModal.style.display === 'none') {
        console.warn('工事番号採番モーダルが開いていないため、確認モーダルを表示しません');
        return;
    }
    
    const resultInput = document.getElementById('construct-number-result');
    
    if (!resultInput || !resultInput.value || resultInput.value.trim() === '') {
        showMessage('工事番号が取得されていません', 'warning');
        return;
    }
    
    // カスタム確認モーダルを表示
    const constructNumber = resultInput.value.trim();
    if (!constructNumber) {
        return;
    }
    
    const confirmModal = document.getElementById('construct-number-confirm-modal');
    const confirmMessage = document.getElementById('construct-number-confirm-message');
    const confirmValue = document.getElementById('construct-number-confirm-value');
    
    if (confirmModal && confirmMessage && confirmValue) {
        // 再度、工事番号採番モーダルが開いているか確認
        const currentConstructNumberModal = document.getElementById('construct-number-modal');
        if (!currentConstructNumberModal || currentConstructNumberModal.style.display === 'none') {
            console.warn('工事番号採番モーダルが開いていないため、確認モーダルを表示しません');
            return;
        }
        
        // モーダルが既に表示されている場合は何もしない
        const currentDisplay = confirmModal.style.display || window.getComputedStyle(confirmModal).display;
        if (currentDisplay === 'flex') {
            return;
        }
        
        // ダッシュボードページが表示されていないことを最終確認
        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage && dashboardPage.classList.contains('active')) {
            console.warn('ダッシュボードページが表示されているため、モーダルを表示しません');
            return;
        }
        
        // ダッシュボードページが表示されていないことを最終確認（もう一度）
        const finalDashboardCheck = document.getElementById('dashboard-page');
        if (finalDashboardCheck && finalDashboardCheck.classList.contains('active')) {
            console.warn('ダッシュボードページが表示されているため、モーダルを表示しません（最終確認）');
            return;
        }
        
        confirmValue.textContent = constructNumber;
        confirmModal.removeAttribute('hidden');
        confirmModal.classList.add('modal-active');
        confirmModal.style.setProperty('display', 'flex', 'important');
        confirmModal.style.setProperty('visibility', 'visible', 'important');
        confirmModal.style.setProperty('opacity', '1', 'important');
        confirmModal.style.setProperty('pointer-events', 'auto', 'important');
        confirmModal.style.setProperty('z-index', '30000', 'important');
        
        // イベントリスナーを設定（既存のものを削除してから追加）
        const okBtn = document.getElementById('construct-number-confirm-ok');
        const cancelBtn = document.getElementById('construct-number-confirm-cancel');
        
        // 既存のイベントリスナーを削除
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // 新しいイベントリスナーを追加
        newOkBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const modalSelect = document.getElementById('construct-number-select');
                
                // この時点で使用済みとして記録（t_constructionnumberテーブルに保存）
                const today = new Date().toISOString().split('T')[0];
                console.log('使用済み番号を保存します:', constructNumber, today);
                
                // t_constructionnumberテーブルに保存
                const saved = await saveUsedConstructNumberToTable(constructNumber, today);
                if (saved) {
                    console.log('✓ t_constructionnumberテーブルに保存しました:', constructNumber);
                    // 受注モーダル等の edit-constructno に入力がある場合は反映
                    const editConstructNo = document.getElementById('edit-constructno');
                    if (editConstructNo) editConstructNo.value = constructNumber;
                    // ローカルストレージにも保存（既存の処理）
                    await saveUsedConstructNumber(constructNumber, today);
                    console.log('ローカルストレージに保存しました');
                    
                    // 使用済み一覧を更新
                    if (modalSelect && modalSelect.value) {
                        await loadUsedConstructNumbersListInline(modalSelect.value || null);
                    } else {
                        await loadUsedConstructNumbersListInline(null);
                    }
                    console.log('使用済み一覧を更新しました');
                    
                    // モーダルの内容を成功メッセージに書き換え
                    showConstructionNumberResultModal(
                        constructNumber,
                        true,
                        `工事番号「${constructNumber}」を登録しました`
                    );
                } else {
                    console.error('✗ t_constructionnumberテーブルへの保存に失敗しました:', constructNumber);
                    // モーダルの内容をエラーメッセージに書き換え
                    showConstructionNumberResultModal(
                        constructNumber,
                        false,
                        `工事番号「${constructNumber}」の登録に失敗しました。コンソールを確認してください。`
                    );
                }
            } catch (error) {
                console.error('工事番号適用エラー:', error);
                console.error('エラー詳細:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                // モーダルの内容をエラーメッセージに書き換え
                showConstructionNumberResultModal(
                    constructNumber,
                    false,
                    '工事番号の登録に失敗しました: ' + (error.message || '不明なエラー')
                );
            }
            
            return false;
        });
        
        newCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            confirmModal.classList.remove('modal-active');
            confirmModal.style.display = 'none';
            return false;
        });
    } else {
        // フォールバック：標準のconfirmを使用
        if (confirm(`工事番号「${constructNumber}」を使用しますか？`)) {
            const constructNoInput = document.querySelector('input[name="Construct No"]');
            const koujibangouSelect = document.querySelector('select[name="工事番号台"]');
            const modalSelect = document.getElementById('construct-number-select');
            
            if (constructNoInput) {
                constructNoInput.value = constructNumber;
            }
            
            if (koujibangouSelect && modalSelect && modalSelect.value) {
                koujibangouSelect.value = modalSelect.value;
            }
            
            showMessage(`工事番号「${constructNumber}」を適用しました`, 'success');
        }
    }
}

// 使用済み工事番号一覧モーダルを開く
async function openUsedConstructNumbersModal() {
    const modal = document.getElementById('used-construct-numbers-modal');
    modal.style.display = 'flex';
    
    await loadUsedConstructNumbersList();
}

// 使用済み工事番号一覧モーダルを閉じる
function closeUsedConstructNumbersModal() {
    const modal = document.getElementById('used-construct-numbers-modal');
    modal.style.display = 'none';
}

// 権限チェック関数（今後権限設定で制御可能）
function hasEditPermission() {
    // 権限設定をlocalStorageから取得
    const permissionSettings = JSON.parse(localStorage.getItem('permission_settings') || '{}');
    
    // 権限設定が存在する場合はそれを使用、ない場合は全員が使用可能
    if (permissionSettings.hasOwnProperty('allowAllUsers')) {
        return permissionSettings.allowAllUsers;
    }
    
    // デフォルト：全員が使用可能
    return true;
}

// 使用済み工事番号一覧を読み込む（インライン表示用）
async function loadUsedConstructNumbersListInline(filterPrefix = null) {
    const tbody = document.getElementById('used-construct-numbers-list-inline');
    if (!tbody) return;
    
    let usedNumbers = await getUsedConstructNumbers();
    const canEdit = hasEditPermission();
    
    // フィルタリング：工事番号台が選択されている場合
    if (filterPrefix) {
        // プレフィックスを抽出
        let prefix = '';
        let prefix1 = '';
        const koujiValue = filterPrefix.replace('番台', '').trim();
        
        if (koujiValue.length >= 1 && /^[A-Z]$/.test(koujiValue.substring(0, 1))) {
            prefix1 = koujiValue.substring(0, 1);
            prefix = '';
        } else if (koujiValue.length >= 2) {
            prefix = koujiValue.substring(0, 2);
            prefix1 = koujiValue.substring(0, 1);
        } else if (koujiValue.length === 1) {
            prefix1 = koujiValue;
        }
        
        // プレフィックスでフィルタリング
        usedNumbers = usedNumbers.filter(item => {
            const num = typeof item === 'string' ? item : item.number;
            const strValue = String(num).trim();
            
            if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                return strValue.startsWith(prefix1);
            } else if (prefix) {
                return strValue.startsWith(prefix);
            }
            return false;
        });
    }
    
    // 権限に応じてボタンとヘッダーを表示/非表示
    const clearBtn = document.getElementById('clear-used-btn');
    const actionHeader = document.getElementById('action-header');
    if (clearBtn) clearBtn.style.display = canEdit ? 'inline-block' : 'none';
    if (actionHeader) actionHeader.style.display = canEdit ? 'table-cell' : 'none';
    
    // 使用件数を表示（非表示）
    const countDisplay = document.getElementById('used-count-display');
    if (countDisplay) {
        countDisplay.innerHTML = '';
    }
    
    if (usedNumbers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${canEdit ? 3 : 2}" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                                                    <span style="font-size: 13px;">${filterPrefix ? '該当する運用中工事番号はありません' : '運用中工事番号はありません'}</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // 工事番号でソート（連番順）
    const sorted = usedNumbers.sort((a, b) => {
        const numA = typeof a === 'string' ? a : a.number;
        const numB = typeof b === 'string' ? b : b.number;
        // 数値部分と文字列部分を分離して比較
        const extractParts = (str) => {
            const match = str.match(/^([A-Z]*)(\d+)$/);
            if (match) {
                return { prefix: match[1] || '', number: parseInt(match[2], 10) };
            }
            return { prefix: str, number: 0 };
        };
        const partsA = extractParts(String(numA).trim());
        const partsB = extractParts(String(numB).trim());
        
        // プレフィックスで比較
        if (partsA.prefix !== partsB.prefix) {
            return partsA.prefix.localeCompare(partsB.prefix);
        }
        // 数値で比較
        return partsA.number - partsB.number;
    });
    
    tbody.innerHTML = sorted.map((item, index) => {
        const num = typeof item === 'string' ? item : item.number;
        const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
        const itemId = typeof item === 'string' ? num : (item.id || `item-${index}`);
        
        return `
            <tr style="border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''">
                <td style="padding: 8px 10px; font-weight: 600; font-size: 11px; color: var(--text-primary); word-break: break-all;">
                    <span style="display: inline-flex; align-items: center; gap: 4px;">
                        <span style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; white-space: nowrap;">${num}</span>
                    </span>
                </td>
                <td style="padding: 8px 10px; text-align: center; font-size: 10px; color: var(--text-secondary); white-space: nowrap;">
                    ${date ? `<i class="fas fa-calendar" style="margin-right: 4px; color: var(--primary); font-size: 9px;"></i><span style="font-size: 10px;">${date}</span>` : '<span style="color: var(--text-tertiary); font-size: 10px;">-</span>'}
                </td>
                ${canEdit ? `
                <td style="padding: 8px 10px; text-align: center;">
                    <div style="display: flex; gap: 4px; justify-content: center;">
                        <button onclick="deleteUsedConstructNumber('${itemId}')" style="background: var(--error); color: white; border: none; padding: 3px 5px; border-radius: 4px; cursor: pointer; font-size: 9px; transition: all 0.2s;" onmouseover="this.style.background='var(--error-dark)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='var(--error)'; this.style.transform='scale(1)'" title="削除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
                ` : ''}
            </tr>
        `;
    }).join('');
}

// 使用済み工事番号一覧を読み込む（モーダル表示用）
async function loadUsedConstructNumbersList() {
    const tbody = document.getElementById('used-construct-numbers-list');
    if (!tbody) return;
    
    const usedNumbers = await getUsedConstructNumbers();
    
    if (usedNumbers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">運用中工事番号はありません</td></tr>';
        return;
    }
    
    // 日付でソート（新しい順）
    const sorted = usedNumbers.sort((a, b) => {
        const dateA = a.registerDate || a.date || '';
        const dateB = b.registerDate || b.date || '';
        return dateB.localeCompare(dateA);
    });
    
    tbody.innerHTML = sorted.map(item => {
        const num = typeof item === 'string' ? item : item.number;
        const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
        
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 600; font-size: 14px;">${num}</td>
                <td style="padding: 12px; text-align: center; font-size: 13px;">${date || '-'}</td>
            </tr>
        `;
    }).join('');
}

// 使用済み工事番号を全削除
async function clearUsedConstructNumbers() {
    if (confirm('運用中工事番号をすべて削除しますか？\nこの操作は取り消せません。')) {
        localStorage.removeItem('used_construct_numbers');
        await loadUsedConstructNumbersList();
        const selectElement = document.getElementById('construct-number-select');
        await loadUsedConstructNumbersListInline(selectElement ? selectElement.value : null);
        const pageSelectElement = document.getElementById('construct-number-select-page');
        await loadUsedConstructNumbersListPage(pageSelectElement ? pageSelectElement.value : null);
        showMessage('運用中工事番号をすべて削除しました', 'success');
    }
}

// 使用済み工事番号を個別削除
async function deleteUsedConstructNumber(itemId) {
    if (!confirm('この工事番号を削除しますか？')) {
        return;
    }
    
    try {
        const usedNumbers = await getUsedConstructNumbers();
        const filtered = usedNumbers.filter((item, index) => {
            const id = typeof item === 'string' ? item : (item.id || `item-${index}`);
            return id !== itemId;
        });
        
        localStorage.setItem('used_construct_numbers', JSON.stringify(filtered));
        await loadUsedConstructNumbersList();
        const selectElement = document.getElementById('construct-number-select');
        await loadUsedConstructNumbersListInline(selectElement ? selectElement.value : null);
        // ページ版の一覧も更新
        const pageSelectElement = document.getElementById('construct-number-select-page');
        await loadUsedConstructNumbersListPage(pageSelectElement ? pageSelectElement.value : null);
        showMessage('工事番号を削除しました', 'success');
    } catch (error) {
        console.error('削除エラー:', error);
        showMessage('削除に失敗しました', 'error');
    }
}

// 使用済み工事番号をCSV出力（テーブル対応版）
async function exportUsedConstructNumbers() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showMessage('Supabaseクライアントが初期化されていません', 'error');
            return;
        }

        // テーブルからデータを取得
        const { data: tableData, error: tableError } = await supabase
            .from('t_constructionnumber')
            .select('constructno, orderdate')
            .order('orderdate', { ascending: false });

        if (tableError) {
            console.error('テーブルからのデータ取得エラー:', tableError);
            showMessage('データの取得に失敗しました', 'error');
            return;
        }

        if (!tableData || tableData.length === 0) {
            showMessage('出力するデータがありません', 'warning');
            return;
        }
        
        // CSVヘッダー
        let csv = '工事番号,日付\n';
        
        // データ
        tableData.forEach(item => {
            const num = item.constructno || '';
            const date = item.orderdate ? new Date(item.orderdate).toISOString().split('T')[0] : '';
            
            csv += `${num},${date}\n`;
        });
        
        // ダウンロード
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `運用中工事番号一覧_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('CSVファイルを出力しました', 'success');
    } catch (error) {
        console.error('エクスポートエラー:', error);
        showMessage('CSVファイルの出力に失敗しました', 'error');
    }
}

// 使用済み工事番号をCSVインポート（テーブル対応版）
async function importUsedConstructNumbersCSV() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showMessage('Supabaseクライアントが初期化されていません', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                showMessage('CSVファイルの形式が正しくありません', 'error');
                return;
            }
            
            // ヘッダーをスキップ
            const dataLines = lines.slice(1);
            const imported = [];
            const errors = [];
            
            dataLines.forEach((line, index) => {
                const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                if (parts.length >= 1 && parts[0]) {
                    const num = parts[0];
                    const date = parts[1] || new Date().toISOString().split('T')[0];
                    
                    // バリデーション
                    if (num && num.length > 0) {
                        imported.push({
                            constructno: num,
                            orderdate: date
                        });
                    } else {
                        errors.push(`行 ${index + 2}: 工事番号が空です`);
                    }
                }
            });
            
            if (imported.length === 0) {
                showMessage('インポートできるデータがありません', 'warning');
                return;
            }
            
            // 既存データを取得して重複チェック
            const { data: existingData, error: fetchError } = await supabase
                .from('t_constructionnumber')
                .select('constructno');
            
            if (fetchError) {
                console.error('既存データ取得エラー:', fetchError);
                showMessage('既存データの取得に失敗しました', 'error');
                return;
            }
            
            const existingNumbers = new Set((existingData || []).map(item => item.constructno));
            
            // 重複をチェック（インポートデータのキーを小文字に変換）
            const newItems = imported.filter(item => !existingNumbers.has(item.constructno));
            const duplicates = imported.length - newItems.length;
            
            if (newItems.length === 0) {
                showMessage(`すべてのデータが既に存在します（${duplicates}件）`, 'warning');
                return;
            }
            
            // テーブルに一括挿入
            const { error: insertError } = await supabase
                .from('t_constructionnumber')
                .insert(newItems);
            
            if (insertError) {
                console.error('テーブルへの挿入エラー:', insertError);
                showMessage('データのインポートに失敗しました', 'error');
                return;
            }
            
            // 一覧を更新
            const pageSelectElement = document.getElementById('construct-number-select-page');
            if (pageSelectElement) {
                await loadUsedConstructNumbersListPage(pageSelectElement.value || null);
            }
            
            // モニターも更新
            if (typeof loadConstructionNumberStatusPage === 'function') {
                await loadConstructionNumberStatusPage();
            }
            
            let message = `${newItems.length}件のデータをインポートしました`;
            if (duplicates > 0) {
                message += `（${duplicates}件は既に存在するためスキップ）`;
            }
            if (errors.length > 0) {
                message += `\nエラー: ${errors.length}件`;
            }
            
            showMessage(message, 'success');
        } catch (error) {
            console.error('CSVインポートエラー:', error);
            showMessage('CSVファイルの読み込みに失敗しました', 'error');
        }
        
        document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
}

// 運用中工事番号一覧を一括編集
async function editAllUsedConstructNumbers() {
    try {
        const usedNumbers = await getUsedConstructNumbers();
        
        if (usedNumbers.length === 0) {
            showMessage('編集する工事番号がありません', 'warning');
            return;
        }
        
        // 一括編集モーダルを作成
        const modal = document.createElement('div');
        modal.id = 'edit-all-used-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 20000; backdrop-filter: blur(4px);';
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 24px; padding: 32px; max-width: 1200px; width: 95%; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); display: flex; flex-direction: column;';
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 3px solid var(--primary); flex-shrink: 0; position: relative;">
                <div style="width: 44px;"></div>
                <h3 style="margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 12px; justify-content: center; flex: 1;">
                    <i class="fas fa-cog" style="color: var(--primary); font-size: 28px;"></i>
                    運用中工事番号管理
                </h3>
                <button onclick="this.closest('#edit-all-used-modal').remove()" style="background: rgba(0, 0, 0, 0.05); border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; font-weight: 600;" onmouseover="this.style.background='rgba(255, 107, 107, 0.1)'; this.style.color='var(--error)'; this.style.transform='rotate(90deg)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.05)'; this.style.color='var(--text-secondary)'; this.style.transform='rotate(0deg)'">&times;</button>
            </div>
            <div style="margin-bottom: 20px; flex-shrink: 0;">
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 300px; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 16px; z-index: 1;"></i>
                        <input type="text" id="edit-all-search-input" placeholder="工事番号で検索..." style="width: 100%; padding: 14px 16px 14px 44px; border: 2px solid var(--border-light); border-radius: 12px; font-size: 15px; transition: all 0.3s; background: white;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 4px rgba(74, 144, 226, 0.1)'" onblur="this.style.borderColor='var(--border-light)'; this.style.boxShadow='none'" oninput="filterEditAllList(this.value)">
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); white-space: nowrap;">
                        <i class="fas fa-list" style="color: var(--primary);"></i>
                        <span id="edit-all-count">全${usedNumbers.length}件</span>
                    </div>
                </div>
            </div>
            <div id="edit-all-used-list" style="flex: 1; overflow-y: auto; padding-right: 8px; margin-bottom: 24px; background: white; border-radius: 12px; border: 1px solid var(--border-light);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); position: sticky; top: 0; z-index: 10;">
                        <tr>
                            <th style="padding: 12px; text-align: left; color: white; font-size: 14px; font-weight: 600; border-bottom: 2px solid rgba(255, 255, 255, 0.2);">工事番号</th>
                            <th style="padding: 12px; text-align: left; color: white; font-size: 14px; font-weight: 600; border-bottom: 2px solid rgba(255, 255, 255, 0.2);">日付</th>
                            <th style="padding: 12px; text-align: center; color: white; font-size: 14px; font-weight: 600; border-bottom: 2px solid rgba(255, 255, 255, 0.2); width: 80px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usedNumbers.map((item, index) => {
                            const num = typeof item === 'string' ? item : item.number;
                            const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
                            const itemId = typeof item === 'string' ? num : (item.id || `item-${index}`);
                            return `
                                <tr class="edit-all-item" data-number="${num}" data-date="${date}" style="border-bottom: 1px solid var(--border-light); transition: background 0.2s;" onmouseover="this.style.background='rgba(74, 144, 226, 0.05)'" onmouseout="this.style.background=''">
                                    <td style="padding: 10px 12px;">
                                        <input type="text" data-id="${itemId}" data-index="${index}" class="edit-number-input" value="${num}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-light); border-radius: 6px; font-size: 14px; transition: all 0.2s; background: white;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 2px rgba(74, 144, 226, 0.1)'" onblur="this.style.borderColor='var(--border-light)'; this.style.boxShadow='none'">
                                    </td>
                                    <td style="padding: 10px 12px;">
                                        <input type="date" data-id="${itemId}" data-index="${index}" class="edit-date-input" value="${date || new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-light); border-radius: 6px; font-size: 14px; transition: all 0.2s; background: white;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 2px rgba(74, 144, 226, 0.1)'" onblur="this.style.borderColor='var(--border-light)'; this.style.boxShadow='none'">
                                    </td>
                                    <td style="padding: 10px 12px; text-align: center;">
                                        <button onclick="removeUsedConstructNumberFromEdit('${itemId}')" style="background: var(--error); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" onmouseover="this.style.background='var(--error-dark)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='var(--error)'; this.style.transform='scale(1)'" title="削除">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 3px solid var(--border-light); flex-shrink: 0;">
                <button onclick="this.closest('#edit-all-used-modal').remove()" class="btn-secondary" style="padding: 14px 28px; font-size: 15px; font-weight: 600; min-width: 140px;">キャンセル</button>
                <button onclick="saveAllUsedConstructNumbers()" class="btn-primary" style="padding: 14px 28px; font-size: 15px; font-weight: 600; min-width: 140px;">
                    <i class="fas fa-save"></i> 保存
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // 検索機能の実装
        window.filterEditAllList = function(searchTerm) {
            const items = modalContent.querySelectorAll('.edit-all-item');
            const countEl = document.getElementById('edit-all-count');
            let visibleCount = 0;
            
            items.forEach(item => {
                const number = item.getAttribute('data-number') || '';
                const date = item.getAttribute('data-date') || '';
                const searchLower = searchTerm.toLowerCase();
                
                if (!searchTerm || 
                    number.toLowerCase().includes(searchLower) || 
                    date.includes(searchTerm)) {
                    item.style.display = item.tagName === 'TR' ? 'table-row' : 'flex';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            if (countEl) {
                countEl.textContent = searchTerm ? `検索結果: ${visibleCount}件 / 全${usedNumbers.length}件` : `全${usedNumbers.length}件`;
            }
        };
        
        // モーダル外をクリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                delete window.filterEditAllList;
            }
        });
        
        // モーダルが閉じられたときに検索関数を削除
        const closeBtn = modalContent.querySelector('button[onclick*="remove"]');
        if (closeBtn) {
            const originalOnclick = closeBtn.getAttribute('onclick');
            closeBtn.setAttribute('onclick', originalOnclick + '; if(typeof filterEditAllList !== "undefined") delete window.filterEditAllList;');
        }
        
    } catch (error) {
        console.error('一括編集エラー:', error);
        showMessage('一括編集の開始に失敗しました', 'error');
    }
}

// 一括編集から項目を削除
function removeUsedConstructNumberFromEdit(itemId) {
    const input = document.querySelector(`input[data-id="${itemId}"]`);
    if (input) {
        const container = input.closest('tr.edit-all-item') || input.closest('div[style*="display: flex"]');
        if (container) {
            container.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                container.remove();
            }, 300);
        }
    }
}

// 一括編集を保存
async function saveAllUsedConstructNumbers() {
    try {
        const numberInputs = document.querySelectorAll('.edit-number-input');
        const dateInputs = document.querySelectorAll('.edit-date-input');
        
        const updated = [];
        const errors = [];
        
        numberInputs.forEach((numInput, index) => {
            const num = numInput.value.trim();
            const dateInput = dateInputs[index];
            const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
            
            if (!num) {
                // 空の行はスキップ（削除されたものとして扱う）
                return;
            }
            
            // 日付の形式チェック
            if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                errors.push(`行 ${index + 1}: 日付の形式が正しくありません`);
                return;
            }
            
            const itemId = numInput.getAttribute('data-id');
            updated.push({
                number: num,
                date: date || new Date().toISOString().split('T')[0],
                type: '採番',
                id: itemId || num
            });
        });
        
        if (errors.length > 0) {
            showMessage('エラー: ' + errors.join(', '), 'error');
            return;
        }
        
        if (updated.length === 0) {
            showMessage('保存するデータがありません', 'warning');
            return;
        }
        
        localStorage.setItem('used_construct_numbers', JSON.stringify(updated));
        
        // モーダルを閉じる
        const modal = document.getElementById('edit-all-used-modal');
        if (modal) {
            modal.remove();
        }
        
        // 一覧を更新
        await loadUsedConstructNumbersList();
        const selectElement = document.getElementById('construct-number-select');
        await loadUsedConstructNumbersListInline(selectElement ? selectElement.value : null);
        const pageSelectElement = document.getElementById('construct-number-select-page');
        await loadUsedConstructNumbersListPage(pageSelectElement ? pageSelectElement.value : null);
        
        showMessage('運用中工事番号を更新しました', 'success');
    } catch (error) {
        console.error('保存エラー:', error);
        showMessage('保存に失敗しました', 'error');
    }
}

// 工事番号をクリップボードにコピー
function copyConstructNumber() {
    const resultInput = document.getElementById('construct-number-result');
    if (!resultInput || !resultInput.value) {
        showMessage('コピーする工事番号がありません', 'warning');
        return;
    }
    
    resultInput.select();
    document.execCommand('copy');
    
    const copyBtn = document.getElementById('copy-construct-number');
    if (copyBtn) {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyBtn.style.color = 'var(--success)';
        setTimeout(() => {
            copyBtn.innerHTML = original;
            copyBtn.style.color = '';
        }, 2000);
    }
    
    showMessage('工事番号をクリップボードにコピーしました', 'success');
}

// 使用済み工事番号一覧モーダルを開く
async function openUsedConstructNumbersModal() {
    const modal = document.getElementById('used-construct-numbers-modal');
    modal.style.display = 'flex';
    
    await loadUsedConstructNumbersList();
}

// 使用済み工事番号一覧モーダルを閉じる
function closeUsedConstructNumbersModal() {
    const modal = document.getElementById('used-construct-numbers-modal');
    modal.style.display = 'none';
}

// 権限チェック関数（今後権限設定で制御可能）
function hasEditPermission() {
    // 権限設定をlocalStorageから取得
    const permissionSettings = JSON.parse(localStorage.getItem('permission_settings') || '{}');
    
    // 権限設定が存在する場合はそれを使用、ない場合は全員が使用可能
    if (permissionSettings.hasOwnProperty('allowAllUsers')) {
        return permissionSettings.allowAllUsers;
    }
    
    // デフォルト：全員が使用可能
    return true;
}

// 使用済み工事番号一覧を読み込む（インライン表示用）
async function loadUsedConstructNumbersListInline(filterPrefix = null) {
    const tbody = document.getElementById('used-construct-numbers-list-inline');
    if (!tbody) return;
    
    let usedNumbers = await getUsedConstructNumbers();
    const canEdit = hasEditPermission();
    
    // フィルタリング：工事番号台が選択されている場合
    if (filterPrefix) {
        // プレフィックスを抽出
        let prefix = '';
        let prefix1 = '';
        const koujiValue = filterPrefix.replace('番台', '').trim();
        
        if (koujiValue.length >= 1 && /^[A-Z]$/.test(koujiValue.substring(0, 1))) {
            prefix1 = koujiValue.substring(0, 1);
            prefix = '';
        } else if (koujiValue.length >= 2) {
            prefix = koujiValue.substring(0, 2);
            prefix1 = koujiValue.substring(0, 1);
        } else if (koujiValue.length === 1) {
            prefix1 = koujiValue;
        }
        
        // プレフィックスでフィルタリング
        usedNumbers = usedNumbers.filter(item => {
            const num = typeof item === 'string' ? item : item.number;
            const strValue = String(num).trim();
            
            if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                return strValue.startsWith(prefix1);
            } else if (prefix) {
                return strValue.startsWith(prefix);
            }
            return false;
        });
    }
    
    // 権限に応じてボタンとヘッダーを表示/非表示
    const clearBtn = document.getElementById('clear-used-btn');
    const actionHeader = document.getElementById('action-header');
    if (clearBtn) clearBtn.style.display = canEdit ? 'inline-block' : 'none';
    if (actionHeader) actionHeader.style.display = canEdit ? 'table-cell' : 'none';
    
    // 使用件数を表示（非表示）
    const countDisplay = document.getElementById('used-count-display');
    if (countDisplay) {
        countDisplay.innerHTML = '';
    }
    
    if (usedNumbers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${canEdit ? 3 : 2}" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                                                    <span style="font-size: 13px;">${filterPrefix ? '該当する運用中工事番号はありません' : '運用中工事番号はありません'}</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // 工事番号でソート（連番順）
    const sorted = usedNumbers.sort((a, b) => {
        const numA = typeof a === 'string' ? a : a.number;
        const numB = typeof b === 'string' ? b : b.number;
        // 数値部分と文字列部分を分離して比較
        const extractParts = (str) => {
            const match = str.match(/^([A-Z]*)(\d+)$/);
            if (match) {
                return { prefix: match[1] || '', number: parseInt(match[2], 10) };
            }
            return { prefix: str, number: 0 };
        };
        const partsA = extractParts(String(numA).trim());
        const partsB = extractParts(String(numB).trim());
        
        // プレフィックスで比較
        if (partsA.prefix !== partsB.prefix) {
            return partsA.prefix.localeCompare(partsB.prefix);
        }
        // 数値で比較
        return partsA.number - partsB.number;
    });
    
    tbody.innerHTML = sorted.map((item, index) => {
        const num = typeof item === 'string' ? item : item.number;
        const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
        const itemId = typeof item === 'string' ? num : (item.id || `item-${index}`);
        
        return `
            <tr style="border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''">
                <td style="padding: 8px 10px; font-weight: 600; font-size: 11px; color: var(--text-primary); word-break: break-all;">
                    <span style="display: inline-flex; align-items: center; gap: 4px;">
                        <span style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; white-space: nowrap;">${num}</span>
                    </span>
                </td>
                <td style="padding: 8px 10px; text-align: center; font-size: 10px; color: var(--text-secondary); white-space: nowrap;">
                    ${date ? `<i class="fas fa-calendar" style="margin-right: 4px; color: var(--primary); font-size: 9px;"></i><span style="font-size: 10px;">${date}</span>` : '<span style="color: var(--text-tertiary); font-size: 10px;">-</span>'}
                </td>
                ${canEdit ? `
                <td style="padding: 8px 10px; text-align: center;">
                    <div style="display: flex; gap: 4px; justify-content: center;">
                        <button onclick="deleteUsedConstructNumber('${itemId}')" style="background: var(--error); color: white; border: none; padding: 3px 5px; border-radius: 4px; cursor: pointer; font-size: 9px; transition: all 0.2s;" onmouseover="this.style.background='var(--error-dark)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='var(--error)'; this.style.transform='scale(1)'" title="削除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
                ` : ''}
            </tr>
        `;
    }).join('');
}

// 使用済み工事番号一覧を読み込む（モーダル表示用）
async function loadUsedConstructNumbersList() {
    const tbody = document.getElementById('used-construct-numbers-list');
    if (!tbody) return;
    
    const usedNumbers = await getUsedConstructNumbers();
    
    if (usedNumbers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">運用中工事番号はありません</td></tr>';
        return;
    }
    
    // 日付でソート（新しい順）
    const sorted = usedNumbers.sort((a, b) => {
        const dateA = a.registerDate || a.date || '';
        const dateB = b.registerDate || b.date || '';
        return dateB.localeCompare(dateA);
    });
    
    tbody.innerHTML = sorted.map(item => {
        const num = typeof item === 'string' ? item : item.number;
        const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
        
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 600; font-size: 14px;">${num}</td>
                <td style="padding: 12px; text-align: center; font-size: 13px;">${date || '-'}</td>
            </tr>
        `;
    }).join('');
}

// 使用済み工事番号を全削除
async function clearUsedConstructNumbers() {
    if (confirm('運用中工事番号をすべて削除しますか？\nこの操作は取り消せません。')) {
        localStorage.removeItem('used_construct_numbers');
        await loadUsedConstructNumbersList();
        const selectElement = document.getElementById('construct-number-select');
        await loadUsedConstructNumbersListInline(selectElement ? selectElement.value : null);
        const pageSelectElement = document.getElementById('construct-number-select-page');
        await loadUsedConstructNumbersListPage(pageSelectElement ? pageSelectElement.value : null);
        showMessage('運用中工事番号をすべて削除しました', 'success');
    }
}

// 使用済み工事番号を個別削除
async function deleteUsedConstructNumber(itemId) {
    if (!confirm('この工事番号を削除しますか？')) {
        return;
    }
    
    try {
        const usedNumbers = await getUsedConstructNumbers();
        const filtered = usedNumbers.filter((item, index) => {
            const id = typeof item === 'string' ? item : (item.id || `item-${index}`);
            return id !== itemId;
        });
        
        localStorage.setItem('used_construct_numbers', JSON.stringify(filtered));
        await loadUsedConstructNumbersList();
        const selectElement = document.getElementById('construct-number-select');
        await loadUsedConstructNumbersListInline(selectElement ? selectElement.value : null);
        // ページ版の一覧も更新
        const pageSelectElement = document.getElementById('construct-number-select-page');
        await loadUsedConstructNumbersListPage(pageSelectElement ? pageSelectElement.value : null);
        showMessage('工事番号を削除しました', 'success');
    } catch (error) {
        console.error('削除エラー:', error);
        showMessage('削除に失敗しました', 'error');
    }
}

// 使用済み工事番号をCSV出力（テーブル対応版）
async function exportUsedConstructNumbers() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showMessage('Supabaseクライアントが初期化されていません', 'error');
            return;
        }

        // テーブルからデータを取得
        const { data: tableData, error: tableError } = await supabase
            .from('t_constructionnumber')
            .select('constructno, orderdate')
            .order('orderdate', { ascending: false });

        if (tableError) {
            console.error('テーブルからのデータ取得エラー:', tableError);
            showMessage('データの取得に失敗しました', 'error');
            return;
        }

        if (!tableData || tableData.length === 0) {
            showMessage('出力するデータがありません', 'warning');
            return;
        }
        
        // CSVヘッダー
        let csv = '工事番号,日付\n';
        
        // データ
        tableData.forEach(item => {
            const num = item.constructno || '';
            const date = item.orderdate ? new Date(item.orderdate).toISOString().split('T')[0] : '';
            
            csv += `${num},${date}\n`;
        });
        
        // ダウンロード
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `運用中工事番号一覧_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('CSVファイルを出力しました', 'success');
    } catch (error) {
        console.error('エクスポートエラー:', error);
        showMessage('CSVファイルの出力に失敗しました', 'error');
    }
}

// 使用済み工事番号をCSVインポート（テーブル対応版）
async function importUsedConstructNumbersCSV() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showMessage('Supabaseクライアントが初期化されていません', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                showMessage('CSVファイルの形式が正しくありません', 'error');
                return;
            }
            
            // ヘッダーをスキップ
            const dataLines = lines.slice(1);
            const imported = [];
            const errors = [];
            
            dataLines.forEach((line, index) => {
                const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                if (parts.length >= 1 && parts[0]) {
                    const num = parts[0];
                    const date = parts[1] || new Date().toISOString().split('T')[0];
                    
                    // バリデーション
                    if (num && num.length > 0) {
                        imported.push({
                            constructno: num,
                            orderdate: date
                        });
                    } else {
                        errors.push(`行 ${index + 2}: 工事番号が空です`);
                    }
                }
            });
            
            if (imported.length === 0) {
                showMessage('インポートできるデータがありません', 'warning');
                return;
            }
            
            // 既存データを取得して重複チェック
            const { data: existingData, error: fetchError } = await supabase
                .from('t_constructionnumber')
                .select('constructno');
            
            if (fetchError) {
                console.error('既存データ取得エラー:', fetchError);
                showMessage('既存データの取得に失敗しました', 'error');
                return;
            }
            
            const existingNumbers = new Set((existingData || []).map(item => item.constructno));
            
            // 重複をチェック（インポートデータのキーを小文字に変換）
            const newItems = imported.filter(item => !existingNumbers.has(item.constructno));
            const duplicates = imported.length - newItems.length;
            
            if (newItems.length === 0) {
                showMessage(`すべてのデータが既に存在します（${duplicates}件）`, 'warning');
                return;
            }
            
            // テーブルに一括挿入
            const { error: insertError } = await supabase
                .from('t_constructionnumber')
                .insert(newItems);
            
            if (insertError) {
                console.error('テーブルへの挿入エラー:', insertError);
                showMessage('データのインポートに失敗しました', 'error');
                return;
            }
            
            // 一覧を更新
            const pageSelectElement = document.getElementById('construct-number-select-page');
            if (pageSelectElement) {
                await loadUsedConstructNumbersListPage(pageSelectElement.value || null);
            }
            
            // モニターも更新
            if (typeof loadConstructionNumberStatusPage === 'function') {
                await loadConstructionNumberStatusPage();
            }
            
            let message = `${newItems.length}件のデータをインポートしました`;
            if (duplicates > 0) {
                message += `（${duplicates}件は既に存在するためスキップ）`;
            }
            if (errors.length > 0) {
                message += `\nエラー: ${errors.length}件`;
            }
            
            showMessage(message, 'success');
        } catch (error) {
            console.error('CSVインポートエラー:', error);
            showMessage('CSVファイルの読み込みに失敗しました', 'error');
        }
        
        document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
}

// 運用中工事番号一覧を一括編集
async function editAllUsedConstructNumbers() {
    try {
        const usedNumbers = await getUsedConstructNumbers();
        
        if (usedNumbers.length === 0) {
            showMessage('編集する工事番号がありません', 'warning');
            return;
        }
        
        // 一括編集モーダルを作成
        const modal = document.createElement('div');
        modal.id = 'edit-all-used-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 20000; backdrop-filter: blur(4px);';
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 24px; padding: 32px; max-width: 1200px; width: 95%; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); display: flex; flex-direction: column;';
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 3px solid var(--primary); flex-shrink: 0; position: relative;">
                <div style="width: 44px;"></div>
                <h3 style="margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 12px; justify-content: center; flex: 1;">
                    <i class="fas fa-cog" style="color: var(--primary); font-size: 28px;"></i>
                    運用中工事番号管理
                </h3>
                <button onclick="this.closest('#edit-all-used-modal').remove()" style="background: rgba(0, 0, 0, 0.05); border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; font-weight: 600;" onmouseover="this.style.background='rgba(255, 107, 107, 0.1)'; this.style.color='var(--error)'; this.style.transform='rotate(90deg)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.05)'; this.style.color='var(--text-secondary)'; this.style.transform='rotate(0deg)'">&times;</button>
            </div>
            <div style="margin-bottom: 20px; flex-shrink: 0;">
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 300px; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 16px; z-index: 1;"></i>
                        <input type="text" id="edit-all-search-input" placeholder="工事番号で検索..." style="width: 100%; padding: 14px 16px 14px 44px; border: 2px solid var(--border-light); border-radius: 12px; font-size: 15px; transition: all 0.3s; background: white;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 4px rgba(74, 144, 226, 0.1)'" onblur="this.style.borderColor='var(--border-light)'; this.style.boxShadow='none'" oninput="filterEditAllList(this.value)">
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); white-space: nowrap;">
                        <i class="fas fa-list" style="color: var(--primary);"></i>
                        <span id="edit-all-count">全${usedNumbers.length}件</span>
                    </div>
                </div>
            </div>
            <div id="edit-all-used-list" style="flex: 1; overflow-y: auto; padding-right: 8px; margin-bottom: 24px; background: white; border-radius: 12px; border: 1px solid var(--border-light);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); position: sticky; top: 0; z-index: 10;">
                        <tr>
                            <th style="padding: 12px; text-align: left; color: white; font-size: 14px; font-weight: 600; border-bottom: 2px solid rgba(255, 255, 255, 0.2);">工事番号</th>
                            <th style="padding: 12px; text-align: left; color: white; font-size: 14px; font-weight: 600; border-bottom: 2px solid rgba(255, 255, 255, 0.2);">日付</th>
                            <th style="padding: 12px; text-align: center; color: white; font-size: 14px; font-weight: 600; border-bottom: 2px solid rgba(255, 255, 255, 0.2); width: 80px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usedNumbers.map((item, index) => {
                            const num = typeof item === 'string' ? item : item.number;
                            const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
                            const itemId = typeof item === 'string' ? num : (item.id || `item-${index}`);
                            return `
                                <tr class="edit-all-item" data-number="${num}" data-date="${date}" style="border-bottom: 1px solid var(--border-light); transition: background 0.2s;" onmouseover="this.style.background='rgba(74, 144, 226, 0.05)'" onmouseout="this.style.background=''">
                                    <td style="padding: 10px 12px;">
                                        <input type="text" data-id="${itemId}" data-index="${index}" class="edit-number-input" value="${num}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-light); border-radius: 6px; font-size: 14px; transition: all 0.2s; background: white;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 2px rgba(74, 144, 226, 0.1)'" onblur="this.style.borderColor='var(--border-light)'; this.style.boxShadow='none'">
                                    </td>
                                    <td style="padding: 10px 12px;">
                                        <input type="date" data-id="${itemId}" data-index="${index}" class="edit-date-input" value="${date || new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-light); border-radius: 6px; font-size: 14px; transition: all 0.2s; background: white;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 2px rgba(74, 144, 226, 0.1)'" onblur="this.style.borderColor='var(--border-light)'; this.style.boxShadow='none'">
                                    </td>
                                    <td style="padding: 10px 12px; text-align: center;">
                                        <button onclick="removeUsedConstructNumberFromEdit('${itemId}')" style="background: var(--error); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" onmouseover="this.style.background='var(--error-dark)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='var(--error)'; this.style.transform='scale(1)'" title="削除">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 3px solid var(--border-light); flex-shrink: 0;">
                <button onclick="this.closest('#edit-all-used-modal').remove()" class="btn-secondary" style="padding: 14px 28px; font-size: 15px; font-weight: 600; min-width: 140px;">キャンセル</button>
                <button onclick="saveAllUsedConstructNumbers()" class="btn-primary" style="padding: 14px 28px; font-size: 15px; font-weight: 600; min-width: 140px;">
                    <i class="fas fa-save"></i> 保存
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // 検索機能の実装
        window.filterEditAllList = function(searchTerm) {
            const items = modalContent.querySelectorAll('.edit-all-item');
            const countEl = document.getElementById('edit-all-count');
            let visibleCount = 0;
            
            items.forEach(item => {
                const number = item.getAttribute('data-number') || '';
                const date = item.getAttribute('data-date') || '';
                const searchLower = searchTerm.toLowerCase();
                
                if (!searchTerm || 
                    number.toLowerCase().includes(searchLower) || 
                    date.includes(searchTerm)) {
                    item.style.display = item.tagName === 'TR' ? 'table-row' : 'flex';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            if (countEl) {
                countEl.textContent = searchTerm ? `検索結果: ${visibleCount}件 / 全${usedNumbers.length}件` : `全${usedNumbers.length}件`;
            }
        };
        
        // モーダル外をクリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                delete window.filterEditAllList;
            }
        });
        
        // モーダルが閉じられたときに検索関数を削除
        const closeBtn = modalContent.querySelector('button[onclick*="remove"]');
        if (closeBtn) {
            const originalOnclick = closeBtn.getAttribute('onclick');
            closeBtn.setAttribute('onclick', originalOnclick + '; if(typeof filterEditAllList !== "undefined") delete window.filterEditAllList;');
        }
        
    } catch (error) {
        console.error('一括編集エラー:', error);
        showMessage('一括編集の開始に失敗しました', 'error');
    }
}

// 一括編集から項目を削除
function removeUsedConstructNumberFromEdit(itemId) {
    const input = document.querySelector(`input[data-id="${itemId}"]`);
    if (input) {
        const container = input.closest('tr.edit-all-item') || input.closest('div[style*="display: flex"]');
        if (container) {
            container.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                container.remove();
            }, 300);
        }
    }
}

// 一括編集を保存
async function saveAllUsedConstructNumbers() {
    try {
        const numberInputs = document.querySelectorAll('.edit-number-input');
        const dateInputs = document.querySelectorAll('.edit-date-input');
        
        const updated = [];
        const errors = [];
        
        numberInputs.forEach((numInput, index) => {
            const num = numInput.value.trim();
            const dateInput = dateInputs[index];
            const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
            
            if (!num) {
                // 空の行はスキップ（削除されたものとして扱う）
                return;
            }
            
            // 日付の形式チェック
            if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                errors.push(`行 ${index + 1}: 日付の形式が正しくありません`);
                return;
            }
            
            const itemId = numInput.getAttribute('data-id');
            updated.push({
                number: num,
                date: date || new Date().toISOString().split('T')[0],
                type: '採番',
                id: itemId || num
            });
        });
        
        if (errors.length > 0) {
            showMessage('エラー: ' + errors.join(', '), 'error');
            return;
        }
        
        if (updated.length === 0) {
            showMessage('保存するデータがありません', 'warning');
            return;
        }
        
        localStorage.setItem('used_construct_numbers', JSON.stringify(updated));
        
        // モーダルを閉じる
        const modal = document.getElementById('edit-all-used-modal');
        if (modal) {
            modal.remove();
        }
        
        // 一覧を更新
        await loadUsedConstructNumbersList();
        const selectElement = document.getElementById('construct-number-select');
        await loadUsedConstructNumbersListInline(selectElement ? selectElement.value : null);
        const pageSelectElement = document.getElementById('construct-number-select-page');
        await loadUsedConstructNumbersListPage(pageSelectElement ? pageSelectElement.value : null);
        
        showMessage('運用中工事番号を更新しました', 'success');
    } catch (error) {
        console.error('保存エラー:', error);
        showMessage('保存に失敗しました', 'error');
    }
}

// 工事番号をクリップボードにコピー
function copyConstructNumber() {
    const resultInput = document.getElementById('construct-number-result');
    if (!resultInput || !resultInput.value) {
        showMessage('コピーする工事番号がありません', 'warning');
        return;
    }
    
    resultInput.select();
    document.execCommand('copy');
    
    const copyBtn = document.getElementById('copy-construct-number');
    if (copyBtn) {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyBtn.style.color = 'var(--success)';
        setTimeout(() => {
            copyBtn.innerHTML = original;
            copyBtn.style.color = '';
        }, 2000);
    }
    
    showMessage('工事番号をクリップボードにコピーしました', 'success');
}

// スタッフプロフィールモーダルを開く
let currentStaffData = null; // 現在表示中のスタッフデータを保持

function openStaffProfileModal(staffData) {
    const modal = document.getElementById('staff-profile-modal');
    if (!modal) return;
    
    // 現在のデータを保存
    currentStaffData = staffData;
    
    // アバターの設定（人型アイコンをカラフルに）
    const avatar = document.getElementById('staff-avatar');
    const staffName = staffData.staffname || staffData.StaffName || '';
    
    // アバターの色を名前から生成
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    const colorIndex = staffName ? staffName.charCodeAt(0) % colors.length : 0;
    avatar.style.background = colors[colorIndex];
    avatar.innerHTML = '<i class="fas fa-user" style="color: white; font-size: 24px;"></i>';
    
    // 基本情報
    document.getElementById('staff-name').textContent = staffData.staffname || staffData.StaffName || '-';
    document.getElementById('staff-position').textContent = staffData.position || staffData.Position || '役職未設定';
    const staffCode = staffData.staffcode || staffData.StaffCode || '-';
    document.getElementById('staff-code-badge').textContent = staffCode;
    document.getElementById('staff-reading').textContent = staffData.reading || staffData.Reading || '-';
    document.getElementById('staff-depa').textContent = staffData.depacode || staffData.DepaCode || '-';
    document.getElementById('staff-workdepa').textContent = staffData.workdepa || staffData.WorkDepa || '-';
    
    // 連絡先
    document.getElementById('staff-email').textContent = staffData.mailaddress || staffData.MailAddress || '-';
    document.getElementById('staff-tel').textContent = staffData.telno || staffData.TelNo || '-';
    document.getElementById('staff-mobile').textContent = staffData.cellphone || staffData.CellPhone || '-';
    document.getElementById('staff-internal').textContent = staffData.internaltelno || staffData.InternalTelNo || '-';
    
    // その他
    const joinDate = staffData.nuyusyadate || staffData.NuyushyaDate || '';
    document.getElementById('staff-joindate').textContent = joinDate ? new Date(joinDate).toLocaleDateString('ja-JP') : '-';
    document.getElementById('staff-loginid').textContent = staffData.loginid || staffData.LoginID || '-';
    
    // 編集ボタンを表示
    const editBtn = document.getElementById('staff-profile-edit-btn');
    if (editBtn) {
        editBtn.style.display = 'flex';
    }
    
    // モーダルを表示
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.zIndex = '10000';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    
    // アニメーション
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 10);
}

// スタッフプロフィールモーダルから編集を開く
function editStaffProfileFromModal() {
    if (!currentStaffData) return;
    
    // プロフィールモーダルを閉じる
    closeStaffProfileModal();
    
    // 少し待ってから編集モーダルを開く
    setTimeout(() => {
        openRegisterModal('編集', currentStaffData);
    }, 300);
}

// スタッフプロフィールモーダルを閉じる
function closeStaffProfileModal() {
    const modal = document.getElementById('staff-profile-modal');
    if (!modal) return;
    
    // アニメーション
    const content = modal.querySelector('.modal-content');
    content.style.transform = 'scale(0.9)';
    content.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.opacity = '0';
        currentStaffData = null; // データをクリア
    }, 300);
}

// グローバルに公開
window.openStaffProfileModal = openStaffProfileModal;
window.editStaffProfileFromModal = editStaffProfileFromModal;
window.closeStaffProfileModal = closeStaffProfileModal;

// スタッフプロフィールモーダルの拡張バージョン（上書き）
let currentStaffMode = 'view';

// 元の関数を上書き
window.openStaffProfileModal = function(staffData, mode = 'view') {
    const modal = document.getElementById('staff-profile-modal');
    if (!modal) return;
    
    window.currentStaffData = staffData || {};
    window.currentStaffMode = mode;
    
    const avatar = document.getElementById('staff-avatar');
    const staffName = staffData.staffname || staffData.StaffName || '';
    
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    const colorIndex = staffName ? staffName.charCodeAt(0) % colors.length : 0;
    avatar.style.background = colors[colorIndex];
    avatar.innerHTML = '<i class="fas fa-user" style="color: white; font-size: 24px;"></i>';
    
    const nameEl = document.getElementById('staff-name');
    const positionEl = document.getElementById('staff-position');
    const codeBadgeEl = document.getElementById('staff-code-badge');
    const editBtn = document.getElementById('staff-profile-edit-btn');
    
    if (mode === 'view') {
        nameEl.textContent = staffName || '-';
        positionEl.textContent = staffData.position || staffData.Position || '役職未設定';
        codeBadgeEl.textContent = staffData.staffcode || staffData.StaffCode || '-';
        positionEl.style.display = '';
        codeBadgeEl.style.display = '';
        editBtn.style.display = 'flex';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>編集';
        editBtn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
        editBtn.onclick = () => window.editStaffProfileFromModal();
    } else {
        const titles = {
            'edit': 'スタッフ情報編集',
            'new': '新規スタッフ登録',
            'duplicate': 'スタッフ情報複製'
        };
        nameEl.textContent = titles[mode] || 'スタッフ情報';
        positionEl.style.display = 'none';
        codeBadgeEl.style.display = 'none';
        editBtn.style.display = 'flex';
        editBtn.innerHTML = '<i class="fas fa-save"></i>保存';
        editBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        editBtn.onclick = () => window.saveStaffProfile();
    }
    
    const contentDiv = document.getElementById('staff-profile-content');
    if (mode === 'view') {
        contentDiv.innerHTML = window.generateViewContent(staffData);
    } else {
        contentDiv.innerHTML = window.generateEditContent(staffData, mode);
    }
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.zIndex = '10000';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 10);
};

window.generateViewContent = function(staffData) {
    const joinDate = staffData.nuyusyadate || staffData.NuyushyaDate || '';
    const joinDateFormatted = joinDate ? new Date(joinDate).toLocaleDateString('ja-JP') : '-';
    
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 100%;">
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); flex: 1;">
                    <h3 style="margin: 0 0 18px; color: #2d3748; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                        <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%;"></div>
                        基本情報
                    </h3>
                    <div style="display: grid; gap: 16px;">
                        <div class="profile-field-compact">
                            <div class="profile-label-compact">スタッフコード</div>
                            <div class="profile-value-compact">${staffData.staffcode || staffData.StaffCode || '-'}</div>
                        </div>
                        <div class="profile-field-compact">
                            <div class="profile-label-compact">読み仮名</div>
                            <div class="profile-value-compact">${staffData.reading || staffData.Reading || '-'}</div>
                        </div>
                        <div class="profile-field-compact">
                            <div class="profile-label-compact">所属部署</div>
                            <div class="profile-value-compact">${staffData.depacode || staffData.DepaCode || '-'}</div>
                        </div>
                        <div class="profile-field-compact">
                            <div class="profile-label-compact">作業部署</div>
                            <div class="profile-value-compact">${staffData.workdepa || staffData.WorkDepa || '-'}</div>
                        </div>
                    </div>
                </div>
                <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <h3 style="margin: 0 0 18px; color: #2d3748; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                        <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); border-radius: 50%;"></div>
                        その他
                    </h3>
                    <div style="display: grid; gap: 16px;">
                        <div class="profile-field-compact">
                            <div class="profile-label-compact">入社日</div>
                            <div class="profile-value-compact">${joinDateFormatted}</div>
                        </div>
                        <div class="profile-field-compact">
                            <div class="profile-label-compact">ログインID</div>
                            <div class="profile-value-compact">${staffData.loginid || staffData.LoginID || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); height: 100%;">
                    <h3 style="margin: 0 0 18px; color: #2d3748; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                        <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 50%;"></div>
                        連絡先
                    </h3>
                    <div style="display: grid; gap: 20px;">
                        <div class="contact-field">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-envelope" style="color: white; font-size: 14px;"></i>
                                </div>
                                <div class="profile-label-compact" style="margin: 0;">メールアドレス</div>
                            </div>
                            <div class="profile-value-compact" style="padding-left: 42px; word-break: break-all;">${staffData.mailaddress || staffData.MailAddress || '-'}</div>
                        </div>
                        <div class="contact-field">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-phone" style="color: white; font-size: 14px;"></i>
                                </div>
                                <div class="profile-label-compact" style="margin: 0;">電話番号</div>
                            </div>
                            <div class="profile-value-compact" style="padding-left: 42px;">${staffData.telno || staffData.TelNo || '-'}</div>
                        </div>
                        <div class="contact-field">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-mobile-alt" style="color: white; font-size: 14px;"></i>
                                </div>
                                <div class="profile-label-compact" style="margin: 0;">携帯電話</div>
                            </div>
                            <div class="profile-value-compact" style="padding-left: 42px;">${staffData.cellphone || staffData.CellPhone || '-'}</div>
                        </div>
                        <div class="contact-field">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-phone-square" style="color: white; font-size: 14px;"></i>
                                </div>
                                <div class="profile-label-compact" style="margin: 0;">内線番号</div>
                            </div>
                            <div class="profile-value-compact" style="padding-left: 42px;">${staffData.internaltelno || staffData.InternalTelNo || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.generateEditContent = function(staffData, mode) {
    const joinDate = staffData.nuyusyadate || staffData.NuyushyaDate || '';
    const joinDateValue = joinDate ? new Date(joinDate).toISOString().split('T')[0] : '';
    
    if (mode === 'duplicate') {
        staffData = { ...staffData };
        delete staffData.id;
        delete staffData.regino;
    }
    
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 100%;">
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); flex: 1;">
                    <h3 style="margin: 0 0 18px; color: #2d3748; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                        <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%;"></div>
                        基本情報
                    </h3>
                    <div style="display: grid; gap: 16px;">
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">スタッフ名 *</label>
                            <input type="text" id="edit-staffname" value="${staffData.staffname || staffData.StaffName || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">スタッフコード *</label>
                            <input type="text" id="edit-staffcode" value="${staffData.staffcode || staffData.StaffCode || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">読み仮名</label>
                            <input type="text" id="edit-reading" value="${staffData.reading || staffData.Reading || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">所属部署</label>
                            <input type="text" id="edit-depacode" value="${staffData.depacode || staffData.DepaCode || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">作業部署</label>
                            <input type="text" id="edit-workdepa" value="${staffData.workdepa || staffData.WorkDepa || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">役職</label>
                            <input type="text" id="edit-position" value="${staffData.position || staffData.Position || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                    </div>
                </div>
                <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <h3 style="margin: 0 0 18px; color: #2d3748; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                        <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); border-radius: 50%;"></div>
                        その他
                    </h3>
                    <div style="display: grid; gap: 16px;">
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">入社日</label>
                            <input type="date" id="edit-nuyusyadate" value="${joinDateValue}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">ログインID</label>
                            <input type="text" id="edit-loginid" value="${staffData.loginid || staffData.LoginID || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); height: 100%;">
                    <h3 style="margin: 0 0 18px; color: #2d3748; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                        <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 50%;"></div>
                        連絡先
                    </h3>
                    <div style="display: grid; gap: 20px;">
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">
                                <i class="fas fa-envelope" style="color: #667eea; margin-right: 6px;"></i>
                                メールアドレス
                            </label>
                            <input type="email" id="edit-mailaddress" value="${staffData.mailaddress || staffData.MailAddress || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">
                                <i class="fas fa-phone" style="color: #48bb78; margin-right: 6px;"></i>
                                電話番号
                            </label>
                            <input type="tel" id="edit-telno" value="${staffData.telno || staffData.TelNo || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#48bb78'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">
                                <i class="fas fa-mobile-alt" style="color: #ed8936; margin-right: 6px;"></i>
                                携帯電話
                            </label>
                            <input type="tel" id="edit-cellphone" value="${staffData.cellphone || staffData.CellPhone || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#ed8936'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div class="profile-field-compact">
                            <label class="profile-label-compact">
                                <i class="fas fa-phone-square" style="color: #4299e1; margin-right: 6px;"></i>
                                内線番号
                            </label>
                            <input type="tel" id="edit-internaltelno" value="${staffData.internaltelno || staffData.InternalTelNo || ''}" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: all 0.3s;" onfocus="this.style.borderColor='#4299e1'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.saveStaffProfile = async function() {
    const formData = {
        staffname: document.getElementById('edit-staffname')?.value || '',
        staffcode: document.getElementById('edit-staffcode')?.value || '',
        reading: document.getElementById('edit-reading')?.value || '',
        depacode: document.getElementById('edit-depacode')?.value || '',
        workdepa: document.getElementById('edit-workdepa')?.value || '',
        position: document.getElementById('edit-position')?.value || '',
        mailaddress: document.getElementById('edit-mailaddress')?.value || '',
        telno: document.getElementById('edit-telno')?.value || '',
        cellphone: document.getElementById('edit-cellphone')?.value || '',
        internaltelno: document.getElementById('edit-internaltelno')?.value || '',
        nuyusyadate: document.getElementById('edit-nuyusyadate')?.value || null,
        loginid: document.getElementById('edit-loginid')?.value || ''
    };
    
    if (!formData.staffname || !formData.staffcode) {
        showMessage('スタッフ名とスタッフコードは必須です', 'error');
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabaseクライアントが初期化されていません');
        }
        
        let result;
        if (window.currentStaffMode === 'edit' && window.currentStaffData.regino) {
            result = await supabase
                .from('t_staffcode')
                .update(formData)
                .eq('regino', window.currentStaffData.regino);
            
            if (result.error) throw result.error;
            showMessage('スタッフ情報を更新しました', 'success');
        } else {
            result = await supabase
                .from('t_staffcode')
                .insert([formData]);
            
            if (result.error) throw result.error;
            showMessage('スタッフ情報を登録しました', 'success');
        }
        
        closeStaffProfileModal();
        await loadTableData(currentTable);
        
    } catch (error) {
        console.error('保存エラー:', error);
        showMessage('保存に失敗しました: ' + (error.message || '不明なエラー'), 'error');
    }
};

window.editStaffProfileFromModal = function() {
    if (!window.currentStaffData) return;
    window.openStaffProfileModal(window.currentStaffData, 'edit');
};


// テーブル別カスタムモーダルシステム（カラムから入力フォーマットを動的生成）
window.openCustomTableModal = async function(tableName, data, mode = 'view') {
    console.log('=== openCustomTableModal ===');
    console.log('tableName:', tableName);
    console.log('mode:', mode);
    
    const rowData = data || {};
    const columns = await getTableColumnsAsync(tableName, rowData);
    if (columns.length === 0) {
        console.warn('No columns for table:', tableName);
        showMessage('このテーブルのカラムを取得できません。テーブルが空か、接続を確認してください。', 'warning');
        return;
    }
    
    const config = buildConfigFromColumns(tableName, columns, rowData);
    window.currentTableModalConfig = config;
    
    const modal = document.getElementById('custom-table-modal');
    if (!modal) {
        console.error('custom-table-modal element not found!');
        return;
    }
    
    window.currentTableData = rowData;
    window.currentTableMode = mode;
    window.currentTableName = tableName;
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        if (config.layout === 'triple') {
            modalContent.style.maxWidth = '1200px';
        } else if (config.layout === 'double') {
            modalContent.style.maxWidth = '900px';
        } else {
            modalContent.style.maxWidth = '550px';
        }
    }
    
    const header = modal.querySelector('.custom-modal-header');
    if (!header) {
        console.error('custom-modal-header not found!');
        return;
    }
    header.innerHTML = generateCustomHeader(config, rowData, mode);
    
    const content = modal.querySelector('.custom-modal-content');
    if (mode === 'view') {
        content.innerHTML = generateCustomViewContent(config, rowData);
    } else {
        content.innerHTML = generateCustomEditContent(config, rowData, mode);
    }
    
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    setTimeout(() => {
        const mc = modal.querySelector('.modal-content');
        if (mc) {
            mc.style.transform = 'scale(1)';
            mc.style.opacity = '1';
        }
    }, 10);
};

function generateCustomHeader(config, data, mode) {
    const { displayName, svg, color } = config;
    
    const titles = {
        'view': displayName + ' 詳細',
        'edit': displayName + ' 編集',
        'new': displayName + ' 新規登録',
        'duplicate': displayName + ' 複製'
    };
    
    const buttonHtml = mode === 'view' 
        ? `<button class="custom-modal-btn" onclick="editCustomTableModal()" style="background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%);">
            <i class="fas fa-edit"></i>編集
           </button>`
        : `<button class="custom-modal-btn" onclick="saveCustomTableData()" style="background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%);">
            <i class="fas fa-save"></i>保存
           </button>`;
    
    return `
        <div class="custom-modal-header-inner" style="background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%); padding: 18px 24px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.06; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.12) 10px, rgba(255,255,255,0.12) 20px);"></div>
            <button type="button" onclick="closeCustomTableModal()" class="custom-modal-close-btn" style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 100;" aria-label="閉じる">
                <i class="fas fa-times" style="color: white; font-size: 14px;"></i>
            </button>
            <div style="display: flex; align-items: center; gap: 16px; position: relative; z-index: 5; padding-right: 48px;">
                <div class="custom-modal-header-icon" style="width: 48px; height: 48px; background: rgba(255,255,255,0.25); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    ${svg}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <h2 style="margin: 0 0 2px; color: white; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">${titles[mode]}</h2>
                    <div style="color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 500;">${displayName}の${mode === 'view' ? '詳細' : '入力'}</div>
                </div>
                ${buttonHtml}
            </div>
        </div>
    `;
}

// 項目数に応じて列数（スクロール不要で収めるため多めに）
function getSectionColumnCount(fieldCount) {
    if (fieldCount <= 3) return 2;
    if (fieldCount <= 6) return 3;
    if (fieldCount <= 12) return 4;
    if (fieldCount <= 20) return 5;
    return 6;
}

function generateCustomViewContent(config, data) {
    const { sections, layout } = config;
    const outerCols = layout === 'triple' ? 3 : layout === 'double' ? 2 : 1;
    
    let html = `<div class="custom-modal-inner custom-modal-view" style="display: grid; grid-template-columns: repeat(${outerCols}, 1fr); gap: 16px; align-items: start;">`;
    
    sections.forEach(section => {
        const sectionColumns = getSectionColumnCount(section.fields.length);
        html += `
            <div class="config-section-card" style="border-left: 4px solid ${section.color}; grid-column: 1 / -1; padding: 14px 18px; border-radius: 12px; background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%); box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                <h3 style="margin: 0 0 12px; color: #334155; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                    <i class="fas ${section.icon || 'fa-info-circle'}" style="color: ${section.color};"></i>
                    ${section.title}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(${sectionColumns}, 1fr); gap: 10px 16px;">
        `;
        
        section.fields.forEach(field => {
            const value = data[field.name] || data[field.name.charAt(0).toUpperCase() + field.name.slice(1)] || '-';
            const displayValue = field.type === 'date' && value !== '-' 
                ? new Date(value).toLocaleDateString('ja-JP')
                : field.type === 'number' && value !== '-'
                ? parseFloat(value).toLocaleString('ja-JP')
                : value;
            
            const isFullWidth = field.width === 'full' || field.type === 'textarea';
            const gridSpan = isFullWidth ? `grid-column: 1 / -1;` : '';
            
            html += `
                <div class="profile-field-compact" style="${gridSpan}">
                    <div class="profile-label-compact">${field.label}</div>
                    <div class="profile-value-compact" style="word-break: break-all;">${displayValue}</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

function generateCustomEditContent(config, data, mode) {
    const { sections, layout } = config;
    const outerCols = layout === 'triple' ? 3 : layout === 'double' ? 2 : 1;
    
    if (mode === 'duplicate') {
        data = { ...data };
        delete data.id;
        Object.keys(data).forEach(key => {
            if (key.toLowerCase().includes('id') || key.toLowerCase() === 'regino') {
                delete data[key];
            }
        });
    }
    
    let html = `<div class="custom-modal-inner custom-modal-edit" style="display: grid; grid-template-columns: repeat(${outerCols}, 1fr); gap: 16px; align-items: start;">`;
    
    sections.forEach(section => {
        const sectionColumns = getSectionColumnCount(section.fields.length);
        html += `
            <div class="config-section-card" style="border-left: 4px solid ${section.color}; grid-column: 1 / -1; padding: 14px 18px; border-radius: 12px; background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%); box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                <h3 style="margin: 0 0 12px; color: #334155; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                    <i class="fas ${section.icon || 'fa-info-circle'}" style="color: ${section.color};"></i>
                    ${section.title}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(${sectionColumns}, 1fr); gap: 10px 16px;">
        `;
        
        section.fields.forEach(field => {
            const value = data[field.name] || data[field.name.charAt(0).toUpperCase() + field.name.slice(1)] || '';
            const dateValue = field.type === 'date' && value 
                ? new Date(value).toISOString().split('T')[0]
                : value;
            
            const requiredMark = field.required ? ' *' : '';
            const isFullWidth = field.width === 'full' || field.type === 'textarea';
            const gridSpan = isFullWidth ? `grid-column: 1 / -1;` : '';
            
            html += `
                <div class="profile-field-compact" style="${gridSpan}">
                    <label class="profile-label-compact">
                        ${field.icon ? `<i class="fas ${field.icon}" style="color: ${section.color}; margin-right: 6px;"></i>` : ''}
                        ${field.label}${requiredMark}
                    </label>
            `;
            
            const commonStyle = `width: 100%; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;`;
            
            if (field.type === 'textarea') {
                html += `<textarea id="edit-${field.name}" rows="2" style="${commonStyle} resize: vertical; min-height: 52px;" onfocus="this.style.borderColor='${section.color}'; this.style.boxShadow='0 0 0 3px ${section.color}20'" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">${value}</textarea>`;
            } else if (field.type === 'select' && field.options) {
                html += `<select id="edit-${field.name}" style="${commonStyle}" onfocus="this.style.borderColor='${section.color}'; this.style.boxShadow='0 0 0 3px ${section.color}20'" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">`;
                html += `<option value="">選択してください</option>`;
                field.options.forEach(opt => {
                    const selected = value === opt ? 'selected' : '';
                    html += `<option value="${opt}" ${selected}>${opt}</option>`;
                });
                html += `</select>`;
            } else {
                const inputValue = field.type === 'date' ? dateValue : value;
                const isDateField = field.type === 'date';
                
                if (isDateField) {
                    html += `
                        <div class="date-input-wrapper" style="position: relative; display: flex; align-items: center; width: 100%;">
                            <input type="text" id="edit-${field.name}" value="${inputValue ? inputValue.replace(/-/g, '/') : ''}" placeholder="YYYY/MM/DD" 
                                style="${commonStyle} padding-right: 35px;" 
                                onfocus="this.style.borderColor='${section.color}'; this.style.boxShadow='0 0 0 3px ${section.color}20'" 
                                onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">
                            <i class="fas fa-calendar-alt" style="position: absolute; right: 12px; color: ${section.color}; cursor: pointer;" onclick="openCustomCalendar(document.getElementById('edit-${field.name}'))"></i>
                        </div>`;
                } else if (field.button && field.button.label && field.button.onclick) {
                    const btnOnclick = field.button.onclick === 'openConstructNumberModal' ? 'openConstructNumberModal()' : field.button.onclick;
                    html += `<div style="display: flex; gap: 8px; align-items: center;"><input type="${field.type}" id="edit-${field.name}" value="${inputValue}" style="${commonStyle} flex:1;" onfocus="this.style.borderColor='${section.color}'; this.style.boxShadow='0 0 0 3px ${section.color}20'" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'"><button type="button" class="btn-secondary" style="padding: 8px 14px; white-space: nowrap; flex-shrink: 0;" onclick="${btnOnclick}">${field.button.label}</button></div>`;
                } else {
                    html += `<input type="${field.type}" id="edit-${field.name}" value="${inputValue}" style="${commonStyle}" onfocus="this.style.borderColor='${section.color}'; this.style.boxShadow='0 0 0 3px ${section.color}20'" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">`;
                }
            }
            
            html += `
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

window.editCustomTableModal = function() {
    if (!window.currentTableData || !window.currentTableName) return;
    window.openCustomTableModal(window.currentTableName, window.currentTableData, 'edit');
};

// t_acceptorder の config フィールド名（小文字）→ DB カラム名（PascalCase）マッピング
const T_ACCEPTORDER_FIELD_MAP = {
    constructno: 'ConstructNo', constructname: 'ConstructName', registerdate: 'RegisterDate',
    eigyomanno: 'EigyoManno', orderprice: 'OrderPrice', orderdate: 'OrderDate', deliverydate: 'DeliveryDate',
    ownercode: 'OwnerCode', usercode: 'UserCode',
    dealingdocmitsumori: 'DealingDocMitsumori', dealingdocchuumon: 'DealingDocChuumon', dealingdocseikyu: 'DealingDocSeikyu'
};

function mapAcceptOrderFormDataToDb(formData) {
    const out = {};
    for (const [key, value] of Object.entries(formData)) {
        const dbKey = T_ACCEPTORDER_FIELD_MAP[key] || key;
        if (value === '' || value === null || value === undefined) {
            out[dbKey] = null;
            continue;
        }
        if (['registerdate', 'orderdate', 'deliverydate'].includes(key) && typeof value === 'string') {
            out[dbKey] = value.replace(/\//g, '-');
        } else if (key === 'orderprice' && value !== null) {
            out[dbKey] = parseFloat(value) || null;
        } else {
            out[dbKey] = value;
        }
    }
    return out;
}

window.saveCustomTableData = async function() {
    const tableName = window.currentTableName;
    const config = window.currentTableModalConfig || findTableConfig(tableName);
    if (!config || !config.sections) return;
    
    const formData = {};
    config.sections.forEach(section => {
        (section.fields || []).forEach(field => {
            const el = document.getElementById(`edit-${field.name}`);
            if (el) formData[field.name] = el.value !== '' ? el.value : null;
        });
    });
    
    const requiredFields = [];
    config.sections.forEach(section => {
        (section.fields || []).forEach(field => {
            if (field.required && (formData[field.name] == null || formData[field.name] === '')) {
                requiredFields.push(field.label);
            }
        });
    });
    if (requiredFields.length > 0) {
        showMessage(`以下の項目は必須です: ${requiredFields.join(', ')}`, 'error');
        return;
    }
    
    const tableNameForDb = getTableNameForSupabase(tableName);
    let payload = { ...formData };
    if (window.currentTableMode === 'new') {
        delete payload.id;
        if (payload.regino != null) delete payload.regino;
    }
    const norm = normalizeTableName(tableName || '');
    if (norm === 'tacceptorder') {
        if (window.currentTableMode === 'new') {
            payload.CancelFlg = false;
            if (!payload.RegisterDate) payload.RegisterDate = new Date().toISOString().split('T')[0];
        }
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabaseクライアントが初期化されていません');
        }
        
        const primaryKey = Object.keys(window.currentTableData || {}).find(key => 
            key.toLowerCase() === 'id' || key.toLowerCase() === 'regino'
        );
        
        let result;
        if (window.currentTableMode === 'edit' && primaryKey && (window.currentTableData[primaryKey] != null && window.currentTableData[primaryKey] !== '')) {
            result = await supabase
                .from(tableNameForDb)
                .update(payload)
                .eq(primaryKey, window.currentTableData[primaryKey]);
            if (result.error) throw result.error;
            showMessage(`${config.displayName}を更新しました`, 'success');
        } else {
            result = await supabase
                .from(tableNameForDb)
                .insert([payload]);
            if (result.error) throw result.error;
            showMessage(`${config.displayName}を登録しました`, 'success');
        }
        
        closeCustomTableModal();
        try {
            if (typeof loadTableData === 'function' && currentTable) {
                await loadTableData(currentTable);
            }
            const acceptOrderPage = document.getElementById('accept-order-list-page');
            if (acceptOrderPage && acceptOrderPage.classList.contains('active') && typeof loadAcceptOrderList === 'function') {
                const cn = document.getElementById('accept-order-search-constructno');
                const cust = document.getElementById('accept-order-search-customer');
                loadAcceptOrderList(cn ? cn.value : '', cust ? cust.value : '');
            }
        } catch (refreshErr) {
            console.warn('一覧の更新に失敗しました（保存は完了しています）:', refreshErr);
        }
        
    } catch (error) {
        console.error('保存エラー:', error);
        showMessage('保存に失敗しました: ' + (error.message || '不明なエラー'), 'error');
    }
};

window.closeCustomTableModal = function() {
    const modal = document.getElementById('custom-table-modal');
    if (!modal) return;
    
    const content = modal.querySelector('.modal-content');
    content.style.transform = 'scale(0.9)';
    content.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.opacity = '0';
        window.currentTableData = null;
        window.currentTableMode = 'view';
        window.currentTableName = null;
    }, 300);
};

// 受注登録（営業部用）の専用モーダルを開く
async function openOrderRegistrationModal() {
    console.log('受注登録モーダルを開きます');
    
    // 顧客マスタから選択肢を取得（検索用）
    let customers = [];
    try {
        const { data, error } = await getSupabaseClient()
            .from('t_companycode')
            .select('CompanyCode, CompanyName')
            .order('CompanyName');
        if (!error && data) customers = data;
    } catch (e) {
        console.warn('顧客マスタの取得に失敗しました', e);
    }

    // モーダルのHTML構造を生成
    const modalHtml = `
        <div id="order-registration-modal" class="custom-table-modal" style="display: flex; opacity: 1;">
            <div class="custom-modal-container" style="width: 900px; max-width: 95vw; max-height: 90vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;">
                <div class="custom-modal-header" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                    <div class="header-left" style="display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-file-invoice-dollar" style="font-size: 20px;"></i>
                        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">新規受注登録 (営業受注入力)</h3>
                    </div>
                    <button class="close-btn" onclick="closeOrderRegistrationModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div class="custom-modal-content" style="padding: 24px; overflow-y: auto; flex: 1;">
                    <form id="order-registration-form">
                        <!-- セクション1: 基本情報 -->
                        <div class="config-section-card" style="border-left: 4px solid #3b82f6; margin-bottom: 24px; background: #f8fafc; padding: 20px; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;"><i class="fas fa-info-circle"></i> 基本情報</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">工事番号 <span style="color: red;">*</span></label>
                                    <div style="display: flex; gap: 8px;">
                                        <input type="text" id="reg-ConstructNo" name="ConstructNo" placeholder="例: 24001" required style="flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                        <button type="button" class="action-btn-detail" style="width: auto; padding: 0 12px; font-size: 12px; height: 38px;" onclick="showPage('construct-number')">採番へ</button>
                                    </div>
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">工事名称 <span style="color: red;">*</span></label>
                                    <input type="text" id="reg-ConstructName" name="ConstructName" placeholder="〇〇株式会社 向け △△装置" required style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">顧客選択 (マスタ)</label>
                                    <select id="reg-OwnerCode" name="OwnerCode" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
                                        <option value="">選択してください</option>
                                        ${customers.map(c => `<option value="${c.CompanyCode}">${c.CompanyName} (${c.CompanyCode})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">営業担当者</label>
                                    <input type="text" id="reg-StaffCode" name="StaffCode" placeholder="担当者名" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                </div>
                            </div>
                        </div>

                        <!-- セクション2: 金額・納期 -->
                        <div class="config-section-card" style="border-left: 4px solid #10b981; margin-bottom: 24px; background: #f8fafc; padding: 20px; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h4 style="color: #059669; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;"><i class="fas fa-yen-sign"></i> 受注金額・スケジュール</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">受注金額</label>
                                    <input type="number" id="reg-OrderPrice" name="OrderPrice" placeholder="0" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: right; font-weight: bold; color: #059669;">
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">受注日</label>
                                    <div class="date-input-wrapper" style="position: relative; display: flex; align-items: center; height: 38px;">
                                        <input type="text" id="reg-OrderDate" name="OrderDate" class="date-input" placeholder="YYYY/MM/DD" style="width: 100%; height: 100%; padding: 8px 35px 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                        <i class="fas fa-calendar-alt" style="position: absolute; right: 10px; color: #10b981; cursor: pointer;" onclick="openCustomCalendar(document.getElementById('reg-OrderDate'))"></i>
                                    </div>
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">納期</label>
                                    <div class="date-input-wrapper" style="position: relative; display: flex; align-items: center; height: 38px;">
                                        <input type="text" id="reg-DeliveryDate" name="DeliveryDate" class="date-input" placeholder="YYYY/MM/DD" style="width: 100%; height: 100%; padding: 8px 35px 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                        <i class="fas fa-calendar-alt" style="position: absolute; right: 10px; color: #10b981; cursor: pointer;" onclick="openCustomCalendar(document.getElementById('reg-DeliveryDate'))"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- セクション3: 電帳法・ドキュメント管理 -->
                        <div class="config-section-card" style="border-left: 4px solid #f59e0b; margin-bottom: 24px; background: #f8fafc; padding: 20px; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h4 style="color: #d97706; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;"><i class="fas fa-cloud-upload-alt"></i> 電帳法対応 (OneDrive連携用)</h4>
                            <div style="background: #fffbeb; padding: 12px; border-radius: 8px; font-size: 13px; color: #92400e; margin-bottom: 12px; border: 1px solid #fef3c7;">
                                <i class="fas fa-exclamation-triangle"></i> 受注登録完了後、見積書・注文書をOneDriveへアップロードしてください。
                            </div>
                            <div class="profile-field-compact">
                                <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">関連ドキュメント備考</label>
                                <textarea id="reg-Memo" name="Memo" rows="2" placeholder="ドキュメントの保管場所や特記事項" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; resize: vertical;"></textarea>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-bottom: 20px;">
                            <button type="button" class="action-btn-detail" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1 !important; width: auto; padding: 0 24px; height: 42px;" onclick="closeOrderRegistrationModal()">キャンセル</button>
                            <button type="submit" class="action-btn-detail" style="background: #1e40af; color: white; width: 240px; font-weight: bold; height: 42px;">受注情報を登録する</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // モーダルをDOMに追加
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // フォーム送信イベント
    document.getElementById('order-registration-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // ローディング表示（オプション）
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '登録中...';
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // 日付形式の変換 (YYYY/MM/DD -> YYYY-MM-DD)
        if (data.OrderDate) data.OrderDate = data.OrderDate.replace(/\//g, '-');
        if (data.DeliveryDate) data.DeliveryDate = data.DeliveryDate.replace(/\//g, '-');
        
        // 数値変換
        if (data.OrderPrice) data.OrderPrice = parseFloat(data.OrderPrice);
        
        // デフォルト値のセット
        data.RegisterDate = new Date().toISOString();
        
        try {
            const { error } = await getSupabaseClient()
                .from('t_acceptorder')
                .insert([data]);
            
            if (error) throw error;
            
            alert('受注登録が完了しました。\n製造指図書のPDF出力と関連部署への通知準備を行ってください。');
            closeOrderRegistrationModal();
            if (window.currentTableName === 't_acceptorder') displayTable();
        } catch (error) {
            console.error('登録エラー:', error);
            alert('登録に失敗しました: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

function closeOrderRegistrationModal() {
    const modal = document.getElementById('order-registration-modal');
    if (modal) modal.remove();
}

// 受注登録ページを閉じて登録メニューに戻る（モーダルではなくフル画面ページ用）
function closeOrderRegistrationPage() {
    showPage('register');
}

// 受注登録ページの初期化（日付デフォルト・フォーム送信バインド）
let orderRegistrationFormBound = false;
function initOrderRegistrationPage() {
    const today = new Date();
    const todayStr = today.getFullYear() + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + String(today.getDate()).padStart(2, '0');
    const orderDateEl = document.getElementById('reg-OrderDate');
    const deliveryDateEl = document.getElementById('reg-DeliveryDate');
    if (orderDateEl && !orderDateEl.value) orderDateEl.value = todayStr;
    if (deliveryDateEl && !deliveryDateEl.value) deliveryDateEl.value = todayStr;
    const salesRepDisplay = document.getElementById('reg-sales-rep-display');
    if (salesRepDisplay && typeof window.currentUserName === 'string') salesRepDisplay.textContent = window.currentUserName;
    const staffCodeEl = document.getElementById('reg-StaffCode');
    if (staffCodeEl && typeof window.currentUserCode === 'string') staffCodeEl.value = window.currentUserCode;
    if (orderRegistrationFormBound) return;
    const form = document.getElementById('order-registration-form');
    if (!form) return;
    orderRegistrationFormBound = true;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '登録中...'; }
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        if (data.OrderDate) data.OrderDate = data.OrderDate.replace(/\//g, '-');
        if (data.DeliveryDate) data.DeliveryDate = data.DeliveryDate.replace(/\//g, '-');
        if (data.FactoryShipDate) data.FactoryShipDate = data.FactoryShipDate.replace(/\//g, '-');
        if (data.OrderPrice) data.OrderPrice = parseFloat(data.OrderPrice) || 0;
        data.RegisterDate = new Date().toISOString();
        try {
            const { error } = await getSupabaseClient().from('t_acceptorder').insert([data]);
            if (error) throw error;
            alert('受注登録が完了しました。\n製造指図書のPDF出力と関連部署への通知準備を行ってください。');
            closeOrderRegistrationPage();
            if (window.currentTableName === 't_acceptorder') displayTable();
        } catch (err) {
            console.error('登録エラー:', err);
            alert('登録に失敗しました: ' + (err.message || err));
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        }
    });
}

// --- 受注データ一覧・検索ページ（t_acceptorder） ---
async function loadAcceptOrderList(constructNo, customerName) {
    const tbody = document.getElementById('accept-order-tbody');
    const countEl = document.getElementById('accept-order-list-count');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="padding: 24px; text-align: center; color: #94a3b8;"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</td></tr>';
    try {
        let query = getSupabaseClient().from('t_acceptorder').select('*').order('registerdate', { ascending: false });
        if (constructNo && constructNo.trim()) {
            query = query.ilike('constructno', '%' + constructNo.trim() + '%');
        }
        if (customerName && customerName.trim()) {
            const term = customerName.trim();
            query = query.or('constructname.ilike.%' + term + '%,ownercode.ilike.%' + term + '%,usercode.ilike.%' + term + '%');
        }
        const { data: rows, error } = await query;
        if (error) throw error;
        const list = rows || [];
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="padding: 24px; text-align: center; color: #64748b;">該当する受注データがありません。</td></tr>';
        } else {
            const PP = window.PolarisProduction;
            tbody.innerHTML = list.map(row => {
                const cn = row.ConstructNo ?? row.constructno ?? '-';
                const cname = row.ConstructName ?? row.constructname ?? '-';
                const owner = row.OwnerCode ?? row.ownercode ?? '-';
                const user = row.UserCode ?? row.usercode ?? '-';
                const price = row.OrderPrice ?? row.orderprice;
                const priceStr = price != null ? Number(price).toLocaleString('ja-JP') : '-';
                const orderDate = row.OrderDate ?? row.orderdate;
                const orderDateStr = orderDate ? new Date(orderDate).toLocaleDateString('ja-JP') : '-';
                const deliveryDate = row.DeliveryDate ?? row.deliverydate;
                const deliveryStr = deliveryDate ? new Date(deliveryDate).toLocaleDateString('ja-JP') : '-';
                const regDate = row.RegisterDate ?? row.registerdate;
                const regStr = regDate ? new Date(regDate).toLocaleDateString('ja-JP') : '-';
                const phaseSummary = PP ? PP.getPaymentPhaseSummary(row) : { nextPhase: '-', unpaidPhases: [] };
                const nextPhaseStr = phaseSummary.nextPhase || '-';
                const rowStyle = (PP && PP.getStatusStyle(row, 't_acceptorder')) ? PP.getStatusStyle(row, 't_acceptorder') : '';
                const rowJson = JSON.stringify(row).replace(/"/g, '&quot;');
                return `<tr class="accept-order-row" data-row='${rowJson}' style="cursor: pointer; transition: background 0.2s; ${rowStyle}" onmouseover="if(!this._polarisColor) this.style.background='#f1f5f9'" onmouseout="if(!this._polarisColor) this.style.background=''">
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(String(cn))}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(String(cname))}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(String(owner))}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(String(user))}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${priceStr}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${orderDateStr}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${deliveryStr}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${regStr}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; font-weight: 600; color: #475569;">${escapeHtml(nextPhaseStr)}</td>
                </tr>`;
            }).join('');
            tbody.querySelectorAll('.accept-order-row').forEach(tr => {
                const style = tr.getAttribute('style') || '';
                if (style.indexOf('background:') !== -1) tr._polarisColor = true;
            });
            tbody.querySelectorAll('.accept-order-row').forEach(tr => {
                tr.addEventListener('click', function () {
                    try {
                        const row = JSON.parse(this.getAttribute('data-row').replace(/&quot;/g, '"'));
                        if (typeof window.openCustomTableModal === 'function') {
                            window.openCustomTableModal('t_acceptorder', row, 'view');
                        }
                    } catch (e) { console.warn(e); }
                });
            });
        }
        if (countEl) countEl.textContent = list.length;
    } catch (err) {
        console.error('受注一覧取得エラー:', err);
        tbody.innerHTML = '<tr><td colspan="9" style="padding: 24px; text-align: center; color: var(--error);">読み込みに失敗しました: ' + (err.message || err) + '</td></tr>';
        if (countEl) countEl.textContent = '0';
    }
}

function initAcceptOrderListPage() {
    const newBtn = document.getElementById('accept-order-new-btn');
    const searchBtn = document.getElementById('accept-order-search-btn');
    const clearBtn = document.getElementById('accept-order-search-clear-btn');
    const inputConstruct = document.getElementById('accept-order-search-constructno');
    const inputCustomer = document.getElementById('accept-order-search-customer');
    if (newBtn) {
        newBtn.onclick = function () {
            if (typeof window.openCustomTableModal === 'function') {
                window.openCustomTableModal('t_acceptorder', {}, 'new');
            }
        };
    }
    if (searchBtn) {
        searchBtn.onclick = function () {
            const cn = inputConstruct ? inputConstruct.value : '';
            const cust = inputCustomer ? inputCustomer.value : '';
            loadAcceptOrderList(cn, cust);
        };
    }
    if (clearBtn) {
        clearBtn.onclick = function () {
            if (inputConstruct) inputConstruct.value = '';
            if (inputCustomer) inputCustomer.value = '';
            loadAcceptOrderList('', '');
        };
    }
    loadAcceptOrderList('', '');
}

// グローバルに公開
window.closeOrderRegistrationModal = closeOrderRegistrationModal;
window.closeOrderRegistrationPage = closeOrderRegistrationPage;

// 諸掛購入登録ページを閉じて登録メニューに戻る
function closeMiscPurchasePage() {
    showPage('register');
}
window.closeMiscPurchasePage = closeMiscPurchasePage;

// 納入処理ページを閉じて登録メニューに戻る
function closeMiscDeliveryPage() {
    showPage('register');
}
window.closeMiscDeliveryPage = closeMiscDeliveryPage;

// 部品単位出荷管理ページを閉じて登録メニューに戻る
function closeShippingPage() {
    showPage('register');
}
window.closeShippingPage = closeShippingPage;

// 外注・材料納入処理ページを閉じて登録メニューに戻る
function closeOutsourceDeliveryPage() {
    showPage('register');
}
window.closeOutsourceDeliveryPage = closeOutsourceDeliveryPage;

// 購入部品納入処理ページを閉じて登録メニューに戻る
function closePartsDeliveryPage() {
    showPage('register');
}
window.closePartsDeliveryPage = closePartsDeliveryPage;

// 余り品登録ページを閉じて登録メニューに戻る
function closeSurplusRegisterPage() {
    showPage('register');
}
window.closeSurplusRegisterPage = closeSurplusRegisterPage;

// 余り品検索ページを閉じて登録メニューに戻る
function closeSurplusSearchPage() {
    showPage('register');
}
window.closeSurplusSearchPage = closeSurplusSearchPage;

// 工事番号出荷登録ページを閉じて登録メニューに戻る
function closeProjectShippingPage() {
    showPage('register');
}
window.closeProjectShippingPage = closeProjectShippingPage;

// 納入処理ページの初期化（t_acceptorder で紐づけ・工事番号で検索）
function initMiscDeliveryPage() {
    const searchBtn = document.getElementById('delivery-search-btn');
    const copyAllBtn = document.getElementById('delivery-copy-all-btn');
    const registerBtn = document.getElementById('delivery-register-btn');
    const tbody = document.getElementById('misc-delivery-result-body');
    const emptyRow = '<tr><td colspan="18" style="text-align: center; padding: 24px; color: #64748b;">検索条件を入力して「データ検索」を押してください</td></tr>';

    if (searchBtn && tbody) {
        searchBtn.addEventListener('click', async () => {
            const constructNo = (document.getElementById('delivery-construct-no') || {}).value.trim();
            const orderTo = (document.getElementById('delivery-order-to') || {}).value.trim();
            const orderNo = (document.getElementById('delivery-order-no') || {}).value.trim();
            tbody.innerHTML = '<tr><td colspan="18" style="text-align: center; padding: 24px;"><i class="fas fa-spinner fa-spin"></i> 検索中...</td></tr>';
            try {
                let query = getSupabaseClient().from('t_acceptorder').select('*');
                if (constructNo) query = query.ilike('constructno', '%' + constructNo + '%');
                if (orderTo) {
                    const pat = '%' + orderTo + '%';
                    query = query.or('ownercode.ilike.' + pat + ',usercode.ilike.' + pat);
                }
                const { data, error } = await query.order('constructno');
                if (error) throw error;
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="18" style="text-align: center; padding: 24px; color: #64748b;">該当データがありません</td></tr>';
                    return;
                }
                tbody.innerHTML = data.map(row => {
                    const c = row.constructno ?? '';
                    const name = row.constructname ?? '';
                    const delivery = row.deliverydate ?? '';
                    const price = row.orderprice ?? '';
                    const owner = row.ownercode ?? '';
                    return '<tr>' +
                        '<td>' + escapeHtml(c) + '</td><td></td><td></td><td></td><td></td><td></td><td></td>' +
                        '<td>' + escapeHtml(name) + '</td><td></td><td></td><td></td>' +
                        '<td></td><td>' + escapeHtml(delivery) + '</td><td></td><td></td><td></td><td>' + escapeHtml(String(price)) + '</td>' +
                        '<td>' + escapeHtml(owner) + '</td></tr>';
                }).join('');
            } catch (e) {
                console.error('納入処理検索エラー:', e);
                tbody.innerHTML = '<tr><td colspan="18" style="text-align: center; padding: 24px; color: #dc2626;">検索に失敗しました</td></tr>';
            }
        });
    }
    if (copyAllBtn) copyAllBtn.addEventListener('click', () => { console.log('納入日を全行にコピー'); });
    if (registerBtn) registerBtn.addEventListener('click', () => { console.log('納入日を登録'); });
}

// 外注・材料納入処理ページの初期化（t_acceptorder で紐づけ・工事番号で検索）
function initOutsourceDeliveryPage() {
    const searchBtn = document.getElementById('outsource-search-btn');
    const copyAllBtn = document.getElementById('outsource-copy-all-btn');
    const registerBtn = document.getElementById('outsource-register-date-btn');
    const detailBtn = document.getElementById('outsource-detail-btn');
    const tbody = document.getElementById('outsource-delivery-result-body');
    if (!tbody) return;
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const constructNo = (document.getElementById('outsource-construct-no') || {}).value.trim();
            const orderTo = (document.getElementById('outsource-order-to') || {}).value.trim();
            const orderNo = (document.getElementById('outsource-order-no') || {}).value.trim();
            tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px;"><i class="fas fa-spinner fa-spin"></i> 検索中...</td></tr>';
            try {
                let query = getSupabaseClient().from('t_acceptorder').select('*');
                if (constructNo) query = query.ilike('constructno', '%' + constructNo + '%');
                if (orderTo) {
                    const pat = '%' + orderTo + '%';
                    query = query.or('ownercode.ilike.' + pat + ',usercode.ilike.' + pat);
                }
                const { data, error } = await query.order('constructno');
                if (error) throw error;
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px; color: #64748b;">該当データがありません</td></tr>';
                    return;
                }
                const esc = (v) => (v == null || v === '') ? '' : escapeHtml(String(v));
                tbody.innerHTML = data.map(row => '<tr>' +
                    '<td>' + esc(row.constructno) + '</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>' + esc(row.deliverydate) + '</td><td></td><td></td><td></td>' +
                    '<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>' + esc(row.orderprice) + '</td></tr>').join('');
            } catch (e) {
                console.error('外注・材料納入処理検索エラー:', e);
                tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px; color: #dc2626;">検索に失敗しました</td></tr>';
            }
        });
    }
    if (copyAllBtn) copyAllBtn.addEventListener('click', () => { console.log('納入日を全行にコピー'); });
    if (registerBtn) registerBtn.addEventListener('click', () => { console.log('納入日を登録'); });
    if (detailBtn) detailBtn.addEventListener('click', () => { console.log('詳細表示'); });
}

// 部品単位出荷管理ページの初期化
function initShippingPage() {
    const searchBtn = document.getElementById('shipping-search-btn');
    const clearBtn = document.getElementById('shipping-clear-btn');
    const tbody = document.getElementById('shipping-result-body');
    const countEl = document.getElementById('shipping-result-count');
    const tabDescEl = document.getElementById('shipping-tab-desc');
    var lastShippingResultCount = 0;

    function updateShippingCount(n) {
        lastShippingResultCount = n;
        if (countEl) countEl.textContent = (n >= 0) ? (n + ' 件') : '—';
    }

    function runShippingSearch() {
        if (!searchBtn) return;
        searchBtn.click();
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            var form = document.getElementById('shipping-form');
            if (form) {
                form.reset();
                var radios = form.querySelectorAll('input[type="radio"]');
                var all = form.querySelector('input[name="shipping-number-type"][value="all"]');
                var prep = form.querySelector('input[name="shipping-status2"][value="prep-incomplete"]');
                if (all) all.checked = true;
                if (prep) prep.checked = true;
            }
            if (tbody) tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 32px; color: #64748b;">工事番号や番号範囲を選び、「検索」を押してください（Enterでも検索できます）</td></tr>';
            updateShippingCount(-1);
        });
    }

    document.querySelectorAll('.shipping-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.shipping-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            var tabLabels = { unit: '部品単位: 検索で工事・部品一覧を表示します。', construct: '工事番号単位: 工事ごとの出荷状況を表示します。', unshipped: '未出荷リスト: 未出荷の部品一覧です。', pending: 'ペンディング: 保留中のリストです。', cancel: '出荷キャンセル: キャンセル一覧です。', unsold7000: '未売上7000番: 7000番で出荷済み・未売上の一覧です。' };
            if (tabDescEl) tabDescEl.textContent = tabLabels[tab.getAttribute('data-tab')] || '';
        });
    });

    document.querySelectorAll('.shipping-quick-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            var v = this.getAttribute('data-filter');
            var r = document.querySelector('input[name="shipping-number-type"][value="' + v + '"]');
            if (r) { r.checked = true; runShippingSearch(); }
        });
    });

    ['shipping-construct-no', 'shipping-sales-rep', 'shipping-delivery-to'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); runShippingSearch(); } });
    });

    if (searchBtn && tbody) {
        searchBtn.addEventListener('click', async function () {
            var constructNo = (document.getElementById('shipping-construct-no') || {}).value.trim();
            var salesRep = (document.getElementById('shipping-sales-rep') || {}).value.trim();
            var deliveryTo = (document.getElementById('shipping-delivery-to') || {}).value.trim();
            var numberType = (document.querySelector('input[name="shipping-number-type"]:checked') || {}).value || 'all';
            tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px;"><i class="fas fa-spinner fa-spin"></i> 検索中...</td></tr>';
            updateShippingCount(-1);
            try {
                var supabase = getSupabaseClient();
                if (!supabase) { throw new Error('データベースに接続されていません'); }
                var query = supabase.from('t_acceptorder').select('*');
                if (constructNo) query = query.ilike('constructno', '%' + constructNo + '%');
                if (salesRep) query = query.ilike('eigyomanno', '%' + salesRep + '%');
                if (deliveryTo) query = query.or('ownercode.ilike.%' + deliveryTo + '%,usercode.ilike.%' + deliveryTo + '%,constructname.ilike.%' + deliveryTo + '%');
                if (numberType === '5000') query = query.gte('constructno', '5000').lt('constructno', '6000');
                else if (numberType === '8000') query = query.gte('constructno', '8000').lt('constructno', '9000');
                else if (numberType === '7000') query = query.gte('constructno', '7000').lt('constructno', '8000');
                var result = await query.order('constructno').limit(500);
                var data = result.data, error = result.error;
                if (error) throw error;
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px; color: #64748b;">該当データがありません。条件を変えて再検索してください。</td></tr>';
                    updateShippingCount(0);
                    return;
                }
                var esc = function (v) { return (v == null || v === '') ? '' : escapeHtml(String(v)); };
                tbody.innerHTML = data.map(row => '<tr>' +
                    '<td>' + esc(row.constructno) + '</td><td></td><td></td><td></td><td></td><td></td><td>' + esc(row.constructname) + '</td><td></td><td></td><td></td>' +
                    '<td>' + esc(row.eigyomanno || row.eigyomanname) + '</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>' + esc(row.deliverydate) + '</td><td></td><td></td></tr>').join('');
                updateShippingCount(data.length);
            } catch (e) {
                console.error('出荷管理検索エラー:', e);
                tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px; color: #dc2626;">検索に失敗しました: ' + escapeHtml(e.message || String(e)) + '</td></tr>';
                updateShippingCount(-1);
            }
        });
    }
}

// 購入部品納入処理ページの初期化（t_acceptorder で紐づけ・工事番号で検索、諸掛納入処理と同じレイアウト）
function initPartsDeliveryPage() {
    const searchBtn = document.getElementById('parts-delivery-search-btn');
    const copyAllBtn = document.getElementById('parts-delivery-copy-all-btn');
    const registerBtn = document.getElementById('parts-delivery-register-btn');
    const tbody = document.getElementById('parts-delivery-result-body');
    if (!tbody) return;
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const constructNo = (document.getElementById('parts-delivery-construct-no') || {}).value.trim();
            const orderTo = (document.getElementById('parts-delivery-order-to') || {}).value.trim();
            tbody.innerHTML = '<tr><td colspan="18" style="text-align: center; padding: 24px;"><i class="fas fa-spinner fa-spin"></i> 検索中...</td></tr>';
            try {
                let query = getSupabaseClient().from('t_acceptorder').select('*');
                if (constructNo) query = query.ilike('constructno', '%' + constructNo + '%');
                if (orderTo) {
                    const pat = '%' + orderTo + '%';
                    query = query.or('ownercode.ilike.' + pat + ',usercode.ilike.' + pat);
                }
                const { data, error } = await query.order('constructno');
                if (error) throw error;
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="18" style="text-align: center; padding: 24px; color: #64748b;">該当データがありません</td></tr>';
                    return;
                }
                tbody.innerHTML = data.map(row => {
                    const c = row.constructno ?? '';
                    const name = row.constructname ?? '';
                    const delivery = row.deliverydate ?? '';
                    const price = row.orderprice ?? '';
                    const owner = row.ownercode ?? '';
                    return '<tr>' +
                        '<td>' + escapeHtml(c) + '</td><td></td><td></td><td></td><td></td><td></td><td></td>' +
                        '<td>' + escapeHtml(name) + '</td><td></td><td></td><td></td>' +
                        '<td></td><td>' + escapeHtml(delivery) + '</td><td></td><td></td><td></td><td>' + escapeHtml(String(price)) + '</td>' +
                        '<td>' + escapeHtml(owner) + '</td></tr>';
                }).join('');
            } catch (e) {
                console.error('購入部品納入処理検索エラー:', e);
                tbody.innerHTML = '<tr><td colspan="18" style="text-align: center; padding: 24px; color: #dc2626;">検索に失敗しました</td></tr>';
            }
        });
    }
    if (copyAllBtn) copyAllBtn.addEventListener('click', () => { console.log('納入日を全行にコピー'); });
    if (registerBtn) registerBtn.addEventListener('click', () => { console.log('納入日を登録'); });
}

// 余り品検索ページの初期化
function initSurplusSearchPage() {
    const form = document.getElementById('surplus-search-form');
    const searchBtn = document.getElementById('surplus-search-btn');
    const clearBtn = document.getElementById('surplus-clear-display-btn');
    const tbody = document.getElementById('surplus-search-result-body');
    const emptyRow = '<tr><td colspan="21" style="text-align: center; padding: 24px; color: #64748b;">検索条件を入力して「検索」を押してください</td></tr>';
    if (!form) return;
    if (searchBtn && tbody) {
        searchBtn.addEventListener('click', async () => {
            const constructNo = (document.getElementById('surplus-construct-no') || {}).value.trim();
            const inventoryNo = (document.getElementById('surplus-inventory-no') || {}).value.trim();
            const partName = (document.getElementById('surplus-name') || {}).value.trim();
            tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px;"><i class="fas fa-spinner fa-spin"></i> 検索中...</td></tr>';
            try {
                const tableName = 't_surplus';
                let query = getSupabaseClient().from(tableName).select('*');
                if (constructNo) query = query.ilike('constructno', '%' + constructNo + '%');
                if (inventoryNo) query = query.ilike('inventoryno', '%' + inventoryNo + '%');
                if (partName) query = query.ilike('partname', '%' + partName + '%');
                const { data, error } = await query.order('inventoryno', { nullsFirst: false }).limit(500);
                if (error) throw error;
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px; color: #64748b;">該当データがありません</td></tr>';
                    return;
                }
                const esc = (v) => (v == null || v === '') ? '' : escapeHtml(String(v));
                tbody.innerHTML = data.map(row => '<tr>' +
                    '<td>' + esc(row.inventoryno) + '</td><td>' + esc(row.surplusno) + '</td><td>' + esc(row.subno) + '</td><td>' + esc(row.rev) + '</td>' +
                    '<td>' + esc(row.constructno) + '</td><td>' + esc(row.machine) + '</td><td>' + esc(row.unit) + '</td><td>' + esc(row.serialno) + '</td>' +
                    '<td>' + esc(row.partname) + '</td><td>' + esc(row.drawing) + '</td><td>' + esc(row.partno) + '</td><td>' + esc(row.material) + '</td><td>' + esc(row.commercial) + '</td>' +
                    '<td>' + esc(row.quantity) + '</td><td>' + esc(row.unitname) + '</td><td>' + esc(row.newused) + '</td><td>' + esc(row.storage) + '</td>' +
                    '<td>' + esc(row.manufactured) + '</td><td>' + esc(row.purchased) + '</td><td>' + esc(row.conclusion) + '</td><td>' + esc(row.registrationstatus) + '</td></tr>').join('');
            } catch (e) {
                console.warn('余り品検索:', e.message || e);
                tbody.innerHTML = '<tr><td colspan="21" style="text-align: center; padding: 24px; color: #64748b;">検索条件を入力して「検索」を押してください</td></tr>';
            }
        });
    }
    if (clearBtn && form) {
        clearBtn.addEventListener('click', () => {
            form.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => { el.value = el.id === 'surplus-qty' ? '1' : (el.id === 'surplus-qty-unit' ? '個' : ''); });
            form.querySelectorAll('input[type="checkbox"]').forEach(el => { el.checked = (el.id === 'surplus-purchased' || el.id === 'surplus-manufactured'); });
            form.querySelectorAll('input[type="radio"]').forEach(el => { el.checked = el.value === 'new'; });
            if (tbody) tbody.innerHTML = emptyRow;
        });
    }
    document.querySelectorAll('#surplus-update-btn, #surplus-delete-btn, #surplus-dispose-btn, #surplus-edit-btn, #surplus-print-order-btn, #surplus-print-label-btn, #surplus-print-list-btn').forEach(btn => {
        if (btn) btn.addEventListener('click', () => { console.log(btn.textContent.trim(), '(未実装)'); });
    });
}

// 余り品登録ページの初期化
function initSurplusRegisterPage() {
    const form = document.getElementById('surplus-register-form');
    const constructNoEl = document.getElementById('surplus-reg-construct-no');
    const serialArea = document.getElementById('surplus-reg-serial-area');
    const drawingArea = document.getElementById('surplus-reg-drawing-area');
    document.querySelectorAll('.surplus-reg-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.surplus-reg-type-btn').forEach(b => { b.classList.remove('active'); b.classList.add('btn-secondary'); b.classList.remove('btn-primary'); });
            btn.classList.add('active'); btn.classList.remove('btn-secondary'); btn.classList.add('btn-primary');
            const isPurchased = btn.dataset.type === 'purchased';
            if (serialArea) serialArea.style.display = isPurchased ? '' : 'none';
            if (drawingArea) drawingArea.style.display = isPurchased ? 'none' : '';
        });
    });
    if (constructNoEl) {
        constructNoEl.addEventListener('blur', async () => {
            const no = constructNoEl.value.trim();
            if (!no) return;
            try {
                const { data } = await getSupabaseClient().from('t_acceptorder').select('constructname, ownercode, usercode').eq('constructno', no).maybeSingle();
                const nameEl = document.getElementById('surplus-reg-construct-name');
                const clientEl = document.getElementById('surplus-reg-client');
                const deliveryEl = document.getElementById('surplus-reg-delivery');
                const salesEl = document.getElementById('surplus-reg-sales');
                const shipEl = document.getElementById('surplus-reg-ship-date');
                if (data && nameEl) { nameEl.value = data.constructname || ''; }
                if (data && clientEl) { clientEl.value = data.ownercode || ''; }
                if (data && deliveryEl) { deliveryEl.value = data.usercode || ''; }
                if (salesEl) salesEl.value = '';
                if (shipEl) shipEl.value = '';
            } catch (e) { console.warn('受注情報取得:', e); }
        });
    }
    document.getElementById('surplus-reg-search-btn')?.addEventListener('click', () => { console.log('検索'); });
    document.getElementById('surplus-reg-submit-btn')?.addEventListener('click', (e) => { e.preventDefault(); console.log('新規登録'); });
    form?.querySelectorAll('button[type="button"]').forEach(btn => {
        if (btn.id === 'surplus-reg-submit-btn' || btn.onclick) return;
        if (btn.textContent.includes('在庫払出') || btn.textContent.includes('編集画面') || btn.textContent.includes('閉')) {
            btn.addEventListener('click', () => { if (btn.textContent.includes('閉')) closeSurplusRegisterPage(); else console.log(btn.textContent.trim()); });
        }
    });
}

// 工事番号出荷登録ページの初期化（検索・登録のイベント束縛）
function initProjectShippingPage() {
    const form = document.getElementById('project-shipping-form');
    const searchBtn = document.getElementById('project-ship-search-btn');
    if (!form) return;
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const no = (document.getElementById('project-ship-construct-no') || {}).value;
            if (!no) return;
            // TODO: 工事番号で受注情報を取得して右カラムに表示
            console.log('工事番号検索:', no);
        });
    }
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const no = (document.getElementById('project-ship-construct-no') || {}).value;
        const shipDate = (document.getElementById('project-ship-date') || {}).value;
        // TODO: 出荷日を登録（空の場合は消去）
        console.log('出荷登録:', { no, shipDate });
    });
}

// 諸掛購入登録ページの初期化（日付デフォルト等）
function initMiscPurchasePage() {
    const form = document.getElementById('misc-purchase-form');
    if (!form) return;
    const today = new Date();
    const todayStr = today.getFullYear() + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + String(today.getDate()).padStart(2, '0');
    form.querySelectorAll('input.date-input').forEach(el => { if (!el.value) el.value = todayStr; });
}

// 購入部品発注（資材課用）の専用モーダルを開く
async function openPurchaseOrderModal() {
    console.log('購入部品発注モーダルを開きます');
    
    // 取引先リストを取得（発注先用）
    let vendors = [];
    try {
        const { data, error } = await getSupabaseClient()
            .from('t_companycode')
            .select('CompanyCode, CompanyName')
            .order('CompanyName');
        if (!error && data) vendors = data;
    } catch (e) {
        console.warn('取引先マスタの取得に失敗しました', e);
    }

    const modalHtml = `
        <div id="purchase-order-modal" class="custom-table-modal" style="display: flex; opacity: 1;">
            <div class="custom-modal-container" style="width: 1000px; max-width: 95vw; max-height: 90vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;">
                <div class="custom-modal-header" style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%); color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                    <div class="header-left" style="display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-shopping-cart" style="font-size: 20px;"></i>
                        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">購入部品発注入力 (資材管理)</h3>
                    </div>
                    <button class="close-btn" onclick="closePurchaseOrderModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div class="custom-modal-content" style="padding: 24px; overflow-y: auto; flex: 1;">
                    <form id="purchase-order-form">
                        <!-- セクション1: 発注基本情報 -->
                        <div class="config-section-card" style="border-left: 4px solid #10b981; margin-bottom: 24px; background: #f0fdf4; padding: 20px; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h4 style="color: #166534; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;"><i class="fas fa-barcode"></i> 部品・在庫情報</h4>
                            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">部品名/型番 <span style="color: red;">*</span></label>
                                    <input type="text" id="reg-PartsName" name="PartsName" placeholder="例: ボルト M8x20" required style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px;" onchange="checkInventory(this.value)">
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">注文番号区分</label>
                                    <select id="reg-OrderType" name="OrderType" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;" onchange="generateOrderNumber(this.value)">
                                        <option value="P">個別発注 (P番)</option>
                                        <option value="A">一括発注 (A番)</option>
                                    </select>
                                </div>
                            </div>
                            <div id="inventory-alert" style="display: none; margin-top: 12px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; color: #92400e; font-size: 13px;">
                                <i class="fas fa-warehouse"></i> <span id="inventory-msg">在庫があります。払い出しますか？</span>
                                <button type="button" style="margin-left: 10px; background: #d97706; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer;" onclick="useInventory()">はい（在庫を使用）</button>
                            </div>
                        </div>

                        <!-- セクション2: 発注先・金額 -->
                        <div class="config-section-card" style="border-left: 4px solid #3b82f6; margin-bottom: 24px; background: #f8fafc; padding: 20px; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;"><i class="fas fa-truck"></i> 発注先・取引条件</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">発注先 (仕入先)</label>
                                    <select id="reg-VendorCode" name="VendorCode" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
                                        <option value="">選択してください</option>
                                        ${vendors.map(v => `<option value="${v.CompanyCode}">${v.CompanyName} (${v.CompanyCode})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">発注金額 (単価)</label>
                                    <input type="number" id="reg-UnitPrice" name="UnitPrice" placeholder="0" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: right;">
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">注文番号 (自動付与)</label>
                                    <input type="text" id="reg-OrderNo" name="OrderNo" readonly style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f1f5f9; font-family: monospace;">
                                </div>
                                <div class="profile-field-compact">
                                    <label style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600;">希望納期</label>
                                    <div class="date-input-wrapper" style="position: relative; display: flex; align-items: center; height: 38px;">
                                        <input type="text" id="reg-PurchaseDeliveryDate" name="DeliveryDate" class="date-input" placeholder="YYYY/MM/DD" style="width: 100%; height: 100%; padding: 8px 35px 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                        <i class="fas fa-calendar-alt" style="position: absolute; right: 10px; color: #3b82f6; cursor: pointer;" onclick="openCustomCalendar(document.getElementById('reg-PurchaseDeliveryDate'))"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-bottom: 20px;">
                            <button type="button" class="action-btn-detail" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1 !important; width: auto; padding: 0 24px; height: 42px;" onclick="closePurchaseOrderModal()">キャンセル</button>
                            <button type="submit" class="action-btn-detail" style="background: #166534; color: white; width: 240px; font-weight: bold; height: 42px;">注文書を発行して登録</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    generateOrderNumber('P'); // 初期表示はP番
}

// 在庫チェックロジック
async function checkInventory(partsName) {
    if (!partsName) return;
    try {
        const { data, error } = await getSupabaseClient()
            .from('t_materialcode')
            .select('materialname, stockquantity')
            .ilike('materialname', `%${partsName}%`)
            .gt('stockquantity', 0)
            .limit(1);
        
        const alertEl = document.getElementById('inventory-alert');
        if (!error && data && data.length > 0) {
            document.getElementById('inventory-msg').textContent = `在庫に「${data[0].materialname}」が ${data[0].stockquantity} 個あります。払い出しますか？`;
            alertEl.style.display = 'block';
        } else {
            alertEl.style.display = 'none';
        }
    } catch (e) {
        console.warn('在庫チェックに失敗しました', e);
    }
}

// 注文番号生成ロジック
async function generateOrderNumber(type) {
    const orderNoInput = document.getElementById('reg-OrderNo');
    const prefix = type === 'A' ? 'A' : 'P';
    const year = new Date().getFullYear().toString().substring(2); // 例: 24
    
    try {
        // 最新の番号を検索してインクリメント
        const { data, error } = await getSupabaseClient()
            .from('t_purchaseparts')
            .select('OrderNo')
            .like('OrderNo', `${prefix}${year}%`)
            .order('OrderNo', { ascending: false })
            .limit(1);
            
        let nextNum = 1;
        if (!error && data && data.length > 0) {
            const lastNo = data[0].OrderNo;
            const lastNum = parseInt(lastNo.substring(3));
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        
        orderNoInput.value = `${prefix}${year}${nextNum.toString().padStart(5, '0')}`;
    } catch (e) {
        orderNoInput.value = `${prefix}${year}00001`;
    }
}

function closePurchaseOrderModal() {
    const modal = document.getElementById('purchase-order-modal');
    if (modal) modal.remove();
}

function useInventory() {
    alert('在庫引き当てモードに切り替えました。発注数は0（または予備分のみ）に調整してください。');
    document.getElementById('inventory-alert').style.background = '#dcfce7';
    document.getElementById('inventory-alert').style.borderColor = '#bbf7d0';
    document.getElementById('inventory-alert').style.color = '#166534';
}

window.openPurchaseOrderModal = openPurchaseOrderModal;
window.closePurchaseOrderModal = closePurchaseOrderModal;
window.checkInventory = checkInventory;
window.generateOrderNumber = generateOrderNumber;
window.useInventory = useInventory;

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
            .select('constructno,constructname,orderprice,urikake,grossprofit,ownercode,usercode')
            .limit(300);
        if (q) {
            const qe = q.replace(/'/g, "''");
            aoQ = aoQ.or(
                `constructno.ilike.%${qe}%,constructname.ilike.%${qe}%`
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
            .select('construction_no,symbol_machine,symbol_unit,consecutive_no,description,order_div,arrange_div,each_price,qty,cancel_flg,betsu_seisaku_flg')
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

    // 工事番号レベルの場合、受注情報だけのレコードも先に追加（部品0件でも表示）
    if (level === 'construct') {
        const cnFilter = filters && filters.constructno;
        acceptOrders.forEach(ao => {
            if (!ao.constructno) return;
            if (cnFilter && ao.constructno !== cnFilter) return;
            const key = ao.constructno;
            if (!groups[key]) {
                groups[key] = {
                    constructno:       ao.constructno,
                    machine:           '',
                    unit:              '',
                    drawingno:         '',
                    name:              '',
                    _constructionname: (ao.constructname || '').trim(),
                    _customername:     ao.ownercode || '',
                    sales:   Number(ao.orderprice || ao.urikake || 0),
                    purchased: 0, outsource: 0, material: 0, misc: 0, internal: 0
                };
            }
        });
    }

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
                _constructionname:  (ao.constructname || '').trim(),
                _customername:      ao.ownercode    || '',
                sales:    Number(ao.orderprice || ao.urikake || 0),
                purchased: 0, outsource: 0, material: 0, misc: 0, internal: 0
            };
        }
        const cost = Number(r.each_price || 0) * Number(r.qty || 1);
        // order_div は日本語テキスト（一括発注/個別発注）またはレガシー英字(P/C/R/A)
        // betsu_seisaku_flg=true の場合は外注扱い
        if (r.betsu_seisaku_flg) {
            groups[key].outsource += cost;
        } else {
            const div = String(r.order_div || '').trim();
            const arr = String(r.arrange_div || '').trim();
            if (div === '一括発注' || div === '個別発注' || div === 'P' || div === 'A') {
                groups[key].purchased += cost;
            } else if (div === '外注' || div === 'C') {
                groups[key].outsource += cost;
            } else if (div === '材料' || div === 'R') {
                groups[key].material  += cost;
            } else if (arr === '在庫使用') {
                groups[key].material  += cost;  // 在庫品は材料費扱い
            } else if (cost > 0) {
                groups[key].purchased += cost;  // その他の購買部品は購入扱い
            }
        }
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
