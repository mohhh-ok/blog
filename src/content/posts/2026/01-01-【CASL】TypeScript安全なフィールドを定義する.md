---
title: 【CASL】TypeScriptで型安全なフィールドを定義する
pubDate: 2026-01-01
updatedDate: 2026-01-17
categories: ["TypeScript"]
---

こんにちは、フリーランスエンジニアのmohです。

## CASLとは

CASLは、JavaScriptアプリケーションで権限管理（Authorization）を実装するための強力なライブラリです。細かい粒度での権限制御が可能で、特定のアクションに対する権限をユーザーごとに柔軟に設定できます。

https://casl.js.org

## フィールド定義

CASLには、対象データを渡して権限判定を行う機能があります。例えば「自分が作成した投稿のみ編集可能」といった条件付き権限を実装できるのですが、これを**型安全**にする方法が公式ドキュメントでは明確ではありませんでした。

Prismaと連携したサンプルは存在するものの、独自のフィールド定義で型安全性を確保する例が見当たらず、試行錯誤することになりました。同じ課題に直面している方のお役に立てればと思い、実装方法を共有します。

## 型安全な実装方法

独自フィールドで型安全にするには、`ForcedSubject`型を使用します。これにより、権限チェック時のフィールド名の誤りや型の不一致をコンパイル時に検出できます。

```typescript
import { 
  AbilityBuilder, 
  createMongoAbility, 
  type ForcedSubject, 
  type MongoAbility, 
  subject 
} from "@casl/ability";

// ユーザー定義
export type UserRole = "user" | "admin";
type User = { 
  id: string; 
  roles: UserRole[] 
};

// アクション定義
export const ACTIONS = ["create", "read", "update", "delete", "manage"] as const;
export type Action = (typeof ACTIONS)[number];

// サブジェクト定義
export const SUBJECT_NAMES = ["post", "comment", "all"] as const;
export type SubjectName = (typeof SUBJECT_NAMES)[number];

// フィールド定義（重要：ForcedSubjectを使用）
export type PostSubject = {
  authorId: string;
  approved: boolean;
} & ForcedSubject<"post">;

export type CommentSubject = {
  authorId: string;
  content: string;
} & ForcedSubject<"comment">;

export type AppSubjects = PostSubject | CommentSubject | SubjectName;
export type AppAbility = MongoAbility<[Action, AppSubjects]>;

// アビリティ定義関数
export function defineAbilityFor(user: User | undefined) {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // 全ユーザー共通の権限
  can("read", "post", { approved: true }); // 承認済み投稿は誰でも閲覧可能
  can("read", "comment"); // コメントは誰でも閲覧可能

  if (user) {
    // ログイン済みユーザーの権限
    can("create", ["post", "comment"]); // 投稿とコメントを作成可能
    can("manage", "post", { authorId: user.id }); // 自分の投稿は全操作可能

    // 管理者の権限
    if (user.roles.includes("admin")) {
      can("manage", "all"); // すべてのリソースを管理可能
    }
  }

  return build();
}

// 使用例
const notLoggedIn = defineAbilityFor(undefined);
const normalUser = defineAbilityFor({ id: "1", roles: ["user"] });
const adminUser = defineAbilityFor({ id: "2", roles: ["admin"] });

// 権限チェックの実行
[notLoggedIn, normalUser, adminUser].forEach((ability, index) => {
  const result = ability.can(
    "read",
    subject("post", {
      authorId: "1",
      approved: false, // 未承認の投稿
    })
  );
  
  const userType = ["未ログイン", "一般ユーザー", "管理者"][index];
  console.log(`${userType}: ${result}`);
});

// 出力: 
// 未ログイン: false（未承認投稿は閲覧不可）
// 一般ユーザー: true（自分の投稿は未承認でも閲覧可能）
// 管理者: true（すべての投稿を閲覧可能）
```

## ポイント解説

### 1. `ForcedSubject`の役割

`ForcedSubject<"post">`を使うことで、サブジェクト型に明示的な識別子を付与します。これにより以下が実現できます：

- 権限定義時のフィールド名の型チェック
- `subject()`関数使用時の型推論
- 存在しないフィールドへのアクセスをコンパイルエラーで防止

### 2. 型安全性の恩恵

この実装により、以下のようなミスをコンパイル時に検出できます：

```typescript
// ❌ 存在しないフィールドを指定するとエラー
can("read", "post", { nonExistentField: true }); 

// ❌ 型が合わないとエラー
can("read", "post", { approved: "yes" }); // booleanが必要

// ❌ 存在しないアクションを指定するとエラー
ability.can("execute", "post");
```

### 3. 条件付き権限

`can()`の第3引数にオブジェクトを渡すことで、フィールド値に基づく条件付き権限を定義できます。こちらも型安全です：

```typescript
// 自分が作成した投稿のみ編集可能
can("update", "post", { authorId: user.id });

// 承認済みの投稿のみ閲覧可能
can("read", "post", { approved: true });
```

## subjectも実装する

CASLはsubjectユーティリティがあります。これも書き換えます

```ts
import { subject as caslSubject } from "@casl/ability";
import type {
  PostSubject,
  CommentSubject,
} from "./types";

type SubjectMap = {
  "post": PostSubject;
  "comment": CommentSubject;
};

export function subject<T extends keyof SubjectMap>(
  type: T,
  data: Omit<SubjectMap[T], "__caslSubjectType__">,
): SubjectMap[T] {
  return caslSubject(type, data) as unknown as SubjectMap[T];
}

// 使用例
const postInstance = subject("post", {
  authorId: "1",
  approved: true,
});

const commentInstance = subject("comment", {
  authorId: "2",
  content: "素晴らしい記事です",
});
```

## まとめ

`ForcedSubject`を活用することで、CASLの強力な権限管理機能をTypeScriptの型安全性を保ちながら利用できます。これにより、開発時のミスを減らし、保守性の高いコードを実現できます。

同様の課題に直面している方の参考になれば幸いです。
