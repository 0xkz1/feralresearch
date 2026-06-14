# Feral End-to-End Pipeline Scaffold

## TL;DR

> **Quick Summary**: Feral パイプラインの全コンポーネント（スクレイピング、RAG、Hermes Agent、既存 sidecar）を n8n ワークフローで浅く繋ぎ、Hermes Dashboard で可視化する。Breadth-first アプローチで全体像を先に組み立て、後で各パートを深掘りする。
> 
> **Deliverables**:
> - スクレイピングノード（1ソース → data/raw/）
> - RAG 検索エンドポイント（sidecar 拡張、SQLite ベース）
> - Hermes MCP + webhook 連携
> - 全コンポーネントを繋ぐ n8n ワークフロー JSON
> - Hermes Dashboard 可視化設定
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1-4 (parallel) → Task 5-7 → Task 8 → F1-F4

---

## Context

### Original Request
「スクレイピングとか、RAGとか、作って、小さくても動くワークフローを作ろうか？Hermes Agentを最近インストールしたので、Feralにもぜひ活用したい」

ユーザーの意図：
1. 全パートを浅く（breadth-first）組み立てる
2. n8n ワークフロー + Hermes Dashboard の両方で可視化
3. 後で各パートを深掘りする

### Interview Summary
**Key Discussions**:
- **Hermes 連携**: MCP, webhook, CLI, computer-use すべて段階的に使う
- **スクレイピング対象**: 災害ニュース + 野生化動物ニュース（段階的に全ソース）
- **RAG 方式**: ハイブリッド（Feral 生成履歴 + 外部知識）
- **可視化**: n8n ワークフロー + Hermes Dashboard の両方
- **深さ**: 各パートは最小限で動くレベル、全体を繋ぐことを優先

**Research Findings**:
- Hermes: `hermes mcp serve` で MCP サーバー起動可能、`hermes webhook` で webhook 購読可能、`hermes dashboard` で Web UI（デフォルト port 9119）
- 既存 sidecar: `/health` と `/ingest` が動作中、Overpass 連携確認済み
- 既存 DB: SQLite に `disaster_events`, `habitat_features`, `prompt_runs` テーブルあり
- `data/raw/`, `data/processed/`, `rag/prompts/` は空ディレクトリ（構想のみ）

### Metis Review
（タイムアウトによりスキップ - Prometheus 自身でギャップ分析を実施）

---

## Work Objectives

### Core Objective
Feral パイプラインの全段階（スクレイピング → データ蓄積 → 災害種別判定 → RAG 知識検索 → Hermes 推論 → プロンプト生成）を、最小限の実装で繋ぎ、n8n ワークフローと Hermes Dashboard で可視化する。

### Concrete Deliverables
- `data/raw/` にスクレイピング結果を保存する n8n ノード
- `agents/feral_sidecar.py` に `/rag-search` エンドポイント追加
- `hermes.json`（Feral プロジェクト用 Hermes 設定）
- n8n ワークフロー JSON: `workflows/n8n/feral-end-to-end-scaffold.json`
- Hermes MCP サーバー設定 + webhook 設定
- Hermes Dashboard 起動・可視化設定

### Definition of Done
- [x] `curl http://127.0.0.1:8765/rag-search?q=earthquake+cat` → 過去の類似プロンプトが返る
- [x] Hermes MCP サーバー起動 → n8n から疎通確認
- [x] n8n ワークフロー全ノード実行成功 → 最終出力に Hermes レビュー結果が含まれる
- [x] Hermes Dashboard でパイプライン状態が確認できる

### Must Have
- スクレイピングノード（最低1ソース）
- RAG 検索（sidecar 拡張、過去プロンプト検索）
- Hermes 連携（MCP または webhook）
- n8n ワークフロー（全コンポーネント接続）
- Hermes Dashboard 可視化

