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

今回は「京都」関連を題材に、**短文（ベイト）と長文（本命）を意図的に混ぜたデータ**を用意しました。長文は「京都の○○」という想定のタイトルに対し、本文は和菓子製法・職人論・土木のような専門語彙で占めています。狙いは、`京都`で検索したときに本命の長文より「京都」を含まない短文が勝ってしまう希釈効果を観察することです。

```typescript
import 'dotenv/config';
import { db } from './db';
import { postsTable } from "./db/schema";
import { embed } from './openai';

const SHORT_TEXTS = [
  '京都が好きだ',
  '京都に旅行に行きたい',
  '大阪の下町を散歩した',
  '抹茶アイスを食べた',
  '職人の手仕事に憧れる',
];

const LONG_TEXTS = [
  // 本来: 京都の和菓子文化
  `練り切りは白餡に求肥を加え木べらで季節の花を象る。寒梅粉や道明寺粉は吸水と粘りで使い分け、羊羹は寒天と砂糖の配合で口溶けが決まる。京都の店ではこの伝統が受け継がれている。`,
  // 本来: 京都の伝統工芸職人の哲学
  `若い職人は数年を道具の手入れと素材の見極めに費やす。徒弟制度では親方の技を盗むことが求められ、暗黙知の蓄積が厚みを生む。後継者不足は伝統工芸共通の課題だ。京都の工房もこの中で模索を続けている。`,
  // 本来: 京都の地下鉄延伸計画
  `地下鉄延伸の採算性評価は需要予測と建設費の精度に左右される。シールド工法は地盤でセグメント設計が変わり、駅部の開削は交通規制が必要だ。京都市の構想もこの枠組みで検討されている。`,
];

const TEST_DATA = [...SHORT_TEXTS, ...LONG_TEXTS];

async function insert() {
  for (const testData of TEST_DATA) {
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

cosine / L1 / L2 の3つの距離を同時に並べて、挙動を比較できるようにします。drizzle-ormは `cosineDistance` / `l1Distance` / `l2Distance` をそのまま提供してくれます。

```typescript
import 'dotenv/config';
import { db } from './db';
import { postsTable } from "./db/schema";
import { embed } from './openai';
import { cosineDistance, l1Distance, l2Distance } from 'drizzle-orm';

async function main() {
  const query = process.argv[2];
  if (!query) throw new Error('no query');
  const embedding = await embed(query);

  const rows = await db
    .select({
      content: postsTable.content,
      cosine: cosineDistance(postsTable.embedding, embedding),
      l1: l1Distance(postsTable.embedding, embedding),
      l2: l2Distance(postsTable.embedding, embedding),
    })
    .from(postsTable);

  const byCosine = [...rows].sort((a, b) => a.cosine - b.cosine);
  const byL1 = [...rows].sort((a, b) => a.l1 - b.l1);
  const byL2 = [...rows].sort((a, b) => a.l2 - b.l2);

  console.log(`query: ${query}\n`);
  console.log('=== Cosine ranking ===');
  byCosine.forEach((r, i) => console.log(`[${i + 1}] cosine=${r.cosine.toFixed(4)} chars=${r.content.length}\n${r.content}\n`));
  console.log('=== L1 ranking ===');
  byL1.forEach((r, i) => console.log(`[${i + 1}] L1=${r.l1.toFixed(2)} chars=${r.content.length}\n${r.content}\n`));
  console.log('=== L2 ranking ===');
  byL2.forEach((r, i) => console.log(`[${i + 1}] L2=${r.l2.toFixed(4)} chars=${r.content.length}\n${r.content}\n`));
}

main();
```

> 再現コード一式は [`blog-examples/2025/04-24-pgvector-drizzle`](https://github.com/mohhh-ok/blog-examples/tree/main/2025/04-24-pgvector-drizzle) に置いています。検証時はOpenAI APIではなくOllama (`bge-m3`, 1024次元) を使用しているので、絶対値は本記事のコード例（OpenAI `text-embedding-3-small`, 1536次元）と一致しません。傾向の観察用としてお読みください。

### 結果: `京都`で検索

```text
$ bun run search 京都

=== Cosine ranking ===
[1] cosine=0.2490 chars=6
京都が好きだ

[2] cosine=0.2615 chars=10
京都に旅行に行きたい

[3] cosine=0.4706 chars=10
大阪の下町を散歩した

[4] cosine=0.5496 chars=88
地下鉄延伸の採算性評価は…京都市の構想もこの枠組みで検討されている。

[5] cosine=0.5760 chars=85
練り切りは白餡に求肥を加え…京都の店ではこの伝統が受け継がれている。

[6] cosine=0.5794 chars=96
若い職人は数年を道具の手入れと素材の見極めに費やす。…京都の工房もこの中で模索を続けている。

[7] cosine=0.6259 chars=9
抹茶アイスを食べた

