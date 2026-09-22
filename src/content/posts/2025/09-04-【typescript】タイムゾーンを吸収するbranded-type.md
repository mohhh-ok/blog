---
title: "【TypeScript】タイムゾーンを吸収するbranded type"
pubDate: 2025-09-04
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## タイムゾーン問題

DBによってはタイムゾーンを保存することがデフォルトではできません。例えば、PostgreSQLではタイムゾーンを一緒にフィールドに含めることができますが、MySQLなどは含めることができないため、面倒なことになります。

DBでUTCで保存してフロントではJSTで扱いたいということがあります。たとえばLaravelだと内部タイムゾーンはUTCが推奨されています。その関係から、やはりUTCで扱ってフロントではJSTとなります。

そうした場合、一般的にはフロントで解決するのが定石のようです ( ChatGPT談 )

## TypeScriptで専用の型を作る

以下のようにして、専用の型を作ると、煩わしさから少しでも解放されます。Branded Typeを用いて、クライアントで扱う型を切り分けています。なお簡略化のためそのままDayjsに変換しています。

```typescript
import dayjs, { Dayjs } from 'dayjs';

// types
declare const clientDayjsSymbol: unique symbol;

export type ClientDayjs = Dayjs & { readonly [clientDayjsSymbol]: true }


// utils
export function apiToClientDayjs(d: string | null | undefined): ClientDayjs | null {
  if (!d) return null;
  return dayjs(d)
    .add(9, 'hour') as ClientDayjs;
}

export function clientToApiDatetime(d: ClientDayjs | null | undefined): string | null {
  if (!d) return null;
  return d
    .subtract(9, 'hour')
    .format('YYYY-MM-DD HH:mm:ss') as string;
}


// test
function test() {
  // apiからの値。文字列
  const apiValues: (string | null)[] = [
    '2025-01-01',
    '2025-01-01 21:00:00',
    null,
  ]
  for (const apiValue of apiValues) {

    // client用に変換
    const clientDayjs = apiToClientDayjs(apiValue);

    // ここで色々処理する
    // ...

    // api用に変換
    const apiDatetime = clientToApiDatetime(clientDayjs);

    // ここでapiに投げる
    // ...

    // 結果
    console.log({
      apiValue,
      clientDate: clientDayjs?.format('YYYY-MM-DD HH:mm:ss'),
      apiDatetime
    });
    // {
    //   apiValue: '2025-01-01',
    //   clientDate: '2025-01-01 09:00:00',
    //   apiDatetime: '2025-01-01 00:00:00'
    // }
    // {
    //   apiValue: '2025-01-01 21:00:00',
    //   clientDate: '2025-01-02 06:00:00',
    //   apiDatetime: '2025-01-01 21:00:00'
    // }
    // {
    //   apiValue: null,
    //   clientDate: undefined,
    //   apiDatetime: null
    // }
  }

}

test();
```

## その他の方法

mySQLはフィールドにタイムゾーンを含むことがネイティブではできませんが、INTは入れれます。そのためUNIX TIMESTAMPをつかってmsで保持するのも楽です。これなら変換作業も要りません。
