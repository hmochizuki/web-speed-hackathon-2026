# 060-Crok AIレスポンスの数式・コードブロックがMarkdownレンダリングされない問題を修正する

## 状況

- ストリーミング**完了後**はフルMarkdown（KaTeX + CodeBlock）が正しく表示されることを確認済み
- ストリーミング**中**は remarkGfm のみで軽量レンダリングしているため、数式やコードブロックが生テキスト表示になる
- タスク057（aeab22b）でTBT改善のために意図的に導入した制約

## 修正方針: 3秒おきフルMarkdownレンダリング

TBTへの影響を最小限にしつつ、ストリーミング中の体験を改善する。

### 修正対象ファイル

- `application/client/src/components/crok/ChatMessage.tsx`

### 実装内容

1. `isLastStreaming` が `true` のとき、3秒間隔タイマーで `shouldRenderFull` フラグを切り替え
2. `shouldRenderFull` が `true` の間はフルMarkdown（remarkMath + rehypeKatex + CodeBlock）でレンダリング
3. ストリーミング中の軽量Markdown にも `CodeBlock` コンポーネントを常時適用（KaTeXほど重くない）

### TBT影響の見積もり

- KaTeX 1回の処理: 通常数十ms
- 3秒に1回なのでTBTへの寄与は限定的
- 実際にブラウザで確認して採用判断する

## 検証方法

1. `cd application && pnpm run dev` で開発サーバー起動
2. Crokチャットで数式を含むプロンプトを送信（例: 「二次方程式の解の公式を教えて」）
3. ストリーミング中に3秒おきに数式・コードブロックが表示されるか確認
4. TBTへの体感的な影響を確認
5. 型チェック: `cd application && pnpm run typecheck`
