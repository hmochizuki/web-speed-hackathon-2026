# 032-Font Awesome SVGスプライトを使用アイコンのみに絞る

## 概要

Font Awesome SVGスプライトが全アイコン（1,612個、約1.2MB）を含んでいるが、実際に使用しているのは18個のみ。不要なアイコンを除去してネットワーク転送量を削減する。

## 方針

- 使用アイコンのみを含むSVGファイルに手動で書き換え
- brands.svgは完全未使用のため削除

## 変更が必要な箇所

1. `application/public/sprites/font-awesome/solid.svg` — 17アイコンのみに書き換え（640KB → 7.6KB）
2. `application/public/sprites/font-awesome/regular.svg` — calendar-altのみに書き換え（108KB → 1.2KB）
3. `application/public/sprites/font-awesome/brands.svg` — 削除（460KB → 0KB）

## 使用アイコン

solid: arrow-down, arrow-right, balance-scale, circle-notch, edit, envelope, exclamation-circle, home, images, music, paper-plane, pause, play, search, sign-in-alt, user, video
regular: calendar-alt

## 注意事項

- ビルド設定変更不要（publicディレクトリはserve-staticで直接配信）
- VRT影響なし（アイコンのsymbol定義は同一）
