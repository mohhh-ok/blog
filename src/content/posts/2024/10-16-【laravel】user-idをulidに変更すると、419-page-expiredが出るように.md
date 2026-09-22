---
title: "【Laravel】User IDをULIDに変更すると、419 PAGE EXPIREDが出るようになった"
pubDate: 2024-10-16
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## ULID

ULIDは時間に応じたランダムな文字列で、バッティングがない（理論的に極めて確率が低い）とされています。そのため例えば、クライアントサイドでULIDを生成して、それをレコードのIDとして使用するといったことも可能となります。今後の拡張を考えて、もう全部ULIDにしてしまおうかなと。

なおクライアントサイドで作成するなら、ULIDよりもCUID2の方が適しているそうです。これはブラウザによる乱数生成の偏りのためのようです。ただしCUIDはLaravelが標準でサポートしていないこともあり、ULIDで行こうかと思います。

## 419

全てのテーブルでULIDに変更すると、419が出るようになりました。原因はすぐにわかりました。User操作はBreezeに頼っているため、ここでエラーになると面倒だなとここだけ変更を後回しにしていました。原因はUserのULID変更によるものでした。

## 解決

本来リレーションでintegerとulidとで違いが出ると、migrationでエラーが出てすぐにわかります。ところが以下の部分で、リレーションが貼られていないために、migrationでエラーが出ませんでした。sessionテーブルの部分です。

```php
 public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->json('roles')->nullable();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index(); // <= ここ！foreignUlidに変更すると解決
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }
```

コメントにあるように、foreignUlidに変更することで、419が出なくなりました。ちなみにほとんど、自動生成されたものです。emailをプライマリーキーにしているのは、パフォーマンスを目指しているのでしょうか。別でidを振って、emailにユニーク制約を当てる方法もあるかと思いますが、厳密には今の方がパフォーマンスが出るのかもしれません。本当に僅かで、誤差にも満たないほどだと思いますけども。
