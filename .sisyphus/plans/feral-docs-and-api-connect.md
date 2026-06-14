# Plan: feral — Documentation Gap Fill + API Connection

## TL;DR

> **Quick Summary**: 不足している README.md/PROGRESS.md を各ディレクトリに作成し、sidecarを再起動して `/logs` エンドポイントを有効化し、WebフロントエンドとエンジンのAPI接続を完了させる。
>
> **Deliverables**:
> - `feral/README.md` (ルート, 新規作成)
> - `web/README.md` (新規作成)
> - `cms/README.md` + `cms/PROGRESS.md` (新規作成)
> - `vault/README.md` + `vault/PROGRESS.md` (新規作成)
> - Sidecar再起動 → `/logs` エンドポイントが live に
> - Webフロントエンドが実際のsidecarデータを表示
>
> **Estimated Effort**: Quick
> **Parallel Execution**: YES — 2 waves

---

## Context

### Current State

| Directory | README.md | PROGRESS.md | Status |
|-----------|-----------|-------------|--------|
| `feral/` (root) | ❌ | N/A | Missing |
| `web/` | ❌ | ✅ | Phase 1-2 documented |
| `engine/` | ✅ (stale) | ✅ | Needs update |
| `cms/` | ❌ | ❌ | Scaffolded, no docs |
| `vault/` | ❌ | ❌ | Empty |

### API Connection Status

| Endpoint | Source Code | Running Sidecar | Frontend Calls |
|----------|------------|----------------|----------------|
| `/health` | ✅ | ✅ | ✅ |
| `/ingest` | ✅ | ✅ | 🔜 |
| `/rag-search` | ✅ | ✅ | ✅ (dashboard) |
| `/rag-index` | ✅ | ✅ | ✅ (dashboard) |
| `/logs` | ✅ | ❌ (stale instance) | ✅ (research-log, landing) |

**Root Cause**: Sidecar was started before `/logs` and Research Log schema were added. Needs restart.

### CMS State
- Sanity CMS scaffolded with schema types: feralResearch, feralGallery, feralSiteSettings, feralLanding, feralDashboard
- `feralResearch.ts` has fields: title (ja/en), slug, prompt, runType, date, status, content (ja/en), source, labels, featured, orderRank
- Not connected to any data source yet — Phase 5 work
- `node_modules/` exists, `pnpm-lock.yaml` — ready for dev server

---

## Work Objectives

### Core Objective
すべてのディレクトリに適切なREADME.md/PROGRESS.mdを作成し、sidecarを最新状態で再起動してWebフロントエンドがエンジンの実データを表示できるようにする。

### Concrete Deliverables
- 5つのREADME.md + 3つのPROGRESS.md 作成
- Sidecar再起動 → `/logs` エンドポイントが 200 OK
- `feral-api.js` が `getLogs()` で実際のデータを返す

---

## Execution Strategy

```
Wave 1 (parallel — documentation):
├── Task 1: ルート README.md 作成
├── Task 2: web/README.md 作成
├── Task 3: cms/README.md + PROGRESS.md 作成
├── Task 4: vault/README.md + PROGRESS.md 作成
├── Task 5: engine/README.md + PROGRESS.md 更新
└── Task 6: Sidecar再起動 + /logs 検証

Wave 2 (after Wave 1 — connection verification):
├── Task 7: Webフロントエンド接続検証
└── Task 8: 最終検証レポート
```

---

## TODOs

- [ ] 1. ルート `feral/README.md` 作成

  **What to do**:
  - `/media/kz003/atelier/feral/README.md` にプロジェクト概要を書く
  - 内容: アーキテクチャ図、パイプライン説明、ディレクトリ構造、稼働サービス一覧、開発優先順位

  **Acceptance Criteria**:
  - [ ] ファイルが存在する
  - [ ] 4つのサブディレクトリ (web, cms, engine, vault) の説明がある

- [ ] 2. `web/README.md` 作成

  **What to do**:
  - `/media/kz003/atelier/feral/web/README.md` に作成
  - 内容: ページ一覧 (5ページ)、APIモジュール説明、CSSシステム概要、モックデータ戦略

  **Acceptance Criteria**:
  - [ ] ファイルが存在する
  - [ ] 5つのHTMLファイルが列挙されている

- [ ] 3. `cms/README.md` + `cms/PROGRESS.md` 作成

  **What to do**:
  - CMSの構造とスキーマタイプを説明
  - PROGRESS.md: Sanity設定、スキーマ定義、未着手項目を記録

  **Acceptance Criteria**:
  - [ ] 両方のファイルが存在する
  - [ ] 6つのスキーマタイプが列挙されている

- [ ] 4. `vault/README.md` + `vault/PROGRESS.md` 作成

  **What to do**:
  - vault/ の目的を説明 (Obsidian互換のナレッジベース)
  - 現在空であることをPROGRESSに記録

  **Acceptance Criteria**:
  - [ ] 両方のファイルが存在する

- [ ] 5. `engine/README.md` + `engine/PROGRESS.md` 更新

  **What to do**:
  - README: 新しいパス (engine/配下) とエンドポイント一覧に更新
  - PROGRESS: API状態、Research Logスキーマ更新済みの旨を反映

  **Acceptance Criteria**:
  - [ ] パスが全て `feral/engine/` に正規化されている

- [ ] 6. Sidecar再起動 + `/logs` 検証

  **What to do**:
  - 既存sidecarプロセスを停止
  - 最新コードで再起動: `python3 /media/kz003/atelier/feral/engine/agents/feral_sidecar.py`
  - `/logs` エンドポイントをcurlで検証

  **Acceptance Criteria**:
  - [ ] `curl http://127.0.0.1:8765/logs` → `{"ok": true, "logs": [...]}`

- [ ] 7. Webフロントエンド接続検証

  **What to do**:
  - health, logs, rag-search 各エンドポイントにcurl
  - フロントエンドが実データを取得できる状態を確認

  **Acceptance Criteria**:
  - [ ] 全エンドポイントが200 OK
  - [ ] `/logs` が最低1件のエントリを返す（過去のingestデータから）

- [ ] 8. 最終検証レポート

  **What to do**:
  - 作成された全ファイルの存在確認
  - 稼働サービス一覧の出力
  - 次のフェーズの提案

  **Acceptance Criteria**:
  - [ ] 不足ファイル 0
  - [ ] 全APIエンドポイント 200
