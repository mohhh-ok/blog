---
title: "【React】react-dialog-hubを公開しました"
pubDate: 2025-10-14
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## ReactのDialog事情

Reactでは通常、ダイアログは都度エレメントを生成する必要があります。それを補うためにフックライブラリがあります。

以前@ebay/nice-modal-reactを試しましたが、こちらは関数形で綺麗にかけるものの型が弱く、メンテナンス性に欠ける印象がありました。他にもいくつかダイアログ用のフックライブラリはいくつかあるようですが、ざっと見た感じだと欲しいものがなさそうでした。

## ChatGPT5での型作成爆速化

型の生成やチェックなどは、人力だけではなかなか大変です。複雑になると人間の頭ではなかなか追いつけません。その点ChatGPT5は複雑なロジックに割と強い傾向があり、型エラーなどの対応の手助け力が高いです。もちろん、人の介入がないとカオスになります。

型安全なライブラリを作るのが楽になった昨今、自前でライブラリを作りました。

## react-dialog-hub

欲しかったのは以下のものです。

*   MUIでも使える
*   Radixでも使える
*   ダイアログの関数制御
*   型安全

react-dialog-hubはこれらの要件を満たしています。シンプルなAPIで、すぐに使えます。

[https://www.npmjs.com/package/react-dialog-hub](https://www.npmjs.com/package/react-dialog-hub)

## 他ライブラリとの比較

他ライブラリとの比較を、第三者目線で作ってもらいました（ChatGPT5）。下記を参照ください。

[https://mohhh-ok.github.io/react-dialog-hub/docs/comparison](https://mohhh-ok.github.io/react-dialog-hub/docs/comparison)
