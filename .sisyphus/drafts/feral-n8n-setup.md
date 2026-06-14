# Draft: feral Project — n8n Remote Setup & Workflow Check

## Project Understanding

### What is `feral`?
- AI art automation project: 災害データ → 動物視点の生存シナリオ生成 → 画像プロンプト作成
- 思想: 「ペットや家畜が自然災害/人災後、野良化してサバイバルする」世界観
- ハイパーリアルな災害エコロジー、動物視点の構図

### Pipeline
1. USGS地震データ取得 (API)
2. 最大規模地震を選択 (n8n Code node)
3. feral SidecarにPOST (Python HTTPサーバ :8765)
4. Sidecar → OpenStreetMap Overpass検索 → プロンプトパケット生成
5. Prompt → OpenCodeレビュー → (将来) ComfyUI画像生成

### ディレクトリ構造
```
feral/
  agents/feral_sidecar.py     ← Python HTTP sidecar
  configs/sources.json         ← USGS, Overpass, ComfyUI設定
  database/schema.sql          ← SQLiteスキーマ
  workflows/n8n/               ← インポート可能なn8nワークフローJSON ✅
  outputs/runs/                ← 実行結果格納先
  notes/research/              ← 設計ノート
```

## 現状調査結果

### n8n
- **場所**: `/media/kz003/atelier/forge/n8n/` (Docker Compose)
- **データ**: `/media/kz003/atelier/forge/n8n-data/` に既存DBあり
  - ワークフロー: 1件 ("My First workflow", inactive)
  - 暗号化キー: `config` ファイルにあり
  - DB: SQLite 790KB
- **状態**: コンテナ未起動

### ネットワーク
- **ホスト**: `tomubuntu`
- **LAN IP**: `192.168.3.99`
- **Tailscale IP**: `100.123.190.33` ← MacBookから接続に使用
- **SSH**: port 22 オープン

### feral sidecar
- 未起動
- 設定: 127.0.0.1:8765

## User Decisions (Confirmed)
- **n8n**: `/media/kz003/atelier/forge/n8n/` のDocker Composeを使用
- **Remote接続**: Tailscale IP `100.123.190.33` 経由
- **Sidecar**: 両方セットアップ (n8n + feral sidecar)
