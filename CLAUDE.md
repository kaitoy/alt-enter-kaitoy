# 山田海斗 自己紹介サイト — 開発ガイド

GitHub Pages で公開する一枚もの（シングルページ）の自己紹介サイト。コンテンツの元ネタは `contents.txt`。
このファイルは、後からセクションや要素を追加するときにデザインの一貫性を保つための指針。

## 全体方針

- **ビルドレスの静的サイト**。フレームワーク・バンドラ・npm依存なし。`index.html` / `css/style.css` / `js/main.js` の3ファイル + `images/` のみ。GitHub Pages にそのまま push できる状態を維持する。
- `.nojekyll` を置いてある（アンダースコア始まりパスの保険）。消さない。
- 画像ファイル名は **URL安全な半角英数字** にする（日本語ファイル名は使わない。例: `若松園.jpg` → `wakamatsuen.jpg`）。
- ローカル確認は `python -m http.server` でルートから配信して行う（`file://` だと相対パスやフォントで差が出る）。

## デザインコンセプト: 和モダン × テック

家業の老舗和菓子屋（若松園）というルーツと、クラウドアーキテクト/SRE という現在を結ぶ「和 × テック」。
キーワード: 深い藍の夜、金の差し色、墨流し、和紙、落款（朱の印）、明朝体。

### カラートークン（`:root` のCSS変数を必ず使う。生の色は書かない）

| 変数 | 用途 |
|---|---|
| `--ink` `--ink-2` `--ink-3` `--ink-deep` | 藍〜漆黒の背景階調。`--ink` が基調、`--ink-2` がセクション交互背景、`--ink-3` がパネル、`--ink-deep` がターミナル/フッター |
| `--kin` `--kin-bright` | 金（差し色・線・見出しアクセント）。多用しすぎず「差し色」に留める |
| `--kinari` `--kinari-dim` | 生成り（本文テキスト）。`--kinari-dim` は副次テキスト |
| `--shu` | 朱（落款印にのみ使う特別な色） |
| `--line` | 金の半透明罫線（境界・カード枠） |

背景は必ず濃藍系。白背景セクションは作らない（ロゴタイルなど要素単位での生成り地はOK）。

### タイポグラフィ（Google Fonts、3書体を使い分ける）

- `--font-display`（Shippori Mincho B1, 明朝）= 見出し・名前・年号・固有名詞。**和の品格はここで出す**
- `--font-body`（Zen Kaku Gothic New, ゴシック）= 本文・ラベル・チップ
- `--font-fude`（Yuji Syuku, 筆文字）= 落款の漢字・背景の大漢字のみ

英字ラベルは `letter-spacing` を広め（0.2〜0.45em）+ uppercase で「テック」の記号性を出す。

### モーション原則

- **アニメーションは `transform` と `opacity` のみ**（コンポジタ処理。`width`/`height`/`top` 等はアニメートしない）。
- スクロール演出は **CSS Scroll-Driven Animations が第一選択**。新規要素にも `@supports ((animation-timeline: view()) and (animation-range: entry))` ガード内で実装する（`css/style.css` 末尾のブロック）。
- **3段構えのアクセシビリティを必ず維持**:
  1. ネイティブ: `@supports` 内の scroll-driven animation
  2. フォールバック: 非対応ブラウザは `js/main.js` が `html.no-sda` を付与 → CSSの `html.no-sda ...` ルール + IntersectionObserver で `.in-view` を付けて transition 表示
  3. `@media (prefers-reduced-motion: reduce)`: 全モーション停止・コンテンツ常時可視
- イージングは変数を使う: `--ease-spring`（弾む系: チップ・ボタン・ホバー）、`--ease-out`（出現・スライド系）。
- 演出は「高インパクトな瞬間」に集約（名前の墨滲み＋落款スタンプ、金線の伸び、キヨシの爆発）。微振動を散らさない。

## サイト構成

各セクションは漢字一文字のテーマを持つ縦スクロールの物語: **序 → 人 → 歩 → 技 → 発 → 遊**。
流れは「人となり → 人生の歩み → 仕事の歩み → アウトプット → 遊び心」。

| # | id | 漢字 | 内容 | 特徴的な仕掛け |
|---|---|---|---|---|
| 序 | `.hero` | — | 名前・肩書き | 墨流しSVG/金粒子/和紙の多層パララックス、墨滲みで名前出現、朱の落款スタンプ |
| 1 | `#profile` | 人 | プロフィール、趣味・特技・好物・苦手 | 金縁円形写真、チップのスタッガー出現 |
| 2 | `#journey` | 歩 | 来歴（1983〜2023の8エピソード） | 中央の金線が伸びるタイムライン、左右交互スライドイン、写真パララックス |
| 3 | `#career` | 技 | 職務経歴（四章構成） | 章ごとに技術ロゴが降る。現職章は無限マーキー |
| 4 | `#community` | 発 | GitHub/ブログ/Qiita の実績 | 数字のカウントアップ |
| 5 | `#zundoko` | 遊 | ズンドコキヨシ（ツイート/2記事/実機デモ） | ターミナル風インタラクティブデモ＋紙吹雪 |

### 共通セクションの型（新セクション追加時はこれに従う）

```html
<section class="section[ section-alt]" id="...">
  <span class="section-kanji" aria-hidden="true">◯</span>  <!-- 背景の大漢字 -->
  <div class="container">
    <header class="section-head reveal">
      <p class="section-label">English Label</p>
      <h2 class="section-title">日本語タイトル</h2>
    </header>
    ...
  </div>
</section>
```

- 背景色を交互にするため、セクションを増やすときは `.section` と `.section-alt` を交互にする。`.section-kanji` はそのテーマの漢字一文字。
- 出現させたい要素には `.reveal` を付ける（scroll-driven / フォールバック両方が拾う）。
- スタッガー（時間差）させる子要素には `style="--d:0"` のように連番 index を振る（チップ・ロゴタイルと同じ仕組み）。

## JavaScript の役割（`js/main.js`、これ以上肥大させない方針）

1. ヒーローの金粒子を生成（装飾、reduced-motion時は省略）
2. scroll-driven 非対応時のフォールバック（`html.no-sda` + IntersectionObserver）
3. 統計のカウントアップ
4. マーキーのシームレスループ用に要素を複製
5. ズンドコデモ（ズン×4→ドコで「キ・ヨ・シ！」判定 + 紙吹雪）

新機能もバニラJSで。ライブラリは入れない。`prefers-reduced-motion` 分岐を必ず入れる。

## コンテンツ追加時のチェックリスト

- [ ] 色は `:root` 変数を使ったか（生の hex を書いていないか）
- [ ] 見出しは明朝（`--font-display`）、筆文字は落款/大漢字のみか
- [ ] アニメは `transform`/`opacity` のみか
- [ ] scroll-driven 実装に対応する `html.no-sda` フォールバックと reduced-motion 配慮を入れたか
- [ ] 画像は半角英数字ファイル名で `images/` に置いたか
- [ ] モバイル幅（〜760px）でレイアウトが崩れないか（`@media (max-width: 760px)` を確認）
- [ ] `python -m http.server` 配信で全アセットが 200 か
