---
title: "【Strapi】generateされたtsファイルのAttribute.Integerをnumberに変換する"
pubDate: 2023-11-19
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

以前に、strapiでgenerateされた型定義を他ライブラリで使い回す方法を書かせていただきました。

[【Strapi】generated後のd.tsファイルをライブラリに再利用する](http://35.221.87.155/2023/11/19/%e3%80%90strapi%e3%80%91generated%e5%be%8c%e3%81%aed-ts%e3%83%95%e3%82%a1%e3%82%a4%e3%83%ab%e3%82%92%e3%83%a9%e3%82%a4%e3%83%96%e3%83%a9%e3%83%aa%e3%81%ab%e5%86%8d%e5%88%a9%e7%94%a8%e3%81%99%e3%82%8b/)

今回は、それ以降のお話です。

## Attribute.Integerなどはそのまま使えない

generateされた型定義には、以下のような型があります。

```
Attribute.Integer
```

これをそのままnumberとして使えませんので、numberにする必要があります。順を追って書きます。

## numberに変換する

### ひとまず属性を整理する

まずは普通に継承してみます。

```typescript
export type DbBidData = ApiBidBid["attributes"];
```

ところがこれだと、例えばid属性が無かったり、またcreatedAt,updatedAtなどが余分に含まれていたりします。これを間引くために以下のようにします。

```typescript
export type DbBidData = Omit<ApiBidBid["attributes"], 'createdAt'|'updatedAt'|'createdBy'|'updatedBy'> & {
  id? number,
  createdAt?: any,
  updatedAt?: any,
  createdBy?: any,
  updatedBy?: any,
}
```

これで、idがある可能性を含め、またcreatedAtなどは存在しない場合もあるとすることができました。

これでほぼ終わりなのですが、全てのContentTypesに毎回これを書くのは大変ですので、再利用できるようにします。

```typescript

type Transform<T, K extends keyof T = never> = Omit<T, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | K> & {
    id?: number,
    createdAt?: any,
    updatedAt?: any,
    createdBy?: any,
    updatedBy?: any,
};

export type DbBidData = Transform<ApiBidBid["attributes"]>
```

これで再利用できるようになりました。

### Attribute.Integerをnumberに変える

続いてAttribute.Integerをnumberに変換します。以下のように変換用のコードを書きます。

```typescript
type ConvertTypes<T> =
    T extends Attribute.Relation ? Attribute.Relation | number :
    T extends Attribute.Integer ? number :
    T extends Attribute.String ? string :
    T extends Attribute.Float ? number :
    T;

type ConvertProperties<T> = {
    [P in keyof T]: ConvertTypes<T[P]>;
};

```

これを使用して、以下のようにします。

```typescript

type Transform<T, K extends keyof T = never> = Omit<ConvertProperties<T>, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | K> & {
    id?: number,
    createdAt?: any,
    updatedAt?: any,
    createdBy?: any,
    updatedBy?: any,
};

export type DbBidData = Transform<ApiBidBid["attributes"]>
```

これで、汎用的に使えるtypeになりました。Strapiが自動でここまでやってくれると有難いのですが、このような使い方はマイナーなのでしょうか。

### いっそ全てをオプショナルにする

データ一部更新時には、全てのフィールドを埋める必要はありません。そのような用途を考慮すると、以下のようにすべてをオプショナルにしてしまうてもあります。

```typescript
type ConvertProperties<T> = {
    [P in keyof T]?: ConvertTypes<T[P]>;
};
```

## 小話

作業中はずっと音楽を聴いているのですが、今でだいたい30時間分くらいのプレイリストになっています。もっと増やしたいのですが、いい音楽どこかに転がってないですかね。
