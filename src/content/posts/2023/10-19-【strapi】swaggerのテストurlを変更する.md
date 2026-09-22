---
title: "【Strapi】SwaggerのテストURLを変更する"
pubDate: 2023-10-19
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

StrapiにはDocumentationというプラグインがあり、そこでAPIのテストを行ったりすることができます。

## テスト用のURLを変更する

SwaggerはデフォルトでURLがlocalhostとなっています。これに新しいURLを足したり、変更したりするには、/config/plugins.tsファイルに以下の記述を足します。

```
module.exports = ({ env }) => ({
    ...

    documentation: {
        config: {
            servers: [
                {
                    url: env('API_URL', 'http://localhost:1337'),
                    description: 'Development server',
                },
            ],
        }
    },
});

```

ここではAPI\_URL環境変数を読み込んでいますが、もちろん直接記述することもできます。また複数指定すれば、ページ表示時にどれかを選択できるようになります。便利ですね。

他の設定項目は以下に書かれています。

https://docs.strapi.io/dev-docs/plugins/documentation

ではでは。
