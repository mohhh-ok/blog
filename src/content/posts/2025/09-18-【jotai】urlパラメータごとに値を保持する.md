---
title: "【Jotai】URLパラメータごとに値を保持する"
pubDate: 2025-09-18
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Jotaiのスコープ

Jotaiはデフォルトでグローバルスコープを持ちますが、Providerを使用することで限定することもできます。

## 検証環境

*   "next": "15.4.6"
*   "jotai": "^2.12.5"

## URLパラメータごとに保持する

まず下記のように、任意のキーで分離できるProviderを作成します。

```typescript
const stores = new Map<string, ReturnType<typeof createStore>>()

export function KeyScopedProvider({ scopeKey, children }: { scopeKey: string; children: React.ReactNode }) {
  const store = useMemo(() => {
    let s = stores.get(scopeKey)
    if (!s) {
      s = createStore()
      stores.set(scopeKey, s)
    }
    return s
  }, [scopeKey])
  return <Provider store={store}>{children}</Provider>
}
```

これを使って、URLパラメータごとに保持する専用のProviderを作成します。

```typescript
export function SearchParamScopedProvider({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams();

  // 例: 全クエリをキーにする。特定のキーだけにするなら sp.get("roomId") などに変更
  const key = sp.toString();
  return <KeyScopedProvider scopeKey={key}>{children}</KeyScopedProvider>;
}
```

テストします。下記はnext.jsページの全コードです。

```typescript
"use client"

import { atom, createStore, Provider, useAtom } from 'jotai'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

const ageAtom = atom<number>(0)

export default function App() {
  return <SearchParamScopedProvider>
    <Inner />
  </SearchParamScopedProvider>
}

function Inner() {
  const [age, setAge] = useAtom(ageAtom)
  const searchParams = useSearchParams();
  const name = searchParams.get('name') ?? '';
  const pathname = usePathname();
  return <div>
    <Link href='?name=taro'>taro</Link><br />
    <Link href='?name=jiro'>jiro</Link><br />
    <Link href={`${pathname}/sub`}>Sub page</Link><br />
    <br />
    <br />
    {name}の歳は
    <input type='number' value={age} onChange={(e) => setAge(Number(e.target.value))} />
    です。
  </div>
}


export function SearchParamScopedProvider({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams();

  // 例: 全クエリをキーにする。特定のキーだけにするなら sp.get("roomId") などに変更
  const key = sp.toString();
  return <KeyScopedProvider scopeKey={key}>{children}</KeyScopedProvider>;
}


const stores = new Map<string, ReturnType<typeof createStore>>()

export function KeyScopedProvider({ scopeKey, children }: { scopeKey: string; children: React.ReactNode }) {
  const store = useMemo(() => {
    let s = stores.get(scopeKey)
    if (!s) {
      s = createStore()
      stores.set(scopeKey, s)
    }
    return s
  }, [scopeKey])
  return <Provider store={store}>{children}</Provider>
}

```

それぞれの名前ごとにageを設定できました。またsubpageから戻ってきた時も値が保持されています。
