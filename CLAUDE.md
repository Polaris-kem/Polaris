# Polaris プロジェクト ルール

## トークン節約ルール（最優先）
- 回答は解説を省き、極めて簡潔に出力すること
- コード修正は「修正箇所のみ」を提示し、ファイル全体の再出力は避けること
- タスクが一段落したら「進捗管理」を更新し、ユーザーに `/clear` を促すこと
- 会話が長くなりコストが上がってきたら、自ら `/clear`（リセット）を提案すること

## 絶対に守るルール

### GitHubへのpushは絶対にしない
- `git push` コマンドは**絶対に実行しない**（例外なし）
- pushはユーザーがGitHub Desktopで自分で行う
- コード修正後は「GitHub Desktopでpushできます」と伝えるだけにする
- `.claude/settings.json` に PreToolUse フックで `git push` をブロック済み

## ファイル構造（重要）
- **編集対象は必ず `Polaris/` サブフォルダ内のファイル**
  - `D:\Claude\supabase-data-viewer\Polaris\` ← GitHubに繋がる本物のリポジトリ
  - `D:\Claude\supabase-data-viewer\` ← 外側の親フォルダ（GitHubに繋がっていない）
- ルートの `app.js` / `index.html` / `style.css` を編集しても本番に反映されない
- 必ず `Polaris/app.js`、`Polaris/index.html`、`Polaris/style.css` を編集すること

## プロジェクト概要
- アプリ名: **Polaris**（製造業向け社内管理システム）
- 機能: 受注登録・加工進捗管理・掲示板・タスク管理・発注管理など
- GitHubリポジトリ: https://github.com/Polaris-kem/Polaris
- 本番サイト: https://polaris-kem.github.io/Polaris/
- Supabase URL: https://todnsebzbgndsxafbflc.supabase.co
- ローカルサーバー: http://localhost:5500
- メインDB テーブル: `t_manufctparts`（加工進捗）

## 技術メモ
- `keydate` + `constructionno` が複合キー（工事番号は数年周期で再利用されるため）
- 加工進捗フィルター: 工事番号入力→機械DD更新→keydate DD更新（最新を自動選択）
- keydate は受注登録日（何巡目かの識別子）

## 作業の流れ
1. `Polaris/` 内のファイルを修正する
2. `Polaris/` 内で `git add` → `git commit`
3. 「GitHub Desktopでpushできます」と伝える
4. pushはユーザーがGitHub Desktopで実行する

## 進捗管理

### 完了済み
- 加工進捗：機械DDを工事番号に連動して絞り込み
- 加工進捗：ページ初期ロードの遅延解消（全件読み込み廃止）
- 加工進捗：keydate をドロップダウン化（最新を自動選択）
- 加工進捗：検索/クリアボタンを keydate 横に移動
- 加工進捗：テーブルカラム順修正（通番削除・予備数追加）
- 加工進捗：文字折り返し無効化
- ホーム：日付を「こんにちは」と同じ行に表示
- ホーム：日付をバナー中央に配置
- 掲示板：アイコンを fa-clipboard-list に変更、色を白に変更
- git push 自動ブロック：`.claude/settings.json` に PreToolUse フック設定済み
- サイドバー：全7部門のボタンを追加（ページIDはmemory参照）

### 未実装ページ（ボタンは追加済み・中身なし）
- `estimate-request`（見積依頼）, `quotation`（見積書作成）, `e-document`（電子帳簿保存）
- `work-order`（製造指図書発行）, `invoice-sales`（請求書・売上登録）
- `project-plan`（工事企画表作成）, `purchase-parts-list`（購入部品表）
- `realtime-result`（実績登録）, `progress-check`（進捗確認）, `rework`（再加工）, `non-work`（非稼働）
- `data-import`（データインポート）, `purchase-order`（発注業務）, `price-inquiry`（見積照会）, `invoice-verify`（請求照合）
- `payable-management`（債務管理）, `receivable-management`（債権管理）

### 次のタスク
- なし（ユーザーからの指示待ち）

---
*タスク完了後にこのファイルの「進捗管理」を更新し、`/clear` を促すこと*
