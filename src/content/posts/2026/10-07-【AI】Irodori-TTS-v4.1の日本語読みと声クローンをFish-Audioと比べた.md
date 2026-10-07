---
title: "【AI】Irodori-TTS v4.1の日本語読みと声クローンをFish Audioと比べた【常用漢字100文】"
pubDate: 2026-10-07
categories: ["TTS"]
---

こんにちは、フリーランスエンジニアのmohです。この記事はほとんどAIが書いたものを、私が加筆修正しています。検証不十分な部分もあるかと思いますが、ご容赦ください。ご指摘等ございましたら、Github issueか、Xでお願いいたします。

日本語で読み間違いが少なく、自分の声をクローンできる TTS を探しています。[IndexTTS-2.5](/blog/posts/2026/08-27-aiindextts-25の日本語読み指定とvoice-clone一貫性をrunpodで検証かな強制seed固定/) は声の似方で Fish Audio に届かず、[Gemini 3.8 Flash TTS](/blog/posts/2026/09-24-aigemini-38-flash-ttsの声クローンをfish-audioと聴き比べた/) は別の声になりました。今回は日本語専用のオープンモデル [Irodori-TTS v4.1-Small](https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small) (MIT ライセンス) を、普段使っている Fish Audio `s2.1-pro` と同じ参照音声・同じ文で比べました。Fish より日本語の読みは良いだろうと見当をつけていたので、読みの正確さを本題にしています。

## 結論

- 読みは Irodori のほうが正確でした。常用漢字の読みを問う 100 文で、対象の漢字を正しく読めたのは Irodori 98 文、Fish 92 文です。Irodori だけ正しかった文が 6、Fish だけ正しかった文は 0 でした
- 自分で聴いた感じでは、音質はほぼ同じで、読み間違いは Irodori のほうが少ないという差でした
- 数字・時刻・金額・英字略語の 10 文は Irodori 9 文、Fish 7 文。Irodori は「14時30分」の 14 時を崩しました
- 声の似方の数値 (参照音声との類似度) は、同じ文 5 回で Irodori 0.908、Fish 0.913 とほぼ並びました。IndexTTS-2.5 は同じ条件で 0.848 でした
- Irodori は seed を指定すると、同じ入力から同じ音声がバイト単位で出ます。Fish の API には seed がありません
- Irodori には読みを指定する手段がありません。誤読が出たときに直す道具が要るなら、Fish か IndexTTS-2.5 のほうが手が打てます

## 試した条件

