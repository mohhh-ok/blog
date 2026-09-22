---
title: "【GAS】Claspを開発と本番とで切り替える"
pubDate: 2025-01-18
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Clasp

Claspは、簡単にGASを実行環境へデプロイできるツールです。

ただ複数対象には対応していません。たとえば開発と本番とで、切り替えたい時もあります。claspコマンドでオプションでつけてくれていればいいのですが、2025年1月18日現在、そういった機能は提供されていません。あくまで.clasp.jsonを参照するのみです。うーん、世知辛い

## 環境で切り替える

デプロイ対象を切り替えるためには、.clasp.jsonを書き換える必要があります。そこで以下のようなアプローチを取ります。

*   .env, .env.productionを用意する
*   スクリプトで、.clasp.jsonを書き換える

といった機能を、ライブラリで実装してみました。これを使うと、簡単に環境切り替えを実装できます。

[https://www.npmjs.com/package/@masa-dev/create-gas-app](https://www.npmjs.com/package/@masa-dev/create-gas-app)

以下、切り替えに必要なコード部分です。シンプルですね。

```typescript
const availabelEnvs = ['dev', 'stag', 'prod'];
const envSuffixes: Record<(typeof availabelEnvs)[number], string> = {
  dev: '',
  stag: '.staging',
  prod: '.production',
};

async function changeEnv(env: (typeof availabelEnvs)[number] = 'dev') {
  if (!availabelEnvs.includes(env)) {
    throw new Error(`Invalid environment: ${env}`);
  }
  const envPath = `.env${envSuffixes[env]}`;
  const claspJsonPath = '.clasp.json';

  if (!fs.existsSync(envPath)) {
    throw new Error(`${envPath} not found`);
  }

  dotenv.config({ path: envPath });
  const scriptId = process.env.SCRIPT_ID;
  if (!scriptId) {
    throw new Error(`SCRIPT_ID not found on ${envPath}`);
  }

  const data = {
    scriptId,
    rootDir: distDir,
  };

  fs.writeFileSync(claspJsonPath, JSON.stringify(data, null, 2));
  console.log(`env changed to ${env}`);
}
```
