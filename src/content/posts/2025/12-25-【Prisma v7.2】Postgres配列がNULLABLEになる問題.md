---
title: 【Prisma v7.2】Postgres配列がNULLABLEになる問題
pubDate: 2025-12-25
categories: ["Prisma"]
---

こんにちは、フリーランスエンジニアのmohです。

## 前提

Prisma: v7.2

## Prismaの配列

Prismaでは配列を以下のように定義できます。

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE")
}

model X {
	id          Int     	 @id @default(autoincrement())
	something	String[]
	another		String
}
```

これは一見、somethingはNOT NULLに見えます。しかし実際にはNULLABLEとして作成されます。

```sql
-- CreateTable
CREATE TABLE "X" (
    "id" SERIAL NOT NULL,
    "something" TEXT[],
    "another" TEXT NOT NULL,

    CONSTRAINT "X_pkey" PRIMARY KEY ("id")
);
```

このため、下記のようなコードが成立し、結果としてエラーになる可能性があります。

```ts
const data = await prisma.x.findFirst();
console.log(data?.something.length); // TypeError: Cannot read properties of null (reading 'length')
```

この事象はすでにissueとして挙げられていますが、2025年12月25日時点でまだ解決されていません。

https://github.com/prisma/prisma/issues/26425

## 対応

現在、根本的な対応手段はなさそうです。データ取得時に変換するヘルパーを作るくらいでしょうか。せめて型定義をオプショナルとして生成してくれれば助かるのですが、それも未対応です。下記のissueから分かるように、2020年からこの問題は認知されていますが、解決していません。

https://github.com/prisma/prisma/issues/4729

Prismaは楽に使える反面、細かいカスタマイズができません。新規プロジェクトならDrizzleなどを使うのも手かと思います。DrizzleはPrismaほどマジカルではありませんが、型定義がかなり自由かつ強力で、最近のトレンドであるベクトルデータもサポートされているのでおすすめです。