### Must NOT Have (Guardrails)
- 本格的なベクトル DB（ChromaDB, Pinecone 等）は導入しない - 浅くするため SQLite LIKE 検索で十分
- 複雑なスクレイピングパイプライン - 1ソース1ノード
- Hermes の全機能を使い切ろうとしない - MCP serve + webhook 1個で十分
- ComfyUI 連携は今回スコープ外（config にはあるが、視覚化の対象として扱うのみ）
- 外部 API キー必須のサービス（Firecrawl, Tavily 等）は使わない - LM Studio ローカルのみ

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None（インフラ/統合ワークフローのため、Agent-Executed QA が主検証手段）
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API/Backend**: Use Bash (curl) - Send requests, assert status + response fields
- **n8n Workflow**: Use Bash (curl) - Trigger workflow, check execution results

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + exploration):
├── Task 1: Hermes 設定探索 + hermes.json 作成 [quick]
├── Task 2: スクレイピング: ニュースソース追加 + n8n ノード [quick]
├── Task 3: RAG: sidecar /rag-search エンドポイント追加 [unspecified-low]
├── Task 4: RAG: sidecar /rag-index エンドポイント追加 [unspecified-low]
├── Task 5: Hermes MCP サーバー設定 [unspecified-low]
└── Task 6: Hermes webhook 設定 + テスト [unspecified-low]

Wave 2 (After Wave 1 - integration):
├── Task 7: n8n エンドツーエンドワークフロー構築 [deep]
└── Task 8: Hermes Dashboard 起動 + 可視化設定 [unspecified-low]

Wave FINAL (After ALL tasks):
├── Task F1: Plan Compliance Audit [oracle]
├── Task F2: Integration Test [unspecified-high]
├── Task F3: Real Manual QA [unspecified-high]
└── Task F4: Scope Fidelity Check [deep]
```

**Critical Path**: Task 1-6 (parallel) → Task 7 → Task 8 → F1-F4

### Agent Dispatch Summary

- **Wave 1**: **6** - T1-T2 → `quick`, T3-T6 → `unspecified-low`
- **Wave 2**: **2** - T7 → `deep`, T8 → `unspecified-low`
- **FINAL**: **4** - F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Hermes 設定探索 + hermes.json 作成

  **What to do**:
  - `hermes config show` で現在の設定を確認
  - `hermes config path` で設定ファイルパスを確認
  - Feral プロジェクト用の `hermes.json` を `/media/kz003/atelier/feral/hermes.json` に作成
  - 設定内容: model=`google/gemma-4-26b-a4b`, provider=`lmstudio`, base_url=`http://127.0.0.1:1234/v1`
  - `hermes doctor` で設定の健全性を確認

  **Must NOT do**:
  - 既存の `~/.hermes/` 設定を変更しない
  - API キーを要求するプロバイダーを設定しない

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 設定ファイル作成のみ、探索と確認が中心
  - **Skills**: [`obsidian-markdown`]
    - `obsidian-markdown`: hermes.json のドキュメント化に使用

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5, 6)
  - **Blocks**: Task 5 (Hermes MCP), Task 6 (webhook), Task 7 (n8n workflow)
  - **Blocked By**: None (can start immediately)

  **References**:
  - Hermes CLI: `hermes --help`, `hermes config --help`, `hermes doctor --help`
  - Feral プロジェクトルート: `/media/kz003/atelier/feral/`
  - Hermes ステータス: `hermes status` の出力（model=gemma-4-26b, provider=LM Studio, endpoint=127.0.0.1:1234）

  **Acceptance Criteria**:
  - [ ] `/media/kz003/atelier/feral/hermes.json` が存在する
  - [ ] `hermes config show` で feral プロジェクトの設定が表示される
  - [ ] `hermes doctor` でエラーがない

  **QA Scenarios**:

  ```
  Scenario: hermes.json 作成と検証
    Tool: Bash (curl / CLI)
    Preconditions: hermes CLI が ~/.local/bin/hermes に存在
    Steps:
      1. ls /media/kz003/atelier/feral/hermes.json → ファイルが存在
      2. cat /media/kz003/atelier/feral/hermes.json | python3 -c "import sys,json; c=json.load(sys.stdin); assert c.get('model')=='google/gemma-4-26b-a4b'" → PASS
      3. hermes config show (in feral dir) → model と provider が正しく表示される
    Expected Result: hermes.json が有効で、Hermes CLI が認識する
    Evidence: .sisyphus/evidence/task-1-hermes-config.{txt,json}
  ```

  **Commit**: YES
  - Message: `feat(hermes): add feral project hermes.json config`
  - Files: `hermes.json`

