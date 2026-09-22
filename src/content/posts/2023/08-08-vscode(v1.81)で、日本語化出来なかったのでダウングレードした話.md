---
title: "VSCode(V1.81)で、日本語化出来なかったのでダウングレードした話"
pubDate: 2023-08-08
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

愛用しているVSCodeにて、突然英語に戻ってしまったので、それについてです。

## Japanese Language Pack for Visual Studio Code

調べてみると、どうやらJapanese Language Pack for Visual Studio Codeが消えていました。

再度インストールしても反応なし。試しに再起動するとJapanese Language Pack for Visual Studio Codeが再び消えていました。

そうしたことを３回ほど繰り返した後、ようやくVSCodeの更新履歴を見にいきました。

どうやらV1.81が７月にリリースされており、これかなと思い試しにV1.80に落としてみた所、該当のプラグインを正常にインストールすることができました。

## ダウングレード方法

以下から、VSCode 1.80をダウンロードできます。

https://code.visualstudio.com/updates/v1\_80

VSCodeは再起動せずにPCをスリープさせる運用でずっと来ていましたので、おそらくこの更新が今まで反映されていなかったのかと思います。

また、djlint周りでもおかしな挙動をしていましたので、ついでにこれも治ってくれればいいなと。

ではでは。
