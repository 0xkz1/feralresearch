# Plan: feral — n8n Remote Setup & Workflow Verification

## TL;DR

> **Quick Summary**: n8nの既存Docker Compose設定をTailscale経由のリモートアクセスに対応させ、feral sidecarを起動し、feralワークフローをインポートして動作確認する。
>
> **Deliverables**:
> - n8nがTailscale IP `100.123.190.33:5678` でアクセス可能になる
> - feral sidecar (Python HTTPサーバ) が起動する
> - feralワークフローがn8nにインポート済み
> - MacBookからブラウザでn8nを開いてワークフローを確認できる
>
> **Estimated Effort**: Short
> **Parallel Execution**: YES — 2 waves

---

## Context

### 現状
- feralプロジェクト: `/media/kz003/atelier/feral/` — 災害→動物視点プロンプト生成パイプライン
- n8n: `/media/kz003/atelier/forge/n8n/` にDocker Compose設定あり、コンテナ未起動
- 既存n8nデータ: `/media/kz003/atelier/forge/n8n-data/` (SQLite DB、暗号化キー含む)
- feral sidecar: 未起動
- ネットワーク: Tailscale `100.123.190.33`、LAN `192.168.3.99`

### n8n docker-compose.yml の問題点
- `N8N_HOST=0.0.0.0` — 誤設定。n8nが生成するURLが不正になる
- 名前付きボリューム使用 — 既存 `n8n-data/` のデータが使われない
- `N8N_ENCRYPTION_KEY` 未設定 → 新規コンテナ起動時に暗号化キーが再生成される
- すべて修正が必要

---

## Work Objectives

### Core Objective
n8nをTailscale経由でMacBookからアクセス可能にし、feralワークフローを確認できる状態にする

### Concrete Deliverables
- n8n: `http://100.123.190.33:5678` でアクセス可能
- feral sidecar: `http://127.0.0.1:8765` で待受 (n8n→sidecar→Overpass のパイプライン)
- n8n上のワークフロー: "feral - Disaster to Habitat Browser Sidecar" がインポート済み

### Must Have
- [ ] MacBook (同一Tailscale network) から `http://100.123.190.33:5678` でn8n UIにアクセスできる
- [ ] feralワークフローがn8nにインポートされ、内容を確認できる
- [ ] feral sidecarが起動し、`/health` エンドポイントが200を返す

### Must NOT Have (Guardrails)
- n8nの既存DBデータ (My First workflow) を破壊しない
- インターネット公開しない (Tailscale限定)
- n8n認証を無効化しない (デフォルトのownerアカウント維持)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — すべての検証はエージェントが実行

### QA Policy
- **n8n接続**: Bash (curl) → Tailscale IPにHTTPリクエスト、302 or 200を確認
- **Sidecar**: Bash (curl) → `/health` エンドポイント確認
- **ワークフロー確認**: Bash (n8n REST API) → ワークフロー一覧取得

---

## Execution Strategy

```
Wave 1 (Start Immediately — infrastructure):
├── Task 1: docker-compose.yml 修正 (bind mount, N8N_HOST, encryption key)
├── Task 2: n8nコンテナ起動
├── Task 3: feral sidecar起動
└── Task 4: feralワークフローインポート

Wave 2 (After Wave 1 — verification):
├── Task 5: n8nアクセス確認 (curl → Tailscale:5678)
├── Task 6: sidecar動作確認 (curl → 127.0.0.1:8765/health)
├── Task 7: ワークフロー一覧確認 (n8n API)
└── Task 8: MacBook接続ガイド案内
```

---

## TODOs

- [x] 1. docker-compose.yml 修正

  **What to do**:
  - `n8n_data` named volume → `n8n-data/` bind mount に変更
  - `N8N_HOST=100.123.190.33` に修正 (Tailscale IP)
  - `N8N_ENCRYPTION_KEY` を環境変数に追加 (`9bNL65nxHxZMDgtUyrvzMOkfohy9XfvX`)
  - ファイル: `/media/kz003/atelier/forge/n8n/docker-compose.yml`

  **Must NOT do**:
  - `.env` に暗号化キーを露出させない (docker-compose.yml内で管理)
  - `N8N_PORT` は変更しない (5678維持)

  **Recommended Agent Profile**:
  - **Category**: `quick` — 単一ファイルの設定修正タスク
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation task)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] docker-compose.yml の差分確認: named volume → bind mount, N8N_HOST修正, encryption key追加

  **QA Scenarios**:
  ```
  Scenario: 設定ファイルの内容確認
    Tool: Bash (cat/sed確認)
    Steps:
      1. docker-compose.yml の volumes セクション確認
      2. N8N_HOST が 100.123.190.33 になっていること確認
      3. encryption key が設定されていること確認
    Expected Result: 3つの修正がすべて適用されている
    Evidence: .sisyphus/evidence/task-1-config-check.txt
  ```

  **Commit**: NO (設定ファイルのみ)

