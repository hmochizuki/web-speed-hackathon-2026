# 改善タスク一覧

## 対応必須（VRT失敗の修正）

- [ ] 037-AspectRatioBox CSS aspect-ratio化によるVRT失敗を修正する（投稿クリック遷移・動画自動再生）

## 優先度: 最高（ユーザーフロー計測不可・TBT/LCP 0点の解消）

- [ ] 040-検索のReDoS正規表現を修正する（検索フロー+50点、search/services.tsのsincePattern/untilPattern/isValidDateがReDoS）
- [ ] 041-ホームページの初期データをサーバー側で注入してLCP/TBTを改善する（ホーム+40-60点、投稿フロー+50点連鎖）
- [ ] 043-音声波形計算をWeb Workerに移動してTBTを改善する（音声投稿+29点、SoundWaveSVGのdecodeAudioData+ピーク計算）
- [ ] 042-利用規約ページをlazy loadから外しLCPを改善する（利用規約+20-25点、静的テキストなのにCSR依存）
- [ ] 044-認証フォームをuncontrolled化してTBTを改善する（ユーザー登録TBT+25点、controlled inputで90回re-render）

## 優先度: 高（INP/LCP改善）

- [ ] 045-DM送信の楽観的更新とフォーム最適化でINPを改善する（DM送信INP+25点、同期sendJSON+全会話再取得）
- [ ] 046-写真投稿ページのLCPをpreloadで改善する（写真投稿LCP+10-20点、サーバー側Link preload）
- [ ] 035-フォントのpreloadヘッダーを追加する（全ページFCP微改善）

## 優先度: 中（追加改善）

- [ ] 010-CSSをクリティカルCSS分離する
- [ ] 036-タイムラインに仮想スクロールを導入する
- [x] 038-SSGでタイムラインと利用規約ページをビルド時プリレンダリングする → タスク041/042に統合

## 完了済み

- [x] 012-InfiniteScrollの2^18ループを除去する
- [x] 013-postsAPIをサーバーサイドページネーションにする
- [x] 014-Tailwind CSSをビルド時処理に変更する
- [x] 015-window.loadイベント待ちを即時レンダリングに変更する
- [x] 004-jQueryをfetch APIに置き換える
- [x] 024-foundation/LinkをReact RouterのLinkに変更してSPAナビゲーションにする
- [x] 025-AspectRatioBoxのsetTimeout(500ms)をCSS aspect-ratioに置き換える
- [x] 026-DBの外部キーカラムにインデックスを追加する
- [x] 001-Webpackをproductionモードにする
- [x] 002-splitChunksを有効化する
- [x] 003-Babelターゲットをモダンブラウザにしてポリフィルを除去する
- [x] 007-CoveredImageのバイナリfetch+EXIF解析をAPI経由のalt取得に変更する
- [x] 016-React.lazyでルートベースコード分割する
- [x] 017-HTTP圧縮(compression)を追加する
- [x] 018-静的アセットのキャッシュヘッダーを有効化する
- [x] 019-Connection closeヘッダーを除去する
- [x] 027-1msポーリングをイベントリスナーに置き換える(setInterval/postTask)
- [x] 028-font-displayをblockからswapに変更する
- [x] 029-PausableMovie/SoundPlayerにIntersectionObserverで遅延fetchする
- [x] 030-DM APIで全メッセージ返却をやめて最新1件+ページネーションにする
- [x] 006-シード画像をAVIFに事前変換する
- [x] 011-ユーザーアップロード画像をサーバー側でAVIF変換する
- [x] 005-FFmpeg WASMを遅延読み込みにする
- [x] 008-動画・音声ファイルを最適化する
- [x] 020-momentをIntl.DateTimeFormatに置き換える
- [x] 021-重いライブラリを動的importにする(web-llm,katex,kuromoji等)
- [x] 022-SequelizeのdefaultScopeを最適化する
- [x] 023-devtoolのsource-mapを本番で無効化する
- [x] 031-imgタグにloading="lazy"を追加する
- [x] 032-Font Awesome SVGスプライトを使用アイコンのみに絞る
- [x] 033-lodashをnamed import(lodash-es)に変更してtree shakingを有効化する
- [x] 034-create()後の冗長なfindByPk/reloadを除去する
- [x] 039-AppContainerの/api/v1/me待ちによるレンダリングブロックを解消する
- [x] 009-フォント読み込みを最適化する（OTF→woff2変換済み）
- [x] 037-FFmpeg・ImageMagick WASMをクライアントから完全除去する
