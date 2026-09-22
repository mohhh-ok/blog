---
title: "【AI】Qwen3-TTSは日本語に英数字が混ざると失敗する【発音崩壊とEOS不発hang】"
pubDate: 2026-08-16
categories: ["TTS"]
---

こんにちは、フリーランスエンジニアのmohです。この記事はほとんどAIが書いたものを、私が加筆修正しています。検証不十分な部分もあるかと思いますが、ご容赦ください。ご指摘等ございましたら、Github issueか、Xでお願いいたします。

あるプロジェクトで Qwen3-TTS を self-host しているのですが、日本語スクリプトに英数字が混ざると失敗する問題を2種類踏みました。1つは英字の発音が崩壊する品質の問題。もう1つは、特定のテキストを投げたときだけログを一切吐かずに固まり続ける、というたちの悪い安定性の問題です。

## 結論

- 日本語スクリプトに半角の英数字が混ざると、Qwen3-TTS では別々の2つの問題が起きる
- 問題1 (品質): 英字トークンの発音が崩壊する。TTS 直前に LLM で英字をカタカナ読みに置換して対処した
- 問題2 (安定性): mixed-script 入力で EOS トークンが出なくなり、呼び出し側の timeout まで無限 hang する。上流の既知 issue 2本 (318 / 118) の複合。kwargs (`max_new_tokens` + `eos_token_id`) の安全弁で 555秒 timeout → 45.4秒完走にし、本丸は置換対象を数字・カンマまで広げて mixed-script を入力から消した
- 2つは別問題だが、対処はどちらも「TTS 直前のテキスト置換」に収束した

## 1つ目の問題: 英字の発音が崩壊する

モデルはQwen3-TTS-12Hz-1.7Bで、日本語スクリプトから音声を生成しています。

素のQwen3-TTSは、日本語スクリプトに英字トークン (streaming、API、OOMのような単語・略語) が混ざると、そこの発音が崩壊します。スクリプトはユーザー入力なので英単語は普通に混ざってきますし、かといって入力時に「英語禁止」と縛るわけにもいきません。

対処はテキスト側でやりました。TTSに渡す直前に、LLMで英字をカタカナ読みに置換します。「streaming」→「ストリーミング」、「API」→「エーピーアイ」のように、読ませたい音をテキストの時点で確定させてから渡す方式です。これで発音は収まりました。1つ目の話はここまでです。

## 2つ目の問題: ログ無音のまま無限hangする

その後しばらくして、パイプラインのTTSフェーズだけが555秒のtimeoutまで返ってこず、HTTP 500 (`request timeout`) で落ちるジョブが出ました。

ログを見に行くと、`TTS: starting generation` と、transformers が出す `Setting pad_token_id to eos_token_id:2150` までは記録されているのに、そこから35分間完全に無音。そのまま idle shutdown していました。GPUインスタンスは maxScale=1 / concurrency=1 で回しているので、retry も `no available instance` で即abort。再試行が実質届かない構成なのも痛いところでした。

どこで固まっているのか分からないので、TTS呼び出しの前後に境界ログを仕込んで同じpayloadを再実行しました。症状は再現し、ログの到達状況はこうなりました。

```
TTS: fetching ref audio                          通過
TTS: starting generation lang=ja text_len=102     通過
Setting pad_token_id to eos_token_id:2150         通過 (transformers側)
（以降 555 秒間、ログ完全無音）
TTS: generation finished                          出ない
TTS: writing wav / uploading / returning          出ない
```

`generate_voice_clone()` に入ったきり出てこない。hang位置はライブラリ内部と確定です。

## 切り分け: 同じテキストをfal.aiに投げたら25〜27秒で終わった

テキストが悪いのか環境が悪いのか。hangした同じテキストを、同じQwen3-TTS-12Hz-1.7Bベースの `fal-ai/qwen-3-tts` (H100) に投げてみました。

| 経路 | 実測時間 | 結果 |
|---|---|---|
| Custom-Voice (事前学習ボイス) | 27秒 | HTTP 200、8-12秒の音声 |
| Clone-Voice (ref_audio → speaker embedding → TTS) | 25秒 | HTTP 200、12秒の音声 |

`max_new_tokens=3000` (デフォルト200の15倍) を指定しても25〜27秒で完了。同じモデル・同じテキストで完走するので、テキスト内容そのものではなく、L4環境側の何かが原因だと切り分けられました。

## 原因: mixed-script入力とEOS不発の上流バグ2本

上流のissueを探すと、まさにこれというものが2本ありました。

### issue 318: mixed-script入力での決定論的hang