[8] cosine=0.6410 chars=10
職人の手仕事に憧れる
```

L1・L2でも順位はほぼ同じで、上位2件の「京都」短文の後に「大阪の下町を散歩した」が割り込み、本来本命であるはずの「京都の○○」を扱う3つの長文を**押しのけて3位**に入っています。

### 結果: `Kyoto`で検索

```text
$ bun run search Kyoto

=== Cosine ranking ===
[1] cosine=0.4245  京都に旅行に行きたい
[2] cosine=0.4327  京都が好きだ
[3] cosine=0.5507  大阪の下町を散歩した
[4] cosine=0.6001  抹茶アイスを食べた
[5] cosine=0.6387  （京都市の構想…長文）
[6] cosine=0.6596  （京都の工房…長文）
[7] cosine=0.6668  （京都の店…長文）
[8] cosine=0.6857  職人の手仕事に憧れる
```

日本語クエリと同じ傾向で、英語で投げても「京都」を含む短文が上位に来ます。bge-m3が多言語対応なおかげで、言語を跨いだ意味マッチがそれなりに効いています。

### 考察

- **短文 vs 長文の希釈効果**: 「京都の○○」という長文が、`京都`単体のクエリでは3〜6位に沈みました。長文では他の語彙（和菓子製法・職人論・土木）が埋め込みベクトルを引っ張り、「京都」の貢献が薄まる現象が見えます。検索用途で長文を投入するときは、本文をそのままembeddingするのではなく、要約・タイトル・タグなどに分けてベクトル化する設計が有効そうです。
- **「京都」検索で「大阪」が「京都の○○」長文に勝つ**: `京都`で検索しているのに、`京都`を一切含まない「大阪の下町を散歩した」が、「京都の○○」長文3つ全てより上位に来ます。文の短さと地理ドメインの近さで距離が縮まる結果です。「クエリと同じ単語を含むこと」と「埋め込み空間で近いこと」は別物で、キーワード検索の感覚で結果を期待すると裏切られます。実運用では、ハイブリッド検索（BM25等のキーワードスコアとベクトルスコアを併用）を組むのが現実解になりそうです。（ただし他言語だと形態素解析なども必要になってきます）
- **距離指標による順位差**: 今回のデータでは cosine / L1 / L2 で順位がほぼ一致しました。実用上はcosineで十分そうで、HNSWのオペレータクラス選択（`vector_cosine_ops`）もこの観察を裏付けます。

## 文字数が少なすぎる場合の問題

Embeddingする際に用いる文字列が、短すぎるとうまくマッチしないことがあります。たとえば「海」「湖」などの言葉だけで検索しようとすると、ヒットしません。Embeddingモデルにもよるかと思いますが、そうした場合下記のようにして解決する場合があります。

```
const query = '海';
const fixedQuery = `${query}.`;
```

上記では、単純に「.」（ピリオド）を追加しています。すべてのケースで有効かどうかは定かではありませんが、これをするだけで、ベクトルがマッチすることもあるようです。

## ef\_search

HNSWの探索時に「動的候補リスト」をどれくらい広く持つかを決めるパラメータです。大きくするほどrecallが上がる代わりに遅くなる、典型的な精度vs速度のトレードオフのつまみです。

### 結論: ほとんどのケースで触らなくていい

最初に身も蓋もない話を書いておきます。**実用上、ef\_searchを触る必要が出るケースは限られます**。

- **データが小さい場合（数千行以下）**: HNSWのグラフが浅いので、デフォルト（40）でも実質ほぼ全件近く見ています。上げても下げても結果は変わりません。今回のような8行のサンプルでは完全に無意味です。
- **`LIMIT`より小さい値を指定しても効かない**: pgvectorは内部で `max(ef_search, limit)` に底上げするので、`LIMIT 100`に対して`ef_search=40`を設定しても効果がありません。
- **そもそも速度がボトルネックでない**: 1クエリ数ms〜数十msで困っていないなら、下げる旨味もありません。

「触るべき時」が来るのは、**(1) データが数十万行以上にスケールし、かつ (2) recall@kを実測して取りこぼしが見えた時**だけです。それ以外はデフォルトのまま放置で問題ありません。

### 確認・設定方法

念のため操作方法も載せておきます。現在の設定は以下で確認できます。

```typescript
const currentEfSearch = await db().execute(sql`SELECT current_setting('hnsw.ef_search');`)
console.log(currentEfSearch.rows)
```

クエリ単位で変えたい場合はtransaction内で `SET LOCAL` します。

```typescript
await db().transaction(async (tx) => {
  await tx.execute(sql.raw(`SET LOCAL hnsw.ef_search = 120`))

  return tx.query...
})
```

調整するなら80〜200あたりから試すのが定石ですが、上げすぎると線形探索に近づきHNSWの旨味が消えます。recall評価セットを作って実測しながら詰めるのが正攻法です。
