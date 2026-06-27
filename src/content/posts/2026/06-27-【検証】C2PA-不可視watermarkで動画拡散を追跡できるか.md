---
title: 【検証】C2PA + 不可視watermarkで動画の拡散先を追跡できるか試した
pubDate: 2026-06-27
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

> ※ この記事は Claude (Anthropic) によって生成された文章です。PoC の実装・検証・数値もすべて Claude が実行したものを記事化しています。

「自分のサービスで作った動画が、SNSのどこに転載されているか追跡できないか」という話を考えていて、その流れで C2PA と不可視 watermark を OSS で実装して、本当に「動画にデジタル指紋を埋めて追跡できるのか」を検証しました。結論を先に言うと、軽い再エンコードなら通るが、TikTok / Instagram の本気パスは OSS だけだと厳しいです。

## 「動画の拡散追跡」をどう実装するか

「自社サービスで作成した動画がどこに投稿されているか追跡したい」みたいな要件を、技術スタックに落とすと柱は 2 つです。

- **Content Provenance (C2PA)** — 動画にメタデータと電子署名を埋める
- **Invisible Watermarking** — 動画のピクセル自体に不可視の情報を埋める

それぞれ単体ではダメで、両方が必要というのが結論なんですが、まず C2PA 単体の動作確認から始めました。

## C2PA は今かなり進化している

C2PA (Coalition for Content Provenance and Authenticity) は Adobe / Microsoft / BBC / Intel などが推進する、コンテンツ来歴の国際標準です。

ここ 2 年で結構な動きがありました。

| トピック | 時期 |
|---|---|
| C2PA 2.0 で durable Content Credentials (watermark + fingerprint) を正式統合 | 2024 |
| ISO/IEC 22144 として標準化進行中 | 2024- |
| OpenAI (DALL-E 3 / Sora) が生成物に C2PA メタデータ | 2024 |
| Meta が Instagram / Facebook で「AI Info」ラベル表示 | 2024 |
| TikTok Content Credentials 対応 | 2024-05 |
| YouTube 一部対応 | 2024 |
| Leica M11-P が世界初の撮影時 C2PA 対応カメラ | 2023 |
| EU AI Act で 2026 から AI 生成コンテンツ透明性義務化 | 2026 |

特に **C2PA 2.0** は「manifest が SNS で剥がされても、watermark から provenance を復元できる」設計に踏み込んでいて、ようやく実用フェーズに入ってきています。

## 整理: C2PA と watermark の役割分担

実装に入る前に、C2PA と watermark の関係を整理しておきます。両者は別物で、本当に追跡が要るなら両方使います。

| 種別 | 何をする | 再エンコード耐性 |
|---|---|---|
| **C2PA manifest** (メタデータ) | MP4 の uuid box に署名付きメタデータを入れる | 弱い (SNS で剥がれる) |
| **Invisible Watermark** | 映像ピクセル自体に不可視情報を埋め込む | 中〜強 |
| **C2PA 2.0 Durable Credentials** | manifest + watermark + fingerprint を紐付け | 強い |

C2PA SDK (`c2pa-node` 等) は映像のピクセルには 1 ミリも触りません。ffprobe で見ると `c2pa.assertions` という文字列がメタデータ領域に出ますが、これは映像とは独立した box。動画を ffmpeg で 1 回再エンコードしただけで消えます。なので C2PA SDK 単体では「拡散追跡」用途には足りない。

「C2PA 準拠の watermark」を作るには:

1. **Watermark 本体** (映像ピクセルに埋め込む) — Digimarc / Steg.AI / IMATAG (商用) または SteganoGAN / RivaGAN (OSS)
2. **C2PA manifest 側の soft-binding assertion** — watermark の存在を宣言する

の 2 段構えが要ります。今回の PoC はこの 2 段を OSS で組みました。

## OSS でフルセットを実装してみる

OSS の `invisible-watermark` (Python) と `c2pa-node` (Node.js) で、両方を組み合わせた PoC を作りました。

### パイプライン

