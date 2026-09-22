---
title: "【Prisma】Cloud BuildでMigrateしてみた"
pubDate: 2024-02-26
categories: ["Prisma"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Cloud BuildでMigrate

いくつか方法を試してみたのですが、どうもうまくいかなかったため、次善策を採用しました。試したのは以下です。

*   Cloud Build内でMigrateを実行
*   Cloud FunctionsでMigrate
*   Cloud RunでMigrate

### Cloud Build内でMigrate => うまくいかなかった

本来はCloud Build内で完結できるのが理想かと思います。色々調べると、exe-wrapperを使えばいいとは分かりました。これは、Cloud SQLへの接続を簡単にしてくれるもののようです。ただしdockerを使う必要があるため、少し面倒です。それを踏まえて以下のようにしてみました。Dockerコンテナ内に、必要なprisma実行環境と、migrationファイルがある状態です。

```yaml
# _SQL_INSTANCE:  Cloud SQL instance name

steps:
    # Build the container image
    - name: 'gcr.io/cloud-builders/docker'
      args:
          [
              'build',
              '-t',
              'asia-northeast1-docker.pkg.dev/$PROJECT_ID/default-docker/prisma-migrate:$COMMIT_SHA',
              '-f',
              'Dockerfile.prisma',
              '.',
          ]
    # Push the container image to Container Registry
    - name: 'gcr.io/cloud-builders/docker'
      args:
          [
              'push',
              'asia-northeast1-docker.pkg.dev/$PROJECT_ID/default-docker/prisma-migrate:$COMMIT_SHA',
          ]
    # Migrate
    - name: "gcr.io/google-appengine/exec-wrapper"
      entrypoint: "bash"
      args:
      - -c
      - |
        /buildstep/execute.sh \
          -i asia-northeast1-docker.pkg.dev/$PROJECT_ID/default-docker/prisma-migrate:$COMMIT_SHA \
          -s $_SQL_INSTANCE \
          -e DATABASE_URL=$$DATABASE_URL \
          -- npx prisma migrate deploy
      secretEnv: ['DATABASE_URL']
availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/DATABASE_URL/versions/latest
    env: 'DATABASE_URL'
options:
    logging: CLOUD_LOGGING_ONLY
```

ところが上記コードでは、データベースに接続できないといったエラーが出てしまいます。どうやっても無理でした。。。

### Cloud FunctionsでMigrate => 見送り

Cloud Functionsだと、Cloud Buildと連携させるには少し面倒なようです。他のパッケージがCloud Buildで扱っているため、統一したい。そのため、これは却下しました。。。

### Cloud RunでMigrate

最後に、次善策でCloud Runで実行することにしました。ちょっと不適切な感じもしますが、ひとまずこれでよしとします。

Dockerfile

```docker
FROM node:20.11-alpine3.18 as base

ENV NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache python3 make g++ && \
    ln -sf python3 /usr/bin/python

RUN yarn global add prisma


COPY /packages/api/prisma /app/prisma

# エラーを出さないように、migrateした後に形だけリッスンする
CMD npx prisma migrate deploy && \
    echo "Prisma migration completed, starting dummy server..." && \
    npx http-server -p $PORT
```

上記Dockerfileを、Cloud Runで読み込むだけです。Cloud Runでは、VPCネットワークの設定、およびCloud SQL接続設定も済ませます。これで、無事Migrateできました。トリガーも自動生成されるので、便利ですね。なおトリガーはいつも手動設定にしていますが、これは個人の好みかと思います。

## 余談

クラフトボスが好きなんですよ。コンビニに売ってるのですが、よく買っています。ただ、クラフト。。。？
