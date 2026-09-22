---
title: "【TypeScript】指定型から新規型を生成する機能をまとめてみた。Pick, Omit など。"
pubDate: 2024-02-06
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアmohです。

## TypeScriptの型定義

TypeScriptはJavaScriptに型定義を追加したもので、ビルド前のコーディング時の型安全性を担保できます。僕は型安全性大好き人間なので、TypeScriptを見るだけで涎が出てきます。ただ複雑なのも事実で、割と長く触ってるにも関わらず、いまだに調べながらコーディングしています。

そこで、今回はTypeScriptで指定型から新規型を生成する機能をまとめてみました。自分で書けば覚えれる。レッツゴー。といった感じです。

## 指定型から新規型生成

以下のような具合です。

```typescript
type T = {
    a: number;
    b: string;
    c: boolean;
};

// プロパティ選択
type Picked = Pick<T, 'a' | 'c'>; // { a: number; c: boolean; }

// プロパティ除外
type Omitted = Omit<T, 'b'>; // { a: number; c: boolean; }

// すべてのプロパティをオプショナルに
type PartialT = Partial<T>; // { a?: number; b?: string; }

// すべてのプロパティを必須に
type RequiredT = Required<T>; // { a: number; b: string; }

// すべてのプロパティを読み取り専用に
type ReadonlyT = Readonly<T>; // { readonly a: number; readonly b: string; }

// 特定の値を除外
type Excluded = Exclude<T, boolean | number>; // string

// 特定の値を抽出
type Extracted = Extract<T, string | boolean>; // string | boolean

// nullまたはundefinedを除外
type NonNullableT = NonNullable<T>; // string

```

いやぁ、TypeScript便利ですね。

## 小話

やはりコーヒーはブラックです。ただコーヒーだけだと飲みにくいので、ちょっとしたお菓子と一緒に楽しんでます。