1. ffmpeg で動画を全フレーム PNG に展開 (ロスレス)
2. 各フレームに `dwtDctSvd` で payload `PROJ-001` (8 byte = 64 bit) を埋める
3. ffmpeg で H.264 CRF 18 で再エンコード
4. その MP4 に `c2pa-node` で C2PA manifest + `c2pa.soft-binding` assertion を埋める

soft-binding assertion はこういう中身です。

```json
{
  "alg": "com.opensource.invisible-watermark.dwtDctSvd",
  "alg_params": {
    "method": "dwtDctSvd",
    "payload_bits": 64,
    "payload_encoding": "utf-8-bytes"
  },
  "blocks": [
    { "scope": { "all_of_video": true }, "value": "PROJ-001" }
  ]
}
```

「この動画には dwtDctSvd 方式の watermark が全フレームに入っていて、payload は `PROJ-001` です」と manifest 内で宣言する。manifest が剥がされても、verifier はこの仕様を知っていれば watermark を読みに行けます。

### 検証 1: 本当に pixel に埋まっているか

元動画と watermark 入り動画を pixel 単位で比較しました。等倍だと完全に同じに見えますが (PSNR 39.54 dB)、差分を 20 倍に拡大すると DCT 係数に乗ったノイズパターンが目視で確認できます。ピクセル単位では確実に変わっている。

```
mean |Δ|: B=3.299  G=1.121  R=1.046
max  |Δ|: 25
PSNR:     39.54 dB  (> 40 で人間に知覚不可)
```

39.54 dB は知覚不可ラインのギリギリ下。実写動画は静止画より若干 PSNR が下がります (静止画の同条件では 41.47 dB)。

### 検証 2: watermark を抽出できるか

watermark 入り MP4 から 8 フレームをサンプリングして decode。

```
frame   0: 'PROJ-001'
frame  17: 'PROJ-001'
frame  35: 'PROJ-001'
frame  53: 'PROJ-001'
frame  70: 'PROJ-001'
frame  88: 'PROJ-001'
frame 106: 'PROJ-001'
frame 124: 'PROJ-001'
majority: 'PROJ-001' (8/8 frames agreed)
```

8/8 で完全復元。**ここまではあっさり動きます。**

## 本番: 再エンコード耐性テスト

実際の SNS は動画をアップロードすると裏で必ず再エンコードします。その典型パターンを 5 つ用意して、watermark が生き残るかテストしました。

| シミュレートする処理 | 結果 |
|---|---|
| baseline (再エンコードなし) | PASS 8/8 |
| H.264 CRF 28 再圧縮 (YouTube / X 想定) | PASS 3/8 |
| H.264 CRF 32 強圧縮 (低帯域モバイル) | FAIL |
| H.265 CRF 28 (TikTok / Apple 系) | FAIL |
| 540p ダウンスケール (端末別配信) | FAIL |
| 中央 80% クロップ (ストーリー化) | FAIL |

正直な結果として 6 ケース中 2 ケースしか通っていません。

### それぞれ何が起きているか

**H.264 CRF 28 (PASS 3/8)**

dwtDctSvd は「DCT 係数の特定の周波数帯」に payload を載せる方式。H.264 もまったく同じ「DCT 係数の量子化」で映像を圧縮します。両者が同じ場所を触るので干渉して payload が削られます。3/8 でも majority vote では `PROJ-001` が取れるんですが、薄氷の生存。

**H.264 CRF 32 (FAIL)**

CRF が 4 上がると量子化ステップが約 1.6 倍。watermark を担う中域 DCT 係数が 0 に丸められて消えます。

**H.265 CRF 28 (FAIL)**

コーデックが違うと DCT のブロックサイズが違います。H.264 は固定 8x8 / 4x4、H.265 は可変 4x4〜32x32。watermark は H.264 ライクなブロック構造を想定して載せているので、H.265 で再構築されると係数配置がズレて読めません。**コーデック変換は構造的に通らない**。

**540p ダウンスケール (FAIL)**

DCT watermark は「特定の (x, y) ピクセル座標の DCT 係数」に payload が固定されています。スケーリングは bilinear / bicubic 補間で全ピクセルを混ぜ合わせる。座標基準もブロック境界もズレて、watermark の存在自体が破壊されます。

**クロップ (FAIL)**