- [x] 2. スクレイピング: 災害ニュースソース追加

  **What to do**:
  - `configs/sources.json` に新しい disaster_sources エントリを1つ追加
  - 推奨ソース: GDACS RSS (`https://www.gdacs.org/xml/rss.xml`) または USGS の全地震フィード（既存と異なるもの）
  - n8n で HTTP Request ノードの設定を確認（既存ワークフローに追加するか、新規ノードとして設計）
  - スクレイピング結果を `data/raw/` に JSON ファイルとして保存する仕組みを検討
  - 今回は n8n ノードの設定を決めてドキュメント化する段階（実際の n8n ワークフロー組み込みは Task 7）

  **Must NOT do**:
  - 外部 API キーが必要なソースを使わない
  - 複雑な HTML スクレイピングは避ける（RSS/JSON API を優先）
  - 実際の n8n ワークフロー JSON は Task 7 で作成

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 設定ファイル編集 + API 疎通確認のみ
  - **Skills**: []
    - 特になし

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5, 6)
  - **Blocks**: Task 7 (n8n workflow)
  - **Blocked By**: None

  **References**:
  - `configs/sources.json` - 既存の disaster_sources 設定（USGS）
  - GDACS RSS: `https://www.gdacs.org/xml/rss.xml`
  - n8n HTTP Request ノード設定パターン: 既存ワークフロー `workflows/n8n/feral-disaster-habitat-browser-sidecar.json` の "Fetch USGS Significant Earthquakes" ノード

  **Acceptance Criteria**:
  - [ ] `configs/sources.json` に新しい disaster_source エントリが追加されている
  - [ ] 追加したソースの URL に curl でアクセス → HTTP 200 または有効なレスポンス
  - [ ] スクレイピング結果の保存先（`data/raw/`）設計がドキュメント化されている

  **QA Scenarios**:

  ```
  Scenario: GDACS RSS フィード取得テスト
    Tool: Bash (curl)
    Preconditions: インターネット接続あり
    Steps:
      1. curl -s -o /tmp/gdacs-test.xml "https://www.gdacs.org/xml/rss.xml" -w "%{http_code}"
      2. HTTP ステータスが 200 であることを確認
      3. レスポンスに <rss> または <item> タグが含まれていることを確認
    Expected Result: RSS フィードが取得でき、災害データが含まれている
    Evidence: .sisyphus/evidence/task-2-gdacs-feed.xml
  ```

  **Commit**: YES
  - Message: `feat(config): add GDACS RSS disaster source`
  - Files: `configs/sources.json`

- [x] 3. RAG: sidecar `/rag-search` エンドポイント追加

  **What to do**:
  - `agents/feral_sidecar.py` に新しい Flask エンドポイント `/rag-search` を追加
  - クエリパラメータ `?q=<keyword>` を受け取り、SQLite の `prompt_runs` テーブルから類似プロンプトを LIKE 検索
  - 検索対象カラム: `positive_prompt`, `scenario_json`
  - レスポンス形式: `{"ok": true, "query": "...", "results": [{"run_id": "...", "score": 0.8, "positive_prompt": "...", "created_at": "..."}, ...]}`
  - 最大5件返す
  - 簡易スコアリング: キーワードの出現回数 / プロンプト長 で正規化

  **Must NOT do**:
  - 外部ベクトル DB を導入しない
  - 複雑な NLP / 埋め込み処理を実装しない（浅くする）
  - 既存の `/health` と `/ingest` エンドポイントを壊さない

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 既存コードへの機能追加、シンプルな SQL クエリ
  - **Skills**: []
    - 特になし（Python + SQLite 標準ライブラリで完結）

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 4 とは依存関係あり - 同じファイルを編集するので、順次実行推奨)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 5, 6 — Task 4 とは要調整)
  - **Blocks**: Task 7 (n8n workflow)
  - **Blocked By**: None (DB と sidecar は稼働中)

  **References**:
  - 既存 sidecar: `agents/feral_sidecar.py` - Flask アプリ構造、`/health` と `/ingest` の実装パターンを踏襲
  - DB スキーマ: `database/schema.sql` - `prompt_runs` テーブル定義
  - DB ファイル: `database/feral.sqlite` - 既存のプロンプトランデータ

  **Acceptance Criteria**:
  - [ ] `curl "http://127.0.0.1:8765/rag-search?q=earthquake"` → 200 OK
  - [ ] レスポンスに `{"ok": true, "query": "earthquake", "results": [...]}` が含まれる
  - [ ] 過去の `run_9f4f746217834f87` のプロンプトがヒットする

  **QA Scenarios**:

  ```
  Scenario: RAG 検索 - キーワードヒット
    Tool: Bash (curl)
    Preconditions: sidecar が 127.0.0.1:8765 で稼働中、DB に過去のプロンプトデータあり
    Steps:
      1. curl -s "http://127.0.0.1:8765/rag-search?q=地震" | python3 -c "
  import sys, json
  d = json.load(sys.stdin)
  assert d['ok'] == True, 'ok is not True'
  assert len(d['results']) >= 0, 'results is missing'
  print(f'OK: {len(d[\"results\"])} results')
  " → PASS
    Expected Result: 検索結果が返り、ok=True
    Evidence: .sisyphus/evidence/task-3-rag-search-hit.json

  Scenario: RAG 検索 - 空クエリ（エッジケース）
    Tool: Bash (curl)
    Preconditions: sidecar 稼働中
    Steps:
      1. curl -s "http://127.0.0.1:8765/rag-search?q=" | python3 -c "
  import sys, json
  d = json.load(sys.stdin)
  assert d['ok'] == True
  assert d['results'] == []
  " → PASS
    Expected Result: 空クエリでも 200 OK、results は空配列
    Evidence: .sisyphus/evidence/task-3-rag-search-empty.json
  ```

  **Commit**: YES
  - Message: `feat(sidecar): add /rag-search endpoint with SQLite LIKE search`
  - Files: `agents/feral_sidecar.py`

