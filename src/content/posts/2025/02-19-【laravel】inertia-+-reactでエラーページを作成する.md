---
title: "【Laravel】Inertia + Reactでエラーページを作成する"
pubDate: 2025-02-19
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Inertiaでのカスタムエラーハンドリング

下記で紹介されています。

[https://inertiajs.com/error-handling](https://inertiajs.com/error-handling)

これを実装するだけですが、メモも兼ねて書かせていただきます。

## エラー処理をカスタムする

下記が、公式で紹介されているコードです。bootstrap/app.phpです。

```php
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
        if (! app()->environment(['local', 'testing']) && in_array($response->getStatusCode(), [500, 503, 404, 403])) {
            return Inertia::render('Error', ['status' => $response->getStatusCode()])
                ->toResponse($request)
                ->setStatusCode($response->getStatusCode());
        } elseif ($response->getStatusCode() === 419) {
            return back()->with([
                'message' => 'The page expired, please try again.',
            ]);
        }

        return $response;
    });
})
```

今回は、全ての環境で統一したエラーページにしてみます。下記のように変更します。

```php
  ->withExceptions(function (Exceptions $exceptions) {
    $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
      return Inertia::render('Error', ['status' => $response->getStatusCode(), 'message' => $exception->getMessage()])
        ->toResponse($request)
        ->setStatusCode($response->getStatusCode());
```

これで、statusコードと、messageを渡すことができるようになりました。

ついでにjsonを期待するケースも入れるには、以下を追加します。

```
if ($request->expectsJson()) {
  return response()->json([
    'message' => $exception->getMessage()
  ], $response->getStatusCode());
}
```

Inertiaのtsxファイルを作成します。Error.tsxです。

```typescript
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

interface Props extends PageProps {
  status: number;
  message: string;
}

export default function Error() {
  const props = usePage<Props>().props;
  return <div>
    <h1>Error: {props.status}</h1>
    {props.message}
  </div>
}

```

あとはこれに、Layoutなどを追加すれば、整ったエラーページになりますね。実際には要件に従って、本番とテスト環境での出し分けや、エラーの分類などをすれば、OKかと思います。
