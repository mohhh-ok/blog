---
title: "【NestJS】TwilioModuleでNest can't resolve dependencies of the TwilioService"
pubDate: 2023-12-09
categories: ["Node.js"]
tags: []
---

こんにちは、新しい物好きフリーランスエンジニアのmohです。これまで触っていたStrapiに限界を感じて、今度はNestJSに乗り換えています。出来ることが増えたので、乗り換えた甲斐はあるかと。

## TwilioModuleがインポートできない

以下のようにインポートしようとしたのですが、なぜかエラーが出てしまいました。

```typescript
// 注：実際のコードと変えてます

@Module({
    imports: [
        ConfigModule.forRoot(),
        TwilioModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                accountSid: configService.get<string>('TWILIO_ACCOUNT_SID'),
                authToken: configService.get<string>('TWILIO_AUTH_TOKEN'),
            }),
        }),
    ],
    providers: [TwilioService],
})
export class ConfirmModule { }


// エラー内容
// Nest can't resolve dependencies of the TwilioService (?). Please make sure that the argument "CONFIGURABLE_MODULE_OPTIONS[4e4b46e2900c3c4b42ed0]" at index [0] is available in the ConfirmModule context.
```

TwilioModuleの公式ページ通りなのに、おかしいなと。でTwilioModuleのGithubにいくつか同様のissueが立っていたのですが、どれも解決策までは行っていませんでした。唯一、isGlobalを使うといった話があったので、それを試してみることに。

## isGlobalで解決できた

AppModule内でisGlobalで読み込み、上記のConfirmModuleではインポートしないようにすると、エラーがなくなりました。

```typescript
// 注: 実際のコードと変えてます

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TwilioModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            isGlobal: true,
            useFactory: async (configService: ConfigService) => ({
                accountSid: configService.get<string>('TWILIO_ACCOUNT_SID'),
                authToken: configService.get<string>('TWILIO_AUTH_TOKEN'),
            }),
        }),
    ],
})
export class AppModule { }


```

いまだによく分かっていませんが、ひとまず解決できたのでよしとしよう。

## 2023/12/13追記

この後テストコードでやっぱりまたエラーになりましたので、結局自分でモジュールを作りました。Twilioのライブラリからクライアントを渡すだけなので、思ったより簡単にできてしまいました。

そして今回のエラーの原因が判明しました。どうやらCONFIGURABLE\_MODULE\_OPTIONSがexportされていないためのようです。たぶんこれです。さっそくissueに書き込もうと思ったのですが、書くとなるとちゃんと書かないといけないので二の足を踏んでいます。これを見たどなたか、代わりにissueを書いていただけるといいなと思い、この文章を書いてます。はい。

## 小話

たまに行くメガネ屋さんが、よくお客さんのことを覚える方で、今日も久しぶりだったにも関わらず覚えてくださっていました。大型のメガネクリーナースプレーを買ってきましたが、大型だけあってなかなかのお値段。大事に使いたいと思います。