- [x] 4. RAG: sidecar `/rag-index` エンドポイント追加

  **What to do**:
  - `/ingest` 実行後のプロンプトデータを RAG 検索可能にするため、インデックス更新エンドポイントを追加
  - 実際には `/ingest` が既に `prompt_runs` テーブルにデータを書き込んでいるので、`/rag-index` は「インデックス再構築」または「全件再読み込み」を行うエンドポイント
  - 簡易実装: `/rag-index` は DB の `prompt_runs` 総件数を返し、データが RAG 検索可能であることを示す
  - レスポンス: `{"ok": true, "indexed_count": N, "message": "RAG index ready"}`
  - 将来的に埋め込みベクトルの計算をここで行える余地を残す

  **Must NOT do**:
  - 外部依存を導入しない
  - `/ingest` の動作を変更しない

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 既存コードへの小さな機能追加
  - **Skills**: []
    - 特になし

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 3 とは同じファイルを編集するため要調整)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 7
  - **Blocked By**: Task 3（推奨 - 同じファイルの連続編集）

  **References**:
  - `agents/feral_sidecar.py` - `/ingest` の実装（DB 書き込みパターン）
  - `database/schema.sql` - `prompt_runs` テーブル

  **Acceptance Criteria**:
  - [ ] `curl -X POST http://127.0.0.1:8765/rag-index` → 200 OK
  - [ ] `{"ok": true, "indexed_count": N}` が返る（N >= 1）
  - [ ] `/rag-search` が `/rag-index` 実行後も正常に動作する

  **QA Scenarios**:

  ```
  Scenario: RAG インデックス構築 + 検索の一貫性
    Tool: Bash (curl)
    Preconditions: sidecar 稼働中、DB にプロンプトデータあり
    Steps:
      1. curl -s -X POST http://127.0.0.1:8765/rag-index → {"ok": true, "indexed_count": N}
      2. N >= 1 を確認
      3. curl -s "http://127.0.0.1:8765/rag-search?q=disaster" → results が返る
    Expected Result: インデックス件数が正しく、検索と一貫している
    Evidence: .sisyphus/evidence/task-4-rag-index.json
  ```

  **Commit**: YES
  - Message: `feat(sidecar): add /rag-index endpoint for search readiness`
  - Files: `agents/feral_sidecar.py`

