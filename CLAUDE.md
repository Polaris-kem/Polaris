# Polaris プロジェクト ルール

## 絶対に守るルール

### GitHubへのpushは絶対にしない
- `git push` コマンドは**絶対に実行しない**（例外なし）
- pushはユーザーがGitHub Desktopで自分で行う
- コード修正後は「GitHub Desktopでpushできます」と伝えるだけにする

### 理由
- テスト中のコードが本番（GitHub Pages）に反映されてしまうため
- pushのタイミングはユーザーが判断する

## 作業の流れ
1. コードを修正する
2. ローカルプレビューで動作確認する（preview_start）
3. 「GitHub Desktopでpushできます」と伝える
4. pushはユーザーがGitHub Desktopで実行する

## プロジェクト情報
- アプリ名: **Polaris**
- GitHubリポジトリ: https://github.com/Polaris-kem/Polaris
- 本番サイト: https://polaris-kem.github.io/Polaris/
- Supabase URL: https://todnsebzbgndsxafbflc.supabase.co
- ローカルサーバー: http://localhost:5500