---

- [x] 2. n8nコンテナ起動

  **What to do**:
  - `docker compose up -d` を `/media/kz003/atelier/forge/n8n/` で実行
  - コンテナ起動完了まで待機 (最大60秒)
  - `docker compose logs --tail=20` でエラーログ確認

  **Must NOT do**:
  - 既存DBを削除/変更しない
  - docker-compose以外の方法で起動しない

  **Recommended Agent Profile**:
  - **Category**: `quick` — docker compose up の単純実行
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on task 1)
  - **Blocks**: Task 5, Task 7
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `docker compose ps` で n8n コンテナが `Up` 状態
  - [ ] `docker compose logs` にエラーなし
  - [ ] `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5678/` が 200 または 302

  **QA Scenarios**:
  ```
  Scenario: n8nコンテナ起動確認
    Tool: Bash
    Steps:
      1. docker compose ps → n8nサービスが "Up" であることを確認
      2. n8nポート 5678 へのcurl → 302 Found (ログインページへリダイレクト) or 200 OK
      3. コンテナログにエラーメッセージがないことを確認
    Expected Result: n8nが正常に起動し、HTTPで応答する
    Evidence: .sisyphus/evidence/task-2-n8n-started.txt
  ```

  **Commit**: NO

---

- [x] 3. feral sidecar起動

  **What to do**:
  - `python3 /media/kz003/atelier/feral/agents/feral_sidecar.py &` をバックグラウンドで実行
  - プロセスが起動するまで待機 (最大10秒)
  - PIDを記録

  **Must NOT do**:
  - tmuxセッションを使わない (単純なバックグラウンド起動でOK)
  - `nohup` なしで起動しない (SSH切断後も残るように)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 2と並行可能)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] `curl http://127.0.0.1:8765/health` が `{"ok": true, "project": "feral"}` を返す
  - [ ] プロセスが動作中 (`ps aux | grep feral_sidecar`)

  **QA Scenarios**:
  ```
  Scenario: sidecar起動確認
    Tool: Bash (curl)
    Steps:
      1. curl http://127.0.0.1:8765/health
      2. レスポンスJSONに "ok": true が含まれることを確認
    Expected Result: {"ok": true, "project": "feral"}
    Evidence: .sisyphus/evidence/task-3-sidecar-health.txt

  Scenario: sidecarプロセス生存確認
    Tool: Bash (ps)
    Steps:
      1. ps aux | grep feral_sidecar.py | grep -v grep
      2. プロセスが1つ以上存在することを確認
    Expected Result: プロセスが動作中
    Evidence: .sisyphus/evidence/task-3-sidecar-process.txt
  ```

  **Commit**: NO

---

- [x] 4. feralワークフローインポート

  **What to do**:
  - n8n REST API を使用してワークフローをインポート
  - APIエンドポイント: `POST http://127.0.0.1:5678/rest/workflows`
  - リクエストボディ: `/media/kz003/atelier/feral/workflows/n8n/feral-disaster-habitat-browser-sidecar.json` の内容
  - 認証: n8nのCookieベース認証が必要 → 初回起動時はownerアカウント作成が必要
  - **代替手段**: n8n Web UIを開いて手動インポートをガイド、またはownerアカウント作成APIを使用

  **Must NOT do**:
  - 既存データを上書きしない
  - ワークフローを自動有効化しない (inactiveのまま)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low` — n8n API操作
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (n8n起動後)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **Acceptance Criteria**:
  - [ ] n8n API呼び出しが成功、ワークフロー作成される
  - [ ] ワークフロー名: "feral - Disaster to Habitat Browser Sidecar"

  **QA Scenarios**:
  ```
  Scenario: n8n API ワークフロー一覧確認
    Tool: Bash (curl)
    Steps:
      1. n8n API: GET http://127.0.0.1:5678/rest/workflows
      2. レスポンス内に "feral - Disaster to Habitat Browser Sidecar" が含まれることを確認
    Expected Result: feralワークフローがリストに表示される
    Evidence: .sisyphus/evidence/task-4-workflow-imported.txt
  ```

  **Commit**: NO

---

- [x] 5. n8n Tailscale経由アクセス確認

  **What to do**:
  - Tailscale IP `100.123.190.33:5678` にcurlでアクセス
  - ログインページがレスポンスされることを確認
  - MacBookから `http://100.123.190.33:5678` で開けることを確認

  **Must NOT do**:
  - 認証をバイパスしない
  - ファイアウォールルールを変更しない

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (n8n起動後)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **Acceptance Criteria**:
  - [ ] `curl http://100.123.190.33:5678/` が200または302を返す
  - [ ] コンテンツに n8n のログインページHTMLが含まれる

  **QA Scenarios**:
  ```
  Scenario: Tailscale IPでアクセス確認
    Tool: Bash (curl)
    Steps:
      1. curl -L http://100.123.190.33:5678/
      2. レスポンスHTMLに "n8n" または "login" が含まれることを確認
    Expected Result: n8nのログインページが表示される
    Evidence: .sisyphus/evidence/task-5-tailscale-access.txt
  ```

  **Commit**: NO

