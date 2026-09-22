---
title: "【Vite】lazy分割よりmanualChunkが便利【React】"
pubDate: 2025-10-03
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Reactのchunk

Reactのビルドはchunk戦略がかかせません。適切なchunkで初回ローディング速度が決まります。

たとえばlazy戦略だと、

```
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
```

といったように、遅れて読み込むことでchunkし、ファイルサイズの肥大化を防止することでユーザー体験の向上を図ります。しかし後述するViteのmanualChunksを使えば、わざわざこういったlazy戦略は必要なくなります。

## ViteのmanualChunk

Viteでは設定で、分割するパッケージを指定できます。これにより重複するデータが整理されます。

以下は一例です。

```typescript
export default defineConfig(() => {
  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react': ['react', 'react-dom/client', 'react-router-dom'],
            'mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
            'basics': ['zod', 'dayjs', 'jotai', 'swr', 'axios', 'react-hot-toast', 'react-icons'],
          },
        }
      }
    }
  }
})
```

lazyから解放されてすっきりしました。なおreact-domはreact-dom/clientを指定しないと効果がないそうです。
