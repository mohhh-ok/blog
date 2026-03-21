---
title: 【Playwright】ESMでのimport入れ子エラー問題。exports is not defined in ES module scope
pubDate: 2026-03-21
categories: ["TypeScript"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## Playwright

Playwrightはブラウザ自動化ツールです。E2Eテストなどで使用できます。

## ESMでの不具合

PlaywrightはESMに対応していますが、importが入れ子になるとエラーになることがあります。

```
exports is not defined in ES module scope
```

AIに聞いてみたところ、以下のような回答でした。

> Playwright の Test Runner は Node.js のネイティブ ESM ローダーではなく、独自の仕組み（内部で ts-node 的な変換をしている）でモジュールを読み込んでいます。そのため、深い import チェーンや .ts 拡張子の解決が途中で壊れるケースがあります。

これは知られた不具合で、独自トランスパイラが入れ子importをうまく処理できないことが原因のようです。

## 解決策

色々とAIからの提案があったのですが、なんとかシンプルな方法に辿り着けました。結論として、NODE_OPTIONSでtsx設定を渡せばOKです。以下のようになります。

```
NODE_OPTIONS="--import tsx" npx playwright test
```

## まとめ

ESM周りは本当に厄介ですね。