[Qwen3-TTS issue 318](https://github.com/QwenLM/Qwen3-TTS/issues/318)。qwen-tts 0.1.1 / transformers 4.57.3 / L20 GPUの環境で、Thai + Latin/CJK/Cyrillic/Korean などが混在するテキストを投げると `generate_voice_clone()` が30分以上hangするという内容です。CPU使用率90%のままログは無音、`min_new_tokens=2` 分だけ生成したあとEOSが選ばれず無限ループ。**同じ (text, ref_audio, seed) なら毎回再現する決定論的な挙動**で、上流の推奨対処は「呼び出し側で `max_new_tokens` に上限を設定して、EOSが出なくてもクリーンに打ち切れ」でした。

### issue 118: L4 GPUでのEOS未生成

[Qwen3-TTS issue 118](https://github.com/QwenLM/Qwen3-TTS/issues/118)。こちらは **NVIDIA L4 (22GB)** / transformers 4.57.3 / torch 2.10.0+cu126 / CUDA 12.6 という、手元の環境とほぼ同じ構成での報告です。0.5% (1/200) の頻度でEOSが生成されず、`max_new_tokens` まで走り続ける。コミュニティの回避策は、EOS候補を単独の `2150` から `[2150, 2157, 151670, 151673, 151645, 151643]` に広げるというもので、talker側のvocab_sizeは3072なので実用上は `2157` まででよい、とされていました。

手元のログに残っていた `Setting pad_token_id to eos_token_id:2150` は、まさにこのsingle-EOS状態で動いていた証拠です。

### hangしたテキストのどこがmixed-scriptだったのか

hangしたテキストは、1つ目の問題で入れたカタカナ置換を通った後のものなので、英字は残っていません。残っていたのは、単語間の半角スペースと、通し番号などの半角数字。「カタカナ + 半角スペース + 半角数字」の混在で、issue 318の言うmixed-scriptに該当していました。

カタカナ置換は発音のための処理で、変換対象は英字だけ。数字とスペースは対象外なので、mixed-script対策としては何もしていません。英数字の「英」だけ消えて「数」が残っていた、という状態です。

## hang対策1 (安全弁): kwargsでEOS不発でも打ち切れるようにする

まずは止血です。`generate_voice_clone()` の呼び出しに、kwargsを2つ足しました。

```python
wavs, sr = model.generate_voice_clone(
    text=text,
    language=language,
    ref_audio=str(ref_audio_path),
    max_new_tokens=1200,          # issue 318 対策: 強制的な上限で打ち切る
    eos_token_id=[2150, 2157],    # issue 118 対策: EOS候補を複数に広げる
)
```

### forkやmonkey-patchにしなかった理由

qwen-tts 0.1.1 のcall chainを追うと、未知のkwargsがそのまま下流のtransformersの `generate()` まで通ることが確認できました。構造を簡略化するとこうです。

```python
# qwen-tts 0.1.1 の構造を簡略化したもの
def generate_voice_clone(self, text, ref_audio, **kwargs):
    gen_kwargs = self._merge_generate_kwargs(**kwargs)
    return self.model.generate(**gen_kwargs)

def _merge_generate_kwargs(self, **kwargs):
    merged = dict(kwargs)           # 未知のkwargsを先に全部取り込む
    merged["do_sample"] = ...       # 正規パラメータ側で個別に上書き
    merged["max_new_tokens"] = ...  # (eos_token_id は正規パラメータの一覧に無い)
    return merged
```

`_merge_generate_kwargs` は渡されたkwargsをまず全部辞書に取り込み、そのあと `do_sample` や `top_k` といった正規パラメータだけを上書きします。`eos_token_id` は正規パラメータの一覧に無いので、呼び出し側で渡した値がそのまま生き残る。下流の `generate()` は `eos_token_id` をnamed paramで受け取っていて、型注釈こそ `Optional[int]` ですが実装は `is not None` を見るだけなので、listを渡してもそのままtransformersまで届きます。

この経路が確認できたので、Docker patchもforkも無しで済みました。上流のupdateに追随するコストがゼロなのが一番のメリットです。

### 検証: 555秒timeoutが45.4秒に

同一payload (text_len=102) でkwargs適用後に再実行した境界ログです。

```
TTS: fetching ref audio
TTS: starting generation lang=ja text_len=102
TTS: generation finished samples=192000 sr=24000   ← 前回はここが出なかった
TTS: writing wav to /tmp/...
TTS: uploading to gs://...
TTS: upload finished
TTS: infer() returning
```

| 項目 | fix前 | fix後 |
|---|---|---|
| TTSフェーズ | 555秒でtimeout | 45.4秒で完了 |
| `TTS: generation finished` ログ | 出ない | 出る |
| レスポンス | HTTP 500 (`request timeout`) | HTTP 200 で完走 |
| 生成音声 | なし | 192000 samples @ 24kHz = 8.0秒 (102文字分の妥当な発話速度) |
| 後段 (lipsync/matting/encode) | 到達せず | 全て完走 (合計739秒) |

L4で45.4秒、fal.ai H100で25秒。1.8倍の差はL4の名目性能比 (H100の1/3〜1/5) からするとむしろ小さく、EOSがかなり早い段階で選ばれていることを示唆します。

### 限界: hangが「無音の末尾切れ」に変わっただけ

このkwargsはEOS不発そのものを直していません。`max_new_tokens` に達したら強制的に打ち切るだけなので、hangという分かりやすい障害が、「末尾の切れた音声が静かに返ってくる」という見えにくい障害に変わったとも言えます。

1200という値は、Qwen3-TTS-12Hzが1秒の音声を12 codec tokenで表現することから逆算したものです。1200 token = 100秒が生成上限。issue 318の推奨 (30秒 × frame rate = 360 token) よりだいぶ緩めですが、実運用のスクリプト長との兼ね合いでここに置きました。

qwen-tts側のデフォルトは2048 token (170秒相当) ですが、L4の生成速度だとEOSが出ないまま呼び出し側のtimeoutを超えてしまうので、明示的に下げる必要がありました。

なお上流issue 318は2026-08の確認時点でOPENのままです。将来根本修正が入れば明示指定は外せるかもしれませんが、当面は安全側に倒して残す予定です。

## hang対策2 (本丸): 置換対象を英字から数字・カンマまで広げる

kwargsは安全弁であって、mixed-scriptな入力が入ってくること自体は止められていません。実際その後の運用で、今度は桁区切りカンマ入りの数字 (「4,980円」のような表記) が引き金になって生成が崩壊するケースが実ジョブで出ました。数字と記号が残っている限り、同じ穴は塞がらないわけです。

そこで1つ目の問題で入れたカタカナ置換を、「英字だけ」から「mixed-scriptの成分を全部読みに展開する」方向へ拡張しました。発音のための置換に、mixed-script除去という安定性側の役割も持たせた形です。

- 数字は助数詞・単位と一体でカタカナ読みに展開する。4980円 → ヨンセンキュウヒャクハチジュウエン、1.5倍 → イッテンゴバイ、12:30 → ジュウニジサンジュップン
- 桁区切りカンマは読みに含めて消す。4,980円 → ヨンセンキュウヒャクハチジュウエン
- 電話番号や型番のような桁読みが不自然なものは逐字読みに落とす

設計上の工夫が1つあります。LLMによる正規化は、失敗したら元テキストのまま通すfail-openにしてあるので、LLMが落ちた瞬間に崩壊トリガーが素通りする穴が残ります。そこで実証済みトリガーである桁区切りカンマだけは、LLMの手前で決定的なregexにより除去するようにしました。対象は「数字 + カンマ + ちょうど3桁」の桁区切りパターンだけで、「1,2」のような列挙は連結すると意味が変わるので触りません。小数点も消すと意味が壊れる (4.5 → 45) のでregexでは扱わず、LLMの読み展開に委ねています。

現在の構図を整理すると、テキスト置換でmixed-scriptの成分 (英字・数字・カンマ) を入力から消すのが本丸、kwargsの `max_new_tokens` / `eos_token_id` は置換をすり抜けた入力への安全弁、という二段構えです。

## まとめ

自己回帰の生成モデルは「いつかEOSが出る」ことを前提に組まれていますが、その前提は入力の分布次第で普通に崩れます。self-hostするなら、EOSが出ないケースを異常系ではなく仕様として扱い、`max_new_tokens` の上限は最初から呼び出し側に入れておくべきでした。今回はhangしてから入れる羽目になりましたが、本来は初日に入れる類のガードです。

もう1つ。発音崩壊とEOS不発hangは別々の問題ですが、引き金はどちらも「日本語スクリプトに混ざった英数字」で、対処もどちらも「TTS直前のテキスト置換」に収束しました。モデルの苦手な入力は、モデル側でどうにかするより入力側で消すのが確実です。ただしLLMでの置換はfail-open構成にする以上すり抜けが残るので、kwargsのような決定的な安全弁との二段構えで初めて成立します。

## 参考

- [Qwen3-TTS issue 318: generate_voice_clone() hangs indefinitely on mixed-script Thai inputs (Qwen3-TTS-12Hz-1.7B-Base)](https://github.com/QwenLM/Qwen3-TTS/issues/318)
- [Qwen3-TTS issue 118: EOS token not being found on pretrained base models](https://github.com/QwenLM/Qwen3-TTS/issues/118)
