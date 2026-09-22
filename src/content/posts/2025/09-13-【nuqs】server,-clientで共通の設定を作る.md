---
title: "【nuqs】server, clientで共通の設定を作る"
pubDate: 2025-09-13
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## nuqs

nuqsは、URLのクエリパラメータを簡単に扱えるようにするライブラリです。2025年9月13日現在多くのスポンサーとコントリビューターが参加しています。

[https://nuqs.dev](https://nuqs.dev)

## 検証バージョン

*   nuqs: ^2.6.0

## server, clientは区別されている

parserはserverとclientとで区別されています。例えばparseAsStringLiteralを作ります。

```typescript
import { parseAsStringLiteral } from "nuqs";

export const parser = parseAsStringLiteral(CLIP_TYPES).withDefault('video')
```

これをserver側で使おうとすると、下記のエラーとなります。

```
Attempted to call parseAsStringLiteral() from the server but parseAsStringLiteral is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.
```

そのためserverで使うパーサーは、nuqsからではなく、nuqs/serverからimportする必要があります。

しかしこれでは、共通化ができません。

## 関数を受け取れるようにする

parseAsStringなどのパーサーは、型がserver, clientとで同じです。それを利用して、関数を受け取れるようにします。

```typescript
// 型のみ使用しているため、server, clientどちらでも使用可能
export type CreateParsersParams = Pick<typeof import('nuqs'),
  'parseAsString' |
  'parseAsStringLiteral'
>

// パラメータを作成
export function createParsers(p: CreateParsersParams) {
  return {
    type: p.parseAsStringLiteral(['video', 'image']).withDefault('video'),
    query: p.parseAsString.withDefault(''),
  }
}
```

これをサーバー、クライアントそれぞれで使用します。

```typescript
"use server

import * as nuqs from 'nuqs/server';
import { createLoader } from 'nuqs/server';

const parsers = createParsers(nuqs)
const loadSearchParams = createLoader(parsers)

type Props = {
  searchParams: Promise<any>
}

export default async function ServerComponent(props: Props) {
  const searchParams = await loadSearchParams(props.searchParams)
  ...
}
```

```typescript
"use client"

import * as nuqs from 'nuqs';
import { useQueryState } from 'nuqs';

const parsers = createParsers(nuqs)

function Component() {
  const [type, setType] = useQueryState('type', parsers.type);
  const [query, setQuery] = useQueryState('query', parsers.query);

  ...
}
```
