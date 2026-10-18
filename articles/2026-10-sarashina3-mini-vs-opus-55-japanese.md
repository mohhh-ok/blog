---
title: "Sarashina3 miniとClaude Opus 5.5に同じ日本語の問題40問を出して比べた"
emoji: "📝"
type: "tech"
topics: ["ai", "llm", "claude", "sarashina", "japanese"]
published: true
---

SB Intuitions の国産 LLM「Sarashina」が 2026-10-13 に無償ベータとして API で使えるようになったので、Anthropic の Claude Opus 5.5 と日本語の力を比べました。同じ 40 問を両方の API に出し、GPT にモデル名を伏せて判定させています。実用で一番使いそうな「読みにくい文章を読みやすく書き直す」は、40 問とは別に 10 問作り、私自身も盲検で読みやすさを判定しました。

## 結論

- 書き直しは Opus が意味を保ったまま読みやすくし、Sarashina は読みやすく書けても意味がずれやすい結果でした。10 問のうち、2 回の判定でどちらも「意味が保たれている」とされたのは Opus 7 問、Sarashina 1 問です
- 私が読みやすさだけを盲検で判定した 7 問では、Sarashina を読みやすいとしたのが 5 問、Opus が 1 問、差なしが 1 問でした。GPT はその 7 問すべてで Sarashina の書き直しを「意味が変わった」と判定しています。読みやすさの印象だけで選ぶと、意味のずれた書き直しを選びやすいということです
- 敬語・自由作文・要約・ニュアンスの読み取りは、16 問すべて Opus の勝ちでした
- 漢字の読みは Opus 13/14、Sarashina 11/14。Sarashina は「生物」「市場」「大事」のような、文脈で読みが変わる語を 3 問落としました
- 比べたのは Anthropic の最上位に近いモデルと、Sarashina の API で使える mini です。Sarashina の最上位との比較ではありません

## 試した条件

| | Sarashina3 mini | Claude Opus 5.5 |
|---|---|---|
| 使い方 | Sarashina の API (`sarashina3-mini`) | Anthropic の API (`claude-opus-5-5`) |
| システムプロンプト | なし | なし |
| サンプリング | 既定 (temperature 0.7、top_p 0.9) | 既定 (指定できない) |
| thinking | なし | 切れないので effort を最も低い low にした |
| 出力の上限 | 8,000 トークン | 8,000 トークン (thinking の分を含む) |

計測は 2026-10-18 です。temperature を揃えることと、Opus の thinking を切ることは、Opus 5.5 の API が受け付けずにできませんでした。temperature を送ると「`temperature` is deprecated for this model.」、thinking を disabled にすると「"thinking.type.disabled" is not supported for this model. Use "thinking.type.adaptive" and "output_config.effort" to control thinking behavior.」が返り、どちらも 400 になります。そこで両方とも各社の既定のサンプリングに任せ、Opus は thinking を最小にしました。Opus が thinking に使ったトークンは 40 問の合計で 3,982 (1 問あたり 0〜427) です。

問題は 6 種類 40 問です。

| 種類 | 問題数 | 素材 |
|---|---|---|
| 書き直し | 10 | 法令 3、最高裁の判決 2、自作の悪文 5 |
| 敬語 | 4 | 自作 |
| 自由作文 | 4 | 自作 |
| 要約 | 4 | 青空文庫 (蜘蛛の糸、手袋を買いに、夢十夜 第一夜、よだかの星) |
| ニュアンスの読み取り | 4 | 自作 |
| 漢字の読み | 14 | 自作 (難読語 8、文脈で読みが決まる語 6) |

このほかに、私が読みやすさを判定するための書き直しを 10 問 (H01〜H10) 別に作りました。40 問の集計には入れていません。

Sarashina の利用規約は、入力に第三者の著作物や個人情報を入れることを認めていません。そのため素材は、著作権法 13 条で権利の対象にならない法令と判決、著者の没後 70 年を過ぎた青空文庫の作品、自作の文に限りました。判決は人名を含まない部分を選んでいます。

判定は次のとおりです。

1. GPT (`gpt-6.1-sol`。計測日に OpenAI のモデル一覧で一番新しい主力) に、モデル名を伏せた 2 つの回答を見せて比べさせる
2. 回答の左右を入れ替えてもう 1 回判定させ、2 回で勝者が同じならその勝ち、食い違えば引き分けにする
3. 書き直しは、回答ごとに「元の文章の意味が変わっていないか、情報が落ちていないか」を先に判定させる。意味が変わった回答は、読みやすくても勝ちにしない
4. 漢字の読みは、正解と照らして機械で採点する
5. 別に作った書き直しの 10 問のうち 7 問は、私が盲検で読みやすさだけを判定する。意味の正しさは判定しない

