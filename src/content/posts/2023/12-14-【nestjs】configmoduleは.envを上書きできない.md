---
title: "【NestJS】ConfigModuleは.envを上書きできない"
pubDate: 2023-12-14
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## ConfigModule

NestJSのConfigModuleは、環境変数の読み込みに使用されます。以下のように使用します。

```typescript
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [`.env.${process.env.NODE_ENV}`],
        }),
    ],
})
export class AppModule { }
```

ここでは.env.xxxを読み込んでいます。xxxはproduction,development,testなどの値を想定しています。

## .envはConfigModule関係なく読み込まれてる

本来やりたかったのは、.envよりも優先して各.env.xxxを読み込みたかったのですが、うまくいきませんでした。どうやら、.envは優先して読み込まれ、その値を上書きできないようです。

試しに以下のようにテストしてみました。

```typescript
async function bootstrap() {
    console.log(process.env.DATABASE_URL)
    const app = await NestFactory.create(AppModule);
}
```

AppModule初期化前に、.envに設定した環境変数が入っているかどうかをテストしています。見事に出力されました。このことから、nest実行時に自動で.envが読み込まれていることがわかります。

つまり、ConfigModuleで.envを上書きできないことになります。

## どうするか

仕組みさえわかってしまえば、あとはどうとでもできるかと思います。デフォルト値をConfigModuleで設定するか、共通設定を諦めて各.env.xxxで全ての値を洗い出すか、.env.commonを作成して最後に読み込むか。

さてどうしようか、ひとまず.env.commonを作成しておこうかと思います。他にいい方法があれば教えていただけると嬉しいです。

## 小話

久しぶりにマイケルジャクソンを聴きました。いいですね、マイコー。昔に聴き倒したので、もう何度も聞くことはないですが、久しぶりに聞くとやっぱり良いです。あの発声、どういう腹筋してるんでしょうね彼は。ものすごい量の筋トレをしていたそうですが、子供の頃からあのような発声なので、天性のものでしょうか。
