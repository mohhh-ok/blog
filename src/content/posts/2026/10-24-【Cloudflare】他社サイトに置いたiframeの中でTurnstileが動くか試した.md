---
title: "【Cloudflare】他社サイトに置いたiframeの中でTurnstileが動くか試した"
pubDate: 2026-10-24
categories: ["開発"]
tags: []
draft: true
---

こんにちは、フリーランスエンジニアのmohです。この記事はほとんどAIが書いたものを、私が加筆修正しています。検証不十分な部分もあるかと思いますが、ご容赦ください。ご指摘等ございましたら、Github issueか、Xでお願いいたします。

他社のサイトに script タグ 1 行で設置するウィジェットを作るとき、訪問者が bot でないかを Cloudflare Turnstile で確かめたくなります。ところが Turnstile は、widget を出すページのホスト名を事前に登録する必要があります。設置先が増えるたびに登録するのは現実的ではありません。

そこで、設置先のページには自前ドメインの iframe だけを置き、Turnstile はその iframe の中で出す形を試しました。

## 結論

- 設置先のページに置いた自前ドメインの iframe の中で、Chrome 156 と Safari 27 のどちらでも token が取れ、Siteverify は `success: true` でした
- Siteverify が返す `hostname` は iframe 側の自前ドメインでした。設置先のホスト名は登録しなくて済みます
- その代わり、`hostname` からはどのサイトに設置されたかが分かりません。設置先の判定は別に作る必要があります
- 設置先のページに同じ sitekey で直接出すと、エラー 110200 (Domain not authorized) になりました
- Playwright で動かしたブラウザでは、headless・headed・本体の Chrome のどれでも 600010 になり、token は取れませんでした。この計測は人が普段のブラウザで押して行っています

## ホスト名の登録の上限

Turnstile の widget には、動かすホスト名を登録します。[公式のホスト名の管理のページ](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/) によると、上限は無料で 1 widget あたり 10 個、Enterprise で 200 個です。ワイルドカードは使えません (登録したホスト名のサブドメインには効きます)。

どのホスト名でも動かせる [Any Hostname](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/any-hostname/) は Enterprise だけの機能です。

設置先が数十、数百と増えるウィジェットでは、設置先のページに直接 widget を出す形は無料では成り立ちません。iframe の中で出す形が使えるかは、公式のページには書かれていませんでした。

## 試した構成

- 自前ドメイン Y: Turnstile の widget にホスト名を登録したドメイン。この記事では `widget.example.com` と書きます。手元では `/etc/hosts` で 127.0.0.1 に向け、mkcert の証明書で https にしました
- 設置先 X: `lvh.me`。公開 DNS で 127.0.0.1 を返すドメインで、widget には登録していません。Y とは別のサイト (eTLD+1 が違う) になります
- sitekey は本物を使いました。テスト用の sitekey (`1x000...`) はホスト名を見ないので、この確認には使えません

ページは 3 つです。

1. Y に直接 widget を出すページ。Y が登録済みで token が取れることの確認
2. X のページに Y の iframe を置き、iframe の中で widget を出すページ。これが本題です
3. X のページに直接 widget を出すページ。対照です

widget の結果 (token かエラー) は Y のサーバーに送り、サーバーが token ごとに Siteverify を呼んで、応答をそのまま記録しました。計測は 2026-10-24 です。

## 結果

普段使いの Chrome と Safari で、人がページを開いて押した結果です。

| ブラウザ | ページ | token | Siteverify の success | hostname |
|---|---|---|---|---|
| Chrome 156 | 1. Y に直接 | 取れた | true | Y |
| Chrome 156 | 2. X の中の Y の iframe | 取れた (2 回) | true | Y |
| Chrome 156 | 3. X に直接 | 110200 | - | - |
| Safari 27.0 | 1. Y に直接 | 取れた | true | Y |
| Safari 27.0 | 2. X の中の Y の iframe | 取れた | true | Y |

iframe の中で取れた token の Siteverify の応答は次のとおりです (Safari の回。ホスト名は置き換えてあります)。

```json
{"action":"","cdata":"","challenge_ts":"2026-10-24T12:03:55.000Z","error-codes":[],"hostname":"widget.example.com","metadata":{"interactive":false},"success":true}
```

`metadata.interactive` は、Chrome の iframe の 2 回目だけ `true` でした。チェックボックスを押した回です。他の回は押す前に通っています。

X に直接出したページでは、widget が再試行を続け、約 10 秒ごとに 110200 が届きました (Chrome で 9 回)。[エラーコードの一覧](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) では 110200 は「Domain not authorized」です。

![X のページに直接 widget を出したときの表示。「Web サイトに接続できません」と出る](./10-24-turnstile-direct-110200.webp)

Safari の 3 番 (X に直接) は記録できていません。計測用のサーバーを、Chrome と Safari の両方で 1 番と 2 番が揃ったら止まるようにしていたため、Safari で 3 番を開く前に止まりました。110200 は Chrome と、後で書く Playwright の回で確認しています。

ここから、widget のホスト名の判定は iframe の中のページ (Y) で行われ、親のページ (X) は見ていないと読めます。iframe を cross-site に置いても、Chrome・Safari とも token の取得は妨げられませんでした。

## Playwright では取れない

最初は Playwright で自動化しようとしました。Chromium の headless、本体の Chrome (`channel: "chrome"`) の headed のどちらでも、1 番と 2 番ではチェックボックスが出て、押すと 600010 になりました。600 番台は一覧で「Generic challenge failure」です。

![Playwright で開いた X のページの iframe。押した後に「検証に失敗しました」と出る](./10-24-turnstile-iframe-600010.webp)

1 番 (Y に直接) でも同じなので、iframe のせいではなく、自動操作のブラウザが bot と判定されていると見ています。3 番は Playwright でも 110200 で、`localhost` に出しても 110200 でした。

Turnstile の挙動を自動テストで確かめたいときは、この点に注意が要ります。ホスト名の判定 (110200 かどうか) までは自動で見られますが、token の取得と Siteverify の中身は人が押して確かめることになります。

## 設置先の見分け方

Siteverify の `hostname` は常に Y になるので、この token がどのサイトから来たかは分かりません。設置先ごとに上限をかけたい場合などは、別の仕組みで見分ける必要があります。考えられるのは次の 3 つで、どれも今回は測っていません。

1. iframe の URL に設置先ごとの key を入れ、サーバーで key と許可したオリジンを突き合わせる
2. iframe のページの応答に `Content-Security-Policy: frame-ancestors` を付け、key に紐づくオリジンの中にしか置けないようにする。ブラウザが強制するので、iframe を別のサイトに貼られても表示されません
3. iframe の中で `document.referrer` や `location.ancestorOrigins` を読み、親のオリジンをサーバーに送る。ただし iframe の URL を直接開かれると親が無くなるので、これだけには頼れません

## 測れていないこと

- X は http で試しました。実際の設置先は https が普通ですが、https のページには置いていません
- Firefox と iOS の Safari は試していません
- Safari の「サイト越えトラッキングを防ぐ」は既定のままです。設定を変えた場合は試していません
- iframe の行に親のページを記録しておらず、2 番の結果が X の中から来たことは、開いた手順でしか示せません。公開したコードでは記録を足してあります

## コード

検証用のサーバーとページ、手で押す版と Playwright 版、計測の結果は [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/10-24-turnstile-cross-site-iframe) に置いてあります。Turnstile の widget と、自前ドメインを 127.0.0.1 に向ける設定と証明書があれば動きます。
