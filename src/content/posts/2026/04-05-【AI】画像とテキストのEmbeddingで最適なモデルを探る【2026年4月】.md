---
title: 【AI】画像とテキストのEmbeddingで最適なモデルを探る【2026年4月】
pubDate: 2026-04-05
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## マルチモーダルモデル
最近ではテキストのみならず、画像や動画なども入力として扱えるモデルが登場していますが、それらはマルチモーダルモデルと呼ばれます。

今回はマルチモーダルモデルEmbeddingのベンチマークを見ていきます。

## ベンチマークの種類
一般的なEmbeddingベンチマークは以下かと思います。

- MTEB (Massive Text Embedding Benchmark): テキストEmbedding
- MMEB (Massive Multimodal Embedding Benchmark): マルチモーダルEmbedding

今回必要なのはMMEBでHugging Faceに掲載されていますが、重要なGemini Embedding 2が漏れています。ですので、他を探してみます。

- CCKM（Cross-modal, Cross-lingual, Key information, MRL）

こちらはMilvus (ベクトルデータベース)のページにあるベンチマークです。MTEBやMMEBで漏れている観点を補っているとされています。Gemini Embedding 2が含まれているので、こちらを参考にしていきます。

https://milvus.io/ja/blog/choose-embedding-model-rag-2026.md

## テキストと画像のEmbedding
テキストと画像を同じベクトル空間に埋め込む比較は、下記の結果です。

| モデル | スコア (R@1) | Modality Gap | パラメータ数 |
|--------|-------------|--------------|------------|
| Qwen3-VL-2B | 0.945 | 0.25 | 2B（オープンソース）|
| Gemini Embedding 2 | 0.928 | 0.73 | 非公開（クローズド）|
| Voyage Multimodal 3.5 | 0.900 | 0.59 | 非公開（クローズド）|
| Jina CLIP v2 | 0.873 | 0.87 | 約1B |
| CLIP ViT-L-14（2021基準） | 0.768 | 0.83 | 428M |

Qwen, Gemini, Voyageの３強となっています。VoyageはModality Gapは低めなのにGeminiに負けていますが、他の要因で下がっていそうです。Jina CLIP v2が後に続いています。

## MRL、次元数を落とした時の性能
テキストでの次元数を切り落とした時の比較で、MRL (Matryoshka Representation Learning)で訓練されているかどうかも重要なようです。なおテキストのみで画像は含まれていないため、あくまで参考程度です。

| モデル | ρ（フル次元） | ρ（256次元） | 劣化率 |
|--------|------------|------------|--------|
| Voyage Multimodal 3.5 | 0.880 | 0.874 | 0.7% |
| Jina Embeddings v4 | 0.833 | 0.828 | 0.6% |
| mxbai-embed-large | 0.815 | 0.795 | 2.5% |
| nomic-embed-text | 0.781 | 0.774 | 0.8% |
| OpenAI 3-large | 0.767 | 0.762 | 0.6% |
| Gemini Embedding 2 | 0.683 | 0.689 | -0.8% |

Gemini Embedding 2のフル次元値が低いのは、テストの種別による可能性があります。また劣化率がマイナスになっていますが、これは誤差の範囲かと思います。表自体の並び替えがフル次元の値で行われており、本来劣化率でソートすべきところではないかと思いますが、意図はわかりません。劣化率で言えばGemini Embedding 2が最も優秀です。ただおおむね、mxbai-embed-large以外はそれほど劣化しないようです。

## 総合評価
今回このページでご紹介しなかった指標も含めた総合評価です。

| モデル | Cross-Modal | Cross-Lingual | Key Info | MRL ρ |
|--------|------------|--------------|----------|--------|
| Gemini Embedding 2 | 0.928 | 0.997 | 1.000 | 0.668 |
| Voyage Multimodal 3.5 | 0.900 | 0.982 | 1.000 | 0.880 |
| Jina Embeddings v4 | — | 0.985 | 1.000 | 0.833 |
| Qwen3-VL-2B | 0.945 | 0.988 | 1.000 | — |
| OpenAI 3-large | — | 0.967 | 1.000 | 0.760 |
| Cohere Embed v4 | — | 0.955 | 1.000 | — |
| Jina CLIP v2 | 0.873 | 0.934 | 1.000 | — |
| BGE-M3 | — | 0.940 | 0.973 | 0.744 |
| mxbai-embed-large | — | 0.120 | 0.660 | 0.815 |
| nomic-embed-text | — | 0.154 | 0.633 | 0.780 |

Gemini Embedding 2のMRL ρの値が違いますがミスかもしれません。

## まとめ
Qwen3-VL-2B, Gemini Embedding 2, Voyage Multimodal 3.5の３つあたりが総じて良さそうかなと思いました。Jina CLIP v2はその次ですね。それぞれ見てみます。

### Qwen3-VL-2B
オープンソースなので自前のインフラか、GPU付きのクラウドで運用する形になるかと思います。APIではないので情報が漏れない設計ですが、中国企業開発のため地政学的リスクを考慮する必要があります。

### Gemini Embedding 2
Google CloudのAPIとして利用できるため、インフラの管理が不要です。Vertex AIやGemini APIから呼び出すだけで使えるので、既にGoogle Cloudを利用している環境であればすぐに導入できます。ただし2026年4月5日現在パブリックプレビュー版なので、そこは注意が必要です。

### Voyage Multimodal 3.5
無難に行くと、これが一番いいかもしれません。Voyage AIのAPIとして利用します。

### Jina CLIP v2 / Jina Embeddings v4
Jinaはオープンソースで提供されており、APIも利用可能です。
