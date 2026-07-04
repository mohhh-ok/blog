---
title: 【AI】RunPod ServerlessとCloud Run GPUのcold start実測【serverless GPU L4】
pubDate: 2026-07-04
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

serverless GPU の cold start を語る記事はいっぱいあるんですが、ほとんど vendor 発の主張 (「FlashBoot で sub-200ms」等) の受け売りで、独立ベンチが薄いです。

実サービスで avatar / lip-sync を Cloud Run GPU L4 で回している私が、「これ、RunPod のほうが cold start 早いって噂だけど本当か」を確かめるべく、**同一 workload** で **RunPod Serverless (Network Volume 構成)** と **Cloud Run GPU** を実測しました。

結論を先に:

- **FlashBoot が生きているうちは RunPod が圧倒的に速い** (Cloud Run cold 39s vs RunPod 12s)
- **でも 20 min idle するとモデルサイズ次第で結果が反転**: SDXL は Cloud Run が勝ち、Whisper は RunPod が勝ち
- **Cloud Run cold は再現性が高い** (variance ±5s)、RunPod は cache 状態依存

![cold start 実測結果 (SDXL / Whisper × RunPod / Cloud Run × FlashBoot 状態別)](./07-04-cold-start-comparison.svg)

## 前提

- **workload 1**: SDXL Base 1.0 (Diffusers, fp16、prompt="A photo of an astronaut riding a horse"、25 steps、1024×1024)
- **workload 2**: Whisper large-v3 (faster-whisper, fp16、30s 英語音声を transcribe)
- **image**: 両者とも `pytorch/pytorch:2.11.0-cuda12.8-cudnn9-runtime` ベース
- **client**: Mac から fetch、東京 → US region で RTT ~150ms
- **測定**: client-side wall clock (fire → response received) を jsonl 記録
- **n=1 per condition**: variance は取ってません。判断に使うなら n=5-10 推奨

## 構成の詳細

|項目 | Cloud Run | RunPod Serverless|
|---|---|---|
|GPU | NVIDIA L4 (24GB) | RTX PRO 6000 Blackwell MIG 1g.24gb *|
|Region / DC | us-central1 | US-IL-1|
|Weight 配置 | image bake (~15GB image) | Network Volume STANDARD 20GB (HF から seed)|
|min/max instances | 0 / 1 | 0 / 1|
|Idle 挙動 | scale-to-zero (~15 min) | worker 5s idle で死 + FlashBoot snapshot|

\* RunPod は `gpuTypeIds:["NVIDIA L4"]` を指定しましたが、AMPERE_24 pool (24GB VRAM) の中でスケジューラが Blackwell MIG を割り当てました。純 L4 vs L4 の比較ではないですが、同じ 24GB memory class で、workload 完遂性・応答時間ともに問題なし。

## 3 rounds の測定戦略

- **Round 1 (破棄)**: image bake 構成の初回計測。Cloud Run 側は redeploy 直後の probe warm 状態を "cold" として fire してしまい非採用（→ 罠のセクション参照）
- **Round 2 (FlashBoot warm)**: seed fire 直後 (2 分以内) に fire。RunPod は FlashBoot snapshot からの復元、Cloud Run は 25 分以上 idle 後の真 cold
- **Round 3 (20 min idle 後)**: Round 2 から 20 min 待って再 fire。RunPod FlashBoot cache が失効しているか検証

## Round 2 結果 (FlashBoot warm 直後)

|endpoint | cold | warm 1 | warm 2|
|---|---|---|---|
|RunPod SDXL (FlashBoot warm) | **12.97s** | 10.61s | 12.60s|
|RunPod Whisper (FlashBoot warm) | **2.49s** | 1.59s | 2.31s|
|Cloud Run SDXL (真 cold) | 39.12s | 14.54s | 15.60s|
|Cloud Run Whisper (真 cold) | 19.45s | 1.14s | 1.14s|

FlashBoot が効いた RunPod は **Cloud Run cold の 1/3〜1/8**。SDXL warm は Cloud Run のほうが微妙に速いですが誤差範囲。

## Round 3 結果 (20 min idle 後)

|endpoint | cold | warm 1 | warm 2|
|---|---|---|---|
|RunPod SDXL (FlashBoot **expired**) | **61.47s** | 11.67s | 10.91s|
|RunPod Whisper (FlashBoot **still warm**) | 4.72s | 1.85s | 2.44s|
|Cloud Run SDXL (真 cold) | 34.78s | 11.98s | 12.24s|
|Cloud Run Whisper (真 cold) | 16.79s | 1.13s | 1.13s|

## Finding 1: FlashBoot cache はモデルサイズで持続時間が変わる

同じ 20 min idle 後の Round 3 で、SDXL と Whisper で明暗が分かれました。

