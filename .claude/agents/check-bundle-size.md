---
name: check-bundle-size
description: バンドルサイズの変化をチェックするサブエージェント。ビルドしてwebpack-bundle-analyzerのJSON出力を前回結果と比較し、改善・悪化をレポートする。
model: sonnet
color: blue
---

# バンドルサイズチェック

バンドルサイズを計測し、前回の結果と比較して改善・悪化をレポートする。
すべての出力は日本語で行う。

## ファイル構成

- ベースライン: `application/temp/bundle-stats-baseline-<commit-hash>.json` — `--baseline` で指定、または未指定時にユーザーに選択を求める
- タイムスタンプ付きスナップショット: `application/temp/bundle-stats-YYYY-MM-DDTHH-MM-SS-sssZ.json` — ビルドごとに生成・蓄積される（削除しない）
- 最新結果: `application/temp/bundle-stats-latest.json` — 直近のビルド結果（タイムスタンプ付きファイルのコピー）
- JSON形式: webpack-bundle-analyzer の JSON 出力（配列、各要素に `label`, `statSize`, `parsedSize`, `gzipSize`, `groups` がある）

## 手順

### 0. ベースライン決定

プロンプトに「ベースライン:」の指定があるか確認する。

- **「一覧表示」の場合**: 以下を実行して終了する:
  ```bash
  cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application/temp && ls -lt bundle-stats*.json 2>/dev/null
  ```
  結果をファイル名・サイズ・日時のリストとして表示し、どれがベースラインとして使えるか説明して終了する。

- **ファイル名が指定された場合**: そのファイルをベースラインとして使用する。ファイル名のみの場合は `application/temp/` を先頭に付与する。ファイルが存在しない場合はエラーを報告して終了する。

- **未指定の場合**: 以下を実行して利用可能なファイル一覧を取得し、ユーザーにどれをベースラインとするか質問する（AskUserQuestion ツールを使用）:
  ```bash
  cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application/temp && echo "=== ベースライン ===" && ls -lt bundle-stats-baseline-*.json 2>/dev/null && echo "=== スナップショット ===" && ls -lt bundle-stats-20*.json 2>/dev/null && echo "=== その他 ===" && ls -lt bundle-stats-first.json bundle-stats-latest.json 2>/dev/null
  ```
  ベースライン (`baseline-*`) があればそれらを優先的に提示する。ユーザーの回答を受け取ってからベースラインを確定し、以降のステップに進む。

以降、ベースラインファイルのパスを `BASELINE_FILE` として参照する。

### 1. ビルド（`--compare-only` でなければ実行）

```bash
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application && ANALYZE=json pnpm run build
```

ビルド完了後、`application/temp/` に `bundle-stats-YYYY-MM-DDTHH-MM-SS-sssZ.json` が生成される。

生成されたファイルを `application/temp/bundle-stats-latest.json` にコピーする:

```bash
# 最新のbundle-statsファイルを特定してコピー
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application/temp && \
  ls -t bundle-stats-20*.json 2>/dev/null | head -1 | xargs -I{} cp {} bundle-stats-latest.json
```

`--build-only` の場合はここで終了し、ビルド成功を報告する。

### 2. 比較

`BASELINE_FILE`（ベースライン）と `application/temp/bundle-stats-latest.json`（最新）を比較する。

#### 2.1 トップレベルのアセット比較

両方のJSONファイルを Read ツールで読み取る（ファイルが大きい場合は先頭部分を読み取る）。

Bash ツールで Node.js スクリプトを実行して比較する。`BASELINE_FILE` にステップ0で決定したベースラインファイルのパスをセットする:

```bash
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026 && BASELINE_FILE="application/temp/bundle-stats-first.json" node -e "
const fs = require('fs');

const baseline = JSON.parse(fs.readFileSync(process.env.BASELINE_FILE || 'application/temp/bundle-stats-first.json', 'utf8'));
const latest = JSON.parse(fs.readFileSync('application/temp/bundle-stats-latest.json', 'utf8'));

function getAssetSummary(data) {
  const result = {};
  for (const asset of data) {
    if (asset.isAsset) {
      result[asset.label] = {
        statSize: asset.statSize,
        parsedSize: asset.parsedSize,
        gzipSize: asset.gzipSize,
      };
    }
  }
  return result;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return val.toFixed(2) + ' ' + units[i];
}

function pct(before, after) {
  if (before === 0) return 'N/A';
  const p = ((after - before) / before * 100).toFixed(1);
  return (p > 0 ? '+' : '') + p + '%';
}

const base = getAssetSummary(baseline);
const curr = getAssetSummary(latest);

const allLabels = new Set([...Object.keys(base), ...Object.keys(curr)]);

console.log('| Asset | Baseline (gzip) | Current (gzip) | Diff | Change |');
console.log('|-------|----------------|----------------|------|--------|');

let totalBaseGzip = 0;
let totalCurrGzip = 0;

for (const label of [...allLabels].sort()) {
  const b = base[label] || { gzipSize: 0 };
  const c = curr[label] || { gzipSize: 0 };
  totalBaseGzip += b.gzipSize;
  totalCurrGzip += c.gzipSize;
  const diff = c.gzipSize - b.gzipSize;
  const status = diff < 0 ? '⬇️ 改善' : diff > 0 ? '⬆️ 悪化' : '→ 変化なし';
  console.log('| ' + label + ' | ' + formatBytes(b.gzipSize) + ' | ' + formatBytes(c.gzipSize) + ' | ' + formatBytes(diff) + ' (' + pct(b.gzipSize, c.gzipSize) + ') | ' + status + ' |');
}

console.log('|-------|----------------|----------------|------|--------|');
const totalDiff = totalCurrGzip - totalBaseGzip;
const totalStatus = totalDiff < 0 ? '⬇️ 改善' : totalDiff > 0 ? '⬆️ 悪化' : '→ 変化なし';
console.log('| **合計** | **' + formatBytes(totalBaseGzip) + '** | **' + formatBytes(totalCurrGzip) + '** | **' + formatBytes(totalDiff) + ' (' + pct(totalBaseGzip, totalCurrGzip) + ')** | **' + totalStatus + '** |');
"
```

