---
title: "【GAS】Gmail APIで取得したメッセージをパースする"
pubDate: 2025-01-19
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Gmail APIのメッセージ

Gmail APIで取得したメッセージは、以下のようになっています。

```typescript
interface Message {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: MessagePart;
  sizeEstimate: number;
  raw: string;
}
```

おや？本文はどこでしょう。添付ファイルはどれやねん。

Gmail APIで取得したデータは、複雑です。ChatGPTに聞きながら、ようやくある程度理解はしました。とにかく入れ子になったpartを再帰処理して、mimeTypeで判別分岐すればいいようです。ヘッダーも見る必要があります。添付ファイルかどうかも、チェックしないといけません。えーい、面倒だ

## パースする

はい、ありました。

[https://www.npmjs.com/package/gmail-api-parse-message-ts](https://www.npmjs.com/package/gmail-api-parse-message-ts)

これを使えば、以下のようにパースできます。

```typescript
const parser = new ParseGmailApi();
const parsedMessage = parser.parseMessage(message);

// パース結果は以下の形式
interface IEmail {
    id: string;
    threadId: string;
    snippet: string;
    historyId: string;
    internalDate: number;
    sentDate: number;
    from: IReceiver;         // { name:'Amzn Svc', email:'web@amz.com' }  
    to: IReceiver[];         // [ { name:'Lars K', email:'lk@ema.dk' } ]
    cc: IReceiver[];         //  --||--
    bcc: IReceiver[];        //  --||--
    subject: string;         //  "subject": "The AWS Summit Stockholm is back! Register and join us on May 22, 2019",
    textHtml: string,
    textPlain: string,
    attachments: IAttachment[],
    inline?: IAttachment[],
    size: number;
    labelIds: string[],
    labels?: IGapiLabel[],  // parsed.labelIds of IGapiLabel[] // you need your own implementation
    headers: Map<string, string>,
    isUnread: boolean;
    isDownloaded: boolean;
}
```

おぉ、神々しい。

## GAS用のライブラリ

APIでの取得込みのライブラリを、以下で公開しています。

[https://www.npmjs.com/package/@masa-dev/gas-gmail-client](https://www.npmjs.com/package/@masa-dev/gas-gmail-client)
