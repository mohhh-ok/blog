---
title: "【AI】動画の着せ替えは全段OSSでいけるか【Qwen-Image-Edit + Wan2.2-Animate】"
pubDate: 2026-07-31
categories: ["AI"]
---

こんにちは、フリーランスエンジニアのmohです。

動画に写っている人物の服を、参照画像で指定した服に差し替える「動画着せ替え」を、オープンウェイトのモデルだけで組めるか検証しました。人物も服もすべて生成モデルで自前調達し、同一素材で OSS 構成とクローズドモデルを比較しています。コードと全アセットは [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/07-31-outfit-swap-oss-vs-closed) に置きました。

## TL;DR

- ブレザーの差し替え(replace mode 経路)は **全段 OSS で成立**。Qwen-Image-Edit (Apache-2.0) → Wan2.2-Animate replace の 2 段で、商用クローズド (Kling O3 edit) と並べても遜色ない
- 着物の差し替え(move mode 経路)は**静止画段がすべてを決める**。静止画段で生じた丈の欠陥は、動画段では一切救済されずに全フレームへ伝播する。参照素材を正して追試したところ、**着物も全段 OSS で成立**した(追試 1)
- 背景のある動画では、replace mode は背景も顔も保持できる。**move mode は背景が種静止画側の「似て非なる背景」に置き換わり、顔もドリフトする**のが OSS 構成の残る構造的制約(追試 2)
- 動画段は「静止画の品質をそのまま動画に運ぶ装置」であって、品質を作る場所ではない。**品質ゲートは安い静止画段(と参照素材)に置く**のが正解

## パイプラインの分解

動画着せ替えを 1 モデルでやろうとせず、2 段に分解します。

1. 静止画段: 人物の静止画に、参照画像の服を着せ替える
2. 動画段: 着せ替え済み静止画へ、元動画のモーションを移植する

![動画着せ替えパイプライン全体像](./07-31-outfit-swap-pipeline.svg)

この分解が効くのは、失敗の 9 割が静止画段で起きるからです。静止画は 1 枚数セントで再生成・目視選別ができるので、高価な動画段(1 本数十セント)に入る前に品質を確定できます。

## 素材はすべて生成で作る

権利をクリーンにするため、素材も生成モデルで作りました。

- 服の参照画像 2 種: flux/dev で生成。タータンチェックのブレザー(柄の忠実度テスト)と紺の着物
- 人物: flux/dev で全身立ち姿の静止画を作り、wan-i2v で 5 秒動画化

<div style="display:flex; gap:1rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/01-ref-tartan-blazer.webp" alt="タータンブレザーの参照画像" width="220" />
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/02-ref-kimono.webp" alt="着物の参照画像" width="220" />
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/03-seed-portrait.webp" alt="種になる人物静止画" width="124" />
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/10-source-video.webp" alt="モーション源となる元動画" width="180" />
</div>

3 枚目が Qwen-Image-Edit に流し込む「人物」、4 枚目 (アニメーション) が動画段の Wan2.2-Animate に流し込む「モーション源」の元動画です。

服の参照画像は「前を閉じた flat lay・白背景・服単体・マネキン不可視」で作ります。マネキンが写っていると、その胴体や首が出力にインナーや白い線として漏れます。

## 静止画段: 3 モデルの比較

同じ人物 × 同じ服参照で、性格の違う 3 モデルを比較しました。

| モデル | 種別 | ブレザー | 着物 |
|---|---|---|---|
| Kolors virtual try-on | VTON 特化・クローズド | 成立 | 破綻 |
| Seedream edit | instruction 編集・クローズド | - | 成立 |
| Qwen-Image-Edit | instruction 編集・**Apache-2.0** | 成立 | 参照に忠実(本文参照) |

<div style="display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/06-s2-kolors-kimono.webp" alt="Kolors の着物は破綻する" width="200" />
<p style="flex:1; min-width:260px; margin:0;">VTON(virtual try-on)特化型の Kolors は、学習分布内の洋服なら柄・格子・金ボタンまで正確です。しかし着物のような分布外の服型では完全に破綻し、「ひざ丈のラップドレス + ロングブーツ」になりました。衿・帯・袂という着物の構造をそもそも作れません。</p>
</div>

<div style="display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/07-s3-seedream-kimono.webp" alt="Seedream は着物を正しく着せる" width="200" />
<p style="flex:1; min-width:260px; margin:0;">instruction 編集型はこの服型の壁を越えられます。クローズドの Seedream は足首丈・広袖・衿合わせ・帯まで一発で正解しました。</p>
</div>

