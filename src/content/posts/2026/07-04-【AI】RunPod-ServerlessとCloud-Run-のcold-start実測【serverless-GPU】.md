---
title: 【AI】RunPod ServerlessとCloud Run GPUのcold start実測【serverless GPU L4】
pubDate: 2026-07-04
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

「RunPod のほうが cold start 早いと噂だが本当か」を確かめるべく、**同一 workload** で **RunPod Serverless (Network Volume 構成)** と **Cloud Run GPU** を実測しました。

最初 n=1 で回したら SDXL RunPod で 61s の異常値が出て「20 min で cache が失効する!」と早合点しかけたのですが、n=4 に増やして分布を見たら **2 峰分布** (3 回は 12s 台、1 回だけ 61s) だったので、以下は分布として見た話になります。

## 結論

- **RunPod SDXL cold は 2 峰分布**: n=4 中 3 回は 12s 台、1 回だけ 61s に跳ねた (~25% で 5x 遅い)
- **Cloud Run cold は再現性が高い**: variance ±5s、n=3〜4 とも安定
- **期待値では RunPod のほうが速い**が、**tail latency (最悪ケース) は Cloud Run のほうが安定**

![cold start 実測結果 n=4 (点は個々のラウンド)](./07-04-cold-start-comparison.svg)

## 前提

- **workload 1**: SDXL Base 1.0 (Diffusers, fp16、prompt="A photo of an astronaut riding a horse"、25 steps、1024×1024)
- **workload 2**: Whisper large-v3 (faster-whisper, fp16、30s 英語音声を transcribe)
- **image**: 両者とも `pytorch/pytorch:2.11.0-cuda12.8-cudnn9-runtime` ベース
- **client**: Mac から fetch、東京 → US region で RTT ~150ms
- **測定**: client-side wall clock (fire → response received) を jsonl 記録
- **n=3〜4 per condition**: 統計的信頼区間は取れず、傾向のみ

## 構成の詳細

|項目 | Cloud Run | RunPod Serverless|
|---|---|---|
|GPU | NVIDIA L4 (24GB) | RTX PRO 6000 Blackwell MIG 1g.24gb *|
|Region / DC | us-central1 | US-IL-1|
|Weight 配置 | image bake (~15GB image) | Network Volume STANDARD 20GB (HF から seed)|
|min/max instances | 0 / 1 | 0 / 1|
|Idle 挙動 | scale-to-zero (~15 min) | worker 5s idle で死 + FlashBoot snapshot|

\* RunPod は `gpuTypeIds:["NVIDIA L4"]` を指定しましたが、AMPERE_24 pool (24GB VRAM) の中でスケジューラが Blackwell MIG を割り当てました。純 L4 vs L4 の比較ではないですが、同じ 24GB memory class で、workload 完遂性・応答時間ともに問題なし。

## 4 rounds の cold 実測

|Round | idle | RunPod SDXL | RunPod Whisper | Cloud Run SDXL | Cloud Run Whisper|
|---|---|---|---|---|---|
|R2 | ~2 min | 12.97s | 2.49s | 39.12s | 19.45s|
|R3 | 20 min | **61.47s** | 4.72s | 34.78s | 16.79s|
|R4 | 32 min | 12.86s | 3.58s | 38.13s | 15.97s|
|R5 | 20 min | 12.22s | 3.31s | 40.65s | 500 (\*\*)|

\*\* Round 5 の Cloud Run Whisper は HuggingFace CDN の 429 (試験用 audio URL を全 fire で共有していたため累計 24 回 fetch)。cold start 性能とは無関係で除外。

## Finding 1: RunPod SDXL cold は 2 峰分布

|Round | idle | RunPod SDXL cold | mode|
|---|---|---|---|
|R2 | ~2 min | 12.97s | fast|
|R3 | 20 min | **61.47s** | slow|
|R4 | 32 min | 12.86s | fast|
|R5 | 20 min | 12.22s | fast|

fast モード = FlashBoot snapshot 復元、slow モード = snapshot が evict されて image cache + volume mount + weight load + warmup を full でやり直した状態、と推測されます (61s は seed 91s から HF download 分の 30s を引いた値と概ね一致)。

**発生頻度**: n=4 では 1/4 = 25%。ただしサンプル少なく真の頻度は未確定。

## Finding 2: 時間ベースの単純な cache TTL ではない

- R3 (20 min idle) = 61s
- R5 (20 min idle) = 12s

**同じ 20 min idle でも結果が違う**。R4 の 32 min idle は 12s。「N 分経ったら cache 失効」という単純なモデルでは説明できません。

RunPod docs / community も「cache TTL は非公開、動的スケジューリング (systemwide のノード pressure や snapshot LRU 等)」と回答していて、ユーザ側から時間で予測はできません。**"時々遅い、頻度は 1/n" という分布として受け止めるしかない**。

