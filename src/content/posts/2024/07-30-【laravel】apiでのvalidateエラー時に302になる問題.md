---
title: "【Laravel】APIでのValidateエラー時に302になる問題"
pubDate: 2024-07-30
categories: ["Laravel"]
tags: []
---

こんにちは！フリーランスエンジニアのmohです。

## Laravel API Validateで302になる

LaravelではValidate機能があり、リクエストデータを簡単に検証できます。

```php
$data = $request->validate([
  'name' => 'required|string|max:255',
  ...
]);
```

大変便利なのですが、エラー時になぜか302が返ってしまいます。そうするとエラーメッセージも捕捉できなくなってしまいます。

以下の様にすると302にならず、直接エラーメッセージを返すことができます。

```php
try{
  $data = $request->validate([
    'name' => 'required|string|max:255',
    ...
  ]);
}catch(\Exception $e){
  return response()->json([
    'message' => $e->getMessage(),
    'error' => 'valiidation error',
  ],Response::HTTP_BAD_REQUEST);
}
```

## Middlewareで行う

ただ上記と毎回書くのが面倒なので、Middlewareに入れてしまいます。

```php
class HandleApiErrors
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'Bad Request'
            ], Response::HTTP_BAD_REQUEST);
```

しかしこれだけでは、また302が返ってしまいます。どうやらapiとしてアクセスしているかどうかの判定があるようで、apiではないと判定されると302になってしまうようです。

そこで以下の行を追加します。

```php
$request->headers->set('Accept', 'application/json');
```

これでapiとして認識され、302にならなくなります。

## 余談

眠いです。
