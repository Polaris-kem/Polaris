// Supabase接続設定
// ⚠️ 注意: 本番環境では環境変数や別ファイルで管理することを推奨します
const SUPABASE_CONFIG = {
    url: "https://todnsebzbgndsxafbflc.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZG5zZWJ6YmduZHN4YWZiZmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTA0NjUsImV4cCI6MjA5MDEyNjQ2NX0.SkfRDk9FroEQfWACi5DLQi-cHfp_zk6_RdgNrvM5mn8"
};
// app.js など他スクリプトから参照できるようグローバルに公開
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}

// 管理者パスワード設定
// ⚠️ 本番環境では必ず変更してください
const ADMIN_PASSWORD = "admin123";

// 外部リンク設定（初期値）
// 管理者モードで編集可能になります
const DEFAULT_EXTERNAL_LINKS = [];

// 採番システムAPI設定
// FastAPIバックエンドのベースURL
window.SAIBAN_API_BASE_URL = window.SAIBAN_API_BASE_URL || 'http://localhost:8000';


// FastAPIバックエンドのベースURL
window.SAIBAN_API_BASE_URL = window.SAIBAN_API_BASE_URL || 'http://localhost:8000';

