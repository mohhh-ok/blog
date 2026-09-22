---
title: "【GAS】Clasp環境でesbuildバンドルする"
pubDate: 2025-01-16
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## GASの開発体験

GASはデフォルトでは、ブラウザ上でコードを書きます。しかしこれでは、なかなか大変です。エディタも必要最低限の機能しか持っていません。そのためClaspを使ったりするのですが、今回はもう一つ進んだ開発のために、バンドルを行います。Node.jsの強力なライブラリを使用することもできるので、開発体験が向上します。

## 一発で構築する

この記事では手順を紹介していますが、毎回構築するのは面倒です。そのため、Clasp含めて構築するライブラリを公開しました。

[https://www.npmjs.com/package/@masa-dev/create-gas-app](https://www.npmjs.com/package/@masa-dev/create-gas-app)

コマンドライン形式で、Clasp + TypeScript + esbuild環境を構築できます。

以下、通常の手順です。

## 通常の手順

### ライブラリ選定

GASのバンドルに使用するライブラリを選定します。

候補

*   esbuild-gas-plugin
*   esbuild-plugin-gas-generator
*   rollup-plugin-google-apps-script

2025/01/16現時点で、esbuild-gas-pluginが圧倒的にダウンロード数が多いです。今回はこちらを使用します。

### esbuild-gas-plugin

まず必要なものをインストールします。

```bash
npm i -D esbuild esbuild-gas-plugin @types/google-apps-script typescript
```

build.jsファイルを作成します。

```javascript
const { GasPlugin } = require('esbuild-gas-plugin');

require('esbuild').build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [GasPlugin]
}).catch((e) => {
  console.error(e)
  process.exit(1)
})
```

srcディレクトリにファイルを作成します。

```typescript
import { someFunction } from './someModule';

function main() {
  console.log('Hello world!');
  someFunction();
}

// GASに関数を認識させる
(global as any).main = main;
```

```typescript
export function someFunction() {
  console.log('Hello world! from someModule');
}
```

package.jsonに以下を追加します。

```json
{
  "scripts": {
    "build": "node build.js"
  }
}
```

これで準備完了です!

### 実行する

実行すると、distディレクトリにバンドルされたファイルが生成されます。

```javascript
let global = this;
function main() {
}
(() => {
  // src/someModule.ts
  function someFunction() {
    console.log("Hello world! from someModule");
  }

  // src/index.ts
  function main() {
    console.log("Hello world!");
    someFunction();
  }
  global.main = main;
})();
```

あとはこれをGASに貼り付ければOKです。Clasp使用すると、自動で反映できるようになります。
