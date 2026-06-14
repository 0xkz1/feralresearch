# AGENTS.md - AI Agent Guidelines for feral/cms

## Sanity CMS コンテンツ保護（絶対遵守）

- `.env` ファイルや Sanity の書き込みトークン（`SANITY_WRITE_TOKEN` 等）を読んではいけない
- `scripts/` 内の seed/restore 系スクリプト（`seed-*.mjs`, `restore-*.mjs` 等）を実行してはいけない
- これらのスクリプトは書き込みトークンを使って Sanity 上の実コンテンツ（写真、テキスト、構造データ等）を直接書き換える
- Sanity 上のコンテンツは AI の操作対象外
- フロントエンド側の読み取り用コード（`sanity-*.js` 等）の編集は許可
- スキーマ定義（`schemaTypes/*.ts`）の編集は許可（トークン不要、コード変更のみ）
- リスト表示順などの管理画面 UI カスタマイズ（`sanity.config.ts`）の編集は許可
