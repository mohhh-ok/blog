---
title: "【Tanstack Form】useFormの戻り型を定義する【React】"
pubDate: 2025-10-01
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## useFormの戻りが複雑

@tanstack/react-formは v1.23.4時点で、useFormの戻りを生成するユーティリティはありません。ジェネリクスも複雑で、自前で生成するのも困難な代物となっています。

```typescript
export declare function useForm<TFormData, TOnMount extends undefined | FormValidateOrFn<TFormData>, TOnChange extends undefined | FormValidateOrFn<TFormData>, TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>, TOnBlur extends undefined | FormValidateOrFn<TFormData>, TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>, TOnSubmit extends undefined | FormValidateOrFn<TFormData>, TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>, TOnDynamic extends undefined | FormValidateOrFn<TFormData>, TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>, TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>, TSubmitMeta>(opts?: FormOptions<TFormData, TOnMount, TOnChange, TOnChangeAsync, TOnBlur, TOnBlurAsync, TOnSubmit, TOnSubmitAsync, TOnDynamic, TOnDynamicAsync, TOnServer, TSubmitMeta>): ReactFormExtendedApi<TFormData, TOnMount, TOnChange, TOnChangeAsync, TOnBlur, TOnBlurAsync, TOnSubmit, TOnSubmitAsync, TOnDynamic, TOnDynamicAsync, TOnServer, TSubmitMeta>;
```

ためしにジェネリクスの第一引数にデータ型を渡してあとはanyで埋めるといったことも試しましたが、どうも思わぬところで型エラーになったりします。

## ReturnTypeを使う

決して美しくはありませんが、最も確実なのはReturnTypeを使う方法です。

```typescript
export type XxxForm = ReturnType<typeof useXxx>;

export function useXxx(){
  return useForm(...
}
```

これを使えば、例えばPropsで受け取る場合

```typescript
import { useForm, createFormHook, createFormHookContexts } from '@tanstack/react-form'

type AuthForm = ReturnType<typeof useAuthForm>

function useAuthForm() {
  return useForm({
    defaultValues: { email: '', password: '' },
  })
}

export function PropsSample() {
  const form = useAuthForm()
  return (
    <div>
      <EmailFieldByProps form={form} />
      <PasswordFieldByProps form={form} />
    </div>
  )
}

function EmailFieldByProps({ form }: { form: AuthForm }) {
  return (
    <form.Field name="email">
      {(field) => (
        <input
          value={field.state.value ?? ''}
          onChange={(e) => field.handleChange(e.target.value)}
          type="email"
          placeholder="email"
        />
      )}
    </form.Field>
  )
}

function PasswordFieldByProps({ form }: { form: AuthForm }) {
  return (
    <form.Field name="password">
      {(field) => (
        <input
          value={field.state.value ?? ''}
          onChange={(e) => field.handleChange(e.target.value)}
          type="password"
          placeholder="password"
        />
      )}
    </form.Field>
  )
}
```

contextも使えます。

```typescript

const AuthFormContext = createContext<AuthForm | null>(null)

function useAuthFormContext() {
  const ctx = useContext(AuthFormContext)
  if (!ctx) throw new Error('AuthFormContext is not provided')
  return ctx
}

export function ContextSample() {
  const form = useAuthForm()
  return (
    <AuthFormContext.Provider value={form}>
      <EmailFieldByContext />
      <PasswordFieldByContext />
    </AuthFormContext.Provider>
  )
}

function EmailFieldByContext() {
  const form = useAuthFormContext()
  return (
    <form.Field name="email">
      {(field) => (
        <input
          value={field.state.value ?? ''}
          onChange={(e) => field.handleChange(e.target.value)}
          type="email"
          placeholder="email"
        />
      )}
    </form.Field>
  )
}

function PasswordFieldByContext() {
  const form = useAuthFormContext()
  return (
    <form.Field name="password">
      {(field) => (
        <input
          value={field.state.value ?? ''}
          onChange={(e) => field.handleChange(e.target.value)}
          type="password"
          placeholder="password"
        />
      )}
    </form.Field>
  )
}
```