クロップ + 再スケール = 2 重攻撃。watermark の埋まっている座標が完全に壊れる。

## C2PA soft-binding の本領: manifest が剥がれても復元できる

ここまでは「watermark が生き残るか」の話ですが、最後に「**C2PA manifest が剥がれた状態でも watermark から payload を復元できるか**」を確認しました。

1. signed.mp4 (manifest + watermark 両方入り、1.6 MB)
2. ffmpeg で H.264 CRF 28 に再エンコード → 325 KB
3. 再エンコード後のファイルを検査

結果:

```
C2PA manifest markers: False   <- 期待通り剥がれた
Watermark recovered:   'PROJ-001' (3/8 frames)
Watermark survived:    True
```

manifest が完全に剥がれた状態でも、ピクセルに埋まっていた `PROJ-001` を 3/8 のフレームから復元できました。これがまさに C2PA 2.0 soft-binding の存在意義です。

- **manifest** = 豊富なメタデータを持つが脆い
- **watermark** = 載せられる情報は少ないが durable
- **soft-binding** = 両者を紐付け、manifest 剥離後も watermark から provenance を再構築する

## 一般的な動画では絶望的か

検証に使った動画 (5 秒、人物 1 ショット、カット切り替えなし、カメラの動き控えめ) はわりと watermark に優しい素材です。それで H.264 CRF 28 で 3/8。

一般的な TikTok / Instagram の動画は:

- カット切り替えが頻繁 (3-5 秒ごと)
- カメラの大きなパン・ズーム
- カラフルなエフェクト・カラーグレーディング
- テロップ・モーショングラフィックス
- 高速モーション

これらは全部「H.264 の motion compensation が頑張る方向」= watermark が削られる方向です。SNS 投稿後の生存率は **多分 1〜10% 程度**、majority vote では救えないレベル。

つまり naive な OSS dwtDctSvd 実装 + SNS パイプラインの組み合わせは、**実用にはなりません**。

## どうしたら実用ラインに乗るか

OSS から改善する道は 3 段階あります。

### 1. Error Correction を被せる

Reed-Solomon や BCH で 8 byte payload を 16-32 byte に冗長化して埋め込む。半分のビットが壊れても復元できる方式。生存率が 30-50% くらいに上がる可能性があります。

### 2. RivaGAN (ニューラル系 watermark)

DAI-Lab/RivaGAN という OSS が公開されていて、ニューラルネットが「H.264 圧縮に耐える埋め込み方」を学習して payload を分散させます。論文の数字では H.264 / scale / crop に対して 90% 以上の復元率。DCT を諦めて学習ベースに行くと一段堅くなります。PyTorch + 学習済みモデル (60 MB くらい) + GPU 推奨。

### 3. 商用品 (Digimarc / NexGuard / Verance)

数百種類の攻撃で訓練された商用品。TikTok / Instagram で実運用されているし、Netflix が事前配布の screener で流出元を特定しているのもこれ系。年額数百万円規模ですが、SNS 横断追跡が必要な事業ならここまで行く価値はあります。

## まとめ

- C2PA はメタデータ標準。**watermark とは別物**。SDK 単体では pixel に何も埋め込まない
- 「動画拡散追跡」を本気でやるには C2PA + invisible watermark の 2 段構え (C2PA 2.0 の soft-binding 仕様)
- OSS の `invisible-watermark` (dwtDctSvd) で実装はできた。pixel に payload を埋めて抽出までは動く
- 軽い H.264 再圧縮 (CRF 28) には耐えるが、強圧縮 / コーデック変更 / 解像度変更 / クロップには **構造的に勝てない**
- manifest が剥がれても watermark から payload を復元できることは実証済み (これが soft-binding の本質)
- 一般動画 + SNS 想定では OSS dwtDctSvd は厳しい。実用化するなら RivaGAN や商用品が必要

C2PA 自体は 1〜2 年でかなり進化していて、SNS 各社の対応も進んでいます。「再エンコード耐性のある provenance」が業界の本気テーマになっている段階。今は技術成熟待ちで、PoC を回しながら適切なタイミングで本実装を狙うのが現実的だと思いました。
