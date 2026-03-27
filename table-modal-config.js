// テーブル別カスタムモーダル設定（統合版）
// ラベル・用語は docs/用語・番号体系.md に準拠
const TABLE_MODAL_CONFIGS = {
    // 会社コード（取引先）
    't_companycode': {
        displayName: '取引先',
        icon: 'company',
        color: {
            primary: '#3b82f6',
            secondary: '#2563eb',
            light: '#dbeafe'
        },
        layout: 'triple',
        sections: [
            {
                title: '基本情報',
                icon: 'fa-building',
                color: '#3b82f6',
                fields: [
                    { name: '取引先名称', label: '名称', type: 'text', required: true, width: 'full' },
                    { name: '略名称', label: '略称', type: 'text' },
                    { name: 'ヨミガナ', label: 'カナ', type: 'text' },
                    { name: '分類', label: '分類', type: 'text' },
                    { name: '国名', label: '国名', type: 'text' }
                ]
            },
            {
                title: '連絡先',
                icon: 'fa-address-book',
                color: '#10b981',
                fields: [
                    { name: '郵便番号', label: '〒', type: 'text', placeholder: '123-4567' },
                    { name: '電話', label: '電話', type: 'tel' },
                    { name: '住所1', label: '住所1', type: 'text', width: 'full' },
                    { name: '住所2', label: '住所2', type: 'text', width: 'full' },
                    { name: 'fax', label: 'FAX', type: 'tel' },
                    { name: '担当者1', label: '担当1', type: 'text' }
                ]
            },
            {
                title: 'メール・会計',
                icon: 'fa-envelope',
                color: '#8b5cf6',
                fields: [
                    { name: 'メールアドレス1', label: 'メール1', type: 'email', width: 'full' },
                    { name: 'メールアドレス2', label: 'メール2', type: 'email', width: 'full' },
                    { name: '売掛コード', label: '売掛', type: 'text' },
                    { name: '買掛コード', label: '買掛', type: 'text' }
                ]
            }
        ],
        svg: `<i class="fas fa-building" style="font-size: 28px; color: white;"></i>`
    },
    
    // 受注情報
    't_acceptorder': {
        displayName: '受注情報',
        icon: 'order',
        color: {
            primary: '#10b981',
            secondary: '#059669',
            light: '#d1fae5'
        },
        layout: 'triple',
        sections: [
            {
                title: '基本情報',
                icon: 'fa-file-invoice',
                color: '#10b981',
                fields: [
                    { name: 'constructno', label: '工事番号', type: 'text', required: true, width: 'full',
                      button: { label: '番号取得', onclick: 'openConstructNumberModal' } },
                    { name: 'constructname', label: '工事名称', type: 'text', required: true, width: 'full' },
                    { name: 'registerdate', label: '受注登録日', type: 'date', width: 'full' },
                    { name: 'eigyomanno', label: '営業担当コード', type: 'text', width: 'full' }
                ]
            },
            {
                title: '金額・日程',
                icon: 'fa-calendar-dollar',
                color: '#f59e0b',
                fields: [
                    { name: 'orderprice', label: '受注金額', type: 'number', width: 'full' },
                    { name: 'orderdate', label: '受注日', type: 'date', width: 'full' },
                    { name: 'deliverydate', label: '納期', type: 'date', width: 'full' }
                ]
            },
            {
                title: '関連情報',
                icon: 'fa-link',
                color: '#6366f1',
                fields: [
                    { name: 'ownercode', label: '受注元コード', type: 'text', width: 'full' },
                    { name: 'usercode', label: '納品先コード', type: 'text', width: 'full' },
                    { name: 'dealingdocmitsumori', label: '電子見積書', type: 'text', width: 'full' },
                    { name: 'dealingdocchuumon', label: '電子注文書', type: 'text', width: 'full' },
                    { name: 'dealingdocseikyu', label: '電子請求書', type: 'text', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-file-invoice" style="font-size: 28px; color: white;"></i>`
    },
    
    // スタッフコード
    't_staffcode': {
        displayName: 'スタッフ情報',
        icon: 'staff',
        color: {
            primary: '#667eea',
            secondary: '#764ba2',
            light: '#eef2ff'
        },
        layout: 'triple',
        sections: [
            {
                title: '基本情報',
                icon: 'fa-user',
                color: '#667eea',
                fields: [
                    { name: 'staffname', label: '氏名', type: 'text', required: true },
                    { name: 'staffcode', label: 'コード', type: 'text', required: true },
                    { name: 'reading', label: 'ふりがな', type: 'text' },
                    { name: 'loginid', label: 'ログインID', type: 'text' }
                ]
            },
            {
                title: '所属・役職',
                icon: 'fa-sitemap',
                color: '#8b5cf6',
                fields: [
                    { name: 'depacode', label: '所属部署', type: 'text' },
                    { name: 'workdepa', label: '作業部署', type: 'text' },
                    { name: 'position', label: '役職', type: 'text' },
                    { name: 'nuyusyadate', label: '入社日', type: 'date' }
                ]
            },
            {
                title: '連絡先',
                icon: 'fa-address-book',
                color: '#48bb78',
                fields: [
                    { name: 'mailaddress', label: 'メール', type: 'email', width: 'full' },
                    { name: 'telno', label: '電話(内線)', type: 'tel' },
                    { name: 'cellphone', label: '携帯電話', type: 'tel' },
                    { name: 'internaltelno', label: '内線(直通)', type: 'tel' }
                ]
            }
        ],
        svg: `<i class="fas fa-user" style="font-size: 28px; color: white;"></i>`
    },
    
    // 機械コード
    't_machinecode': {
        displayName: '機械コード',
        icon: 'machine',
        color: {
            primary: '#6366f1',
            secondary: '#4f46e5',
            light: '#eef2ff'
        },
        layout: 'single',
        sections: [
            {
                title: '基本情報',
                icon: 'fa-cog',
                color: '#6366f1',
                fields: [
                    { name: 'machinecode', label: '機械コード', type: 'text', required: true },
                    { name: 'machinename', label: '機械名', type: 'text', required: true },
                    { name: 'machinenameeng', label: '機械名（英語）', type: 'text' }
                ]
            }
        ],
        svg: `<i class="fas fa-cog" style="font-size: 28px; color: white;"></i>`
    },
    
    // 部署コード
    't_departmentcode': {
        displayName: '部署コード',
        icon: 'department',
        color: {
            primary: '#8b5cf6',
            secondary: '#7c3aed',
            light: '#ede9fe'
        },
        layout: 'single',
        sections: [
            {
                title: '部署情報',
                icon: 'fa-sitemap',
                color: '#8b5cf6',
                fields: [
                    { name: 'depacode', label: '部署コード', type: 'text', required: true },
                    { name: 'depaname', label: '部署名', type: 'text', required: true },
                    { name: 'depanameeng', label: '部署名（英語）', type: 'text' },
                    { name: 'depaleader', label: '部署長', type: 'text' }
                ]
            }
        ],
        svg: `<i class="fas fa-sitemap" style="font-size: 28px; color: white;"></i>`
    },
    
    // 工事番号
    't_constructionnumber': {
        displayName: '工事番号',
        icon: 'construction',
        color: {
            primary: '#f59e0b',
            secondary: '#d97706',
            light: '#fef3c7'
        },
        layout: 'double',
        sections: [
            {
                title: '番号情報',
                icon: 'fa-hashtag',
                color: '#f59e0b',
                fields: [
                    { name: 'constructionnumber', label: '工事番号', type: 'text', required: true },
                    { name: 'usestatus', label: '使用状況', type: 'select', options: ['未使用', '使用中', '完了'] },
                    { name: 'registerdate', label: '登録日', type: 'date' }
                ]
            },
            {
                title: '関連情報',
                icon: 'fa-info-circle',
                color: '#6366f1',
                fields: [
                    { name: 'constructionname', label: '工事名', type: 'text' },
                    { name: 'remarks', label: '備考', type: 'textarea' }
                ]
            }
        ],
        svg: `<i class="fas fa-hashtag" style="font-size: 28px; color: white;"></i>`
    },
    
    // 会計コード
    't_accountcode': {
        displayName: '会計コード',
        icon: 'accounting',
        color: {
            primary: '#ec4899',
            secondary: '#db2777',
            light: '#fce7f3'
        },
        layout: 'single',
        sections: [
            {
                title: '会計情報',
                icon: 'fa-calculator',
                color: '#ec4899',
                fields: [
                    { name: 'accountcode', label: '会計コード', type: 'text', required: true },
                    { name: 'accountname', label: '勘定科目名', type: 'text', required: true },
                    { name: 'accounttype', label: '科目区分', type: 'select', options: ['資産', '負債', '資本', '収益', '費用'] },
                    { name: 'parentaccountcode', label: '親会計コード', type: 'text' }
                ]
            }
        ],
        svg: `<i class="fas fa-calculator" style="font-size: 28px; color: white;"></i>`
    },
    
    // 材料コード
    't_materialcode': {
        displayName: '材料コード',
        icon: 'material',
        color: {
            primary: '#06b6d4',
            secondary: '#0891b2',
            light: '#cffafe'
        },
        layout: 'double',
        sections: [
            {
                title: '材料情報',
                icon: 'fa-box',
                color: '#06b6d4',
                fields: [
                    { name: 'materialcode', label: '材料コード', type: 'text', required: true, width: 'full' },
                    { name: 'materialname', label: '材料名', type: 'text', required: true, width: 'full' },
                    { name: 'specification', label: '規格', type: 'text', width: 'full' }
                ]
            },
            {
                title: '在庫・単価',
                icon: 'fa-warehouse',
                color: '#f59e0b',
                fields: [
                    { name: 'unitprice', label: '単価', type: 'number', width: 'full' },
                    { name: 'stockquantity', label: '在庫数', type: 'number', width: 'full' },
                    { name: 'unit', label: '単位', type: 'text', width: 'full' }
                ]
            }
        ],
        svg: `
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                <path d="M50 25 L70 35 L70 65 L50 75 L30 65 L30 35 Z" fill="#06b6d4" opacity="0.3"/>
                <path d="M50 25 L70 35 L50 45 L30 35 Z" fill="#06b6d4"/>
                <path d="M30 35 L30 65 L50 75 L50 45 Z" fill="#0891b2"/>
                <path d="M50 45 L50 75 L70 65 L70 35 Z" fill="#22d3ee"/>
            </svg>
        `
    },
    
    // コンピュータデバイス
    't_computerdevice': {
        displayName: 'デバイス情報',
        icon: 'laptop',
        color: {
            primary: '#4b5563',
            secondary: '#1f2937',
            light: '#f3f4f6'
        },
        layout: 'triple',
        sections: [
            {
                title: 'ログイン情報',
                icon: 'fa-desktop',
                color: '#4b5563',
                fields: [
                    { name: 'LoginID', label: 'マシン名', type: 'text', required: true, width: 'full' },
                    { name: 'LoginPassword', label: 'パスワード', type: 'text', width: 'full' },
                    { name: 'TcpIp', label: 'IPアドレス', type: 'text', width: 'full' }
                ]
            },
            {
                title: '使用者情報',
                icon: 'fa-user-cog',
                color: '#3b82f6',
                fields: [
                    { name: 'StaffName', label: '使用者名', type: 'text', width: 'full' },
                    { name: 'StaffCode', label: 'スタッフコード', type: 'text', width: 'full' },
                    { name: 'WorkDepa', label: '作業部署', type: 'text', width: 'full' }
                ]
            },
            {
                title: 'システム設定',
                icon: 'fa-cogs',
                color: '#10b981',
                fields: [
                    { name: 'SQLusername', label: 'SQLユーザー', type: 'text', width: 'full' },
                    { name: 'SQLusergroup', label: 'SQLグループ', type: 'text', width: 'full' },
                    { name: 'TelNo', label: '電話番号', type: 'tel', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-laptop" style="font-size: 28px; color: white;"></i>`
    },

    // 通貨コード
    't_currencycode': {
        displayName: '通貨コード',
        icon: 'currency',
        color: {
            primary: '#10b981',
            secondary: '#059669',
            light: '#d1fae5'
        },
        layout: 'single',
        sections: [
            {
                title: '通貨情報',
                icon: 'fa-money-bill-wave',
                color: '#10b981',
                fields: [
                    { name: 'CurrencyCode', label: '通貨コード', type: 'text', required: true },
                    { name: 'CurrencyName', label: '通貨名', type: 'text', required: true },
                    { name: 'CurrencySymbol', label: '記号', type: 'text' },
                    { name: 'ExchangeRate', label: '換算レート', type: 'number' }
                ]
            }
        ],
        svg: `<i class="fas fa-money-bill-wave" style="font-size: 28px; color: white;"></i>`
    },

    // 機種記号
    't_machinemarkforsaiban': {
        displayName: '機種記号',
        icon: 'machine',
        color: {
            primary: '#6366f1',
            secondary: '#4f46e5',
            light: '#eef2ff'
        },
        layout: 'single',
        sections: [
            {
                title: '機種情報',
                icon: 'fa-tag',
                color: '#6366f1',
                fields: [
                    { name: 'MachineMark', label: '機種記号', type: 'text', required: true },
                    { name: 'MachineName', label: '機種名', type: 'text', required: true }
                ]
            }
        ],
        svg: `<i class="fas fa-tag" style="font-size: 28px; color: white;"></i>`
    },

    // ユニットコード
    't_machineunitcode': {
        displayName: 'ユニットコード',
        icon: 'unit',
        color: {
            primary: '#f59e0b',
            secondary: '#d97706',
            light: '#fef3c7'
        },
        layout: 'single',
        sections: [
            {
                title: 'ユニット情報',
                icon: 'fa-puzzle-piece',
                color: '#f59e0b',
                fields: [
                    { name: 'UnitCode', label: 'ユニットコード', type: 'text', required: true },
                    { name: 'UnitName', label: 'ユニット名', type: 'text', required: true },
                    { name: 'UnitNameEn', label: 'ユニット名(英語)', type: 'text' }
                ]
            }
        ],
        svg: `<i class="fas fa-puzzle-piece" style="font-size: 28px; color: white;"></i>`
    },

    // 入金情報
    't_moneyreceipt': {
        displayName: '入金情報',
        icon: 'receipt',
        color: {
            primary: '#ec4899',
            secondary: '#db2777',
            light: '#fce7f3'
        },
        layout: 'double',
        sections: [
            {
                title: '入金内容',
                icon: 'fa-hand-holding-usd',
                color: '#ec4899',
                fields: [
                    { name: 'ReceiptDate', label: '入金日', type: 'date', required: true },
                    { name: 'ReceiptAmount', label: '入金金額', type: 'number', required: true },
                    { name: 'CustomerCode', label: '顧客コード', type: 'text' },
                    { name: 'ConstructNo', label: '工事番号', type: 'text' }
                ]
            },
            {
                title: '詳細・備考',
                icon: 'fa-comment-alt',
                color: '#f472b6',
                fields: [
                    { name: 'ReceiptMethod', label: '入金方法', type: 'text', width: 'full' },
                    { name: 'Remarks', label: '備考', type: 'textarea', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-hand-holding-usd" style="font-size: 28px; color: white;"></i>`
    },

    // 購入部品
    't_purchaseparts': {
        displayName: '購入部品',
        icon: 'cogs',
        color: { primary: '#3b82f6', secondary: '#1d4ed8', light: '#dbeafe' },
        layout: 'triple',
        sections: [
            {
                title: '部品情報',
                icon: 'fa-cog',
                color: '#3b82f6',
                fields: [
                    { name: 'PartsCode', label: '部品コード', type: 'text', required: true, width: 'full' },
                    { name: 'PartsName', label: '部品名称', type: 'text', required: true, width: 'full' },
                    { name: 'Specification', label: '規格・型式', type: 'text', width: 'full' }
                ]
            },
            {
                title: 'メーカー・仕入',
                icon: 'fa-industry',
                color: '#10b981',
                fields: [
                    { name: 'MakerName', label: 'メーカー', type: 'text', width: 'full' },
                    { name: 'SupplierCode', label: '仕入先コード', type: 'text', width: 'full' },
                    { name: 'UnitPrice', label: '標準単価', type: 'number', width: 'full' }
                ]
            },
            {
                title: '管理情報',
                icon: 'fa-tags',
                color: '#f59e0b',
                fields: [
                    { name: 'Category', label: '分類', type: 'text', width: 'full' },
                    { name: 'Unit', label: '単位', type: 'text', width: 'full' },
                    { name: 'Remarks', label: '備考', type: 'textarea', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-shopping-cart" style="font-size: 28px; color: white;"></i>`
    },

    // 採番情報
    't_saiban': {
        displayName: '採番情報',
        icon: 'list-ol',
        color: { primary: '#8b5cf6', secondary: '#6d28d9', light: '#ede9fe' },
        layout: 'triple',
        sections: [
            {
                title: '基本情報',
                icon: 'fa-fingerprint',
                color: '#8b5cf6',
                fields: [
                    { name: 'DrawingNo', label: '図面番号', type: 'text', required: true, width: 'full' },
                    { name: 'Description', label: '品名', type: 'text', width: 'full' },
                    { name: 'OrderNo', label: '工事番号', type: 'text', width: 'full' }
                ]
            },
            {
                title: '仕様・材質',
                icon: 'fa-layer-group',
                color: '#ec4899',
                fields: [
                    { name: 'Material', label: '材質', type: 'text', width: 'full' },
                    { name: 'MaterialWeight', label: '素材重量', type: 'number', width: 'full' },
                    { name: 'FinishedWeight', label: '仕上重量', type: 'number', width: 'full' }
                ]
            },
            {
                title: '履歴・担当',
                icon: 'fa-user-edit',
                color: '#10b981',
                fields: [
                    { name: 'Designer', label: '設計者', type: 'text', width: 'full' },
                    { name: 'SaibanDate', label: '採番日', type: 'date', width: 'full' },
                    { name: 'History1', label: '履歴', type: 'textarea', width: 'full' }
                ]
            }
        ],
        svg: `<svg width="80" height="80" viewBox="0 0 100 100" fill="none"><rect x="20" y="20" width="60" height="60" rx="8" stroke="#8b5cf6" stroke-width="6"/><path d="M35 40 H65 M35 50 H65 M35 60 H50" stroke="#8b5cf6" stroke-width="6" stroke-linecap="round"/></svg>`
    },

    // 工程コード
    't_processcode': {
        displayName: '工程コード',
        icon: 'tasks',
        color: { primary: '#10b981', secondary: '#047857', light: '#d1fae5' },
        layout: 'double',
        sections: [
            {
                title: '工程情報',
                icon: 'fa-stream',
                color: '#10b981',
                fields: [
                    { name: 'ProcessCode', label: '工程コード', type: 'text', required: true, width: 'full' },
                    { name: 'ProcessName', label: '工程名称', type: 'text', required: true, width: 'full' }
                ]
            },
            {
                title: '設定',
                icon: 'fa-sliders-h',
                color: '#3b82f6',
                fields: [
                    { name: 'DepartmentCode', label: '担当部署', type: 'text', width: 'full' },
                    { name: 'SortOrder', label: '表示順', type: 'number', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-stream" style="font-size: 28px; color: white;"></i>`
    },

    // 発注情報
    't_purchase': {
        displayName: '発注情報',
        icon: 'shopping-cart',
        color: { primary: '#f59e0b', secondary: '#b45309', light: '#fef3c7' },
        layout: 'triple',
        sections: [
            {
                title: '発注基本',
                icon: 'fa-shopping-basket',
                color: '#f59e0b',
                fields: [
                    { name: 'PurchaseNo', label: '発注番号', type: 'text', required: true, width: 'full' },
                    { name: 'PurchaseDate', label: '発注日', type: 'date', width: 'full' },
                    { name: 'SupplierCode', label: '仕入先', type: 'text', width: 'full' }
                ]
            },
            {
                title: '案件情報',
                icon: 'fa-project-diagram',
                color: '#3b82f6',
                fields: [
                    { name: 'ConstructNo', label: '工事番号', type: 'text', width: 'full' },
                    { name: 'OrderPerson', label: '発注者', type: 'text', width: 'full' },
                    { name: 'DeliveryDate', label: '希望納期', type: 'date', width: 'full' }
                ]
            },
            {
                title: '金額・状態',
                icon: 'fa-coins',
                color: '#10b981',
                fields: [
                    { name: 'TotalAmount', label: '合計金額', type: 'number', width: 'full' },
                    { name: 'Status', label: '状況', type: 'select', options: ['未納', '分納', '完納', '中止'], width: 'full' }
                ]
            }
        ],
        svg: `<svg width="80" height="80" viewBox="0 0 100 100" fill="none"><path d="M20 20 L30 20 L40 60 H80 L90 30 H35" stroke="#f59e0b" stroke-width="6" fill="none"/><circle cx="45" cy="75" r="7" fill="#f59e0b"/><circle cx="75" cy="75" r="7" fill="#f59e0b"/></svg>`
    },

    // ユニットコード
    't_unitcode': {
        displayName: 'ユニットコード',
        icon: 'th-large',
        color: { primary: '#6366f1', secondary: '#4338ca', light: '#e0e7ff' },
        layout: 'double',
        sections: [
            {
                title: 'ユニット基本',
                icon: 'fa-cube',
                color: '#6366f1',
                fields: [
                    { name: 'UnitCode', label: 'ユニットコード', type: 'text', required: true, width: 'full' },
                    { name: 'UnitName', label: 'ユニット名称', type: 'text', required: true, width: 'full' }
                ]
            },
            {
                title: '詳細設定',
                icon: 'fa-info-circle',
                color: '#10b981',
                fields: [
                    { name: 'MachineCode', label: '対応機種', type: 'text', width: 'full' },
                    { name: 'Remarks', label: '備考', type: 'textarea', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-cube" style="font-size: 28px; color: white;"></i>`
    },

    // 作業コード
    't_workcode': {
        displayName: '作業コード',
        icon: 'hammer',
        color: { primary: '#ef4444', secondary: '#b91c1c', light: '#fee2e2' },
        layout: 'double',
        sections: [
            {
                title: '作業情報',
                icon: 'fa-tools',
                color: '#ef4444',
                fields: [
                    { name: 'WorkCode', label: '作業コード', type: 'text', required: true, width: 'full' },
                    { name: 'WorkName', label: '作業名称', type: 'text', required: true, width: 'full' }
                ]
            },
            {
                title: '単価設定',
                icon: 'fa-dollar-sign',
                color: '#f59e0b',
                fields: [
                    { name: 'StandardRate', label: '標準単価', type: 'number', width: 'full' },
                    { name: 'Category', label: '作業分類', type: 'text', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-tools" style="font-size: 28px; color: white;"></i>`
    },

    // 作業部署
    't_workdepartment': {
        displayName: '作業部署',
        icon: 'users',
        color: { primary: '#8b5cf6', secondary: '#6d28d9', light: '#ede9fe' },
        layout: 'double',
        sections: [
            {
                title: '部署情報',
                icon: 'fa-sitemap',
                color: '#8b5cf6',
                fields: [
                    { name: 'DeptCode', label: '部署コード', type: 'text', required: true, width: 'full' },
                    { name: 'DeptName', label: '部署名称', type: 'text', required: true, width: 'full' }
                ]
            },
            {
                title: '管理',
                icon: 'fa-user-tie',
                color: '#10b981',
                fields: [
                    { name: 'Manager', label: '責任者', type: 'text', width: 'full' },
                    { name: 'Location', label: '場所', type: 'text', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-user-tie" style="font-size: 28px; color: white;"></i>`
    },

    // 原価集計ビュー
    'v_cost_summary': {
        displayName: '原価集計',
        icon: 'chart-pie',
        color: { primary: '#10b981', secondary: '#059669', light: '#d1fae5' },
        layout: 'triple',
        sections: [
            {
                title: '案件概要',
                icon: 'fa-file-contract',
                color: '#10b981',
                fields: [
                    { name: 'ConstructNo', label: '工事番号', type: 'text', width: 'full' },
                    { name: 'ConstructName', label: '工事名称', type: 'text', width: 'full' }
                ]
            },
            {
                title: '原価内訳',
                icon: 'fa-calculator',
                color: '#3b82f6',
                fields: [
                    { name: 'MaterialCost', label: '材料費', type: 'number', width: 'full' },
                    { name: 'LaborCost', label: '労務費', type: 'number', width: 'full' },
                    { name: 'OutsourceCost', label: '外注費', type: 'number', width: 'full' }
                ]
            },
            {
                title: '合計・利益',
                icon: 'fa-chart-line',
                color: '#f59e0b',
                fields: [
                    { name: 'TotalCost', label: '総原価', type: 'number', width: 'full' },
                    { name: 'SalesAmount', label: '売上金額', type: 'number', width: 'full' },
                    { name: 'Profit', label: '利益', type: 'number', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-chart-pie" style="font-size: 28px; color: white;"></i>`
    },

    // 購入部品
    't_purchaseparts': {
        displayName: '購入部品',
        icon: 'shopping-cart',
        color: { primary: '#3b82f6', secondary: '#1d4ed8', light: '#dbeafe' },
        layout: 'double',
        sections: [
            {
                title: '基本情報',
                icon: 'fa-info-circle',
                color: '#3b82f6',
                fields: [
                    { name: 'PartsCode', label: '部品コード', type: 'text', required: true, width: 'full' },
                    { name: 'PartsName', label: '部品名', type: 'text', required: true, width: 'full' },
                    { name: 'Specification', label: '規格', type: 'text', width: 'full' }
                ]
            },
            {
                title: '価格・在庫・発注',
                icon: 'fa-tags',
                color: '#10b981',
                fields: [
                    { name: 'UnitPrice', label: '単価', type: 'number', width: 'full' },
                    { name: 'StockQty', label: '在庫数', type: 'number', width: 'full' },
                    { name: 'Unit', label: '単位', type: 'text', width: 'full' },
                    { name: 'MakerCode', label: 'メーカーコード', type: 'text', width: 'full' },
                    { name: 'SupplierCode', label: '仕入先コード', type: 'text', width: 'full' },
                    { name: 'LeadTime', label: 'リードタイム', type: 'number', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-shopping-cart" style="font-size: 28px; color: white;"></i>`
    },

    // 図面番号採番
    't_saiban': {
        displayName: '図面番号採番',
        icon: 'drafting-compass',
        color: { primary: '#6366f1', secondary: '#4338ca', light: '#e0e7ff' },
        layout: 'double',
        sections: [
            {
                title: '図面情報',
                icon: 'fa-pencil-ruler',
                color: '#6366f1',
                fields: [
                    { name: 'DrawingNo', label: '図面番号', type: 'text', required: true, width: 'full' },
                    { name: 'Description', label: '品名', type: 'text', width: 'full' },
                    { name: 'Designer', label: '設計者', type: 'text', width: 'full' },
                    { name: 'OrderNo', label: '工事番号', type: 'text', width: 'full' }
                ]
            },
            {
                title: '詳細情報',
                icon: 'fa-info-circle',
                color: '#10b981',
                fields: [
                    { name: 'Material', label: '材質', type: 'text', width: 'full' },
                    { name: 'SaibanDate', label: '採番日', type: 'date', width: 'full' },
                    { name: 'MaterialWeight', label: '素材重量', type: 'number', width: 'full' },
                    { name: 'FinishedWeight', label: '仕上重量', type: 'number', width: 'full' },
                    { name: 'History1', label: '履歴', type: 'textarea', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-drafting-compass" style="font-size: 28px; color: white;"></i>`
    },

    // 工程コード
    't_processcode': {
        displayName: '工程コード',
        icon: 'tasks',
        color: { primary: '#8b5cf6', secondary: '#6d28d9', light: '#f5f3ff' },
        layout: 'single',
        sections: [
            {
                title: '工程情報',
                icon: 'fa-stream',
                color: '#8b5cf6',
                fields: [
                    { name: 'ProcessCode', label: '工程コード', type: 'text', required: true, width: 'full' },
                    { name: 'ProcessName', label: '工程名', type: 'text', required: true, width: 'full' },
                    { name: 'StandardTime', label: '標準時間', type: 'number', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-stream" style="font-size: 28px; color: white;"></i>`
    },

    // 仕入情報
    't_purchase': {
        displayName: '仕入情報',
        icon: 'truck-loading',
        color: { primary: '#f59e0b', secondary: '#d97706', light: '#fffbeb' },
        layout: 'double',
        sections: [
            {
                title: '伝票・仕入先',
                icon: 'fa-file-alt',
                color: '#f59e0b',
                fields: [
                    { name: 'PurchaseNo', label: '仕入番号', type: 'text', required: true, width: 'full' },
                    { name: 'PurchaseDate', label: '仕入日', type: 'date', width: 'full' },
                    { name: 'SupplierCode', label: '仕入先コード', type: 'text', width: 'full' },
                    { name: 'ConstructNo', label: '工事番号', type: 'text', width: 'full' }
                ]
            },
            {
                title: '金額・備考',
                icon: 'fa-coins',
                color: '#10b981',
                fields: [
                    { name: 'Amount', label: '金額', type: 'number', width: 'full' },
                    { name: 'Tax', label: '消費税', type: 'number', width: 'full' },
                    { name: 'TotalAmount', label: '合計金額', type: 'number', width: 'full' },
                    { name: 'Remarks', label: '備考', type: 'textarea', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-truck-loading" style="font-size: 28px; color: white;"></i>`
    },

    // ユニットコード
    't_unitcode': {
        displayName: 'ユニットコード',
        icon: 'cubes',
        color: { primary: '#06b6d4', secondary: '#0891b2', light: '#ecfeff' },
        layout: 'single',
        sections: [
            {
                title: 'ユニット情報',
                icon: 'fa-cube',
                color: '#06b6d4',
                fields: [
                    { name: 'UnitCode', label: 'ユニットコード', type: 'text', required: true, width: 'full' },
                    { name: 'UnitName', label: 'ユニット名', type: 'text', required: true, width: 'full' },
                    { name: 'UnitNameEn', label: 'ユニット名(英語)', type: 'text', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-cube" style="font-size: 28px; color: white;"></i>`
    },

    // 作業コード
    't_workcode': {
        displayName: '作業コード',
        icon: 'hammer',
        color: { primary: '#ec4899', secondary: '#be185d', light: '#fdf2f8' },
        layout: 'single',
        sections: [
            {
                title: '作業情報',
                icon: 'fa-tools',
                color: '#ec4899',
                fields: [
                    { name: 'WorkCode', label: '作業コード', type: 'text', required: true, width: 'full' },
                    { name: 'WorkName', label: '作業名', type: 'text', required: true, width: 'full' },
                    { name: 'WorkType', label: '作業区分', type: 'text', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-tools" style="font-size: 28px; color: white;"></i>`
    },

    // 作業部署
    't_workdepartment': {
        displayName: '作業部署',
        icon: 'users-cog',
        color: { primary: '#10b981', secondary: '#047857', light: '#f0fdf4' },
        layout: 'single',
        sections: [
            {
                title: '部署情報',
                icon: 'fa-users',
                color: '#10b981',
                fields: [
                    { name: 'WorkDepaCode', label: '作業部署コード', type: 'text', required: true, width: 'full' },
                    { name: 'WorkDepaName', label: '作業部署名', type: 'text', required: true, width: 'full' },
                    { name: 'Manager', label: '管理者', type: 'text', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-users" style="font-size: 28px; color: white;"></i>`
    },

    // 原価集計ビュー
    'v_cost_summary': {
        displayName: '原価集計',
        icon: 'chart-pie',
        color: { primary: '#f43f5e', secondary: '#be123c', light: '#fff1f2' },
        layout: 'double',
        sections: [
            {
                title: '工事概要・集計',
                icon: 'fa-file-invoice-dollar',
                color: '#f43f5e',
                fields: [
                    { name: 'ConstructNo', label: '工事番号', type: 'text', width: 'full' },
                    { name: 'ConstructName', label: '工事名称', type: 'text', width: 'full' },
                    { name: 'TotalCost', label: '総原価', type: 'number', width: 'full' },
                    { name: 'Profit', label: '利益', type: 'number', width: 'full' },
                    { name: 'ProfitRate', label: '利益率(%)', type: 'number', width: 'full' }
                ]
            },
            {
                title: '原価詳細',
                icon: 'fa-calculator',
                color: '#10b981',
                fields: [
                    { name: 'MaterialCost', label: '材料原価', type: 'number', width: 'full' },
                    { name: 'LaborCost', label: '労務原価', type: 'number', width: 'full' },
                    { name: 'OutsourcingCost', label: '外注原価', type: 'number', width: 'full' }
                ]
            }
        ],
        svg: `<i class="fas fa-chart-pie" style="font-size: 28px; color: white;"></i>`
    }
};

// グローバルに公開
window.TABLE_MODAL_CONFIGS = TABLE_MODAL_CONFIGS;

// スペース入りテーブル名のエイリアスを追加
// データベースから "t Accept Order" のように取得される可能性があるため
TABLE_MODAL_CONFIGS['t Accept Order'] = TABLE_MODAL_CONFIGS['t_acceptorder'];
TABLE_MODAL_CONFIGS['t Account Code'] = TABLE_MODAL_CONFIGS['t_accountcode'];
TABLE_MODAL_CONFIGS['t Construction Number'] = TABLE_MODAL_CONFIGS['t_constructionnumber'];
TABLE_MODAL_CONFIGS['t Department Code'] = TABLE_MODAL_CONFIGS['t_departmentcode'];
TABLE_MODAL_CONFIGS['t Machine Code'] = TABLE_MODAL_CONFIGS['t_machinecode'];
TABLE_MODAL_CONFIGS['t Material Code'] = TABLE_MODAL_CONFIGS['t_materialcode'];
TABLE_MODAL_CONFIGS['t Staff Code'] = TABLE_MODAL_CONFIGS['t_staffcode'];
TABLE_MODAL_CONFIGS['t Computer Device'] = TABLE_MODAL_CONFIGS['t_computerdevice'];
TABLE_MODAL_CONFIGS['t Currency Code'] = TABLE_MODAL_CONFIGS['t_currencycode'];
TABLE_MODAL_CONFIGS['t Machine Mark For Saiban'] = TABLE_MODAL_CONFIGS['t_machinemarkforsaiban'];
TABLE_MODAL_CONFIGS['t Machine Unit Code'] = TABLE_MODAL_CONFIGS['t_machineunitcode'];
TABLE_MODAL_CONFIGS['t Money Receipt'] = TABLE_MODAL_CONFIGS['t_moneyreceipt'];
TABLE_MODAL_CONFIGS['t Purchase Parts'] = TABLE_MODAL_CONFIGS['t_purchaseparts'];
TABLE_MODAL_CONFIGS['t Saiban'] = TABLE_MODAL_CONFIGS['t_saiban'];
TABLE_MODAL_CONFIGS['t Process Code'] = TABLE_MODAL_CONFIGS['t_processcode'];
TABLE_MODAL_CONFIGS['t Purchase'] = TABLE_MODAL_CONFIGS['t_purchase'];
TABLE_MODAL_CONFIGS['t Unit Code'] = TABLE_MODAL_CONFIGS['t_unitcode'];
TABLE_MODAL_CONFIGS['t Work Code'] = TABLE_MODAL_CONFIGS['t_workcode'];
TABLE_MODAL_CONFIGS['t Work Department'] = TABLE_MODAL_CONFIGS['t_workdepartment'];
TABLE_MODAL_CONFIGS['v Cost Summary'] = TABLE_MODAL_CONFIGS['v_cost_summary'];

// 大文字バージョンも追加
TABLE_MODAL_CONFIGS['T_ACCEPTORDER'] = TABLE_MODAL_CONFIGS['t_acceptorder'];
TABLE_MODAL_CONFIGS['T_ACCOUNTCODE'] = TABLE_MODAL_CONFIGS['t_accountcode'];
TABLE_MODAL_CONFIGS['T_CONSTRUCTIONNUMBER'] = TABLE_MODAL_CONFIGS['t_constructionnumber'];
TABLE_MODAL_CONFIGS['T_DEPARTMENTCODE'] = TABLE_MODAL_CONFIGS['t_departmentcode'];
TABLE_MODAL_CONFIGS['T_MACHINECODE'] = TABLE_MODAL_CONFIGS['t_machinecode'];
TABLE_MODAL_CONFIGS['T_MATERIALCODE'] = TABLE_MODAL_CONFIGS['t_materialcode'];
TABLE_MODAL_CONFIGS['T_STAFFCODE'] = TABLE_MODAL_CONFIGS['t_staffcode'];
TABLE_MODAL_CONFIGS['T_COMPUTERDEVICE'] = TABLE_MODAL_CONFIGS['t_computerdevice'];
TABLE_MODAL_CONFIGS['T_CURRENCYCODE'] = TABLE_MODAL_CONFIGS['t_currencycode'];
TABLE_MODAL_CONFIGS['T_MACHINEMARKFORSAIBAN'] = TABLE_MODAL_CONFIGS['t_machinemarkforsaiban'];
TABLE_MODAL_CONFIGS['T_MACHINEUNITCODE'] = TABLE_MODAL_CONFIGS['t_machineunitcode'];
TABLE_MODAL_CONFIGS['T_MONEYRECEIPT'] = TABLE_MODAL_CONFIGS['t_moneyreceipt'];
TABLE_MODAL_CONFIGS['T_PURCHASEPARTS'] = TABLE_MODAL_CONFIGS['t_purchaseparts'];
TABLE_MODAL_CONFIGS['T_SAIBAN'] = TABLE_MODAL_CONFIGS['t_saiban'];
TABLE_MODAL_CONFIGS['T_PROCESSCODE'] = TABLE_MODAL_CONFIGS['t_processcode'];
TABLE_MODAL_CONFIGS['T_PURCHASE'] = TABLE_MODAL_CONFIGS['t_purchase'];
TABLE_MODAL_CONFIGS['T_UNITCODE'] = TABLE_MODAL_CONFIGS['t_unitcode'];
TABLE_MODAL_CONFIGS['T_WORKCODE'] = TABLE_MODAL_CONFIGS['t_workcode'];
TABLE_MODAL_CONFIGS['T_WORKDEPARTMENT'] = TABLE_MODAL_CONFIGS['t_workdepartment'];
TABLE_MODAL_CONFIGS['V_COST_SUMMARY'] = TABLE_MODAL_CONFIGS['v_cost_summary'];

// デバッグ: 設定されているテーブル一覧を表示
console.log('=== TABLE_MODAL_CONFIGS Loaded ===');
console.log('Available table configs:', Object.keys(TABLE_MODAL_CONFIGS));
console.log('Total configs:', Object.keys(TABLE_MODAL_CONFIGS).length);

// 既存のgetFormConfig関数との互換性を保つ
function getFormConfig(tableName) {
    if (!tableName) return null;
    
    // TABLE_MODAL_CONFIGSから探す
    const config = TABLE_MODAL_CONFIGS[tableName] || TABLE_MODAL_CONFIGS[tableName.toLowerCase()];
    if (config) {
        return config;
    }
    
    return null;
}