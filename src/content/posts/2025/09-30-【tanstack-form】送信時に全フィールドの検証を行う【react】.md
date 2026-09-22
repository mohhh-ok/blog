---
title: "【Tanstack Form】送信時に全フィールドの検証を行う【React】"
pubDate: 2025-09-30
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Tanstack Form

Tanstack FormはForm用ライブラリです。

[https://tanstack.com/form/latest](https://tanstack.com/form/latest)

これまでreact-hook-formを使っていましたが、Tanstack Formに乗り換えました。型安全で、自由度も高くストレス軽減につながります。

## 送信時に必ずしもすべてのフィールドは検証されない

例えばonSubmit検証をつけます。

```typescript
<form.Field
  name="age"
  validators={{
    onSubmit: ({ value }) =>
      value < 13 ? 'You must be 13 to make an account' : undefined,
  }}
>
  {(field) => (
    <>
      ...
    </>
  )}
</form.Field>
```

単体なら問題ありませんが、これが複数フィールドになると問題が出てきます。

*   送信
*   フィールドA, フィールドBで検証エラー
*   フィールドAを修正して送信
*   フィールドAの検証が走らない

これは仕様のようですが、ケースによっては不適です。送信ボタンを押すとすべてのフィールドの検証が走り、適切なエラーメッセージがそれぞれで表示されるのが、ユーザーの自然な想定かと思います。

下記のようにすれば、毎回すべてのフィールドで検証が走るようになります。

```typescript
onClick = ()=>{
  form.validateAllFields('submit');
  form.handleSubmit();
}
```
