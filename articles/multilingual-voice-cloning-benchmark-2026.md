---
title: "10秒音声で7言語ゼロショット生成比較（F5・XTTS・OpenVoice・ElevenLabs）"
emoji: "🎙️"
type: "tech"
topics: ["ai", "tts", "voiceclone", "elevenlabs", "python"]
published: true
---

## 比較対象

- 言語: ja / en / zh / ko / fr / es / de
- モデル:ElevenLabs (eleven_multilingual_v2) / XTTS-v2 / OpenVoice v2 / F5-TTS

## 結論

- 総合 1 位は ElevenLabs (eleven_multilingual_v2)。7 言語中 5 言語で書き起こし完全一致、ja/ko も実質完璧、唯一 zh で 1 単語幻聴
- OSS の総合 1 位は XTTS-v2。6 言語完璧、ko だけ中盤に幻聴フレーズ
- OpenVoice v2 は ko で OSS 内ベスト、ただし MeloTTS の制約で de は構造的に出力不可
- F5-TTS は en/zh 専用。fr/es/de は意味は通るが幻聴ワード混入、ja/ko は完全破綻

![7言語×4モデルのbigram Jaccardヒートマップ](https://raw.githubusercontent.com/mohhh-ok/blog/main/src/content/posts/2026/06-20-heatmap.svg)

検証コード・生成音声・スコア JSON はすべて GitHub に公開しています。

https://github.com/mohhh-ok/blog-examples/tree/main/2026/06-19-multilingual-voice-cloning-benchmark

## TTSどれがいいのか問題

TTSはたくさんあります。サービスの中で音声比較ができる所はいくつかあるものの、横断的にできる所はなかなかありません。特に日本語だと皆無のようです。そこでTTSの比較をしてみました。

## 検証の流れ

AIでほぼ自動で回せるようにしています。

- 参照音源を用意（人手）
- モデル毎に音声生成 -> Whisperで文字起こし -> 比較（AI）

最初の参照音源だけは人で作成し、その後はAIが生成と確認のフローを回せます。なお初期ではmacOSの「say」コマンドで参照音源も生成していたのですが、やはり人間の声で試したほうが実際の結果に近づけるだろうと、方針転換した次第です。

## 共通条件

| 項目 | 値 |
|---|---|
| 参照音声 | 自分の声、24kHz mono 約10秒 |
| 参照テキスト | 「本日はお忙しい中お越しいただき…」業務報告風 |
| 生成プロンプト | 7 言語ぶん、固有名詞なし |
| 検証 ASR | faster-whisper large-v3 int8 (CPU) |
| 一次指標 | bigram Jaccard (Whisper 側の句読点揺れに寛容) |
| 二次指標 | CER, WER |
| 実行環境 | macOS Apple Silicon, CPU |

参照音声 (これを 1 本だけ全モデルに投げます):

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/reference/ref.wav"></audio>

## 結果サマリ

### 総合スコア (bigram Jaccard、1.00 = 完全一致)

| model | ja | en | zh | ko | fr | es | de |
|---|---:|---:|---:|---:|---:|---:|---:|
| f5_tts | 0.02 | 1.00 | 1.00 | 0.00 | 0.66 | 0.68 | 0.73 |
| xtts | 0.80 | 1.00 | 1.00 | 0.63 | 1.00 | 1.00 | 1.00 |
| openvoice | 0.77 | 1.00 | 0.73 | 0.86 | 1.00 | 1.00 | — |
| elevenlabs | 0.93 | 1.00 | 0.70 | 0.93 | 1.00 | 1.00 | 1.00 |

### CER (低いほど良い)

| model | ja | en | zh | ko | fr | es | de |
|---|---:|---:|---:|---:|---:|---:|---:|
| f5_tts | 0.86 | 0.00 | 0.00 | 0.88 | 0.24 | 0.29 | 0.30 |
| xtts | 0.09 | 0.00 | 0.00 | 0.41 | 0.00 | 0.00 | 0.00 |
| openvoice | 0.11 | 0.00 | 0.08 | 0.05 | 0.00 | 0.00 | — |
| elevenlabs | 0.02 | 0.00 | 0.12 | 0.02 | 0.00 | 0.00 | 0.00 |

## 日本語 (ja) 聴き比べ

期待テキスト: 皆さん、こんにちは。本日は新しい機能についてご紹介します。どうぞよろしくお願いいたします。

### F5-TTS (bigram 0.02 / CER 0.86)

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/f5_tts/ja.wav"></audio>

Whisper 書き起こし: 「お待ちしております。」

完全破綻です。全く別の文を 10 秒分発話しています。F5-TTS_v1_Base は学習データ (Emilia 10万時間) が英中ベースで日本語サンプルが薄く、文として成立しません。

### XTTS-v2 (bigram 0.80 / CER 0.09)

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/xtts/ja.wav"></audio>

Whisper 書き起こし: 「みなさんこんにちは 本日は新しい機能についてご紹介しますどうぞよろしくお願いいたします」

内容一致しています。句読点が落ちるだけで音節は完全に揃っています。WER は 1.00 になっていますがこれは Whisper 側で「みなさんこんにちは」が 1 ワード扱いされる影響で、内容としては実質完璧です。

ただし声が微妙に変わって、暗くなっている印象があります。

### OpenVoice v2 (bigram 0.77 / CER 0.11)

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/openvoice/ja.wav"></audio>

Whisper 書き起こし: 「皆さん、今日は本日は新しい機能についてご紹介します。どうぞよろしくお願いいたします。」

「こんにちは」→「今日は」と転倒し、続く「本日は」と二重化しています。後半は完璧。MeloTTS をベース合成に使う 2 段構成で、ベース側の発音ミスがそのまま乗る感じです。

また、外国人が日本語を喋っているような印象があります。

### ElevenLabs (bigram 0.93 / CER 0.02)

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/elevenlabs/ja.mp3"></audio>

Whisper 書き起こし: 「皆さんこんにちは。本日は新しい機能についてご紹介します。どうぞよろしくお願いいたします。」

実質完璧です。「皆さん、こんにちは」の読点が抜けただけで、CER 0.02 は計測誤差レベル。

明るく聞きやすい印象です。

## 韓国語 (ko) 聴き比べ — 隠れた激戦区

期待テキスト: 여러분 안녕하세요. 오늘은 새로운 기능을 소개해 드리겠습니다. 잘 부탁드립니다.

韓国語は今回の隠れた山場でした。各モデルの傾向がここで一番ハッキリ出ます。

### F5-TTS (bigram 0.00 / CER 0.88)

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/f5_tts/ko.wav"></audio>

Whisper 書き起こし: 「띠오, 띠오키오스, 셰오아춘아에드, 고유도바셰이웨이치오, 팅중웨이, 제찬…」

完全破綻。意味のない音節列です。学習データに ko が薄いと、こうなります。

### XTTS-v2 (bigram 0.63 / CER 0.41)

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/xtts/ko.wav"></audio>

Whisper 書き起こし: 「여러분 안녕하세요 지지연의 플레임 대통령 오늘은 새로운 체험인행을 소개해 드리겠습니다. 잘 부탁드립니다.」

冒頭と末尾は完璧、中盤に「지지연의 플레임 대통령 (ジジヨンのフレーム大統領)」という幻聴フレーズが混入しています。文として崩れているわけではなく、しっかり意味のある単語に化けるのが XTTS の怖いところです。

また、お腹が空いて力が出ないようなか細い声になっています。（参照音源にも問題ありかもしれませんが。なお私はしっかり食べています）

### OpenVoice v2 (bigram 0.86 / CER 0.05)

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/openvoice/ko.wav"></audio>

Whisper 書き起こし: 「여러분 안녕하세요. 오늘은 새로운 디넴을 소개해 드리겠습니다. 잘 부탁드립니다.」

「기능을」→「디넴을」1 単語の幻聴のみ、他は完璧。OSS では今回ベストの ko です。

### ElevenLabs (bigram 0.93 / CER 0.02)

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/elevenlabs/ko.mp3"></audio>

Whisper 書き起こし: 「여러분 안녕하세요. 오늘은 새로운 기능을 소개해드리겠습니다. 잘 부탁드립니다.」

今回全モデル中のベスト ko。差分は「소개해 드리겠습니다」のスペース欠落のみです。

## 中国語 (zh) — ElevenLabs 唯一の弱点

期待テキスト: 大家好，今天我将为大家介绍一项新功能，感谢您的参与。

ElevenLabs の zh は今回唯一のミス箇所です。

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/elevenlabs/zh.mp3"></audio>

Whisper 書き起こし: 「大家好,今天我将为大家介绍已相信功能,感谢您的参与」

「介绍一项新功能」→「介绍已相信功能」と単語が化けています (bigram 0.70 / CER 0.12)。

参考に F5-TTS と XTTS の zh は両方とも完全一致でした。

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/f5_tts/zh.wav"></audio>

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/xtts/zh.wav"></audio>

中国語特化のユースケースなら ElevenLabs より OSS 勢が上、というのは記憶しておいてよさそうです。

## en / fr / es / de — 上位 3 モデルは完璧

en, fr, es, de は XTTS-v2 / OpenVoice v2 / ElevenLabs の 3 つが全て CER 0.00で並んでいます。差を出すのが難しい言語です。F5-TTS だけ fr/es/de でやや崩れます。

代表で en (XTTS) と de (ElevenLabs):

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/xtts/en.wav"></audio>

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/06-19-multilingual-voice-cloning-benchmark/output/elevenlabs/de.mp3"></audio>

全 7 言語 × 4 モデルの音源は [GitHub の output/ ディレクトリ](https://github.com/mohhh-ok/blog-examples/tree/main/2026/06-19-multilingual-voice-cloning-benchmark/output) に置いてあります。

## 用途別の現実的な選び方

| 要件 | おすすめ | 補足 |
|---|---|---|
| 全 7 言語の品質最優先・API 課金OK | ElevenLabs | Starter プラン以上 ($5/月〜) + 従量課金。10秒 ref.wav から IVC で即 voice 化 |
| OSS で多言語クローン | XTTS-v2 | 6 言語完璧、ko だけ中盤に幻聴。Coqui Public Model License |
| ko 重視・OSS・商用利用 | OpenVoice v2 | OSS 内で唯一 ElevenLabs 並みの ko。ただし de 不可、セットアップ難易度高め、MIT |
| 英中のみ・非商用・完全自己ホスト | F5-TTS | en/zh は完璧、それ以外は割り切る。CC-BY-NC |

## セットアップで詰まったポイント

ベンチを回す途中で「えっこれ詰みでは」となった瞬間を備忘で残します。

### XTTS-v2

- TTS 0.22.0 が transformers 5.x と非互換 (`BeamSearchScorer` 削除済み) → `pip install 'transformers<4.41'`
- PyTorch 2.6+ で `torch.load` の `weights_only=True` がデフォルト化 → `torch.serialization.add_safe_globals([XttsConfig, ...])` を冒頭に
- 日本語前処理に `cutlet` と `unidic-lite` 必要
- 新しい torchaudio が `torchcodec` バックエンド必須

### OpenVoice v2 — 今回一番ハマりました

- `setup.py` の pin が古すぎて素直に入らない → `--no-deps` で本体だけ入れて依存は個別 install
- `whisper-timestamped` の VAD が `torch.hub.load` で trust 確認を要求 → `~/.cache/torch/hub/trusted_list` に `snakers4_silero-vad` を事前登録
- `melo/text/chinese_bert.py` が `device='cpu'` を無視して MPS に切り替える → `torch.backends.mps.is_available = lambda: False` で潰す
- `converter.convert(..., message="")` が watermark で shape mismatch → 非空文字列必須
- macOS APFS の case-insensitive で `mecab-python3` (大文字 `MeCab`) と `python-mecab-ko` (小文字 `mecab`) が衝突。ko を動かすために後者だけ残し、`MeCab` をスタブ化して melo の cleaner の import を通している。この構成では ja を再生成できない

詳細は [`scripts/generate_openvoice.py`](https://github.com/mohhh-ok/blog-examples/blob/main/2026/06-19-multilingual-voice-cloning-benchmark/scripts/generate_openvoice.py) の冒頭コメント参照。

## Style-Bert-VITS2 を外した理由

最初は SBV2 JP-Extra も並べる予定でしたが、最終的に対象外としました。

- 方式が違う: SBV2 はゼロショットではなく fine-tune 前提。「ref.wav 1 本を投げて即生成」の枠に物理的に乗らない
- 参照音声の要件が一桁違う: 推奨 1〜3 分。今回の `ref.wav` (10秒) では不足
- 学習環境が違う: 100 epoch の fine-tune は GPU 前提、CPU では数時間オーダー

外部評価値が欲しい場合は、第三者査読の比較論文 [arxiv:2505.17320](https://arxiv.org/abs/2505.17320) (Aoki et al. 2025, IEEE 採録) が参考になります。キャラクター演技音声 10〜15 分で fine-tune した SBV2JE が overall WER 0.04、MOS 4.37 で人間原音と統計的有意差なし。ただし ASR・データセット・指標が全部違うので、本記事の数字とは並べないでください。

## 余談: 「声が秘匿不可能な時代」の防御の話

今回、自分の声の clone を 4 モデルで作って公開しました。「声がクローン素材として晒される」点を心配する向きもあるかもしれません。が、これに関しては腹を括る時代に来ていると思っています。

YouTube・Podcast・Zoom 録画・カンファ登壇 — 10 秒の声があれば IVC が成立する以上、対象が発話する仕事をしている限りクローン可能性は実質 100%です。「公開しない」防御はもう成立していません。

実効性のある防御はこの 3 層だと考えています。

- 個人: 家族間のコードワード、銀行の声紋認証を切る、「DM で金の話は絶対しない」を baseline として公開
- 習慣: 受信側のコールバック文化。聞いたチャネルではなく自分が知ってる別チャネルで掛け直す
- 技術: 「本物に署名する」方向 (C2PA, Content Credentials)。公人が正規発言に署名し、署名なし = 真偽不明として扱う規範

「クローンされること」と「クローンが悪用されて被害が出ること」を分けて考える、というのが思考の起点です。前者は防げない、後者は防げる。「私の声でこういう発言がされていますがそれは私ではありません」を即座に否認できる準備こそが防御の本体だと思います。

## まとめ

- 多言語ボイスクローンの総合ベストは ElevenLabs。zh だけ要注意
- OSS なら XTTS-v2 が万能、OpenVoice v2 は ko 特化
- F5-TTS は en/zh 専用と割り切る
- 検証コード・音源・スコアはすべて [GitHub に公開](https://github.com/mohhh-ok/blog-examples/tree/main/2026/06-19-multilingual-voice-cloning-benchmark)

## 参考

以下はAIが参照したと思われるサイトです。検証しておりませんので、そのつもりでご参照いただければ幸いです。

- F5-TTS 論文: [arXiv:2410.06885](https://arxiv.org/abs/2410.06885)
- XTTS: [arXiv:2406.04904](https://arxiv.org/abs/2406.04904)
- OpenVoice: [arXiv:2312.01479](https://arxiv.org/abs/2312.01479)
- Style-Bert-VITS2: [GitHub](https://github.com/litagin02/Style-Bert-VITS2) / [評価論文](https://arxiv.org/abs/2505.17320)
- faster-whisper: [GitHub](https://github.com/SYSTRAN/faster-whisper)