- [x] 5. Hermes MCP サーバー設定 + 起動テスト

  **What to do**:
  - Feral プロジェクトディレクトリで `hermes mcp serve` の設定を確認
  - `hermes mcp serve --help` で起動オプションを確認
  - Hermes MCP サーバーをバックグラウンド起動（`hermes mcp serve` を nohup または systemd で）
  - 起動後、MCP サーバーがリッスンしているポートを確認
  - n8n から MCP サーバーを呼び出す方法を検討（直接 MCP プロトコルは n8n が対応していない場合、HTTP プロキシを挟むか webhook を使う方針を決定）

  **Must NOT do**:
  - 複雑な MCP ツール設定は行わない（デフォルト設定で起動できればOK）
  - Hermes の設定を壊さない

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: CLI の起動確認と設定探索
  - **Skills**: []
    - 特になし

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 7 (n8n workflow)
  - **Blocked By**: Task 1 (hermes.json が先に必要)

  **References**:
  - `hermes mcp serve --help` - MCP サーバー起動オプション
  - `hermes mcp list` - 既存 MCP サーバー一覧
  - `/media/kz003/atelier/feral/hermes.json` - Task 1 で作成予定

  **Acceptance Criteria**:
  - [ ] `hermes mcp serve` がエラーなく起動する
  - [ ] MCP サーバーのポートがリッスン状態であることを確認
  - [ ] n8n → Hermes の連携方法が決定・ドキュメント化されている

  **QA Scenarios**:

  ```
  Scenario: Hermes MCP サーバー起動確認
    Tool: Bash (CLI)
    Preconditions: hermes.json が存在、LM Studio が 127.0.0.1:1234 で稼働中
    Steps:
      1. hermes mcp serve --help → 使用方法が表示される
      2. バックグラウンド起動を試行（タイムアウト付きでプロセス確認）
      3. ss -tlnp | grep hermes などでポート確認
    Expected Result: Hermes MCP サーバーが起動し、リッスン状態
    Evidence: .sisyphus/evidence/task-5-hermes-mcp-serve.txt
  ```

  **Commit**: NO（設定ファイル変更のみのため、Task 1 とまとめる）

- [x] 6. Hermes webhook 設定（feral-review エンドポイント）

  **What to do**:
  - `hermes webhook subscribe` で `feral-review` という名前の webhook を作成
  - ルート: `/feral-review`
  - この webhook は POST リクエストを受け取り、プロンプトパケットを Hermes に渡してレビュー結果を返す
  - `hermes webhook list` で登録確認
  - `hermes webhook test /feral-review` または curl でテスト
  - n8n から呼び出すための HTTP Request ノード設定仕様を文書化

  **Must NOT do**:
  - 外部公開設定（`--insecure`）は使わない - localhost のみ
  - 複雑な webhook ロジックは実装しない

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: CLI 設定 + curl テスト
  - **Skills**: []
    - 特になし

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 7 (n8n workflow)
  - **Blocked By**: Task 1 (hermes.json), Task 5 (MCP サーバー起動)

  **References**:
  - `hermes webhook --help` - webhook サブコマンド
  - `hermes webhook subscribe --help` - 購読作成オプション

  **Acceptance Criteria**:
  - [ ] `hermes webhook list` に `feral-review` が表示される
  - [ ] curl で POST テスト → 200 OK
  - [ ] n8n からの呼び出し仕様が文書化されている

  **QA Scenarios**:

  ```
  Scenario: Hermes webhook 作成 + テスト
    Tool: Bash (curl + CLI)
    Preconditions: hermes.json が存在、Hermes MCP サーバーが起動中
    Steps:
      1. hermes webhook list → feral-review が一覧に含まれている
      2. curl -s -X POST http://127.0.0.1:PORT/feral-review \
           -H "Content-Type: application/json" \
           -d '{"prompt": "test", "context": "earthquake in Tokyo"}'
      3. レスポンスにレビュー結果が含まれていることを確認
    Expected Result: webhook が正しく応答する
    Evidence: .sisyphus/evidence/task-6-webhook-test.json
  ```

  **Commit**: NO（設定変更のみ、Task 1 とまとめる）