---

- [x] 6. sidecar Overpass連携テスト

  **What to do**:
  - n8n側からsidecarにテストリクエストを送信
  - またはcurlで直接sidecarにダミーディザスターデータをPOST
  - レスポンス内容を確認 (prompt_packet_path, positive_prompt, negative_prompt)

  **Must NOT do**:
  - 本番のUSGS APIに負荷をかけない (必要なら手動POSTでテスト)
  - 外部APIへのテストは最小限に

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (sidecar起動後)
  - **Blocks**: None
  - **Blocked By**: Task 3

  **Acceptance Criteria**:
  - [ ] sidecar POSTリクエストが200を返す
  - [ ] prompt_packet_path が存在する

---

- [x] 7. ワークフロー詳細確認

  **What to do**:
  - n8n REST API でワークフローJSONを取得し、内容を確認
  - 各ノードの設定 (USGS URL, Code nodeのJavaScript, Sidecarエンドポイント等) が正しいことを確認
  - 設定値と実環境の乖離チェック (例: sidecarのポート、タイムアウト値、認証設定)

  **Must NOT do**:
  - ワークフローを有効化しない (動作確認はユーザー判断)
  - 設定値を変更しない (現状維持)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 8
  - **Blocked By**: Task 4

  **Acceptance Criteria**:
  - [ ] ワークフローJSONをファイルに保存し、5つのノードがあることを確認:
    1. Manual Trigger
    2. Fetch USGS Significant Earthquakes
    3. Select Disaster Seed (Code)
    4. feral Sidecar Ingest (HTTP Request)
    5. Prepare Human Review Packet (Code)
  - [ ] 各ノードの設定パラメータを抽出して表示
  - [ ] sidecarエンドポイント: `http://127.0.0.1:8765/ingest` が正しいことを確認

  **QA Scenarios**:
  ```
  Scenario: ワークフロー構成確認
    Tool: Bash (curl → n8n API)
    Steps:
      1. n8n APIでワークフロー一覧を取得
      2. "feral"ワークフローのIDを特定
      3. ワークフロー詳細JSONを取得し、nodes配列の要素数を確認
      4. 各nodeのtype, name, parametersを抽出
    Expected Result: 5 nodes, 期待通りの構成
    Evidence: .sisyphus/evidence/task-7-workflow-detail.json
  ```

  **Commit**: NO

---

- [x] 8. MacBook接続ガイド

  **What to do**:
  - MacBookから接続するための手順をまとめる
  - Tailscaleが両方のマシンで動作していることを前提とした接続情報:
    - URL: `http://100.123.190.33:5678`
    - 初回: ownerアカウント作成が必要
    - n8nログイン後、ワークフロー確認

  **Must NOT do**:
  - Tailscaleのインストール手順は含めない（ユーザーのTailscaleは既存）
  - パスワードなどの機密情報を平文でファイルに書かない

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (全タスク完了後)
  - **Blocks**: None
  - **Blocked By**: Task 5, Task 7

  **Acceptance Criteria**:
  - [ ] 3行以内の接続手順が提供される
  - [ ] n8nの初回セットアップ手順が含まれる
  - [ ] ワークフローの場所（どこにあるか）が記載されている

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Verify: Must Have 3 items all checked, Must NOT Have violations absent.
  
  **RESULT: APPROVED**
  - Must Have 1: ✅ MacBook Tailscale access (HTTP 200)
  - Must Have 2: ✅ feral workflow imported (inactive)
  - Must Have 3: ✅ sidecar health (200 OK)
  - Must NOT Have: ✅ Existing DB preserved (2 workflows), Tailscale-only, auth enabled

- [x] F2. **Integration Test** — `unspecified-high`
  Test that n8n (+ Tailscale IP) and sidecar both respond, and workflow JSON is importable.
  
  **RESULT: PASSED**
  - n8n Tailscale: HTTP 200 ✅
  - sidecar health: {"ok": true} ✅
  - sidecar ingest: ok=True, 60 features ✅
  - workflow in DB: 1 feral workflow ✅

- [x] F3. **User Handoff** — Provide final connection URL and instructions for MacBook access.
  
  **RESULT: COMPLETE**
  - Connection guide created at: `.sisyphus/notepads/feral-n8n-setup-remote-access/macbook-connection-guide.md`
  - URL: http://100.123.190.33:5678

---

## Success Criteria

### Verification Commands
```bash
curl -s -o /dev/null -w "%{http_code}" http://100.123.190.33:5678/   # Expected: 200 or 302
curl -s http://127.0.0.1:8765/health                                  # Expected: {"ok":true,"project":"feral"}
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] n8n accessible via Tailscale
- [ ] feral workflow imported in n8n
- [ ] sidecar running and healthy
- [ ] User can access from MacBook browser