<div style="display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/08-s4-qwen-tartan.webp" alt="Qwen-Image-Edit のブレザーは Kolors と同水準" width="200" />
<p style="flex:1; min-width:260px; margin:0;">本命の Qwen-Image-Edit (Apache-2.0) は、ブレザーでは Kolors と同水準の再現度が出ました。全段 OSS の望みをつなぐ結果です。</p>
</div>

<div style="display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/09-s5-qwen-kimono.webp" alt="Qwen-Image-Edit の着物はひざ丈になった" width="200" />
<div style="flex:1; min-width:260px;">
<p style="margin:0 0 0.75rem;">一方、着物は丈がひざ丈で止まり、裾から元のダークパンツが覗きました。</p>
<p style="margin:0 0 0.75rem;">当初これを Qwen の失敗と解釈したのですが、参照画像を見直すと<strong>そもそも生成した着物素材自体がひざ丈</strong>でした。つまり Qwen は参照画像に忠実だっただけです。プロンプトでは ankle-length と指示していたので、ここで観測されたのは「参照とプロンプトが矛盾したとき、Qwen は参照を優先し、Seedream はプロンプトを優先した」という挙動差であって、着せ替え能力の優劣ではありません。正しい丈の参照での再試行は追試 1 で行い、そちらで決着します。</p>
<p style="margin:0;">参照画像は生成直後に「マネキンが写っていないか」「ぼけていないか」だけ確認して通していました。服の構造(丈・衿・帯の位置)まで参照素材の段階で目視検収すべきだった、という検証設計の反省です。</p>
</div>
</div>

## 動画段: Wan2.2-Animate の 2 モード

Wan2.2-Animate には構造の違う 2 モードがあり、使い分けが必須です。

- **replace mode**: 元動画から人物マスクを抽出し、その内側に新しい人物を合成する。背景・画作り・フレーミングを完全保持するが、マスクの外には描けないため、そこからはみ出す服は切り詰められる
- **move (animation) mode**: 種静止画の世界をベースに、モーションだけを元動画から移植する。マスクの拘束がない代わりに、背景・フレーミングは種静止画側になる

両モードの差を、同一の元動画・同一の種静止画で直接比較しました。まず追試 1 の着物静止画を両モードに通すと、意外にも replace でも裾は切り詰められず、足首丈が出ました(左が replace、右が move)。

<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/34-video-kimono-replace-vs-move.webp" alt="左: replace、右: move。同じ着物静止画を両モードに通した比較" width="440" />

今回の元の人物は暗色ジャケット + 幅広パンツで脚まで服に覆われており、着物が人物マスクにほぼ収まっていたためです。拘束は「元の服の形」ではなく「人物マスク」なので、収まってしまえば着物でも replace が通ります(袖のボリュームだけは move が参照に忠実)。

そこで、人物マスクから確実にはみ出す服として、裾が大きく広がるボールガウンで比較し直しました。

<div style="display:flex; gap:1rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/51-qwen-ballgown.webp" alt="Qwen で着せたボールガウンの種静止画" width="180" />
<p style="flex:1; min-width:260px; margin:0;">種静止画は Qwen-Image-Edit 製。ガウンの裾が人物の輪郭から左右に大きく張り出しており、これを両モードに通します。</p>
</div>

<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/52-video-ballgown-replace-vs-move.webp" alt="左: replace はガウンが切り詰められ破綻、右: move は広がりを保持" width="440" />

今度はモード差が一目瞭然です。左の replace はガウンの広がりが人物マスクに切り詰められ、スカートが脚の形に沿って割れた不自然な出力になりました。右の move は参照どおりの広がりを保っています。

実用上の順番としては、replace が通れば背景と顔が保持される利点が大きいので、**まず replace を試し、切り詰めが出たら move に切り替える**のが良さそうです。

## 結果

### ブレザーの差し替え: 全段 OSS は Kling に並んだ

左が全段 OSS (Qwen-Image-Edit → Wan2.2-Animate replace)、右がクローズドの Kling O3 edit です。

<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/20-video-tartan-oss-vs-kling.webp" alt="左: 全段OSS、右: Kling O3 edit" width="440" />

柄の忠実度、顔の保持、パンツ・背景の保全、いずれも目視で差が付きませんでした。ライセンスの縛りがある案件でも、replace mode で足りる着せ替えならオープンウェイトだけで製品品質が出せます。

