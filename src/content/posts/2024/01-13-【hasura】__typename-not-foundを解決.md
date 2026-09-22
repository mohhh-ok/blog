---
title: "【Hasura】__typename not foundを解決"
pubDate: 2024-01-13
categories: ["Database"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## \_\_typename not found

\_\_typename not foundは、HasuraというよりApollo Clientの話なのですが、個人的に今Hasuraが熱いので、Hasuraをタイトルに入れさせていただきました。おそらくこうした方が、Hasura信者のみなさまに見つけてもらいやすくなると思ってのことです。はい。

Apollo Clientでは、キャッシュ機能の中で\_\_typenameを使用しています。具体的には、idと\_\_typenameでキーを作成して、キャッシュを制御しています。そのため\_\_typenameは必要なのですが、オプションで無効にすることもできます。ただし、無効にするのは推奨されていません。

この\_\_typenameが含まれるデータを取得し、それを加工してGraphQLサーバーに投げたりすると、\_\_typenameというフィールドが存在しないと言われ弾かれます。こうした問題を、たとえば以下の方法で解決できます。

## 取得側で調整する

Apollo Clientの設定で無効にすることがはばかれる場合、他の手段で対応することになります。以下は単純に、\_\_typenameフィールドを再帰的に消してしまうという力技です。

```typescript
export function removeTypenames(data: any): any {
    if (Array.isArray(data)) {
        return data.map((d) => removeTypenames(d));
    }

    if (!(data instanceof Object)) {
        return data;
    }

    return Object.entries(data).reduce((acc, [key, value]) => {
        if (key === '__typename') {
            return acc;
        }
        acc[key] = removeTypenames(value);
        return acc;
    }, {} as any);
}
```

データ取得時にこれをかますことで、問題は解決するはずです。

## 小話

こうした面倒なロジックは、一昔前なら頭をフル回転させて大変な思いをするものですが、今はChatGPTがあるので比較的楽に作れます。さすがにChatGPTだけではちゃんとしたコードは生成できませんが。少なくとも一人で考え込まず、対話形式で考えを整理できるので、気分的にだいぶ楽ですね。