Opus を判定に使わなかったのは、自分の出力をひいきする偏りを避けるためです。

## 公開されている数値

両社とも自社モデルの評価値を出していますが、同じ条件で 2 つを並べた評価は見つかりませんでした。

Sarashina の[公式ドキュメント](https://docs.sarashina.ai/models)には、Sarashina3 mini の値として ELYZA-tasks-100 が 4.18、日本の文化や常識を問う JamC-QA が 0.82 などが載っています。このページに他社のモデルとの比較はありません。

Anthropic の [Claude Opus 5.5 システムカード](https://www-cdn.anthropic.com/fc1b44717c85dc068bc6ba5024219938094694bd/Claude%20Opus%205.5%20System%20Card.pdf)は、多言語の知識問題 GMMLU (42 言語の平均) を 94.3% としています。日本語だけの値は本文にありません。

評価の種類も条件も違うので、この 2 つの数字から優劣は言えません。日本語の文章を扱う力を同じ問題で見たかったので、自分で測ることにしました。

## 書き直しの結果

| 問題 | 素材 | Sarashina の意味 (2 回) | Opus の意味 (2 回) | GPT の結果 |
|---|---|---|---|---|
| [R01](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r01) | 消費者契約法 10 条 | × × | ○ ○ | Opus |
| [R02](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r02) | 借地借家法 6 条 | × × | ○ ○ | Opus |
| [R03](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r03) | 個人情報保護法 27 条 1 項 | × × | ○ ○ | Opus |
| [R04](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r04) | 判決 (昭和 47 年) | × × | × ○ | 引き分け |
| [R05](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r05) | 判決 (平成 27 年) | × × | ○ ○ | Opus |
| [R06](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r06) | 自作 (社内通知) | × × | × × | 引き分け |
| [R07](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r07) | 自作 (断水のお知らせ) | × × | ○ ○ | Opus |
| [R08](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r08) | 自作 (製品マニュアル) | × × | ○ ○ | Opus |
| [R09](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r09) | 自作 (会議の報告) | ○ × | ○ ○ | Opus |
| [R10](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite.md#r10) | 自作 (自治会の回覧) | ○ ○ | × × | Sarashina |

○ は「意味が保たれている」、× は「意味が変わった・情報が落ちた」という GPT の判定です。全問の問題と出力は [outputs.md](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs.md) にあります。

Sarashina の書き直しは、10 問中 9 問で少なくとも 1 回「意味が変わった」と判定されました。法令や判決のような、条件や範囲を正確に言い分けている文章で特にずれています。

R03 (個人情報保護法) では、GPT は Sarashina の書き直しを 2 回とも「意味が変わった」と判定しました。理由は次の 3 点です。

- 「個人データ」を「その情報」と言い換えたため、禁止の対象が個人情報全体に広がった
- 例外の 1 号の「法令に基づく場合」を「法律で定められているとき」としたため、政令や省令に基づく場合が抜けた
- 本人の同意を「あらかじめ」得るという時期が消えた

どれも法律の文章では意味が変わる言い換えです。

R06 は自作の社内通知で、「領収書の原本の添付がないものについては、やむを得ない事情があると所属長が認めた場合を除き、受理しないこととはしないものの、処理が翌月以降となる場合がある」という二重否定を入れておきました。原本がなくても受理はするが処理が遅れることがある、という意味です。両モデルとも冒頭に「原本を必ず付けてください」と書き、元の文にない義務を足しました。Sarashina はさらに、所属長が認めたときだけ原本なしで受け付ける、という逆の条件に書き換えています。

R10 は Sarashina が勝った問題です。Opus は箇条書きで短くまとめていて、GPT は読みやすさでは Opus を上にしました。一方で Opus は、元の「可能な方におかれましてはご持参いただけますと幸い」を「お持ちの方は、できるだけご自分で持ってきてください」に、雨の日の「対応」の連絡を「実施するかどうか」の連絡に変えていて、GPT はこの 2 点で意味が変わったと判定しました。

書き直しを任せるなら、読みやすさに加えて、条件・範囲・否定が元のままかを確かめる必要があります。今回の結果では、その確認で引っかかる回数は Sarashina のほうがずっと多くなりました。

## 私の盲検判定

私が読みやすいとした書き直しは、ほとんどが GPT に「意味が変わった」と判定された Sarashina のものでした。

判定には、40 問とは別に作った書き直しの 10 問 (H01〜H10) を使いました。内訳は法令 3、最高裁の判決 2、自作の悪文 5 で、R01〜R10 とは別の条文・判決・題材です。指示文と両モデルへの出し方は同じです。応答は前置きや補足も含めて加工せずに全文を載せ、モデル名を伏せて A・B で並べました。判定したのは私が選んだ 7 問で、見たのは読みやすさだけです。意味の正しさは判定していません。

最初は R01〜R10 で判定しましたが、見分けにくくするために Markdown の見出しや太字を外したところ、Opus の書き直しの後ろに付いた「補足」がどこにつながるのか読み取れなくなったので、その判定は無効にして問題から作り直しました。

| 問題 | 素材 | 私が読みやすいとしたモデル | GPT の読みやすさ (2 回) | Sarashina の意味 (2 回) | Opus の意味 (2 回) | GPT の結果 |
|---|---|---|---|---|---|---|
| [H01](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h01) | 民法 95 条 | Sarashina | Opus / Opus | × × | ○ ○ | Opus |
| [H02](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h02) | 労働基準法 20 条 | Sarashina | Opus / Opus | × × | ○ × | 引き分け |
| [H03](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h03) | 特定商取引法 9 条 1 項 | Sarashina | Opus / Opus | × × | ○ ○ | Opus |
| [H04](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h04) | 判決 (平成 20 年) | Sarashina | Opus / Opus | × × | ○ ○ | Opus |
| [H05](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h05) | 判決 (平成 17 年) | Sarashina | Opus / Sarashina | × × | ○ ○ | Opus |
| [H06](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h06) | 自作 (受講料の返金) | 判定なし | Opus / Opus | × × | × × | 引き分け |
| [H07](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h07) | 自作 (送迎事業のお知らせ) | 差なし | Opus / Opus | × × | ○ ○ | Opus |
| [H08](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h08) | 自作 (予約変更の案内) | 判定なし | Opus / Opus | × × | ○ ○ | Opus |
| [H09](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h09) | 自作 (図書館の貸出規則) | Opus | Opus / Opus | × × | × × | 引き分け |
| [H10](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md#h10) | 自作 (メール切り替えの連絡) | 判定なし | Opus / Opus | ○ ○ | ○ ○ | Opus |

GPT の列の見方は R01〜R10 の表と同じです。H07 は「文章としては A (Sarashina) で十分だが、チラシなら B (Opus) の構成のほうがいい」という判定だったので、差なしとして数えました。全問の問題と出力は [outputs/rewrite_h.md](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/rewrite_h.md) にあります。

判定した 7 問で、私が読みやすいとしたのは Sarashina 5 問、Opus 1 問、差なし 1 問です。GPT は読みやすさでも 6 問で 2 回とも Opus を選び、H05 だけ 1 回ずつに割れました。意味の判定では、Sarashina は 10 問中 9 問で 2 回とも「意味が変わった」とされ、2 回とも保たれていたのは H10 だけです。

H01 (民法 95 条の錯誤) では、Sarashina は「意思表示に対応する意思を欠く錯誤」を「自分が本当に何をしたいか、よく分かっていなかった場合」と書きました。言ったことと本心の食い違いが、本心が決まっていない状態に変わっていると GPT は指摘しています。読みやすい言い換えですが、法律の文章としては意味が変わります。

読みやすいと感じた書き直しが、意味を保っているとは限りません。書き直しを読みやすさで選ぶときは、元の条件や範囲が残っているかを別に確かめてください。

## 敬語・自由作文・要約・ニュアンスの結果

| 種類 | 問題数 | Sarashina 勝ち | Opus 勝ち | 引き分け |
|---|---|---|---|---|
| 敬語 | 4 | 0 | 4 | 0 |
| 自由作文 | 4 | 0 | 4 | 0 |
| 要約 | 4 | 0 | 4 | 0 |
| ニュアンス | 4 | 0 | 4 | 0 |

全問の問題と出力は [outputs.md](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs.md) にあります。

差が分かりやすかったのは、受付が社外からの電話に「佐藤部長は外出中で、午後 3 時に戻る」と答える問題 ([K03](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/keigo.md#k03)) です。

> Sarashina3 mini の出力 (抜粋):
>
> 佐藤部長ですね、あいにくただ今外出しておりまして、午後3時に帰社の予定でございます。
>
> ご用件を承っておきますか？

> Claude Opus 5.5 の出力 (抜粋):
>
> 申し訳ございません。あいにく佐藤はただいま外出しておりまして、午後3時に戻る予定でございます。

社外の人に自社の上司を話すときは、役職を付けずに「佐藤は」と言います。Sarashina は「佐藤部長」と呼んでいて、GPT もこの点を理由に Opus を勝ちにしました。Opus は電話のやり取り全体を台本の形で書き、最後に「社外の人には自社の上司を立てない」という解説まで付けています。

要約では ([S03](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/summary.md#s03))、Sarashina は「夢十夜」第一夜を 94 字で要約し、女を埋めた場面や百年後に会う約束を落としました。GPT は、Sarashina の「幻想と現実が交錯する」という一文を、原文の出来事ではなく独自の評価だと指摘しています。

## 漢字の読みの結果

| 問題 | 正解 | Sarashina3 mini | Claude Opus 5.5 |
|---|---|---|---|
| 貸し借りを【相殺】して | そうさい | ○ | ○ |
| 攻撃に対して【脆弱】だ | ぜいじゃく | ○ | ○ |
| 計画は【頓挫】した | とんざ | ○ | ○ |
| 【漸く】春らしく | ようやく | ○ | ○ |
| 【強ち】間違いとは言えない | あながち | ○ | ○ |
| 【訥々】と語った | とつとつ | ○ | ○ |
| 【長閑】な田園風景 | のどか | ○ | ○ |
| 現場の声を【蔑ろ】にして | ないがしろ | ○ | なおざり |
| 【人気】のない夜道 | ひとけ | ○ | ○ |
| 来月【一日】から使える | ついたち | ○ | ○ |
| 【生物】ですので、お早めに | なまもの | せいぶつ | ○ |
| 朝の【市場】で魚を買った | いちば | しじょう | ○ |
| 放っておくと【大事】になる | おおごと | だいじ | ○ |
| 一枚【上手】だった | うわて | ○ | ○ |

正答は Opus 13/14、Sarashina 11/14 です。各問の出力は [outputs/reading.md](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs/reading.md) にあります。単独で難しい語の 8 問は、Opus が「蔑ろ」を「なおざり」と答えた 1 問を除いて両方とも正解しました。差が出たのは文脈で読みが決まる語で、Sarashina は「お早めに」「魚を買った」「放っておくと」という手がかりがあっても、辞書で最初に出る読みを答えています。問題数が少ないので、傾向として見てください。

## 限界と偏り

- Sarashina は API で mini しか使えません。Anthropic の最上位に近いモデルと Sarashina の小さいモデルを比べた結果です
- 自作の 31 問 (書き直しの悪文 5、敬語 4、自由作文 4、ニュアンス 4、漢字の読み 14) と、H01〜H10 の自作 5 問は Claude Opus 5.5 が作りました。Opus に合った問題になっている可能性があります
- 要約の 4 作品は有名なので、両モデルとも本文を覚えている可能性があります
- GPT の意味の判定は細かく、R07 では Sarashina が元の文にない曜日「(火)」を足したことと、雨の日に延期するかどうかを知らせる範囲が狭まったことで「意味が変わった」としました。どこまでを意味の変化とみなすかで、書き直しの数字は動きます
- GPT には出力をそのまま見せたので、Sarashina の「もちろんです。」の前置きや Opus の Markdown の見出しから、モデルの見当がついた可能性があります
- 私の盲検判定でも応答は加工せずに見せました。私は Opus が書き直しの後ろに「補足」を付けることを知っていたので、応答の癖でどちらのモデルか見当はつきましたが、なるべく流されないように読みました
- 私が判定した 7 問は、10 問の中から私が選びました。見たのは読みやすさだけです
- 各問 1 回の生成です。同じ問題を何度も出したときのばらつきは測っていません
- 無償ベータでは、入力と出力が Sarashina のモデルの学習に使われることがあります。利用規約で学習利用を拒否 (オプトアウト) できるのは有償プランだけです

## 再現

全問の問題と出力は [outputs.md](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs.md) にあります。問題・計測コード・API のレスポンス・GPT の判定理由・集計は [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/10-18-sarashina-opus-japanese) にあり、各問の出典 URL もそこに書いてあります。

## 参考

- [計測コード・結果 (blog-examples)](https://github.com/mohhh-ok/blog-examples/tree/main/2026/10-18-sarashina-opus-japanese)
- [全問の問題と出力 (outputs.md)](https://github.com/mohhh-ok/blog-examples/blob/main/2026/10-18-sarashina-opus-japanese/outputs.md)
- [Sarashina モデル一覧 (docs.sarashina.ai)](https://docs.sarashina.ai/models)
- [Sarashina サービス利用規約](https://sarashina.ai/terms)
- [Claude Opus 5.5 System Card (PDF)](https://www-cdn.anthropic.com/fc1b44717c85dc068bc6ba5024219938094694bd/Claude%20Opus%205.5%20System%20Card.pdf)
- [e-Gov 法令検索](https://laws.e-gov.go.jp/)
- [裁判所 裁判例検索](https://www.courts.go.jp/hanrei/search1/index.html)
- [青空文庫](https://www.aozora.gr.jp/)
