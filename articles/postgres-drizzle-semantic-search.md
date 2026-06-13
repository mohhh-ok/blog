---
title: "Postgres + Drizzle + Embeddingで意味検索する"
emoji: "🔍"
type: "tech"
topics: ["postgresql", "drizzle", "openai", "rag", "embedding"]
published: true
---

RAGの基盤となる意味検索（ベクトル検索）を、Postgres + pgvector + Drizzle + OpenAI Embeddingで実装した知見をまとめます。

## 構成

今回、下記を使用します。

*   Postgres
*   Drizzle
*   Open AI API

初めはPrismaで頑張っていたのですが、自由度が低く厳しそうでしたので、Drizzleに乗り換えた次第です。Drizzleならインデックス含めサクッとできました。感激。

![Postgres + Drizzle + Embedding 意味検索の構成](https://raw.githubusercontent.com/mohhh-ok/blog/main/src/content/posts/2025/04-24-postgres-drizzle-semantic-search.svg)

## Embedding

Embeddingは、最近流行りのAI技術です。文章をベクトル化し、意味合いのマッチ具合を判定できるようになります。今回はOpenAI APIの、text-embedding-3-smallを使用します。

## 比較計算

意味合いのマッチ具合は、ベクトルの関連性計算によって行われます。計算手法には下記のようなものがあります。

*   コサイン: 角度による比較
*   ユークリッド: 単純な距離の比較
*   マンハッタン: 各次元の差の絶対値の合計の比較

### コサイン比較 ⚪︎

テキストベクトルの比較には、コサインによる計算が最も一般的だそうです。値の範囲も限定されており、使い勝手も抜群です。今回はこちらを使用します。

### ユークリッド距離 ×

ユークリッド距離による比較は、単純なベクトル距離を用います。文章全体の印象が反映されますが、外れ値が多く、ユーザーにとって意外な結果が返ってきたりするようです。使用するのは特定のケースに限られそうです。

### マンハッタン距離 △

コサインのような曖昧な検索ではなく、より明瞭な検索結果が欲しい場合は、マンハッタン距離による比較も選択肢に入ってくるかと思います。ユークリッド距離よりは、ユーザーも納得の結果が返ってきそうです。しかし値の範囲が限定されていないため、閾値の計算にコストがかかります。またpgvectorインデックスは2025年5月10日時点で、HNSWはマンハッタン距離（L1, `vector_l1_ops`）に対応していますが、IVFFlatでは未対応です。今回はコサイン類似度で進めるためパスします。

![ベクトル距離の計算手法と採用判断](https://raw.githubusercontent.com/mohhh-ok/blog/main/src/content/posts/2025/04-24-distance-metrics-comparison.svg?v=2)

## 実装とテスト

### 準備

環境変数を設定します。

```bash
DATABASE_URL="postgresql://postgres:@localhost:5432/mydb"
OPENAI_API_KEY="sk-proj-xxx"
```

定数を定義します。

```typescript
export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_MODEL = "text-embedding-3-small";
```

スキーマを作ります。HNSWインデックス、cosineを使用しています。

```typescript
import { index, integer, pgTable, varchar, vector } from "drizzle-orm/pg-core";
import { EMBEDDING_DIMENSIONS } from '../constants';

export const postsTable = pgTable(
  "posts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    content: varchar({ length: 255 }).notNull(),
    embedding: vector({ dimensions: EMBEDDING_DIMENSIONS }).notNull(),
  },
  (table) => [
    index('embedding_hnsw_index').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ]
);
```

dbをどこでも使用できるようにします。

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);
```

APIをラップします。

```typescript
import OpenAI from "openai";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./constants";

const client = new OpenAI();

export async function embed(content: string) {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: content,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}
```

### データを入れる

今回下記のようなデータを使用しました。

```typescript
import 'dotenv/config';
import { db } from './db';
import { postsTable } from "./db/schema";
import { embed } from './openai';

const TEST_DATA = [
  'みかんを食べている男の人',
  'レストランで食事する家族連れ',
  'ギターを担いだ男二人がバーで飲んでいる',
  '猫をなでる子供',
  '散歩をするおじいさん',
]

async function insert() {
  for (const testData of TEST_DATA) {
    console.log(`Inserting ${testData}`);
    const embedding = await embed(testData);
    await db.insert(postsTable).values({
      content: testData,
      embedding,
    });
  }
}

insert();
```

### 検索する

下記のような検索コードを作りました。

```typescript
import 'dotenv/config';
import { db } from './db';
import { postsTable } from "./db/schema";
import { embed } from './openai';
import { sql, cosineDistance } from 'drizzle-orm';


async function main() {
  const query = process.argv[2];
  if (!query) throw new Error('no query');
  const embedding = await embed(query);
  const result = await db
    .select({
      content: postsTable.content,
      distance: cosineDistance(postsTable.embedding, embedding)
    })
    .from(postsTable)
    .orderBy(cosineDistance(postsTable.embedding, embedding));
  console.log(result);
}

main();
```

実際に検索してみます。

```typescript
tsx src/main.ts 音楽    

[
  { content: 'ギターを担いだ男二人がバーで飲んでいる', distance: 0.6905424367734843 },
  { content: 'みかんを食べている男の人', distance: 0.7711687249641749 },
  { content: 'レストランで食事する家族連れ', distance: 0.8035564848319032 },
  { content: '散歩をするおじいさん', distance: 0.8601853937186783 },
  { content: '猫をなでる子供', distance: 0.863712573629618 }
]
```

```typescript
tsx src/main.ts お年寄り

[
  { content: '散歩をするおじいさん', distance: 0.6252080873274957 },
  { content: '猫をなでる子供', distance: 0.7478481741193026 },
  { content: 'レストランで食事する家族連れ', distance: 0.7724779558841293 },
  { content: 'みかんを食べている男の人', distance: 0.7884846037445112 },
  { content: 'ギターを担いだ男二人がバーで飲んでいる', distance: 0.8039060772629403 }
]
```

```typescript
tsx src/main.ts cat 

[
  { content: '猫をなでる子供', distance: 0.5634503482552038 },
  { content: 'みかんを食べている男の人', distance: 0.7431684418126188 },
  { content: '散歩をするおじいさん', distance: 0.7994899092432515 },
  { content: 'ギターを担いだ男二人がバーで飲んでいる', distance: 0.8381289147215432 },
  { content: 'レストランで食事する家族連れ', distance: 0.8834894558445278 }
]
```

うまい具合に、存在しない検索語句でもちゃんとdistanceが反映されています。言語が違っていても、大丈夫そうです。distanceの閾値は、今回のケースだと0.7あたりが良さそうですね。

ただお年寄りを検索しているのに、子供が割と上位に来ています。猫は年寄りといったイメージがあるのでしょうか。あるいはモデルに、shortを使用しているからかもしれません。この辺りは、速度・費用・精度のトレードオフですね。

## 文字数が少なすぎる場合の問題

Embeddingする際に用いる文字列が、短すぎるとうまくマッチしないことがあります。たとえば「海」「湖」などの言葉だけで検索しようとすると、ヒットしません。Embeddingモデルにもよるかと思いますが、そうした場合下記のようにして解決する場合があります。

```
const query = '海';
const fixedQuery = `${query}.`;
```

上記では、単純に「.」（ピリオド）を追加しています。すべてのケースで有効かどうかは定かではありませんが、これをするだけで、ベクトルがマッチすることもあるようです。

## ef\_search

あまりわかってなく恐縮ですが、近似値の幅を広げるのがef\_searchのようです。現在の設定は以下のようにして確認できます。

```typescript
const currentEfSearch = await db().execute(sql`SELECT current_setting('hnsw.ef_search');`)
console.log(currentEfSearch.rows)
```

デフォルトは40で、これを上げると近似で拾う範囲が広がるといったことのようです。ただし負荷が増えるため、そのトレードオフです。

クエリごとに設定するには、transactionを使用します。

```typescript
await db().transaction(async (tx) => {
  await tx.execute(sql.raw(`SET LOCAL hnsw.ef_search = 120`))

  return tx.query...
})
```

これで、ef\_searchが120で動作します。