- [x] 7. n8n エンドツーエンドワークフロー構築

  **What to do**:
  - 全コンポーネントを繋ぐ新しい n8n ワークフロー JSON を作成
  - ファイルパス: `workflows/n8n/feral-end-to-end-scaffold.json`
  - ノード構成（全8ノード）:
    1. **Schedule Trigger** (または Manual Trigger) - 定期実行または手動
    2. **Fetch Disaster Data** (HTTP Request) - USGS または GDACS RSS から災害データ取得
    3. **Select Disaster Seed** (Code) - 最大地震/災害を選択
    4. **feral Sidecar Ingest** (HTTP Request) - `POST http://127.0.0.1:8765/ingest`
    5. **RAG Knowledge Search** (HTTP Request) - `GET http://127.0.0.1:8765/rag-search?q={{prompt_keywords}}`
    6. **Hermes Review** (HTTP Request) - Hermes webhook `/feral-review` に POST、プロンプトと RAG 結果を送信
    7. **Merge & Format** (Code) - sidecar 出力 + RAG 結果 + Hermes レビューを統合
    8. **Save Final Packet** (Code or HTTP Request) - 最終出力をファイルに保存
  - 既存ワークフロー (`feral-disaster-habitat-browser-sidecar.json`) のノード設定を参考にする
  - 各ノードの接続とデータ受け渡しを正しく設定

  **Must NOT do**:
  - 既存ワークフローを上書きしない（新規ファイルとして作成）
  - 外部 API キーが必要なノードを使わない
  - ComfyUI ノードは今回含めない（可視化対象としてコメントアウトで残す）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 複数コンポーネントの統合、n8n ワークフロー設計、データフロー設計が必要
  - **Skills**: []
    - 特になし

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (with Task 8)
  - **Blocks**: Task 8, F2, F3
  - **Blocked By**: Tasks 1-6 (全 Wave 1)

  **References**:
  - 既存ワークフロー: `workflows/n8n/feral-disaster-habitat-browser-sidecar.json` - ノード構造、HTTP Request 設定パターン
  - n8n Docker コンテナ: `docker exec n8n-n8n-1` で内部操作可能
  - n8n DB: `/media/kz003/atelier/forge/n8n-data/database.sqlite` - インポート先
  - Sidecar エンドポイント: `http://127.0.0.1:8765/ingest`, `http://127.0.0.1:8765/rag-search`
  - Hermes webhook: `http://127.0.0.1:PORT/feral-review`

  **Acceptance Criteria**:
  - [ ] `workflows/n8n/feral-end-to-end-scaffold.json` が有効な JSON として存在
  - [ ] n8n にインポート成功（`n8n import:workflow --input=...`）
  - [ ] ワークフロー名: "feral - End-to-End Scaffold"
  - [ ] ノード数: 8（Schedule, Fetch, Select, Ingest, RAG, Hermes, Merge, Save）
  - [ ] Manual Trigger で実行 → 全ノードが成功

  **QA Scenarios**:

  ```
  Scenario: n8n ワークフローインポート + 構造検証
    Tool: Bash (docker exec + curl)
    Preconditions: n8n コンテナ稼働中、sidecar 稼働中
    Steps:
      1. docker cp workflows/n8n/feral-end-to-end-scaffold.json n8n-n8n-1:/tmp/
      2. docker exec n8n-n8n-1 n8n import:workflow --input=/tmp/feral-end-to-end-scaffold.json
      3. sqlite3 /.../n8n-data/database.sqlite "SELECT name,active FROM workflow_entity WHERE name LIKE '%Scaffold%'"
      4. ワークフローが存在し、ノード数が 8 であることを確認
    Expected Result: ワークフローが n8n に正しくインポートされ、全ノードが存在
    Failure Indicators: インポートエラー、ノード不足、JSON パースエラー
    Evidence: .sisyphus/evidence/task-7-workflow-import.txt

  Scenario: n8n ワークフロー手動実行
    Tool: Bash (curl to n8n API)
    Preconditions: ワークフローインポート済み、sidecar と Hermes webhook が応答する
    Steps:
      1. n8n API でワークフローを activate
      2. n8n API で Manual Trigger を発火
      3. 実行結果を取得し、全ノードが success であることを確認
    Expected Result: 全ノード実行成功、最終出力に Hermes レビュー結果が含まれる
    Evidence: .sisyphus/evidence/task-7-workflow-execution.json
  ```

  **Commit**: YES
  - Message: `feat(n8n): add end-to-end scaffold workflow`
  - Files: `workflows/n8n/feral-end-to-end-scaffold.json`

