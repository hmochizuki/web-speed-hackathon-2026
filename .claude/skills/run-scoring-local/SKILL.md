---
name: run-scoring-local
description: scoring-toolでローカルスコアリングを実行する。「ローカルスコア」「ローカル計測」「local scoring」といったリクエストで発動する。
---

# ローカルスコアリング実行

scoring-tool を使ってローカル環境のパフォーマンスを計測する。

## オプション

- `--port <番号>`: 計測対象のポート番号（デフォルト: 3000）
- `--targetName "<計測名>"`: 特定の計測のみ実行
- `--targetName`（値なし）: 計測名一覧を表示

## 手順

### 1. サーバー稼働確認

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/ 2>/dev/null || echo "server not running"
```

200 以外が返った場合はエラーを報告して終了する。

### 2. scoring-tool の依存確認・インストール

```bash
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/scoring-tool && ls node_modules/.package-lock.json 2>/dev/null && echo "installed" || echo "not installed"
```

未インストールの場合:

```bash
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/scoring-tool && pnpm install --frozen-lockfile
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/scoring-tool && pnpm exec playwright install chromium
```

### 3. スコアリング実行

```bash
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/scoring-tool && pnpm start --applicationUrl http://localhost:<port>
```

`--targetName` が指定されている場合は `--targetName "値"` を末尾に追加する。

タイムアウトは 600000ms（10分）に設定する。

### 4. 結果パース & 報告

出力にはANSIエスケープシーケンスが含まれる。最終的な結果テーブルを読み取ってパースする。

以下の形式でレポートを作成する:

```
## ローカルスコアリング結果

### 通常テスト（ページ表示）
| テスト項目 | CLS (25) | FCP (10) | LCP (25) | SI (10) | TBT (30) | 合計 (100) |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... |

### ユーザーフローテスト
| テスト項目 | INP (25) | TBT (25) | 合計 (50) |
|---|---|---|---|
| ... | ... | ... | ... |

### 合計スコア
- 合計: XXX.XX / 1150.00

### 計測できなかった項目
（該当がある場合のみ）
- 項目名 | 理由
```

### 5. スコア履歴保存

`application/temp/scoring-history.json` にスコア履歴を追記する。

ファイルが存在しない場合は新規作成する。存在する場合は Read ツールで読み取り、配列に追加する。

各エントリの形式:
```json
{
  "timestamp": "2026-03-20T09:50:45Z",
  "source": "local",
  "total_score": 739.70,
  "max_score": 1150.00,
  "page_scores": {
    "ホームを開く": 37.25,
    "投稿詳細ページを開く": 85.50,
    ...
  },
  "userflow_scores": {
    "ユーザー登録 → サインアウト → サインイン": 4.50,
    ...
  }
}
```

前回のエントリとの差分を計算し、改善・悪化を報告する:
```
### 前回比較
- 合計: +XX.XX 点（前回 YYY.YY → 今回 ZZZ.ZZ）
```
