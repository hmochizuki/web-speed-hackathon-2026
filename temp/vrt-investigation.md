# VRT失敗 調査ログ

## 調査日: 2026-03-20

## テスト環境
- worktree-vrt-fix ブランチ (HEAD: `89c2fde`)
- VRTスナップショット: initial commit (`d0f9f84`) 時点のベースライン（ローカル生成、git管理外）
- サーバー: localhost:3333
- Playwright: Desktop Chrome, maxDiffPixelRatio: 0.03

---

## 安定して失敗するテスト（`89c2fde` = worktree-vrt-fix HEAD）

| # | テストファイル | テスト名 | エラー種別 |
|---|-------------|---------|-----------|
| 1 | home.test.ts:54 | 投稿クリック → 投稿詳細に遷移する | `page.waitForURL` タイムアウト |
| 2 | home.test.ts:29 | 動画が自動再生される | `isPlaying === false` (不安定: 3回中0-1回成功) |
| 3 | post-detail.test.ts:10 | 投稿が表示される | `page.waitForURL` タイムアウト |
| 4 | post-detail.test.ts:27 | タイトルが「{ユーザー名} さんのつぶやき - CaX」 | `page.waitForURL` タイムアウト |
| 5 | crok-chat.test.ts:13 | サジェスト候補が表示される | タイムアウト (flaky) |
| 6 | dm.test.ts:83 | 送信ボタンをクリックすると、DM詳細画面に遷移する | タイムアウト (flaky) |

---

## bisect 結果

### 問題コミット: `79cda7c` (perf: AspectRatioBoxのsetTimeout(500ms)をCSS aspect-ratioに置き換える)

**確認手順:**
- `3af37e5` (直前の実コード変更): #1,2,3,4 全てパス
- `79cda7c`: #1,3,4 確実に失敗、#2 3回中3回失敗
- `79cda7c` と `3af37e5` の間のコミット (`e602a23`, `865aef0`) はchoreのみでコード変更なし

**変更内容:**
```diff
- // setTimeout(500ms) + clientWidth計算で高さを決定
- // clientHeight === 0 の間は子要素をレンダリングしない
+ // CSS aspect-ratio で即時レンダリング
```

変更前: `setTimeout(500ms)` で `clientWidth` → `clientHeight` を計算、計算完了まで子要素（video含む）をレンダリングしない
変更後: CSS `aspect-ratio` で即座にレンダリング

**#1,3,4 (投稿クリック→遷移失敗) の原因推定:**
- テストは `article.click()` で article 要素の**中央**をクリック
- AspectRatioBox のレイアウト変更で article 内のコンテンツ配置が変わり、中央クリックがリンク要素に当たらなくなった
- `page.waitForURL("**/posts/*")` はデフォルトで `load` イベントを待つ
- SPAナビゲーション（React Router Link）では `load` イベントが発火しないため、URLが変わってもタイムアウトする可能性もある

**#2 (動画自動再生失敗) の原因推定:**
- 変更前: 500ms遅延後にvideo要素がDOMに追加 → autoplay開始
- 変更後: 即座にvideo要素がDOMに追加 → autoplayのタイミングが変わる
- video要素が即座にレンダリングされるが、ソースの読み込みが完了していない状態でautoplayが発火し、readyState < 2 のまま

### #5, #6 (crok-chat, DM) について

- `79cda7c` ではパス
- `89c2fde` では失敗
- `79cda7c` 〜 `89cda7c` の間のコミットはDBインデックス追加とchoreのみ（UI変更なし）
- **結論: flaky（テスト不安定）** — 環境依存のタイムアウト

---

## VRTスクリーンショット比較テスト

`d062811`（`79cda7c` の直前のコード変更地点）で以下のVRTスクリーンショット比較テストは全てパス:
- home-タイムライン（サインイン前）: パス
- home-404: パス
- responsive-スマホ: パス
- responsive-デスクトップ: パス