### 着物への差し替え: 静止画の欠陥はそのまま動画になる

左が Seedream 起点(クローズド)、右が Qwen 起点(全段 OSS)を、同じ move mode に通した結果です。

<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/21-video-kimono-seedream-vs-qwen.webp" alt="左: Seedream起点は足首丈、右: Qwen起点は静止画のひざ丈がそのまま伝播" width="440" />

注目してほしいのは右側です。静止画段の「ひざ丈 + パンツ露出」が、1 フレーム目から最終フレームまで一切補正されずに動画化されています。move mode は種静止画の丈を正しい着物の丈へ「救済」してはくれません。この欠陥の出どころを遡ると参照素材の丈にたどり着くわけで、**参照素材 → 静止画 → 動画と、上流の欠陥が 2 段を素通りして最終出力まで届いた**ことになります。静止画品質(さらに言えば参照素材の品質)が動画品質の天井を決める、というこのパイプラインの本質がよく分かる例です。

<div style="display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/22-video-kimono-kling.webp" alt="Kling O3 edit はプロンプトのみで着物に差し替える" width="200" />
<p style="flex:1; min-width:260px; margin:0;">ちなみに Kling O3 edit は動画 1 本の入力にプロンプトを添えるだけで、着物への差し替えも 1 段で処理します。</p>
</div>

## 追試 1: 参照素材を正したら、着物も全段 OSS で成立した

「正しい丈の参照ならどうなるか」を実際に確かめました。参照画像を縦長フレーム(portrait_16_9)に変え、丈を強調するプロンプトで作り直したところ、1 発で足首丈の着物が出ました。今回は検収基準を数値化し(帯から裾の長さが肩から帯の 1.5 倍以上)、ピクセル実測 2.58 倍で合格を確認してから次段へ進めています。

<div style="display:flex; gap:1rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/30-ref-kimono-long.webp" alt="作り直した足首丈の着物参照" width="180" />
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/31-s5b-qwen-kimono-long.webp" alt="Qwen-Image-Edit は足首丈を正しく出した" width="180" />
<div style="flex:1; min-width:260px;">
<p style="margin:0 0 0.75rem;">この参照で Qwen-Image-Edit を再実行すると、<strong>裾が足首まで届き、パンツ露出のない正しい着物</strong>が出ました。前回のひざ丈はやはり「参照への忠実さ」だったわけです。</p>
<p style="margin:0;">留意点として、作り直した参照は flat lay ではなくゴーストマネキン風の吊り下げ提示になったため、改善の原因が「丈」なのか「提示方法」なのかは厳密には分離できていません。ただ実務上は「参照を正せば出る」ことが確認できれば十分です。</p>
</div>
</div>

<div style="display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/33-video-kimono-long-oss.webp" alt="全段OSSで着物への差し替えが成立した動画" width="200" />
<p style="flex:1; min-width:260px; margin:0;">この静止画を move mode に通すと、足首丈・袂・帯が最終フレームまで保たれた動画が得られました。<strong>Qwen-Image-Edit (Apache-2.0) → Wan2.2-Animate という全段 OSS 構成は、ブレザーだけでなく着物でも成立します</strong>。本編の「判定不能」はここで決着です。</p>
</div>

## 追試 2: 背景がある場合

ここまでの検証はすべて白スタジオ背景でした。実運用は背景のある動画が普通なので、街角背景の素材を作って再検証しました。

<div style="display:flex; gap:1rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/40-seed-portrait-bg.webp" alt="街角背景の元人物" width="180" />
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/42-qwen-tartan-bg.webp" alt="Qwen で着せ替え。背景は意味的には保持されるがピクセルは別物" width="180" />
<div style="flex:1; min-width:260px;">
<p style="margin:0;">まず静止画段。Qwen の着せ替えは、建物・車列・標識の配置という<strong>意味レベルでは背景を保持</strong>しますが、拡大すると歩行者の姿勢や車の細部が変わっており、<strong>ピクセルレベルでは別物</strong>です。instruction 編集型が画像全体を再生成する構造の帰結で、これが次の動画段の結果を分けます。</p>
</div>
</div>

ブレザー(replace mode)は問題ありませんでした。replace は元動画のピクセルの上に人物だけ合成するため、背景は本物のまま残ります。左が全段 OSS の replace、右が Kling で、どちらも背景・歩行者・車列を保持しています。

<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/44-video-bg-replace-vs-kling.webp" alt="左: replace mode、右: Kling。どちらも背景保持" width="440" />

