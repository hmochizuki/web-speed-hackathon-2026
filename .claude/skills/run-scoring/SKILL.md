---
name: run-scoring
description: スコアリングを実行する。GitHub Issue #22 経由でリモート計測、またはscoring-toolでローカル計測する。「スコア」「scoring」「スコアリング」「計測」「スコア計測」「点数」といったリクエストで発動する。
---

# スコアリング実行

デフォルトはローカルモード（scoring-tool）。`--remote` や「リモート」「GitHub」が含まれる場合のみリモートモード。

## ローカルモード（デフォルト）

Agent ツールで `run-scoring` subagent を起動する。
- subagent_type は指定しない（general-purpose）
- プロンプト: 「Skill ツールで run-scoring-local を実行してください。」
- `--targetName` が指定されていれば、プロンプトに含める（例: 「Skill ツールで run-scoring-local を実行してください。引数: --targetName "ホームを開く"」）
- `--port` が指定されていれば、プロンプトに含める（例: 「Skill ツールで run-scoring-local を実行してください。引数: --port 8080」）
- run_in_background: true（計測に最大10分かかるため）

subagent が完了したら結果をそのままユーザーに表示する。

## リモートモード

Agent ツールで `run-scoring` subagent を起動する。
- subagent_type は指定しない（general-purpose）
- プロンプト: 「リモートスコアリングを実行してください」
- run_in_background: true（計測に最大20分かかるため）

subagent が完了したら結果をそのままユーザーに表示する。