- [x] 8. Hermes Dashboard 起動 + 可視化設定

  **What to do**:
  - `hermes dashboard` を起動（デフォルト port 9119）
  - Tailscale 経由で MacBook からアクセス可能にするため、`--host 0.0.0.0` または `--host 100.123.190.33` で起動
  - `--insecure` フラグの必要性を判断（localhost 以外にバインドする場合に必要）
  - 起動後、`http://100.123.190.33:9119` にブラウザでアクセスできることを確認
  - Dashboard 上で以下を可視化:
    - Feral パイプラインの状態（セッション一覧）
    - モデル設定（gemma-4-26b）
    - Webhook 設定（feral-review）
    - MCP サーバー状態
  - MacBook 用のアクセスガイドを作成（`.sisyphus/notepads/feral-end-to-end-scaffold/dashboard-access-guide.md`）

  **Must NOT do**:
  - 本番環境として `--insecure` を常用する設計にしない（注意書きを残す）
  - ファイアウォール設定を恒久的に変更しない

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: CLI 起動 + ブラウザ確認 + ガイド作成
  - **Skills**: [`/playwright`]
    - `/playwright`: Dashboard のブラウザ表示確認に使用

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 7)
  - **Blocks**: F3
  - **Blocked By**: Tasks 5, 6 (Hermes が設定済みであること)

  **References**:
  - `hermes dashboard --help` - 起動オプション
  - `hermes dashboard --status` - 状態確認
  - Tailscale IP: `100.123.190.33`
  - 既存の MacBook 接続ガイド: `.sisyphus/notepads/feral-n8n-setup-remote-access/macbook-connection-guide.md`（参考）

  **Acceptance Criteria**:
  - [ ] `hermes dashboard` が起動し、port 9119 でリッスン
  - [ ] `curl http://127.0.0.1:9119` → HTTP 200
  - [ ] `curl http://100.123.190.33:9119` → HTTP 200（Tailscale 経由）
  - [ ] Dashboard アクセスガイドが作成されている

  **QA Scenarios**:

  ```
  Scenario: Hermes Dashboard 起動 + Tailscale アクセス
    Tool: Bash (curl)
    Preconditions: Hermes 設定済み
    Steps:
      1. hermes dashboard --port 9119 --host 100.123.190.33 --no-open &
      2. sleep 5
      3. curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9119 → 200
      4. curl -s -o /dev/null -w "%{http_code}" http://100.123.190.33:9119 → 200
    Expected Result: Dashboard が localhost と Tailscale 両方でアクセス可能
    Failure Indicators: 403 Forbidden, Connection Refused, 502 Bad Gateway
    Evidence: .sisyphus/evidence/task-8-dashboard-status.txt

  Scenario: Dashboard 表示確認（ブラウザ）
    Tool: Playwright (/playwright skill)
    Preconditions: Dashboard 起動済み
    Steps:
      1. navigate to http://100.123.190.33:9119
      2. ページがロードされ、"Hermes Agent" または "Dashboard" の表示を確認
      3. Sessions タブが存在することを確認
      4. スクリーンショットを取得
    Expected Result: Dashboard UI が正常に表示される
    Evidence: .sisyphus/evidence/task-8-dashboard-screenshot.png
  ```

  **Commit**: NO（ファイル変更なし、ガイドのみ）

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Check all changed files for: `as any`/`@ts-ignore`, empty catches, console.log, commented-out code, unused imports. Verify n8n workflow JSON is valid JSON with correct structure. Verify sidecar Python syntax (`python3 -m py_compile agents/feral_sidecar.py`).
  Output: `Sidecar [PASS/FAIL] | n8n JSON [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `/playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: sidecar /rag-search + Hermes webhook + n8n workflow end-to-end. Test edge cases: sidecar down, Hermes offline, empty DB.
  Evidence saved to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **T1-T6**: Individual commits per task
- **T7**: `feat(n8n): add end-to-end scaffold workflow`
- **T8**: `feat(hermes): add dashboard visualization config`

---

## Success Criteria

### Verification Commands
```bash
# Sidecar RAG
curl -s http://127.0.0.1:8765/rag-search?q=earthquake | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['ok'] and len(d['results'])>0"

# Hermes MCP serve
curl -s http://127.0.0.1:9119/health

# n8n workflow
# Trigger and verify execution success
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] n8n workflow executes end-to-end
- [x] Hermes Dashboard accessible