問題は着物(move mode)です。move mode は種静止画の世界をベースにするため、背景も種静止画側、つまり「Qwen が再生成した似て非なる背景」になります。左が元動画、右が move の出力で、一見同じ街に見えますが別物の背景です。

<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/45-video-bg-source-vs-move.webp" alt="左: 元動画、右: move mode。背景が似て非なるものに置き換わる" width="440" />

背景と同じ理屈は顔にも効きます。move 経路は Qwen と Animate の 2 段再生成を経るため顔もドリフトし、特に全身 + 背景の構図では顔のピクセル数が小さいぶん劣化が強く出て、並べると「似た別人」寄りになりました。白背景・顔が大きく写る素材では軽微で済んでいたので、「種静止画の顔品質 × 顔の解像度」が move 経路の顔品質を支配します。一方 replace と Kling は元動画の顔をほぼそのまま保持します。

整理すると、背景のある動画では replace は背景も顔も保持でき、move は背景がすり替わり顔もドリフトします。**move を使わざるを得ない場合(着物が人物マスクからはみ出す素材など)は、背景・顔の保持を諦めることになる**のが OSS 構成の残る構造的制約です。Kling はこれを 1 段で両立します(参照画像 + 着物の同時指定は未検証)。

## 教訓

1. **品質ゲートは上流に置く**。動画段は静止画の美点も欠陥も忠実に運ぶだけで、修復はしない。そして静止画段も参照素材の欠陥を(モデルによっては)忠実に運ぶ。目視検収は参照素材から始め、検収基準はできるだけ数値化する(追試 1 では丈の比率で判定した)
2. **モデルは服型で使い分ける**。VTON 特化型は学習分布内なら精密、分布外では破綻。着物のような服は instruction 編集型へ
3. **参照とプロンプトが矛盾したときの挙動はモデルごとに違う**。Qwen-Image-Edit は参照優先、Seedream はプロンプト優先だった。どちらが「正しい」かは用途次第だが、この差を知らないと今回のように能力差と誤読する
4. **失敗は「壊れた画」ではなく「自然な別の服」として出る**。replace でガウンが切り詰められた出力は、ビスチェ + ワイドパンツ風の実在しそうな服に再解釈されていた。生成モデルの prior がマスク内の辻褄を「服として自然な画」で合わせるためで、破綻がエラーらしい見た目にならない。つまり機械的な破綻検知は効かず、品質判定は「自然かどうか」ではなく「参照と一致するか」を目視で見るしかない
5. **全段 OSS の現在地**: ブレザーも着物も、正しい参照素材があれば製品品質(追試 1)。残る構造的制約は move 経路での背景・顔の保持で(追試 2)、ここが要件に入るなら現状はクローズド(Kling)を選ぶことになる

## 小ネタ: flux/dev のシード依存ソフトフォーカス

<div style="display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-31-outfit-swap-oss-vs-closed/output/91-artifact-flux-softfocus.webp" alt="シード起因のソフトフォーカス例" width="200" />
<div style="flex:1; min-width:260px;">
<p style="margin:0 0 0.75rem;">素材生成中、flux/dev で同一プロンプト・同一パラメータなのに、特定のシードだけ画像全体に強いソフトフォーカスがかかる現象を複数回踏みました。sharp focus 系のワードを足しても直らず、シードを変えると即座に解消します。</p>
<p style="margin:0;">プロンプトを疑う前にシードを引き直す方が早い、という知見でした。これも「静止画段で選別してから動画段に進む」設計を後押しする材料です。</p>
</div>
</div>

## コスト

本編(静止画 5 ケース + 動画 5 本 + 素材生成・引き直し込み)で約 $3.5、追試 2 本(素材再生成 + 静止画 + 動画 4 本)で約 $2、mode 直接比較(着物 × replace とボールガウンの素材・静止画・動画 3 本)で約 $1.3、全体で $7 前後でした。内訳の目安は fal.ai 経由で、flux/dev $0.025/MP、Qwen-Image-Edit $0.03/MP、Kolors $0.07/枚、Wan2.2-Animate $0.08/秒、Kling O3 edit standard $0.14/秒です。動画着せ替えは 5 秒 1 本あたり OSS 経路 $0.4、Kling $0.7 程度で、コスト差よりも品質と入力契約の違いで選ぶ領域です。

再現スクリプトは [blog-examples の run_pipeline.py](https://github.com/mohhh-ok/blog-examples/tree/main/2026/07-31-outfit-swap-oss-vs-closed) にあります。
