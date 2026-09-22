---
title: "【AI】3D clay動画+参照画像でv2v — fal.aiのKlingとWan VACE depthを試す"
pubDate: 2026-08-02
categories: ["AI"]
---

こんにちは、フリーランスエンジニアのmohです。この記事はほぼAIで、私は概要しか理解しておりません。

Three.js で作った質感なしの 3D 動画 (clay render) と参照画像を fal.ai の video-to-video に食わせて、写実的な短尺動画が作れるか触ってみた作業記録です。コードと全アセットは [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/08-02-3d-proxy-to-vace-video) に置いています。

## 何をしたかったか

AI 動画はガチャ要素が大きいので、できるだけ確定要素を積んでから生成にかけたい。生成が軽いテクスチャなしの 3D 動画に、見た目のほうは参照画像として別で渡せば、思い通りの動画が作れるんじゃないか、というのが今回の発想です。

ためしに「兵士が草原を歩いている上を飛行機が離陸直後に低空で通過する」という 5〜8 秒のショットを作ります。用意したのは、兵士の walking と飛行機の通過、カメラの dolly-in→tilt-up を仕込んだ 3D の質感なしアニメーション動画と、夕景の兵士・飛行機・草原を撮ったスタイル参照写真の 2 つです。

これらを v2v に投げて写実的な golden hour ショットに仕上げます。Blender は使わず Three.js だけで済ませる、というのが縛りです。

## 3D プロキシ側 (Three.js)

Three.js 公式サンプルの `Soldier.glb` (Mixamo 由来、walking 内蔵) を GLTFLoader で読み込み、飛行機はプリミティブ (円柱 + 板ポリ翼) で組み立てています。カメラは 5s の中で dolly-in から tilt-up、飛行機通過までを smoothstep で繋いだ手付けのカメラワークです。マテリアルはすべて `clayMat` (中間グレーの MeshStandardMaterial) で統一しました。

RGB pass の見た目です。

![Three.js clay 3D 動画 (5s, RGB pass)](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/01-3d-clay-rgb.webp)

フレーム収集は Playwright の headless Chromium で 1 フレームずつ `page.locator('canvas').screenshot()` して PNG に落とし、ffmpeg で mp4 化しています。時間は `frame / FPS` の決定論クロックで駆動していて、`Date.now()` は再現性が崩れるので使っていません。

### depth pass

VACE の depth モード用に、同じシーンを depth 出力に切り替えられるようにしました。カスタム ShaderMaterial で view-Z を near/far で正規化し、`1 - t` を RGB に書き出しています。near を白、far を黒にしているのは ControlNet や VACE の慣例に合わせたためです。SkinnedMesh の depth を正しく出すには `#include <skinning_vertex>` を挟む必要がありました。

