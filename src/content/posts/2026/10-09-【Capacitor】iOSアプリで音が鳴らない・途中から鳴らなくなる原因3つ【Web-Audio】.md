---
title: "【Capacitor】iOSアプリで音が鳴らない・途中から鳴らなくなる原因3つ【Web Audio】"
pubDate: 2026-10-09
categories: ["開発"]
tags: ["Capacitor", "iOS", "Web Audio", "Bun"]
---

こんにちは、フリーランスエンジニアのmohです。この記事はほとんどAIが書いたものを、私が加筆修正しています。検証不十分な部分もあるかと思いますが、ご容赦ください。ご指摘等ございましたら、Github issueか、Xでお願いいたします。

個人開発の日本語学習アプリを Capacitor で iOS アプリにしています。画面は web をアプリに同梱し、音（かなの発音・効果音・キャラの声）は Web Audio の AudioContext で鳴らしています。新しい版を TestFlight で試したところ、ブラウザでは鳴る音が iPhone のアプリでは鳴りませんでした。原因は 3 つ重なっていて、どれも iOS のアプリでしか起きません。同じ構成の人が踏みそうなので記録しておきます。

## 結論

- **同梱の mp3 を fetch すると、iOS では status が 0 になる。** Capacitor の iOS は、同梱ファイルのうち音声・動画の拡張子にだけ HTTP ではない応答を返します。`if (!res.ok) throw` と書いていると、同梱の音声は 1 つも鳴りません。中身は取れているので、`res.ok || res.status === 0` で受ければ鳴ります
- **画面をロックして戻ると、AudioContext は state が `running` のまま時計だけ止まる。** 何を鳴らしても音が出ず、鳴り終わりのイベントも来ません。state で見分けられないので `resume()` では戻らず、アプリを再起動するまでこのままです。画面が一度隠れたら、次のタップで AudioContext を作り直すと鳴りました
- **ビルドを `.env` の無い場所で回すと、Bun が埋め込む `BUN_PUBLIC_*` が空のまま同梱される。** git worktree でビルドしたせいで課金 SDK の鍵が抜け、課金まわりの画面が空になりました。本番向けのビルドで鍵が空なら止めるようにしました

## 症状

TestFlight の版で、次のことが起きました。マナーモードではありません。

- 50 音表の発音ボタンを押すと、再生中の表示が一瞬出てすぐ戻り、音は出ない
- チャットのキャラの声のボタンを押すと、再生中の表示のまま戻らず、音も出ない
- 修正した版でも、しばらく使っていると途中から鳴らなくなる。アプリを再起動すると戻る

端末は iPhone 12・iOS 26.6.1 です。ちなみに WKWebView の User-Agent には「iPhone OS 18_7」と出ていましたが、これは固定値で、実際の OS とは違いました。

## 同梱の音声の取得

Capacitor の iOS は、`capacitor://localhost/...` の要求を `WebViewAssetHandler.swift` で受けて、アプリに同梱したファイルを返します。このとき音声・動画の拡張子（`isMediaExtension` が mp3・m4a・wav などを判定）だけ、`HTTPURLResponse` ではなく素の `URLResponse` を返しています。

```swift
let urlResponse = URLResponse(url: localUrl, mimeType: mimeType, expectedContentLength: data.count, textEncodingName: nil)
let httpResponse = HTTPURLResponse(url: localUrl, statusCode: 200, httpVersion: nil, headerFields: headers)
if isMediaExtension(pathExtension: url.pathExtension) {
    urlSchemeTask.didReceive(urlResponse)
} else {
    urlSchemeTask.didReceive(httpResponse!)
}
```

HTTP の応答ではないので、WebKit の fetch では `status` が 0、`ok` が false になります。シミュレータのアプリに診断用のページを入れて測ると、こう出ました。

```
fetch mp3 status 0 ok false type basic bytes 4652
```

中身の 4652 バイトは取れていて、`decodeAudioData` も通ります。私のコードは `if (!res.ok) throw` で失敗にしていたので、かなの発音も効果音も iOS のアプリでは最初から鳴っていませんでした。「再生中の表示が一瞬出てすぐ戻る」のは、失敗して鳴り終わりと同じ扱いになっていたためです。

