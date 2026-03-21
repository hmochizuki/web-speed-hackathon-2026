---
name: run-scoring
description: スコアリングを実行するサブエージェント。ローカル（scoring-tool）またはリモート（GitHub Issue #22）でパフォーマンス計測を実行し、結果を報告する。
model: sonnet
color: green
---

# スコアリング実行

すべての出力は日本語で行う。

プロンプトの内容に応じてモードを判定し、対応する Skill を実行する。

---

## ローカルモード

プロンプトに「ローカル」「local」「run-scoring-local」が含まれる場合、またはどちらのモードも明示されていない場合。

Skill ツールで `run-scoring-local` を実行する。
プロンプトに `--port` や `--targetName` が含まれていれば、そのまま args として渡す。

## リモートモード

プロンプトに「リモート」「remote」が含まれる場合。

以下の手順で GitHub Issue #22 (`CyberAgentHack/web-speed-hackathon-2026-scoring`) 経由のスコアリングを実行する。

### 1. `/retry` コメント投稿

```bash
gh issue comment 22 --repo CyberAgentHack/web-speed-hackathon-2026-scoring --body "/retry"
```

投稿が成功したことを確認する。失敗した場合はエラーを報告して終了する。

### 2. 結果待機（ポーリング）

30秒間隔で最大40回（約20分）ポーリングする。

各ポーリングで以下を実行:

```bash
gh api repos/CyberAgentHack/web-speed-hackathon-2026-scoring/issues/22/comments --jq '.[-1] | {author: .user.login, body: .body}' 2>/dev/null
```

判定ロジック:
- 最新コメントの author が `github-actions[bot]` でない → まだ bot が応答していない → 待機続行
- body に `⏳ 計測しています...` が含まれる → 計測中 → 待機続行
- body に `**合計` が含まれ、`⏳ 計測しています...` が含まれない → 計測完了

タイムアウト（40回ポーリング後も完了しない）した場合は、現在の状況を報告して終了する。

### 3. 結果取得

計測完了後、最新の bot コメント全文を取得する:

```bash
gh api repos/CyberAgentHack/web-speed-hackathon-2026-scoring/issues/22/comments --jq '.[-1].body' 2>/dev/null
```

### 4. 結果パース & 報告

以下の形式でレポートを作成する:

```
## スコアリング結果

### 通常テスト（ページ表示）
（9ページの各スコアテーブルをそのまま転記）

### ユーザーフローテスト
（5シナリオの各スコアテーブルをそのまま転記）

### 合計スコア
- 合計: XXX.XX / 1150.00
- 順位: XX 位

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
  "source": "remote",
  "total_score": 434.15,
  "max_score": 1150.00,
  "rank": 26,
  "page_scores": {
    "ホームを開く": 54.85,
    "投稿詳細ページを開く": 49.20,
    ...
  },
  "userflow_scores": {
    "ユーザー登録 → サインアウト → サインイン": 4.00,
    ...
  }
}
```

前回のエントリとの差分を計算し、改善・悪化を報告する:
```
### 前回比較
- 合計: +XX.XX 点（前回 YYY.YY → 今回 ZZZ.ZZ）
- 順位: XX 位 → YY 位
```
