---
title: 【AI】RVMとMatAnyone2でグリーンバックの緑halo比較【Video Matting】
pubDate: 2026-07-02
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

Video matting の症状で「透過処理後、輪郭に緑の縁（halo）が残る」というのがあります。「モデルの学習バイアスだ」と最初は思ってましたが、RVM と MatAnyone 2 を Mac M2 で回してコードを読んだら、 **halo は撮影時の緑光の回り込み（green spill）** でした。過程を書きます。

![緑背景 talking head の入力フレーム](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/source.webp)

## 比較モデル

| モデル | 発表 | 特徴 |
|---|---|---|
| [Robust Video Matting (RVM) mobilenetv3](https://github.com/PeterL1n/RobustVideoMatting) | WACV 2022 | auto matting。人物を自動検出、事前 mask 不要 |
| [MatAnyone 2](https://github.com/pq-yang/MatAnyone2) | CVPR 2026 Highlight | target-guided matting。最初のフレームの mask を渡す前提 |

MatAnyone 2 は fine hair・semi-transparent fabric・motion blur・cluttered background が売り。halo 対策の主戦場ではないですが、edge が綺麗なら halo も減るだろうと予想して並べました。

## 環境と入力

- ハード: Mac mini M2 24GB（MPS）
- 環境: Python 3.11 + torch 2.12（MPS）
- 入力: [mixkit の緑背景 talking head 動画](https://mixkit.co/free-stock-video/man-talking-head-on-on-a-chroma-background-28287/) 1280x720 60fps 16秒 956フレーム

## セットアップ

MatAnyone 2 の pyproject は CUDA index 前提なので上書き。GUI 依存の `cchardet` はビルドで詰まるので `--no-deps` で回避します。

```bash
uv venv --python 3.11 .venv
source .venv/bin/activate
uv pip install 'torch>=2.4' 'torchvision'
uv pip install cython numpy Pillow opencv-python scipy tqdm einops \
  hydra-core av 'imageio==2.25.0' 'imageio[ffmpeg]' \
  'huggingface_hub==0.36.2' safetensors kornia easydict requests gitpython \
  'thinplate@git+https://github.com/cheind/py-thin-plate-spline'
uv pip install --no-deps -e .
```

`torchvision.io.read_video` が新しい torchvision で消えているので、MatAnyone 2 の `read_frame_from_videos` を PyAV で書き直します。1 箇所だけ。

MatAnyone 2 は初期 mask が要ります。入力が緑バックなので、HSV で緑を抜いて largest connected component を人物とする簡易 chroma key で生成しました。

## 出力を並べて見る

フレーム 480/956 を白背景に合成した結果です。

![白背景に合成した比較](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/side_white.webp)

輪郭を近接クロップ:

![白背景合成のクロップ](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/side_white_crop.webp)

赤背景に合成すると、緑カブりが最もはっきり出ます。

![赤背景に合成した比較](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/side_red.webp)

foreground を alpha 無しで表示すると、両者とも透明領域が緑です。ここで「モデルが緑を学習してる」と結論しかけましたが、後で見るとこれは間違いでした。

![foreground の RGB のみを抽出](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/side_fgr.webp)

alpha 単独。両者とも hard alpha で、半透明帯は狭いです。

![alpha channel の比較](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/side_alpha.webp)

## 定量結果

同じ入力・同じ手順で、フレーム 50 / 200 / 400 / 600 / 800 を測りました。

| 指標 | MatAnyone 2 | RVM (mobilenetv3) |
|---|---|---|
| alpha 透明 (α<10) | 73.5-74.3% | 73.5-74.3% |
| alpha 不透明 (α>245) | 25.3-26.0% | 25.1-25.9% |
| alpha 半透明 edge | 0.4-0.5% | 0.6-0.7% |
| foreground 透明領域が緑塗りの割合 | 100% | 96.8-99.2% |
| foreground edge が緑塗りの割合 | 72-75% | 45-47% |
| 白合成後 edge zone の緑がかり率 | 32-39% | 32-34% |
| 白合成後 edge zone 平均 RGB | (228, 243, 229) | (218, 226, 211) |
| 白合成後 edge zone ΔG（G から R,B 平均を引いた値） | +12〜+14.7 | +11.8〜+12.8 |

edge zone は不透明領域の周囲 3px リング。ΔG は 255 中の値で、+12 は目視で緑カブりが分かるかどうかの境目です。

両モデルとも同程度の緑カブりが残ります。数字だけでは原因が分からないので `foreground` の生成コードを読みました。

## foreground の生成コードを読み直す

各モデルの推論コードで `foreground` が何を出しているか確認します。

**RVM**（`model/model.py:62`）:

```python
fgr = fgr_residual + src
fgr = fgr.clamp(0., 1.)
```

RVM の foreground は **入力 + 補正差分**。透明領域では residual ≒ 0 になるので、foreground は入力色をそのまま通します。緑バック入力なら透明領域は緑。**学習した色ではなく入力の色**です。

**MatAnyone 2**（`inference_matanyone2.py:72, 111`）:

```python
bgr = (np.array([120, 255, 155], dtype=np.float32)/255)  # green screen to paste fgr
...
com_np = image_np / 255. * pha + bgr * (1 - pha)
```

MatAnyone 2 の foreground はモデル予測ではなく、**推論スクリプトが alpha=0 領域を `(120, 255, 155)` で塗ってるだけ**。学習でもバイアスでもない、単なる後処理です。

foreground の raw RGB を見て「モデルが緑を吐いている」と言うのは的外れ:

- RVM は入力の色を通しているだけ（透明部が緑なのは入力が緑だから）
- MatAnyone 2 は推論スクリプトが決め打ちで緑を塗っているだけ

## じゃあ ΔG +12 の halo は何か

輪郭 3px 帯の ΔG +12 の緑は残るので、これは別要因です。

正体は **green spill**、撮影時に緑スクリーンから被写体に回り込んだ緑光の反射です:

- 緑スクリーンの反射光が被写体の輪郭・毛先・肌に緑を足す
- source 動画に RGB として焼き付いている
- matting モデルはそれを削らないので foreground に残る
- 白背景に合成すると「halo」に見える

モデルの問題ではなく **撮影の物理現象**。同じモデルに緑スクリーンじゃない自然背景の talking head を通してみます。

## 自然背景で検証

pexels の医療オフィス風 talking head（15秒 720p 30fps、緑要素なし）で同じ pipeline を回しました。

![自然背景の入力フレーム](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/natural_source.webp)

白背景に合成:

![自然背景・白背景合成](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/natural_side_white.webp)

赤背景に合成:

![自然背景・赤背景合成](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/natural_side_red.webp)

foreground の raw RGB:

![自然背景・foreground](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/07-02-matting-halo-comparison/output/natural_side_fgr.webp)

### 定量結果（フレーム 50/150/250/350）

| 指標 | MatAnyone 2 | RVM |
|---|---|---|
| alpha 透明 | 79.4% | 79.3-79.4% |
| alpha 不透明 | 19.7-19.8% | 19.4-19.6% |
| alpha edge | 0.8% | 1.1-1.2% |
| foreground 四隅（透明領域） | (154, 254, 119) std=0 | (~127, ~101, ~109) std=24-32 |
| halo edge zone 平均(R,G,B) | (220, 236, 225) | (213, 208, 214) |
| **halo ΔG** | **+13** | **−5.5** |

### わかったこと

**RVM の halo ΔG は −5.5**、緑どころか **わずかに赤紫寄り**。緑バック時の +12 が消えました。**halo の緑は物理的な green spill 由来で確定**。

**MatAnyone 2 の halo ΔG は +13** で緑バック時と変わらず。これは入力の色ではなく、**推論スクリプトの `bgr = [120, 255, 155]` が半透明帯を通して edge に染み出してる**副作用。入力を変えても消えません。塗り色を黒 `[0, 0, 0]` にすればこれも消えます。

補足観察: **RVM の foreground 四隅は入力とかなり違う色**（入力が (226, 194, 185) の明るい壁でも RVM foreground は (125, 99, 107) に落ちる）。「透明領域は residual ≒ 0 で input を通す」と前の節で書きましたが、実測ではもっと大きく暗く抑える方向に residual が働いていました。透明領域は loss で制約されないので、network が空間依存の残差で自由な色を出してます。結果に関係しない領域なので実害はないですが、passthrough とは違う。前の節の説明を「入力の色に近い値を通しがち（ただし residual が空間依存で寄与するので厳密には別物）」に読み替えてください。

### 赤背景で見ると MatAnyone 2 の緑カブりが視覚的に決定的

上の白背景合成では ΔG +13 と +5 で「わずかに緑寄り」くらいの差ですが、**赤背景に合成すると complementary（補色）の関係で MatAnyone 2 の緑カブりが顕在化**します。もう一度上の赤背景画像を見ると、MatAnyone 2 の髪の輪郭に緑の縁がはっきり見えるのに対し、RVM は輪郭が赤に自然に溶けています。

赤背景 edge zone の RGB を測ると:

| モデル | edge zone 平均(R,G,B) | G − B |
|---|---|---|
| MatAnyone 2 | (181, 54, **43**) | **+11**（緑カブり） |
| RVM | (180, 52, **58**) | **−6**（僅かに青、緑なし） |

わずかな数字の差でも、赤地との補色コントラストで大きく見える。**用途によっては MatAnyone 2 のこの halo が致命傷**（透明背景素材として書き出して任意の背景に載せるユースケースだと確実に破綻する）。RVM が edge の green fill を持たないぶん、任意背景合成での見た目はクリーン。

MatAnyone 2 側は推論スクリプトの `bgr = [120, 255, 155]` を `[0, 0, 0]` にすれば edge の green bleed が消えます。素材化する用途で MatAnyone 2 を使うならこの改修は必須。

## じゃあどう消すのか

model 差し替えでは消えないので、matting 後段に **despill** を入れます:

```python
# G を (R+B)/2 で頭打ち
g = np.minimum(g, (r.astype(np.int32) + b.astype(np.int32)) // 2)
```

alpha-gated で人物側だけに適用すれば、被写体が緑を着てない限り副作用なしで halo が消えます。edge の閾値切りが halo 除去と緑衣装の保護のトレードオフになります。

MatAnyone 2 は推論スクリプトの `bgr = [120, 255, 155]` を `[0, 0, 0]` に変えるだけで「透明領域が緑」問題自体は消えます。ただし物理 spill は残るので despill は必要です。

## 速度メモ

Mac M2 MPS で 1280x720 956 フレームの推論時間:

- RVM (mobilenetv3): 約 48 秒（~20 fps）
- MatAnyone 2: 数分（RVM の 5-7 倍程度、正確な計測は別記事で）

グリーンバック用途は halo の残り方に差がないので、速い RVM 有利です。cluttered background や edge quality を追う用途は MatAnyone 2 の領分ですが、別途検証が必要です。

## まとめ

- 両モデルとも foreground の RGB を alpha 無しで見ると透明領域が緑。**学習バイアスではなくコードの仕様**（RVM は残差ベースで入力の色に近い値、MatAnyone 2 は固定色塗り）
- 緑バック時の輪郭 3px 帯の ΔG +12 は **モデルの halo ではなく撮影時の green spill**。自然背景で試すと RVM は ΔG −5.5（緑消える）、MatAnyone 2 は +13（塗り色の副作用で残る）
- **赤背景合成で MatAnyone 2 の緑カブりが視覚的に決定的になる**（G−B = +11 vs RVM の −6）。素材化して任意背景に載せる用途では MatAnyone 2 のスクリプトを直さないと破綻する
- 対策は alpha-gated despill と、MatAnyone 2 側は `bgr = [0, 0, 0]` へ変更。モデル差し替えでは消えない
- 数字だけで結論せず実装を読み、複数の入力条件で検証する、が遠回りに見えて確実

コード一式は [blog-examples/2026/07-02-matting-halo-comparison](https://github.com/mohhh-ok/blog-examples/tree/main/2026/07-02-matting-halo-comparison) に置いてます（uv script 1本で両モデル回して定量結果が出ます）。
