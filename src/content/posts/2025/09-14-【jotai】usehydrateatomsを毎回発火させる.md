---
title: "【Jotai】useHydrateAtomsを毎回発火させる"
pubDate: 2025-09-14
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## useHydrateAtoms

useHydrateAtomsはServerからClientに簡単にデータを渡せる関数です。useEffectや待機処理を別途書く必要がなく、とても便利な関数です。

## 一度実行されると更新されない

useHydrateAtomsは一度実行されると、値が変更されたとしても再実行はされません。そのため

*   Serverから値を渡す
*   Clientで値を反映させる
*   Serverから違う値を渡す
*   Clientで値が変わらない

といったことが発生します。

## Providerとkeyを併用する

この解決のためには、Providerとkeyを使用します。

JotaiのProviderを使用してatomのスコープを限定します。またURL由来のキーを当てることで、変更が反映されるようにします。

```typescript
"use client"

type ClientProps = {
  data: any;
}

export function Client(props: Props){

  // URL由来のキーを生成
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;

  // Providerを使用してスコープを限定する
  return <Provider key={key}>
    <Child {...props} />
  </Provider>
}

function Child(props: Props){
  useHydrateAtoms([[dataAtom, props.data]]);

  return <div>
    ...
  </div>
}
```

これでserverのデータがclientに反映されるようになります。
