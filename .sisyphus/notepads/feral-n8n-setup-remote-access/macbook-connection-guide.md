# MacBookからn8nへのアクセスガイド

## 接続情報

| 項目 | 値 |
|------|-----|
| **URL** | `http://100.123.190.33:5678` |
| **接続方法** | Tailscale経由（同一ネットワーク） |
| **前提条件** | MacBookとtomubuntuの両方でTailscaleが動作していること |

## 初回セットアップ手順

1. **ブラウザで開く**
   ```
   http://100.123.190.33:5678
   ```

2. **Ownerアカウント作成**
   - 初回アクセス時、n8nがセットアップ画面を表示します
   - メールアドレス、パスワード、名前を入力してアカウント作成
   - 既存アカウントがある場合はログイン

3. **ワークフロー確認**
   - 左サイドバー → **Workflows** をクリック
   - ワークフローリストに **"feral - Disaster to Habitat Browser Sidecar"** が表示される

## feralワークフローの実行

### 実行前の確認事項
- [ ] feral sidecarが起動している（`http://127.0.0.1:8765/health` で確認）
- [ ] n8nコンテナが起動している

### 実行手順
1. n8n UIで "feral - Disaster to Habitat Browser Sidecar" ワークフローを開く
2. **"Execute Workflow"** ボタンをクリック（Manual Triggerノードから開始）
3. ワークフローが実行され、以下が行われる：
   - USGS地震データを取得
   - 最大規模の地震を選択
   - feral sidecarにデータを送信
   - sidecarがOpenStreetMapから周辺情報を取得
   - プロンプトパケットを生成

### 実行結果の確認
- 実行結果はn8n UIで確認可能
- 生成されたファイル：
  - `/media/kz003/atelier/feral/outputs/runs/<run_id>/prompt-packet.json`
  - `/media/kz003/atelier/feral/outputs/runs/<run_id>/browser-use-task.txt`
  - `/media/kz003/atelier/feral/outputs/runs/<run_id>/opencode-prompt-review.md`

## ワークフロー構成

```
Manual Trigger
  → Fetch USGS Significant Earthquakes (HTTP Request)
  → Select Disaster Seed (Code)
  → feral Sidecar Ingest (HTTP Request → 127.0.0.1:8765/ingest)
  → Prepare Human Review Packet (Code)
```

## トラブルシューティング

| 症状 | 対処法 |
|------|--------|
| n8nに接続できない | Tailscaleが両方のマシンで動作しているか確認 |
| ワークフロー実行時にエラー | sidecarが起動しているか確認 (`curl http://127.0.0.1:8765/health`) |
| sidecarが応答しない | `python3 /media/kz003/atelier/feral/agents/feral_sidecar.py` を再起動 |

## 関連ファイル

- **ワークフローJSON**: `/media/kz003/atelier/feral/workflows/n8n/feral-disaster-habitat-browser-sidecar.json`
- **Sidecar**: `/media/kz003/atelier/feral/agents/feral_sidecar.py`
- **設定**: `/media/kz003/atelier/feral/configs/sources.json`
- **出力**: `/media/kz003/atelier/feral/outputs/runs/`