- Irodori-TTS v4.1-Small: RunPod の RTX 4090 で動かしました。設定はモデルカードの既定 (fp32、40 ステップ)。参照音声を 1 本渡し、参照の書き起こしは渡しません (Irodori は使わない)
- Fish Audio `s2.1-pro`: API の zero-shot clone で、参照音声と書き起こしを毎回送りました
- 参照音声: [08-26 の記事](/blog/posts/2026/08-26-aifish-audioのzero-shot-voice-cloneは毎回同じ声が出るのか話者embeddingで測定/)から使っている自分の声 10 秒。声の似方だけは、09-24 の記事の 26 秒の録音でも試しました。Irodori のモデルカードは参照を 30 秒以上にするよう勧めているので、10 秒は Irodori に不利な条件です
- 読みの文: [Joyo Kanji Yomi Benchmark: Parakeet Edition](https://huggingface.co/datasets/Parakeet-Inc/joyo-kanji-yomi-benchmark-parakeet) (以下 JKYB-Parakeet。常用漢字の読みのベンチマーク、13,536 文。元のベンチマークは SB Intuitions の [Sarashina2.2-TTS の論文](https://arxiv.org/abs/2606.25369)) から無作為に選んだ 100 文。各文に判定対象の漢字と正解の読みが付いています。ほかに数字・英字の自作 10 文と、08-27 で使った誤読しやすい 5 文
- 声の似方: 「本日は晴天なり。マイクのテスト中です。この音声は、ゼロショット音声合成のサンプルです。」を 5 回生成し、話者の特徴量 (resemblyzer) で参照音声との類似度を測りました。08-26・08-27 と同じ文・同じ指標です

読みの判定は次の順で行いました。

1. 生成した音声を gpt-4o-transcribe に渡し、聞こえたとおりの音をカタカナだけで書き起こさせる。普通の書き起こしは誤読を正しい漢字に直してしまうため
2. JKYB-Parakeet 公式の採点ツールで、対象の漢字の部分が正解の読みと一致したかを判定する
3. 不正解になった文はもう一度書き起こし、書き起こし側の誤りの疑いを確かめる

計測コード・全文の書き起こし・判定結果は [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/10-07-irodori-tts-japanese) にあります。

## 読みの結果

| 文 | Irodori | Fish |
|---|---|---|
| 常用漢字 100 文 | 98/100 | 92/100 |
| 数字・英字 10 文 | 9/10 | 7/10 |

100 文で 6 対 0 の偏りは、同じ文で 2 モデルを比べる検定 (McNemar の正確検定) で p=0.031 でした。たまたまの差とは言いにくい大きさです。数字・英字は 10 文しかないので、傾向として見てください。

不正解の内訳です。

| 文 (対象の語) | Irodori | Fish |
|---|---|---|
| 保留 | 正解 | ホリュ |
| 芝生 | 正解 | シタフ |
| 数寄屋 | 正解 | カズヨヤ |
| 趣 | 正解 | オモモキ |
| 水質汚染 | 正解 | オウセン |
| 石碑 | 正解 | 碑が抜ける |
| 蛇の目傘 | ヘビノメガサ | ヘビノメガサ |
| 天地の道 | テンチ | テンチ |
| 14時30分 | チュウヨウジ | 正解 |
| API | 正解 | エーティーアイ |
| 1,000万円 | 正解 | センバンエン |
| 10分 | 正解 | ジュウブン |

Fish の誤りは「シタフ」「カズヨヤ」のように、漢字を別の読みで当てるものが目立ちます。「天地」のテンチは辞書上は許される読みで、正解に含めると両者 1 文ずつ増えます。Fish の「汚染」と「1,000万円」は、2 回目の書き起こしでは正しい読みになったので、書き起こし側の誤りかもしれません。この 2 文を除いても順位は変わりません。

08-27 の誤読しやすい 5 文では、Irodori は「東雲」をシノノメ、「人気のない道」をヒトケと読み、Fish はヒガシクモ、ニンキと読みました。

## 聴き比べ

読みの差が出た文を中心に 5 組載せます。上が Irodori、下が Fish です。

声の似方を測った文:

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/irodori_b_r10_run1.wav"></audio>

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/fish_b_r10_run1.wav"></audio>

「明日の朝、東雲駅で待ち合わせましょう。」(Fish がヒガシクモ):

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/irodori_c1.wav"></audio>

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/fish_c1.wav"></audio>

「伝統的な数寄屋建築の美しさに感動した。」(Fish がカズヨヤ):

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/irodori_r014.wav"></audio>

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/fish_r014.wav"></audio>

「会議は14時30分に始まります。」(Irodori がチュウヨウジ):

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/irodori_n01.wav"></audio>

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/fish_n01.wav"></audio>

「新しいAPIを公開しました。」(Fish がエーティーアイ):

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/irodori_n04.wav"></audio>

<audio controls src="https://raw.githubusercontent.com/mohhh-ok/blog-examples/main/2026/10-07-irodori-tts-japanese/output/fish_n04.wav"></audio>

## 声の似方

| 参照音声 | Irodori | Fish |
|---|---|---|
| 10 秒 (参照との類似度、5 回) | 0.9079 ± 0.0045 | 0.9131 ± 0.0028 |
| 26 秒 (参照との類似度、5 回) | 0.8956 ± 0.0140 | 0.9263 ± 0.0103 |
| 10 秒 (5 本同士の類似度、10 組) | 0.9575 ± 0.0074 | 0.9363 ± 0.0116 |

10 秒の参照では、参照への近さは Fish がわずかに上で、5 回の生成同士のばらつきは Irodori のほうが小さく出ました。聴いた感じの音質はほぼ同じです。

モデルカードの勧めに近い 26 秒の参照にしても、Irodori の似方は上がりませんでした。26 秒の録音は mp3 から戻したもので劣化があり、続けて話した 1 本の録音です。Irodori の README には、長い参照は同じ話者の短いクリップをつないだ形で学習・評価していると書かれています。どちらが効いたのかは今回切り分けていません。30 秒以上の参照を用意するなら、短いクリップをつなぐ形で試すのがよさそうです。

## seed と速度

Irodori は生成の設定に seed があり、seed=42 で 2 回生成した音声のハッシュ (MD5) が一致しました。10 秒・26 秒どちらの参照でも同じです。IndexTTS-2.5 では乱数を外から固定する必要がありましたが、Irodori は引数で済みます。尺まで固定したい動画の用途で効きます。

RTX 4090 での生成は、音声 1 秒あたり 0.11〜0.40 秒 (RTF、平均 0.24) でした。8〜11 秒の長い文で 0.11 前後、2〜5 秒の短い文で 0.15〜0.40 です。モデルの読み込みは 13.6 秒。計測一式は Pod 1 台・約 6 分・約 $0.075 で終わりました。

## 3 モデルの比較

声の似方の行は、同じ参照 (10 秒)・同じ文・同じ指標の値です。IndexTTS-2.5 は別の日・別の Pod・bf16 で測っています。

| 項目 | Irodori-TTS v4.1-Small | Fish Audio s2.1-pro | IndexTTS-2.5 (08-27) |
|---|---|---|---|
| 常用漢字 100 文 | 98/100 | 92/100 | 未計測 |
| 東雲 | シノノメ | ヒガシクモ | しのの系 (別の書き起こし) |
| 参照との類似度 | 0.9079 ± 0.0045 | 0.9131 ± 0.0028 | 0.8477 ± 0.0134 |
| 5 本同士の類似度 | 0.9575 ± 0.0074 | 0.9363 ± 0.0116 | 0.9570 ± 0.0072 |
| seed 固定 | 引数で MD5 一致 | 不可 | 乱数の外部固定で MD5 一致 |
| 読み指定 | なし | phoneme タグ (アクセント指定可) | かな指定 |
| RTF (RTX 4090) | 0.11〜0.40 | API 応答 0.32〜0.59 (通信込み) | 0.53〜0.65 |
| 実行形態 | セルフホスト | クラウド API | セルフホスト |

## 選び方

- 読み間違いを減らしたいなら Irodori。読み指定なしでも、今回の 100 文では Fish より誤りが少なく出ました
- 誤読が出たときに直す必要があるなら Fish。Irodori には読みを指定する手段がないので、文を書き換えるしかありません
- 同じ入力から同じ音声を出したいなら Irodori。seed の引数で固定できます
- GPU を用意したくないなら Fish。Irodori はセルフホストが前提です

## 指標の限界

- 読みの判定は gpt-4o-transcribe のカタカナ書き起こしに頼っています。同じ音声でも書き起こしが変わる例が出ました
- 各文 1 回の生成です。同じ文を何度も生成したときに読みが変わるかは測っていません
- 100 文なので、1 文の差が 1 ポイントです
- 読みの判定は公式手順と別の書き起こしモデルを使ったので、モデルカードの数値とは比べられません
- 参照音声は Irodori の推奨より短い 10 秒です
- 類似度は 1 つの指標で、聴いた感じの似方とは別物です。イントネーションは数値で測っていません

## 参考

- [計測コード・結果 (blog-examples)](https://github.com/mohhh-ok/blog-examples/tree/main/2026/10-07-irodori-tts-japanese)
- [Irodori-TTS v4.1-Small (Hugging Face)](https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small)
- [Irodori-TTS (GitHub)](https://github.com/Aratako/Irodori-TTS)
- [Joyo Kanji Yomi Benchmark: Parakeet Edition (Hugging Face)](https://huggingface.co/datasets/Parakeet-Inc/joyo-kanji-yomi-benchmark-parakeet)
- [Sarashina2.2-TTS: Tackling Kanji Polyphony in Japanese Speech Generation via Data Scaling and Targeted Data Synthesis (arXiv 2606.25369)](https://arxiv.org/abs/2606.25369)
- [IndexTTS-2.5 の記事](/blog/posts/2026/08-27-aiindextts-25の日本語読み指定とvoice-clone一貫性をrunpodで検証かな強制seed固定/)
- [Gemini 3.8 Flash TTS と Fish Audio の記事](/blog/posts/2026/09-24-aigemini-38-flash-ttsの声クローンをfish-audioと聴き比べた/)