直し方は、音声の応答の判定を 1 か所にまとめて、status 0 も受けることです。

```ts
export function isAudioResponseOk(res: Pick<Response, "ok" | "status">): boolean {
  return res.ok || res.status === 0;
}
```

普通の cors の fetch で status 0 になるのは、この同梱ファイルの場合くらいです。中身が音声でなければ `decodeAudioData` が失敗するので、壊れた応答を鳴らすことはありません。同梱の音声を fetch して `res.ok` を見ているコードがあれば、iOS のアプリでは鳴っていないと思ってください。

## ロック後の再生

原因 1 を直した版でも、「しばらく使っていると鳴らなくなり、再起動すると戻る」が残りました。わざと起こそうとしても起きず、手がかりは「しばらく放っておいて、また使うと鳴らない」という使い方の話だけでした。そこで、画面をロックして 1〜2 分待つのを試したら再現しました。

アプリの Debug ビルドに、AudioContext の state と `currentTime` を 15 秒ごとに出すログを入れて、ロックの前後を取ったのが次の表です。

| 時点 | state | currentTime |
|---|---|---|
| 起動直後 | running | 0.291 |
| 15 秒後 | running | 15.293 |
| 30 秒後 | running | 30.293 |
| 45 秒後 | running | 45.293 |
| 画面をロック（hidden） | running | 48.123 |
| ロックを外して発音ボタンを押す | running | 48.459 |
| さらに押す | running | 48.459 |

ロックから戻った後、state は `running` のままなのに、`currentTime` が 48.459 で止まっています。再生を始めても時計が進まないので、音は出ず、`onended` も来ません。チャットの声の「再生中の表示のまま戻らない」もこれでした。

`resume()` は state が `suspended` か `interrupted` のときに呼ぶものなので、`running` と答えている AudioContext には効きません。そこで、画面が一度隠れたら、次のタップで AudioContext を閉じて作り直すことにしました。

```ts
let appAudioContext: AudioContext | null = null;
let hiddenSinceCreated = false;

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && appAudioContext) hiddenSinceCreated = true;
});

/** タップのハンドラの同期部分で呼ぶ。 */
export function resumeAppAudio(): AudioContext {
  if (appAudioContext && hiddenSinceCreated) {
    void appAudioContext.close().catch(() => {});
    appAudioContext = null;
  }
  if (!appAudioContext) {
    appAudioContext = new AudioContext();
    hiddenSinceCreated = false;
  }
  const state: string = appAudioContext.state;
  if (state !== "running" && state !== "closed") void appAudioContext.resume();
  return appAudioContext;
}
```

作り直すと、古い AudioContext で作った GainNode などは使えなくなります。ノードを持っている側は、`node.context` が今の AudioContext と違えば作り直します。デコード済みの AudioBuffer は AudioContext に縛られないので、そのまま使い回せます。

この修正を入れた Debug ビルドで、同じ「ロックして 1〜2 分待つ」を試したら鳴りました。アプリは起動し直しておらず、50 音表の画面のままでした。ただ、ロック中は Mac との接続が切れてログが途切れたので、作り直しが動いたことをログでは見ていません。TestFlight の版でも同じ操作で確かめているところです。AudioContext を 1 つ作って使い回しているなら、ロックから戻った後に鳴るかを一度試してください。

## ビルド時の鍵の埋め込み

音とは別に、課金まわりの画面（プランと残りポイント）と単語帳の画面が空になる不具合も出ました。こちらは私のビルド手順の誤りです。

アプリの画面のビルドでは、Bun の `Bun.build({ env: "BUN_PUBLIC_*" })` で、`BUN_PUBLIC_` で始まる環境変数を `process.env.X` の位置に値として埋め込んでいます。課金 SDK（RevenueCat）の公開鍵もこの形で渡しています。Bun は起動したディレクトリの `.env` を読むので、作業ツリーの未コミットの変更を避けようと git worktree でビルドしたら、`.env` が無くて鍵が空になりました。埋め込まれなかった `process.env.BUN_PUBLIC_REVENUECAT_APPLE_KEY` は、ビルド後の JS に式のまま残っていました。

