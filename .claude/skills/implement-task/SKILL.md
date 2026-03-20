---
name: implement-task
description: パフォーマンス改善タスクの一連のワークフロー（タスク確認→計画立案→実装→検証→コミット）を実行する。「タスク実装」「implement」「タスクやって」「次のタスク」「タスク進めて」といったリクエストで発動する。タスクIDや説明を引数として受け取れる。
---

# パフォーマンス改善タスク実装ワークフロー

タスクの確認から実装・検証・コミットまでを一貫して実行する。
各ステップでユーザー確認を挟み、レギュレーション違反や検証漏れを防ぐ。

## 引数

- 引数なし: `temp/todo_list.md` の未完了タスクを一覧表示し、ユーザーに選択させる
- `<タスクID or タスク名>`: 指定タスクを直接開始（例: `013`, `013-postsAPIをサーバーサイドページネーションにする`）
- `--continue`: 中断したタスクの続きから再開

---

## ステップ1: タスク確認

### 1-1. タスク一覧の読み込み

Read ツールで `temp/todo_list.md` を読み込む。

### 1-2. タスクの特定

- **引数あり**: 引数に一致するタスクを todo_list.md から探す。見つからなければ新規タスクとして追加するか確認する。
- **引数なし**: 未完了タスク（`- [ ]`）を優先度順に一覧表示し、ユーザーに選択を求める。

### 1-3. タスク詳細の確認

`temp/<タスクID>-<タスク名>.md` が存在すれば Read ツールで読み込む。
存在しなければ、以下の雛形で新規作成する:

```markdown
# <タスクID>-<タスク名>

## 概要

## 方針

## 変更が必要な箇所

## 注意事項
```

### 1-4. ユーザー確認

対象タスクの内容をユーザーに提示し、このタスクを進めてよいか確認する。
追加の要件や方針があれば受け取る。

---

## ステップ2: 実行計画立案

### 2-1. コードベース調査

対象タスクに関連するコードを Grep / Read / Glob で調査する。
- 変更対象のファイル特定
- 既存の実装パターンの把握
- 依存関係の確認

### 2-2. レギュレーション影響の事前確認

以下の観点で、計画がレギュレーション違反を引き起こさないか確認する:
- `fly.toml` を変更する必要があるか → **変更禁止**、別の方法を検討
- シードデータの ID を変更する必要があるか → **変更禁止**、別の方法を検討
- SSE プロトコル（crok）に影響するか
- `docs/test_cases.md` の手動テスト項目に影響する機能を変更するか → 影響する項目を列挙

### 2-3. E2E テストの事前確認

`application/e2e/src/` 配下の関連テストファイルを Read で確認し、実装で影響を受ける可能性のあるテストを特定する。

対象テストファイル:
- `home.test.ts`, `auth.test.ts`, `posting.test.ts`, `post-detail.test.ts`
- `crok-chat.test.ts`, `dm.test.ts`, `search.test.ts`
- `user-profile.test.ts`, `terms.test.ts`, `responsive.test.ts`

### 2-4. 手動テスト影響範囲の特定

`docs/test_cases.md` を参照し、実装で影響を受ける手動テスト項目を列挙する。
実装後にこれらの項目を重点的にコード上で確認する。

### 2-5. 実行計画の提示

以下の形式でユーザーに計画を提示する:

```
## 実行計画: <タスク名>

### 変更ファイル
1. `path/to/file` — 変更内容

### レギュレーション影響
- （影響なし / 影響ありの場合はその内容）

### 影響する E2E テスト
- （テスト名と影響の概要）

### 影響する手動テスト項目
- （項目と確認ポイント）

### リスク・注意点
- （特記事項）
```

### 2-6. ユーザー承認

計画についてユーザーの承認を得る。修正要望があれば反映する。

---

## ステップ3: 実装

### 3-1. タスク詳細ファイルの更新

`temp/<タスクID>-<タスク名>.md` にステップ2で策定した方針・変更箇所・注意事項を記載する。

### 3-2. 実装の実行

計画に基づいてコードを変更する。

実装中の原則:
- TypeScript の型チェック (`cd application && pnpm run typecheck`) をこまめに実行する
- `any` および `as` の使用禁止
- コードコメントは控える
- 1つの論理的な変更単位ごとに動作を意識する

### 3-3. ビルド確認

```bash
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application && pnpm run build
```

ビルドエラーがあれば修正する。

---

## ステップ4: 検証

### 4-1. 静的レギュレーションチェック

Agent ツールで `check-regulation` subagent を起動する:
- subagent_type は指定しない（general-purpose）
- プロンプト: 「レギュレーション違反の静的チェックを実行してください」

FAIL があれば修正してから次に進む。

### 4-2. E2E/VRT 実行

以下の手順でテストを実行する。

**ポート番号の決定**: タスクIDの数値部分をポート番号に使う。例: タスクID `005` → ポート `3005`、タスクID `013` → ポート `3013`。以降 `$PORT` はこの値を指す。

1. 既に対象ポートで起動中のサーバーがあれば停止:
   ```bash
   lsof -i :$PORT -t | xargs kill 2>/dev/null || true
   ```

2. ビルド（ステップ3-3で成功していればスキップ）:
   ```bash
   cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application && pnpm run build
   ```

3. サーバーをバックグラウンドで起動:
   ```bash
   cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application && PORT=$PORT pnpm run start
   ```
   （run_in_background: true）

4. サーバー起動待機:
   `curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/` で 200 が返るまでリトライ（最大60秒）

5. DB 初期化:
   ```bash
   curl -s -X POST http://localhost:$PORT/api/v1/initialize
   ```

6. テスト実行:
   ```bash
   cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application && E2E_BASE_URL=http://localhost:$PORT pnpm run test
   ```
   （timeout: 300000）

7. サーバー停止:
   ```bash
   lsof -i :$PORT -t | xargs kill 2>/dev/null || true
   ```

### 4-3. 手動テスト項目のコード確認

ステップ2-4で特定した影響範囲の手動テスト項目について、コード上で機能が保持されていることを確認する。
Grep ツールで関連キーワードを検索し、機能の存在を確認する。

### 4-4. 検証結果の報告

以下の形式でユーザーに報告する:

```
## 検証結果: <タスク名>

| 検証項目 | 結果 | 詳細 |
|----------|------|------|
| レギュレーション（静的） | PASS/FAIL | ... |
| E2E/VRT | PASS/FAIL (N/M テスト通過) | ... |
| 手動テスト項目（コード確認） | PASS/FAIL | ... |
| ビルド | PASS/FAIL | ... |
| 型チェック | PASS/FAIL | ... |

### 懸念点
- （あれば記載）
```

### 4-5. ユーザー確認

検証結果を確認してもらい、コミットに進んでよいか確認する。
- 全項目 PASS かつ懸念点なし → ステップ5へ
- FAIL または懸念点あり → 修正してステップ4を再実行

---

## ステップ5: コミットとタスク更新

### 5-1. コミット

1. `git status` で変更ファイルを確認
2. `git diff` で差分を確認
3. 関連ファイルを `git add` でステージング
4. Conventional Commits 形式（日本語）でコミット

コミットメッセージの形式:
```
<type>: <タスク名の日本語概要>

<変更の詳細（なぜ・何を）>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

type: feat / fix / refactor / perf / chore から適切なものを選択。

### 5-2. todo_list.md の更新

`temp/todo_list.md` の該当タスクを `- [x]` に変更する。

### 5-3. 完了報告

ユーザーに以下を報告する:
- コミットハッシュ
- 変更ファイル一覧
- バンドルサイズへの影響が気になる場合は `/check-bundle-size` の実行を提案
