---
title: "【Prisma】jest-prismaでテスト終了後に自動ロールバック"
pubDate: 2023-12-13
categories: ["Prisma"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## jest-prisma

jest-prismaは、jestテスト実行後に自動でロールバックしてテストデータを削除してくれます。

https://github.com/Quramy/jest-prisma

ただ実際にこれをNestJSで実行する時にはまりましたので、その時のことを書かせていただきます。

## providersで置き換える

まず以下のようにPrisma用のサービスを作りました。ここが問題で、後ほど修正します。

```typescript
@Injectable()
export class PrismaService extends PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}

```

テストコードは以下のような具合です。

```typescript
describe('ConfirmService', () => {
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: PrismaService,
                    useValue: jestPrisma.client,
                },
            ],
        }).compile();

        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('save token', async () => {
        const data = { xxx:'a' }

        // 消えない
        await prismaService.confirmation.create({ data });

        // 消える
        await jestPrisma.client.confirmation.create({ data });
    });
});

```

これで、providersでうまい具合にPrismaServiceをjestPrisma.clientで上書きできていると思っていました。でもどうも、うまくいきません。具体的には、テストモジュールから取得したprismaServiceではテスト後にデータが消えなかったのです。対して、jestPrisma.clientを直接使用した場合はちゃんと消えました。

## サービスを見直す

そこで、以下のようにサービスを書き換えました。

```typescript
@Injectable()
export class PrismaService {
    readonly client: PrismaClient;

    constructor() {
        this.client = process.env.NODE_ENV === 'test' ? jestPrisma.client : new PrismaClient();
    }

    async onModuleInit() {
        await this.client.$connect();
    }

    async onModuleDestroy() {
        await this.client.$disconnect();
    }
}
```

改善の余地はありそうな気がしますが、ひとまずこれで問題なく、意図した動作を得ることができました。clientメンバ変数を足して、そこにアクセスする形になっています。

## 小話

リカーマウンテンに、味のついた海苔が刻まれたふりかけのようなのが売っているのですが、卵ご飯で食べるとうまいです。ちょっと味塩を振った方がご飯が進みますね。
