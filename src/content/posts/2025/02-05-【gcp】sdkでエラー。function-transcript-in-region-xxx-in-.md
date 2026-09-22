---
title: "【GCP】SDKでエラー。Function transcript in region xxx in project yyy does not exist"
pubDate: 2025-02-05
categories: ["Google Cloud"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## GCP SDK

GCPのSDKは公式の説明が非常にシンプルで、まるで最先端のミニマリストです。使い方はChatGPTに頼るしかありません。

## 関数が見つからない？

以下のコードでエラーになりました。

```typescript
import { CloudFunctionsServiceClient } from '@google-cloud/functions';

async function test() {
  const client = new CloudFunctionsServiceClient();
  const res = await client.getFunction({
    name: `projects/yyy/locations/xxx/functions/zzz`,
  });
  console.log('Function details:', res);
}

test();

// Function transcript in region xxx in project yyy does not exist
```

GPT先生曰く、axios使ったら？との事でした。いやいやいや、そんな殺生な。

## バージョンが違いました

はい！バージョン違いでした。以下のようにすれば動きます。

```typescript
import { v2 } from '@google-cloud/functions';

async function test() {
  const client = new v2.FunctionServiceClient();
  const res = await client.getFunction({
    name: `projects/yyy/locations/xxx/functions/zzz`,
  });
  console.log('Function details:', res);
}

test();
```
