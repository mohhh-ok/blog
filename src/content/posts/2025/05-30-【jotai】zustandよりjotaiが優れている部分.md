---
title: "【Jotai】ZustandよりJotaiが優れている部分"
pubDate: 2025-05-30
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Jotai

Jotaiは、Reactのための軽量なステート管理ライブラリです。atomと呼ばれる単位を使用して状態を管理します。最小限のAPIで直感的にステートを定義・操作できます。このシンプルさに加え、TypeScriptとの相性も良いため、型安全に開発が進められる点も魅力の一つです。

## Zustand

ZustandはJotaiと同じ作者によるライブラリです。Jotai同様ステートを管理しますが、複数まとめて定義できることが特徴です。

## Jotai vs Zustand

### Zustandは変数+関数、Jotaiは変数のみ

Zustandは、変数も関数もまとめてステート管理します。これは刺さる人には刺さるかもしれませんが、関心の分離で言えば、ごちゃごちゃしている印象があります。

一方Jotaiは変数のみ管理し、ロジックはカスタムフックでまかなうという使い方となります。状態と操作が分離されており、一目でわかります。

### Zustandはsetterでフックが使えない

Zustandは宣言時にsetterを作りますが、フック外のためフックを使えません。結局他でフックを作成することになります。そうなると初めからsetter自体も他で作成した方がすっきりするのではないかと思います。

### Jotaiは変数 + カスタムフックが便利

JotaiはZustandに比べてちょっと面倒です。複数ステートをまとめて定義するZustandに対して、Jotaiは一つ一つ作成してそれぞれを操作します。こうしたことから、一見とっつきにくそうに見えます。ですが、この複雑さが逆に、より細かい制御やカスタマイズを可能にしています。

また、下記のようにカスタムフックを作成することで、様々なシーンに対する使い勝手が良くなります。

```typescript
export const sessionAtom = atom<Session | null>(null);
export const userAtom = atom<User | null>(null);

export const useAuth = () => {
  const [session, setSession] = useAtom(sessionAtom);
  const user = useAtomValue(userAtom);

  const deleteSession = () => setSettion(null);

  return { session, user, deleteSession };
}
```

### JotaiはSSRに強い

useHydrateAtomsを使用すれば、Next.jsなどのSSRを利用できます。初期値反映タイミングによるちらつきも起きません。また複数の値をまとめて初期化できるのも魅力です。

```typescript
import { atom, useAtom } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'

const countAtom = atom(0)
const CounterPage = ({ countFromServer }) => {
  useHydrateAtoms([[countAtom, countFromServer]])
  const [count] = useAtom(countAtom)
  // count would be the value of `countFromServer`, not 0.
}
```

## まとめ

最初は簡単なZustandを使おうとしたのですが、これまでにも簡単さと柔軟性のトレードオフには悩まされてきました。結局柔軟性を取った方が、後々のストレスも軽減することも多いので、それを踏まえて色々調べていた次第です。Zustandのまとめて定義も魅力的ですが、Jotaiでも上記のようにすればまとまった単位で見れるようになるため、割とスッキリするのではないかと思います。