## Finding 3: RunPod Whisper は分散小さい

n=4 とも 2.49-4.72s の狭い範囲、変動 1.9x のみ。Whisper (~3GB VRAM) は snapshot サイズが小さいため eviction されにくい可能性がある (だとしても仮説、n=4 では断定不可)。

## Finding 4: Cloud Run cold は再現性が高い

|endpoint | n | 実測範囲 | max/min|
|---|---|---|---|
|Cloud Run SDXL cold | 4 | 34.78 - 40.65s | 1.17x|
|Cloud Run Whisper cold | 3 | 15.97 - 19.45s | 1.22x|

variance ±5s。RunPod の SDXL 5x 変動と比較して 5-10 倍安定。**SLO を切りやすい**。「Cloud Run SDXL cold は 45s あれば入る」と言い切れます。

## Finding 5: 期待値 vs tail latency

RunPod の fast/slow 分布を weight 平均で見ると:

|endpoint | RunPod expected (n=4) | Cloud Run (n=3-4) | RunPod worst (max) | Cloud Run worst|
|---|---|---|---|---|
|SDXL cold | ~25s (12s × 3/4 + 61s × 1/4) | ~38s | 61s | 40.65s|
|Whisper cold | ~3.4s (median) | ~17s | 4.72s | 19.45s|

**期待値では RunPod のほうが速い**。ただし **SDXL の worst case は逆転** — たまに Cloud Run より遅くなる (25% 頻度)。ユーザ体感の p50 なら RunPod、p95/p99 の安定は Cloud Run。

## Finding 6: Registry proximity は罠

同じ SDXL image で構成を変えて cold を測ると:

|構成 | 場所 | cold|
|---|---|---|
|image bake (Round 1) | 15GB image を us-central1 AR → RunPod US-NE-1 に pull | 207.65s|
|Network Volume seed (Round 2) | 4GB image pull + HF から volume に 6.5GB download | 91.57s|

**AR → RunPod worker の pull より、HF Hub → volume の download の方が速い** (hf_transfer 有効時、HF は CDN 分散配置されているため)。RunPod で cold を早くしたければ、image を軽く保って weight は Network Volume に置くのが正解。

## Finding 7: Cloud Run redeploy 直後の "偽 cold" は絶対に踏むな

Round 1 で Cloud Run SDXL cold を **1.88s** と観測しました。「Cloud Run クソ速いじゃん」とツイートしそうになりました。実際は、redeploy 実行から 5 分後に fire したため、startup probe 用に立った container がまだ生存していて、warm を "cold" と誤認していただけでした。

Cloud Run で真 cold を測るには **redeploy から 15 min 以上のクールダウン** が必要。この blog 執筆で最も注意した落とし穴です。

## どう選ぶか

|状況 | 推奨|
|---|---|
|SLO を細かく切りたい (最悪ケースの予測) | Cloud Run|
|ユーザ体感の p50 を速くしたい (常時アクティブ想定) | RunPod|
|10GB+ モデル + 間欠アクセスで tail latency 気にする | Cloud Run|
|3GB 以下のモデル | RunPod (Whisper 側の分散小さい強さ)|
|複数モデルを 1 endpoint で切り替える (weight を volume に置いて選ぶ) | RunPod|
|1st cold の速さを最優先 | RunPod (fast モード引ければ)|

大モデル + まちまちのアクセス間隔という条件なら、**Cloud Run の予測しやすさが効きます**。逆に RunPod は Network Volume に weight を並べておいて別モデルに切り替えられる柔軟性が魅力で、実験的な用途で有利です。

## 検証コード

すべての Dockerfile / handler / fire script / raw jsonl は [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/07-04-serverless-gpu-cold-start-benchmark) に公開してます。同じ検証を再現したい人はどうぞ。

## Caveats

- **RunPod GPU の実体は Blackwell MIG**: 純 L4 vs L4 の比較ではない
- **n=3〜4 per condition**: 統計的信頼区間は取れず、傾向のみ
- **RunPod fast/slow の発生頻度は未確定**: 1/4 = 25% は n=4 の粗推定、真値は不明
- **FlashBoot cache eviction は非公開**: 時間だけでは予測不可、動的スケジューリング
- **client の地理**: 東京の Mac から、RunPod US-IL-1 / Cloud Run us-central1 とも約 150ms RTT
- **PyTorch 2.11 + cu128 前提**: SDXL は cu124 で試すと Blackwell MIG で hang するので、Blackwell に fallback される可能性のある RunPod では cu128+ image が必須
- **HF Hub 429 に注意**: 同一 audio URL を全 fire で使うと rate limit に引っかかる。production では audio を volume / GCS に持つ
