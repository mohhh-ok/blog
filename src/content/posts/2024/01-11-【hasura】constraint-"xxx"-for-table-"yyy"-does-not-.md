---
title: "【Hasura】constraint \"xxx\" for table \"yyy\" does not exist"
pubDate: 2024-01-11
categories: ["Database"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## HasuraでUpsertしたい

今回やりたいことは以下のようなupsertです。

```graphql
mutation upsertLotImagesLink($objects: [LotImage_insert_input!]!) {
    insert_LotImage(
        objects: $objects
        on_conflict: {
            constraint: LotImage_lotId_imageId_key
            update_columns: [order]
        }
    ) {
        affected_rows
    }
}
```

insertに失敗した場合、constraintに指定した条件に合致すれば、updateするという単純な話です。

ですが以下のエラーが出ます。

```
constraint "LotImage_lotId_imageId_key" for table "LotImage" does not exist
```

今回はこの原因と、考察です。

## constraintが作成されていない

今回Prismaスキーマを使用してPostgresをmigrateしています。スキーマは以下のようなものです。

```
model LotImage {
    ...
    lotId   Int
    imageId Int
    @@unique([lotId, imageId])
}
```

これでPostgresに作成されるのは、以下のインデックスのみです。

```
LotImage_lotId_imageId_key UNIQUE BTREE on("lotId", "imageId")
```

## githubのissue

githubに今回の事象についてのissueが建てられていました。

https://github.com/hasura/graphql-engine/issues/3981

これによると、ユニークインデックスのみではだめで、constraintを作成しないといけないとのことです。それにも関わらずHasura生成のスキーマによるコード補完では問題として扱われないため、実際に動かした時に引っかかるというのが問題のようです。当然、ユニークインデックスをconstraintsとして扱ってくれないのは不便でもありますが。。。

## 解決策

prisma側でどうにかできないか調べてみました。同様の事象で困っている方がおられるようで、以下で要望が出ています。

https://github.com/prisma/prisma/issues/17096

これで将来的には、prisma側で解決できそうです。ただそれまでは、手動で改めてconstraint作成しないといけないようです。

**2024/01/12追記**: 以下のようにあとから手動でデータベースをいじると、prismaのmigrateが使えなくなります。そのため、prismaが対応するまでは、graphql以外のrestなどで作成した方がいいかもしれません。あるいは、複合主キーを用いれば、prismaでもconstraintが作成されますので、それも選択肢の一つです。

Hasuraで、以下のように新しくconstraintを作成すると、うまくいきました。

```sql
ALTER TABLE "LotImage" ADD CONSTRAINT "LotImage_lotId_imageId_constraint" UNIQUE ("lotId", "imageId" );
```

今後こういったSQL文を複数書いて.txtファイルにでも置いておけば、prismaでmigrateしたあとに実行すればいいですね。あるいはそこも自動化するかですが。ひとまず手動でやっていこうと思います。

## 小話

趣味で作曲をしているのですが、新曲の歌詞がなかなか出来上がりません。それなのに時々思い出したようにメロディーだけ歌ったりするものなので、メロディーの改善だけはされていくという。。。
