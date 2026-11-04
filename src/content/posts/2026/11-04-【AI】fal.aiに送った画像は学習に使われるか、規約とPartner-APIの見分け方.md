---
title: "【AI】fal.aiに送った画像は学習に使われるのか。規約と、モデルごとに開発元へ渡るかの見分け方"
pubDate: 2026-11-04
categories: ["AI", "動画"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。この記事はほとんどAIが書いたものを、私が加筆修正しています。検証不十分な部分もあるかと思いますが、ご容赦ください。ご指摘等ございましたら、Github issueか、Xでお願いいたします。

実在の人物の写真から動画を作るとき、送った写真がモデルの学習に使われないかは気になるところです。fal.ai の規約と、モデルごとのページを読んで確かめました。規約とモデルの値は 2026-11-04 に確認したものです。

## 結論

fal の規約は、送った入力をサービスの提供のために使う許諾しか取っていません。学習などの開発に使えるとされているのは、匿名化・集計したデータです。

気にするべきなのは、そのモデルを fal が自分で動かしているか、開発元が動かしているか (Partner API) です。開発元が動かすモデルでは、入力が開発元に渡り、開発元の規約が当たります。どちらなのかはモデルのページで見分けられ、同じモデル名でも endpoint ごとに違います。

## fal の規約に書いてあること

利用規約 ([Terms of Service](https://fal.ai/terms)、Last Updated: September 8, 2026) の 6(a) で、送った入力 (Customer Input) について fal が受ける許諾は、目的が「サービスを提供するため」に限られています。

> Customer hereby grants Company a non-exclusive, non-sublicensable, royalty-free license to reproduce, use, access, store, display, adapt, translate, modify, create derivative works from, and otherwise process any Customer Input to provide the Services.

同じ節で、fal が自社の製品や AI モデルの開発に使ってよいとしているのは Usage Data です。Usage Data は、匿名化または集計したデータと定義されています。入力から作ったものを含みうる、とも書かれています。

> "Usage Data" means anonymized or aggregated data collected, computed, originated, or stored by Company resulting from the use or provision of the Services, which may include data based on or derived from Customer Input.

データ処理の付属書 ([Data Processing Addendum](https://fal.ai/legal/data-processing-addendum)、Last Updated: July 31, 2026) の 1.7.2 も同じ形で、サービスの改善に使えるのは個人と結びつかないようにしたデータ (Deidentified Data) です。

> Company may Process Deidentified Data to improve the Services.

つまり規約の上では、送った写真そのものを学習に使う許諾は取られていません。使えるのは、個人と結びつかないように加工したデータです。

### Usage Data に入りうるもの、入らないもの

Usage Data の定義には「入力から作ったもの (derived from Customer Input)」も入りうると書かれているので、送った写真と無関係とは言えません。ただし、匿名化か集計をしたものに限られます。

DPA は、個人と結びつかないデータ (Deidentified Data) を次のように定義しています。

> "Deidentified Data" means information that cannot reasonably be linked to or associated with Client or any Data Subject.

顔の写った写真は、見れば本人に結びつけられるので、この定義に当たりません。送った写真がそのまま Usage Data になることはありません。

では、顔を切り取った画像ならどうか。規約が求めているのは「本人と結びつけられないこと」で、やり方は書かれていません。顔を消しても、服装や体型、背景、入れ墨などで本人と分かるなら、条件を満たしません。GDPR でも、匿名化は、本人を特定するのに合理的に使われうる手段を考え合わせても本人に戻せない状態を指し (前文 26)、ハードルは高いです。

規約の文言だけで言えば、本人と分からないところまで加工した画像を使う余地は残っています。写真から特徴だけを抜き出したデータ (ベクトルなど) がどう扱われるかも、規約からは読み切れません。ここは fal の判断に任されている部分です。

実際に「匿名化・集計したデータ」として使われやすいのは、写真を加工したものより、件数・解像度・処理時間・失敗の割合のような利用の統計だろうと考えています。これは私の推測で、fal が実際に何を使っているかは公開されていません。

## 「学習に使わない」と書かれていない点

規約には「入力を学習に使わない」とはっきり書いた一文はありません。私はこれを、使われる根拠とは読みませんでした。

ここからは私の見方です。fal の利用者には企業も多く、業務の画像や公開前の素材、人物の写真などを送ってきます。それを断りなく学習に回せば、発覚したときに信用を失い、そうした利用者が離れます。規約の許諾が「サービスの提供のため」に絞られていることと合わせて、fal 自身が入力をそのまま学習に使う心配は小さいと考えています。

## モデルを動かす主体

送った写真が学習に使われうるかの分かれ目は、そのモデルを fal が動かしているか、開発元が動かしているか (Partner API) です。fal で動くモデルには、fal が自分のサーバーで動かすものと、開発元が動かして fal が中継するものがあります。規約の 14 節も、外部が動かすモデル (machine learning models hosted by third parties) を第三者のものとして扱っています。

開発元が動かすモデルでは、送った写真は開発元に渡り、開発元の規約が当たります。たとえば MiniMax の API の規約 ([Terms of Service](https://platform.minimax.io/protocol/terms-of-service)) には、入力と生成物をサービスの開発と改善に使うとあります。

> We may use the input and generated content to provide, maintain, develop, and improve our Services

fal の規約がどうであれ、Partner API のモデルに送った写真は、開発元の規約しだいで学習に使われうるということです。実在の人物の写真を扱うなら、まずここを確かめます。

## 見分け方

fal の FAQ ([What is the Partner API?](https://fal.ai/docs/documentation/model-apis/faq#what-is-the-partner-api)) に、Partner API と表示されたモデルは fal のパートナーが動かしている、と書かれています。

> Models marked `Partner API` are hosted by fal's partners, and their availability is managed by the partner.

モデルのページ (`https://fal.ai/models/<endpoint>`) の HTML には、`provider_type` (`fal` か `partner`) と `is_partner_api` という値が埋め込まれています。公式の API として説明されたものではありませんが、次の 1 行で確かめられます。endpoint の部分を調べたいモデルに置き換えてください。

```sh
curl -sL https://fal.ai/models/fal-ai/veo3.1/image-to-video | grep -o -E 'provider_type\\":\\"[a-z]+\\",\\"is_partner_api\\":(true|false)' | head -1
```

この例では `provider_type\":\"partner\",\"is_partner_api\":true` が返り、Veo 3.1 の image-to-video は開発元が動かすモデルだと分かります。

## 画像から動画を作るモデルの実例

画像から動画を作るモデルを 7 つ確かめました (2026-11-04)。

| endpoint | 動かしているところ |
| --- | --- |
| `fal-ai/wan-flf2v` | fal |
| `fal-ai/wan/v2.2-a14b/image-to-video` | fal |
| `fal-ai/wan/v2.2-a14b/image-to-video/turbo` | fal |
| `minimax/h3-max/image-to-video` | fal |
| `minimax/h3/image-to-video` | 開発元 (partner) |
| `fal-ai/kling-video/o1/standard/image-to-video` | 開発元 (partner) |
| `fal-ai/veo3.1/image-to-video` | 開発元 (partner) |

同じ MiniMax H3 でも、Max は fal が動かし、無印は開発元が動かしています。モデル名や開発元の名前では決まらないので、使う endpoint ごとに確かめる必要があります。

## 使う前にすること

1. 使う endpoint のページで、Partner API の表示か `provider_type` を見る
2. `partner` なら、開発元の API の規約で入力の扱いを読む
3. 確かめた日付を残す。この値は fal 側の都合で変わりうるので、使い続けるなら時々見直す

`fal` のモデルなら、当たるのは fal の規約だけです。写真を学習に回されたくない場合は、`fal` と出る endpoint から選ぶのが手堅い選び方です。

## 参考

- [fal.ai Terms of Service](https://fal.ai/terms)
- [fal.ai Data Processing Addendum](https://fal.ai/legal/data-processing-addendum)
- [fal.ai FAQ: What is the Partner API?](https://fal.ai/docs/documentation/model-apis/faq#what-is-the-partner-api)
- [MiniMax Open Platform Terms of Service](https://platform.minimax.io/protocol/terms-of-service)
