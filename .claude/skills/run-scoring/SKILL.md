---
name: run-scoring
description: スコアリングを実行する。GitHub Issue #22 に `/retry` コメントしてスコア計測をトリガーし、完了を待機して結果を報告する。「スコア」「scoring」「スコアリング」「計測」「スコア計測」「点数」といったリクエストで発動する。
---

# スコアリング実行

GitHub Issue に `/retry` コメントを投稿してスコア計測をトリガーし、完了を待機して結果を報告する。

## 手順

Agent ツールで `run-scoring` subagent を起動する。
- subagent_type は指定しない（general-purpose）
- プロンプト: 「スコアリングを実行してください」
- run_in_background: true（計測に最大20分かかるため）

subagent が完了したら結果をそのままユーザーに表示する。
