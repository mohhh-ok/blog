---
title: "field-guardでフィールドレベルのアクセス制御を型安全に実現する"
emoji: "🛡️"
type: "tech"
topics: ["typescript", "accesscontrol", "oss", "npm"]
published: true
---

TypeScript向けのフィールドレベルアクセスコントロールライブラリ「field-guard」をご紹介します。

https://www.npmjs.com/package/field-guard

## 背景

### アクセス制御

ライブラリを使わずにアクセス制御をしようとなると、その場でロジックを書いていく必要があります。少数なら問題ありませんが、膨大になってくると一箇所で書いて管理したいといった需要が発生します。この時、いかに楽に見やすく書けるかがポイントになります。プロジェクトに応じた独自実装でも良いのですが、ライブラリといった共通基盤のあるほうが、ありがたいのは明白です。

### 既存ライブラリからの脱却

既存のアクセス制御にはCASLなどがあります。canメソッドで構築していくスタイルで設定しやすく、しばらく使っていましたが型の弱さが気になりました。

Prismaなど対応ORMでないと恩恵が少ないように感じ、Drizzleユーザーの私には向かないと判断しました。そこでDrizzleユーザー向けに一から自作しようと思い立った次第です。もちろん、Drizzleユーザー以外でも汎用的に使えるようにしています。

## 特徴

APIやサービス層で「このユーザーにはこのフィールドを見せたくない」という要件はよくあります。自分のプロフィールならemailを見れるが、他人のプロフィールではidとnameだけ返したい、といったケースです。

field-guardは、**誰が・どのフィールドを見れるか**を型安全に定義・評価できるライブラリです。