|endpoint | Round 2 fresh | Round 3 (20 min idle) | 増加率|
|---|---|---|---|
|RunPod Whisper cold | 2.49s | 4.72s | 1.9x|
|RunPod SDXL cold | 12.97s | 61.47s | **4.7x**|

Whisper (~3GB VRAM) の cache は 20 min 越えても生きている一方、SDXL (~10GB VRAM) は明らかに snapshot restore に頼れなくなっている (61.47s は 91.6s の初回 seed = HF から全部 download する状態に近い)。

RunPod docs は「FlashBoot は active endpoints で sub-200ms cold start」と書きますが、**cache TTL は非公開、model size 依存も触れられていません**。production で 10GB+ のモデルを載せる場合、20 min 以上 idle するリクエストは cold penalty を食らう可能性があります。

## Finding 2: 20 min idle 後の勝敗はモデルサイズで反転する

|workload | 勝者 | 差|
|---|---|---|
|SDXL cold (~10GB VRAM) | **Cloud Run** | 34.78s vs 61.47s|
|Whisper cold (~3GB VRAM) | **RunPod** | 4.72s vs 16.79s|

「serverless GPU なら RunPod > Cloud Run」ではなく、**モデルサイズと idle パターン次第で逆転する**。avatar / lip-sync 系の大モデル (5GB+) を頻繁に休ませる用途では Cloud Run のほうが安定するかも。

## Finding 3: Cloud Run cold は再現性が高い

Round 2 vs Round 3 の Cloud Run 真 cold:

|endpoint | Round 2 | Round 3 | 差|
|---|---|---|---|
|Cloud Run SDXL cold | 39.12s | 34.78s | ±5s|
|Cloud Run Whisper cold | 19.45s | 16.79s | ±3s|

RunPod は FlashBoot cache 状態に大きく左右されるが、Cloud Run は毎回同水準。**運用予測しやすさは Cloud Run**。SLO を切りやすい。

## Finding 4: Registry proximity は罠

同じ SDXL image で構成を変えて cold を測ると:

|構成 | 場所 | cold|
|---|---|---|
|image bake (Round 1) | 15GB image を us-central1 AR → RunPod US-NE-1 に pull | 207.65s|
|Network Volume seed (Round 2) | 4GB image pull + HF から volume に 6.5GB download | 91.57s|

**AR → RunPod worker の pull より、HF Hub → volume の download の方が速い** (hf_transfer 有効時、HF は CDN 分散配置されているため)。RunPod で cold を早くしたければ、Docker Hub / GHCR / HF Hub 経由の方が Google AR より速いかもしれません。

## Finding 5: Cloud Run redeploy 直後の "偽 cold" は絶対に踏むな

Round 1 で Cloud Run SDXL cold を **1.88s** と観測しました。「Cloud Run クソ速いじゃん」とツイートしそうになりました。実際は、redeploy 実行から 5 分後に fire したため、startup probe 用に立った container がまだ生存していて、warm を "cold" と誤認していただけでした。

Cloud Run で真 cold を測るには **redeploy から 15 min 以上のクールダウン** が必要。この blog 執筆で最も注意した落とし穴です。

## どう選ぶか

|状況 | 推奨|
|---|---|
|10GB+ モデル、リクエストが 20 min 以上開くことがある | Cloud Run|
|3GB 以下のモデル、あるいはリクエスト間隔が短い | RunPod|
|SLO を細かく切りたい (cold 予測の安定性) | Cloud Run|
|1st cold の速さを最優先 (常時アクティブなサービス) | RunPod|
|複数モデルを 1 endpoint で切り替える (weight を volume に置いて選ぶ) | RunPod|

私の avatar / lip-sync は大モデル + まちまちのアクセス間隔なので、**Cloud Run 継続** が現時点の結論です。ただし RunPod は Network Volume で weight を差し替えるだけで別モデルに切り替えられる柔軟性があり、実験的な用途では有利です。

## 検証コード

すべての Dockerfile / handler / fire script / raw jsonl は [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/07-04-serverless-gpu-cold-start-benchmark) に公開してます。同じ検証を再現したい人はどうぞ。

## Caveats

- **RunPod GPU の実体は Blackwell MIG**: 純 L4 vs L4 の比較ではない
- **n=1 per condition**: 1 発しか撃ってないので統計的信頼区間は取れず
- **FlashBoot cache TTL は非公開**: 20 min では Whisper 側は生きていた。SDXL は失効。厳密な失効時間は不明
- **client の地理**: 東京の Mac からで、RunPod US-IL-1 / Cloud Run us-central1 とも約 150ms RTT
- **PyTorch 2.11 + cu128 前提**: SDXL は cu124 で試すと Blackwell MIG で hang するので、Blackwell に fallback される可能性のある RunPod では cu128+ image が必須
