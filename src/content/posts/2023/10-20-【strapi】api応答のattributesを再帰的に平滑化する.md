---
title: "【Strapi】API応答のattributesを再帰的に平滑化する"
pubDate: 2023-10-20
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

strapiは管理画面でデータタイプを作成すれば、自動でAPIを作成してくれるなど便利な機能があります。

ですがそのAPIの送信と取得にちょっと難があったので、それを吸収する関数を作りました。

## attributesが送信時と受信時とで入ったり入らなかったりする

表題の通りなのですが、送信時は特にattributes属性を入れなくていいものの、受信時にはattributesが入って返ってきます。以下のような感じです。

```typescript
{
    id: number,
    attributes: []
}
```

これが送信時も受信時も同様にattributesを入れる仕様ならまだいいのですがそうではないので、型定義が余分に増えてしまい複雑になってしまいます。1, 2階層程度ならまだしも、ネストするほどに複雑になるので以下の関数を作りました。

## attributesを再帰的に平滑化する関数

作ったといっても、ほとんどGPT4先生にあれこれお願いして出来上がったものです。自分の頭だけで作るのはさすがにしんどそうな代物となっています。

```typescript
type FlattenAttributesObject = { [key: string]: any };


/**
 * attributes属性をフラットにする
 */
function flattenAttributes(obj: FlattenAttributesObject | any[], result: FlattenAttributesObject = {}): FlattenAttributesObject | any[] {
    if (Array.isArray(obj)) {
        return obj.map(item => {
            if (typeof item === 'object' && item !== null) {
                return flattenAttributes(item);
            }
            return item;
        });
    }

    const newObj: FlattenAttributesObject = { ...result };
    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            newObj[key] = value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return flattenAttributes(item);
                }
                return item;
            });
        } else if (key === 'attributes') {
            Object.assign(newObj, flattenAttributes(value));
        } else if (typeof value === 'object' && value !== null) {
            newObj[key] = flattenAttributes(value);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}
```

ではでは。