![field-guardの評価フロー](https://raw.githubusercontent.com/mohhh-ok/blog/main/src/content/posts/2026/02-17-field-guard-access-control.svg)

## インストール

```bash
npm install field-guard
```

## 基本的な使い方

### 1. Guardを定義する

```ts
import { defineGuard } from "field-guard";

type Ctx = { userId: string; role: "admin" | "user" };

const userGuard = defineGuard<Ctx>()({
  fields: ["id", "email", "name"],
  policy: {
    owner: true,                     // 全フィールド許可
    other: { id: true, name: true }, // idとnameだけ許可
  },
});
```

`policy`には以下の4パターンを指定できます。

- `true` — 全フィールド許可
- `false` — 全フィールド拒否
- ホワイトリスト `{ id: true, name: true }` — 明示したフィールドのみ許可
- ブラックリスト `{ secretField: false }` — 指定フィールド以外を許可

trueを含むオブジェクトはホワイトリスト、falseのみのオブジェクトはブラックリストとして自動判定されます。

### 2. チェック関数を追加する

`.withCheck<T>()`で、コンテキストと対象オブジェクトからアクセスレベルを解決するロジックを書きます。

```ts
type User = { id: string; email: string; name: string };

const userGuard = defineGuard<Ctx>()({
  fields: ["id", "email", "name"],
  policy: {
    owner: true,
    other: { id: true, name: true },
  },
}).withCheck<User>()(({ ctx, target, verdictMap }) => {
  const level = ctx.userId === target.id ? "owner" : "other";
  return verdictMap[level];
});
```

### 3. 評価する

```ts
const guard = userGuard.for({ userId: "1", role: "user" });

// 自分自身 => 全フィールド見れる
const v1 = guard.check({ id: "1", email: "me@example.com", name: "Me" });
v1.allowedFields; // ["id", "email", "name"]

// 他人 => idとnameだけ
const v2 = guard.check({ id: "2", email: "other@example.com", name: "Other" });
v2.allowedFields; // ["id", "name"]
```

### 4. Verdictのヘルパー

返却される`FieldVerdict`には便利メソッドがあります。

```ts
verdict.coversAll(["id", "name"]);  // true: 指定フィールド全て許可されている
verdict.coversSome(["email"]);      // true: 指定フィールドのいずれかが許可されている
```

## 応用的な使い方

### 派生プロパティの追加

`.withDerive()`で、コンテキストから追加のプロパティを計算できます。

```ts
const guard = defineGuard<Ctx>()({
  fields: ["id", "email"],
  policy: { public: true },
}).withDerive(({ ctx }) => ({
  isAdmin: ctx.role === "admin",
}));

const g = guard.for({ userId: "1", role: "admin" });
g.isAdmin; // true
```

### 複数Guardの統合

`combineGuards`で複数リソースのGuardをまとめて、コンテキストを一度だけバインドできます。

```ts
import { combineGuards } from "field-guard";

const guards = combineGuards<Ctx>()({
  users: userGuard,
  posts: postGuard,
});

const g = guards.for({ userId: "1", role: "user" });
g.users.check({ id: "1", email: "a@b.com", name: "A" });
g.posts.check({ id: "p1", content: "hello", authorId: "1" });
```

### Verdictのマージ

複数のVerdictを`union`（OR）や`intersection`（AND）で合成できます。

```ts
import { mergeFieldVerdicts } from "field-guard";

// いずれかが許可していればOK
mergeFieldVerdicts("union", [verdictA, verdictB], fields);

// 全てが許可している場合のみOK
mergeFieldVerdicts("intersection", [verdictA, verdictB], fields);
```


## 具体的なユースケース

実際のプロジェクトで遭遇しそうなシナリオをいくつか紹介させていただきます。

### ECサイトの商品管理

管理者は原価や仕入れ先を含む全フィールドを閲覧でき、出品者は自分の商品の原価まで見れるが、一般ユーザーには公開情報しか見せたくないというケース。

```ts
import { defineGuard } from "field-guard";

type Ctx = { userId: string; role: "admin" | "seller" | "buyer" };

type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;          // 原価
  supplier: string;      // 仕入れ先
  stock: number;         // 在庫数
  sellerId: string;
};

const productGuard = defineGuard<Ctx>()({
  fields: ["id", "name", "price", "cost", "supplier", "stock", "sellerId"],
  policy: {
    admin: true,                                          // 全フィールド
    ownSeller: { id: true, name: true, price: true, cost: true, stock: true, sellerId: true }, // 仕入れ先以外
    otherSeller: { id: true, name: true, price: true },   // 公開情報のみ
    buyer: { id: true, name: true, price: true },          // 公開情報のみ
  },
}).withCheck<Product>()(({ ctx, target, verdictMap }) => {
  if (ctx.role === "admin") return verdictMap.admin;
  if (ctx.role === "seller") {
    return ctx.userId === target.sellerId
      ? verdictMap.ownSeller
      : verdictMap.otherSeller;
  }
  return verdictMap.buyer;
});

// 使用例
const guard = productGuard.for({ userId: "seller-1", role: "seller" });

const product = {
  id: "p1", name: "ワイヤレスイヤホン", price: 3980,
  cost: 1200, supplier: "Shenzhen Audio Co.", stock: 150, sellerId: "seller-1",
};

const v = guard.check(product);
v.allowedFields; // ["id", "name", "price", "cost", "stock", "sellerId"]
// supplier（仕入れ先）は見えない
```

### SaaSの請求情報

マルチテナントSaaSで、テナントオーナーは請求の全詳細を見れるが、一般メンバーは金額サマリーだけ、外部の監査人にはID情報と金額のみ公開するケース。ブラックリスト方式も活用しています。

```ts
import { defineGuard } from "field-guard";

type Ctx = { userId: string; tenantId: string; role: "owner" | "member" | "auditor" };

type Invoice = {
  id: string;
  tenantId: string;
  amount: number;
  tax: number;
  cardLast4: string;     // カード下4桁
  billingEmail: string;
  internalNote: string;  // 社内メモ
};

const invoiceGuard = defineGuard<Ctx>()({
  fields: ["id", "tenantId", "amount", "tax", "cardLast4", "billingEmail", "internalNote"],
  policy: {
    owner: { internalNote: false },                          // internalNote以外すべて（ブラックリスト）
    member: { id: true, tenantId: true, amount: true, tax: true }, // サマリーのみ
    auditor: { id: true, tenantId: true, amount: true, tax: true }, // 監査用の最小限
    denied: false,                                           // テナント外は全拒否
  },
}).withCheck<Invoice>()(({ ctx, target, verdictMap }) => {
  // テナントが違えば問答無用で拒否
  if (ctx.tenantId !== target.tenantId) return verdictMap.denied;
  return verdictMap[ctx.role];
});

// 使用例：オーナーが自テナントの請求を確認
const guard = invoiceGuard.for({ userId: "u1", tenantId: "t1", role: "owner" });

const invoice = {
  id: "inv-001", tenantId: "t1", amount: 50000, tax: 5000,
  cardLast4: "1234", billingEmail: "billing@company.com", internalNote: "要確認",
};

const v = guard.check(invoice);
v.allowedFields; // ["id", "tenantId", "amount", "tax", "cardLast4", "billingEmail"]
// internalNoteはブラックリストで除外される
```

### SNSのプロフィール

友達には詳しいプロフィールを見せ、非公開アカウントの場合は友達以外にはほぼ何も見せないケース。`withCheck`の中で複合的な条件分岐を行います。

```ts
import { defineGuard } from "field-guard";

type Ctx = { userId: string; friendIds: string[] };

type Profile = {
  id: string;
  displayName: string;
  bio: string;
  birthday: string;
  location: string;
  email: string;
  isPrivate: boolean;
};

const profileGuard = defineGuard<Ctx>()({
  fields: ["id", "displayName", "bio", "birthday", "location", "email", "isPrivate"],
  policy: {
    self: true,
    friend: { id: true, displayName: true, bio: true, birthday: true, location: true, isPrivate: true },
    public: { id: true, displayName: true, bio: true, isPrivate: true },
    restricted: { id: true, displayName: true, isPrivate: true }, // 非公開アカウントの外部向け
  },
}).withCheck<Profile>()(({ ctx, target, verdictMap }) => {
  if (ctx.userId === target.id) return verdictMap.self;
  const isFriend = ctx.friendIds.includes(target.id);
  if (isFriend) return verdictMap.friend;
  // 非公開アカウントなら最小限のみ
  if (target.isPrivate) return verdictMap.restricted;
  return verdictMap.public;
});

// 使用例
const guard = profileGuard.for({ userId: "u1", friendIds: ["u2", "u3"] });

// 友達のプロフィール
const friendVerdict = guard.check({
  id: "u2", displayName: "友達太郎", bio: "こんにちは",
  birthday: "1990-01-01", location: "東京", email: "friend@example.com", isPrivate: false,
});
friendVerdict.allowedFields;
// ["id", "displayName", "bio", "birthday", "location", "isPrivate"]

// 非公開アカウントの他人
const privateVerdict = guard.check({
  id: "u99", displayName: "秘密さん", bio: "非公開です",
  birthday: "2000-12-25", location: "不明", email: "secret@example.com", isPrivate: true,
});
privateVerdict.allowedFields;
// ["id", "displayName", "isPrivate"]
```

### APIレスポンスのフィルタリング

実際のAPIで使う場合、verdictの結果をもとにオブジェクトからフィールドを削ぎ落とす処理が必要になります。ヘルパー関数と組み合わせた実践的なパターンを紹介します。

```ts
import { defineGuard, combineGuards } from "field-guard";

// verdictを使ってオブジェクトをフィルタリングするヘルパー
function filterByVerdict<T extends Record<string, unknown>>(
  obj: T,
  allowedFields: string[],
): Partial<T> {
  const result: Partial<T> = {};
  for (const field of allowedFields) {
    if (field in obj) {
      (result as Record<string, unknown>)[field] = obj[field];
    }
  }
  return result;
}

// --- Guard定義 ---
type Ctx = { userId: string; role: "admin" | "user" };
type User = { id: string; email: string; name: string; salary: number };

const userGuard = defineGuard<Ctx>()({
  fields: ["id", "email", "name", "salary"],
  policy: {
    admin: true,
    self: { salary: false },               // 自分でも給与は見えない
    other: { id: true, name: true },
  },
}).withCheck<User>()(({ ctx, target, verdictMap }) => {
  if (ctx.role === "admin") return verdictMap.admin;
  if (ctx.userId === target.id) return verdictMap.self;
  return verdictMap.other;
});

// --- APIハンドラでの使用例 ---
async function getUser(currentUser: Ctx, targetUserId: string) {
  // DBからユーザーを取得（仮）
  const user: User = {
    id: targetUserId, email: "user@example.com",
    name: "田中太郎", salary: 5000000,
  };

  const guard = userGuard.for(currentUser);
  const verdict = guard.check(user);

  // verdictに基づいてフィルタリングして返す
  return filterByVerdict(user, verdict.allowedFields);
}

// 一般ユーザーが他人を見た場合 => { id: "u2", name: "田中太郎" }
// 一般ユーザーが自分を見た場合 => { id: "u1", email: "user@example.com", name: "田中太郎" }
// 管理者が見た場合           => { id: "u2", email: "user@example.com", name: "田中太郎", salary: 5000000 }
```

配列に対してまとめてフィルタリングしたい場合は、以下のようになります。

```ts
async function listUsers(currentUser: Ctx) {
  const users: User[] = [/* DBから取得 */];
  const guard = userGuard.for(currentUser);

  return users.map((user) => {
    const verdict = guard.check(user);
    return filterByVerdict(user, verdict.allowedFields);
  });
}
```

`for()`でコンテキストを一度だけバインドし、`check()`をループ内で呼び出す設計になっているため、リスト系APIでも効率的に使えます。

https://github.com/mohhh-ok/field-guard
