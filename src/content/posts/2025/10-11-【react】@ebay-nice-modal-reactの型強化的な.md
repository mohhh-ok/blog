---
title: "【React】@ebay/nice-modal-reactの型強化的な"
pubDate: 2025-10-11
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## ReactのDialog事情

ReactでのDialogは、ボタンと一緒にElementも作成して使うのが一般的です。muiなどですね。ただしこれは結構面倒だったりします。イベント駆動で出したいだけなのに、毎回Element生成も書かないといけません。

そこで@ebay/nice-modal-reactを試しました。これはProviderで一元管理し、わざわざElementを都度生成しなくてもDialogが開けるようになっています。これは便利。

しかしデメリットもあります。

## @ebay/nice-modal-reactのデメリット

@ebay/nice-modal-reactはとにかく型が弱いです。インプットはPartialなため漏れが生じてDialogの中で落ちたり、アウトプットはunknownとなっています。これでは厳しいです。

## 型強化版的な

そこで似たような使用感で使えるのを作ってみました。GPT5があるとだいぶ楽に作れますね。

```typescript
// modal.tsx

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ModalProps<P, R> = P & {
  open: boolean;
  resolve: (value: R) => void;
  reject: (reason?: unknown) => void;
  close: () => void;
}

type ModalComponent<P, R> = (props: ModalProps<P, R>) => React.ReactNode;

type StackItem = {
  id: number;
  comp: ModalComponent<any, any>;
  props: any;
  resolve: (v: any) => void;
  reject: (r?: unknown) => void;
};

type ModalContextValue = {
  show: <P, R>(comp: ModalComponent<P, R>, props: P) => Promise<R>;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<StackItem[]>([]);
  const show = useCallback(<P, R,>(comp: ModalComponent<P, R>, props: P) => {
    return new Promise<R>((resolve, reject) => {
      setStack((s) => [
        ...s,
        { id: Date.now() + Math.random(), comp, props, resolve, reject },
      ]);
    });
  }, []);

  const value = useMemo<ModalContextValue>(() => ({ show }), [show]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {stack.map((item) => {
        const close = () =>
          setStack((s) => s.filter((x) => x.id !== item.id));
        return (
          <item.comp
            key={item.id}
            {...item.props}
            open={true}
            resolve={(v: any) => { item.resolve(v); close(); }}
            reject={(r?: unknown) => { item.reject(r); close(); }}
            close={close}
          />
        );
      })}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
```

下記のようにして使います。型安全です。

```typescript
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { ModalProvider, useModal, type ModalProps } from "./modal";

type Input = { title: string; description: string; };
type Output = string;
type MyDialogProps = ModalProps<Input, Output>;
function MyDialog(
  { title, description, open, close, reject, resolve }: MyDialogProps
) {
  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{description}</DialogContent>
      <DialogActions>
        <Button onClick={() => reject("error from dialog")}>Error</Button>
        <Button onClick={() => resolve("ok from dialog")}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function App() {
  return <ModalProvider>
    <Inner />
  </ModalProvider>
}

function Inner() {
  const { show } = useModal();
  const handleClick = async () => {
    try {
      const result = await show(MyDialog, {
        title: 'タイトル',
        description: "説明",
      });
      alert("success: " + result);
    } catch (e) {
      alert("error: " + e);
    }
  };
  return <Button onClick={handleClick}>Show Dialog</Button>;
}
```

## より安全な

上記のコードでは、resolve引数の推論に引っ張られてpropsが間違えてしまうことがあります。これを解決するために、resolveで引数をやめてみました。以下はresolveで引数を渡さないバージョンです。resolveで渡す代わりにイベント駆動を想定しています。

```typescript
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ModalBase = {
  open: boolean;
  resolve: () => void;
  reject: (reason?: unknown) => void;
  close: () => void;
}

export type ModalProps<P> = P & ModalBase;

type ModalComponent<P> = (props: ModalProps<P>) => React.ReactNode;

type StackItem = {
  id: number;
  comp: ModalComponent<any>;
  props: any;
  resolve: ModalBase['resolve'];
  reject: ModalBase['reject'];
};

type ShowFn = <P>(comp: ModalComponent<P>, props: Omit<P, keyof ModalBase>) => Promise<void>;

type ModalContextValue = {
  show: ShowFn;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<StackItem[]>([]);
  const show = useCallback(<P,>(comp: ModalComponent<P>, props: Omit<P, keyof ModalBase>) => {
    return new Promise<void>((resolve, reject) => {
      setStack((s) => [
        ...s,
        { id: Date.now() + Math.random(), comp, props, resolve, reject },
      ]);
    });
  }, []);

  const value = useMemo<ModalContextValue>(() => ({ show }), [show]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {stack.map((item) => {
        const close = () =>
          setStack((s) => s.filter((x) => x.id !== item.id));
        return (
          <item.comp
            key={item.id}
            {...item.props}
            open={true}
            resolve={() => { item.resolve(); close(); }}
            reject={(r?: unknown) => { item.reject(r); close(); }}
            close={close}
          />
        );
      })}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
```
