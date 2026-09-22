---
title: "【Strapi】generated後のd.tsファイルをライブラリに再利用する"
pubDate: 2023-11-19
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

Strapiはいつからかは分かりませんが、自動でContent-Typeの型定義を作成するようになっているようです。数ヶ月前には、このような挙動はなかったと思うのですが、最近Strapiを新たに構築し直しても自動でContent-Typeの型定義が作成されるようになっていました。

## 自動生成されるファイル

2023年11月19日現在、自動生成されるファイルは以下のようになっています。

```
- types
  - generated
    - components.d.ts
    - contentTypes.d.ts  
```

## 自動でコピーする

さてこの型定義をライブラリに含めて再利用したいわけです。例えばpackage.jsonを以下のようにします。

```json
{
  "scripts": {
    "develop": "strapi develop && cp -r ./types/generated ../lib/src/strapi/",
  }
}
```

こうすることで、strapiの開発実行ごとに毎回、../lib/src/strapiに自動生成されたd.tsファイルがコピーされます。

ですがこれだと、lib側のtscでうまくいきません。具体的には、d.tsファイルはtscでコンパイルされないためです。これはtscの仕様で、新しいd.tsファイルはオプション次第で作成するけども、もともとあるd.tsファイルは無視するようになっているためです。

## tscで処理できるように、d.tsから.tsにリネームする

そこで、d.tsから.tsにリネームするようにします。以下のスクリプトを用います。ファイル名は copy-generated-to-lib.jsとします。

```javascript
const fs = require('fs');
const path = require('path');

// ディレクトリパスを設定
const srcPath = path.join(__dirname, './types/generated/');
const distPath = path.join(__dirname, '../lib/src/strapi/generated/');

// 指定ディレクトリ内のファイルを走査
fs.readdir(srcPath, (err, files) => {
    if (err) {
        return console.error('Unable to scan directory: ' + err);
    }

    files.forEach((file) => {
        if (file.endsWith('.d.ts')) {
            const oldPath = path.join(srcPath, file);
            const newPath = path.join(distPath, file.replace('.d.ts', '.ts'));

            fs.copyFile(oldPath, newPath, (err) => {
                if (err) throw err;
                console.log(`${oldPath} was renamed to ${newPath}`);
            });
        }
    });
});
```

これを、先ほどのpackage.jsonの記述と置き換えます。

```json
{
  "scripts": {
    "develop": "strapi develop && node copy-generated-to-lib.js",
  }
}
```

これで、tsファイルがlibのsrcディレクトリにコピーされるようになりました。そのため、tscで処理されるようになり、libのdistディレクトリに鎮座するでしょう。

## 小話

最近寒いですね。家の中でジャンパーを羽織り、暖房は省エネで乗り切ってます。
