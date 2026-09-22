---
title: "【Jotai】useHydrateAtomでもHydration failedする場合【Next.js】"
pubDate: 2025-07-14
categories: ["Next.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## JotaiのuseHydrateAtom

Jotaiは、Reactで使える状態管理ライブラリです。サーバーデータからクライアントに渡す際に、useHydrateAtomが用意されています。

## useHydrateAtomでもHydration failedになる

Next.jsのApp Routerでは、useHydrateAtomが正常に動作しない時があります。例えば

```
app
 - layout.tsx
 - layoutClient.tsx
 - page.tsx
 - users
  - page.tsx
```

以下のような流れとなります。

*   layout.tsx (server) サーバーデータを取得
*   layoutClient.tsx (client) useHydrateAtomを使用

これは一見、正常に動作するように見えます。しかしNext.jsではレンダリングの順番が特殊です。具体的には、page.tsxからレンダリングが開始されます。おそらく、下記のようになります。

*   page.tsxレンダリング (Hydration failed)
*   layoutClient.tsxレンダリング (useHydrateAtomが動作)

これが原因で、Hydration failedになると思われます。

## 対策

ClientOnlyコンポーネントを使用する方法があります。

```typescript
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null

  return children;
};
```

これをlayoutClient.tsxに入れれば、Hydration failedは解消されます。
