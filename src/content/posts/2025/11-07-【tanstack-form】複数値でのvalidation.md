---
title: "【Tanstack Form】複数値でのValidation"
pubDate: 2025-11-07
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Tanstack Formでの複数値でのValidation

Tanstack Formでは、通常一つ一つのコンポーネントをFieldで囲む使い方をします。そのため互いに干渉することはありません。

例えば以下のコードでは、confirmフィールドの変更時にvalidationが走りますが、passwordフィールドの変更時には走りません。またfieldApi.form.getFieldValue('password')も変更されません。

```typescript
<form.Field name="password">
  {(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.setValue(e.target.value)}
    />
  )}
</form.Field>

<form.Field
  name="passwordConfirm"
  validators={{
    onChange: ({ value, fieldApi }) => value !== fieldApi.form.getFieldValue("password") && "一致しません",
  }}
>
  {(field) => (
    <>
      <input
        value={field.state.value}
        onChange={(e) => field.setValue(e.target.value)}
      />
      {field.state.meta.errors[0]}
    </>
  )}
</form.Field>
```

## onChangeListenToを使う

これを解消するためにSubscriptionで複数値を検知したりしていたのですが、実際はもっと簡単にできます。複数検知するには、onChangeListenToを指定します。

```typescript
  validators={{
    onChangeListenTo: ["password"], // これを追加
    onChange: ({ value, fieldApi }) => value !== fieldApi.form.getFieldValue("password") && "一致しません",
  }}
```

これで、password変更時にもvalidationが走ります。また、getFieldValueも更新されます。

以下は全体のコードです。

```typescript
import { useForm } from "@tanstack/react-form";

const defaultValues = {
  password: "",
  passwordConfirm: "",
};
export function ValidationTest() {
  const form = useForm({ defaultValues });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <form.Field name="password">
        {(field) => (
          <input
            value={field.state.value}
            onChange={(e) => field.setValue(e.target.value)}
          />
        )}
      </form.Field>
      <form.Field
        name="passwordConfirm"
        validators={{
          onChangeListenTo: ["password"],
          onChange: ({ value, fieldApi }) => value !== fieldApi.form.getFieldValue("password") && "一致しません",
        }}
      >
        {(field) => (
          <>
            <input
              value={field.state.value}
              onChange={(e) => field.setValue(e.target.value)}
            />
            {field.state.meta.errors[0]}
          </>
        )}
      </form.Field>
    </div>
  );
}
```
