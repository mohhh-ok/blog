---
title: "【canopy-i18n】型安全に使えるi18nライブラリ【TypeScript】"
pubDate: 2025-09-15
updatedDate: 2026-02-17
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

Node.js/TypeScriptでのi18n、型ズレや初期設定の重さに悩まされがちです。この記事では、最小限のAPIで型安全に使える「canopy-i18n」を紹介します。

## i18nライブラリへの不満点

現在数々のi18nライブラリがあります。用途によって使いやすさは変わってくるかと思いますが、最近のモノレポやTypeScriptでのコーディングスタイルに合っているものがないように思います。具体的には以下のようなことがあります。

- **型安全性が弱い**: 翻訳キーのタイポや引数不足が実行時まで発覚しない。
- **初期設定が煩雑**: 設定ファイルやプラグインが多く、導入に腰が重い。
- **テンプレート制約**: `{{placeholder}}` のような独自構文で表現力が足りない。
- **深いデータ適用が面倒**: ネストしたオブジェクト/配列にロケールを一括適用しづらい。
- **ファイルが分散する**: 言語ごとにJSONファイルを分けるため、管理が煩雑になりがち。

## canopy-i18nで解決できること

canopy-i18nは、下記のような特徴があります。

- **型安全**: 許可ロケールやキーをコンパイル時にチェック。IntelliSenseも完全対応。
- **コロケーション**: すべての翻訳を1ファイルにまとめられるので、ファイル間を飛び回る必要がない。
- **ゼロ依存・ゼロ設定**: 外部依存なし。ローダーやプラグインの設定も不要。
- **自由なテンプレート**: ただのTypeScript関数なので、条件分岐や外部フォーマッタもそのまま使える。
- **ジェネリック返却型**: 文字列だけでなく、Reactコンポーネントやオブジェクトなど任意の型を返せる。
- **AI対応**: 型情報と単一ファイル構成により、AIアシスタントが正確にコード生成できる。

## インストール

```
npm i canopy-i18n
# or
pnpm add canopy-i18n
# or
bun add canopy-i18n
```

## 基本的な使い方

`createI18n` でビルダーを作り、`.add()` でメッセージを定義、`.build()` でロケールを確定します。メッセージは関数として直接呼び出せます。

```typescript
import { createI18n } from 'canopy-i18n';

const messages = createI18n(['ja', 'en'] as const)
  .add({
    title: { ja: 'タイトル', en: 'Title' },
    greeting: { ja: 'こんにちは', en: 'Hello' },
  })
  .build('en');

console.log(messages.title());    // "Title"
console.log(messages.greeting()); // "Hello"
```

同じビルダーから複数のロケールをビルドすることもできます。

```typescript
const builder = createI18n(['ja', 'en'] as const)
  .add({
    title: { ja: 'タイトル', en: 'Title' },
  });

const ja = builder.build('ja');
const en = builder.build('en');

console.log(ja.title()); // "タイトル"
console.log(en.title()); // "Title"
```

## テンプレート関数

動的な値を埋め込みたい場合は `.addTemplates()()` を使います。引数の型も推論されます。

```typescript
const messages = createI18n(['ja', 'en'] as const)
  .addTemplates<{ name: string; age: number }>()({
    welcome: {
      ja: (ctx) => `こんにちは、${ctx.name}さん。${ctx.age}歳ですね。`,
      en: (ctx) => `Hello, ${ctx.name}. You are ${ctx.age} years old.`,
    },
  })
  .build('en');

console.log(messages.welcome({ name: 'Tanaka', age: 20 }));
// "Hello, Tanaka. You are 20 years old."
```

`.add()` と `.addTemplates()()` はメソッドチェーンで混在できます。

```typescript
const messages = createI18n(['ja', 'en'] as const)
  .add({
    title: { ja: 'マイページ', en: 'My Page' },
  })
  .addTemplates<{ count: number }>()({
    items: {
      ja: (ctx) => `${ctx.count}個のアイテム`,
      en: (ctx) => `${ctx.count} items`,
    },
  })
  .build('ja');

console.log(messages.title());           // "マイページ"
console.log(messages.items({ count: 5 })); // "5個のアイテム"
```

## カスタム返却型

文字列以外を返すこともできます。たとえばオブジェクトを返したい場合は型引数を指定します。

```typescript
type MenuItem = { label: string; url: string };

const menu = createI18n(['ja', 'en'] as const)
  .add<MenuItem>({
    home: {
      ja: { label: 'ホーム', url: '/ja' },
      en: { label: 'Home', url: '/en' },
    },
  })
  .build('ja');

console.log(menu.home().label); // "ホーム"
console.log(menu.home().url);   // "/ja"
```

## Namespaceパターン（ファイル分割）

規模が大きくなったらファイルを分割し、`bindLocale` でツリー全体にロケールを一括適用できます。

```typescript
// i18n/common.ts
import { createI18n } from 'canopy-i18n';

export const common = createI18n(['ja', 'en'] as const).add({
  hello: { ja: 'こんにちは', en: 'Hello' },
  goodbye: { ja: 'さようなら', en: 'Goodbye' },
});

// i18n/user.ts
import { createI18n } from 'canopy-i18n';

export const user = createI18n(['ja', 'en'] as const)
  .addTemplates<{ name: string }>()({
    welcome: {
      ja: (ctx) => `ようこそ、${ctx.name}さん`,
      en: (ctx) => `Welcome, ${ctx.name}`,
    },
  });

// app.ts
import { bindLocale } from 'canopy-i18n';
import * as i18n from './i18n';

const messages = bindLocale(i18n, 'en');

console.log(messages.common.hello());              // "Hello"
console.log(messages.user.welcome({ name: 'John' })); // "Welcome, John"
```

`bindLocale` はネストしたオブジェクトや配列も再帰的に処理するため、どれだけ構造が深くなっても一発でロケールを切り替えられます。

## リンク

- [npm](https://www.npmjs.com/package/canopy-i18n)
- [GitHub](https://github.com/MOhhh-ok/canopy-i18n)