本番の HTTP ログを見ると、端末から課金と単語帳の API への要求は 200 で返っていて、通信は成功していました。`.env` を入れてビルドし直した版を実機に入れると、両方とも表示されました。なお、シミュレータでは鍵が空でも画面は出たので、鍵が空だと実機でなぜ画面が出なくなるのかまでは確かめていません。

対策として、本番向けのビルドのときは、鍵が空なら止め、ビルド後の JS に鍵の式が残っていても止めるようにしました。

```ts
if (apiOrigin === PRODUCTION_API_ORIGIN && !process.env.BUN_PUBLIC_REVENUECAT_APPLE_KEY) {
  console.error("BUN_PUBLIC_REVENUECAT_APPLE_KEY is empty");
  process.exit(1);
}
```

ビルド時に値を埋め込む仕組みは、値が無くてもエラーにならずに通ります。ストアに出すビルドでは、必要な値が入ったかをビルドの中で確かめてください。

## 同じ構成でやること

効く順に並べます。

1. 同梱の音声を fetch している所で、`res.ok` の代わりに `res.ok || res.status === 0` で受ける
2. AudioContext を使い回しているなら、画面が一度隠れた後の最初のタップで作り直す。ノードは `node.context` を見て作り直す
3. `resume()` は `suspended` のときだけでなく、`running` と `closed` 以外なら呼ぶ（iOS には `interrupted` がある）
4. ビルド時に埋め込む値は、ストア向けのビルドで空なら止める

## 調べ方

### サーバーのログ

「アプリで何かが出ない」ときは、まずサーバーに要求が届いて正常に返っているかを見ました。今回は全部 200 で返っていたので、API・CORS・認証の線を早く外せました。

### シミュレータでの差し替え

シミュレータに入れたアプリの中身は、`xcrun simctl get_app_container <UDID> <bundle id>` で場所が分かり、書き換えられます。`public/index.html` を診断用のページに差し替えれば、再ビルドせずに条件を変えて試せます。原因 1 の status 0 はこれで測りました。

### 実機のログ

Capacitor は Debug ビルドのとき、JS の console をアプリの標準出力に出します。USB でつないだ iPhone なら、`xcrun devicectl` で起動すると取れます。

```bash
DEVICECTL_CHILD_NSUnbufferedIO=YES xcrun devicectl device process launch \
  --console --terminate-existing --device <UDID> <bundle id>
```

`NSUnbufferedIO=YES` を付けないと、アプリの出力がバッファされて途中から届かなくなりました。最初に付けずに取ったときは、起動直後の 23 行で止まっていました。`devicectl` は `DEVICECTL_CHILD_` を前に付けた環境変数を、起動するアプリに渡します。

注意点として、Capacitor の Debug ビルドはプラグインの呼び出しと戻り値もログに出すので、Preferences に保存したセッションの token などもそのまま出ます。ログはリポジトリの外に置き、使い終わったら消してください。

なお、Capacitor の既定では、Release ビルドは JS の console を出さず、WKWebView の `isInspectable` も false なので Safari の Web インスペクタにつながりません（capacitor.config の `ios.webContentsDebuggingEnabled` を true にすれば Release でもつながる）。私は設定を変えていなかったので、TestFlight の版のままでは JS の様子が見られず、Debug ビルドで再現させました。

## 外れた線

- CORS: 本番の API は、対象の要求にネイティブの origin（`capacitor://localhost`）を許す応答を返していた
- iOS の版の違い: iOS 18.1 のシミュレータでも同じように動いた
- `navigator.audioSession.type = "ambient"`: マナーモードで音を止めるために入れていた指定。シミュレータではこれを入れても AudioContext は running になり、時計も進んだ

## 出典

- [WebViewAssetHandler.swift — Capacitor](https://github.com/ionic-team/capacitor/blob/main/ios/Capacitor/Capacitor/WebViewAssetHandler.swift)
- [Bundler の env オプション — Bun](https://bun.com/docs/bundler)
- [Web Audio API（AudioContextState）— W3C](https://webaudio.github.io/web-audio-api/)
- 検証用のページとコード: [blog-examples/2026/10-09-capacitor-ios-web-audio](https://github.com/mohhh-ok/blog-examples/tree/main/2026/10-09-capacitor-ios-web-audio)
