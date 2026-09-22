---
title: "【Drizzle】ReferenceError: Cannot access 'xxx' before initialization"
pubDate: 2025-06-17
categories: ["Drizzle"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## DrizzleのSchema管理

Drizzleはスキーマとリレーションをそれぞれファイルに分けて管理することがあるかと思います。

```
schema
- auth.ts
- authRelations.ts
- posts.ts
- postRelations.ts
- index.ts
```

上記構成の場合、それぞれのファイルでエクスポートした変数を、index.tsで再エクスポートする形になっています。インポートする側は次のようになります。

```typescript
import * as schema from './schema';

...

export const db = drizzle({ schema });
```

このようにすることで、簡単に全てのスキーマを使用して初期化することが可能となります。

## 循環参照が起きやすい

上記方法だと、それぞれのファイルで互いに参照し合うことになります。

特に下記のような書き方になると、本題のエラーとなります。

```typescript
// ./schema/authRelations.ts
import {} from '../schema';
```

IDEの自動補完を使っていると、しばしばこのような記述になってしまい、エラーとなります。index.tsを参照しているためですね。

```typescript
ReferenceError: Cannot access 'xxx' before initialization
```

ですので、下記のように明示的にファイルを指定する必要があります。

```typescript
// ./schema/authRelations.ts
import {} from './auth.ts';
```