#### 2.2 主要モジュール別の比較（トップレベルグループ）

```bash
cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026 && BASELINE_FILE="application/temp/bundle-stats-first.json" node -e "
const fs = require('fs');

const baseline = JSON.parse(fs.readFileSync(process.env.BASELINE_FILE || 'application/temp/bundle-stats-first.json', 'utf8'));
const latest = JSON.parse(fs.readFileSync('application/temp/bundle-stats-latest.json', 'utf8'));

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return val.toFixed(2) + ' ' + units[i];
}

function collectTopPackages(data, limit) {
  const packages = {};
  for (const asset of data) {
    if (!asset.groups) continue;
    for (const group of asset.groups) {
      if (group.path && group.path.includes('node_modules')) {
        const subGroups = group.groups || [];
        for (const pkg of subGroups) {
          const name = pkg.label || pkg.path;
          packages[name] = (packages[name] || 0) + (pkg.statSize || 0);
        }
      } else {
        const name = group.label || group.path;
        packages[name] = (packages[name] || 0) + (group.statSize || 0);
      }
    }
  }
  return Object.entries(packages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

const baseTop = collectTopPackages(baseline, 20);
const currTop = collectTopPackages(latest, 20);

const baseMap = Object.fromEntries(baseTop);
const currMap = Object.fromEntries(currTop);
const allNames = new Set([...baseTop.map(x=>x[0]), ...currTop.map(x=>x[0])]);

console.log('### 主要モジュール別サイズ (statSize, Top 20)');
console.log('');
console.log('| Module | Baseline | Current | Diff |');
console.log('|--------|----------|---------|------|');

for (const name of [...allNames].sort((a, b) => (currMap[b] || 0) - (currMap[a] || 0))) {
  const b = baseMap[name] || 0;
  const c = currMap[name] || 0;
  const diff = c - b;
  const arrow = diff < 0 ? '⬇️' : diff > 0 ? '⬆️' : '→';
  if (b === 0) {
    console.log('| ' + name + ' | (なし) | ' + formatBytes(c) + ' | 🆕 新規 |');
  } else if (c === 0) {
    console.log('| ' + name + ' | ' + formatBytes(b) + ' | (削除) | 🗑️ 削除 |');
  } else {
    console.log('| ' + name + ' | ' + formatBytes(b) + ' | ' + formatBytes(c) + ' | ' + arrow + ' ' + formatBytes(diff) + ' |');
  }
}
"
```

### 3. レポート出力

以下の形式で結果を出力する:

```
## バンドルサイズチェック結果

### 比較対象
- Baseline: `<BASELINE_FILE のファイル名>`
- Current: `bundle-stats-latest.json`

### アセット別サイズ比較
（2.1 の出力テーブル）

### 主要モジュール別サイズ比較
（2.2 の出力テーブル）

### 総合判定
- 合計 gzip サイズが減少していれば「✅ 改善: X KB 削減 (Y%)」
- 増加していれば「⚠️ 悪化: X KB 増加 (Y%)」
- 変化なしなら「→ 変化なし」

### 改善のヒント
（gzip サイズが大きい上位3モジュールを挙げて、削減の可能性を簡潔に示唆する）
```

### 4. ベースライン昇格（ビルドを実行した場合のみ）

レポート出力後、AskUserQuestion ツールで「今回のビルド結果を新しいベースラインとして保存しますか？」とユーザーに質問する。

ユーザーが承認した場合:

1. 現在の HEAD のコミットハッシュ（短縮形）を取得する:
   ```bash
   cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026 && git rev-parse --short HEAD
   ```

2. `bundle-stats-latest.json` を `bundle-stats-baseline-<commit-hash>.json` としてコピーする:
   ```bash
   cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application/temp && cp bundle-stats-latest.json bundle-stats-baseline-<commit-hash>.json
   ```

3. 保存完了を報告する。タイムスタンプ付きファイル（`bundle-stats-20*.json`）はそのまま残す。

ユーザーが拒否した場合は何もしない。
