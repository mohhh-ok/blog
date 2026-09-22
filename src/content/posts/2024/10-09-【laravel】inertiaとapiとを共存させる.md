---
title: "【Laravel】InertiaとAPIとを共存させる"
pubDate: 2024-10-09
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Inertia

InertiaはLaravelで使える機能で、サーバーサイドとクライアントサイドとの結合を密にすることができます。具体的には、データを直接Reactなどのコンポーネントに渡せます。フックも使えるため、かなり便利ではあります。

ただデメリットもあります。APIとして使おうとした時に、標準でHTMLが出力されてしまうために、APIルートを別途用意しなければいけません。これがどうも受け入れられなかったため、すったもんだした挙句下記の方法を思いつきました。

## APIと共存させる

APIとして使用する場合は、ヘッダーでJSONをリクエストするように設定します。

```typescript
headers:{accept:'application/json'}
```

axiosなど使用するクライアントでの初期設定に、上記ヘッダーを指定します。

次にLaravelではコントローラーで以下のようにします。

```php
 public function index(Request $request)
    {
        $data = ...
        return $request->expectsJson()
            ? $data
            : Inertia::render(
                'Xxx/Yyy',
                $data,
            );
    }
```

InertiaとAPIでエンドポイントを共有化できました。こうすることで、コードの大幅な削減が実現できます。