```js
function makeDepthMaterial({ skinning = false } = {}) {
  return new THREE.ShaderMaterial({
    defines: skinning ? { USE_SKINNING: '' } : {},
    vertexShader: `
      #include <common>
      #include <skinning_pars_vertex>
      varying float vViewZ;
      void main() {
        #include <skinbase_vertex>
        vec4 mvPosition;
        #ifdef USE_SKINNING
          #include <begin_vertex>
          #include <skinning_vertex>
          mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        #else
          mvPosition = modelViewMatrix * vec4(position, 1.0);
        #endif
        vViewZ = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vViewZ;
      uniform float uNear;
      uniform float uFar;
      void main() {
        float t = clamp((vViewZ - uNear) / (uFar - uNear), 0.0, 1.0);
        float v = 1.0 - t;
        gl_FragColor = vec4(v, v, v, 1.0);
      }
    `,
    uniforms: { uNear: { value: 1.0 }, uFar: { value: 80.0 } },
    fog: false,
  });
}
```

同じシーンを depth モードで出力したものです。

![depth pass (VACE 用 control video)](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/02-3d-depth.webp)

## 参照画像

参照画像は FLUX Pro Ultra の `raw=true` で写実寄りに 4 枚生成しました。1 枚目は「シーン全体を 1 枚に凝縮した style bible」で、残りの 3 枚は役割別 (兵士単体 / 飛行機単体 / 草原のみ) です。

<div style="display:flex; gap:1rem; align-items:flex-start; flex-wrap:wrap; margin:1.5rem 0;">
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/03-ref-cinematic-full.webp" alt="シーン全体の参照" width="240" />
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/04-ref-soldier.webp" alt="兵士単体の参照" width="240" />
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/05-ref-airplane.webp" alt="飛行機単体の参照" width="240" />
<img src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/06-ref-field.webp" alt="草原のみの参照" width="240" />
</div>

## 世代 1: Kling O3 Edit + 参照 1 枚

まず `fal-ai/kling-video/o3/pro/video-to-video/edit` に `video_url = 3D の RGB 動画`、`image_urls = [1 枚目の全体参照]` を渡し、prompt に「Restyle @Video1 in the style of @Image1」と書いて投入しました。$0.14/s × 8s = $1.12 です。

![Kling + 参照 1 枚 (v1)](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/10-kling-v1-single-ref.webp)

キャラは 1 人、飛行機も 1 機、質感は golden hour の写実になりました。ただし参照画像の構図をそのまま踏襲しており、3D 側で飛行機が写るはずのない初期フレームにも飛行機が出ています。

## 世代 2: Kling + 役割別参照 3 枚

参照画像を役割で分ければ制御しやすいと考え、兵士単体・飛行機単体・草原のみの 3 枚を渡し、prompt で `@Image1 for the soldier, @Image2 for the airplane, @Image3 for the field` と役割指定してみました。

![Kling + 参照 3 枚 (v2)](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/11-kling-v2-three-refs-duplicates.webp)

結果、兵士 2 人・飛行機 2 機になってしまいました。Kling の `image_urls` はドキュメント上 "style/appearance" と説明されていますが、実挙動としては「参照に写っている主題は追加登場物として合成する」に近く、入力動画に居る主題 + 参照画像の主題 = 2 個体で数が増えるようです。

## 世代 3: Wan VACE 14B depth に切り替え

Kling は参照が漏れるので、構造を縛れる control video 系に方針転換しました。`fal-ai/wan-vace-14b/depth` は control video (depth 動画) を受け取り、参照画像の内容と depth のシルエットを合成するモデルです。$0.08/s × 8s = $0.64 で Kling より安価です。

初回 (8s 版) の出力です。

![VACE 8s 初回](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/12-vace-8s-airplane-early.webp)

depth 動画には最初の 2.5s は飛行機が写っていないのに、出力の冒頭には飛行機が写っています。depth の空領域は「遠くて何もない」という意味で真っ黒になるのですが、VACE はこれを geometry がない領域、つまり自由に描いていい領域として扱うようです。そこに `ref_image_urls` の飛行機写真と prompt の airplane という単語が働いて、空いた空に「あってもいい飛行機」を模様として置いてしまう。depth は「そこに物がある」ことは強制できても「そこに物がない」ことは強制できず、空領域は常に生成側の裁量ゾーンになってしまいます。

## 世代 4: 5s + 飛行機を前倒し + guidance_scale 下げ

見上げた瞬間に飛行機がすでに frame 中央にあれば、別の 1 機を追加する隙を与えないのではないかと考え、5s に短縮して飛行機の登場を 1.5s に前倒し、`guidance_scale` もデフォルトの 5 から 3.5 に下げてみました。5s は Wan 2.1 VACE の学習域 (81 frame @ 16fps ≒ 5s) でもあります。

![VACE 5s 前倒し (v3)](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/13-vace-5s-retimed-opposite-plane.webp)

初期フレームの漏れは消えました。ただ今度はシーンの後半、飛行機が右へ抜けたあとで、反対方向から追加の 1 機が飛んできます。VACE は 150 フレーム全体を prompt にマッチするよう denoise するだけで、「もう飛行機は去った」という状態を持ちません。prompt に airplane と書いてある以上、後半にも airplane を配置しにきているようです。

## 世代 5: 3D プロキシに「密度」を足す

「空領域が黒 = 自由ゾーン」なのであれば、そもそも 3D 側で空白を作らない設計に変えるのが筋です。空には平たい雲の塊を、頭上にまばらに・中景から遠景にかけて層状に、計 12 群配置しました。地面は 200x200 の PlaneGeometry を頂点ごとに低周波 noise で perturb して起伏をつけ、兵士の足元 6m 半径だけはフラットに残しています。遠景には 3 段 cone (針葉樹シルエット) を 22 本並べて木立を作り、地平線には大きめの隆起した hill mesh を置いて凹凸を持たせました。

depth の uFar も 45 → 80 に広げて、遠方の雲や丘にも階調を残すようにしました。

密度を上げた 3D の RGB pass はページ冒頭に載せた動画の版になります。これを depth pass で出して VACE に投入し、参照は兵士 + 草原の 2 枚に減らしました (飛行機参照は外して bleeding を減らしています)。

![VACE 5s フィル後 (最終版)](https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/08-02-3d-proxy-to-vace-video/output/14-vace-5s-filled-scene.webp)

冒頭の空はもう「何もない黒」ではなく雲があるので飛行機が湧きにくくなりました。地面もフラット面ではなく起伏があるので `depth-conditioned VACE tends to preserve the overall layout but substantially alters the background` (runcomfy の一次情報) の症状が緩和され、それらしい草原が出るようになっています。

## 残った課題

- 反対方向から追加の飛行機が出るのは、フィルでは消せませんでした
- 木や雲のディテールは refs に木や雲が写っていないので generic な想像で描かれ、若干甘めです (参照に近景の木・雲を混ぜれば改善余地はあります)
- カメラ tilt 中の視点変化に refs のスタイルが完全には追従しません

fal 単発 API では手が足りず、追い込むなら ComfyUI ローカルで multi-control (depth + pose + edge) + inpainting mask + sliding window の pipeline を組む方向になりそうです。

## 今日のメモ

video diffusion に control video として食わせる 3D 動画を作るときに、今回わかったことをメモしておきます。

1. 空白を作らない。空・平坦な壁・空の背景は生成側にとって「創作許可」を意味します
2. 主題が居ない秒数を減らす。時間的な空白も同じ理由でハルシネーションを呼びます
3. 平面はノイズで perturb する。depth 経由の control では起伏があるほど「そこは地面」と解釈されやすくなります
4. プリミティブは high-poly で作る。低ポリの octagon 型雲は「8 角形の黒い塊」として字義通り出力されます
5. 参照画像は「登場物」として合成される前提で作る。写っているものは全部出てくるつもりで枚数と内容を決めるのが安全です

## 検証コスト内訳

| 項目 | 個数 | 単価 | 小計 |
|---|---|---|---|
| FLUX Pro Ultra (参照画像) | 4 | $0.06 | $0.24 |
| Kling O3 Edit Pro | 2 (8s) | $1.12/回 | $2.24 |
| Wan VACE 14B depth | 4 (5-8s) | $0.40-0.64/回 | ~$2.00 |
| **合計** | | | **~$4.48** |

fal MCP 経由で叩いたので、Claude Code の会話の中でモデル選定 → schema 確認 → submit → poll → download まで完結しました。

## 参考

- [runcomfy: The Dos and Don'ts of VACE](https://www.runpod.io/blog/the-dos-and-donts-of-vace)
- [runcomfy: VACE Wan2.1 Video-to-Video Workflow](https://www.runcomfy.com/comfyui-workflows/vace-wan2-1-video-to-video-workflow)
- [Wan2GP / deepbeepmeep](https://github.com/deepbeepmeep/Wan2GP/blob/main/docs/VACE.md)
- [fal.ai wan-vace-14b/depth](https://fal.ai/models/fal-ai/wan-vace-14b/depth)
