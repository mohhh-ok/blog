---
title: "【Tanstack Form】送信試行後のみonChange検証する【React】"
pubDate: 2025-09-30
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Tanstack FormのonChange

Tanstack Formでのバリデーションは、フィールドごとにどのイベントで発火させるかなどわかりやすいAPIとなっています。

## 送信試行後のみonChangeする

ユーザー体験向上のため、下記のような動作にします。

*   メールアドレスを入力
*   送信試行
*   エラー表示。以降は入力に追従してエラーが変化する

### 公式の方法

公式で紹介されているのは、onDynamicを使った方法です。下記ではzodを使用しています。

```typescript
const form = useForm({
  validationLogic: revalidateLogic({
    mode: 'submit',
    modeAfterSubmission: 'change',
  }),
  ...

...

<form.Field
      validators={{
        onDynamic: ({value}) => z
            .email('有効なメールアドレスを入力してください')
            .max(200, '200文字以内で入力してください'))
            .safeParse(value).error?.issues[0]?.message
      ...
      }}
```

初期モードはonSubmit, 送信後はonChangeに切り替わります。便利。

### オレオレの方法

下記は非推奨の方法です。

以下のようなユーティリティを作ります。zodを使用しています。

```typescript
type ValidateParams = { value: any, fieldApi: AnyFieldApi }

export function createZodValidator(
  schema: z.ZodSchema,
  options?: { onlyAfterAttempts?: boolean }
) {
  return ({ value, fieldApi }: ValidateParams) => {
    if (options?.onlyAfterAttempts && fieldApi.form.state.submissionAttempts === 0) {
      return undefined;
    }
    return schema.safeParse(value).error?.issues[0]?.message
  }
}
```

これを使用して、以下のようにします。

```typescript
<form.Field
  name="age"
  validators={{
    onChange: createZodValidator(
      z.email('有効なメールアドレスを入力してください'),
      { onlyAfterAttempts: true })
  }}
>
  {(field) => (
    <>
      ...
    </>
  )}
</form.Field>
```
