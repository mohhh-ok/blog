---
title: "【TypeScript】Zodのbrandでパスワード漏洩を防いだり色々する"
pubDate: 2025-06-12
categories: ["TypeScript"]
tags: []
---

こんんちは、フリーランスエンジニアのmohです。

## Zod

Zodは実行時に型を保証するためのライブラリです。TypeScriptは通常、実行前の型を保証しますが、実行時には検証を行いません。そのため思わぬデータが入ってきたりします。そうした事態を避けるため、Zodを使用します。

## TypeScriptのBranded Type

TypeScriptでのBranded Typeは、型に独自のフィールドを追加することで他と分離します。

```
type UserId = string & { readonly __brand: 'UserId' }
```

上記の場合、ただのstringではなく特殊なstringであることになります。

## Zodのbrand

Zodのbrand機能は、TypeScriptのBranded Typeを簡単に使えるようにするものです。これを使用することで、検証済みが保証された型を生成できます。つまり安全なデータの受け渡しが可能となります。

## パスワード除外を保証する

下記のようにすれば、パスワード除外を保証できます。

```typescript
import { z } from "zod";

// ブランド定義例

type User = {
  name: string;
  passwordHash: string;
}

const safeUserSchema = z.object({
  name: z.string(),
}).brand("SafeUser");

type SafeUser = z.infer<typeof safeUserSchema>;


// 使用例

function getUser(): SafeUser {
  const user = {
    name: 'taro',
    passwordHash: 'xxx'
  }

  // return user // そのまま返すと型エラーになる

  return safeUserSchema.parse(user) // 検証すれば型が合う
}

console.log(getUser()); // passwordHashが除外されている
```

## 環境変数の値を保証する

TypeScriptであらかじめ定義できない、環境変数などの値に対しても使えます。下記のようにすれば、値が環境変数から取得されたものであることが保証されます。

```typescript
import { z } from "zod";

const animalSchema = z.string().brand('animal');

type Animal = z.infer<typeof animalSchema>;

const ENV_ANIMAL1 = animalSchema.parse(process.env.ANIMAL1);
const ENV_ANIMAL2 = animalSchema.parse(process.env.ANIMAL2);
const animal3 = 'cat';


function test(animal: Animal) {
  console.log(animal);
}

test(ENV_ANIMAL1); // ok
test(ENV_ANIMAL2); // ok
test(animal3); // 検証されていないため型エラー
```
