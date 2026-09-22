---
title: "GASのフォーム送信(doGet, doPost)でForbiddenになる問題を解決"
pubDate: 2023-08-06
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

狭い部屋でクーラーが効きすぎるので、扇風機の前に保冷剤を置いてパソコンを叩いてます。

## GASのdoGetで生成したフォームで送信するもForbidden

GASのdoGetでテンプレートファイルを読み込み、フォームを生成したのはいいものの、そこから送信するとなぜかForbiddenに。

過去にも経験したはずなのに、他の言語を叩いているうちについ忘れてしまうプログラマの性。

GPT4先生にいくら聞いても、解決に至らないこの問題。

結局Google先生に聞いた方が早かったこの問題。（2023/08/06現在、海外ではGoogleもAI搭載されているとか。TikTok情報）

以下に解決方法を書かせていただきます。

## 犯人はiFrame

GASはテンプレートをそのまま出力するのではなく、iFrameの中に書き込んでいます。

そのためそのiFrameの中から外のURLに送信しようとするので、Forbiddenになるようです。

解決策としましては、以下のように target に "\_top" を設定することです。

```javascript
function doGet(e) {
    const q = e.parameter.q;

    const template = HtmlService.createTemplateFromFile('index');
    template.self=ScriptApp.getService().getUrl();
    
    if (q) {
        const data = request(q);
        template.json = JSON.stringify(data, null, 4);
    }
    return template.evaluate();
}

```

```markup
<form action="<?= self ?>" method="get" target="_top">
    <input type="text" name="q" placeholder="検索">
    <button type="submit">検索</button>
</form>
```

ところで業務スーパーのレモネードベースが美味しすぎて、毎日飲んでます。

カルピスのように水で薄めて飲むので、ゴミも少ないし最高です。
