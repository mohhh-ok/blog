---
title: "【TypeScript】JSからTSファイルを読み込む"
pubDate: 2025-01-26
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 設定ファイルにtsを使いたい

ツールの設定ファイルを、.envやjsで作ることはあっても、tsで作ることは少ないかもしれません。一緒にコンパイルするならいいのですが、そうではなくコンパイル後のコードからtsを読み込むのは面倒だからです。

## ts-nodeを使って、jsからtsを読み込む

以下のようにすると、tsを直接コンパイルできます。

```typescript
import * as tsnode from 'ts-node';

...

const configString = fs.readFileSync(configPath, 'utf-8');
const compiledCode = tsnode
  .create()
  .compile(configString, 'config_dummy.ts');
```

ここで、config\_dummy.tsは単なる識別用の文字列で、何を設定しても良いそうです。(GPT談)

これを使い、config.tsを読み込むスクリプトを書いてみました。

```typescript
import { Config } from './types';

const config: Config = {
  apiKey: 'your-api-key',
  names: ['John', 'Jane', 'Doe'],
};

export default config;
```

```typescript
import * as tsnode from 'ts-node';
import * as path from 'path';
import * as fs from 'fs';
import { Config } from './types';

export function loadConfig(configPath: string): Config {
  try {
    const configString = fs.readFileSync(configPath, 'utf-8');
    const compiledCode = tsnode
      .create()
      .compile(configString, 'config_dummy.ts');
    const compiledPath = path.join(__dirname, 'compiled.js');
    fs.writeFileSync(compiledPath, compiledCode);
    const data = require(compiledPath);
    fs.unlinkSync(compiledPath);
    return data.default;
  } catch (err: any) {
    return {};
  }
}

const config = loadConfig(path.resolve(__dirname, 'config.ts'));
console.log(config);
```
