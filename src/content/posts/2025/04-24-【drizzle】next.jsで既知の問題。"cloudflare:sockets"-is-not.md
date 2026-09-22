---
title: "【Drizzle】Next.jsで既知の問題。\"cloudflare:sockets\" is not handled by plugins"
pubDate: 2025-04-24
categories: ["Drizzle"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Next.js + Drizzle + Postgres

今回下記のエラーが出ました。

```
Module build failed: UnhandledSchemeError: Reading from "cloudflare:sockets" is not handled by plugins (Unhandled scheme).
Webpack supports "data:" and "file:" URIs by default.
You may need an additional plugin to handle "cloudflare:" URIs.
```

API RouteとServer Actionで上記のエラーとなっていました。

下記でドンピシャのissueが建てられています。

[https://github.com/vercel/next.js/discussions/50177](https://github.com/vercel/next.js/discussions/50177)

これによると、node-postgresに関した既知の問題のようです。

いくつか方法が紹介されていますが、今回、下記のようにすることで解決しました。

```typescript
// next.config.ts

const nextConfig:NextConfig = {
    // ...
    webpack: (config, { webpack }) => {
        config.plugins.push(new webpack.IgnorePlugin({
            resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
        }))

        return config
    },
}

export default nextConfig
```