**注意:** スナップショットはローカル環境で生成されたため、`d062811` までの変更（AVIF変換、moment→Intl.DateTimeFormat等）はスナップショット生成時に既に反映されていた可能性がある。

---

## 結論

### 根本原因
**`79cda7c`** (AspectRatioBox の setTimeout(500ms) → CSS aspect-ratio 置き換え) が以下を壊している:
1. 投稿クリック → 遷移テスト（3件）
2. 動画自動再生テスト（1件）

### flaky テスト（コード起因ではない）
- crok-chat サジェスト表示
- DM 送信ボタン遷移

### 次のアクション候補
- `79cda7c` の変更を修正して、CSS aspect-ratio を維持しつつ `article.click()` がリンクに当たるようにする
- video autoplay のタイミング問題を修正する

---

## 再調査: 2026-03-21 12:30〜13:20 JST

### テスト環境
- ブランチ: main (HEAD: `4396784`)
- VRTスナップショット: `temp/backup-jpg/e2e-initial-commit-snapshots`（初期コミット `d0f9f84` 時点）を正として使用
- サーバー: ポート4001、`node --import tsx/esm` で直接起動（pnpm経由だとテスト中にSIGTERM(143)でクラッシュ）
- Playwright: Desktop Chrome, maxDiffPixelRatio: 0.03, workers: 5

### 結果: 52テスト中 Pass: 43 / Fail: 9

#### 安定して失敗（3件）— 投稿詳細ナビゲーション — 対応保留

| # | テスト | エラー |
|---|---|---|
| 1 | `home.test.ts:52` 投稿クリック→投稿詳細に遷移する | `page.waitForURL("**/posts/*")` 30秒タイムアウト |
| 2 | `post-detail.test.ts:10` 投稿が表示される | 同上 |
| 3 | `post-detail.test.ts:27` タイトルが「○○さんのつぶやき」 | 同上 |

前回調査（2026-03-20）と同じ。根本原因は `79cda7c` のAspectRatioBox変更。未修正。

#### VRT差分（2件）— 問題なしと判断

| # | テスト | 差分率 | 差分内容 |
|---|---|---|---|
| 4 | `search.test.ts:93` 検索結果が表示される | 6% | expected: 画像未ロード(グレー空白) → actual: 画像正常表示。パフォーマンス改善で画像表示が速くなった結果 |
| 5 | `user-profile.test.ts:17` ユーザーサムネ色抽出 | 6% | ヘッダー背景色・レイアウトは一致。投稿内の画像/動画コンテンツ表示タイミング差のみ |

#### Flaky（4件）— 問題なしと判断

| # | テスト | 2回目実行 | 4回目実行 | fail時差分率 |
|---|---|---|---|---|
| 6 | `crok-chat.test.ts:40` AI応答が表示される | fail | **pass** | 4% |
| 7 | `posting.test.ts:40` 画像の投稿ができる | fail | **pass** | 4% |
| 8 | `responsive.test.ts:6` スマホ表示 | fail | **pass** | 4% |
| 9 | `responsive.test.ts:29` デスクトップ表示 | fail | **pass** | 6% |

画像/動画ロードタイミングの揺れ。安定環境ではpass。

#### 前回（2026-03-20）との差分

| テスト | 前回 | 今回 | 変化 |
|---|---|---|---|
| `home.test.ts:29` 動画自動再生 | fail (不安定) | **pass** | 改善 |
| `crok-chat.test.ts:13` サジェスト候補 | fail (flaky) | **pass** | 改善 |
| `dm.test.ts:83` DM送信→遷移 | fail (flaky) | **pass** | 改善 |

### 結論

- **対応必須**: 投稿詳細ナビゲーション3件（保留中、根本原因は `79cda7c`）
- **問題なし**: VRT差分2件（デザイン変更なし、画像表示改善由来）
- **問題なし**: Flaky 4件（タイミング依存、安定実行ではpass）
